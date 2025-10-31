"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Award, Plus } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { coinsToUSD } from "../../shared/coinUtils";

export default function CoinBalance() {
  const { user } = useAuth();
  
  // Use the SAME query key as Header for cache synchronization
  const { data: coinsData, isLoading } = useQuery<{ totalCoins: number; weeklyEarned: number; rank: number | null }>({
    queryKey: ["/api/user", user?.id, "coins"],
    enabled: !!user?.id,
  });

  const balance = coinsData?.totalCoins ?? 0;
  const weeklyEarned = coinsData?.weeklyEarned ?? 0;
  const rank = coinsData?.rank ?? undefined;
  const balanceUSD = coinsToUSD(balance);

  if (isLoading) {
    return (
      <Card data-testid="card-coin-balance">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card data-testid="card-coin-balance">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/recharge" className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md p-1 -ml-1">
            <div className="bg-primary/10 rounded-full p-2">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Your Balance</div>
              <div className="text-2xl font-bold flex items-center gap-1" data-testid="text-coin-balance">
                {balance.toLocaleString()}
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">${balanceUSD.toFixed(2)} USD</div>
            </div>
          </Link>
          <Link href="/recharge">
            <Button size="sm" variant="default" data-testid="button-top-up">
              <Plus className="h-4 w-4 mr-1" />
              Top Up
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <TrendingUp className="h-4 w-4 text-chart-3" />
            <div>
              <div className="text-xs text-muted-foreground">This Week</div>
              <div className="font-semibold text-sm" data-testid="text-weekly-earned">+{weeklyEarned}</div>
            </div>
          </div>
          
          {rank && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <Award className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Rank</div>
                <div className="font-semibold text-sm" data-testid="text-user-rank">#{rank}</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Link href="/earn-coins">
            <Button size="sm" variant="outline" className="w-full" data-testid="button-earn-coins">
              <Coins className="h-4 w-4 mr-1" />
              Ways to Earn
            </Button>
          </Link>
          <Link href="/transactions">
            <Button size="sm" variant="ghost" className="w-full" data-testid="button-history">
              View History
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
