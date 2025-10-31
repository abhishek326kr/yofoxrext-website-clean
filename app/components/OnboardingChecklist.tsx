"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, X, ChevronRight } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Link from "next/link";

type OnboardingProgress = {
  completed: boolean;
  dismissed: boolean;
  progress: {
    profilePicture: boolean;
    firstReply: boolean;
    twoReviews: boolean;
    firstThread: boolean;
    firstPublish: boolean;
    fiftyFollowers: boolean;
  };
};

const ONBOARDING_TASKS = [
  { key: 'profilePicture', label: 'Complete your profile', coins: 10, link: '/settings' },
  { key: 'firstReply', label: 'Post your first reply', coins: 5, link: '/discussions' },
  { key: 'twoReviews', label: 'Submit 2 reviews', coins: 6, link: '/brokers' },
  { key: 'firstThread', label: 'Create your own thread', coins: 10, link: '/discussions/new' },
  { key: 'firstPublish', label: 'Publish your own EA', coins: 30, link: '/publish' },
  { key: 'fiftyFollowers', label: 'Get 50 followers', coins: 200, link: '/members' },
];

export function OnboardingChecklist() {
  const { data, isLoading } = useQuery<OnboardingProgress>({
    queryKey: ['/api/me/onboarding'],
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/me/onboarding/dismiss', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/onboarding'] });
    },
  });

  if (isLoading || !data || data.dismissed) {
    return null;
  }

  const completedCount = Object.values(data.progress).filter(Boolean).length;
  const totalCount = Object.keys(data.progress).length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <Card className="border-0 shadow-sm" data-testid="card-onboarding">
      <CardHeader className="pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Get Started</CardTitle>
          {data.completed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2"
              onClick={() => dismiss.mutate()}
              data-testid="button-dismiss-onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Complete these tasks to earn coins and unlock features
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progressPercent} className="h-2" data-testid="progress-onboarding" />
        
        <div className="space-y-1.5">
          {ONBOARDING_TASKS.map(task => {
            const isComplete = data.progress[task.key as keyof typeof data.progress];
            return (
              <Link
                key={task.key}
                href={task.link}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-all ${
                  isComplete 
                    ? 'bg-muted/30' 
                    : 'hover-elevate active-elevate-2 cursor-pointer'
                }`}
                data-testid={`task-${task.key}`}
              >
                <div className="flex items-center gap-2.5 flex-1">
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" data-testid={`icon-complete-${task.key}`} />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" data-testid={`icon-incomplete-${task.key}`} />
                  )}
                  <span className={`text-sm ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {task.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-medium text-amber-600" data-testid={`coins-${task.key}`}>
                    +{task.coins} coins
                  </span>
                  {!isComplete && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
