import { useState, useEffect, useRef } from "react";
import "./App.css";
import TechnicalInterviewBox from './interviewBox';

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [currentView, setCurrentView] = useState("interview");
  const [interviewType, setInterviewType] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  
  useEffect(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const speechToText = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setUserAnswer(speechToText);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }
}, []);

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentView("interview");
    setInterviewType(null);
    setRole("");
    setCompany("");
    setCurrentQuestion("");
    setUserAnswer("");
    setFeedback("");
    setScore(null);
  };

  const startInterview = async (type) => {
    if (!role.trim()) {
      alert("Please enter a role to practice for.");
      return;
    }
    setIsLoading(true);
    setInterviewType(type);
    
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        interview_type: type,
        difficulty: "medium",
        role: role.trim()
      });
      if (company.trim()) {
        params.set("company", company.trim());
      }
      const response = await fetch(`/api/interview/generate-question?${params.toString()}`, {
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
            role: role.trim(),
            company: company.trim() || null,
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
      const params = new URLSearchParams({
        interview_type: interviewType,
        difficulty: "medium",
        role: role.trim()
      });
      if (company.trim()) {
        params.set("company", company.trim());
      }
      const response = await fetch(`/api/interview/generate-question?${params.toString()}`, {
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

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch statistics
      const statsResponse = await fetch("/api/dashboard/stats", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch history
      const historyResponse = await fetch("/api/dashboard/history", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.ok && historyResponse.ok) {
        const stats = await statsResponse.json();
        const history = await historyResponse.json();
        
        setDashboardData({
          stats,
          history
        });
      } else {
        console.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDashboardLoading(false);
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
                const body = new URLSearchParams({
                  username: String(username || "").trim(),
                  password: String(password || "")
                }).toString();
                
                fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body
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
          <p>Enter your role and choose an interview type to start practicing.</p>
          
          <div className="role-inputs">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (e.g., Software Engineer)"
              disabled={isLoading}
              required
            />
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (optional)"
              disabled={isLoading}
            />
          </div>
          
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
          <div className="question-meta">
            <span className="meta-pill">{role || "Role"}</span>
            {company && <span className="meta-pill">{company}</span>}
            <span className="meta-pill">{interviewType}</span>
          </div>
          <div className="question-box">
            <p>{currentQuestion}</p>
          </div>
        </div>

        {!feedback && ( 
          <TechnicalInterviewBox
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            submitAnswer={submitAnswer}
            isListening={isListening}
            setIsListening={setIsListening}
            recognitionRef={recognitionRef}
            isLoading={isLoading}
            isTechnical={interviewType === "technical"}
          />
        )}
        {feedback && (
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
    if (dashboardLoading) {
      return (
        <div className="content">
          <h2>Dashboard</h2>
          <p>Loading your interview data...</p>
        </div>
      );
    }

    if (!dashboardData) {
      return (
        <div className="content">
          <h2>Dashboard</h2>
          <p>Your interview progress and statistics</p>
          <button onClick={fetchDashboardData} className="load-dashboard-btn">
            Load Dashboard Data
          </button>
        </div>
      );
    }

    const { stats, history } = dashboardData;

    return (
      <div className="content">
        <h2>Dashboard</h2>
        <p>Your interview progress and statistics</p>
        
        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Interviews</h3>
            <div className="stat-number">{stats.total_interviews || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Score</h3>
            <div className="stat-number">{stats.total_score || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Behavioral Total</h3>
            <div className="stat-number">{stats.total_behavioral_score || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Technical Total</h3>
            <div className="stat-number">{stats.total_technical_score || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Average Score</h3>
            <div className="stat-number">{stats.average_score || 0}%</div>
          </div>
          <div className="stat-card">
            <h3>Best Score</h3>
            <div className="stat-number">{stats.best_score || 0}%</div>
          </div>
        </div>

        <div className="dashboard-highlights">
          <div className="highlight-card">
            <h3>Latest Interview</h3>
            <p>
              {stats.last_interview_at
                ? new Date(stats.last_interview_at).toLocaleString()
                : "No interviews yet"}
            </p>
          </div>
          <div className="highlight-card">
            <h3>Latest Role</h3>
            <p>{stats.last_role || "—"}</p>
          </div>
          <div className="highlight-card">
            <h3>Latest Company</h3>
            <p>{stats.last_company || "—"}</p>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="strengths-weaknesses">
          <div className="strengths">
            <h3>Strengths</h3>
            <ul>
              {stats.strengths && stats.strengths.length > 0 ? (
                stats.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))
              ) : (
                <li>Complete more interviews to see your strengths</li>
              )}
            </ul>
          </div>
          <div className="weaknesses">
            <h3>Areas for Improvement</h3>
            <ul>
              {stats.weaknesses && stats.weaknesses.length > 0 ? (
                stats.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))
              ) : (
                <li>Complete more interviews to see areas for improvement</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recent Interview History */}
        <div className="history-section">
          <h3>Recent Interview History</h3>
          {history && history.length > 0 ? (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Question</th>
                    <th>Your Answer</th>
                    <th>Score</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((session) => (
                    <tr key={session.id}>
                      <td>{new Date(session.created_at).toLocaleDateString()}</td>
                      <td className="type-cell">{session.type}</td>
                      <td className="role-cell">{session.role || "—"}</td>
                      <td className="company-cell">{session.company || "—"}</td>
                      <td className="question-cell">{session.question}</td>
                      <td className="answer-cell">{session.user_answer || "No answer provided"}</td>
                      <td className={`score-cell ${session.score >= 70 ? 'good' : session.score >= 50 ? 'medium' : 'poor'}`}>
                        {session.score}%
                      </td>
                      <td className="feedback-cell">
                        {session.feedback ? (
                          <div className="feedback-preview">
                            {session.feedback.length > 100 
                              ? `${session.feedback.substring(0, 100)}...` 
                              : session.feedback
                            }
                          </div>
                        ) : (
                          <span className="no-feedback">No feedback</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-history">
              <p>No interview history yet. Start practicing to see your progress!</p>
            </div>
          )}
        </div>

        <button onClick={fetchDashboardData} className="refresh-btn">
          Refresh Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="theme-toggle">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="toggle-btn"
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
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
