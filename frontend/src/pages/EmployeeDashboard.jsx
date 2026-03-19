import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, formats, localizer, toCalendarEvent } from "../utils/calendar";
import {
  createVacation,
  getEmployeeBalance,
  getEmployeeVacations,
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

function eventStyleGetter(event) {
  const status = event.status;
  let backgroundColor = "#2563eb";

  if (status === "PENDING") backgroundColor = "#d97706";
  if (status === "APPROVED") backgroundColor = "#16a34a";
  if (status === "REJECTED") backgroundColor = "#dc2626";

  return {
    style: {
      backgroundColor,
      color: "#fff",
      borderRadius: "6px",
      border: "none",
    },
  };
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);

  const currentYear = new Date().getFullYear();

  const events = useMemo(() => vacations.map(toCalendarEvent), [vacations]);

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");
    try {
      const [balanceResult, vacationsResult] = await Promise.all([
        getEmployeeBalance(user.ID || user.id, currentYear),
        getEmployeeVacations(user.ID || user.id),
      ]);
      setBalance(balanceResult);
      setVacations(vacationsResult);
    } catch {
      setError("Falha ao carregar dashboard. Verifique backend e saldo do ano atual.");
    } finally {
      setLoading(false);
    }
  }, [user, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectSlot = ({ start, end }) => {
    const range = normalizeSelectionRange(start, end);
    setSelectedRange(range);
    setModalOpen(true);
  };

  const handleConfirmVacation = async ({ startDate, endDate, justification }) => {
    if (!user) return;

    try {
      await createVacation({
        employee_id: user.ID || user.id,
        start_date: startDate,
        end_date: endDate,
        justification,
      });
      setModalOpen(false);
      setSelectedRange(null);
      await loadData();
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Não foi possível registrar a solicitação.");
      throw requestError;
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
              <span>Dias já gozados</span>
            </div>
            <div>
              <strong>{balance.REMAINING_DAYS || balance.remaining_days}</strong>
              <span>Saldo disponível</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card calendar-card">
        <h3>Solicitar férias no calendário</h3>
        <p>Selecione um intervalo para abrir a confirmação.</p>
        <Calendar
          localizer={localizer}
          culture="pt-BR"
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          style={{ height: 580 }}
          onSelectSlot={handleSelectSlot}
          formats={formats}
          eventPropGetter={eventStyleGetter}
        />
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
