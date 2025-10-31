"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  User,
  Shield, 
  Coins,
  Bell,
  Youtube,
  Instagram,
  Send,
  Lock,
  CheckCircle2,
  Award,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const profileSchema = z.object({
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  instagramHandle: z.string().min(1).max(50).optional().or(z.literal("")),
  telegramHandle: z.string().min(1).max(50).optional().or(z.literal("")),
  myfxbookLink: z.string().url().optional().or(z.literal("")),
  investorId: z.string().optional().or(z.literal("")),
  investorPassword: z.string().optional().or(z.literal("")),
  emailNotifications: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type StringProfileFields = Exclude<keyof ProfileFormData, "emailNotifications">;

interface UserSettingsClientProps {
  initialUser: any;
  initialCoins: {
    totalCoins: number;
    weeklyEarned: number;
    rank: number | null;
  } | null;
}

export default function UserSettingsClient({ initialUser, initialCoins }: UserSettingsClientProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const mockUserData = {
    youtubeUrl: initialUser?.youtubeUrl || "",
    instagramHandle: initialUser?.instagramHandle || "",
    telegramHandle: initialUser?.telegramHandle || "",
    myfxbookLink: initialUser?.myfxbookLink || "",
    investorId: initialUser?.investorId || "",
    investorPassword: initialUser?.investorPassword || "",
    emailNotifications: initialUser?.emailNotifications ?? true,
    hasYoutubeReward: initialUser?.hasYoutubeReward || false,
    hasMyfxbookReward: initialUser?.hasMyfxbookReward || false,
    hasInvestorReward: initialUser?.hasInvestorReward || false,
    isVerifiedTrader: initialUser?.isVerifiedTrader || false,
  };

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: mockUserData,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      const rewardsEarned = data?.coinsEarned || 0;
      if (rewardsEarned > 0) {
        toast({
          title: "Profile Updated & Coins Earned!",
          description: `You earned ${rewardsEarned} gold coins for completing your profile!`,
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const rewardItems = [
    {
      field: "youtubeUrl",
      label: "YouTube Channel",
      icon: Youtube,
      iconColor: "text-red-600",
      reward: 25,
      claimed: mockUserData.hasYoutubeReward,
      placeholder: "https://youtube.com/c/...",
    },
    {
      field: "myfxbookLink",
      label: "Myfxbook Profile",
      icon: TrendingUp,
      iconColor: "text-blue-600",
      reward: 100,
      claimed: mockUserData.hasMyfxbookReward,
      placeholder: "https://www.myfxbook.com/members/...",
    },
    {
      field: "investorId",
      label: "Investor Credentials (Submit for Verification)",
      icon: Shield,
      iconColor: "text-primary",
      reward: 250,
      claimed: mockUserData.hasInvestorReward,
      placeholder: "Investor ID",
      isSecure: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">User Settings</h1>
          <p className="text-lg text-muted-foreground">
            Manage your profile, verification, and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              My Profile & Verification
            </TabsTrigger>
            <TabsTrigger value="preferences" data-testid="tab-preferences">
              <Bell className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Profile & Verification
                </CardTitle>
                <CardDescription>
                  Complete your profile to earn gold coins and build trust. Investor credentials are encrypted and never displayed publicly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {rewardItems.map((item) => (
                      <div key={item.field} className="relative">
                        <FormField
                          control={form.control}
                          name={item.field as StringProfileFields}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between mb-2">
                                <FormLabel className="flex items-center gap-2">
                                  <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                                  {item.label}
                                </FormLabel>
                                {!item.claimed && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Coins className="w-3 h-3 text-primary" />
                                    Earn +{item.reward} Coins
                                  </Badge>
                                )}
                                {item.claimed && (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Reward Claimed
                                  </Badge>
                                )}
                              </div>
                              <FormControl>
                                <Input
                                  placeholder={item.placeholder}
                                  type={item.isSecure ? "password" : "text"}
                                  {...field}
                                  data-testid={`input-${item.field}`}
                                />
                              </FormControl>
                              {item.isSecure && (
                                <FormDescription className="flex items-center gap-1 text-xs">
                                  <Lock className="w-3 h-3" />
                                  Encrypted and never displayed publicly. For admin verification only.
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}

                    {/* Investor Password - shown only if Investor ID is filled */}
                    {form.watch("investorId") && (
                      <FormField
                        control={form.control}
                        name="investorPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-primary" />
                              Investor Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Investor Password"
                                type="password"
                                {...field}
                                data-testid="input-investorPassword"
                              />
                            </FormControl>
                            <FormDescription className="flex items-center gap-1 text-xs">
                              <Lock className="w-3 h-3" />
                              Encrypted. Read-only access for admin verification.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4">Additional Social Links</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="instagramHandle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-600" />
                                Instagram Handle
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="@yourhandle"
                                  {...field}
                                  data-testid="input-instagramHandle"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="telegramHandle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-blue-600" />
                                Telegram Handle
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="@yourhandle"
                                  {...field}
                                  data-testid="input-telegramHandle"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {mockUserData.isVerifiedTrader && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                          <Shield className="w-5 h-5" />
                          <div>
                            <h4 className="font-semibold">Verified Trader Status</h4>
                            <p className="text-sm">
                              Your account has been verified by our admin team. Your "Verified Trader" badge is now displayed on your profile and posts.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={() => form.reset()}
                        data-testid="button-reset-form"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Manage how you receive updates from YoForex
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New Posts from Followed Users</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when someone you follow creates a new thread
                          </p>
                        </div>
                        <Switch 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-email-notifications"
                        />
                      </div>
                    )}
                  />
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" data-testid="button-change-password">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <EnhancedFooter />
    </div>
  );
}
