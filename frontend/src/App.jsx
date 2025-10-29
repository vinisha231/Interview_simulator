import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [currentView, setCurrentView] = useState("interview");
  const [interviewType, setInterviewType] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setCurrentView("interview");
    setInterviewType(null);
    setCurrentQuestion("");
    setUserAnswer("");
    setFeedback("");
    setScore(null);
  };

  const startInterview = async (type) => {
    setIsLoading(true);
    setInterviewType(type);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interview/generate-question?interview_type=${type}&difficulty=medium`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion(data.question);
      } else {
        alert("Failed to generate question. Please try again.");
      }
    } catch (error) {
      console.error("Error generating question:", error);
      alert("Error generating question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: currentQuestion,
          user_answer: userAnswer,
          interview_type: interviewType
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
        setScore(data.score);
        
        // Save session to backend
        await fetch("/api/sessions/", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            interview_type: interviewType,
            question: currentQuestion,
            user_answer: userAnswer,
            feedback: data.feedback,
            score: data.score
          })
        });
      } else {
        alert("Failed to evaluate answer. Please try again.");
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
      alert("Error evaluating answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = async () => {
    setIsLoading(true);
    setUserAnswer("");
    setFeedback("");
    setScore(null);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interview/generate-question?interview_type=${interviewType}&difficulty=medium`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion(data.question);
      } else {
        alert("Failed to generate next question. Please try again.");
      }
    } catch (error) {
      console.error("Error generating next question:", error);
      alert("Error generating next question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="app">
        <div className="card">
          <h1>LLM Interview Simulator</h1>
          <p>Practice interviews with AI-powered feedback</p>
          
          {authView === "login" ? (
            <div>
              <h2>Login</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const username = formData.get('username');
                const password = formData.get('password');
                
                fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: `username=${username}&password=${password}`
                })
                .then(res => {
                  if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                  }
                  return res.json();
                })
                .then(data => {
                  if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    handleLogin(data.user);
                  } else {
                    alert('Login failed: Invalid response from server');
                  }
                })
                .catch(err => {
                  console.error('Login failed:', err);
                  alert('Login failed: ' + err.message);
                });
              }}>
                <input name="username" placeholder="Username" required />
                <input name="password" type="password" placeholder="Password" required />
                <button type="submit">Login</button>
              </form>
              <button onClick={() => setAuthView("signup")}>Switch to Sign Up</button>
            </div>
          ) : (
            <div>
              <h2>Sign Up</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const userData = {
                  username: formData.get('username'),
                  email: formData.get('email'),
                  password: formData.get('password'),
                  full_name: formData.get('full_name')
                };
                
                fetch('/api/auth/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(userData)
                })
                .then(res => {
                  if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                  }
                  return res.json();
                })
                .then(data => {
                  if (data.id) {
                    alert('Registration successful! Please login.');
                    setAuthView("login");
                  } else {
                    alert('Registration failed: Invalid response from server');
                  }
                })
                .catch(err => {
                  console.error('Registration failed:', err);
                  alert('Registration failed: ' + err.message);
                });
              }}>
                <input name="full_name" placeholder="Full Name" required />
                <input name="username" placeholder="Username" required />
                <input name="email" type="email" placeholder="Email" required />
                <input name="password" type="password" placeholder="Password" required />
                <button type="submit">Sign Up</button>
              </form>
              <button onClick={() => setAuthView("login")}>Switch to Login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderInterviewView = () => {
    if (!interviewType) {
      return (
        <div className="content">
          <h2>Interview Practice</h2>
          <p>Choose your interview type and start practicing!</p>
          
          <div className="interview-types">
            <button 
              className="interview-btn" 
              onClick={() => startInterview("technical")}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Technical Interview"}
            </button>
            <button 
              className="interview-btn" 
              onClick={() => startInterview("behavioral")}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Behavioral Interview"}
            </button>
          </div>
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="content">
          <h2>Loading Question...</h2>
          <p>Please wait while we generate your {interviewType} interview question.</p>
        </div>
      );
    }

    return (
      <div className="content">
        <h2>{interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview</h2>
        
        <div className="question-section">
          <h3>Question:</h3>
          <div className="question-box">
            <p>{currentQuestion}</p>
          </div>
        </div>

        {!feedback ? (
          <div className="answer-section">
            <h3>Your Answer:</h3>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              disabled={isLoading}
            />
            <button 
              onClick={submitAnswer}
              disabled={isLoading || !userAnswer.trim()}
              className="submit-btn"
            >
              {isLoading ? "Evaluating..." : "Submit Answer"}
            </button>
          </div>
        ) : (
          <div className="feedback-section">
            <h3>Feedback & Score:</h3>
            <div className="score-display">
              <span className="score">Score: {score}%</span>
            </div>
            <div className="feedback-box">
              <p>{feedback}</p>
            </div>
            <div className="feedback-actions">
              <button onClick={nextQuestion} disabled={isLoading} className="next-btn">
                {isLoading ? "Loading..." : "Next Question"}
              </button>
              <button onClick={() => {
                setInterviewType(null);
                setCurrentQuestion("");
                setUserAnswer("");
                setFeedback("");
                setScore(null);
              }} className="back-btn">
                Back to Interview Types
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDashboardView = () => {
    return (
      <div className="content">
        <h2>Dashboard</h2>
        <p>Your interview progress and statistics will appear here.</p>
        <div className="dashboard-placeholder">
          <p>Dashboard features coming soon!</p>
          <p>This will show your interview history, scores, and progress over time.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="card">
        <h1>Welcome, {user.full_name || user.username}!</h1>
        <p>LLM Interview Simulator</p>
        
        <div className="nav">
          <button 
            onClick={() => setCurrentView("interview")}
            className={currentView === "interview" ? "active" : ""}
          >
            Interview
          </button>
          <button 
            onClick={() => setCurrentView("dashboard")}
            className={currentView === "dashboard" ? "active" : ""}
          >
            Dashboard
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
        
        {currentView === "interview" ? renderInterviewView() : renderDashboardView()}
      </div>
    </div>
  );
}
