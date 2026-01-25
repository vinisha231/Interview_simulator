import React from 'react';

export default function TechnicalInterviewBox({
  userAnswer,
  setUserAnswer,
  submitAnswer,
  isListening,
  setIsListening,
  recognitionRef,
  isLoading
}) {
  return (
    <div className="answer-section">
      <h3>Your Answer:</h3>
      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Type your answer here..."
        rows={6}
        disabled={isLoading}
      />
      <div style={{ margin: '10px 0' }}>
        <button
          onClick={() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
              setIsListening(true);
            }
          }}
          disabled={isListening || isLoading}
          className="submit-btn"
        >
          {isListening ? "Listening..." : "Start Speaking"}
        </button>
      </div>
      <button 
        onClick={submitAnswer}
        disabled={isLoading || !userAnswer.trim()}
        className="submit-btn"
      >
        {isLoading ? "Evaluating..." : "Submit Answer"}
      </button>
    </div>
  );
}