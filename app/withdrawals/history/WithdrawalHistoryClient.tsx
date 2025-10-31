"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type WithdrawalStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  cryptoType: "BTC" | "ETH";
  walletAddress: string;
  status: WithdrawalStatus;
  exchangeRate: string;
  cryptoAmount: string;
  processingFee: number;
  transactionHash?: string | null;
  adminNotes?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const getStatusColor = (status: WithdrawalStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    case "processing":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "completed":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "failed":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "cancelled":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

interface WithdrawalHistoryClientProps {
  initialData: Withdrawal[];
}

export default function WithdrawalHistoryClient({ initialData }: WithdrawalHistoryClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const { toast } = useToast();

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ['/api/withdrawals'],
    initialData: initialData,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (withdrawalId: string) => {
      return await apiRequest("POST", `/api/withdrawals/${withdrawalId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Cancelled",
        description: "Your withdrawal has been cancelled and coins have been refunded",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'coins'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel withdrawal",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    requireAuth(() => {});
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-history-title">Withdrawal History</h1>
              <p className="text-muted-foreground mt-2">View and manage your withdrawal requests</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => router.push("/withdrawals")}
                data-testid="button-new-withdrawal"
              >
                New Withdrawal
              </Button>
            </div>
          </div>

          <Alert data-testid="alert-auto-refresh">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This page auto-refreshes every 30 seconds to show the latest status updates
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Your Withdrawals</CardTitle>
              <CardDescription>
                All withdrawal requests are processed within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8" data-testid="text-loading">
                  <p className="text-muted-foreground">Loading withdrawals...</p>
                </div>
              ) : !withdrawals || withdrawals.length === 0 ? (
                <div className="text-center py-8" data-testid="text-no-withdrawals">
                  <p className="text-muted-foreground">No withdrawals yet</p>
                  <Button
                    onClick={() => router.push("/withdrawals")}
                    className="mt-4"
                    data-testid="button-create-first"
                  >
                    Create Your First Withdrawal
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Crypto Amount</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tx Hash</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id} data-testid={`row-withdrawal-${withdrawal.id}`}>
                        <TableCell data-testid={`text-date-${withdrawal.id}`}>
                          {format(new Date(withdrawal.requestedAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell data-testid={`text-amount-${withdrawal.id}`}>
                          {withdrawal.amount} coins
                        </TableCell>
                        <TableCell data-testid={`text-crypto-type-${withdrawal.id}`}>
                          {withdrawal.cryptoType}
                        </TableCell>
                        <TableCell data-testid={`text-crypto-amount-${withdrawal.id}`}>
                          {parseFloat(withdrawal.cryptoAmount).toFixed(8)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs" data-testid={`text-wallet-${withdrawal.id}`}>
                            {withdrawal.walletAddress.substring(0, 10)}...
                            {withdrawal.walletAddress.substring(withdrawal.walletAddress.length - 6)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={getStatusColor(withdrawal.status)}
                            data-testid={`badge-status-${withdrawal.id}`}
                          >
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {withdrawal.transactionHash ? (
                            <a
                              href={`https://etherscan.io/tx/${withdrawal.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                              data-testid={`link-tx-hash-${withdrawal.id}`}
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground" data-testid={`text-no-tx-${withdrawal.id}`}>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelMutation.mutate(withdrawal.id)}
                              disabled={cancelMutation.isPending}
                              data-testid={`button-cancel-${withdrawal.id}`}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
