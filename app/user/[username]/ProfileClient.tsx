"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

// Import all 5 profile components
import { 
  ProfileHeader,
  StatsCards,
  BadgesWall,
  ContentGrid,
  ReviewsSection
} from './components';

import type { User as UserType, Content } from '@shared/schema';

interface ProfileData {
  user: UserType;
  isFollowing?: boolean;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    youtubeUrl?: string;
    instagramHandle?: string;
    telegramHandle?: string;
    myfxbookLink?: string;
  };
  badges: Array<{ id: string; name: string; description: string }>;
  content: Content[];
  stats: {
    followers: number;
    following: number;
    posts: number;
    content: number;
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
    totalDownloads: number;
    revenueChange?: number;
    salesChange?: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    review: string;
    createdAt: Date | string;
    contentTitle?: string;
    userId?: string;
    username?: string;
    helpful?: number;
    sellerResponse?: {
      message: string;
      date: Date | string;
    };
  }>;
  ratingBreakdown?: {
    averageRating: number;
    totalReviews: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

interface ProfileClientProps {
  username: string;
  initialData?: ProfileData | undefined;
}

export default function ProfileClient({
  username,
  initialData = undefined,
}: ProfileClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user: currentUser } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("follow this user");
  const [isFollowing, setIsFollowing] = useState(initialData?.isFollowing || false);

  // Fetch profile data using TanStack Query
  const { 
    data: profileData, 
    isLoading,
    isError,
    error 
  } = useQuery<ProfileData>({
    queryKey: ['/api/user', username, 'profile'],
    initialData: initialData,
    enabled: !!username,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const userData = profileData?.user;
  const isOwnProfile = currentUser?.username === username;

  // Sync isFollowing state with profileData when it loads
  useEffect(() => {
    if (profileData?.isFollowing !== undefined) {
      setIsFollowing(profileData.isFollowing);
    }
  }, [profileData?.isFollowing]);

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error("You must be logged in to follow");
      if (!userData?.id) throw new Error("User not loaded");
      // Server gets followerId from authenticated session, not from body
      const res = await apiRequest("POST", `/api/users/${userData.id}/follow`, {});
      return res.json();
    },
    onSuccess: () => {
      setIsFollowing(true);
      toast({
        title: "Success!",
        description: `You are now following ${userData?.username}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user', username, 'profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Follow failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error("You must be logged in to unfollow");
      if (!userData?.id) throw new Error("User not loaded");
      // Server gets followerId from authenticated session, not from body
      const res = await apiRequest("DELETE", `/api/users/${userData.id}/unfollow`, {});
      return res.json();
    },
    onSuccess: () => {
      setIsFollowing(false);
      toast({
        title: "Success!",
        description: `You unfollowed ${userData?.username}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user', username, 'profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Unfollow failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFollowToggle = () => {
    requireAuth(() => {
      if (isFollowing) {
        unfollowMutation.mutate();
      } else {
        followMutation.mutate();
      }
    });
  };

  const handleMessage = () => {
    requireAuth(() => {
      router.push(`/messages?user=${username}`);
    });
  };

  const handleShare = async () => {
    const profileUrl = window.location.href;
    const shareTitle = `${username} - Forex Trader | YoForex`;
    const shareText = `Check out ${username}'s profile on YoForex. ${profileData?.stats?.followers || 0} followers, ${profileData?.stats?.content || 0} products, ${profileData?.stats?.totalSales || 0} sales.`;
    
    // Track share event
    try {
      // Send tracking event to backend
      apiRequest("POST", "/api/analytics/track", {
        event: "profile_share",
        properties: {
          sharedUsername: username,
          sharedUserId: userData?.id,
          // @ts-ignore - Browser compatibility check
          shareMethod: typeof navigator !== 'undefined' && 'share' in navigator ? "native" : "clipboard",
          viewerUsername: currentUser?.username || "guest",
          url: profileUrl,
        }
      }).catch(() => {}); // Don't block share if tracking fails
      
      // Google Analytics tracking (if available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'share', {
          method: typeof navigator !== 'undefined' && 'share' in navigator ? 'native' : 'clipboard',
          content_type: 'profile',
          item_id: username,
        });
      }
    } catch (error) {
      console.log('Tracking error:', error);
    }
    
    // Perform the actual share
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: profileUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Profile shared with your contacts",
        });
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as any)?.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      // Fallback to clipboard copy
      try {
        await (navigator as any).clipboard.writeText(profileUrl);
        toast({
          title: "Link copied!",
          description: "Profile link copied to clipboard - share it anywhere!",
        });
      } catch (error) {
        // If no clipboard API, show the URL for manual copying
        toast({
          title: "Share this profile",
          description: profileUrl,
        });
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
        <EnhancedFooter />
      </div>
    );
  }

  // Error state - user not found
  if (isError || !profileData || !userData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The user "{username}" doesn't exist or has been removed.
              </p>
              <Link href="/members">
                <Button>Browse Members</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <EnhancedFooter />
      </div>
    );
  }

  const { badges = [], content = [], stats, reviews = [], ratingBreakdown } = profileData;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid gap-8 lg:gap-10">
          {/* Profile Header - Full Width with better spacing */}
          <section className="w-full">
            <ProfileHeader
              user={userData}
              badges={badges}
              isFollowing={isFollowing}
              isOwnProfile={isOwnProfile}
              onFollowToggle={handleFollowToggle}
              onMessage={handleMessage}
              onShare={handleShare}
              stats={{
                followers: stats?.followers || 0,
                following: stats?.following || 0,
                posts: stats?.posts || 0,
                content: stats?.content || 0,
              }}
            />
          </section>

          {/* Main Content Grid with Responsive Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Stats & Badges (1/3 width on desktop) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Cards - Compact view */}
              <section>
                <StatsCards
                  stats={{
                    totalRevenue: stats?.totalRevenue || 0,
                    totalSales: stats?.totalSales || 0,
                    averageRating: stats?.averageRating || 0,
                    followers: stats?.followers || 0,
                    contentCount: stats?.content || 0,
                    totalDownloads: stats?.totalDownloads || 0,
                    revenueChange: stats?.revenueChange,
                    salesChange: stats?.salesChange,
                  }}
                />
              </section>

              {/* Badges Wall - Compact view */}
              {badges.length > 0 && (
                <section>
                  <BadgesWall earnedBadges={badges} />
                </section>
              )}
            </div>

            {/* Right Column - Content & Reviews (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Content Grid - Main focus area */}
              {content.length > 0 && (
                <section>
                  <ContentGrid content={content} />
                </section>
              )}

              {/* Reviews Section - Secondary focus */}
              {reviews.length > 0 && (
                <section>
                  <ReviewsSection
                    reviews={reviews}
                    ratingBreakdown={ratingBreakdown}
                  />
                </section>
              )}
              
              {/* Empty state if no content or reviews */}
              {content.length === 0 && reviews.length === 0 && (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground text-lg">
                      No products or reviews yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isOwnProfile 
                        ? "Start sharing your trading tools to build your profile" 
                        : `${username} hasn't shared any products yet`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}
