import { useGoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IS_MOCK_MODE } from "../api/client";
import { useAuth } from "../contexts/useAuth";

const MOCK_AUTH_KEY = "vacation_app_auth";
const MOCK_DB_KEY = "vacation_app_mock_db";
const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, user } = useAuth();
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

  const googleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error("Nao foi possivel obter o perfil do Google.");
        }

        const profile = await profileResponse.json();
        const loggedUser = await loginWithGoogle(profile);

        if ((loggedUser.role || loggedUser.ROLE) === "ADMIN") {
          navigate("/admin");
          return;
        }
        navigate("/employee");
      } catch (requestError) {
        setError(requestError?.message || "Falha no login com Google.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Nao foi possivel autenticar com Google.");
    },
  });

  const handleResetMockData = () => {
    localStorage.removeItem(MOCK_AUTH_KEY);
    localStorage.removeItem(MOCK_DB_KEY);
    window.location.reload();
  };

  return (
    <section className="card login-card google-login-card">
      <h2>Login</h2>
      <p>Faça login para acessar o controle interno de férias e day offs.</p>
      {error ? <p className="error-text">{error}</p> : null}

      <button type="button" onClick={() => googleSignIn()} disabled={loading || !hasGoogleClientId}>
        {loading ? "Conectando..." : "Entrar com Google"}
      </button>
      {!hasGoogleClientId ? (
        <p className="error-text">
          Configure <code>VITE_GOOGLE_CLIENT_ID</code> no arquivo <code>.env</code> para habilitar
          o login com Google.
        </p>
      ) : null}

      <p className="hint-text">
        Após autenticar, seu nome/e-mail do Google serão usados como identidade no sistema.
      </p>

      {IS_MOCK_MODE ? (
        <button type="button" className="ghost" onClick={handleResetMockData} disabled={loading}>
          Resetar dados de teste
        </button>
      ) : null}
    </section>
  );
}
