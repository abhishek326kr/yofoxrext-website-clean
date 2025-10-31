"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthPromptDialog from "@/components/AuthPromptDialog";

export function useAuthPrompt(action: string = "continue") {
  const { user, isLoading } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  const requireAuth = (callback: () => void) => {
    if (isLoading) return;
    
    if (!user) {
      setShowPrompt(true);
      return;
    }
    
    callback();
  };

  const AuthPrompt = () => (
    <AuthPromptDialog 
      open={showPrompt} 
      onOpenChange={setShowPrompt}
      action={action}
    />
  );

  return {
    requireAuth,
    AuthPrompt,
    isAuthenticated: !!user,
  };
}
