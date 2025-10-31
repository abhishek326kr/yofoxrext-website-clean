"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, TrendingUp, CheckCircle2, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ForumThread } from "../../shared/schema";
import { RefreshButton } from "./RefreshButton";

interface HighlightThread {
  id: string;
  title: string;
  category: string;
  author: string;
  replies: number;
  views: number;
  coins?: number;
  isAnswered?: boolean;
  lastActivity: Date;
}

interface WeekHighlightsProps {
  newThreads?: HighlightThread[];
  trendingThreads?: HighlightThread[];
  solvedThreads?: HighlightThread[];
}

const REFERENCE_DATE = new Date('2025-10-28T12:00:00Z');

const defaultNewThreads: HighlightThread[] = [
  {
    id: "1",
    title: "XAUUSD CPI/NFP handling: disable or reduce lots?",
    category: "Strategy Discussion",
    author: "NewsTrader",
    replies: 12,
    views: 890,
    coins: 23,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 30 * 60 * 1000)
  },
  {
    id: "2",
    title: "BTCUSD weekend behavior: do you pause?",
    category: "Performance Reports",
    author: "CryptoWeekend",
    replies: 8,
    views: 456,
    coins: 15,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 1 * 60 * 60 * 1000)
  },
  {
    id: "3",
    title: "Gold trailing at 1R/2R/3R steps: best size?",
    category: "EA Development (MQL4/5)",
    author: "TrailMaster",
    replies: 6,
    views: 234,
    coins: 12,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 2 * 60 * 60 * 1000)
  }
];

const defaultTrendingThreads: HighlightThread[] = [
  {
    id: "4",
    title: "EURUSD M5 London session: stable set-files",
    category: "EA Library",
    author: "LondonTrader",
    replies: 89,
    views: 5670,
    coins: 92,
    isAnswered: true,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 3 * 60 * 60 * 1000)
  },
  {
    id: "5",
    title: "Gold H1 swing: 1:2 RRR with ATR stop",
    category: "Performance Reports",
    author: "SwingMaster",
    replies: 67,
    views: 4320,
    coins: 78,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 4 * 60 * 60 * 1000)
  },
  {
    id: "6",
    title: "New to EA trading - where to start?",
    category: "Beginner Questions",
    author: "NewbieTom",
    replies: 134,
    views: 8900,
    coins: 56,
    isAnswered: true,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 5 * 60 * 60 * 1000)
  }
];

const defaultSolvedThreads: HighlightThread[] = [
  {
    id: "7",
    title: "How to properly backtest an EA in MT4?",
    category: "Technical Support",
    author: "LearningTrader",
    replies: 45,
    views: 3210,
    coins: 41,
    isAnswered: true,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 6 * 60 * 60 * 1000)
  },
  {
    id: "8",
    title: "Symbol suffix issues (.a, .pro, .ecn) fix?",
    category: "Technical Support",
    author: "SymbolFixer",
    replies: 28,
    views: 1890,
    coins: 34,
    isAnswered: true,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 7 * 60 * 60 * 1000)
  },
  {
    id: "9",
    title: "Best scalping settings for EURUSD M5",
    category: "Strategy Discussion",
    author: "ScalpGuru",
    replies: 52,
    views: 2670,
    coins: 48,
    isAnswered: true,
    lastActivity: new Date(REFERENCE_DATE.getTime() - 8 * 60 * 60 * 1000)
  }
];

export default function WeekHighlights({ 
  newThreads = defaultNewThreads, 
  trendingThreads = defaultTrendingThreads, 
  solvedThreads = defaultSolvedThreads 
}: WeekHighlightsProps) {
  const router = useRouter();
  const [itemsLimit, setItemsLimit] = useState<number>(10);

  // Fetch real trending threads from API (no auto-refresh for performance)
  const { data: trendingData, refetch: refetchTrending } = useQuery<ForumThread[]>({
    queryKey: ['/api/threads', { sortBy: 'trending', limit: itemsLimit }],
    queryFn: async () => {
      const res = await fetch(`/api/threads?sortBy=trending&limit=${itemsLimit}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch trending threads');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch newest threads (no auto-refresh for performance)
  const { data: newData, refetch: refetchNew } = useQuery<ForumThread[]>({
    queryKey: ['/api/threads', { sortBy: 'newest', limit: itemsLimit }],
    queryFn: async () => {
      const res = await fetch(`/api/threads?sortBy=newest&limit=${itemsLimit}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch newest threads');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch solved threads (answered) (no auto-refresh for performance)
  const { data: solvedData, refetch: refetchSolved } = useQuery<ForumThread[]>({
    queryKey: ['/api/threads', { sortBy: 'answered', limit: itemsLimit }],
    queryFn: async () => {
      const res = await fetch(`/api/threads?sortBy=answered&limit=${itemsLimit}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch answered threads');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refresh all tabs
  const handleRefreshAll = async () => {
    await Promise.all([
      refetchNew(),
      refetchTrending(),
      refetchSolved()
    ]);
  };

  // Store full thread data for navigation
  const threadsWithSlug = new Map<string, ForumThread>();
  
  newData?.forEach(thread => threadsWithSlug.set(thread.id, thread));
  trendingData?.forEach(thread => threadsWithSlug.set(thread.id, thread));
  solvedData?.forEach(thread => threadsWithSlug.set(thread.id, thread));

  // Convert API thread data to HighlightThread format
  const convertToHighlightThread = (thread: ForumThread): HighlightThread => {
    // Safely handle lastActivityAt - use createdAt as fallback
    let lastActivity: Date;
    try {
      lastActivity = thread.lastActivityAt 
        ? new Date(thread.lastActivityAt) 
        : new Date(thread.createdAt);
      // Check if date is valid
      if (isNaN(lastActivity.getTime())) {
        lastActivity = new Date(thread.createdAt);
      }
    } catch {
      lastActivity = new Date(thread.createdAt);
    }

    return {
      id: thread.id,
      title: thread.title,
      category: thread.categorySlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      author: thread.authorId, // Will show authorId until we have user names
      replies: thread.replyCount,
      views: thread.views,
      coins: 0, // Not tracked in current schema
      isAnswered: false, // TODO: Check if thread has accepted replies
      lastActivity
    };
  };

  // Use real API data if available AND not empty, fallback to defaults
  const displayNewThreads = newData && newData.length > 0 ? newData.map(convertToHighlightThread) : newThreads;
  const displayTrendingThreads = trendingData && trendingData.length > 0 ? trendingData.map(convertToHighlightThread) : trendingThreads;
  const displaySolvedThreads = solvedData && solvedData.length > 0 ? solvedData.map(convertToHighlightThread) : solvedThreads;

  const handleThreadClick = (thread: HighlightThread) => {
    // Try to get the fullUrl or slug from the full thread data
    const fullThread = threadsWithSlug.get(thread.id);
    const fullUrl = (fullThread as any)?.fullUrl;
    if (fullUrl) {
      router.push(fullUrl);
    } else if (fullThread?.slug) {
      router.push(`/thread/${fullThread.slug}`);
    } else {
      // Fallback to ID-based navigation (will need backend support)
      router.push(`/thread/${thread.id}`);
    }
  };

  const renderThreadList = (threads: HighlightThread[]) => (
    <div className="space-y-0 divide-y divide-border/40 max-h-[600px] overflow-y-auto custom-scrollbar">
      {threads.map((thread, index) => (
        <div 
          key={thread.id} 
          className="group py-4 px-3 -mx-3 rounded-lg hover:bg-muted/40 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200" 
          data-testid={`highlight-thread-${thread.id}`}
          onClick={() => handleThreadClick(thread)}
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Category badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary transition-colors"
                  data-testid={`badge-category-${thread.id}`}
                >
                  {thread.category}
                </Badge>
                {thread.isAnswered && (
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400" data-testid={`badge-solved-${thread.id}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Solved</span>
                  </div>
                )}
              </div>

              {/* Thread title */}
              <h4 
                className="text-[15px] font-semibold leading-snug line-clamp-1 group-hover:text-primary transition-colors" 
                data-testid={`text-title-${thread.id}`}
              >
                {thread.title}
              </h4>

              {/* Metadata - smaller ID shown subtly */}
              <div className="text-[11px] text-muted-foreground/80 font-mono truncate">
                {thread.id}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-500/70" />
                  <span className="font-medium" data-testid={`text-replies-${thread.id}`}>
                    {thread.replies}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-purple-500/70" />
                  <span className="font-medium" data-testid={`text-views-${thread.id}`}>
                    {thread.views.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500/70" />
                  <span suppressHydrationWarning>{formatDistanceToNow(thread.lastActivity, { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {/* Solved count or coins badge */}
            {thread.isAnswered ? (
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 transition-transform group-hover:scale-105">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400 leading-none">
                    0
                  </div>
                </div>
              </div>
            ) : thread.coins && thread.coins > 0 ? (
              <Badge 
                variant="secondary" 
                className="text-xs font-semibold bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                data-testid={`badge-coins-${thread.id}`}
              >
                +{thread.coins}
              </Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card data-testid="card-week-highlights" className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-5 pb-4 border-b bg-gradient-to-br from-primary/5 to-primary/0">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">This Week's Highlights</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Show:</span>
              <select 
                value={itemsLimit} 
                onChange={(e) => setItemsLimit(Number(e.target.value))}
                className="h-7 px-2 rounded-md border border-input bg-background text-xs hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 cursor-pointer transition-colors"
                data-testid="select-limit"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <RefreshButton 
              onRefresh={handleRefreshAll}
              size="icon"
              variant="ghost"
            />
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-muted/30">
            <TabsTrigger 
              value="new" 
              data-testid="tab-new"
              className="rounded-none data-[state=active]:shadow-none"
            >
              New
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              data-testid="tab-trending"
              className="rounded-none data-[state=active]:shadow-none"
            >
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="solved" 
              data-testid="tab-solved"
              className="rounded-none data-[state=active]:shadow-none"
            >
              Solved
            </TabsTrigger>
          </TabsList>

          <div className="px-5 py-1">
            <TabsContent value="new" className="mt-0">
              {renderThreadList(displayNewThreads)}
            </TabsContent>
            <TabsContent value="trending" className="mt-0">
              {renderThreadList(displayTrendingThreads)}
            </TabsContent>
            <TabsContent value="solved" className="mt-0">
              {renderThreadList(displaySolvedThreads)}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
