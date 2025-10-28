import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIInterviewer } from "@/components/AIInterviewer";

interface InterviewSessionProps {
  type: 'technical' | 'behavioral';
  onComplete: (feedback: Feedback) => void;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  overall: string;
}

export const InterviewSession = ({ type, onComplete }: InterviewSessionProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const { toast } = useToast();
  
  const questions = type === 'technical' 
    ? [
        "Explain the difference between a stack and a queue. When would you use each?",
        "How would you design a URL shortener service like bit.ly?",
        "What is your approach to debugging a production issue?",
      ]
    : [
        "Tell me about a time when you had to work with a difficult team member.",
        "Describe a situation where you had to meet a tight deadline.",
        "How do you handle constructive criticism?",
      ];

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: "Answer required",
        description: "Please provide an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswer("");
      toast({
        title: "Answer recorded",
        description: "Moving to next question...",
      });
    } else {
      // Complete interview
      const mockFeedback: Feedback = {
        score: 85,
        strengths: [
          "Clear and structured responses",
          "Good use of specific examples",
          "Confident communication style",
        ],
        improvements: [
          "Could provide more technical depth",
          "Consider discussing trade-offs more explicitly",
        ],
        overall: "Strong performance overall. You demonstrated good problem-solving skills and clear communication. Focus on diving deeper into technical details and considering alternative approaches.",
      };
      onComplete(mockFeedback);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen py-20 pt-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-base px-4 py-2">
              {type === 'technical' ? 'Technical' : 'Behavioral'} Interview
            </Badge>
            <span className="text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          
          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  idx <= currentQuestion ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <AIInterviewer 
          question={questions[currentQuestion]}
          videoEnabled={videoEnabled}
          onToggleVideo={() => setVideoEnabled(!videoEnabled)}
        />

        <Card className="p-8 mb-6 shadow-medium animate-slide-up">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Interview Question
              </h3>
              <p className="text-2xl font-semibold leading-relaxed">
                {questions[currentQuestion]}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Answer</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... Be specific and use examples."
                className="min-h-[200px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Take your time and provide a thoughtful, detailed response.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Answer...
                </>
              ) : currentQuestion < questions.length - 1 ? (
                <>
                  Submit & Continue
                  <Send className="w-4 h-4" />
                </>
              ) : (
                <>
                  Complete Interview
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-muted/50">
          <h4 className="font-semibold mb-3">💡 Tips for this question:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {type === 'technical' ? (
              <>
                <li>• Start with a clear definition</li>
                <li>• Use concrete examples</li>
                <li>• Discuss time and space complexity</li>
              </>
            ) : (
              <>
                <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                <li>• Be specific about your role</li>
                <li>• Highlight what you learned</li>
              </>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
};
