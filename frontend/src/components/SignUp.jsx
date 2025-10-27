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
        <h2 style={{ marginBottom: 16, textAlign: "center" }}>SIGN UP</h2>
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24, textAlign: "center", fontSize: 10 }}>
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label className="input-label">FULL NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
              placeholder="FULL NAME"
            />
          </div>

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
            <label className="input-label">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="EMAIL"
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
            className="btn-secondary"
            style={{ width: "100%" }}
          >
            {loading ? "CREATING..." : "SIGN UP"}
          </button>
        </form>

        <p style={{ marginTop: 32, textAlign: "center", color: "#FFFFFF", fontSize: 10 }}>
          HAVE ACCOUNT?{" "}
          <button
            onClick={onSwitchToLogin}
            style={{ background: "none", border: "none", color: "#3498DB", cursor: "pointer", textDecoration: "underline", fontFamily: "'Press Start 2P', cursive", fontSize: 10 }}
          >
            LOGIN
          </button>
        </p>
      </div>
    </div>
  );
}

