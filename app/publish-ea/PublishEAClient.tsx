"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Download,
  Eye,
  Coins,
  TrendingUp,
  Users,
  Package
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface EA {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  priceCoins: number;
  isFree: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  postLogoUrl?: string;
  downloads?: number;
  views?: number;
  createdAt: string;
  creatorId: string;
  creatorUsername?: string;
  creatorProfileImageUrl?: string;
}

interface PublishEAClientProps {
  initialEAs: EA[];
  stats: {
    totalEAs: number;
    totalDownloads: number;
    totalSellers: number;
  };
}

export default function PublishEAClient({ initialEAs, stats }: PublishEAClientProps) {
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();

  // Client-side filtering and sorting
  const filteredAndSortedEAs = useMemo(() => {
    if (!initialEAs) return [];

    let filtered = [...initialEAs];

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
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      case "price-low":
        filtered.sort((a, b) => a.priceCoins - b.priceCoins);
        break;
      case "price-high":
        filtered.sort((a, b) => b.priceCoins - a.priceCoins);
        break;
      default:
        break;
    }

    return filtered;
  }, [initialEAs, searchQuery, sortBy]);

  // Helper function to get image URL
  const getImageUrl = (item: EA): string => {
    if (item.postLogoUrl) return item.postLogoUrl;
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
    if (item.imageUrl) return item.imageUrl;
    return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop";
  };

  // Helper function to truncate description
  const truncateDescription = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-browse-eas">
                  Browse Expert Advisors
                </h1>
                <p className="text-muted-foreground">
                  Discover automated trading systems from expert developers
                </p>
              </div>
              {isAuthenticated && (
                <Link href="/publish-ea/new">
                  <Button size="lg" className="bg-primary hover:bg-primary/90" data-testid="button-publish-new-ea">
                    <Plus className="h-5 w-5 mr-2" />
                    Publish New EA
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card data-testid="card-stat-total-eas">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalEAs || filteredAndSortedEAs.length}</p>
                    <p className="text-sm text-muted-foreground">Total EAs</p>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-stat-total-downloads">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Download className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalDownloads || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-stat-total-sellers">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalSellers || 0}</p>
                    <p className="text-sm text-muted-foreground">Active Sellers</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search EAs by title or description..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-eas"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* EA Grid */}
          {filteredAndSortedEAs.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No EAs Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search query" : "Be the first to publish an EA!"}
              </p>
              {isAuthenticated && !searchQuery && (
                <Link href="/publish-ea/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Publish New EA
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-ea-cards">
              {filteredAndSortedEAs.map((ea) => (
                <Card key={ea.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-ea-${ea.id}`}>
                  <CardContent className="p-0">
                    {/* EA Image */}
                    <div className="aspect-video w-full bg-muted relative overflow-hidden">
                      <img
                        src={getImageUrl(ea)}
                        alt={ea.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-ea-${ea.id}`}
                      />
                      <Badge className="absolute top-2 right-2" data-testid={`badge-category-${ea.id}`}>
                        {ea.category}
                      </Badge>
                    </div>

                    {/* EA Info */}
                    <div className="p-4 space-y-3">
                      {/* Title and Price */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg line-clamp-2" data-testid={`text-title-${ea.id}`}>
                          {ea.title}
                        </h3>
                        <Badge variant={ea.isFree ? "secondary" : "default"} className="flex items-center gap-1 shrink-0" data-testid={`badge-price-${ea.id}`}>
                          <Coins className="h-3 w-3" />
                          {ea.isFree ? "Free" : ea.priceCoins}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${ea.id}`}>
                        {truncateDescription(ea.description, 100)}
                      </p>

                      {/* Seller Info */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ea.creatorProfileImageUrl} alt={ea.creatorUsername} />
                          <AvatarFallback>{ea.creatorUsername?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground" data-testid={`text-seller-${ea.id}`}>
                          {ea.creatorUsername || "Unknown"}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span data-testid={`text-downloads-${ea.id}`}>{ea.downloads || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span data-testid={`text-views-${ea.id}`}>{ea.views || 0}</span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Link href={`/ea/${ea.slug}`}>
                        <Button className="w-full" variant="outline" data-testid={`button-view-details-${ea.id}`}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <EnhancedFooter />
    </>
  );
}
