"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { 
  User, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  Shield, 
  Star,
  Coins,
  Trophy,
  FileText,
  Youtube,
  Instagram,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User as UserType, Content, ForumThread } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";

interface UserProfileClientProps {
  username: string;
  initialUser: UserType | undefined;
  initialBadges: Array<{ id: string; name: string; description: string }>;
  initialContent: Content[];
  initialThreads: ForumThread[];
}

export default function UserProfileClient({
  username,
  initialUser,
  initialBadges,
  initialContent,
  initialThreads,
}: UserProfileClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user: currentUser } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("follow this user");
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");

  // Use initial data for user query
  const { data: userData } = useQuery<UserType>({
    queryKey: ['/api/users/username', username],
    initialData: initialUser,
    enabled: !!username,
  });

  // Use initial data for badges query
  const { data: badges, isError } = useQuery<Array<{ id: string; name: string; description: string }>>({
    queryKey: ['/api/users', userData?.id, 'badges'],
    initialData: initialBadges,
    enabled: !!userData?.id,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Use initial data for content query
  const { data: userContent } = useQuery<Content[]>({
    queryKey: ['/api/user', userData?.id, 'content'],
    initialData: initialContent,
    enabled: !!userData?.id,
  });

  // Use initial data for threads query
  const { data: userThreads } = useQuery<ForumThread[]>({
    queryKey: ['/api/user', userData?.id, 'threads'],
    initialData: initialThreads,
    enabled: !!userData?.id,
  });

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
    },
    onError: (error: Error) => {
      toast({
        title: "Unfollow failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Error state - user not found
  if (!userData) {
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

  // Mock data for followers/following/activity (keep as in React version)
  const mockUser = {
    username: userData.username || "Unknown",
    isVerifiedTrader: true,
    totalCoins: 0, // TODO: Fetch from /api/user/{userId}/coins
    weeklyEarned: 340,
    rank: 15,
    reputation: userData.reputationScore || 0,
    joinedDate: userData.createdAt ? new Date(userData.createdAt) : new Date(),
    followerCount: 234,
    followingCount: 89,
    postsCount: userThreads?.length || 0,
    uploadsCount: userContent?.length || 0,
    youtubeUrl: "https://youtube.com/c/traderjohn",
    instagramHandle: "@traderjohn_fx",
    myfxbookLink: "https://www.myfxbook.com/members/traderjohn/portfolio",
  };

  const mockFollowers = Array.from({ length: 8 }, (_, i) => ({
    id: `follower-${i}`,
    username: `User${i + 1}`,
    reputation: Math.floor(Math.random() * 3000),
    isVerified: Math.random() > 0.7,
  }));

  const mockFollowing = Array.from({ length: 5 }, (_, i) => ({
    id: `following-${i}`,
    username: `TopTrader${i + 1}`,
    reputation: Math.floor(Math.random() * 5000) + 1000,
    isVerified: Math.random() > 0.5,
  }));

  const mockActivity = Array.from({ length: 6 }, (_, i) => ({
    id: `activity-${i}`,
    type: i % 3 === 0 ? "post" : i % 3 === 1 ? "upload" : "comment",
    title: `${i % 3 === 0 ? "New Thread: " : i % 3 === 1 ? "Uploaded: " : "Commented on: "}XAUUSD Trading Strategy ${i + 1}`,
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    category: "Strategy Discussion",
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarFallback className="text-3xl">{mockUser.username[0]}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold mb-2" data-testid="text-username">
                    {mockUser.username}
                  </h1>
                  {badges && !isError && Array.isArray(badges) && badges.length > 0 && (
                    <div className="mb-3" data-testid="profile-badges">
                      <BadgeDisplay badges={badges} size="md" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span data-testid="text-reputation">{mockUser.reputation} reputation</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <Button 
                    className="w-full" 
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => requireAuth(() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate())}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    data-testid="button-follow-toggle"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    onClick={() => requireAuth(() => router.push(`/messages?user=${username}`))}
                    data-testid="button-send-message"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center py-4 border-y">
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-posts-count">{mockUser.postsCount}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-followers-count">{mockUser.followerCount}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-following-count">{mockUser.followingCount}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rank</span>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="font-medium" data-testid="text-rank">#{mockUser.rank}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Coins</span>
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-primary" />
                          <span className="font-medium" data-testid="text-coins">{mockUser.totalCoins.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Uploads</span>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium" data-testid="text-uploads">{mockUser.uploadsCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(mockUser.youtubeUrl || mockUser.instagramHandle || mockUser.myfxbookLink) && (
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="font-semibold text-sm">Social Links</h3>
                      <div className="space-y-2">
                        {mockUser.youtubeUrl && (
                          <a 
                            href={mockUser.youtubeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-primary"
                            data-testid="link-youtube"
                          >
                            <Youtube className="w-4 h-4 text-red-600" />
                            YouTube Channel
                          </a>
                        )}
                        {mockUser.instagramHandle && (
                          <a 
                            href={`https://instagram.com/${mockUser.instagramHandle.replace('@', '')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-primary"
                            data-testid="link-instagram"
                          >
                            <Instagram className="w-4 h-4 text-pink-600" />
                            {mockUser.instagramHandle}
                          </a>
                        )}
                        {mockUser.myfxbookLink && (
                          <a 
                            href={mockUser.myfxbookLink}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-primary"
                            data-testid="link-myfxbook"
                          >
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            Myfxbook Profile
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="activity" data-testid="tab-activity">
                      <FileText className="w-4 h-4 mr-2" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="followers" data-testid="tab-followers">
                      <User className="w-4 h-4 mr-2" />
                      Followers
                    </TabsTrigger>
                    <TabsTrigger value="following" data-testid="tab-following">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Following
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab}>
                  <TabsContent value="activity" className="space-y-4">
                    {mockActivity.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 border rounded-lg hover-elevate cursor-pointer"
                        data-testid={`activity-${item.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{item.title}</h4>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.timestamp.toLocaleDateString()} • {item.type}
                        </p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="followers" className="space-y-3">
                    {mockFollowers.map((follower) => (
                      <div 
                        key={follower.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`follower-${follower.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{follower.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{follower.username}</span>
                              {follower.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {follower.reputation} reputation
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`button-view-profile-${follower.id}`}>
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="following" className="space-y-3">
                    {mockFollowing.map((following) => (
                      <div 
                        key={following.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`following-${following.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{following.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{following.username}</span>
                              {following.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {following.reputation} reputation
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`button-view-profile-${following.id}`}>
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}
