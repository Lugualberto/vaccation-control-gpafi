import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, formats, localizer, toCalendarEvent } from "../utils/calendar";
import {
  createVacation,
  getEmployeeBalance,
  getEmployeeVacations,
  listVacationAuditLogs,
  removeVacation,
} from "../api/client";
import VacationRequestModal from "../components/VacationRequestModal";
import { useAuth } from "../contexts/useAuth";

function normalizeSelectionRange(start, end) {
  const normalizedStart = new Date(start);
  const normalizedEnd = new Date(end);
  normalizedEnd.setDate(normalizedEnd.getDate() - 1);

  if (normalizedEnd < normalizedStart) {
    return { start: normalizedStart, end: normalizedStart };
  }

  return { start: normalizedStart, end: normalizedEnd };
}

function eventStyleGetter() {
  return {
    style: {
      backgroundColor: "#16a34a",
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
  const [vacations, setVacations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);

  const currentYear = new Date().getFullYear();
  const employeeId = Number(user?.employeeId);
  const events = useMemo(() => vacations.map(toCalendarEvent), [vacations]);

  const loadData = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    setError("");
    try {
      const [balanceResult, vacationsResult, auditResult] = await Promise.all([
        getEmployeeBalance(employeeId, currentYear),
        getEmployeeVacations(employeeId, "APPROVED"),
        listVacationAuditLogs({ employeeId }),
      ]);
      setBalance(balanceResult);
      setVacations(vacationsResult);
      setAuditLogs(auditResult);
    } catch {
      setError("Falha ao carregar dashboard. Verifique backend e saldo do ano atual.");
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

  const handleConfirmVacation = async ({ startDate, endDate, justification }) => {
    try {
      await createVacation({
        start_date: startDate,
        end_date: endDate,
        justification,
      });
      setModalOpen(false);
      setSelectedRange(null);
      await loadData();
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Nao foi possivel registrar a solicitacao.");
      throw requestError;
    }
  };

  const handleSelectEvent = async (event) => {
    const shouldDelete = window.confirm(
      `Deseja remover do calendario o periodo ${formatDate(event.start)} a ${formatDate(
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
      setError(apiMessage || "Nao foi possivel remover esse periodo.");
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="card">
        <h2>Dashboard do Colaborador</h2>
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
              <span>Dias ja gozados</span>
            </div>
            <div>
              <strong>{balance.REMAINING_DAYS || balance.remaining_days}</strong>
              <span>Saldo disponivel</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card calendar-card">
        <h3>Programar ferias no calendario</h3>
        <p>
          Selecione um intervalo para incluir no calendario. Clique em um evento para remover.
        </p>
        <Calendar
          localizer={localizer}
          culture="pt-BR"
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          style={{ height: 580 }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          formats={formats}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      <div className="card">
        <h3>Auditoria pessoal do calendario</h3>
        {!auditLogs.length ? <p>Nenhum evento de auditoria registrado.</p> : null}
        {auditLogs.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Acao</th>
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
