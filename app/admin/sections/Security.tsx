"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SecurityEvent {
  id: number;
  type: string;
  severity: string;
  description: string;
  resolved: boolean;
  createdAt: string;
}

interface IPBan {
  id: number;
  ipAddress: string;
  reason: string;
  bannedBy: string;
  createdAt: string;
  active: boolean;
}

interface ResponseTimeDataPoint {
  time: string;
  responseTime: number;
}

interface ErrorRateDataPoint {
  time: string;
  errors: number;
}

interface Alert {
  id: number;
  message: string;
  severity: string;
  time: string;
}

interface PerformanceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTimeData: ResponseTimeDataPoint[];
  errorRateData: ErrorRateDataPoint[];
  dbQueryTime: {
    avg: number;
    min: number;
    max: number;
  };
  alerts: Alert[];
}

export default function Security() {
  const [activeTab, setActiveTab] = useState("security-events");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [banFilter, setBanFilter] = useState("active");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();

  const { data: securityEventsRaw, isLoading: eventsLoading } = useQuery<SecurityEvent[]>({
    queryKey: ["/api/admin/security/events", { type: typeFilter, severity: severityFilter, resolved: resolvedFilter }]
  });

  const securityEvents: SecurityEvent[] = Array.isArray(securityEventsRaw) ? securityEventsRaw : [];

  const { data: ipBansRaw, isLoading: bansLoading } = useQuery<IPBan[]>({
    queryKey: ["/api/admin/security/ip-bans", { status: banFilter }]
  });

  const ipBans: IPBan[] = Array.isArray(ipBansRaw) ? ipBansRaw : [];

  const { data: performanceMetricsRaw, isLoading: metricsLoading } = useQuery<PerformanceMetrics>({
    queryKey: ["/api/admin/security/performance-metrics"]
  });

  const performanceMetrics: PerformanceMetrics = performanceMetricsRaw || {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    responseTimeData: [],
    errorRateData: [],
    dbQueryTime: { avg: 0, min: 0, max: 0 },
    alerts: []
  };

  const resolveEventMutation = useMutation({
    mutationFn: async ({ eventId, notes }: { eventId: number; notes: string }) => {
      return apiRequest("POST", `/api/admin/security/events/${eventId}/resolve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/events"] });
      toast({ title: "Event resolved successfully" });
      setSelectedEvent(null);
    },
    onError: () => {
      toast({ title: "Failed to resolve event", variant: "destructive" });
    }
  });

  const addIPBanMutation = useMutation({
    mutationFn: async (data: { ipAddress: string; reason: string; duration: number }) => {
      return apiRequest("POST", "/api/admin/security/ip-bans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/ip-bans"] });
      toast({ title: "IP banned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to ban IP", variant: "destructive" });
    }
  });

  const unbanIPMutation = useMutation({
    mutationFn: async (banId: number) => {
      return apiRequest("DELETE", `/api/admin/security/ip-bans/${banId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/ip-bans"] });
      toast({ title: "IP unbanned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to unban IP", variant: "destructive" });
    }
  });

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security & Safety</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-security">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security-events" data-testid="tab-security-events">Security Events</TabsTrigger>
          <TabsTrigger value="ip-bans" data-testid="tab-ip-bans">IP Bans</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance Metrics</TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="security-events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login_attempt">Login Attempt</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="data_breach">Data Breach</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-severity-filter">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-resolved-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="unresolved">Unresolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {eventsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-security-events">
              <CardHeader>
                <CardTitle>Security Events ({securityEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityEvents.length > 0 ? (
                        securityEvents.map((event) => (
                          <TableRow key={event.id} data-testid={`event-${event.id}`}>
                            <TableCell>
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>{event.type}</TableCell>
                            <TableCell>
                              <Badge variant={getSeverityVariant(event.severity)}>
                                {event.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>{event.description}</TableCell>
                            <TableCell>
                              <Badge variant={event.resolved ? 'secondary' : 'default'}>
                                {event.resolved ? 'Resolved' : 'Unresolved'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedEvent(event)}
                                data-testid={`button-view-event-${event.id}`}
                              >
                                {event.resolved ? 'View' : 'Resolve'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No security events found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Detail Dialog */}
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent data-testid="dialog-event-detail">
              <DialogHeader>
                <DialogTitle>Security Event Details</DialogTitle>
                <DialogDescription>
                  Event ID: {selectedEvent?.id}
                </DialogDescription>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedEvent.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Severity</p>
                    <Badge variant={getSeverityVariant(selectedEvent.severity)}>
                      {selectedEvent.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{selectedEvent.description}</p>
                  </div>
                  {!selectedEvent.resolved && (
                    <div className="space-y-2">
                      <Label htmlFor="resolution-notes">Resolution Notes</Label>
                      <Textarea
                        id="resolution-notes"
                        placeholder="Enter resolution notes..."
                        data-testid="textarea-resolution-notes"
                      />
                      <Button
                        onClick={() => {
                          const notes = (document.getElementById('resolution-notes') as HTMLTextAreaElement)?.value;
                          resolveEventMutation.mutate({ eventId: selectedEvent.id, notes });
                        }}
                        disabled={resolveEventMutation.isPending}
                        data-testid="button-resolve-event"
                      >
                        Resolve Event
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* IP Bans Tab */}
        <TabsContent value="ip-bans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add IP Ban</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="IP Address"
                  id="ban-ip-address"
                  data-testid="input-ban-ip-address"
                />
                <Input
                  placeholder="Reason"
                  id="ban-reason"
                  data-testid="input-ban-reason"
                />
                <Select defaultValue="permanent">
                  <SelectTrigger className="w-full md:w-48" data-testid="select-ban-duration">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    const ipAddress = (document.getElementById('ban-ip-address') as HTMLInputElement)?.value;
                    const reason = (document.getElementById('ban-reason') as HTMLInputElement)?.value;
                    addIPBanMutation.mutate({ ipAddress, reason, duration: 0 });
                  }}
                  disabled={addIPBanMutation.isPending}
                  data-testid="button-add-ban"
                >
                  Add Ban
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle>IP Bans</CardTitle>
              <Select value={banFilter} onValueChange={setBanFilter}>
                <SelectTrigger className="w-48" data-testid="select-ban-status-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {bansLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Banned By</TableHead>
                        <TableHead>Banned At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipBans.length > 0 ? (
                        ipBans.map((ban) => (
                          <TableRow key={ban.id} data-testid={`ban-${ban.id}`}>
                            <TableCell>{ban.ipAddress}</TableCell>
                            <TableCell>{ban.reason}</TableCell>
                            <TableCell>{ban.bannedBy}</TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(ban.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={ban.active ? 'destructive' : 'secondary'}>
                                {ban.active ? 'Active' : 'Expired'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ban.active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unbanIPMutation.mutate(ban.id)}
                                  disabled={unbanIPMutation.isPending}
                                  data-testid={`button-unban-${ban.id}`}
                                >
                                  Unban
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No IP bans found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="performance" className="space-y-4">
          {metricsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* System Health Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card data-testid="card-cpu">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-cpu">
                      {performanceMetrics.cpu}%
                    </div>
                    <p className="text-xs text-muted-foreground">Current usage</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-memory">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Memory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-memory">
                      {performanceMetrics.memory}%
                    </div>
                    <p className="text-xs text-muted-foreground">Used</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-disk">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Disk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-disk">
                      {performanceMetrics.disk}%
                    </div>
                    <p className="text-xs text-muted-foreground">Used</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-network">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-network">
                      {performanceMetrics.network} MB/s
                    </div>
                    <p className="text-xs text-muted-foreground">Throughput</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-response-time">
                  <CardHeader>
                    <CardTitle>Response Time (Last 24 Hours)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={performanceMetrics.responseTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="responseTime" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-error-rate">
                  <CardHeader>
                    <CardTitle>Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={performanceMetrics.errorRateData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-db-metrics">
                <CardHeader>
                  <CardTitle>Database Query Time Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-2xl font-bold">{performanceMetrics.dbQueryTime.avg}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Min</p>
                      <p className="text-2xl font-bold">{performanceMetrics.dbQueryTime.min}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max</p>
                      <p className="text-2xl font-bold">{performanceMetrics.dbQueryTime.max}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-performance-alerts">
                <CardHeader>
                  <CardTitle>Performance Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alert</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceMetrics.alerts.length > 0 ? (
                          performanceMetrics.alerts.map((alert) => (
                            <TableRow key={alert.id}>
                              <TableCell>{alert.message}</TableCell>
                              <TableCell>
                                <Badge variant={getSeverityVariant(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(alert.time), { addSuffix: true })}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No performance alerts
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
