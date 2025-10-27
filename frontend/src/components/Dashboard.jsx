import { useState, useEffect } from "react";

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
      <div style={{ textAlign: "center", padding: 40 }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <h2>No interview data yet</h2>
        <p>Complete some interviews to see your stats here!</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "20px auto", padding: 20 }}>
      <h1>Interview Dashboard</h1>
      
      {/* Stats Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginBottom: 40 }}>
        <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>Total Sessions</h3>
          <p style={{ fontSize: 32, margin: 0, fontWeight: "bold" }}>{stats.total_sessions}</p>
        </div>
        
        <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>Average Score</h3>
          <p style={{ fontSize: 32, margin: 0, fontWeight: "bold", color: stats.average_score >= 70 ? "green" : "orange" }}>
            {stats.average_score.toFixed(1)}
          </p>
        </div>
        
        <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>Interview Types</h3>
          <p style={{ fontSize: 32, margin: 0, fontWeight: "bold" }}>
            {Object.keys(stats.average_by_type || {}).length}
          </p>
        </div>
      </div>

      {/* Average by Type */}
      {stats.average_by_type && Object.keys(stats.average_by_type).length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2>Average Scores by Type</h2>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {Object.entries(stats.average_by_type).map(([type, avg]) => (
              <div
                key={type}
                style={{
                  border: "1px solid #ddd",
                  padding: 16,
                  borderRadius: 8,
                  flex: "1 1 200px",
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", textTransform: "capitalize" }}>{type}</h3>
                <p style={{ fontSize: 24, margin: 0, fontWeight: "bold" }}>
                  {avg.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {(stats.strengths?.length > 0 || stats.weaknesses?.length > 0) && (
        <div style={{ marginBottom: 40 }}>
          <h2>Performance Insights</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
              <h3 style={{ color: "green", margin: "0 0 12px 0" }}>Strengths</h3>
              {stats.strengths?.length > 0 ? (
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {stats.strengths.slice(0, 5).map((s, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      {s || "Strong performance in this area"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#999" }}>No highlights yet</p>
              )}
            </div>
            
            <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
              <h3 style={{ color: "orange", margin: "0 0 12px 0" }}>Areas for Improvement</h3>
              {stats.weaknesses?.length > 0 ? (
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {stats.weaknesses.slice(0, 5).map((w, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      {w || "Could benefit from more practice"}
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
        <h2>Recent History</h2>
        {history.length > 0 ? (
          <div>
            {history.map((session) => (
              <div
                key={session.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <strong style={{ textTransform: "capitalize" }}>{session.type}</strong>
                    <span style={{ marginLeft: 12, color: "#666", fontSize: 14 }}>
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: session.score >= 70 ? "green" : session.score >= 50 ? "orange" : "red" }}>
                    {session.score}%
                  </div>
                </div>
                <p style={{ margin: "8px 0", color: "#666" }}>
                  <strong>Q:</strong> {session.question}
                </p>
                {session.feedback && (
                  <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>
                    <strong>Feedback:</strong> {session.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No recent interviews</p>
        )}
      </div>
    </div>
  );
}
