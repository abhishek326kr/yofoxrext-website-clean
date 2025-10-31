"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Bot, Users, Wallet, Download, Activity, DollarSign } from "lucide-react";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { AdminAuthCheck } from "../../auth-check";

interface BotAnalytics {
  botSpending: { today: number; week: number; allTime: number };
  realUserEarnings: { today: number; week: number; allTime: number };
  activeBots: number;
  daysUntilEmpty: number;
}

interface BotImpact {
  botId: string;
  botName: string;
  totalSpent: number;
  actionsTaken: number;
  sellerRevenue: number;
  purpose: string;
}

interface SpendingTrend {
  date: string;
  amount: number;
}

interface PurposeSpending {
  purpose: string;
  amount: number;
}

const COLORS = {
  engagement: 'hsl(var(--primary))',
  marketplace: 'hsl(262, 83%, 58%)',
  referral: 'hsl(142, 76%, 36%)'
};

export default function BotAnalyticsPage() {
  const [includeBotData, setIncludeBotData] = useState(true);

  const { data: analyticsRaw, isLoading: analyticsLoading } = useQuery<BotAnalytics>({
    queryKey: ["/api/admin/economy/analytics", { includeBotData }]
  });

  const analytics: BotAnalytics = analyticsRaw || {
    botSpending: { today: 0, week: 0, allTime: 0 },
    realUserEarnings: { today: 0, week: 0, allTime: 0 },
    activeBots: 0,
    daysUntilEmpty: 0
  };

  const { data: spendingTrendRaw } = useQuery<SpendingTrend[]>({
    queryKey: ["/api/admin/economy/analytics/trend"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        { date: 'Mon', amount: 120 },
        { date: 'Tue', amount: 180 },
        { date: 'Wed', amount: 150 },
        { date: 'Thu', amount: 200 },
        { date: 'Fri', amount: 170 },
        { date: 'Sat', amount: 140 },
        { date: 'Sun', amount: 160 }
      ];
    }
  });

  const spendingTrend = Array.isArray(spendingTrendRaw) ? spendingTrendRaw : [];

  const { data: purposeSpendingRaw } = useQuery<PurposeSpending[]>({
    queryKey: ["/api/admin/economy/analytics/by-purpose"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        { purpose: 'engagement', amount: 450 },
        { purpose: 'marketplace', amount: 300 },
        { purpose: 'referral', amount: 250 }
      ];
    }
  });

  const purposeSpending = Array.isArray(purposeSpendingRaw) ? purposeSpendingRaw : [];

  const { data: retentionDataRaw } = useQuery({
    queryKey: ["/api/admin/economy/analytics/retention"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        { type: 'Real Users', value: 65 },
        { type: 'Bot Activity', value: 35 }
      ];
    }
  });

  const retentionData = Array.isArray(retentionDataRaw) ? retentionDataRaw : [];

  const { data: botImpactRaw } = useQuery<BotImpact[]>({
    queryKey: ["/api/admin/economy/analytics/bot-impact"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        { botId: '1', botName: '@ScalpPro42', totalSpent: 150, actionsTaken: 45, sellerRevenue: 120, purpose: 'engagement' },
        { botId: '2', botName: '@ForexKing23', totalSpent: 200, actionsTaken: 60, sellerRevenue: 180, purpose: 'marketplace' },
        { botId: '3', botName: '@TradeMaster88', totalSpent: 100, actionsTaken: 30, sellerRevenue: 80, purpose: 'referral' }
      ];
    }
  });

  const botImpact = Array.isArray(botImpactRaw) ? botImpactRaw : [];

  const handleExport = () => {
    // Mock export functionality
    const csvContent = [
      ['Bot Name', 'Purpose', 'Total Spent', 'Actions Taken', 'Seller Revenue'],
      ...botImpact.map(bot => [
        bot.botName,
        bot.purpose,
        bot.totalSpent,
        bot.actionsTaken,
        bot.sellerRevenue
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-analytics-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (analyticsLoading) {
    return (
      <AdminAuthCheck>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminAuthCheck>
    );
  }

  return (
    <AdminAuthCheck>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="title-bot-analytics">Bot Analytics Dashboard</h1>
            <p className="text-muted-foreground">Analyze bot vs real user metrics and impact</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="include-bot-data"
                checked={includeBotData}
                onCheckedChange={setIncludeBotData}
                data-testid="switch-include-bot-data"
              />
              <Label htmlFor="include-bot-data">
                {includeBotData ? "Include Bot Data" : "Real Users Only"}
              </Label>
            </div>
            <Button variant="outline" onClick={handleExport} data-testid="button-export-data">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-bot-spending-today">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bot Spending Today</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-bot-spending-today">
                {analytics.botSpending.today.toLocaleString()} coins
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.botSpending.week.toLocaleString()} this week
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-real-user-earnings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Real User Earnings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-real-user-earnings">
                {analytics.realUserEarnings.today.toLocaleString()} coins
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.realUserEarnings.week.toLocaleString()} this week
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-bots">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-bots">
                {analytics.activeBots}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card data-testid="card-treasury-forecast">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury Forecast</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analytics.daysUntilEmpty < 30 ? 'text-orange-600' : ''}`} data-testid="text-days-until-empty">
                {analytics.daysUntilEmpty > 0 ? `${analytics.daysUntilEmpty} days` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Until treasury empty</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bot Spending Over Time */}
          <Card data-testid="card-spending-trend">
            <CardHeader>
              <CardTitle>Bot Spending Over Time</CardTitle>
              <CardDescription>Daily spending trend for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Bot Spending (coins)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Spending by Purpose */}
          <Card data-testid="card-spending-by-purpose">
            <CardHeader>
              <CardTitle>Spending by Bot Purpose</CardTitle>
              <CardDescription>Distribution across bot types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={purposeSpending}
                    dataKey="amount"
                    nameKey="purpose"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.purpose}: ${entry.amount}`}
                  >
                    {purposeSpending.map((entry, index) => {
                      const colorKey = entry.purpose as keyof typeof COLORS;
                      return (
                        <Cell key={`cell-${index}`} fill={COLORS[colorKey] || 'hsl(var(--muted))'} />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Retention Boost Chart */}
        <Card data-testid="card-retention-boost">
          <CardHeader>
            <CardTitle>Retention Score Boost: Real vs Bot</CardTitle>
            <CardDescription>Contribution to overall retention metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="Retention Boost (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bot Impact Table */}
        <Card data-testid="card-bot-impact">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Bot Impact Analysis
              </div>
            </CardTitle>
            <CardDescription>Per-bot performance and revenue generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot Name</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Actions Taken</TableHead>
                    <TableHead>Seller Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {botImpact.length > 0 ? (
                    botImpact.map((bot) => (
                      <TableRow key={bot.botId} data-testid={`impact-row-${bot.botId}`}>
                        <TableCell className="font-medium" data-testid={`bot-name-${bot.botId}`}>
                          {bot.botName}
                        </TableCell>
                        <TableCell data-testid={`bot-purpose-${bot.botId}`}>{bot.purpose}</TableCell>
                        <TableCell data-testid={`bot-spent-${bot.botId}`}>
                          {bot.totalSpent.toLocaleString()} coins
                        </TableCell>
                        <TableCell data-testid={`bot-actions-${bot.botId}`}>
                          {bot.actionsTaken.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-green-600" data-testid={`bot-revenue-${bot.botId}`}>
                          +{bot.sellerRevenue.toLocaleString()} coins
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No bot impact data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAuthCheck>
  );
}
