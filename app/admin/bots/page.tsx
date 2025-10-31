"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Bot, Plus, Play, Trash2, Users, Wallet, Activity } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAuthCheck } from "../auth-check";

interface BotData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  purpose: 'engagement' | 'marketplace' | 'referral';
  trustLevel: number;
  isActive: boolean;
  personaProfile: { timezone: string; favoritePairs: string[] };
  activityCaps: { dailyLikes: number; dailyFollows: number; dailyPurchases: number; dailyUnlocks: number };
  createdAt: string;
  updatedAt: string;
  todaySpend?: number;
}

interface BotStats {
  totalBots: number;
  activeBots: number;
  todaySpending: number;
  totalActions: number;
}

interface BotsApiResponse {
  bots: BotData[];
  count: number;
  maxLimit: number;
  remaining: number;
}

export default function BotManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteBot, setDeleteBot] = useState<BotData | null>(null);

  const { data: botsResponse, isLoading: botsLoading } = useQuery<BotsApiResponse>({
    queryKey: ["/api/admin/bots"]
  });

  const bots = botsResponse?.bots || [];
  const botCount = botsResponse?.count || 0;

  // Calculate stats from the bots data
  const activeBots = bots.filter(b => b.isActive).length;
  const todaySpending = bots.reduce((sum, b) => sum + (b.todaySpend || 0), 0);

  const stats: BotStats = {
    totalBots: botCount,
    activeBots,
    todaySpending,
    totalActions: 0
  };

  const toggleBotMutation = useMutation({
    mutationFn: async (botId: string) => {
      return apiRequest("PATCH", `/api/admin/bots/${botId}/toggle`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bots"] });
      toast({ title: "Bot status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update bot status", variant: "destructive" });
    }
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (botId: string) => {
      return apiRequest("DELETE", `/api/admin/bots/${botId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bots"] });
      setDeleteBot(null);
      toast({ title: "Bot deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete bot", variant: "destructive" });
    }
  });

  const runEngineMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/bots/run-engine", {});
    },
    onSuccess: () => {
      toast({ title: "Bot engine triggered successfully" });
    },
    onError: () => {
      toast({ title: "Failed to trigger bot engine", variant: "destructive" });
    }
  });

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'engagement': return 'default';
      case 'marketplace': return 'secondary';
      case 'referral': return 'outline';
      default: return 'outline';
    }
  };

  if (botsLoading) {
    return (
      <AdminAuthCheck>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminAuthCheck>
    );
  }

  return (
    <AdminAuthCheck>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="title-bot-management">Bot Management</h1>
            <p className="text-muted-foreground">Manage automated bots and their behavior</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => runEngineMutation.mutate()}
              variant="outline"
              disabled={runEngineMutation.isPending}
              data-testid="button-run-engine"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Bot Engine Now
            </Button>
            <Button
              onClick={() => router.push("/admin/bots/create")}
              data-testid="button-create-bot"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Bot
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-total-bots">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-bots">
                {stats.totalBots} / 15
              </div>
              <p className="text-xs text-muted-foreground">Maximum allowed</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-bots">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-bots">
                {stats.activeBots}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card data-testid="card-today-spending">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Spending</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-today-spending">
                {stats.todaySpending} coins
              </div>
              <p className="text-xs text-muted-foreground">From treasury</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-actions">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-actions">
                {stats.totalActions}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Bots Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Roster ({bots.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Trust Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Today Spend</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bots.length > 0 ? (
                    bots.map((bot) => (
                      <TableRow key={bot.id} data-testid={`bot-row-${bot.id}`}>
                        <TableCell className="font-medium" data-testid={`bot-username-${bot.id}`}>
                          {bot.username}
                        </TableCell>
                        <TableCell>{bot.displayName}</TableCell>
                        <TableCell>
                          <Badge variant={getPurposeColor(bot.purpose)} data-testid={`bot-purpose-${bot.id}`}>
                            {bot.purpose}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`bot-trust-${bot.id}`}>{bot.trustLevel}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={bot.isActive}
                              onCheckedChange={() => toggleBotMutation.mutate(bot.id)}
                              disabled={toggleBotMutation.isPending}
                              data-testid={`switch-bot-active-${bot.id}`}
                            />
                            <Badge variant={bot.isActive ? "default" : "secondary"} data-testid={`bot-status-${bot.id}`}>
                              {bot.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`bot-spend-${bot.id}`}>
                          {bot.todaySpend || 0} coins
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteBot(bot)}
                            data-testid={`button-delete-bot-${bot.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No bots created yet. Create your first bot to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteBot} onOpenChange={(open) => !open && setDeleteBot(null)}>
          <AlertDialogContent data-testid="dialog-delete-bot">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bot</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete bot <strong>{deleteBot?.username}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBot && deleteBotMutation.mutate(deleteBot.id)}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminAuthCheck>
  );
}
