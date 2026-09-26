import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import QueryHistory from "./components/QueryHistory";
import Database from "./components/Database";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";
import Help from "./components/Help";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  const [active, setActive] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  /* =========================
     PUBLIC PAGES
  ========================= */

  if (location.pathname === "/login") {
    return <Login />;
  }

  if (location.pathname === "/signup") {
    return <Signup />;
  }

  /* =========================
     PROTECTED APPLICATION
  ========================= */

  return (
    <ProtectedRoute>
      <div className="app-shell">

        <Sidebar
          active={active}
          onNavigate={setActive}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          open={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />

        {!sidebarOpen && (
          <button
            className="sidebar-reopen-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            ☰
          </button>
        )}

        <main className="main-content">
          {active === "database" ? (
            <Database />
          ) : active === "help" ? (
            <Help />
          ) : active === "history" ? (
            <QueryHistory />
          ) : active === "analytics" ? (
            <Analytics />
          ) : active === "settings" ? (
            <Settings darkMode={darkMode} />
          ) : (
            <Dashboard
              fullWidth={!sidebarOpen}
              active={active}
            />
          )}
        </main>

      </div>
    </ProtectedRoute>
  );
}

export default App;