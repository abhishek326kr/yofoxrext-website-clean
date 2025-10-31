"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, TestTube, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AdminAuthCheck } from "../../auth-check";

const botSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^@?[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  purpose: z.enum(["engagement", "marketplace", "referral"]),
  trustLevel: z.number().min(2).max(5),
  activityCaps: z.object({
    dailyLikes: z.number().min(0).max(50),
    dailyFollows: z.number().min(0).max(20),
    dailyPurchases: z.number().min(0).max(10),
    dailyUnlocks: z.number().min(0).max(20)
  })
});

type BotFormData = z.infer<typeof botSchema>;

const purposeDefaults = {
  engagement: {
    dailyLikes: 20,
    dailyFollows: 5,
    dailyPurchases: 1,
    dailyUnlocks: 8
  },
  marketplace: {
    dailyLikes: 5,
    dailyFollows: 2,
    dailyPurchases: 5,
    dailyUnlocks: 3
  },
  referral: {
    dailyLikes: 8,
    dailyFollows: 10,
    dailyPurchases: 1,
    dailyUnlocks: 2
  }
};

export default function CreateBotPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);

  const form = useForm<BotFormData>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bio: "",
      avatarUrl: "",
      purpose: "engagement",
      trustLevel: 3,
      activityCaps: purposeDefaults.engagement
    }
  });

  const generateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/bots/generate-profile", {
        purpose: form.getValues("purpose")
      });
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("username", data.username);
      form.setValue("displayName", data.displayName);
      form.setValue("bio", data.bio);
      form.setValue("avatarUrl", data.avatarUrl || "");
      form.setValue("trustLevel", data.trustLevel);
      form.setValue("activityCaps", data.activityCaps);
      toast({ title: "Profile generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate profile", variant: "destructive" });
    }
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: BotFormData) => {
      const response = await apiRequest("POST", "/api/admin/bots/create", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setCreatedBotId(data.id);
      toast({ title: "Bot created successfully!" });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to create bot";
      toast({ title: message, variant: "destructive" });
    }
  });

  const testRunMutation = useMutation({
    mutationFn: async (botId: string) => {
      return apiRequest("POST", `/api/admin/bots/${botId}/test-run`, {});
    },
    onSuccess: () => {
      toast({ title: "Test run completed successfully" });
      router.push("/admin/bots");
    },
    onError: () => {
      toast({ title: "Test run failed", variant: "destructive" });
    }
  });

  const onSubmit = (data: BotFormData) => {
    createBotMutation.mutate(data);
  };

  const handlePurposeChange = (purpose: "engagement" | "marketplace" | "referral") => {
    form.setValue("purpose", purpose);
    form.setValue("activityCaps", purposeDefaults[purpose]);
  };

  return (
    <AdminAuthCheck>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/bots")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bots
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold" data-testid="title-create-bot">Create New Bot</h1>
          <p className="text-muted-foreground">Configure a new automated bot for the platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bot Configuration</CardTitle>
            <CardDescription>
              Fill in the bot details or generate a random profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generateProfileMutation.mutate()}
                    disabled={generateProfileMutation.isPending}
                    data-testid="button-generate-profile"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Random Profile
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="@traderpro123" {...field} data-testid="input-username" />
                        </FormControl>
                        <FormDescription>Bot's unique username (with or without @)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="TraderPro123" {...field} data-testid="input-displayname" />
                        </FormControl>
                        <FormDescription>Public display name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Trading forex for 5 years. Focus on EUR/USD. Scalping trader." 
                          {...field} 
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormDescription>Bot's profile bio</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://i.pravatar.cc/150?img=1" {...field} data-testid="input-avatar" />
                      </FormControl>
                      <FormDescription>Profile picture URL</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => handlePurposeChange(value as any)}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-purpose">
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="engagement">Engagement</SelectItem>
                            <SelectItem value="marketplace">Marketplace</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Bot's primary purpose</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trustLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trust Level: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={2}
                            max={5}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            data-testid="slider-trust-level"
                          />
                        </FormControl>
                        <FormDescription>Bot's trust level (2-5)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Activity Caps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="activityCaps.dailyLikes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Likes: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={50}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              data-testid="slider-daily-likes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activityCaps.dailyFollows"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Follows: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={20}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              data-testid="slider-daily-follows"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activityCaps.dailyPurchases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Purchases: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={10}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              data-testid="slider-daily-purchases"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activityCaps.dailyUnlocks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Unlocks: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={20}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              data-testid="slider-daily-unlocks"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  {createdBotId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testRunMutation.mutate(createdBotId)}
                      disabled={testRunMutation.isPending}
                      data-testid="button-test-run"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Run
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={createBotMutation.isPending || !!createdBotId}
                    data-testid="button-create-bot"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    {createBotMutation.isPending ? "Creating..." : createdBotId ? "Bot Created!" : "Create Bot"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminAuthCheck>
  );
}
