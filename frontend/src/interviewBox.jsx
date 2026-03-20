import React, { useMemo } from 'react';

const LANGUAGE_EXT = {
  Python: "py",
  JavaScript: "js",
  Java: "java",
  C: "c",
  "C++": "cpp",
  "C#": "cs",
  Go: "go",
  Rust: "rs",
  TypeScript: "ts",
  SQL: "sql",
};

export default function TechnicalInterviewBox({
  userAnswer,
  setUserAnswer,
  submitAnswer,
  isLoading,
  isTechnical,
  programmingLanguage = "Python",
  inputDisabled = false,
  showSpeechControls = true,
  speechRecognitionAvailable = false,
  isSpeechListening = false,
  isOtherSpeechActive = false,
  onStartSpeaking,
  onStopSpeaking,
}) {
  const disabled = isLoading || inputDisabled;
  const solutionFileName = isTechnical
    ? `solution.${LANGUAGE_EXT[programmingLanguage] || "py"}`
    : null;
  const lineCount = useMemo(
    () => Math.max(1, userAnswer.split("\n").length),
    [userAnswer]
  );
  const canShowSpeech =
    showSpeechControls && speechRecognitionAvailable && onStartSpeaking && onStopSpeaking;

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
            <div className="ide-tab">{solutionFileName || "solution.js"}</div>
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
              disabled={disabled}
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
          disabled={disabled}
        />
      )}
      {canShowSpeech && (
        <div style={{ margin: '10px 0' }}>
          {!isSpeechListening ? (
            <button
              type="button"
              onClick={onStartSpeaking}
              disabled={disabled || isOtherSpeechActive}
              className="submit-btn"
            >
              Start Speaking
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopSpeaking}
              disabled={disabled}
              className="submit-btn"
            >
              Stop Speaking
            </button>
          )}
        </div>
      )}
      <button 
        onClick={submitAnswer}
        disabled={disabled || !userAnswer.trim()}
        className="submit-btn"
      >
        {inputDisabled ? "Time's up" : isLoading ? "Evaluating..." : "Submit Answer"}
      </button>
    </div>
  );
}
