"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ActivityTracker } from "@/components/ActivityTracker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ErrorTracker from "@/lib/errorTracking";

// Client-side error tracker initialization component
function ErrorTrackerBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize ErrorTracker to register all browser event handlers
    // This ensures window.onerror, unhandledrejection, and console.error 
    // interception are active from app startup
    const tracker = ErrorTracker.getInstance();
    
    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[ErrorTracker] Initialized - global error handlers registered');
    }
    
    // Cleanup is handled internally by ErrorTracker
    return () => {
      // No cleanup needed - ErrorTracker persists for app lifetime
    };
  }, []);
  
  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <ErrorTrackerBootstrap>
                <ActivityTracker />
                {children}
                <Toaster />
              </ErrorTrackerBootstrap>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
