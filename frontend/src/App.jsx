import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import "./App.css";

export default function App() {
  const [authView, setAuthView] = useState("login"); // "login" or "signup"
  const [user, setUser] = useState(null);
  const [view, setView] = useState("interview"); // "interview" or "dashboard"
  const [type, setType] = useState("technical");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

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
    try {
      const response = await fetch(
        `http://localhost:8000/api/interview/generate-question?interview_type=${type}&difficulty=medium`
      );
      const data = await response.json();
      setQuestion(data.question);
      setCurrentQuestionIndex(0);
      setShowFeedback(false);
      setInterviewComplete(false);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/interview/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
          user_answer: answer,
          interview_type: type,
        }),
      });

      const data = await response.json();
      setFeedback(data.feedback);
      setScore(data.score);
      setShowFeedback(true);
      setInterviewComplete(true);

      // Save session to database
      await fetch("http://localhost:8000/api/sessions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interview_type: type,
          question: question,
          user_answer: answer,
          feedback: data.feedback,
          score: data.score,
        }),
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewInterview = () => {
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(0);
    setShowFeedback(false);
    setInterviewComplete(false);
    setCurrentQuestionIndex(0);
  };

  // Show login/signup if not authenticated
  if (!user) {
    return authView === "login" ? (
      <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthView("signup")} />
    ) : (
      <SignUp onSignup={handleLogin} onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  // Show feedback screen if interview is complete
  if (interviewComplete && showFeedback) {
    return (
      <div className="app-container">
        <nav className="nav-bar">
          <div className="nav-buttons">
            <button
              className={`nav-btn ${view === "interview" ? "active" : ""}`}
              onClick={() => setView("interview")}
            >
              Interview
            </button>
            <button
              className={`nav-btn ${view === "dashboard" ? "active" : ""}`}
              onClick={() => setView("dashboard")}
            >
              Dashboard
            </button>
          </div>
          <div className="user-info">
            <span className="welcome-text">Welcome {user.username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </nav>

        <div className="container">
          <div className="card" style={{ width: '99vw', height: '99vh' }}>
            <div className="feedback-complete">
              <h1>🎉 Interview Complete!</h1>
              <div className="score-display">
                <div className="score-number">{score}%</div>
                <div className="score-label">Overall Score</div>
              </div>
              
              <div className="feedback-section">
                <h2>📝 Detailed Feedback</h2>
                <div className="feedback-box">
                  <strong>AI Evaluation:</strong>
                  <pre>{feedback}</pre>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn-primary" onClick={startNewInterview}>
                  Practice Another Interview
                </button>
                <button className="btn-secondary" onClick={() => setView("dashboard")}>
                  View Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-buttons">
          <button
            className={`nav-btn ${view === "interview" ? "active" : ""}`}
            onClick={() => setView("interview")}
          >
            Interview
          </button>
          <button
            className={`nav-btn ${view === "dashboard" ? "active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
        </div>
        <div className="user-info">
          <span className="welcome-text">Welcome {user.username}</span>
          <button className="logout-btn" onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      </nav>

      {view === "interview" ? (
        <div className="container">
          <div className="card" style={{ width: '99vw', height: '99vh' }}>
            <h1>Interview Simulator</h1>

            {/* Progress Indicator */}
            {question && (
              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">
                    Question {currentQuestionIndex + 1} of 1
                  </span>
                  <span className="interview-type">
                    {type === 'technical' ? 'Technical' : 'Behavioral'} Interview
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

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
                <strong>QUESTION:</strong>
                <p>{question}</p>
              </div>
            )}

            {question && (
              <div style={{ marginBottom: 24 }}>
                <label className="input-label">YOUR ANSWER:</label>
                <textarea
                  className="form-input"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="TYPE YOUR ANSWER..."
                  rows={8}
                />
              </div>
            )}

            {question && (
              <button
                className="btn-secondary"
                onClick={submitAnswer}
                disabled={loading || !answer.trim()}
              >
                {loading ? "PROCESSING..." : "SUBMIT ANSWER"}
              </button>
            )}

            {/* Interview Tips */}
            {question && (
              <div className="tips-section">
                <h3>💡 Tips for this question:</h3>
                <ul className="tips-list">
                  {type === 'technical' ? (
                    <>
                      <li>• Start with a clear definition</li>
                      <li>• Use concrete examples</li>
                      <li>• Discuss time and space complexity</li>
                      <li>• Consider edge cases</li>
                    </>
                  ) : (
                    <>
                      <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                      <li>• Be specific about your role</li>
                      <li>• Highlight what you learned</li>
                      <li>• Show impact and outcomes</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {loading && <div className="loading">PROCESSING...</div>}
          </div>
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}