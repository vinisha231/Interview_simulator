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
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 40, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>Login</h2>
      
      {error && (
        <div style={{ padding: 12, background: "#fee", color: "red", borderRadius: 4, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 16, textAlign: "center" }}>
        Don't have an account?{" "}
        <button
          onClick={onSwitchToSignup}
          style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

