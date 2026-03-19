const { getConnection } = require("../config/db");
const { AppError } = require("../utils/errors");

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

async function adjustEmployeeBalance(employeeId, year, payload) {
  const { admin_id: adminId, total_days: totalDays, used_days: usedDays } = payload;

  if (!adminId) {
    throw new AppError("Campo obrigatorio: admin_id.", 400);
  }

  if (totalDays === undefined && usedDays === undefined) {
    throw new AppError("Informe total_days, used_days ou ambos para ajuste.", 400);
  }

  const normalizedYear = Number(year);
  if (Number.isNaN(normalizedYear) || normalizedYear < 2000 || normalizedYear > 2100) {
    throw new AppError("Ano invalido para saldo de ferias.", 400);
  }

  const connection = await getConnection();

  try {
    const admin = await ensureEmployeeExists(connection, Number(adminId));
    if (admin.ROLE !== "ADMIN") {
      throw new AppError("Apenas administradores podem ajustar saldos.", 403);
    }

    await ensureEmployeeExists(connection, Number(employeeId));

    const balanceResult = await connection.execute(
      `SELECT employee_id, year, total_days, used_days, remaining_days
         FROM vacation_balance
        WHERE employee_id = :employeeId
          AND year = :year
        FOR UPDATE`,
      {
        employeeId: Number(employeeId),
        year: normalizedYear,
      }
    );

    const current = balanceResult.rows[0];
    const newTotalDays = Number(totalDays ?? current?.TOTAL_DAYS ?? 30);
    const newUsedDays = Number(usedDays ?? current?.USED_DAYS ?? 0);

    if (Number.isNaN(newTotalDays) || Number.isNaN(newUsedDays)) {
      throw new AppError("total_days e used_days devem ser numericos.", 400);
    }

    if (newTotalDays < 0 || newUsedDays < 0) {
      throw new AppError("total_days e used_days nao podem ser negativos.", 400);
    }

    if (newUsedDays > newTotalDays) {
      throw new AppError("used_days nao pode ser maior que total_days.", 400);
    }

    if (!current) {
      await connection.execute(
        `INSERT INTO vacation_balance (employee_id, year, total_days, used_days)
         VALUES (:employeeId, :year, :totalDays, :usedDays)`,
        {
          employeeId: Number(employeeId),
          year: normalizedYear,
          totalDays: newTotalDays,
          usedDays: newUsedDays,
        }
      );
    } else {
      await connection.execute(
        `UPDATE vacation_balance
            SET total_days = :totalDays,
                used_days = :usedDays
          WHERE employee_id = :employeeId
            AND year = :year`,
        {
          totalDays: newTotalDays,
          usedDays: newUsedDays,
          employeeId: Number(employeeId),
          year: normalizedYear,
        }
      );
    }

    await connection.commit();

    const updated = await connection.execute(
      `SELECT employee_id, year, total_days, used_days, remaining_days
         FROM vacation_balance
        WHERE employee_id = :employeeId
          AND year = :year`,
      {
        employeeId: Number(employeeId),
        year: normalizedYear,
      }
    );

    return updated.rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

module.exports = {
  adjustEmployeeBalance,
};
