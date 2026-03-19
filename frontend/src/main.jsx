import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "react-big-calendar/lib/css/react-big-calendar.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

const routerBase = import.meta.env.BASE_URL || "/";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter basename={routerBase}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
