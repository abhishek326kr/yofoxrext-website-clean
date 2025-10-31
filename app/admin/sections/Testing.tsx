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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Square, Trophy } from "lucide-react";

interface TestVariant {
  id: string;
  name: string;
}

interface TestResult {
  variantId: string;
  variantName: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed';
  variants: TestVariant[];
  trafficAllocation: Record<string, number>;
  results?: TestResult[];
  winner?: string;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rollout: number;
  targetUsers: string[];
}

export default function Testing() {
  const { toast } = useToast();
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [isCreateFlagOpen, setIsCreateFlagOpen] = useState(false);
  const [isRolloutDialogOpen, setIsRolloutDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [rolloutPercentage, setRolloutPercentage] = useState([0]);

  const { data: abTestsRaw, isLoading: testsLoading } = useQuery<ABTest[]>({
    queryKey: ["/api/admin/testing/ab-tests"]
  });

  const abTests: ABTest[] = Array.isArray(abTestsRaw) ? abTestsRaw : [];

  const { data: featureFlagsRaw, isLoading: flagsLoading } = useQuery<FeatureFlag[]>({
    queryKey: ["/api/admin/testing/feature-flags"]
  });

  const featureFlags: FeatureFlag[] = Array.isArray(featureFlagsRaw) ? featureFlagsRaw : [];

  const createTestMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/testing/ab-tests", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testing/ab-tests"] });
      toast({ title: "A/B test created successfully" });
      setIsCreateTestOpen(false);
    }
  });

  const startTestMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/testing/ab-tests/${id}/start`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testing/ab-tests"] });
      toast({ title: "Test started" });
    }
  });

  const stopTestMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/testing/ab-tests/${id}/stop`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testing/ab-tests"] });
      toast({ title: "Test stopped" });
    }
  });

  const declareWinnerMutation = useMutation({
    mutationFn: ({ testId, variantId }: { testId: string; variantId: string }) => 
      apiRequest(`/api/admin/testing/ab-tests/${testId}/winner`, "POST", { variantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testing/ab-tests"] });
      toast({ title: "Winner declared" });
    }
  });

  const createFlagMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/testing/feature-flags", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testing/feature-flags"] });
      toast({ title: "Feature flag created successfully" });
      setIsCreateFlagOpen(false);
    }
  });

  const toggleFlagMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => 
      apiRequest(`/api/admin/testing/feature-flags/${id}/toggle`, "PATCH", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testing/feature-flags"] });
      toast({ title: "Feature flag updated" });
    }
  });

  const updateRolloutMutation = useMutation({
    mutationFn: ({ id, rollout }: { id: string; rollout: number }) => 
      apiRequest(`/api/admin/testing/feature-flags/${id}/rollout`, "PATCH", { rollout }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testing/feature-flags"] });
      toast({ title: "Rollout percentage updated" });
      setIsRolloutDialogOpen(false);
    }
  });

  const handleCreateTest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const variants = formData.get("variants") as string;
    const trafficAllocation = formData.get("trafficAllocation") as string;

    try {
      const parsedVariants = JSON.parse(variants);
      const parsedAllocation = JSON.parse(trafficAllocation);

      createTestMutation.mutate({
        name: formData.get("name"),
        description: formData.get("description"),
        variants: parsedVariants,
        trafficAllocation: parsedAllocation
      });
    } catch (error) {
      toast({ title: "Invalid JSON format", variant: "destructive" });
    }
  };

  const handleCreateFlag = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const targetUsers = (formData.get("targetUsers") as string)
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);

    createFlagMutation.mutate({
      key: formData.get("key"),
      name: formData.get("name"),
      description: formData.get("description"),
      enabled: false,
      rollout: 0,
      targetUsers
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Testing & Experiments</h1>

      <Tabs defaultValue="ab-tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ab-tests" data-testid="tab-ab-tests">A/B Tests</TabsTrigger>
          <TabsTrigger value="feature-flags" data-testid="tab-feature-flags">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="ab-tests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">A/B Tests</h2>
            <Dialog open={isCreateTestOpen} onOpenChange={setIsCreateTestOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-test">Create A/B Test</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create A/B Test</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-name">Test Name</Label>
                    <Input id="test-name" name="name" required data-testid="input-test-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-description">Description</Label>
                    <Textarea id="test-description" name="description" required data-testid="textarea-test-description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variants">Variants (JSON Array)</Label>
                    <Textarea
                      id="variants"
                      name="variants"
                      placeholder='[{"id": "A", "name": "Control"}, {"id": "B", "name": "Variant B"}]'
                      className="font-mono text-sm"
                      rows={3}
                      required
                      data-testid="textarea-variants"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trafficAllocation">Traffic Allocation (JSON Object)</Label>
                    <Textarea
                      id="trafficAllocation"
                      name="trafficAllocation"
                      placeholder='{"A": 50, "B": 50}'
                      className="font-mono text-sm"
                      rows={2}
                      required
                      data-testid="textarea-traffic-allocation"
                    />
                    <p className="text-xs text-muted-foreground">Percentages should add up to 100</p>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createTestMutation.isPending} data-testid="button-submit-test">
                      {createTestMutation.isPending ? "Creating..." : "Create Test"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {testsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Variants</TableHead>
                        <TableHead>Traffic</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abTests.map((test) => (
                        <TableRow key={test.id} data-testid={`test-${test.id}`}>
                          <TableCell className="font-medium" data-testid={`test-name-${test.id}`}>
                            {test.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                test.status === 'running' ? 'default' :
                                test.status === 'completed' ? 'secondary' :
                                'outline'
                              }
                            >
                              {test.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {test.variants.map((variant) => (
                                <Badge key={variant.id} variant="outline" className="text-xs">
                                  {variant.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {Object.entries(test.trafficAllocation).map(([key, value]) => (
                                <div key={key}>{key}: {value}%</div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {test.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => startTestMutation.mutate(test.id)}
                                  disabled={startTestMutation.isPending}
                                  data-testid={`button-start-${test.id}`}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Start
                                </Button>
                              )}
                              {test.status === 'running' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => stopTestMutation.mutate(test.id)}
                                  disabled={stopTestMutation.isPending}
                                  data-testid={`button-stop-${test.id}`}
                                >
                                  <Square className="w-3 h-3 mr-1" />
                                  Stop
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {abTests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No A/B tests created
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {abTests.filter((test) => test.status === 'running' || test.status === 'completed').map((test) => (
            <Card key={`results-${test.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Results: {test.name}</CardTitle>
                {test.status === 'completed' && test.winner && (
                  <Badge variant="default">
                    <Trophy className="w-3 h-3 mr-1" />
                    Winner: {test.winner}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>Impressions</TableHead>
                        <TableHead>Conversions</TableHead>
                        <TableHead>Conversion Rate</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(test.results || []).map((result) => (
                        <TableRow key={result.variantId}>
                          <TableCell className="font-medium">{result.variantName}</TableCell>
                          <TableCell>{result.impressions}</TableCell>
                          <TableCell>{result.conversions}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{result.conversionRate}%</Badge>
                          </TableCell>
                          <TableCell>
                            {test.status === 'running' && !test.winner && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => declareWinnerMutation.mutate({ 
                                  testId: test.id, 
                                  variantId: result.variantId 
                                })}
                                disabled={declareWinnerMutation.isPending}
                                data-testid={`button-declare-winner-${result.variantId}`}
                              >
                                Declare Winner
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="feature-flags" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feature Flags</h2>
            <Dialog open={isCreateFlagOpen} onOpenChange={setIsCreateFlagOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-flag">Create Feature Flag</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feature Flag</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateFlag} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="flag-key">Flag Key</Label>
                    <Input
                      id="flag-key"
                      name="key"
                      placeholder="new_feature_enabled"
                      required
                      data-testid="input-flag-key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flag-name">Flag Name</Label>
                    <Input id="flag-name" name="name" required data-testid="input-flag-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flag-description">Description</Label>
                    <Textarea id="flag-description" name="description" data-testid="textarea-flag-description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetUsers">Target Users (comma-separated IDs, optional)</Label>
                    <Textarea
                      id="targetUsers"
                      name="targetUsers"
                      placeholder="user-123, user-456"
                      data-testid="textarea-target-users"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createFlagMutation.isPending} data-testid="button-submit-flag">
                      {createFlagMutation.isPending ? "Creating..." : "Create Flag"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {flagsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flag Key</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead>Rollout %</TableHead>
                        <TableHead>Target Users</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {featureFlags.map((flag) => (
                        <TableRow key={flag.id} data-testid={`flag-${flag.id}`}>
                          <TableCell className="font-mono text-sm" data-testid={`flag-key-${flag.id}`}>
                            {flag.key}
                          </TableCell>
                          <TableCell className="font-medium">{flag.name}</TableCell>
                          <TableCell>
                            <Switch
                              checked={flag.enabled}
                              onCheckedChange={(checked) => 
                                toggleFlagMutation.mutate({ id: flag.id, enabled: checked })
                              }
                              data-testid={`switch-flag-${flag.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{flag.rollout}%</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {flag.targetUsers.length} users
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFlag(flag);
                                setRolloutPercentage([flag.rollout]);
                                setIsRolloutDialogOpen(true);
                              }}
                              data-testid={`button-rollout-${flag.id}`}
                            >
                              Adjust Rollout
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {featureFlags.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No feature flags created
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isRolloutDialogOpen} onOpenChange={setIsRolloutDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust Rollout Percentage</DialogTitle>
              </DialogHeader>
              {selectedFlag && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rollout: {rolloutPercentage[0]}%</Label>
                    <Slider
                      value={rolloutPercentage}
                      onValueChange={setRolloutPercentage}
                      max={100}
                      step={1}
                      data-testid="slider-rollout"
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentage of users who will see this feature
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => 
                        updateRolloutMutation.mutate({ 
                          id: selectedFlag.id, 
                          rollout: rolloutPercentage[0] 
                        })
                      }
                      disabled={updateRolloutMutation.isPending}
                      data-testid="button-save-rollout"
                    >
                      {updateRolloutMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
