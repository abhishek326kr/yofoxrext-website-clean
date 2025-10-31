"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { FilterPanel } from "../shared/FilterPanel";
import { Coins, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface EarningsBreakdown {
  total: number;
  thisMonth: number;
  currentBalance: number;
  pendingWithdrawal: number;
}

export function EarningsTab() {
  const [filters, setFilters] = useState({});

  const { data: earningsData, isLoading } = useQuery<EarningsBreakdown>({
    queryKey: ["/api/me/earnings-breakdown", filters],
  });

  const mockEarningsTimeline = [
    { month: "Jan", earnings: 450 },
    { month: "Feb", earnings: 520 },
    { month: "Mar", earnings: 680 },
    { month: "Apr", earnings: 790 },
    { month: "May", earnings: 850 },
    { month: "Jun", earnings: 920 },
  ];

  const earningsBySource = [
    { name: "Sales", value: 65, coins: 13000, color: "hsl(var(--chart-1))" },
    { name: "Referrals", value: 20, coins: 4000, color: "hsl(var(--chart-2))" },
    { name: "Replies", value: 10, coins: 2000, color: "hsl(var(--chart-3))" },
    { name: "Other", value: 5, coins: 1000, color: "hsl(var(--chart-4))" },
  ];

  const recentTransactions = [
    { type: "Sale", description: "EA Pro purchased", amount: "+500 coins", date: "2 hours ago" },
    { type: "Referral", description: "New user signup", amount: "+50 coins", date: "5 hours ago" },
    { type: "Reply", description: "Forum contribution", amount: "+1 coin", date: "1 day ago" },
    { type: "Withdrawal", description: "USDT withdrawal", amount: "-1000 coins", date: "2 days ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Earnings"
          value={`${earningsData?.total || 20000} coins`}
          icon={Coins}
          trend={15.3}
          trendLabel="vs last month"
          loading={isLoading}
          color="text-yellow-500"
          data-testid="kpi-total-earnings"
        />
        <KPICard
          title="This Month"
          value="920 coins"
          icon={TrendingUp}
          trend={8.2}
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-month-earnings"
        />
        <KPICard
          title="Current Balance"
          value="5,430 coins"
          icon={Wallet}
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-current-balance"
        />
        <KPICard
          title="Pending Withdrawal"
          value="0 coins"
          icon={ArrowUpRight}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-pending-withdrawal"
        />
      </div>

      <FilterPanel
        onFilterChange={setFilters}
        showDateRange
        showCategory
        categories={["Sales", "Referrals", "Replies", "Other"]}
      />

      <ChartContainer title="Earnings Timeline" loading={isLoading}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={mockEarningsTimeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer title="Earnings by Source" loading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={earningsBySource}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {earningsBySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Source Breakdown" loading={isLoading}>
          <div className="space-y-4">
            {earningsBySource.map((source) => (
              <div key={source.name} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="font-medium">{source.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{source.coins} coins</p>
                  <p className="text-sm text-muted-foreground">{source.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      <ChartContainer title="Recent Transactions" loading={isLoading}>
        <DataTable
          columns={[
            { key: "type", label: "Type" },
            { key: "description", label: "Description" },
            {
              key: "amount",
              label: "Amount",
              render: (val: string) => (
                <span className={val.startsWith("+") ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                  {val}
                </span>
              ),
            },
            { key: "date", label: "Date" },
          ]}
          data={recentTransactions}
          loading={isLoading}
        />
      </ChartContainer>
    </div>
  );
}
