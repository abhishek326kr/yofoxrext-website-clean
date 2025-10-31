"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface EarningsSummary {
  totalEarned: number;
  weeklyEarned: number;
  breakdown: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function EarningsSummaryWidget() {
  const { data: earnings, isLoading } = useQuery<EarningsSummary>({
    queryKey: ['/api/user/earnings-summary'],
  });

  const chartData = earnings?.breakdown.map((item) => ({
    name: item.source,
    value: item.amount,
    percentage: item.percentage,
  })) || [];

  const topEarningSource = earnings?.breakdown[0];

  return (
    <Card data-testid="card-earnings-summary-widget">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Earnings Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-48 w-full" />
          </div>
        ) : earnings && earnings.totalEarned > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  {earnings.totalEarned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total earned • {earnings.weeklyEarned.toLocaleString()} this week
                </p>
              </div>
              {topEarningSource && (
                <Badge variant="secondary" data-testid="badge-top-source">
                  Top: {topEarningSource.source}
                </Badge>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString()} coins`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span className="text-xs">
                          {value} ({entry.payload.percentage}%)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-2">
              {earnings.breakdown.map((item, index) => (
                <div 
                  key={item.source}
                  className="flex items-center justify-between text-sm"
                  data-testid={`earning-source-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{item.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.amount.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-earnings">
            <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No earnings yet</p>
            <p className="text-xs mt-1">Start earning by publishing content or helping others</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
