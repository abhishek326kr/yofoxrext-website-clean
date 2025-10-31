"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileText, DollarSign, AlertCircle, UserPlus, Crown, TrendingUp, MessageSquare, ThumbsUp, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface OverviewStats {
  users: {
    total: number;
    new24h: number;
    online: number;
    dailyRegistrations: number;
    premiumMembers: number;
  };
  content: {
    total: number;
    new24h: number;
    avgPostsPerUser: number;
  };
  revenue: {
    total: number;
    today: number;
  };
  moderation: {
    pending: number;
    reports: number;
  };
}

interface EngagementMetrics {
  dailyActiveUsers: number;
  postsToday: number;
  commentsToday: number;
  likesToday: number;
}

interface RevenueBreakdown {
  stripe: number;
  crypto: number;
  total: number;
}

interface TopContent {
  id: string;
  title: string;
  slug: string;
  author: string;
  views: number;
  createdAt: string;
}

interface TopUser {
  id: number;
  username: string;
  reputation: number;
  coinBalance: number;
  badges: number;
  totalPosts: number;
}

interface ActivityFeedItem {
  id: string;
  adminUsername: string;
  actionType: string;
  targetType: string;
  status: string;
  createdAt: string;
}

interface UserGrowthDataPoint {
  date: string;
  users: number;
}

interface ContentTrendDataPoint {
  date: string;
  count: number;
}

export default function AdminOverview() {
  const { data: statsRaw, isLoading: statsLoading } = useQuery<OverviewStats>({
    queryKey: ["/api/admin/overview/stats"],
    refetchInterval: 30000,
  });

  const stats: OverviewStats = statsRaw || {
    users: { total: 0, new24h: 0, online: 0, dailyRegistrations: 0, premiumMembers: 0 },
    content: { total: 0, new24h: 0, avgPostsPerUser: 0 },
    revenue: { total: 0, today: 0 },
    moderation: { pending: 0, reports: 0 }
  };

  const { data: engagementRaw, isLoading: engagementLoading } = useQuery<EngagementMetrics>({
    queryKey: ["/api/admin/overview/engagement-metrics"],
    refetchInterval: 30000,
  });

  const engagement: EngagementMetrics = engagementRaw || {
    dailyActiveUsers: 0,
    postsToday: 0,
    commentsToday: 0,
    likesToday: 0
  };

  const { data: revenueBreakdownRaw, isLoading: revenueLoading } = useQuery<RevenueBreakdown>({
    queryKey: ["/api/admin/overview/revenue-breakdown"],
    refetchInterval: 60000,
  });

  const revenueBreakdown: RevenueBreakdown = revenueBreakdownRaw || {
    stripe: 0,
    crypto: 0,
    total: 0
  };

  const { data: topContentRaw, isLoading: topContentLoading } = useQuery<TopContent[]>({
    queryKey: ["/api/admin/overview/top-content"],
    refetchInterval: 60000,
  });

  const topContent: TopContent[] = Array.isArray(topContentRaw) ? topContentRaw : [];

  const { data: topUsersRaw, isLoading: topUsersLoading } = useQuery<TopUser[]>({
    queryKey: ["/api/admin/overview/top-users"],
    refetchInterval: 60000,
  });

  const topUsers: TopUser[] = Array.isArray(topUsersRaw) ? topUsersRaw : [];

  const { data: activityFeedRaw, isLoading: activityLoading } = useQuery<ActivityFeedItem[]>({
    queryKey: ["/api/admin/overview/activity-feed"],
    refetchInterval: 15000,
  });

  const activityFeed: ActivityFeedItem[] = Array.isArray(activityFeedRaw) ? activityFeedRaw : [];

  const { data: userGrowthRaw, isLoading: growthLoading } = useQuery<UserGrowthDataPoint[]>({
    queryKey: ["/api/admin/overview/user-growth"],
    refetchInterval: 60000,
  });

  const userGrowth: UserGrowthDataPoint[] = Array.isArray(userGrowthRaw) ? userGrowthRaw : [];

  const { data: contentTrendRaw, isLoading: trendLoading } = useQuery<ContentTrendDataPoint[]>({
    queryKey: ["/api/admin/overview/content-trend"],
    refetchInterval: 60000,
  });

  const contentTrend: ContentTrendDataPoint[] = Array.isArray(contentTrendRaw) ? contentTrendRaw : [];

  const revenueChartData = [
    { name: 'Stripe', value: revenueBreakdown.stripe, fill: 'hsl(var(--primary))' },
    { name: 'Crypto', value: revenueBreakdown.crypto, fill: 'hsl(var(--chart-2))' },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Overview Dashboard</h1>
      
      {/* 8 Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {stats.users.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.users.new24h} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-content">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-content">
              {stats.content.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.content.new24h} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${stats.revenue.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +${stats.revenue.today} today
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-moderation">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Moderation</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-moderation">
              {stats.moderation.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.moderation.reports} reports
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-online-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-online-users">
              {stats.users.online}
            </div>
            <p className="text-xs text-muted-foreground">
              Active in last 15min
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-daily-registrations">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Registrations</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-daily-registrations">
              {stats.users.dailyRegistrations}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered today
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-premium-members">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Members</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-premium-members">
              {stats.users.premiumMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              Level 5 and above
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-posts-user">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Posts/User</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-posts-user">
              {(stats.content.avgPostsPerUser || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per user average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="section-engagement-metrics">
        <Card data-testid="card-dau">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DAU</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold" data-testid="text-dau">
              {engagement.dailyActiveUsers}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-posts-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Today</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold" data-testid="text-posts-today">
              {engagement.postsToday}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-comments-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold" data-testid="text-comments-today">
              {engagement.commentsToday}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-likes-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes Today</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold" data-testid="text-likes-today">
              {engagement.likesToday}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-user-growth-chart">
          <CardHeader>
            <CardTitle>User Growth (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <Skeleton className="h-64" />
            ) : userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card data-testid="card-content-trend-chart">
          <CardHeader>
            <CardTitle>Content Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64" />
            ) : contentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-revenue-breakdown-chart">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-64" />
            ) : revenueBreakdown.total > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: $${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No revenue data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-top-content">
          <CardHeader>
            <CardTitle>Top Content</CardTitle>
          </CardHeader>
          <CardContent>
            {topContentLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : topContent.length > 0 ? (
              <div className="overflow-x-auto">
                <Table data-testid="table-top-content">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topContent.map((content, index) => (
                      <TableRow key={content.id} data-testid={`row-top-content-${content.id}`}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <Link 
                            href={`/thread/${content.slug}`}
                            className="text-primary hover:underline"
                            data-testid={`link-content-${content.id}`}
                          >
                            {content.title}
                          </Link>
                        </TableCell>
                        <TableCell>{content.author}</TableCell>
                        <TableCell>{content.views}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No content data</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-top-users">
          <CardHeader>
            <CardTitle>Top Users Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {topUsersLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : topUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table data-testid="table-top-users">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Rep</TableHead>
                      <TableHead>Coins</TableHead>
                      <TableHead>Posts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.map((user, index) => (
                      <TableRow key={user.id} data-testid={`row-top-user-${user.id}`}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <Link 
                            href={`/user/${user.username}`}
                            className="text-primary hover:underline"
                            data-testid={`link-user-${user.id}`}
                          >
                            {user.username}
                          </Link>
                        </TableCell>
                        <TableCell>{user.reputation}</TableCell>
                        <TableCell>{user.coinBalance}</TableCell>
                        <TableCell>{user.totalPosts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No user data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card data-testid="card-activity-feed">
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : activityFeed.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityFeed.map((activity) => (
                    <TableRow key={activity.id} data-testid={`activity-${activity.id}`}>
                      <TableCell data-testid={`activity-admin-${activity.id}`}>
                        {activity.adminUsername || 'System'}
                      </TableCell>
                      <TableCell data-testid={`activity-action-${activity.id}`}>
                        {activity.actionType}
                      </TableCell>
                      <TableCell data-testid={`activity-target-${activity.id}`}>
                        {activity.targetType}
                      </TableCell>
                      <TableCell>
                        <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`activity-time-${activity.id}`}>
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
