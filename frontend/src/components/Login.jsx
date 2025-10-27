import { useState } from "react";

export default function Login({ onLogin, onSwitchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ maxWidth: 450, width: "100%" }}>
        <h2 style={{ marginBottom: 8, textAlign: "center" }}>🔐 Login</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 32 }}>Welcome back! Please sign in to continue.</p>
        
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">👤 Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your username"
            />
          </div>

          <div className="input-group">
            <label className="input-label">🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? "⏳ Logging in..." : "🚀 Login"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", color: "#666" }}>
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            style={{ background: "none", border: "none", color: "#667eea", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}
          >
            Sign up here ✨
          </button>
        </p>
      </div>
    </div>
  );
}

