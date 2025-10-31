"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

// Type definitions for API responses
interface GrowthDataPoint {
  date: string;
  users: number;
}

interface CountryDataPoint {
  country: string;
  users: number;
}

interface ActiveInactiveDataPoint {
  name: string;
  value: number;
}

interface UsersAnalyticsData {
  dau: number;
  mau: number;
  newUsers: number;
  churnRate: number;
  growthData: GrowthDataPoint[];
  countryData: CountryDataPoint[];
  activeInactiveData: ActiveInactiveDataPoint[];
}

interface ContentTrendDataPoint {
  date: string;
  count: number;
}

interface TypeDistributionPoint {
  name: string;
  value: number;
}

interface TopCreator {
  id: string;
  username: string;
  posts: number;
  views: number;
  avgQuality?: number;
}

interface QualityScore {
  score: string;
  count: number;
}

interface ContentAnalyticsData {
  trendData: ContentTrendDataPoint[];
  typeDistribution: TypeDistributionPoint[];
  topCreators: TopCreator[];
  qualityScores: QualityScore[];
}

interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

interface RevenueSourcePoint {
  name: string;
  value: number;
}

interface TopEarner {
  id: string;
  username: string;
  totalEarnings: number;
  monthlyEarnings: number;
  sales: number;
}

interface TransactionVolumePoint {
  date: string;
  volume: number;
}

interface FinancialAnalyticsData {
  revenueTrend: RevenueTrendPoint[];
  revenueBySource: RevenueSourcePoint[];
  topEarners: TopEarner[];
  transactionVolume: TransactionVolumePoint[];
}

interface HeatmapDataPoint {
  hour: string;
  activity: number;
}

interface EngagementAnalyticsData {
  avgSessionDuration: string;
  bounceRate: number;
  pagesPerSession: number;
  heatmapData: HeatmapDataPoint[];
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("users");

  // Add explicit type annotations to ensure TypeScript knows the structure
  const { data: usersDataRaw, isLoading: usersLoading } = useQuery<UsersAnalyticsData>({
    queryKey: ["/api/admin/analytics/users"]
  });

  // Defensive programming: ensure usersData always has the required structure
  const usersData: UsersAnalyticsData = usersDataRaw || {
    dau: 0,
    mau: 0,
    newUsers: 0,
    churnRate: 0,
    growthData: [],
    countryData: [],
    activeInactiveData: []
  };

  const { data: contentDataRaw, isLoading: contentLoading } = useQuery<ContentAnalyticsData>({
    queryKey: ["/api/admin/analytics/content"]
  });

  const contentData: ContentAnalyticsData = contentDataRaw || {
    trendData: [],
    typeDistribution: [],
    topCreators: [],
    qualityScores: []
  };

  const { data: financialDataRaw, isLoading: financialLoading } = useQuery<FinancialAnalyticsData>({
    queryKey: ["/api/admin/analytics/financial"]
  });

  const financialData: FinancialAnalyticsData = financialDataRaw || {
    revenueTrend: [],
    revenueBySource: [],
    topEarners: [],
    transactionVolume: []
  };

  const { data: engagementDataRaw, isLoading: engagementLoading } = useQuery<EngagementAnalyticsData>({
    queryKey: ["/api/admin/analytics/engagement"]
  });

  const engagementData: EngagementAnalyticsData = engagementDataRaw || {
    avgSessionDuration: '0m',
    bounceRate: 0,
    pagesPerSession: 0,
    heatmapData: []
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics & Reports</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-analytics">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
          <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {usersLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card data-testid="card-dau">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">DAU</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-dau">
                      {usersData.dau}
                    </div>
                    <p className="text-xs text-muted-foreground">Daily Active Users</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-mau">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">MAU</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-mau">
                      {usersData.mau}
                    </div>
                    <p className="text-xs text-muted-foreground">Monthly Active Users</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-new-users">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">New Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-new-users">
                      {usersData.newUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-churn-rate">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-churn-rate">
                      {usersData.churnRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Monthly churn</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-user-growth">
                  <CardHeader>
                    <CardTitle>User Growth (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={usersData.growthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-users-by-country">
                  <CardHeader>
                    <CardTitle>Users by Country (Top 10)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={usersData.countryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="country" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="users" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-active-inactive">
                  <CardHeader>
                    <CardTitle>Active vs Inactive Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={usersData.activeInactiveData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {usersData.activeInactiveData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {contentLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-content-trend">
                  <CardHeader>
                    <CardTitle>Content Creation Trend (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={contentData.trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-content-type-distribution">
                  <CardHeader>
                    <CardTitle>Content Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={contentData.typeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {contentData.typeDistribution.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-top-creators">
                <CardHeader>
                  <CardTitle>Top Content Creators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Creator</TableHead>
                          <TableHead>Posts</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Avg Quality</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contentData.topCreators.length > 0 ? (
                          contentData.topCreators.map((creator: TopCreator, index: number) => (
                            <TableRow key={creator.id} data-testid={`creator-${creator.id}`}>
                              <TableCell data-testid={`creator-rank-${creator.id}`}>{index + 1}</TableCell>
                              <TableCell>{creator.username}</TableCell>
                              <TableCell>{creator.posts}</TableCell>
                              <TableCell>{creator.views}</TableCell>
                              <TableCell>{creator.avgQuality?.toFixed(1) || 'N/A'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-quality-scores">
                <CardHeader>
                  <CardTitle>Quality Scores Histogram</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={contentData.qualityScores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="score" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          {financialLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-revenue-trend">
                  <CardHeader>
                    <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={financialData.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-revenue-by-source">
                  <CardHeader>
                    <CardTitle>Revenue by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={financialData.revenueBySource}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: $${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {financialData.revenueBySource.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-top-earners">
                <CardHeader>
                  <CardTitle>Top Earners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Total Earnings</TableHead>
                          <TableHead>This Month</TableHead>
                          <TableHead>Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialData.topEarners.length > 0 ? (
                          financialData.topEarners.map((earner: TopEarner, index: number) => (
                            <TableRow key={earner.id} data-testid={`earner-${earner.id}`}>
                              <TableCell data-testid={`earner-rank-${earner.id}`}>{index + 1}</TableCell>
                              <TableCell>{earner.username}</TableCell>
                              <TableCell>${earner.totalEarnings}</TableCell>
                              <TableCell>${earner.monthlyEarnings}</TableCell>
                              <TableCell>{earner.sales}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-transaction-volume">
                <CardHeader>
                  <CardTitle>Transaction Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={financialData.transactionVolume}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          {engagementLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card data-testid="card-avg-session">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-avg-session">
                      {engagementData.avgSessionDuration}
                    </div>
                    <p className="text-xs text-muted-foreground">Per user session</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-bounce-rate">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-bounce-rate">
                      {engagementData.bounceRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Single page visits</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-pages-per-session">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pages Per Session</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-pages-per-session">
                      {engagementData.pagesPerSession}
                    </div>
                    <p className="text-xs text-muted-foreground">Average pages</p>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-engagement-heatmap">
                <CardHeader>
                  <CardTitle>Engagement Heatmap (Hourly Activity)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData.heatmapData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="activity" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
