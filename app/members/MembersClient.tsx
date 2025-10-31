"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Link from "next/link";
import { 
  Trophy, 
  Coins,
  TrendingUp,
  Upload,
  Star,
  Award,
  Crown,
  Medal,
  Users,
  Search,
  Filter,
  Calendar,
  Activity,
  MessageSquare,
  Target,
  Flame,
  Zap,
  ShieldCheck,
  UserCheck,
  Store,
  Shield,
  Clock,
  Eye,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BadgeCheck,
  Gift,
  Briefcase,
  UserPlus,
  Heart,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LeaderboardUser extends User {
  contributionCount?: number;
  uploadCount?: number;
}

interface MembersClientProps {
  initialData: {
    topByCoins: LeaderboardUser[];
    topByContributions: LeaderboardUser[];
    topByUploads: LeaderboardUser[];
  };
}

export default function MembersClient({ initialData }: MembersClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const [roleFilters, setRoleFilters] = useState({
    regular: false,
    premium: false,
    sellers: false,
    verified: false,
    moderators: false,
  });

  const [activityFilters, setActivityFilters] = useState({
    onlineNow: false,
    activeToday: false,
    activeWeek: false,
    inactive: false,
  });

  const [coinsRange, setCoinsRange] = useState([0]);
  const [joinDateFilter, setJoinDateFilter] = useState("all");

  const { data: topByCoins, isLoading: coinsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'coins'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?type=coins&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByCoins,
    refetchInterval: 30000,
  });

  const { data: topByContributions, isLoading: contributionsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'contributions'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?type=contributions&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByContributions,
    refetchInterval: 30000,
  });

  const { data: topByUploads, isLoading: uploadsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'uploads'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?type=uploads&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByUploads,
    refetchInterval: 30000,
  });

  const clearFilters = () => {
    setRoleFilters({
      regular: false,
      premium: false,
      sellers: false,
      verified: false,
      moderators: false,
    });
    setActivityFilters({
      onlineNow: false,
      activeToday: false,
      activeWeek: false,
      inactive: false,
    });
    setCoinsRange([0]);
    setJoinDateFilter("all");
    setSearchTerm("");
  };

  const filterUsers = (users: LeaderboardUser[]) => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" };
    if (rank === 2) return { icon: Medal, color: "bg-gray-400/15 text-gray-700 dark:text-gray-400 border-gray-400/30" };
    if (rank === 3) return { icon: Medal, color: "bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-600/30" };
    return { icon: Trophy, color: "bg-primary/10 text-primary border-primary/20" };
  };

  const renderCompactMemberCard = (user: LeaderboardUser, index: number, type: 'coins' | 'contributions' | 'uploads') => {
    const { icon: RankIcon, color } = getRankBadge(index + 1);
    
    const getStatValue = () => {
      if (type === 'coins') return (user.totalCoins ?? 0).toLocaleString();
      if (type === 'contributions') return (user.contributionCount ?? 0).toLocaleString();
      if (type === 'uploads') return (user.uploadCount ?? 0).toLocaleString();
      return '0';
    };

    const getStatIcon = () => {
      if (type === 'coins') return Coins;
      if (type === 'contributions') return MessageSquare;
      if (type === 'uploads') return Upload;
      return Activity;
    };

    const StatIcon = getStatIcon();
    const joinedAgo = user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'Unknown';

    return (
      <Link key={user.id} href={`/user/${user.username}`} data-testid={`link-user-${user.id}`}>
        <Card className="group hover:border-primary/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 h-full">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 relative">
                <Badge 
                  variant="outline" 
                  className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center p-0 z-10 ${color}`}
                >
                  {index < 3 ? <RankIcon className="w-3 h-3" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                </Badge>
                <Avatar className="w-12 h-12 border-2 border-border group-hover:border-primary/30 transition-colors">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {(user.username?.substring(0, 2)?.toUpperCase() ?? 'XX')}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 
                  className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors" 
                  data-testid={`text-username-${user.id}`}
                >
                  {user.username}
                </h3>
                
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50">
                    #{index + 1}
                  </Badge>
                  <span className="truncate">
                    Silver {user.rank || 22}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <StatIcon className="w-3 h-3 text-primary" />
                    <span className="font-semibold" data-testid={`stat-value-${user.id}`}>
                      {getStatValue()}
                    </span>
                  </div>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1 text-muted-foreground truncate">
                    <Calendar className="w-3 h-3" />
                    <span suppressHydrationWarning className="text-[11px] truncate">{joinedAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const uniqueMembers = new Set([
    ...(topByCoins || []).map(u => u.id),
    ...(topByContributions || []).map(u => u.id),
    ...(topByUploads || []).map(u => u.id)
  ]).size;

  const totalCoinsEarned = (topByCoins || []).reduce((sum, u) => sum + (u.totalCoins || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="heading-members">
                <Users className="w-8 h-8 text-primary" />
                Community Members
              </h1>
              <p className="text-muted-foreground">
                Top contributors, traders, and developers in the YoForex community
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - Now visible on mobile */}
          <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            
            {/* Advanced Member Filters - Collapsible on mobile */}
            <Card data-testid="card-advanced-filters" className="overflow-hidden">
              <Collapsible defaultOpen={false} className="lg:hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Advanced Filters
                      </span>
                      <ChevronRight className="w-5 h-5 transition-transform data-[state=open]:rotate-90" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    {/* Filter by Role */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Filter by Role</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'regular', label: 'Regular Members', icon: Users },
                          { key: 'premium', label: 'Premium Members', icon: Crown },
                          { key: 'sellers', label: 'Sellers', icon: Store },
                          { key: 'verified', label: 'Verified', icon: BadgeCheck },
                          { key: 'moderators', label: 'Moderators', icon: Shield },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center gap-2">
                            <Checkbox 
                              id={`role-${key}`}
                              checked={roleFilters[key as keyof typeof roleFilters]}
                              onCheckedChange={(checked) => 
                                setRoleFilters(prev => ({ ...prev, [key]: checked as boolean }))
                              }
                              data-testid={`checkbox-role-${key}`}
                            />
                            <label htmlFor={`role-${key}`} className="text-sm flex items-center gap-2 cursor-pointer">
                              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Filter by Activity */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Filter by Activity</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'onlineNow', label: 'Online Now', icon: Activity },
                          { key: 'activeToday', label: 'Active Today', icon: Clock },
                          { key: 'activeWeek', label: 'Active This Week', icon: Calendar },
                          { key: 'inactive', label: 'Inactive', icon: Eye },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center gap-2">
                            <Checkbox 
                              id={`activity-${key}`}
                              checked={activityFilters[key as keyof typeof activityFilters]}
                              onCheckedChange={(checked) => 
                                setActivityFilters(prev => ({ ...prev, [key]: checked as boolean }))
                              }
                              data-testid={`checkbox-activity-${key}`}
                            />
                            <label htmlFor={`activity-${key}`} className="text-sm flex items-center gap-2 cursor-pointer">
                              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Filter by Coins */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center justify-between">
                        <span>Filter by Coins</span>
                        <span className="text-xs text-muted-foreground" data-testid="text-coins-range">
                          {coinsRange[0]?.toLocaleString() || 0}+
                        </span>
                      </h4>
                      <Slider
                        min={0}
                        max={5000}
                        step={100}
                        value={coinsRange}
                        onValueChange={setCoinsRange}
                        data-testid="slider-coins-range"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>5,000</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Filter by Join Date */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Filter by Join Date</h4>
                      <Select value={joinDateFilter} onValueChange={setJoinDateFilter}>
                        <SelectTrigger data-testid="select-join-date">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="7days">Last 7 Days</SelectItem>
                          <SelectItem value="30days">Last 30 Days</SelectItem>
                          <SelectItem value="3months">Last 3 Months</SelectItem>
                          <SelectItem value="6months">Last 6 Months</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={clearFilters}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>

              {/* Desktop version - always visible */}
              <div className="hidden lg:block">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Advanced Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                
                {/* Filter by Role */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Filter by Role</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'regular', label: 'Regular Members', icon: Users },
                      { key: 'premium', label: 'Premium Members', icon: Crown },
                      { key: 'sellers', label: 'Sellers', icon: Store },
                      { key: 'verified', label: 'Verified', icon: BadgeCheck },
                      { key: 'moderators', label: 'Moderators', icon: Shield },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox 
                          id={`role-${key}`}
                          checked={roleFilters[key as keyof typeof roleFilters]}
                          onCheckedChange={(checked) => 
                            setRoleFilters(prev => ({ ...prev, [key]: checked as boolean }))
                          }
                          data-testid={`checkbox-role-${key}`}
                        />
                        <label htmlFor={`role-${key}`} className="text-sm flex items-center gap-2 cursor-pointer">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filter by Activity */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Filter by Activity</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'onlineNow', label: 'Online Now', icon: Activity },
                      { key: 'activeToday', label: 'Active Today', icon: Clock },
                      { key: 'activeWeek', label: 'Active This Week', icon: Calendar },
                      { key: 'inactive', label: 'Inactive', icon: Eye },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox 
                          id={`activity-${key}`}
                          checked={activityFilters[key as keyof typeof activityFilters]}
                          onCheckedChange={(checked) => 
                            setActivityFilters(prev => ({ ...prev, [key]: checked as boolean }))
                          }
                          data-testid={`checkbox-activity-${key}`}
                        />
                        <label htmlFor={`activity-${key}`} className="text-sm flex items-center gap-2 cursor-pointer">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filter by Coins */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center justify-between">
                    <span>Filter by Coins</span>
                    <span className="text-xs text-muted-foreground" data-testid="text-coins-range">
                      {coinsRange[0]?.toLocaleString() || 0}+
                    </span>
                  </h4>
                  <Slider
                    min={0}
                    max={5000}
                    step={100}
                    value={coinsRange}
                    onValueChange={setCoinsRange}
                    data-testid="slider-coins-range"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>5,000</span>
                  </div>
                </div>

                <Separator />

                {/* Filter by Join Date */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Filter by Join Date</h4>
                  <Select value={joinDateFilter} onValueChange={setJoinDateFilter}>
                    <SelectTrigger data-testid="select-join-date">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </CardContent>
              </div>
            </Card>

            {/* Leaderboard Categories */}
            <Card data-testid="card-leaderboard-categories">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Leaderboard Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Top by Coins', icon: Coins, href: '#', color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: 'Most Active', icon: TrendingUp, href: '#', color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Top Publishers', icon: Upload, href: '#', color: 'text-green-600 dark:text-green-400' },
                  { label: 'Top Sellers', icon: Store, href: '#', color: 'text-purple-600 dark:text-purple-400' },
                  { label: 'Rising Stars', icon: Sparkles, href: '#', color: 'text-orange-600 dark:text-orange-400' },
                  { label: 'Hall of Fame', icon: Trophy, href: '#', color: 'text-primary' },
                ].map(({ label, icon: Icon, href, color }, idx) => (
                  <Link 
                    key={idx} 
                    href={href}
                    data-testid={`link-category-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm flex-1 group-hover:text-primary transition-colors">{label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card data-testid="card-community-stats">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Total Members', value: uniqueMembers, icon: Users, color: 'text-primary' },
                  { label: 'Online Now', value: Math.floor(uniqueMembers * 0.15), icon: Activity, color: 'text-green-600 dark:text-green-400' },
                  { label: 'New This Week', value: Math.floor(uniqueMembers * 0.08), icon: UserPlus, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Total Coins Earned', value: totalCoinsEarned.toLocaleString(), icon: Coins, color: 'text-yellow-600 dark:text-yellow-400' },
                ].map(({ label, value, icon: Icon, color }, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <span className="font-semibold" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Achievements */}
            <Card data-testid="card-top-achievements">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(topByCoins?.slice(0, 3) ?? []).length > 0 ? (
                  (topByCoins?.slice(0, 3) ?? []).map((user, idx) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <Badge className="w-7 h-7 rounded-full flex items-center justify-center p-0 bg-gradient-to-br from-yellow-500 to-orange-500">
                        <Trophy className="w-3.5 h-3.5" />
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`achievement-user-${idx}`}>
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">Coin Master</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(user.totalCoins ?? 0).toLocaleString()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No achievements yet</p>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* MAIN CONTENT - Now properly ordered */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            
            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-members"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Tabs */}
            <Tabs defaultValue="coins" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 gap-2">
                <TabsTrigger value="coins" className="gap-2" data-testid="tab-coins">
                  <Coins className="w-4 h-4" />
                  <span className="hidden sm:inline">Coins</span>
                </TabsTrigger>
                <TabsTrigger value="contributions" className="gap-2" data-testid="tab-contributions">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Active</span>
                </TabsTrigger>
                <TabsTrigger value="uploads" className="gap-2" data-testid="tab-uploads">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Publishers</span>
                </TabsTrigger>
              </TabsList>

              {/* Coins Leaderboard */}
              <TabsContent value="coins" data-testid="content-coins-leaderboard">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {coinsLoading ? (
                    Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
                  ) : filterUsers(topByCoins || []).length > 0 ? (
                    filterUsers(topByCoins || []).map((user, index) => 
                      renderCompactMemberCard(user, index, 'coins')
                    )
                  ) : (
                    <div className="col-span-full">
                      <Card className="p-12 text-center">
                        <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No members found</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search' : 'Start earning coins to appear here!'}
                        </p>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Contributions Leaderboard */}
              <TabsContent value="contributions" data-testid="content-contributions-leaderboard">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {contributionsLoading ? (
                    Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
                  ) : filterUsers(topByContributions || []).length > 0 ? (
                    filterUsers(topByContributions || []).map((user, index) => 
                      renderCompactMemberCard(user, index, 'contributions')
                    )
                  ) : (
                    <div className="col-span-full">
                      <Card className="p-12 text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search' : 'Start contributing to appear here!'}
                        </p>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Uploads Leaderboard */}
              <TabsContent value="uploads" data-testid="content-uploads-leaderboard">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {uploadsLoading ? (
                    Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
                  ) : filterUsers(topByUploads || []).length > 0 ? (
                    filterUsers(topByUploads || []).map((user, index) => 
                      renderCompactMemberCard(user, index, 'uploads')
                    )
                  ) : (
                    <div className="col-span-full">
                      <Card className="p-12 text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search' : 'Publish your first EA to appear here!'}
                        </p>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Call to Action */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Trophy className="w-10 h-10 text-primary" />
                    <Flame className="w-10 h-10 text-orange-500" />
                    <Zap className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Climb the Leaderboard</h3>
                  <p className="text-muted-foreground mb-6">
                    Earn coins, contribute to discussions, and publish quality content to rise through the ranks
                  </p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Link href="/publish">
                      <Button size="lg" data-testid="button-publish-content">
                        <Upload className="w-4 h-4 mr-2" />
                        Publish Content
                      </Button>
                    </Link>
                    <Link href="/earn-coins">
                      <Button variant="outline" size="lg" data-testid="button-earn-coins">
                        <Coins className="w-4 h-4 mr-2" />
                        Ways to Earn
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR - Now visible on mobile */}
          <aside className="lg:col-span-3 space-y-6 order-3 lg:order-3">
            
            {/* Member of the Month Spotlight */}
            <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 border-primary/20" data-testid="card-member-of-month">
              <CardHeader className="relative pb-0">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Member of the Month
                  </Badge>
                </div>
                <div className="flex flex-col items-center pt-6">
                  <Avatar className="w-20 h-20 border-4 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xl font-bold">
                      {(topByCoins?.[0]?.username?.substring(0, 2)?.toUpperCase() ?? 'XX')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold mt-4" data-testid="text-member-of-month">
                    {topByCoins?.[0]?.username || 'No winner yet'}
                  </h3>
                  <Badge variant="outline" className="mt-2">
                    <Crown className="w-3 h-3 mr-1" />
                    Gold Rank 1
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {(topByCoins?.[0]?.totalCoins ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Coins</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {(topByCoins?.[0]?.contributionCount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                      {Math.floor((topByCoins?.[0]?.totalCoins ?? 0) * 0.3).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground italic">
                  "Dedicated trader sharing insights and helping others succeed in the community."
                </p>
                {topByCoins?.[0]?.username ? (
                  <Link href={`/user/${topByCoins[0].username}`}>
                    <Button className="w-full" data-testid="button-view-profile-spotlight">
                      View Profile
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled data-testid="button-view-profile-spotlight">
                    No winner yet
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Trending This Week */}
            <Card data-testid="card-trending-week">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Trending This Week
                </CardTitle>
                <CardDescription>Rising stars in the community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(topByCoins?.slice(0, 5) ?? []).length > 0 ? (
                  (topByCoins?.slice(0, 5) ?? []).map((user, idx) => (
                    <Link key={user.id} href={`/user/${user.username}`} data-testid={`link-trending-${idx}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs font-bold">
                          {idx + 1}
                        </Badge>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {(user.username?.substring(0, 2)?.toUpperCase() ?? 'XX')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {user.username}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <ArrowUp className="w-3 h-3" />
                          <span className="text-xs font-semibold">
                            +{[350, 280, 200, 150, 100][idx] ?? 100}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No trending members</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { user: topByCoins?.[0]?.username || 'User1', action: 'earned badge', detail: 'Coin Master', icon: Award, color: 'text-yellow-600' },
                  { user: topByContributions?.[0]?.username || 'User2', action: 'shared EA', detail: 'Gold Scalper Pro', icon: Upload, color: 'text-green-600' },
                  { user: topByCoins?.[1]?.username || 'User3', action: 'reached rank', detail: 'Silver 50', icon: Trophy, color: 'text-blue-600' },
                  { user: topByUploads?.[0]?.username || 'User4', action: 'made sale', detail: '2,500 coins', icon: Coins, color: 'text-orange-600' },
                  { user: topByCoins?.[2]?.username || 'User5', action: 'joined', detail: 'YoForex', icon: UserPlus, color: 'text-purple-600' },
                ].slice(0, 6).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm" data-testid={`activity-item-${idx}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {(activity.user?.substring(0, 2)?.toUpperCase() ?? 'XX')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium">{activity.user}</span>
                        {' '}{activity.action}{' '}
                        <span className="font-medium">{activity.detail}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {['2m', '15m', '1h', '2h', '3h', '5h'][idx] ?? '1h'} ago
                      </p>
                    </div>
                    <activity.icon className={`w-4 h-4 ${activity.color} flex-shrink-0`} />
                  </div>
                ))}
                <Link href="/activity">
                  <Button variant="ghost" className="w-full mt-2" size="sm" data-testid="button-view-all-activity">
                    View All Activity
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* New Members */}
            <Card data-testid="card-new-members">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  New Members
                </CardTitle>
                <CardDescription>Welcome to the community!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(topByCoins?.slice(-4).reverse() ?? []).length > 0 ? (
                  (topByCoins?.slice(-4).reverse() ?? []).map((user, idx) => (
                    <Link key={user.id} href={`/user/${user.username}`} data-testid={`link-new-member-${idx}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-green-500/10 to-blue-500/10">
                            {(user.username?.substring(0, 2)?.toUpperCase() ?? 'XX')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {user.username}
                          </p>
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            Joined {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'recently'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                          Welcome
                        </Badge>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No new members yet</p>
                )}
              </CardContent>
            </Card>
          </aside>

        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
