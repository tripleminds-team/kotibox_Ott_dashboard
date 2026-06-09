
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSettings, getImageUrl } from "@/lib/api-client";

export interface AppSettings {
  logoUrl: string;
  darkLogoUrl: string;
  lightLogoUrl: string;
  faviconUrl: string;
  platformName: string;
  contactNo: string;
  inquiryEmail: string;
  siteDescription: string;
  copyrightText: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  loginTitle: string;
  loginSubtitle: string;
  loginButtonText: string;
}

const DEFAULT: AppSettings = {
  logoUrl: "",
  darkLogoUrl: "",
  lightLogoUrl: "",
  faviconUrl: "",
  platformName: "StreamVault",
  contactNo: "",
  inquiryEmail: "",
  siteDescription: "",
  copyrightText: "",
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  loginTitle: "Welcome Back",
  loginSubtitle: "Admin Console",
  loginButtonText: "Sign In",
};

const STORAGE_KEY = "tripleMindesSettings";

function mapApiData(api: any): AppSettings {
  const img = (v: string) => (v ? getImageUrl(v) : "");
  return {
    logoUrl: img(api.logoUrl),
    darkLogoUrl: img(api.darkLogoUrl),
    lightLogoUrl: img(api.lightLogoUrl),
    faviconUrl: img(api.faviconUrl),
    platformName: api.platformName || DEFAULT.platformName,
    contactNo: api.contactNo || "",
    inquiryEmail: api.inquiryEmail || "",
    siteDescription: api.siteDescription || "",
    copyrightText: api.copyrightText || "",
    facebookUrl: api.facebookUrl || "",
    twitterUrl: api.twitterUrl || "",
    instagramUrl: api.instagramUrl || "",
    youtubeUrl: api.youtubeUrl || "",
    loginTitle: api.loginTitle || DEFAULT.loginTitle,
    loginSubtitle: api.loginSubtitle || DEFAULT.loginSubtitle,
    loginButtonText: api.loginButtonText || DEFAULT.loginButtonText,
  };
}

function applyFavicon(url: string) {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT;
  });
  const [isLoading, setIsLoading] = useState(false);

  const persist = (s: AppSettings) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  };

  const refreshSettings = useCallback(async () => {
    if (!localStorage.getItem("accessToken")) return;
    try {
      setIsLoading(true);
      const data = await getSettings();
      const mapped = mapApiData(data);
      setSettings(mapped);
      persist(mapped);
      applyFavicon(mapped.faviconUrl);
    } catch (e) {
      console.warn("Settings fetch failed, using cached values:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      if (patch.faviconUrl) applyFavicon(patch.faviconUrl);
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
