import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { FaTimesCircle } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";


const API_BASE = "http://localhost:5000/api";

const EXAMPLE_QUESTIONS = [
  "Show all students with CGPA above 8.5.",
  "How many employees work in the HR department?",
  "List the top five highest-paid employees.",
  "Show students from MCA branch.",
];

const useTypewriter = (text, speed = 100) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    setDisplayText("");
    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayText;
};


const Dashboard = ({fullWidth = false,active,}) => {
  const { token,user,logout } = useAuth();
  const formatName = (name) => {
    return name
      ?.trim()
      .split(/\s+/)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");
  };
  // Get logged-in user's name
  const userName = formatName(user?.name) || "User";
  const typedName = useTypewriter(userName, 100);
  const [transcript, setTranscript] = useState("");
  const [sql, setSql] = useState("");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [execTime, setExecTime] = useState(null);
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);
  const queryInputRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
  logout();
  navigate("/login");
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => setTranscript(event.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
  if (active === "new-query") {
    queryInputRef.current?.focus();
  }
  }, [active]);

  useEffect(() => {
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      // backend not running
    }
  };

  if (token) {
    fetchHistory();
  }
}, [token]);
  

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`, {
      headers: {
      Authorization: `Bearer ${token}`,
       },
      });
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      /* backend not running yet — fine during frontend-only step */
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition isn't supported in this browser. Try Chrome, or type your question instead.");
      return;
    }
    setError("");
    setListening(true);
    recognitionRef.current.start();
  };

  const runQuery = async (textOverride) => {
    const text = textOverride ?? transcript;

    if (!token) {
    setError("Authentication required. Please login again.");
    return;
    }

    if (!text.trim()) {
      setError("Please speak or type a question first.");
      return;
    }
    setLoading(true);
    setError("");
    setSql("");
    setColumns([]);
    setRows([]);
    const startedAt = performance.now();

    try {
      const res = await fetch(`${API_BASE}/execute-query`, {
      method: "POST",
      headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
  const errorText = String(data.error || "").toUpperCase();

  if (
    errorText.includes("AI_REQUEST_LIMIT") ||
    errorText.includes("QUOTA") ||
    errorText.includes("429")
  ) {
    setError(
      "AI service is temporarily unavailable because the request limit has been reached. Please try again later."
    );
  } else if (
    errorText.includes("AI_SERVICE_ERROR")
  ) {
    setError(
      "The AI service is temporarily unavailable. Please try again."
    );
  } else if (
    errorText.includes("AI_EMPTY_RESPONSE")
  ) {
    setError(
      "The AI service returned an empty response. Please try again."
    );
  } else {
    setError(
      data.message || data.error || "Something went wrong."
    );
  }

  if (data.sql) {
    setSql(data.sql);
  }

  return;
}
      

      setSql(data.sql);
      setColumns(data.columns);
      setRows(data.rows);
      setExecTime(((performance.now() - startedAt) / 1000).toFixed(2));
      loadHistory();
    } catch {
      setError("Couldn't reach the backend. Is the Flask server running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  // Find the first numeric column for the mini bar chart, and a label column (first text column)
  const numericCol = columns.find((c) => rows.length > 0 && typeof rows[0][c] === "number");
  const labelCol = columns.find((c) => c !== numericCol && rows.length > 0 && typeof rows[0][c] !== "number") || columns[0];
  const maxVal = numericCol ? Math.max(...rows.map((r) => Number(r[numericCol]) || 0)) : 0;

  return (
    <main className={`dashboard ${fullWidth ? "dashboard-full" : ""}`}>
      <header className="dash-header">
        <div>
          <h1>Welcome back, {typedName}<span className="typewriter-cursor"></span> ! 👋</h1>
          <p>Ask anything from your database using natural language or voice.</p>
        </div>
        <div className="dash-header-actions">
          <div className="db-pill">🗄️VOICE_SQL_DB</div>
          <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <section className="ask-card">
        <div className="ask-main">
          <h2>Ask your question (Voice or Text)</h2>
          <div className="mic-wrap">
            <button
              className={`mic-circle ${listening ? "listening" : ""}`}
              onClick={startListening}
            >
              🎤
            </button>
          </div>
          <p className="mic-hint">
            {listening ? "Listening..." : "Click the mic and speak..."}
          </p>
          <p className="mic-subhint">or type your question</p>
          <div className="input-wrapper">
          <input
            ref={queryInputRef}
            type="text"
            className="ask-text-input"
            placeholder="Type your question here..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runQuery()}
          />
          {transcript.trim() && (
                      <button
                        type="button"
                        className="clear-input-btn"
                        onClick={() => setTranscript("")}
                      >
                        <FaTimesCircle size={22} />
                      </button>
                    )}
        </div>
        </div>

        <div className="ask-examples">
          <h3>✨ Example Questions</h3>
          {EXAMPLE_QUESTIONS.map((q) => (
            <button key={q} className="example-pill" onClick={() => { setTranscript(q); runQuery(q); }}>
              {q}
            </button>
          ))}
          <button className="submit-btn" onClick={() => runQuery()} disabled={loading}>
            {loading ? "Running..." : "Submit Query"} ➤
          </button>
        </div>
      </section>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <section className={`results-grid ${rows.length > 6 ? "visualization-expanded" : ""}`}>
        <div className="panel">
          <div className="panel-header">
            <span>{"</>"} Generated SQL</span>
          </div>
          <pre className="sql-block">{sql || "-- Run a query to see the generated SQL here"}</pre>
          {sql && !error && (
            <div className="success-banner">
              ✅ Query Generated Successfully
              {execTime && <div className="exec-time">Execution time: {execTime}s</div>}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <span>▦ Query Result</span>
            <select className="export-select" defaultValue="">
              <option value="" disabled>Export</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => <td key={c}>{String(row[c])}</td>)}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={columns.length || 1} className="empty-cell">No results yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && <div className="total-rows">Total Rows: {rows.length}</div>}
        </div>

        <div className="panel">
          <div className="panel-header">
            <span>📊 Result Visualization</span>
          </div>
          {numericCol && rows.length > 0 ? (
            <div className="chart-area">
              <div className="chart-title">{numericCol} Overview</div>
              <div className="bars">
                {rows.map((row, i) => (
                  <div className="bar-col" key={i}>
                    <div className="bar-value">{row[numericCol]}</div>
                    <div
                      className="bar"
                      style={{ height: `${(Number(row[numericCol]) / maxVal) * 100}%` }}
                    ></div>
                    <div className="bar-label">{String(row[labelCol]).split(" ")[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-empty">Run a query with numeric results to see a chart here.</div>
          )}
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-header">
          <span>🕘 Recent Queries</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Generated SQL</th>
                <th>Time</th>
                <th>Rows</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 5).map((h) => (
                <tr key={h.id}>
                  <td>{h.text}</td>

                  <td className="truncate-sql">
                    {h.sql}
                  </td>

                  <td>
                    {new Date(h.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td>
                    {h.row_count}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        h.status === "success"
                          ? "status-success"
                          : "status-failed"
                      }`}
                    >
                      {h.status === "success" ? "Success" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} className="empty-cell">No queries yet — try one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
