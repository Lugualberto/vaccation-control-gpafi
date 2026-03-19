const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { AppError } = require("../utils/errors");
const { calculateBusinessDays, parseIsoDate } = require("../utils/dateUtils");

async function ensureEmployeeExists(connection, employeeId) {
  const result = await connection.execute(
    `SELECT id, name, role
       FROM employee
      WHERE id = :employeeId`,
    { employeeId }
  );

  if (result.rows.length === 0) {
    throw new AppError("Colaborador nao encontrado.", 404);
  }

  return result.rows[0];
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
      "Existe conflito com outro periodo de ferias aprovado para esse colaborador.",
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

async function createVacationRequest(payload) {
  const { employee_id: employeeId, start_date: startDate, end_date: endDate, justification } = payload;

  if (!employeeId || !startDate || !endDate) {
    throw new AppError("Campos obrigatorios: employee_id, start_date e end_date.", 400);
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
    await ensureEmployeeExists(connection, Number(employeeId));
    await ensureNoApprovedOverlap(connection, Number(employeeId), start, end);
    const balance = await getBalanceForYear(connection, Number(employeeId), startYear);

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
         'PENDING',
         :justification
       )
       RETURNING id INTO :id`,
      {
        employeeId: Number(employeeId),
        startDate,
        endDate,
        requestedDays,
        justification: justification || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    await connection.commit();
    const requestId = insertResult.outBinds.id[0];

    const created = await connection.execute(
      `SELECT id,
              employee_id,
              start_date,
              end_date,
              requested_days,
              status,
              justification,
              rejection_reason,
              approver_id,
              created_at,
              updated_at
         FROM vacation_request
        WHERE id = :id`,
      { id: requestId }
    );

    return created.rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

async function approveVacationRequest(vacationId, approverId) {
  if (!approverId) {
    throw new AppError("Campo obrigatorio: approver_id.", 400);
  }

  const connection = await getConnection();

  try {
    const approver = await ensureEmployeeExists(connection, Number(approverId));
    if (approver.ROLE !== "ADMIN") {
      throw new AppError("Apenas administradores podem aprovar solicitacoes.", 403);
    }

    const requestResult = await connection.execute(
      `SELECT id, employee_id, start_date, end_date, requested_days, status
         FROM vacation_request
        WHERE id = :id
        FOR UPDATE`,
      { id: Number(vacationId) }
    );

    if (requestResult.rows.length === 0) {
      throw new AppError("Solicitacao de ferias nao encontrada.", 404);
    }

    const request = requestResult.rows[0];
    if (request.STATUS !== "PENDING") {
      throw new AppError("Somente solicitacoes pendentes podem ser aprovadas.", 400);
    }

    const year = request.START_DATE.getUTCFullYear();

    await ensureNoApprovedOverlap(
      connection,
      request.EMPLOYEE_ID,
      request.START_DATE,
      request.END_DATE,
      Number(vacationId)
    );
    const balance = await getBalanceForYear(connection, request.EMPLOYEE_ID, year, true);

    if (Number(balance.REMAINING_DAYS) < Number(request.REQUESTED_DAYS)) {
      throw new AppError(
        "Saldo insuficiente no momento da aprovacao. Ajuste o saldo ou reprograme o periodo.",
        400
      );
    }

    await connection.execute(
      `UPDATE vacation_request
          SET status = 'APPROVED',
              approver_id = :approverId,
              rejection_reason = NULL
        WHERE id = :id`,
      {
        approverId: Number(approverId),
        id: Number(vacationId),
      }
    );

    await connection.execute(
      `UPDATE vacation_balance
          SET used_days = used_days + :requestedDays
        WHERE employee_id = :employeeId
          AND year = :year`,
      {
        requestedDays: Number(request.REQUESTED_DAYS),
        employeeId: request.EMPLOYEE_ID,
        year,
      }
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

async function rejectVacationRequest(vacationId, approverId, rejectionReason) {
  if (!approverId) {
    throw new AppError("Campo obrigatorio: approver_id.", 400);
  }

  const connection = await getConnection();

  try {
    const approver = await ensureEmployeeExists(connection, Number(approverId));
    if (approver.ROLE !== "ADMIN") {
      throw new AppError("Apenas administradores podem reprovar solicitacoes.", 403);
    }

    const requestResult = await connection.execute(
      `SELECT id, status
         FROM vacation_request
        WHERE id = :id
        FOR UPDATE`,
      { id: Number(vacationId) }
    );

    if (requestResult.rows.length === 0) {
      throw new AppError("Solicitacao de ferias nao encontrada.", 404);
    }

    if (requestResult.rows[0].STATUS !== "PENDING") {
      throw new AppError("Somente solicitacoes pendentes podem ser reprovadas.", 400);
    }

    await connection.execute(
      `UPDATE vacation_request
          SET status = 'REJECTED',
              approver_id = :approverId,
              rejection_reason = :rejectionReason
        WHERE id = :id`,
      {
        approverId: Number(approverId),
        rejectionReason: rejectionReason || null,
        id: Number(vacationId),
      }
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

async function listVacations(filters) {
  const connection = await getConnection();

  try {
    const { status, employeeId, from, to } = filters;
    const whereClauses = [];
    const binds = {};

    if (status) {
      whereClauses.push("vr.status = :status");
      binds.status = String(status).toUpperCase();
    }

    if (employeeId) {
      whereClauses.push("vr.employee_id = :employeeId");
      binds.employeeId = Number(employeeId);
    }

    if (from) {
      whereClauses.push("vr.start_date >= TO_DATE(:fromDate, 'YYYY-MM-DD')");
      binds.fromDate = from;
    }

    if (to) {
      whereClauses.push("vr.end_date <= TO_DATE(:toDate, 'YYYY-MM-DD')");
      binds.toDate = to;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result = await connection.execute(
      `SELECT vr.id,
              vr.employee_id,
              e.name AS employee_name,
              vr.start_date,
              vr.end_date,
              vr.requested_days,
              vr.status,
              vr.justification,
              vr.rejection_reason,
              vr.approver_id,
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

module.exports = {
  createVacationRequest,
  approveVacationRequest,
  rejectVacationRequest,
  listVacations,
};
