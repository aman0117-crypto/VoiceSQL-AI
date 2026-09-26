import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

function Database() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch tables when Database page opens
  useEffect(() => {
  const fetchTables = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/tables`);

      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }

      const data = await response.json();

      // Hide application-internal tables
      const hiddenTables = ["users", "query_history"];

      const visibleTables = (data.tables || []).filter(
        (table) => !hiddenTables.includes(table.toLowerCase())
      );

      setTables(visibleTables);

    } catch (error) {
      console.error(error);
      setError("Unable to load tables.");
    } finally {
      setLoading(false);
    }
  };

  fetchTables();
}, []);

  // Fetch details of selected table
  const handleTableClick = async (tableName) => {
    try {
      setSelectedTable(tableName);
      setDetailsLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/tables/${encodeURIComponent(tableName)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch table details");
      }

      const data = await response.json();

      setColumns(data.columns || []);
    } catch (error) {
      console.error(error);
      setColumns([]);
      setError("Unable to load table details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="database-page">

      <div className="database-header">
        <h2>🗄️ VOICE_SQL_DB</h2>
        <p>Tables in your connected database</p>
      </div>

      <div className="database-content">

        {/* LEFT: TABLE LIST */}
        <div className="database-tables">

          <h2>Tables</h2>

          {loading && (
            <p>Loading tables...</p>
          )}

          {!loading && tables.length === 0 && (
            <p>No tables found.</p>
          )}

          {!loading &&
            tables.map((table) => (
              <button
                key={table}
                className={`database-table-item ${
                  selectedTable === table ? "selected" : ""
                }`}
                onClick={() => handleTableClick(table)}
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
                Click a table from the list to view its details.
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

      {error && (
        <div className="database-error">
          {error}
        </div>
      )}

    </div>
  );
}

export default Database;