"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Award, Trophy } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: string;
  imageUrl?: string;
  totalEarned?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: string;
  rewardCoins: number;
  completionRate?: number;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
}

interface Goal {
  name: string;
  participants: number;
}

interface GoalCompletionPoint {
  date: string;
  completionRate: number;
}

export default function Gamification() {
  const { toast } = useToast();
  const [isCreateBadgeOpen, setIsCreateBadgeOpen] = useState(false);
  const [isCreateAchievementOpen, setIsCreateAchievementOpen] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState("contributors");
  const [timePeriod, setTimePeriod] = useState("all-time");

  const { data: badgesRaw, isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ["/api/admin/gamification/badges"]
  });

  const badges = Array.isArray(badgesRaw) ? badgesRaw : [];

  const { data: achievementsRaw, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/admin/gamification/achievements"]
  });

  const achievements = Array.isArray(achievementsRaw) ? achievementsRaw : [];

  const { data: leaderboardRaw, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/admin/gamification/leaderboard", leaderboardType, timePeriod]
  });

  const leaderboard = Array.isArray(leaderboardRaw) ? leaderboardRaw : [];

  const { data: goalsRaw, isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/admin/gamification/goals"]
  });

  const goals = Array.isArray(goalsRaw) ? goalsRaw : [];

  const { data: goalCompletionDataRaw, isLoading: goalCompletionLoading } = useQuery<GoalCompletionPoint[]>({
    queryKey: ["/api/admin/gamification/goal-completion"]
  });

  const goalCompletionData = Array.isArray(goalCompletionDataRaw) ? goalCompletionDataRaw : [];

  const createBadgeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/gamification/badges", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gamification/badges"] });
      toast({ title: "Badge created successfully" });
      setIsCreateBadgeOpen(false);
    }
  });

  const createAchievementMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/gamification/achievements", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gamification/achievements"] });
      toast({ title: "Achievement created successfully" });
      setIsCreateAchievementOpen(false);
    }
  });

  const handleCreateBadge = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createBadgeMutation.mutate({
      name: formData.get("name"),
      description: formData.get("description"),
      imageUrl: formData.get("imageUrl"),
      rarity: formData.get("rarity")
    });
  };

  const handleCreateAchievement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAchievementMutation.mutate({
      name: formData.get("name"),
      description: formData.get("description"),
      criteria: formData.get("criteria"),
      rewardCoins: parseInt(formData.get("rewardCoins") as string)
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gamification</h1>

      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges" data-testid="tab-badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboards" data-testid="tab-leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Badges</h2>
            <Dialog open={isCreateBadgeOpen} onOpenChange={setIsCreateBadgeOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-badge">Create Badge</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Badge</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBadge} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Badge Name</Label>
                    <Input id="name" name="name" required data-testid="input-badge-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" required data-testid="input-badge-description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" name="imageUrl" type="url" required data-testid="input-badge-image" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rarity">Rarity</Label>
                    <Select name="rarity" required>
                      <SelectTrigger data-testid="select-badge-rarity">
                        <SelectValue placeholder="Select rarity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createBadgeMutation.isPending} data-testid="button-submit-badge">
                      {createBadgeMutation.isPending ? "Creating..." : "Create Badge"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {badgesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <Card key={badge.id} data-testid={`badge-card-${badge.id}`}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {badge.imageUrl ? (
                        <img src={badge.imageUrl} alt={badge.name} className="w-12 h-12" />
                      ) : (
                        <Award className="w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`badge-name-${badge.id}`}>{badge.name}</CardTitle>
                      <Badge variant="secondary">{badge.rarity}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-semibold">{badge.totalEarned || 0}</span> earned
                    </div>
                  </CardFooter>
                </Card>
              ))}
              {badges.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No badges created yet
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Achievements</h2>
            <Dialog open={isCreateAchievementOpen} onOpenChange={setIsCreateAchievementOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-achievement">Create Achievement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Achievement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAchievement} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ach-name">Achievement Name</Label>
                    <Input id="ach-name" name="name" required data-testid="input-achievement-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ach-description">Description</Label>
                    <Input id="ach-description" name="description" required data-testid="input-achievement-description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="criteria">Criteria</Label>
                    <Input id="criteria" name="criteria" required data-testid="input-achievement-criteria" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rewardCoins">Reward Coins</Label>
                    <Input id="rewardCoins" name="rewardCoins" type="number" required data-testid="input-achievement-reward" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createAchievementMutation.isPending} data-testid="button-submit-achievement">
                      {createAchievementMutation.isPending ? "Creating..." : "Create Achievement"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {achievementsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Criteria</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Completion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {achievements.map((achievement) => (
                        <TableRow key={achievement.id} data-testid={`achievement-${achievement.id}`}>
                          <TableCell className="font-medium" data-testid={`achievement-name-${achievement.id}`}>
                            {achievement.name}
                          </TableCell>
                          <TableCell>{achievement.description}</TableCell>
                          <TableCell>{achievement.criteria}</TableCell>
                          <TableCell>{achievement.rewardCoins} coins</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{achievement.completionRate || 0}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {achievements.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No achievements created
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboards" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Leaderboards</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                <SelectTrigger className="w-48" data-testid="select-leaderboard-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributors">Top Contributors</SelectItem>
                  <SelectItem value="earners">Top Earners</SelectItem>
                  <SelectItem value="uploaders">Top Uploaders</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-40" data-testid="select-time-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {leaderboardLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry, index) => (
                        <TableRow key={entry.id} data-testid={`leaderboard-${index}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {index < 3 && <Trophy className={`w-4 h-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-700'}`} />}
                              <span className="font-semibold">#{index + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`leaderboard-user-${index}`}>{entry.username}</TableCell>
                          <TableCell>
                            <Badge>{entry.score}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {leaderboard.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <h2 className="text-xl font-semibold">User Goals Analytics</h2>

          <Card>
            <CardHeader>
              <CardTitle>Goal Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {goalCompletionLoading ? (
                <Skeleton className="h-64" />
              ) : goalCompletionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={goalCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="completionRate" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Goals by Participation</CardTitle>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : goals.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={goals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="participants" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
