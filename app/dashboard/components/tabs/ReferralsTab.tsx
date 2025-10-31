"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { KPICard } from "../shared/KPICard";
import { ChartContainer } from "../shared/ChartContainer";
import { DataTable } from "../shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, DollarSign, TrendingUp, Link as LinkIcon, Copy, Check, Share2 } from "lucide-react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  monthlyEarnings: number;
}

interface Referral {
  username: string;
  joined: string;
  earnings: string;
  status: string;
}

export function ReferralsTab() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/me/referral-stats"],
  });

  const { data: referrals, isLoading: refLoading } = useQuery<Referral[]>({
    queryKey: ["/api/me/referrals"],
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/me/generate-referral-code"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/referrals"] });
      toast({ title: "Referral code generated!", description: "Share your new link to start earning." });
    },
  });

  const referralLink = "https://yoforex.com/ref/ABC123";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const mockEarningsData = [
    { month: "Jan", earnings: 45 },
    { month: "Feb", earnings: 52 },
    { month: "Mar", earnings: 78 },
    { month: "Apr", earnings: 95 },
    { month: "May", earnings: 120 },
    { month: "Jun", earnings: 145 },
  ];

  const referralList = referrals || [
    { username: "trader123", joined: "2024-01-15", earnings: "$45", status: "Active" },
    { username: "forex_pro", joined: "2024-02-20", earnings: "$32", status: "Active" },
    { username: "newbie_t", joined: "2024-03-05", earnings: "$18", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Referrals"
          value={stats?.totalReferrals || 0}
          icon={Users}
          trend={12}
          trendLabel="this month"
          loading={statsLoading}
          color="text-blue-500"
          data-testid="kpi-total-referrals"
        />
        <KPICard
          title="Total Earnings"
          value={`$${stats?.totalEarnings || 0}`}
          icon={DollarSign}
          trend={18.5}
          loading={statsLoading}
          color="text-green-500"
          data-testid="kpi-referral-total-earnings"
        />
        <KPICard
          title="This Month"
          value={`$${stats?.monthlyEarnings || 0}`}
          icon={TrendingUp}
          loading={statsLoading}
          color="text-purple-500"
          data-testid="kpi-referral-month-earnings"
        />
        <KPICard
          title="Avg per User"
          value={`$${stats?.totalReferrals ? (stats.totalEarnings / stats.totalReferrals).toFixed(2) : '0.00'}`}
          icon={DollarSign}
          loading={statsLoading}
          color="text-orange-500"
          data-testid="kpi-referral-avg-per-user"
        />
      </div>

      <ChartContainer title="Your Referral Link">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="flex-1" data-testid="input-referral-link" />
            <Button onClick={handleCopy} variant="outline" data-testid="button-copy-link">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-share-twitter">
              <Share2 className="h-4 w-4 mr-2" />
              Share on Twitter
            </Button>
            <Button variant="outline" size="sm" data-testid="button-share-telegram">
              <Share2 className="h-4 w-4 mr-2" />
              Share on Telegram
            </Button>
            <Button onClick={() => generateMutation.mutate()} variant="outline" size="sm" data-testid="button-generate-new">
              <LinkIcon className="h-4 w-4 mr-2" />
              Generate New Code
            </Button>
          </div>
        </div>
      </ChartContainer>

      <ChartContainer title="Referral Earnings Timeline" loading={statsLoading}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={mockEarningsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer title="Your Referrals" loading={refLoading}>
        <DataTable
          columns={[
            { key: "username", label: "Username" },
            { key: "joined", label: "Joined Date" },
            { key: "earnings", label: "Your Earnings" },
            { key: "status", label: "Status" },
          ]}
          data={referralList}
          loading={refLoading}
        />
      </ChartContainer>
    </div>
  );
}
