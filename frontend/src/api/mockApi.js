import { AUTH_STORAGE_KEY } from "../constants/auth";

const MOCK_DB_KEY = "vacation_app_mock_db";

function mockError(status, message) {
  const error = new Error(message);
  error.response = {
    status,
    data: { message },
  };
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function parseDate(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }
  const date = new Date(`${dateString}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countCalendarDays(startDateString, endDateString) {
  const start = parseDate(startDateString);
  const end = parseDate(endDateString);
  if (!start || !end || end < start) {
    throw mockError(400, "Datas invalidas. Use YYYY-MM-DD e periodo valido.");
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / millisecondsPerDay) + 1;
}

function buildDefaultDb() {
  const currentYear = new Date().getFullYear();

  return {
    counters: {
      vacationId: 2,
      auditId: 3,
    },
    users: [
      {
        userId: 1,
        employeeId: 1,
        email: "luana.gualberto@nubank.com.br",
        password: "Nubank@123",
        role: "ADMIN",
        name: "Luana Gualberto",
        chapter: "Controllership",
        hireDate: "2022-03-01",
      },
      {
        userId: 2,
        employeeId: 2,
        email: "rafael.oliveira@nubank.com.br",
        password: "Nubank@123",
        role: "EMPLOYEE",
        name: "Rafael Oliveira",
        chapter: "Controllership",
        hireDate: "2023-01-10",
      },
    ],
    balances: [
      { employee_id: 1, year: currentYear, total_days: 30, used_days: 5 },
      { employee_id: 2, year: currentYear, total_days: 30, used_days: 10 },
    ],
    vacations: [
      {
        id: 1,
        employee_id: 2,
        employee_name: "Rafael Oliveira",
        start_date: `${currentYear}-08-12`,
        end_date: `${currentYear}-08-16`,
        requested_days: 3,
        status: "APPROVED",
        justification: "Ferias escolares",
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    ],
    auditLogs: [
      {
        id: 1,
        vacation_request_id: 1,
        employee_id: 2,
        employee_name: "Rafael Oliveira",
        actor_user_id: 2,
        actor_name: "Rafael Oliveira",
        action: "CREATED",
        details: "Periodo registrado no calendario",
        action_at: nowIso(),
      },
    ],
  };
}

function readDb() {
  const raw = localStorage.getItem(MOCK_DB_KEY);
  if (!raw) {
    const initial = buildDefaultDb();
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.users || !parsed?.balances || !parsed?.vacations || !parsed?.auditLogs) {
      throw new Error("invalid");
    }
    return parsed;
  } catch {
    const reset = buildDefaultDb();
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(reset));
    return reset;
  }
}

function writeDb(db) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

function getAuthState() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return { token: null, user: null };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || null,
      user: parsed?.user || null,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: null, user: null };
  }
}

function getCurrentUserOrThrow() {
  const { user } = getAuthState();
  if (!user) {
    throw mockError(401, "Usuario nao autenticado.");
  }
  return user;
}

function normalizeUser(user) {
  return {
    userId: user.userId,
    employeeId: user.employeeId,
    email: user.email,
    role: user.role,
    name: user.name,
    chapter: user.chapter,
    hireDate: user.hireDate,
  };
}

function canAccessEmployee(actor, employeeId) {
  return actor.role === "ADMIN" || Number(actor.employeeId) === Number(employeeId);
}

function findBalance(db, employeeId, year) {
  return db.balances.find(
    (item) => Number(item.employee_id) === Number(employeeId) && Number(item.year) === Number(year)
  );
}

function getOrCreateBalance(db, employeeId, year) {
  let balance = findBalance(db, employeeId, year);
  if (!balance) {
    balance = {
      employee_id: Number(employeeId),
      year: Number(year),
      total_days: 30,
      used_days: 0,
    };
    db.balances.push(balance);
  }
  return balance;
}

function withRemaining(balance) {
  return {
    ...balance,
    remaining_days: Number(balance.total_days) - Number(balance.used_days),
  };
}

function parseFilterDate(value) {
  if (!value) return null;
  const date = parseDate(value);
  if (!date) {
    throw mockError(400, "Filtro de data invalido. Use YYYY-MM-DD.");
  }
  return date;
}

export async function mockLogin(email, password) {
  const db = readDb();
  const account = db.users.find(
    (user) => user.email.toLowerCase() === String(email || "").toLowerCase()
  );

  if (!account || account.password !== password) {
    throw mockError(401, "Credenciais invalidas.");
  }

  return {
    token: `mock-token-${account.userId}-${Date.now()}`,
    user: normalizeUser(account),
  };
}

export async function mockGetCurrentUser() {
  return getCurrentUserOrThrow();
}

export async function mockGetEmployees() {
  const actor = getCurrentUserOrThrow();
  const db = readDb();

  if (actor.role !== "ADMIN") {
    const own = db.users.find((item) => Number(item.employeeId) === Number(actor.employeeId));
    return own
      ? [
          {
            id: own.employeeId,
            name: own.name,
            email: own.email,
            chapter: own.chapter,
            role: own.role,
          },
        ]
      : [];
  }

  return db.users.map((user) => ({
    id: user.employeeId,
    name: user.name,
    email: user.email,
    chapter: user.chapter,
    role: user.role,
  }));
}

export async function mockGetEmployeeById(employeeId) {
  const actor = getCurrentUserOrThrow();
  if (!canAccessEmployee(actor, employeeId)) {
    throw mockError(403, "Sem permissao para acessar este colaborador.");
  }

  const db = readDb();
  const found = db.users.find((item) => Number(item.employeeId) === Number(employeeId));
  if (!found) {
    throw mockError(404, "Colaborador nao encontrado.");
  }

  return {
    id: found.employeeId,
    name: found.name,
    email: found.email,
    chapter: found.chapter,
    role: found.role,
  };
}

export async function mockGetEmployeeBalance(employeeId, year) {
  const actor = getCurrentUserOrThrow();
  if (!canAccessEmployee(actor, employeeId)) {
    throw mockError(403, "Sem permissao para consultar esse saldo.");
  }

  const db = readDb();
  const balance = getOrCreateBalance(db, employeeId, year);
  writeDb(db);
  return withRemaining(balance);
}

export async function mockUpdateEmployeeBalance(employeeId, year, payload) {
  const actor = getCurrentUserOrThrow();
  if (!canAccessEmployee(actor, employeeId)) {
    throw mockError(403, "Sem permissao para ajustar esse saldo.");
  }

  const totalDays = Number(payload?.total_days);
  const usedDays = Number(payload?.used_days);

  if (Number.isNaN(totalDays) || Number.isNaN(usedDays)) {
    throw mockError(400, "Informe total_days e used_days numericos.");
  }

  if (totalDays < 0 || usedDays < 0) {
    throw mockError(400, "Dias nao podem ser negativos.");
  }

  const db = readDb();
  const balance = getOrCreateBalance(db, employeeId, year);
  balance.total_days = totalDays;
  balance.used_days = usedDays;
  writeDb(db);

  return withRemaining(balance);
}

export async function mockGetEmployeeVacations(employeeId, status) {
  const actor = getCurrentUserOrThrow();
  if (!canAccessEmployee(actor, employeeId)) {
    throw mockError(403, "Sem permissao para consultar esse historico.");
  }

  const db = readDb();
  let result = db.vacations.filter((item) => Number(item.employee_id) === Number(employeeId));
  if (status) {
    const normalizedStatus = String(status).toUpperCase();
    result = result.filter((item) => item.status === normalizedStatus);
  }

  return result.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function mockListVacations(filters = {}) {
  getCurrentUserOrThrow();
  const db = readDb();

  const normalizedStatus = filters.status ? String(filters.status).toUpperCase() : null;
  const fromDate = parseFilterDate(filters.from);
  const toDate = parseFilterDate(filters.to);
  const employeeIdFilter = filters.employeeId ? Number(filters.employeeId) : null;

  let result = db.vacations.slice();

  if (employeeIdFilter) {
    result = result.filter((item) => Number(item.employee_id) === employeeIdFilter);
  }

  if (normalizedStatus) {
    result = result.filter((item) => item.status === normalizedStatus);
  }

  if (fromDate) {
    result = result.filter((item) => parseDate(item.start_date) >= fromDate);
  }

  if (toDate) {
    result = result.filter((item) => parseDate(item.end_date) <= toDate);
  }

  return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function mockListVacationAuditLogs(filters = {}) {
  const actor = getCurrentUserOrThrow();
  const db = readDb();

  const fromDate = parseFilterDate(filters.from);
  const toDate = parseFilterDate(filters.to);
  const employeeIdFilter = filters.employeeId ? Number(filters.employeeId) : null;

  let result = db.auditLogs.slice();
  if (actor.role !== "ADMIN") {
    result = result.filter((item) => Number(item.employee_id) === Number(actor.employeeId));
  }

  if (employeeIdFilter) {
    if (actor.role !== "ADMIN" && Number(actor.employeeId) !== employeeIdFilter) {
      throw mockError(403, "Sem permissao para consultar auditoria de outro colaborador.");
    }
    result = result.filter((item) => Number(item.employee_id) === employeeIdFilter);
  }

  if (filters.action) {
    const action = String(filters.action).toUpperCase();
    result = result.filter((item) => item.action === action);
  }

  if (fromDate) {
    result = result.filter((item) => new Date(item.action_at) >= fromDate);
  }

  if (toDate) {
    const endOfDay = new Date(toDate);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
    result = result.filter((item) => new Date(item.action_at) < endOfDay);
  }

  return result.sort((a, b) => new Date(b.action_at) - new Date(a.action_at));
}

export async function mockCreateVacation(payload) {
  const actor = getCurrentUserOrThrow();
  const employeeId = Number(actor.employeeId);
  const startDate = payload?.start_date;
  const endDate = payload?.end_date;
  const justification = payload?.justification || null;

  if (!startDate || !endDate) {
    throw mockError(400, "Campos obrigatorios: start_date e end_date.");
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || end < start) {
    throw mockError(400, "Datas invalidas para ferias.");
  }

  const db = readDb();
  const requestedDays = countCalendarDays(startDate, endDate);
  const employee = db.users.find((item) => Number(item.employeeId) === employeeId);

  const createdAt = nowIso();
  const vacation = {
    id: db.counters.vacationId++,
    employee_id: employeeId,
    employee_name: employee?.name || "Colaborador",
    start_date: startDate,
    end_date: endDate,
    requested_days: requestedDays,
    status: "APPROVED",
    justification,
    created_at: createdAt,
    updated_at: createdAt,
  };
  db.vacations.push(vacation);

  db.auditLogs.push({
    id: db.counters.auditId++,
    vacation_request_id: vacation.id,
    employee_id: employeeId,
    employee_name: employee?.name || "Colaborador",
    actor_user_id: actor.userId,
    actor_name: actor.name,
    action: "CREATED",
    details: `Periodo ${startDate} a ${endDate}; dias_corridos=${requestedDays}`,
    action_at: nowIso(),
  });

  writeDb(db);
  return vacation;
}

export async function mockRemoveVacation(vacationId) {
  const actor = getCurrentUserOrThrow();
  const db = readDb();

  const vacation = db.vacations.find((item) => Number(item.id) === Number(vacationId));
  if (!vacation) {
    throw mockError(404, "Ferias nao encontradas.");
  }

  const canDelete =
    actor.role === "ADMIN" || Number(actor.employeeId) === Number(vacation.employee_id);
  if (!canDelete) {
    throw mockError(403, "Sem permissao para remover este periodo.");
  }

  if (vacation.status !== "APPROVED") {
    throw mockError(400, "Apenas ferias ativas podem ser removidas.");
  }

  vacation.status = "CANCELLED";
  vacation.updated_at = nowIso();

  db.auditLogs.push({
    id: db.counters.auditId++,
    vacation_request_id: vacation.id,
    employee_id: vacation.employee_id,
    employee_name: vacation.employee_name,
    actor_user_id: actor.userId,
    actor_name: actor.name,
    action: "DELETED",
    details: `Periodo ${vacation.start_date} a ${vacation.end_date}; dias_corridos=${vacation.requested_days}`,
    action_at: nowIso(),
  });

  writeDb(db);
  return { message: "Ferias removidas do calendario com sucesso." };
}
