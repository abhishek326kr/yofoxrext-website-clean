"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity,
  UserPlus, 
  FileText, 
  Upload, 
  MessageSquare, 
  ShoppingBag,
  Trophy
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  userId: string;
  activityType: "thread_created" | "reply_posted" | "content_published" | "purchase_made" | "review_posted" | "badge_earned";
  entityType: string;
  entityId: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export default function ActivityTimelineWidget() {
  const { data: activities, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activity/recent'],
    refetchInterval: 20000,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "thread_created": return FileText;
      case "reply_posted": return MessageSquare;
      case "content_published": return Upload;
      case "purchase_made": return ShoppingBag;
      case "badge_earned": return Trophy;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "thread_created": return "text-blue-600 dark:text-blue-400";
      case "reply_posted": return "text-green-600 dark:text-green-400";
      case "content_published": return "text-purple-600 dark:text-purple-400";
      case "purchase_made": return "text-yellow-600 dark:text-yellow-400";
      case "badge_earned": return "text-orange-600 dark:text-orange-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card data-testid="card-activity-timeline-widget">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.activityType);
                const colorClass = getActivityColor(activity.activityType);
                
                return (
                  <div 
                    key={activity.id} 
                    className="relative flex gap-3 items-start"
                    data-testid={`activity-item-${index}`}
                  >
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-card border-2 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-activity">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Activity from the community will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
