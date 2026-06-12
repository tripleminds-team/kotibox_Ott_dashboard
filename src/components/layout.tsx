
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "../lib/api-client";
import {
  Home,
  Users,
  Settings,
  LogOut,
  Menu,
  Film,
  Globe,
  X,
  FileText,
  ChevronRight,
  ChevronLeft,
  Bell,
  PlaySquare,
  PlusSquare,
  Megaphone,
  Layers,
  Languages,
  Image,
  Tags,
  CreditCard,
  ScrollText,
  Gauge,
  HelpCircle,
  UserRound,
  Clapperboard,
  BellRing,
  MailCheck,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";

const navSections = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/media-library", label: "Media Library", icon: Image },
      { href: "/app-management", label: "App Management", icon: UserCog },
    ],
  },
  {
    label: "MEDIA MANAGEMENT",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/languages", label: "Languages", icon: Languages },
      { href: "/genres", label: "Genres", icon: Tags },
      { href: "/categories", label: "Categories", icon: Layers },
      { href: "/shows", label: "Shows", icon: PlaySquare },
      { href: "/ads", label: "Ads", icon: PlusSquare },
      { href: "/pages", label: "Pages", icon: FileText },
      { href: "/promotions", label: "Promotions", icon: Megaphone },
      { href: "/banners", label: "Banners", icon: Layers },
      { href: "/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  {
    label: "CAST & CREW",
    items: [
      { href: "/actors", label: "Actors", icon: UserRound },
      { href: "/directors", label: "Directors", icon: Clapperboard },
    ],
  },
  {
    label: "SUBSCRIPTION",
    items: [
      { href: "/subscriptions", label: "Subscriptions", icon: ScrollText },
      { href: "/plans", label: "Plans", icon: CreditCard },
      { href: "/plan-limits", label: "Plan Limits", icon: Gauge },
    ],
  },
  {
    label: "NOTIFICATIONS",
    items: [
      { href: "/notifications", label: "Notification List", icon: BellRing },
      { href: "/notification-templates", label: "Templates", icon: MailCheck },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const navItemsFlat = navSections.flatMap((s) => s.items);

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: user, isLoading } = useGetMe();
  const { language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && user === null) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync(undefined);
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/login");
    }
  };

  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return settings.darkLogoUrl;
    if (resolvedTheme === "light" && settings.lightLogoUrl) return settings.lightLogoUrl;
    return settings.logoUrl;
  };

  const isItemActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  // Expanded nav: sections with group headers
  const NavExpanded = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col gap-5">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1.5 px-3">
            {section.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full bg-red-500" />
                  )}
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
                      isActive
                        ? "bg-red-600/20 text-red-400"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Collapsed nav: flat icon list with tooltips
  const NavCollapsed = () => (
    <div className="flex flex-col gap-1 items-center">
      {navItemsFlat.map((item) => {
        const isActive = isItemActive(item.href);
        const Icon = item.icon;
        return (
          <TooltipProvider key={item.href} disableHoverableContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-muted text-red-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-red-500" />
                  )}
                  <Icon className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="bg-popover text-foreground border-border text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );

  const LogoComponent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex items-center gap-3">
      {getLogoUrl() ? (
        <img
          src={getLogoUrl()}
          alt="Logo"
          className={collapsed ? "h-9 w-9 object-contain" : "h-9 w-auto object-contain"}
        />
      ) : (
        <Film className={`text-red-500 ${collapsed ? "h-7 w-7" : "h-9 w-9"}`} />
      )}
      {!collapsed && (
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
          {settings.platformName}
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar/90 backdrop-blur-xl sticky top-0 z-50">
        <LogoComponent />
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={(value: string) => setLanguage(value as any)}>
            <SelectTrigger className="w-28 bg-muted border-border text-foreground h-9 rounded-lg">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-foreground">
              {Object.entries(languages).map(([code, name]) => (
                <SelectItem key={code} value={code} className="text-foreground">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
            <Bell className="h-4 w-4" />
          </Button>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar border-r border-border">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <LogoComponent />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground rounded-lg h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="px-3 py-4 overflow-y-auto custom-scrollbar h-[calc(100%-140px)]">
                <NavExpanded onClose={() => setMobileMenuOpen(false)} />
              </nav>
              <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-border bg-sidebar">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted px-3"
                  onClick={handleLogout}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/20 text-red-400 shrink-0">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-border z-40 transition-all duration-300 ${
          sidebarCollapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center border-b border-border ${
            sidebarCollapsed ? "justify-center px-3 py-4" : "justify-between px-5 py-4"
          }`}
        >
          <LogoComponent collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <button
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2">
          {sidebarCollapsed ? <NavCollapsed /> : <NavExpanded />}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-2 py-3">
          {sidebarCollapsed ? (
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-muted-foreground hover:bg-muted hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="bg-popover text-foreground border-border text-xs">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              <button
                onClick={handleLogout}
                className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/15 text-red-400 shrink-0">
                  <LogOut className="h-[17px] w-[17px]" />
                </span>
                Sign Out
              </button>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                  © {new Date().getFullYear()} {settings.platformName}
                </p>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[260px]"
        }`}
      >
        {/* Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-border bg-sidebar/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={(value: string) => setLanguage(value as any)}>
              <SelectTrigger className="w-32 bg-muted border-border text-foreground h-9 rounded-lg text-sm">
                <Globe className="h-4 w-4 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code} className="text-foreground">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none">
                  <Avatar className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-600 to-red-700 cursor-pointer hover:opacity-90 transition-opacity">
                    <AvatarFallback className="text-white font-bold text-sm">
                      {user?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-popover border-border text-foreground p-0 overflow-hidden"
              >
                {/* User info header */}
                <div className="bg-red-700 px-4 py-3 flex items-center gap-3">
                  <Avatar className="h-9 w-9 rounded-full bg-muted shrink-0">
                    <AvatarFallback className="text-white font-bold text-sm bg-zinc-700">
                      {user?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-white font-semibold text-sm truncate">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-red-200 text-xs truncate">
                      {user?.email || "admin@streamit.com"}
                    </p>
                  </div>
                </div>
                <div className="py-1">
                  <DropdownMenuItem
                    onClick={() => setLocation("/profile")}
                    className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer focus:bg-muted focus:text-foreground"
                  >
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocation("/settings")}
                    className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer focus:bg-muted focus:text-foreground"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer focus:bg-muted focus:text-foreground"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    Logout
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
    </div>
  );
}
