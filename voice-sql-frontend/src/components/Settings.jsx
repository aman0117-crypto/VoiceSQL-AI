import "react";
import "./Settings.css";

const Settings = ({ darkMode }) => {
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
          <span className="settings-value">PostgreSQL</span>
        </div>

        <div className="settings-row">
          <span>Database Name</span>
          <span className="settings-value">VOICE_SQL_DB</span>
        </div>

        <div className="settings-row">
          <span>Status</span>

          <span className="database-status">
            <span className="status-dot"></span>
            <span>Connected</span>
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

      {/* Information */}
      <div className="settings-info">
        <span>ⓘ</span>

        <div>
          <strong>VoiceSQL AI Preferences</strong>
          <p>
            These settings are configured for your VoiceSQL AI application.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Settings;