"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { FilterPanel } from "../shared/FilterPanel";
import { DollarSign, ShoppingCart, TrendingUp, Percent } from "lucide-react";
import { Line, LineChart, Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SalesDashboardData {
  totalRevenue: number;
  totalSales: number;
  avgSale: number;
  conversionRate: number;
}

export function SalesTab() {
  const [filters, setFilters] = useState({});
  const { data: salesData, isLoading } = useQuery<SalesDashboardData>({
    queryKey: ["/api/me/sales-dashboard", filters],
  });

  const mockProductData = [
    { name: "EA Pro", sales: 45, revenue: 2250 },
    { name: "Indicator Pack", sales: 32, revenue: 960 },
    { name: "Strategy Guide", sales: 28, revenue: 840 },
    { name: "Trading Bot", sales: 18, revenue: 1440 },
  ];

  const mockPieData = [
    { name: "Expert Advisors", value: 45, color: "hsl(var(--chart-1))" },
    { name: "Indicators", value: 30, color: "hsl(var(--chart-2))" },
    { name: "Articles", value: 15, color: "hsl(var(--chart-3))" },
    { name: "Other", value: 10, color: "hsl(var(--chart-4))" },
  ];

  const recentSales = [
    { product: "EA Pro v2", buyer: "trader123", price: "$50", date: "2 hours ago" },
    { product: "Indicator Set", buyer: "forex_master", price: "$30", date: "5 hours ago" },
    { product: "Strategy Guide", buyer: "newbie_trader", price: "$25", date: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={`$${salesData?.totalRevenue || 0}`}
          icon={DollarSign}
          trend={15.3}
          trendLabel="vs last month"
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-total-revenue"
        />
        <KPICard
          title="Total Sales"
          value={salesData?.totalSales || 0}
          icon={ShoppingCart}
          trend={8.7}
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-total-sales"
        />
        <KPICard
          title="Avg Sale Value"
          value={`$${salesData?.avgSale?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          trend={-2.4}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-avg-sale-value"
        />
        <KPICard
          title="Conversion Rate"
          value={`${salesData?.conversionRate || 0}%`}
          icon={Percent}
          trend={4.1}
          loading={isLoading}
          color="text-orange-500"
          data-testid="kpi-conversion-rate"
        />
      </div>

      <FilterPanel
        onFilterChange={setFilters}
        showDateRange
        showCategory
        categories={["Expert Advisors", "Indicators", "Articles"]}
      />

      <ChartContainer title="Revenue Timeline (Last 30 Days)" loading={isLoading}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockProductData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer title="Top 10 Products" loading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockProductData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Sales by Product Type" loading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <ChartContainer title="Recent Sales" loading={isLoading}>
        <DataTable
          columns={[
            { key: "product", label: "Product" },
            { key: "buyer", label: "Buyer" },
            { key: "price", label: "Price" },
            { key: "date", label: "Date" },
          ]}
          data={recentSales}
          loading={isLoading}
        />
      </ChartContainer>
    </div>
  );
}
