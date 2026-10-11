import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./connectDatabase.css";

const API_BASE = "http://localhost:5000/api";

function ConnectDatabase() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    db_type: "postgresql",
    host: "localhost",
    port: "5432",
    database: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [dbInfo, setDbInfo] = useState({
    type: "",
    name: "",
    connected: false,
    });
  const [dbLoading, setDbLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
  const fetchDatabaseInfo = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/database-info`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDbInfo({
          type: data.type || "Unknown",
          name: data.name || "Unknown",
          connected: Boolean(data.connected),
        });

        setConnected(Boolean(data.connected));
      } else {
        setConnected(false);
      }

        } catch (error) {
        console.error("Failed to fetch database info:", error);
        setConnected(false);

        } finally {
        setDbLoading(false);
        }
    };

    fetchDatabaseInfo();
    }, [token]);


  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleDatabaseTypeChange = (event) => {
    const dbType = event.target.value;

    let defaultPort = "5432";

    if (dbType === "mysql") {
      defaultPort = "3306";
    }

    if (dbType === "oracle") {
      defaultPort = "1521";
    }

    setForm((previous) => ({
      ...previous,
      db_type: dbType,
      port: defaultPort,
    }));

    setMessage("");
    setError("");
  };

  const handleConnect = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");
    setConnected(false);

    try {
      const response = await fetch(
        `${API_BASE}/test-db-connection`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          data.message ||
          "Database connection failed."
        );
      }

      setConnected(true);

      setDbInfo({
        type: form.db_type,
        name: form.database,
        connected: true,
        });

      setMessage(
        data.message ||
        "Database connected successfully."
      );

    } catch (error) {
      console.error(error);

      setConnected(false);

      setError(
        error.message ||
        "Unable to connect to the database."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
  setDisconnecting(true);
  setMessage("");
  setError("");

  try {
    const response = await fetch(
      `${API_BASE}/disconnect-db`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
        "Failed to disconnect database."
      );
    }

    setConnected(false);

    setDbInfo({
    type: "",
    name: "",
    connected: false,
    });

    setMessage(
      "Database disconnected successfully."
    );

    // Clear database credentials from the form
    setForm((previous) => ({
      ...previous,
      database: "",
      username: "",
      password: "",
    }));

  } catch (error) {
    console.error(error);

    setError(
      error.message ||
      "Unable to disconnect database."
    );

  } finally {
    setDisconnecting(false);
  }
};

  return (
    <div className="connect-database-page">

    <div className="connect-database-header">

    <h2>
        {connected ? "Connected Database" : "🔌Connect Database"}
    </h2>

    {!connected && (
        <p>
        Connect a database for the current login session.
        </p>
    )}

    </div>

      <div className="connect-database-card">

  {dbLoading ? (
    <div className="database-loading">
      Checking database connection...
    </div>
  ) : connected ? (

    <>
      {/* Connected Database */}
      <div className="settings-card-title">
        <span className="settings-icon">🗄️</span>
        <h2>Database</h2>
      </div>

      <div className="settings-row">
        <span>Database Type</span>

        <span className="settings-value">
          {dbInfo.type}
        </span>
      </div>

      <div className="settings-row">
        <span>Database Name</span>

        <span className="settings-value">
          {dbInfo.name}
        </span>
      </div>

      <div className="settings-row">
        <span>Status</span>

        <span className="database-status">
          <span
            className="status-dot"
            style={{
              background: "#22c55e",
            }}
          ></span>

          <span>Connected</span>
        </span>
      </div>

      {/* Disconnect */}
      <button
        type="button"
        className="disconnect-database-button"
        onClick={handleDisconnect}
        disabled={disconnecting}
      >
        {disconnecting
          ? "Disconnecting..."
          : "Disconnect Database"}
      </button>
    </>

  ) : (

    <form onSubmit={handleConnect}>

      {/* Database Type */}
      <div className="form-group">

        <label htmlFor="db_type">
          Database Type
        </label>

        <select
          id="db_type"
          name="db_type"
          value={form.db_type}
          onChange={handleDatabaseTypeChange}
        >
          <option value="postgresql">
            PostgreSQL
          </option>

          <option value="mysql">
            MySQL
          </option>

          <option value="oracle">
            Oracle
          </option>
        </select>

      </div>

      {/* Host */}
      <div className="form-group">

        <label htmlFor="host">
          Host
        </label>

        <input
          id="host"
          name="host"
          type="text"
          value={form.host}
          onChange={handleChange}
          placeholder="localhost"
          required
        />

      </div>

      {/* Port */}
      <div className="form-group">

        <label htmlFor="port">
          Port
        </label>

        <input
          id="port"
          name="port"
          type="text"
          value={form.port}
          onChange={handleChange}
          placeholder="5432"
          required
        />

      </div>

      {/* Database */}
      <div className="form-group">

        <label htmlFor="database">
          Database Name
        </label>

        <input
          id="database"
          name="database"
          type="text"
          value={form.database}
          onChange={handleChange}
          placeholder="Enter Database Name"
          required
        />

      </div>

      {/* Username */}
      <div className="form-group">

        <label htmlFor="username">
          Username
        </label>

        <input
          id="username"
          name="username"
          type="text"
          value={form.username}
          onChange={handleChange}
          placeholder="postgres"
          required
        />

      </div>

      {/* Password */}
      <div className="form-group">

        <label htmlFor="password">
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter database password"
          required
        />

      </div>

      {/* Connect Button */}
      <button
        type="submit"
        className="connect-database-button"
        disabled={loading}
      >
        {loading
          ? "Connecting..."
          : "Connect Database"}
      </button>

    </form>
  )}

  {/* Success */}
  {message && (
    <div className="database-success">
      ✅ {message}
    </div>
  )}

  {/* Error */}
  {error && (
    <div className="database-error">
      ❌ {error}
    </div>
  )}

</div>

      <div className="database-security-note">

        🔒 <strong>Security:</strong>

        <span>
          Your database credentials are used only for
          the current login session and are not stored
          in the application database.
        </span>

      </div>

    </div>
  );
}

export default ConnectDatabase;