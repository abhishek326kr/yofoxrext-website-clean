"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

interface EarningsData {
  todayEarnings: number;
  yesterdayEarnings: number;
  last7Days: Array<{ date: string; earnings: number }>;
  percentageChange: number;
}

export function EarningsCounter() {
  const { data, isLoading } = useQuery<EarningsData>({
    queryKey: ['/api/dashboard/overview'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30000,
  });

  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (data?.todayEarnings) {
      setPulseKey((prev) => prev + 1);
    }
  }, [data?.todayEarnings]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden" data-testid="earnings-counter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Today's Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const earnings = data?.todayEarnings || 0;
  const percentageChange = data?.percentageChange || 0;
  const isPositive = percentageChange >= 0;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800" data-testid="earnings-counter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
          <Coins className="h-5 w-5 text-yellow-500" />
          Today's Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <motion.div
            key={pulseKey}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-bold text-yellow-600 dark:text-yellow-400"
          >
            {earnings.toLocaleString()}
          </motion.div>
          <span className="text-2xl text-yellow-700 dark:text-yellow-500">₡</span>
        </div>

        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {percentageChange.toFixed(1)}% from yesterday
          </span>
        </div>

        <div className="h-16" data-testid="earnings-sparkline">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.last7Days || []}>
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-yellow-700 dark:text-yellow-400">
          Last 7 days trend
        </div>
      </CardContent>
    </Card>
  );
}
