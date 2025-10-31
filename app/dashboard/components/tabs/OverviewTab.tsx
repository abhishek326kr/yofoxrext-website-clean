"use client";

import { useQuery } from "@tanstack/react-query";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SalesDashboardData {
  totalRevenue: number;
  totalSales: number;
  avgSale: number;
}

interface Goal {
  id: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  status: string;
}

interface EarningsBreakdown {
  total: number;
  thisMonth: number;
  currentBalance: number;
  pendingWithdrawal: number;
}

export function OverviewTab() {
  const { data: salesData, isLoading: salesLoading } = useQuery<SalesDashboardData>({
    queryKey: ["/api/me/sales-dashboard"],
  });

  const { data: earningsData, isLoading: earningsLoading } = useQuery<EarningsBreakdown>({
    queryKey: ["/api/me/earnings-breakdown"],
  });

  const { data: goalsData, isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/me/goals"],
  });

  const mockRevenueData = [
    { date: "Mon", revenue: 1200 },
    { date: "Tue", revenue: 1900 },
    { date: "Wed", revenue: 1500 },
    { date: "Thu", revenue: 2200 },
    { date: "Fri", revenue: 1800 },
    { date: "Sat", revenue: 2400 },
    { date: "Sun", revenue: 2100 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={`$${salesData?.totalRevenue || 0}`}
          icon={DollarSign}
          trend={12.5}
          trendLabel="vs last week"
          loading={salesLoading}
          color="text-green-500"
          data-testid="kpi-total-revenue"
        />
        <KPICard
          title="Total Sales"
          value={salesData?.totalSales || 0}
          icon={ShoppingCart}
          trend={8.2}
          trendLabel="vs last week"
          loading={salesLoading}
          color="text-blue-500"
          data-testid="kpi-total-sales"
        />
        <KPICard
          title="Avg Sale Value"
          value={`$${salesData?.avgSale?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          trend={3.1}
          loading={salesLoading}
          color="text-purple-500"
          data-testid="kpi-avg-sale-value"
        />
        <KPICard
          title="Active Goals"
          value={goalsData?.filter((g: any) => g.status === 'active').length || 0}
          icon={Users}
          loading={goalsLoading}
          color="text-orange-500"
          data-testid="kpi-active-goals"
        />
      </div>

      <ChartContainer title="Revenue Trend (Last 7 Days)" loading={salesLoading}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer title="Recent Activity" loading={salesLoading}>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New sale: Expert Advisor Pro</p>
                  <p className="text-sm text-muted-foreground">{i} hours ago</p>
                </div>
                <p className="font-semibold">+$50</p>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer title="Active Goals" loading={goalsLoading}>
          <div className="space-y-4">
            {goalsData?.slice(0, 5).map((goal: any) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{goal.goalType}</p>
                  <p className="text-sm text-muted-foreground">
                    {goal.currentValue} / {goal.targetValue}
                  </p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
                  />
                </div>
              </div>
            )) || <p className="text-muted-foreground text-center py-8">No active goals</p>}
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
