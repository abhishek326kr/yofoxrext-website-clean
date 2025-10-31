"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  ArrowDownCircle, 
  ArrowRightLeft, 
  Trophy,
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Copy,
  AlertTriangle,
  FileText
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  coinPurchases: 'hsl(var(--primary))',
  subscriptions: 'hsl(142, 76%, 36%)',
  marketplace: 'hsl(262, 83%, 58%)',
  other: 'hsl(var(--muted))'
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FinanceOverview {
  totalRevenue: number;
  revenueGrowth: number;
  pendingWithdrawals: number;
  pendingWithdrawalCount: number;
  totalTransactions: number;
  transactionsToday: number;
  topEarner?: {
    username: string;
    earnings: number;
    avatarUrl?: string;
  };
}

interface Transaction {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  type: string;
  amount: number;
  method?: string;
  status?: string;
  description?: string;
  createdAt: string;
  relatedItems?: any;
}

interface Withdrawal {
  id: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  amount: number;
  method?: string;
  walletAddress?: string;
  createdAt: string;
  status?: string;
  userBalance?: number;
}

interface RevenueChartPoint {
  date: string;
  revenue: number;
}

interface RevenueSourcePoint {
  name: string;
  value: number;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const approveWithdrawalSchema = z.object({
  adminNotes: z.string().optional(),
  verified: z.boolean().refine((val) => val === true, {
    message: "You must verify all conditions before approving"
  })
});

const rejectWithdrawalSchema = z.object({
  reason: z.enum([
    "insufficient_balance",
    "invalid_wallet",
    "suspicious_activity",
    "verification_required",
    "other"
  ]),
  detailedReason: z.string().min(10, "Please provide a detailed reason (minimum 10 characters)"),
  notifyUser: z.boolean().default(true)
});

const completeWithdrawalSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  notes: z.string().optional(),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm payment has been sent"
  })
});

const exportTransactionsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  types: z.array(z.string()).min(1, "Select at least one transaction type"),
  format: z.enum(["csv"]).default("csv"),
  includeNotes: z.boolean().default(false)
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case 'completed': return 'default';
    case 'pending': return 'secondary';
    case 'failed': return 'destructive';
    case 'refunded': return 'outline';
    default: return 'outline';
  }
}

function getTypeColor(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type?.toLowerCase()) {
    case 'coin purchase': return 'default';
    case 'subscription': return 'secondary';
    case 'marketplace': return 'outline';
    case 'withdrawal': return 'destructive';
    default: return 'outline';
  }
}

function copyToClipboard(text: string, toast: any) {
  navigator.clipboard.writeText(text);
  toast({ title: "Copied to clipboard" });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminFinance() {
  const [periodFilter, setPeriodFilter] = useState("30d");
  const { toast } = useToast();

  // Modal states
  const [approveWithdrawalId, setApproveWithdrawalId] = useState<number | null>(null);
  const [rejectWithdrawalId, setRejectWithdrawalId] = useState<number | null>(null);
  const [completeWithdrawalId, setCompleteWithdrawalId] = useState<number | null>(null);
  const [viewWithdrawalId, setViewWithdrawalId] = useState<number | null>(null);
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  const { data: overviewRaw, isLoading: overviewLoading } = useQuery<FinanceOverview>({
    queryKey: ["/api/admin/finance/overview", periodFilter]
  });

  const overview: FinanceOverview = overviewRaw ?? {
    totalRevenue: 0,
    revenueGrowth: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalCount: 0,
    totalTransactions: 0,
    transactionsToday: 0
  };

  const { data: transactionsRaw, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/finance/transactions/recent", { limit: 20, period: periodFilter }]
  });

  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];

  const { data: withdrawalsRaw, isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/finance/withdrawals/pending"]
  });

  const withdrawals = Array.isArray(withdrawalsRaw) ? withdrawalsRaw : [];

  const { data: revenueChartRaw, isLoading: chartLoading } = useQuery<RevenueChartPoint[]>({
    queryKey: ["/api/admin/finance/revenue/trend", { period: periodFilter }]
  });

  const revenueChart = Array.isArray(revenueChartRaw) ? revenueChartRaw : [];

  const { data: revenueBySourceRaw, isLoading: sourceLoading } = useQuery<RevenueSourcePoint[]>({
    queryKey: ["/api/admin/finance/revenue/by-source", { period: periodFilter }]
  });

  const revenueBySource = Array.isArray(revenueBySourceRaw) ? revenueBySourceRaw : [];

  // Single withdrawal detail query
  const { data: selectedWithdrawal } = useQuery<Withdrawal>({
    queryKey: ["/api/admin/finance/withdrawals", viewWithdrawalId || approveWithdrawalId || rejectWithdrawalId || completeWithdrawalId],
    enabled: !!(viewWithdrawalId || approveWithdrawalId || rejectWithdrawalId || completeWithdrawalId),
    queryFn: async () => {
      const id = viewWithdrawalId || approveWithdrawalId || rejectWithdrawalId || completeWithdrawalId;
      const withdrawal = withdrawals.find(w => w.id === id);
      if (withdrawal) return withdrawal;
      // Fallback to API if not in list
      const response = await fetch(`/api/admin/finance/withdrawals/${id}`);
      if (!response.ok) throw new Error("Failed to fetch withdrawal");
      return response.json();
    }
  });

  // Single transaction detail query
  const { data: selectedTransaction } = useQuery<Transaction>({
    queryKey: ["/api/admin/finance/transactions", viewTransactionId],
    enabled: !!viewTransactionId,
    queryFn: async () => {
      const transaction = transactions.find(t => t.id === viewTransactionId);
      if (transaction) return transaction;
      // Fallback to API if not in list
      const response = await fetch(`/api/admin/finance/transactions/${viewTransactionId}`);
      if (!response.ok) throw new Error("Failed to fetch transaction");
      return response.json();
    }
  });

  // ============================================================================
  // FORMS
  // ============================================================================

  const approveForm = useForm<z.infer<typeof approveWithdrawalSchema>>({
    resolver: zodResolver(approveWithdrawalSchema),
    defaultValues: {
      adminNotes: "",
      verified: false
    }
  });

  const rejectForm = useForm<z.infer<typeof rejectWithdrawalSchema>>({
    resolver: zodResolver(rejectWithdrawalSchema),
    defaultValues: {
      reason: "other",
      detailedReason: "",
      notifyUser: true
    }
  });

  const completeForm = useForm<z.infer<typeof completeWithdrawalSchema>>({
    resolver: zodResolver(completeWithdrawalSchema),
    defaultValues: {
      transactionId: "",
      notes: "",
      confirmed: false
    }
  });

  const exportForm = useForm<z.infer<typeof exportTransactionsSchema>>({
    resolver: zodResolver(exportTransactionsSchema),
    defaultValues: {
      types: [],
      format: "csv",
      includeNotes: false
    }
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const approveWithdrawalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof approveWithdrawalSchema>) => {
      if (!approveWithdrawalId) throw new Error("No withdrawal selected");
      return apiRequest("POST", `/api/admin/finance/withdrawals/${approveWithdrawalId}/approve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance"] });
      setApproveWithdrawalId(null);
      approveForm.reset();
      toast({ title: "Withdrawal approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve withdrawal", variant: "destructive" });
    }
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rejectWithdrawalSchema>) => {
      if (!rejectWithdrawalId) throw new Error("No withdrawal selected");
      return apiRequest("POST", `/api/admin/finance/withdrawals/${rejectWithdrawalId}/reject`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance"] });
      setRejectWithdrawalId(null);
      rejectForm.reset();
      toast({ title: "Withdrawal rejected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reject withdrawal", variant: "destructive" });
    }
  });

  const completeWithdrawalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof completeWithdrawalSchema>) => {
      if (!completeWithdrawalId) throw new Error("No withdrawal selected");
      return apiRequest("POST", `/api/admin/finance/withdrawals/${completeWithdrawalId}/complete`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance"] });
      setCompleteWithdrawalId(null);
      completeForm.reset();
      toast({ title: "Withdrawal marked as completed" });
    },
    onError: () => {
      toast({ title: "Failed to complete withdrawal", variant: "destructive" });
    }
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof exportTransactionsSchema>) => {
      const params = new URLSearchParams();
      if (data.dateFrom) params.set("dateFrom", data.dateFrom);
      if (data.dateTo) params.set("dateTo", data.dateTo);
      data.types.forEach(type => params.append("types", type));
      params.set("format", data.format);
      params.set("includeNotes", data.includeNotes.toString());

      const response = await fetch(`/api/admin/finance/transactions/export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      setShowExportModal(false);
      exportForm.reset();
      toast({ title: "Transactions exported successfully" });
    },
    onError: () => {
      toast({ title: "Failed to export transactions", variant: "destructive" });
    }
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold" data-testid="title-finance-management">Finance Management</h1>
        <div className="flex gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-48" data-testid="select-period-filter">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)}
            data-testid="button-export-transactions"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-finance-revenue">
                  {formatCurrency(overview.totalRevenue)}
                </div>
                <p className={`text-xs flex items-center gap-1 ${overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overview.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {overview.revenueGrowth >= 0 ? '+' : ''}{overview.revenueGrowth}% vs last period
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Pending Withdrawals */}
        <Card data-testid="card-pending-withdrawals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${overview.pendingWithdrawalCount > 0 ? 'text-orange-600' : ''}`} data-testid="text-pending-withdrawals">
                  {formatCurrency(overview.pendingWithdrawals)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview.pendingWithdrawalCount} {overview.pendingWithdrawalCount === 1 ? 'request' : 'requests'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Total Transactions */}
        <Card data-testid="card-total-transactions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-transactions">
                  {formatNumber(overview.totalTransactions)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview.transactionsToday} today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Top Earner */}
        <Card data-testid="card-top-earner">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Earner</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {overview.topEarner?.avatarUrl && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={overview.topEarner.avatarUrl} />
                      <AvatarFallback>{overview.topEarner.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="text-lg font-bold truncate">
                    {overview.topEarner?.username || 'N/A'}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(overview.topEarner?.earnings || 0)} earned
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue Trend Chart */}
        <Card data-testid="card-revenue-trend">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-64" />
            ) : revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Source Chart */}
        <Card data-testid="card-revenue-by-source">
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceLoading ? (
              <Skeleton className="h-64" />
            ) : revenueBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueBySource}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {revenueBySource.map((entry, index) => {
                      const colorKey = entry.name.toLowerCase().replace(/\s+/g, '') as keyof typeof COLORS;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[colorKey] || COLORS.other} 
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No source data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals ({withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length > 0 ? (
                    withdrawals.map((withdrawal) => {
                      const daysWaiting = differenceInDays(new Date(), new Date(withdrawal.createdAt));
                      const isUrgent = daysWaiting > 7;

                      return (
                        <TableRow key={withdrawal.id} data-testid={`withdrawal-row-${withdrawal.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={withdrawal.avatarUrl} />
                                <AvatarFallback>{withdrawal.username?.[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{withdrawal.username}</div>
                                {isUrgent && (
                                  <Badge variant="destructive" className="text-xs mt-1">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold" data-testid={`withdrawal-amount-${withdrawal.id}`}>
                              {formatCurrency(withdrawal.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{withdrawal.method || 'USDT'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-xs">
                              <span className="truncate">{withdrawal.walletAddress || 'N/A'}</span>
                              {withdrawal.walletAddress && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(withdrawal.walletAddress!, toast)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{format(new Date(withdrawal.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(withdrawal.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                onClick={() => setApproveWithdrawalId(withdrawal.id)}
                                data-testid={`approve-withdrawal-${withdrawal.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                onClick={() => setRejectWithdrawalId(withdrawal.id)}
                                data-testid={`reject-withdrawal-${withdrawal.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setViewWithdrawalId(withdrawal.id)}
                                data-testid={`view-withdrawal-${withdrawal.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pending withdrawals
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map((txn) => {
                        const isIncome = ['coin purchase', 'subscription', 'marketplace'].includes(txn.type?.toLowerCase() || '');
                        
                        return (
                          <TableRow 
                            key={txn.id} 
                            data-testid={`transaction-row-${txn.id}`}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setViewTransactionId(txn.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={txn.avatarUrl} />
                                  <AvatarFallback>{txn.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{txn.username}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTypeColor(txn.type)}>
                                {txn.type || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span 
                                className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}
                                data-testid={`transaction-amount-${txn.id}`}
                              >
                                {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{txn.method || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(txn.status || 'pending')}>
                                {txn.status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDistanceToNow(new Date(txn.createdAt), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewTransactionId(txn.id);
                                }}
                                data-testid={`view-transaction-${txn.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No recent transactions
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {transactions.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline">
                    View All Transactions
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================================================================ */}
      {/* MODALS */}
      {/* ============================================================================ */}

      {/* Modal 1: Approve Withdrawal */}
      <Dialog open={!!approveWithdrawalId} onOpenChange={(open) => !open && setApproveWithdrawalId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Withdrawal Request</DialogTitle>
            <DialogDescription>
              Review and approve this withdrawal request
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedWithdrawal.avatarUrl} />
                  <AvatarFallback>{selectedWithdrawal.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{selectedWithdrawal.username}</div>
                  <div className="text-sm text-muted-foreground">Current Balance: {formatCurrency(selectedWithdrawal.userBalance || 0)}</div>
                </div>
              </div>

              {/* Withdrawal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Amount Requested</div>
                  <div className="text-2xl font-bold">{formatCurrency(selectedWithdrawal.amount)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Method</div>
                  <div className="text-lg font-semibold">{selectedWithdrawal.method || 'USDT'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Wallet Address</div>
                  <div className="font-mono text-sm break-all">{selectedWithdrawal.walletAddress || 'N/A'}</div>
                </div>
              </div>

              <Form {...approveForm}>
                <form onSubmit={approveForm.handleSubmit((data) => approveWithdrawalMutation.mutate(data))} className="space-y-4">
                  {/* Verification Checklist */}
                  <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="font-medium mb-2">Verification Checklist:</div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>User has sufficient balance</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Wallet address is valid</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>No suspicious activity detected</span>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <FormField
                    control={approveForm.control}
                    name="adminNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Add any internal notes..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirmation */}
                  <FormField
                    control={approveForm.control}
                    name="verified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I confirm all verification checks have been completed
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Warning */}
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>Warning:</strong> Amount will be deducted from user's balance immediately upon approval.
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setApproveWithdrawalId(null)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={approveWithdrawalMutation.isPending}
                    >
                      {approveWithdrawalMutation.isPending ? 'Processing...' : 'Approve & Process'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Reject Withdrawal */}
      <Dialog open={!!rejectWithdrawalId} onOpenChange={(open) => !open && setRejectWithdrawalId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this withdrawal request
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedWithdrawal.avatarUrl} />
                  <AvatarFallback>{selectedWithdrawal.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{selectedWithdrawal.username}</div>
                  <div className="text-sm text-muted-foreground">
                    Requested: {formatCurrency(selectedWithdrawal.amount)}
                  </div>
                </div>
              </div>

              <Form {...rejectForm}>
                <form onSubmit={rejectForm.handleSubmit((data) => rejectWithdrawalMutation.mutate(data))} className="space-y-4">
                  {/* Rejection Reason */}
                  <FormField
                    control={rejectForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rejection Reason</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="insufficient_balance">Insufficient Balance</SelectItem>
                            <SelectItem value="invalid_wallet">Invalid Wallet Details</SelectItem>
                            <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                            <SelectItem value="verification_required">Verification Required</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Detailed Reason */}
                  <FormField
                    control={rejectForm.control}
                    name="detailedReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Reason (shown to user)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Provide a clear explanation that will be shown to the user..."
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          This message will be sent to the user, so please be clear and professional.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notify User */}
                  <FormField
                    control={rejectForm.control}
                    name="notifyUser"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify user by email</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setRejectWithdrawalId(null)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="destructive"
                      disabled={rejectWithdrawalMutation.isPending}
                    >
                      {rejectWithdrawalMutation.isPending ? 'Processing...' : 'Reject Request'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 3: Complete Withdrawal */}
      <Dialog open={!!completeWithdrawalId} onOpenChange={(open) => !open && setCompleteWithdrawalId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark Withdrawal as Completed</DialogTitle>
            <DialogDescription>
              Confirm that payment has been successfully sent
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedWithdrawal.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-bold">{formatCurrency(selectedWithdrawal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method:</span>
                  <span>{selectedWithdrawal.method || 'USDT'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wallet:</span>
                  <span className="font-mono text-xs">{selectedWithdrawal.walletAddress}</span>
                </div>
              </div>

              <Form {...completeForm}>
                <form onSubmit={completeForm.handleSubmit((data) => completeWithdrawalMutation.mutate(data))} className="space-y-4">
                  {/* Transaction ID */}
                  <FormField
                    control={completeForm.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID / Payment Reference *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter transaction ID or payment reference" />
                        </FormControl>
                        <FormDescription>
                          The transaction hash or payment reference from the payment gateway
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Notes */}
                  <FormField
                    control={completeForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Add any additional information..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirmation */}
                  <FormField
                    control={completeForm.control}
                    name="confirmed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I confirm that payment has been sent successfully
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCompleteWithdrawalId(null)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={completeWithdrawalMutation.isPending}
                    >
                      {completeWithdrawalMutation.isPending ? 'Processing...' : 'Mark as Completed'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 4: View Transaction Details */}
      <Dialog open={!!viewTransactionId} onOpenChange={(open) => !open && setViewTransactionId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              {/* Transaction Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Transaction ID</div>
                  <div className="font-mono text-sm">{selectedTransaction.id}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <Badge variant={getTypeColor(selectedTransaction.type)} className="mt-1">
                    {selectedTransaction.type}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={getStatusColor(selectedTransaction.status || 'pending')} className="mt-1">
                    {selectedTransaction.status || 'Pending'}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="text-xl font-bold">{formatCurrency(selectedTransaction.amount)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Payment Method</div>
                  <div className="font-medium">{selectedTransaction.method || 'N/A'}</div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">User</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedTransaction.avatarUrl} />
                      <AvatarFallback>{selectedTransaction.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{selectedTransaction.username}</span>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Date & Time</div>
                  <div>{format(new Date(selectedTransaction.createdAt), 'PPpp')}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedTransaction.createdAt), { addSuffix: true })}
                  </div>
                </div>

                {selectedTransaction.description && (
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="text-sm">{selectedTransaction.description}</div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  toast({ title: "Receipt download feature coming soon" });
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button onClick={() => setViewTransactionId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 5: Export Transactions */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
            <DialogDescription>
              Select filters and export transactions to CSV
            </DialogDescription>
          </DialogHeader>

          <Form {...exportForm}>
            <form onSubmit={exportForm.handleSubmit((data) => exportTransactionsMutation.mutate(data))} className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={exportForm.control}
                  name="dateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={exportForm.control}
                  name="dateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Transaction Types */}
              <FormField
                control={exportForm.control}
                name="types"
                render={() => (
                  <FormItem>
                    <FormLabel>Transaction Types</FormLabel>
                    <div className="space-y-2">
                      {['Coin Purchases', 'Subscriptions', 'Marketplace', 'Withdrawals'].map((type) => (
                        <FormField
                          key={type}
                          control={exportForm.control}
                          name="types"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type])
                                      : field.onChange(field.value?.filter((value) => value !== type))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {type}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Format */}
              <FormField
                control={exportForm.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Export Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Include Notes */}
              <FormField
                control={exportForm.control}
                name="includeNotes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include detailed notes</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowExportModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={exportTransactionsMutation.isPending}
                  data-testid="button-export-submit"
                >
                  {exportTransactionsMutation.isPending ? 'Exporting...' : 'Export'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Withdrawal Details Modal (simplified) */}
      <Dialog open={!!viewWithdrawalId} onOpenChange={(open) => !open && setViewWithdrawalId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">User</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedWithdrawal.avatarUrl} />
                      <AvatarFallback>{selectedWithdrawal.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{selectedWithdrawal.username}</div>
                      <div className="text-xs text-muted-foreground">
                        Balance: {formatCurrency(selectedWithdrawal.userBalance || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="text-2xl font-bold">{formatCurrency(selectedWithdrawal.amount)}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Method</div>
                  <div className="font-medium">{selectedWithdrawal.method || 'USDT'}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Wallet Address</div>
                  <div className="font-mono text-sm break-all bg-muted/50 p-2 rounded">
                    {selectedWithdrawal.walletAddress || 'N/A'}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Requested</div>
                  <div>{format(new Date(selectedWithdrawal.createdAt), 'PPpp')}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedWithdrawal.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setViewWithdrawalId(null)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
