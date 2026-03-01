import { useState, useEffect, useRef } from "react";
import "./App.css";
import TechnicalInterviewBox from './interviewBox';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const apiUrl = (path) => `${API_BASE_URL}${path}`;

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [loginPrefill, setLoginPrefill] = useState(null);
  const [currentView, setCurrentView] = useState("interview");
  const [interviewType, setInterviewType] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("Python");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [conversation, setConversation] = useState([]);
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [followupFeedback, setFollowupFeedback] = useState("");
  const [followupScore, setFollowupScore] = useState(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [draft, setDraft] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Timed interview state
  const [showTimedSetup, setShowTimedSetup] = useState(false);
  const [showTimedConfirmModal, setShowTimedConfirmModal] = useState(false);
  const [timedSessionLengthPreset, setTimedSessionLengthPreset] = useState("15"); // "5"|"15"|"30"|"45"|"60"|"custom"
  const [timedCustomHours, setTimedCustomHours] = useState(0);
  const [timedCustomMinutes, setTimedCustomMinutes] = useState(15);
  const [timingModel, setTimingModel] = useState("whole_and_per_question"); // "whole_only" | "whole_and_per_question"
  const [timedSessionActive, setTimedSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds left (null when not running)
  const [timedQuestionIndex, setTimedQuestionIndex] = useState(0);
  const [timedTimePerQuestion, setTimedTimePerQuestion] = useState([]); // seconds spent per question
  const [timedQuestionStartAt, setTimedQuestionStartAt] = useState(null); // Date.now() when current question shown
  const [timedResponses, setTimedResponses] = useState([]); // { question, userAnswer, feedback, score, timeSpentSeconds }
  const [timedSessionSummary, setTimedSessionSummary] = useState(null); // set when session ends
  const [timedSessionDurationSeconds, setTimedSessionDurationSeconds] = useState(null);
  const timerIntervalRef = useRef(null);
  const TIMED_QUESTIONS_COUNT = 5;
  const [timedInterviewType, setTimedInterviewType] = useState("technical");
  const timedStateRef = useRef({ userAnswer: "", currentQuestion: "", timedResponses: [], interviewType: null, role: "", company: "", difficulty: "", sessionNotes: "", timedSessionDurationSeconds: null, timedQuestionStartAt: null });
  timedStateRef.current = {
    userAnswer,
    currentQuestion,
    timedResponses,
    interviewType,
    role,
    company,
    difficulty,
    sessionNotes,
    timedSessionDurationSeconds,
    timedQuestionStartAt,
  };

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
      const results = Array.from(event.results);
      const last = results[results.length - 1];
      if (last.isFinal) {
        const speechToText = results.map(r => r[0].transcript).join('').trim();
        if (speechToText) {
          setUserAnswer(prev => (prev ? prev + " " : "") + speechToText);
        }
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }
}, []);

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const saved = localStorage.getItem("interviewDraft");
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch {
        setDraft(null);
      }
    } else {
      setDraft(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!interviewType && !currentQuestion) {
      return;
    }
    const payload = {
      interviewType,
      role,
      company,
      difficulty,
      currentQuestion,
      userAnswer,
      conversation,
      followupQuestion,
      followupAnswer,
      followupFeedback,
      followupScore,
      sessionNotes,
      feedback,
      score
    };
    localStorage.setItem("interviewDraft", JSON.stringify(payload));
  }, [
    user,
    interviewType,
    role,
    company,
    difficulty,
    currentQuestion,
    userAnswer,
    conversation,
    followupQuestion,
    followupAnswer,
    followupFeedback,
    followupScore,
    sessionNotes,
    feedback,
    score
  ]);

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
    setDifficulty("medium");
    setCurrentQuestion("");
    setUserAnswer("");
    setConversation([]);
    setFollowupQuestion("");
    setFollowupAnswer("");
    setFollowupFeedback("");
    setFollowupScore(null);
    setSessionNotes("");
    setFeedback("");
    setScore(null);
    setDashboardData(null);
    setDashboardError("");
    localStorage.removeItem("interviewDraft");
  };

  const resetInterview = () => {
    setInterviewType(null);
    setCurrentQuestion("");
    setUserAnswer("");
    setConversation([]);
    setFollowupQuestion("");
    setFollowupAnswer("");
    setFollowupFeedback("");
    setFollowupScore(null);
    setSessionNotes("");
    setFeedback("");
    setScore(null);
    localStorage.removeItem("interviewDraft");
  };

  const resumeDraft = () => {
    if (!draft) {
      return;
    }
    setInterviewType(draft.interviewType || null);
    setRole(draft.role || "");
    setCompany(draft.company || "");
    setDifficulty(draft.difficulty || "medium");
    setCurrentQuestion(draft.currentQuestion || "");
    setUserAnswer(draft.userAnswer || "");
    setConversation(draft.conversation || []);
    setFollowupQuestion(draft.followupQuestion || "");
    setFollowupAnswer(draft.followupAnswer || "");
    setFollowupFeedback(draft.followupFeedback || "");
    setFollowupScore(draft.followupScore ?? null);
    setSessionNotes(draft.sessionNotes || "");
    setFeedback(draft.feedback || "");
    setScore(draft.score ?? null);
    setDraft(null);
    setCurrentView("interview");
  };

  const discardDraft = () => {
    localStorage.removeItem("interviewDraft");
    setDraft(null);
  };

  const startInterview = async (type) => {
    if (!role.trim()) {
      alert("Please enter a role to practice for.");
      return;
    }
    setIsLoading(true);
    setInterviewType(type);
    setConversation([]);
    setFollowupQuestion("");
    setFollowupAnswer("");
    setFollowupFeedback("");
    setFollowupScore(null);
    setSessionNotes("");
    
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        interview_type: type,
        difficulty,
        role: role.trim()
      });
      if (company.trim()) params.set("company", company.trim());
      if (type === "technical" && language) params.set("language", language);
      const response = await fetch(apiUrl(`/api/interview/generate-question?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setCurrentQuestion(data.question);
      } else {
        const msg = data?.detail;
        const text = typeof msg === "string" ? msg : (Array.isArray(msg) && msg[0]?.msg) ? msg[0].msg : "Failed to generate question.";
        alert("Failed to generate question: " + text);
      }
    } catch (error) {
      console.error("Error generating question:", error);
      alert("Error generating question: " + (error.message || "Check console and ensure backend is running on port 8000."));
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
      const response = await fetch(apiUrl("/api/interview/evaluate"), {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: currentQuestion,
          user_answer: userAnswer,
          interview_type: interviewType,
          role: role.trim(),
          company: company.trim() || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
        setScore(data.score);
        setConversation((prev) => [
          ...prev,
          { question: currentQuestion, answer: userAnswer }
        ]);
        setFollowupQuestion("");
        setFollowupAnswer("");
        setFollowupFeedback("");
        setFollowupScore(null);

        if (interviewType === "behavioral" || interviewType === "design") {
          try {
            const followupResponse = await fetch(apiUrl("/api/interview/followup"), {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                question: currentQuestion,
                user_answer: userAnswer,
                interview_type: interviewType,
                role: role.trim(),
                company: company.trim() || null,
                history: [...conversation, { question: currentQuestion, answer: userAnswer }]
              })
            });
            if (followupResponse.ok) {
              const followupData = await followupResponse.json();
              setFollowupQuestion(followupData.question || "");
            }
          } catch (followupError) {
            console.error("Error generating follow-up question:", followupError);
          }
        }
        
        // Save session to backend
        await fetch(apiUrl("/api/sessions/"), {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            interview_type: interviewType,
            role: role.trim(),
            company: company.trim() || null,
            difficulty,
            question: currentQuestion,
            user_answer: userAnswer,
            feedback: data.feedback,
            score: data.score,
            strength_highlight: data.strength_highlight || null,
            notes: sessionNotes.trim() || null
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
    const lastEntry = conversation[conversation.length - 1];
    const lastQuestion = lastEntry?.question || currentQuestion;
    const lastAnswer = lastEntry?.answer || userAnswer;
    setIsLoading(true);
    setFeedback("");
    setScore(null);
    setFollowupQuestion("");
    setFollowupAnswer("");
    setFollowupFeedback("");
    setFollowupScore(null);
    
    try {
      const token = localStorage.getItem("token");
      let response;
      if (interviewType === "behavioral") {
        response = await fetch(apiUrl("/api/interview/followup"), {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            question: lastQuestion,
            user_answer: lastAnswer,
            interview_type: interviewType,
            role: role.trim(),
            company: company.trim() || null,
            history: conversation
          })
        });
      } else {
        const params = new URLSearchParams({
          interview_type: interviewType,
          difficulty,
          role: role.trim()
        });
        if (company.trim()) params.set("company", company.trim());
        if (interviewType === "technical" && language) params.set("language", language);
        response = await fetch(apiUrl(`/api/interview/generate-question?${params.toString()}`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion(data.question);
        setUserAnswer("");
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

  const submitFollowupAnswer = async () => {
    if (!followupAnswer.trim()) {
      alert("Please provide an answer to the follow-up question.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/interview/evaluate"), {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: followupQuestion,
          user_answer: followupAnswer,
          interview_type: interviewType,
          role: role.trim(),
          company: company.trim() || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFollowupFeedback(data.feedback);
        setFollowupScore(data.score);
        setConversation((prev) => [
          ...prev,
          { question: followupQuestion, answer: followupAnswer }
        ]);

        await fetch(apiUrl("/api/sessions/"), {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            interview_type: interviewType,
            role: role.trim(),
            company: company.trim() || null,
            difficulty,
            question: followupQuestion,
            user_answer: followupAnswer,
            feedback: data.feedback,
            score: data.score,
            strength_highlight: data.strength_highlight || null,
            notes: sessionNotes.trim() || null
          })
        });
      } else {
        alert("Failed to evaluate follow-up answer. Please try again.");
      }
    } catch (error) {
      console.error("Error evaluating follow-up answer:", error);
      alert("Error evaluating follow-up answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setDashboardError("Please log in to load dashboard data.");
        setDashboardLoading(false);
        return;
      }
      
      // Fetch statistics
      const statsResponse = await fetch(apiUrl("/api/dashboard/stats"), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch history
      const historyResponse = await fetch(apiUrl("/api/dashboard/history"), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.status === 401 || historyResponse.status === 401) {
        setDashboardError("Session expired. Please log in again.");
        handleLogout();
        return;
      }

      if (statsResponse.ok && historyResponse.ok) {
        const stats = await statsResponse.json();
        const history = await historyResponse.json();
        
        setDashboardData({
          stats,
          history
        });
      } else {
        setDashboardError("Failed to fetch dashboard data.");
        console.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      setDashboardError("Error fetching dashboard data.");
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "dashboard" && user) {
      fetchDashboardData();
    }
  }, [currentView, user]);

  // Compute timed session duration in seconds (for preset or custom)
  const getTimedDurationSeconds = () => {
    if (timedSessionLengthPreset === "custom") {
      return timedCustomHours * 3600 + timedCustomMinutes * 60;
    }
    return parseInt(timedSessionLengthPreset || "15", 10) * 60;
  };

  // Timer interval: decrement every second; at 0 trigger time-up
  useEffect(() => {
    if (!timedSessionActive || timeRemaining === null || timeRemaining <= 0) {
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev == null || prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timedSessionActive]);

  const timedTimeUpHandledRef = useRef(false);
  // When time hits 0: auto-submit and end session (use refs for current values)
  useEffect(() => {
    if (!timedSessionActive || timeRemaining !== 0) return;
    if (timedTimeUpHandledRef.current) return;
    timedTimeUpHandledRef.current = true;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const ref = timedStateRef.current;
    const answerToSubmit = (ref.userAnswer || "").trim();
    const questionStart = ref.timedQuestionStartAt != null ? ref.timedQuestionStartAt : Date.now();
    const timeSpentThisQuestion = Math.round((Date.now() - questionStart) / 1000);
    (async () => {
      let finalResponses = [...ref.timedResponses];
      if (ref.currentQuestion && answerToSubmit) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem("token");
          const evalRes = await fetch(apiUrl("/api/interview/evaluate"), {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              question: ref.currentQuestion,
              user_answer: answerToSubmit,
              interview_type: ref.interviewType,
              role: (ref.role || "").trim(),
              company: (ref.company || "").trim() || null,
            }),
          });
          if (evalRes.ok) {
            const data = await evalRes.json();
            finalResponses = [
              ...ref.timedResponses,
              {
                question: ref.currentQuestion,
                userAnswer: answerToSubmit,
                feedback: data.feedback,
                score: data.score,
                timeSpentSeconds: timeSpentThisQuestion,
              },
            ];
            await fetch(apiUrl("/api/sessions/"), {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                interview_type: ref.interviewType,
                role: (ref.role || "").trim(),
                company: (ref.company || "").trim() || null,
                difficulty: ref.difficulty,
                question: ref.currentQuestion,
                user_answer: answerToSubmit,
                feedback: data.feedback,
                score: data.score,
                strength_highlight: data.strength_highlight || null,
                notes: (ref.sessionNotes || "").trim() || null,
                time_spent_seconds: timeSpentThisQuestion,
                session_total_seconds: ref.timedSessionDurationSeconds,
              }),
            });
          } else {
            finalResponses = [
              ...ref.timedResponses,
              {
                question: ref.currentQuestion,
                userAnswer: answerToSubmit,
                feedback: "Time expired — not evaluated.",
                score: null,
                timeSpentSeconds: timeSpentThisQuestion,
              },
            ];
          }
        } catch (e) {
          console.error(e);
          finalResponses = [
            ...ref.timedResponses,
            {
              question: ref.currentQuestion,
              userAnswer: answerToSubmit,
              feedback: "Time expired — error evaluating.",
              score: null,
              timeSpentSeconds: timeSpentThisQuestion,
            },
          ];
        } finally {
          setIsLoading(false);
        }
      }
      const withScores = finalResponses.filter((r) => r.score != null);
      const totalScore =
        withScores.length > 0
          ? Math.round(withScores.reduce((a, r) => a + (r.score ?? 0), 0) / withScores.length)
          : null;
      setTimedSessionSummary({
        responses: finalResponses,
        totalScore,
        timeExpired: true,
      });
      setTimedSessionActive(false);
      setTimeRemaining(null);
    })();
  }, [timedSessionActive, timeRemaining]);

  // Warn on refresh or navigate away during timed session
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (timedSessionActive && timeRemaining != null) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [timedSessionActive, timeRemaining]);

  const resetTimedSession = () => {
    timedTimeUpHandledRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setShowTimedSetup(false);
    setShowTimedConfirmModal(false);
    setTimedSessionActive(false);
    setTimeRemaining(null);
    setTimedQuestionIndex(0);
    setTimedTimePerQuestion([]);
    setTimedQuestionStartAt(null);
    setTimedResponses([]);
    setTimedSessionSummary(null);
    setTimedSessionDurationSeconds(null);
  };

  const startTimedInterviewAfterConfirm = async () => {
    timedTimeUpHandledRef.current = false;
    setShowTimedConfirmModal(false);
    const duration = getTimedDurationSeconds();
    setTimedSessionDurationSeconds(duration);
    setTimedSessionActive(true);
    setTimeRemaining(duration);
    setTimedQuestionIndex(0);
    setTimedResponses([]);
    setTimedTimePerQuestion([]);
    setUserAnswer("");
    setFeedback("");
    setScore(null);
    setFollowupQuestion("");
    setFollowupAnswer("");
    setFollowupFeedback("");
    setFollowupScore(null);
    setTimedSessionSummary(null);
    const type = timedInterviewType || "technical";
    setInterviewType(type);
    setCurrentQuestion(""); // so we show Loading until first question is set
    if (!role.trim()) {
      alert("Please enter a role first.");
      resetTimedSession();
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        interview_type: type,
        difficulty,
        role: role.trim(),
      });
      if (company.trim()) params.set("company", company.trim());
      if (type === "technical" && language) params.set("language", language);
      const response = await fetch(apiUrl(`/api/interview/generate-question?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setCurrentQuestion(data.question);
        setTimedQuestionStartAt(Date.now());
      } else {
        const msg = data?.detail;
        const text = typeof msg === "string" ? msg : Array.isArray(msg) && msg[0]?.msg ? msg[0].msg : "Failed to generate question.";
        alert("Failed to generate question: " + text);
        resetTimedSession();
      }
    } catch (err) {
      console.error(err);
      alert("Error generating question. Check backend.");
      resetTimedSession();
    } finally {
      setIsLoading(false);
    }
  };

  const submitTimedAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }
    const questionStart = timedQuestionStartAt != null ? timedQuestionStartAt : Date.now();
    const timeSpentThisQuestion = Math.round((Date.now() - questionStart) / 1000);
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/interview/evaluate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: currentQuestion,
          user_answer: userAnswer,
          interview_type: interviewType,
          role: role.trim(),
          company: company.trim() || null,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const newResponses = [
          ...timedResponses,
          {
            question: currentQuestion,
            userAnswer: userAnswer,
            feedback: data.feedback,
            score: data.score,
            timeSpentSeconds: timeSpentThisQuestion,
          },
        ];
        setTimedResponses(newResponses);
        setTimedTimePerQuestion((prev) => [...prev, timeSpentThisQuestion]);
        await fetch(apiUrl("/api/sessions/"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            interview_type: interviewType,
            role: role.trim(),
            company: company.trim() || null,
            difficulty,
            question: currentQuestion,
            user_answer: userAnswer,
            feedback: data.feedback,
            score: data.score,
            strength_highlight: data.strength_highlight || null,
            notes: sessionNotes.trim() || null,
            time_spent_seconds: timeSpentThisQuestion,
            session_total_seconds: timedSessionDurationSeconds,
          }),
        });
        const nextIndex = timedQuestionIndex + 1;
        if (nextIndex >= TIMED_QUESTIONS_COUNT) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          const withScores = newResponses.filter((r) => r.score != null);
          const totalScore =
            withScores.length > 0
              ? Math.round(withScores.reduce((a, r) => a + (r.score ?? 0), 0) / withScores.length)
              : null;
          setTimedSessionSummary({ responses: newResponses, totalScore, timeExpired: false });
          setTimedSessionActive(false);
          setTimeRemaining(null);
        } else {
          setTimedQuestionIndex(nextIndex);
          setUserAnswer("");
          setFeedback("");
          setScore(null);
          setTimedQuestionStartAt(Date.now());
          const params = new URLSearchParams({
            interview_type: interviewType,
            difficulty,
            role: role.trim(),
          });
          if (company.trim()) params.set("company", company.trim());
          if (interviewType === "technical" && language) params.set("language", language);
          const nextRes = await fetch(apiUrl(`/api/interview/generate-question?${params.toString()}`), {
            headers: { Authorization: `Bearer ${token}` },
          });
          const nextData = await nextRes.json().catch(() => ({}));
          if (nextRes.ok && nextData.question) {
            setCurrentQuestion(nextData.question);
          } else {
            setTimedSessionSummary({
              responses: newResponses,
              totalScore: newResponses.filter((r) => r.score != null).length
                ? Math.round(
                    newResponses.reduce((a, r) => a + (r.score ?? 0), 0) /
                      newResponses.filter((r) => r.score != null).length
                  )
                : null,
              timeExpired: false,
            });
            setTimedSessionActive(false);
            setTimeRemaining(null);
          }
        }
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

  if (!user) {
    return (
      <div className="app">
        <div className="card">
          <h1>LLM Interview Simulator</h1>
          <p>Practice interviews with AI-powered feedback</p>
          
          {authView === "login" ? (
            <div key="login">
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
                
                fetch(apiUrl('/api/auth/login'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body
                })
                .then(async (res) => {
                  let json = {};
                  try {
                    json = await res.json();
                  } catch (_) {
                    if (!res.ok) throw new Error('Server error or backend not running. Start backend on port 8000.');
                    throw new Error('Invalid response from server');
                  }
                  if (!res.ok) {
                    const d = json?.detail;
                    const msg = typeof d === 'string' ? d : (Array.isArray(d) && d[0]?.msg) ? d[0].msg : 'Invalid username or password.';
                    throw new Error(msg);
                  }
                  return json;
                })
                .then(data => {
                  if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setLoginPrefill(null);
                    handleLogin(data.user);
                  } else {
                    alert('Login failed: Invalid response from server');
                  }
                })
                .catch(err => {
                  console.error('Login failed:', err);
                  const msg = err.message || '';
                  const isNetwork = /load failed|failed to fetch|networkerror|network error/i.test(msg) || err.name === 'TypeError';
                  const friendly = isNetwork
                    ? "Can't reach the server. Use the app at http://localhost:5173 (npm run dev) and ensure the backend is running: cd backend && uvicorn app.main:app --reload"
                    : "Login failed: " + msg;
                  alert(friendly);
                });
              }}>
                <input name="username" placeholder="Username" type="text" autoComplete="username" defaultValue={loginPrefill?.username ?? ""} required />
                <input name="password" type="password" placeholder="Password" autoComplete="current-password" defaultValue={loginPrefill?.password ?? ""} required />
                <button type="submit">Login</button>
              </form>
              <button onClick={() => { setLoginPrefill(null); setAuthView("signup"); }}>Switch to Sign Up</button>
            </div>
          ) : (
            <div key="signup">
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
                
                fetch(apiUrl('/api/auth/register'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(userData)
                })
                .then(async (res) => {
                  let json = {};
                  try {
                    json = await res.json();
                  } catch (_) {
                    if (!res.ok) throw new Error('Server error or backend not running. Start backend on port 8000.');
                    throw new Error('Invalid response from server');
                  }
                  if (!res.ok) {
                    const d = json?.detail;
                    const msg = typeof d === 'string' ? d : (Array.isArray(d) && d[0]?.msg) ? d[0].msg : 'Registration failed.';
                    throw new Error(msg);
                  }
                  return json;
                })
                .then(data => {
                  if (data.id) {
                    alert('Registration successful! Please login.');
                    setLoginPrefill({ username: String(userData.username ?? "").trim(), password: String(userData.password ?? "") });
                    setAuthView("login");
                  } else {
                    alert('Registration failed: Invalid response from server');
                  }
                })
                .catch(err => {
                  console.error('Registration failed:', err);
                  const msg = err.message || '';
                  const isNetwork = /load failed|failed to fetch|networkerror|network error/i.test(msg) || err.name === 'TypeError';
                  const friendly = isNetwork
                    ? "Can't reach the server. Use the app at http://localhost:5173 (npm run dev) and ensure the backend is running: cd backend && uvicorn app.main:app --reload"
                    : "Registration failed: " + msg;
                  alert(friendly);
                });
              }}>
                <input name="full_name" placeholder="Full Name" type="text" autoComplete="name" required />
                <input name="username" placeholder="Username" type="text" autoComplete="username" required />
                <input name="email" type="email" placeholder="Email" autoComplete="email" required />
                <input name="password" type="password" placeholder="Password" autoComplete="new-password" required />
                <button type="submit">Sign Up</button>
              </form>
              <button onClick={() => { setLoginPrefill(null); setAuthView("login"); }}>Switch to Login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderInterviewView = () => {
    // Timed session summary (end screen)
    if (timedSessionSummary) {
      const { responses, totalScore, timeExpired } = timedSessionSummary;
      return (
        <div className="content timed-summary">
          <h2>Timed Session Complete</h2>
          {timeExpired && <p className="timed-summary-subtitle">Time ran out. Your last response was recorded.</p>}
          <div className="timed-summary-score">
            {totalScore != null ? (
              <span>Overall score: <strong>{totalScore}%</strong></span>
            ) : (
              <span>Responses recorded (no score when time expired with no evaluation).</span>
            )}
          </div>
          <div className="timed-summary-list">
            <h3>Question breakdown</h3>
            {responses.map((r, i) => (
              <div key={i} className="timed-summary-item">
                <div className="timed-summary-q">{r.question}</div>
                <div className="timed-summary-meta">
                  {r.score != null && <span className="timed-summary-score-pill">{r.score}%</span>}
                  <span className="timed-summary-time">{r.timeSpentSeconds}s</span>
                </div>
                {r.feedback && <div className="timed-summary-feedback">{r.feedback}</div>}
              </div>
            ))}
          </div>
          <div className="timed-summary-actions">
            <button onClick={() => { resetTimedSession(); resetInterview(); }} className="next-btn">Back to Interview</button>
            <button onClick={() => { resetTimedSession(); resetInterview(); setCurrentView("dashboard"); fetchDashboardData(); }} className="submit-btn">View Dashboard</button>
          </div>
        </div>
      );
    }

    // Timed setup screen (after clicking "Start Timed Interview")
    if (showTimedSetup && !timedSessionActive && !timedSessionSummary) {
      const durationSec = getTimedDurationSeconds();
      const customValid = timedSessionLengthPreset !== "custom" || (timedCustomHours * 3600 + timedCustomMinutes * 60) > 0;
      return (
        <div className="content timed-setup">
          <h2>Timed Interview Setup</h2>
          <p>Set your session length and timing model. You will answer up to {TIMED_QUESTIONS_COUNT} questions.</p>
          <div className="timed-setup-form">
            <div className="timed-setup-row">
              <label>Interview type</label>
              <select
                value={timedInterviewType}
                onChange={(e) => setTimedInterviewType(e.target.value)}
                data-timed-type
              >
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="design">Design</option>
              </select>
            </div>
            <div className="timed-setup-row">
              <label>Session length</label>
              <select
                value={timedSessionLengthPreset}
                onChange={(e) => setTimedSessionLengthPreset(e.target.value)}
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {timedSessionLengthPreset === "custom" && (
              <div className="timed-setup-custom">
                <label>Hours (0–2)</label>
                <select
                  value={timedCustomHours}
                  onChange={(e) => setTimedCustomHours(Number(e.target.value))}
                >
                  {[0, 1, 2].map((h) => (
                    <option key={h} value={h}>{h} hr</option>
                  ))}
                </select>
                <label>Minutes (0–60)</label>
                <select
                  value={timedCustomMinutes}
                  onChange={(e) => setTimedCustomMinutes(Number(e.target.value))}
                >
                  {Array.from({ length: 61 }, (_, i) => (
                    <option key={i} value={i}>{i} min</option>
                  ))}
                </select>
              </div>
            )}
            <div className="timed-setup-row">
              <label>Timing model</label>
              <select value={timingModel} onChange={(e) => setTimingModel(e.target.value)}>
                <option value="whole_only">Whole session countdown only</option>
                <option value="whole_and_per_question">Per-question timer + whole session countdown</option>
              </select>
            </div>
          </div>
          <p className="timed-setup-duration">Total time: {Math.floor(durationSec / 60)}m {durationSec % 60}s</p>
          <div className="timed-setup-actions">
            <button onClick={() => setShowTimedSetup(false)} className="back-btn">Cancel</button>
            <button
              onClick={() => setShowTimedConfirmModal(true)}
              disabled={!customValid}
              className="interview-btn"
            >
              Start Timed Interview
            </button>
          </div>
        </div>
      );
    }

    if (!interviewType) {
      return (
        <div className="content">
          <h2>Interview Practice</h2>
          <p>Enter your role and choose an interview type to start practicing.</p>

          {draft && !showTimedSetup && (
            <div className="resume-banner">
              <p>You have a saved interview in progress.</p>
              <div className="resume-actions">
                <button onClick={resumeDraft} className="next-btn">Resume</button>
                <button onClick={discardDraft} className="back-btn">Discard</button>
              </div>
            </div>
          )}
          
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

          <div className="difficulty-select">
            <label>
              Difficulty:
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={isLoading}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
          </div>

          <div className="language-select">
            <label>
              Programming language (for technical interviews):
              <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isLoading}>
                <option value="Python">Python</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Java">Java</option>
                <option value="C">C</option>
                <option value="C++">C++</option>
                <option value="C#">C#</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="TypeScript">TypeScript</option>
                <option value="SQL">SQL</option>
              </select>
            </label>
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
            <button 
              className="interview-btn" 
              onClick={() => startInterview("design")}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Design Interview"}
            </button>
            <button
              type="button"
              className="interview-btn timed-mode-btn"
              onClick={() => setShowTimedSetup(true)}
              disabled={isLoading}
            >
              Start Timed Interview
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
          <button
            onClick={() => {
              if (timedSessionActive) resetTimedSession();
              resetInterview();
            }}
            className="back-btn"
          >
            Stop Interview
          </button>
        </div>
      );
    }

    const timeExpired = timedSessionActive && timeRemaining !== null && timeRemaining <= 0;
    const isTimedMode = timedSessionActive && !timedSessionSummary;

    return (
      <div className="content">
        <div className="interview-header">
          <h2>{interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview</h2>
          {isTimedMode && (
            <div className={`timer-display ${timeRemaining !== null && timeRemaining <= 30 ? "timer-urgent" : ""}`}>
              <span className="timer-label">Time left</span>
              <span className="timer-value">
                {timeRemaining != null
                  ? `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, "0")}`
                  : "—"}
              </span>
            </div>
          )}
          <button
            onClick={() => {
              if (isTimedMode) resetTimedSession();
              resetInterview();
            }}
            className="back-btn"
          >
            Stop Interview
          </button>
        </div>
        {isTimedMode && (
          <div className="progress-indicator">
            Question {timedQuestionIndex + 1} of {TIMED_QUESTIONS_COUNT}
          </div>
        )}
        
        <div className="question-section">
          <h3>Question:</h3>
          <div className="question-meta">
            <span className="meta-pill">{role || "Role"}</span>
            {company && <span className="meta-pill">{company}</span>}
            <span className="meta-pill">{interviewType}</span>
            <span className="meta-pill">{difficulty}</span>
          </div>
          <div className="question-box">
            <p>{currentQuestion}</p>
          </div>
        </div>

        {isTimedMode ? (
          <TechnicalInterviewBox
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            submitAnswer={submitTimedAnswer}
            isListening={isListening}
            setIsListening={setIsListening}
            recognitionRef={recognitionRef}
            isLoading={isLoading}
            isTechnical={interviewType === "technical"}
            programmingLanguage={language}
            inputDisabled={timeExpired}
          />
        ) : !feedback && (
          <TechnicalInterviewBox
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            submitAnswer={submitAnswer}
            isListening={isListening}
            setIsListening={setIsListening}
            recognitionRef={recognitionRef}
            isLoading={isLoading}
            isTechnical={interviewType === "technical"}
            programmingLanguage={language}
          />
        )}
        {!isTimedMode && (
          <div className="answer-section session-notes-section">
            <h3>Session Notes</h3>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Add notes about this interview..."
              rows={4}
              disabled={isLoading}
            />
          </div>
        )}
        {!isTimedMode && feedback && (
          <div className="feedback-section">
            <h3>Feedback & Score:</h3>
            <div className="score-display">
              <span className="score">Score: {score}%</span>
            </div>
            <div className="feedback-box">
              <p>{feedback}</p>
            </div>
            {followupQuestion && (interviewType === "behavioral" || interviewType === "design") && (
              <div className="question-box">
                <h4>Follow-up Question:</h4>
                <p>{followupQuestion}</p>
              </div>
            )}
            {followupQuestion && (interviewType === "behavioral" || interviewType === "design") && (
              <div className="answer-section">
                <h4>Your Follow-up Answer:</h4>
                <textarea
                  value={followupAnswer}
                  onChange={(e) => setFollowupAnswer(e.target.value)}
                  placeholder="Answer the follow-up question..."
                  rows={6}
                  disabled={isLoading}
                />
                <button
                  onClick={submitFollowupAnswer}
                  disabled={isLoading || !followupAnswer.trim()}
                  className="submit-btn"
                >
                  {isLoading ? "Evaluating..." : "Submit Follow-up"}
                </button>
                {followupFeedback && (
                  <div className="feedback-box">
                    <p>{followupFeedback}</p>
                    {followupScore !== null && (
                      <div className="score-display">
                        <span className="score">Score: {followupScore}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="feedback-actions">
              <button onClick={nextQuestion} disabled={isLoading} className="next-btn">
                {isLoading ? "Loading..." : "Next Question"}
              </button>
              <button onClick={resetInterview} className="back-btn">Stop Interview</button>
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

    if (dashboardError) {
      return (
        <div className="content">
          <h2>Dashboard</h2>
          <p>{dashboardError}</p>
          <button onClick={fetchDashboardData} className="load-dashboard-btn">
            Retry
          </button>
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
    const hasEnoughInterviews = (stats.total_interviews || 0) >= 5;

    return (
      <div className="content">
        <h2>Dashboard</h2>
        <p>Your interview progress and statistics</p>
        
        {!hasEnoughInterviews && (
          <div className="no-history">
            <p>
              Complete at least 5 interviews to unlock dashboard analytics.
              You have completed {stats.total_interviews || 0}.
            </p>
          </div>
        )}

        {/* Top scores: technical, behavioral, design */}
        <div className="stats-grid stats-grid-top">
          <div className="stat-card">
            <h3>Most Recent Technical Score</h3>
            <div className="stat-number">
              {stats.most_recent_technical_score != null ? `${stats.most_recent_technical_score}%` : "—"}
            </div>
          </div>
          <div className="stat-card">
            <h3>Average Technical Score</h3>
            <div className="stat-number">{stats.technical_average != null ? `${stats.technical_average}%` : "—"}</div>
          </div>
          <div className="stat-card">
            <h3>Most Recent Behavioral Score</h3>
            <div className="stat-number">
              {stats.most_recent_behavioral_score != null ? `${stats.most_recent_behavioral_score}%` : "—"}
            </div>
          </div>
          <div className="stat-card">
            <h3>Average Behavioral Score</h3>
            <div className="stat-number">{stats.behavioral_average != null ? `${stats.behavioral_average}%` : "—"}</div>
          </div>
          <div className="stat-card">
            <h3>Most Recent Design Score</h3>
            <div className="stat-number">
              {stats.most_recent_design_score != null ? `${stats.most_recent_design_score}%` : "—"}
            </div>
          </div>
          <div className="stat-card">
            <h3>Average Design Score</h3>
            <div className="stat-number">{stats.design_average != null ? `${stats.design_average}%` : "—"}</div>
          </div>
        </div>

        {/* Strengths and Weaknesses - unlocked at 5+ interviews */}
        {hasEnoughInterviews && (
          <div className="strengths-weaknesses">
            <div className="strengths">
              <h3>Strengths</h3>
              <ul>
                {stats.strengths && stats.strengths.length > 0 ? (
                  stats.strengths.map((item, index) => (
                    <li key={index}>
                      {typeof item === "object" && item !== null && "highlight" in item ? (
                        <>
                          <strong>{item.highlight}</strong>
                          {item.feedback ? <div className="strength-feedback">{item.feedback}</div> : null}
                        </>
                      ) : (
                        item
                      )}
                    </li>
                  ))
                ) : (
                  <li>Complete more interviews to see your strengths</li>
                )}
              </ul>
            </div>
            <div className="weaknesses areas-improvement-centered">
              <h3>Areas for Improvement</h3>
              <ul>
                {stats.weaknesses && stats.weaknesses.length > 0 ? (
                  stats.weaknesses.map((item, index) => (
                    <li key={index}>
                      {typeof item === "object" && item !== null && "feedback" in item ? (
                        <div className="improvement-feedback">{item.feedback}</div>
                      ) : (
                        item
                      )}
                    </li>
                  ))
                ) : (
                  <li>Complete more interviews to see areas for improvement</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Recent Interview History - unlocked at 5+ interviews */}
        {hasEnoughInterviews && (
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
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((session) => (
                      <tr key={session.id}>
                        <td>{new Date(session.created_at).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })}</td>
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
                        <td className="notes-cell">
                          {session.notes ? (
                            <div className="notes-preview">
                              {session.notes.length > 80
                                ? `${session.notes.substring(0, 80)}...`
                                : session.notes
                              }
                            </div>
                          ) : (
                            <span className="no-feedback">No notes</span>
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
        )}

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

      {showTimedConfirmModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="timed-confirm-title">
          <div className="modal-content timed-confirm-modal">
            <h2 id="timed-confirm-title">Timed Interview Rules</h2>
            <ul>
              <li>The session countdown starts when you begin.</li>
              <li>When time runs out, your current answer will be auto-submitted and the session will end.</li>
              <li>Input is locked once time expires; you cannot edit after that.</li>
              <li>Refreshing or leaving the page during the session may lose progress.</li>
              <li>You will answer up to {TIMED_QUESTIONS_COUNT} questions. A summary with scores will appear at the end.</li>
            </ul>
            <p className="timed-confirm-duration">
              Duration: {Math.floor(getTimedDurationSeconds() / 60)}m {getTimedDurationSeconds() % 60}s
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowTimedConfirmModal(false)} className="back-btn">Cancel</button>
              <button onClick={startTimedInterviewAfterConfirm} className="interview-btn">Begin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
