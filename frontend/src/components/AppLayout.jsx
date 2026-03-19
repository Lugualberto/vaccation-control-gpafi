import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Controle de Férias da Equipe</h1>
          {user ? <p>Usuário: {user.NAME || user.name}</p> : null}
        </div>
        <nav className="app-nav">
          {user?.ROLE === "ADMIN" ? <Link to="/admin">Painel Admin</Link> : null}
          {user ? <Link to="/employee">Meu Painel</Link> : null}
          {user ? (
            <button type="button" onClick={logout}>
              Sair
            </button>
          ) : null}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
