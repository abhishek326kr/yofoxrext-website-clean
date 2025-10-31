"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Star, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  X, 
  Building2,
  Filter,
  Users,
  MessageSquare,
  Award,
  Flame,
  CheckCircle2,
  Calculator,
  BookOpen,
  ThumbsUp,
  Mail,
  ExternalLink,
  Sparkles,
  BarChart3
} from "lucide-react";
import Link from "next/link";

type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number | null;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
  spreadType?: string | null;
  minSpread?: number | null;
  platform?: string | null;
  yearFounded?: number | null;
};

type BrokerStats = {
  totalBrokers: number;
  verifiedBrokers: number;
  totalReviews: number;
  avgRating: number;
  scamAlertsActive: number;
  newReviews24h: number;
};

type TrendingBroker = {
  brokerId: string;
  name: string;
  slug: string;
  reviewsThisWeek: number;
  ratingTrend: number;
  verificationStatus: string;
  logoUrl?: string | null;
  overallRating?: number | null;
};

interface BrokerDirectoryClientProps {
  initialBrokers: Broker[];
}

export default function BrokerDirectoryClient({ initialBrokers }: BrokerDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  // Left sidebar filter states
  const [regulationFilters, setRegulationFilters] = useState<string[]>([]);
  const [accountTypeFilters, setAccountTypeFilters] = useState<string[]>([]);
  const [depositFilter, setDepositFilter] = useState("all");
  const [leverageFilter, setLeverageFilter] = useState("all");
  const [spreadTypeFilters, setSpreadTypeFilters] = useState<string[]>([]);
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);
  const [paymentFilters, setPaymentFilters] = useState<string[]>([]);
  const [featureFilters, setFeatureFilters] = useState<string[]>([]);

  // Fetch brokers
  const { data: brokers = [], isLoading: brokersLoading } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
    initialData: initialBrokers,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  // Fetch broker stats
  const { data: stats, isLoading: statsLoading } = useQuery<BrokerStats>({
    queryKey: ["/api/brokers/stats"],
    staleTime: 60000,
  });

  // Fetch trending brokers
  const { data: trendingBrokers = [], isLoading: trendingLoading } = useQuery<TrendingBroker[]>({
    queryKey: ["/api/brokers/trending"],
    staleTime: 60000,
  });

  // Fetch comparison data when modal is open
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ["/api/brokers/comparison", selectedBrokers.join(",")],
    queryFn: async () => {
      if (selectedBrokers.length === 0) return null;
      const res = await fetch(`/api/brokers/comparison?ids=${selectedBrokers.join(",")}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch comparison');
      return res.json();
    },
    enabled: showComparison && selectedBrokers.length > 0,
    staleTime: 30000,
  });

  // Filter and sort brokers
  const filteredBrokers = brokers
    .filter((broker) => {
      const matchesSearch = broker.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (verificationFilter === "verified" && !broker.isVerified) return false;
      if (verificationFilter === "unverified" && broker.isVerified) return false;
      
      if (ratingFilter === "4+" && (broker.overallRating || 0) < 4) return false;
      if (ratingFilter === "3+" && (broker.overallRating || 0) < 3) return false;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.overallRating || 0) - (a.overallRating || 0);
      if (sortBy === "reviews") return b.reviewCount - a.reviewCount;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const handleCompareToggle = (brokerId: string) => {
    setSelectedBrokers(prev => {
      if (prev.includes(brokerId)) {
        return prev.filter(id => id !== brokerId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, brokerId];
    });
  };

  const clearAllFilters = () => {
    setRegulationFilters([]);
    setAccountTypeFilters([]);
    setDepositFilter("all");
    setLeverageFilter("all");
    setSpreadTypeFilters([]);
    setPlatformFilters([]);
    setPaymentFilters([]);
    setFeatureFilters([]);
    setVerificationFilter("all");
    setRatingFilter("all");
    setSearchQuery("");
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-sm text-muted-foreground">No ratings</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.round(rating)
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Top rated brokers for sidebar
  const topRated = brokers
    .filter(b => b.isVerified && (b.overallRating || 0) > 0)
    .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
    .slice(0, 5);

  // Most reviewed brokers for sidebar
  const mostReviewed = brokers
    .filter(b => b.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 5);

  // Scam alerts for sidebar
  const scamAlerts = brokers
    .filter(b => b.scamReportCount > 5)
    .sort((a, b) => b.scamReportCount - a.scamReportCount)
    .slice(0, 5);

  // Featured broker (top rated verified)
  const featuredBroker = topRated[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-[1800px] mx-auto px-4 py-6">
        {/* Enhanced Header with Platform Stats */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" data-testid="heading-broker-directory">
                <Building2 className="w-8 h-8 text-primary" />
                Broker Directory
              </h1>
              <p className="text-lg text-muted-foreground">
                Community-driven broker reviews and ratings. Compare brokers and submit reviews to earn coins.
              </p>
            </div>
            <Link href="/brokers/submit-review">
              <Button size="lg" data-testid="button-submit-review">
                Submit Review
              </Button>
            </Link>
          </div>

          {/* Platform Stats */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-total-brokers">{stats.totalBrokers}</p>
                      <p className="text-xs text-muted-foreground">Total Brokers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-verified-brokers">{stats.verifiedBrokers}</p>
                      <p className="text-xs text-muted-foreground">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-total-reviews">{stats.totalReviews}</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-avg-rating">{stats.avgRating.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Avg Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-scam-alerts">{stats.scamAlertsActive}</p>
                      <p className="text-xs text-muted-foreground">Scam Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-new-reviews">{stats.newReviews24h}</p>
                      <p className="text-xs text-muted-foreground">New 24h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* 3-Column Layout: Left Sidebar + Main Content + Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR - 3 columns on large screens */}
          <aside className="lg:col-span-3 space-y-4 hidden lg:block">
            {/* Advanced Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Regulation Status */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Regulation</h4>
                  <div className="space-y-2">
                    {['FCA', 'CFTC', 'CySEC', 'ASIC', 'Offshore'].map((reg) => (
                      <div key={reg} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`reg-${reg}`}
                          checked={regulationFilters.includes(reg)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setRegulationFilters([...regulationFilters, reg]);
                            } else {
                              setRegulationFilters(regulationFilters.filter(r => r !== reg));
                            }
                          }}
                          data-testid={`filter-regulation-${reg.toLowerCase()}`}
                        />
                        <label
                          htmlFor={`reg-${reg}`}
                          className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {reg === 'Offshore' ? '⚠️ Offshore/Unregulated' : `${reg} Regulated`}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Account Types */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Types</h4>
                  <div className="space-y-2">
                    {['Standard', 'ECN', 'Islamic', 'Demo', 'Cent'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`account-${type}`}
                          checked={accountTypeFilters.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAccountTypeFilters([...accountTypeFilters, type]);
                            } else {
                              setAccountTypeFilters(accountTypeFilters.filter(t => t !== type));
                            }
                          }}
                          data-testid={`filter-account-${type.toLowerCase()}`}
                        />
                        <label
                          htmlFor={`account-${type}`}
                          className="text-sm cursor-pointer leading-none"
                        >
                          {type} Account
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Minimum Deposit */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Minimum Deposit</h4>
                  <Select value={depositFilter} onValueChange={setDepositFilter}>
                    <SelectTrigger data-testid="filter-min-deposit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Amount</SelectItem>
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="100-500">$100 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000+">$1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Maximum Leverage */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Maximum Leverage</h4>
                  <Select value={leverageFilter} onValueChange={setLeverageFilter}>
                    <SelectTrigger data-testid="filter-leverage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Leverage</SelectItem>
                      <SelectItem value="30">Up to 1:30</SelectItem>
                      <SelectItem value="100">Up to 1:100</SelectItem>
                      <SelectItem value="500">Up to 1:500</SelectItem>
                      <SelectItem value="1000">1:1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Platforms */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trading Platforms</h4>
                  <div className="space-y-2">
                    {['MT4', 'MT5', 'cTrader', 'Proprietary', 'WebTrader'].map((platform) => (
                      <div key={platform} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`platform-${platform}`}
                          checked={platformFilters.includes(platform)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setPlatformFilters([...platformFilters, platform]);
                            } else {
                              setPlatformFilters(platformFilters.filter(p => p !== platform));
                            }
                          }}
                          data-testid={`filter-platform-${platform.toLowerCase()}`}
                        />
                        <label
                          htmlFor={`platform-${platform}`}
                          className="text-sm cursor-pointer leading-none"
                        >
                          {platform === 'MT4' ? 'MetaTrader 4' : platform === 'MT5' ? 'MetaTrader 5' : platform}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={clearAllFilters}
                  data-testid="button-clear-all-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            {/* Broker Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📂 Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="#top-rated" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors" data-testid="category-top-rated">
                    <span className="text-xl">⭐</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Top Rated</p>
                      <p className="text-xs text-muted-foreground">4.5+ stars</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{topRated.length}</Badge>
                  </div>
                </Link>

                <Link href="#low-spread" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors" data-testid="category-low-spread">
                    <span className="text-xl">📉</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Low Spread</p>
                      <p className="text-xs text-muted-foreground">Under 1 pip</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">5</Badge>
                  </div>
                </Link>

                <Link href="#beginners" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors" data-testid="category-beginners">
                    <span className="text-xl">🎓</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">For Beginners</p>
                      <p className="text-xs text-muted-foreground">$0-$100 min</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">4</Badge>
                  </div>
                </Link>

                <Link href="#ecn" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors" data-testid="category-ecn">
                    <span className="text-xl">🔄</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">ECN Brokers</p>
                      <p className="text-xs text-muted-foreground">Direct market access</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">6</Badge>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Comparison Tool */}
            {selectedBrokers.length > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Compare Brokers
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedBrokers.length} broker{selectedBrokers.length !== 1 ? 's' : ''} selected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {selectedBrokers.map(id => {
                      const broker = brokers.find(b => b.id === id);
                      return broker ? (
                        <div key={id} className="flex items-center gap-2 p-2 rounded-md bg-card/50">
                          <Avatar className="h-6 w-6 rounded-md">
                            <AvatarImage src={broker.logoUrl || undefined} />
                            <AvatarFallback className="rounded-md text-xs">
                              <Building2 className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs flex-1 font-medium">{broker.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleCompareToggle(id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setShowComparison(true)}
                    disabled={selectedBrokers.length < 2}
                    data-testid="button-compare-sidebar"
                  >
                    Compare Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            {!statsLoading && stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📊 Directory Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <p className="text-xl font-bold">{stats.totalBrokers}</p>
                      <p className="text-xs text-muted-foreground">Total Brokers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-xl font-bold">{stats.verifiedBrokers}</p>
                      <p className="text-xs text-muted-foreground">Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="text-xl font-bold">{stats.totalReviews}</p>
                      <p className="text-xs text-muted-foreground">Total Reviews</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-xl font-bold">{stats.scamAlertsActive}</p>
                      <p className="text-xs text-muted-foreground">Scam Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* MAIN CONTENT - 6 columns on large screens */}
          <div className="lg:col-span-6 space-y-4">
            {/* Filter Bar */}
            <Card>
              <CardContent className="p-3">
                <div className="space-y-3">
                  {/* Search + Quick Actions */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search brokers..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-broker-search"
                      />
                    </div>
                    <Button variant="outline" size="icon" data-testid="button-filter">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                      <SelectTrigger className="w-[160px]" data-testid="select-verification">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brokers</SelectItem>
                        <SelectItem value="verified">Verified Only</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="w-[140px]" data-testid="select-rating">
                        <SelectValue placeholder="Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="4+">4+ Stars</SelectItem>
                        <SelectItem value="3+">3+ Stars</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[140px]" data-testid="select-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">By Rating</SelectItem>
                        <SelectItem value="reviews">By Reviews</SelectItem>
                        <SelectItem value="name">By Name</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Active Filter Chips */}
                    {verificationFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {verificationFilter === "verified" ? "Verified" : "Unverified"}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setVerificationFilter("all")} />
                      </Badge>
                    )}
                    {ratingFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {ratingFilter} stars
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setRatingFilter("all")} />
                      </Badge>
                    )}
                  </div>

                  {/* Results Count */}
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredBrokers.length} broker{filteredBrokers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Broker Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brokersLoading ? (
                Array(9).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <Skeleton className="h-48" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredBrokers.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">No brokers found matching your criteria.</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredBrokers.map((broker) => (
                  <Card 
                    key={broker.id} 
                    className={`hover-elevate cursor-pointer ${selectedBrokers.includes(broker.id) ? 'ring-2 ring-primary' : ''}`}
                    data-testid={`card-broker-${broker.slug}`}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Logo + Name + Badge */}
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 rounded-md">
                            <AvatarImage src={broker.logoUrl || undefined} alt={broker.name} />
                            <AvatarFallback className="rounded-md">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/brokers/${broker.slug}`}>
                              <h3 className="font-semibold text-sm line-clamp-1 hover:text-primary" data-testid={`text-broker-name-${broker.slug}`}>
                                {broker.name}
                              </h3>
                            </Link>
                            {broker.isVerified && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 mt-1" data-testid={`badge-verified-${broker.slug}`}>
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {/* Compare Checkbox */}
                          <button
                            onClick={() => handleCompareToggle(broker.id)}
                            className={`p-1 rounded hover:bg-accent ${selectedBrokers.includes(broker.id) ? 'bg-primary text-primary-foreground' : ''}`}
                            data-testid={`checkbox-compare-${broker.slug}`}
                            disabled={!selectedBrokers.includes(broker.id) && selectedBrokers.length >= 3}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Rating */}
                        <div data-testid={`rating-stars-${broker.slug}`}>
                          {renderStars(broker.overallRating)}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span data-testid={`text-review-count-${broker.slug}`}>{broker.reviewCount} reviews</span>
                          </div>
                          {broker.scamReportCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0" data-testid={`badge-scam-alert-${broker.slug}`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {broker.scamReportCount} scam reports
                            </Badge>
                          )}
                        </div>

                        {/* Regulation Summary */}
                        <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-regulation-${broker.slug}`}>
                          {broker.regulationSummary || "No regulation information available"}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link href={`/brokers/${broker.slug}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full" data-testid={`button-view-broker-${broker.slug}`}>
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR - 3 columns on large screens */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Featured Broker of the Month */}
            {featuredBroker && (
              <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Badge className="mb-3 bg-white/20 hover:bg-white/30 text-white border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured Broker
                    </Badge>
                    <h3 className="font-bold mb-3">Broker of the Month</h3>
                    
                    <Avatar className="h-20 w-20 mx-auto mb-3 rounded-lg">
                      <AvatarImage src={featuredBroker.logoUrl || undefined} />
                      <AvatarFallback className="rounded-lg">
                        <Building2 className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <h4 className="font-semibold mb-2">{featuredBroker.name}</h4>
                    
                    <div className="mb-3 flex justify-center">
                      {renderStars(featuredBroker.overallRating)}
                    </div>
                    
                    <div className="bg-black/20 dark:bg-white/10 rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="opacity-80">Regulation:</span>
                        <span className="font-semibold">{featuredBroker.regulationSummary?.split(',')[0] || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-80">Platform:</span>
                        <span className="font-semibold">{featuredBroker.platform || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-80">Reviews:</span>
                        <span className="font-semibold">{featuredBroker.reviewCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/brokers/${featuredBroker.slug}`} className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Link href="/brokers/submit-review" className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full">
                          Write Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trending This Week Widget */}
            {!trendingLoading && trendingBrokers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    Trending This Week
                  </CardTitle>
                  <CardDescription className="text-xs">Most active brokers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {trendingBrokers.slice(0, 5).map((broker, index) => (
                    <Link key={broker.brokerId} href={`/brokers/${broker.slug}`}>
                      <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors" data-testid={`widget-trending-${broker.slug}`}>
                        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400 min-w-[24px]">
                          #{index + 1}
                        </span>
                        <Avatar className="h-8 w-8 rounded-md">
                          <AvatarImage src={broker.logoUrl || undefined} />
                          <AvatarFallback className="rounded-md text-xs">
                            <Building2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">{broker.name}</p>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-green-600 dark:text-green-400">
                              +{broker.reviewsThisWeek} views
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {broker.overallRating ? broker.overallRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Reviews */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Recent Reviews
                </CardTitle>
                <CardDescription className="text-xs">Community feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">No reviews yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Be the first to review a broker!</p>
                  <Link href="/brokers/submit-review">
                    <Button size="sm" variant="outline" data-testid="button-submit-review-sidebar">
                      Submit Review
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Scam Alerts Widget */}
            <Card className={scamAlerts.length > 0 ? "border-destructive/30" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base flex items-center gap-2 ${scamAlerts.length > 0 ? 'text-destructive' : ''}`}>
                  <AlertTriangle className="h-4 w-4" />
                  Scam Alerts
                </CardTitle>
                <CardDescription className="text-xs">Warning system</CardDescription>
              </CardHeader>
              <CardContent>
                {scamAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {scamAlerts.slice(0, 3).map((broker) => (
                      <Link key={broker.id} href={`/brokers/${broker.slug}`}>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent" data-testid={`widget-scam-alert-${broker.slug}`}>
                          <Avatar className="h-8 w-8 rounded-md">
                            <AvatarImage src={broker.logoUrl || undefined} />
                            <AvatarFallback className="rounded-md text-xs">
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-1">{broker.name}</p>
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">{broker.scamReportCount} reports</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <span className="text-5xl block mb-3">✅</span>
                    <p className="text-sm mb-1">No recent scam alerts</p>
                    <p className="text-xs text-muted-foreground">All brokers are under review</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Broker Tools */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Broker Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/tools/pip-calculator" className="block">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors" data-testid="tool-pip-calculator">
                    <span className="text-xl">📊</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pip Calculator</p>
                      <p className="text-xs text-muted-foreground">Calculate pip value</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>

                <Link href="/tools/lot-size-calculator" className="block">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors" data-testid="tool-lot-size">
                    <span className="text-xl">📐</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Lot Size Calculator</p>
                      <p className="text-xs text-muted-foreground">Position sizing tool</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>

                <Link href="/tools/margin-calculator" className="block">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors" data-testid="tool-margin">
                    <span className="text-xl">💰</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Margin Calculator</p>
                      <p className="text-xs text-muted-foreground">Required margin</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Educational Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Choosing a Broker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/guides/how-to-choose-broker" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors text-sm">
                  <span>📖</span>
                  How to Choose a Forex Broker
                </Link>
                <Link href="/guides/regulation-explained" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors text-sm">
                  <span>🏛️</span>
                  Understanding Broker Regulation
                </Link>
                <Link href="/guides/spread-types" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors text-sm">
                  <span>📊</span>
                  Fixed vs Variable Spreads
                </Link>
                <Link href="/guides/leverage-guide" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors text-sm">
                  <span>⚖️</span>
                  Leverage: Risks & Benefits
                </Link>
              </CardContent>
            </Card>

            {/* Community Recommendations */}
            {topRated.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-primary" />
                    Community Picks
                  </CardTitle>
                  <CardDescription className="text-xs">Most recommended by traders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topRated.slice(0, 3).map((broker, index) => (
                    <div key={broker.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/50" data-testid={`community-pick-${broker.slug}`}>
                      <Avatar className="h-8 w-8 rounded-md">
                        <AvatarImage src={broker.logoUrl || undefined} />
                        <AvatarFallback className="rounded-md">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{broker.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {85 - index * 5}% recommend
                        </p>
                      </div>
                      <ThumbsUp className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Newsletter Signup */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Broker Updates
                </CardTitle>
                <CardDescription className="text-xs">
                  Get notified about new brokers, scam alerts, and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-2">
                  <Input 
                    type="email" 
                    placeholder="Your email address" 
                    data-testid="input-newsletter-email"
                  />
                  <Button type="submit" className="w-full" data-testid="button-subscribe-newsletter">
                    Subscribe
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    🔒 We respect your privacy. Unsubscribe anytime.
                  </p>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Floating Comparison Bar */}
      {selectedBrokers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50" data-testid="comparison-bar">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">
                  {selectedBrokers.length} broker{selectedBrokers.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex items-center gap-2">
                  {selectedBrokers.map(id => {
                    const broker = brokers.find(b => b.id === id);
                    return broker ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {broker.name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleCompareToggle(id)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBrokers([])}
                  data-testid="button-clear-selection"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => setShowComparison(true)}
                  disabled={selectedBrokers.length < 2}
                  data-testid="button-compare-now"
                >
                  Compare Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Broker Comparison</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of selected brokers
            </DialogDescription>
          </DialogHeader>
          
          {comparisonLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading comparison...</p>
            </div>
          ) : comparisonData?.brokers ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Feature</th>
                    {comparisonData.brokers.map((broker: any) => (
                      <th key={broker.id} className="text-left p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 rounded-md">
                            <AvatarImage src={broker.logoUrl || undefined} />
                            <AvatarFallback className="rounded-md">
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{broker.name}</p>
                            {broker.isVerified && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Overall Rating</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3">
                        {renderStars(broker.overallRating)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Total Reviews</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.reviewCount}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Scam Reports</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3">
                        <span className={broker.scamReportCount > 5 ? "text-destructive font-semibold" : ""}>
                          {broker.scamReportCount}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Regulation</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.regulationSummary || "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Platform</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.platform || "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Spread Type</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.spreadType || "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Min Spread</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">
                        {broker.minSpread ? `${broker.minSpread} pips` : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Year Founded</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.yearFounded || "N/A"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm font-medium">Actions</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3">
                        <div className="flex flex-col gap-2">
                          <Link href={`/brokers/${broker.slug}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                          {broker.websiteUrl && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={broker.websiteUrl} target="_blank" rel="noopener noreferrer">
                                Visit Website
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No comparison data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EnhancedFooter />
    </div>
  );
}
