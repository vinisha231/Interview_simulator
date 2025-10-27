import { useState } from "react";
import Dashboard from "./Dashboard"; // <-- NEW import

export default function App() {
  const [view, setView] = useState("interview"); // <-- NEW state for switching
  const [type, setType] = useState("technical");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // ----------------- UI Starts Here -----------------
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Simple nav to switch views */}
      <nav style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
        <button onClick={() => setView("interview")}>Interview</button>
        <button onClick={() => setView("dashboard")}>Dashboard</button>
      </nav>

      {view === "interview" ? (
        <div style={{ maxWidth: 650, margin: "60px auto" }}>
          <h1>LLM Interview Simulator</h1>

          <div style={{ marginBottom: 16 }}>
            <label>
              Interview Type:{" "}
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
              </select>
            </label>
            <button
              onClick={getQuestion}
              disabled={loading}
              style={{ marginLeft: 12, padding: "6px 10px" }}
            >
              {loading ? "Loading..." : "Generate Question"}
            </button>
          </div>

          {question && (
            <div
              style={{
                marginBottom: 20,
                border: "1px solid #ddd",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <strong>Question:</strong>
              <p>{question}</p>
            </div>
          )}

          {question && (
            <>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                style={{ width: "100%", marginBottom: 12 }}
              />
              <button onClick={evaluateAnswer} disabled={loading || !answer.trim()}>
                {loading ? "Evaluating..." : "Submit Answer"}
              </button>
            </>
          )}

          {feedback && (
            <div
              style={{
                marginTop: 20,
                border: "1px solid #ddd",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <strong>Feedback:</strong>
              <pre>{JSON.stringify(feedback, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <Dashboard /> // <-- Show the charts when "Dashboard" view is active
      )}
    </div>
  );
}