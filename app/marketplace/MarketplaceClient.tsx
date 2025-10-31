"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Grid3x3,
  List,
  Search,
  Star,
  Download,
  Eye,
  Coins,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface Content {
  id: string;
  slug: string;
  fullUrl?: string;
  title: string;
  description: string;
  type: string;
  category: string;
  priceCoins: number;
  isFree: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  postLogoUrl?: string;
  likes?: number;
  downloads?: number;
  views?: number;
  createdAt: string;
}

interface MarketplaceClientProps {
  initialContent: Content[];
}

// Skeleton card component for loading state
function ContentCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <Card>
        <CardContent className="p-0">
          <Skeleton className="aspect-video w-full rounded-t-lg" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <Skeleton className="w-32 h-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketplaceClient({ initialContent }: MarketplaceClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contentType, setContentType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");

  // Use initial content directly (page uses ISR for data freshness)
  const contentData = initialContent;
  const isLoading = false;
  const error = null;

  // Client-side filtering and sorting
  const filteredAndSortedContent = useMemo(() => {
    if (!contentData) return [];

    let filtered = [...contentData];

    // Filter by content type
    if (contentType !== "all") {
      filtered = filtered.filter((item) => item.type === contentType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Sort by selected option
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "rating":
        // Since we don't have rating in Content, sort by likes as proxy
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "price-low":
        filtered.sort((a, b) => a.priceCoins - b.priceCoins);
        break;
      case "price-high":
        filtered.sort((a, b) => b.priceCoins - a.priceCoins);
        break;
      case "sales":
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [contentData, contentType, searchQuery, sortBy]);

  // Helper function to get image URL
  const getImageUrl = (item: Content): string => {
    if (item.postLogoUrl) return item.postLogoUrl;
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
    if (item.imageUrl) return item.imageUrl;
    return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop";
  };

  // Helper function to get content type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "ea":
        return "EA";
      case "indicator":
        return "Indicator";
      case "article":
        return "Article";
      case "source_code":
        return "Source Code";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
          <p className="text-lg text-muted-foreground">
            Discover and purchase Expert Advisors, Indicators, and Trading Resources
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search EAs, indicators, articles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-marketplace-search"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-[180px]" data-testid="select-content-type">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ea">Expert Advisors</SelectItem>
                <SelectItem value="indicator">Indicators</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="source_code">Source Code</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort-by">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="sales">Top Selling</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Failed to load content</h3>
                <p className="text-muted-foreground">
                  There was an error loading the marketplace content. Please try again later.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {[...Array(6)].map((_, i) => (
              <ContentCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Content Grid/List */}
        {!isLoading && !error && (
          <>
            {filteredAndSortedContent.length === 0 ? (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <Search className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No content found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search query to find what you're looking for.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredAndSortedContent.map((item) => (
                  <Link key={item.id} href={item.fullUrl || `/content/${item.slug}`} data-testid={`link-content-${item.id}`}>
                    <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`card-content-${item.id}`}>
                      <CardContent className="p-0">
                        {viewMode === "grid" ? (
                          <div>
                            <div className="relative aspect-video overflow-hidden rounded-t-lg">
                              <img 
                                src={getImageUrl(item)} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <Badge 
                                className="absolute top-3 right-3"
                                variant={item.isFree ? "secondary" : "default"}
                              >
                                {item.isFree ? "FREE" : `${item.priceCoins} coins`}
                              </Badge>
                            </div>
                            
                            <div className="p-4 space-y-3">
                              <div className="space-y-2">
                                <Badge variant="outline">
                                  {getTypeLabel(item.type)}
                                </Badge>
                                <h3 className="font-semibold line-clamp-2" data-testid={`text-content-title-${item.id}`}>
                                  {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    <span className="font-medium">{item.likes || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Download className="w-4 h-4" />
                                    <span>{item.downloads || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 p-4">
                            <div className="flex-shrink-0">
                              <img 
                                src={getImageUrl(item)} 
                                alt={item.title}
                                className="w-32 h-24 object-cover rounded-lg"
                              />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {getTypeLabel(item.type)}
                                    </Badge>
                                    {item.isFree ? (
                                      <Badge variant="secondary">FREE</Badge>
                                    ) : (
                                      <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                                        <Coins className="w-4 h-4" />
                                        <span>{item.priceCoins}</span>
                                      </div>
                                    )}
                                  </div>
                                  <h3 className="font-semibold">{item.title}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                  <span className="font-medium">{item.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Download className="w-4 h-4" />
                                  <span>{item.downloads || 0}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Eye className="w-4 h-4" />
                                  <span>{item.views || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <EnhancedFooter />
    </div>
  );
}
