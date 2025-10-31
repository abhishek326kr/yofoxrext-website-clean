"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Eye, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  Search,
  Flame,
  Clock,
  Users,
  Activity,
  Sparkles,
  MessagesSquare,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

type Thread = {
  id: string;
  title: string;
  body: string;
  slug: string;
  fullUrl?: string;
  categorySlug: string;
  authorId: string;
  views: number;
  replyCount: number;
  isPinned: boolean;
  isLocked?: boolean;
  hasAcceptedAnswer?: boolean;
  engagementScore?: number;
  createdAt: string;
  lastActivityAt: string;
  author?: {
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    rank?: number;
  };
};

type TrendingThread = {
  threadId: string;
  title: string;
  slug: string;
  categorySlug: string;
  engagementScore: number;
  replyCount: number;
  views: number;
  velocity: number;
  lastActivityAt: string;
};

type ActivityFeedItem = {
  type: string;
  threadId: string;
  threadTitle: string;
  userId: string;
  username: string;
  profileImageUrl?: string;
  action: string;
  timestamp: string;
};

interface DiscussionsClientProps {
  initialThreads: Thread[];
}

// Stats fetcher
function useDiscussionStats() {
  return useQuery<{
    totalThreads: number;
    totalPosts: number;
    activeUsers: number;
    trendingThreads: number;
  }>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      return {
        totalThreads: data.totalThreads || 0,
        totalPosts: data.totalPosts || 0,
        activeUsers: data.totalMembers || 0,
        trendingThreads: 0, // Will be calculated from trending data
      };
    },
    refetchInterval: 30000,
  });
}

// Trending threads fetcher
function useTrendingThreads() {
  return useQuery<TrendingThread[]>({
    queryKey: ['/api/discussions/trending'],
    queryFn: async () => {
      const res = await fetch('/api/discussions/trending?period=24h&limit=5', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch trending');
      return res.json();
    },
    refetchInterval: 30000,
  });
}

// Activity feed fetcher
function useActivityFeed() {
  return useQuery<ActivityFeedItem[]>({
    queryKey: ['/api/discussions/activity'],
    queryFn: async () => {
      const res = await fetch('/api/discussions/activity?limit=10', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export default function DiscussionsClient({ initialThreads }: DiscussionsClientProps) {
  const { isAuthenticated, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [filterChip, setFilterChip] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (threadId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // Fetch data with React Query
  const { data: threads, isLoading: threadsLoading } = useQuery<Thread[]>({
    queryKey: ['/api/threads'],
    initialData: initialThreads,
    queryFn: async () => {
      const res = await fetch('/api/threads?sortBy=newest&limit=100', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch threads');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useDiscussionStats();
  const { data: trendingThreads, isLoading: trendingLoading } = useTrendingThreads();
  const { data: activityFeed, isLoading: activityLoading } = useActivityFeed();

  // Combine stats with real trending data
  const combinedStats = useMemo(() => {
    if (!stats) return null;
    return {
      ...stats,
      trendingThreads: trendingThreads?.length || 0,
    };
  }, [stats, trendingThreads]);

  // Extract unique categories from threads
  const categories = useMemo(() => {
    if (!threads) return [];
    const uniqueCategories = new Set(threads.map(t => t.categorySlug));
    return Array.from(uniqueCategories);
  }, [threads]);

  // Filter and sort threads
  const filteredThreads = useMemo(() => {
    if (!threads) return [];

    let filtered = [...threads];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thread => 
        thread.title.toLowerCase().includes(query) || 
        thread.body.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(thread => thread.categorySlug === categoryFilter);
    }

    // Apply chip filters
    if (filterChip === 'hot') {
      filtered = filtered.filter(thread => (thread.engagementScore || 0) > 50);
    } else if (filterChip === 'trending') {
      filtered = filtered.filter(thread => {
        const recentDate = new Date();
        recentDate.setHours(recentDate.getHours() - 24);
        return new Date(thread.lastActivityAt) > recentDate && thread.replyCount > 0;
      });
    } else if (filterChip === 'unanswered') {
      filtered = filtered.filter(thread => thread.replyCount === 0);
    } else if (filterChip === 'solved') {
      filtered = filtered.filter(thread => thread.hasAcceptedAnswer);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'replies':
        filtered.sort((a, b) => b.replyCount - a.replyCount);
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => 
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        );
        break;
    }

    // Pinned threads always at top
    const pinned = filtered.filter(t => t.isPinned);
    const regular = filtered.filter(t => !t.isPinned);
    return [...pinned, ...regular];
  }, [threads, searchQuery, categoryFilter, sortBy, filterChip]);

  const getCategoryStyles = (categorySlug: string) => {
    const categoryLower = categorySlug.toLowerCase();
    
    if (categoryLower.includes('strategy') || categoryLower.includes('discussion')) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-950',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800'
      };
    }
    
    if (categoryLower.includes('performance') || categoryLower.includes('report')) {
      return {
        bg: 'bg-green-100 dark:bg-green-950',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800'
      };
    }
    
    if (categoryLower.includes('ea') || categoryLower.includes('library')) {
      return {
        bg: 'bg-purple-100 dark:bg-purple-950',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800'
      };
    }
    
    if (categoryLower.includes('beginner') || categoryLower.includes('question')) {
      return {
        bg: 'bg-orange-100 dark:bg-orange-950',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800'
      };
    }
    
    if (categoryLower.includes('support') || categoryLower.includes('technical')) {
      return {
        bg: 'bg-red-100 dark:bg-red-950',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800'
      };
    }
    
    return {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    };
  };

  const formatCategoryName = (slug: string) => {
    return slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleNewThread = () => {
    if (!isAuthenticated) {
      login();
    } else {
      window.location.href = '/discussions/new';
    }
  };

  if (threadsLoading) {
    return (
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-7xl mx-auto px-4 py-6">
      {/* Enhanced Header with Stats */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="heading-discussions">
              <MessagesSquare className="w-8 h-8 text-primary" />
              Recent Discussions
            </h1>
            <p className="text-muted-foreground">
              Join the conversation. Browse active threads and share your insights.
            </p>
          </div>
          <Button onClick={handleNewThread} data-testid="button-new-thread">
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        </div>

        {/* Platform Stats Row */}
        {!statsLoading && combinedStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-total-threads">
                      {combinedStats.totalThreads}
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
                    <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-active-today">
                      {filteredThreads.filter(t => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return new Date(t.lastActivityAt) > today;
                      }).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <MessagesSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-replies-24h">
                      {combinedStats.totalPosts}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Replies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-trending-now">
                      {combinedStats.trendingThreads}
                    </p>
                    <p className="text-xs text-muted-foreground">Trending Now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 3-Column Layout: Main Content (60%) + Sidebar (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search discussions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-discussions"
                />
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {formatCategoryName(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest Activity</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="replies">Most Replies</SelectItem>
                    <SelectItem value="views">Most Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterChip === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterChip('all')}
                  data-testid="chip-all"
                >
                  All
                </Button>
                <Button
                  variant={filterChip === 'hot' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterChip('hot')}
                  data-testid="chip-hot"
                >
                  <Flame className="w-3 h-3 mr-1" />
                  Hot
                </Button>
                <Button
                  variant={filterChip === 'trending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterChip('trending')}
                  data-testid="chip-trending"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Button>
                <Button
                  variant={filterChip === 'unanswered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterChip('unanswered')}
                  data-testid="chip-unanswered"
                >
                  Unanswered
                </Button>
                <Button
                  variant={filterChip === 'solved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterChip('solved')}
                  data-testid="chip-solved"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Solved
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Thread Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredThreads && filteredThreads.length > 0 ? (
              filteredThreads.map(thread => {
                const categoryStyles = getCategoryStyles(thread.categorySlug);
                const isHot = (thread.engagementScore || 0) > 50;
                const isTrending = (() => {
                  const recentDate = new Date();
                  recentDate.setHours(recentDate.getHours() - 24);
                  return new Date(thread.lastActivityAt) > recentDate && thread.replyCount > 2;
                })();

                const isExpanded = expandedCards.has(thread.id);

                return (
                  <Link key={thread.id} href={thread.fullUrl || `/thread/${thread.slug}`}>
                    <Card 
                      className="h-full hover:border-primary/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200"
                      data-testid={`card-thread-${thread.slug}`}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Category Badge + Status Badges */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-2 py-0.5 ${categoryStyles.bg} ${categoryStyles.text} ${categoryStyles.border}`}
                            data-testid={`badge-category-${thread.slug}`}
                          >
                            {formatCategoryName(thread.categorySlug)}
                          </Badge>
                          <div className="flex gap-1">
                            {thread.isPinned && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0" data-testid={`badge-pinned-${thread.slug}`}>
                                Pinned
                              </Badge>
                            )}
                            {isTrending && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30">
                                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                Trending
                              </Badge>
                            )}
                            {isHot && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30">
                                <Flame className="w-2.5 h-2.5 mr-0.5" />
                                Hot
                              </Badge>
                            )}
                            {thread.hasAcceptedAnswer && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                                <CheckCircle className="w-2.5 h-2.5" />
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Thread Title */}
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight" data-testid={`title-${thread.slug}`}>
                          {thread.title}
                        </h3>

                        {/* Thread Body Preview */}
                        {thread.body && (
                          <div>
                            <p 
                              className={`text-xs text-muted-foreground leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`} 
                              data-testid={`body-preview-${thread.slug}`}
                            >
                              {thread.body.replace(/<[^>]*>/g, '')}
                            </p>
                            {thread.body.length > 150 && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleCardExpansion(thread.id);
                                }}
                                className="text-xs text-primary hover:underline mt-1 font-medium"
                                data-testid={`button-toggle-${thread.slug}`}
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Author Info */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={thread.author?.profileImageUrl} />
                            <AvatarFallback className="text-[10px]">
                              {thread.author?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate" data-testid={`author-${thread.slug}`}>
                            {thread.author?.username || 'Unknown'}
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span data-testid={`replies-${thread.slug}`}>{thread.replyCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span data-testid={`views-${thread.slug}`}>{thread.views}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span suppressHydrationWarning className="text-[10px]" data-testid={`activity-${thread.slug}`}>
                              {formatDistanceToNow(new Date(thread.lastActivityAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No discussions found matching your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trending Now Widget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                Trending Now
              </CardTitle>
              <CardDescription className="text-xs">
                Hot discussions in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3" data-testid="widget-trending">
              {trendingLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))
              ) : trendingThreads && trendingThreads.length > 0 ? (
                trendingThreads.map((thread, idx) => (
                  <Link key={thread.threadId} href={`/thread/${thread.slug}`}>
                    <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" data-testid={`trending-item-${idx}`}>
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0.5">
                          #{idx + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 mb-1">{thread.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{thread.replyCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{thread.views}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No trending discussions right now
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Widget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Live community updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2" data-testid="widget-activity">
              {activityLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))
              ) : activityFeed && activityFeed.length > 0 ? (
                activityFeed.slice(0, 10).map((activity, idx) => (
                  <Link key={idx} href={`/thread/${activity.threadId}`}>
                    <div className="p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-xs" data-testid={`activity-item-${idx}`}>
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={activity.profileImageUrl} />
                          <AvatarFallback className="text-[10px]">
                            {activity.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-2">
                            <span className="font-medium">{activity.username}</span>
                            {' '}
                            <span className="text-muted-foreground">{activity.action}</span>
                            {' '}
                            <span className="font-medium line-clamp-1">{activity.threadTitle}</span>
                          </p>
                          <p suppressHydrationWarning className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Widget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-testid="widget-stats">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Discussions</span>
                <span className="text-sm font-bold">
                  {filteredThreads.filter(t => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(t.lastActivityAt) > today;
                  }).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unanswered</span>
                <span className="text-sm font-bold">
                  {filteredThreads.filter(t => t.replyCount === 0).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Solved</span>
                <span className="text-sm font-bold">
                  {filteredThreads.filter(t => t.hasAcceptedAnswer).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Categories</span>
                <span className="text-sm font-bold">{categories.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
