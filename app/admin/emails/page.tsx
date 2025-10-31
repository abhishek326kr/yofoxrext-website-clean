"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Download,
  Edit,
  Eye,
  TestTube,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Zap,
  Settings,
  FileText,
  BarChart3,
  PieChart,
  Timer,
  Globe,
  Ban,
  MailOpen,
  MousePointerClick,
  UserX,
  Info,
  AlertCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { AdminAuthCheck } from "../auth-check";

// Priority colors
const PRIORITY_COLORS = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

// Status colors
const STATUS_COLORS = {
  sent: "bg-green-500",
  queued: "bg-blue-500",
  failed: "bg-red-500",
  bounced: "bg-orange-500",
  opened: "bg-purple-500",
  clicked: "bg-indigo-500",
};

// Chart colors
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function EmailDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [queuePaused, setQueuePaused] = useState(false);

  // Fetch email statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/admin/emails/stats/${dateRange}`],
    enabled: true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch email queue
  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ["/api/admin/emails/queue"],
    enabled: true,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch email logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: [`/api/admin/emails/logs?status=${statusFilter}&dateRange=${dateRange}&search=${searchQuery}`],
    enabled: true,
  });

  // Fetch email templates
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ["/api/admin/emails/templates"],
    enabled: true,
  });

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["/api/admin/emails/preferences"],
    enabled: true,
  });

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/admin/emails/analytics/${dateRange}`],
    enabled: true,
  });

  // Retry failed email mutation
  const retryEmail = useMutation({
    mutationFn: (emailId: string) => 
      apiRequest(`/api/admin/emails/retry/${emailId}`, "POST"),
    onSuccess: () => {
      toast({ description: "Email queued for retry" });
      refetchQueue();
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to retry email" });
    },
  });

  // Clear queue mutation
  const clearQueue = useMutation({
    mutationFn: () => 
      apiRequest("/api/admin/emails/queue/clear", "DELETE"),
    onSuccess: () => {
      toast({ description: "Email queue cleared" });
      refetchQueue();
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to clear queue" });
    },
  });

  // Toggle queue processing
  const toggleQueueProcessing = useMutation({
    mutationFn: (paused: boolean) => 
      apiRequest("/api/admin/emails/queue/toggle", "POST", { paused }),
    onSuccess: (_, paused) => {
      setQueuePaused(paused);
      toast({ description: `Queue ${paused ? "paused" : "resumed"}` });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to toggle queue" });
    },
  });

  // Send test email
  const sendTestEmail = useMutation({
    mutationFn: (data: { to: string; templateKey: string }) => 
      apiRequest("/api/admin/emails/test", "POST", data),
    onSuccess: () => {
      toast({ description: "Test email sent successfully" });
      setTestEmailAddress("");
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to send test email" });
    },
  });

  // Send announcement
  const sendAnnouncement = useMutation({
    mutationFn: (data: { subject: string; content: string }) => 
      apiRequest("/api/admin/emails/announcement", "POST", data),
    onSuccess: () => {
      toast({ description: "Announcement sent to all users" });
      setAnnouncementSubject("");
      setAnnouncementContent("");
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to send announcement" });
    },
  });

  // Toggle template
  const toggleTemplate = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => 
      apiRequest(`/api/admin/emails/templates/${key}`, "PATCH", { enabled }),
    onSuccess: () => {
      toast({ description: "Template updated" });
      refetchTemplates();
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to update template" });
    },
  });

  // Re-enable bounced email
  const reEnableEmail = useMutation({
    mutationFn: (userId: string) => 
      apiRequest(`/api/admin/emails/re-enable/${userId}`, "POST"),
    onSuccess: () => {
      toast({ description: "Email re-enabled for user" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/emails/preferences"] });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to re-enable email" });
    },
  });

  // Export data
  const exportData = (type: "logs" | "metrics") => {
    const data = type === "logs" ? logs : stats;
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-${type}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any) => {
    if (!data || !Array.isArray(data) || data.length === 0) return "";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === "string" ? `"${val}"` : val
      ).join(",")
    );
    return [headers, ...rows].join("\n");
  };

  const filteredLogs = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    return (logs as any[]).filter((log: any) => {
      const matchesSearch = !searchQuery || 
        log.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  return (
    <AdminAuthCheck>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Email Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage email queue, templates, and monitor delivery metrics
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]" data-testid="select-date-range">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => exportData("metrics")}
              variant="outline"
              data-testid="button-export-metrics"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Metrics
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-full mt-2" />
                </CardHeader>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{(stats as any)?.sentToday || 0}</div>
                    {(stats as any)?.sentTodayChange && (
                      <Badge variant={(stats as any).sentTodayChange > 0 ? "default" : "secondary"}>
                        {(stats as any).sentTodayChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs((stats as any).sentTodayChange)}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                    <MailOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{(stats as any)?.openRate || 0}%</div>
                    {(stats as any)?.openRateTrend && (
                      <Badge variant={(stats as any).openRateTrend > 0 ? "default" : "destructive"}>
                        {(stats as any).openRateTrend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs((stats as any).openRateTrend)}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{(stats as any)?.clickRate || 0}%</div>
                    {(stats as any)?.clickRateTrend && (
                      <Badge variant={(stats as any).clickRateTrend > 0 ? "default" : "destructive"}>
                        {(stats as any).clickRateTrend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs((stats as any).clickRateTrend)}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{(stats as any)?.bounceRate || 0}%</div>
                    {(stats as any)?.bounceRate > 5 && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        High
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{queue?.length || 0}</div>
                    <Badge variant={queue?.length > 100 ? "destructive" : "default"}>
                      {queuePaused ? "Paused" : "Active"}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{(stats as any)?.failed || 0}</div>
                    {(stats as any)?.failed > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => retryEmail.mutate("all")}
                        data-testid="button-retry-all"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Queue Management Tab */}
          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Email Queue</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant={queuePaused ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleQueueProcessing.mutate(!queuePaused)}
                      data-testid="button-toggle-queue"
                    >
                      {queuePaused ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" data-testid="button-clear-queue">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear Queue
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Email Queue?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove all queued emails. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => clearQueue.mutate()}>
                            Clear Queue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {queueLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : queue?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <Mail className="h-12 w-12 mb-2" />
                      <p>Email queue is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queue?.map((email: any) => (
                        <div
                          key={email.id}
                          className="border rounded-lg p-3 space-y-2"
                          data-testid={`queue-item-${email.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={PRIORITY_COLORS[email.priority || "medium"]}>
                                {email.priority || "medium"}
                              </Badge>
                              <span className="text-sm font-medium">{email.recipientEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(email.scheduledFor || email.createdAt), "MMM d, HH:mm")}
                              </span>
                              {email.status === "failed" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => retryEmail.mutate(email.id)}
                                  data-testid={`button-retry-${email.id}`}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {email.subject}
                          </div>
                          {email.retryCount > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              Retry attempt {email.retryCount} of 3
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Send Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Volume (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics?.volumeData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sent" 
                          stroke="#3b82f6" 
                          name="Sent"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="opened" 
                          stroke="#10b981" 
                          name="Opened"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="clicked" 
                          stroke="#f59e0b" 
                          name="Clicked"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analytics?.categoryData || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics?.categoryData?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Email Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Email Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics?.typeData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Timezone Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Times by Timezone</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <div className="grid grid-cols-24 gap-1">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const activity = analytics?.timezoneData?.find((d: any) => d.hour === hour);
                        const intensity = activity ? Math.min(activity.count / 100, 1) : 0;
                        return (
                          <div
                            key={hour}
                            className="aspect-square rounded"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                            }}
                            title={`${hour}:00 - ${activity?.count || 0} emails`}
                          />
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Email Logs</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-[200px]"
                        data-testid="input-search-emails"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="bounced">Bounced</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="opened">Opened</SelectItem>
                        <SelectItem value="clicked">Clicked</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => exportData("logs")}
                      variant="outline"
                      data-testid="button-export-logs"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Opens</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredLogs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs?.map((log: any) => (
                          <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                            <TableCell className="font-medium">{log.recipientEmail}</TableCell>
                            <TableCell>{log.templateKey}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={STATUS_COLORS[log.status]}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.openCount || 0}</TableCell>
                            <TableCell>{log.clickCount || 0}</TableCell>
                            <TableCell>{format(new Date(log.sentAt || log.createdAt), "MMM d, HH:mm")}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // View details
                                }}
                                data-testid={`button-view-${log.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templatesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))
                  ) : templates?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No templates configured
                    </div>
                  ) : (
                    templates?.map((template: any) => (
                      <div
                        key={template.key}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`template-${template.key}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={template.enabled}
                              onCheckedChange={(enabled) => 
                                toggleTemplate.mutate({ key: template.key, enabled })
                              }
                              data-testid={`switch-template-${template.key}`}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedTemplate(template)}
                                data-testid={`button-preview-${template.key}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Template Preview: {template.name}</DialogTitle>
                              </DialogHeader>
                              <div className="border rounded p-4 max-h-[500px] overflow-auto">
                                <div dangerouslySetInnerHTML={{ __html: template.htmlContent || template.content }} />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              // Open edit dialog
                            }}
                            data-testid={`button-edit-${template.key}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              // Open test send dialog
                            }}
                            data-testid={`button-test-${template.key}`}
                          >
                            <TestTube className="mr-2 h-4 w-4" />
                            Test
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Preference Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Preference Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Notifications Enabled</span>
                      <span className="font-semibold">{preferences?.enabledCount || 0} users</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Unsubscribed</span>
                      <span className="font-semibold text-red-500">{preferences?.unsubscribedCount || 0} users</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-disabled (bounces)</span>
                      <span className="font-semibold text-orange-500">{preferences?.bouncedCount || 0} users</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marketing Emails</span>
                      <span className="font-semibold">{preferences?.marketingEnabledCount || 0} users</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bounce Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Bounce Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {preferencesLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : preferences?.bouncedUsers?.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No bounced emails
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {preferences?.bouncedUsers?.map((user: any) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 border rounded"
                            data-testid={`bounced-user-${user.id}`}
                          >
                            <div>
                              <p className="font-medium">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.emailBounceCount} bounces • Last: {format(new Date(user.lastBounceAt), "MMM d")}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reEnableEmail.mutate(user.id)}
                              data-testid={`button-reenable-${user.id}`}
                            >
                              Re-enable
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Send Test Email */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Test Email</CardTitle>
                  <CardDescription>
                    Send a test email to verify configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Recipient Email</Label>
                    <Input
                      id="test-email"
                      type="email"
                      placeholder="test@example.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      data-testid="input-test-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-template">Template</Label>
                    <Select defaultValue="welcome">
                      <SelectTrigger id="test-template" data-testid="select-test-template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template: any) => (
                          <SelectItem key={template.key} value={template.key}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => sendTestEmail.mutate({ 
                      to: testEmailAddress, 
                      templateKey: "welcome" 
                    })}
                    disabled={!testEmailAddress || sendTestEmail.isPending}
                    className="w-full"
                    data-testid="button-send-test"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendTestEmail.isPending ? "Sending..." : "Send Test Email"}
                  </Button>
                </CardContent>
              </Card>

              {/* Send Announcement */}
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Announcement</CardTitle>
                  <CardDescription>
                    Send an announcement to all subscribed users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="announcement-subject">Subject</Label>
                    <Input
                      id="announcement-subject"
                      placeholder="Important announcement..."
                      value={announcementSubject}
                      onChange={(e) => setAnnouncementSubject(e.target.value)}
                      data-testid="input-announcement-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="announcement-content">Content</Label>
                    <Textarea
                      id="announcement-content"
                      placeholder="Your message..."
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      rows={5}
                      data-testid="textarea-announcement-content"
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="w-full"
                        disabled={!announcementSubject || !announcementContent}
                        data-testid="button-send-announcement"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Announcement
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Send Bulk Announcement?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will send an email to all {preferences?.enabledCount || 0} subscribed users. 
                          Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => sendAnnouncement.mutate({ 
                            subject: announcementSubject, 
                            content: announcementContent 
                          })}
                        >
                          Send Announcement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              {/* Global Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Global Email Settings</CardTitle>
                  <CardDescription>
                    Configure email system behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Daily Send Limit</Label>
                    <Input type="number" defaultValue="10000" data-testid="input-daily-limit" />
                  </div>
                  <div className="space-y-2">
                    <Label>Quiet Hours</Label>
                    <div className="flex gap-2">
                      <Input type="time" defaultValue="23:00" data-testid="input-quiet-start" />
                      <span className="self-center">to</span>
                      <Input type="time" defaultValue="08:00" data-testid="input-quiet-end" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-retry" defaultChecked data-testid="switch-auto-retry" />
                    <Label htmlFor="auto-retry">Enable auto-retry for failed emails</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="smart-scheduling" defaultChecked data-testid="switch-smart-scheduling" />
                    <Label htmlFor="smart-scheduling">Smart scheduling based on timezone</Label>
                  </div>
                  <Button className="w-full" variant="default" data-testid="button-save-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Export Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Reports</CardTitle>
                  <CardDescription>
                    Generate and download email reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => exportData("metrics")}
                    className="w-full"
                    variant="outline"
                    data-testid="button-export-full-metrics"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export Full Metrics Report
                  </Button>
                  <Button 
                    onClick={() => exportData("logs")}
                    className="w-full"
                    variant="outline"
                    data-testid="button-export-full-logs"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Export Email Logs
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    data-testid="button-export-bounce-report"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Export Bounce Report
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    data-testid="button-export-engagement-report"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Export Engagement Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminAuthCheck>
  );
}