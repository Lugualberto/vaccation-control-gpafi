import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CORPORATE_EMAIL_DOMAIN, IS_MOCK_MODE } from "../api/client";
import { useAuth } from "../contexts/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithCorporateEmail, user } = useAuth();
  const [email, setEmail] = useState("");
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
      const loggedUser = await loginWithCorporateEmail(email);
      if ((loggedUser.role || loggedUser.ROLE) === "ADMIN") {
        navigate("/admin");
        return;
      }
      navigate("/employee");
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.message;
      setError(apiMessage || "Nao foi possivel autenticar com e-mail corporativo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card login-card corporate-login-card">
      <h2>Login</h2>
      <p>Entre com seu e-mail corporativo para acessar o controle de férias e day offs.</p>
      {IS_MOCK_MODE ? (
        <p className="hint-text">
          Nesta fase de protótipo, aceitamos e-mails do domínio @{CORPORATE_EMAIL_DOMAIN}.
        </p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}

      <form onSubmit={handleSubmit}>
        <label htmlFor="corporateEmail">E-mail corporativo</label>
        <input
          id="corporateEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={`nome.sobrenome@${CORPORATE_EMAIL_DOMAIN}`}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar com e-mail corporativo"}
        </button>
      </form>
    </section>
  );
}
