import { addDays, addMonths, addWeeks, addYears, format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getEmployeeBalance,
  getEmployees,
  IS_MOCK_MODE,
  listVacationAuditLogs,
  listVacations,
  updateEmployeeBalance,
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
      backgroundColor: isDayOff ? "#facc15" : "#8b5cf6",
      color: isDayOff ? "#111827" : "#fff",
      borderRadius: "6px",
      border: "none",
    },
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [employees, setEmployees] = useState([]);
  const [approvedVacations, setApprovedVacations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [error, setError] = useState("");
  const [calendarView, setCalendarView] = useState("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [balanceMessage, setBalanceMessage] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
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

  const approvedEvents = useMemo(
    () => approvedVacations.map(toCalendarEvent),
    [approvedVacations]
  );

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

  useEffect(() => {
    Promise.all([loadEmployees(), loadApprovedCalendar(), loadAuditLogs()]);
  }, [loadEmployees, loadApprovedCalendar, loadAuditLogs]);

  useEffect(() => {
    if (!employees.length) {
      return;
    }

    const firstEmployeeId = String(employees[0].ID || employees[0].id);
    setBalanceForm((prev) =>
      prev.employeeId ? prev : { ...prev, employeeId: firstEmployeeId }
    );
  }, [employees]);

  useEffect(() => {
    if (!balanceForm.employeeId || !balanceForm.year) {
      return;
    }

    loadBalanceSnapshot(balanceForm.employeeId, balanceForm.year);
  }, [balanceForm.employeeId, balanceForm.year, loadBalanceSnapshot]);

  const handleApplyCalendarFilters = async (event) => {
    event.preventDefault();
    await Promise.all([
      loadApprovedCalendar(calendarFilters),
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
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Failed to adjust balance.");
    } finally {
      setSavingBalance(false);
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="card">
        <h2>Admin Dashboard</h2>
        <p>View team calendar, audit logs, and adjust annual balances.</p>
        {IS_MOCK_MODE ? (
          <p className="hint-text">
            Mock mode active: data is stored in the browser without balance/conflict validation.
          </p>
        ) : null}
        <p className="hint-text">Session: {user?.email || user?.EMAIL}</p>
        {error ? <p className="error-text">{error}</p> : null}
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
        {balanceMessage ? <p>{balanceMessage}</p> : null}
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
