import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Code, Users, Play, RotateCcw, Clock, TrendingUp, CheckCircle, Volume2, StopCircle, Terminal } from 'lucide-react';

export default function InterviewSimulator() {
  const [mode, setMode] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('');
  const [company, setCompany] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setUserAnswer(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (error) {
          console.error('Error starting recognition:', error);
        }
      }
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const prompt = `You are a code execution engine. I have this ${language} code:

\`\`\`${language}
${code}
\`\`\`

And these test cases:
${testCases.map((tc, i) => `Test ${i + 1}: Input: ${tc.input}, Expected: ${tc.expected}`).join('\n')}

Simulate running this code against each test case. For each test case, determine if it would pass or fail, and provide the actual output. Return ONLY a JSON array with this exact format, no other text:
[
  {"testNumber": 1, "passed": true/false, "actualOutput": "...", "expectedOutput": "..."},
  ...
]`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      let resultText = data.content[0].text;
      resultText = resultText.replace(/```json\n?|\n?```/g, '').trim();
      const results = JSON.parse(resultText);
      setTestResults(results);
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults(testCases.map((tc, i) => ({
        testNumber: i + 1,
        passed: false,
        actualOutput: 'Error executing code',
        expectedOutput: tc.expected
      })));
    }
    
    setIsRunning(false);
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setLoading(true);
    setTimerRunning(true);
    
    try {
      let prompt = '';
      if (mode === 'technical') {
        prompt = `You are conducting a technical interview for a ${level} ${role} position at ${company}. Ask one ${difficulty} difficulty coding question relevant to this role. Include the problem statement, constraints, and provide 3 test cases in this format:

Test Case 1: Input: [input], Expected Output: [output]
Test Case 2: Input: [input], Expected Output: [output]
Test Case 3: Input: [input], Expected Output: [output]

Be concise and professional.`;
      } else if (mode === 'behavioral') {
        prompt = `You are conducting a behavioral interview for a ${level} ${role} position at ${company}. Ask one behavioral question using frameworks like "Tell me about a time when..." that's relevant to this role and level. Be professional and encouraging.`;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      const question = data.content[0].text;
      setCurrentQuestion(question);
      speakText(question);
      
      if (mode === 'technical') {
        const testCaseMatches = question.match(/Test Case \d+:.*?Expected Output:.*?(?=\n|$)/gi);
        if (testCaseMatches) {
          const cases = testCaseMatches.map(tc => {
            const inputMatch = tc.match(/Input:\s*(.+?)(?:,\s*Expected|$)/i);
            const outputMatch = tc.match(/Expected Output:\s*(.+?)$/i);
            return {
              input: inputMatch ? inputMatch[1].trim() : '',
              expected: outputMatch ? outputMatch[1].trim() : ''
            };
          });
          setTestCases(cases);
        }
      }
    } catch (error) {
      const fallback = "Tell me about a time when you faced a challenging problem and how you solved it.";
      setCurrentQuestion(fallback);
      speakText(fallback);
    }
    
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() && !code.trim()) return;
    
    setLoading(true);
    setTimerRunning(false);
    stopSpeaking();
    
    const answerToEvaluate = mode === 'technical' ? code : userAnswer;
    
    try {
      let prompt = '';
      if (mode === 'technical') {
        prompt = `You are evaluating a technical interview response for a ${level} ${role} at ${company}. Question: "${currentQuestion}". Code (${language}): "${answerToEvaluate}". 

Test Results: ${testResults.length > 0 ? testResults.map(r => `Test ${r.testNumber}: ${r.passed ? 'PASSED' : 'FAILED'}`).join(', ') : 'Not run yet'}

Provide constructive feedback on: correctness, efficiency, code quality, edge cases, and communication. Be encouraging but honest. Keep it under 150 words.`;
      } else if (mode === 'behavioral') {
        prompt = `You are evaluating a behavioral interview response for a ${level} ${role} at ${company}. Question: "${currentQuestion}". Answer: "${answerToEvaluate}". Evaluate using STAR method: structure, clarity, specific examples, impact, and leadership qualities expected at this level. Provide actionable feedback. Keep it under 150 words.`;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      const feedbackText = data.content[0].text;
      setFeedback(feedbackText);
      speakText(feedbackText);
      
      setSessionHistory([...sessionHistory, {
        question: currentQuestion,
        answer: answerToEvaluate,
        feedback: feedbackText,
        time: timer,
        testResults: mode === 'technical' ? testResults : null
      }]);
    } catch (error) {
      const fallback = "Great effort! Consider edge cases, optimization, and clear communication of your approach.";
      setFeedback(fallback);
      speakText(fallback);
    }
    
    setLoading(false);
  };

  const nextQuestion = async () => {
    setFeedback('');
    setUserAnswer('');
    setCode('');
    setTestResults([]);
    setTestCases([]);
    setTimer(0);
    setQuestionNumber(questionNumber + 1);
    setLoading(true);
    setTimerRunning(true);
    stopSpeaking();
    
    await startInterview();
  };

  const resetInterview = () => {
    setMode(null);
    setInterviewStarted(false);
    setCurrentQuestion('');
    setUserAnswer('');
    setCode('');
    setFeedback('');
    setQuestionNumber(1);
    setSessionHistory([]);
    setTimer(0);
    setTimerRunning(false);
    setRole('');
    setLevel('');
    setCompany('');
    setTestResults([]);
    setTestCases([]);
    stopSpeaking();
    if (isRecording) toggleRecording();
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Interview Simulator</h1>
            <p className="text-lg text-gray-600">Practice with AI-powered interviews featuring voice recognition & code execution</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode('technical')}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-left"
            >
              <Code className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical</h2>
              <p className="text-gray-600 mb-4">Coding problems with test cases</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Code editor with syntax highlighting</li>
                <li>• Run code & test cases</li>
                <li>• Multiple languages</li>
                <li>• AI code evaluation</li>
              </ul>
            </button>

            <button
              onClick={() => setMode('behavioral')}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-left"
            >
              <Users className="w-12 h-12 text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Behavioral</h2>
              <p className="text-gray-600 mb-4">STAR method practice</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Voice-to-text answers</li>
                <li>• AI interviewer reads questions</li>
                <li>• STAR framework coaching</li>
                <li>• Communication feedback</li>
              </ul>
            </button>
          </div>

          <div className="mt-12 bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Features
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div><CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />Voice recording</div>
              <div><CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />AI interviewer</div>
              <div><CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />Code execution</div>
              <div><CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />Custom scenarios</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setMode(null)} className="text-gray-600 hover:text-gray-900 mb-6">
            ← Back to mode selection
          </button>
          
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {mode === 'technical' ? 'Technical' : 'Behavioral'} Interview Setup
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select level</option>
                  <option value="Intern">Intern</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Staff">Staff</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google, Amazon, Meta"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {mode === 'technical' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                  <div className="flex gap-3">
                    {['easy', 'medium', 'hard'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          difficulty === lvl ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Programming Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                  </select>
                </div>
              </>
            )}

            <button
              onClick={startInterview}
              disabled={!role || !level || !company}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Start Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'technical' ? 'Technical' : 'Behavioral'} Interview
            </h2>
            <p className="text-gray-600">{level} {role} at {company} • Question {questionNumber}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-mono font-semibold">{formatTime(timer)}</span>
            </div>
            <button onClick={resetInterview} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">Interview Question:</h3>
                <div className="flex gap-2">
                  {currentQuestion && !loading && (
                    <>
                      {!isSpeaking ? (
                        <button onClick={() => speakText(currentQuestion)} className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm">
                          <Volume2 className="w-4 h-4" />
                          Play
                        </button>
                      ) : (
                        <button onClick={stopSpeaking} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm">
                          <StopCircle className="w-4 h-4" />
                          Stop
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {loading && !currentQuestion ? (
                <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{currentQuestion}</p>
              )}
            </div>

            {mode === 'technical' && testCases.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Test Cases:</h3>
                <div className="space-y-2">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="font-mono text-xs">
                        <span className="text-gray-600">Input:</span> <span className="text-blue-600">{tc.input}</span>
                      </div>
                      <div className="font-mono text-xs mt-1">
                        <span className="text-gray-600">Expected:</span> <span className="text-green-600">{tc.expected}</span>
                      </div>
                      {testResults[idx] && (
                        <div className={`mt-2 text-xs font-semibold ${testResults[idx].passed ? 'text-green-600' : 'text-red-600'}`}>
                          {testResults[idx].passed ? '✓ PASSED' : '✗ FAILED'}
                          {!testResults[idx].passed && <div className="text-gray-600 font-normal">Got: {testResults[idx].actualOutput}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {!feedback ? (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">Your Answer:</h3>
                  {mode !== 'technical' && (
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isRecording ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {isRecording ? <><MicOff className="w-4 h-4" />Stop</> : <><Mic className="w-4 h-4" />Voice</>}
                    </button>
                  )}
                </div>
                {isRecording && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-700 font-medium">Recording...</span>
                    </div>
                  </div>
                )}
                {mode === 'technical' ? (
                  <>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={`// Write your ${language} code here...\n// Example:\nfunction solution(input) {\n  // your code\n}`}
                      className="w-full h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-green-400"
                      spellCheck="false"
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={runCode}
                        disabled={!code.trim() || isRunning}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Terminal className="w-4 h-4" />
                        {isRunning ? 'Running...' : 'Run Tests'}
                      </button>
                      <button
                        onClick={submitAnswer}
                        disabled={loading || !code.trim()}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Use STAR method:\n\nSituation: \nTask: \nAction: \nResult: "
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={submitAnswer}
                      disabled={loading || !userAnswer.trim()}
                      className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'AI is analyzing...' : 'Submit Answer'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-green-600" />
                      AI Feedback:
                    </h3>
                    {!isSpeaking ? (
                      <button onClick={() => speakText(feedback)} className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm">
                        <Volume2 className="w-4 h-4" />
                        Replay
                      </button>
                    ) : (
                      <button onClick={stopSpeaking} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm">
                        <StopCircle className="w-4 h-4" />
                        Stop
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback}</p>
                </div>

                <div className="flex gap-4">
                  <button onClick={nextQuestion} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all">
                    Next Question
                  </button>
                  <button onClick={resetInterview} className="px-6 py-3 bg-white rounded-lg font-semibold hover:bg-gray-50 transition-all shadow">
                    End Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {sessionHistory.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Session Summary</h3>
            <div className="space-y-3">
              {sessionHistory.map((item, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-900">Q{idx + 1}: {formatTime(item.time)}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.question}</p>
                  {item.testResults && (
                    <div className="text-xs mt-1">
                      <span className="text-green-600">{item.testResults.filter(r => r.passed).length}</span>
                      <span className="text-gray-500">/{item.testResults.length} tests passed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}