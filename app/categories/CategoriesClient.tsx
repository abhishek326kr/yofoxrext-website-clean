"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ForumCategory } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  FileText, 
  Users,
  Lightbulb, 
  HelpCircle, 
  TrendingUp, 
  Settings, 
  Code, 
  Award,
  BookOpen,
  Activity,
  Wrench,
  FileCode,
  GraduationCap,
  MessageCircle,
  Trophy,
  BarChart3,
  Rocket,
  ShieldAlert,
  Search,
  Flame,
  Zap,
  Clock,
  Download,
  Coins,
  ArrowRight,
  Sparkles
} from "lucide-react";

// Icon mapping for categories
const iconMap: Record<string, any> = {
  "trading-strategies": Lightbulb,
  "algorithm-development": Code,
  "backtest-results": TrendingUp,
  "live-trading-reports": BarChart3,
  "signal-services": Activity,
  "mt4-mt5-tips": Settings,
  "broker-discussion": Users,
  "risk-management": ShieldAlert,
  "market-analysis": TrendingUp,
  "indicator-library": Activity,
  "ea-reviews": Award,
  "troubleshooting": Wrench,
  "trading-psychology": GraduationCap,
  "news-updates": FileText,
  "commercial-trials": Rocket,
};

interface CategoryStats {
  slug: string;
  name: string;
  threadCount: number;
  activeUsers7d: number;
  newThreads7d: number;
  topContributors: Array<{
    username: string;
    threadCount: number;
  }>;
  lastUpdated: string;
}

interface CategoriesClientProps {
  initialCategories: ForumCategory[];
}

interface CommunityStats {
  membersOnline: number;
  newMembers24h: number;
  newMembers7d: number;
  activeThreads24h: number;
  newThreads7d: number;
  totalReplies24h: number;
  totalDownloads24h: number;
  coinsEarned24h: number;
}

interface TrendingUser {
  userId: string;
  username: string;
  profileImageUrl?: string;
  contributionsDelta: number;
  coinsDelta: number;
  threadsCreated: number;
  repliesPosted: number;
}

// Custom hook to fetch ALL category stats in one batch request
function useCategoriesStatsBatch() {
  return useQuery<Record<string, CategoryStats>>({
    queryKey: ['/api/categories/stats/batch'],
    queryFn: async () => {
      const res = await fetch('/api/categories/stats/batch', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch category stats');
      return res.json();
    },
    refetchInterval: 60000, // 60s revalidation
    staleTime: 30000,
  });
}

// Category Card Component
function CategoryCard({ category, stats, isLoading }: { 
  category: ForumCategory; 
  stats?: CategoryStats;
  isLoading: boolean;
}) {
  const IconComponent = iconMap[category.slug] || MessageSquare;
  
  // Use stats from API if available, fallback to initial category data
  const threadCount = stats?.threadCount ?? category.threadCount;
  const postCount = category.postCount;
  const hasNewThreads = stats ? stats.newThreads7d > 0 : false;
  const activeUsers = stats?.activeUsers7d ?? 0;
  
  return (
    <Link href={`/category/${category.slug}`} data-testid={`link-category-${category.slug}`}>
      <Card className="h-full hover:border-primary/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200" data-testid={`card-category-${category.slug}`}>
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Icon + Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1" data-testid={`text-category-name-${category.slug}`}>
                    {category.name}
                  </h3>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : hasNewThreads && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-category-description-${category.slug}`}>
              {category.description}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-primary" />
                {isLoading ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  <>
                    <span className="font-semibold" data-testid={`badge-threads-${category.slug}`}>
                      {threadCount}
                    </span>
                    <span className="text-muted-foreground">threads</span>
                  </>
                )}
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span data-testid={`badge-posts-${category.slug}`}>
                  {postCount}
                </span>
                <span>posts</span>
              </div>
              {stats && activeUsers > 0 && (
                <>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span data-testid={`badge-active-users-${category.slug}`}>
                      {activeUsers}
                    </span>
                    <span>active</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useQuery<ForumCategory[]>({
    queryKey: ['/api/categories'],
    initialData: initialCategories,
    queryFn: async () => {
      const res = await fetch('/api/categories', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Fetch ALL category stats in one batch request
  const { data: categoriesStats, isLoading: categoriesStatsLoading } = useCategoriesStatsBatch();

  const { data: communityStats, isLoading: statsLoading } = useQuery<CommunityStats>({
    queryKey: ['/api/community/stats'],
    queryFn: async () => {
      const res = await fetch('/api/community/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch community stats');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: trendingUsers, isLoading: trendingLoading } = useQuery<TrendingUser[]>({
    queryKey: ['/api/community/trending-users'],
    queryFn: async () => {
      const res = await fetch('/api/community/trending-users?period=7d&limit=10', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch trending users');
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Filter categories by search term
  const filteredCategories = categories?.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(15).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const totalThreads = categories?.reduce((sum, cat) => sum + cat.threadCount, 0) ?? 0;
  const totalPosts = categories?.reduce((sum, cat) => sum + cat.postCount, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Enhanced Header with Platform Stats */}
      <div className="border-b bg-gradient-to-br from-primary/5 to-background">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="heading-categories">
                <BookOpen className="w-8 h-8 text-primary" />
                Forum Categories
              </h1>
              <p className="text-muted-foreground">
                Browse all discussion categories. Choose the right place for your questions and contributions.
              </p>
            </div>
          </div>

          {/* Summary Statistics at Top */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold" data-testid="stat-total-categories">
                      {categories?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold" data-testid="stat-total-threads">
                      {totalThreads.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Threads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold" data-testid="stat-total-posts">
                      {totalPosts.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-categories"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          {/* Main Categories Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCategories.map((category) => (
                <CategoryCard 
                  key={category.slug} 
                  category={category}
                  stats={categoriesStats?.[category.slug]}
                  isLoading={categoriesStatsLoading}
                />
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms
                </p>
              </Card>
            )}
          </div>

          {/* Trending Users Sidebar */}
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-lg">Trending Users</CardTitle>
                </div>
                <CardDescription>Most active members this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))
                ) : trendingUsers && trendingUsers.length > 0 ? (
                  trendingUsers.map((user, index) => (
                    <Link key={user.userId} href={`/user/${user.username}`} data-testid={`link-trending-user-${user.userId}`} className="block">
                      <Card className="p-3 hover:border-primary/30 hover-elevate active-elevate-2 cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <Badge 
                              variant="outline" 
                              className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center p-0 z-10 text-[10px] font-bold ${
                                index === 0 ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' :
                                index === 1 ? 'bg-gray-400/15 text-gray-700 dark:text-gray-400 border-gray-400/30' :
                                index === 2 ? 'bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-600/30' :
                                'bg-primary/10 text-primary border-primary/20'
                              }`}
                            >
                              {index + 1}
                            </Badge>
                            <Avatar className="w-10 h-10 border-2 border-border">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                {user.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm line-clamp-1" data-testid={`text-trending-username-${user.userId}`}>
                              {user.username}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span data-testid={`text-trending-contributions-${user.userId}`}>
                                  {user.contributionsDelta}
                                </span>
                              </div>
                              <span className="text-border">•</span>
                              <div className="flex items-center gap-1">
                                <Coins className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                <span>{user.coinsDelta}</span>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No trending users this week</p>
                  </div>
                )}
                
                {trendingUsers && trendingUsers.length > 0 && (
                  <Link href="/members">
                    <Button variant="outline" className="w-full mt-2" size="sm" data-testid="button-view-all-members">
                      View All Members
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
