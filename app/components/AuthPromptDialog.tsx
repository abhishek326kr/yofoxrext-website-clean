"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Award, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

export default function AuthPromptDialog({ 
  open, 
  onOpenChange,
  action = "continue"
}: AuthPromptDialogProps) {
  const { login } = useAuth();

  const handleLogin = () => {
    login();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center mb-2">
            Join YoForex Community
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            <p className="text-base">
              Sign in to {action} and be part of thousands of successful traders!
            </p>
            
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <MessageSquare className="h-8 w-8 text-primary" />
                <span className="text-xs font-semibold">Share Strategies</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Award className="h-8 w-8 text-chart-3" />
                <span className="text-xs font-semibold">Earn Gold Coins</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <TrendingUp className="h-8 w-8 text-chart-4" />
                <span className="text-xs font-semibold">Access Premium EAs</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Users className="h-8 w-8 text-chart-2" />
                <span className="text-xs font-semibold">Connect with Pros</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Free forever • No credit card required
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-auth"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleLogin}
            data-testid="button-login-auth"
            className="min-w-[140px]"
          >
            Sign In / Sign Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
