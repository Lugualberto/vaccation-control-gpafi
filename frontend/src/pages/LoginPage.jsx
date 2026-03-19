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
      setError(apiMessage || "Could not authenticate with your corporate email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card login-card corporate-login-card">
      <h2>Login</h2>
      <p>Sign in with your corporate email to access vacation and day off control.</p>
      {IS_MOCK_MODE ? (
        <p className="hint-text">
          In this prototype phase, we accept emails from @{CORPORATE_EMAIL_DOMAIN}.
        </p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}

      <form onSubmit={handleSubmit}>
        <label htmlFor="corporateEmail">Corporate email</label>
        <input
          id="corporateEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={`name.surname@${CORPORATE_EMAIL_DOMAIN}`}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in with corporate email"}
        </button>
      </form>
    </section>
  );
}
