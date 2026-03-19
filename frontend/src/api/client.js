import axios from "axios";
import { AUTH_STORAGE_KEY } from "../constants/auth";
import {
  mockCreateVacation,
  mockGetCurrentUser,
  mockGetEmployeeBalance,
  mockGetEmployeeById,
  mockGetEmployeeVacations,
  mockGetEmployees,
  mockListVacationAuditLogs,
  mockListVacations,
  mockLogin,
  mockRemoveVacation,
  mockUpdateEmployeeBalance,
} from "./mockApi";

const useMockData = String(import.meta.env.VITE_USE_MOCK_DATA ?? "true").toLowerCase() !== "false";
export const IS_MOCK_MODE = useMockData;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

if (!useMockData) {
  api.interceptors.request.use((config) => {
    const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawAuth) {
      return config;
    }

    try {
      const parsed = JSON.parse(rawAuth);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    return config;
  });
}

export async function login(email, password) {
  if (useMockData) {
    return mockLogin(email, password);
  }
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function getCurrentUser() {
  if (useMockData) {
    return mockGetCurrentUser();
  }
  const { data } = await api.get("/auth/me");
  return data;
}

export async function getEmployees() {
  if (useMockData) {
    return mockGetEmployees();
  }
  const { data } = await api.get("/employees");
  return data;
}

export async function getEmployeeById(employeeId) {
  if (useMockData) {
    return mockGetEmployeeById(employeeId);
  }
  const { data } = await api.get(`/employees/${employeeId}`);
  return data;
}

export async function getEmployeeBalance(employeeId, year) {
  if (useMockData) {
    return mockGetEmployeeBalance(employeeId, year);
  }
  const { data } = await api.get(`/employees/${employeeId}/balance/${year}`);
  return data;
}

export async function updateEmployeeBalance(employeeId, year, payload) {
  if (useMockData) {
    return mockUpdateEmployeeBalance(employeeId, year, payload);
  }
  const { data } = await api.put(`/employees/${employeeId}/balance/${year}`, payload);
  return data;
}

export async function getEmployeeVacations(employeeId, status) {
  if (useMockData) {
    return mockGetEmployeeVacations(employeeId, status);
  }
  const { data } = await api.get(`/employees/${employeeId}/vacations`, {
    params: status ? { status } : {},
  });
  return data;
}

export async function listVacations(filters = {}) {
  if (useMockData) {
    return mockListVacations(filters);
  }
  const { data } = await api.get("/vacations", { params: filters });
  return data;
}

export async function listVacationAuditLogs(filters = {}) {
  if (useMockData) {
    return mockListVacationAuditLogs(filters);
  }
  const { data } = await api.get("/vacations/audit", { params: filters });
  return data;
}

export async function createVacation(payload) {
  if (useMockData) {
    return mockCreateVacation(payload);
  }
  const { data } = await api.post("/vacations", payload);
  return data;
}

export async function removeVacation(vacationId) {
  if (useMockData) {
    return mockRemoveVacation(vacationId);
  }
  const { data } = await api.delete(`/vacations/${vacationId}`);
  return data;
}

export default api;
