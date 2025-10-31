'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Clock,
  Monitor,
  Globe,
  User,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ErrorGroup {
  id: string;
  fingerprint: string;
  message: string;
  component?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  status: 'active' | 'resolved' | 'ignored';
  firstSeen: string;
  lastSeen: string;
  occurrenceCount: number;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: any;
}

interface ErrorEvent {
  id: string;
  groupId: string;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
  context?: any;
  browserInfo?: any;
  requestInfo?: any;
  userDescription?: string;
  createdAt: string;
}

interface ErrorStats {
  totalErrors: number;
  uniqueErrors: number;
  criticalErrors: number;
  activeErrors: number;
  resolvedErrors: number;
  errorsByHour: Array<{ hour: string; count: number }>;
  topErrors: Array<{ groupId: string; message: string; count: number }>;
  errorsBySeverity: Array<{ severity: string; count: number }>;
  errorsByBrowser: Array<{ browser: string; count: number }>;
  recentResolutions: Array<{ groupId: string; message: string; resolvedAt: string; resolvedBy: string }>;
}

export default function ErrorMonitoring() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [statusModal, setStatusModal] = useState<{ groupId: string; currentStatus: string } | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [statsPeriod, setStatsPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  // Filters
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    search: '',
    sortBy: 'last_seen',
    sortOrder: 'desc',
  });

  // Fetch error groups
  const { data: errorGroups, isLoading: loadingGroups, refetch: refetchGroups } = useQuery({
    queryKey: ['/api/admin/errors/groups', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      
      const response = await apiRequest('GET', `/api/admin/errors/groups?${params}`);
      return response.json();
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch error stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/errors/stats', statsPeriod],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/errors/stats?period=${statsPeriod}`);
      return response.json();
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch error group details
  const { data: groupDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['/api/admin/errors/groups', selectedGroup],
    queryFn: async () => {
      if (!selectedGroup) return null;
      const response = await apiRequest('GET', `/api/admin/errors/groups/${selectedGroup}`);
      return response.json();
    },
    enabled: !!selectedGroup,
  });

  // Update error status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ groupId, status, reason }: { groupId: string; status: string; reason: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/errors/groups/${groupId}/status`, { status, reason });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Status updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors/stats'] });
      setStatusModal(null);
      setNewStatus('');
      setStatusReason('');
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update status', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/errors/cleanup');
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Cleanup completed',
        description: `Deleted ${data.cleanup.deletedGroups} groups and ${data.cleanup.deletedEvents} events. Auto-resolved ${data.autoResolve.resolvedCount} inactive errors.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors/stats'] });
    },
    onError: (error) => {
      toast({ 
        title: 'Cleanup failed', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" data-testid={`badge-status-${status}`}>Active</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-600" data-testid={`badge-status-${status}`}>Resolved</Badge>;
      case 'ignored':
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Ignored</Badge>;
      default:
        return <Badge data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
        setSelectedGroup(groupId);
      }
      return next;
    });
  };

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Error Monitoring</h2>
          <p className="text-muted-foreground">
            Track and manage application errors
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetchGroups()}
            variant="outline"
            size="sm"
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => cleanupMutation.mutate()}
            variant="outline"
            size="sm"
            disabled={cleanupMutation.isPending}
            data-testid="button-cleanup"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-errors">
              {stats?.totalErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {statsPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unique-errors">
              {stats?.uniqueErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Different error types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-critical-errors">
              {stats?.criticalErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-errors">
              {stats?.activeErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unresolved errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-resolved-errors">
              {stats?.resolvedErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Fixed issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with Clear Categorization */}
      <Tabs defaultValue="to-be-solved" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="to-be-solved" data-testid="tab-to-be-solved" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            To Be Solved
            {stats?.criticalErrors > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.criticalErrors}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unsolved" data-testid="tab-unsolved" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Unsolved
            {stats?.activeErrors > 0 && (
              <Badge variant="secondary" className="ml-1">{stats.activeErrors}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="solved" data-testid="tab-solved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Solved
            {stats?.resolvedErrors > 0 && (
              <Badge variant="outline" className="ml-1">{stats.resolvedErrors}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Errors</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* To Be Solved Tab - Critical/High Priority Errors */}
        <TabsContent value="to-be-solved" className="space-y-4">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Errors Requiring Immediate Attention
                </div>
              </CardTitle>
              <CardDescription>
                Top 10 most urgent errors ranked by priority score (severity + occurrence + recency)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Priority</TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Occurrences</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Calculate priority scores for all active errors
                      const calculatePriorityScore = (error: ErrorGroup): number => {
                        let score = 0;
                        
                        // Severity scoring (0-100)
                        if (error.severity === 'critical') score += 100;
                        else if (error.severity === 'error') score += 50;
                        else if (error.severity === 'warning') score += 25;
                        else score += 10;
                        
                        // Occurrence count scoring (0-50, capped at 50+ occurrences)
                        score += Math.min(error.occurrenceCount, 50);
                        
                        // Recency scoring (0-20, errors in last hour get max points)
                        const hoursSinceLastSeen = (Date.now() - new Date(error.lastSeen).getTime()) / (1000 * 60 * 60);
                        if (hoursSinceLastSeen < 1) score += 20;
                        else if (hoursSinceLastSeen < 6) score += 15;
                        else if (hoursSinceLastSeen < 24) score += 10;
                        else score += 5;
                        
                        return score;
                      };
                      
                      // Get all active errors, calculate priorities, and take top 10
                      const activeErrors = errorGroups?.groups
                        ?.filter((g: ErrorGroup) => g.status === 'active')
                        ?.map((error: ErrorGroup) => ({
                          ...error,
                          priorityScore: calculatePriorityScore(error)
                        }))
                        ?.sort((a, b) => b.priorityScore - a.priorityScore)
                        ?.slice(0, 10); // Only show top 10 most urgent errors
                      
                      return activeErrors?.map((group, index: number) => (
                        <>
                          <TableRow key={group.id} data-testid={`row-priority-error-${group.id}`} className="bg-white dark:bg-gray-950">
                            <TableCell>
                              <Badge variant={index < 3 ? 'destructive' : 'secondary'}>
                                #{index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGroupExpand(group.id)}
                                data-testid={`button-expand-${group.id}`}
                              >
                                {expandedGroups.has(group.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <p className="line-clamp-2" data-testid={`text-error-message-${group.id}`}>
                                  {group.message}
                                </p>
                                {group.component && (
                                  <p className="text-xs text-muted-foreground">
                                    Component: {group.component}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityColor(group.severity)}>
                                <span className="flex items-center gap-1">
                                  {getSeverityIcon(group.severity)}
                                  {group.severity}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span data-testid={`text-occurrences-${group.id}`}>
                                {group.occurrenceCount}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{formatDistanceToNow(new Date(group.lastSeen), { addSuffix: true })}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(group.lastSeen), 'PPp')}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStatusModal({ groupId: group.id, currentStatus: group.status })}
                                data-testid={`button-change-status-${group.id}`}
                              >
                                Change Status
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedGroups.has(group.id) && groupDetails?.events && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-muted/50">
                                <div className="space-y-4 p-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Recent Occurrences</h4>
                                    <ScrollArea className="h-64">
                                      <div className="space-y-2">
                                        {groupDetails.events.map((event: ErrorEvent) => (
                                          <Card key={event.id}>
                                            <CardContent className="p-3 text-sm">
                                              <div className="grid gap-2">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Time:</span>
                                                  <span>{format(new Date(event.createdAt), 'PPp')}</span>
                                                </div>
                                                {event.userId && (
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">User ID:</span>
                                                    <span>{event.userId}</span>
                                                  </div>
                                                )}
                                                {event.stackTrace && (
                                                  <div>
                                                    <span className="text-muted-foreground">Stack Trace:</span>
                                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                                      {event.stackTrace}
                                                    </pre>
                                                  </div>
                                                )}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ));
                    })()}
                    {(!errorGroups?.groups || errorGroups.groups.filter((g: ErrorGroup) => g.status === 'active').length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="font-semibold">No active errors!</p>
                          <p className="text-sm">All errors have been resolved.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unsolved Errors Tab - All Active Errors */}
        <TabsContent value="unsolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unsolved Errors</CardTitle>
              <CardDescription>
                All active errors that haven't been resolved yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Occurrences</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorGroups?.groups
                      ?.filter((g: ErrorGroup) => g.status === 'active')
                      ?.map((group: ErrorGroup) => (
                        <>
                          <TableRow key={group.id} data-testid={`row-unsolved-error-${group.id}`}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGroupExpand(group.id)}
                                data-testid={`button-expand-${group.id}`}
                              >
                                {expandedGroups.has(group.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <p className="line-clamp-2" data-testid={`text-error-message-${group.id}`}>
                                  {group.message}
                                </p>
                                {group.component && (
                                  <p className="text-xs text-muted-foreground">
                                    Component: {group.component}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityColor(group.severity)}>
                                <span className="flex items-center gap-1">
                                  {getSeverityIcon(group.severity)}
                                  {group.severity}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span data-testid={`text-occurrences-${group.id}`}>
                                {group.occurrenceCount}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{formatDistanceToNow(new Date(group.lastSeen), { addSuffix: true })}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(group.lastSeen), 'PPp')}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStatusModal({ groupId: group.id, currentStatus: group.status })}
                                data-testid={`button-change-status-${group.id}`}
                              >
                                Resolve
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedGroups.has(group.id) && groupDetails?.events && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/50">
                                <div className="space-y-4 p-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Recent Occurrences</h4>
                                    <ScrollArea className="h-64">
                                      <div className="space-y-2">
                                        {groupDetails.events.map((event: ErrorEvent) => (
                                          <Card key={event.id}>
                                            <CardContent className="p-3 text-sm">
                                              <div className="grid gap-2">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Time:</span>
                                                  <span>{format(new Date(event.createdAt), 'PPp')}</span>
                                                </div>
                                                {event.userId && (
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">User ID:</span>
                                                    <span>{event.userId}</span>
                                                  </div>
                                                )}
                                                {event.stackTrace && (
                                                  <div>
                                                    <span className="text-muted-foreground">Stack Trace:</span>
                                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                                      {event.stackTrace}
                                                    </pre>
                                                  </div>
                                                )}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    {errorGroups?.groups?.filter((g: ErrorGroup) => g.status === 'active').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="font-semibold">No unsolved errors!</p>
                          <p className="text-sm">All errors have been resolved.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Solved Errors Tab */}
        <TabsContent value="solved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                Solved Errors
              </CardTitle>
              <CardDescription>
                Errors that have been successfully resolved
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Occurrences</TableHead>
                      <TableHead>Resolved</TableHead>
                      <TableHead>Resolved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorGroups?.groups
                      ?.filter((g: ErrorGroup) => g.status === 'resolved')
                      ?.map((group: ErrorGroup) => (
                        <>
                          <TableRow key={group.id} data-testid={`row-solved-error-${group.id}`}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGroupExpand(group.id)}
                                data-testid={`button-expand-${group.id}`}
                              >
                                {expandedGroups.has(group.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <p className="line-clamp-2" data-testid={`text-error-message-${group.id}`}>
                                  {group.message}
                                </p>
                                {group.component && (
                                  <p className="text-xs text-muted-foreground">
                                    Component: {group.component}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityColor(group.severity)}>
                                <span className="flex items-center gap-1">
                                  {getSeverityIcon(group.severity)}
                                  {group.severity}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span data-testid={`text-occurrences-${group.id}`}>
                                {group.occurrenceCount}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {group.resolvedAt && (
                                  <>
                                    <p>{formatDistanceToNow(new Date(group.resolvedAt), { addSuffix: true })}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(group.resolvedAt), 'PPp')}
                                    </p>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {group.resolvedBy || 'System'}
                              </span>
                            </TableCell>
                          </TableRow>
                          {expandedGroups.has(group.id) && groupDetails?.events && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/50">
                                <div className="space-y-4 p-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Error Details</h4>
                                    <ScrollArea className="h-64">
                                      <div className="space-y-2">
                                        {groupDetails.events.slice(0, 5).map((event: ErrorEvent) => (
                                          <Card key={event.id}>
                                            <CardContent className="p-3 text-sm">
                                              <div className="grid gap-2">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Time:</span>
                                                  <span>{format(new Date(event.createdAt), 'PPp')}</span>
                                                </div>
                                                {event.stackTrace && (
                                                  <div>
                                                    <span className="text-muted-foreground">Stack Trace:</span>
                                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                                      {event.stackTrace.substring(0, 200)}...
                                                    </pre>
                                                  </div>
                                                )}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    {errorGroups?.groups?.filter((g: ErrorGroup) => g.status === 'resolved').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Info className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-semibold">No resolved errors yet</p>
                          <p className="text-sm">Resolved errors will appear here.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Errors Tab - Original functionality with filters */}
        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search errors..."
                      className="pl-8"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      data-testid="input-search"
                    />
                  </div>
                </div>

                <div>
                  <Label>Severity</Label>
                  <Select
                    value={filters.severity}
                    onValueChange={(value) => setFilters({ ...filters, severity: value })}
                  >
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="ignored">Ignored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger data-testid="select-sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_seen">Last Seen</SelectItem>
                      <SelectItem value="first_seen">First Seen</SelectItem>
                      <SelectItem value="occurrences">Occurrences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Order</Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) => setFilters({ ...filters, sortOrder: value })}
                  >
                    <SelectTrigger data-testid="select-sort-order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Groups Table */}
          <Card>
            <CardHeader>
              <CardTitle>Error Groups</CardTitle>
              <CardDescription>
                Grouped by fingerprint hash of message and stack trace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Occurrences</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorGroups?.groups?.map((group: ErrorGroup) => (
                      <>
                        <TableRow key={group.id} data-testid={`row-error-group-${group.id}`}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleGroupExpand(group.id)}
                              data-testid={`button-expand-${group.id}`}
                            >
                              {expandedGroups.has(group.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="space-y-1">
                              <p className="line-clamp-2" data-testid={`text-error-message-${group.id}`}>
                                {group.message}
                              </p>
                              {group.component && (
                                <p className="text-xs text-muted-foreground">
                                  Component: {group.component}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityColor(group.severity)}>
                              <span className="flex items-center gap-1">
                                {getSeverityIcon(group.severity)}
                                {group.severity}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(group.status)}</TableCell>
                          <TableCell>
                            <span data-testid={`text-occurrences-${group.id}`}>
                              {group.occurrenceCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatDistanceToNow(new Date(group.lastSeen), { addSuffix: true })}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(group.lastSeen), 'PPp')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatusModal({ groupId: group.id, currentStatus: group.status })}
                              data-testid={`button-change-status-${group.id}`}
                            >
                              Change Status
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedGroups.has(group.id) && groupDetails?.group?.id === group.id && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/20">
                              <div className="p-4 space-y-4">
                                {/* Error Details */}
                                <div className="grid gap-4 md:grid-cols-3">
                                  <div>
                                    <p className="text-sm font-medium">First Seen</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(group.firstSeen), 'PPpp')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Affected Users</p>
                                    <p className="text-sm text-muted-foreground">
                                      {groupDetails?.affectedUsers || 0} users
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Browsers</p>
                                    <div className="text-sm text-muted-foreground">
                                      {groupDetails?.browsers?.map((b: any) => (
                                        <div key={b.name}>
                                          {b.name}: {b.count}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Recent Events */}
                                <div>
                                  <h4 className="font-medium mb-2">Recent Events</h4>
                                  <ScrollArea className="h-[200px] border rounded p-2">
                                    {groupDetails?.recentEvents?.map((event: ErrorEvent) => (
                                      <div key={event.id} className="mb-3 p-2 bg-background rounded">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                          <span>{format(new Date(event.createdAt), 'PPp')}</span>
                                          {event.userId && <span>User: {event.userId}</span>}
                                        </div>
                                        {event.stackTrace && (
                                          <pre className="text-xs font-mono whitespace-pre-wrap">
                                            {event.stackTrace.split('\n').slice(0, 3).join('\n')}
                                          </pre>
                                        )}
                                        {event.userDescription && (
                                          <p className="text-sm mt-1 italic">
                                            "{event.userDescription}"
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </ScrollArea>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Period Selector */}
          <div className="flex justify-end">
            <Select
              value={statsPeriod}
              onValueChange={(value) => setStatsPeriod(value as any)}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-stats-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Errors Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.topErrors?.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="message" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Errors by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.errorsBySeverity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.severity}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats?.errorsBySeverity?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Errors by Browser */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Browser</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.errorsByBrowser}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Resolutions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Resolutions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.recentResolutions?.map((resolution: any) => (
                    <div key={resolution.groupId} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{resolution.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Resolved by {resolution.resolvedBy} • {formatDistanceToNow(new Date(resolution.resolvedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  ))}
                  {(!stats?.recentResolutions || stats.recentResolutions.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent resolutions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Change Modal */}
      <Dialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Error Status</DialogTitle>
            <DialogDescription>
              Update the status of this error group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Describe why you're changing the status..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                data-testid="input-status-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusModal(null)}
              data-testid="button-cancel-status"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (statusModal && newStatus) {
                  updateStatusMutation.mutate({
                    groupId: statusModal.groupId,
                    status: newStatus,
                    reason: statusReason,
                  });
                }
              }}
              disabled={!newStatus || updateStatusMutation.isPending}
              data-testid="button-update-status"
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}