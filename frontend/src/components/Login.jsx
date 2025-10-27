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
        <h2 style={{ marginBottom: 16, textAlign: "center" }}>LOGIN</h2>
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24, textAlign: "center", fontSize: 10 }}>
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="USERNAME"
            />
          </div>

          <div className="input-group">
            <label className="input-label">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="PASSWORD"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <p style={{ marginTop: 32, textAlign: "center", color: "#FFFFFF", fontSize: 10 }}>
          NO ACCOUNT?{" "}
          <button
            onClick={onSwitchToSignup}
            style={{ background: "none", border: "none", color: "#3498DB", cursor: "pointer", textDecoration: "underline", fontFamily: "'Press Start 2P', cursive", fontSize: 10 }}
          >
            SIGN UP
          </button>
        </p>
      </div>
    </div>
  );
}

