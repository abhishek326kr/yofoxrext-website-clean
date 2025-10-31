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
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Ban, UserCheck, Coins, Download, ChevronLeft, ChevronRight, Shield, Calendar as CalendarIcon, FileText, TrendingUp, Users as UsersIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  coinBalance: number;
  createdAt: string;
  lastActive?: string;
  reputation: number;
  level?: number;
  suspendedUntil?: string;
  bannedAt?: string;
}

interface UserStats {
  total: number;
  avgReputation: number;
  avgCoins: number;
  bannedCount: number;
}

interface UserActivity {
  totalThreads: number;
  totalReplies: number;
  totalContent: number;
  coinsEarned: number;
  coinsSpent: number;
  accountAge: number;
}

interface UserPost {
  id: string;
  title: string;
  slug: string;
  type: 'thread' | 'reply';
  createdAt: string;
  views?: number;
  likes?: number;
}

interface CoinTransaction {
  id: string;
  type: 'earn' | 'spend' | 'recharge' | 'adjustment';
  amount: number;
  description: string;
  balance: number;
  createdAt: string;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<Date>();
  const [suspendReason, setSuspendReason] = useState("");
  const [newRole, setNewRole] = useState("");
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const { toast } = useToast();

  const { data: usersResponse, isLoading } = useQuery<{ users: AdminUser[]; totalPages: number; total: number }>({
    queryKey: ["/api/admin/users", { search, role: roleFilter, status: statusFilter, sortBy, sortOrder, page, limit }]
  });

  const users: AdminUser[] = usersResponse?.users || [];
  const totalPages = usersResponse?.totalPages || 1;
  const totalUsers = usersResponse?.total || 0;

  const { data: statsRaw } = useQuery<UserStats>({
    queryKey: ["/api/admin/users/stats", { search, role: roleFilter, status: statusFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const queryString = params.toString();
      return fetch(`/api/admin/users/stats${queryString ? '?' + queryString : ''}`).then(r => r.json());
    },
  });

  const stats: UserStats = statsRaw || {
    total: 0,
    avgReputation: 0,
    avgCoins: 0,
    bannedCount: 0
  };

  const { data: userActivityRaw } = useQuery<UserActivity>({
    queryKey: ["/api/admin/users", selectedUser?.id, "activity"],
    queryFn: () => fetch(`/api/admin/users/${selectedUser?.id}/activity`).then(r => r.json()),
    enabled: !!selectedUser,
  });

  const userActivity: UserActivity = userActivityRaw || {
    totalThreads: 0,
    totalReplies: 0,
    totalContent: 0,
    coinsEarned: 0,
    coinsSpent: 0,
    accountAge: 0
  };

  const { data: userPostsRaw } = useQuery<UserPost[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "posts"],
    queryFn: () => fetch(`/api/admin/users/${selectedUser?.id}/posts`).then(r => r.json()),
    enabled: !!selectedUser,
  });

  const userPosts: UserPost[] = Array.isArray(userPostsRaw) ? userPostsRaw : [];

  const { data: coinHistoryRaw } = useQuery<CoinTransaction[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "coin-history"],
    queryFn: () => fetch(`/api/admin/users/${selectedUser?.id}/coin-history`).then(r => r.json()),
    enabled: !!selectedUser,
  });

  const coinHistory: CoinTransaction[] = Array.isArray(coinHistoryRaw) ? coinHistoryRaw : [];

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/ban`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User banned successfully" });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to ban user", variant: "destructive" });
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, suspendedUntil, reason }: { userId: number; suspendedUntil: string; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/suspend`, { suspendedUntil, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User suspended successfully" });
      setSuspendDialogOpen(false);
      setSuspendedUntil(undefined);
      setSuspendReason("");
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to suspend user", variant: "destructive" });
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("POST", `/api/admin/users/${userId}/activate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User activated successfully" });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to activate user", variant: "destructive" });
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role, reason }: { userId: number; role: string; reason?: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/role`, { role, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role changed successfully" });
      setChangeRoleDialogOpen(false);
      setNewRole("");
      setRoleChangeReason("");
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to change user role", variant: "destructive" });
    }
  });

  const adjustCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: number; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/adjust-coins`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Coins adjusted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to adjust coins", variant: "destructive" });
    }
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      const response = await fetch(`/api/admin/users/export/csv?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Users exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export users", variant: "destructive" });
    }
  };

  const handleSuspend = () => {
    if (!selectedUser || !suspendedUntil) return;
    suspendUserMutation.mutate({
      userId: selectedUser.id,
      suspendedUntil: suspendedUntil.toISOString(),
      reason: suspendReason
    });
  };

  const handleChangeRole = () => {
    if (!selectedUser || !newRole) return;
    changeRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole,
      reason: roleChangeReason
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button 
          onClick={handleExport} 
          variant="outline"
          data-testid="button-export-users"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="section-user-stats">
        <Card data-testid="card-total-users-stat">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users-stat">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-reputation">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reputation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-reputation">
              {(stats.avgReputation || 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-coins">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Coins</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-coins">
              {(stats.avgCoins || 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-banned-count">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned/Suspended</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-banned-count">
              {stats.bannedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-user-search"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="coinBalance">Coins</SelectItem>
                  <SelectItem value="reputation">Reputation</SelectItem>
                  <SelectItem value="createdAt">Created At</SelectItem>
                  <SelectItem value="lastActive">Last Active</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-sort-order">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({totalUsers})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell data-testid={`user-name-${user.id}`}>
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`user-coins-${user.id}`}>
                        {user.coinBalance}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            data-testid={`button-view-user-${user.id}`}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {user.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => banUserMutation.mutate({ userId: user.id, reason: "Manual ban" })}
                              data-testid={`button-ban-user-${user.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Ban
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => activateUserMutation.mutate(user.id)}
                              data-testid={`button-activate-user-${user.id}`}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger className="w-20" data-testid="select-items-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-previous-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm" data-testid="text-page-info">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal with Tabs */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="modal-user-detail">
          <DialogHeader>
            <DialogTitle>User Details: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Comprehensive user information and management
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
                <TabsTrigger value="posts" data-testid="tab-posts">Posts</TabsTrigger>
                <TabsTrigger value="coin-history" data-testid="tab-coin-history">Coin History</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="outline">{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedUser.status === 'active' ? 'default' : 'destructive'}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coin Balance</p>
                    <p className="font-medium">{selectedUser.coinBalance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reputation</p>
                    <p className="font-medium">{selectedUser.reputation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="font-medium">{selectedUser.level || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">{formatDistanceToNow(new Date(selectedUser.createdAt), { addSuffix: true })}</p>
                  </div>
                  {selectedUser.lastActive && (
                    <div>
                      <p className="text-sm text-muted-foreground">Last Active</p>
                      <p className="font-medium">{formatDistanceToNow(new Date(selectedUser.lastActive), { addSuffix: true })}</p>
                    </div>
                  )}
                  {selectedUser.suspendedUntil && (
                    <div>
                      <p className="text-sm text-muted-foreground">Suspended Until</p>
                      <p className="font-medium">{format(new Date(selectedUser.suspendedUntil), 'PPP')}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap pt-4">
                  <Button
                    onClick={() => {
                      setSuspendDialogOpen(true);
                    }}
                    variant="outline"
                    disabled={selectedUser.status !== 'active'}
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Suspend
                  </Button>
                  <Button
                    onClick={() => {
                      setChangeRoleDialogOpen(true);
                    }}
                    variant="outline"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Change Role
                  </Button>
                  <Button
                    onClick={() => {
                      adjustCoinsMutation.mutate({ 
                        userId: selectedUser.id, 
                        amount: 100, 
                        reason: "Admin adjustment" 
                      });
                    }}
                    variant="outline"
                  >
                    <Coins className="h-4 w-4 mr-1" />
                    Add 100 Coins
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Threads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{userActivity.totalThreads}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Replies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{userActivity.totalReplies}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Content Published</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{userActivity.totalContent}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Coins Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{userActivity.coinsEarned}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Coins Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{userActivity.coinsSpent}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Account Age</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{userActivity.accountAge} days</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="posts">
                {userPosts.length > 0 ? (
                  <div className="space-y-2">
                    {userPosts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link href={`/thread/${post.slug}`} className="text-primary hover:underline font-medium">
                                {post.title}
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">
                                {post.type === 'thread' ? 'Thread' : 'Reply'} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {post.views !== undefined && (
                              <div className="text-sm text-muted-foreground">
                                {post.views} views
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No posts yet</p>
                )}
              </TabsContent>

              <TabsContent value="coin-history">
                {coinHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coinHistory.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}</TableCell>
                            <TableCell>
                              <Badge variant={tx.type === 'earn' || tx.type === 'recharge' ? 'default' : 'secondary'}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell>{tx.balance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No coin history</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent data-testid="dialog-suspend-user">
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Temporarily suspend {selectedUser?.username}'s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Suspended Until</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-2"
                    data-testid="input-suspended-until"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {suspendedUntil ? format(suspendedUntil, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={suspendedUntil}
                    onSelect={setSuspendedUntil}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Enter suspension reason..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-2"
                data-testid="input-suspend-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSuspend}
              disabled={!suspendedUntil || suspendUserMutation.isPending}
              data-testid="button-suspend-confirm"
            >
              {suspendUserMutation.isPending ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent data-testid="dialog-change-role">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-full mt-2" data-testid="select-new-role">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Enter reason for role change..."
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                className="mt-2"
                data-testid="input-role-change-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangeRole}
              disabled={!newRole || changeRoleMutation.isPending}
              data-testid="button-change-role-confirm"
            >
              {changeRoleMutation.isPending ? 'Changing...' : 'Change Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
