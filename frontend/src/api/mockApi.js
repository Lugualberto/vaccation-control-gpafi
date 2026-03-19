import { AUTH_STORAGE_KEY } from "../constants/auth";
import { INITIAL_BACKUP_BY_FIRST_NAME, normalizeFirstName } from "../constants/backups";

const MOCK_DB_KEY = "vacation_app_mock_db";
const SHARED_DB_RESOURCE = "shared-db";
const SHARED_DB_API_BASE = String(
  import.meta.env.VITE_SHARED_DB_API_BASE || ""
).replace(/\/+$/, "");
const USE_SHARED_DB = SHARED_DB_API_BASE.startsWith("http");
const CORPORATE_EMAIL_DOMAIN = String(
  import.meta.env.VITE_CORPORATE_EMAIL_DOMAIN || "nubank.com.br"
).toLowerCase();
const DB_SCHEMA_VERSION = 2;

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
    throw mockError(400, "Invalid dates. Use YYYY-MM-DD and a valid range.");
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / millisecondsPerDay) + 1;
}

function buildDefaultDb() {
  const currentYear = new Date().getFullYear();
  const users = [
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
      email: "filipi.souza@nubank.com.br",
      password: "Nubank@123",
      role: "EMPLOYEE",
      name: "Filipi Souza",
      chapter: "Controllership",
      hireDate: "2022-02-01",
    },
    {
      userId: 3,
      employeeId: 3,
      email: "bianca.alves@nubank.com.br",
      password: "Nubank@123",
      role: "EMPLOYEE",
      name: "Bianca Alves",
      chapter: "Controllership",
      hireDate: "2021-10-10",
    },
    {
      userId: 4,
      employeeId: 4,
      email: "sabrina.costa@nubank.com.br",
      password: "Nubank@123",
      role: "EMPLOYEE",
      name: "Sabrina Costa",
      chapter: "Controllership",
      hireDate: "2021-08-15",
    },
    {
      userId: 5,
      employeeId: 5,
      email: "leticia.prado@nubank.com.br",
      password: "Nubank@123",
      role: "EMPLOYEE",
      name: "Leticia Prado",
      chapter: "Controllership",
      hireDate: "2024-04-01",
    },
    {
      userId: 6,
      employeeId: 6,
      email: "arturo.lima@nubank.com.br",
      password: "Nubank@123",
      role: "EMPLOYEE",
      name: "Arturo Lima",
      chapter: "Controllership",
      hireDate: "2022-11-12",
    },
    {
      userId: 7,
      employeeId: 7,
      email: "karen.rocha@nubank.com.br",
      password: "Nubank@123",
      role: "EMPLOYEE",
      name: "Karen Rocha",
      chapter: "Controllership",
      hireDate: "2023-01-21",
    },
    {
      userId: 8,
      employeeId: 8,
      email: "rafael.oliveira@nubank.com.br",
      password: "Nubank@123",
      role: "EMPLOYEE",
      name: "Rafael Oliveira",
      chapter: "Controllership",
      hireDate: "2023-01-10",
    },
  ];

  const firstNameToEmployeeId = Object.fromEntries(
    users.map((user) => [normalizeFirstName(user.name), Number(user.employeeId)])
  );
  const backupByEmployeeId = Object.fromEntries(
    Object.entries(INITIAL_BACKUP_BY_FIRST_NAME).map(([firstName, backupFirstName]) => [
      String(firstNameToEmployeeId[firstName]),
      backupFirstName ? firstNameToEmployeeId[backupFirstName] || null : null,
    ])
  );

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    counters: {
      vacationId: 4,
      auditId: 5,
    },
    users,
    backup_by_employee_id: backupByEmployeeId,
    balances: [
      { employee_id: 1, year: currentYear, total_days: 30, used_days: 5 },
      { employee_id: 2, year: currentYear, total_days: 30, used_days: 8 },
      { employee_id: 3, year: currentYear, total_days: 30, used_days: 6 },
      { employee_id: 4, year: currentYear, total_days: 30, used_days: 4 },
      { employee_id: 5, year: currentYear, total_days: 30, used_days: 0 },
      { employee_id: 6, year: currentYear, total_days: 30, used_days: 3 },
      { employee_id: 7, year: currentYear, total_days: 30, used_days: 5 },
      { employee_id: 8, year: currentYear, total_days: 30, used_days: 2 },
    ],
    vacations: [
      {
        id: 1,
        employee_id: 3,
        employee_name: "Bianca Alves",
        start_date: `${currentYear}-08-12`,
        end_date: `${currentYear}-08-16`,
        requested_days: 5,
        status: "APPROVED",
        event_type: "VACATION",
        justification: "School vacation",
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        id: 2,
        employee_id: 6,
        employee_name: "Arturo Lima",
        start_date: `${currentYear}-09-05`,
        end_date: `${currentYear}-09-10`,
        requested_days: 6,
        status: "APPROVED",
        event_type: "VACATION",
        justification: "Family trip",
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        id: 3,
        employee_id: 1,
        employee_name: "Luana Gualberto",
        start_date: `${currentYear}-07-22`,
        end_date: `${currentYear}-07-22`,
        requested_days: 1,
        status: "APPROVED",
        event_type: "DAY_OFF",
        justification: "Personal appointment",
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    ],
    auditLogs: [
      {
        id: 1,
        vacation_request_id: 1,
        employee_id: 3,
        employee_name: "Bianca Alves",
        actor_user_id: 3,
        actor_name: "Bianca Alves",
        action: "CREATED",
        details: "Type=Vacation; Period saved in calendar",
        action_at: nowIso(),
      },
      {
        id: 2,
        vacation_request_id: 2,
        employee_id: 6,
        employee_name: "Arturo Lima",
        actor_user_id: 6,
        actor_name: "Arturo Lima",
        action: "CREATED",
        details: "Type=Vacation; Period saved in calendar",
        action_at: nowIso(),
      },
      {
        id: 3,
        vacation_request_id: 3,
        employee_id: 1,
        employee_name: "Luana Gualberto",
        actor_user_id: 1,
        actor_name: "Luana Gualberto",
        action: "CREATED",
        details: "Type=Day Off; Period saved in calendar",
        action_at: nowIso(),
      },
    ],
  };
}

function isValidDbShape(value) {
  return Boolean(
    value &&
      value.counters &&
      typeof value.counters.vacationId === "number" &&
      typeof value.counters.auditId === "number" &&
      Array.isArray(value.users) &&
      Array.isArray(value.balances) &&
      Array.isArray(value.vacations) &&
      Array.isArray(value.auditLogs) &&
      value.backup_by_employee_id &&
      typeof value.backup_by_employee_id === "object"
  );
}

function buildDefaultBackupMap(users) {
  const firstNameToEmployeeId = Object.fromEntries(
    users.map((user) => [normalizeFirstName(user.name), Number(user.employeeId)])
  );
  return Object.fromEntries(
    Object.entries(INITIAL_BACKUP_BY_FIRST_NAME).map(([firstName, backupFirstName]) => [
      String(firstNameToEmployeeId[firstName]),
      backupFirstName ? firstNameToEmployeeId[backupFirstName] || null : null,
    ])
  );
}

function normalizeBackupMap(rawBackupMap, users) {
  const defaults = buildDefaultBackupMap(users);
  const normalized = { ...defaults };

  if (!rawBackupMap || typeof rawBackupMap !== "object") {
    return normalized;
  }

  for (const user of users) {
    const employeeId = String(user.employeeId);
    if (!Object.hasOwn(rawBackupMap, employeeId)) {
      continue;
    }

    const backupEmployeeId = rawBackupMap[employeeId];
    if (backupEmployeeId === null || backupEmployeeId === undefined || backupEmployeeId === "") {
      normalized[employeeId] = null;
      continue;
    }

    const parsedBackupId = Number(backupEmployeeId);
    const backupExists = users.some((candidate) => Number(candidate.employeeId) === parsedBackupId);
    normalized[employeeId] = backupExists ? parsedBackupId : null;
  }

  return normalized;
}

function migrateDbShape(rawDb) {
  const defaults = buildDefaultDb();
  const source = rawDb || {};
  const users = Array.isArray(source.users) && source.users.length ? source.users : defaults.users;

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    counters: {
      vacationId:
        Number(source?.counters?.vacationId) > 0
          ? Number(source.counters.vacationId)
          : defaults.counters.vacationId,
      auditId:
        Number(source?.counters?.auditId) > 0
          ? Number(source.counters.auditId)
          : defaults.counters.auditId,
    },
    users,
    backup_by_employee_id: normalizeBackupMap(source.backup_by_employee_id, users),
    balances: Array.isArray(source.balances) ? source.balances : defaults.balances,
    vacations: Array.isArray(source.vacations) ? source.vacations : defaults.vacations,
    auditLogs: Array.isArray(source.auditLogs) ? source.auditLogs : defaults.auditLogs,
  };
}

async function fetchSharedDb() {
  const response = await fetch(`${SHARED_DB_API_BASE}/${SHARED_DB_RESOURCE}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("shared_read_failed");
  }
  return response.json();
}

async function writeSharedDb(db) {
  const response = await fetch(`${SHARED_DB_API_BASE}/${SHARED_DB_RESOURCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(db),
  });
  if (!response.ok) {
    throw new Error("shared_write_failed");
  }
}

async function readDb() {
  const readLocalFallback = () => {
    const localRaw = localStorage.getItem(MOCK_DB_KEY);
    if (!localRaw) return null;
    try {
      return migrateDbShape(JSON.parse(localRaw));
    } catch {
      return null;
    }
  };

  if (USE_SHARED_DB) {
    try {
      const current = await fetchSharedDb();
      if (!current) {
        const initial = readLocalFallback() || buildDefaultDb();
        await writeSharedDb(initial);
        localStorage.setItem(MOCK_DB_KEY, JSON.stringify(initial));
        return initial;
      }

      const migrated = migrateDbShape(current);
      if (!isValidDbShape(migrated)) {
        const reset = buildDefaultDb();
        await writeSharedDb(reset);
        localStorage.setItem(MOCK_DB_KEY, JSON.stringify(reset));
        return reset;
      }

      localStorage.setItem(MOCK_DB_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      const localFallback = readLocalFallback();
      if (localFallback) {
        return localFallback;
      }
      throw mockError(
        503,
        "Shared calendar storage is temporarily unavailable. Please try again in a moment."
      );
    }
  }

  const raw = localStorage.getItem(MOCK_DB_KEY);
  if (!raw) {
    const initial = buildDefaultDb();
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = migrateDbShape(JSON.parse(raw));
    if (!isValidDbShape(parsed)) {
      throw new Error("invalid");
    }
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    const reset = buildDefaultDb();
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(reset));
    return reset;
  }
}

async function writeDb(db) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));

  if (USE_SHARED_DB) {
    try {
      await writeSharedDb(db);
      return;
    } catch {
      throw mockError(
        503,
        "Could not save to shared calendar storage. Please try again."
      );
    }
  }
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
    throw mockError(401, "User is not authenticated.");
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
    throw mockError(400, "Invalid date filter. Use YYYY-MM-DD.");
  }
  return date;
}

function getNextUserId(db) {
  return db.users.reduce((max, item) => Math.max(max, Number(item.userId) || 0), 0) + 1;
}

function getNextEmployeeId(db) {
  return db.users.reduce((max, item) => Math.max(max, Number(item.employeeId) || 0), 0) + 1;
}

function toTitleCaseName(email) {
  const username = String(email || "").split("@")[0] || "";
  const tokens = username.split(/[.\-_]/).filter(Boolean);
  if (!tokens.length) {
    return "Teammate";
  }
  return tokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(" ");
}

function ensureUserForCorporateEmail(db, email) {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) {
    throw mockError(400, "Please provide your corporate email.");
  }

  if (!normalizedEmail.endsWith(`@${CORPORATE_EMAIL_DOMAIN}`)) {
    throw mockError(
      403,
      `Use a corporate email @${CORPORATE_EMAIL_DOMAIN} to sign in.`
    );
  }

  let user = db.users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (user) {
    return user;
  }

  const newEmployeeId = getNextEmployeeId(db);
  const newUserId = getNextUserId(db);
  const isAdmin = normalizedEmail === "luana.gualberto@nubank.com.br";

  user = {
    userId: newUserId,
    employeeId: newEmployeeId,
    email: normalizedEmail,
    password: "CORPORATE_EMAIL_ONLY",
    role: isAdmin ? "ADMIN" : "EMPLOYEE",
    name: toTitleCaseName(normalizedEmail),
    chapter: "Controllership",
    hireDate: nowIso().slice(0, 10),
  };
  db.users.push(user);
  db.balances.push({
    employee_id: newEmployeeId,
    year: new Date().getFullYear(),
    total_days: 30,
    used_days: 0,
  });
  db.backup_by_employee_id = normalizeBackupMap(db.backup_by_employee_id, db.users);
  db.backup_by_employee_id[String(newEmployeeId)] = null;

  return user;
}

export async function mockLoginWithCorporateEmail(email) {
  const db = await readDb();
  const account = ensureUserForCorporateEmail(db, email);
  await writeDb(db);

  return {
    token: `mock-corporate-${account.userId}-${Date.now()}`,
    user: normalizeUser(account),
  };
}

export async function mockGetCurrentUser() {
  return getCurrentUserOrThrow();
}

export async function mockGetEmployees() {
  const actor = getCurrentUserOrThrow();
  const db = await readDb();

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

function formatBackupRow(employee, backupEmployee) {
  return {
    employee_id: employee.employeeId,
    employee_name: employee.name,
    backup_employee_id: backupEmployee?.employeeId || null,
    backup_employee_name: backupEmployee?.name || null,
  };
}

export async function mockListBackupAssignments() {
  const actor = getCurrentUserOrThrow();
  const db = await readDb();
  const backupMap = normalizeBackupMap(db.backup_by_employee_id, db.users);

  if (actor.role !== "ADMIN") {
    const own = db.users.find((item) => Number(item.employeeId) === Number(actor.employeeId));
    if (!own) return [];
    const backupId = backupMap[String(own.employeeId)];
    const backupEmployee = db.users.find(
      (item) => Number(item.employeeId) === Number(backupId)
    );
    return [formatBackupRow(own, backupEmployee)];
  }

  return db.users.map((employee) => {
    const backupId = backupMap[String(employee.employeeId)];
    const backupEmployee = db.users.find((item) => Number(item.employeeId) === Number(backupId));
    return formatBackupRow(employee, backupEmployee);
  });
}

export async function mockUpdateBackupAssignment(employeeId, backupEmployeeId) {
  const actor = getCurrentUserOrThrow();
  if (actor.role !== "ADMIN") {
    throw mockError(403, "Only admins can change backup assignments.");
  }

  const db = await readDb();
  const employee = db.users.find((item) => Number(item.employeeId) === Number(employeeId));
  if (!employee) {
    throw mockError(404, "Employee not found.");
  }

  db.backup_by_employee_id = normalizeBackupMap(db.backup_by_employee_id, db.users);
  const employeeKey = String(employee.employeeId);

  if (backupEmployeeId === null || backupEmployeeId === undefined || backupEmployeeId === "") {
    db.backup_by_employee_id[employeeKey] = null;
    await writeDb(db);
    return {
      employee_id: employee.employeeId,
      backup_employee_id: null,
    };
  }

  const parsedBackupId = Number(backupEmployeeId);
  if (Number.isNaN(parsedBackupId)) {
    throw mockError(400, "Backup employee id must be numeric.");
  }

  if (parsedBackupId === Number(employee.employeeId)) {
    throw mockError(400, "An employee cannot be their own backup.");
  }

  const backupEmployee = db.users.find((item) => Number(item.employeeId) === parsedBackupId);
  if (!backupEmployee) {
    throw mockError(404, "Backup employee not found.");
  }

  db.backup_by_employee_id[employeeKey] = parsedBackupId;
  await writeDb(db);

  return {
    employee_id: employee.employeeId,
    backup_employee_id: parsedBackupId,
  };
}

export async function mockGetEmployeeById(employeeId) {
  const actor = getCurrentUserOrThrow();
  if (!canAccessEmployee(actor, employeeId)) {
    throw mockError(403, "No permission to access this employee.");
  }

  const db = await readDb();
  const found = db.users.find((item) => Number(item.employeeId) === Number(employeeId));
  if (!found) {
    throw mockError(404, "Employee not found.");
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
    throw mockError(403, "No permission to view this balance.");
  }

  const db = await readDb();
  const balance = getOrCreateBalance(db, employeeId, year);
  await writeDb(db);
  return withRemaining(balance);
}

export async function mockUpdateEmployeeBalance(employeeId, year, payload) {
  const actor = getCurrentUserOrThrow();
  if (!canAccessEmployee(actor, employeeId)) {
    throw mockError(403, "No permission to adjust this balance.");
  }

  const totalDays = Number(payload?.total_days);
  const usedDays = Number(payload?.used_days);

  if (Number.isNaN(totalDays) || Number.isNaN(usedDays)) {
    throw mockError(400, "Provide numeric total_days and used_days.");
  }

  if (totalDays < 0 || usedDays < 0) {
    throw mockError(400, "Days cannot be negative.");
  }

  const db = await readDb();
  const balance = getOrCreateBalance(db, employeeId, year);
  balance.total_days = totalDays;
  balance.used_days = usedDays;
  await writeDb(db);

  return withRemaining(balance);
}

export async function mockGetEmployeeVacations(employeeId, status) {
  const actor = getCurrentUserOrThrow();
  if (!canAccessEmployee(actor, employeeId)) {
    throw mockError(403, "No permission to view this history.");
  }

  const db = await readDb();
  let result = db.vacations.filter((item) => Number(item.employee_id) === Number(employeeId));
  if (status) {
    const normalizedStatus = String(status).toUpperCase();
    result = result.filter((item) => item.status === normalizedStatus);
  }

  return result.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function mockListVacations(filters = {}) {
  getCurrentUserOrThrow();
  const db = await readDb();

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
  const db = await readDb();

  const fromDate = parseFilterDate(filters.from);
  const toDate = parseFilterDate(filters.to);
  const employeeIdFilter = filters.employeeId ? Number(filters.employeeId) : null;

  let result = db.auditLogs.slice();
  if (actor.role !== "ADMIN") {
    result = result.filter((item) => Number(item.employee_id) === Number(actor.employeeId));
  }

  if (employeeIdFilter) {
    if (actor.role !== "ADMIN" && Number(actor.employeeId) !== employeeIdFilter) {
      throw mockError(403, "No permission to view another employee's audit logs.");
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
  const rawType = payload?.event_type || payload?.eventType || "VACATION";
  const eventType = String(rawType).toUpperCase();

  if (!startDate || !endDate) {
    throw mockError(400, "Required fields: start_date and end_date.");
  }
  if (!["VACATION", "DAY_OFF"].includes(eventType)) {
    throw mockError(400, "Invalid event type.");
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || end < start) {
    throw mockError(400, "Invalid vacation dates.");
  }

  const db = await readDb();
  const requestedDays = countCalendarDays(startDate, endDate);
  const employee = db.users.find((item) => Number(item.employeeId) === employeeId);
  db.backup_by_employee_id = normalizeBackupMap(db.backup_by_employee_id, db.users);

  if (eventType === "VACATION") {
    const backupEmployeeId = db.backup_by_employee_id[String(employeeId)];
    if (backupEmployeeId) {
      const backupUser = db.users.find((item) => Number(item.employeeId) === Number(backupEmployeeId));
      const hasConflict = db.vacations.some((item) => {
        if (
          Number(item.employee_id) !== Number(backupEmployeeId) ||
          item.status !== "APPROVED" ||
          (item.event_type || "VACATION") !== "VACATION"
        ) {
          return false;
        }

        const existingStart = parseDate(item.start_date);
        const existingEnd = parseDate(item.end_date);
        return existingStart && existingEnd && existingStart <= end && existingEnd >= start;
      });

      if (hasConflict) {
        throw mockError(
          409,
          `This period conflicts with ${backupUser?.name || "your backup"}'s vacation. Align with them or choose another period.`
        );
      }
    }
  }

  const createdAt = nowIso();
  const vacation = {
    id: db.counters.vacationId++,
    employee_id: employeeId,
    employee_name: employee?.name || "Teammate",
    start_date: startDate,
    end_date: endDate,
    requested_days: requestedDays,
    status: "APPROVED",
    event_type: eventType,
    justification,
    created_at: createdAt,
    updated_at: createdAt,
  };
  db.vacations.push(vacation);

  if (eventType === "VACATION") {
    const year = Number(startDate.slice(0, 4));
    const balance = getOrCreateBalance(db, employeeId, year);
    balance.used_days = Number(balance.used_days) + requestedDays;
  }

  db.auditLogs.push({
    id: db.counters.auditId++,
    vacation_request_id: vacation.id,
    employee_id: employeeId,
    employee_name: employee?.name || "Teammate",
    actor_user_id: actor.userId,
    actor_name: actor.name,
    action: "CREATED",
    details: `Type=${eventType === "DAY_OFF" ? "Day Off" : "Vacation"}; Period ${startDate} to ${endDate}; calendar_days=${requestedDays}`,
    action_at: nowIso(),
  });

  await writeDb(db);
  return vacation;
}

export async function mockRemoveVacation(vacationId) {
  const actor = getCurrentUserOrThrow();
  const db = await readDb();

  const vacation = db.vacations.find((item) => Number(item.id) === Number(vacationId));
  if (!vacation) {
    throw mockError(404, "Vacation not found.");
  }

  const canDelete =
    actor.role === "ADMIN" || Number(actor.employeeId) === Number(vacation.employee_id);
  if (!canDelete) {
    throw mockError(403, "No permission to remove this period.");
  }

  if (vacation.status !== "APPROVED") {
    throw mockError(400, "Only active vacations can be removed.");
  }

  if ((vacation.event_type || "VACATION") === "VACATION") {
    const year = Number(String(vacation.start_date || "").slice(0, 4));
    if (!Number.isNaN(year)) {
      const balance = getOrCreateBalance(db, vacation.employee_id, year);
      balance.used_days = Math.max(
        0,
        Number(balance.used_days) - Number(vacation.requested_days || 0)
      );
    }
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
    details: `Type=${(vacation.event_type || "VACATION") === "DAY_OFF" ? "Day Off" : "Vacation"}; Period ${vacation.start_date} to ${vacation.end_date}; calendar_days=${vacation.requested_days}`,
    action_at: nowIso(),
  });

  await writeDb(db);
  return { message: "Vacation removed from calendar successfully." };
}
