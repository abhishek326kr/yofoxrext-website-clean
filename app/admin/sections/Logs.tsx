"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";

interface AdminLog {
  id: string;
  createdAt: string;
  adminUsername: string;
  actionType: string;
  targetType: string;
  details: string;
  ipAddress: string;
}

interface SecurityLog {
  id: string;
  createdAt: string;
  eventType: string;
  severity: string;
  description: string;
  username?: string;
  ipAddress: string;
}

interface PerformanceLog {
  id: string;
  createdAt: string;
  metricType: string;
  value: number;
  unit: string;
  status: string;
}

interface PerformanceLogsData {
  aggregations?: {
    avg: number;
    min: number;
    max: number;
  };
  logs: PerformanceLog[];
}

interface SystemEvent {
  id: string;
  createdAt: string;
  eventType: string;
  severity: string;
  description: string;
  component: string;
}

export default function Logs() {
  const [activeTab, setActiveTab] = useState("admin-actions");
  const [adminFilter, setAdminFilter] = useState("all");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [metricTypeFilter, setMetricTypeFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  const { data: adminLogsRaw, isLoading: adminLogsLoading } = useQuery<AdminLog[]>({
    queryKey: ["/api/admin/logs/admin-actions", { admin: adminFilter, actionType: actionTypeFilter, targetType: targetTypeFilter, search }]
  });

  const adminLogs = Array.isArray(adminLogsRaw) ? adminLogsRaw : [];

  const { data: securityLogsRaw, isLoading: securityLogsLoading } = useQuery<SecurityLog[]>({
    queryKey: ["/api/admin/logs/security", { severity: severityFilter, eventType: eventTypeFilter }]
  });

  const securityLogs = Array.isArray(securityLogsRaw) ? securityLogsRaw : [];

  const { data: performanceLogsRaw, isLoading: performanceLogsLoading } = useQuery<PerformanceLogsData>({
    queryKey: ["/api/admin/logs/performance", { metricType: metricTypeFilter }]
  });

  const performanceLogs: PerformanceLogsData = performanceLogsRaw ?? {
    aggregations: { avg: 0, min: 0, max: 0 },
    logs: []
  };

  const { data: systemEventsRaw, isLoading: systemEventsLoading } = useQuery<SystemEvent[]>({
    queryKey: ["/api/admin/logs/system-events", { severity: severityFilter, eventType: eventTypeFilter }]
  });

  const systemEvents = Array.isArray(systemEventsRaw) ? systemEventsRaw : [];

  const exportLogs = (format: 'csv' | 'json') => {
    console.log(`Exporting logs as ${format}`);
  };

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
      <h1 className="text-3xl font-bold">Audit Logs</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-logs">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="admin-actions" data-testid="tab-admin-actions">Admin Actions</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security-logs">Security Logs</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance-logs">Performance Logs</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system-events">System Events</TabsTrigger>
        </TabsList>

        {/* Admin Actions Tab */}
        <TabsContent value="admin-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTimeout(() => setSearch(value), 300);
                  }}
                  data-testid="input-search-logs"
                />

                <Select value={adminFilter} onValueChange={setAdminFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-admin-filter">
                    <SelectValue placeholder="Admin User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Admins</SelectItem>
                    <SelectItem value="admin1">Admin 1</SelectItem>
                    <SelectItem value="admin2">Admin 2</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-action-type-filter">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-target-type-filter">
                    <SelectValue placeholder="Target Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Targets</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Input
                  type="date"
                  placeholder="Start Date"
                  className="w-full md:w-auto"
                  data-testid="input-start-date"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  className="w-full md:w-auto"
                  data-testid="input-end-date"
                />
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => exportLogs('csv')}
                    data-testid="button-export-csv"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportLogs('json')}
                    data-testid="button-export-json"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {adminLogsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-admin-logs">
              <CardHeader>
                <CardTitle>Admin Action Logs ({adminLogs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action Type</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminLogs.length > 0 ? (
                        adminLogs.map((log) => (
                          <TableRow key={log.id} data-testid={`log-${log.id}`}>
                            <TableCell>
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>{log.adminUsername}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.actionType}</Badge>
                            </TableCell>
                            <TableCell>{log.targetType}</TableCell>
                            <TableCell>{log.details}</TableCell>
                            <TableCell>{log.ipAddress}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-security-severity-filter">
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

                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-security-event-filter">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="breach">Breach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {securityLogsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-security-logs">
              <CardHeader>
                <CardTitle>Security Event Logs ({securityLogs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityLogs.length > 0 ? (
                        securityLogs.map((log) => (
                          <TableRow key={log.id} data-testid={`security-log-${log.id}`}>
                            <TableCell>
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>{log.eventType}</TableCell>
                            <TableCell>
                              <Badge variant={getSeverityVariant(log.severity)}>
                                {log.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.description}</TableCell>
                            <TableCell>{log.username || 'N/A'}</TableCell>
                            <TableCell>{log.ipAddress}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No security logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Logs Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={metricTypeFilter} onValueChange={setMetricTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-metric-type-filter">
                    <SelectValue placeholder="Metric Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metrics</SelectItem>
                    <SelectItem value="cpu">CPU</SelectItem>
                    <SelectItem value="memory">Memory</SelectItem>
                    <SelectItem value="response_time">Response Time</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="Start Date"
                  data-testid="input-perf-start-date"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  data-testid="input-perf-end-date"
                />
              </div>
            </CardContent>
          </Card>

          {performanceLogsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card data-testid="card-avg-metric">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-avg-metric">
                      {performanceLogs.aggregations?.avg || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Average value</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-min-metric">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Minimum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-min-metric">
                      {performanceLogs.aggregations?.min || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Minimum value</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-max-metric">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Maximum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-max-metric">
                      {performanceLogs.aggregations?.max || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Maximum value</p>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-performance-logs">
                <CardHeader>
                  <CardTitle>Performance Metrics ({performanceLogs.logs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Metric Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceLogs.logs.length > 0 ? (
                          performanceLogs.logs.map((log) => (
                            <TableRow key={log.id} data-testid={`perf-log-${log.id}`}>
                              <TableCell>
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </TableCell>
                              <TableCell>{log.metricType}</TableCell>
                              <TableCell>{log.value}</TableCell>
                              <TableCell>{log.unit}</TableCell>
                              <TableCell>
                                <Badge variant={log.status === 'normal' ? 'secondary' : 'destructive'}>
                                  {log.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No performance logs found
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

        {/* System Events Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-system-event-filter">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="shutdown">Shutdown</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-system-severity-filter">
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
              </div>
            </CardContent>
          </Card>

          {systemEventsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-system-events">
              <CardHeader>
                <CardTitle>System Events ({systemEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Component</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemEvents.length > 0 ? (
                        systemEvents.map((event) => (
                          <TableRow key={event.id} data-testid={`system-event-${event.id}`}>
                            <TableCell>
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>{event.eventType}</TableCell>
                            <TableCell>
                              <Badge variant={getSeverityVariant(event.severity)}>
                                {event.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>{event.description}</TableCell>
                            <TableCell>{event.component}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No system events found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
