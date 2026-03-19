import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getEmployeeBalance,
  getEmployees,
  listVacationAuditLogs,
  listVacations,
  updateEmployeeBalance,
} from "../api/client";
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
  const [approvedVacations, setApprovedVacations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [error, setError] = useState("");
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
      setError("Erro ao carregar calendario da equipe.");
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
      setError("Erro ao carregar auditoria de calendario.");
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
          "Saldo nao encontrado para esse ano. Voce pode salvar para criar um novo saldo."
        );
        return;
      }
      setError("Erro ao carregar saldo para ajuste.");
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
        `Saldo atualizado. Disponivel: ${updated.REMAINING_DAYS || updated.remaining_days} dias.`
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
        <p>Visualize o calendario da equipe, auditoria e ajuste saldos anuais.</p>
        <p className="hint-text">Sessao: {user?.email || user?.EMAIL}</p>
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
        <h3>Filtros do calendario e auditoria</h3>
        <form className="filters" onSubmit={handleApplyCalendarFilters}>
          <label>
            Colaborador
            <select
              value={calendarFilters.employeeId}
              onChange={(event) =>
                setCalendarFilters((prev) => ({ ...prev, employeeId: event.target.value }))
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
              value={calendarFilters.from}
              onChange={(event) =>
                setCalendarFilters((prev) => ({ ...prev, from: event.target.value }))
              }
            />
          </label>
          <label>
            Ate
            <input
              type="date"
              value={calendarFilters.to}
              onChange={(event) =>
                setCalendarFilters((prev) => ({ ...prev, to: event.target.value }))
              }
            />
          </label>
          <button type="submit" disabled={loadingCalendar}>
            {loadingCalendar ? "Aplicando..." : "Aplicar filtros"}
          </button>
        </form>
      </div>

      <div className="card calendar-card">
        <h3>Calendario da equipe (ferias programadas)</h3>
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

      <div className="card">
        <h3>Auditoria de inclusoes/remocoes</h3>
        {!auditLogs.length ? <p>Nenhum evento encontrado para os filtros atuais.</p> : null}
        {auditLogs.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Colaborador</th>
                <th>Acao</th>
                <th>Executado por</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.ID || log.id}>
                  <td>{new Date(log.ACTION_AT || log.action_at).toLocaleString("pt-BR")}</td>
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
