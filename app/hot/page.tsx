import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Eye, Clock, ArrowLeft, MessageSquare, ShoppingCart, Star, Filter, Users, Award, BarChart3, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type ContentType = 'thread' | 'ea' | 'indicator' | 'article' | 'source_code' | 'broker';

interface HotItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  categorySlug: string;
  views: number;
  createdAt: string;
  normalizedScore: number;
  author: {
    id?: string;
    username?: string;
    profileImageUrl?: string;
  };
  // Type-specific fields
  replyCount?: number;
  priceCoins?: number;
  isFree?: boolean;
  purchaseCount?: number;
  reviewCount?: number;
  overallRating?: number;
}

interface HotItemsData {
  items: HotItem[];
  lastUpdated: string;
}

async function getHotItems(): Promise<HotItemsData> {
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  console.log('[API Config] Internal API URL:', apiUrl);
  const url = `${apiUrl}/api/hot?limit=50`;
  console.log('[SSR Fetch] Fetching:', url);
  
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hot items');
  }

  return res.json();
}

async function getPlatformStats() {
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  const url = `${apiUrl}/api/stats`;
  
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    return { totalThreads: 0, totalMembers: 0, totalPosts: 0, activeToday: 0 };
  }

  return res.json();
}

export const metadata = {
  title: "What's Hot - Trending Content | YoForex",
  description: "Discover the hottest trading discussions, EAs, indicators, brokers, and content from the YoForex community.",
};

export default async function HotPage() {
  const [data, stats] = await Promise.all([
    getHotItems(),
    getPlatformStats()
  ]);
  
  const hotItems = data.items || [];

  // Calculate content type breakdown
  const typeBreakdown = hotItems.reduce((acc, item) => {
    const key = item.type;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get rank badge style based on position - more subtle with transparency
  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-500/20 to-orange-600/20 text-foreground border border-orange-300/30 dark:border-orange-600/30";
    if (index === 1) return "bg-gradient-to-br from-gray-400/15 to-gray-600/15 text-foreground border border-gray-300/30 dark:border-gray-600/30";
    if (index === 2) return "bg-gradient-to-br from-amber-600/20 to-amber-800/20 text-foreground border border-amber-300/30 dark:border-amber-600/30";
    return "bg-muted/40 text-foreground border border-border/50";
  };

  // Get content type badge and icon
  const getContentTypeInfo = (type: ContentType) => {
    switch (type) {
      case 'thread':
        return { label: 'Discussion', icon: MessageSquare, color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300/30 dark:border-blue-600/30' };
      case 'ea':
        return { label: 'EA', icon: ShoppingCart, color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-300/30 dark:border-green-600/30' };
      case 'indicator':
        return { label: 'Indicator', icon: TrendingUp, color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300/30 dark:border-purple-600/30' };
      case 'article':
        return { label: 'Article', icon: Eye, color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-300/30 dark:border-indigo-600/30' };
      case 'source_code':
        return { label: 'Code', icon: ShoppingCart, color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-300/30 dark:border-cyan-600/30' };
      case 'broker':
        return { label: 'Broker', icon: Star, color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-300/30 dark:border-yellow-600/30' };
      default:
        return { label: 'Content', icon: Eye, color: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-300/30 dark:border-gray-600/30' };
    }
  };

  // Get link URL based on content type
  const getItemLink = (item: HotItem) => {
    if (item.type === 'thread') return `/thread/${item.slug}`;
    if (item.type === 'broker') return `/brokers/${item.slug}`;
    return `/content/${item.slug}`;
  };

  // Get trending categories
  const categoryCount = hotItems.reduce((acc, item) => {
    acc[item.categorySlug] = (acc[item.categorySlug] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendingCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => ({ slug, count }));

  // Get top contributors (by number of hot items)
  const contributorCount = hotItems.reduce((acc, item) => {
    if (item.author.username) {
      acc[item.author.username] = (acc[item.author.username] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topContributors = Object.entries(contributorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([username, count]) => ({ username, count }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-500/70" />
              <h1 className="text-2xl font-bold text-foreground">
                What's Hot
              </h1>
            </div>
            
            <div className="w-[120px]" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/15">
                      <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{hotItems.length}</p>
                      <p className="text-xs text-muted-foreground">Trending Now</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/15">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{typeBreakdown.thread || 0}</p>
                      <p className="text-xs text-muted-foreground">Discussions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/15">
                      <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {(typeBreakdown.ea || 0) + (typeBreakdown.indicator || 0) + (typeBreakdown.article || 0) + (typeBreakdown.source_code || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Marketplace</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/15">
                      <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{typeBreakdown.broker || 0}</p>
                      <p className="text-xs text-muted-foreground">Brokers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-center">
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Trending content from the last 7 days - discussions, marketplace items, and brokers ranked by engagement
                </p>
              </CardContent>
            </Card>

            {/* Hot Items List */}
            <div className="space-y-3">
              {hotItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <TrendingDown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hot content at the moment. Check back soon!</p>
                </Card>
              ) : (
                hotItems.map((item, index) => {
                  const contentTypeInfo = getContentTypeInfo(item.type);
                  const Icon = contentTypeInfo.icon;
                  
                  return (
                    <Link key={item.id} href={getItemLink(item)} data-testid={`link-hot-${item.id}`}>
                      <Card className="group hover:border-orange-200/50 dark:hover:border-orange-800/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/3 to-red-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                        
                        <CardContent className="p-4">
                          <div className="relative flex items-start gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center text-base font-semibold ${getRankStyle(index)} transition-transform group-hover:scale-105`}>
                              {index + 1}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              <h3 
                                className="text-lg font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-orange-500/90 dark:group-hover:text-orange-400/80 transition-colors" 
                                data-testid={`text-hot-title-${item.id}`}
                              >
                                {item.title}
                              </h3>
                              
                              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                                <span className="truncate max-w-[150px]" data-testid={`text-hot-author-${item.id}`}>
                                  by {item.author?.username || "Unknown"}
                                </span>
                                <span className="text-border">•</span>
                                
                                {item.type === 'thread' && item.replyCount !== undefined && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="w-4 h-4" />
                                      <span>{item.replyCount} replies</span>
                                    </div>
                                    <span className="text-border">•</span>
                                  </>
                                )}
                                
                                {(item.type === 'ea' || item.type === 'indicator' || item.type === 'article' || item.type === 'source_code') && (
                                  <>
                                    {!item.isFree && item.priceCoins && (
                                      <>
                                        <div className="flex items-center gap-1">
                                          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">🪙 {item.priceCoins} coins</span>
                                        </div>
                                        <span className="text-border">•</span>
                                      </>
                                    )}
                                    {item.isFree && (
                                      <>
                                        <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-700 dark:text-green-400">
                                          Free
                                        </Badge>
                                        <span className="text-border">•</span>
                                      </>
                                    )}
                                  </>
                                )}
                                
                                {item.type === 'broker' && item.overallRating !== undefined && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-semibold">{(item.overallRating / 100).toFixed(1)}/5</span>
                                      <span className="text-muted-foreground">({item.reviewCount} reviews)</span>
                                    </div>
                                    <span className="text-border">•</span>
                                  </>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span data-testid={`text-hot-views-${item.id}`}>
                                    {item.views?.toLocaleString() || 0} views
                                  </span>
                                </div>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs px-2 py-0.5 ${contentTypeInfo.color}`}
                                >
                                  <Icon className="w-3 h-3 mr-1" />
                                  {contentTypeInfo.label}
                                </Badge>
                                
                                <Badge 
                                  variant="outline" 
                                  className="text-xs px-2 py-0 bg-muted/50 border-border/50 hover:bg-muted transition-colors"
                                >
                                  {item.categorySlug}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex-shrink-0 self-start">
                              <Badge 
                                variant="secondary" 
                                className="text-xs px-2 py-1 bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-300/30 dark:border-orange-600/30"
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Hot
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>

            {hotItems.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  Showing {hotItems.length} trending item{hotItems.length !== 1 ? 's' : ''} from the last 7 days
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - 4 columns */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trending Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-orange-500" />
                  Trending Categories
                </CardTitle>
                <CardDescription>
                  Most active categories right now
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {trendingCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No trending categories
                  </p>
                ) : (
                  trendingCategories.map(({ slug, count }) => (
                    <Link key={slug} href={`/category/${slug}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted hover-elevate active-elevate-2 cursor-pointer transition-colors">
                        <span className="text-sm font-medium truncate">{slug}</span>
                        <Badge variant="secondary" className="ml-2">
                          {count}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Top Contributors
                </CardTitle>
                <CardDescription>
                  Most hot items this week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topContributors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contributors yet
                  </p>
                ) : (
                  topContributors.map(({ username, count }, index) => (
                    <Link key={username} href={`/profile/${username}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted hover-elevate active-elevate-2 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-700 dark:text-gray-400' :
                            index === 2 ? 'bg-amber-600/20 text-amber-700 dark:text-amber-400' :
                            'bg-muted/60 text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium truncate">{username}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {count}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Platform Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Platform Stats
                </CardTitle>
                <CardDescription>
                  Overall activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Total Threads</span>
                  </div>
                  <span className="font-semibold">{stats.totalThreads?.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Community Members</span>
                  </div>
                  <span className="font-semibold">{stats.totalMembers?.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Total Replies</span>
                  </div>
                  <span className="font-semibold">{stats.totalPosts?.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Active Today</span>
                  </div>
                  <span className="font-semibold">{stats.activeToday?.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-300/30 dark:border-orange-600/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">How It Works</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Content is ranked by engagement over the last 7 days. This includes forum discussions, marketplace items, and broker reviews - all competing fairly for your attention!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
