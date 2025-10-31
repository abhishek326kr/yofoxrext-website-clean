"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Wallet, Gift, AlertCircle, Star, Zap } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { useQuery } from "@tanstack/react-query";
import type { CoinPackage } from "../../shared/coinUtils";

interface RechargeClientProps {
  initialPackages: CoinPackage[];
}

export default function RechargeClient({ initialPackages }: RechargeClientProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"btc" | "eth" | "usdt">("usdt");

  const { data: packages = initialPackages } = useQuery<CoinPackage[]>({
    queryKey: ["/api/recharge/packages"],
    initialData: initialPackages,
  });

  const handleRecharge = () => {
    if (!selectedPackage && !customAmount) {
      alert("Please select a package or enter a custom amount");
      return;
    }
    
    const amount = selectedPackage ? selectedPackage.totalCoins : parseInt(customAmount);
    console.log(`Recharging ${amount} coins via ${paymentMethod}`);
    // TODO: Integrate with Stripe or crypto payment gateway
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-5xl mx-auto px-4 py-8" data-testid="container-coin-recharge">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Recharge Gold Coins</h1>
          <p className="text-muted-foreground">
            Top up your account to download EAs, access premium content, and unlock exclusive features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Select Coin Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => {
                    const savingsPercent = pkg.savingsPercent || 0;
                    const isBestValue = pkg.bestValue || false;
                    
                    return (
                      <div
                        key={pkg.name}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer hover-elevate ${
                          selectedPackage?.name === pkg.name
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        data-testid={`package-${pkg.name.toLowerCase()}`}
                      >
                        {pkg.popular && (
                          <Badge className="absolute -top-2 -right-2 flex items-center gap-1" variant="default">
                            <Star className="h-3 w-3" />
                            Popular
                          </Badge>
                        )}
                        {isBestValue && (
                          <Badge className="absolute -top-2 -right-2 flex items-center gap-1 bg-chart-3 hover:bg-chart-3">
                            <Zap className="h-3 w-3" />
                            Best Value
                          </Badge>
                        )}
                        <div className="text-center">
                          <div className="text-xs font-medium text-muted-foreground mb-1">{pkg.name}</div>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Coins className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{pkg.baseCoins}</span>
                          </div>
                          {pkg.bonusCoins > 0 && (
                            <div className="flex items-center justify-center gap-1 mb-2">
                              <Gift className="h-4 w-4 text-chart-3" />
                              <span className="text-sm text-chart-3 font-medium">+{pkg.bonusCoins} bonus</span>
                            </div>
                          )}
                          {savingsPercent > 0 && (
                            <div className="text-xs text-chart-3 font-medium mb-1">
                              Save {savingsPercent}%
                            </div>
                          )}
                          <div className="text-lg font-semibold">${pkg.priceUSD.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {pkg.bonusCoins > 0 
                              ? `${pkg.baseCoins} + ${pkg.bonusCoins} = ${pkg.totalCoins} coins`
                              : `${pkg.totalCoins} coins`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block">Custom Amount</label>
                  <Input
                    type="number"
                    placeholder="Enter custom coin amount (min. 10)"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPackage(null);
                    }}
                    min="10"
                    data-testid="input-custom-amount"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Select Cryptocurrency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onClick={() => setPaymentMethod("btc")}
                  className={`p-4 border-2 rounded-lg cursor-pointer hover-elevate ${
                    paymentMethod === "btc" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid="payment-btc"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Bitcoin (BTC)</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with Bitcoin on-chain
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("eth")}
                  className={`p-4 border-2 rounded-lg cursor-pointer hover-elevate ${
                    paymentMethod === "eth" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid="payment-eth"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Ethereum (ETH)</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with Ethereum (ERC20)
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("usdt")}
                  className={`p-4 border-2 rounded-lg cursor-pointer hover-elevate ${
                    paymentMethod === "usdt" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid="payment-usdt"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Tether (USDT)</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with USDT (TRC20/ERC20)
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleRecharge}
                  disabled={!selectedPackage && !customAmount}
                  data-testid="button-proceed-payment"
                >
                  Proceed to {paymentMethod.toUpperCase()} Payment
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why Top Up?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Download premium EAs and indicators</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Access exclusive trading strategies</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>View premium backtests and set files</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Support quality content creators</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Important Notice</div>
                    <div className="text-muted-foreground">
                      Gold coins are non-refundable after top-up. Please review content descriptions carefully before making purchases.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
}
