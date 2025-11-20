import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import PlanilhasPage from "./pages/PlanilhasPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DashboardGeralPage from "./pages/DashboardGeralPage.jsx";
import DashboardOperadoresPage from "./pages/DashboardOperadoresPage.jsx";

export default function App() {
  return (
    <div className="app-root">
      <nav className="top-nav">
        <div className="top-nav-left">
          <div className="top-nav-brand">
            <span className="top-nav-brand-badge" />
            <span>Saara SureBet - Gestão</span>
          </div>

          <div className="top-nav-links">
            <NavLink
              to="/dashboard-geral"
              className={({ isActive }) =>
                "top-nav-link " + (isActive ? "top-nav-link-active" : "")
              }
            >
              Dashboard Geral
            </NavLink>
            <NavLink
              to="/dashboard-operadores"
              className={({ isActive }) =>
                "top-nav-link " + (isActive ? "top-nav-link-active" : "")
              }
            >
              Dashboard por Operador
            </NavLink>
            <NavLink
              to="/planilhas"
              className={({ isActive }) =>
                "top-nav-link " + (isActive ? "top-nav-link-active" : "")
              }
            >
              Planilhas
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard-geral" replace />} />
          <Route path="/planilhas" element={<PlanilhasPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard-geral" element={<DashboardGeralPage />} />
          <Route
            path="/dashboard-operadores"
            element={<DashboardOperadoresPage />}
          />
          <Route path="*" element={<p>404 - Página não encontrada</p>} />
        </Routes>
      </main>
    </div>
  );
}
