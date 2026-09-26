import { Fragment, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./QueryHistory.css";

function QueryHistory() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
  if (token) {
    fetchHistory();
  }
}, [token]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/history", {
      headers: {
      Authorization: `Bearer ${token}`,
      },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load query history.");
      }

      
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message || "Could not load query history.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    const date = new Date(timestamp);

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <main className="query-history-page">

      {/* Header */}
      <div className="query-history-header">
        <div>
          <div className="history-title-row">
            <div className="history-title-icon">🕒</div>

            <div>
              <h1>Query History</h1>
              <p>
                View your 50 most recent voice-to-SQL queries
              </p>
            </div>
          </div>
        </div>

        <button
          className="refresh-history-btn"
          onClick={fetchHistory}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="history-stats">

        <div className="history-stat-card">
          <div className="stat-icon">🕒</div>
          <div>
            <span>Total Shown</span>
            <strong>{history.length}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon">⚡</div>
          <div>
            <span>Successful Queries</span>
            <strong>{history.filter((item) => item.status === "success").length}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <span>Rows Retrieved</span>
            <strong>
              {history.reduce(
                (total, item) => total + Number(item.row_count || 0),
                0
              )}
            </strong>
          </div>
        </div>

      </div>

      {/* Main Card */}
      <section className="history-card">

        <div className="history-card-header">
          <div>
            <h2>Recent Queries</h2>
            <p>Latest queries are shown first</p>
          </div>

          <div className="history-count">
            {history.length} / 50
          </div>
        </div>

        {loading ? (
          <div className="history-state">
            <div className="history-loader"></div>
            <p>Loading query history...</p>
          </div>
        ) : error ? (
          <div className="history-state error-state">
            <div className="state-icon">⚠️</div>
            <h3>Unable to load history</h3>
            <p>{error}</p>

            <button onClick={fetchHistory}>
              Try Again
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="history-state">
            <div className="state-icon">🕒</div>
            <h3>No query history yet</h3>
            <p>
              Your executed voice-to-SQL queries will appear here.
            </p>
          </div>
        ) : (
          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>SQL Query</th>
                  <th>Rows</th>
                  <th>Status</th>
                  <th>Date&Time</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {history.map((item, index) => (
                  <Fragment key={item.id}>
                    <tr
                      key={item.id}
                      className={
                        expandedId === item.id
                          ? "history-row expanded"
                          : "history-row"
                      }
                      onClick={() => toggleRow(item.id)}
                    >
                      <td className="history-number">
                        {index + 1}
                      </td>

                      <td className="question-cell">
                        <span>{item.text}</span>
                      </td>

                      <td className="sql-cell">
                        <code>
                          {item.sql.length > 65
                            ? `${item.sql.substring(0, 65)}...`
                            : item.sql}
                        </code>
                      </td>

                      <td>
                        <span className="row-badge">
                          {item.row_count}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            item.status === "success"
                              ? "status-success"
                              : "status-failed"
                          }`}
                        >
                          {item.status === "success" ? "Success" : "Failed"}
                        </span>
                      </td>

                      <td className="date-cell">
                        {formatDate(item.timestamp)}
                      </td>

                      <td className="expand-cell">
                        <span>
                          {expandedId === item.id ? "" : ""}
                        </span>
                      </td>
                    </tr>

                    {expandedId === item.id && (
                      <tr
                        key={`${item.id}-details`}
                        className="expanded-details-row"
                      >
                        <td colSpan="7">

                          <div className="query-details">

                            <div className="detail-section">
                              <div className="detail-label">
                                QUESTION
                              </div>

                              <div className="detail-question">
                                {item.text}
                              </div>
                            </div>

                            <div className="detail-section">
                              <div className="detail-label">
                                GENERATED SQL
                              </div>

                              <pre className="sql-code">
                                {item.sql}
                              </pre>
                            </div>

                            <div className="detail-footer">
                              <span>
                                ID: #{item.id}
                              </span>

                              <span>
                                {item.row_count} rows returned
                              </span>

                              <span>
                                {formatDate(item.timestamp)}
                              </span>
                            </div>

                          </div>

                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>

            </table>

          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="history-footer">
            Showing the latest {history.length} queries
            <span>•</span>
            Maximum 50 records
          </div>
        )}

      </section>

    </main>
  );
}

export default QueryHistory;