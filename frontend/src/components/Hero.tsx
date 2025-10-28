import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-interview.jpg";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Interview Coach</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl leading-tight">
              Master Your <br />
              <span className="gradient-primary bg-clip-text text-transparent">
                Interview Skills
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg">
              Practice with our AI interviewer, get instant feedback, and build confidence before your real interview. Available 24/7.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="xl" 
                onClick={onGetStarted}
                className="group"
              >
                Start Practicing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl">
                Learn More
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Practice Sessions</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">4.9/5</div>
                <div className="text-sm text-muted-foreground">User Rating</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </div>
          
          <div className="relative animate-slide-up lg:block hidden">
            <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl"></div>
            <img 
              src={heroImage} 
              alt="Professional interview practice" 
              className="relative rounded-2xl shadow-large w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
