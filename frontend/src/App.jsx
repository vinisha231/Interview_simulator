import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");

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
                .then(res => res.json())
                .then(data => {
                  if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    handleLogin(data.user);
                  }
                })
                .catch(err => console.error('Login failed:', err));
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
                .then(res => res.json())
                .then(data => {
                  if (data.id) {
                    alert('Registration successful! Please login.');
                    setAuthView("login");
                  }
                })
                .catch(err => console.error('Registration failed:', err));
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

  return (
    <div className="app">
      <div className="card">
        <h1>Welcome, {user.full_name || user.username}!</h1>
        <p>LLM Interview Simulator</p>
        
        <div className="nav">
          <button onClick={() => setView("interview")}>Interview</button>
          <button onClick={() => setView("dashboard")}>Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
        
        <div className="content">
          <h2>Interview Practice</h2>
          <p>Choose your interview type and start practicing!</p>
          
          <div className="interview-types">
            <button className="interview-btn">Technical Interview</button>
            <button className="interview-btn">Behavioral Interview</button>
          </div>
        </div>
      </div>
    </div>
  );
}
