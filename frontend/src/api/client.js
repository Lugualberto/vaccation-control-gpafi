import axios from "axios";
import { AUTH_STORAGE_KEY } from "../constants/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

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

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

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

export async function updateEmployeeBalance(employeeId, year, payload) {
  const { data } = await api.put(`/employees/${employeeId}/balance/${year}`, payload);
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

export async function listVacationAuditLogs(filters = {}) {
  const { data } = await api.get("/vacations/audit", { params: filters });
  return data;
}

export async function createVacation(payload) {
  const { data } = await api.post("/vacations", payload);
  return data;
}

export async function removeVacation(vacationId) {
  const { data } = await api.delete(`/vacations/${vacationId}`);
  return data;
}

export default api;
