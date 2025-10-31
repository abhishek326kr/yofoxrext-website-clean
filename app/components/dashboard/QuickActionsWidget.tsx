"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PenSquare, 
  Upload, 
  MessageSquare, 
  Coins, 
  Banknote,
  ShoppingCart,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickAction {
  id: string;
  icon: any;
  label: string;
  description: string;
  path: string;
  variant?: "default" | "outline";
}

const quickActions: QuickAction[] = [
  {
    id: "new-thread",
    icon: PenSquare,
    label: "New Thread",
    description: "Start a discussion",
    path: "/discussions/new",
    variant: "default",
  },
  {
    id: "publish-content",
    icon: Upload,
    label: "Publish Content",
    description: "Share your EA or indicator",
    path: "/publish",
    variant: "default",
  },
  {
    id: "send-message",
    icon: MessageSquare,
    label: "Send Message",
    description: "Chat with members",
    path: "/messages",
    variant: "outline",
  },
  {
    id: "recharge-coins",
    icon: Coins,
    label: "Recharge Coins",
    description: "Add to your balance",
    path: "/recharge",
    variant: "outline",
  },
  {
    id: "withdraw-crypto",
    icon: Banknote,
    label: "Withdraw Crypto",
    description: "Cash out earnings",
    path: "/withdrawal",
    variant: "outline",
  },
  {
    id: "browse-marketplace",
    icon: ShoppingCart,
    label: "Browse Marketplace",
    description: "Find EAs & indicators",
    path: "/marketplace",
    variant: "outline",
  },
];

export default function QuickActionsWidget() {
  const router = useRouter();

  return (
    <Card data-testid="card-quick-actions-widget">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => router.push(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-md border hover-elevate active-elevate-2 transition-all text-center"
                data-testid={`button-quick-action-${action.id}`}
              >
                <div className={`p-2 rounded-md ${
                  action.variant === "default" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
