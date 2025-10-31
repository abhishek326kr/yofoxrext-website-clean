"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  CreditCard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: "earn" | "spend" | "recharge";
  amount: number;
  description: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
}

interface TransactionHistoryClientProps {
  initialData?: any[];
}

export default function TransactionHistoryClient({ initialData = [] }: TransactionHistoryClientProps) {
  const { data: ledgerData = initialData } = useQuery({
    queryKey: ['/api/ledger/history'],
    initialData,
  });

  // Transform ledger data to transaction format
  const transactions: Transaction[] = ledgerData.map((entry: any) => ({
    id: entry.id?.toString() || entry.timestamp?.toString() || Math.random().toString(),
    type: entry.amount > 0 ? "earn" : entry.description?.toLowerCase().includes("recharge") ? "recharge" : "spend",
    amount: entry.amount,
    description: entry.description || "Transaction",
    timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    status: "completed" as const,
  }));

  const getTransactionIcon = (type: Transaction["type"]) => {
    if (type === "recharge") return CreditCard;
    if (type === "earn") return TrendingUp;
    return TrendingDown;
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    if (type === "recharge") return "text-primary";
    if (type === "earn") return "text-chart-3";
    return "text-chart-4";
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    if (status === "completed") return <Badge variant="outline" className="text-xs">Completed</Badge>;
    if (status === "pending") return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    return <Badge variant="destructive" className="text-xs">Failed</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8" data-testid="container-transaction-history">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your coin earnings, spending, and recharge history
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm mt-2">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction.type);
                  const color = getTransactionColor(transaction.type);
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover-elevate"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className={`bg-muted rounded-lg p-2 ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-medium line-clamp-1" data-testid={`text-description-${transaction.id}`}>
                            {transaction.description}
                          </div>
                          <div className={`font-bold flex-shrink-0 ${color}`} data-testid={`text-amount-${transaction.id}`}>
                            {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                            <Coins className="h-4 w-4 inline ml-1" />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span suppressHydrationWarning>{formatDistanceToNow(transaction.timestamp, { addSuffix: true })}</span>
                          <span>•</span>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EnhancedFooter />
    </div>
  );
}
