"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent 
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Store, 
  Building, 
  DollarSign,
  TrendingUp,
  Settings as SettingsIcon,
  Shield,
  Mail,
  HelpCircle,
  FileBarChart2,
  Bot,
  Trophy,
  Search,
  Zap,
  Smartphone,
  Activity,
  Folder,
  TestTube,
  Code,
  AlertCircle
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminAuthCheck } from "./auth-check";
import AdminOverview from "./sections/Overview";
import AdminUsers from "./sections/Users";
import AdminContent from "./sections/Content";
import AdminMarketplace from "./sections/Marketplace";
import AdminBrokers from "./sections/Brokers";
import AdminFinance from "./sections/Finance";
import EmailDashboard from "./emails/page";
import Analytics from "./sections/Analytics";
import Settings from "./sections/Settings";
import Security from "./sections/Security";
import Communications from "./sections/Communications";
import Support from "./sections/Support";
import Logs from "./sections/Logs";
import AIAutomation from "./sections/AIAutomation";
import Gamification from "./sections/Gamification";
import SEOMarketing from "./sections/SEOMarketing";
import Integrations from "./sections/Integrations";
import Mobile from "./sections/Mobile";
import Performance from "./sections/Performance";
import ContentStudio from "./sections/ContentStudio";
import Testing from "./sections/Testing";
import SchemaValidation from "./sections/SchemaValidation";
import SitemapManagement from "./sections/SitemapManagement";
import ErrorMonitoring from "./sections/ErrorMonitoring";

const sections = [
  { id: "overview", icon: BarChart3, label: "Overview", path: "/admin" },
  { id: "users", icon: Users, label: "Users", path: "/admin/users" },
  { id: "content", icon: FileText, label: "Content", path: "/admin/content" },
  { id: "marketplace", icon: Store, label: "Marketplace", path: "/admin/marketplace" },
  { id: "brokers", icon: Building, label: "Brokers", path: "/admin/brokers" },
  { id: "finance", icon: DollarSign, label: "Finance", path: "/admin/finance" },
  { id: "emails", icon: Mail, label: "Emails", path: "/admin/emails" },
  { id: "analytics", icon: TrendingUp, label: "Analytics", path: "/admin/analytics" },
  { id: "errors", icon: AlertCircle, label: "Error Monitoring", path: "/admin/errors" },
  { id: "ai-automation", icon: Bot, label: "AI & Automation", path: "/admin/ai-automation" },
  { id: "gamification", icon: Trophy, label: "Gamification", path: "/admin/gamification" },
  { id: "seo-marketing", icon: Search, label: "SEO & Marketing", path: "/admin/seo-marketing" },
  { id: "sitemap", icon: FileText, label: "Sitemap", path: "/admin/sitemap" },
  { id: "schema-validation", icon: Code, label: "Schema Validation", path: "/admin/schema-validation" },
  { id: "integrations", icon: Zap, label: "API & Integrations", path: "/admin/integrations" },
  { id: "mobile", icon: Smartphone, label: "Mobile & Push", path: "/admin/mobile" },
  { id: "performance", icon: Activity, label: "Performance", path: "/admin/performance" },
  { id: "content-studio", icon: Folder, label: "Content Studio", path: "/admin/content-studio" },
  { id: "testing", icon: TestTube, label: "Testing", path: "/admin/testing" },
  { id: "settings", icon: SettingsIcon, label: "Settings", path: "/admin/settings" },
  { id: "security", icon: Shield, label: "Security", path: "/admin/security" },
  { id: "communications", icon: Mail, label: "Communications", path: "/admin/communications" },
  { id: "support", icon: HelpCircle, label: "Support", path: "/admin/support" },
  { id: "logs", icon: FileBarChart2, label: "Audit Logs", path: "/admin/logs" },
];

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => {
                const isActive = pathname === section.path;
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={section.path} data-testid={`nav-${section.id}`}>
                        <section.icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminDashboardClient() {
  const pathname = usePathname();

  // Determine which section to render based on pathname
  const renderSection = () => {
    switch (pathname) {
      case "/admin/users":
        return <AdminUsers />;
      case "/admin/content":
        return <AdminContent />;
      case "/admin/marketplace":
        return <AdminMarketplace />;
      case "/admin/brokers":
        return <AdminBrokers />;
      case "/admin/finance":
        return <AdminFinance />;
      case "/admin/emails":
        return <EmailDashboard />;
      case "/admin/analytics":
        return <Analytics />;
      case "/admin/errors":
        return <ErrorMonitoring />;
      case "/admin/ai-automation":
        return <AIAutomation />;
      case "/admin/gamification":
        return <Gamification />;
      case "/admin/seo-marketing":
        return <SEOMarketing />;
      case "/admin/sitemap":
        return <SitemapManagement />;
      case "/admin/schema-validation":
        return <SchemaValidation />;
      case "/admin/integrations":
        return <Integrations />;
      case "/admin/mobile":
        return <Mobile />;
      case "/admin/performance":
        return <Performance />;
      case "/admin/content-studio":
        return <ContentStudio />;
      case "/admin/testing":
        return <Testing />;
      case "/admin/settings":
        return <Settings />;
      case "/admin/security":
        return <Security />;
      case "/admin/communications":
        return <Communications />;
      case "/admin/support":
        return <Support />;
      case "/admin/logs":
        return <Logs />;
      default:
        return <AdminOverview />;
    }
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <AdminAuthCheck>
      <SidebarProvider style={sidebarStyle}>
        <div className="flex h-screen w-full">
          <AdminSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-6">
              {renderSection()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminAuthCheck>
  );
}
