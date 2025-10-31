"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { FilterPanel } from "../shared/FilterPanel";
import { Bell, BellOff, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "system" | "sale" | "message" | "alert";
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsTab() {
  const [filters, setFilters] = useState({});
  const { toast } = useToast();

  const { data: notificationsData, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/me/notifications", filters],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/notifications"] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const notifications = notificationsData || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const todayCount = notifications.filter(
    (n) =>
      new Date(n.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const notificationsByType = [
    {
      type: "system",
      count: notifications.filter((n) => n.type === "system").length,
    },
    {
      type: "sale",
      count: notifications.filter((n) => n.type === "sale").length,
    },
    {
      type: "message",
      count: notifications.filter((n) => n.type === "message").length,
    },
    {
      type: "alert",
      count: notifications.filter((n) => n.type === "alert").length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Notifications"
          value={notifications.length}
          icon={Bell}
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-total-notifications"
        />
        <KPICard
          title="Unread"
          value={unreadCount}
          icon={Mail}
          loading={isLoading}
          color="text-orange-500"
          data-testid="kpi-unread-notifications"
        />
        <KPICard
          title="Today"
          value={todayCount}
          icon={Bell}
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-today-notifications"
        />
        <KPICard
          title="Read"
          value={notifications.length - unreadCount}
          icon={CheckCircle}
          loading={isLoading}
          color="text-gray-500"
          data-testid="kpi-read-notifications"
        />
      </div>

      <FilterPanel
        onFilterChange={setFilters}
        showCategory
        showStatus
        categories={["system", "sale", "message", "alert"]}
        statuses={["read", "unread"]}
      />

      <ChartContainer
        title="Notification Feed"
        loading={isLoading}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            data-testid="button-mark-all-read"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        }
      >
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 border rounded-lg ${
                  !notification.isRead ? "bg-muted/50" : ""
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold" data-testid={`notification-title-${notification.id}`}>
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <Badge variant="default" data-testid={`badge-unread-${notification.id}`}>
                        New
                      </Badge>
                    )}
                    <Badge variant="outline" data-testid={`badge-type-${notification.id}`}>
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2" data-testid={`notification-description-${notification.id}`}>
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    disabled={markAsReadMutation.isPending}
                    data-testid={`button-mark-read-${notification.id}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ChartContainer>

      <ChartContainer title="Notifications by Type" loading={isLoading}>
        <DataTable
          columns={[
            { key: "type", label: "Type" },
            { key: "count", label: "Count" },
          ]}
          data={notificationsByType}
          loading={isLoading}
          searchable={false}
        />
      </ChartContainer>
    </div>
  );
}
