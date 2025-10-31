"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Key, Webhook, RotateCw } from "lucide-react";

const WEBHOOK_EVENTS = [
  { id: "user.created", label: "User Created" },
  { id: "user.updated", label: "User Updated" },
  { id: "content.published", label: "Content Published" },
  { id: "content.deleted", label: "Content Deleted" },
  { id: "transaction.completed", label: "Transaction Completed" },
  { id: "comment.posted", label: "Comment Posted" }
];

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string;
  rateLimit: number;
  lastUsedAt?: string;
  usageCount?: number;
}

interface WebhookConfig {
  id: string;
  url: string;
  events?: string[];
  active: boolean;
  successCount?: number;
  failureCount?: number;
}

interface EventLog {
  id: string;
  eventType: string;
  webhookUrl: string;
  status: string;
  response?: string;
  createdAt: string;
}

export default function Integrations() {
  const { toast } = useToast();
  const [isCreateApiKeyOpen, setIsCreateApiKeyOpen] = useState(false);
  const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [filterWebhook, setFilterWebhook] = useState("all");
  const [filterEventType, setFilterEventType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: apiKeysRaw, isLoading: apiKeysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/admin/integrations/api-keys"]
  });

  const apiKeys = Array.isArray(apiKeysRaw) ? apiKeysRaw : [];

  const { data: webhooksRaw, isLoading: webhooksLoading } = useQuery<WebhookConfig[]>({
    queryKey: ["/api/admin/integrations/webhooks"]
  });

  const webhooks = Array.isArray(webhooksRaw) ? webhooksRaw : [];

  const { data: eventLogsRaw, isLoading: eventLogsLoading } = useQuery<EventLog[]>({
    queryKey: ["/api/admin/integrations/event-logs", filterWebhook, filterEventType, filterStatus]
  });

  const eventLogs = Array.isArray(eventLogsRaw) ? eventLogsRaw : [];

  const createApiKeyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/integrations/api-keys", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/api-keys"] });
      toast({ title: "API key created successfully" });
      setIsCreateApiKeyOpen(false);
    }
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/integrations/api-keys/${id}/revoke`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/api-keys"] });
      toast({ title: "API key revoked" });
      setRevokeKeyId(null);
    }
  });

  const createWebhookMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/integrations/webhooks", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/webhooks"] });
      toast({ title: "Webhook created successfully" });
      setIsCreateWebhookOpen(false);
      setSelectedEvents([]);
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/integrations/webhooks/${id}/test`, "POST"),
    onSuccess: () => {
      toast({ title: "Test webhook sent" });
    }
  });

  const retryEventMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/integrations/event-logs/${id}/retry`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/event-logs"] });
      toast({ title: "Event retry initiated" });
    }
  });

  const handleCreateApiKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createApiKeyMutation.mutate({
      name: formData.get("name"),
      permissions: formData.get("permissions"),
      rateLimit: parseInt(formData.get("rateLimit") as string)
    });
  };

  const handleCreateWebhook = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (selectedEvents.length === 0) {
      toast({ title: "Please select at least one event", variant: "destructive" });
      return;
    }

    createWebhookMutation.mutate({
      url: formData.get("url"),
      events: selectedEvents,
      secret: formData.get("secret")
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">API & Integrations</h1>

      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys" data-testid="tab-api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="event-logs" data-testid="tab-event-logs">Event Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Dialog open={isCreateApiKeyOpen} onOpenChange={setIsCreateApiKeyOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-api-key">
                  <Key className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateApiKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Name</Label>
                    <Input id="key-name" name="name" required data-testid="input-api-key-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permissions">Permissions</Label>
                    <Select name="permissions" required>
                      <SelectTrigger data-testid="select-api-key-permissions">
                        <SelectValue placeholder="Select permissions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read Only</SelectItem>
                        <SelectItem value="write">Read & Write</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                    <Input id="rateLimit" name="rateLimit" type="number" defaultValue="1000" required data-testid="input-api-key-rate-limit" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createApiKeyMutation.isPending} data-testid="button-submit-api-key">
                      {createApiKeyMutation.isPending ? "Creating..." : "Create API Key"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {apiKeysLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Rate Limit</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id} data-testid={`api-key-${key.id}`}>
                          <TableCell className="font-medium" data-testid={`api-key-name-${key.id}`}>
                            {key.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {key.key.substring(0, 12)}...{key.key.substring(key.key.length - 4)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{key.permissions}</Badge>
                          </TableCell>
                          <TableCell>{key.rateLimit}/hr</TableCell>
                          <TableCell>
                            {key.lastUsedAt ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true }) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{key.usageCount || 0} requests</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRevokeKeyId(key.id)}
                              data-testid={`button-revoke-${key.id}`}
                            >
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {apiKeys.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No API keys created
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={!!revokeKeyId} onOpenChange={(open) => !open && setRevokeKeyId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to revoke this API key? This action cannot be undone and will immediately invalidate the key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-revoke">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => revokeKeyId && revokeApiKeyMutation.mutate(revokeKeyId)}
                  data-testid="button-confirm-revoke"
                >
                  Revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Webhooks</h2>
            <Dialog open={isCreateWebhookOpen} onOpenChange={setIsCreateWebhookOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-webhook">
                  <Webhook className="w-4 h-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateWebhook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Webhook URL</Label>
                    <Input id="url" name="url" type="url" placeholder="https://example.com/webhook" required data-testid="input-webhook-url" />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                      {WEBHOOK_EVENTS.map((event) => (
                        <div key={event.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={event.id}
                            checked={selectedEvents.includes(event.id)}
                            onCheckedChange={(checked) => {
                              setSelectedEvents(
                                checked
                                  ? [...selectedEvents, event.id]
                                  : selectedEvents.filter(e => e !== event.id)
                              );
                            }}
                            data-testid={`checkbox-event-${event.id}`}
                          />
                          <Label htmlFor={event.id} className="text-sm cursor-pointer">{event.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret">Secret (optional)</Label>
                    <Input id="secret" name="secret" placeholder="Webhook signing secret" data-testid="input-webhook-secret" />
                    <p className="text-xs text-muted-foreground">Used to verify webhook authenticity</p>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createWebhookMutation.isPending} data-testid="button-submit-webhook">
                      {createWebhookMutation.isPending ? "Creating..." : "Create Webhook"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {webhooksLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Events</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Success</TableHead>
                        <TableHead>Failures</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((webhook) => (
                        <TableRow key={webhook.id} data-testid={`webhook-${webhook.id}`}>
                          <TableCell className="font-mono text-xs max-w-xs truncate" data-testid={`webhook-url-${webhook.id}`}>
                            {webhook.url}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {webhook.events?.slice(0, 2).map((event) => (
                                <Badge key={event} variant="secondary" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                              {(webhook.events?.length ?? 0) > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(webhook.events?.length ?? 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={webhook.active ? 'default' : 'secondary'}>
                              {webhook.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{webhook.successCount || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={(webhook.failureCount ?? 0) > 0 ? 'destructive' : 'outline'}>
                              {webhook.failureCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testWebhookMutation.mutate(webhook.id)}
                              disabled={testWebhookMutation.isPending}
                              data-testid={`button-test-webhook-${webhook.id}`}
                            >
                              Test
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {webhooks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No webhooks configured
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

        <TabsContent value="event-logs" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Event Logs</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={filterWebhook} onValueChange={setFilterWebhook}>
                <SelectTrigger className="w-48" data-testid="select-filter-webhook">
                  <SelectValue placeholder="All Webhooks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Webhooks</SelectItem>
                  {webhooks.map((webhook) => (
                    <SelectItem key={webhook.id} value={webhook.id}>
                      {webhook.url.substring(0, 30)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEventType} onValueChange={setFilterEventType}>
                <SelectTrigger className="w-48" data-testid="select-filter-event-type">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {WEBHOOK_EVENTS.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="select-filter-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {eventLogsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Webhook</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="secondary">{log.eventType}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-xs truncate">
                            {log.webhookUrl}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              log.status === 'success' ? 'default' : 
                              log.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{log.response || '-'}</TableCell>
                          <TableCell>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</TableCell>
                          <TableCell>
                            {log.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryEventMutation.mutate(log.id)}
                                disabled={retryEventMutation.isPending}
                                data-testid={`button-retry-${log.id}`}
                              >
                                <RotateCw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {eventLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No event logs found
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
      </Tabs>
    </div>
  );
}
