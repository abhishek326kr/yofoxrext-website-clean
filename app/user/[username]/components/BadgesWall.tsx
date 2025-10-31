"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShieldCheck, 
  Star, 
  Award, 
  Heart, 
  Zap, 
  Bug,
  Trophy,
  Lock
} from "lucide-react";

type BadgeType = 'verified_trader' | 'top_contributor' | 'ea_master' | 'helpful' | 'early_adopter' | 'bug_hunter';

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  earned?: boolean;
  progress?: number;
  requirement?: string;
}

interface BadgesWallProps {
  earnedBadges?: Array<{ id: string; name: string; description: string }>;
  isLoading?: boolean;
}

const BADGE_ICONS: Record<string, any> = {
  verified_trader: ShieldCheck,
  top_contributor: Star,
  ea_master: Award,
  helpful: Heart,
  early_adopter: Zap,
  bug_hunter: Bug,
  trader_legend: Trophy,
};

const BADGE_COLORS: Record<string, string> = {
  verified_trader: 'text-blue-500',
  top_contributor: 'text-yellow-500',
  ea_master: 'text-purple-500',
  helpful: 'text-red-500',
  early_adopter: 'text-orange-500',
  bug_hunter: 'text-green-500',
  trader_legend: 'text-primary',
};

const ALL_BADGES: BadgeItem[] = [
  {
    id: 'verified_trader',
    name: 'Verified Trader',
    description: 'Verified trading account with live performance',
    requirement: 'Link MyFxBook account'
  },
  {
    id: 'top_contributor',
    name: 'Top Contributor',
    description: 'Made valuable contributions to the community',
    requirement: 'Get 1000+ reputation'
  },
  {
    id: 'ea_master',
    name: 'EA Master',
    description: 'Published high-quality expert advisors',
    requirement: 'Publish 5+ EAs with 4.5+ rating'
  },
  {
    id: 'helpful',
    name: 'Helpful',
    description: 'Provided helpful answers to community questions',
    requirement: 'Get 50+ helpful votes'
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'One of the first members of YoForex',
    requirement: 'Join in first 30 days'
  },
  {
    id: 'bug_hunter',
    name: 'Bug Hunter',
    description: 'Found and reported platform bugs',
    requirement: 'Report 3+ valid bugs'
  }
];

export function BadgesWall({ earnedBadges = [], isLoading = false }: BadgesWallProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievement Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));
  
  const badgesWithStatus = ALL_BADGES.map(badge => ({
    ...badge,
    earned: earnedBadgeIds.has(badge.id),
    progress: earnedBadgeIds.has(badge.id) ? 100 : Math.floor(Math.random() * 80)
  }));

  const earnedCount = badgesWithStatus.filter(b => b.earned).length;
  const totalCount = badgesWithStatus.length;

  return (
    <Card data-testid="badges-wall">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Achievement Badges</CardTitle>
          <Badge variant="outline" data-testid="badge-count">
            {earnedCount} / {totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badgesWithStatus.map((badge) => {
            const Icon = BADGE_ICONS[badge.id] || Award;
            const color = BADGE_COLORS[badge.id] || 'text-gray-500';
            const isLocked = !badge.earned;

            return (
              <div
                key={badge.id}
                className={`p-4 border rounded-lg ${isLocked ? 'opacity-60' : ''}`}
                data-testid={`badge-item-${badge.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`relative ${isLocked ? 'grayscale' : ''}`}>
                    <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${isLocked ? 'text-muted-foreground' : color}`} />
                    </div>
                    {isLocked && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center border">
                        <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 
                        className="font-semibold text-sm" 
                        data-testid={`badge-${badge.id}-name`}
                      >
                        {badge.name}
                      </h3>
                      {badge.earned && (
                        <Badge variant="secondary" className="text-xs">
                          Earned
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {badge.description}
                    </p>
                    
                    {isLocked && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {badge.requirement}
                          </span>
                          <span className="font-medium">
                            {badge.progress}%
                          </span>
                        </div>
                        <Progress 
                          value={badge.progress} 
                          className="h-1.5"
                          data-testid={`badge-${badge.id}-progress`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
