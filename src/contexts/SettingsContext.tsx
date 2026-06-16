
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSettings, getImageUrl } from "@/lib/api-client";

export interface AppSettings {
  logoUrl: string;
  darkLogoUrl: string;
  lightLogoUrl: string;
  faviconUrl: string;
  logoStyle: 'icon' | 'fill';
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
  headerCode: string;
  footerCode: string;
  moduleUsers: boolean;
  moduleLanguages: boolean;
  moduleAds: boolean;
  modulePromotions: boolean;
  moduleBanners: boolean;
  modulePages: boolean;
  moduleMovies: boolean;
  moduleTvShows: boolean;
  moduleLiveTV: boolean;
  moduleVideos: boolean;
  moduleCastCrew: boolean;
  moduleAdsManager: boolean;
  moduleSubscriptions: boolean;
  modulePlans: boolean;
  maintenanceMode: boolean;
  userRegistration: boolean;
  socialLogin: boolean;
  twoFactorAuth: boolean;
  emailVerification: boolean;
  primaryColor: string;
  colorTheme: string;
  navbarStyle: 'glass' | 'sticky' | 'transparent' | 'default';
  navbarHide: boolean;
  cardStyle: 'default' | 'glass' | 'transparent';
  menuStyle: 'mini' | 'hover' | 'boxed' | 'soft';
  activeMenuStyle: string;
  footerStyle: 'default' | 'sticky';
  // Mail
  mailEmail: string;
  mailDriver: string;
  mailHost: string;
  mailPort: string;
  mailEncryption: string;
  mailUsername: string;
  mailPassword: string;
  mailFrom: string;
  mailFromName: string;
  // Notifications
  fcmServerKey: string;
  fcmSenderId: string;
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  // Language
  defaultLanguage: string;
  rtlSupport: boolean;
  // Notification Configuration
  notifNewUser: boolean;
  notifNewSubscription: boolean;
  notifNewContent: boolean;
  notifPaymentSuccess: boolean;
  notifPaymentFailed: boolean;
  notifContentExpiry: boolean;
  // Currency
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
  // Storage
  storageDriver: 'local' | 's3' | 'bunny';
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsBucket: string;
  awsPathStyleEndpoint: boolean;
  bunnyStorageZone: string;
  bunnyAccessKey: string;
  bunnyCdnUrl: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  googleAnalyticsId: string;
  seoImage: string;
  googleVerification: string;
  canonicalUrl: string;
}

const DEFAULT: AppSettings = {
  logoUrl: "",
  darkLogoUrl: "",
  lightLogoUrl: "",
  faviconUrl: "",
  logoStyle: "icon",
  platformName: "",
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
  headerCode: "",
  footerCode: "",
  moduleUsers: true,
  moduleLanguages: true,
  moduleAds: true,
  modulePromotions: true,
  moduleBanners: true,
  modulePages: true,
  moduleMovies: true,
  moduleTvShows: true,
  moduleLiveTV: true,
  moduleVideos: true,
  moduleCastCrew: true,
  moduleAdsManager: true,
  moduleSubscriptions: true,
  modulePlans: true,
  maintenanceMode: false,
  userRegistration: true,
  socialLogin: true,
  twoFactorAuth: false,
  emailVerification: true,
  primaryColor: "#e50914",
  colorTheme: "blue-green",
  navbarStyle: 'default',
  navbarHide: false,
  cardStyle: 'default',
  menuStyle: 'hover',
  activeMenuStyle: 'left-bordered',
  footerStyle: 'default',
  // Mail
  mailEmail: "",
  mailDriver: "smtp",
  mailHost: "smtp.gmail.com",
  mailPort: "587",
  mailEncryption: "tls",
  mailUsername: "",
  mailPassword: "",
  mailFrom: "",
  mailFromName: "StreamVault",
  // Notifications
  fcmServerKey: "",
  fcmSenderId: "",
  firebaseApiKey: "",
  firebaseProjectId: "",
  firebaseAppId: "",
  // Language
  defaultLanguage: "en",
  rtlSupport: false,
  // Notification Configuration
  notifNewUser: true,
  notifNewSubscription: true,
  notifNewContent: false,
  notifPaymentSuccess: true,
  notifPaymentFailed: true,
  notifContentExpiry: false,
  // Currency
  currencyCode: "USD",
  currencySymbol: "$",
  currencyPosition: 'before',
  decimalPlaces: 2,
  // Storage
  storageDriver: 'local',
  awsAccessKeyId: "",
  awsSecretAccessKey: "",
  awsRegion: "",
  awsBucket: "",
  awsPathStyleEndpoint: false,
  bunnyStorageZone: "",
  bunnyAccessKey: "",
  bunnyCdnUrl: "",
  // SEO
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  googleAnalyticsId: "",
  seoImage: "",
  googleVerification: "",
  canonicalUrl: "",
};

const STORAGE_KEY = "tripleMindesSettings";

function mapApiData(api: any): AppSettings {
  const img = (v: string) => (v ? getImageUrl(v) : "");
  return {
    logoUrl: img(api.logoUrl),
    darkLogoUrl: img(api.darkLogoUrl),
    lightLogoUrl: img(api.lightLogoUrl),
    faviconUrl: img(api.faviconUrl),
    logoStyle: api.logoStyle || DEFAULT.logoStyle,
    platformName: api.platformName || "",
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
    headerCode: api.headerCode || "",
    footerCode: api.footerCode || "",
    moduleUsers: api.moduleUsers ?? DEFAULT.moduleUsers,
    moduleLanguages: api.moduleLanguages ?? DEFAULT.moduleLanguages,
    moduleAds: api.moduleAds ?? DEFAULT.moduleAds,
    modulePromotions: api.modulePromotions ?? DEFAULT.modulePromotions,
    moduleBanners: api.moduleBanners ?? DEFAULT.moduleBanners,
    modulePages: api.modulePages ?? DEFAULT.modulePages,
    moduleMovies: api.moduleMovies ?? DEFAULT.moduleMovies,
    moduleTvShows: api.moduleTvShows ?? DEFAULT.moduleTvShows,
    moduleLiveTV: api.moduleLiveTV ?? DEFAULT.moduleLiveTV,
    moduleVideos: api.moduleVideos ?? DEFAULT.moduleVideos,
    moduleCastCrew: api.moduleCastCrew ?? DEFAULT.moduleCastCrew,
    moduleAdsManager: api.moduleAdsManager ?? DEFAULT.moduleAdsManager,
    moduleSubscriptions: api.moduleSubscriptions ?? DEFAULT.moduleSubscriptions,
    modulePlans: api.modulePlans ?? DEFAULT.modulePlans,
    maintenanceMode: api.maintenanceMode ?? DEFAULT.maintenanceMode,
    userRegistration: api.userRegistration ?? DEFAULT.userRegistration,
    socialLogin: api.socialLogin ?? DEFAULT.socialLogin,
    twoFactorAuth: api.twoFactorAuth ?? DEFAULT.twoFactorAuth,
    emailVerification: api.emailVerification ?? DEFAULT.emailVerification,
    primaryColor: api.primaryColor || DEFAULT.primaryColor,
    colorTheme: api.colorTheme || DEFAULT.colorTheme,
    navbarStyle: api.navbarStyle || DEFAULT.navbarStyle,
    navbarHide: api.navbarHide ?? DEFAULT.navbarHide,
    cardStyle: api.cardStyle || DEFAULT.cardStyle,
    menuStyle: api.menuStyle || DEFAULT.menuStyle,
    activeMenuStyle: api.activeMenuStyle || DEFAULT.activeMenuStyle,
    footerStyle: api.footerStyle || DEFAULT.footerStyle,
    // Mail
    mailEmail: api.mailEmail || "",
    mailDriver: api.mailDriver || DEFAULT.mailDriver,
    mailHost: api.mailHost || DEFAULT.mailHost,
    mailPort: api.mailPort || DEFAULT.mailPort,
    mailEncryption: api.mailEncryption || DEFAULT.mailEncryption,
    mailUsername: api.mailUsername || "",
    mailPassword: api.mailPassword || "",
    mailFrom: api.mailFrom || "",
    mailFromName: api.mailFromName || DEFAULT.mailFromName,
    // Notifications
    fcmServerKey: api.fcmServerKey || "",
    fcmSenderId: api.fcmSenderId || "",
    firebaseApiKey: api.firebaseApiKey || "",
    firebaseProjectId: api.firebaseProjectId || "",
    firebaseAppId: api.firebaseAppId || "",
    // Language
    defaultLanguage: api.defaultLanguage || DEFAULT.defaultLanguage,
    rtlSupport: api.rtlSupport ?? DEFAULT.rtlSupport,
    // Notification Configuration
    notifNewUser: api.notifNewUser ?? DEFAULT.notifNewUser,
    notifNewSubscription: api.notifNewSubscription ?? DEFAULT.notifNewSubscription,
    notifNewContent: api.notifNewContent ?? DEFAULT.notifNewContent,
    notifPaymentSuccess: api.notifPaymentSuccess ?? DEFAULT.notifPaymentSuccess,
    notifPaymentFailed: api.notifPaymentFailed ?? DEFAULT.notifPaymentFailed,
    notifContentExpiry: api.notifContentExpiry ?? DEFAULT.notifContentExpiry,
    // Currency
    currencyCode: api.currencyCode || DEFAULT.currencyCode,
    currencySymbol: api.currencySymbol || DEFAULT.currencySymbol,
    currencyPosition: api.currencyPosition || DEFAULT.currencyPosition,
    decimalPlaces: api.decimalPlaces ?? DEFAULT.decimalPlaces,
    // Storage
    storageDriver: api.storageDriver || DEFAULT.storageDriver,
    awsAccessKeyId: api.awsAccessKeyId || "",
    awsSecretAccessKey: api.awsSecretAccessKey || "",
    awsRegion: api.awsRegion || "",
    awsBucket: api.awsBucket || "",
    awsPathStyleEndpoint: api.awsPathStyleEndpoint ?? DEFAULT.awsPathStyleEndpoint,
    bunnyStorageZone: api.bunnyStorageZone || "",
    bunnyAccessKey: api.bunnyAccessKey || "",
    bunnyCdnUrl: api.bunnyCdnUrl || "",
    // SEO
    metaTitle: api.metaTitle || "",
    metaDescription: api.metaDescription || "",
    metaKeywords: api.metaKeywords || "",
    googleAnalyticsId: api.googleAnalyticsId || "",
    seoImage: img(api.seoImage),
    googleVerification: api.googleVerification || "",
    canonicalUrl: api.canonicalUrl || "",
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
      if (raw) {
        const parsed = JSON.parse(raw);
        // Clear stale imgur logo URLs
        if (parsed.logoUrl?.includes("imgur.com")) parsed.logoUrl = "";
        if (parsed.darkLogoUrl?.includes("imgur.com")) parsed.darkLogoUrl = "";
        if (parsed.lightLogoUrl?.includes("imgur.com")) parsed.lightLogoUrl = "";
        return { ...DEFAULT, ...parsed };
      }
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
