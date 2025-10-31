"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Wallet, TrendingDown, DollarSign, Settings, History, AlertTriangle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AdminAuthCheck } from "../auth-check";

interface TreasuryStats {
  balance: number;
  dailyCap: number;
  todaySpending: number;
  totalSpent: number;
  daysRemaining: number;
}

interface EconomySettings {
  aggressionLevel: number;
  walletCapDefault: number;
  referralModeEnabled: boolean;
  botPurchasesEnabled: boolean;
  botUnlocksEnabled: boolean;
}

interface AuditLogEntry {
  timestamp: string;
  action: string;
  amount: number;
  reason: string;
  adminId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

const refillSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1").max(1000000, "Maximum 1,000,000 coins")
});

const economySettingsSchema = z.object({
  aggressionLevel: z.number().min(1).max(10),
  walletCapDefault: z.number().min(0).max(500),
  referralModeEnabled: z.boolean(),
  botPurchasesEnabled: z.boolean(),
  botUnlocksEnabled: z.boolean()
});

const drainSchema = z.object({
  percentage: z.number().min(10).max(20),
  userFilter: z.string().optional()
});

export default function EconomyControlPage() {
  const { toast } = useToast();
  const [refillAmount, setRefillAmount] = useState(1000);
  const [drainDialogOpen, setDrainDialogOpen] = useState(false);
  const [drainPercentage, setDrainPercentage] = useState(10);

  const { data: treasuryRaw, isLoading: treasuryLoading } = useQuery<TreasuryStats>({
    queryKey: ["/api/admin/treasury"]
  });

  const treasury: TreasuryStats = treasuryRaw || {
    balance: 0,
    dailyCap: 500,
    todaySpending: 0,
    totalSpent: 0,
    daysRemaining: 0
  };

  const { data: settingsRaw, isLoading: settingsLoading } = useQuery<EconomySettings>({
    queryKey: ["/api/admin/economy/settings"]
  });

  const settings: EconomySettings = settingsRaw || {
    aggressionLevel: 5,
    walletCapDefault: 199,
    referralModeEnabled: false,
    botPurchasesEnabled: true,
    botUnlocksEnabled: true
  };

  const { data: auditLogRaw } = useQuery<AuditLogEntry[]>({
    queryKey: ["/api/admin/treasury/audit-log"],
    queryFn: async () => {
      const response = await fetch("/api/admin/treasury/audit-log?limit=20");
      if (!response.ok) return [];
      return response.json();
    }
  });

  const auditLog = Array.isArray(auditLogRaw) ? auditLogRaw : [];

  const settingsForm = useForm<z.infer<typeof economySettingsSchema>>({
    resolver: zodResolver(economySettingsSchema),
    values: {
      aggressionLevel: settings.aggressionLevel,
      walletCapDefault: settings.walletCapDefault,
      referralModeEnabled: settings.referralModeEnabled,
      botPurchasesEnabled: settings.botPurchasesEnabled,
      botUnlocksEnabled: settings.botUnlocksEnabled
    }
  });

  const refillMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/admin/treasury/refill", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/treasury"] });
      setRefillAmount(1000);
      toast({ title: "Treasury refilled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to refill treasury", variant: "destructive" });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof economySettingsSchema>) => {
      return apiRequest("POST", "/api/admin/economy/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/economy/settings"] });
      toast({ title: "Economy settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    }
  });

  const drainWalletsMutation = useMutation({
    mutationFn: async ({ percentage, userFilter }: { percentage: number; userFilter?: string }) => {
      return apiRequest("POST", "/api/admin/treasury/drain-user", { percentage, userFilter });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/treasury"] });
      setDrainDialogOpen(false);
      toast({ title: "User wallets drained successfully" });
    },
    onError: () => {
      toast({ title: "Failed to drain wallets", variant: "destructive" });
    }
  });

  const handleRefill = () => {
    refillMutation.mutate(refillAmount);
  };

  const handleDrain = () => {
    drainWalletsMutation.mutate({ percentage: drainPercentage });
  };

  if (treasuryLoading || settingsLoading) {
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
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-economy-control">Economy Control Panel</h1>
          <p className="text-muted-foreground">Manage treasury, bot economy settings, and wallet operations</p>
        </div>

        {/* Treasury Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-treasury-balance">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-treasury-balance">
                {treasury.balance.toLocaleString()} coins
              </div>
              <p className="text-xs text-muted-foreground">Available for bots</p>
            </CardContent>
          </Card>

          <Card data-testid="card-today-spending">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Spending</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-today-spending">
                {treasury.todaySpending.toLocaleString()} coins
              </div>
              <p className="text-xs text-muted-foreground">Out of {treasury.dailyCap} cap</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-spent">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-spent">
                {treasury.totalSpent.toLocaleString()} coins
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card data-testid="card-days-remaining">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Until Empty</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${treasury.daysRemaining < 30 ? 'text-orange-600' : ''}`} data-testid="text-days-remaining">
                {treasury.daysRemaining > 0 ? treasury.daysRemaining : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">At current rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Refill Treasury */}
          <Card data-testid="card-refill-treasury">
            <CardHeader>
              <CardTitle>Refill Treasury</CardTitle>
              <CardDescription>Add coins to the bot treasury</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (coins)</label>
                <Input
                  type="number"
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(parseInt(e.target.value) || 0)}
                  min={1}
                  max={1000000}
                  data-testid="input-refill-amount"
                />
              </div>
              <Button
                onClick={handleRefill}
                disabled={refillMutation.isPending || refillAmount < 1}
                className="w-full"
                data-testid="button-refill-treasury"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Refill Treasury
              </Button>
            </CardContent>
          </Card>

          {/* User Wallet Drain */}
          <Card data-testid="card-wallet-drain">
            <CardHeader>
              <CardTitle>User Wallet Drain</CardTitle>
              <CardDescription>Drain a percentage from user wallets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Percentage: {drainPercentage}%</label>
                <Slider
                  min={10}
                  max={20}
                  step={1}
                  value={[drainPercentage]}
                  onValueChange={(value) => setDrainPercentage(value[0])}
                  data-testid="slider-drain-percentage"
                />
                <p className="text-xs text-muted-foreground">Drain 10-20% from all user wallets</p>
              </div>
              <Button
                onClick={() => setDrainDialogOpen(true)}
                variant="destructive"
                className="w-full"
                data-testid="button-drain-wallets"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Drain Wallets
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Economy Settings */}
        <Card data-testid="card-economy-settings">
          <CardHeader>
            <CardTitle>Economy Settings</CardTitle>
            <CardDescription>Configure bot economy behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit((data) => updateSettingsMutation.mutate(data))} className="space-y-6">
                <FormField
                  control={settingsForm.control}
                  name="aggressionLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aggression Level: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          data-testid="slider-aggression-level"
                        />
                      </FormControl>
                      <FormDescription>How aggressively bots engage (1-10)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="walletCapDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Global Wallet Cap (coins)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={500}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-wallet-cap"
                        />
                      </FormControl>
                      <FormDescription>Default maximum coins users can hold (0 = unlimited)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={settingsForm.control}
                    name="referralModeEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Referral Mode</FormLabel>
                          <FormDescription>Allow bots to follow users for referral purposes</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-referral-mode"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="botPurchasesEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Bot Purchases</FormLabel>
                          <FormDescription>Allow bots to purchase marketplace items</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-bot-purchases"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="botUnlocksEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Bot Unlocks</FormLabel>
                          <FormDescription>Allow bots to unlock premium content</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-bot-unlocks"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="w-full"
                  data-testid="button-save-settings"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card data-testid="card-audit-log">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Audit Log
              </div>
            </CardTitle>
            <CardDescription>Recent treasury and economy actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.length > 0 ? (
                    auditLog.map((entry, idx) => (
                      <TableRow key={idx} data-testid={`audit-row-${idx}`}>
                        <TableCell data-testid={`audit-timestamp-${idx}`}>
                          {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell data-testid={`audit-action-${idx}`}>{entry.action}</TableCell>
                        <TableCell className={entry.amount > 0 ? 'text-green-600' : 'text-red-600'} data-testid={`audit-amount-${idx}`}>
                          {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}
                        </TableCell>
                        <TableCell data-testid={`audit-reason-${idx}`}>{entry.reason}</TableCell>
                        <TableCell data-testid={`audit-balance-${idx}`}>
                          {entry.balanceAfter?.toLocaleString() || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No audit log entries yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Drain Confirmation Dialog */}
        <AlertDialog open={drainDialogOpen} onOpenChange={setDrainDialogOpen}>
          <AlertDialogContent data-testid="dialog-drain-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Wallet Drain</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to drain <strong>{drainPercentage}%</strong> from all user wallets? This action cannot be undone and will affect all users on the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-drain">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDrain}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-drain"
              >
                Drain Wallets
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminAuthCheck>
  );
}
