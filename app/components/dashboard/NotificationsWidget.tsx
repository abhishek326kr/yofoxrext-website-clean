"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  id: string;
  type: "reply" | "like" | "follow" | "purchase" | "badge" | "system";
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsWidget() {
  const router = useRouter();
  
  const { data: notifications, isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 15000,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 15000,
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
      case "reply": return "💬";
      case "like": return "❤️";
      case "follow": return "👤";
      case "purchase": return "💰";
      case "badge": return "🏆";
      default: return "📢";
    }
  };

  return (
    <Card data-testid="card-notifications-widget">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
          {unreadCount && unreadCount.count > 0 && (
            <Badge variant="default" className="ml-2" data-testid="badge-unread-count">
              {unreadCount.count}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/notifications')}
          data-testid="button-view-all-notifications"
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left p-3 rounded-md transition-colors hover-elevate ${
                notification.isRead ? 'opacity-60' : ''
              }`}
              data-testid={`notification-item-${notification.id}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.isRead ? '' : 'font-semibold'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {notification.actionUrl && (
                  <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-notifications">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">You'll be notified of important updates here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
