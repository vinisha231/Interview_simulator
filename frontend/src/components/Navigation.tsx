import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NavigationProps {
  onNavigate: (screen: 'hero' | 'dashboard') => void;
  onExit?: () => void;
  showExit?: boolean;
  currentScreen?: string;
}

export const Navigation = ({ onNavigate, onExit, showExit = false, currentScreen }: NavigationProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary"></div>
          <span className="text-xl font-bold">InterviewAI</span>
        </div>
        
        <div className="flex items-center gap-2">
          {currentScreen !== 'hero' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('hero')}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('dashboard')}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </>
          )}
          
          {showExit && onExit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Exit Interview
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Exit Interview?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to exit? Your current progress will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Interview</AlertDialogCancel>
                  <AlertDialogAction onClick={onExit}>
                    Exit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </nav>
  );
};
