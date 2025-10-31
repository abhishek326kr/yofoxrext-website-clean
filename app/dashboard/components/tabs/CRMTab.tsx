"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { FilterPanel } from "../shared/FilterPanel";
import { Users, UserPlus, TrendingUp, Target } from "lucide-react";
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  segment: "high-value" | "active" | "new" | "inactive";
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  joinedAt: string;
}

export function CRMTab() {
  const [filters, setFilters] = useState({});

  const { data: customersData, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/me/customers", filters],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<{ retentionRate?: number }>({
    queryKey: ["/api/me/customer-stats"],
  });

  const customers = customersData || [];
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(
    (c) =>
      new Date(c.joinedAt).getTime() >
      Date.now() - 30 * 24 * 60 * 60 * 1000
  ).length;
  const activeCustomers = customers.filter(
    (c) => c.segment === "active" || c.segment === "high-value"
  ).length;

  const segmentData = [
    {
      name: "High Value",
      value: customers.filter((c) => c.segment === "high-value").length,
      color: "hsl(var(--chart-1))",
    },
    {
      name: "Active",
      value: customers.filter((c) => c.segment === "active").length,
      color: "hsl(var(--chart-2))",
    },
    {
      name: "New",
      value: customers.filter((c) => c.segment === "new").length,
      color: "hsl(var(--chart-3))",
    },
    {
      name: "Inactive",
      value: customers.filter((c) => c.segment === "inactive").length,
      color: "hsl(var(--chart-4))",
    },
  ];

  const topCustomers = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const getSegmentBadgeVariant = (segment: string) => {
    switch (segment) {
      case "high-value":
        return "default";
      case "active":
        return "secondary";
      case "new":
        return "outline";
      case "inactive":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-total-customers"
        />
        <KPICard
          title="New This Month"
          value={newCustomers}
          icon={UserPlus}
          trend={12.5}
          trendLabel="vs last month"
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-new-customers"
        />
        <KPICard
          title="Active Customers"
          value={activeCustomers}
          icon={TrendingUp}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-active-customers"
        />
        <KPICard
          title="Retention Rate"
          value={`${statsData?.retentionRate || 85}%`}
          icon={Target}
          trend={3.2}
          loading={statsLoading}
          color="text-orange-500"
          data-testid="kpi-retention-rate"
        />
      </div>

      <FilterPanel
        onFilterChange={setFilters}
        showDateRange
        showCategory
        showStatus
        categories={["high-value", "active", "new", "inactive"]}
        statuses={["active", "inactive"]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer title="Customer Segmentation" loading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top 5 Customers by Spend" loading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCustomers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="username" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSpent" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <ChartContainer title="Customer List" loading={isLoading}>
        <DataTable
          columns={[
            {
              key: "username",
              label: "Customer",
              render: (val: string, row: Customer) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={row.avatar} />
                    <AvatarFallback>{val.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium" data-testid={`customer-name-${row.id}`}>{val}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "segment",
              label: "Segment",
              render: (val: string) => (
                <Badge variant={getSegmentBadgeVariant(val)} data-testid={`segment-${val}`}>
                  {val.replace("-", " ")}
                </Badge>
              ),
            },
            {
              key: "totalPurchases",
              label: "Purchases",
              render: (val: number) => <span data-testid="customer-purchases">{val}</span>,
            },
            {
              key: "totalSpent",
              label: "Total Spent",
              render: (val: number) => (
                <span className="font-semibold" data-testid="customer-spent">
                  {val} coins
                </span>
              ),
            },
            {
              key: "lastPurchase",
              label: "Last Purchase",
              render: (val: string) => (
                <span className="text-sm">
                  {val ? new Date(val).toLocaleDateString() : "Never"}
                </span>
              ),
            },
            {
              key: "id",
              label: "Actions",
              render: (val: string) => (
                <Button variant="outline" size="sm" data-testid={`button-view-customer-${val}`}>
                  View Profile
                </Button>
              ),
            },
          ]}
          data={customers}
          loading={isLoading}
        />
      </ChartContainer>
    </div>
  );
}
