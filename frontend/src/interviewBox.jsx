import React, { useMemo } from 'react';

export default function TechnicalInterviewBox({
  userAnswer,
  setUserAnswer,
  submitAnswer,
  isListening,
  setIsListening,
  recognitionRef,
  isLoading,
  isTechnical
}) {
  const lineCount = useMemo(
    () => Math.max(1, userAnswer.split("\n").length),
    [userAnswer]
  );

  return (
    <div className={`answer-section ${isTechnical ? "ide-answer" : ""}`}>
      <h3>Your Answer:</h3>
      {isTechnical ? (
        <div className="ide-container">
          <div className="ide-titlebar">
            <div className="ide-dots">
              <span className="ide-dot red" />
              <span className="ide-dot yellow" />
              <span className="ide-dot green" />
            </div>
            <div className="ide-tab">solution.js</div>
            <div className="ide-spacer" />
          </div>
          <div className="ide-editor">
            <div className="ide-gutter">
              {Array.from({ length: lineCount }, (_, index) => (
                <div key={index} className="ide-line-number">
                  {index + 1}
                </div>
              ))}
            </div>
            <textarea
              className="ide-textarea"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="// Write your answer here..."
              rows={14}
              disabled={isLoading}
            />
            <div className="ide-minimap">
              {Array.from({ length: Math.min(lineCount, 40) }, (_, index) => (
                <div key={index} className="ide-minimap-line" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={8}
          disabled={isLoading}
        />
      )}
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