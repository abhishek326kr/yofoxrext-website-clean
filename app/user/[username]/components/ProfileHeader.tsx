"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, UserMinus, MessageSquare, Share2, MapPin, Calendar, ExternalLink } from "lucide-react";
import type { User as UserType } from '@shared/schema';

interface ProfileHeaderProps {
  user: UserType;
  badges?: Array<{ id: string; name: string; description: string }>;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  isLoading?: boolean;
  onFollowToggle?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  stats?: {
    followers: number;
    following: number;
    posts: number;
    content: number;
  };
}

export function ProfileHeader({
  user,
  badges = [],
  isFollowing = false,
  isOwnProfile = false,
  isLoading = false,
  onFollowToggle,
  onMessage,
  onShare,
  stats = { followers: 0, following: 0, posts: 0, content: 0 }
}: ProfileHeaderProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/10" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-6 -mt-16 relative">
            <Skeleton className="w-32 h-32 rounded-full border-4 border-background" />
            <div className="flex-1 pt-16 sm:pt-0 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const coverGradient = "bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10";

  return (
    <Card className="overflow-hidden" data-testid="profile-header">
      <div className={`h-48 ${coverGradient} relative`} data-testid="cover-photo">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row gap-6 -mt-16 relative">
          <Avatar 
            className="w-32 h-32 border-4 border-background shadow-lg" 
            data-testid="avatar-user"
          >
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-16 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold" data-testid="text-username">
                  {user.username}
                </h1>
                
                {badges.length > 0 && (
                  <div data-testid="user-badges">
                    <BadgeDisplay badges={badges} size="md" />
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {user.createdAt && (
                    <div className="flex items-center gap-1" data-testid="text-joined-date">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  {user.reputationScore !== undefined && user.reputationScore > 0 && (
                    <Badge variant="outline" data-testid="badge-reputation">
                      {user.reputationScore.toLocaleString()} Reputation
                    </Badge>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={onFollowToggle}
                    data-testid={isFollowing ? "button-unfollow" : "button-follow"}
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
                    variant="outline" 
                    onClick={onMessage}
                    data-testid="button-message"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={onShare}
                    data-testid="button-share"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center" data-testid="stat-posts">
                <div className="text-2xl font-bold">{stats.posts}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div className="text-center" data-testid="stat-followers">
                <div className="text-2xl font-bold">{stats.followers}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center" data-testid="stat-following">
                <div className="text-2xl font-bold">{stats.following}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
              <div className="text-center" data-testid="stat-content">
                <div className="text-2xl font-bold">{stats.content}</div>
                <div className="text-sm text-muted-foreground">Content</div>
              </div>
            </div>

            {(user.youtubeUrl || user.instagramHandle || user.myfxbookLink || user.telegramHandle) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {user.youtubeUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    data-testid="link-youtube"
                  >
                    <a href={user.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      YouTube
                    </a>
                  </Button>
                )}
                {user.instagramHandle && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    data-testid="link-instagram"
                  >
                    <a 
                      href={`https://instagram.com/${user.instagramHandle.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Instagram
                    </a>
                  </Button>
                )}
                {user.myfxbookLink && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    data-testid="link-myfxbook"
                  >
                    <a href={user.myfxbookLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      MyFxBook
                    </a>
                  </Button>
                )}
                {user.telegramHandle && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    data-testid="link-telegram"
                  >
                    <a 
                      href={`https://t.me/${user.telegramHandle.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Telegram
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
