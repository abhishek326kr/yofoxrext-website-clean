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
import { signInWithGoogle, checkGoogleSignInRedirect, isGoogleAuthEnabled } from "@/lib/firebase";

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
  const mode: "login" | "signup" = "login"; // Signup disabled - admins only
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check for Google Sign-In redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      // Check if we're returning from a Google sign-in redirect
      if (localStorage.getItem('googleSignInPending') === 'true') {
        setIsLoading(true);
        try {
          const idToken = await checkGoogleSignInRedirect();
          
          if (idToken) {
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
          }
        } catch (error: any) {
          console.error("Google redirect auth error:", error);
          toast({
            title: "Google Sign-In Failed",
            description: error.message || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          localStorage.removeItem('googleSignInPending');
        }
      }
    };

    handleRedirectResult();
  }, []);

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

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setUsername("");
    }
  }, [open]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/login" : "/api/register";
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
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <Sparkles className="h-14 w-14 text-primary relative z-10" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {mode === "login" ? "Welcome Back to YoForex!" : "Create Your Account"}
          </DialogTitle>
          
          <DialogDescription className="text-center text-muted-foreground">
            {mode === "login" 
              ? "Sign in to access exclusive trading tools and community features" 
              : "Join thousands of traders sharing strategies and earning rewards"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Google Sign-In Section - Always show button for better UX */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading || !isGoogleAuthEnabled}
              variant="outline"
              className={`w-full h-12 gap-3 font-medium transition-all ${
                isGoogleAuthEnabled 
                  ? 'border-2 hover:bg-slate-50 dark:hover:bg-slate-900 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700' 
                  : 'opacity-50 cursor-not-allowed border-muted'
              }`}
              data-testid="button-google-signin"
            >
              <div className="bg-white rounded-full p-1">
                <SiGoogle className="h-5 w-5" style={{ color: '#4285F4' }} />
              </div>
              <span className="text-base">
                {isGoogleAuthEnabled ? "Continue with Google" : "Google Sign-In (Coming Soon)"}
              </span>
            </Button>
            
            {!isGoogleAuthEnabled && (
              <p className="text-xs text-center text-muted-foreground italic">
                Google Sign-In is currently being set up
              </p>
            )}
          </div>

          {/* Divider - Always show for consistency */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                {isGoogleAuthEnabled ? "Or continue with email" : "Sign in with email"}
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                  data-testid="input-username"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Password
                {mode === "signup" && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Min. 8 characters
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                className="h-11"
                data-testid="input-password"
              />
              {mode === "login" && (
                <p className="text-xs text-muted-foreground text-right mt-1">
                  <button 
                    type="button" 
                    className="hover:underline"
                    onClick={() => toast({
                      title: "Password Reset",
                      description: "Password reset feature coming soon!",
                    })}
                  >
                    Forgot password?
                  </button>
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
              data-testid={mode === "login" ? "button-login" : "button-signup"}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
