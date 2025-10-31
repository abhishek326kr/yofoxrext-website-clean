"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Target, TrendingUp, CheckCircle, Clock, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Goal {
  id: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  status: "active" | "completed";
  startDate: string;
  endDate: string;
}

interface Achievement {
  id: string;
  achievement?: {
    name: string;
    icon?: string;
    requirement: number;
  };
  progress: number;
  unlockedAt?: string | null;
}

export function GoalsTab() {
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const { toast } = useToast();

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/me/goals"],
  });

  const { data: achievements, isLoading: achLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/me/achievements"],
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/me/goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/goals"] });
      toast({ title: "Goal created!", description: "Your new goal has been set." });
      setOpen(false);
    },
  });

  const handleCreateGoal = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    createGoalMutation.mutate({
      goalType,
      targetValue: parseInt(targetValue),
      currentValue: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "active",
    });
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Goals"
          value={activeGoals.length}
          icon={Target}
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-active-goals"
        />
        <KPICard
          title="Completed"
          value={completedGoals.length}
          icon={CheckCircle}
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-completed-goals"
        />
        <KPICard
          title="In Progress"
          value={activeGoals.filter((g: any) => g.currentValue > 0).length}
          icon={TrendingUp}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-in-progress-goals"
        />
        <KPICard
          title="Pending"
          value={activeGoals.filter((g: any) => g.currentValue === 0).length}
          icon={Clock}
          loading={isLoading}
          color="text-orange-500"
          data-testid="kpi-pending-goals"
        />
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-goal">
              <Plus className="h-4 w-4 mr-2" />
              Create New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Goal Type</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger data-testid="select-goal-type">
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Monthly Sales</SelectItem>
                    <SelectItem value="revenue">Revenue Target</SelectItem>
                    <SelectItem value="referrals">Referral Count</SelectItem>
                    <SelectItem value="followers">Follower Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetValue(e.target.value)}
                  placeholder="e.g., 100"
                  data-testid="input-target-value"
                />
              </div>
              <Button
                onClick={handleCreateGoal}
                disabled={!goalType || !targetValue || createGoalMutation.isPending}
                className="w-full"
                data-testid="button-submit-goal"
              >
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ChartContainer title="Active Goals" loading={isLoading}>
        <div className="space-y-6">
          {activeGoals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active goals. Create one to get started!</p>
          ) : (
            activeGoals.map((goal: any) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{goal.goalType}</p>
                    <p className="text-sm text-muted-foreground">
                      {goal.currentValue} / {goal.targetValue}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                  </span>
                </div>
                <Progress value={(goal.currentValue / goal.targetValue) * 100} />
              </div>
            ))
          )}
        </div>
      </ChartContainer>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer title="Completed Goals" loading={isLoading}>
          <div className="space-y-4">
            {completedGoals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No completed goals yet</p>
            ) : (
              completedGoals.slice(0, 5).map((goal: any) => (
                <div key={goal.id} className="flex items-center gap-3 pb-4 border-b last:border-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">{goal.goalType}</p>
                    <p className="text-sm text-muted-foreground">Target: {goal.targetValue}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartContainer>

        <ChartContainer title="Achievement Badges" loading={achLoading}>
          <div className="grid grid-cols-3 gap-4">
            {achievements?.slice(0, 6).map((ach: any) => (
              <div key={ach.id} className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">{ach.achievement?.icon || "🏆"}</span>
                </div>
                <p className="text-sm font-medium">{ach.achievement?.name}</p>
                {ach.unlockedAt ? (
                  <span className="text-xs text-green-500">Unlocked</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {ach.progress}/{ach.achievement?.requirement}
                  </span>
                )}
              </div>
            )) || <p className="text-muted-foreground text-center col-span-3">No achievements yet</p>}
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
