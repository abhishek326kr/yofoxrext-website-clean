"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import { CategoryTree } from "@/components/CategoryTree";
import ForumThreadCard from "@/components/ForumThreadCard";
import CoinBalance from "@/components/CoinBalance";
import Leaderboard from "@/components/Leaderboard";
import WeekHighlights from "@/components/WeekHighlights";
import TrustLevel from "@/components/TrustLevel";
import WhatsHot from "@/components/WhatsHot";
import TopSellers from "@/components/TopSellers";
import EnhancedFooter from "@/components/EnhancedFooter";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
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
  Shield,
  Download,
  CheckCircle,
  Coins,
  Eye,
  Target,
  FileText,
  AlertTriangle,
  Store,
  ClipboardList
} from "lucide-react";

// Icon mapping for category icons
const iconMap: Record<string, any> = {
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
};

interface HomeClientProps {
  initialStats?: any;
  initialCategories?: any[];
  initialThreads?: any[];
}

export default function HomeClient({ 
  initialStats, 
  initialCategories, 
  initialThreads 
}: HomeClientProps) {
  // Fetch top categories (no auto-refresh for performance)
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories/tree/top?limit=6'],
    initialData: initialCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch real threads (no auto-refresh for performance)
  const { data: threadsData, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['/api/threads'],
    initialData: initialThreads,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten category tree for use in CategoryTree component
  const categories = (categoriesData as any[] || []);

  // Create a map of categorySlug to category name for thread mapping
  const categoryMap = new Map(
    (categoriesData as any[] || []).map((cat: any) => [cat.slug, cat.name])
  );

  // Use real threads data and map category slug to category name
  // Only map threads if both threads and categories are loaded
  const recentThreads = (threadsData && categoriesData) 
    ? (threadsData as any[] || [])
        .slice(0, 8)
        .map((thread: any) => ({
          ...thread,
          category: categoryMap.get(thread.categorySlug) || thread.categorySlug || 'General Discussion',
          // Ensure required fields have defaults
          author: thread.author || { name: 'Anonymous', reputation: 0 },
          excerpt: thread.body?.substring(0, 200) || '',
          viewCount: thread.views || 0,
          coinsEarned: thread.coinsEarned || 0,
          isAnswered: thread.isAnswered || false,
          hasSetFile: thread.hasSetFile || false,
          hasBacktest: thread.hasBacktest || false,
          isLiveVerified: thread.isLiveVerified || false,
          lastActivity: thread.lastActivityAt ? new Date(thread.lastActivityAt) : new Date(),
        }))
    : [];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StatsBar initialStats={initialStats} />
      
      <main className="container max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          <aside className="lg:col-span-1 space-y-3 order-2 lg:order-1">
            <OnboardingChecklist />
            <CoinBalance />
            <TrustLevel />
          </aside>

          <div className="lg:col-span-2 space-y-3 sm:space-y-4 order-1 lg:order-2">
            <section>
              <WeekHighlights />
            </section>

            <section>
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Forum Categories</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Choose the right category for your discussion</p>
                </div>
                <Link 
                  href="/categories" 
                  className="text-xs sm:text-sm font-medium text-primary hover:underline shrink-0"
                  data-testid="link-see-all-categories"
                >
                  See All →
                </Link>
              </div>
              
              <CategoryTree categories={categories} limit={6} />
            </section>

            <section>
              <div className="mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Recent Discussions</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Latest active threads from the community</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {recentThreads.map((thread) => (
                  <ForumThreadCard key={thread.id} {...thread} />
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1 space-y-3 order-3">
            <WhatsHot />
            <TopSellers />
            <Leaderboard />
            
            <Card className="sticky top-24" id="important-links">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Important Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[600px] overflow-y-auto">
                <Link 
                  href="/guides/forum-rules" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-forum-rules"
                >
                  <BookOpen className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Forum Rules</span>
                </Link>
                <Link 
                  href="/guides/safe-download-guide" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-safe-download"
                >
                  <Download className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Safe Download Guide</span>
                </Link>
                <Link 
                  href="/guides/verified-brokers" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-verified-brokers"
                >
                  <CheckCircle className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Verified Brokers</span>
                </Link>
                <Link 
                  href="/guides/ea-coding-rules" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-ea-coding-rules"
                >
                  <Shield className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>EA Coding Rules</span>
                </Link>
                <Link 
                  href="/guides/how-to-earn-coins" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-earn-coins"
                >
                  <Coins className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>How to Earn Coins</span>
                </Link>
                <Link 
                  href="/guides/how-to-get-your-thread-seen" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-thread-visibility"
                >
                  <Eye className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Get Your Thread Seen</span>
                </Link>
                <Link 
                  href="/guides/how-to-rank-articles-blogs" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-rank-articles"
                >
                  <Target className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Rank Articles & Blogs</span>
                </Link>
                <Link 
                  href="/guides/how-to-rank-ea-publications" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-rank-ea"
                >
                  <TrendingUp className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Rank EA Publications</span>
                </Link>
                <Link 
                  href="/guides/new-member-quickstart" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-quickstart"
                >
                  <Rocket className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>New Member Quickstart</span>
                </Link>
                <Link 
                  href="/guides/report-a-scam" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-report-scam"
                >
                  <AlertTriangle className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Report a Scam</span>
                </Link>
                <Link 
                  href="/guides/badges-levels" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-badges"
                >
                  <Award className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Badges & Levels</span>
                </Link>
                <Link 
                  href="/guides/marketplace-seller-guide" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-seller-guide"
                >
                  <Store className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Marketplace Seller Guide</span>
                </Link>
                <Link 
                  href="/guides/template-beginner-thread" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-template-thread"
                >
                  <FileText className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Template: Beginner Thread</span>
                </Link>
                <Link 
                  href="/guides/template-ea-review" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-template-review"
                >
                  <ClipboardList className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Template: EA Review</span>
                </Link>
                <Link 
                  href="/guides/template-trading-journal" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-template-journal"
                >
                  <Activity className="w-4 h-4 text-primary dark:text-primary flex-shrink-0" />
                  <span>Template: Trading Journal</span>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
