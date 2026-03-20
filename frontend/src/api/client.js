import {
  mockCreateVacation,
  mockGetCurrentUser,
  mockGetEmployeeBalance,
  mockGetEmployeeHourBank,
  mockGetEmployeeById,
  mockGetEmployeeVacations,
  mockGetEmployees,
  mockListBackupAssignments,
  mockListVacationAuditLogs,
  mockListVacations,
  mockLoginWithCorporateEmail,
  mockRemoveVacation,
  mockUpdateBackupAssignment,
  mockUpdateEmployeeBalance,
  mockUpdateEmployeeHourBank,
} from "./mockApi";

export const IS_MOCK_MODE = true;
export const CORPORATE_EMAIL_DOMAIN = import.meta.env.VITE_CORPORATE_EMAIL_DOMAIN || "nubank.com.br";
export const IS_SHARED_MOCK_MODE = Boolean(
  String(import.meta.env.VITE_SHARED_DB_API_BASE || "").trim()
);

export async function loginWithCorporateEmail(email) {
  return mockLoginWithCorporateEmail(email);
}

export async function getCurrentUser() {
  return mockGetCurrentUser();
}

export async function getEmployees() {
  return mockGetEmployees();
}

export async function getEmployeeById(employeeId) {
  return mockGetEmployeeById(employeeId);
}

export async function getEmployeeBalance(employeeId, year) {
  return mockGetEmployeeBalance(employeeId, year);
}

export async function getEmployeeHourBank(employeeId) {
  return mockGetEmployeeHourBank(employeeId);
}

export async function updateEmployeeBalance(employeeId, year, payload) {
  return mockUpdateEmployeeBalance(employeeId, year, payload);
}

export async function updateEmployeeHourBank(employeeId, payload) {
  return mockUpdateEmployeeHourBank(employeeId, payload);
}

export async function getEmployeeVacations(employeeId, status) {
  return mockGetEmployeeVacations(employeeId, status);
}

export async function listVacations(filters = {}) {
  return mockListVacations(filters);
}

export async function listVacationAuditLogs(filters = {}) {
  return mockListVacationAuditLogs(filters);
}

export async function createVacation(payload) {
  return mockCreateVacation(payload);
}

export async function removeVacation(vacationId) {
  return mockRemoveVacation(vacationId);
}

export async function listBackupAssignments() {
  return mockListBackupAssignments();
}

export async function updateBackupAssignment(employeeId, backupEmployeeId) {
  return mockUpdateBackupAssignment(employeeId, backupEmployeeId);
}

export default null;
