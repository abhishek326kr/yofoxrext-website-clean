"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "../../shared/schema";

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Use relative URLs for API calls (Next.js will rewrite to Express)
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    try {
      // Use new auth logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback to old endpoint if new one fails
      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (fallbackError) {
        console.error("Fallback logout also failed:", fallbackError);
      }
      window.location.href = "/";
    }
  };

  const isAuthenticated = user !== null && user !== undefined;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
