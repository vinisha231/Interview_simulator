import React, { useState, useEffect, useRef } from 'react';

export default function TechnicalInterviewBox() {
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const speechToText = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(speechToText);
      };
    } else {
      alert('Web Speech API is not supported in this browser.');
    }
  }, []);

  const startListening = () => {
    recognitionRef.current && recognitionRef.current.start();
  };

  const sendFeedback = async () => {
    try {
      const res = await fetch('http://localhost:5000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: transcript })
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (err) {
      setFeedback('Error sending feedback');
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #333', borderRadius: '12px', maxWidth: '600px', margin: '20px auto', backgroundColor: '#222', color: 'white' }}>
      <button onClick={startListening}>Start Speaking</button>
      <p><strong>Your Answer:</strong> {transcript}</p>
      <button onClick={sendFeedback}>Send for Feedback</button>
      <p><strong>Feedback:</strong> {feedback}</p>
    </div>
  );
}