
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  User, Mail, Lock, Eye, EyeOff, LogOut, Crown, Clock,
  Heart, Shield, Trash2, ChevronRight, Play, Check,
  Loader2, Bell, ArrowLeft, Star, Edit3, Camera, AlertTriangle,
  Bookmark, Settings, CreditCard, Film, Tv, X, Download, BookmarkX,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import {
  getImageUrl, updateProfile, updatePassword, deleteAccount,
  useGetWishlist, useToggleWishlist,
  useGetDownloads, useRemoveDownload,
} from "@/lib/api-client";
import { PublicFooter } from "@/pages/streaming-home";
import MediaPicker from "@/components/MediaPicker";

type ProfileTab = "overview" | "settings" | "security" | "watchlist" | "downloads";

function AvatarCircle({ name, avatarUrl, size = "lg" }: { name?: string; avatarUrl?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl",
  };
  if (avatarUrl) {
    return (
      <div className={`${sizeMap[size]} rounded-full overflow-hidden flex-shrink-0 shadow-xl shadow-primary/40 bg-zinc-900 border border-white/10`}>
        <img src={getImageUrl(avatarUrl)} alt={name || "Avatar"} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center font-black text-white flex-shrink-0 shadow-xl shadow-primary/40`}>
      {name ? name[0].toUpperCase() : <User className="w-1/2 h-1/2" />}
    </div>
  );
}

function ToastAlert({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[300] bg-[#0c0c14] border border-emerald-500/30 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      </div>
      <span className="text-white text-xs font-bold">{msg}</span>
      <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors ml-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function UserProfilePage() {
  const [, setLocation] = useLocation();
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [toast, setToast] = useState("");

  // Edit profile state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Continue watching
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setEditName(u.name || "");
        setEditEmail(u.email || "");
      }
      const cw = JSON.parse(localStorage.getItem("continue_watching") || "[]");
      setContinueWatching(Array.isArray(cw) ? cw : []);
    } catch {}
  }, []);

  // Wishlist API
  const { data: wishlistData, isLoading: wishlistLoading, refetch: refetchWishlist } = useGetWishlist({ limit: 50 });
  const wishlistItems: any[] = wishlistData?.items || [];
  const toggleWishlistMutation = useToggleWishlist();

  // Downloads API
  const { data: downloadsData, isLoading: downloadsLoading, refetch: refetchDownloads } = useGetDownloads({ limit: 50 });
  const downloadItems: any[] = downloadsData?.items || [];
  const removeDownloadMutation = useRemoveDownload();

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setLocation("/");
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      await updateProfile({ name: editName, email: editEmail });
      const updated = { ...user, name: editName, email: editEmail };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setToast("Profile updated successfully");
      window.dispatchEvent(new Event("user-updated"));
    } catch (e: any) {
      setToast("Failed to update profile");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAvatarSelect = async (url: string) => {
    try {
      await updateProfile({ avatar: url });
      const updated = { ...user, avatar: url };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setToast("Profile photo updated successfully");
      window.dispatchEvent(new Event("user-updated"));
    } catch (e: any) {
      setToast("Failed to update profile photo");
    }
    setMediaPickerOpen(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setToast("Password changed successfully");
    } catch (e: any) {
      setPasswordError(e.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      setLocation("/");
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleRemoveWishlist = async (item: any) => {
    try {
      await toggleWishlistMutation.mutateAsync({ contentId: item.id, contentType: item.type });
      setToast("Removed from wishlist");
      refetchWishlist();
    } catch {
      setToast("Failed to remove from wishlist");
    }
  };

  const handleRemoveDownload = async (id: string) => {
    try {
      await removeDownloadMutation.mutateAsync(id);
      setToast("Download removed");
      refetchDownloads();
    } catch {
      setToast("Failed to remove download");
    }
  };

  const handlePlayItem = (item: any) => {
    // Downloads: item.id = log _id, item.contentId = real content id
    // Wishlist:  item.id = content _id (no contentId field)
    const navId = item.contentId || item.id;
    if (item.type === "drama" || item.contentType === "drama") {
      setLocation(`/show/${navId}/episode/1`);
    } else {
      setLocation(`/movie/${navId}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030306] flex flex-col items-center justify-center gap-6 p-6 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <User className="w-8 h-8 text-zinc-500" />
        </div>
        <div className="text-center">
          <h2 className="text-white font-black text-xl mb-2">You're not signed in</h2>
          <p className="text-zinc-500 text-sm mb-6">Please log in to view your profile and account settings.</p>
          <div className="flex items-center gap-3 justify-center">
            <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-300 hover:text-white font-bold rounded-xl text-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Back Home
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/30">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSubscribed = user.subscriptionStatus === "active" && user.subscriptionPlan !== "free";

  const TABS: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    { id: "watchlist", label: "Wishlist", icon: <Bookmark className="w-4 h-4" /> },
    { id: "downloads", label: "Downloads", icon: <Download className="w-4 h-4" /> },
    { id: "settings", label: "Edit Profile", icon: <Settings className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#030306] font-sans text-white selection:bg-primary/30">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#030306]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between h-[60px]">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all text-sm font-bold">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:block">Back to Home</span>
            </Link>
            <div className="w-px h-5 bg-zinc-800" />
            {getLogoUrl() ? (
              <img src={getLogoUrl()} alt={settings.platformName || "StreamIT"} className="h-7 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
                <span className="text-white font-black text-base hidden sm:block">{settings.platformName || "StreamIT"}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="pt-[60px]">
        <div className="relative overflow-hidden">
          <div className="h-40 sm:h-52 bg-gradient-to-br from-primary/20 via-[#030306] to-[#0a0a10]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(229,9,20,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.12),transparent_60%)]" />
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px)" }}
            />
          </div>

          {/* Avatar overlapping the banner */}
          <div className="absolute bottom-0 translate-y-1/2 left-6 sm:left-14">
            <div className="relative">
              <AvatarCircle name={user.name} avatarUrl={user.avatar} size="xl" />
              <button onClick={() => setMediaPickerOpen(true)} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-zinc-800 border-2 border-[#030306] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
                <Camera className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* User info below banner */}
        <div className="px-6 sm:px-14 pt-16 pb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">{user.name}</h1>
            <p className="text-zinc-500 text-sm mt-0.5 font-medium">{user.email || "Member"}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {isSubscribed ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-lg text-[11px] font-black">
                  <Crown className="w-3 h-3" /> {user.subscriptionPlan || 'Premium'} Member
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-[11px] font-black">
                  Free Member
                </span>
              )}
              {isSubscribed && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-black">
                  <Check className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {/* Stats Row */}
        <div className="px-6 sm:px-14 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Film className="w-4 h-4" />, label: "Continue Watching", value: continueWatching.length },
            { icon: <Bookmark className="w-4 h-4" />, label: "Wishlist", value: wishlistItems.length },
            { icon: <Download className="w-4 h-4" />, label: "Downloads", value: downloadItems.length },
            { icon: <Crown className="w-4 h-4" />, label: "Plan Level", value: isSubscribed ? (user.subscriptionPlan || 'Premium') : 'Free' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/3 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                {stat.icon}
                <span className="text-[11px] font-bold uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-white font-black text-2xl tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="sticky top-[60px] z-30 bg-[#030306]/95 backdrop-blur-md border-b border-white/5 px-6 sm:px-14">
          <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "text-white border-primary"
                    : "text-zinc-500 border-transparent hover:text-zinc-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 sm:px-14 py-8 max-w-4xl">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Subscription Card */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-[#0c0c14] to-[#0c0c14] p-6">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-start justify-between gap-4 relative">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400 font-black text-sm capitalize">{user.subscriptionPlan || 'Free'} Plan</span>
                    </div>
                    <h3 className="text-white font-black text-xl mb-1">
                      {isSubscribed ? 'All-Access Subscription' : 'Free Account'}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {isSubscribed ? 'Unlimited streaming · HD & 4K · All devices' : 'Upgrade to unlock all premium content'}
                    </p>
                    {!isSubscribed && (
                      <div className="mt-4">
                        <button
                          onClick={() => setLocation('/')}
                          className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/30"
                        >
                          Upgrade Now
                        </button>
                      </div>
                    )}
                  </div>
                  {isSubscribed && (
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-400/20 border border-amber-400/30 text-amber-400 hover:bg-amber-400/30 rounded-xl text-xs font-bold transition-all flex-shrink-0">
                      <CreditCard className="w-3.5 h-3.5" /> Manage
                    </button>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-white font-black text-base mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Recently Watched
                </h3>
                {continueWatching.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/2">
                    <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Nothing to show yet. Start watching!</p>
                    <Link href="/" className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all">
                      Browse Content
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {continueWatching.slice(0, 8).map((item: any) => (
                      <div key={item.id} onClick={() => handlePlayItem(item)} className="group cursor-pointer">
                        <div className="relative rounded-xl overflow-hidden bg-zinc-900 mb-2" style={{ aspectRatio: "16/9" }}>
                          <img
                            src={item.poster ? getImageUrl(item.poster) : ''}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = '#111'; }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress || 25}%` }} />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <p className="text-white text-xs font-bold truncate">{item.title}</p>
                        <p className="text-zinc-600 text-[10px] mt-0.5">{item.progress || 25}% complete</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: <Bookmark className="w-4 h-4" />, label: "My Wishlist", desc: `${wishlistItems.length} saved titles`, tab: "watchlist" as ProfileTab },
                  { icon: <Download className="w-4 h-4" />, label: "My Downloads", desc: `${downloadItems.length} downloaded items`, tab: "downloads" as ProfileTab },
                ].map((action) => (
                  <button key={action.label} onClick={() => setActiveTab(action.tab)} className="flex items-center gap-4 p-4 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/6 hover:border-white/10 transition-all text-left group">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-primary/10 group-hover:text-primary transition-all flex-shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold">{action.label}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === "watchlist" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-black text-lg flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-primary" /> My Wishlist
                  {wishlistItems.length > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{wishlistItems.length}</span>
                  )}
                </h2>
                <Link href="/browse" className="text-zinc-500 hover:text-primary text-xs font-bold transition-colors">
                  Browse More +
                </Link>
              </div>

              {wishlistLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-white/5 rounded-2xl bg-white/2">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Bookmark className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-white font-bold">Your wishlist is empty</p>
                  <p className="text-zinc-500 text-sm">Click the Watchlist button on any movie or show to save it here</p>
                  <Link href="/browse" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all">
                    Browse Content
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item: any) => (
                    <div key={item.id} className="group flex items-center gap-4 p-4 bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 rounded-2xl transition-all">
                      <div
                        className="relative flex-shrink-0 w-24 rounded-xl overflow-hidden cursor-pointer bg-zinc-900"
                        style={{ aspectRatio: item.type === "drama" ? "9/16" : "16/9" }}
                        onClick={() => handlePlayItem(item)}
                      >
                        <img
                          src={item.poster ? getImageUrl(item.poster) : (item.backdrop ? getImageUrl(item.backdrop) : '')}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = '#111'; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-zinc-500 text-xs">
                          <span className="capitalize">{item.type === 'show' ? 'TV Show' : item.type}</span>
                          {item.year && <><span>·</span><span>{item.year}</span></>}
                          {item.imdbRating && <><span>·</span><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /><span className="text-amber-400">{item.imdbRating}</span></>}
                        </div>
                        <button
                          onClick={() => handlePlayItem(item)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" /> Watch Now
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveWishlist(item)}
                        disabled={toggleWishlistMutation.isPending}
                        className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-zinc-500 flex items-center justify-center transition-all disabled:opacity-50"
                        title="Remove from wishlist"
                      >
                        <BookmarkX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DOWNLOADS TAB */}
          {activeTab === "downloads" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-black text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" /> My Downloads
                  {downloadItems.length > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{downloadItems.length}</span>
                  )}
                </h2>
              </div>

              {downloadsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : downloadItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-white/5 rounded-2xl bg-white/2">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Download className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-white font-bold">No downloads yet</p>
                  <p className="text-zinc-500 text-sm">Download movies and episodes to watch offline</p>
                  <Link href="/browse" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all">
                    Browse Content
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloadItems.map((item: any) => (
                    <div key={item.id} className="group flex items-center gap-4 p-4 bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 rounded-2xl transition-all">
                      <div
                        className="relative flex-shrink-0 w-28 rounded-xl overflow-hidden cursor-pointer bg-zinc-900"
                        style={{ aspectRatio: "16/9" }}
                        onClick={() => handlePlayItem(item)}
                      >
                        <img
                          src={item.thumbnail ? getImageUrl(item.thumbnail) : ''}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = '#111'; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.parentTitle && (
                          <p className="text-zinc-400 text-xs font-semibold mb-0.5 truncate">{item.parentTitle}</p>
                        )}
                        <p className="text-white font-bold text-sm truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-zinc-500 text-xs">
                          <span className="capitalize">{item.type}</span>
                          {item.episodeNumber && <><span>·</span><span>S{item.season} E{item.episodeNumber}</span></>}
                          {item.duration && <><span>·</span><span>{item.duration}m</span></>}
                          {item.year && <><span>·</span><span>{item.year}</span></>}
                        </div>
                        <p className="text-zinc-600 text-[10px] mt-1">
                          Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveDownload(item.id)}
                        disabled={removeDownloadMutation.isPending}
                        className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-zinc-500 flex items-center justify-center transition-all disabled:opacity-50"
                        title="Remove download"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EDIT PROFILE TAB */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-white font-black text-lg">Edit Profile</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 p-5 bg-white/3 border border-white/5 rounded-2xl">
                <AvatarCircle name={user.name} avatarUrl={user.avatar} size="lg" />
                <div>
                  <p className="text-white font-bold text-sm">{user.name}</p>
                  <p className="text-zinc-500 text-xs mb-3">{user.email || "Member"}</p>
                  <button onClick={() => setMediaPickerOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-all">
                    <Camera className="w-3 h-3" /> Change Photo
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary text-white placeholder:text-zinc-600 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      placeholder="Your display name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary text-white placeholder:text-zinc-600 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={editSaving || !editName.trim()}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-8 max-w-lg">
              <div>
                <h2 className="text-white font-black text-lg mb-1">Security Settings</h2>
                <p className="text-zinc-500 text-sm">Keep your account safe and secure.</p>
              </div>

              {/* Change Password */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <h3 className="text-white font-black text-sm">Change Password</h3>
                </div>

                {passwordError && (
                  <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-semibold">
                    {passwordError}
                  </div>
                )}

                {[
                  { label: "Current Password", value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(!showCurrent) },
                  { label: "New Password", value: newPassword, setter: setNewPassword, show: showNew, toggleShow: () => setShowNew(!showNew) },
                  { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, show: showNew, toggleShow: () => setShowNew(!showNew) },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">{field.label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type={field.show ? "text" : "password"}
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary text-white pl-10 pr-10 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={field.toggleShow}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="border border-primary/20 rounded-2xl p-6 bg-primary/3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  <h3 className="text-primary font-black text-sm">Danger Zone</h3>
                </div>
                <p className="text-zinc-500 text-xs mb-5 leading-relaxed">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>

                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 hover:border-primary/40 rounded-xl text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-primary text-xs font-bold">Are you absolutely sure? This cannot be undone.</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                      >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {deleting ? "Deleting..." : "Yes, Delete Forever"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <PublicFooter />

      {toast && <ToastAlert msg={toast} onClose={() => setToast("")} />}

      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleAvatarSelect}
        type="image"
      />

      <style>{`
        html { scroll-behavior: smooth; }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        body { background: #030306; }
      `}</style>
    </div>
  );
}
