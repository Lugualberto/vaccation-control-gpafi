import { addDays, addMonths, addWeeks, addYears, format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getEmployeeBalance,
  getEmployeeHourBank,
  getEmployees,
  IS_SHARED_MOCK_MODE,
  IS_MOCK_MODE,
  listBackupAssignments,
  listVacationAuditLogs,
  listVacations,
  removeVacation,
  updateEmployeeBalance,
  updateBackupAssignment,
  updateEmployeeHourBank,
} from "../api/client";
import CalendarControls from "../components/CalendarControls";
import YearCalendarView from "../components/YearCalendarView";
import { useAuth } from "../contexts/useAuth";
import { Calendar, formats, localizer, toCalendarEvent } from "../utils/calendar";

function shiftDate(date, view, direction) {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addWeeks(date, direction);
  if (view === "year") return addYears(date, direction);
  return addMonths(date, direction);
}

function eventStyleGetter(event) {
  const isDayOff = event.eventType === "DAY_OFF";
  return {
    style: {
      backgroundColor: isDayOff ? "#facc15" : "#60a5fa",
      color: isDayOff ? "#111827" : "#fff",
      borderRadius: "6px",
      border: "none",
    },
  };
}

function formatYmd(value) {
  if (!value) return "-";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return format(new Date(value), "yyyy-MM-dd");
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [employees, setEmployees] = useState([]);
  const [approvedVacations, setApprovedVacations] = useState([]);
  const [allPeriods, setAllPeriods] = useState([]);
  const [teamBalances, setTeamBalances] = useState([]);
  const [backupAssignments, setBackupAssignments] = useState([]);
  const [backupDrafts, setBackupDrafts] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [loadingTeamBalances, setLoadingTeamBalances] = useState(false);
  const [error, setError] = useState("");
  const [calendarView, setCalendarView] = useState("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [balanceMessage, setBalanceMessage] = useState("");
  const [hourBankMessage, setHourBankMessage] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [savingHourBank, setSavingHourBank] = useState(false);
  const [savingBackupEmployeeId, setSavingBackupEmployeeId] = useState(null);
  const [removingPeriodId, setRemovingPeriodId] = useState(null);
  const [calendarFilters, setCalendarFilters] = useState({
    employeeId: "",
    from: "",
    to: "",
  });
  const [balanceForm, setBalanceForm] = useState({
    employeeId: "",
    year: String(currentYear),
    totalDays: "30",
    usedDays: "0",
  });
  const [hourBankForm, setHourBankForm] = useState({
    employeeId: "",
    totalHours: "0",
    usedHours: "0",
    availableHours: "0",
  });

  const approvedEvents = useMemo(
    () => approvedVacations.map(toCalendarEvent),
    [approvedVacations]
  );
  const previewRemainingDays = useMemo(() => {
    const total = Number(balanceForm.totalDays);
    const used = Number(balanceForm.usedDays);
    if (Number.isNaN(total) || Number.isNaN(used)) {
      return "-";
    }
    return Math.max(0, total - used);
  }, [balanceForm.totalDays, balanceForm.usedDays]);

  const loadEmployees = useCallback(async () => {
    const result = await getEmployees();
    setEmployees(result);
    return result;
  }, []);

  const loadApprovedCalendar = useCallback(async (activeFilters = {}) => {
    setLoadingCalendar(true);
    setError("");
    try {
      const data = await listVacations({
        status: "APPROVED",
        employeeId: activeFilters.employeeId || undefined,
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
      });
      setApprovedVacations(data);
    } catch {
      setError("Failed to load team calendar.");
    } finally {
      setLoadingCalendar(false);
    }
  }, []);

  const loadAllPeriods = useCallback(async (activeFilters = {}) => {
    setLoadingPeriods(true);
    try {
      const data = await listVacations({
        employeeId: activeFilters.employeeId || undefined,
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
      });
      setAllPeriods(data);
    } catch {
      setError("Failed to load vacation periods.");
    } finally {
      setLoadingPeriods(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async (activeFilters = {}) => {
    try {
      const data = await listVacationAuditLogs({
        employeeId: activeFilters.employeeId || undefined,
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
      });
      setAuditLogs(data);
    } catch {
      setError("Failed to load calendar audit logs.");
    }
  }, []);

  const loadBackupAssignments = useCallback(async () => {
    try {
      const rows = await listBackupAssignments();
      setBackupAssignments(rows);
      setBackupDrafts(
        Object.fromEntries(
          rows.map((row) => [
            String(row.employee_id),
            row.backup_employee_id ? String(row.backup_employee_id) : "",
          ])
        )
      );
    } catch {
      setError("Failed to load backup assignments.");
    }
  }, []);

  const loadTeamBalances = useCallback(
    async (sourceEmployees) => {
      const employeesToLoad = Array.isArray(sourceEmployees) ? sourceEmployees : [];
      if (!employeesToLoad.length) {
        setTeamBalances([]);
        return;
      }

      setLoadingTeamBalances(true);
      try {
        const rows = await Promise.all(
          employeesToLoad.map(async (employee) => {
            const employeeId = Number(employee.ID || employee.id);
            const employeeName = employee.NAME || employee.name || "Employee";
            const employeeEmail = employee.EMAIL || employee.email || "-";

            try {
              const [vacationBalance, hourBank] = await Promise.all([
                getEmployeeBalance(employeeId, currentYear),
                getEmployeeHourBank(employeeId),
              ]);
              return {
                employeeId,
                employeeName,
                employeeEmail,
                vacationTotal: vacationBalance.TOTAL_DAYS || vacationBalance.total_days,
                vacationUsed: vacationBalance.USED_DAYS || vacationBalance.used_days,
                vacationAvailable:
                  vacationBalance.REMAINING_DAYS || vacationBalance.remaining_days,
                hourTotal: hourBank.TOTAL_HOURS || hourBank.total_hours,
                hourUsed: hourBank.USED_HOURS || hourBank.used_hours,
                hourAvailable: hourBank.AVAILABLE_HOURS || hourBank.available_hours,
              };
            } catch {
              return {
                employeeId,
                employeeName,
                employeeEmail,
                vacationTotal: "-",
                vacationUsed: "-",
                vacationAvailable: "-",
                hourTotal: "-",
                hourUsed: "-",
                hourAvailable: "-",
              };
            }
          })
        );

        setTeamBalances(rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName)));
      } catch {
        setError("Failed to load team vacation/hour-bank overview.");
      } finally {
        setLoadingTeamBalances(false);
      }
    },
    [currentYear]
  );

  const loadBalanceSnapshot = useCallback(async (employeeId, year) => {
    if (!employeeId || !year) {
      return;
    }

    try {
      const balance = await getEmployeeBalance(employeeId, year);
      setBalanceForm((prev) => ({
        ...prev,
        totalDays: String(balance.TOTAL_DAYS || balance.total_days),
        usedDays: String(balance.USED_DAYS || balance.used_days),
      }));
      setBalanceMessage("");
    } catch (requestError) {
      if (requestError?.response?.status === 404) {
        setBalanceForm((prev) => ({
          ...prev,
          totalDays: "30",
          usedDays: "0",
        }));
        setBalanceMessage(
          "No balance found for this year. Save to create a new balance record."
        );
        return;
      }
      setError("Failed to load balance for adjustment.");
    }
  }, []);

  const loadHourBankSnapshot = useCallback(async (employeeId) => {
    if (!employeeId) {
      return;
    }

    try {
      const hourBank = await getEmployeeHourBank(employeeId);
      setHourBankForm((prev) => ({
        ...prev,
        employeeId: String(employeeId),
        totalHours: String(hourBank.TOTAL_HOURS || hourBank.total_hours),
        usedHours: String(hourBank.USED_HOURS || hourBank.used_hours),
        availableHours: String(hourBank.AVAILABLE_HOURS || hourBank.available_hours),
      }));
      setHourBankMessage("");
    } catch {
      setError("Failed to load hour bank for adjustment.");
    }
  }, []);

  useEffect(() => {
    Promise.all([
      loadEmployees(),
      loadApprovedCalendar(),
      loadAllPeriods(),
      loadAuditLogs(),
      loadBackupAssignments(),
    ]);
  }, [loadEmployees, loadApprovedCalendar, loadAllPeriods, loadAuditLogs, loadBackupAssignments]);

  useEffect(() => {
    if (!employees.length) {
      setTeamBalances([]);
      return;
    }
    loadTeamBalances(employees);
  }, [employees, loadTeamBalances]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadApprovedCalendar(calendarFilters);
      loadAllPeriods(calendarFilters);
      loadAuditLogs(calendarFilters);
      if (employees.length) {
        loadTeamBalances(employees);
      }
    }, 15000);

    const handleFocus = () => {
      loadApprovedCalendar(calendarFilters);
      loadAllPeriods(calendarFilters);
      loadAuditLogs(calendarFilters);
      if (employees.length) {
        loadTeamBalances(employees);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [calendarFilters, employees, loadApprovedCalendar, loadAllPeriods, loadAuditLogs, loadTeamBalances]);

  useEffect(() => {
    if (!employees.length) {
      return;
    }

    const firstEmployeeId = String(employees[0].ID || employees[0].id);
    setBalanceForm((prev) =>
      prev.employeeId ? prev : { ...prev, employeeId: firstEmployeeId }
    );
    setHourBankForm((prev) =>
      prev.employeeId ? prev : { ...prev, employeeId: firstEmployeeId }
    );
  }, [employees]);

  useEffect(() => {
    if (!balanceForm.employeeId || !balanceForm.year) {
      return;
    }

    loadBalanceSnapshot(balanceForm.employeeId, balanceForm.year);
  }, [balanceForm.employeeId, balanceForm.year, loadBalanceSnapshot]);

  useEffect(() => {
    if (!hourBankForm.employeeId) {
      return;
    }

    loadHourBankSnapshot(hourBankForm.employeeId);
  }, [hourBankForm.employeeId, loadHourBankSnapshot]);

  const handleApplyCalendarFilters = async (event) => {
    event.preventDefault();
    await Promise.all([
      loadApprovedCalendar(calendarFilters),
      loadAllPeriods(calendarFilters),
      loadAuditLogs(calendarFilters),
    ]);
  };

  const handleAdjustBalance = async (event) => {
    event.preventDefault();
    setError("");
    setBalanceMessage("");
    setSavingBalance(true);

    try {
      const updated = await updateEmployeeBalance(balanceForm.employeeId, balanceForm.year, {
        total_days: Number(balanceForm.totalDays),
        used_days: Number(balanceForm.usedDays),
      });

      setBalanceForm((prev) => ({
        ...prev,
        totalDays: String(updated.TOTAL_DAYS || updated.total_days),
        usedDays: String(updated.USED_DAYS || updated.used_days),
      }));
      setBalanceMessage(
        `Balance updated. Available: ${updated.REMAINING_DAYS || updated.remaining_days} days.`
      );
      await loadTeamBalances(employees);
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Failed to adjust balance.");
    } finally {
      setSavingBalance(false);
    }
  };

  const handleAdjustHourBank = async (event) => {
    event.preventDefault();
    setError("");
    setHourBankMessage("");
    setSavingHourBank(true);

    try {
      const updated = await updateEmployeeHourBank(hourBankForm.employeeId, {
        total_hours: Number(hourBankForm.totalHours),
      });
      setHourBankForm((prev) => ({
        ...prev,
        totalHours: String(updated.TOTAL_HOURS || updated.total_hours),
        usedHours: String(updated.USED_HOURS || updated.used_hours),
        availableHours: String(updated.AVAILABLE_HOURS || updated.available_hours),
      }));
      setHourBankMessage(
        `Hour bank updated. Available: ${updated.AVAILABLE_HOURS || updated.available_hours}h.`
      );
      await loadTeamBalances(employees);
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Failed to adjust hour bank.");
    } finally {
      setSavingHourBank(false);
    }
  };

  const handleSaveBackupAssignment = async (employeeId) => {
    setError("");
    setBalanceMessage("");
    setSavingBackupEmployeeId(employeeId);
    try {
      const selectedBackupId = backupDrafts[String(employeeId)] || null;
      await updateBackupAssignment(employeeId, selectedBackupId);
      await loadBackupAssignments();
      setBalanceMessage("Backup assignment updated successfully.");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Failed to save backup assignment.");
    } finally {
      setSavingBackupEmployeeId(null);
    }
  };

  const handleAdminRemovePeriod = async (period) => {
    if (!period || (period.STATUS || period.status) !== "APPROVED") {
      return;
    }
    const periodId = period.ID || period.id;
    const employeeName = period.EMPLOYEE_NAME || period.employee_name || "Employee";
    const startDate = period.START_DATE || period.start_date;
    const endDate = period.END_DATE || period.end_date;
    const shouldDelete = window.confirm(
      `Remove period for ${employeeName}: ${formatYmd(startDate)} to ${formatYmd(endDate)}?`
    );
    if (!shouldDelete) return;

    setRemovingPeriodId(periodId);
    setError("");
    setBalanceMessage("");
    try {
      await removeVacation(periodId);
      await Promise.all([
        loadApprovedCalendar(calendarFilters),
        loadAllPeriods(calendarFilters),
        loadAuditLogs(calendarFilters),
      ]);
      await loadBalanceSnapshot(balanceForm.employeeId, balanceForm.year);
      await loadHourBankSnapshot(hourBankForm.employeeId);
      await loadTeamBalances(employees);
      setBalanceMessage("Period removed and balances refreshed.");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Failed to remove period.");
    } finally {
      setRemovingPeriodId(null);
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="card">
        <h2>Admin Dashboard</h2>
        <p>View team calendar, audit logs, and adjust annual balances.</p>
        {IS_MOCK_MODE ? (
          <p className="hint-text">
            {IS_SHARED_MOCK_MODE
              ? "Shared prototype mode: everyone sees the same events and balances (auto-refresh every 15 seconds)."
              : "Mock mode active: data is stored in this browser without balance/conflict validation."}
          </p>
        ) : null}
        <p className="hint-text">Session: {user?.email || user?.EMAIL}</p>
        {error ? <p className="error-text">{error}</p> : null}
      </div>

      <div className="card">
        <h3>Team vacation days and hour-bank balance ({currentYear})</h3>
        {loadingTeamBalances ? <p>Loading team balances...</p> : null}
        {!loadingTeamBalances && !teamBalances.length ? (
          <p>No team balances available yet.</p>
        ) : null}
        {teamBalances.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Vacation total</th>
                <th>Vacation used</th>
                <th>Vacation available</th>
                <th>Hour bank total</th>
                <th>Hour bank used</th>
                <th>Hour bank available</th>
              </tr>
            </thead>
            <tbody>
              {teamBalances.map((item) => (
                <tr key={`team-balance-${item.employeeId}`}>
                  <td>{item.employeeName}</td>
                  <td>{item.employeeEmail}</td>
                  <td>{item.vacationTotal}</td>
                  <td>{item.vacationUsed}</td>
                  <td>{item.vacationAvailable}</td>
                  <td>{item.hourTotal}</td>
                  <td>{item.hourUsed}</td>
                  <td>{item.hourAvailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card">
        <h3>Annual balance adjustment</h3>
        <form className="balance-form" onSubmit={handleAdjustBalance}>
          <label>
            Employee
            <select
              value={balanceForm.employeeId}
              onChange={(event) =>
                setBalanceForm((prev) => ({ ...prev, employeeId: event.target.value }))
              }
            >
              <option value="" disabled>
                Select
              </option>
              {employees.map((employee) => (
                <option key={employee.ID || employee.id} value={employee.ID || employee.id}>
                  {employee.NAME || employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Year
            <input
              type="number"
              min="2000"
              max="2100"
              value={balanceForm.year}
              onChange={(event) =>
                setBalanceForm((prev) => ({ ...prev, year: event.target.value }))
              }
            />
          </label>
          <label>
            Total days
            <input
              type="number"
              min="0"
              step="0.5"
              value={balanceForm.totalDays}
              onChange={(event) =>
                setBalanceForm((prev) => ({ ...prev, totalDays: event.target.value }))
              }
            />
          </label>
          <label>
            Used days
            <input
              type="number"
              min="0"
              step="0.5"
              value={balanceForm.usedDays}
              onChange={(event) =>
                setBalanceForm((prev) => ({ ...prev, usedDays: event.target.value }))
              }
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => loadBalanceSnapshot(balanceForm.employeeId, balanceForm.year)}
            >
              Reload balance
            </button>
            <button type="submit" disabled={savingBalance}>
              {savingBalance ? "Saving..." : "Save adjustment"}
            </button>
          </div>
        </form>
        <p className="hint-text">Available balance (preview): {previewRemainingDays}</p>
        {balanceMessage ? <p>{balanceMessage}</p> : null}
      </div>

      <div className="card">
        <h3>Hour bank adjustment (Day Off)</h3>
        <form className="balance-form" onSubmit={handleAdjustHourBank}>
          <label>
            Employee
            <select
              value={hourBankForm.employeeId}
              onChange={(event) =>
                setHourBankForm((prev) => ({ ...prev, employeeId: event.target.value }))
              }
            >
              <option value="" disabled>
                Select
              </option>
              {employees.map((employee) => (
                <option key={`hours-${employee.ID || employee.id}`} value={employee.ID || employee.id}>
                  {employee.NAME || employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Total extra hours
            <input
              type="number"
              min="0"
              step="0.5"
              value={hourBankForm.totalHours}
              onChange={(event) =>
                setHourBankForm((prev) => ({ ...prev, totalHours: event.target.value }))
              }
            />
          </label>
          <label>
            Consumed in day off
            <input type="text" value={`${hourBankForm.usedHours}h`} readOnly />
          </label>
          <label>
            Available hours
            <input type="text" value={`${hourBankForm.availableHours}h`} readOnly />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => loadHourBankSnapshot(hourBankForm.employeeId)}
            >
              Reload hour bank
            </button>
            <button type="submit" disabled={savingHourBank}>
              {savingHourBank ? "Saving..." : "Save hour bank"}
            </button>
          </div>
        </form>
        {hourBankMessage ? <p>{hourBankMessage}</p> : null}
      </div>

      <div className="card">
        <h3>Backup assignment management</h3>
        <p className="hint-text">
          Configure who is the backup for each employee. Vacation conflict validation follows this
          mapping.
        </p>
        {!backupAssignments.length ? <p>No backup assignments available.</p> : null}
        {backupAssignments.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Backup</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {backupAssignments.map((row) => (
                <tr key={row.employee_id}>
                  <td>{row.employee_name}</td>
                  <td>
                    <select
                      value={backupDrafts[String(row.employee_id)] ?? ""}
                      onChange={(event) =>
                        setBackupDrafts((prev) => ({
                          ...prev,
                          [String(row.employee_id)]: event.target.value,
                        }))
                      }
                    >
                      <option value="">No backup</option>
                      {employees
                        .filter(
                          (employee) =>
                            Number(employee.ID || employee.id) !== Number(row.employee_id)
                        )
                        .map((employee) => (
                          <option
                            key={`backup-${employee.ID || employee.id}`}
                            value={employee.ID || employee.id}
                          >
                            {employee.NAME || employee.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleSaveBackupAssignment(row.employee_id)}
                      disabled={savingBackupEmployeeId === row.employee_id}
                    >
                      {savingBackupEmployeeId === row.employee_id ? "Saving..." : "Save backup"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card">
        <h3>Calendar and audit filters</h3>
        <form className="filters" onSubmit={handleApplyCalendarFilters}>
          <label>
            Employee
            <select
              value={calendarFilters.employeeId}
              onChange={(event) =>
                setCalendarFilters((prev) => ({ ...prev, employeeId: event.target.value }))
              }
            >
              <option value="">All</option>
              {employees.map((employee) => (
                <option key={employee.ID || employee.id} value={employee.ID || employee.id}>
                  {employee.NAME || employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input
              type="date"
              value={calendarFilters.from}
              onChange={(event) =>
                setCalendarFilters((prev) => ({ ...prev, from: event.target.value }))
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={calendarFilters.to}
              onChange={(event) =>
                setCalendarFilters((prev) => ({ ...prev, to: event.target.value }))
              }
            />
          </label>
          <button type="submit" disabled={loadingCalendar}>
            {loadingCalendar ? "Applying..." : "Apply filters"}
          </button>
        </form>
      </div>

      <div className="card calendar-card">
        <h3>Team calendar (vacations and day offs)</h3>
        <CalendarControls
          activeView={calendarView}
          onViewChange={setCalendarView}
          onPrev={() => setCalendarDate((prev) => shiftDate(prev, calendarView, -1))}
          onNext={() => setCalendarDate((prev) => shiftDate(prev, calendarView, 1))}
          onToday={() => setCalendarDate(new Date())}
        />
        <p className="calendar-current-label">
          {calendarView === "year" ? format(calendarDate, "yyyy") : format(calendarDate, "MMMM yyyy")}
        </p>
        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-dot team-vacation" />
            Vacation
          </span>
          <span className="legend-item">
            <span className="legend-dot dayoff" />
            Day Off
          </span>
        </div>
        {calendarView === "year" ? (
          <YearCalendarView date={calendarDate} events={approvedEvents} />
        ) : (
          <Calendar
            localizer={localizer}
            culture="en-US"
            events={approvedEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 580 }}
            toolbar={false}
            date={calendarDate}
            view={calendarView}
            views={["month", "week", "day", "agenda"]}
            onView={setCalendarView}
            onNavigate={setCalendarDate}
            formats={formats}
            eventPropGetter={eventStyleGetter}
          />
        )}
      </div>

      <div className="card">
        <h3>All scheduled periods</h3>
        {loadingPeriods ? <p>Loading periods...</p> : null}
        {!loadingPeriods && !allPeriods.length ? <p>No periods found.</p> : null}
        {allPeriods.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Hours (Day Off)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allPeriods.map((period) => {
                const periodId = period.ID || period.id;
                const status = period.STATUS || period.status;
                const eventType = period.EVENT_TYPE || period.event_type || "VACATION";
                return (
                  <tr key={periodId}>
                    <td>{period.EMPLOYEE_NAME || period.employee_name}</td>
                    <td>{eventType === "DAY_OFF" ? "Day Off" : "Vacation"}</td>
                    <td>{formatYmd(period.START_DATE || period.start_date)}</td>
                    <td>{formatYmd(period.END_DATE || period.end_date)}</td>
                    <td>{period.REQUESTED_DAYS || period.requested_days || "-"}</td>
                    <td>
                      {eventType === "DAY_OFF"
                        ? `${period.DAY_OFF_HOURS || period.day_off_hours || 0}h`
                        : "-"}
                    </td>
                    <td>{status}</td>
                    <td>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleAdminRemovePeriod(period)}
                        disabled={status !== "APPROVED" || removingPeriodId === periodId}
                      >
                        {removingPeriodId === periodId ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card">
        <h3>Inclusion/removal audit log</h3>
        {!auditLogs.length ? <p>No events found for the current filters.</p> : null}
        {auditLogs.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Employee</th>
                <th>Action</th>
                <th>Performed by</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.ID || log.id}>
                  <td>{new Date(log.ACTION_AT || log.action_at).toLocaleString("en-US")}</td>
                  <td>{log.EMPLOYEE_NAME || log.employee_name}</td>
                  <td>{log.ACTION || log.action}</td>
                  <td>{log.ACTOR_NAME || log.actor_name}</td>
                  <td>{log.DETAILS || log.details || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
