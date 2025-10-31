"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, TrendingUp, Eye, Clock, ShoppingCart, Star, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { formatDistanceToNow } from "date-fns";
import { RefreshButton } from "./RefreshButton";

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

export default function WhatsHot() {
  // Fetch hot items on mount, no auto-refresh for performance
  const { data, isLoading, refetch } = useRealtimeUpdates<HotItemsData>('/api/hot?limit=5', { enabled: true, interval: 0 });

  // Hide component when loading or no items
  if (isLoading && !data) {
    return null;
  }

  const hotItems = data?.items || [];
  
  if (hotItems.length === 0) {
    return null;
  }

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
  const getItemLink = (item: HotItem & { fullUrl?: string }) => {
    if (item.fullUrl) return item.fullUrl;
    if (item.type === 'thread') return `/thread/${item.slug}`;
    if (item.type === 'broker') return `/brokers/${item.slug}`;
    return `/content/${item.slug}`;
  };

  return (
    <Card className="overflow-hidden" data-testid="card-whats-hot">
      {/* Header with subtle gradient background */}
      <CardHeader className="pb-4 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 dark:from-orange-500/3 dark:via-red-500/3 dark:to-pink-500/3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-xl">
            <Flame className="w-5 h-5 text-orange-500/70" />
            <span className="text-foreground font-semibold">
              What's Hot
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <RefreshButton 
              onRefresh={async () => { await refetch(); }}
              size="icon"
              variant="ghost"
            />
            <Link href="/hot" data-testid="link-see-all-hot">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-orange-500/80 hover:text-orange-600 dark:text-orange-400/70"
                data-testid="button-see-all-hot"
              >
                See All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-4">
        {hotItems.map((item, index) => {
          const contentTypeInfo = getContentTypeInfo(item.type);
          const Icon = contentTypeInfo.icon;
          
          return (
            <Link key={item.id} href={getItemLink(item)} data-testid={`link-hot-${item.id}`}>
              <div 
                className="group relative flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-orange-200/50 dark:hover:border-orange-800/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200"
                data-testid={`card-hot-${item.id}`}
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/3 to-red-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                
                {/* Ranking badge - subtle design */}
                <div className={`relative flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold ${getRankStyle(index)} transition-transform group-hover:scale-105`}>
                  {index + 1}
                </div>

                {/* Content Column */}
                <div className="relative flex-1 min-w-0 space-y-1.5">
                  {/* Title */}
                  <h4 
                    className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-orange-500/90 dark:group-hover:text-orange-400/80 transition-colors" 
                    data-testid={`text-hot-title-${item.id}`}
                  >
                    {item.title}
                  </h4>
                  
                  {/* Meta Row */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="truncate max-w-[120px]" data-testid={`text-hot-author-${item.id}`}>
                      by {item.author?.username || "Unknown"}
                    </span>
                    <span className="text-border">•</span>
                    
                    {/* Type-specific stats */}
                    {item.type === 'thread' && item.replyCount !== undefined && (
                      <>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
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
                              <span className="text-yellow-600 dark:text-yellow-400">🪙 {item.priceCoins}</span>
                            </div>
                            <span className="text-border">•</span>
                          </>
                        )}
                      </>
                    )}
                    
                    {item.type === 'broker' && item.overallRating !== undefined && (
                      <>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{(item.overallRating / 100).toFixed(1)}</span>
                        </div>
                        <span className="text-border">•</span>
                      </>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span data-testid={`text-hot-views-${item.id}`}>
                        {item.views?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bottom row: Time + Content Type + Category */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span suppressHydrationWarning>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                    
                    {/* Content Type Badge */}
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 ${contentTypeInfo.color}`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {contentTypeInfo.label}
                    </Badge>
                    
                    {/* Category Tag */}
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-0 bg-muted/50 border-border/50 hover:bg-muted transition-colors"
                    >
                      {item.categorySlug}
                    </Badge>
                  </div>
                </div>

                {/* Hot Badge - subtle design */}
                <div className="relative flex-shrink-0 self-start">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-300/30 dark:border-orange-600/30"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Hot
                  </Badge>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
