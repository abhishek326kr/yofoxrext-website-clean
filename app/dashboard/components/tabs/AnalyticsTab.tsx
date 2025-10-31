"use client";

import { useQuery } from "@tanstack/react-query";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { Eye, Download, Star, MessageSquare } from "lucide-react";
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SalesDashboardData {
  totalRevenue: number;
  totalSales: number;
  avgSale: number;
}

export function AnalyticsTab() {
  const { data: salesData, isLoading } = useQuery<SalesDashboardData>({
    queryKey: ["/api/me/sales-dashboard"],
  });

  const mockViewsData = [
    { date: "Jan", views: 1200, downloads: 450 },
    { date: "Feb", views: 1500, downloads: 520 },
    { date: "Mar", views: 1800, downloads: 680 },
    { date: "Apr", views: 2200, downloads: 790 },
    { date: "May", views: 2500, downloads: 850 },
    { date: "Jun", views: 2800, downloads: 920 },
  ];

  const contentPerformance = [
    { name: "EA Pro v2", views: 3450, downloads: 1250, rating: 4.8 },
    { name: "Indicator Pack", views: 2890, downloads: 980, rating: 4.6 },
    { name: "Strategy Guide", views: 2340, downloads: 750, rating: 4.9 },
    { name: "Trading Bot", views: 1890, downloads: 520, rating: 4.5 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Views"
          value="15.2K"
          icon={Eye}
          trend={12.5}
          trendLabel="vs last month"
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-total-views"
        />
        <KPICard
          title="Total Downloads"
          value="4.5K"
          icon={Download}
          trend={8.3}
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-total-downloads"
        />
        <KPICard
          title="Avg Rating"
          value="4.7"
          icon={Star}
          loading={isLoading}
          color="text-yellow-500"
          data-testid="kpi-avg-rating"
        />
        <KPICard
          title="Total Reviews"
          value="328"
          icon={MessageSquare}
          trend={15.2}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-total-reviews"
        />
      </div>

      <ChartContainer title="Content Views & Downloads Trend" loading={isLoading}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockViewsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="downloads" stroke="hsl(var(--chart-2))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer title="Top Content Performance" loading={isLoading}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={contentPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" fill="hsl(var(--primary))" />
            <Bar dataKey="downloads" fill="hsl(var(--chart-2))" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer title="Content Performance Details" loading={isLoading}>
        <DataTable
          columns={[
            { key: "name", label: "Content" },
            { key: "views", label: "Views" },
            { key: "downloads", label: "Downloads" },
            {
              key: "rating",
              label: "Rating",
              render: (val: number) => (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  {val}
                </div>
              ),
            },
          ]}
          data={contentPerformance}
          loading={isLoading}
        />
      </ChartContainer>
    </div>
  );
}
