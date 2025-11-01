"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Vault, Clock, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VaultData {
  totalLocked: number;
  availableToClaim: number;
  nextUnlockDate: string;
  progressPercentage: number;
}

export function GrowthVaultRing() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<VaultData>({
    queryKey: ['/api/dashboard/vault/summary'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30000,
  });

  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!data?.nextUnlockDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const unlock = new Date(data.nextUnlockDate).getTime();
      const distance = unlock - now;

      if (distance < 0) {
        setTimeRemaining('Ready to claim!');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.nextUnlockDate]);

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/dashboard/vault/claim', {});
      return res.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Vault Claimed!",
        description: `You claimed ${result.amount} ₡ from your vault`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/vault/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/overview'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="vault-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vault className="h-5 w-5" />
            Growth Vault
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const progress = data?.progressPercentage || 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <TooltipProvider>
      <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800" data-testid="vault-ring">
        <CardHeader>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 cursor-help">
                <Vault className="h-5 w-5 text-emerald-500" />
                Growth Vault
              </CardTitle>
            </TooltipTrigger>
            <TooltipContent>
              <p>10% bonus from last month's earnings</p>
              <p className="text-xs text-gray-400">Unlocks when you stay active</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: progress > 0 ? 360 : 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <svg width="160" height="160" className="transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-emerald-500"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeInOut" }}
                style={{
                  filter: progress > 80 ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' : 'none',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col" data-testid="vault-amount">
              <Coins className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-1" />
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {data?.totalLocked?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-muted-foreground">locked</div>
            </div>
          </motion.div>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="vault-timer">
            <Clock className="h-4 w-4" />
            <span>{timeRemaining || 'Loading...'}</span>
          </div>

          {data && data.availableToClaim > 0 ? (
            <Button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              data-testid="button-claim-vault"
            >
              {claimMutation.isPending ? (
                "Claiming..."
              ) : (
                <>
                  Claim {data.availableToClaim.toLocaleString()} ₡
                </>
              )}
            </Button>
          ) : (
            <div className="p-3 bg-muted rounded-lg text-sm text-center text-muted-foreground">
              Keep earning to unlock more coins!
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded">
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {data?.totalLocked?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Total Locked</div>
          </div>
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
            <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
              {data?.availableToClaim?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
