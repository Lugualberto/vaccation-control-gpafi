function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Rota nao encontrada: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    message: err.message || "Erro interno do servidor.",
  };

  if (err.details) {
    payload.details = err.details;
  }

  console.error("[ERROR]", {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json(payload);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
