import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IS_MOCK_MODE } from "../api/client";
import { useAuth } from "../contexts/useAuth";

const MOCK_AUTH_KEY = "vacation_app_auth";
const MOCK_DB_KEY = "vacation_app_mock_db";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      if ((user.role || user.ROLE) === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/employee", { replace: true });
      }
    }
  }, [navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loggedUser = await login({ email, password });
      if ((loggedUser.role || loggedUser.ROLE) === "ADMIN") {
        navigate("/admin");
        return;
      }
      navigate("/employee");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Nao foi possivel autenticar com as credenciais informadas.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (mockEmail) => {
    setEmail(mockEmail);
    setPassword("Nubank@123");
    setLoading(true);
    setError("");

    try {
      const loggedUser = await login({ email: mockEmail, password: "Nubank@123" });
      if ((loggedUser.role || loggedUser.ROLE) === "ADMIN") {
        navigate("/admin");
        return;
      }
      navigate("/employee");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Nao foi possivel autenticar no acesso rapido.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetMockData = () => {
    localStorage.removeItem(MOCK_AUTH_KEY);
    localStorage.removeItem(MOCK_DB_KEY);
    window.location.reload();
  };

  return (
    <section className="card login-card">
      <h2>Login</h2>
      <p>Autentique-se com e-mail corporativo e senha.</p>
      {IS_MOCK_MODE ? (
        <p className="hint-text">
          Modo de teste local ativo (sem Oracle). Usuario seed:
          {" "}
          luana.gualberto@nubank.com.br / Nubank@123
        </p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      {IS_MOCK_MODE ? (
        <div className="quick-login-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => handleQuickLogin("luana.gualberto@nubank.com.br")}
            disabled={loading}
          >
            Entrar como Luana (Admin)
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => handleQuickLogin("rafael.oliveira@nubank.com.br")}
            disabled={loading}
          >
            Entrar como Rafael (Colaborador)
          </button>
          <button type="button" className="ghost" onClick={handleResetMockData} disabled={loading}>
            Resetar dados de teste
          </button>
        </div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome.sobrenome@empresa.com"
          required
        />
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}
