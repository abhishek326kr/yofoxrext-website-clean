"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardUser {
  rank: number;
  name: string;
  username?: string;
  userId?: string;
  avatar?: string;
  coins: number;
  metric: number;
  trend?: "up" | "down" | "same";
}

interface LeaderboardProps {
  topContributors?: LeaderboardUser[];
  topUploaders?: LeaderboardUser[];
  weeklyStreaks?: LeaderboardUser[];
}

const defaultContributors: LeaderboardUser[] = [
  { rank: 1, name: "ProTrader99", username: "protrader99", coins: 4520, metric: 234, trend: "up" },
  { rank: 2, name: "GoldScalper", username: "goldscalper", coins: 3890, metric: 198, trend: "up" },
  { rank: 3, name: "DevCoder", username: "devcoder", coins: 3210, metric: 167, trend: "same" },
  { rank: 4, name: "SwingMaster", username: "swingmaster", coins: 2850, metric: 145, trend: "down" },
  { rank: 5, name: "BTCBreakout", username: "btcbreakout", coins: 2340, metric: 122, trend: "up" }
];

const defaultUploaders: LeaderboardUser[] = [
  { rank: 1, name: "EAMaster", username: "eamaster", coins: 5200, metric: 43, trend: "up" },
  { rank: 2, name: "IndicatorPro", username: "indicatorpro", coins: 4100, metric: 38, trend: "up" },
  { rank: 3, name: "CodeWizard", username: "codewizard", coins: 3600, metric: 31, trend: "same" },
  { rank: 4, name: "SetFilePro", username: "setfilepro", coins: 2900, metric: 27, trend: "up" },
  { rank: 5, name: "BacktestKing", username: "backtestking", coins: 2400, metric: 22, trend: "down" }
];

const defaultStreaks: LeaderboardUser[] = [
  { rank: 1, name: "DailyTrader", username: "dailytrader", coins: 890, metric: 7, trend: "up" },
  { rank: 2, name: "ConsistentOne", username: "consistentone", coins: 780, metric: 7, trend: "same" },
  { rank: 3, name: "ActiveMember", username: "activemember", coins: 650, metric: 6, trend: "up" },
  { rank: 4, name: "RegularJoe", username: "regularjoe", coins: 540, metric: 5, trend: "up" },
  { rank: 5, name: "ForumFan", username: "forumfan", coins: 430, metric: 5, trend: "same" }
];

export default function Leaderboard({ 
  topContributors = defaultContributors, 
  topUploaders = defaultUploaders, 
  weeklyStreaks = defaultStreaks 
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    const badges = [
      { icon: Trophy, color: "text-amber-500" },
      { icon: Trophy, color: "text-slate-400" },
      { icon: Trophy, color: "text-orange-600" },
    ];
    
    if (rank <= 3) {
      const { icon: Icon, color } = badges[rank - 1];
      return <Icon className={`h-3.5 w-3.5 ${color}`} />;
    }
    return <span className="text-[10px] font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getTrendIcon = (trend?: "up" | "down" | "same") => {
    if (trend === "up") return <TrendingUp className="h-2.5 w-2.5 text-green-500" />;
    if (trend === "down") return <TrendingUp className="h-2.5 w-2.5 text-red-500 rotate-180" />;
    return null;
  };

  const renderLeaderboardList = (users: LeaderboardUser[], metricLabel: string) => (
    <div className="space-y-1">
      {users.map((user) => {
        const userUrl = user.username ? `/user/${user.username}` : (user.userId ? `/user/${user.userId}` : '#');
        
        return (
          <Link 
            key={user.rank} 
            href={userUrl}
            data-testid={`link-leaderboard-user-${user.rank}`}
          >
            <div 
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover-elevate active-elevate-2" 
              data-testid={`leaderboard-user-${user.rank}`}
            >
              <div className="w-4 flex items-center justify-center shrink-0">
                {getRankIcon(user.rank)}
              </div>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-[10px]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" data-testid={`text-username-${user.rank}`}>
                  {user.name}
                </div>
                <div className="text-[10px] text-muted-foreground" data-testid={`text-metric-${user.rank}`}>
                  {user.metric} {metricLabel}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {getTrendIcon(user.trend)}
                <span className="text-xs font-semibold text-foreground" data-testid={`badge-coins-${user.rank}`}>
                  {user.coins}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <Card className="border-0 shadow-sm" data-testid="card-leaderboard">
      <CardHeader className="pb-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3">
        <Tabs defaultValue="contributors" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-7 bg-muted/50">
            <TabsTrigger value="contributors" className="text-[11px] data-[state=active]:bg-background" data-testid="tab-contributors">
              Helpful
            </TabsTrigger>
            <TabsTrigger value="uploaders" className="text-[11px] data-[state=active]:bg-background" data-testid="tab-uploaders">
              Uploads
            </TabsTrigger>
            <TabsTrigger value="streaks" className="text-[11px] data-[state=active]:bg-background" data-testid="tab-streaks">
              Streaks
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contributors" className="mt-2">
            {renderLeaderboardList(topContributors, "solutions")}
          </TabsContent>
          <TabsContent value="uploaders" className="mt-2">
            {renderLeaderboardList(topUploaders, "uploads")}
          </TabsContent>
          <TabsContent value="streaks" className="mt-2">
            {renderLeaderboardList(weeklyStreaks, "day streak")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
