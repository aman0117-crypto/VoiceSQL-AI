import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Settings.css";

const API_BASE = "http://localhost:5000/api";

const Settings = ({ darkMode }) => {
  const { token } = useAuth();

  const [dbInfo, setDbInfo] = useState({
    type: "Loading...",
    name: "Loading...",
    connected: false,
  });
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/database-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setDbInfo({
            type: data.type,
            name: data.name,
            connected: data.connected,
          });
        } else {
          setDbInfo({
            type: "Unknown",
            name: "Unknown",
            connected: false,
          });
        }
      } catch {
        setDbInfo({
          type: "Unreachable",
          name: "Unreachable",
          connected: false,
        });
      } finally {
        setDbLoading(false);
      }
    };

    fetchDatabaseInfo();
  }, [token]);

  return (
    <div className="settings-page">

      {/* Header */}
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your VoiceSQL AI preferences</p>
      </div>

      {/* =========================
          APPEARANCE
      ========================= */}
      <div className="settings-card">
        <div className="settings-card-title">
          <span className="settings-icon">🎨</span>
          <h2>Appearance</h2>
        </div>

        <div className="settings-row">
          <span>Dark Mode</span>

          <span
            className={`theme-status ${
              darkMode ? "status-enabled" : "status-disabled"
            }`}
          >
            [ {darkMode ? "ON" : "OFF"} ]
          </span>
        </div>
      </div>

      {/* =========================
          VOICE SETTINGS
      ========================= */}
      <div className="settings-card">
        <div className="settings-card-title">
          <span className="settings-icon">🎤</span>
          <h2>Voice Settings</h2>
        </div>

        <div className="settings-row">
          <span>Language</span>
          <span className="settings-value">English (India)</span>
        </div>

        <div className="settings-row">
          <span>Speech Recognition</span>

          <span className="enabled-badge">
            Enabled
          </span>
        </div>
      </div>

      {/* =========================
          DATABASE
      ========================= */}
      <div className="settings-card">
        <div className="settings-card-title">
          <span className="settings-icon">🗄️</span>
          <h2>Database</h2>
        </div>

        <div className="settings-row">
          <span>Database Type</span>
          <span className="settings-value">
            {dbLoading ? "Loading..." : dbInfo.type}
          </span>
        </div>

        <div className="settings-row">
          <span>Database Name</span>
          <span className="settings-value">
            {dbLoading ? "Loading..." : dbInfo.name}
          </span>
        </div>

        <div className="settings-row">
          <span>Status</span>

          <span className="database-status">
            <span
              className="status-dot"
              style={{
                background: dbInfo.connected ? "#22c55e" : "#ef4444",
              }}
            ></span>
            <span>
              {dbLoading
                ? "Checking..."
                : dbInfo.connected
                ? "Connected"
                : "Disconnected"}
            </span>
          </span>
        </div>
      </div>

      {/* =========================
          QUERY SETTINGS
      ========================= */}
      <div className="settings-card">
        <div className="settings-card-title">
          <span className="settings-icon">⚙️</span>
          <h2>Query Settings</h2>
        </div>

        <div className="settings-row">
          <span>Save Query History</span>
          <span className="enabled-badge">Enabled</span>
        </div>

        <div className="settings-row">
          <span>Show Generated SQL</span>
          <span className="enabled-badge">Enabled</span>
        </div>

        <div className="settings-row">
          <span>Confirm SQL Execution</span>
          <span className="enabled-badge">Enabled</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
