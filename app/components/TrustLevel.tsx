"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Star, Upload, MessageCircle } from "lucide-react";

interface TrustLevelProps {
  currentLevel?: "novice" | "contributor" | "verified" | "pro";
  xp?: number;
  nextLevelXP?: number;
  achievements?: {
    uploads: number;
    verifiedSets: number;
    solutionsMarked: number;
  };
}

interface UserStatsResponse {
  currentLevel: "novice" | "contributor" | "verified" | "pro";
  xp: number;
  nextLevelXP: number;
  achievements: {
    uploads: number;
    verifiedSets: number;
    solutionsMarked: number;
  };
}

export default function TrustLevel({ 
  currentLevel: propCurrentLevel,
  xp: propXp,
  nextLevelXP: propNextLevelXP,
  achievements: propAchievements
}: TrustLevelProps = {}) {
  const { user } = useAuth();

  // Fetch real user stats (no auto-refresh for performance)
  const { data: userStats, isLoading } = useQuery<UserStatsResponse>({
    queryKey: ['/api/users', user?.id, 'stats'],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use fetched data or fall back to props
  const currentLevel = userStats?.currentLevel || propCurrentLevel || "contributor";
  const xp = userStats?.xp || propXp || 0;
  const nextLevelXP = userStats?.nextLevelXP || propNextLevelXP || 2000;
  const achievements = userStats?.achievements || propAchievements || {
    uploads: 0,
    verifiedSets: 0,
    solutionsMarked: 0
  };

  const levels = {
    novice: { name: "Novice", color: "bg-chart-4", textColor: "text-chart-4", icon: Shield },
    contributor: { name: "Contributor", color: "bg-chart-2", textColor: "text-chart-2", icon: MessageCircle },
    verified: { name: "Verified Trader", color: "bg-chart-3", textColor: "text-chart-3", icon: Star },
    pro: { name: "Pro Developer", color: "bg-primary", textColor: "text-primary", icon: Upload }
  };

  const currentLevelData = levels[currentLevel];
  const Icon = currentLevelData.icon;
  const progress = (xp / nextLevelXP) * 100;

  const unlocks = {
    novice: ["Post threads", "Reply to discussions"],
    contributor: ["Upload attachments", "Create polls"],
    verified: ["Start bounty threads", "Post in commercial"],
    pro: ["All features unlocked", "Verified badge"]
  };

  if (isLoading) {
    return (
      <Card data-testid="card-trust-level">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-trust-level">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`${currentLevelData.color} rounded-lg p-2`}>
                <Icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Your Rank</div>
                <div className={`font-semibold ${currentLevelData.textColor}`}>
                  {currentLevelData.name}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {xp} XP
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress to next level</span>
              <span className="font-medium">{xp} / {nextLevelXP}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold">Achievements</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="font-bold text-sm">{achievements.uploads}</div>
                <div className="text-xs text-muted-foreground">Uploads</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="font-bold text-sm">{achievements.verifiedSets}</div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="font-bold text-sm">{achievements.solutionsMarked}</div>
                <div className="text-xs text-muted-foreground">Solutions</div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold">Unlocked Features</div>
            {unlocks[currentLevel].map((unlock, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <span>{unlock}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
