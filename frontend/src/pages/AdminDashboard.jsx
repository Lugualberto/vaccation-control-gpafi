import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveVacation,
  getEmployeeBalance,
  getEmployees,
  listVacations,
  rejectVacation,
  updateEmployeeBalance,
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
  const currentYear = new Date().getFullYear();
  const [employees, setEmployees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedVacations, setApprovedVacations] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState("");
  const [balanceMessage, setBalanceMessage] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [filters, setFilters] = useState({
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
          "Saldo não encontrado para esse ano. Você pode salvar para criar um novo saldo."
        );
        return;
      }
      setError("Erro ao carregar saldo para ajuste.");
    }
  }, []);

  useEffect(() => {
    Promise.all([loadEmployees(), loadPending(), loadApprovedCalendar()]);
  }, [loadEmployees, loadPending, loadApprovedCalendar]);

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

  const handleAdjustBalance = async (event) => {
    event.preventDefault();
    setError("");
    setBalanceMessage("");
    setSavingBalance(true);

    try {
      const updated = await updateEmployeeBalance(balanceForm.employeeId, balanceForm.year, {
        admin_id: user.ID || user.id,
        total_days: Number(balanceForm.totalDays),
        used_days: Number(balanceForm.usedDays),
      });

      setBalanceForm((prev) => ({
        ...prev,
        totalDays: String(updated.TOTAL_DAYS || updated.total_days),
        usedDays: String(updated.USED_DAYS || updated.used_days),
      }));
      setBalanceMessage(
        `Saldo atualizado com sucesso. Disponível: ${
          updated.REMAINING_DAYS || updated.remaining_days
        } dias.`
      );
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Falha ao ajustar saldo.");
    } finally {
      setSavingBalance(false);
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
        <h3>Ajuste de saldo anual</h3>
        <form className="balance-form" onSubmit={handleAdjustBalance}>
          <label>
            Colaborador
            <select
              value={balanceForm.employeeId}
              onChange={(event) =>
                setBalanceForm((prev) => ({ ...prev, employeeId: event.target.value }))
              }
            >
              <option value="" disabled>
                Selecione
              </option>
              {employees.map((employee) => (
                <option key={employee.ID || employee.id} value={employee.ID || employee.id}>
                  {employee.NAME || employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ano
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
            Total de dias
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
            Dias usados
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
              Recarregar saldo
            </button>
            <button type="submit" disabled={savingBalance}>
              {savingBalance ? "Salvando..." : "Salvar ajuste"}
            </button>
          </div>
        </form>
        {balanceMessage ? <p>{balanceMessage}</p> : null}
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
