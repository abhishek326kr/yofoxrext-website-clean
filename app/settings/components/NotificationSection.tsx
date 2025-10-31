"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Bell, Mail, MessageSquare, TrendingUp, Award, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  newReplies: z.boolean(),
  newFollowers: z.boolean(),
  mentions: z.boolean(),
  contentLikes: z.boolean(),
  contentPurchases: z.boolean(),
  weeklyDigest: z.boolean(),
  marketingEmails: z.boolean(),
  pushNotifications: z.boolean(),
  threadUpdates: z.boolean(),
  achievementUnlocked: z.boolean(),
  coinEarnings: z.boolean(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

interface NotificationSectionProps {
  initialUser: any;
}

export default function NotificationSection({ initialUser }: NotificationSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: initialUser?.emailNotifications ?? true,
      newReplies: true,
      newFollowers: true,
      mentions: true,
      contentLikes: true,
      contentPurchases: true,
      weeklyDigest: true,
      marketingEmails: false,
      pushNotifications: true,
      threadUpdates: true,
      achievementUnlocked: true,
      coinEarnings: true,
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const response = await apiRequest("PATCH", "/api/user/notifications", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    updateNotificationsMutation.mutate(data);
  };

  const notificationGroups = [
    {
      title: "Community Interactions",
      description: "Get notified about interactions with your content and profile",
      icon: MessageSquare,
      notifications: [
        {
          name: "newReplies" as const,
          label: "New Replies",
          description: "When someone replies to your threads or comments",
        },
        {
          name: "mentions" as const,
          label: "Mentions",
          description: "When someone mentions you in a thread or comment",
        },
        {
          name: "newFollowers" as const,
          label: "New Followers",
          description: "When someone follows your profile",
        },
        {
          name: "contentLikes" as const,
          label: "Content Likes",
          description: "When someone likes your content or posts",
        },
      ],
    },
    {
      title: "Marketplace & Earnings",
      description: "Stay updated on your sales and earnings",
      icon: DollarSign,
      notifications: [
        {
          name: "contentPurchases" as const,
          label: "Content Purchases",
          description: "When someone purchases your content",
        },
        {
          name: "coinEarnings" as const,
          label: "Coin Earnings",
          description: "When you earn coins from activities or rewards",
        },
      ],
    },
    {
      title: "Activity Updates",
      description: "Follow threads and topics you're interested in",
      icon: TrendingUp,
      notifications: [
        {
          name: "threadUpdates" as const,
          label: "Thread Updates",
          description: "Get updates on threads you're following or participating in",
        },
        {
          name: "achievementUnlocked" as const,
          label: "Achievement Unlocked",
          description: "When you unlock new badges or achievements",
        },
      ],
    },
    {
      title: "Email Preferences",
      description: "Control what emails you receive from us",
      icon: Mail,
      notifications: [
        {
          name: "weeklyDigest" as const,
          label: "Weekly Digest",
          description: "Get a weekly summary of trending content and activity",
        },
        {
          name: "marketingEmails" as const,
          label: "Marketing Emails",
          description: "Receive updates about new features and promotions",
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how and when you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Master Email Notifications</Label>
                      <FormDescription>
                        Enable or disable all email notifications at once
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-master-email"
                      />
                    </FormControl>
                  </div>
                )}
              />

              <Separator />

              {notificationGroups.map((group, groupIndex) => {
                const GroupIcon = group.icon;
                return (
                  <div key={groupIndex} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <GroupIcon className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{group.title}</h3>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      </div>
                    </div>
                    <div className="space-y-3 ml-7">
                      {group.notifications.map((notification) => (
                        <FormField
                          key={notification.name}
                          control={form.control}
                          name={notification.name}
                          render={({ field }) => (
                            <div className="flex items-center justify-between py-2">
                              <div className="space-y-0.5 flex-1">
                                <Label className="font-medium">{notification.label}</Label>
                                <FormDescription className="text-sm">
                                  {notification.description}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid={`switch-${notification.name}`}
                                />
                              </FormControl>
                            </div>
                          )}
                        />
                      ))}
                    </div>
                    {groupIndex < notificationGroups.length - 1 && <Separator />}
                  </div>
                );
              })}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={updateNotificationsMutation.isPending}
                  data-testid="button-save-notifications"
                >
                  {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => form.reset()}
                  data-testid="button-reset-notifications"
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
