import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  Target,
  Award,
  BarChart3
} from "lucide-react";

interface SessionHistory {
  id: string;
  type: 'technical' | 'behavioral';
  date: string;
  score: number;
  duration: string;
}

interface DashboardProps {
  onStartInterview: () => void;
}

// Mock data - will be replaced with real data from Lovable Cloud
const mockHistory: SessionHistory[] = [
  { id: '1', type: 'technical', date: '2025-01-15', score: 85, duration: '25 min' },
  { id: '2', type: 'behavioral', date: '2025-01-14', score: 78, duration: '20 min' },
  { id: '3', type: 'technical', date: '2025-01-12', score: 92, duration: '30 min' },
];

const mockStrengths = [
  "Clear communication style",
  "Strong problem-solving approach",
  "Good use of examples",
  "Technical accuracy",
];

const mockWeaknesses = [
  "Could elaborate more on trade-offs",
  "Time management in responses",
  "Body language confidence",
];

export const Dashboard = ({ onStartInterview }: DashboardProps) => {
  const averageScore = Math.round(
    mockHistory.reduce((acc, session) => acc + session.score, 0) / mockHistory.length
  );

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and improve your interview skills</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-medium animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-primary" />
              <Badge variant="outline">Avg</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{averageScore}</div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </Card>

          <Card className="p-6 shadow-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-secondary" />
              <Badge variant="outline">Total</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{mockHistory.length}</div>
            <div className="text-sm text-muted-foreground">Sessions Completed</div>
          </Card>

          <Card className="p-6 shadow-medium animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-accent" />
              <Badge variant="outline">Best</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">92</div>
            <div className="text-sm text-muted-foreground">Highest Score</div>
          </Card>

          <Card className="p-6 shadow-medium animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-warning" />
              <Badge variant="outline">Avg</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">25</div>
            <div className="text-sm text-muted-foreground">Minutes per Session</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Session History */}
          <Card className="p-6 lg:col-span-2 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Sessions</h2>
              <Button onClick={onStartInterview}>
                Start New Interview
              </Button>
            </div>
            
            <div className="space-y-4">
              {mockHistory.map((session) => (
                <Card key={session.id} className="p-4 hover:shadow-soft transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={session.type === 'technical' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {session.type}
                      </Badge>
                      <div>
                        <div className="font-medium">Interview Session</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.date).toLocaleDateString()}
                          <Clock className="w-3 h-3 ml-2" />
                          {session.duration}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{session.score}</div>
                      <div className="text-xs text-muted-foreground">score</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="space-y-6">
            <Card className="p-6 shadow-medium">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-success" />
                <h3 className="text-xl font-bold">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {mockStrengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0"></div>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 shadow-medium">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-warning" />
                <h3 className="text-xl font-bold">Areas to Improve</h3>
              </div>
              <ul className="space-y-3">
                {mockWeaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0"></div>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
