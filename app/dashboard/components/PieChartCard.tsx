"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp } from "lucide-react";

const COLORS = {
  replies: '#3b82f6',
  sales: '#10b981',
  vault: '#f59e0b',
  referrals: '#8b5cf6',
  badges: '#ec4899',
};

interface EarningsSource {
  source: string;
  amount: number;
  percentage: number;
  details?: string;
}

export function PieChartCard() {
  const { data, isLoading } = useQuery<EarningsSource[]>({
    queryKey: ['/api/dashboard/earnings-sources'],
    staleTime: 5 * 60 * 1000,
  });

  const [selectedSegment, setSelectedSegment] = useState<EarningsSource | null>(null);

  if (isLoading) {
    return (
      <Card data-testid="earnings-pie-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Earnings Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.map((item) => ({
    name: item.source.charAt(0).toUpperCase() + item.source.slice(1),
    value: item.amount,
    ...item,
  })) || [];

  return (
    <>
      <Card data-testid="earnings-pie-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Earnings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={(entry) => setSelectedSegment(entry)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.source.toLowerCase() as keyof typeof COLORS] || '#999'}
                    data-testid={`pie-segment-${entry.source.toLowerCase()}`}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value.toLocaleString()} ₡ ({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {chartData.map((item) => (
              <div
                key={item.source}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedSegment(item)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[item.source.toLowerCase() as keyof typeof COLORS] }}
                />
                <div className="text-sm">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">{item.value.toLocaleString()} ₡</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSegment?.name} Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Earned</span>
              <span className="text-2xl font-bold">{selectedSegment?.value.toLocaleString()} ₡</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Percentage</span>
              <span className="text-lg font-semibold">{selectedSegment?.percentage.toFixed(1)}%</span>
            </div>
            {selectedSegment?.details && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{selectedSegment.details}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
