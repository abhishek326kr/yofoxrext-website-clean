"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  ShoppingCart, 
  Star, 
  Users, 
  FileText, 
  Download,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalRevenue?: number;
    totalSales?: number;
    averageRating?: number;
    followers?: number;
    contentCount?: number;
    totalDownloads?: number;
    revenueChange?: number;
    salesChange?: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  const statsData = [
    {
      title: "Total Revenue",
      value: stats?.totalRevenue || 0,
      icon: DollarSign,
      suffix: " coins",
      change: stats?.revenueChange,
      testId: "card-revenue"
    },
    {
      title: "Total Sales",
      value: stats?.totalSales || 0,
      icon: ShoppingCart,
      suffix: "",
      change: stats?.salesChange,
      testId: "card-sales"
    },
    {
      title: "Average Rating",
      value: stats?.averageRating || 0,
      icon: Star,
      suffix: " / 5",
      decimals: 1,
      testId: "card-rating"
    },
    {
      title: "Followers",
      value: stats?.followers || 0,
      icon: Users,
      suffix: "",
      testId: "card-followers"
    },
    {
      title: "Published Content",
      value: stats?.contentCount || 0,
      icon: FileText,
      suffix: "",
      testId: "card-content"
    },
    {
      title: "Total Downloads",
      value: stats?.totalDownloads || 0,
      icon: Download,
      suffix: "",
      testId: "card-downloads"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
      data-testid="stats-cards-grid"
    >
      {statsData.map((stat) => {
        const Icon = stat.icon;
        const displayValue = stat.decimals 
          ? stat.value.toFixed(stat.decimals)
          : stat.value.toLocaleString();
        
        const hasChange = stat.change !== undefined && stat.change !== null;
        const isPositive = hasChange && (stat.change ?? 0) > 0;
        const isNegative = hasChange && (stat.change ?? 0) < 0;

        return (
          <Card key={stat.title} data-testid={stat.testId}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold" 
                data-testid={`${stat.testId}-value`}
              >
                {displayValue}{stat.suffix}
              </div>
              {hasChange && (
                <div 
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
                  }`}
                  data-testid={`${stat.testId}-change`}
                >
                  {isPositive && <TrendingUp className="w-3 h-3" />}
                  {isNegative && <TrendingDown className="w-3 h-3" />}
                  {isPositive && '+'}
                  {stat.change}% from last month
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
