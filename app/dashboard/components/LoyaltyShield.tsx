"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Award, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface LoyaltyData {
  currentTier: string;
  nextTier: string;
  daysInCurrentTier: number;
  daysToNextTier: number;
  currentFeeRate: number;
  nextFeeRate: number;
  nextTierBadge?: string;
  progress: number;
}

const TIER_FEES = [
  { tier: 'Bronze', fee: 7, days: 0 },
  { tier: 'Silver', fee: 4, days: 30 },
  { tier: 'Gold', fee: 0, days: 90 },
];

export function LoyaltyShield() {
  const { data, isLoading } = useQuery<LoyaltyData>({
    queryKey: ['/api/dashboard/loyalty-timeline'],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card data-testid="loyalty-shield">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Loyalty Shield
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentTier = data?.currentTier || 'Bronze';
  const nextTier = data?.nextTier || 'Silver';
  const progress = data?.progress || 0;
  const daysToNext = data?.daysToNextTier || 30;
  const currentFee = data?.currentFeeRate || 7;
  const nextFee = data?.nextFeeRate || 4;

  return (
    <TooltipProvider>
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800" data-testid="loyalty-shield">
        <CardHeader>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100 cursor-help">
                <Shield className="h-5 w-5 text-blue-500" />
                Loyalty Shield
              </CardTitle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stay active to reduce fees</p>
              <p className="text-xs text-gray-400">Progress through tiers to unlock lower rates</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{currentTier}</div>
          <div className="text-sm text-muted-foreground mt-1">Current Tier</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress to {nextTier}</span>
            <span className="text-sm text-muted-foreground">{daysToNext} days</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="tier-progress-bar" />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-center mb-2">Fee Reduction Timeline</div>
          <div className="relative">
            {TIER_FEES.map((tier, index) => {
              const isCurrent = tier.tier === currentTier;
              const isCompleted = TIER_FEES.findIndex(t => t.tier === currentTier) > index;

              return (
                <motion.div
                  key={tier.tier}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                    isCurrent
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                      : isCompleted
                      ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                      : 'bg-muted/50 border border-border'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <Award className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{tier.tier}</div>
                    <div className="text-xs text-muted-foreground">{tier.days} days</div>
                  </div>
                  <div className="text-right" data-testid="fee-rate">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{tier.fee}%</div>
                    <div className="text-xs text-muted-foreground">fee</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {data?.nextTierBadge && (
          <div className="flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <Award className="h-5 w-5 text-yellow-600" />
            <div className="flex-1 text-sm">
              <div className="font-medium">Next Unlock</div>
              <div className="text-xs text-muted-foreground">{data.nextTierBadge}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
