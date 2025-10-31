"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Menu,
  X
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminAuthCheck } from "./auth-check";
import AdminOverview from "./sections/Overview";
import AdminUsers from "./sections/Users";
import AdminContent from "./sections/Content";
import AdminMarketplace from "./sections/Marketplace";
import AdminBrokers from "./sections/Brokers";
import AdminFinance from "./sections/Finance";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "overview", icon: BarChart3, label: "Overview", path: "/admin" },
  { id: "users", icon: Users, label: "Users", path: "/admin/users" },
  { id: "content", icon: FileText, label: "Content", path: "/admin/content" },
  { id: "marketplace", icon: Store, label: "Marketplace", path: "/admin/marketplace" },
  { id: "brokers", icon: Building, label: "Brokers", path: "/admin/brokers" },
  { id: "finance", icon: DollarSign, label: "Finance", path: "/admin/finance" },
  { id: "analytics", icon: TrendingUp, label: "Analytics", path: "/admin/analytics" },
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

export function AdminDashboardClient() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case "/admin/analytics":
        return <Analytics />;
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

  return (
    <AdminAuthCheck>
      <div className="flex h-screen w-full">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Admin Dashboard</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {sections.map((section) => {
                  const isActive = pathname === section.path;
                  return (
                    <li key={section.id}>
                      <Link
                        href={section.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                        data-testid={`nav-${section.id}`}
                      >
                        <section.icon className="h-4 w-4" />
                        <span>{section.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-sidebar-toggle"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </AdminAuthCheck>
  );
}