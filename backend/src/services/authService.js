const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getConnection } = require("../config/db");
const { AppError } = require("../utils/errors");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET nao configurado no ambiente.", 500);
  }
  return secret;
}

function buildUserFromRow(row) {
  return {
    userId: row.USER_ID,
    employeeId: row.EMPLOYEE_ID,
    email: row.EMAIL,
    role: row.ROLE,
    name: row.NAME,
    chapter: row.CHAPTER,
    hireDate: row.HIRE_DATE,
  };
}

async function loginWithEmailPassword(email, password) {
  if (!email || !password) {
    throw new AppError("Informe e-mail e senha.", 400);
  }

  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `SELECT au.id AS user_id,
              au.employee_id,
              au.email,
              au.password_hash,
              au.role,
              au.is_active,
              e.name,
              e.chapter,
              e.hire_date
         FROM app_user au
         JOIN employee e ON e.id = au.employee_id
        WHERE LOWER(au.email) = LOWER(:email)`,
      { email }
    );

    const account = result.rows[0];
    if (!account) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    if (Number(account.IS_ACTIVE) !== 1) {
      throw new AppError("Usuario inativo. Procure o administrador.", 403);
    }

    const isValidPassword = await bcrypt.compare(password, account.PASSWORD_HASH);
    if (!isValidPassword) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    const user = buildUserFromRow(account);
    const token = jwt.sign(
      {
        userId: user.userId,
        employeeId: user.employeeId,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
    );

    return { token, user };
  } finally {
    await connection.close();
  }
}

async function getCurrentUser(userId) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `SELECT au.id AS user_id,
              au.employee_id,
              au.email,
              au.role,
              au.is_active,
              e.name,
              e.chapter,
              e.hire_date
         FROM app_user au
         JOIN employee e ON e.id = au.employee_id
        WHERE au.id = :userId`,
      { userId: Number(userId) }
    );

    const account = result.rows[0];
    if (!account || Number(account.IS_ACTIVE) !== 1) {
      throw new AppError("Usuario nao encontrado ou inativo.", 404);
    }

    return buildUserFromRow(account);
  } finally {
    await connection.close();
  }
}

module.exports = {
  loginWithEmailPassword,
  getCurrentUser,
};
