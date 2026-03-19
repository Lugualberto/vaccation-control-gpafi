const {
  createVacationRequest,
  removeVacationRequest,
  listVacations,
  listVacationAuditLogs,
} = require("../services/vacationService");

async function createVacation(req, res) {
  const created = await createVacationRequest(req.body, req.user);
  res.status(201).json(created);
}

async function removeVacation(req, res) {
  const { id } = req.params;
  await removeVacationRequest(id, req.user);
  res.json({ message: "Ferias removidas do calendario com sucesso." });
}

async function getVacations(req, res) {
  const vacations = await listVacations(req.query, req.user);
  res.json(vacations);
}

async function getVacationAuditLogs(req, res) {
  const logs = await listVacationAuditLogs(req.query, req.user);
  res.json(logs);
}

module.exports = {
  createVacation,
  removeVacation,
  getVacations,
  getVacationAuditLogs,
};
