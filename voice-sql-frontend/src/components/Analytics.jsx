import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Analytics.css";

const API_BASE = "http://localhost:5000/api";

const Analytics = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  if (token) {
    loadAnalytics();
  }
}, [token]);

const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to load analytics"
        );
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalytics(data);
    } catch (err) {
      console.error("Analytics error:", err);
      setError(err.message || "Could not load analytics");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Loading
  // -----------------------------
  if (loading) {
    return (
      <main className="analytics-page">
        <div className="analytics-state">
          <div className="analytics-loader"></div>
          <h3>Loading Analytics...</h3>
          <p>Fetching your query activity</p>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Error
  // -----------------------------
  if (error) {
    return (
      <main className="analytics-page">
        <div className="analytics-state error">
          <div className="analytics-state-icon">⚠️</div>
          <h3>Unable to load analytics</h3>
          <p>{error}</p>

          <button onClick={loadAnalytics}>
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Backend data
  // -----------------------------
  const totalQueries = analytics?.total_queries || 0;

  const last7Days = analytics?.last_7_days || 0;

  const queryActivity = analytics?.activity || [];

  // -----------------------------
// Query Activity Pie Chart
// -----------------------------

const activityDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const activityData = activityDays.map((day) => {
  const found = queryActivity.find(
    (item) => item.day === day
  );

  return {
    day,
    count: found ? found.count : 0,
  };
});

const pieColors = [
  "#7c3aed", // Mon
  "#3b82f6", // Tue
  "#14b8a6", // Wed
  "#22c55e", // Thu
  "#eab308", // Fri
  "#f97316", // Sat
  "#ec4899", // Sun
];

const pieStyle = {
  background: `conic-gradient(
    ${pieColors[0]} 0deg 51.43deg,
    ${pieColors[1]} 51.43deg 102.86deg,
    ${pieColors[2]} 102.86deg 154.29deg,
    ${pieColors[3]} 154.29deg 205.72deg,
    ${pieColors[4]} 205.72deg 257.15deg,
    ${pieColors[5]} 257.15deg 308.58deg,
    ${pieColors[6]} 308.58deg 360deg
  )`,
};

  const tables = analytics?.most_used_tables || [];

  const backendComplexity = analytics?.query_complexity || {
    simple: 0,
    moderate: 0,
    complex: 0,
  };

  // -----------------------------
  // Successful / Failed
  // -----------------------------
 const successfulQueries = analytics?.successful_queries || 0;
 const failedQueries = analytics?.failed_queries || 0;

  const successPercentage =
    totalQueries > 0
      ? ((successfulQueries / totalQueries) * 100).toFixed(2)
      : "0.00";

  const failedPercentage =
    totalQueries > 0
      ? ((failedQueries / totalQueries) * 100).toFixed(2)
      : "0.00";

  
  // -----------------------------
  // Table usage
  // -----------------------------
  const maxTableQueries = Math.max(
    ...tables.map((table) => table.queries),
    1
  );

  // -----------------------------
  // Complexity
  // -----------------------------
  const simpleCount = backendComplexity.simple || 0;
  const moderateCount = backendComplexity.moderate || 0;
  const complexCount = backendComplexity.complex || 0;

  const complexityTotal =
    simpleCount + moderateCount + complexCount;

  const getPercentage = (count) => {
    if (complexityTotal === 0) return "0.0";

    return ((count / complexityTotal) * 100).toFixed(1);
  };

  const complexity = [
    {
      name: "Simple Queries",
      count: simpleCount,
      percentage: getPercentage(simpleCount),
      className: "simple",
      description:
        "Basic SELECT queries with few conditions",
    },
    {
      name: "Medium Queries",
      count: moderateCount,
      percentage: getPercentage(moderateCount),
      className: "medium",
      description:
        "Queries with JOIN, GROUP BY, or multiple conditions",
    },
    {
      name: "Complex Queries",
      count: complexCount,
      percentage: getPercentage(complexCount),
      className: "complex",
      description:
        "Queries with subqueries, nested logic, or advanced SQL",
    },
  ];

  // -----------------------------
  // Donut
  // -----------------------------
  const simplePercentage =
    complexityTotal > 0
      ? (simpleCount / complexityTotal) * 100
      : 0;

  const moderatePercentage =
    complexityTotal > 0
      ? (moderateCount / complexityTotal) * 100
      : 0;


  return (
    <main className="analytics-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>
            Overview of your VoiceSQL query activity
          </p>
        </div>

        <div className="analytics-filter">
          <span>📅</span>
          <span>Last 7 Days</span>
          <span></span>
        </div>
      </div>


      {/* =========================
          SUMMARY CARDS
      ========================= */}

      <section className="analytics-stats">

        {/* Total */}

        <div className="analytics-stat-card">
          <div className="stat-card-icon purple">
            ▤
          </div>

          <div>
            <span>Total Queries</span>

            <strong>{totalQueries}</strong>

            <small>All time</small>
          </div>
        </div>


        {/* Successful */}

        <div className="analytics-stat-card">
          <div className="stat-card-icon green">
            ✓
          </div>

          <div>
            <span>Successful Queries</span>

            <strong>{successfulQueries}</strong>

            <small className="success-text">
              {successPercentage}% of total
            </small>
          </div>
        </div>


        {/* Failed */}

        <div className="analytics-stat-card">
          <div className="stat-card-icon red">
            ×
          </div>

          <div>
            <span>Failed Queries</span>

            <strong>{failedQueries}</strong>

            <small className="error-text">
              {failedPercentage}% of total
            </small>
          </div>
        </div>

      </section>


      {/* =========================
          MIDDLE GRID
      ========================= */}

      <section className="analytics-middle-grid">


        {/* =========================
            QUERY ACTIVITY
        ========================= */}

        <div className="analytics-card query-activity-card">

          <div className="analytics-card-header">
            <div>
              <h2>Query Activity</h2>

              <p>
                Number of queries per day
              </p>
            </div>
          </div>


             {/* =========================
      7 SEGMENT PIE CHART
  ========================= */}

  <div className="activity-pie-container">

    <div
      className="activity-pie"
      style={pieStyle}
    >

      {/* Day labels and query counts */}

      {activityData.map((item, index) => (
        <div
          key={item.day}
          className={`pie-day pie-day-${index}`}
        >

          <span className="pie-day-name">
            {item.day}
          </span>

          <strong className="pie-day-count">
            {item.count}
          </strong>

        </div>
      ))}

    </div>


    {/* =========================
        LEGEND
    ========================= */}

    <div className="activity-pie-legend">

      {activityData.map((item, index) => (

        <div
          className="activity-legend-item"
          key={item.day}
        >

          <span
            className="activity-legend-dot"
            style={{
              background: pieColors[index],
            }}
          />

          <span className="activity-legend-day">
            {item.day}
          </span>

          <strong>
            {item.count}
          </strong>

        </div>

      ))}

    </div>

  </div>


          <div className="activity-summary">

            <div className="activity-summary-icon">
              ▥
            </div>

            <div>
              <strong>{last7Days}</strong>

              <span>
                queries in the last 7 days
              </span>
            </div>

          </div>

        </div>


        {/* =========================
            MOST USED TABLES
        ========================= */}

        <div className="analytics-card tables-card">

          <div className="analytics-card-header">

            <div>
              <h2>Most Used Tables</h2>

              <p>
                Top tables queried
              </p>
            </div>

          </div>


          <div className="tables-list">

            {tables.length === 0 ? (

              <div className="analytics-empty">
                No table usage data available.
              </div>

            ) : (

              tables.map((table) => (

                <div
                  className="table-item"
                  key={table.name}
                >

                  <div className="table-info">

                    <span>{table.name}</span>

                    <strong>
                      {table.queries} queries
                    </strong>

                  </div>


                  <div className="table-progress">

                    <div
                      className="table-progress-fill"
                      style={{
                        width: `${
                          (table.queries /
                            maxTableQueries) *
                          100
                        }%`,
                      }}
                    ></div>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </section>


      {/* =========================
          QUERY COMPLEXITY
      ========================= */}

      <section className="analytics-card complexity-card">

        <div className="analytics-card-header complexity-header">

          <div>
            <h2>
              Query Complexity Analysis
            </h2>

            <p>
              Distribution of queries based on SQL complexity
            </p>
          </div>

        </div>


        <div className="complexity-content">


        {/* =========================
    DONUT
========================= */}

<div className="complexity-donut-wrapper">
  <div
    className="complexity-donut"
    style={{
      background: `conic-gradient(
        #22c55e 0deg ${simplePercentage * 3.6}deg,
        #eab308 ${simplePercentage * 3.6}deg ${(simplePercentage + moderatePercentage) * 3.6}deg,
        #ef4444 ${(simplePercentage + moderatePercentage) * 3.6}deg 360deg
      )`,
    }}
  >
    <div className="donut-center">
      <strong>{complexityTotal}</strong>
      <span>Total Queries</span>
    </div>
  </div>
</div>


          {/* =========================
              BREAKDOWN
          ========================= */}

          <div className="complexity-breakdown">

            {complexity.map((item) => (

              <div
                className="complexity-item"
                key={item.name}
              >

                <div
                  className={`complexity-dot ${item.className}`}
                ></div>


                <div className="complexity-info">

                  <div className="complexity-name">
                    {item.name}
                  </div>

                  <p>
                    {item.description}
                  </p>

                </div>


                <div className="complexity-number">

                  <strong>
                    {item.count}
                  </strong>

                  <span>
                    {item.percentage}%
                  </span>

                </div>

              </div>

            ))}

          </div>


          {/* =========================
              GUIDE
          ========================= */}

          <div className="complexity-guide">

            <h3>
              Complexity Level Guide
            </h3>


            <div className="guide-item simple">

              <div className="guide-icon">
                ▣
              </div>

              <div>
                <strong>Simple</strong>

                <p>
                  Easy to understand and execute
                </p>
              </div>

            </div>


            <div className="guide-item medium">

              <div className="guide-icon">
                ◇
              </div>

              <div>
                <strong>Medium</strong>

                <p>
                  Involves joins, grouping or
                  multiple filters
                </p>
              </div>

            </div>


            <div className="guide-item complex">

              <div className="guide-icon">
                ✣
              </div>

              <div>
                <strong>Complex</strong>

                <p>
                  Contains subqueries, nested
                  logic, or advanced SQL
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
};

export default Analytics;