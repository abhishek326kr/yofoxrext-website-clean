"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  Clock, 
  User, 
  FileText, 
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Ban,
  UserX,
  Shield,
  Trash2
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface QueueItem {
  id: string;
  type: 'thread' | 'reply';
  title?: string;
  body: string;
  authorId: string;
  authorUsername: string;
  categorySlug?: string;
  categoryName?: string;
  threadId?: string;
  threadTitle?: string;
  createdAt: string;
  wordCount: number;
  hasLinks: boolean;
  hasImages: boolean;
  status: string;
}

interface ReportedItem {
  contentId: string;
  contentType: 'thread' | 'reply';
  contentPreview: string;
  authorId: string;
  authorUsername: string;
  reportCount: number;
  reasons: string[];
  firstReportedAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

interface QueueCount {
  pending: number;
  urgentOld: number;
  urgentRecent: number;
}

interface ReportedCount {
  pending: number;
  resolved: number;
  dismissed: number;
}

interface HistoryItem {
  id: string;
  moderatorUsername: string;
  actionType: string;
  contentType: string;
  contentTitle: string;
  reason?: string;
  createdAt: string;
}

interface ModerationStats {
  todayApproved: number;
  todayRejected: number;
  todayReportsHandled: number;
  totalModeratedToday: number;
  avgResponseTimeMinutes: number;
  mostActiveModerator: string;
  pendingUnderOneHour: number;
  pendingOverTwentyFourHours: number;
}

interface ContentDetails {
  id: string;
  type: 'thread' | 'reply';
  title?: string;
  body: string;
  author: {
    id: string;
    username: string;
    reputation: number;
    role: string;
    createdAt: string;
    badges?: string[];
  };
  recentPosts: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
  }>;
  warnings: Array<{
    reason: string;
    createdAt: string;
    moderator: string;
  }>;
  parentThread?: {
    id: string;
    title: string;
  };
  metadata: {
    createdAt: string;
    wordCount: number;
    hasLinks: boolean;
    hasImages: boolean;
    category?: string;
  };
}

interface ReportDetails {
  content: {
    id: string;
    type: string;
    title?: string;
    body: string;
    authorUsername: string;
  };
  reports: Array<{
    reporterUsername: string;
    reason: string;
    description: string;
    createdAt: string;
  }>;
  author: {
    username: string;
    reputation: number;
    role: string;
  };
}

export default function AdminContent() {
  const { toast } = useToast();
  
  const [queueType, setQueueType] = useState("all");
  const [queuePage, setQueuePage] = useState(1);
  const [queuePerPage, setQueuePerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [reportedStatus, setReportedStatus] = useState("pending");
  const [reportedPage, setReportedPage] = useState(1);
  const [reportedPerPage, setReportedPerPage] = useState(20);
  
  const [historyLimit, setHistoryLimit] = useState(100);
  const [historyModeratorFilter, setHistoryModeratorFilter] = useState("all");
  
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentDetails | null>(null);
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectContentId, setRejectContentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDeletePermanently, setRejectDeletePermanently] = useState(false);
  
  const [reportDetailsModalOpen, setReportDetailsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDetails | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  const [dismissReportDialogOpen, setDismissReportDialogOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState("");
  
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendAuthorId, setSuspendAuthorId] = useState<string | null>(null);
  
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banConfirmed, setBanConfirmed] = useState(false);
  const [banAuthorId, setBanAuthorId] = useState<string | null>(null);
  
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const { data: queueData, isLoading: queueLoading } = useQuery<{ items: QueueItem[]; total: number; pages: number }>({
    queryKey: ['/api/moderation/queue', { type: queueType, page: queuePage, perPage: queuePerPage }],
    refetchInterval: 30000,
  });

  const { data: queueCount } = useQuery<QueueCount>({
    queryKey: ['/api/moderation/queue/count'],
    refetchInterval: 30000,
  });

  const { data: reportedData, isLoading: reportedLoading } = useQuery<{ items: ReportedItem[]; total: number; pages: number }>({
    queryKey: ['/api/moderation/reported', { status: reportedStatus, page: reportedPage, perPage: reportedPerPage }],
    refetchInterval: 30000,
  });

  const { data: reportedCount } = useQuery<ReportedCount>({
    queryKey: ['/api/moderation/reported/count'],
    refetchInterval: 30000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery<HistoryItem[]>({
    queryKey: ['/api/moderation/history', { limit: historyLimit, moderatorId: historyModeratorFilter !== 'all' ? historyModeratorFilter : undefined }],
    refetchInterval: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ModerationStats>({
    queryKey: ['/api/moderation/stats'],
    refetchInterval: 60000,
  });

  const approveMutation = useMutation({
    mutationFn: async (contentId: string) => {
      return apiRequest("POST", `/api/moderation/${contentId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/stats'] });
      toast({ title: "Content approved successfully" });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ title: "Failed to approve content", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ contentId, reason, deletePermanently }: { contentId: string; reason: string; deletePermanently?: boolean }) => {
      return apiRequest("POST", `/api/moderation/${contentId}/reject`, { reason, deletePermanently });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/stats'] });
      toast({ title: "Content rejected successfully" });
      setRejectDialogOpen(false);
      setRejectReason("");
      setRejectDeletePermanently(false);
      setRejectContentId(null);
      setDetailsModalOpen(false);
      setSelectedIds([]);
    },
    onError: () => {
      toast({ title: "Failed to reject content", variant: "destructive" });
    }
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (contentIds: string[]) => {
      return apiRequest("POST", "/api/moderation/bulk-approve", { contentIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/stats'] });
      toast({ title: `Successfully approved ${selectedIds.length} items` });
      setSelectedIds([]);
      setBulkApproveDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to approve selected items", variant: "destructive" });
    }
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async ({ contentIds, reason }: { contentIds: string[]; reason: string }) => {
      return apiRequest("POST", "/api/moderation/bulk-reject", { contentIds, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/stats'] });
      toast({ title: `Successfully rejected ${selectedIds.length} items` });
      setSelectedIds([]);
      setBulkRejectDialogOpen(false);
      setBulkRejectReason("");
    },
    onError: () => {
      toast({ title: "Failed to reject selected items", variant: "destructive" });
    }
  });

  const dismissReportMutation = useMutation({
    mutationFn: async ({ reportId, reason }: { reportId: string; reason?: string }) => {
      return apiRequest("POST", `/api/moderation/report/${reportId}/dismiss`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reported'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reported/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/stats'] });
      toast({ title: "Report dismissed successfully" });
      setDismissReportDialogOpen(false);
      setDismissReason("");
      setReportDetailsModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to dismiss report", variant: "destructive" });
    }
  });

  const reportActionMutation = useMutation({
    mutationFn: async ({ reportId, action, reason, suspendDays }: { reportId: string; action: 'delete' | 'warn' | 'suspend' | 'ban'; reason?: string; suspendDays?: number }) => {
      return apiRequest("POST", `/api/moderation/report/${reportId}/action`, { action, reason, suspendDays });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reported'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reported/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/stats'] });
      
      const actionText = variables.action === 'delete' ? 'deleted' : 
                        variables.action === 'warn' ? 'warned' : 
                        variables.action === 'suspend' ? 'suspended' : 'banned';
      toast({ title: `Author ${actionText} successfully` });
      
      setReportDetailsModalOpen(false);
      setSuspendDialogOpen(false);
      setBanDialogOpen(false);
      setSuspendReason("");
      setBanReason("");
      setBanConfirmed(false);
    },
    onError: () => {
      toast({ title: "Failed to take action", variant: "destructive" });
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageIds = (queueData?.items || []).map(item => item.id);
      setSelectedIds(currentPageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    }
  };

  const handleViewDetails = async (contentId: string) => {
    try {
      const response = await fetch(`/api/moderation/${contentId}/details`);
      const data = await response.json();
      setSelectedContent(data);
      setDetailsModalOpen(true);
    } catch (error) {
      toast({ title: "Failed to load content details", variant: "destructive" });
    }
  };

  const handleViewReportDetails = async (contentId: string) => {
    try {
      const response = await fetch(`/api/moderation/report/${contentId}`);
      const data = await response.json();
      setSelectedReport(data);
      setSelectedReportId(contentId);
      setReportDetailsModalOpen(true);
    } catch (error) {
      toast({ title: "Failed to load report details", variant: "destructive" });
    }
  };

  const handleReject = (contentId: string) => {
    setRejectContentId(contentId);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectContentId || !rejectReason || rejectReason.length < 10 || rejectReason.length > 500) {
      toast({ title: "Reason must be between 10 and 500 characters", variant: "destructive" });
      return;
    }
    rejectMutation.mutate({ 
      contentId: rejectContentId, 
      reason: rejectReason,
      deletePermanently: rejectDeletePermanently
    });
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0 || selectedIds.length > 100) return;
    setBulkApproveDialogOpen(true);
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0 || selectedIds.length > 100) return;
    setBulkRejectDialogOpen(true);
  };

  const handleConfirmBulkApprove = () => {
    bulkApproveMutation.mutate(selectedIds);
  };

  const handleConfirmBulkReject = () => {
    if (!bulkRejectReason || bulkRejectReason.length < 10 || bulkRejectReason.length > 500) {
      toast({ title: "Reason must be between 10 and 500 characters", variant: "destructive" });
      return;
    }
    bulkRejectMutation.mutate({ contentIds: selectedIds, reason: bulkRejectReason });
  };

  const handleSuspendAuthor = (authorId: string) => {
    setSuspendAuthorId(authorId);
    setSuspendDialogOpen(true);
  };

  const handleConfirmSuspend = () => {
    if (!selectedReportId || !suspendReason || suspendReason.length < 10 || suspendReason.length > 500) {
      toast({ title: "Reason must be between 10 and 500 characters", variant: "destructive" });
      return;
    }
    if (suspendDays < 1 || suspendDays > 365) {
      toast({ title: "Suspend days must be between 1 and 365", variant: "destructive" });
      return;
    }
    reportActionMutation.mutate({ 
      reportId: selectedReportId, 
      action: 'suspend', 
      reason: suspendReason,
      suspendDays
    });
  };

  const handleBanAuthor = (authorId: string) => {
    setBanAuthorId(authorId);
    setBanDialogOpen(true);
  };

  const handleConfirmBan = () => {
    if (!selectedReportId || !banReason || banReason.length < 10 || banReason.length > 500) {
      toast({ title: "Reason must be between 10 and 500 characters", variant: "destructive" });
      return;
    }
    if (!banConfirmed) {
      toast({ title: "Please confirm that you understand this action is permanent", variant: "destructive" });
      return;
    }
    reportActionMutation.mutate({ 
      reportId: selectedReportId, 
      action: 'ban', 
      reason: banReason
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const queueItems = queueData?.items || [];
  const reportedItems = reportedData?.items || [];
  const historyItems = historyData || [];

  const allSelected = queueItems.length > 0 && selectedIds.length === queueItems.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < queueItems.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" data-testid="tab-moderation-queue">
            Moderation Queue
            {queueCount && queueCount.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{queueCount.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reported" data-testid="tab-reported-content">
            Reported Content
            {reportedCount && reportedCount.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{reportedCount.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-moderation-history">
            Moderation History
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-moderation-stats">
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle>Content Type</CardTitle>
                <Tabs value={queueType} onValueChange={setQueueType} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all" data-testid="filter-content-type-all">All</TabsTrigger>
                    <TabsTrigger value="thread" data-testid="filter-content-type-thread">Threads</TabsTrigger>
                    <TabsTrigger value="reply" data-testid="filter-content-type-reply">Replies</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
          </Card>

          {selectedIds.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={handleBulkApprove}
                    disabled={selectedIds.length === 0 || selectedIds.length > 100 || bulkApproveMutation.isPending}
                    data-testid="button-bulk-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Selected ({selectedIds.length})
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleBulkReject}
                    disabled={selectedIds.length === 0 || selectedIds.length > 100 || bulkRejectMutation.isPending}
                    data-testid="button-bulk-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Selected ({selectedIds.length})
                  </Button>
                  {selectedIds.length > 100 && (
                    <Alert className="flex-1">
                      <AlertDescription>
                        Maximum 100 items can be selected for bulk actions
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Pending Content ({queueData?.total || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : queueItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending items in queue
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table data-testid="table-moderation-queue">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
                        <TableHead>Content Preview</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Word Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                              data-testid={`checkbox-select-${item.id}`}
                            />
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="space-y-1">
                              {item.title && (
                                <div className="font-medium">{truncateText(item.title, 50)}</div>
                              )}
                              <div className="text-sm text-muted-foreground">
                                {truncateText(item.body, 100)}
                              </div>
                              <div className="flex gap-1">
                                <Badge variant="outline">{item.type}</Badge>
                                {item.hasLinks && <Badge variant="secondary">Links</Badge>}
                                {item.hasImages && <Badge variant="secondary">Images</Badge>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>@{item.authorUsername}</TableCell>
                          <TableCell>
                            {item.type === 'thread' ? item.categoryName : item.threadTitle}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>{item.wordCount}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(item.id)}
                                data-testid={`button-view-details-${item.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveMutation.mutate(item.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${item.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(item.id)}
                                data-testid={`button-reject-${item.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {queueData && queueData.pages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <Select value={queuePerPage.toString()} onValueChange={(v) => setQueuePerPage(Number(v))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQueuePage(p => Math.max(1, p - 1))}
                      disabled={queuePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {queuePage} of {queueData.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQueuePage(p => Math.min(queueData.pages, p + 1))}
                      disabled={queuePage === queueData.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reported" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle>Filter by Status</CardTitle>
                <Select value={reportedStatus} onValueChange={setReportedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reported Content ({reportedData?.total || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {reportedLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : reportedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reported content found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table data-testid="table-reported-content">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content Preview</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Reasons</TableHead>
                        <TableHead>First Reported</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportedItems.map((item) => (
                        <TableRow key={item.contentId}>
                          <TableCell className="max-w-md">
                            <div className="space-y-1">
                              <div className="text-sm">
                                {truncateText(item.contentPreview, 100)}
                              </div>
                              <Badge variant="outline">{item.contentType}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>@{item.authorUsername}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{item.reportCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.reasons.slice(0, 3).map((reason, idx) => (
                                <Badge key={idx} variant="secondary">{reason}</Badge>
                              ))}
                              {item.reasons.length > 3 && (
                                <Badge variant="secondary">+{item.reasons.length - 3}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(item.firstReportedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              item.status === 'pending' ? 'destructive' :
                              item.status === 'resolved' ? 'default' : 'secondary'
                            }>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewReportDetails(item.contentId)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              {item.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewReportDetails(item.contentId)}
                                  data-testid={`button-take-action-${item.contentId}`}
                                >
                                  <Shield className="h-4 w-4 mr-1" />
                                  Take Action
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {reportedData && reportedData.pages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <Select value={reportedPerPage.toString()} onValueChange={(v) => setReportedPerPage(Number(v))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportedPage(p => Math.max(1, p - 1))}
                      disabled={reportedPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {reportedPage} of {reportedData.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportedPage(p => Math.min(reportedData.pages, p + 1))}
                      disabled={reportedPage === reportedData.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle>Filters</CardTitle>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Moderator:</span>
                    <Select value={historyModeratorFilter} onValueChange={setHistoryModeratorFilter}>
                      <SelectTrigger className="w-48" data-testid="select-moderator-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Moderators</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Limit:</span>
                    <Select value={historyLimit.toString()} onValueChange={(v) => setHistoryLimit(Number(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/moderation/history'] })}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation History</CardTitle>
              <CardDescription>Read-only log of recent moderation actions</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No moderation history available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table data-testid="table-history">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Moderator</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>@{item.moderatorUsername}</TableCell>
                          <TableCell>
                            <Badge variant={
                              item.actionType === 'approve' ? 'default' :
                              item.actionType === 'reject' ? 'destructive' : 'secondary'
                            }>
                              {item.actionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{truncateText(item.contentTitle, 50)}</div>
                              <Badge variant="outline">{item.contentType}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            {item.reason ? truncateText(item.reason, 100) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="card-today-approved">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today Approved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayApproved}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-today-rejected">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayRejected}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-today-reports-handled">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today Reports Handled</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayReportsHandled}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-moderated-today">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Moderated Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalModeratedToday}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-response-time">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgResponseTimeMinutes}m</div>
                  <p className="text-xs text-muted-foreground">Average time to first action</p>
                </CardContent>
              </Card>

              <Card data-testid="card-most-active-moderator">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Active Moderator</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">@{stats.mostActiveModerator || 'N/A'}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-pending-under-1hr">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending &lt; 1hr</CardTitle>
                  <FileText className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingUnderOneHour}</div>
                  <p className="text-xs text-muted-foreground">Fresh submissions</p>
                </CardContent>
              </Card>

              <Card data-testid="card-pending-over-24hrs">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending &gt; 24hrs</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingOverTwentyFourHours}</div>
                  <p className="text-xs text-muted-foreground">Urgent - needs attention</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-content-details">
          <DialogHeader>
            <DialogTitle>
              Review Content - {selectedContent?.type === 'thread' ? 'Thread' : 'Reply'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-150px)]">
            {selectedContent && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Content</h3>
                  {selectedContent.title && (
                    <h4 className="text-lg font-bold mb-2">{selectedContent.title}</h4>
                  )}
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedContent.body}
                  </div>
                </div>

                {selectedContent.parentThread && (
                  <div>
                    <h3 className="font-semibold mb-2">Parent Thread</h3>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{selectedContent.parentThread.title}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Author Information</h3>
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <Avatar>
                      <AvatarFallback>{selectedContent.author.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="font-medium">@{selectedContent.author.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedContent.author.role}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reputation:</span>{' '}
                          <span className="font-medium">{selectedContent.author.reputation}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Member since:</span>{' '}
                          <span className="font-medium">
                            {format(new Date(selectedContent.author.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      {selectedContent.author.badges && selectedContent.author.badges.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {selectedContent.author.badges.map((badge, idx) => (
                            <Badge key={idx} variant="secondary">{badge}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedContent.recentPosts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Author&apos;s Recent Posts</h3>
                    <div className="space-y-2">
                      {selectedContent.recentPosts.map((post) => (
                        <div key={post.id} className="p-3 bg-muted rounded-lg text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium">{post.title}</div>
                              <div className="text-muted-foreground">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                            <Badge variant="outline">{post.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContent.warnings.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-orange-600">Warning History</h3>
                    <div className="space-y-2">
                      {selectedContent.warnings.map((warning, idx) => (
                        <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-sm border border-orange-200 dark:border-orange-800">
                          <div className="font-medium">{warning.reason}</div>
                          <div className="text-muted-foreground">
                            By @{warning.moderator} • {formatDistanceToNow(new Date(warning.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {format(new Date(selectedContent.metadata.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Word Count:</span>{' '}
                      {selectedContent.metadata.wordCount}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Has Links:</span>{' '}
                      {selectedContent.metadata.hasLinks ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Has Images:</span>{' '}
                      {selectedContent.metadata.hasImages ? 'Yes' : 'No'}
                    </div>
                    {selectedContent.metadata.category && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Category:</span>{' '}
                        {selectedContent.metadata.category}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedContent) {
                  approveMutation.mutate(selectedContent.id);
                }
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedContent) {
                  handleReject(selectedContent.id);
                }
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject-content">
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (10-500 characters)</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="min-h-24"
                data-testid="textarea-reason"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {rejectReason.length}/500 characters
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={rejectDeletePermanently}
                onCheckedChange={(checked) => setRejectDeletePermanently(checked as boolean)}
                id="delete-permanently"
              />
              <label htmlFor="delete-permanently" className="text-sm cursor-pointer">
                Delete permanently
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending || rejectReason.length < 10 || rejectReason.length > 500}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDetailsModalOpen} onOpenChange={setReportDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-report-details">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-150px)]">
            {selectedReport && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Content</h3>
                  {selectedReport.content.title && (
                    <h4 className="text-lg font-bold mb-2">{selectedReport.content.title}</h4>
                  )}
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedReport.content.body}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Reports ({selectedReport.reports.length})</h3>
                  <div className="space-y-3">
                    {selectedReport.reports.map((report, idx) => (
                      <div key={idx} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="font-medium">@{report.reporterUsername}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          <Badge variant="destructive">{report.reason}</Badge>
                        </div>
                        {report.description && (
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Author Information</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Username:</span>{' '}
                        <span className="font-medium">@{selectedReport.author.username}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reputation:</span>{' '}
                        <span className="font-medium">{selectedReport.author.reputation}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Role:</span>{' '}
                        <span className="font-medium">{selectedReport.author.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setReportDetailsModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDismissReportDialogOpen(true);
              }}
            >
              Dismiss Report
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedReportId) {
                  reportActionMutation.mutate({ reportId: selectedReportId, action: 'delete', reason: 'Content deleted by moderator' });
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Content
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedReportId) {
                  reportActionMutation.mutate({ reportId: selectedReportId, action: 'warn', reason: 'Warning issued for reported content' });
                }
              }}
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Warn Author
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedReport) {
                  handleSuspendAuthor(selectedReport.author.username);
                }
              }}
              className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
            >
              <UserX className="h-4 w-4 mr-2" />
              Suspend Author
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedReport) {
                  handleBanAuthor(selectedReport.author.username);
                }
              }}
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban Author
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dismissReportDialogOpen} onOpenChange={setDismissReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Report</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for dismissing this report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (optional, max 500 characters)</label>
              <Textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Enter reason for dismissal..."
                className="min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDismissReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedReportId) {
                  dismissReportMutation.mutate({ reportId: selectedReportId, reason: dismissReason || undefined });
                }
              }}
              disabled={dismissReportMutation.isPending}
            >
              Dismiss Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent data-testid="dialog-suspend-author">
          <DialogHeader>
            <DialogTitle>Suspend Author</DialogTitle>
            <DialogDescription>
              Temporarily suspend this user&apos;s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Suspend Days (1-365)</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={suspendDays}
                onChange={(e) => setSuspendDays(Number(e.target.value))}
                data-testid="input-suspend-days"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (10-500 characters)</label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="min-h-24"
                data-testid="textarea-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSuspend}
              disabled={reportActionMutation.isPending || suspendReason.length < 10 || suspendReason.length > 500 || suspendDays < 1 || suspendDays > 365}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent data-testid="dialog-ban-author">
          <DialogHeader>
            <DialogTitle>Ban Author</DialogTitle>
            <DialogDescription>
              Permanently ban this user from the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action is permanent and cannot be undone.
              </AlertDescription>
            </Alert>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (10-500 characters)</label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for ban..."
                className="min-h-24"
                data-testid="textarea-reason"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={banConfirmed}
                onCheckedChange={(checked) => setBanConfirmed(checked as boolean)}
                id="ban-confirm"
              />
              <label htmlFor="ban-confirm" className="text-sm cursor-pointer">
                I understand this is permanent
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBan}
              disabled={reportActionMutation.isPending || !banConfirmed || banReason.length < 10 || banReason.length > 500}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkApproveDialogOpen} onOpenChange={setBulkApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Selected Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedIds.length} items?
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBulkApprove}
              disabled={bulkApproveMutation.isPending}
            >
              Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Selected Items</DialogTitle>
            <DialogDescription>
              Reject {selectedIds.length} selected items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (10-500 characters)</label>
              <Textarea
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                placeholder="This reason will apply to all selected items..."
                className="min-h-24"
                data-testid="textarea-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkReject}
              disabled={bulkRejectMutation.isPending || bulkRejectReason.length < 10 || bulkRejectReason.length > 500}
            >
              Reject All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
