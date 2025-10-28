import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, MessageSquare, ArrowRight } from "lucide-react";

interface InterviewTypeSelectorProps {
  onSelectType: (type: 'technical' | 'behavioral') => void;
}

export const InterviewTypeSelector = ({ onSelectType }: InterviewTypeSelectorProps) => {
  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Choose Your Interview Type</h2>
          <p className="text-xl text-muted-foreground">
            Select the type of interview you want to practice
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 hover:shadow-large transition-all duration-300 cursor-pointer group animate-slide-up border-2 hover:border-primary">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code2 className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-2">Technical Interview</h3>
                <p className="text-muted-foreground">
                  Practice coding questions, algorithms, system design, and technical problem-solving.
                </p>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Data structures & algorithms</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>System design questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Code optimization tips</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => onSelectType('technical')} 
                className="w-full group"
                size="lg"
              >
                Start Technical Interview
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
          
          <Card className="p-8 hover:shadow-large transition-all duration-300 cursor-pointer group animate-slide-up border-2 hover:border-secondary" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8 text-secondary" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-2">Behavioral Interview</h3>
                <p className="text-muted-foreground">
                  Prepare for questions about your experience, teamwork, and soft skills.
                </p>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                  <span>STAR method practice</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                  <span>Leadership scenarios</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                  <span>Communication tips</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => onSelectType('behavioral')} 
                variant="secondary"
                className="w-full group"
                size="lg"
              >
                Start Behavioral Interview
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
