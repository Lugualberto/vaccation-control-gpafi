const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { AppError } = require("../utils/errors");
const { calculateBusinessDays, parseIsoDate } = require("../utils/dateUtils");

async function ensureEmployeeExists(connection, employeeId) {
  const result = await connection.execute(
    `SELECT id
       FROM employee
      WHERE id = :employeeId`,
    { employeeId }
  );

  if (result.rows.length === 0) {
    throw new AppError("Colaborador nao encontrado.", 404);
  }
}

async function ensureNoApprovedOverlap(connection, employeeId, startDate, endDate, requestIdToIgnore) {
  const result = await connection.execute(
    `SELECT COUNT(1) AS total
       FROM vacation_request
      WHERE employee_id = :employeeId
        AND status = 'APPROVED'
        AND start_date <= :endDate
        AND end_date >= :startDate
        AND (:requestIdToIgnore IS NULL OR id <> :requestIdToIgnore)`,
    {
      employeeId,
      startDate,
      endDate,
      requestIdToIgnore: requestIdToIgnore ?? null,
    }
  );

  if (result.rows[0].TOTAL > 0) {
    throw new AppError(
      "Existe conflito com outro periodo de ferias ja programado para esse colaborador.",
      409
    );
  }
}

async function getBalanceForYear(connection, employeeId, year, lock = false) {
  const forUpdate = lock ? "FOR UPDATE" : "";
  const result = await connection.execute(
    `SELECT employee_id, year, total_days, used_days, remaining_days
       FROM vacation_balance
      WHERE employee_id = :employeeId
        AND year = :year
      ${forUpdate}`,
    {
      employeeId,
      year,
    }
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Saldo de ferias nao configurado para esse colaborador no ano informado.",
      400
    );
  }

  return result.rows[0];
}

async function insertAuditLog(connection, vacationRequestId, employeeId, actorUserId, action, details) {
  await connection.execute(
    `INSERT INTO vacation_audit_log (
       vacation_request_id,
       employee_id,
       actor_user_id,
       action,
       details
     ) VALUES (
       :vacationRequestId,
       :employeeId,
       :actorUserId,
       :action,
       :details
     )`,
    {
      vacationRequestId,
      employeeId,
      actorUserId,
      action,
      details,
    }
  );
}

async function createVacationRequest(payload, actor) {
  const { start_date: startDate, end_date: endDate, justification } = payload;
  const employeeId = Number(actor.employeeId);

  if (!startDate || !endDate) {
    throw new AppError("Campos obrigatorios: start_date e end_date.", 400);
  }

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end) {
    throw new AppError("Datas invalidas. Use o formato YYYY-MM-DD.", 400);
  }

  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  if (startYear !== endYear) {
    throw new AppError(
      "Para a versao inicial, o periodo de ferias deve iniciar e terminar no mesmo ano.",
      400
    );
  }

  const requestedDays = calculateBusinessDays(startDate, endDate);
  if (requestedDays <= 0) {
    throw new AppError(
      "Periodo invalido: selecione ao menos um dia util entre segunda e sexta-feira.",
      400
    );
  }

  const connection = await getConnection();

  try {
    await ensureEmployeeExists(connection, employeeId);
    await ensureNoApprovedOverlap(connection, employeeId, start, end);
    const balance = await getBalanceForYear(connection, employeeId, startYear, true);

    if (Number(balance.REMAINING_DAYS) < requestedDays) {
      throw new AppError(
        `Saldo insuficiente. Solicitado: ${requestedDays}, disponivel: ${balance.REMAINING_DAYS}.`,
        400
      );
    }

    const insertResult = await connection.execute(
      `INSERT INTO vacation_request (
         employee_id,
         start_date,
         end_date,
         requested_days,
         status,
         justification
       ) VALUES (
         :employeeId,
         TO_DATE(:startDate, 'YYYY-MM-DD'),
         TO_DATE(:endDate, 'YYYY-MM-DD'),
         :requestedDays,
         'APPROVED',
         :justification
       )
       RETURNING id INTO :id`,
      {
        employeeId,
        startDate,
        endDate,
        requestedDays,
        justification: justification || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    const requestId = insertResult.outBinds.id[0];

    await connection.execute(
      `UPDATE vacation_balance
          SET used_days = used_days + :requestedDays
        WHERE employee_id = :employeeId
          AND year = :year`,
      {
        requestedDays,
        employeeId,
        year: startYear,
      }
    );

    await insertAuditLog(
      connection,
      requestId,
      employeeId,
      Number(actor.userId),
      "CREATED",
      `Periodo ${startDate} a ${endDate}; dias_uteis=${requestedDays}`
    );

    const created = await connection.execute(
      `SELECT id,
              employee_id,
              start_date,
              end_date,
              requested_days,
              status,
              justification,
              created_at,
              updated_at
         FROM vacation_request
        WHERE id = :id`,
      { id: requestId }
    );

    await connection.commit();
    return created.rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

async function removeVacationRequest(vacationId, actor) {
  const connection = await getConnection();

  try {
    const requestResult = await connection.execute(
      `SELECT id,
              employee_id,
              start_date,
              end_date,
              requested_days,
              status
         FROM vacation_request
        WHERE id = :id
        FOR UPDATE`,
      { id: Number(vacationId) }
    );

    if (requestResult.rows.length === 0) {
      throw new AppError("Ferias nao encontradas.", 404);
    }

    const request = requestResult.rows[0];
    if (request.STATUS !== "APPROVED") {
      throw new AppError("Somente ferias ativas podem ser removidas do calendario.", 400);
    }

    if (actor.role !== "ADMIN" && Number(request.EMPLOYEE_ID) !== Number(actor.employeeId)) {
      throw new AppError("Sem permissao para remover ferias de outro colaborador.", 403);
    }

    const year = request.START_DATE.getUTCFullYear();
    await getBalanceForYear(connection, Number(request.EMPLOYEE_ID), year, true);

    await connection.execute(
      `UPDATE vacation_request
          SET status = 'CANCELLED'
        WHERE id = :id`,
      { id: Number(vacationId) }
    );

    await connection.execute(
      `UPDATE vacation_balance
          SET used_days = GREATEST(0, used_days - :requestedDays)
        WHERE employee_id = :employeeId
          AND year = :year`,
      {
        requestedDays: Number(request.REQUESTED_DAYS),
        employeeId: Number(request.EMPLOYEE_ID),
        year,
      }
    );

    const startDate = request.START_DATE.toISOString().slice(0, 10);
    const endDate = request.END_DATE.toISOString().slice(0, 10);
    await insertAuditLog(
      connection,
      Number(vacationId),
      Number(request.EMPLOYEE_ID),
      Number(actor.userId),
      "DELETED",
      `Periodo ${startDate} a ${endDate}; dias_uteis=${request.REQUESTED_DAYS}`
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

async function listVacations(filters, actor) {
  const connection = await getConnection();

  try {
    const { status, employeeId, from, to } = filters;
    const whereClauses = [];
    const binds = {};

    if (actor.role !== "ADMIN") {
      whereClauses.push("vr.employee_id = :actorEmployeeId");
      binds.actorEmployeeId = Number(actor.employeeId);

      if (employeeId && Number(employeeId) !== Number(actor.employeeId)) {
        throw new AppError("Sem permissao para consultar ferias de outro colaborador.", 403);
      }
    } else if (employeeId) {
      whereClauses.push("vr.employee_id = :employeeId");
      binds.employeeId = Number(employeeId);
    }

    if (status) {
      whereClauses.push("vr.status = :status");
      binds.status = String(status).toUpperCase();
    }

    if (from) {
      whereClauses.push("vr.start_date >= TO_DATE(:fromDate, 'YYYY-MM-DD')");
      binds.fromDate = from;
    }

    if (to) {
      whereClauses.push("vr.end_date <= TO_DATE(:toDate, 'YYYY-MM-DD')");
      binds.toDate = to;
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result = await connection.execute(
      `SELECT vr.id,
              vr.employee_id,
              e.name AS employee_name,
              vr.start_date,
              vr.end_date,
              vr.requested_days,
              vr.status,
              vr.justification,
              vr.created_at,
              vr.updated_at
         FROM vacation_request vr
         JOIN employee e ON e.id = vr.employee_id
         ${whereSql}
        ORDER BY vr.created_at DESC`,
      binds
    );

    return result.rows;
  } finally {
    await connection.close();
  }
}

async function listVacationAuditLogs(filters, actor) {
  const connection = await getConnection();

  try {
    const { employeeId, action, from, to } = filters;
    const whereClauses = [];
    const binds = {};

    if (actor.role !== "ADMIN") {
      whereClauses.push("al.employee_id = :actorEmployeeId");
      binds.actorEmployeeId = Number(actor.employeeId);

      if (employeeId && Number(employeeId) !== Number(actor.employeeId)) {
        throw new AppError("Sem permissao para consultar auditoria de outro colaborador.", 403);
      }
    } else if (employeeId) {
      whereClauses.push("al.employee_id = :employeeId");
      binds.employeeId = Number(employeeId);
    }

    if (action) {
      whereClauses.push("al.action = :action");
      binds.action = String(action).toUpperCase();
    }

    if (from) {
      whereClauses.push("al.action_at >= TO_DATE(:fromDate, 'YYYY-MM-DD')");
      binds.fromDate = from;
    }

    if (to) {
      whereClauses.push("al.action_at < TO_DATE(:toDate, 'YYYY-MM-DD') + 1");
      binds.toDate = to;
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result = await connection.execute(
      `SELECT al.id,
              al.vacation_request_id,
              al.employee_id,
              e.name AS employee_name,
              al.actor_user_id,
              actor.name AS actor_name,
              al.action,
              al.details,
              al.action_at
         FROM vacation_audit_log al
         JOIN employee e ON e.id = al.employee_id
         JOIN app_user au ON au.id = al.actor_user_id
         JOIN employee actor ON actor.id = au.employee_id
         ${whereSql}
        ORDER BY al.action_at DESC`,
      binds
    );

    return result.rows;
  } finally {
    await connection.close();
  }
}

module.exports = {
  createVacationRequest,
  removeVacationRequest,
  listVacations,
  listVacationAuditLogs,
};
