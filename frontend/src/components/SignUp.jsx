import { useState } from "react";

export default function SignUp({ onSignup, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Signup failed");
      }

      const data = await res.json();
      alert("Account created successfully! Please login.");
      onSwitchToLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ maxWidth: 450, width: "100%" }}>
        <h2 style={{ marginBottom: 8, textAlign: "center" }}>✨ Sign Up</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 32 }}>Create your account to start practicing interviews!</p>
        
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label className="input-label">👤 Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
              placeholder="Enter your full name"
            />
          </div>

          <div className="input-group">
            <label className="input-label">🔑 Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="Choose a username"
            />
          </div>

          <div className="input-group">
            <label className="input-label">📧 Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="your@email.com"
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
              placeholder="Create a password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-secondary"
            style={{ width: "100%" }}
          >
            {loading ? "⏳ Creating account..." : "🎉 Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", color: "#666" }}>
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            style={{ background: "none", border: "none", color: "#667eea", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}
          >
            Login here 🔐
          </button>
        </p>
      </div>
    </div>
  );
}

