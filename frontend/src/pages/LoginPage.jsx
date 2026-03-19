import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees } from "../api/client";
import { useAuth } from "../contexts/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      if (user.ROLE === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/employee", { replace: true });
      }
    }
  }, [navigate, user]);

  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);
      setError("");
      try {
        const response = await getEmployees();
        setEmployees(response);
        if (response.length) {
          setSelectedId(String(response[0].ID || response[0].id));
        }
      } catch {
        setError("Não foi possível carregar usuários. Verifique o backend.");
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const selectedUser = employees.find(
      (employee) => String(employee.ID || employee.id) === selectedId
    );
    if (!selectedUser) {
      return;
    }

    login(selectedUser);
    if (selectedUser.ROLE === "ADMIN") {
      navigate("/admin");
      return;
    }
    navigate("/employee");
  };

  return (
    <section className="card login-card">
      <h2>Login (demo)</h2>
      <p>Para teste, selecione o usuário e entre no sistema.</p>
      {loading ? <p>Carregando usuários...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!loading ? (
        <form onSubmit={handleSubmit}>
          <label htmlFor="user">Usuário</label>
          <select
            id="user"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {employees.map((employee) => (
              <option key={employee.ID || employee.id} value={employee.ID || employee.id}>
                {(employee.NAME || employee.name) + " - " + (employee.EMAIL || employee.email)}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!selectedId}>
            Entrar
          </button>
        </form>
      ) : null}
    </section>
  );
}
