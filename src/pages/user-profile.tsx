
import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import {
  User, Mail, Lock, Eye, EyeOff, LogOut, Crown, Clock,
  Heart, Shield, Trash2, ChevronRight, Play, Check,
  Loader2, Bell, ArrowLeft, Star, Edit3, Camera, AlertTriangle,
  Bookmark, Settings, CreditCard, Film, Tv, X, Download, BookmarkX,
  Plus, UserCircle2, Wifi, Smartphone,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import {
  getImageUrl, updateAppProfile, uploadProfileAvatar, updatePassword, deleteAccount,
  useGetWishlist, useToggleWishlist,
  useGetDownloads, useRemoveDownload, getOfflineVideoUrl, removeOfflineVideo,
  useGetAppProfile, useGetWatchHistory,
} from "@/lib/api-client";
import { PublicFooter } from "@/pages/streaming-home";
import { WebsiteReviews } from "@/components/WebsiteReviews";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProfileTab = "overview" | "settings" | "security" | "watchlist" | "downloads" | "feedback";

interface OttProfile {
  id: string;
  name: string;
  color: string;
  isMain: boolean;
}

const PROFILE_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
];

const COLOR_LABELS = ["Red", "Blue", "Purple", "Emerald", "Amber", "Pink"];

// ─── Sub-components ────────────────────────────────────────────────────────────

function AvatarCircle({
  name,
  avatarUrl,
  size = "lg",
}: {
  name?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl",
  };
  if (avatarUrl) {
    return (
      <div
        className={`${sizeMap[size]} rounded-full overflow-hidden flex-shrink-0 shadow-xl shadow-primary/40 bg-zinc-900 border border-white/10`}
      >
        <img
          src={getImageUrl(avatarUrl)}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center font-black text-white flex-shrink-0 shadow-xl shadow-primary/40`}
    >
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
      <button onClick={onClose} className="text-zinc-100 hover:text-white transition-colors ml-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Profile color circle ──────────────────────────────────────────────────────

function ProfileColorCircle({
  profile,
  size = "lg",
  onClick,
}: {
  profile: OttProfile;
  size?: "sm" | "lg";
  onClick?: () => void;
}) {
  const sizeClass = size === "lg" ? "w-24 h-24 text-3xl" : "w-10 h-10 text-sm";
  return (
    <button
      onClick={onClick}
      className={`${sizeClass} ${profile.color} rounded-full flex items-center justify-center font-black text-white shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 flex-shrink-0`}
    >
      {profile.name[0]?.toUpperCase() ?? "?"}
    </button>
  );
}

// ─── Multi-profile selector screen ─────────────────────────────────────────────

function ProfileSelectScreen({
  mainUserName,
  profileLimitCount,
  onSelect,
}: {
  mainUserName: string;
  profileLimitCount: number;
  onSelect: (profile: OttProfile) => void;
}) {
  const [profiles, setProfiles] = useState<OttProfile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileColor, setNewProfileColor] = useState(PROFILE_COLORS[1]);

  const usedColors = profiles.map((p) => p.color);
  const availableColors = PROFILE_COLORS.filter((c) => !usedColors.includes(c));

  useEffect(() => {
    if (showAddModal && availableColors.length > 0) {
      setNewProfileColor(availableColors[0]);
    }
  }, [showAddModal, profiles]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ott_profiles");
      if (stored) {
        const parsed: OttProfile[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed);
          return;
        }
      }
    } catch {}
    const main: OttProfile = {
      id: "main",
      name: mainUserName || "Me",
      color: PROFILE_COLORS[0],
      isMain: true,
    };
    localStorage.setItem("ott_profiles", JSON.stringify([main]));
    setProfiles([main]);
  }, [mainUserName]);

  const saveProfiles = (updated: OttProfile[]) => {
    localStorage.setItem("ott_profiles", JSON.stringify(updated));
    setProfiles(updated);
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;
    if (profiles.length >= profileLimitCount) return;
    const newP: OttProfile = {
      id: `profile_${Date.now()}`,
      name: newProfileName.trim(),
      color: newProfileColor,
      isMain: false,
    };
    saveProfiles([...profiles, newP]);
    setNewProfileName("");
    setShowAddModal(false);
  };

  const handleDeleteProfile = (id: string) => {
    saveProfiles(profiles.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#030306] flex flex-col items-center justify-center px-6 py-12 font-sans">
      <h1 className="text-white font-black text-3xl sm:text-4xl mb-2 text-center tracking-tight">
        Who's watching?
      </h1>
      <p className="text-zinc-100 text-sm mb-12 text-center">Select a profile to continue</p>

      <div className="flex flex-wrap justify-center gap-8 mb-12">
        {profiles.map((profile) => (
          <div key={profile.id} className="flex flex-col items-center gap-3 group">
            <div className="relative">
              <ProfileColorCircle
                profile={profile}
                size="lg"
                onClick={() => {
                  localStorage.setItem("ott_active_profile", JSON.stringify(profile));
                  onSelect(profile);
                }}
              />
              {!profile.isMain && (
                <button
                  onClick={() => handleDeleteProfile(profile.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-white text-sm font-bold text-center max-w-[96px] truncate">
              {profile.name}
            </span>
          </div>
        ))}

        {profiles.length < profileLimitCount && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-100 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-8 h-8" />
            </button>
            <span className="text-zinc-100 text-sm font-bold">Add Profile</span>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0c0c14] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-white font-black text-lg mb-5">New Profile</h2>

            <div className="mb-4">
              <label className="block text-xs font-black text-zinc-200 uppercase tracking-wider mb-2">
                Name
              </label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Profile name"
                maxLength={20}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary text-white placeholder:text-zinc-200 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-black text-zinc-200 uppercase tracking-wider mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => {
                  const idx = PROFILE_COLORS.indexOf(color);
                  return (
                    <button
                      key={color}
                      onClick={() => setNewProfileColor(color)}
                      className={`w-8 h-8 rounded-full ${color} transition-all ${
                        newProfileColor === color
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#0c0c14] scale-110"
                          : "hover:scale-105"
                      }`}
                      title={COLOR_LABELS[idx]}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddProfile}
                disabled={!newProfileName.trim()}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Profile
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProfileName("");
                }}
                className="flex-1 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white rounded-xl text-sm font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plan display helpers ───────────────────────────────────────────────────────
function getPlanDisplayName(plan: string): string {
  switch ((plan || "free").toLowerCase()) {
    case "premium": return "Premium Plan";
    case "standard": return "Standard Plan";
    case "basic": return "Basic Plan";
    default: return "Free Plan";
  }
}

function getPlanDescription(plan: string): string {
  switch ((plan || "free").toLowerCase()) {
    case "premium": return "4K + Dolby Atmos · 4 devices · Unlimited access · VIP support";
    case "standard": return "Full HD streaming · 2 devices · Ads-free experience";
    case "basic": return "HD quality · 1 device · Ads-free library";
    default: return "Access to free content · Standard quality";
  }
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const [, setLocation] = useLocation();
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();

  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("appUser");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [toast, setToast] = useState("");

  const { data: profileData } = useGetAppProfile();

  useEffect(() => {
    if (profileData?.user) {
      const freshUser = {
        id: profileData.user.id || profileData.user._id,
        name: profileData.user.name,
        email: profileData.user.email,
        phone: profileData.user.phone || profileData.user.mobile,
        avatar: profileData.user.avatar,
        subscriptionPlan: profileData.user.subscriptionPlan || "free",
        subscriptionStatus: profileData.user.subscriptionStatus || "inactive",
        profileLimitCount: profileData.user.profileLimitCount || 1,
      };
      localStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
      setEditName(freshUser.name || "");
      setEditEmail(freshUser.email || "");
      setEditPhone(freshUser.phone || "");
    }
  }, [profileData]);

  // Active OTT profile (null = show selector screen)
  const [activeProfile, setActiveProfile] = useState<OttProfile | null>(null);

  // Edit profile state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
  const { data: watchHistoryData } = useGetWatchHistory({ limit: 10 });
  const continueWatching = watchHistoryData?.items || [];

  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("appUser");
      if (stored) {
        const u = JSON.parse(stored);
        setEditName(u.name || "");
        setEditEmail(u.email || "");
        setEditPhone(u.phone || "");
      }

      const savedProfile = localStorage.getItem("ott_active_profile");
      if (savedProfile) {
        setActiveProfile(JSON.parse(savedProfile));
      }
    } catch {}
  }, []);

  // Wishlist API
  const { data: wishlistData, isLoading: wishlistLoading, refetch: refetchWishlist } =
    useGetWishlist({ limit: 50 });
  const wishlistItems: any[] = wishlistData?.items || [];
  const toggleWishlistMutation = useToggleWishlist();

  // Downloads API
  const { data: downloadsData, isLoading: downloadsLoading, refetch: refetchDownloads } =
    useGetDownloads({ limit: 50 });
  const downloadItems: any[] = Array.isArray(downloadsData) ? downloadsData : [];
  const removeDownloadMutation = useRemoveDownload();

  // Refetch wishlist and downloads when profile changes
  useEffect(() => {
    const handleProfileChanged = () => {
      refetchWishlist();
      refetchDownloads();
    };
    window.addEventListener('profile-changed', handleProfileChanged);
    return () => window.removeEventListener('profile-changed', handleProfileChanged);
  }, [refetchWishlist, refetchDownloads]);

  const [offlineCached, setOfflineCached] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (downloadItems.length === 0) return;
    const checkCache = async () => {
      if (!('caches' in window)) return;
      const cache = await caches.open('video-offline-cache');
      const results: Record<string, boolean> = {};
      for (const item of downloadItems) {
        const key = item.episodeId ? `episode-${item.episodeId}` : `movie-${item.contentId}`;
        const match = await cache.match(key);
        results[item.id] = !!match;
      }
      setOfflineCached(results);
    };
    checkCache();
  }, [downloadItems.length]);

  const handleSignOut = () => {
    localStorage.removeItem("appUser");
    localStorage.removeItem("appAccessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("ott_active_profile");
    setLocation("/");
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      await updateAppProfile({ name: editName, email: editEmail, phone: editPhone });
      const updated = { ...user, name: editName, email: editEmail, phone: editPhone };
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast("Image must be under 5MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const { avatarUrl } = await uploadProfileAvatar(file);
      await updateAppProfile({ avatar: avatarUrl });
      const updated = { ...user, avatar: avatarUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setToast("Profile photo updated");
      window.dispatchEvent(new Event("user-updated"));
    } catch {
      setToast("Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
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
      localStorage.removeItem("appUser");
      localStorage.removeItem("appAccessToken");
      setLocation("/");
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleRemoveWishlist = async (item: any) => {
    try {
      await toggleWishlistMutation.mutateAsync({
        contentId: item.id,
        contentType: item.type,
      });
      setToast("Removed from wishlist");
      refetchWishlist();
    } catch {
      setToast("Failed to remove from wishlist");
    }
  };

  const handleRemoveDownload = async (item: any) => {
    try {
      await removeDownloadMutation.mutateAsync({ id: item.id, contentId: item.contentId, episodeId: item.episodeId || undefined });
      await removeOfflineVideo(item.contentId, item.episodeId || undefined);
      setToast("Download removed");
      refetchDownloads();
    } catch {
      setToast("Failed to remove download");
    }
  };

  const handlePlayDownload = async (item: any) => {
    // Try to get the cached blob URL — if found, put it in sessionStorage so the player uses it immediately
    const blobUrl = await getOfflineVideoUrl(item.contentId, item.episodeId || undefined);
    if (blobUrl) {
      sessionStorage.setItem(`offline_url_${item.contentId}_${item.episodeId || ''}`, blobUrl);
    }
    handlePlayItem(item);
  };

  const handlePlayItem = (item: any) => {
    const navId = item.contentId || item.id;
    const isDrama = item.type === "drama" || item.contentType === "drama";
    const isShow =
      item.type === "show" || item.type === "series" || item.contentType === "series";
    if (isDrama) {
      setLocation(`/drama/${navId}/episode/1`);
    } else if (isShow) {
      setLocation(`/show/${navId}`);
    } else {
      setLocation(`/movie/${navId}`);
    }
  };

  // ── Not signed in ────────────────────────────────────────────────────────────

  if (!user) {
    // If profileData hasn't resolved yet, show a loading screen instead of the not-signed-in screen
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("appAccessToken");
    if (hasToken) {
      return (
        <div className="min-h-screen bg-[#030306] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#030306] flex flex-col items-center justify-center gap-6 p-6 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <User className="w-8 h-8 text-zinc-100" />
        </div>
        <div className="text-center">
          <h2 className="text-white font-black text-xl mb-2">You're not signed in</h2>
          <p className="text-zinc-100 text-sm mb-6">
            Please log in to view your profile and account settings.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-100 hover:text-white font-bold rounded-xl text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back Home
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/30"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Profile selector screen ───────────────────────────────────────────────────

  if (!activeProfile) {
    return (
      <ProfileSelectScreen
        mainUserName={user.name}
        profileLimitCount={user.profileLimitCount || 1}
        onSelect={(profile) => {
          setActiveProfile(profile);
          window.dispatchEvent(new Event('profile-changed'));
        }}
      />
    );
  }

  // ── Active profile view ───────────────────────────────────────────────────────

  const isSubscribed =
    user.subscriptionStatus === "active" && user.subscriptionPlan !== "free";

  const TABS: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    { id: "watchlist", label: "Wishlist", icon: <Bookmark className="w-4 h-4" /> },
    { id: "downloads", label: "Downloads", icon: <Download className="w-4 h-4" /> },
    { id: "settings", label: "Edit Profile", icon: <Settings className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "feedback", label: "Rate Website", icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#030306] font-sans text-white selection:bg-primary/30">

      {/* ── Top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#030306]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between h-[60px] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-200 hover:text-white transition-all text-sm font-bold flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:block">Home</span>
            </Link>
            <div className="w-px h-5 bg-zinc-800 flex-shrink-0" />
            {getLogoUrl() ? (
              <img
                src={getLogoUrl()}
                alt={settings.platformName || "StreamIT"}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
                <span className="text-white font-black text-base hidden sm:block">
                  {settings.platformName || "StreamIT"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                localStorage.removeItem("ott_active_profile");
                setActiveProfile(null);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 text-xs font-bold transition-all"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Switch Profile</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Content below header ── */}
      <div className="pt-[60px]">

        {/* ── Profile card (no banner) ── */}
        <div className="px-4 sm:px-8 lg:px-14 pt-8 pb-4">
          <div className="flex items-center gap-5 p-5 sm:p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex-wrap sm:flex-nowrap">
            {/* Avatar with camera button */}
            <div className="relative flex-shrink-0">
              <AvatarCircle name={user.name} avatarUrl={user.avatar} size="xl" />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-zinc-800 border-2 border-[#030306] flex items-center justify-center text-zinc-200 hover:text-white hover:bg-zinc-700 transition-all disabled:opacity-50"
              >
                {avatarUploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            {/* Name + email + badge */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black text-xl sm:text-2xl tracking-tight truncate">
                {user.name}
              </h1>
              <p className="text-zinc-100 text-sm mt-0.5 font-medium truncate">
                {user.email || "Member"}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {isSubscribed ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-lg text-[11px] font-black">
                    <Crown className="w-3 h-3" /> {user.subscriptionPlan || "Premium"} Member
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-[11px] font-black">
                    Free Member
                  </span>
                )}
                {isSubscribed && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-black">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
                <span className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-200 rounded-lg text-[11px] font-black">
                  {activeProfile.name}
                </span>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-100 hover:text-white rounded-xl text-xs font-bold transition-all flex-shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="px-4 sm:px-8 lg:px-14 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: <Film className="w-4 h-4 text-rose-500" />,
              label: "Continue Watching",
              value: continueWatching.length,
            },
            {
              icon: <Bookmark className="w-4 h-4 text-violet-500" />,
              label: "Wishlist",
              value: wishlistItems.length,
            },
            {
              icon: <Download className="w-4 h-4 text-emerald-500" />,
              label: "Downloads",
              value: downloadItems.length,
            },
            {
              icon: <Crown className="w-4 h-4 text-amber-500" />,
              label: "Plan Level",
              value: isSubscribed ? user.subscriptionPlan || "Premium" : "Free",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent hover:from-white/[0.07] hover:to-white/[0.01] border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-white/20 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200 group-hover:text-zinc-300 transition-colors">
                  {stat.label}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
              </div>
              <p className="text-white font-black text-2xl tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Sticky tab bar ── */}
        <div className="sticky top-[60px] z-30 bg-[#030306]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 lg:px-14">
          <div
            className="flex items-center gap-1 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "text-white border-primary"
                    : "text-zinc-100 border-transparent hover:text-zinc-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-4xl">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">


              {/* Recent Activity */}
              <div>
                <h3 className="text-white font-black text-base mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Recently Watched
                </h3>
                {continueWatching.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/2">
                    <Clock className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                    <p className="text-zinc-100 text-sm">Nothing to show yet. Start watching!</p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Browse Content
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {continueWatching.slice(0, 8).map((item: any) => (
                      <div
                        key={item.id || item._id}
                        onClick={() => handlePlayItem(item)}
                        className="group cursor-pointer"
                      >
                        <div
                          className="relative rounded-xl overflow-hidden bg-zinc-900 mb-2"
                          style={{ aspectRatio: "16/9" }}
                        >
                          <img
                            src={getImageUrl(item.thumbnail || item.poster || "")}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.backgroundColor = "#111";
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.round(item.progressPercent || item.progress || 25)}%` }}
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <p className="text-white text-xs font-bold truncate">{item.title}</p>
                        <p className="text-zinc-200 text-[10px] mt-0.5">
                          {Math.round(item.progressPercent || item.progress || 25)}% complete
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                </h2>
                <Link
                  href="/browse"
                  className="text-zinc-100 hover:text-primary text-xs font-bold transition-colors"
                >
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
                    <Bookmark className="w-8 h-8 text-zinc-200" />
                  </div>
                  <p className="text-white font-bold">Your wishlist is empty</p>
                  <p className="text-zinc-100 text-sm">
                    Click the Watchlist button on any movie or show to save it here
                  </p>
                  <Link
                    href="/browse"
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Browse Content
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                  {wishlistItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all duration-300 shadow-md aspect-[2/3] cursor-pointer"
                      onClick={() => handlePlayItem(item)}
                    >
                      <img
                        src={
                          item.poster
                            ? getImageUrl(item.poster)
                            : item.backdrop
                            ? getImageUrl(item.backdrop)
                            : ""
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.backgroundColor = "#111";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-3" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-primary/95 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
                        <p className="text-white font-bold text-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-200">
                          <span className="capitalize">
                            {item.type === "show" ? "TV Show" : item.type}
                          </span>
                          {item.year && <span>· {item.year}</span>}
                          {item.imdbRating && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold ml-auto">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {item.imdbRating}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWishlist(item);
                        }}
                        disabled={toggleWishlistMutation.isPending}
                        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-lg bg-black/60 hover:bg-primary/90 border border-white/10 hover:border-primary/50 text-zinc-200 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 duration-200 disabled:opacity-50"
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
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                      {downloadItems.length}
                    </span>
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
                    <Download className="w-8 h-8 text-zinc-200" />
                  </div>
                  <p className="text-white font-bold">No downloads yet</p>
                  <p className="text-zinc-100 text-sm">
                    Download movies and episodes to watch offline
                  </p>
                  <Link
                    href="/browse"
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Browse Content
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                  {downloadItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all duration-300 shadow-md aspect-[2/3] cursor-pointer"
                      onClick={() => handlePlayDownload(item)}
                    >
                      <img
                        src={
                          item.poster
                            ? getImageUrl(item.poster)
                            : item.thumbnail
                            ? getImageUrl(item.thumbnail)
                            : ""
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.backgroundColor = "#111";
                        }}
                      />
                      {offlineCached[item.id] && (
                        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/90 text-[9px] font-bold text-white">
                          <Wifi className="w-2.5 h-2.5" /> Offline
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-3" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-primary/95 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
                        {item.parentTitle && (
                          <p className="text-zinc-200 text-[10px] font-semibold mb-0.5 truncate leading-tight">
                            {item.parentTitle}
                          </p>
                        )}
                        <p className="text-white font-bold text-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-zinc-200">
                          <div className="flex items-center gap-1">
                            <span className="capitalize">{item.type}</span>
                            {item.episodeNumber && (
                              <span>
                                · S{item.season} E{item.episodeNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-zinc-100 text-[9px]">
                            {item.duration && <span>{item.duration}m</span>}
                            {item.duration && item.year && <span>·</span>}
                            {item.year && <span>{item.year}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDownload(item);
                        }}
                        disabled={removeDownloadMutation.isPending}
                        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-lg bg-black/60 hover:bg-primary/90 border border-white/10 hover:border-primary/50 text-zinc-200 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 duration-200 disabled:opacity-50"
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
                  <p className="text-zinc-100 text-xs mb-3">{user.email || "Member"}</p>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-100 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {avatarUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    {avatarUploading ? "Uploading..." : "Change Photo"}
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-zinc-200 uppercase tracking-wider mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary text-white placeholder:text-zinc-200 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      placeholder="Your display name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-200 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary text-white placeholder:text-zinc-200 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-200 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200" />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary text-white placeholder:text-zinc-200 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
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
                <p className="text-zinc-100 text-sm">Keep your account safe and secure.</p>
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
                  {
                    label: "Current Password",
                    value: currentPassword,
                    setter: setCurrentPassword,
                    show: showCurrent,
                    toggleShow: () => setShowCurrent(!showCurrent),
                  },
                  {
                    label: "New Password",
                    value: newPassword,
                    setter: setNewPassword,
                    show: showNew,
                    toggleShow: () => setShowNew(!showNew),
                  },
                  {
                    label: "Confirm New Password",
                    value: confirmPassword,
                    setter: setConfirmPassword,
                    show: showNew,
                    toggleShow: () => setShowNew(!showNew),
                  },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-black text-zinc-100 uppercase tracking-wider mb-2">
                      {field.label}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200" />
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
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-100 hover:text-white transition-colors"
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
                  {passwordSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="border border-primary/20 rounded-2xl p-6 bg-primary/3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  <h3 className="text-primary font-black text-sm">Danger Zone</h3>
                </div>
                <p className="text-zinc-100 text-xs mb-5 leading-relaxed">
                  Permanently delete your account and all associated data. This action cannot be
                  undone.
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
                    <p className="text-primary text-xs font-bold">
                      Are you absolutely sure? This cannot be undone.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                      >
                        {deleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        {deleting ? "Deleting..." : "Yes, Delete Forever"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FEEDBACK TAB */}
          {activeTab === "feedback" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-900 pb-5">
                <h3 className="text-white font-black text-lg mb-1 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary fill-primary animate-pulse" />
                  Website Feedback & Reviews
                </h3>
                <p className="text-zinc-400 text-xs">
                  Share your experience using our platform and see what other viewers think about us.
                </p>
              </div>
              <WebsiteReviews 
                user={user} 
                onSignInRequired={() => setLocation("/login")} 
              />
            </div>
          )}

        </div>
      </div>

      <PublicFooter />

      {toast && <ToastAlert msg={toast} onClose={() => setToast("")} />}

      <style>{`
        html { scroll-behavior: smooth; }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        body { background: #030306; }
      `}</style>
    </div>
  );
}
