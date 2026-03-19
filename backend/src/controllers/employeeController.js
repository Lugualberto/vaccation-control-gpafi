const { getConnection } = require("../config/db");
const { AppError } = require("../utils/errors");
const { adjustEmployeeBalance } = require("../services/employeeService");

async function listEmployees(req, res) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `SELECT id, name, email, chapter, hire_date, manager_id, role
       FROM employee
       ORDER BY name`
    );

    res.json(result.rows);
  } finally {
    await connection.close();
  }
}

async function getEmployeeById(req, res) {
  const { id } = req.params;
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `SELECT id, name, email, chapter, hire_date, manager_id, role
       FROM employee
       WHERE id = :id`,
      { id: Number(id) }
    );

    if (result.rows.length === 0) {
      throw new AppError("Colaborador nao encontrado.", 404);
    }

    res.json(result.rows[0]);
  } finally {
    await connection.close();
  }
}

async function getEmployeeBalance(req, res) {
  const { id, year } = req.params;
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `SELECT employee_id, year, total_days, used_days, remaining_days
       FROM vacation_balance
       WHERE employee_id = :employeeId
         AND year = :year`,
      {
        employeeId: Number(id),
        year: Number(year),
      }
    );

    if (result.rows.length === 0) {
      throw new AppError("Saldo de ferias nao encontrado para o ano informado.", 404);
    }

    res.json(result.rows[0]);
  } finally {
    await connection.close();
  }
}

async function getEmployeeVacations(req, res) {
  const { id } = req.params;
  const { status } = req.query;
  const connection = await getConnection();

  try {
    const whereStatus = status ? "AND vr.status = :status" : "";
    const binds = {
      employeeId: Number(id),
    };

    if (status) {
      binds.status = status.toUpperCase();
    }

    const result = await connection.execute(
      `SELECT vr.id,
              vr.employee_id,
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
        WHERE vr.employee_id = :employeeId
          ${whereStatus}
        ORDER BY vr.created_at DESC`,
      binds
    );

    res.json(result.rows);
  } finally {
    await connection.close();
  }
}

async function updateEmployeeBalance(req, res) {
  const { id, year } = req.params;
  const updated = await adjustEmployeeBalance(id, year, req.body);
  res.json(updated);
}

module.exports = {
  listEmployees,
  getEmployeeById,
  getEmployeeBalance,
  getEmployeeVacations,
  updateEmployeeBalance,
};
