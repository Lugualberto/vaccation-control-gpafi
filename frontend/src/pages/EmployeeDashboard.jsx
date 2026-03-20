import { addDays, addMonths, addWeeks, addYears, format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createVacation,
  getEmployeeBalance,
  getEmployeeHourBank,
  IS_SHARED_MOCK_MODE,
  IS_MOCK_MODE,
  listBackupAssignments,
  listVacations,
  listVacationAuditLogs,
  removeVacation,
  updateEmployeeBalance,
  updateEmployeeHourBank,
} from "../api/client";
import CalendarControls from "../components/CalendarControls";
import VacationRequestModal from "../components/VacationRequestModal";
import { isUnlimitedDayOffEmail } from "../constants/dayOff";
import YearCalendarView from "../components/YearCalendarView";
import { useAuth } from "../contexts/useAuth";
import { Calendar, formats, localizer, toCalendarEvent } from "../utils/calendar";

const HERO_IMAGE =
  "https://pxcdn.0223.com.ar/f/082025/1754066789893.webp?cw=748&ch=420&cma=1&extw=jpg";

function normalizeSelectionRange(start, end) {
  const normalizedStart = new Date(start);
  const normalizedEnd = new Date(end);
  normalizedEnd.setDate(normalizedEnd.getDate() - 1);

  if (normalizedEnd < normalizedStart) {
    return { start: normalizedStart, end: normalizedStart };
  }

  return { start: normalizedStart, end: normalizedEnd };
}

function shiftDate(date, view, direction) {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addWeeks(date, direction);
  if (view === "year") return addYears(date, direction);
  return addMonths(date, direction);
}

function getEventStyle(event, currentEmployeeId) {
  const isOwnVacation = Number(event.employeeId) === Number(currentEmployeeId);
  const isDayOff = event.eventType === "DAY_OFF";

  if (isDayOff) {
    return {
      style: {
        backgroundColor: "#facc15",
        color: "#111827",
        borderRadius: "6px",
        border: "none",
      },
    };
  }

  return {
    style: {
      backgroundColor: isOwnVacation ? "#6d28d9" : "#60a5fa",
      color: "#fff",
      borderRadius: "6px",
      border: "none",
    },
  };
}

function formatDate(value) {
  return format(new Date(value), "yyyy-MM-dd");
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarScope, setCalendarScope] = useState("TEAM");
  const [balanceForm, setBalanceForm] = useState({
    totalDays: "30",
    usedDays: "0",
  });
  const [hourBank, setHourBank] = useState(null);
  const [hourBankForm, setHourBankForm] = useState({
    totalHours: "0",
  });
  const [savingBalance, setSavingBalance] = useState(false);
  const [savingHourBank, setSavingHourBank] = useState(false);
  const [balanceMessage, setBalanceMessage] = useState("");
  const [hourBankMessage, setHourBankMessage] = useState("");
  const [backupInfo, setBackupInfo] = useState({
    hasConfiguredBackup: false,
    backupDisplayName: "new hire",
  });

  const currentYear = new Date().getFullYear();
  const employeeId = Number(user?.employeeId);
  const isUnlimitedDayOff = useMemo(
    () => isUnlimitedDayOffEmail(user?.email || user?.EMAIL),
    [user?.email, user?.EMAIL]
  );
  const events = useMemo(() => eventsData.map(toCalendarEvent), [eventsData]);
  const visibleEvents = useMemo(() => {
    if (calendarScope === "MINE") {
      return events.filter((event) => Number(event.employeeId) === Number(employeeId));
    }
    return events;
  }, [calendarScope, events, employeeId]);
  const loadData = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    setError("");
    try {
      const [balanceResult, vacationsResult, auditResult, backupResult] = await Promise.all([
        getEmployeeBalance(employeeId, currentYear),
        listVacations({ status: "APPROVED" }),
        listVacationAuditLogs({ employeeId }),
        listBackupAssignments(),
      ]);
      const hourBankResult = isUnlimitedDayOff
        ? null
        : await getEmployeeHourBank(employeeId);
      setBalance(balanceResult);
      setBalanceForm({
        totalDays: String(balanceResult.TOTAL_DAYS || balanceResult.total_days),
        usedDays: String(balanceResult.USED_DAYS || balanceResult.used_days),
      });
      setHourBank(hourBankResult);
      setHourBankForm({
        totalHours: String(hourBankResult?.TOTAL_HOURS || hourBankResult?.total_hours || 0),
      });
      setEventsData(vacationsResult);
      setAuditLogs(auditResult);
      const ownBackup = backupResult?.find(
        (row) => Number(row.employee_id) === Number(employeeId)
      );
      setBackupInfo({
        hasConfiguredBackup: Boolean(ownBackup),
        backupFirstName: ownBackup?.backup_employee_name?.split(" ")?.[0]?.toLowerCase() || null,
        backupDisplayName: ownBackup?.backup_employee_name || "new hire",
      });
    } catch {
      setError("Failed to load dashboard. Check your local test data.");
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentYear, isUnlimitedDayOff]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadData();
    }, 15000);

    const handleFocus = () => {
      loadData();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadData]);

  const handleSelectSlot = ({ start, end }) => {
    const range = normalizeSelectionRange(start, end);
    setSelectedRange(range);
    setModalOpen(true);
  };

  const handleConfirmVacation = async ({
    startDate,
    endDate,
    justification,
    eventType,
    dayOffDuration,
  }) => {
    try {
      await createVacation({
        start_date: startDate,
        end_date: endDate,
        justification,
        event_type: eventType,
        day_off_duration: dayOffDuration,
      });
      setModalOpen(false);
      setSelectedRange(null);
      await loadData();
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Could not save this period.");
      throw requestError;
    }
  };

  const handleManualBalanceSubmit = async (event) => {
    event.preventDefault();
    setSavingBalance(true);
    setBalanceMessage("");
    setError("");

    try {
      const updated = await updateEmployeeBalance(employeeId, currentYear, {
        total_days: Number(balanceForm.totalDays),
        used_days: Number(balanceForm.usedDays),
      });
      setBalance(updated);
      setBalanceMessage("Manual balance updated for the current accrual period.");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Could not update your manual balance.");
    } finally {
      setSavingBalance(false);
    }
  };

  const handleManualHourBankSubmit = async (event) => {
    event.preventDefault();
    setSavingHourBank(true);
    setHourBankMessage("");
    setError("");

    try {
      const updated = await updateEmployeeHourBank(employeeId, {
        total_hours: Number(hourBankForm.totalHours),
      });
      setHourBank(updated);
      setHourBankForm({
        totalHours: String(updated.TOTAL_HOURS || updated.total_hours),
      });
      setHourBankMessage("Hour bank updated successfully.");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Could not update your hour bank.");
    } finally {
      setSavingHourBank(false);
    }
  };

  const handleSelectEvent = async (event) => {
    const isOwnVacation = Number(event.employeeId) === Number(employeeId);
    if (!isOwnVacation) {
      setError("You can only remove your own events.");
      return;
    }

    const startDateLabel = formatDate(event.start);
    const endDateLabel = formatDate(new Date(event.end.getTime() - 24 * 60 * 60 * 1000));
    const shouldDelete = window.confirm(
      startDateLabel === endDateLabel
        ? `Do you want to remove the event on ${startDateLabel}?`
        : `Do you want to remove the event from ${startDateLabel} to ${endDateLabel}?`
    );
    if (!shouldDelete) {
      return;
    }

    try {
      await removeVacation(event.id);
      await loadData();
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Could not remove this event.");
    }
  };

  const currentLabel =
    calendarView === "year" ? format(calendarDate, "yyyy") : format(calendarDate, "MMMM yyyy");

  return (
    <section className="dashboard-grid">
      <section className="hero-split">
        <div className="hero-copy">
          <h2>Team Vacation and Day Off Control 🌴</h2>
          <p>
            One of the most desired moments at work has arrived: planning vacations and day offs
            😄 🌴
          </p>
          <p>
            After so much effort and delivery, nothing is fairer than a break
          </p>
          <p>
            Use this dashboard to align dates with the team, avoid conflicts with your backup, and
            make sure everyone can rest without compromising deliveries.
          </p>
          <ul>
            <li>Add the periods you plan to take off;</li>
            <li>Follow the team calendar to avoid overlaps with your backup;</li>
            <li>
              This is an internal control: official registration in Oracle remains mandatory.
            </li>
          </ul>
          <h3>Day Off and Hour Bank rules</h3>
          <p>
            Day Off is intended as a benefit for IC5+ roles. For IC4 and below, day off uses hour
            bank rules.
          </p>
          <ul>
            <li>Inform your available extra-hours balance in the Hour Bank section;</li>
            <li>Each full-day day off consumes 8h from the balance;</li>
            <li>Each half-day day off consumes 4h from the balance;</li>
            <li>
              The balance can be recharged manually and split across multiple day offs over time.
            </li>
          </ul>
        </div>
        <div className="hero-illustration">
          <img src={HERO_IMAGE} alt="Mafalda relaxing at the beach" loading="eager" />
        </div>
      </section>

      <div className="card">
        <h2>Employee Dashboard</h2>
        {IS_MOCK_MODE ? (
          <p className="hint-text">
            {IS_SHARED_MOCK_MODE
              ? "Shared prototype mode: balances and events are synchronized for all users (auto-refresh every 15 seconds)."
              : "Mock mode active: balances and events are stored locally in this browser."}
          </p>
        ) : null}
        {loading ? <p>Loading data...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {balance ? (
          <div className="stats">
            <div>
              <strong>{balance.TOTAL_DAYS || balance.total_days}</strong>
              <span>Total annual</span>
            </div>
            <div>
              <strong>{balance.USED_DAYS || balance.used_days}</strong>
              <span>Used days</span>
            </div>
            <div>
              <strong>{balance.REMAINING_DAYS || balance.remaining_days}</strong>
              <span>Available balance</span>
            </div>
          </div>
        ) : null}
        <form className="manual-balance-form" onSubmit={handleManualBalanceSubmit}>
          <h3>Accrual period (manual)</h3>
          <p className="hint-text">Set your balance manually in this prototype phase.</p>
          <label>
            Total days in period
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
            Already used days
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
          <button type="submit" disabled={savingBalance}>
            {savingBalance ? "Saving..." : "Save manual balance"}
          </button>
          {balanceMessage ? <p>{balanceMessage}</p> : null}
        </form>
        {!isUnlimitedDayOff ? (
          <form className="manual-hour-bank-form" onSubmit={handleManualHourBankSubmit}>
            <h3>
              Hour bank (Day Off){" "}
              <span
                className="info-tip"
                title="For hour-bank users: full day off consumes 8h and half-day off consumes 4h."
              >
                ⓘ
              </span>
            </h3>
            <p className="hint-text">
              Set your current extra-hours balance. Day off events consume this balance
              automatically.
            </p>
            <div className="stats compact">
              <div>
                <strong>{hourBank?.TOTAL_HOURS || hourBank?.total_hours || 0}h</strong>
                <span>Total hours informed</span>
              </div>
              <div>
                <strong>{hourBank?.USED_HOURS || hourBank?.used_hours || 0}h</strong>
                <span>Consumed in day off</span>
              </div>
              <div>
                <strong>{hourBank?.AVAILABLE_HOURS || hourBank?.available_hours || 0}h</strong>
                <span>Available hours</span>
              </div>
            </div>
            <label>
              Current extra-hours balance
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
            <button type="submit" disabled={savingHourBank}>
              {savingHourBank ? "Saving..." : "Save hour bank"}
            </button>
            {hourBankMessage ? <p>{hourBankMessage}</p> : null}
          </form>
        ) : (
          <p className="hint-text">
            Your profile is in the unlimited day off group. Day off events are recorded in the
            calendar without hour-bank deduction.
          </p>
        )}
      </div>

      <div className="card calendar-card">
        <h3>Team calendar</h3>
        <p>
          Select a range to add an event. Click an event to remove it (your own events only).
        </p>
        <div className="backup-chip-row">
          <span className="backup-chip">
            My backup: <strong>{backupInfo.backupDisplayName}</strong>
          </span>
          {backupInfo.backupFirstName ? (
            <span className="backup-chip subtle">
              Active rule: vacations cannot overlap with {backupInfo.backupDisplayName}.
            </span>
          ) : (
            <span className="backup-chip subtle">
              Backup rule is not applied for new hires in this phase.
            </span>
          )}
        </div>
        <div className="scope-toggle">
          <button
            type="button"
            className={calendarScope === "TEAM" ? "view-active" : "ghost"}
            onClick={() => setCalendarScope("TEAM")}
          >
            Whole team
          </button>
          <button
            type="button"
            className={calendarScope === "MINE" ? "view-active" : "ghost"}
            onClick={() => setCalendarScope("MINE")}
          >
            Only my events
          </button>
        </div>

        <CalendarControls
          activeView={calendarView}
          onViewChange={setCalendarView}
          onPrev={() => setCalendarDate((prev) => shiftDate(prev, calendarView, -1))}
          onNext={() => setCalendarDate((prev) => shiftDate(prev, calendarView, 1))}
          onToday={() => setCalendarDate(new Date())}
        />
        <p className="calendar-current-label">{currentLabel}</p>

        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-dot own-vacation" />
            My vacations
          </span>
          <span className="legend-item">
            <span className="legend-dot team-vacation" />
            Team vacations
          </span>
          <span className="legend-item">
            <span className="legend-dot dayoff" />
            Day Off
          </span>
        </div>

        {calendarView === "year" ? (
          <YearCalendarView date={calendarDate} events={visibleEvents} />
        ) : (
          <Calendar
            localizer={localizer}
            culture="en-US"
            events={visibleEvents}
            startAccessor="start"
            endAccessor="end"
            selectable
            toolbar={false}
            date={calendarDate}
            view={calendarView}
            views={["month", "week", "day", "agenda"]}
            style={{ height: 580 }}
            onView={setCalendarView}
            onNavigate={setCalendarDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            formats={formats}
            eventPropGetter={(event) => getEventStyle(event, employeeId)}
          />
        )}
      </div>

      <div className="card">
        <h3>My calendar audit log</h3>
        {!auditLogs.length ? <p>No audit events recorded yet.</p> : null}
        {auditLogs.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.ID || log.id}>
                  <td>{new Date(log.ACTION_AT || log.action_at).toLocaleString("en-US")}</td>
                  <td>{log.ACTION || log.action}</td>
                  <td>{log.DETAILS || log.details || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <VacationRequestModal
        open={modalOpen}
        selectedRange={selectedRange}
        isUnlimitedDayOff={isUnlimitedDayOff}
        availableHourBank={hourBank?.AVAILABLE_HOURS || hourBank?.available_hours || 0}
        onClose={() => {
          setModalOpen(false);
          setSelectedRange(null);
        }}
        onConfirm={handleConfirmVacation}
      />
    </section>
  );
}
