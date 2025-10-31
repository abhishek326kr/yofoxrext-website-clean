'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Coins, BookOpen, UserPlus } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function DailyEarnings() {
  const { toast } = useToast();

  // Fetch today's activity
  const { data: activity } = useQuery<{
    activeMinutes: number;
    coinsEarned: number;
    canEarnMore: boolean;
  }>({
    queryKey: ['/api/activity/today'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch journal status
  const { data: journalStatus } = useQuery<{
    canPost: boolean;
    nextAvailable: string | null;
  }>({
    queryKey: ['/api/journal/check'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/journal/check');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch suggested users
  const { data: suggestedUsers } = useQuery<Array<{
    id: string;
    username: string;
    profileImageUrl: string | null;
    rank: number;
  }>>({
    queryKey: ['/api/users/suggested'],
    queryFn: async () => {
      const response = await fetch('/api/users/suggested?limit=3');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', '/api/user/follow', { followingId: userId });
    },
    onSuccess: () => {
      toast({
        title: '✅ Followed!',
        description: 'You are now following this user.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/suggested'] });
    },
  });

  const handleJournalPost = () => {
    // For now, just show coming soon message
    toast({
      title: 'Trading Journal',
      description: 'Journal posting feature coming soon! Share your daily P&L and trading insights.',
    });
  };

  const activeMinutes = activity?.activeMinutes || 0;
  const coinsEarned = activity?.coinsEarned || 0;
  const progressPercent = (activeMinutes / 100) * 100;
  const isActivityComplete = activeMinutes >= 100;
  const canPostJournal = journalStatus?.canPost ?? false;

  return (
    <Card className="shadow-sm" data-testid="card-daily-earnings">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-500" />
          Daily Earnings
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Activity Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isActivityComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" data-testid="icon-activity-complete" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" data-testid="icon-activity-incomplete" />
              )}
              <span className="text-sm font-medium">Stay Active</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-sm font-semibold" data-testid="text-coins-earned">
                {coinsEarned}/20
              </span>
            </div>
          </div>
          
          <Progress 
            value={progressPercent} 
            className="h-2" 
            data-testid="progress-activity"
          />
          
          <p className="text-xs text-muted-foreground" data-testid="text-activity-status">
            {isActivityComplete 
              ? '✓ Maximum activity reached today!' 
              : `${activeMinutes}/100 active minutes`
            }
          </p>
        </div>

        {/* Journal Posting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!canPostJournal ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" data-testid="icon-journal-complete" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" data-testid="icon-journal-incomplete" />
              )}
              <span className="text-sm font-medium">Trading Journal</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-sm font-semibold">5</span>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={!canPostJournal}
            onClick={handleJournalPost}
            data-testid="button-post-journal"
          >
            <BookOpen className="w-3 h-3 mr-2" />
            {canPostJournal ? 'Post Today\'s Journal' : 'Posted Today ✓'}
          </Button>
        </div>

        {/* Suggested Users */}
        {suggestedUsers && suggestedUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Connect with traders
            </p>
            <div className="space-y-2">
              {suggestedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2"
                  data-testid={`user-suggestion-${user.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rank #{user.rank}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => followMutation.mutate(user.id)}
                    disabled={followMutation.isPending}
                    data-testid={`button-follow-${user.id}`}
                  >
                    <UserPlus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
