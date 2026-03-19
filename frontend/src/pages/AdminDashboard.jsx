import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveVacation,
  getEmployees,
  listVacations,
  rejectVacation,
} from "../api/client";
import PendingRequestsTable from "../components/PendingRequestsTable";
import { useAuth } from "../contexts/useAuth";
import { Calendar, formats, localizer, toCalendarEvent } from "../utils/calendar";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedVacations, setApprovedVacations] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    employeeId: "",
    from: "",
    to: "",
  });

  const approvedEvents = useMemo(
    () => approvedVacations.map(toCalendarEvent),
    [approvedVacations]
  );

  const loadEmployees = useCallback(async () => {
    const result = await getEmployees();
    setEmployees(result);
  }, []);

  const loadPending = useCallback(async (activeFilters = {}) => {
    setLoadingPending(true);
    setError("");
    try {
      const data = await listVacations({
        status: "PENDING",
        employeeId: activeFilters.employeeId || undefined,
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
      });
      setPendingRequests(data);
    } catch {
      setError("Erro ao carregar solicitações pendentes.");
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const loadApprovedCalendar = useCallback(async () => {
    try {
      const data = await listVacations({ status: "APPROVED" });
      setApprovedVacations(data);
    } catch {
      setError("Erro ao carregar calendário da equipe.");
    }
  }, []);

  useEffect(() => {
    Promise.all([loadEmployees(), loadPending(), loadApprovedCalendar()]);
  }, [loadEmployees, loadPending, loadApprovedCalendar]);

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    await loadPending(filters);
  };

  const handleApprove = async (request) => {
    try {
      await approveVacation(request.ID || request.id, user.ID || user.id);
      await Promise.all([loadPending(filters), loadApprovedCalendar()]);
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Falha ao aprovar solicitação.");
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt("Motivo da reprovação (opcional):", "");
    try {
      await rejectVacation(request.ID || request.id, user.ID || user.id, reason || "");
      await Promise.all([loadPending(filters), loadApprovedCalendar()]);
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Falha ao reprovar solicitação.");
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="card">
        <h2>Dashboard do Administrador</h2>
        <p>Aprove ou reprove solicitações e acompanhe o calendário do time.</p>
        {error ? <p className="error-text">{error}</p> : null}
      </div>

      <div className="card">
        <h3>Filtros de solicitações pendentes</h3>
        <form className="filters" onSubmit={handleApplyFilters}>
          <label>
            Colaborador
            <select
              value={filters.employeeId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, employeeId: event.target.value }))
              }
            >
              <option value="">Todos</option>
              {employees.map((employee) => (
                <option key={employee.ID || employee.id} value={employee.ID || employee.id}>
                  {employee.NAME || employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            De
            <input
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, from: event.target.value }))
              }
            />
          </label>
          <label>
            Até
            <input
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, to: event.target.value }))
              }
            />
          </label>
          <button type="submit">Aplicar filtros</button>
        </form>

        <PendingRequestsTable
          requests={pendingRequests}
          loading={loadingPending}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>

      <div className="card calendar-card">
        <h3>Calendário da equipe (férias aprovadas)</h3>
        <Calendar
          localizer={localizer}
          culture="pt-BR"
          events={approvedEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 580 }}
          formats={formats}
          eventPropGetter={eventStyleGetter}
        />
      </div>
    </section>
  );
}
