"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogIn, AlertTriangle } from "lucide-react";

interface User {
  id: string;
  username: string;
  role?: string;
}

export function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<"not-authenticated" | "not-admin" | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/me");
        
        if (!response.ok) {
          setAuthError("not-authenticated");
          return;
        }

        const user: User = await response.json();
        
        if (user.role !== "admin" && user.role !== "moderator" && user.role !== "superadmin") {
          setAuthError("not-admin");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthError("not-authenticated");
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (authError === "not-authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be logged in to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button className="w-full" asChild>
                <a href="/api/login">Sign In with Replit</a>
              </Button>
              <Button className="w-full" variant="outline" onClick={() => router.push("/")}>
                Go to Home
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              After signing in, contact an administrator to grant you admin access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authError === "not-admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This area is restricted to administrators only. If you believe you should have access, please contact a system administrator.
              </p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => router.push("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
