import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Team Vacation and Day Off Control 🌴</h1>
          {user ? <p>User: {user.name || user.NAME}</p> : null}
        </div>
        <nav className="app-nav">
          {(user?.role || user?.ROLE) === "ADMIN" ? <Link to="/admin">Admin Panel</Link> : null}
          {user ? <Link to="/employee">My Dashboard</Link> : null}
          {user ? (
            <button type="button" onClick={logout}>
              Sign out
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
