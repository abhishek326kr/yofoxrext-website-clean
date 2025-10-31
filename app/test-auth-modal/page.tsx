"use client";

import { Button } from "@/components/ui/button";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, UserPlus } from "lucide-react";

export default function TestAuthModalPage() {
  const threadAuth = useAuthPrompt("create a thread");
  const likeAuth = useAuthPrompt("like this post");
  const followAuth = useAuthPrompt("follow this user");
  
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Modal Test</CardTitle>
          <CardDescription>
            Test the new authentication modal from different entry points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Thread Creation
              </h3>
              <p className="text-sm text-muted-foreground">
                Test authentication when trying to create a new thread
              </p>
              <Button
                onClick={() => threadAuth.requireAuth(() => {
                  alert("Success! You would now be able to create a thread.");
                })}
                data-testid="button-test-thread"
              >
                Create Thread (Requires Auth)
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Like Action
              </h3>
              <p className="text-sm text-muted-foreground">
                Test authentication when trying to like a post
              </p>
              <Button
                onClick={() => likeAuth.requireAuth(() => {
                  alert("Success! You would now be able to like this post.");
                })}
                variant="outline"
                data-testid="button-test-like"
              >
                Like Post (Requires Auth)
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Follow User
              </h3>
              <p className="text-sm text-muted-foreground">
                Test authentication when trying to follow a user
              </p>
              <Button
                onClick={() => followAuth.requireAuth(() => {
                  alert("Success! You would now be able to follow this user.");
                })}
                variant="secondary"
                data-testid="button-test-follow"
              >
                Follow User (Requires Auth)
              </Button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">How to Test:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click any of the buttons above</li>
              <li>The authentication modal should appear</li>
              <li>The modal should show community-focused messaging</li>
              <li>Clicking "Sign In" opens a popup for Replit OAuth</li>
              <li>After auth, the popup closes and you remain on this page</li>
              <li>The original action completes (alert shows)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
      
      {/* Render the auth prompts */}
      <threadAuth.AuthPrompt />
      <likeAuth.AuthPrompt />
      <followAuth.AuthPrompt />
    </div>
  );
}