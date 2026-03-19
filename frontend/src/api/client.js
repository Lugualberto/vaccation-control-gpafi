import {
  mockCreateVacation,
  mockGetCurrentUser,
  mockGetEmployeeBalance,
  mockGetEmployeeById,
  mockGetEmployeeVacations,
  mockGetEmployees,
  mockListVacationAuditLogs,
  mockListVacations,
  mockLoginWithCorporateEmail,
  mockRemoveVacation,
  mockUpdateEmployeeBalance,
} from "./mockApi";

export const IS_MOCK_MODE = true;
export const CORPORATE_EMAIL_DOMAIN = import.meta.env.VITE_CORPORATE_EMAIL_DOMAIN || "nubank.com.br";

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

export async function updateEmployeeBalance(employeeId, year, payload) {
  return mockUpdateEmployeeBalance(employeeId, year, payload);
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

export default null;
