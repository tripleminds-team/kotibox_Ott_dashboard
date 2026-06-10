import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Building2,
  Code2,
  LayoutGrid,
  SlidersHorizontal,
  Paintbrush,
  Mail,
  Bell,
  Globe,
  BellRing,
  DollarSign,
  HardDrive,
  Search,
  ImageIcon,
  X,
  Palette,
  Copy,
  UserX,
  Upload,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDeleteAccount, useUpdateSettings, useUploadSettingsLogos, getImageUrl } from "@/lib/api-client";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";

const SECTIONS = [
  { id: "business", label: "Business Settings", icon: Building2 },
  { id: "custom-code", label: "Custom Code", icon: Code2 },
  { id: "module", label: "Module Settings", icon: LayoutGrid },
  { id: "misc", label: "Misc Settings", icon: SlidersHorizontal },
  { id: "customization", label: "Customization", icon: Paintbrush },
  { id: "mail", label: "Mail Settings", icon: Mail },
  { id: "notification", label: "Notification Settings", icon: Bell },
  { id: "language", label: "Language Settings", icon: Globe },
  { id: "notification-config", label: "Notification Configuration", icon: BellRing },
  { id: "currency", label: "Currency Settings", icon: DollarSign },
  { id: "storage", label: "Storage Settings", icon: HardDrive },
  { id: "seo", label: "SEO Settings", icon: Search },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const COLOR_THEMES = [
  { id: "blue-green", a: "#3b82f6", b: "#10b981" },
  { id: "orange-yellow", a: "#f97316", b: "#eab308" },
  { id: "pink-purple", a: "#ec4899", b: "#a855f7" },
  { id: "purple-orange", a: "#8b5cf6", b: "#f97316" },
  { id: "green-pink", a: "#22c55e", b: "#ec4899" },
];

const inputCls =
  "bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11 rounded-lg";
const labelCls = "text-foreground text-sm font-medium";

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
      <Icon className="h-5 w-5 text-red-400" />
      {label}
    </h2>
  );
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end mt-8 pt-6 border-t border-border">
      <Button
        onClick={onClick}
        disabled={saving}
        className="bg-red-600 hover:bg-red-700 text-foreground h-11 px-10 rounded-lg font-semibold"
      >
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deleteAccountMutation = useDeleteAccount();
  const { settings: ctxSettings, updateSettings: updateCtx, refreshSettings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const uploadLogosMutation = useUploadSettingsLogos();
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SectionId>("business");
  const [saving, setSaving] = useState(false);
  const seoImageRef = useRef<HTMLInputElement>(null);
  const lightLogoRef = useRef<HTMLInputElement>(null);
  const darkLogoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Settings saved successfully!" });
    }, 600);
  };

  // ── Business Settings ──────────────────────────────────────────────────
  const [business, setBusiness] = useState({
    platformName: ctxSettings.platformName,
    contactNo: ctxSettings.contactNo,
    inquiryEmail: ctxSettings.inquiryEmail,
    siteDescription: ctxSettings.siteDescription,
    copyrightText: ctxSettings.copyrightText,
    facebookUrl: ctxSettings.facebookUrl,
    twitterUrl: ctxSettings.twitterUrl,
    instagramUrl: ctxSettings.instagramUrl,
    youtubeUrl: ctxSettings.youtubeUrl,
  });

  useEffect(() => {
    setBusiness({
      platformName: ctxSettings.platformName,
      contactNo: ctxSettings.contactNo,
      inquiryEmail: ctxSettings.inquiryEmail,
      siteDescription: ctxSettings.siteDescription,
      copyrightText: ctxSettings.copyrightText,
      facebookUrl: ctxSettings.facebookUrl,
      twitterUrl: ctxSettings.twitterUrl,
      instagramUrl: ctxSettings.instagramUrl,
      youtubeUrl: ctxSettings.youtubeUrl,
    });
  }, [
    ctxSettings.platformName,
    ctxSettings.contactNo,
    ctxSettings.inquiryEmail,
    ctxSettings.siteDescription,
    ctxSettings.copyrightText,
    ctxSettings.facebookUrl,
    ctxSettings.twitterUrl,
    ctxSettings.instagramUrl,
    ctxSettings.youtubeUrl,
  ]);

  // logo preview states
  const [lightLogoPreview, setLightLogoPreview] = useState<string>(ctxSettings.lightLogoUrl || "");
  const [darkLogoPreview, setDarkLogoPreview] = useState<string>(ctxSettings.darkLogoUrl || "");
  const [faviconPreview, setFaviconPreview] = useState<string>(ctxSettings.faviconUrl || "");
  const [lightLogoFile, setLightLogoFile] = useState<File | null>(null);
  const [darkLogoFile, setDarkLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  useEffect(() => {
    if (!lightLogoFile) setLightLogoPreview(ctxSettings.lightLogoUrl || "");
  }, [ctxSettings.lightLogoUrl, lightLogoFile]);

  useEffect(() => {
    if (!darkLogoFile) setDarkLogoPreview(ctxSettings.darkLogoUrl || "");
  }, [ctxSettings.darkLogoUrl, darkLogoFile]);

  useEffect(() => {
    if (!faviconFile) setFaviconPreview(ctxSettings.faviconUrl || "");
  }, [ctxSettings.faviconUrl, faviconFile]);

  const handleLogoSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string) => void,
    setFile: (f: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      // 1. Upload logo files if any are selected
      if (lightLogoFile || darkLogoFile || faviconFile) {
        const fd = new FormData();
        if (lightLogoFile) fd.append("lightLogo", lightLogoFile);
        if (darkLogoFile) fd.append("darkLogo", darkLogoFile);
        if (faviconFile) fd.append("favicon", faviconFile);
        const logoResult = await uploadLogosMutation.mutateAsync(fd);
        updateCtx({
          lightLogoUrl: logoResult.lightLogoUrl ? getImageUrl(logoResult.lightLogoUrl) : ctxSettings.lightLogoUrl,
          darkLogoUrl: logoResult.darkLogoUrl ? getImageUrl(logoResult.darkLogoUrl) : ctxSettings.darkLogoUrl,
          faviconUrl: logoResult.faviconUrl ? getImageUrl(logoResult.faviconUrl) : ctxSettings.faviconUrl,
        });
        setLightLogoFile(null);
        setDarkLogoFile(null);
        setFaviconFile(null);
      }
      // 2. Save text fields
      await updateSettingsMutation.mutateAsync({
        platformName: business.platformName,
        contactNo: business.contactNo,
        inquiryEmail: business.inquiryEmail,
        siteDescription: business.siteDescription,
        copyrightText: business.copyrightText,
        facebookUrl: business.facebookUrl,
        twitterUrl: business.twitterUrl,
        instagramUrl: business.instagramUrl,
        youtubeUrl: business.youtubeUrl,
      });
      updateCtx({ ...business });
      await refreshSettings();
      toast({ title: "Business settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Custom Code ────────────────────────────────────────────────────────
  const [customCode, setCustomCode] = useState({ headCode: ctxSettings.headerCode || "", bodyCode: ctxSettings.footerCode || "" });

  useEffect(() => {
    setCustomCode({ headCode: ctxSettings.headerCode || "", bodyCode: ctxSettings.footerCode || "" });
  }, [ctxSettings.headerCode, ctxSettings.footerCode]);

  const handleSaveCustomCode = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        headerCode: customCode.headCode,
        footerCode: customCode.bodyCode,
      });
      updateCtx({ headerCode: customCode.headCode, footerCode: customCode.bodyCode });
      await refreshSettings();
      toast({ title: "Custom code saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Module Settings ────────────────────────────────────────────────────
  const [modules, setModules] = useState({
    movies: ctxSettings.moduleMovies ?? true,
    tvShows: ctxSettings.moduleTvShows ?? true,
    liveTV: ctxSettings.moduleLiveTV ?? true,
    videos: ctxSettings.moduleVideos ?? true,
    castCrew: ctxSettings.moduleCastCrew ?? true,
    adsManager: ctxSettings.moduleAdsManager ?? true,
    subscriptions: ctxSettings.moduleSubscriptions ?? true,
    plans: ctxSettings.modulePlans ?? true,
  });

  useEffect(() => {
    setModules({
      movies: ctxSettings.moduleMovies ?? true,
      tvShows: ctxSettings.moduleTvShows ?? true,
      liveTV: ctxSettings.moduleLiveTV ?? true,
      videos: ctxSettings.moduleVideos ?? true,
      castCrew: ctxSettings.moduleCastCrew ?? true,
      adsManager: ctxSettings.moduleAdsManager ?? true,
      subscriptions: ctxSettings.moduleSubscriptions ?? true,
      plans: ctxSettings.modulePlans ?? true,
    });
  }, [
    ctxSettings.moduleMovies,
    ctxSettings.moduleTvShows,
    ctxSettings.moduleLiveTV,
    ctxSettings.moduleVideos,
    ctxSettings.moduleCastCrew,
    ctxSettings.moduleAdsManager,
    ctxSettings.moduleSubscriptions,
    ctxSettings.modulePlans,
  ]);

  const handleSaveModules = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        moduleMovies: modules.movies,
        moduleTvShows: modules.tvShows,
        moduleLiveTV: modules.liveTV,
        moduleVideos: modules.videos,
        moduleCastCrew: modules.castCrew,
        moduleAdsManager: modules.adsManager,
        moduleSubscriptions: modules.subscriptions,
        modulePlans: modules.plans,
      });
      updateCtx({
        moduleMovies: modules.movies,
        moduleTvShows: modules.tvShows,
        moduleLiveTV: modules.liveTV,
        moduleVideos: modules.videos,
        moduleCastCrew: modules.castCrew,
        moduleAdsManager: modules.adsManager,
        moduleSubscriptions: modules.subscriptions,
        modulePlans: modules.plans,
      });
      await refreshSettings();
      toast({ title: "Module settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Misc Settings ──────────────────────────────────────────────────────
  const [misc, setMisc] = useState({
    maintenanceMode: ctxSettings.maintenanceMode ?? false,
    userRegistration: ctxSettings.userRegistration ?? true,
    socialLogin: ctxSettings.socialLogin ?? true,
    twoFactorAuth: ctxSettings.twoFactorAuth ?? false,
    emailVerification: ctxSettings.emailVerification ?? true,
  });

  useEffect(() => {
    setMisc({
      maintenanceMode: ctxSettings.maintenanceMode ?? false,
      userRegistration: ctxSettings.userRegistration ?? true,
      socialLogin: ctxSettings.socialLogin ?? true,
      twoFactorAuth: ctxSettings.twoFactorAuth ?? false,
      emailVerification: ctxSettings.emailVerification ?? true,
    });
  }, [
    ctxSettings.maintenanceMode,
    ctxSettings.userRegistration,
    ctxSettings.socialLogin,
    ctxSettings.twoFactorAuth,
    ctxSettings.emailVerification,
  ]);

  const handleSaveMisc = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        maintenanceMode: misc.maintenanceMode,
        userRegistration: misc.userRegistration,
        socialLogin: misc.socialLogin,
        twoFactorAuth: misc.twoFactorAuth,
        emailVerification: misc.emailVerification,
      });
      updateCtx({
        maintenanceMode: misc.maintenanceMode,
        userRegistration: misc.userRegistration,
        socialLogin: misc.socialLogin,
        twoFactorAuth: misc.twoFactorAuth,
        emailVerification: misc.emailVerification,
      });
      await refreshSettings();
      toast({ title: "Misc settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Customization ──────────────────────────────────────────────────────
  const [custom, setCustom] = useState({
    colorTheme: ctxSettings.colorTheme || "blue-green",
    navbarStyle: ctxSettings.navbarStyle || "Default",
    navbarHide: ctxSettings.navbarHide ?? false,
    cardStyle: ctxSettings.cardStyle || "Default",
    menuStyle: ctxSettings.menuStyle || "Mini",
    activeMenuStyle: ctxSettings.activeMenuStyle || "Left Bordered",
  });

  useEffect(() => {
    setCustom({
      colorTheme: ctxSettings.colorTheme || "blue-green",
      navbarStyle: ctxSettings.navbarStyle || "Default",
      navbarHide: ctxSettings.navbarHide ?? false,
      cardStyle: ctxSettings.cardStyle || "Default",
      menuStyle: ctxSettings.menuStyle || "Mini",
      activeMenuStyle: ctxSettings.activeMenuStyle || "Left Bordered",
    });
  }, [
    ctxSettings.colorTheme,
    ctxSettings.navbarStyle,
    ctxSettings.navbarHide,
    ctxSettings.cardStyle,
    ctxSettings.menuStyle,
    ctxSettings.activeMenuStyle,
  ]);

  const handleSaveCustomization = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        colorTheme: custom.colorTheme,
        navbarStyle: custom.navbarStyle.toLowerCase(),
        navbarHide: custom.navbarHide,
        cardStyle: custom.cardStyle.toLowerCase(),
        menuStyle: custom.menuStyle.toLowerCase(),
        activeMenuStyle: custom.activeMenuStyle.toLowerCase(),
      });
      updateCtx({
        colorTheme: custom.colorTheme,
        navbarStyle: custom.navbarStyle.toLowerCase() as any,
        navbarHide: custom.navbarHide,
        cardStyle: custom.cardStyle.toLowerCase() as any,
        menuStyle: custom.menuStyle.toLowerCase() as any,
        activeMenuStyle: custom.activeMenuStyle.toLowerCase(),
      });
      await refreshSettings();
      toast({ title: "Customization settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Mail Settings ──────────────────────────────────────────────────────
  const [mail, setMail] = useState({
    email: ctxSettings.mailEmail || "info@example.com",
    mailDriver: ctxSettings.mailDriver || "smtp",
    mailHost: ctxSettings.mailHost || "smtp.gmail.com",
    mailPort: ctxSettings.mailPort || "587",
    mailEncryption: ctxSettings.mailEncryption || "tls",
    mailUsername: ctxSettings.mailUsername || "youremail@gmail.com",
    password: "",
    mailFrom: ctxSettings.mailFrom || "youremail@gmail.com",
    fromName: ctxSettings.mailFromName || "NETFLIX",
  });

  useEffect(() => {
    setMail({
      email: ctxSettings.mailEmail || "info@example.com",
      mailDriver: ctxSettings.mailDriver || "smtp",
      mailHost: ctxSettings.mailHost || "smtp.gmail.com",
      mailPort: ctxSettings.mailPort || "587",
      mailEncryption: ctxSettings.mailEncryption || "tls",
      mailUsername: ctxSettings.mailUsername || "youremail@gmail.com",
      password: "", // keep password empty unless user edits
      mailFrom: ctxSettings.mailFrom || "youremail@gmail.com",
      fromName: ctxSettings.mailFromName || "NETFLIX",
    });
  }, [
    ctxSettings.mailEmail,
    ctxSettings.mailDriver,
    ctxSettings.mailHost,
    ctxSettings.mailPort,
    ctxSettings.mailEncryption,
    ctxSettings.mailUsername,
    ctxSettings.mailFrom,
    ctxSettings.mailFromName,
  ]);

  const handleSaveMail = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        mailEmail: mail.email,
        mailDriver: mail.mailDriver,
        mailHost: mail.mailHost,
        mailPort: mail.mailPort,
        mailEncryption: mail.mailEncryption,
        mailUsername: mail.mailUsername,
        mailPassword: mail.password,
        mailFrom: mail.mailFrom,
        mailFromName: mail.fromName,
      });
      updateCtx({
        mailEmail: mail.email,
        mailDriver: mail.mailDriver,
        mailHost: mail.mailHost,
        mailPort: mail.mailPort,
        mailEncryption: mail.mailEncryption,
        mailUsername: mail.mailUsername,
        mailPassword: mail.password,
        mailFrom: mail.mailFrom,
        mailFromName: mail.fromName,
      });
      await refreshSettings();
      toast({ title: "Mail settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Notification Settings ──────────────────────────────────────────────
  const [notif, setNotif] = useState({
    firebaseServerKey: ctxSettings.fcmServerKey || "",
    firebaseSenderId: ctxSettings.fcmSenderId || "",
    firebaseApiKey: ctxSettings.firebaseApiKey || "",
    firebaseProjectId: ctxSettings.firebaseProjectId || "",
    firebaseAppId: ctxSettings.firebaseAppId || "",
  });

  useEffect(() => {
    setNotif({
      firebaseServerKey: ctxSettings.fcmServerKey || "",
      firebaseSenderId: ctxSettings.fcmSenderId || "",
      firebaseApiKey: ctxSettings.firebaseApiKey || "",
      firebaseProjectId: ctxSettings.firebaseProjectId || "",
      firebaseAppId: ctxSettings.firebaseAppId || "",
    });
  }, [
    ctxSettings.fcmServerKey,
    ctxSettings.fcmSenderId,
    ctxSettings.firebaseApiKey,
    ctxSettings.firebaseProjectId,
    ctxSettings.firebaseAppId,
  ]);

  const handleSaveNotification = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        fcmServerKey: notif.firebaseServerKey,
        fcmSenderId: notif.firebaseSenderId,
        firebaseApiKey: notif.firebaseApiKey,
        firebaseProjectId: notif.firebaseProjectId,
        firebaseAppId: notif.firebaseAppId,
      });
      updateCtx({
        fcmServerKey: notif.firebaseServerKey,
        fcmSenderId: notif.firebaseSenderId,
        firebaseApiKey: notif.firebaseApiKey,
        firebaseProjectId: notif.firebaseProjectId,
        firebaseAppId: notif.firebaseAppId,
      });
      await refreshSettings();
      toast({ title: "Notification settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Language Settings ──────────────────────────────────────────────────
  const [lang, setLang] = useState({ defaultLanguage: ctxSettings.defaultLanguage || "en", rtlSupport: ctxSettings.rtlSupport ?? false });

  useEffect(() => {
    setLang({ defaultLanguage: ctxSettings.defaultLanguage || "en", rtlSupport: ctxSettings.rtlSupport ?? false });
  }, [ctxSettings.defaultLanguage, ctxSettings.rtlSupport]);

  const handleSaveLanguage = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        defaultLanguage: lang.defaultLanguage,
        rtlSupport: lang.rtlSupport,
      });
      updateCtx({
        defaultLanguage: lang.defaultLanguage,
        rtlSupport: lang.rtlSupport,
      });
      await refreshSettings();
      toast({ title: "Language settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Notification Configuration ─────────────────────────────────────────
  const [notifCfg, setNotifCfg] = useState({
    newUser: ctxSettings.notifNewUser ?? true,
    newSubscription: ctxSettings.notifNewSubscription ?? true,
    newContent: ctxSettings.notifNewContent ?? false,
    paymentSuccess: ctxSettings.notifPaymentSuccess ?? true,
    paymentFailed: ctxSettings.notifPaymentFailed ?? true,
    contentExpiry: ctxSettings.notifContentExpiry ?? false,
  });

  useEffect(() => {
    setNotifCfg({
      newUser: ctxSettings.notifNewUser ?? true,
      newSubscription: ctxSettings.notifNewSubscription ?? true,
      newContent: ctxSettings.notifNewContent ?? false,
      paymentSuccess: ctxSettings.notifPaymentSuccess ?? true,
      paymentFailed: ctxSettings.notifPaymentFailed ?? true,
      contentExpiry: ctxSettings.notifContentExpiry ?? false,
    });
  }, [
    ctxSettings.notifNewUser,
    ctxSettings.notifNewSubscription,
    ctxSettings.notifNewContent,
    ctxSettings.notifPaymentSuccess,
    ctxSettings.notifPaymentFailed,
    ctxSettings.notifContentExpiry,
  ]);

  const handleSaveNotifConfig = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        notifNewUser: notifCfg.newUser,
        notifNewSubscription: notifCfg.newSubscription,
        notifNewContent: notifCfg.newContent,
        notifPaymentSuccess: notifCfg.paymentSuccess,
        notifPaymentFailed: notifCfg.paymentFailed,
        notifContentExpiry: notifCfg.contentExpiry,
      });
      updateCtx({
        notifNewUser: notifCfg.newUser,
        notifNewSubscription: notifCfg.newSubscription,
        notifNewContent: notifCfg.newContent,
        notifPaymentSuccess: notifCfg.paymentSuccess,
        notifPaymentFailed: notifCfg.paymentFailed,
        notifContentExpiry: notifCfg.contentExpiry,
      });
      await refreshSettings();
      toast({ title: "Notification configuration saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Currency Settings ──────────────────────────────────────────────────
  const [currency, setCurrency] = useState({
    currency: ctxSettings.currencyCode || "USD",
    currencySymbol: ctxSettings.currencySymbol || "$",
    currencyPosition: ctxSettings.currencyPosition === "after" ? "right" : "left",
    decimalPlaces: ctxSettings.decimalPlaces?.toString() || "2",
  });

  useEffect(() => {
    setCurrency({
      currency: ctxSettings.currencyCode || "USD",
      currencySymbol: ctxSettings.currencySymbol || "$",
      currencyPosition: ctxSettings.currencyPosition === "after" ? "right" : "left",
      decimalPlaces: ctxSettings.decimalPlaces?.toString() || "2",
    });
  }, [
    ctxSettings.currencyCode,
    ctxSettings.currencySymbol,
    ctxSettings.currencyPosition,
    ctxSettings.decimalPlaces,
  ]);

  const handleSaveCurrency = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        currencyCode: currency.currency,
        currencySymbol: currency.currencySymbol,
        currencyPosition: currency.currencyPosition === "right" ? "after" : "before",
        decimalPlaces: parseInt(currency.decimalPlaces, 10),
      });
      updateCtx({
        currencyCode: currency.currency,
        currencySymbol: currency.currencySymbol,
        currencyPosition: currency.currencyPosition === "right" ? "after" : "before" as any,
        decimalPlaces: parseInt(currency.decimalPlaces, 10),
      });
      await refreshSettings();
      toast({ title: "Currency settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Storage Settings ───────────────────────────────────────────────────
  const [storage, setStorage] = useState({
    localStorage: ctxSettings.storageDriver === 'local',
    s3Storage: ctxSettings.storageDriver === 's3',
    bunnyCDN: ctxSettings.storageDriver === 'bunny',
    awsAccessKeyId: ctxSettings.awsAccessKeyId || "",
    awsSecretAccessKey: ctxSettings.awsSecretAccessKey || "",
    awsDefaultRegion: ctxSettings.awsRegion || "",
    awsBucket: ctxSettings.awsBucket || "",
    awsPathStyle: ctxSettings.awsPathStyleEndpoint ?? false,
    bunnyStorageZone: ctxSettings.bunnyStorageZone || "",
    bunnyAccessKey: ctxSettings.bunnyAccessKey || "",
    bunnyCdnUrl: ctxSettings.bunnyCdnUrl || "",
  });

  useEffect(() => {
    setStorage({
      localStorage: ctxSettings.storageDriver === 'local',
      s3Storage: ctxSettings.storageDriver === 's3',
      bunnyCDN: ctxSettings.storageDriver === 'bunny',
      awsAccessKeyId: ctxSettings.awsAccessKeyId || "",
      awsSecretAccessKey: ctxSettings.awsSecretAccessKey || "",
      awsDefaultRegion: ctxSettings.awsRegion || "",
      awsBucket: ctxSettings.awsBucket || "",
      awsPathStyle: ctxSettings.awsPathStyleEndpoint ?? false,
      bunnyStorageZone: ctxSettings.bunnyStorageZone || "",
      bunnyAccessKey: ctxSettings.bunnyAccessKey || "",
      bunnyCdnUrl: ctxSettings.bunnyCdnUrl || "",
    });
  }, [
    ctxSettings.storageDriver,
    ctxSettings.awsAccessKeyId,
    ctxSettings.awsSecretAccessKey,
    ctxSettings.awsRegion,
    ctxSettings.awsBucket,
    ctxSettings.awsPathStyleEndpoint,
    ctxSettings.bunnyStorageZone,
    ctxSettings.bunnyAccessKey,
    ctxSettings.bunnyCdnUrl,
  ]);

  const handleSaveStorage = async () => {
    setSaving(true);
    try {
      let driver: 'local' | 's3' | 'bunny' = 'local';
      if (storage.s3Storage) driver = 's3';
      else if (storage.bunnyCDN) driver = 'bunny';

      await updateSettingsMutation.mutateAsync({
        storageDriver: driver,
        awsAccessKeyId: storage.awsAccessKeyId,
        awsSecretAccessKey: storage.awsSecretAccessKey,
        awsRegion: storage.awsDefaultRegion,
        awsBucket: storage.awsBucket,
        awsPathStyleEndpoint: storage.awsPathStyle,
        bunnyStorageZone: storage.bunnyStorageZone,
        bunnyAccessKey: storage.bunnyAccessKey,
        bunnyCdnUrl: storage.bunnyCdnUrl,
      });
      updateCtx({
        storageDriver: driver,
        awsAccessKeyId: storage.awsAccessKeyId,
        awsSecretAccessKey: storage.awsSecretAccessKey,
        awsRegion: storage.awsDefaultRegion,
        awsBucket: storage.awsBucket,
        awsPathStyleEndpoint: storage.awsPathStyle,
        bunnyStorageZone: storage.bunnyStorageZone,
        bunnyAccessKey: storage.bunnyAccessKey,
        bunnyCdnUrl: storage.bunnyCdnUrl,
      });
      await refreshSettings();
      toast({ title: "Storage settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── SEO Settings ───────────────────────────────────────────────────────
  const [seo, setSeo] = useState({
    seoImage: ctxSettings.seoImage || null,
    metaTitle: ctxSettings.metaTitle || "",
    metaKeywords: ctxSettings.metaKeywords || "",
    googleVerification: ctxSettings.googleVerification || "",
    canonicalUrl: ctxSettings.canonicalUrl || "",
    metaDescription: ctxSettings.metaDescription || "",
  });

  useEffect(() => {
    setSeo({
      seoImage: ctxSettings.seoImage || null,
      metaTitle: ctxSettings.metaTitle || "",
      metaKeywords: ctxSettings.metaKeywords || "",
      googleVerification: ctxSettings.googleVerification || "",
      canonicalUrl: ctxSettings.canonicalUrl || "",
      metaDescription: ctxSettings.metaDescription || "",
    });
  }, [
    ctxSettings.seoImage,
    ctxSettings.metaTitle,
    ctxSettings.metaKeywords,
    ctxSettings.googleVerification,
    ctxSettings.canonicalUrl,
    ctxSettings.metaDescription,
  ]);

  const handleSaveSeo = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        googleAnalyticsId: ctxSettings.googleAnalyticsId || "",
        seoImage: seo.seoImage || "",
        googleVerification: seo.googleVerification,
        canonicalUrl: seo.canonicalUrl,
      });
      updateCtx({
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        googleAnalyticsId: ctxSettings.googleAnalyticsId || "",
        seoImage: seo.seoImage || "",
        googleVerification: seo.googleVerification,
        canonicalUrl: seo.canonicalUrl,
      });
      await refreshSettings();
      toast({ title: "SEO settings saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Section renderers ──────────────────────────────────────────────────

  const LogoUploadBox = ({
    label,
    preview,
    onSelect,
    inputRef,
    accept = "image/*",
  }: {
    label: string;
    preview: string;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    accept?: string;
  }) => (
    <div className="space-y-2">
      <Label className={labelCls}>{label}</Label>
      <div
        className="relative flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-border bg-card cursor-pointer hover:border-red-500/60 transition-colors overflow-hidden"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="h-full w-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Upload className="h-5 w-5 text-foreground" />
            </div>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Click to upload</p>
          </>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onSelect} />
      </div>
    </div>
  );

  const renderBusiness = () => (
    <div>
      <SectionTitle icon={Building2} label="Business Settings" />

      {/* Logo uploads */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-foreground mb-4">Logos & Favicon</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LogoUploadBox
            label="Light Theme Logo"
            preview={lightLogoPreview}
            onSelect={(e) => handleLogoSelect(e, setLightLogoPreview, setLightLogoFile)}
            inputRef={lightLogoRef as React.RefObject<HTMLInputElement>}
          />
          <LogoUploadBox
            label="Dark Theme Logo"
            preview={darkLogoPreview}
            onSelect={(e) => handleLogoSelect(e, setDarkLogoPreview, setDarkLogoFile)}
            inputRef={darkLogoRef as React.RefObject<HTMLInputElement>}
          />
          <LogoUploadBox
            label="Favicon"
            preview={faviconPreview}
            onSelect={(e) => handleLogoSelect(e, setFaviconPreview, setFaviconFile)}
            inputRef={faviconRef as React.RefObject<HTMLInputElement>}
            accept="image/png,image/x-icon,image/svg+xml,image/webp"
          />
        </div>
      </div>

      {/* Theme toggle */}
      <div className="mb-6 flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3">
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-400" />
          )}
          <div>
            <p className="text-sm text-foreground font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle between dark and light theme</p>
          </div>
        </div>
        <Switch
          checked={resolvedTheme === "dark"}
          onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          className="data-[state=checked]:bg-red-600"
        />
      </div>

      {/* Basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {[
          { key: "platformName", label: "App Name", placeholder: "StreamVault", req: true },
          { key: "contactNo", label: "Contact No", placeholder: "+1 234 567 8900", req: true },
          { key: "inquiryEmail", label: "Inquiry Email", placeholder: "hello@example.com", req: true },
          { key: "copyrightText", label: "Copyright Text", placeholder: "© 2026 StreamVault. All Rights Reserved.", req: false },
        ].map(({ key, label, placeholder, req }) => (
          <div key={key} className="space-y-2">
            <Label className={labelCls}>
              {label} {req && <span className="text-red-500">*</span>}
            </Label>
            <Input
              value={business[key as keyof typeof business]}
              onChange={(e) => setBusiness({ ...business, [key]: e.target.value })}
              placeholder={placeholder}
              className={inputCls}
            />
          </div>
        ))}
        <div className="space-y-2 md:col-span-2">
          <Label className={labelCls}>Site Description <span className="text-red-500">*</span></Label>
          <Textarea
            value={business.siteDescription}
            onChange={(e) => setBusiness({ ...business, siteDescription: e.target.value })}
            placeholder="StreamVault: Your Ultimate Destination for Unlimited Movies and Shows!"
            className="bg-input border-border text-foreground focus:border-red-500 rounded-lg resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Social URLs */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground mb-4">Social Media Links</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { key: "facebookUrl", label: "Facebook URL", placeholder: "https://facebook.com/yourpage" },
            { key: "twitterUrl", label: "X (Twitter) URL", placeholder: "https://twitter.com/yourhandle" },
            { key: "instagramUrl", label: "Instagram URL", placeholder: "https://instagram.com/yourpage" },
            { key: "youtubeUrl", label: "YouTube URL", placeholder: "https://youtube.com/@yourchannel" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label className={labelCls}>{label}</Label>
              <Input
                value={business[key as keyof typeof business]}
                onChange={(e) => setBusiness({ ...business, [key]: e.target.value })}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="pt-4 border-t border-border space-y-3">
        <p className="text-sm text-muted-foreground font-medium">Quick Links</p>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-muted hover:text-foreground gap-2 rounded-lg h-10"
            onClick={() => setLocation("/settings/branding")}
          >
            <Palette className="h-4 w-4" />
            Branding
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-muted hover:text-foreground gap-2 rounded-lg h-10"
            onClick={() => setLocation("/settings/icons")}
          >
            <Copy className="h-4 w-4" />
            Icon Library
          </Button>
        </div>
      </div>

      <SaveBtn saving={saving} onClick={handleSaveBusiness} />
    </div>
  );

  const renderCustomCode = () => (
    <div>
      <SectionTitle icon={Code2} label="Custom Code" />
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className={labelCls}>Head Code</Label>
          <p className="text-xs text-muted-foreground">Code will be added before &lt;/head&gt; tag</p>
          <Textarea
            value={customCode.headCode}
            onChange={(e) => setCustomCode({ ...customCode, headCode: e.target.value })}
            placeholder="<!-- Your head code here -->"
            className="bg-input border-border text-foreground focus:border-red-500 rounded-lg font-mono text-sm resize-none"
            rows={6}
          />
        </div>
        <div className="space-y-2">
          <Label className={labelCls}>Body Code</Label>
          <p className="text-xs text-muted-foreground">Code will be added before &lt;/body&gt; tag</p>
          <Textarea
            value={customCode.bodyCode}
            onChange={(e) => setCustomCode({ ...customCode, bodyCode: e.target.value })}
            placeholder="<!-- Your body code here -->"
            className="bg-input border-border text-foreground focus:border-red-500 rounded-lg font-mono text-sm resize-none"
            rows={6}
          />
        </div>
      </div>
      <SaveBtn saving={saving} onClick={handleSaveCustomCode} />
    </div>
  );

  const renderModules = () => (
    <div>
      <SectionTitle icon={LayoutGrid} label="Module Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(
          [
            { key: "movies", label: "Movies" },
            { key: "tvShows", label: "TV Shows" },
            { key: "liveTV", label: "Live TV" },
            { key: "videos", label: "Videos" },
            { key: "castCrew", label: "Cast & Crew" },
            { key: "adsManager", label: "Ads Manager" },
            { key: "subscriptions", label: "Subscriptions" },
            { key: "plans", label: "Plans" },
          ] as const
        ).map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card"
          >
            <span className="text-sm text-foreground font-medium">{label}</span>
            <Switch
              checked={modules[key]}
              onCheckedChange={(v) => setModules({ ...modules, [key]: v })}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        ))}
      </div>
      <SaveBtn saving={saving} onClick={handleSaveModules} />
    </div>
  );

  const renderMisc = () => (
    <div>
      <SectionTitle icon={SlidersHorizontal} label="Misc Settings" />
      <div className="space-y-3">
        {(
          [
            { key: "maintenanceMode", label: "Maintenance Mode", desc: "Put the site in maintenance mode" },
            { key: "userRegistration", label: "User Registration", desc: "Allow new user registrations" },
            { key: "socialLogin", label: "Social Login", desc: "Enable social media login options" },
            { key: "twoFactorAuth", label: "Two Factor Authentication", desc: "Enable 2FA for extra security" },
            { key: "emailVerification", label: "Email Verification", desc: "Require email verification for new users" },
          ] as const
        ).map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
          >
            <div>
              <p className="text-sm text-foreground font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <Switch
              checked={misc[key]}
              onCheckedChange={(v) => setMisc({ ...misc, [key]: v })}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        ))}
      </div>
      <SaveBtn saving={saving} onClick={handleSaveMisc} />
    </div>
  );

  const renderCustomization = () => (
    <div>
      <SectionTitle icon={Paintbrush} label="Customization" />

      {/* Color Customizer */}
      <div className="space-y-3 mb-7">
        <div className="flex items-center justify-between">
          <Label className="text-foreground font-medium">Color Customizer</Label>
          <button className="text-sm text-red-400 hover:text-red-300 font-medium">Custom ↺</button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {COLOR_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setCustom({ ...custom, colorTheme: t.id })}
              className={`h-14 w-24 rounded-lg border-2 overflow-hidden relative transition-all ${
                custom.colorTheme === t.id ? "border-red-500 shadow-lg shadow-red-500/20" : "border-border hover:border-red-500"
              }`}
            >
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full" style={{ background: t.a }} />
                <div className="w-1/2 h-full" style={{ background: t.b }} />
              </div>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full border-2 border-white/30"
                style={{ background: `conic-gradient(${t.a} 50%, ${t.b} 50%)` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Navbar Style */}
      <div className="space-y-3 mb-7">
        <Label className="text-foreground font-medium">Navbar Style</Label>
        <div className="flex flex-wrap gap-3">
          {["Glass", "Sticky", "Transparent", "Default"].map((s) => (
            <button
              key={s}
              onClick={() => setCustom({ ...custom, navbarStyle: s })}
              className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                custom.navbarStyle === s
                  ? "bg-red-600 border-red-600 text-foreground"
                  : "border-border text-foreground hover:border-red-500 hover:text-foreground bg-card"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Navbar Hide */}
      <div className="flex items-center justify-between py-4 border-t border-b border-border mb-7">
        <Label className="text-foreground font-medium">Navbar Hide</Label>
        <Switch
          checked={custom.navbarHide}
          onCheckedChange={(v) => setCustom({ ...custom, navbarHide: v })}
          className="data-[state=checked]:bg-red-600"
        />
      </div>

      {/* Card Style */}
      <div className="space-y-3 mb-7">
        <Label className="text-foreground font-medium">Card Style</Label>
        <div className="flex flex-wrap gap-3">
          {["Default", "Glass", "Transparent"].map((s) => (
            <button
              key={s}
              onClick={() => setCustom({ ...custom, cardStyle: s })}
              className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                custom.cardStyle === s
                  ? "bg-red-600 border-red-600 text-foreground"
                  : "border-border text-foreground hover:border-red-500 hover:text-foreground bg-card"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Style */}
      <div className="space-y-3 mb-7">
        <Label className="text-foreground font-medium">Menu Style</Label>
        <div className="flex flex-wrap gap-3">
          {["Mini", "Hover", "Boxed", "Soft"].map((s) => (
            <button
              key={s}
              onClick={() => setCustom({ ...custom, menuStyle: s })}
              className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                custom.menuStyle === s
                  ? "bg-red-600 border-red-600 text-foreground"
                  : "border-border text-foreground hover:border-red-500 hover:text-foreground bg-card"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Active Menu Style */}
      <div className="space-y-3">
        <Label className="text-foreground font-medium">Active Menu Style</Label>
        <div className="flex flex-wrap gap-3">
          {["Rounded One Side", "Rounded All", "Pill One Side", "Pill All", "Left Bordered", "Full Width"].map((s) => (
            <button
              key={s}
              onClick={() => setCustom({ ...custom, activeMenuStyle: s })}
              className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                custom.activeMenuStyle === s
                  ? "bg-red-600 border-red-600 text-foreground"
                  : "border-border text-foreground hover:border-red-500 hover:text-foreground bg-card"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <SaveBtn saving={saving} onClick={handleSaveCustomization} />
    </div>
  );

  const renderMail = () => (
    <div>
      <SectionTitle icon={Mail} label="Mail Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(
          [
            { key: "email", label: "Email", placeholder: "info@example.com" },
            { key: "mailDriver", label: "Mail Driver", placeholder: "smtp" },
            { key: "mailHost", label: "Mail Host", placeholder: "smtp.gmail.com" },
            { key: "mailPort", label: "Mail Port", placeholder: "587" },
            { key: "mailEncryption", label: "Mail Encryption", placeholder: "tls" },
            { key: "mailUsername", label: "Mail Username", placeholder: "youremail@gmail.com" },
            { key: "password", label: "Password", placeholder: "Password" },
            { key: "mailFrom", label: "Mail From", placeholder: "youremail@gmail.com" },
          ] as const
        ).map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label className={labelCls}>
              {label} <span className="text-red-500">*</span>
            </Label>
            <Input
              type={key === "password" ? "password" : "text"}
              value={mail[key]}
              onChange={(e) => setMail({ ...mail, [key]: e.target.value })}
              placeholder={placeholder}
              className={inputCls}
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label className={labelCls}>
            From Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={mail.fromName}
            onChange={(e) => setMail({ ...mail, fromName: e.target.value })}
            placeholder="NETFLIX"
            className={inputCls}
          />
        </div>
      </div>
      <SaveBtn saving={saving} onClick={handleSaveMail} />
    </div>
  );

  const renderNotification = () => (
    <div>
      <SectionTitle icon={Bell} label="Notification Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(
          [
            { key: "firebaseServerKey", label: "Firebase Server Key", placeholder: "Enter server key" },
            { key: "firebaseSenderId", label: "Firebase Sender ID", placeholder: "Enter sender ID" },
            { key: "firebaseApiKey", label: "Firebase API Key", placeholder: "Enter API key" },
            { key: "firebaseProjectId", label: "Firebase Project ID", placeholder: "Enter project ID" },
            { key: "firebaseAppId", label: "Firebase App ID", placeholder: "Enter app ID" },
          ] as const
        ).map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label className={labelCls}>{label}</Label>
            <Input
              value={notif[key]}
              onChange={(e) => setNotif({ ...notif, [key]: e.target.value })}
              placeholder={placeholder}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <SaveBtn saving={saving} onClick={handleSaveNotification} />
    </div>
  );

  const renderLanguage = () => (
    <div>
      <SectionTitle icon={Globe} label="Language Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className={labelCls}>Default Language</Label>
          <Select
            value={lang.defaultLanguage}
            onValueChange={(v) => setLang({ ...lang, defaultLanguage: v })}
          >
            <SelectTrigger className="bg-input border-border text-foreground h-11 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-foreground">
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="ur">Urdu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-border bg-card self-end">
          <span className="text-sm text-foreground font-medium">RTL Support</span>
          <Switch
            checked={lang.rtlSupport}
            onCheckedChange={(v) => setLang({ ...lang, rtlSupport: v })}
            className="data-[state=checked]:bg-red-600"
          />
        </div>
      </div>
      <SaveBtn saving={saving} onClick={handleSaveLanguage} />
    </div>
  );

  const renderNotifConfig = () => (
    <div>
      <SectionTitle icon={BellRing} label="Notification Configuration" />
      <div className="space-y-3">
        {(
          [
            { key: "newUser", label: "New User Registration", desc: "Notify when a new user registers" },
            { key: "newSubscription", label: "New Subscription", desc: "Notify when a subscription is purchased" },
            { key: "newContent", label: "New Content Added", desc: "Notify when new content is added" },
            { key: "paymentSuccess", label: "Payment Success", desc: "Notify on successful payment" },
            { key: "paymentFailed", label: "Payment Failed", desc: "Notify on failed payment" },
            { key: "contentExpiry", label: "Content Expiry", desc: "Notify when content is about to expire" },
          ] as const
        ).map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
          >
            <div>
              <p className="text-sm text-foreground font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <Switch
              checked={notifCfg[key]}
              onCheckedChange={(v) => setNotifCfg({ ...notifCfg, [key]: v })}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        ))}
      </div>
      <SaveBtn saving={saving} onClick={handleSaveNotifConfig} />
    </div>
  );

  const renderCurrency = () => (
    <div>
      <SectionTitle icon={DollarSign} label="Currency Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className={labelCls}>
            Currency <span className="text-red-500">*</span>
          </Label>
          <Input
            value={currency.currency}
            onChange={(e) => setCurrency({ ...currency, currency: e.target.value })}
            placeholder="USD"
            className={inputCls}
          />
        </div>
        <div className="space-y-2">
          <Label className={labelCls}>
            Currency Symbol <span className="text-red-500">*</span>
          </Label>
          <Input
            value={currency.currencySymbol}
            onChange={(e) => setCurrency({ ...currency, currencySymbol: e.target.value })}
            placeholder="$"
            className={inputCls}
          />
        </div>
        <div className="space-y-2">
          <Label className={labelCls}>Currency Position</Label>
          <Select
            value={currency.currencyPosition}
            onValueChange={(v) => setCurrency({ ...currency, currencyPosition: v })}
          >
            <SelectTrigger className="bg-input border-border text-foreground h-11 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-foreground">
              <SelectItem value="left">Left ($10)</SelectItem>
              <SelectItem value="right">Right (10$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className={labelCls}>Decimal Places</Label>
          <Input
            type="number"
            value={currency.decimalPlaces}
            onChange={(e) => setCurrency({ ...currency, decimalPlaces: e.target.value })}
            placeholder="2"
            className={inputCls}
          />
        </div>
      </div>
      <SaveBtn saving={saving} onClick={handleSaveCurrency} />
    </div>
  );

  const renderStorage = () => (
    <div>
      <SectionTitle icon={HardDrive} label="Storage Settings" />
      <div className="space-y-0 mb-6 rounded-lg border border-border overflow-hidden">
        {(
          [
            { key: "localStorage", label: "Local Storage" },
            { key: "s3Storage", label: "S3 Storage" },
            { key: "bunnyCDN", label: "Bunny CDN Storage" },
          ] as const
        ).map(({ key, label }, i, arr) => (
          <div
            key={key}
            className={`flex items-center justify-between px-5 py-4 bg-card ${
              i < arr.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span className="text-foreground font-medium">{label}</span>
            <Switch
              checked={storage[key]}
              onCheckedChange={(v) => setStorage({ ...storage, [key]: v })}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {(
          [
            { key: "awsAccessKeyId", label: "AWS Access Key ID" },
            { key: "awsSecretAccessKey", label: "AWS Secret Access Key" },
            { key: "awsDefaultRegion", label: "AWS Default Region" },
            { key: "awsBucket", label: "AWS Bucket" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label className={labelCls}>
              {label} <span className="text-red-500">*</span>
            </Label>
            <Input
              value={storage[key]}
              onChange={(e) => setStorage({ ...storage, [key]: e.target.value })}
              className={inputCls}
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label className={labelCls}>
            AWS Use Path Style Endpoint <span className="text-red-500">*</span>
          </Label>
          <Input
            value={storage.awsPathStyle ? "True" : "False"}
            readOnly
            className="bg-card border-border text-muted-foreground h-11 rounded-lg cursor-not-allowed"
          />
        </div>
      </div>
      <SaveBtn saving={saving} onClick={handleSaveStorage} />
    </div>
  );

  const renderSeo = () => (
    <div>
      <SectionTitle icon={Search} label="SEO Settings" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
        {/* Image upload */}
        <div className="space-y-2">
          <Label className={labelCls}>
            SEO Image <span className="text-red-500">*</span>
          </Label>
          <div
            onClick={() => seoImageRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card hover:border-red-500/60 cursor-pointer transition-all overflow-hidden"
            style={{ minHeight: "168px" }}
          >
            {seo.seoImage ? (
              <div className="relative w-full" style={{ height: "168px" }}>
                <img src={seo.seoImage} alt="SEO" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSeo({ ...seo, seoImage: null });
                  }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center z-10"
                >
                  <X className="h-3.5 w-3.5 text-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center px-4">Choose Media to Upload</p>
              </div>
            )}
          </div>
          <input
            ref={seoImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = (ev) => setSeo({ ...seo, seoImage: ev.target?.result as string });
              r.readAsDataURL(f);
            }}
          />
        </div>

        {/* 2-col fields */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={labelCls}>
                Meta Title <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">{seo.metaTitle.length}/100</span>
            </div>
            <Input
              value={seo.metaTitle}
              onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value.slice(0, 100) })}
              placeholder="Enter Meta Title"
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>
              Meta Keywords <span className="text-red-500">*</span>
            </Label>
            <Input
              value={seo.metaKeywords}
              onChange={(e) => setSeo({ ...seo, metaKeywords: e.target.value })}
              placeholder="Type and press enter"
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>
              Google Site Verification <span className="text-red-500">*</span>
            </Label>
            <Input
              value={seo.googleVerification}
              onChange={(e) => setSeo({ ...seo, googleVerification: e.target.value })}
              placeholder="Enter Google site verification"
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>
              Global Canonical URL <span className="text-red-500">*</span>
            </Label>
            <Input
              value={seo.canonicalUrl}
              onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
              placeholder="Enter Global Canonical url"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Meta description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className={labelCls}>
            Site Meta Description <span className="text-red-500">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">{seo.metaDescription.length}/200</span>
        </div>
        <Textarea
          value={seo.metaDescription}
          onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value.slice(0, 200) })}
          placeholder="Enter Meta Description"
          className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 rounded-lg resize-none"
          rows={4}
        />
      </div>

      <SaveBtn saving={saving} onClick={handleSaveSeo} />
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "business": return renderBusiness();
      case "custom-code": return renderCustomCode();
      case "module": return renderModules();
      case "misc": return renderMisc();
      case "customization": return renderCustomization();
      case "mail": return renderMail();
      case "notification": return renderNotification();
      case "language": return renderLanguage();
      case "notification-config": return renderNotifConfig();
      case "currency": return renderCurrency();
      case "storage": return renderStorage();
      case "seo": return renderSeo();
    }
  };

  const activeLabel = SECTIONS.find((s) => s.id === activeSection)?.label ?? "";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-muted-foreground">Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">Settings</span>
        {activeSection !== "business" && (
          <>
            <span>/</span>
            <span className="text-muted-foreground">{activeLabel}</span>
          </>
        )}
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left: Sub-navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all border-b border-border last:border-b-0 text-left ${
                    isActive
                      ? "bg-red-600 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {section.label}
                </button>
              );
            })}

            {/* Danger Zone in sidebar */}
            <div className="border-t border-border mt-1 pt-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-all text-left">
                    <UserX className="h-4 w-4 flex-shrink-0" />
                    Deactivate Account
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border border-border text-foreground">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Deactivate Account?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This action cannot be undone. You will lose access to this admin panel.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted hover:text-foreground">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await deleteAccountMutation.mutateAsync(undefined);
                          toast({ title: "Account deactivated successfully" });
                          setLocation("/login");
                        } catch {
                          toast({ title: "Failed to deactivate account", variant: "destructive" });
                        }
                      }}
                      disabled={deleteAccountMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 text-foreground border-0"
                    >
                      {deleteAccountMutation.isPending ? "Deactivating..." : "Yes, Deactivate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Right: Form content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-border bg-card/50 p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
