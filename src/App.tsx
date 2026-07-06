
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { useGetMe } from "@/lib/api-client";

// Helper to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return { h, s, l };
}

// Color themes data
const COLOR_THEMES = [
  { id: "blue-green", a: "#3b82f6", b: "#10b981" },
  { id: "orange-yellow", a: "#f97316", b: "#eab308" },
  { id: "pink-purple", a: "#ec4899", b: "#a855f7" },
  { id: "purple-orange", a: "#8b5cf6", b: "#f97316" },
  { id: "green-pink", a: "#22c55e", b: "#ec4899" },
];

// Component to apply custom theme
function ThemeApplier() {
  const { settings } = useSettings();
  
  useEffect(() => {
    const root = document.documentElement;
    
    // Find selected color theme
    const theme = COLOR_THEMES.find(t => t.id === settings.colorTheme);
    let primaryColor = settings.primaryColor;
    
    if (theme && !settings.primaryColor) {
      primaryColor = theme.a;
    }
    
    // Convert primary color to HSL
    const hsl = hexToHSL(primaryColor || "#e50914");
    root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty("--sidebar-primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty("--destructive", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty("--ring", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty("--chart-1", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  }, [settings.colorTheme, settings.primaryColor]);

  useEffect(() => {
    const name = settings.platformName;
    document.title = name ? `${name} Admin Panel` : "Admin Panel";
  }, [settings.platformName]);

  return null;
}

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UsersList from "@/pages/users-list";
import UserDetail from "@/pages/user-detail";
import LanguagesList from "@/pages/languages-list";
import PromotionsList from "@/pages/promotions-list";
import PromotionForm from "@/pages/promotion-form";
import BannersPage from "@/pages/banners";
import BannerForm from "@/pages/banner-form";
import BannerShowDetail from "@/pages/banner-show-detail";
import ShowsPage from "@/pages/shows";
import ShowForm from "@/pages/show-form";
import ShowDetail from "@/pages/show-detail";
import PagesPage from "@/pages/pages";
import PageForm from "@/pages/page-form";
import AdsPage from "@/pages/ads";
import AdForm from "@/pages/ad-form";
import Settings from "@/pages/settings";
import Branding from "@/pages/branding";
import IconsPage from "@/pages/icons";
import MediaLibraryPage from "@/pages/media-library";
import GenresPage from "@/pages/genres";
import GenreFormPage from "@/pages/genre-form";
import PlansPage from "@/pages/plans";
import PlanFormPage from "@/pages/plan-form";
import SubscriptionsListPage from "@/pages/subscriptions-list";
import SubscriptionFormPage from "@/pages/subscription-form";
import PlanLimitsPage from "@/pages/plan-limits";
import PlanLimitFormPage from "@/pages/plan-limit-form";
import FaqListPage from "@/pages/faq-list";
import FaqFormPage from "@/pages/faq-form";
import ActorsListPage from "@/pages/actors-list";
import ActorFormPage from "@/pages/actor-form";
import DirectorsListPage from "@/pages/directors-list";
import DirectorFormPage from "@/pages/director-form";
import CrewListPage from "@/pages/crew-list";
import CrewFormPage from "@/pages/crew-form";
import CountriesListPage from "@/pages/countries-list";
import CountryFormPage from "@/pages/country-form";
import NotificationListPage from "@/pages/notification-list";
import NotificationTemplatesPage from "@/pages/notification-templates";
import NotificationTemplateFormPage from "@/pages/notification-template-form";
import ProfilePage from "@/pages/profile";
import AppManagement from "@/pages/app-management";
import HomeSections from "@/pages/home-sections";
import MoviesPage from "@/pages/movies";
import MovieForm from "@/pages/movie-form";
import TvShowsPage from "@/pages/tv-shows";
import TvShowForm from "@/pages/tv-show-form";
import SeasonsPage from "@/pages/seasons";
import SeasonForm from "@/pages/season-form";
import EpisodesPage from "@/pages/episodes";
import EpisodeForm from "@/pages/episode-form";
import StreamingHomePage from "@/pages/streaming-home";
import MovieDetailPage from "@/pages/movie-detail";
import EpisodeDetailPage from "@/pages/episode-detail";
import TVShowDetailPage from "@/pages/tv-show-detail";
import ShortDramaPlayer from "@/pages/short-drama-player";
import CategoriesBrowsePage from "@/pages/categories-browse";
import PublicAuthPage from "@/pages/public-auth";
import TvShowsPublicPage from "@/pages/tv-shows-public";
import UserProfilePage from "@/pages/user-profile";
import PublicPagePage from "@/pages/public-page";
import InfluencersPage from "@/pages/influencers";
import ApprovalsPage from "@/pages/approvals";
import ShortDramasPage from "@/pages/short-dramas";
import ShortDramaForm from "@/pages/short-drama-form";
import ShortDramaDetail from "@/pages/short-drama-detail";
import ShortDramaSeasonsPage from "@/pages/short-drama-seasons";
import ShortDramaEpisodesPage from "@/pages/short-drama-episodes";
import GoogleAdsPage from "@/pages/google-ads";
import NewHotManagement from "@/pages/new-hot-management";
import Reviews from "@/pages/reviews";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Route to permission map
const routePermissions: Record<string, string | null> = {
  "/dashboard": null,
  "/media-library": "mediaLibrary",
  "/app-management": null,
  "/home-sections": "categories",
  "/influencers": "influencers",
  "/approvals": "movies",
  "/users": "subscriptions",
  "/languages": "languages",
  "/genres": "genres",
  "/movies": "movies",
  "/shows": "shows",
  "/tv-shows": "shows",
  "/seasons": "shows",
  "/episodes": "shows",
  "/categories": "categories",
  "/ads": "ads",
  "/google-ads": "ads",
  "/pages": "pages",
  "/promotions": "promotions",
  "/banners": "banners",
  "/reviews": "reviews",
  "/faq": "faqs",
  "/actors": "actors",
  "/directors": "directors",
  "/crew": "actors",
  "/countries": "languages",
  "/subscriptions": "subscriptions",
  "/plans": "subscriptionPlans",
  "/plan-limits": "planLimits",
  "/notifications": "notifications",
  "/notification-templates": "notificationTemplates",
  "/settings": "settings",
  "/settings/branding": "settings",
  "/settings/icons": "settings",
  "/profile": null,
  "/short-dramas": "shortDramas",
  "/short-drama-seasons": "shortDramas",
  "/short-drama-episodes": "shortDramas",
};

const hasPermissionForRoute = (path: string, user: any): boolean => {
  if (user?.role === "superadmin") return true;
  
  // Find matching route (check exact first, then prefixes)
  let permission: string | null = null;
  for (const [route, perm] of Object.entries(routePermissions)) {
    if (path === route || path.startsWith(route + "/")) {
      permission = perm;
      break;
    }
  }
  
  if (permission === null) return true;
  
  const modulePerms = user?.modulePermissions?.[permission as keyof typeof user.modulePermissions];
  if (!modulePerms) return false;
  
  return (modulePerms as any).canView || (modulePerms as any).canUpload;
};

function ProtectedRoute({ component: Component, ...rest }: { component: any; [key: string]: any }) {
  const [location, setLocation] = useLocation();
  const token = localStorage.getItem("accessToken");
  const { data: user, isLoading, error } = useGetMe();

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
    } else if (!isLoading && error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setLocation("/admin/login");
    }
  }, [token, isLoading, error, setLocation]);

  if (!token) return null;
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (error) {
    console.error("Error fetching user:", error);
    // While redirecting, show nothing or a subtle message instead of an error block
    return <div className="min-h-screen flex items-center justify-center">Session expired. Redirecting...</div>;
  }
  
  // Check permission
  const currentPath = location;
  if (!hasPermissionForRoute(currentPath, user)) {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  const token = localStorage.getItem("accessToken");
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (token && location === "/admin/login") {
      setLocation("/dashboard");
    }
  }, [token, location, setLocation]);

  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin/login" component={Login} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersList} />} />
      <Route path="/users/:id" component={() => <ProtectedRoute component={UserDetail} />} />
      <Route path="/languages" component={() => <ProtectedRoute component={LanguagesList} />} />
      <Route path="/promotions/new" component={() => <ProtectedRoute component={PromotionForm} />} />
      <Route path="/promotions/:id" component={() => <ProtectedRoute component={PromotionForm} />} />
      <Route path="/promotions" component={() => <ProtectedRoute component={PromotionsList} />} />
      <Route path="/banners/new" component={() => <ProtectedRoute component={BannerForm} />} />
      <Route path="/banners/:id" component={() => <ProtectedRoute component={BannerForm} />} />
      <Route path="/banners/shows/:contentId" component={() => <ProtectedRoute component={BannerShowDetail} />} />
      <Route path="/banners" component={() => <ProtectedRoute component={BannersPage} />} />
      <Route path="/shows/new" component={() => <ProtectedRoute component={ShowForm} />} />
      <Route path="/shows/:id/edit" component={() => <ProtectedRoute component={ShowForm} />} />
      <Route path="/shows/:id" component={() => <ProtectedRoute component={ShowDetail} />} />
      <Route path="/shows" component={() => <ProtectedRoute component={ShowsPage} />} />
      <Route path="/movies/new" component={() => <ProtectedRoute component={MovieForm} />} />
      <Route path="/movies/:id/edit" component={() => <ProtectedRoute component={MovieForm} />} />
      <Route path="/movies" component={() => <ProtectedRoute component={MoviesPage} />} />
      <Route path="/tv-shows/new" component={() => <ProtectedRoute component={TvShowForm} />} />
      <Route path="/tv-shows/:id/edit" component={() => <ProtectedRoute component={TvShowForm} />} />
      <Route path="/tv-shows" component={() => <ProtectedRoute component={TvShowsPage} />} />
      <Route path="/seasons/new" component={() => <ProtectedRoute component={SeasonForm} />} />
      <Route path="/seasons/:id/edit" component={() => <ProtectedRoute component={SeasonForm} />} />
      <Route path="/seasons" component={() => <ProtectedRoute component={SeasonsPage} />} />
      <Route path="/episodes/new" component={() => <ProtectedRoute component={EpisodeForm} />} />
      <Route path="/episodes/:id/edit" component={() => <ProtectedRoute component={EpisodeForm} />} />
      <Route path="/episodes" component={() => <ProtectedRoute component={EpisodesPage} />} />
      <Route path="/ads/:id" component={() => <ProtectedRoute component={AdForm} />} />
      <Route path="/ads" component={() => <ProtectedRoute component={AdsPage} />} />
      <Route path="/google-ads" component={() => <ProtectedRoute component={GoogleAdsPage} />} />
      <Route path="/pages/:id" component={() => <ProtectedRoute component={PageForm} />} />
      <Route path="/pages" component={() => <ProtectedRoute component={PagesPage} />} />
      <Route path="/media-library" component={() => <ProtectedRoute component={MediaLibraryPage} />} />
      <Route path="/genres/new" component={() => <ProtectedRoute component={GenreFormPage} />} />
      <Route path="/genres/:id/edit" component={() => <ProtectedRoute component={GenreFormPage} />} />
      <Route path="/genres" component={() => <ProtectedRoute component={GenresPage} />} />
      <Route path="/plans/new" component={() => <ProtectedRoute component={PlanFormPage} />} />
      <Route path="/plans/:id/edit" component={() => <ProtectedRoute component={PlanFormPage} />} />
      <Route path="/plans" component={() => <ProtectedRoute component={PlansPage} />} />
      <Route path="/subscriptions/new" component={() => <ProtectedRoute component={SubscriptionFormPage} />} />
      <Route path="/subscriptions/:id/edit" component={() => <ProtectedRoute component={SubscriptionFormPage} />} />
      <Route path="/subscriptions" component={() => <ProtectedRoute component={SubscriptionsListPage} />} />
      <Route path="/plan-limits/new" component={() => <ProtectedRoute component={PlanLimitFormPage} />} />
      <Route path="/plan-limits/:id/edit" component={() => <ProtectedRoute component={PlanLimitFormPage} />} />
      <Route path="/plan-limits" component={() => <ProtectedRoute component={PlanLimitsPage} />} />
      <Route path="/faq/new" component={() => <ProtectedRoute component={FaqFormPage} />} />
      <Route path="/faq/:id/edit" component={() => <ProtectedRoute component={FaqFormPage} />} />
      <Route path="/faq" component={() => <ProtectedRoute component={FaqListPage} />} />
      <Route path="/actors/new" component={() => <ProtectedRoute component={ActorFormPage} />} />
      <Route path="/actors/:id/edit" component={() => <ProtectedRoute component={ActorFormPage} />} />
      <Route path="/actors" component={() => <ProtectedRoute component={ActorsListPage} />} />
      <Route path="/directors/new" component={() => <ProtectedRoute component={DirectorFormPage} />} />
      <Route path="/directors/:id/edit" component={() => <ProtectedRoute component={DirectorFormPage} />} />
      <Route path="/directors" component={() => <ProtectedRoute component={DirectorsListPage} />} />
      <Route path="/crew/new" component={() => <ProtectedRoute component={CrewFormPage} />} />
      <Route path="/crew/:id/edit" component={() => <ProtectedRoute component={CrewFormPage} />} />
      <Route path="/crew" component={() => <ProtectedRoute component={CrewListPage} />} />
      <Route path="/countries/new" component={() => <ProtectedRoute component={CountryFormPage} />} />
      <Route path="/countries/:id/edit" component={() => <ProtectedRoute component={CountryFormPage} />} />
      <Route path="/countries" component={() => <ProtectedRoute component={CountriesListPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationListPage} />} />
      <Route path="/notification-templates/:id/edit" component={() => <ProtectedRoute component={NotificationTemplateFormPage} />} />
      <Route path="/notification-templates" component={() => <ProtectedRoute component={NotificationTemplatesPage} />} />
      <Route path="/settings/icons" component={() => <ProtectedRoute component={IconsPage} />} />
      <Route path="/settings/branding" component={() => <ProtectedRoute component={Branding} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/app-management" component={() => <ProtectedRoute component={AppManagement} />} />
      <Route path="/home-sections" component={() => <ProtectedRoute component={HomeSections} />} />
      <Route path="/reviews" component={() => <ProtectedRoute component={Reviews} />} />
      <Route path="/new-hot" component={() => <ProtectedRoute component={NewHotManagement} />} />
      <Route path="/influencers" component={() => <ProtectedRoute component={InfluencersPage} />} />
      <Route path="/approvals" component={() => <ProtectedRoute component={ApprovalsPage} />} />
      <Route path="/short-dramas/new" component={() => <ProtectedRoute component={ShortDramaForm} />} />
      <Route path="/short-dramas/:id/edit" component={() => <ProtectedRoute component={ShortDramaForm} />} />
      <Route path="/short-dramas/:id" component={() => <ProtectedRoute component={ShortDramaDetail} />} />
      <Route path="/short-dramas" component={() => <ProtectedRoute component={ShortDramasPage} />} />
      <Route path="/short-drama-seasons/new" component={() => <ProtectedRoute component={SeasonForm} />} />
      <Route path="/short-drama-seasons/:id/edit" component={() => <ProtectedRoute component={SeasonForm} />} />
      <Route path="/short-drama-seasons/:id" component={() => <ProtectedRoute component={SeasonForm} />} />
      <Route path="/short-drama-seasons" component={() => <ProtectedRoute component={ShortDramaSeasonsPage} />} />
      <Route path="/short-drama-episodes/new" component={() => <ProtectedRoute component={EpisodeForm} />} />
      <Route path="/short-drama-episodes/:id/edit" component={() => <ProtectedRoute component={EpisodeForm} />} />
      <Route path="/short-drama-episodes/:id" component={() => <ProtectedRoute component={EpisodeForm} />} />
      <Route path="/short-drama-episodes" component={() => <ProtectedRoute component={ShortDramaEpisodesPage} />} />
      
      {/* Public streaming routes */}
      <Route path="/" component={StreamingHomePage} />
      <Route path="/login" component={PublicAuthPage} />
      <Route path="/register" component={PublicAuthPage} />
      <Route path="/movie/:id" component={MovieDetailPage} />
      <Route path="/show/:id" component={TVShowDetailPage} />
      <Route path="/show/:showTitle/episode/:epNum" component={EpisodeDetailPage} />
      <Route path="/drama/:id/episode/:epNum" component={ShortDramaPlayer} />
      <Route path="/browse/:tab" component={CategoriesBrowsePage} />
      <Route path="/browse" component={CategoriesBrowsePage} />
      <Route path="/tv-shows-browse" component={TvShowsPublicPage} />
      <Route path="/account" component={UserProfilePage} />
      <Route path="/page/:slug" component={PublicPagePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <SettingsProvider>
          <ThemeApplier />
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
