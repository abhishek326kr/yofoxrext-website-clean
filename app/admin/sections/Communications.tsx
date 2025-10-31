"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Eye, MousePointer } from "lucide-react";

// Type definitions for API responses
interface Announcement {
  id: number;
  title: string;
  type: string;
  audience: string;
  active: boolean;
  views?: number;
  clicks?: number;
  createdAt: string;
}

interface Campaign {
  id: number;
  name: string;
  subject: string;
  sent?: number;
  opened?: number;
  clicked?: number;
  status: string;
  createdAt: string;
}

interface CampaignStats {
  sent: number;
  opened: number;
  openRate: number;
  clicked: number;
  clickRate: number;
  bounced: number;
  bounceRate: number;
}

export default function Communications() {
  const [activeTab, setActiveTab] = useState("announcements");
  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false);
  const { toast } = useToast();

  // Add explicit type annotations to ensure TypeScript knows the structure
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/communications/announcements"]
  });

  // Defensive programming: ensure arrays are always defined
  const announcements: Announcement[] = Array.isArray(announcementsData) ? announcementsData : [];

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/communications/campaigns"]
  });

  const campaigns: Campaign[] = Array.isArray(campaignsData) ? campaignsData : [];

  const { data: campaignStatsData, isLoading: statsLoading } = useQuery<CampaignStats>({
    queryKey: ["/api/admin/communications/campaign-stats"]
  });

  const campaignStats: CampaignStats = campaignStatsData || {
    sent: 0,
    opened: 0,
    openRate: 0,
    clicked: 0,
    clickRate: 0,
    bounced: 0,
    bounceRate: 0
  };

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/communications/announcements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/announcements"] });
      toast({ title: "Announcement created successfully" });
      setCreateAnnouncementOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    }
  });

  const toggleAnnouncementMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return apiRequest("PUT", `/api/admin/communications/announcements/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/announcements"] });
      toast({ title: "Announcement updated" });
    },
    onError: () => {
      toast({ title: "Failed to update announcement", variant: "destructive" });
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/communications/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/announcements"] });
      toast({ title: "Announcement deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete announcement", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Communications</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-communications">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="announcements" data-testid="tab-announcements">Announcements</TabsTrigger>
          <TabsTrigger value="email-campaigns" data-testid="tab-email-campaigns">Email Campaigns</TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Announcements</h2>
            <Dialog open={createAnnouncementOpen} onOpenChange={setCreateAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-announcement">Create Announcement</Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-create-announcement">
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>
                    Create a new announcement for your users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="announcement-title">Title</Label>
                    <Input
                      id="announcement-title"
                      placeholder="Announcement title"
                      data-testid="input-announcement-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-content">Content</Label>
                    <Textarea
                      id="announcement-content"
                      placeholder="Announcement content"
                      rows={4}
                      data-testid="textarea-announcement-content"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-type">Type</Label>
                    <Select defaultValue="info">
                      <SelectTrigger id="announcement-type" data-testid="select-announcement-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-audience">Target Audience</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="announcement-audience" data-testid="select-announcement-audience">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="premium">Premium Users</SelectItem>
                        <SelectItem value="free">Free Users</SelectItem>
                        <SelectItem value="sellers">Sellers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-display">Display Type</Label>
                    <Select defaultValue="banner">
                      <SelectTrigger id="announcement-display" data-testid="select-announcement-display">
                        <SelectValue placeholder="Select display type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="modal">Modal</SelectItem>
                        <SelectItem value="toast">Toast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="announcement-start">Start Date</Label>
                      <Input
                        id="announcement-start"
                        type="date"
                        data-testid="input-announcement-start"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="announcement-end">End Date</Label>
                      <Input
                        id="announcement-end"
                        type="date"
                        data-testid="input-announcement-end"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      const title = (document.getElementById('announcement-title') as HTMLInputElement)?.value;
                      const content = (document.getElementById('announcement-content') as HTMLTextAreaElement)?.value;
                      createAnnouncementMutation.mutate({ title, content, type: 'info', audience: 'all' });
                    }}
                    disabled={createAnnouncementMutation.isPending}
                    data-testid="button-submit-announcement"
                  >
                    Create Announcement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {announcementsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-announcements">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.length > 0 ? (
                        announcements.map((announcement: Announcement) => (
                          <TableRow key={announcement.id} data-testid={`announcement-${announcement.id}`}>
                            <TableCell>{announcement.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{announcement.type}</Badge>
                            </TableCell>
                            <TableCell>{announcement.audience}</TableCell>
                            <TableCell>
                              <Switch
                                checked={announcement.active}
                                onCheckedChange={(checked) =>
                                  toggleAnnouncementMutation.mutate({ id: announcement.id, active: checked })
                                }
                                data-testid={`switch-announcement-${announcement.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {announcement.views || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MousePointer className="h-4 w-4" />
                                {announcement.clicks || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-edit-announcement-${announcement.id}`}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                  disabled={deleteAnnouncementMutation.isPending}
                                  data-testid={`button-delete-announcement-${announcement.id}`}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No announcements found
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

        {/* Email Campaigns Tab */}
        <TabsContent value="email-campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Email Campaigns</h2>
            <Button data-testid="button-create-campaign">Create Campaign</Button>
          </div>

          {/* Campaign Stats */}
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card data-testid="card-sent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-sent">
                    {campaignStats.sent}
                  </div>
                  <p className="text-xs text-muted-foreground">Emails sent</p>
                </CardContent>
              </Card>

              <Card data-testid="card-opened">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Opened</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-opened">
                    {campaignStats.opened}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {campaignStats.openRate}% open rate
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-clicked">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Clicked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-clicked">
                    {campaignStats.clicked}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {campaignStats.clickRate}% click rate
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-bounced">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Bounced</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-bounced">
                    {campaignStats.bounced}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {campaignStats.bounceRate}% bounce rate
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaigns List */}
          {campaignsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-campaigns">
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>Clicked</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.length > 0 ? (
                        campaigns.map((campaign: Campaign) => (
                          <TableRow key={campaign.id} data-testid={`campaign-${campaign.id}`}>
                            <TableCell>{campaign.name}</TableCell>
                            <TableCell>{campaign.subject}</TableCell>
                            <TableCell>{campaign.sent || 0}</TableCell>
                            <TableCell>{campaign.opened || 0}</TableCell>
                            <TableCell>{campaign.clicked || 0}</TableCell>
                            <TableCell>
                              <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                                {campaign.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-campaign-${campaign.id}`}
                              >
                                View Report
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No campaigns found
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
