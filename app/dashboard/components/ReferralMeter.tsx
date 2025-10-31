"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ReferralData {
  activeReferrals: number;
  totalReferrals: number;
  currentRate: number;
  potentialEarnings: number;
  nextMilestone: number;
}

export function ReferralMeter() {
  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ['/api/dashboard/referrals'],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card data-testid="referral-meter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const active = data?.activeReferrals || 0;
  const total = data?.totalReferrals || 0;
  const targetReferrals = 5;
  const segments = Array.from({ length: targetReferrals }, (_, i) => i + 1);

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800" data-testid="referral-meter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <Users className="h-5 w-5 text-purple-500" />
          Referral Network
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-700 dark:text-purple-300" data-testid="referral-count">
            {active}/{targetReferrals}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Active Referrals</div>
        </div>

        <div className="space-y-2" data-testid="referral-progress">
          <div className="flex gap-2 justify-center">
            {segments.map((segment) => {
              const isActive = segment <= active;
              return (
                <motion.div
                  key={segment}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: segment * 0.1 }}
                  className={`h-12 flex-1 rounded-lg border-2 flex items-center justify-center ${
                    isActive
                      ? 'bg-purple-500 border-purple-600 shadow-lg shadow-purple-500/50'
                      : 'bg-muted border-muted-foreground/20'
                  }`}
                  style={{
                    boxShadow: isActive
                      ? '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)'
                      : 'none',
                  }}
                >
                  {isActive && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="h-6 w-6 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="text-xs text-center text-muted-foreground">
            {active >= targetReferrals
              ? '🎉 Permanent 5% rate unlocked!'
              : `${targetReferrals - active} more to unlock permanent 5% rate`}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <span className="text-sm font-medium">Current Rate</span>
            <span className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {data?.currentRate || 0}%
            </span>
          </div>

          {active >= targetReferrals && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
                <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Potential Earnings Boost
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                +{data?.potentialEarnings || 0} ₡/month
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                With 5+ active referrals
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div className="p-2 bg-muted rounded">
              <div className="font-bold text-purple-700 dark:text-purple-300">{active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="font-bold text-purple-700 dark:text-purple-300">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
