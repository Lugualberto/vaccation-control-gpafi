import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getEmployees() {
  const { data } = await api.get("/employees");
  return data;
}

export async function getEmployeeById(employeeId) {
  const { data } = await api.get(`/employees/${employeeId}`);
  return data;
}

export async function getEmployeeBalance(employeeId, year) {
  const { data } = await api.get(`/employees/${employeeId}/balance/${year}`);
  return data;
}

export async function getEmployeeVacations(employeeId, status) {
  const { data } = await api.get(`/employees/${employeeId}/vacations`, {
    params: status ? { status } : {},
  });
  return data;
}

export async function listVacations(filters = {}) {
  const { data } = await api.get("/vacations", { params: filters });
  return data;
}

export async function createVacation(payload) {
  const { data } = await api.post("/vacations", payload);
  return data;
}

export async function approveVacation(vacationId, approverId) {
  const { data } = await api.put(`/vacations/${vacationId}/approve`, {
    approver_id: approverId,
  });
  return data;
}

export async function rejectVacation(vacationId, approverId, rejectionReason) {
  const { data } = await api.put(`/vacations/${vacationId}/reject`, {
    approver_id: approverId,
    rejection_reason: rejectionReason,
  });
  return data;
}

export default api;
