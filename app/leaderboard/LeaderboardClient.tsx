"use client";

import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeDisplay } from "@/components/BadgeDisplay";

function LeaderBadges({ userId }: { userId: string }) {
  const { data: badges, isError } = useQuery<Array<{ id: string; name: string; description: string }>>({
    queryKey: ['/api/users', userId, 'badges'],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/badges`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch badges');
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isError || !badges) return null;
  return <BadgeDisplay badges={badges} size="sm" />;
}

type CoinsLeader = {
  userId: string;
  username: string;
  balance: number;
  rank: number;
};

type ContributorLeader = {
  userId: string;
  username: string;
  helpfulCount: number;
  acceptedCount: number;
  totalContributions: number;
  rank: number;
};

type SellerLeader = {
  userId: string;
  username: string;
  totalRevenue: number;
  salesCount: number;
  rank: number;
};

interface LeaderboardClientProps {
  initialCoinLeaders?: CoinsLeader[];
  initialContributors?: ContributorLeader[];
  initialSellers?: SellerLeader[];
}

export default function LeaderboardClient({
  initialCoinLeaders,
  initialContributors,
  initialSellers
}: LeaderboardClientProps) {
  const { data: coinLeaders, isLoading: loadingCoins } = useQuery<CoinsLeader[]>({
    queryKey: ['/api/leaderboards/coins'],
    initialData: initialCoinLeaders,
    queryFn: async () => {
      const res = await fetch('/api/leaderboards/coins', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch coin leaders');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: contributors, isLoading: loadingContributors } = useQuery<ContributorLeader[]>({
    queryKey: ['/api/leaderboards/contributors'],
    initialData: initialContributors,
    queryFn: async () => {
      const res = await fetch('/api/leaderboards/contributors', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch contributors');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: sellers, isLoading: loadingSellers } = useQuery<SellerLeader[]>({
    queryKey: ['/api/leaderboards/sellers'],
    initialData: initialSellers,
    queryFn: async () => {
      const res = await fetch('/api/leaderboards/sellers', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch sellers');
      return res.json();
    },
    refetchInterval: 30000,
  });

  function getRankBadge(rank: number) {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" data-testid="icon-rank-1" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" data-testid="icon-rank-2" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" data-testid="icon-rank-3" />;
    return <span className="text-muted-foreground text-sm" data-testid={`text-rank-${rank}`}>#{rank}</span>;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-leaderboards">Leaderboards</h1>
        <p className="text-muted-foreground" data-testid="text-leaderboard-description">
          Top performers in the YoForex community
        </p>
      </div>

      <Tabs defaultValue="coins" className="w-full">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-leaderboard">
          <TabsTrigger value="coins" data-testid="tab-coins">
            <DollarSign className="w-4 h-4 mr-2" />
            Top by Coins
          </TabsTrigger>
          <TabsTrigger value="contributors" data-testid="tab-contributors">
            <Users className="w-4 h-4 mr-2" />
            Top Contributors
          </TabsTrigger>
          <TabsTrigger value="sellers" data-testid="tab-sellers">
            <TrendingUp className="w-4 h-4 mr-2" />
            Top Sellers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coins" data-testid="content-coins">
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Coin Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCoins ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="loading-coins">
                  Loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {coinLeaders?.map(leader => (
                    <div
                      key={leader.userId}
                      className="flex items-center justify-between p-3 rounded-md hover-elevate"
                      data-testid={`leader-coins-${leader.rank}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 flex justify-center">
                          {getRankBadge(leader.rank)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium" data-testid={`username-${leader.userId}`}>
                              {leader.username}
                            </span>
                            <LeaderBadges userId={leader.userId} />
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`balance-${leader.userId}`}>
                        {leader.balance} coins
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributors" data-testid="content-contributors">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingContributors ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="loading-contributors">
                  Loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {contributors?.map(leader => (
                    <div
                      key={leader.userId}
                      className="flex items-center justify-between p-3 rounded-md hover-elevate"
                      data-testid={`leader-contributor-${leader.rank}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 flex justify-center">
                          {getRankBadge(leader.rank)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium" data-testid={`username-${leader.userId}`}>
                              {leader.username}
                            </span>
                            <LeaderBadges userId={leader.userId} />
                          </div>
                          <div className="text-xs text-muted-foreground" data-testid={`stats-${leader.userId}`}>
                            {leader.helpfulCount} helpful • {leader.acceptedCount} accepted
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`contributions-${leader.userId}`}>
                        {leader.totalContributions} total
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers" data-testid="content-sellers">
          <Card>
            <CardHeader>
              <CardTitle>Top Sellers by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSellers ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="loading-sellers">
                  Loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {sellers?.map(leader => (
                    <div
                      key={leader.userId}
                      className="flex items-center justify-between p-3 rounded-md hover-elevate"
                      data-testid={`leader-seller-${leader.rank}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 flex justify-center">
                          {getRankBadge(leader.rank)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium" data-testid={`username-${leader.userId}`}>
                              {leader.username}
                            </span>
                            <LeaderBadges userId={leader.userId} />
                          </div>
                          <div className="text-xs text-muted-foreground" data-testid={`sales-count-${leader.userId}`}>
                            {leader.salesCount} sales
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`revenue-${leader.userId}`}>
                        {leader.totalRevenue} coins
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
