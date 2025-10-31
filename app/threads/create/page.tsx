"use client";

import ThreadCreationWizard from "@/components/ThreadCreationWizard";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateThreadPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || "general";

  // Check if user is authenticated
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/me"],
    retry: false
  });

  // Loading state
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-5xl mx-auto">
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-96 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authentication check
  if (userError || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="p-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be logged in to create a thread. Please log in to continue.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ThreadCreationWizard categorySlug={categorySlug} />
    </div>
  );
}