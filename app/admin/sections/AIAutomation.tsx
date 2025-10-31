"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Ban } from "lucide-react";

// Type definitions for API responses
interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  triggerConfig: string;
  actionType: string;
  actionConfig: string;
  enabled: boolean;
  executionCount?: number;
  lastExecutedAt?: string;
}

interface ModerationStats {
  accuracyRate: number;
  falsePositives: number;
  falseNegatives: number;
  timeSavedHours: number;
}

interface ModerationDecision {
  id: string;
  contentPreview: string;
  decision: 'approved' | 'rejected';
  confidence: number;
}

interface SentimentData {
  name: string;
  value: number;
}

interface SpamMetrics {
  accuracy: number;
  blocked: number;
  flagged: number;
}

interface FlaggedContent {
  id: string;
  contentPreview: string;
  spamScore: number;
  authorUsername: string;
  flaggedAt: string;
}

export default function AIAutomation() {
  const { toast } = useToast();
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [sensitivity, setSensitivity] = useState([70]);

  // Fix: Changed endpoint from /api/admin/ai/automation-rules to /api/admin/automation/rules
  // Add explicit type annotation to ensure TypeScript knows this returns an array
  const { data: automationRulesData, isLoading: rulesLoading } = useQuery<AutomationRule[]>({
    queryKey: ["/api/admin/automation/rules"]
  });

  // Defensive programming: ensure automationRules is always an array
  const automationRules = Array.isArray(automationRulesData) ? automationRulesData : [];

  const { data: moderationStatsData, isLoading: moderationStatsLoading } = useQuery<ModerationStats>({
    queryKey: ["/api/admin/ai/moderation-stats"]
  });

  const moderationStats = moderationStatsData || {
    accuracyRate: 0,
    falsePositives: 0,
    falseNegatives: 0,
    timeSavedHours: 0
  };

  const { data: moderationDecisionsData, isLoading: decisionsLoading } = useQuery<ModerationDecision[]>({
    queryKey: ["/api/admin/ai/moderation-decisions"]
  });

  const moderationDecisions = Array.isArray(moderationDecisionsData) ? moderationDecisionsData : [];

  const { data: sentimentDataRaw, isLoading: sentimentLoading } = useQuery<SentimentData[]>({
    queryKey: ["/api/admin/ai/sentiment-distribution"]
  });

  const sentimentData = Array.isArray(sentimentDataRaw) ? sentimentDataRaw : [];

  const { data: spamMetricsData, isLoading: spamMetricsLoading } = useQuery<SpamMetrics>({
    queryKey: ["/api/admin/ai/spam-metrics"]
  });

  const spamMetrics = spamMetricsData || {
    accuracy: 0,
    blocked: 0,
    flagged: 0
  };

  const { data: flaggedContentData, isLoading: flaggedLoading } = useQuery<FlaggedContent[]>({
    queryKey: ["/api/admin/ai/flagged-content"]
  });

  const flaggedContent = Array.isArray(flaggedContentData) ? flaggedContentData : [];

  const createRuleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/automation/rules", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automation/rules"] });
      toast({ title: "Rule created successfully" });
      setIsCreateRuleOpen(false);
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => 
      apiRequest(`/api/admin/automation/rules/${id}`, "PATCH", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automation/rules"] });
      toast({ title: "Rule updated" });
    }
  });

  const executeRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/automation/rules/${id}/execute`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automation/rules"] });
      toast({ title: "Rule executed successfully" });
    }
  });

  const overrideDecisionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/ai/moderation-decisions/${id}/override`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/moderation-decisions"] });
      toast({ title: "Decision overridden" });
    }
  });

  const updateSensitivityMutation = useMutation({
    mutationFn: (value: number) => apiRequest("/api/admin/ai/spam-sensitivity", "PATCH", { sensitivity: value }),
    onSuccess: () => {
      toast({ title: "Sensitivity updated" });
    }
  });

  const handleCreateRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const triggerConfig = formData.get("triggerConfig") as string;
    const actionConfig = formData.get("actionConfig") as string;

    try {
      JSON.parse(triggerConfig);
      JSON.parse(actionConfig);
    } catch (error) {
      toast({ title: "Invalid JSON in configuration", variant: "destructive" });
      return;
    }

    createRuleMutation.mutate({
      name: formData.get("name"),
      triggerType: formData.get("triggerType"),
      triggerConfig,
      actionType: formData.get("actionType"),
      actionConfig
    });
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI & Automation</h1>

      <Tabs defaultValue="automation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automation" data-testid="tab-automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="moderation" data-testid="tab-moderation">Content Moderation AI</TabsTrigger>
          <TabsTrigger value="spam" data-testid="tab-spam">Spam Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Automation Rules</h2>
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-rule">Create Rule</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRule} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input id="name" name="name" required data-testid="input-rule-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="triggerType">Trigger Type</Label>
                    <Select name="triggerType" required>
                      <SelectTrigger data-testid="select-trigger-type">
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user_signup">User Signup</SelectItem>
                        <SelectItem value="content_published">Content Published</SelectItem>
                        <SelectItem value="time_based">Time Based</SelectItem>
                        <SelectItem value="threshold_reached">Threshold Reached</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="triggerConfig">Trigger Configuration (JSON)</Label>
                    <Textarea 
                      id="triggerConfig" 
                      name="triggerConfig" 
                      placeholder='{"key": "value"}'
                      className="font-mono text-sm"
                      required
                      data-testid="textarea-trigger-config"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actionType">Action Type</Label>
                    <Select name="actionType" required>
                      <SelectTrigger data-testid="select-action-type">
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send_email">Send Email</SelectItem>
                        <SelectItem value="create_notification">Create Notification</SelectItem>
                        <SelectItem value="award_coins">Award Coins</SelectItem>
                        <SelectItem value="assign_badge">Assign Badge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actionConfig">Action Configuration (JSON)</Label>
                    <Textarea 
                      id="actionConfig" 
                      name="actionConfig" 
                      placeholder='{"key": "value"}'
                      className="font-mono text-sm"
                      required
                      data-testid="textarea-action-config"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createRuleMutation.isPending} data-testid="button-submit-rule">
                      {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {rulesLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Executions</TableHead>
                        <TableHead>Last Executed</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automationRules.map((rule) => (
                        <TableRow key={rule.id} data-testid={`rule-${rule.id}`}>
                          <TableCell data-testid={`rule-name-${rule.id}`}>{rule.name}</TableCell>
                          <TableCell>{rule.triggerType}</TableCell>
                          <TableCell>{rule.actionType}</TableCell>
                          <TableCell>{rule.executionCount || 0}</TableCell>
                          <TableCell>
                            {rule.lastExecutedAt ? formatDistanceToNow(new Date(rule.lastExecutedAt), { addSuffix: true }) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={rule.enabled}
                              onCheckedChange={(checked) => toggleRuleMutation.mutate({ id: rule.id, enabled: checked })}
                              data-testid={`switch-rule-${rule.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => executeRuleMutation.mutate(rule.id)}
                              disabled={executeRuleMutation.isPending}
                              data-testid={`button-execute-${rule.id}`}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Execute
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {automationRules.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No automation rules created
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

        <TabsContent value="moderation" className="space-y-4">
          <h2 className="text-xl font-semibold">Content Moderation AI</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {moderationStatsLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              <>
                <Card data-testid="card-accuracy-rate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-accuracy-rate">
                      {moderationStats.accuracyRate}%
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-false-positives">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">False Positives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-false-positives">
                      {moderationStats.falsePositives}
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-false-negatives">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">False Negatives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-false-negatives">
                      {moderationStats.falseNegatives}
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-time-saved">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-time-saved">
                      {moderationStats.timeSavedHours}h
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                {decisionsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Decision</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moderationDecisions.map((decision) => (
                          <TableRow key={decision.id}>
                            <TableCell className="max-w-xs truncate">{decision.contentPreview}</TableCell>
                            <TableCell>
                              <Badge variant={decision.decision === 'approved' ? 'default' : 'destructive'}>
                                {decision.decision}
                              </Badge>
                            </TableCell>
                            <TableCell>{decision.confidence}%</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => overrideDecisionMutation.mutate(decision.id)}
                                data-testid={`button-override-${decision.id}`}
                              >
                                Override
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {moderationDecisions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No recent decisions
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {sentimentLoading ? (
                  <Skeleton className="h-64" />
                ) : sentimentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="spam" className="space-y-4">
          <h2 className="text-xl font-semibold">Spam Detection</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spamMetricsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              <>
                <Card data-testid="card-spam-accuracy">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-spam-accuracy">
                      {spamMetrics.accuracy}%
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-spam-blocked">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Spam Blocked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-spam-blocked">
                      {spamMetrics.blocked}
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-spam-flagged">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Currently Flagged</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-spam-flagged">
                      {spamMetrics.flagged}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adjust Sensitivity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sensitivity Level: {sensitivity[0]}%</Label>
                <Slider
                  value={sensitivity}
                  onValueChange={setSensitivity}
                  max={100}
                  step={1}
                  data-testid="slider-sensitivity"
                />
                <p className="text-sm text-muted-foreground">
                  Higher values will flag more content as potential spam
                </p>
              </div>
              <Button 
                onClick={() => updateSensitivityMutation.mutate(sensitivity[0])}
                disabled={updateSensitivityMutation.isPending}
                data-testid="button-update-sensitivity"
              >
                Update Sensitivity
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flagged Content</CardTitle>
            </CardHeader>
            <CardContent>
              {flaggedLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content</TableHead>
                        <TableHead>Spam Score</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Flagged At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-xs truncate">{item.contentPreview}</TableCell>
                          <TableCell>
                            <Badge variant={item.spamScore > 80 ? 'destructive' : 'secondary'}>
                              {item.spamScore}%
                            </Badge>
                          </TableCell>
                          <TableCell>{item.authorUsername}</TableCell>
                          <TableCell>{formatDistanceToNow(new Date(item.flaggedAt), { addSuffix: true })}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-approve-${item.id}`}
                            >
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {flaggedContent.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No flagged content
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
      </Tabs>
    </div>
  );
}
