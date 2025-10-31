"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  Search, 
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BrokerStats {
  totalBrokers: number;
  verifiedBrokers: number;
  scamWarnings: number;
  totalReviews: number;
  pendingReviews: number;
  pendingScamReports: number;
}

interface BrokerItem {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  regulation: string | null;
  isVerified: boolean;
  scamWarning: boolean;
  reviewCount: number;
  overallRating: number;
  scamReportCount: number;
  status: string;
  createdAt: Date;
  verifiedBy: string | null;
  verifiedAt: Date | null;
}

interface PaginatedBrokersResponse {
  items: BrokerItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface ScamReportItem {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerLogoUrl: string | null;
  userId: string;
  username: string;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  scamSeverity: "low" | "medium" | "high" | "critical" | null;
  status: "pending" | "approved" | "rejected";
  datePosted: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
}

interface PaginatedScamReportsResponse {
  items: ScamReportItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface ReviewItem {
  id: string;
  brokerId: string;
  brokerName: string;
  userId: string;
  username: string;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  status: "pending" | "approved" | "rejected";
  datePosted: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
}

interface PaginatedReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const addBrokerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  country: z.string().optional(),
  regulation: z.string().optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional(),
  minDeposit: z.string().optional(),
  leverage: z.string().optional(),
  platform: z.string().optional(),
  spreadType: z.string().optional(),
  minSpread: z.string().optional(),
});

const editBrokerSchema = addBrokerSchema;

const scamWarningSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});

const rejectReviewSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminBrokers() {
  const { toast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState("brokers");

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [regulationFilter, setRegulationFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal States (8 modals)
  const [viewBrokerId, setViewBrokerId] = useState<string | null>(null);
  const [editBrokerId, setEditBrokerId] = useState<string | null>(null);
  const [deleteBrokerId, setDeleteBrokerId] = useState<string | null>(null);
  const [verifyBrokerId, setVerifyBrokerId] = useState<string | null>(null);
  const [scamWarningBrokerId, setScamWarningBrokerId] = useState<string | null>(null);
  const [viewScamReportId, setViewScamReportId] = useState<string | null>(null);
  const [viewReviewId, setViewReviewId] = useState<string | null>(null);
  const [showAddBrokerModal, setShowAddBrokerModal] = useState(false);

  // Delete Confirmation States
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [verifyConfirmed, setVerifyConfirmed] = useState(false);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [countryFilter, verificationFilter, regulationFilter]);

  // ============================================================================
  // REACT QUERIES
  // ============================================================================

  // Stats Query
  const { data: statsRaw, isLoading: statsLoading } = useQuery<BrokerStats>({
    queryKey: ["/api/admin/brokers/stats"]
  });

  const stats: BrokerStats = statsRaw || {
    totalBrokers: 0,
    verifiedBrokers: 0,
    scamWarnings: 0,
    totalReviews: 0,
    pendingReviews: 0,
    pendingScamReports: 0,
  };

  // Brokers List Query
  const { data: brokersResponse, isLoading: brokersLoading } = useQuery<PaginatedBrokersResponse>({
    queryKey: [
      "/api/admin/brokers",
      debouncedSearchQuery,
      countryFilter,
      verificationFilter,
      regulationFilter,
      currentPage,
      pageSize,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
      if (countryFilter !== "all") params.set("country", countryFilter);
      if (verificationFilter === "verified") params.set("isVerified", "true");
      if (verificationFilter === "unverified") params.set("isVerified", "false");
      if (verificationFilter === "scam_warning") params.set("scamWarning", "true");
      if (regulationFilter !== "all") params.set("regulation", regulationFilter);

      const response = await fetch(`/api/admin/brokers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch brokers");
      return response.json();
    },
    enabled: activeTab === "brokers",
  });

  const brokers = brokersResponse?.items || [];
  const totalBrokers = brokersResponse?.total || 0;

  // Scam Reports Query
  const { data: scamReportsResponse, isLoading: scamReportsLoading } = useQuery<PaginatedScamReportsResponse>({
    queryKey: ["/api/admin/scam-reports", currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(`/api/admin/scam-reports?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch scam reports");
      return response.json();
    },
    enabled: activeTab === "scam-reports",
  });

  const scamReports = scamReportsResponse?.items || [];
  const totalScamReports = scamReportsResponse?.total || 0;

  // Reviews Query
  const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery<PaginatedReviewsResponse>({
    queryKey: ["/api/admin/broker-reviews", currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(`/api/admin/broker-reviews?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: activeTab === "reviews",
  });

  const reviews = reviewsResponse?.items || [];
  const totalReviews = reviewsResponse?.total || 0;

  // ============================================================================
  // FORMS
  // ============================================================================

  const addBrokerForm = useForm<z.infer<typeof addBrokerSchema>>({
    resolver: zodResolver(addBrokerSchema),
    defaultValues: {
      name: "",
      country: "",
      regulation: "",
      websiteUrl: "",
      minDeposit: "",
      leverage: "",
      platform: "",
      spreadType: "",
      minSpread: "",
    },
  });

  const editBrokerForm = useForm<z.infer<typeof editBrokerSchema>>({
    resolver: zodResolver(editBrokerSchema),
  });

  const scamWarningForm = useForm<z.infer<typeof scamWarningSchema>>({
    resolver: zodResolver(scamWarningSchema),
    defaultValues: {
      enabled: true,
      reason: "",
      severity: "medium",
    },
  });

  const rejectReviewForm = useForm<z.infer<typeof rejectReviewSchema>>({
    resolver: zodResolver(rejectReviewSchema),
    defaultValues: {
      reason: "",
    },
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const addBrokerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addBrokerSchema>) => {
      return apiRequest("POST", "/api/brokers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setShowAddBrokerModal(false);
      addBrokerForm.reset();
      toast({ title: "Broker added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add broker", variant: "destructive" });
    },
  });

  const editBrokerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editBrokerSchema>) => {
      if (!editBrokerId) throw new Error("No broker selected");
      return apiRequest("PATCH", `/api/admin/brokers/${editBrokerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setEditBrokerId(null);
      toast({ title: "Broker updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update broker", variant: "destructive" });
    },
  });

  const deleteBrokerMutation = useMutation({
    mutationFn: async (brokerId: string) => {
      return apiRequest("DELETE", `/api/admin/brokers/${brokerId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setDeleteBrokerId(null);
      setDeleteConfirmed(false);
      toast({ title: "Broker deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete broker", variant: "destructive" });
    },
  });

  const verifyBrokerMutation = useMutation({
    mutationFn: async (brokerId: string) => {
      return apiRequest("POST", `/api/admin/brokers/${brokerId}/verify`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setVerifyBrokerId(null);
      setVerifyConfirmed(false);
      toast({ title: "Broker verified successfully" });
    },
    onError: () => {
      toast({ title: "Failed to verify broker", variant: "destructive" });
    },
  });

  const unverifyBrokerMutation = useMutation({
    mutationFn: async (brokerId: string) => {
      return apiRequest("POST", `/api/admin/brokers/${brokerId}/unverify`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      toast({ title: "Broker verification removed" });
    },
    onError: () => {
      toast({ title: "Failed to unverify broker", variant: "destructive" });
    },
  });

  const scamWarningMutation = useMutation({
    mutationFn: async (data: z.infer<typeof scamWarningSchema>) => {
      if (!scamWarningBrokerId) throw new Error("No broker selected");
      return apiRequest("POST", `/api/admin/brokers/${scamWarningBrokerId}/scam-warning`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setScamWarningBrokerId(null);
      scamWarningForm.reset();
      toast({ title: "Scam warning updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update scam warning", variant: "destructive" });
    },
  });

  const resolveScamReportMutation = useMutation({
    mutationFn: async ({ reportId, resolution }: { reportId: string; resolution: "confirmed" | "dismissed" }) => {
      return apiRequest("POST", `/api/admin/scam-reports/${reportId}/resolve`, { resolution });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scam-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setViewScamReportId(null);
      toast({ title: "Scam report resolved" });
    },
    onError: () => {
      toast({ title: "Failed to resolve scam report", variant: "destructive" });
    },
  });

  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return apiRequest("POST", `/api/admin/broker-reviews/${reviewId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broker-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setViewReviewId(null);
      toast({ title: "Review approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve review", variant: "destructive" });
    },
  });

  const rejectReviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rejectReviewSchema>) => {
      if (!viewReviewId) throw new Error("No review selected");
      return apiRequest("POST", `/api/admin/broker-reviews/${viewReviewId}/reject`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broker-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/stats"] });
      setViewReviewId(null);
      rejectReviewForm.reset();
      toast({ title: "Review rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject review", variant: "destructive" });
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClearFilters = () => {
    setSearchQuery("");
    setCountryFilter("all");
    setVerificationFilter("all");
    setRegulationFilter("all");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onAddBrokerSubmit = (data: z.infer<typeof addBrokerSchema>) => {
    addBrokerMutation.mutate(data);
  };

  const onEditBrokerSubmit = (data: z.infer<typeof editBrokerSchema>) => {
    editBrokerMutation.mutate(data);
  };

  const onScamWarningSubmit = (data: z.infer<typeof scamWarningSchema>) => {
    scamWarningMutation.mutate(data);
  };

  const onRejectReviewSubmit = (data: z.infer<typeof rejectReviewSchema>) => {
    rejectReviewMutation.mutate(data);
  };

  const currentBroker = brokers.find((b) => b.id === viewBrokerId || b.id === editBrokerId || b.id === deleteBrokerId || b.id === verifyBrokerId || b.id === scamWarningBrokerId);
  const currentScamReport = scamReports.find((r) => r.id === viewScamReportId);
  const currentReview = reviews.find((r) => r.id === viewReviewId);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Broker Management</h1>
        <Button onClick={() => setShowAddBrokerModal(true)} data-testid="button-add-broker">
          + Add Broker
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-brokers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brokers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalBrokers}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-verified-brokers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Brokers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.verifiedBrokers}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-scam-warnings">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scam Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.scamWarnings}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-total-reviews">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="brokers" data-testid="tab-brokers">
            Brokers ({stats.totalBrokers})
          </TabsTrigger>
          <TabsTrigger value="scam-reports" data-testid="tab-scam-reports">
            Scam Reports ({stats.pendingScamReports})
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            Reviews ({stats.totalReviews})
          </TabsTrigger>
        </TabsList>

        {/* BROKERS TAB */}
        <TabsContent value="brokers" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by broker name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-brokers"
              />
            </div>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-country-filter">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="Cyprus">Cyprus</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-verification-filter">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="scam_warning">Scam Warning</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regulationFilter} onValueChange={setRegulationFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-regulation-filter">
                <SelectValue placeholder="Regulation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="FCA">FCA</SelectItem>
                <SelectItem value="ASIC">ASIC</SelectItem>
                <SelectItem value="CySEC">CySEC</SelectItem>
                <SelectItem value="CFTC">CFTC</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
              <SelectTrigger className="w-full md:w-[120px]" data-testid="select-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleClearFilters} data-testid="button-clear-filters">
              Clear
            </Button>
          </div>

          {/* Brokers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Brokers ({totalBrokers})</CardTitle>
            </CardHeader>
            <CardContent>
              {brokersLoading ? (
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
                          <TableHead>Name</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Regulation</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead>Reviews</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {brokers.length > 0 ? (
                          brokers.map((broker) => (
                            <TableRow key={broker.id} data-testid={`row-broker-${broker.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{broker.name}</div>
                                    {broker.scamWarning && (
                                      <Badge variant="destructive" className="text-xs">
                                        Scam Warning
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{broker.country || "-"}</TableCell>
                              <TableCell>{broker.regulation || "-"}</TableCell>
                              <TableCell>
                                {broker.isVerified ? (
                                  <Badge variant="default">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Unverified</Badge>
                                )}
                              </TableCell>
                              <TableCell>{broker.reviewCount}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{broker.overallRating || 0}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={broker.status === "approved" ? "default" : "secondary"}>
                                  {broker.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setViewBrokerId(broker.id)}
                                    data-testid={`button-view-broker-${broker.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditBrokerId(broker.id);
                                      editBrokerForm.reset({
                                        name: broker.name,
                                        country: broker.country || "",
                                        regulation: broker.regulation || "",
                                      });
                                    }}
                                    data-testid={`button-edit-broker-${broker.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {broker.isVerified ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => unverifyBrokerMutation.mutate(broker.id)}
                                      data-testid={`button-unverify-broker-${broker.id}`}
                                    >
                                      Unverify
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setVerifyBrokerId(broker.id)}
                                      data-testid={`button-verify-broker-${broker.id}`}
                                    >
                                      <ShieldCheck className="h-4 w-4 mr-1" />
                                      Verify
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setScamWarningBrokerId(broker.id)}
                                    data-testid={`button-scam-warning-${broker.id}`}
                                  >
                                    <ShieldAlert className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeleteBrokerId(broker.id)}
                                    data-testid={`button-delete-broker-${broker.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No brokers found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalBrokers > pageSize && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalBrokers)} of {totalBrokers} brokers
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          data-testid="button-first-page"
                        >
                          First
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-2 px-4">
                          <Input
                            type="number"
                            min={1}
                            max={Math.ceil(totalBrokers / pageSize)}
                            value={currentPage}
                            onChange={(e) => {
                              const page = parseInt(e.target.value);
                              if (page >= 1 && page <= Math.ceil(totalBrokers / pageSize)) {
                                handlePageChange(page);
                              }
                            }}
                            className="w-16 text-center"
                            data-testid="input-page-number"
                          />
                          <span className="text-sm text-muted-foreground">
                            of {Math.ceil(totalBrokers / pageSize)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= Math.ceil(totalBrokers / pageSize)}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(Math.ceil(totalBrokers / pageSize))}
                          disabled={currentPage >= Math.ceil(totalBrokers / pageSize)}
                          data-testid="button-last-page"
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCAM REPORTS TAB */}
        <TabsContent value="scam-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scam Reports ({totalScamReports})</CardTitle>
            </CardHeader>
            <CardContent>
              {scamReportsLoading ? (
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
                        <TableHead>Broker</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Report</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scamReports.length > 0 ? (
                        scamReports.map((report) => (
                          <TableRow key={report.id} data-testid={`row-scam-report-${report.id}`}>
                            <TableCell>{report.brokerName}</TableCell>
                            <TableCell>{report.username}</TableCell>
                            <TableCell>
                              {report.scamSeverity ? (
                                <Badge
                                  variant={
                                    report.scamSeverity === "critical" || report.scamSeverity === "high"
                                      ? "destructive"
                                      : report.scamSeverity === "medium"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {report.scamSeverity}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{report.reviewTitle}</TableCell>
                            <TableCell>
                              <Badge variant={report.status === "approved" ? "default" : "secondary"}>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(report.datePosted), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewScamReportId(report.id)}
                                  data-testid={`button-view-report-${report.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {report.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        resolveScamReportMutation.mutate({
                                          reportId: report.id,
                                          resolution: "confirmed",
                                        })
                                      }
                                      disabled={resolveScamReportMutation.isPending}
                                      data-testid={`button-confirm-scam-${report.id}`}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        resolveScamReportMutation.mutate({
                                          reportId: report.id,
                                          resolution: "dismissed",
                                        })
                                      }
                                      disabled={resolveScamReportMutation.isPending}
                                      data-testid={`button-dismiss-scam-${report.id}`}
                                    >
                                      Dismiss
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No scam reports found
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

        {/* REVIEWS TAB */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broker Reviews ({totalReviews})</CardTitle>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
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
                        <TableHead>Broker</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                            <TableCell>{review.brokerName}</TableCell>
                            <TableCell>{review.username}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{review.rating}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{review.reviewTitle}</TableCell>
                            <TableCell>
                              <Badge variant={review.status === "approved" ? "default" : "secondary"}>
                                {review.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(review.datePosted), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewReviewId(review.id)}
                                  data-testid={`button-view-review-${review.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {review.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => approveReviewMutation.mutate(review.id)}
                                      disabled={approveReviewMutation.isPending}
                                      data-testid={`button-approve-review-${review.id}`}
                                    >
                                      Approve
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No reviews found
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

      {/* ========================================================================
          MODALS (8 total)
      ======================================================================== */}

      {/* 1. Add Broker Modal */}
      <Dialog open={showAddBrokerModal} onOpenChange={setShowAddBrokerModal}>
        <DialogContent data-testid="modal-add-broker">
          <DialogHeader>
            <DialogTitle>Add New Broker</DialogTitle>
            <DialogDescription>Add a new broker to the directory</DialogDescription>
          </DialogHeader>
          <Form {...addBrokerForm}>
            <form onSubmit={addBrokerForm.handleSubmit(onAddBrokerSubmit)} className="space-y-4">
              <FormField
                control={addBrokerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-broker-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addBrokerForm.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addBrokerForm.control}
                name="regulation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regulation</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., FCA, ASIC" data-testid="input-regulation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addBrokerForm.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://..." data-testid="input-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddBrokerModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addBrokerMutation.isPending} data-testid="button-submit-add-broker">
                  Add Broker
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 2. View Broker Modal */}
      <Dialog open={!!viewBrokerId} onOpenChange={() => setViewBrokerId(null)}>
        <DialogContent data-testid="modal-view-broker">
          <DialogHeader>
            <DialogTitle>Broker Details</DialogTitle>
          </DialogHeader>
          {currentBroker && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Name</div>
                <div className="text-lg font-semibold">{currentBroker.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Country</div>
                <div>{currentBroker.country || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Regulation</div>
                <div>{currentBroker.regulation || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant={currentBroker.isVerified ? "default" : "secondary"}>
                    {currentBroker.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                  {currentBroker.scamWarning && <Badge variant="destructive">Scam Warning</Badge>}
                  <Badge>{currentBroker.status}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Reviews & Rating</div>
                <div>{currentBroker.reviewCount} reviews • {currentBroker.overallRating}/5 rating</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Scam Reports</div>
                <div>{currentBroker.scamReportCount}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewBrokerId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Edit Broker Modal */}
      <Dialog open={!!editBrokerId} onOpenChange={() => setEditBrokerId(null)}>
        <DialogContent data-testid="modal-edit-broker">
          <DialogHeader>
            <DialogTitle>Edit Broker</DialogTitle>
          </DialogHeader>
          <Form {...editBrokerForm}>
            <form onSubmit={editBrokerForm.handleSubmit(onEditBrokerSubmit)} className="space-y-4">
              <FormField
                control={editBrokerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editBrokerForm.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editBrokerForm.control}
                name="regulation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regulation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditBrokerId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editBrokerMutation.isPending}>
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 4. Delete Broker Modal */}
      <Dialog open={!!deleteBrokerId} onOpenChange={() => { setDeleteBrokerId(null); setDeleteConfirmed(false); }}>
        <DialogContent data-testid="modal-delete-broker">
          <DialogHeader>
            <DialogTitle>Delete Broker</DialogTitle>
            <DialogDescription>
              This will soft-delete the broker. Reviews will be preserved for audit trail.
            </DialogDescription>
          </DialogHeader>
          {currentBroker && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{currentBroker.name}</div>
                <div className="text-sm text-muted-foreground">{currentBroker.reviewCount} reviews</div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-confirm"
                  checked={deleteConfirmed}
                  onCheckedChange={(checked) => setDeleteConfirmed(checked as boolean)}
                  data-testid="checkbox-delete-confirm"
                />
                <label htmlFor="delete-confirm" className="text-sm font-medium cursor-pointer">
                  Yes, I want to delete this broker
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteBrokerId(null); setDeleteConfirmed(false); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteConfirmed || deleteBrokerMutation.isPending}
              onClick={() => deleteBrokerId && deleteBrokerMutation.mutate(deleteBrokerId)}
              data-testid="button-confirm-delete"
            >
              Delete Broker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Verify Broker Modal */}
      <Dialog open={!!verifyBrokerId} onOpenChange={() => { setVerifyBrokerId(null); setVerifyConfirmed(false); }}>
        <DialogContent data-testid="modal-verify-broker">
          <DialogHeader>
            <DialogTitle>Verify Broker</DialogTitle>
            <DialogDescription>
              Mark this broker as verified after confirming they meet standards
            </DialogDescription>
          </DialogHeader>
          {currentBroker && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{currentBroker.name}</div>
                <div className="text-sm text-muted-foreground">
                  {currentBroker.country} • {currentBroker.regulation}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verify-confirm"
                  checked={verifyConfirmed}
                  onCheckedChange={(checked) => setVerifyConfirmed(checked as boolean)}
                  data-testid="checkbox-verify-confirm"
                />
                <label htmlFor="verify-confirm" className="text-sm font-medium cursor-pointer">
                  I've verified this broker meets our standards
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVerifyBrokerId(null); setVerifyConfirmed(false); }}>
              Cancel
            </Button>
            <Button
              disabled={!verifyConfirmed || verifyBrokerMutation.isPending}
              onClick={() => verifyBrokerId && verifyBrokerMutation.mutate(verifyBrokerId)}
              data-testid="button-confirm-verify"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify Broker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Scam Warning Modal */}
      <Dialog open={!!scamWarningBrokerId} onOpenChange={() => setScamWarningBrokerId(null)}>
        <DialogContent data-testid="modal-scam-warning">
          <DialogHeader>
            <DialogTitle>Scam Warning</DialogTitle>
            <DialogDescription>Add or remove scam warning for this broker</DialogDescription>
          </DialogHeader>
          <Form {...scamWarningForm}>
            <form onSubmit={scamWarningForm.handleSubmit(onScamWarningSubmit)} className="space-y-4">
              <FormField
                control={scamWarningForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Scam Warning</FormLabel>
                      <FormDescription>Mark this broker with a scam warning</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-enable-warning"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={scamWarningForm.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-severity">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scamWarningForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-warning-reason" />
                    </FormControl>
                    <FormDescription>Optional explanation for the warning</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setScamWarningBrokerId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={scamWarningMutation.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 7. View Scam Report Modal */}
      <Dialog open={!!viewScamReportId} onOpenChange={() => setViewScamReportId(null)}>
        <DialogContent className="max-w-2xl" data-testid="modal-view-scam-report">
          <DialogHeader>
            <DialogTitle>Scam Report Details</DialogTitle>
          </DialogHeader>
          {currentScamReport && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Broker</div>
                <div className="font-semibold">{currentScamReport.brokerName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Reporter</div>
                <div>{currentScamReport.username}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Severity</div>
                <Badge
                  variant={
                    currentScamReport.scamSeverity === "critical" || currentScamReport.scamSeverity === "high"
                      ? "destructive"
                      : "default"
                  }
                >
                  {currentScamReport.scamSeverity || "Not specified"}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Title</div>
                <div>{currentScamReport.reviewTitle}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Report</div>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">{currentScamReport.reviewBody}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge>{currentScamReport.status}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Submitted</div>
                <div>{formatDistanceToNow(new Date(currentScamReport.datePosted), { addSuffix: true })}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            {currentScamReport?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    viewScamReportId &&
                    resolveScamReportMutation.mutate({
                      reportId: viewScamReportId,
                      resolution: "dismissed",
                    })
                  }
                  disabled={resolveScamReportMutation.isPending}
                  data-testid="button-dismiss-report"
                >
                  Dismiss Report
                </Button>
                <Button
                  onClick={() =>
                    viewScamReportId &&
                    resolveScamReportMutation.mutate({
                      reportId: viewScamReportId,
                      resolution: "confirmed",
                    })
                  }
                  disabled={resolveScamReportMutation.isPending}
                  data-testid="button-confirm-report"
                >
                  Confirm Scam
                </Button>
              </>
            )}
            {currentScamReport?.status !== "pending" && (
              <Button variant="outline" onClick={() => setViewScamReportId(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. View/Moderate Review Modal */}
      <Dialog open={!!viewReviewId} onOpenChange={() => setViewReviewId(null)}>
        <DialogContent className="max-w-2xl" data-testid="modal-view-review">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {currentReview && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Broker</div>
                <div className="font-semibold">{currentReview.brokerName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Reviewer</div>
                <div>{currentReview.username}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Rating</div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < currentReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2">{currentReview.rating}/5</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Title</div>
                <div>{currentReview.reviewTitle}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Review</div>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">{currentReview.reviewBody}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge>{currentReview.status}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Submitted</div>
                <div>{formatDistanceToNow(new Date(currentReview.datePosted), { addSuffix: true })}</div>
              </div>

              {/* Reject Form (shown when status is pending) */}
              {currentReview.status === "pending" && (
                <Form {...rejectReviewForm}>
                  <form onSubmit={rejectReviewForm.handleSubmit(onRejectReviewSubmit)} className="space-y-4 pt-4 border-t">
                    <FormField
                      control={rejectReviewForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rejection Reason (if rejecting)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Explain why this review is being rejected..."
                              data-testid="textarea-reject-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => currentReview && approveReviewMutation.mutate(currentReview.id)}
                        disabled={approveReviewMutation.isPending}
                        data-testid="button-approve-review"
                      >
                        Approve
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={rejectReviewMutation.isPending}
                        data-testid="button-reject-review"
                      >
                        Reject
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          )}
          {currentReview?.status !== "pending" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewReviewId(null)}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
