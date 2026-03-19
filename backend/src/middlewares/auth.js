const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/errors");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET nao configurado no ambiente.", 500);
  }
  return secret;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Token de autenticacao ausente.", 401));
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return next(new AppError("Token de autenticacao invalido.", 401));
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = {
      userId: payload.userId,
      employeeId: payload.employeeId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch {
    return next(new AppError("Token expirado ou invalido.", 401));
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Usuario nao autenticado.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Permissao insuficiente para esta operacao.", 403));
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
