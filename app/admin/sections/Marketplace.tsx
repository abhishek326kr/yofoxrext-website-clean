"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Package, CheckCircle, XCircle, Eye, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AddContentDialog from "./AddContentDialog";

interface MarketplaceStats {
  totalItems: number;
  pendingItems: number;
  totalSales: number;
  salesThisWeek: number;
  totalRevenue: number;
  revenueThisWeek: number;
}

interface MarketplaceItem {
  id: number;
  title: string;
  sellerUsername: string;
  coinPrice: number;
  sales: number;
  status: string;
  createdAt: string;
  category?: string;
  description?: string;
}

interface TopSellingItem {
  id: number;
  title: string;
  sales: number;
  coinPrice: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface TopVendor {
  sellerId: number;
  sellerUsername: string;
  totalSales: number;
  totalRevenue: number;
  itemCount: number;
}

interface ItemDetailsData {
  id: number;
  title: string;
  description: string;
  category: string;
  coinPrice: number;
  status: string;
  sellerUsername: string;
  sales: number;
  createdAt: string;
  recentPurchases?: Array<{
    id: number;
    buyerUsername: string;
    coins: number;
    purchasedAt: string;
  }>;
}

interface PaginatedResponse {
  items: MarketplaceItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const rejectSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be less than 500 characters")
});

const featureSchema = z.object({
  durationDays: z.number().min(1, "Duration must be at least 1 day").max(365, "Duration cannot exceed 365 days")
});

export default function AdminMarketplace() {
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal states
  const [viewItemId, setViewItemId] = useState<number | null>(null);
  const [rejectItemId, setRejectItemId] = useState<number | null>(null);
  const [featureItemId, setFeatureItemId] = useState<number | null>(null);

  // Debounce search query
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
  }, [categoryFilter, statusFilter, priceFilter]);

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: pageSize.toString(),
    ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
    ...(categoryFilter !== "all" && { category: categoryFilter }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(priceFilter !== "all" && { priceRange: priceFilter })
  });

  const { data: statsRaw, isLoading: statsLoading } = useQuery<MarketplaceStats>({
    queryKey: ["/api/admin/marketplace/stats"]
  });

  const stats: MarketplaceStats = statsRaw || {
    totalItems: 0,
    pendingItems: 0,
    totalSales: 0,
    salesThisWeek: 0,
    totalRevenue: 0,
    revenueThisWeek: 0
  };

  const { data: itemsResponse, isLoading: itemsLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/admin/marketplace/items", currentPage, pageSize, debouncedSearchQuery, categoryFilter, statusFilter, priceFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/marketplace/items?${queryParams}`);
      if (!response.ok) {
        // If API doesn't support pagination yet, return mock structure
        const items = await response.json();
        return {
          items: Array.isArray(items) ? items : [],
          totalItems: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
          currentPage: 1,
          pageSize: Array.isArray(items) ? items.length : 20
        };
      }
      return response.json();
    }
  });

  const items: MarketplaceItem[] = itemsResponse?.items || [];
  const totalItems = itemsResponse?.totalItems || 0;
  const totalPages = itemsResponse?.totalPages || 1;

  const { data: topSellingRaw, isLoading: topLoading } = useQuery<TopSellingItem[]>({
    queryKey: ["/api/admin/marketplace/top-selling"]
  });

  const topSelling: TopSellingItem[] = Array.isArray(topSellingRaw) ? topSellingRaw : [];

  const { data: revenueDataRaw, isLoading: revenueLoading } = useQuery<RevenueDataPoint[]>({
    queryKey: ["/api/admin/marketplace/revenue-chart"]
  });

  const revenueData: RevenueDataPoint[] = Array.isArray(revenueDataRaw) ? revenueDataRaw : [];

  const { data: topVendorsRaw, isLoading: topVendorsLoading } = useQuery<TopVendor[]>({
    queryKey: ["/api/admin/marketplace/top-vendors"]
  });

  const topVendors: TopVendor[] = Array.isArray(topVendorsRaw) ? topVendorsRaw : [];

  const { data: viewItemData, isLoading: viewItemLoading } = useQuery<ItemDetailsData>({
    queryKey: ["/api/admin/marketplace/items", viewItemId],
    enabled: !!viewItemId,
    queryFn: async () => {
      const response = await fetch(`/api/admin/marketplace/items/${viewItemId}`);
      if (!response.ok) throw new Error("Failed to fetch item details");
      return response.json();
    }
  });

  // Forms
  const rejectForm = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: ""
    }
  });

  const featureForm = useForm<z.infer<typeof featureSchema>>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      durationDays: 30
    }
  });

  // Mutations
  const approveItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("POST", `/api/admin/marketplace/${itemId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-selling"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-vendors"] });
      toast({ title: "Item approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve item", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rejectSchema>) => {
      if (!rejectItemId) throw new Error("No item selected");
      return apiRequest("POST", `/api/admin/marketplace/${rejectItemId}/reject`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-selling"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-vendors"] });
      setRejectItemId(null);
      toast({ title: "Item rejected successfully" });
      rejectForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to reject item", variant: "destructive" });
    }
  });

  const featureMutation = useMutation({
    mutationFn: async (data: z.infer<typeof featureSchema>) => {
      if (!featureItemId) throw new Error("No item selected");
      return apiRequest("POST", `/api/admin/marketplace/${featureItemId}/feature`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-selling"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-vendors"] });
      setFeatureItemId(null);
      toast({ title: "Item featured successfully" });
      featureForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to feature item", variant: "destructive" });
    }
  });

  const onRejectSubmit = (data: z.infer<typeof rejectSchema>) => {
    rejectMutation.mutate(data);
  };

  const onFeatureSubmit = (data: z.infer<typeof featureSchema>) => {
    featureMutation.mutate(data);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setPriceFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace Management</h1>
        <AddContentDialog />
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by title or seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-items"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Expert Advisors">Expert Advisors</SelectItem>
            <SelectItem value="Indicators">Indicators</SelectItem>
            <SelectItem value="Scripts">Scripts</SelectItem>
            <SelectItem value="Templates">Templates</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger className="w-full md:w-[180px]" data-testid="select-price-filter">
            <SelectValue placeholder="All Prices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="free">Free (0 coins)</SelectItem>
            <SelectItem value="low">Low (1-100)</SelectItem>
            <SelectItem value="medium">Medium (101-500)</SelectItem>
            <SelectItem value="high">High (500+)</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={handleClearFilters}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-items">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-items">
                  {stats.totalItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingItems} pending approval
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-sales">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-sales">
                  {stats.totalSales}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats.salesThisWeek} this week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-marketplace-revenue">
                  ${stats.totalRevenue}
                </div>
                <p className="text-xs text-muted-foreground">
                  +${stats.revenueThisWeek} this week
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card data-testid="card-revenue-chart">
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-64" />
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No revenue data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Selling Items */}
      <Card data-testid="card-top-selling">
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : topSelling.length > 0 ? (
            <div className="space-y-3">
              {topSelling.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.sales} sales</p>
                    </div>
                  </div>
                  <Badge>{item.coinPrice} coins</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Top Vendors Section */}
      <Card data-testid="card-top-vendors">
        <CardHeader>
          <CardTitle>Top Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          {topVendorsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : topVendors.length > 0 ? (
            <div className="space-y-3">
              {topVendors.map((vendor, index) => (
                <div key={vendor.sellerId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <div>
                      <p className="font-medium">{vendor.sellerUsername}</p>
                      <p className="text-sm text-muted-foreground">{vendor.totalSales} sales • {vendor.itemCount} items</p>
                    </div>
                  </div>
                  <Badge>{vendor.totalRevenue} coins earned</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No vendor data available</p>
          )}
        </CardContent>
      </Card>

      {/* Marketplace Items Table */}
      <Card data-testid="card-marketplace-items">
        <CardHeader>
          <CardTitle>Marketplace Items ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
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
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Listed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 ? (
                      items.map((item) => (
                        <TableRow key={item.id} data-testid={`item-row-${item.id}`}>
                          <TableCell data-testid={`item-title-${item.id}`}>
                            {item.title}
                          </TableCell>
                          <TableCell>{item.sellerUsername}</TableCell>
                          <TableCell>{item.coinPrice} coins</TableCell>
                          <TableCell>{item.sales}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setViewItemId(item.id)}
                                data-testid={`button-view-item-${item.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveItemMutation.mutate(item.id)}
                                disabled={item.status === 'approved' || approveItemMutation.isPending}
                                data-testid={`button-approve-item-${item.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectItemId(item.id)}
                                disabled={item.status === 'rejected'}
                                data-testid={`button-reject-item-${item.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setFeatureItemId(item.id)}
                                disabled={item.status !== 'approved'}
                                data-testid={`button-feature-item-${item.id}`}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Feature
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No marketplace items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 border-t mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Items per page:</span>
                      <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(parseInt(val))}>
                        <SelectTrigger className="w-[80px]" data-testid="select-page-size">
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
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        data-testid="button-first-page"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        data-testid="button-last-page"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Item Details Modal */}
      <Dialog open={viewItemId !== null} onOpenChange={() => setViewItemId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {viewItemLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-32" />
            </div>
          ) : viewItemData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{viewItemData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{viewItemData.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium">{viewItemData.coinPrice} coins</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{viewItemData.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seller</p>
                  <p className="font-medium">{viewItemData.sellerUsername}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sales</p>
                  <p className="font-medium">{viewItemData.sales}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{viewItemData.description}</p>
              </div>

              {viewItemData.recentPurchases && viewItemData.recentPurchases.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recent Purchases</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewItemData.recentPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{purchase.buyerUsername}</TableCell>
                          <TableCell>{purchase.coins} coins</TableCell>
                          <TableCell>{formatDistanceToNow(new Date(purchase.purchasedAt), { addSuffix: true })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Item not found</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Item Modal */}
      <Dialog open={rejectItemId !== null} onOpenChange={() => setRejectItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Marketplace Item</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this item. The seller will see this reason.
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(onRejectSubmit)} className="space-y-4">
              <FormField
                control={rejectForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason *</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        if (val !== 'custom') {
                          field.onChange(val);
                        }
                      }}
                    >
                      <SelectTrigger data-testid="select-reject-reason">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Poor description">Poor description</SelectItem>
                        <SelectItem value="Inappropriate content">Inappropriate content</SelectItem>
                        <SelectItem value="Duplicate listing">Duplicate listing</SelectItem>
                        <SelectItem value="Missing files">Missing files</SelectItem>
                        <SelectItem value="Price too high">Price too high</SelectItem>
                        <SelectItem value="custom">Custom reason...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormControl>
                      <Textarea
                        placeholder="Or enter a custom reason..."
                        {...field}
                        data-testid="textarea-reject-reason"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormDescription>Minimum 10 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={rejectMutation.isPending} data-testid="button-confirm-reject">
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Item'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setRejectItemId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Feature Item Modal */}
      <Dialog open={featureItemId !== null} onOpenChange={() => setFeatureItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Marketplace Item</DialogTitle>
            <DialogDescription>
              Featured items appear prominently on the marketplace homepage.
            </DialogDescription>
          </DialogHeader>
          <Form {...featureForm}>
            <form onSubmit={featureForm.handleSubmit(onFeatureSubmit)} className="space-y-4">
              <FormField
                control={featureForm.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature Duration (Days) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-feature-duration"
                      />
                    </FormControl>
                    <FormDescription>How long should this item be featured? (1-365 days)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={featureMutation.isPending} data-testid="button-confirm-feature">
                  {featureMutation.isPending ? 'Featuring...' : 'Feature Item'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFeatureItemId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
