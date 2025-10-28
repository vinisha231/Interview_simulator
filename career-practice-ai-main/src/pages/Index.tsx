import { useState } from "react";
import { Hero } from "@/components/Hero";
import { InterviewTypeSelector } from "@/components/InterviewTypeSelector";
import { InterviewSession } from "@/components/InterviewSession";
import { FeedbackDisplay } from "@/components/FeedbackDisplay";
import { Navigation } from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";

type Screen = 'hero' | 'selector' | 'interview' | 'feedback' | 'dashboard';
type InterviewType = 'technical' | 'behavioral';

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  overall: string;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('hero');
  const [interviewType, setInterviewType] = useState<InterviewType>('technical');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleGetStarted = () => {
    setCurrentScreen('selector');
  };

  const handleSelectType = (type: InterviewType) => {
    setInterviewType(type);
    setCurrentScreen('interview');
  };

  const handleComplete = (feedbackData: Feedback) => {
    setFeedback(feedbackData);
    setCurrentScreen('feedback');
  };

  const handleStartNew = () => {
    setCurrentScreen('selector');
    setFeedback(null);
  };

  const handleNavigate = (screen: 'hero' | 'dashboard') => {
    setCurrentScreen(screen);
    setFeedback(null);
  };

  const handleExitInterview = () => {
    setCurrentScreen('selector');
    setFeedback(null);
  };

  return (
    <div className="min-h-screen">
      <Navigation 
        onNavigate={handleNavigate}
        onExit={handleExitInterview}
        showExit={currentScreen === 'interview'}
        currentScreen={currentScreen}
      />
      
      {currentScreen === 'hero' && <Hero onGetStarted={handleGetStarted} />}
      {currentScreen === 'selector' && <InterviewTypeSelector onSelectType={handleSelectType} />}
      {currentScreen === 'interview' && (
        <InterviewSession type={interviewType} onComplete={handleComplete} />
      )}
      {currentScreen === 'feedback' && feedback && (
        <FeedbackDisplay feedback={feedback} onStartNew={handleStartNew} />
      )}
      {currentScreen === 'dashboard' && <Dashboard onStartInterview={handleGetStarted} />}
    </div>
  );
};

export default Index;
