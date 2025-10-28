import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import aiInterviewerImage from "@/assets/ai-interviewer.jpg";

interface AIInterviewerProps {
  question: string;
  videoEnabled: boolean;
  onToggleVideo: () => void;
}

export const AIInterviewer = ({ question, videoEnabled, onToggleVideo }: AIInterviewerProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    if (videoEnabled && question) {
      // Simulate speaking animation
      setIsSpeaking(true);
      const timer = setTimeout(() => setIsSpeaking(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [question, videoEnabled]);

  if (!videoEnabled) {
    return (
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVideo}
        >
          <Video className="w-4 h-4 mr-2" />
          Enable Video Interviewer
        </Button>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden mb-6 shadow-medium animate-fade-in">
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
        <img 
          src={aiInterviewerImage}
          alt="AI Interviewer"
          className="w-full h-full object-cover"
        />
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-background/90 rounded-full">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse"></div>
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs font-medium">Speaking...</span>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleVideo}
          >
            <VideoOff className="w-4 h-4" />
          </Button>
        </div>

        {/* Interviewer info */}
        <div className="absolute bottom-4 right-4 px-3 py-2 bg-background/90 rounded-full">
          <span className="text-xs font-medium">AI Interviewer</span>
        </div>
      </div>
    </Card>
  );
};
