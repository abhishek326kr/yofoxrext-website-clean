"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bell, Smartphone } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

interface Notification {
  id: string;
  title: string;
  targetType: string;
  deliveredCount: number;
  openedCount: number;
  ctr: number;
  sentAt: string;
}

interface AppVersion {
  id: string;
  version: string;
  platform: string;
  releaseDate: string;
  userCount: number;
  forceUpdate: boolean;
}

interface VersionDistribution {
  version: string;
  count: number;
  percentage: number;
}

interface DeviceType {
  name: string;
  value: number;
  percentage: number;
}

interface OSDistribution {
  name: string;
  count: number;
}

interface BrowserDistribution {
  name: string;
  count: number;
}

interface ScreenResolution {
  resolution: string;
  count: number;
  percentage: number;
}

export default function Mobile() {
  const { toast } = useToast();
  const [targetType, setTargetType] = useState("all");

  const { data: notificationHistoryRaw, isLoading: historyLoading } = useQuery<Notification[]>({
    queryKey: ["/api/admin/mobile/notification-history"]
  });

  const notificationHistory: Notification[] = Array.isArray(notificationHistoryRaw) ? notificationHistoryRaw : [];

  const { data: appVersionsRaw, isLoading: versionsLoading } = useQuery<AppVersion[]>({
    queryKey: ["/api/admin/mobile/app-versions"]
  });

  const appVersions: AppVersion[] = Array.isArray(appVersionsRaw) ? appVersionsRaw : [];

  const { data: versionDistributionRaw, isLoading: versionDistLoading } = useQuery<VersionDistribution[]>({
    queryKey: ["/api/admin/mobile/version-distribution"]
  });

  const versionDistribution: VersionDistribution[] = Array.isArray(versionDistributionRaw) ? versionDistributionRaw : [];

  const { data: deviceTypesRaw, isLoading: deviceTypesLoading } = useQuery<DeviceType[]>({
    queryKey: ["/api/admin/mobile/device-types"]
  });

  const deviceTypes: DeviceType[] = Array.isArray(deviceTypesRaw) ? deviceTypesRaw : [];

  const { data: osDistributionRaw, isLoading: osDistLoading } = useQuery<OSDistribution[]>({
    queryKey: ["/api/admin/mobile/os-distribution"]
  });

  const osDistribution: OSDistribution[] = Array.isArray(osDistributionRaw) ? osDistributionRaw : [];

  const { data: browserDistributionRaw, isLoading: browserDistLoading } = useQuery<BrowserDistribution[]>({
    queryKey: ["/api/admin/mobile/browser-distribution"]
  });

  const browserDistribution: BrowserDistribution[] = Array.isArray(browserDistributionRaw) ? browserDistributionRaw : [];

  const { data: screenResolutionsRaw, isLoading: resolutionsLoading } = useQuery<ScreenResolution[]>({
    queryKey: ["/api/admin/mobile/screen-resolutions"]
  });

  const screenResolutions: ScreenResolution[] = Array.isArray(screenResolutionsRaw) ? screenResolutionsRaw : [];

  const sendNotificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/mobile/send-notification", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mobile/notification-history"] });
      toast({ title: "Notification sent successfully" });
    }
  });

  const toggleForceUpdateMutation = useMutation({
    mutationFn: ({ id, forceUpdate }: { id: string; forceUpdate: boolean }) => 
      apiRequest(`/api/admin/mobile/app-versions/${id}/force-update`, "PATCH", { forceUpdate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mobile/app-versions"] });
      toast({ title: "Force update setting updated" });
    }
  });

  const handleSendNotification = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    sendNotificationMutation.mutate({
      title: formData.get("title"),
      body: formData.get("body"),
      targetType,
      targetValue: formData.get("targetValue")
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mobile & Push Notifications</h1>

      <Tabs defaultValue="push" className="space-y-4">
        <TabsList>
          <TabsTrigger value="push" data-testid="tab-push">Push Notifications</TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions">App Versions</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-device-analytics">Device Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="push" className="space-y-4">
          <h2 className="text-xl font-semibold">Send Push Notification</h2>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Notification Title</Label>
                  <Input id="title" name="title" required data-testid="input-notification-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Notification Body</Label>
                  <Textarea id="body" name="body" rows={3} required data-testid="textarea-notification-body" />
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="target-all"
                        checked={targetType === "all"}
                        onCheckedChange={() => setTargetType("all")}
                        data-testid="checkbox-target-all"
                      />
                      <Label htmlFor="target-all" className="cursor-pointer">All Users</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="target-segments"
                        checked={targetType === "segments"}
                        onCheckedChange={() => setTargetType("segments")}
                        data-testid="checkbox-target-segments"
                      />
                      <Label htmlFor="target-segments" className="cursor-pointer">Specific Segments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="target-users"
                        checked={targetType === "users"}
                        onCheckedChange={() => setTargetType("users")}
                        data-testid="checkbox-target-users"
                      />
                      <Label htmlFor="target-users" className="cursor-pointer">Specific User IDs</Label>
                    </div>
                  </div>
                </div>
                {(targetType === "segments" || targetType === "users") && (
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">
                      {targetType === "segments" ? "Segment Names (comma-separated)" : "User IDs (comma-separated)"}
                    </Label>
                    <Input
                      id="targetValue"
                      name="targetValue"
                      placeholder={targetType === "segments" ? "premium, active-traders" : "user-123, user-456"}
                      data-testid="input-target-value"
                    />
                  </div>
                )}
                <Button type="submit" disabled={sendNotificationMutation.isPending} data-testid="button-send-notification">
                  <Bell className="w-4 h-4 mr-2" />
                  {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>CTR</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationHistory.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium max-w-xs truncate">{notification.title}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{notification.targetType}</Badge>
                          </TableCell>
                          <TableCell>{notification.deliveredCount}</TableCell>
                          <TableCell>{notification.openedCount}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {notification.ctr}%
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}</TableCell>
                        </TableRow>
                      ))}
                      {notificationHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No notifications sent yet
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

        <TabsContent value="versions" className="space-y-4">
          <h2 className="text-xl font-semibold">App Versions</h2>

          <Card>
            <CardContent className="p-0">
              {versionsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Release Date</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Force Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appVersions.map((version) => (
                        <TableRow key={version.id} data-testid={`version-${version.id}`}>
                          <TableCell className="font-medium">{version.version}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{version.platform}</Badge>
                          </TableCell>
                          <TableCell>{new Date(version.releaseDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{version.userCount} users</Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={version.forceUpdate}
                              onCheckedChange={(checked) => 
                                toggleForceUpdateMutation.mutate({ id: version.id, forceUpdate: checked })
                              }
                              data-testid={`switch-force-update-${version.id}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {appVersions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No app versions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Version</CardTitle>
            </CardHeader>
            <CardContent>
              {versionDistLoading ? (
                <Skeleton className="h-64" />
              ) : versionDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={versionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `v${entry.version}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {versionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Device Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                {deviceTypesLoading ? (
                  <Skeleton className="h-64" />
                ) : deviceTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deviceTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {deviceTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OS Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {osDistLoading ? (
                  <Skeleton className="h-64" />
                ) : osDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={osDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
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

            <Card>
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {browserDistLoading ? (
                  <Skeleton className="h-64" />
                ) : browserDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={browserDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
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

            <Card>
              <CardHeader>
                <CardTitle>Screen Resolutions</CardTitle>
              </CardHeader>
              <CardContent>
                {resolutionsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}
                  </div>
                ) : screenResolutions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resolution</TableHead>
                          <TableHead>Users</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {screenResolutions.map((resolution, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resolution.resolution}</TableCell>
                            <TableCell>{resolution.count}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{resolution.percentage}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
