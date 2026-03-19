import { useState, useEffect, useRef } from "react";
import "./App.css";
import TechnicalInterviewBox from './interviewBox';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const apiUrl = (path) => `${API_BASE_URL}${path}`;

function getStrengthItemText(item) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const parts = [item.highlight, item.feedback].filter(Boolean);
    return parts.join(" ").trim();
  }
  return "";
}

function getWeaknessItemText(item) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "feedback" in item) return (item.feedback || "").trim();
  return "";
}

// ~3 lines at typical line length; used when text has no newlines (e.g. long paragraphs)
const PREVIEW_MAX_CHARS = 220;

function getFirst3Lines(str) {
  if (str == null || str === "") return "";
  const s = String(str).trim();
  const lines = s.split(/\r?\n/);
  const first3 = lines.slice(0, 3).join("\n");
  if (first3.length <= PREVIEW_MAX_CHARS) return first3;
  return s.slice(0, PREVIEW_MAX_CHARS) + "...";
}

function hasMoreThan3Lines(str) {
  if (str == null || str === "") return false;
  const s = String(str).trim();
  const lines = s.split(/\r?\n/);
  return lines.length > 3 || s.length > PREVIEW_MAX_CHARS;
}

function starContributionPercent(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return null;
  return Math.round((s / 5) * 25); // each STAR dimension contributes up to 25% of the overall score
}

function starGlyphs(score) {
  const s = Math.max(0, Math.min(5, Math.round(Number(score) || 0)));
  return Array.from({ length: 5 }, (_, i) => (i < s ? "*" : "o")).join(" ");
}

function toLocalISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
  const [followupStarBreakdown, setFollowupStarBreakdown] = useState(null);
  const [strengthHighlight, setStrengthHighlight] = useState("");
  const [followupStrengthHighlight, setFollowupStrengthHighlight] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [followUpSessionNotes, setFollowUpSessionNotes] = useState("");
  const [draft, setDraft] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [starBreakdown, setStarBreakdown] = useState(null); // { scores: {situation, task, action, result}, feedback: {...} }
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [dailyLogData, setDailyLogData] = useState(null); // { days: [...], streak: number, logged_dates: [...] }
  const [dailyLogLoading, setDailyLogLoading] = useState(false);
  const [dailyLogError, setDailyLogError] = useState("");
  const [interviewTotals, setInterviewTotals] = useState(null); // { total_interviews: number }
  const [interviewTotalsLoading, setInterviewTotalsLoading] = useState(false);
  const [interviewTotalsError, setInterviewTotalsError] = useState("");
  const nowForCalendar = new Date();
  const [calendarYear, setCalendarYear] = useState(nowForCalendar.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(nowForCalendar.getMonth() + 1); // 1-12
  const [calendarVisitedDates, setCalendarVisitedDates] = useState([]);
  const [calendarEventsByDate, setCalendarEventsByDate] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarEventModal, setCalendarEventModal] = useState(null); // null | { mode: "add", date?: "YYYY-MM-DD" } | { mode: "edit", event: {...} }
  const [calendarEventForm, setCalendarEventForm] = useState({ event_date: "", title: "", start_time: "", end_time: "", notes: "" });
  const [calendarEventSaving, setCalendarEventSaving] = useState(false);
  const [calendarEventError, setCalendarEventError] = useState("");
  const [settingsFullName, setSettingsFullName] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [recentSessionsPreview, setRecentSessionsPreview] = useState([]);
  const [recentSessionsLoading, setRecentSessionsLoading] = useState(false);
  const [recentSessionsError, setRecentSessionsError] = useState("");
  const [showFullStrengths, setShowFullStrengths] = useState(false);
  const [showFullWeaknesses, setShowFullWeaknesses] = useState(false);
  const [expandedStrengthIndices, setExpandedStrengthIndices] = useState({});
  const [expandedWeaknessIndices, setExpandedWeaknessIndices] = useState({});
  const [expandedHistoryCell, setExpandedHistoryCell] = useState(null);
  const [showFullInterviewHistory, setShowFullInterviewHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const visitRecordedForDateRef = useRef(null); // YYYY-MM-DD (local)

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
  const [timedResponses, setTimedResponses] = useState([]); // { question, userAnswer, feedback, score, timeSpentSeconds, starScores?, starFeedback? }
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
    if (!user) return;
    setSettingsFullName(String(user.full_name || ""));
  }, [user]);
  
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
      followUpSessionNotes,
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
    followUpSessionNotes,
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
    setFollowupStarBreakdown(null);
    setStrengthHighlight("");
    setFollowupStrengthHighlight("");
    setSessionNotes("");
    setFollowUpSessionNotes("");
    setFeedback("");
    setScore(null);
    setStarBreakdown(null);
    setDashboardData(null);
    setDashboardError("");
    setDailyLogData(null);
    setDailyLogError("");
    setInterviewTotals(null);
    setInterviewTotalsError("");
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
    setFollowupStarBreakdown(null);
    setStrengthHighlight("");
    setFollowupStrengthHighlight("");
    setSessionNotes("");
    setFollowUpSessionNotes("");
    setFeedback("");
    setScore(null);
    setStarBreakdown(null);
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
    setFollowUpSessionNotes(draft.followUpSessionNotes || "");
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
        setStrengthHighlight(String(data.strength_highlight || "").trim());
        setStarBreakdown(
          data?.star_scores && data?.star_feedback
            ? { scores: data.star_scores, feedback: data.star_feedback }
            : null
        );
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
    setIsLoading(true);
    setFeedback("");
    setScore(null);
    setStarBreakdown(null);
    setStrengthHighlight("");
    setFollowupQuestion("");
    setFollowupAnswer("");
    setFollowupFeedback("");
    setFollowupScore(null);
    setFollowupStarBreakdown(null);
    setFollowupStrengthHighlight("");
    setFollowUpSessionNotes("");
    
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        interview_type: interviewType,
        difficulty,
        role: role.trim()
      });
      if (company.trim()) params.set("company", company.trim());
      if (interviewType === "technical" && language) params.set("language", language);
      const response = await fetch(apiUrl(`/api/interview/generate-question?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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
        setFollowupStrengthHighlight(String(data.strength_highlight || "").trim());
        setFollowupStarBreakdown(
          data?.star_scores && data?.star_feedback
            ? { scores: data.star_scores, feedback: data.star_feedback }
            : null
        );
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
            notes: (followUpSessionNotes || sessionNotes || "").trim() || null
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
        setDashboardData({ stats, history, strengthThemes: [], weaknessThemes: [] });

        const strengthTexts = (stats.strengths || []).map(getStrengthItemText).filter(Boolean);
        const weaknessTexts = (stats.weaknesses || []).map(getWeaknessItemText).filter(Boolean);
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
        const themeFetches = [];
        if (strengthTexts.length > 0) {
          themeFetches.push(
            fetch(apiUrl("/api/dashboard/themes"), { method: "POST", headers, body: JSON.stringify({ texts: strengthTexts, kind: "strengths" }) })
              .then((r) => r.json())
              .then((d) => d.themes || [])
              .catch(() => [])
          );
        } else themeFetches.push(Promise.resolve([]));
        if (weaknessTexts.length > 0) {
          themeFetches.push(
            fetch(apiUrl("/api/dashboard/themes"), { method: "POST", headers, body: JSON.stringify({ texts: weaknessTexts, kind: "weaknesses" }) })
              .then((r) => r.json())
              .then((d) => d.themes || [])
              .catch(() => [])
          );
        } else themeFetches.push(Promise.resolve([]));
        const [strengthThemes, weaknessThemes] = await Promise.all(themeFetches);
        setDashboardData((prev) => (prev ? { ...prev, strengthThemes, weaknessThemes } : prev));
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

  const fetchRecentSessionsPreview = async () => {
    setRecentSessionsLoading(true);
    setRecentSessionsError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setRecentSessionsPreview([]);
        return;
      }

      // Backend returns most recent sessions (max 20). We only show the last 3.
      const res = await fetch(apiUrl("/api/dashboard/history"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load recent sessions");

      const history = await res.json();
      const recent = Array.isArray(history) ? history.slice(0, 3) : [];
      setRecentSessionsPreview(recent);
    } catch (e) {
      setRecentSessionsError(e.message || "Could not load recent sessions");
      setRecentSessionsPreview([]);
    } finally {
      setRecentSessionsLoading(false);
    }
  };

  const fetchDailyLogData = async () => {
    setDailyLogLoading(true);
    setDailyLogError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setDailyLogData(null);
        return;
      }

      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(apiUrl(`/api/dashboard/daily-log?tz_offset_minutes=${tzOffset}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setDailyLogError("Session expired. Please log in again.");
        handleLogout();
        return;
      }

      if (!res.ok) throw new Error("Failed to load daily log");
      const data = await res.json();
      setDailyLogData(data);
    } catch (e) {
      setDailyLogError(e.message || "Could not load daily log");
      setDailyLogData(null);
    } finally {
      setDailyLogLoading(false);
    }
  };

  const fetchCalendarMonth = async (year, month) => {
    setCalendarLoading(true);
    setCalendarError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCalendarVisitedDates([]);
        return;
      }

      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(apiUrl(`/api/activity/calendar?year=${year}&month=${month}&tz_offset_minutes=${tzOffset}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setCalendarError("Session expired. Please log in again.");
        handleLogout();
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.detail;
        const text = typeof msg === "string" ? msg : "Failed to load calendar month";
        throw new Error(text);
      }
      setCalendarVisitedDates(Array.isArray(data.visited_dates) ? data.visited_dates : []);
    } catch (e) {
      setCalendarError(e.message || "Could not load calendar");
      setCalendarVisitedDates([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchCalendarEvents = async (year, month) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCalendarEventsByDate({});
        return;
      }
      const res = await fetch(apiUrl(`/api/calendar/events?year=${year}&month=${month}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setCalendarEventsByDate(data.events_by_date || {});
    } catch {
      setCalendarEventsByDate({});
    }
  };

  const openAddEventModal = (isoDate) => {
    const date = isoDate || toLocalISODate(new Date());
    setCalendarEventModal({ mode: "add", date });
    setCalendarEventForm({ event_date: date, title: "", start_time: "", end_time: "", notes: "" });
    setCalendarEventError("");
  };

  const openEditEventModal = (event) => {
    setCalendarEventModal({ mode: "edit", event });
    setCalendarEventForm({
      event_date: event.event_date || "",
      title: event.title || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      notes: event.notes || "",
    });
    setCalendarEventError("");
  };

  const closeCalendarEventModal = () => {
    setCalendarEventModal(null);
    setCalendarEventError("");
  };

  const saveCalendarEvent = async () => {
    setCalendarEventError("");
    const start = calendarEventForm.start_time.trim();
    const end = calendarEventForm.end_time.trim();
    if (start && end) {
      const norm = (t) => {
        const [h, m] = t.split(":");
        return `${String(h).padStart(2, "0")}:${String(m || "0").padStart(2, "0")}`;
      };
      if (norm(end) <= norm(start)) {
        setCalendarEventError("End time must be after start time (e.g. 1:15 PM to 3:30 PM).");
        return;
      }
    }
    setCalendarEventSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not logged in");
      const { mode, event } = calendarEventModal;
      const eventDate = mode === "add" ? calendarEventModal.date : calendarEventForm.event_date;
      const body = {
        event_date: eventDate,
        title: calendarEventForm.title.trim() || "Untitled",
        start_time: start || null,
        end_time: end || null,
        notes: calendarEventForm.notes.trim() || null,
      };
      if (mode === "add") {
        const res = await fetch(apiUrl("/api/calendar/events"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.detail || "Failed to add event");
      } else {
        const res = await fetch(apiUrl(`/api/calendar/events/${event.id}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.detail || "Failed to update event");
      }
      closeCalendarEventModal();
      fetchCalendarEvents(calendarYear, calendarMonth);
    } catch (e) {
      setCalendarEventError(e.message || "Failed to save");
    } finally {
      setCalendarEventSaving(false);
    }
  };

  const deleteCalendarEvent = async () => {
    if (!calendarEventModal || calendarEventModal.mode !== "edit") return;
    setCalendarEventSaving(true);
    setCalendarEventError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not logged in");
      const res = await fetch(apiUrl(`/api/calendar/events/${calendarEventModal.event.id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete event");
      closeCalendarEventModal();
      fetchCalendarEvents(calendarYear, calendarMonth);
    } catch (e) {
      setCalendarEventError(e.message || "Failed to delete");
    } finally {
      setCalendarEventSaving(false);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not logged in");

      const res = await fetch(apiUrl("/api/auth/me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: settingsFullName }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setSettingsError("Session expired. Please log in again.");
        handleLogout();
        return;
      }

      if (!res.ok) {
        const msg = data?.detail;
        const text = typeof msg === "string" ? msg : "Failed to save settings.";
        throw new Error(text);
      }

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch (e) {
      setSettingsError(e.message || "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchInterviewTotals = async () => {
    setInterviewTotalsLoading(true);
    setInterviewTotalsError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setInterviewTotals(null);
        return;
      }

      const res = await fetch(apiUrl("/api/dashboard/stats"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setInterviewTotalsError("Session expired. Please log in again.");
        handleLogout();
        return;
      }

      if (!res.ok) throw new Error("Failed to load interview totals");
      const stats = await res.json();
      setInterviewTotals({ total_interviews: stats.total_interviews ?? 0 });
    } catch (e) {
      setInterviewTotalsError(e.message || "Could not load interview totals");
      setInterviewTotals(null);
    } finally {
      setInterviewTotalsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "dashboard" && user) {
      fetchDashboardData();
    }
  }, [currentView, user]);

  useEffect(() => {
    if (currentView === "interview" && user) {
      fetchDailyLogData();
    }
  }, [currentView, user]);

  useEffect(() => {
    if (!user) return;
    // Calendar and streak are based on practice (saved sessions), not login visits.
  }, [currentView, user]);

  useEffect(() => {
    if (currentView === "calendar" && user) {
      fetchCalendarMonth(calendarYear, calendarMonth);
      fetchCalendarEvents(calendarYear, calendarMonth);
    }
  }, [currentView, user, calendarYear, calendarMonth]);

  useEffect(() => {
    if (currentView === "interview" && user) {
      fetchInterviewTotals();
    }
  }, [currentView, user]);

  useEffect(() => {
    // Show the preview only on the interview welcome screen (no interview started yet)
    if (!user || currentView !== "interview" || interviewType) return;
    fetchRecentSessionsPreview();
  }, [currentView, user, interviewType]);

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
                starScores: data?.star_scores || null,
                starFeedback: data?.star_feedback || null,
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
                starScores: null,
                starFeedback: null,
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
              starScores: null,
              starFeedback: null,
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
    setStarBreakdown(null);
    setFollowupQuestion("");
    setFollowupAnswer("");
    setFollowupFeedback("");
    setFollowupScore(null);
    setFollowupStarBreakdown(null);
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
            starScores: data?.star_scores || null,
            starFeedback: data?.star_feedback || null,
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
        <div className="top-left-actions">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="toggle-btn"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        <div className="card">
          <h1>Interview Simulator</h1>
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

  const renderStarBreakdown = (scores, feedback) => {
    if (!scores || !feedback) return null;
    const dims = [
      ["situation", "Situation"],
      ["task", "Task"],
      ["action", "Action"],
      ["result", "Result"],
    ];

    return (
      <div className="star-breakdown">
        {dims.map(([key, label]) => {
          const points = starContributionPercent(scores[key]);
          const numeric = Number(scores[key]);
          return (
            <div key={key} className="star-breakdown-row">
              <div className="star-breakdown-top">
                <span className="star-breakdown-label">{label}</span>
                <span className="star-breakdown-glyphs">{starGlyphs(scores[key])}</span>
                {Number.isFinite(numeric) && (
                  <span className="star-breakdown-numeric">{numeric}/5</span>
                )}
                {points != null && <span className="star-breakdown-points">{points}%</span>}
              </div>
              {feedback[key] ? <div className="star-breakdown-explain">{feedback[key]}</div> : null}
            </div>
          );
        })}
      </div>
    );
  };

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
                <div className="timed-summary-progress">Question {i + 1} of {TIMED_QUESTIONS_COUNT}</div>
                <div className="timed-summary-q">{r.question}</div>
                <div className="timed-summary-meta">
                  {r.score != null && <span className="timed-summary-score-pill">{r.score}%</span>}
                  <span className="timed-summary-time">{r.timeSpentSeconds}s</span>
                </div>
                {r.feedback && <div className="timed-summary-feedback">{r.feedback}</div>}
                {renderStarBreakdown(r.starScores, r.starFeedback)}
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
          <div className="streak-right">
            Streak: {dailyLogLoading ? "…" : dailyLogData?.streak ?? 0} day(s)
          </div>

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
              onClick={() => {
                if (!role.trim()) {
                  alert("Please enter a role to start a timed interview for.");
                  return;
                }
                setShowTimedSetup(true);
              }}
              disabled={isLoading}
            >
              Start Timed Interview
            </button>
          </div>

          <div className="recent-sessions-preview">
            <div className="recent-sessions-header">
              <h3>Recent Sessions</h3>
              <span className="recent-sessions-subtitle">Last 3</span>
            </div>

            {recentSessionsLoading ? (
              <p className="recent-sessions-loading">Loading recent sessions...</p>
            ) : recentSessionsError ? (
              <p className="recent-sessions-error">{recentSessionsError}</p>
            ) : recentSessionsPreview.length === 0 ? (
              <p className="recent-sessions-empty">No sessions yet. Start an interview above!</p>
            ) : (
              <div className="recent-sessions-list">
                {recentSessionsPreview.map((s) => (
                  <div className="recent-session-item" key={s.id}>
                    <div className="recent-session-row">
                      <span className="recent-session-type">{s.type}</span>
                      <span
                        className={`recent-session-score ${
                          s.score == null
                            ? ""
                            : Number(s.score) >= 70
                              ? "good"
                              : Number(s.score) >= 50
                                ? "medium"
                                : "poor"
                        }`}
                      >
                        {s.score == null ? "—" : `${s.score}%`}
                      </span>
                    </div>
                    <div className="recent-session-meta">
                      <span className="recent-session-role">{s.role || "—"}</span>
                      {s.company ? <span className="recent-session-company"> • {s.company}</span> : null}
                      <span className="recent-session-date">
                        {" "}
                        • {s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { year: "2-digit", month: "short", day: "2-digit" }) : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="recent-sessions-view-more"
              onClick={() => setCurrentView("dashboard")}
            >
              View more in Dashboard
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
        
        <div className="question-section">
          <h3>
            {isTimedMode
              ? `Question ${timedQuestionIndex + 1} of ${TIMED_QUESTIONS_COUNT}:`
              : "Question:"}
          </h3>
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
        ) : !feedback ? (
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
        ) : (
          <div className={`answer-section ${interviewType === "technical" ? "ide-answer" : ""}`}>
            <h3>Your Answer:</h3>
            <div className="answer-readonly">
              <pre>{userAnswer || "(No answer)"}</pre>
            </div>
          </div>
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
            {interviewType === "behavioral" ? (
              <div className="feedback-split">
                <div className="feedback-box">
                  <h4>Strengths</h4>
                  <p>{strengthHighlight || "—"}</p>
                </div>
                <div className="feedback-box">
                  <h4>Areas for improvement</h4>
                  <p>{feedback}</p>
                </div>
              </div>
            ) : (
              <div className="feedback-box">
                <p>{feedback}</p>
              </div>
            )}
            {renderStarBreakdown(starBreakdown?.scores, starBreakdown?.feedback)}
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
                <div className="session-notes-section followup-notes">
                  <h4>Session Notes (for follow-up)</h4>
                  <textarea
                    value={followUpSessionNotes}
                    onChange={(e) => setFollowUpSessionNotes(e.target.value)}
                    placeholder="Add notes about this follow-up..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={submitFollowupAnswer}
                  disabled={isLoading || !followupAnswer.trim()}
                  className="submit-btn"
                >
                  {isLoading ? "Evaluating..." : "Submit Follow-up"}
                </button>
                {followupFeedback && (
                  <div>
                    {interviewType === "behavioral" ? (
                      <div className="feedback-split">
                        <div className="feedback-box">
                          <h4>Strengths</h4>
                          <p>{followupStrengthHighlight || "—"}</p>
                        </div>
                        <div className="feedback-box">
                          <h4>Areas for improvement</h4>
                          <p>{followupFeedback}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="feedback-box">
                        <p>{followupFeedback}</p>
                      </div>
                    )}
                    {renderStarBreakdown(
                      followupStarBreakdown?.scores,
                      followupStarBreakdown?.feedback
                    )}
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
        <p className="dashboard-total-interviews">
          Total interviews completed: {stats.total_interviews || 0}
        </p>
        
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
        {hasEnoughInterviews && (() => {
          const strengthsList = stats.strengths || [];
          const weaknessesList = stats.weaknesses || [];
          const TOP_N = 5;
          const strengthsToShow = showFullStrengths ? strengthsList : strengthsList.slice(0, TOP_N);
          const weaknessesToShow = showFullWeaknesses ? weaknessesList : weaknessesList.slice(0, TOP_N);
          const strengthsHasMore = strengthsList.length > TOP_N;
          const weaknessesHasMore = weaknessesList.length > TOP_N;
          const strengthThemes = dashboardData.strengthThemes || [];
          const weaknessThemes = dashboardData.weaknessThemes || [];
          const hasExpandedStrength = Object.values(expandedStrengthIndices).some(Boolean);
          const hasExpandedWeakness = Object.values(expandedWeaknessIndices).some(Boolean);
          return (
            <div className="strengths-weaknesses">
              <div className="sw-headers">
                <h3 className="sw-title-strengths">Strengths</h3>
                <h3 className="sw-title-weaknesses">Areas for Improvement</h3>
              </div>
              <div className="sw-content">
                <div className="strengths strengths-left">
                  {strengthThemes.length > 0 && (
                    <p className="common-words-subtitle">{strengthThemes.join(", ")}</p>
                  )}
                  <ul>
                    {strengthsList.length > 0 ? (
                      strengthsToShow.map((item, index) => {
                        const fullText = typeof item === "object" && item !== null && "highlight" in item
                          ? `${item.highlight || ""}${item.feedback ? " " + item.feedback : ""}`.trim()
                          : String(item || "");
                        const expanded = expandedStrengthIndices[index];
                        const showExpand = hasMoreThan3Lines(fullText);
                        const displayText = expanded || !showExpand ? fullText : getFirst3Lines(fullText);
                        return (
                          <li
                            key={index}
                            className={showExpand ? "expandable-item" : ""}
                            onClick={() => showExpand && setExpandedStrengthIndices((prev) => ({ ...prev, [index]: !prev[index] }))}
                            role={showExpand ? "button" : undefined}
                            tabIndex={showExpand ? 0 : undefined}
                            onKeyDown={(e) => showExpand && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setExpandedStrengthIndices((prev) => ({ ...prev, [index]: !prev[index] })))}
                          >
                            <div className="improvement-feedback">
                              {displayText}
                              {showExpand && !expanded && <span className="expand-hint"> — Click to show full</span>}
                              {showExpand && expanded && <span className="expand-hint"> — Click to reduce</span>}
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li>Complete more interviews to see your strengths</li>
                    )}
                  </ul>
                  <div className="sw-actions">
                    {strengthsHasMore && (
                      <button
                        type="button"
                        className="expand-list-btn"
                        onClick={() => setShowFullStrengths((s) => !s)}
                      >
                        {showFullStrengths ? "Reduce" : "Show full list"}
                      </button>
                    )}
                    {hasExpandedStrength && (
                      <button
                        type="button"
                        className="expand-list-btn reduce-preview-btn"
                        onClick={() => setExpandedStrengthIndices({})}
                      >
                        Reduce preview
                      </button>
                    )}
                  </div>
                </div>
                <div className="weaknesses areas-improvement-centered">
                  {weaknessThemes.length > 0 && (
                    <p className="common-words-subtitle">{weaknessThemes.join(", ")}</p>
                  )}
                  <ul>
                    {weaknessesList.length > 0 ? (
                      weaknessesToShow.map((item, index) => {
                        const fullText = typeof item === "object" && item !== null && "feedback" in item
                          ? (item.feedback || "")
                          : String(item || "");
                        const expanded = expandedWeaknessIndices[index];
                        const showExpand = hasMoreThan3Lines(fullText);
                        const displayText = expanded || !showExpand ? fullText : getFirst3Lines(fullText);
                        return (
                          <li
                            key={index}
                            className={showExpand ? "expandable-item" : ""}
                            onClick={() => showExpand && setExpandedWeaknessIndices((prev) => ({ ...prev, [index]: !prev[index] }))}
                            role={showExpand ? "button" : undefined}
                            tabIndex={showExpand ? 0 : undefined}
                            onKeyDown={(e) => showExpand && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setExpandedWeaknessIndices((prev) => ({ ...prev, [index]: !prev[index] })))}
                          >
                            <div className="improvement-feedback">
                              {displayText}
                              {showExpand && !expanded && <span className="expand-hint"> — Click to show full</span>}
                              {showExpand && expanded && <span className="expand-hint"> — Click to reduce</span>}
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li>Complete more interviews to see areas for improvement</li>
                    )}
                  </ul>
                  <div className="sw-actions">
                    {weaknessesHasMore && (
                      <button
                        type="button"
                        className="expand-list-btn"
                        onClick={() => setShowFullWeaknesses((s) => !s)}
                      >
                        {showFullWeaknesses ? "Reduce" : "Show full list"}
                      </button>
                    )}
                    {hasExpandedWeakness && (
                      <button
                        type="button"
                        className="expand-list-btn reduce-preview-btn"
                        onClick={() => setExpandedWeaknessIndices({})}
                      >
                        Reduce preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Recent Interview History - unlocked at 5+ interviews */}
        {hasEnoughInterviews && (
          <div className="history-section">
            <div className="history-section-header">
              <h3>Recent Interview History</h3>
              {expandedHistoryCell && (
                <button
                  type="button"
                  className="expand-list-btn reduce-preview-btn"
                  onClick={() => setExpandedHistoryCell(null)}
                >
                  Reduce previews
                </button>
              )}
            </div>
            {history && history.length > 0 ? (
              <>
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
                    {(showFullInterviewHistory ? history : history.slice(0, 10)).map((session) => {
                      const qKey = `${session.id}-question`;
                      const aKey = `${session.id}-answer`;
                      const fKey = `${session.id}-feedback`;
                      const nKey = `${session.id}-notes`;
                      const questionText = session.question || "";
                      const answerText = session.user_answer || "No answer provided";
                      const feedbackText = session.feedback || "";
                      const notesText = session.notes || "";
                      const expandableCell = (key, fullText, emptyLabel) => {
                        const expanded = expandedHistoryCell === key;
                        const hasMore = hasMoreThan3Lines(fullText);
                        const display = expanded || !hasMore ? fullText : getFirst3Lines(fullText);
                        if (!fullText.trim()) return <span className="no-feedback">{emptyLabel}</span>;
                        return (
                          <div
                            className={`history-cell-content ${hasMore ? "expandable-cell" : ""}`}
                            onClick={() => hasMore && setExpandedHistoryCell(expanded ? null : key)}
                            role={hasMore ? "button" : undefined}
                            tabIndex={hasMore ? 0 : undefined}
                            onKeyDown={(e) => hasMore && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setExpandedHistoryCell(expanded ? null : key))}
                          >
                            <span className="cell-text">{display}</span>
                            {hasMore && !expanded && <span className="expand-hint"> — Click to show full</span>}
                            {hasMore && expanded && <span className="expand-hint"> — Click to reduce</span>}
                          </div>
                        );
                      };
                      return (
                        <tr key={session.id}>
                          <td>{new Date(session.created_at).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })}</td>
                          <td className="type-cell">{session.type}</td>
                          <td className="role-cell">{session.role || "—"}</td>
                          <td className="company-cell">{session.company || "—"}</td>
                          <td className="question-cell">{expandableCell(qKey, questionText, "—")}</td>
                          <td className="answer-cell">{expandableCell(aKey, answerText, "No answer provided")}</td>
                          <td className={`score-cell ${session.score >= 70 ? 'good' : session.score >= 50 ? 'medium' : 'poor'}`}>
                            {session.score}%
                          </td>
                          <td className="feedback-cell">{expandableCell(fKey, feedbackText, "No feedback")}</td>
                          <td className="notes-cell">{expandableCell(nKey, notesText, "No notes")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {history.length > 10 && (
                <button
                  type="button"
                  className="expand-list-btn history-toggle-btn"
                  onClick={() => setShowFullInterviewHistory((s) => !s)}
                >
                  {showFullInterviewHistory ? "Reduce" : "Show full interview history"}
                </button>
              )}
              </>
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

  const renderCalendarView = () => {
    const year = calendarYear;
    const month = calendarMonth; // 1-12
    const monthName = new Date(year, month - 1, 1).toLocaleString(undefined, { month: "long" });

    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startOffset = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cells = Array.from({ length: totalCells }, (_, idx) => {
      const dayNum = idx - startOffset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      return dayNum;
    });

    const visitedSet = new Set(calendarVisitedDates);
    const todayISO = toLocalISODate(new Date());

    const goPrevMonth = () => {
      if (month === 1) {
        setCalendarMonth(12);
        setCalendarYear((y) => y - 1);
      } else {
        setCalendarMonth((m) => m - 1);
      }
    };

    const goNextMonth = () => {
      if (month === 12) {
        setCalendarMonth(1);
        setCalendarYear((y) => y + 1);
      } else {
        setCalendarMonth((m) => m + 1);
      }
    };

    const eventsForDate = (iso) => calendarEventsByDate[iso] || [];

    return (
      <div className="content calendar-page">
        <h2>Activity Calendar</h2>

        <div className="calendar-top-row">
          <button type="button" onClick={goPrevMonth} className="calendar-nav-btn">
            Prev
          </button>
          <div className="calendar-month-title">
            {monthName} {year}
          </div>
          <button type="button" onClick={goNextMonth} className="calendar-nav-btn">
            Next
          </button>
        </div>

        <div className="calendar-add-row">
          <button type="button" onClick={() => openAddEventModal()} className="calendar-add-event-btn">
            Add event
          </button>
        </div>

        {calendarError && <p className="calendar-error">{calendarError}</p>}

        {calendarLoading ? (
          <p>Loading calendar...</p>
        ) : (
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="calendar-weekday">
                {d}
              </div>
            ))}

            {cells.map((dayNum, idx) => {
              if (dayNum == null) {
                return <div key={`empty-${idx}`} className="calendar-day calendar-empty" />;
              }
              const iso = toLocalISODate(new Date(year, month - 1, dayNum));
              const visited = visitedSet.has(iso);
              const isToday = iso === todayISO;
              const events = eventsForDate(iso);
              return (
                <div
                  key={iso}
                  className={`calendar-day ${visited ? "visited" : ""} ${isToday ? "today" : ""}`}
                  title={visited ? "Practiced" : "Not practiced"}
                  onClick={() => openAddEventModal(iso)}
                >
                  <span className="calendar-day-num">{dayNum}</span>
                  {events.length > 0 && (
                    <div className="calendar-day-events">
                      {events.map((ev) => (
                        <div
                          key={ev.id}
                          className="calendar-day-event"
                          onClick={(e) => { e.stopPropagation(); openEditEventModal(ev); }}
                          title={`${ev.title}${ev.start_time || ev.end_time ? ` ${ev.start_time || ""}-${ev.end_time || ""}` : ""}`}
                        >
                          {ev.title}
                          {(ev.start_time || ev.end_time) && (
                            <span className="calendar-event-time">
                              {[ev.start_time, ev.end_time].filter(Boolean).join("–")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-swatch visited" /> Practiced
          </span>
          <span className="legend-item">
            <span className="legend-swatch today" /> Today
          </span>
        </div>

        {calendarEventModal && (
          <div className="modal-overlay" onClick={closeCalendarEventModal}>
            <div className="modal-content calendar-event-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{calendarEventModal.mode === "add" ? "Add event" : "Edit event"}</h3>
              <label className="calendar-event-field">
                Date
                <input
                  type="date"
                  value={calendarEventModal.mode === "add" ? (calendarEventModal.date || "") : calendarEventForm.event_date}
                  onChange={(e) => {
                    const v = e.target.value || "";
                    if (calendarEventModal.mode === "add") setCalendarEventModal((m) => ({ ...m, date: v }));
                    else setCalendarEventForm((f) => ({ ...f, event_date: v }));
                  }}
                />
              </label>
              <label className="calendar-event-field">
                Title
                <input
                  type="text"
                  value={calendarEventForm.title}
                  onChange={(e) => setCalendarEventForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Interview - Meta"
                />
              </label>
              <label className="calendar-event-field">
                Start time
                <input
                  type="time"
                  value={calendarEventForm.start_time}
                  onChange={(e) => setCalendarEventForm((f) => ({ ...f, start_time: e.target.value }))}
                />
              </label>
              <label className="calendar-event-field">
                End time
                <input
                  type="time"
                  value={calendarEventForm.end_time}
                  onChange={(e) => setCalendarEventForm((f) => ({ ...f, end_time: e.target.value }))}
                />
              </label>
              <label className="calendar-event-field">
                Notes
                <textarea
                  value={calendarEventForm.notes}
                  onChange={(e) => setCalendarEventForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
                  rows={2}
                />
              </label>
              {calendarEventError && <p className="calendar-event-error">{calendarEventError}</p>}
              <div className="calendar-event-actions">
                <button type="button" onClick={saveCalendarEvent} disabled={calendarEventSaving} className="submit-btn">
                  {calendarEventSaving ? "Saving..." : "Save"}
                </button>
                {calendarEventModal.mode === "edit" && (
                  <button type="button" onClick={deleteCalendarEvent} disabled={calendarEventSaving} className="back-btn">
                    Delete
                  </button>
                )}
                <button type="button" onClick={closeCalendarEventModal} className="back-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettingsView = () => {
    return (
      <div className="content settings-page">
        <h2>Settings</h2>
        <p>Update your profile name.</p>

        <div className="settings-form">
          <label className="settings-label">
            Full name
            <input
              type="text"
              value={settingsFullName}
              onChange={(e) => setSettingsFullName(e.target.value)}
              placeholder="e.g., Vinisha Patel"
              disabled={settingsSaving}
            />
          </label>

          {settingsError && <p className="settings-error">{settingsError}</p>}

          <button type="button" onClick={saveSettings} disabled={settingsSaving} className="submit-btn">
            {settingsSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="top-left-actions">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="toggle-btn"
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
      <div className="top-right-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setCurrentView("settings")}
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </button>
        <button onClick={handleLogout} className="logout-btn top-right-logout">
          Logout
        </button>
      </div>
      <div className="card">
        <h1>
          Welcome, {String((user.full_name || user.username || "")).trim().split(/\s+/)[0] || "there"}!
        </h1>
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
          <button
            onClick={() => setCurrentView("calendar")}
            className={currentView === "calendar" ? "active" : ""}
          >
            Calendar
          </button>
        </div>
      
        {currentView === "interview" && renderInterviewView()}
        {currentView === "dashboard" && renderDashboardView()}
        {currentView === "calendar" && renderCalendarView()}
        {currentView === "settings" && renderSettingsView()}
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
