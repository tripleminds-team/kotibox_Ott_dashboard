
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
  Users2,
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
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/media-library", label: "Media Library", icon: Image },
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
      await logoutMutation.mutateAsync();
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
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  // Expanded nav: sections with group headers
  const NavExpanded = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col gap-5">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-600 mb-1.5 px-3">
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
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full bg-red-500" />
                  )}
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
                      isActive
                        ? "bg-red-600/20 text-red-400"
                        : "text-zinc-500 group-hover:text-zinc-300"
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
                      ? "bg-zinc-800 text-red-400"
                      : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-100"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-red-500" />
                  )}
                  <Icon className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="bg-zinc-800 text-white border-zinc-700 text-xs">
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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-50">
        <LogoComponent />
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={(value: string) => setLanguage(value as any)}>
            <SelectTrigger className="w-28 bg-zinc-800 border-zinc-700 text-white h-9 rounded-lg">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
              {Object.entries(languages).map(([code, name]) => (
                <SelectItem key={code} value={code} className="text-white">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <Bell className="h-4 w-4" />
          </Button>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-zinc-400">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-zinc-900 border-r border-zinc-800">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <LogoComponent />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-400 rounded-lg h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="px-3 py-4 overflow-y-auto custom-scrollbar h-[calc(100%-140px)]">
                <NavExpanded onClose={() => setMobileMenuOpen(false)} />
              </nav>
              <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-zinc-800 bg-zinc-900">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 px-3"
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
        className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-zinc-900 border-r border-zinc-800 z-40 transition-all duration-300 ${
          sidebarCollapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center border-b border-zinc-800 ${
            sidebarCollapsed ? "justify-center px-3 py-4" : "justify-between px-5 py-4"
          }`}
        >
          <LogoComponent collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <button
              className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
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
        <div className="border-t border-zinc-800 px-2 py-3">
          {sidebarCollapsed ? (
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-zinc-500 hover:bg-zinc-800/60 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="bg-zinc-800 text-white border-zinc-700 text-xs">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              <button
                onClick={handleLogout}
                className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 transition-all duration-200"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/15 text-red-400 shrink-0">
                  <LogOut className="h-[17px] w-[17px]" />
                </span>
                Sign Out
              </button>
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-600 text-center">
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
        <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <h1 className="text-lg font-bold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={(value: string) => setLanguage(value as any)}>
              <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-white h-9 rounded-lg text-sm">
                <Globe className="h-4 w-4 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code} className="text-white">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
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
                className="w-56 bg-zinc-900 border-zinc-700 text-white p-0 overflow-hidden"
              >
                {/* User info header */}
                <div className="bg-red-700 px-4 py-3 flex items-center gap-3">
                  <Avatar className="h-9 w-9 rounded-full bg-zinc-800 shrink-0">
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
                    className="flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                  >
                    <UserCog className="h-4 w-4 text-zinc-400" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocation("/settings")}
                    className="flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                  >
                    <Settings className="h-4 w-4 text-zinc-400" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-700 my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                  >
                    <LogOut className="h-4 w-4 text-zinc-400" />
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
