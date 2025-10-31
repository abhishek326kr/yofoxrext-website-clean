"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  CheckCheck, 
  ExternalLink,
  Heart,
  MessageSquare,
  UserPlus,
  ShoppingBag,
  Trophy,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "reply" | "like" | "follow" | "purchase" | "badge" | "system";
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsClientProps {
  initialNotifications?: Notification[];
}

export default function NotificationsClient({ initialNotifications = [] }: NotificationsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', { limit: 100 }],
    initialData: initialNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('POST', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reply": return MessageSquare;
      case "like": return Heart;
      case "follow": return UserPlus;
      case "purchase": return ShoppingBag;
      case "badge": return Trophy;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reply": return "text-blue-600 dark:text-blue-400";
      case "like": return "text-red-600 dark:text-red-400";
      case "follow": return "text-green-600 dark:text-green-400";
      case "purchase": return "text-yellow-600 dark:text-yellow-400";
      case "badge": return "text-purple-600 dark:text-purple-400";
      default: return "text-muted-foreground";
    }
  };

  const filteredNotifications = notifications?.filter(n => 
    filterType === "all" || n.type === filterType
  ) || [];

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="default" data-testid="badge-unread-total">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Stay updated with all your platform activity
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 gap-4">
          <Tabs value={filterType} onValueChange={setFilterType} className="flex-1">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="reply" data-testid="tab-replies">Replies</TabsTrigger>
              <TabsTrigger value="like" data-testid="tab-likes">Likes</TabsTrigger>
              <TabsTrigger value="follow" data-testid="tab-follows">Follows</TabsTrigger>
              <TabsTrigger value="purchase" data-testid="tab-purchases">Purchases</TabsTrigger>
              <TabsTrigger value="badge" data-testid="tab-badges">Badges</TabsTrigger>
            </TabsList>
          </Tabs>

          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
              size="sm"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);
                  
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 transition-colors hover-elevate ${
                        notification.isRead ? 'opacity-60' : 'bg-muted/50'
                      }`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${notification.isRead ? 'bg-muted' : 'bg-primary/10'}`}>
                          <Icon className={`w-5 h-5 ${colorClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm ${notification.isRead ? '' : 'font-semibold'}`}>
                              {notification.title}
                            </p>
                            {notification.actionUrl && (
                              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p suppressHydrationWarning className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="text-no-notifications">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs mt-1">
                  {filterType === "all" 
                    ? "You'll be notified of important updates here"
                    : `No ${filterType} notifications yet`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
