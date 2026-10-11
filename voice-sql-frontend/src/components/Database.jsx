import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000/api";

function Database() {
  const { token } = useAuth();

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [databaseInfo, setDatabaseInfo] = useState({
  name: "No database connected",
  type: "",
  connected: false,
  });

  // Fetch tables when Database page opens
  useEffect(() => {
    const fetchDatabaseInfo = async () => {
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
      setDatabaseInfo({
        name: data.name || "No database connected",
        type: data.type || "",
        connected: data.connected || false,
      });
    }
  } catch (error) {
    console.error(
      "Failed to fetch database information:",
      error
    );
  }
};

    const fetchTables = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/tables`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch tables");
        }

        /*
         * Backend currently returns schema as text:
         *
         * Table: students
         *   - id (integer)
         *   - name (text)
         *
         * Table: teachers
         *   - id (integer)
         *   - name (text)
         *
         * Extract table names from that schema.
         */
        const schema = data.tables || "";

        const visibleTables = [];

        if (typeof schema === "string") {
          const matches = schema.matchAll(
            /^Table:\s*(.+)$/gm
          );

          for (const match of matches) {
            const tableName = match[1].trim();

            if (tableName) {
              visibleTables.push(tableName);
            }
          }
        }

        // Hide application-internal tables if they ever appear
        const hiddenTables = [
          "users",
          "query_history",
        ];

        const filteredTables = visibleTables.filter(
          (table) =>
            !hiddenTables.includes(
              table.toLowerCase()
            )
        );

        setTables(filteredTables);

      } catch (error) {
        console.error(error);
        setTables([]);
        setError(
          error.message || "Unable to load tables."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDatabaseInfo();
      fetchTables();
    }
  }, [token]);

  // Fetch details of selected table
  const handleTableClick = async (tableName) => {
    try {
      setSelectedTable(tableName);
      setDetailsLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/tables/${encodeURIComponent(tableName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch table details"
        );
      }

      setColumns(data.columns || []);

    } catch (error) {
      console.error(error);
      setColumns([]);
      setError(
        error.message ||
        "Unable to load table details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="database-page">
      <div className="database-header">
      <h2>🗄️ Database Explorer</h2>

      <p>
        Explore tables and view their structure from your connected database.
      </p>
    </div>

      <div className="database-content">

        {/* LEFT: TABLE LIST */}
        <div className="database-tables">

          <h2>Tables</h2>

          {loading && (
            <p>Loading tables...</p>
          )}

          {!loading && tables.length === 0 && (
  <div className="database-no-tables">

    {!databaseInfo.connected ? (
      <>
        <div className="database-no-tables-icon">
          🔌
        </div>

        <h3>No database connected</h3>

        <p>
          Connect a database to view its tables and schema.
        </p>
      </>
    ) : (
      <>
        <div className="database-no-tables-icon">
          📋
        </div>

        <h3>No tables found</h3>

        <p>
          Your connected database does not contain any tables.
        </p>
      </>
    )}

  </div>
)}

          {!loading &&
            tables.map((table) => (
              <button
                key={table}
                className={`database-table-item ${
                  selectedTable === table
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleTableClick(table)
                }
              >
                <span>📋</span>
                <span>{table}</span>
              </button>
            ))}
        </div>

        {/* RIGHT: TABLE DETAILS */}
        <div className="database-details">

          {!selectedTable ? (
            <div className="database-empty">
              <div>📋</div>

              <h2>Select a table</h2>

              <p>
                Click a table from the list to view
                its details.
              </p>
            </div>
          ) : (
            <>
              <div className="database-details-header">
                <h2>📋 {selectedTable}</h2>
                <p>Table structure</p>
              </div>

              {detailsLoading ? (
                <p>Loading table details...</p>
              ) : (
                <table className="database-schema-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Nullable</th>
                    </tr>
                  </thead>

                  <tbody>
                    {columns.map((column) => (
                      <tr key={column.name}>
                        <td>{column.name}</td>
                        <td>{column.type}</td>
                        <td>{column.nullable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default Database;