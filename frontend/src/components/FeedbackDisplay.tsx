import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, TrendingUp, Home } from "lucide-react";

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  overall: string;
}

interface FeedbackDisplayProps {
  feedback: Feedback;
  onStartNew: () => void;
}

export const FeedbackDisplay = ({ feedback, onStartNew }: FeedbackDisplayProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Work";
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Interview Complete!</h2>
          <p className="text-xl text-muted-foreground">
            Here's your detailed performance feedback
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-8 text-center shadow-medium animate-slide-up">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Overall Score
            </h3>
            <div className={`text-7xl font-bold mb-2 ${getScoreColor(feedback.score)}`}>
              {feedback.score}
              <span className="text-3xl text-muted-foreground">/100</span>
            </div>
            <Badge className="text-base px-4 py-1">
              {getScoreBadge(feedback.score)}
            </Badge>
          </Card>

          <Card className="p-8 shadow-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-success mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-3">Strengths</h3>
                <ul className="space-y-3">
                  {feedback.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-success">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 shadow-medium animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-warning mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-3">Areas for Improvement</h3>
                <ul className="space-y-3">
                  {feedback.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-warning">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-muted/50 shadow-medium animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-3">Overall Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feedback.overall}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button 
              variant="hero" 
              size="lg" 
              onClick={onStartNew}
              className="flex-1"
            >
              Practice Another Interview
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={onStartNew}
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
