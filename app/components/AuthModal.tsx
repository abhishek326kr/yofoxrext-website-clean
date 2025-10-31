"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  Sparkles, 
  Trophy,
  DollarSign,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

export default function AuthModal({ 
  open, 
  onOpenChange,
  action = "continue"
}: AuthModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Close modal if user becomes authenticated
  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
      toast({
        title: "Welcome to YoForex!",
        description: "You're now signed in and ready to explore.",
        variant: "default",
      });
    }
  }, [user, open, onOpenChange, toast]);

  const handleSignIn = () => {
    setIsAuthenticating(true);
    
    // Open Replit auth in a popup window
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    
    const authWindow = window.open(
      "/api/login",
      "replit-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );
    
    if (!authWindow) {
      toast({
        title: "Pop-up blocked",
        description: "Please allow pop-ups for this site to sign in.",
        variant: "destructive",
      });
      setIsAuthenticating(false);
      return;
    }
    
    // Monitor the popup window
    const checkInterval = setInterval(() => {
      try {
        // Check if popup was closed
        if (authWindow.closed) {
          clearInterval(checkInterval);
          setIsAuthenticating(false);
          
          // Refresh user data after popup closes
          queryClient.invalidateQueries({ queryKey: ["/api/me"] });
          
          // Check if authentication was successful after a short delay
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/me"] });
          }, 500);
        }
      } catch (error) {
        // Handle cross-origin errors gracefully
        console.log("Auth window monitoring:", error);
      }
    }, 500);
    
    // Clean up interval after 5 minutes (timeout)
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!authWindow.closed) {
        authWindow.close();
      }
      setIsAuthenticating(false);
    }, 5 * 60 * 1000);
  };

  const benefits = [
    {
      icon: MessageSquare,
      title: "Start Discussions",
      description: "Share your trading strategies and insights",
      color: "text-primary"
    },
    {
      icon: Award,
      title: "Earn Gold Coins",
      description: "Get rewarded for your contributions",
      color: "text-chart-3"
    },
    {
      icon: TrendingUp,
      title: "Premium EAs",
      description: "Access top-rated trading algorithms",
      color: "text-chart-4"
    },
    {
      icon: Users,
      title: "Pro Community",
      description: "Connect with experienced traders",
      color: "text-chart-2"
    },
    {
      icon: Trophy,
      title: "Achievements",
      description: "Unlock badges and climb the leaderboard",
      color: "text-yellow-500"
    },
    {
      icon: Shield,
      title: "Trusted Network",
      description: "Join a verified trading community",
      color: "text-blue-500"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-chart-3 to-chart-4 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <Sparkles className="h-16 w-16 text-primary relative z-10" />
            </div>
          </div>
          
          <DialogTitle className="text-3xl text-center mb-3 bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
            Sign in to YoForex
          </DialogTitle>
          
          <DialogDescription className="text-center space-y-6">
            <p className="text-lg font-medium text-foreground">
              Join the YoForex community to start posting threads and earning coins
            </p>
            
            <p className="text-base text-muted-foreground">
              Unlock exclusive features to {action} and accelerate your trading journey
            </p>
            
            <div className="grid grid-cols-2 gap-3 my-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors group"
                  >
                    <Icon className={`h-8 w-8 ${benefit.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-sm font-semibold">{benefit.title}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {benefit.description}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Secure login</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span>Instant rewards</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isAuthenticating}
            data-testid="button-cancel-auth"
            className="min-w-[120px]"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleSignIn}
            disabled={isAuthenticating}
            data-testid="button-signin-auth"
            className="min-w-[180px] bg-gradient-to-r from-primary to-chart-4 hover:opacity-90"
          >
            {isAuthenticating ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Authenticating...
              </span>
            ) : (
              "Sign In / Sign Up"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}