"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Star, Zap, Target, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface Badge {
  id: string;
  type: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  requirement?: number;
  icon: string;
  color: string;
}

const BADGE_ICONS: Record<string, any> = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  crown: Crown,
  award: Award,
};

export function BadgeWall() {
  const { data: badges, isLoading } = useQuery<Badge[]>({
    queryKey: ['/api/dashboard/badges'],
    staleTime: 5 * 60 * 1000,
  });

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  if (isLoading) {
    return (
      <Card data-testid="badge-wall">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="badge-wall">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {badges?.map((badge) => {
              const IconComponent = BADGE_ICONS[badge.icon] || Award;
              const progress = badge.progress || 0;
              const isEarned = badge.earned;

              return (
                <motion.div
                  key={badge.id}
                  data-testid={`badge-${badge.type}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{
                    scale: 1.05,
                    rotateY: isEarned ? 10 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isEarned
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700 shadow-lg'
                      : 'bg-muted border-muted-foreground/20 grayscale hover:grayscale-0'
                  }`}
                  onClick={() => setSelectedBadge(badge)}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                  }}
                >
                  {isEarned && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center"
                    >
                      <Star className="h-3 w-3 text-white fill-white" />
                    </motion.div>
                  )}

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isEarned
                          ? `bg-${badge.color}-100 dark:bg-${badge.color}-900/20`
                          : 'bg-muted'
                      }`}
                      style={{
                        backgroundColor: isEarned
                          ? `${badge.color}20`
                          : undefined,
                      }}
                    >
                      <IconComponent
                        className={`h-8 w-8 ${
                          isEarned
                            ? `text-${badge.color}-600 dark:text-${badge.color}-400`
                            : 'text-muted-foreground'
                        }`}
                        style={{
                          color: isEarned ? badge.color : undefined,
                        }}
                      />
                    </div>

                    <div className="text-center">
                      <div className={`text-sm font-semibold ${isEarned ? '' : 'text-muted-foreground'}`}>
                        {badge.name}
                      </div>
                      {!isEarned && badge.requirement && (
                        <div
                          className="text-xs text-muted-foreground mt-1"
                          data-testid={`badge-progress-${badge.type}`}
                        >
                          {progress}/{badge.requirement}
                        </div>
                      )}
                    </div>

                    {!isEarned && badge.requirement && (
                      <Progress
                        value={(progress / badge.requirement) * 100}
                        className="h-1 w-full"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {(!badges || badges.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No badges yet. Start earning to unlock achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBadge && (
                <>
                  {(() => {
                    const IconComponent = BADGE_ICONS[selectedBadge.icon] || Award;
                    return (
                      <IconComponent
                        className="h-6 w-6"
                        style={{ color: selectedBadge.color }}
                      />
                    );
                  })()}
                  {selectedBadge.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedBadge?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBadge?.earned ? (
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-lg font-semibold mb-2">Badge Earned! 🎉</p>
                {selectedBadge.earnedAt && (
                  <p className="text-sm text-muted-foreground">
                    Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedBadge?.progress || 0} / {selectedBadge?.requirement || 0}
                  </span>
                </div>
                <Progress
                  value={
                    ((selectedBadge?.progress || 0) / (selectedBadge?.requirement || 1)) * 100
                  }
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground">
                  Keep going! You're {selectedBadge?.requirement && selectedBadge?.progress
                    ? selectedBadge.requirement - selectedBadge.progress
                    : 0}{' '}
                  away from earning this badge.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
