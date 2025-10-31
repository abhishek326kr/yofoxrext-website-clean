"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { EarningsCounter } from "./components/EarningsCounter";
import { PieChartCard } from "./components/PieChartCard";
import { LoyaltyShield } from "./components/LoyaltyShield";
import { GrowthVaultRing } from "./components/GrowthVaultRing";
import { ReferralMeter } from "./components/ReferralMeter";
import { HealthScoreAI } from "./components/HealthScoreAI";
import { BadgeWall } from "./components/BadgeWall";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardWebSocket } from "./hooks/useDashboardWebSocket";

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

export function RetentionDashboard() {
  const { data: user } = useQuery({ 
    queryKey: ['/api/me'],
    staleTime: 5 * 60 * 1000
  });
  
  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/dashboard/overview'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30000,
  });

  useDashboardWebSocket(user?.id);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="retention-dashboard">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Your Trading Journey
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
          Level Up & Never Look Back
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <EarningsCounter />
          <PieChartCard />
          <ActivityHeatmap />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <LoyaltyShield />
          <GrowthVaultRing />
          <ReferralMeter />
          <HealthScoreAI />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8"
      >
        <BadgeWall />
      </motion.div>
      </div>
    </>
  );
}
