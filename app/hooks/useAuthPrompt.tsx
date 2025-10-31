"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

export function useAuthPrompt(action: string = "continue") {
  const { user, isLoading } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const pendingCallbackRef = useRef<(() => void) | null>(null);
  const wasAuthenticatedRef = useRef(false);

  // Monitor user state changes and execute pending callback when authenticated
  useEffect(() => {
    // Skip if loading or no user
    if (isLoading) return;
    
    // Check if user just became authenticated (transition from null to user)
    if (user && !wasAuthenticatedRef.current && pendingCallbackRef.current) {
      // Execute the pending callback
      const callback = pendingCallbackRef.current;
      pendingCallbackRef.current = null; // Clear it before execution to prevent double calls
      
      // Execute the callback after a small delay to ensure modal has closed
      setTimeout(() => {
        callback();
        setIsAuthenticating(false);
      }, 100);
    }
    
    // Update the previous auth state
    wasAuthenticatedRef.current = !!user;
  }, [user, isLoading]);

  // Clear pending callback when modal is closed manually (without auth)
  useEffect(() => {
    if (!showPrompt && !user && pendingCallbackRef.current) {
      pendingCallbackRef.current = null;
      setIsAuthenticating(false);
    }
  }, [showPrompt, user]);

  const requireAuth = useCallback((callback: () => void) => {
    // Don't do anything if still loading user data
    if (isLoading) return;
    
    if (!user) {
      // Store the callback to execute after authentication
      pendingCallbackRef.current = callback;
      setIsAuthenticating(true);
      setShowPrompt(true);
      return;
    }
    
    // User is already authenticated, execute immediately
    callback();
  }, [user, isLoading]);

  const handleModalChange = useCallback((open: boolean) => {
    setShowPrompt(open);
    
    // If closing the modal without authentication, clear the pending callback
    if (!open && !user) {
      pendingCallbackRef.current = null;
      setIsAuthenticating(false);
    }
  }, [user]);

  const AuthPrompt = () => (
    <AuthModal 
      open={showPrompt} 
      onOpenChange={handleModalChange}
      action={action}
    />
  );

  return {
    requireAuth,
    AuthPrompt,
    isAuthenticated: !!user,
    isAuthenticating, // New property for loading state
  };
}
