import { AUTH_STORAGE_KEY } from "../constants/auth";
import { BACKUP_BY_FIRST_NAME, normalizeFirstName } from "../constants/backups";

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
      vacationId: 4,
      auditId: 5,
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
    ],
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
        justification: "Ferias escolares",
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
        justification: "Viagem em familia",
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
        justification: "Compromisso pessoal",
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
        details: "Tipo=Ferias; Periodo registrado no calendario",
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
        details: "Tipo=Ferias; Periodo registrado no calendario",
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
        details: "Tipo=Day Off; Periodo registrado no calendario",
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

function getNextUserId(db) {
  return db.users.reduce((max, item) => Math.max(max, Number(item.userId) || 0), 0) + 1;
}

function getNextEmployeeId(db) {
  return db.users.reduce((max, item) => Math.max(max, Number(item.employeeId) || 0), 0) + 1;
}

function ensureUserForGoogleProfile(db, profile) {
  const normalizedEmail = String(profile?.email || "").toLowerCase().trim();
  const normalizedName = String(profile?.name || "").trim();
  if (!normalizedEmail || !normalizedName) {
    throw mockError(400, "Falha ao obter dados de perfil do Google.");
  }

  let user = db.users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (user) {
    if (user.name !== normalizedName) {
      user.name = normalizedName;
    }
    return user;
  }

  const newEmployeeId = getNextEmployeeId(db);
  const newUserId = getNextUserId(db);
  const isAdmin = normalizedEmail === "luana.gualberto@nubank.com.br";

  user = {
    userId: newUserId,
    employeeId: newEmployeeId,
    email: normalizedEmail,
    password: "GOOGLE_AUTH_ONLY",
    role: isAdmin ? "ADMIN" : "EMPLOYEE",
    name: normalizedName,
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

  return user;
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

export async function mockLoginWithGoogleIdentity(profile) {
  const db = readDb();
  const account = ensureUserForGoogleProfile(db, profile);
  writeDb(db);

  return {
    token: `mock-google-${account.userId}-${Date.now()}`,
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
  const rawType = payload?.event_type || payload?.eventType || "VACATION";
  const eventType = String(rawType).toUpperCase();

  if (!startDate || !endDate) {
    throw mockError(400, "Campos obrigatorios: start_date e end_date.");
  }
  if (!["VACATION", "DAY_OFF"].includes(eventType)) {
    throw mockError(400, "Tipo de evento invalido.");
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || end < start) {
    throw mockError(400, "Datas invalidas para ferias.");
  }

  const db = readDb();
  const requestedDays = countCalendarDays(startDate, endDate);
  const employee = db.users.find((item) => Number(item.employeeId) === employeeId);

  if (eventType === "VACATION") {
    const actorFirstName = normalizeFirstName(actor.name);
    const backupFirstName = BACKUP_BY_FIRST_NAME[actorFirstName];

    if (backupFirstName) {
      const backupUser = db.users.find((item) => normalizeFirstName(item.name) === backupFirstName);
      if (backupUser) {
        const hasConflict = db.vacations.some((item) => {
          if (
            Number(item.employee_id) !== Number(backupUser.employeeId) ||
            item.status !== "APPROVED" ||
            (item.event_type || "VACATION") !== "VACATION"
          ) {
            return false;
          }

          const existingStart = parseDate(item.start_date);
          const existingEnd = parseDate(item.end_date);
          return existingStart <= end && existingEnd >= start;
        });

        if (hasConflict) {
          throw mockError(
            409,
            `Este período conflita com as férias de ${backupUser.name}. Combine com a pessoa ou escolha outro período.`
          );
        }
      }
    }
  }

  const createdAt = nowIso();
  const vacation = {
    id: db.counters.vacationId++,
    employee_id: employeeId,
    employee_name: employee?.name || "Colaborador",
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

  db.auditLogs.push({
    id: db.counters.auditId++,
    vacation_request_id: vacation.id,
    employee_id: employeeId,
    employee_name: employee?.name || "Colaborador",
    actor_user_id: actor.userId,
    actor_name: actor.name,
    action: "CREATED",
    details: `Tipo=${eventType === "DAY_OFF" ? "Day Off" : "Ferias"}; Periodo ${startDate} a ${endDate}; dias_corridos=${requestedDays}`,
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
    details: `Tipo=${(vacation.event_type || "VACATION") === "DAY_OFF" ? "Day Off" : "Ferias"}; Periodo ${vacation.start_date} a ${vacation.end_date}; dias_corridos=${vacation.requested_days}`,
    action_at: nowIso(),
  });

  writeDb(db);
  return { message: "Ferias removidas do calendario com sucesso." };
}
