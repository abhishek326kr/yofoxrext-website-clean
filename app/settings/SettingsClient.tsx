"use client";

import { useState } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  User,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Code,
  MessageSquare,
  FileText,
  Store,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";
import ProfileSection from "./components/ProfileSection";
import NotificationSection from "./components/NotificationSection";
import SecuritySection from "./components/SecuritySection";
import AppearanceSection from "./components/AppearanceSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsClientProps {
  initialUser: any;
  initialCoins: {
    totalCoins: number;
    weeklyEarned: number;
    rank: number | null;
  } | null;
}

export default function SettingsClient({ initialUser, initialCoins }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { value: "profile", label: "Profile", icon: User },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
    { value: "appearance", label: "Appearance", icon: Palette },
    { value: "payment", label: "Payment", icon: CreditCard },
    { value: "api", label: "API Keys", icon: Code },
    { value: "communication", label: "Communication", icon: MessageSquare },
    { value: "content", label: "Content", icon: FileText },
    { value: "seller", label: "Seller", icon: Store },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "advanced", label: "Advanced", icon: Settings },
    { value: "help", label: "Help", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-settings-title">Settings</h1>
          <p className="text-lg text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto w-max gap-1 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    data-testid={`tab-${tab.value}`}
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="profile" className="space-y-4">
            <ProfileSection initialUser={initialUser} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationSection initialUser={initialUser} />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecuritySection initialUser={initialUser} />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <AppearanceSection />
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your payment methods and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Payment methods configuration coming soon. For now, use the Recharge page to purchase coins.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Manage your API keys for third-party integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  API key management coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Communication Preferences
                </CardTitle>
                <CardDescription>
                  Control how you communicate with other members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Communication settings coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Content Settings
                </CardTitle>
                <CardDescription>
                  Manage your content publishing preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Content settings coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Seller Dashboard
                </CardTitle>
                <CardDescription>
                  Manage your seller profile and marketplace settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Seller settings coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Analytics & Insights
                </CardTitle>
                <CardDescription>
                  View your performance metrics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analytics coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Configure advanced account options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced settings coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Help & Support
                </CardTitle>
                <CardDescription>
                  Get help and support resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Quick Links</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="/support" className="hover:text-primary hover:underline">
                        Contact Support
                      </a>
                    </li>
                    <li>
                      <a href="/guides" className="hover:text-primary hover:underline">
                        User Guides
                      </a>
                    </li>
                    <li>
                      <a href="/terms" className="hover:text-primary hover:underline">
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="/privacy" className="hover:text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <EnhancedFooter />
    </div>
  );
}
