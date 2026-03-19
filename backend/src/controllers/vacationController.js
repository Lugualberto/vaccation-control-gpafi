const {
  createVacationRequest,
  approveVacationRequest,
  rejectVacationRequest,
  listVacations,
} = require("../services/vacationService");

async function createVacation(req, res) {
  const created = await createVacationRequest(req.body);
  res.status(201).json(created);
}

async function approveVacation(req, res) {
  const { id } = req.params;
  const { approver_id: approverId } = req.body;

  await approveVacationRequest(id, approverId);
  res.json({ message: "Solicitacao aprovada com sucesso." });
}

async function rejectVacation(req, res) {
  const { id } = req.params;
  const { approver_id: approverId, rejection_reason: rejectionReason } = req.body;

  await rejectVacationRequest(id, approverId, rejectionReason);
  res.json({ message: "Solicitacao reprovada com sucesso." });
}

async function getVacations(req, res) {
  const vacations = await listVacations(req.query);
  res.json(vacations);
}

module.exports = {
  createVacation,
  approveVacation,
  rejectVacation,
  getVacations,
};
