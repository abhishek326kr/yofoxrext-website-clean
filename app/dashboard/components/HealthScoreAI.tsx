"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HealthScoreData {
  score: number;
  change: number;
  tips: string[];
  category: string;
}

export function HealthScoreAI() {
  const { data, isLoading } = useQuery<HealthScoreData>({
    queryKey: ['/api/dashboard/overview'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    select: (data: any) => ({
      score: data?.healthScore || 75,
      change: data?.healthScoreChange || 5,
      tips: data?.aiTips || [
        "Post consistently to maintain visibility",
        "Engage with trending discussions for more reach",
        "Complete your profile to build trust",
        "Share your trading insights regularly",
      ],
      category: data?.category || 'general',
    }),
  });

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    if (!data?.tips || data.tips.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % data.tips.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [data?.tips]);

  if (isLoading) {
    return (
      <Card data-testid="health-score">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const score = data?.score || 0;
  const change = data?.change || 0;
  const isPositive = change >= 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800';
    if (score >= 60) return 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800';
    return 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800';
  };

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${getScoreBgColor(score)}`} data-testid="health-score">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="relative inline-block">
            <svg className="transform -rotate-90" width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${(score / 100) * 314} 314`}
                strokeLinecap="round"
                className={getScoreColor(score)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2" data-testid="health-change">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}{change} points
          </span>
        </div>

        <div className="p-3 bg-background/50 rounded-lg border border-border min-h-[80px]" data-testid="ai-tip">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm"
                >
                  {data?.tips[currentTipIndex] || 'Keep up the great work!'}
                </motion.div>
              </AnimatePresence>
              <div className="flex gap-1 mt-2">
                {data?.tips.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index === currentTipIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
