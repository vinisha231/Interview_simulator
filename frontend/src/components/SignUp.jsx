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
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 40, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>Sign Up</h2>
      
      {error && (
        <div style={{ padding: 12, background: "#fee", color: "red", borderRadius: 4, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
        </div>

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

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: 16, textAlign: "center" }}>
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
        >
          Login
        </button>
      </p>
    </div>
  );
}

