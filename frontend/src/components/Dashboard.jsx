import { useState, useEffect } from "react";
import "../App.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/history"),
      ]);
      
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      
      setStats(statsData);
      setHistory(historyData);
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>⏳ Loading dashboard...</p>
      </div>
    );
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <h2>NO DATA YET</h2>
          <p style={{ fontSize: 12, color: "#FFFFFF" }}>COMPLETE INTERVIEWS TO SEE STATS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>DASHBOARD</h1>
        
        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">{stats.total_sessions}</div>
          </div>
          
          <div className="stat-card" style={{ background: stats.average_score >= 70 ? "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" : "linear-gradient(135deg, #fa8bff 0%, #2bd2ff 100%)" }}>
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{stats.average_score.toFixed(1)}</div>
          </div>
          
          <div className="stat-card" style={{ background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)", color: "#333" }}>
            <div className="stat-label" style={{ color: "#555" }}>Interview Types</div>
            <div className="stat-value" style={{ color: "#333" }}>{Object.keys(stats.average_by_type || {}).length}</div>
          </div>
        </div>

      {/* Average by Type */}
      {stats.average_by_type && Object.keys(stats.average_by_type).length > 0 && (
          <div style={{ marginBottom: 40 }}>
          <h2>AVG SCORES BY TYPE</h2>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {Object.entries(stats.average_by_type).map(([type, avg]) => (
              <div
                key={type}
                className="stat-card"
                style={{ minWidth: 200 }}
              >
                <div className="stat-label">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div className="stat-value">{avg.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {(stats.strengths?.length > 0 || stats.weaknesses?.length > 0) && (
        <div style={{ marginBottom: 40 }}>
          <h2>PERFORMANCE</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
              <h3 style={{ color: "#2ECC71", margin: "0 0 12px 0", fontSize: 14 }}>STRENGTHS</h3>
              {stats.strengths?.length > 0 ? (
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {stats.strengths.slice(0, 5).map((s, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <strong>Session {i + 1}:</strong> {s || "Strong performance in this area"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#999" }}>No highlights yet</p>
              )}
            </div>
            
            <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
              <h3 style={{ color: "#E67E22", margin: "0 0 12px 0", fontSize: 14 }}>IMPROVE</h3>
              {stats.weaknesses?.length > 0 ? (
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {stats.weaknesses.slice(0, 5).map((w, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <strong>Session {i + 1}:</strong> {w || "Could benefit from more practice"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#999" }}>No specific areas identified</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent History */}
      <div>
        <h2>RECENT HISTORY</h2>
        {history.length > 0 ? (
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>QUESTION</th>
                  <th>ANSWER</th>
                  <th>SCORE</th>
                  <th>FEEDBACK</th>
                </tr>
              </thead>
              <tbody>
                {history.map((session) => (
                  <tr key={session.id}>
                    <td>
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {session.type}
                    </td>
                    <td style={{ maxWidth: 300, wordBreak: "break-word" }}>
                      {session.question}
                    </td>
                    <td style={{ maxWidth: 300, wordBreak: "break-word" }}>
                      {session.user_answer || "No answer provided"}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold", color: session.score >= 70 ? "#2ecc71" : session.score >= 50 ? "#f39c12" : "#e74c3c" }}>
                      {session.score}%
                    </td>
                    <td style={{ maxWidth: 400 }}>
                      {session.feedback ? (
                        <pre style={{ 
                          background: "#f5f5f5", 
                          padding: 8, 
                          borderRadius: 8, 
                          fontSize: 11, 
                          margin: 0,
                          overflow: "auto",
                          maxHeight: 150,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word"
                        }}>
                          {session.feedback}
                        </pre>
                      ) : (
                        <span style={{ color: "#999" }}>No feedback</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#999" }}>No recent interviews</p>
        )}
      </div>
    </div>
  );
}
