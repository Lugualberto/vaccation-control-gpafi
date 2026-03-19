import { addDays, addMonths, addWeeks, addYears, format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createVacation,
  getEmployeeBalance,
  IS_MOCK_MODE,
  listVacations,
  listVacationAuditLogs,
  removeVacation,
  updateEmployeeBalance,
} from "../api/client";
import CalendarControls from "../components/CalendarControls";
import VacationRequestModal from "../components/VacationRequestModal";
import YearCalendarView from "../components/YearCalendarView";
import { getBackupInfoFromFullName } from "../constants/backups";
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
      backgroundColor: isOwnVacation ? "#6d28d9" : "#a855f7",
      color: "#fff",
      borderRadius: "6px",
      border: "none",
    },
  };
}

function formatDate(value) {
  return new Date(value).toISOString().slice(0, 10);
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
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceMessage, setBalanceMessage] = useState("");

  const currentYear = new Date().getFullYear();
  const employeeId = Number(user?.employeeId);
  const events = useMemo(() => eventsData.map(toCalendarEvent), [eventsData]);
  const visibleEvents = useMemo(() => {
    if (calendarScope === "MINE") {
      return events.filter((event) => Number(event.employeeId) === Number(employeeId));
    }
    return events;
  }, [calendarScope, events, employeeId]);
  const backupInfo = useMemo(
    () => getBackupInfoFromFullName(user?.name || user?.NAME),
    [user]
  );

  const loadData = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    setError("");
    try {
      const [balanceResult, vacationsResult, auditResult] = await Promise.all([
        getEmployeeBalance(employeeId, currentYear),
        listVacations({ status: "APPROVED" }),
        listVacationAuditLogs({ employeeId }),
      ]);
      setBalance(balanceResult);
      setBalanceForm({
        totalDays: String(balanceResult.TOTAL_DAYS || balanceResult.total_days),
        usedDays: String(balanceResult.USED_DAYS || balanceResult.used_days),
      });
      setEventsData(vacationsResult);
      setAuditLogs(auditResult);
    } catch {
      setError("Falha ao carregar dashboard. Verifique os dados de teste.");
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectSlot = ({ start, end }) => {
    const range = normalizeSelectionRange(start, end);
    setSelectedRange(range);
    setModalOpen(true);
  };

  const handleConfirmVacation = async ({ startDate, endDate, justification, eventType }) => {
    try {
      await createVacation({
        start_date: startDate,
        end_date: endDate,
        justification,
        event_type: eventType,
      });
      setModalOpen(false);
      setSelectedRange(null);
      await loadData();
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Não foi possível registrar o período.");
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
      setBalanceMessage("Saldo manual atualizado para o período aquisitivo atual.");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Não foi possível atualizar seu saldo manual.");
    } finally {
      setSavingBalance(false);
    }
  };

  const handleSelectEvent = async (event) => {
    const isOwnVacation = Number(event.employeeId) === Number(employeeId);
    if (!isOwnVacation) {
      setError("Você pode remover apenas os seus próprios períodos.");
      return;
    }

    const shouldDelete = window.confirm(
      `Deseja remover do calendário o período ${formatDate(event.start)} a ${formatDate(
        new Date(event.end.getTime() - 24 * 60 * 60 * 1000)
      )}?`
    );
    if (!shouldDelete) {
      return;
    }

    try {
      await removeVacation(event.id);
      await loadData();
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Não foi possível remover esse período.");
    }
  };

  const currentLabel =
    calendarView === "year" ? format(calendarDate, "yyyy") : format(calendarDate, "MMMM yyyy");

  return (
    <section className="dashboard-grid">
      <section className="hero-split">
        <div className="hero-copy">
          <h2>Controle de Férias da Equipe e Daysoffs 🌴</h2>
          <p>
            Chegou a hora que todo mundo mais gosta no trabalho: férias (rsrs). Depois de tanto
            esforço e entrega, nada mais justo do que <strong>descansar</strong>.
          </p>
          <p>Aqui é o nosso controle interno de férias e day offs:</p>
          <ul>
            <li>informe os períodos que você planeja tirar férias;</li>
            <li>cuide para não bater com as férias do seu backup;</li>
            <li>
              este controle é só interno: você ainda precisa agendar tudo formalmente no Oracle.
            </li>
          </ul>
        </div>
        <div className="hero-illustration">
          <img src={HERO_IMAGE} alt="Mafalda relaxando na praia" loading="eager" />
        </div>
      </section>

      <div className="card">
        <h2>Dashboard do Colaborador</h2>
        {IS_MOCK_MODE ? (
          <p className="hint-text">
            Modo de teste sem Oracle ativo: saldo e eventos salvos localmente no navegador.
          </p>
        ) : null}
        {loading ? <p>Carregando dados...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {balance ? (
          <div className="stats">
            <div>
              <strong>{balance.TOTAL_DAYS || balance.total_days}</strong>
              <span>Total anual</span>
            </div>
            <div>
              <strong>{balance.USED_DAYS || balance.used_days}</strong>
              <span>Dias já gozados</span>
            </div>
            <div>
              <strong>{balance.REMAINING_DAYS || balance.remaining_days}</strong>
              <span>Saldo disponível</span>
            </div>
          </div>
        ) : null}
        <form className="manual-balance-form" onSubmit={handleManualBalanceSubmit}>
          <h3>Período aquisitivo (manual)</h3>
          <p className="hint-text">
            Informe manualmente seu saldo nesta fase de protótipo para testar os fluxos.
          </p>
          <label>
            Total de dias no período
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
            Dias já utilizados
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
            {savingBalance ? "Salvando..." : "Salvar saldo manual"}
          </button>
          {balanceMessage ? <p>{balanceMessage}</p> : null}
        </form>
      </div>

      <div className="card calendar-card">
        <h3>Calendário da equipe</h3>
        <p>
          Selecione um intervalo para incluir um evento. Clique em um evento para remover
          (somente os seus).
        </p>
        <div className="backup-chip-row">
          <span className="backup-chip">
            Meu backup: <strong>{backupInfo.backupDisplayName}</strong>
          </span>
          {backupInfo.backupFirstName ? (
            <span className="backup-chip subtle">
              Regra ativa: férias não podem conflitar com {backupInfo.backupDisplayName}.
            </span>
          ) : (
            <span className="backup-chip subtle">
              Regra de backup não aplicada para new hire nesta fase.
            </span>
          )}
        </div>
        <div className="scope-toggle">
          <button
            type="button"
            className={calendarScope === "TEAM" ? "view-active" : "ghost"}
            onClick={() => setCalendarScope("TEAM")}
          >
            Time inteiro
          </button>
          <button
            type="button"
            className={calendarScope === "MINE" ? "view-active" : "ghost"}
            onClick={() => setCalendarScope("MINE")}
          >
            Só minhas férias
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
            Minhas férias
          </span>
          <span className="legend-item">
            <span className="legend-dot team-vacation" />
            Férias da equipe
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
            culture="pt-BR"
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
        <h3>Auditoria pessoal do calendário</h3>
        {!auditLogs.length ? <p>Nenhum evento de auditoria registrado.</p> : null}
        {auditLogs.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Ação</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.ID || log.id}>
                  <td>{new Date(log.ACTION_AT || log.action_at).toLocaleString("pt-BR")}</td>
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
        onClose={() => {
          setModalOpen(false);
          setSelectedRange(null);
        }}
        onConfirm={handleConfirmVacation}
      />
    </section>
  );
}
