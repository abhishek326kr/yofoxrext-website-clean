"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Mail,
  Lock,
  User,
  Sparkles,
  LogIn,
  UserPlus,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { signInWithGoogle, isGoogleAuthEnabled } from "@/lib/firebase";

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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // Reset form when modal closes or mode changes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setUsername("");
      setMode("login");
    }
  }, [open]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" 
        ? { email, password }
        : { email, password, username };

      const response = await apiRequest("POST", endpoint, payload);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `${mode === "login" ? "Login" : "Registration"} failed`);
      }

      // Refresh user data
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/me"] });

      toast({
        title: mode === "login" ? "Login Successful" : "Account Created",
        description: mode === "login" 
          ? "Welcome back to YoForex!" 
          : "Your account has been created successfully!",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: mode === "login" ? "Login Failed" : "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      // Sign in with Google and get ID token
      const idToken = await signInWithGoogle();

      // Send ID token to backend for verification
      const response = await apiRequest("POST", "/api/auth/google", { idToken });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      // Refresh user data
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/me"] });

      toast({
        title: "Login Successful",
        description: "Welcome to YoForex!",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Google auth error:", error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-chart-3 to-chart-4 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <Sparkles className="h-12 w-12 text-primary relative z-10" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl text-center mb-2">
            {mode === "login" ? "Welcome Back!" : "Join YoForex"}
          </DialogTitle>
          
          <DialogDescription className="text-center">
            {mode === "login" 
              ? "Sign in to access your account and continue trading" 
              : "Create an account to start earning coins and sharing strategies"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Sign-In Button - Only show if Firebase is configured */}
          {isGoogleAuthEnabled && (
            <>
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
                className="w-full gap-2 border-2"
                data-testid="button-google-signin"
              >
                <SiGoogle className="h-5 w-5 text-red-500" />
                Continue with Google
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>
            </>
          )}

          {/* Helpful message if only email/password is available */}
          {!isGoogleAuthEnabled && (
            <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
              Sign in with your email and password
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-username"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "signup" ? "Minimum 8 characters" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-chart-4 hover:opacity-90"
              disabled={isLoading}
              data-testid={mode === "login" ? "button-login" : "button-signup"}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </span>
              )}
            </Button>
          </form>

          {/* Toggle between login and signup */}
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              disabled={isLoading}
              className="text-primary hover:underline disabled:opacity-50"
              data-testid="button-toggle-mode"
            >
              {mode === "login" 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
