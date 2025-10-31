"use client";

import { Search, Menu, User, Bell, MessageSquare, Coins, LogIn, LogOut, Lightbulb, HelpCircle, TrendingUp, Settings, Code, Award, BookOpen, Activity, Wrench, FileCode, GraduationCap, MessageCircle as MessageCircleIcon, Trophy, BarChart3, Rocket, ShieldAlert, Plus, LayoutDashboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { coinsToUSD } from "../../shared/coinUtils";

// Category data for Release EA dropdown
const publishCategories = [
  { slug: "strategy-discussion", name: "Strategy Discussion", icon: Lightbulb, hint: "Share trading strategies and setups" },
  { slug: "beginner-questions", name: "Beginner Questions", icon: HelpCircle, hint: "Start here for basic questions" },
  { slug: "performance-reports", name: "Performance Reports", icon: TrendingUp, hint: "Backtest & live test results" },
  { slug: "technical-support", name: "Technical Support", icon: Settings, hint: "Installation & VPS help" },
  { slug: "ea-development", name: "EA Development", icon: Code, hint: "MQL4/MQL5 coding help" },
  { slug: "success-stories", name: "Success Stories", icon: Award, hint: "Trading wins & lessons" },
  { slug: "ea-library", name: "EA Library", icon: BookOpen, hint: "Upload your EAs here" },
  { slug: "indicators", name: "Indicators", icon: Activity, hint: "Share custom indicators" },
  { slug: "tools-utilities", name: "Tools & Utilities", icon: Wrench, hint: "Trading tools & panels" },
  { slug: "source-code", name: "Source Code", icon: FileCode, hint: "Open source EA/indicator code" },
  { slug: "learning-hub", name: "Learning Hub", icon: GraduationCap, hint: "Guides & courses" },
  { slug: "qa-help", name: "Q&A / Help", icon: MessageCircleIcon, hint: "Quick answers" },
  { slug: "bounties", name: "Bounties", icon: Trophy, hint: "Offer rewards for help" },
  { slug: "rankings", name: "Rankings", icon: BarChart3, hint: "Top EAs & contributors" },
  { slug: "commercial-trials", name: "Commercial Trials", icon: Rocket, hint: "Vendor demos & trials" },
  { slug: "scam-watch", name: "Scam Watch", icon: ShieldAlert, hint: "Report scams & fraud" },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading: isAuthLoading, isAuthenticated, login, logout } = useAuth();
  
  const { data: coinsData } = useQuery<{ totalCoins: number; weeklyEarned: number; rank: number | null }>({
    queryKey: ["/api/user", user?.id, "coins"],
    enabled: !!user?.id,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user?.id,
  });

  const unreadCount = unreadData?.count ?? 0;

  const userCoins = coinsData?.totalCoins ?? 0;
  const userCoinsUSD = coinsToUSD(userCoins);

  // Conditionally show "Release EA" dropdown only on marketplace/content/publish pages
  const showReleaseEA = pathname === "/marketplace" || 
                        pathname?.startsWith("/content/") || 
                        pathname === "/publish";

  // Show "New Thread" button only on category pages
  const showNewThread = pathname?.startsWith("/category/");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 cursor-pointer" data-testid="link-home">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">YoForex</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/categories">
              <Button 
                variant={pathname === "/categories" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-categories"
                aria-current={pathname === "/categories" ? "page" : undefined}
              >
                Categories
              </Button>
            </Link>
            <Link href="/discussions">
              <Button 
                variant={pathname === "/discussions" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-discussions"
                aria-current={pathname === "/discussions" ? "page" : undefined}
              >
                Discussions
              </Button>
            </Link>
            
            {/* Release EA Dropdown - Only visible on marketplace/content/publish pages */}
            {showReleaseEA && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 text-sm font-medium" data-testid="button-release-ea">
                      Release EA
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[500px] gap-2 p-4 md:grid-cols-2" data-testid="menu-release-categories">
                        {publishCategories.map((cat) => (
                          <li key={cat.slug}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/publish?category=${cat.slug}`}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                data-testid={`link-publish-${cat.slug}`}
                              >
                                <div className="flex items-center gap-2">
                                  <cat.icon className="h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">{cat.name}</div>
                                </div>
                                <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                                  {cat.hint}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
            
            <Link href="/brokers">
              <Button 
                variant={pathname === "/brokers" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-broker-reviews"
                aria-current={pathname === "/brokers" ? "page" : undefined}
              >
                Broker Reviews
              </Button>
            </Link>
            <Link href="/members">
              <Button 
                variant={pathname === "/members" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-members"
                aria-current={pathname === "/members" ? "page" : undefined}
              >
                Members
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search discussions..."
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              {/* Show "New Thread" button only on category pages */}
              {showNewThread && (
                <Link href="/discussions/new">
                  <Button size="sm" className="hidden sm:flex" data-testid="button-new-thread">
                    <Plus className="h-4 w-4 mr-1" />
                    New Thread
                  </Button>
                </Link>
              )}
              
              <div className="hidden md:flex items-center gap-1">
                <Link href="/recharge">
                  <div className="flex flex-col gap-0 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 hover-elevate cursor-pointer">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm" data-testid="text-header-coins">{userCoins.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">${userCoinsUSD.toFixed(2)} USD</span>
                  </div>
                </Link>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/guides/how-to-earn-coins">
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-coin-help">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn how to earn coins & level up</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Link href="/messages">
                <Button variant="ghost" size="icon" data-testid="button-messages">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="hidden md:flex relative" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs" data-testid="badge-unread-count">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </>
          )}
          
          {isAuthLoading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.username} />
                    <AvatarFallback>{(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel data-testid="text-user-name">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem data-testid="link-dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/settings">
                  <DropdownMenuItem data-testid="link-customize-dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Customize Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem data-testid="link-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={login} data-testid="button-login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
          
          <ThemeToggle />
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* User Profile Section */}
                {isAuthenticated && user && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl || undefined} alt={user.username} />
                        <AvatarFallback>{(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                        </p>
                        <Link href="/recharge" onClick={() => setMobileMenuOpen(false)}>
                          <div className="flex items-center gap-1 mt-1">
                            <Coins className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium">{userCoins.toLocaleString()} coins</span>
                            <span className="text-xs text-muted-foreground">(${userCoinsUSD.toFixed(2)})</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                  <Link href="/categories" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={pathname === "/categories" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      data-testid="mobile-link-categories"
                    >
                      Categories
                    </Button>
                  </Link>
                  <Link href="/discussions" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={pathname === "/discussions" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      data-testid="mobile-link-discussions"
                    >
                      Discussions
                    </Button>
                  </Link>
                  <Link href="/brokers" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={pathname === "/brokers" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      data-testid="mobile-link-brokers"
                    >
                      Broker Reviews
                    </Button>
                  </Link>
                  <Link href="/members" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={pathname === "/members" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      data-testid="mobile-link-members"
                    >
                      Members
                    </Button>
                  </Link>
                </nav>

                {isAuthenticated && (
                  <>
                    <Separator />
                    {/* User Menu Items */}
                    <nav className="flex flex-col gap-2">
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-dashboard">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/messages" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-messages">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Messages
                        </Button>
                      </Link>
                      <Link href="/notifications" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start relative" data-testid="mobile-link-notifications">
                          <Bell className="mr-2 h-4 w-4" />
                          Notifications
                          {unreadCount > 0 && (
                            <Badge className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs" data-testid="mobile-badge-unread-count">
                              {unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                      <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                    </nav>
                    <Separator />
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { logout(); setMobileMenuOpen(false); }} data-testid="mobile-button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                )}

                {!isAuthenticated && !isAuthLoading && (
                  <>
                    <Separator />
                    <Button onClick={() => { login(); setMobileMenuOpen(false); }} data-testid="mobile-button-login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
