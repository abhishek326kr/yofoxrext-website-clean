"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { FilterPanel } from "../shared/FilterPanel";
import { Mail, TrendingUp, MousePointer, DollarSign, Plus } from "lucide-react";
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  type: "email" | "banner" | "social";
  status: "draft" | "active" | "paused" | "completed";
  sentCount: number;
  openRate: number;
  clickRate: number;
  conversions: number;
  revenue: number;
  createdAt: string;
}

export function MarketingTab() {
  const [filters, setFilters] = useState({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "email",
    subject: "",
    content: "",
  });
  const { toast } = useToast();

  const { data: campaignsData, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/me/campaigns", filters],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<Record<string, any>>({
    queryKey: ["/api/me/campaign-stats"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return await apiRequest("POST", "/api/campaigns", campaignData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/campaigns"] });
      setIsCreateOpen(false);
      setNewCampaign({ name: "", type: "email", subject: "", content: "" });
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    },
  });

  const campaigns = campaignsData || [];
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const avgOpenRate =
    campaigns.length > 0
      ? campaigns.reduce((acc, c) => acc + c.openRate, 0) / campaigns.length
      : 0;
  const avgClickRate =
    campaigns.length > 0
      ? campaigns.reduce((acc, c) => acc + c.clickRate, 0) / campaigns.length
      : 0;

  const performanceData = campaigns.map((c) => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
    opens: c.openRate,
    clicks: c.clickRate,
  }));

  const revenueData = campaigns
    .filter((c) => c.revenue > 0)
    .map((c) => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
      revenue: c.revenue,
    }));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "paused":
        return "outline";
      case "completed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate(newCampaign);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Mail}
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-active-campaigns"
        />
        <KPICard
          title="Total Sent"
          value={totalSent.toLocaleString()}
          icon={TrendingUp}
          trend={15.3}
          trendLabel="vs last month"
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-total-sent"
        />
        <KPICard
          title="Avg Open Rate"
          value={`${avgOpenRate.toFixed(1)}%`}
          icon={Mail}
          trend={2.4}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-avg-open-rate"
        />
        <KPICard
          title="Avg Click Rate"
          value={`${avgClickRate.toFixed(1)}%`}
          icon={MousePointer}
          trend={1.8}
          loading={isLoading}
          color="text-orange-500"
          data-testid="kpi-avg-click-rate"
        />
      </div>

      <div className="flex items-center justify-between">
        <FilterPanel
          onFilterChange={setFilters}
          showDateRange
          showCategory
          showStatus
          categories={["email", "banner", "social"]}
          statuses={["draft", "active", "paused", "completed"]}
        />
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-campaign">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new marketing campaign to engage your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Summer Sale 2024"
                  value={newCampaign.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                  data-testid="input-campaign-name"
                />
              </div>
              <div>
                <Label htmlFor="campaign-type">Type</Label>
                <Select
                  value={newCampaign.type}
                  onValueChange={(value: string) =>
                    setNewCampaign({ ...newCampaign, type: value })
                  }
                >
                  <SelectTrigger id="campaign-type" data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="campaign-subject">Subject Line</Label>
                <Input
                  id="campaign-subject"
                  placeholder="e.g., Get 50% off all EAs this week!"
                  value={newCampaign.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewCampaign({ ...newCampaign, subject: e.target.value })
                  }
                  data-testid="input-campaign-subject"
                />
              </div>
              <div>
                <Label htmlFor="campaign-content">Content</Label>
                <Textarea
                  id="campaign-content"
                  placeholder="Write your campaign message..."
                  rows={5}
                  value={newCampaign.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewCampaign({ ...newCampaign, content: e.target.value })
                  }
                  data-testid="textarea-campaign-content"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  data-testid="button-cancel-campaign"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={createCampaignMutation.isPending || !newCampaign.name}
                  data-testid="button-submit-campaign"
                >
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer title="Campaign Performance (Open & Click Rates)" loading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="opens" fill="hsl(var(--chart-1))" name="Open Rate %" />
              <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Click Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Revenue by Campaign" loading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <ChartContainer title="All Campaigns" loading={isLoading}>
        <DataTable
          columns={[
            {
              key: "name",
              label: "Campaign",
              render: (val: string) => (
                <span className="font-medium" data-testid={`campaign-name-${val}`}>{val}</span>
              ),
            },
            {
              key: "type",
              label: "Type",
              render: (val: string) => (
                <Badge variant="outline" data-testid={`campaign-type-${val}`}>
                  {val}
                </Badge>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (val: string) => (
                <Badge variant={getStatusBadgeVariant(val)} data-testid={`campaign-status-${val}`}>
                  {val}
                </Badge>
              ),
            },
            {
              key: "sentCount",
              label: "Sent",
              render: (val: number) => <span data-testid="campaign-sent">{val.toLocaleString()}</span>,
            },
            {
              key: "openRate",
              label: "Open Rate",
              render: (val: number) => (
                <span className="text-green-500 font-semibold" data-testid="campaign-open-rate">
                  {val.toFixed(1)}%
                </span>
              ),
            },
            {
              key: "clickRate",
              label: "Click Rate",
              render: (val: number) => (
                <span className="text-blue-500 font-semibold" data-testid="campaign-click-rate">
                  {val.toFixed(1)}%
                </span>
              ),
            },
            {
              key: "conversions",
              label: "Conversions",
              render: (val: number) => <span data-testid="campaign-conversions">{val}</span>,
            },
            {
              key: "revenue",
              label: "Revenue",
              render: (val: number) => (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold" data-testid="campaign-revenue">{val}</span>
                </div>
              ),
            },
          ]}
          data={campaigns}
          loading={isLoading}
        />
      </ChartContainer>
    </div>
  );
}
