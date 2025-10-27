import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/dashboard/history").then((r) => r.json())
    ])
      .then(([statsData, historyData]) => {
        statsData.history = historyData;
        setStats(statsData);
      })
      .catch((err) => console.error("Error fetching dashboard data:", err));
  }, []);
  if (!stats) return <p>Loading dashboard...</p>;

  const avgData = Object.entries(stats.average_by_type).map(([type, score]) => ({
    type,
    score,
  }));

  const COLORS = ["#4caf50", "#ff9800", "#2196f3", "#f44336"];

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "Inter, sans-serif" }}>
      <h2>Interview Performance Dashboard</h2>
      <p>Total Sessions: {stats.total_sessions}</p>
      <p>Average Score: <strong>{stats.average_score}</strong></p>

      <h3>Average Score by Type</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={avgData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="score" fill="#4caf50" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Strengths vs Weaknesses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={[
              { name: "Strengths", value: stats.strengths.length },
              { name: "Weaknesses", value: stats.weaknesses.length },
            ]}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {COLORS.map((color, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {}
      <h3 style={{ marginTop: 30 }}>Recent Sessions</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Date</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Type</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Score</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {stats.history && stats.history.map((s) => (
            <tr key={s.id}>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>
                {new Date(s.created_at).toLocaleString()}
              </td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>{s.type}</td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>{s.score}</td>
              <td style={{ border: "1px solid #ddd", padding: 8 }}>{s.feedback}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}