import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import "./App.css";

export default function App() {
  const [authView, setAuthView] = useState("login"); // "login" or "signup"
  const [user, setUser] = useState(null);
  const [view, setView] = useState("interview");
  const [type, setType] = useState("technical");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setView("interview");
  };

  const getQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/interview/generate-question?interview_type=${type}`);
      const data = await res.json();
      setQuestion(data.question);
    } catch (e) {
      console.error(e);
      alert("Error generating question.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          user_answer: answer,
          interview_type: type,
        }),
      });
      const data = await res.json();
      setFeedback(data);
      
      // Save to database
      await fetch("/api/sessions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_type: type,
          question: question,
          user_answer: answer,
          feedback: data.feedback,
          score: data.score,
        }),
      });
    } catch (e) {
      console.error(e);
      alert("Error evaluating answer.");
    } finally {
      setLoading(false);
    }
  };

  // Show login/signup if not authenticated
  if (!user) {
    return authView === "login" ? (
      <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthView("signup")} />
    ) : (
      <SignUp onSignup={handleLogin} onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  // ----------------- UI Starts Here -----------------
  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-buttons">
          <button className="nav-btn" onClick={() => setView("interview")}>
            INTERVIEW
          </button>
          <button className="nav-btn" onClick={() => setView("dashboard")}>
            DASHBOARD
          </button>
        </div>
        <div className="user-info">
          <span className="welcome-text">WELCOME {user.username.toUpperCase()}</span>
          <button className="logout-btn" onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      </nav>

      {view === "interview" ? (
        <div className="container">
          <div className="card">
            <h1>INTERVIEW SIMULATOR</h1>

            <div style={{ marginBottom: 32, display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
              <label className="input-label" style={{ marginBottom: 0 }}>
                TYPE:
              </label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="form-input"
                style={{ width: "auto", marginRight: 12 }}
              >
                <option value="technical">TECHNICAL</option>
                <option value="behavioral">BEHAVIORAL</option>
              </select>
              <button
                className="btn-primary"
                onClick={getQuestion}
                disabled={loading}
              >
                {loading ? "LOADING..." : "GENERATE Q"}
              </button>
            </div>

            {question && (
              <div className="question-box">
                <strong style={{ display: "block", marginBottom: 12 }}>
                  QUESTION:
                </strong>
                <p>{question}</p>
              </div>
            )}

            {question && (
              <>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="TYPE YOUR ANSWER..."
                  rows={8}
                  className="form-input"
                  style={{ width: "100%", marginBottom: 20, fontFamily: "inherit", resize: "vertical" }}
                />
                <button 
                  className="btn-secondary"
                  onClick={evaluateAnswer} 
                  disabled={loading || !answer.trim()}
                  style={{ width: "100%" }}
                >
                  {loading ? "EVALUATING..." : "SUBMIT ANSWER"}
                </button>
              </>
            )}

            {feedback && (
              <div className="feedback-box">
                <strong style={{ display: "block", marginBottom: 16 }}>
                  FEEDBACK:
                </strong>
                <pre style={{ 
                  background: "#2C3E50", 
                  padding: 16, 
                  color: "#FFFFFF",
                  overflow: "auto",
                  maxHeight: 300,
                  fontSize: 8,
                  lineHeight: "1.6"
                }}>
                  {JSON.stringify(feedback, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}