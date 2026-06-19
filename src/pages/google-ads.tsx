import { useState, useEffect } from "react";
import { Globe, Smartphone, MonitorPlay, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUpdateSettings } from "@/lib/api-client";
import { useSettings } from "@/contexts/SettingsContext";

export default function GoogleAdsPage() {
  const { toast } = useToast();
  const { settings, refreshSettings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [formData, setFormData] = useState({
    adNetworkEnabled: false,
    adMobPublisherId: "",
    adMobAppIdAndroid: "",
    adMobAppIdIos: "",
    adMobBannerAndroid: "",
    adMobBannerIos: "",
    adMobInterstitialAndroid: "",
    adMobInterstitialIos: "",
    vastPrerollUrl: "",
    vastMidrollUrl: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        adNetworkEnabled: settings.adNetworkEnabled || false,
        adMobPublisherId: settings.adMobPublisherId || "",
        adMobAppIdAndroid: settings.adMobAppIdAndroid || "",
        adMobAppIdIos: settings.adMobAppIdIos || "",
        adMobBannerAndroid: settings.adMobBannerAndroid || "",
        adMobBannerIos: settings.adMobBannerIos || "",
        adMobInterstitialAndroid: settings.adMobInterstitialAndroid || "",
        adMobInterstitialIos: settings.adMobInterstitialIos || "",
        vastPrerollUrl: settings.vastPrerollUrl || "",
        vastMidrollUrl: settings.vastMidrollUrl || "",
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (checked: boolean) => {
    setFormData({ ...formData, adNetworkEnabled: checked });
  };

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync(formData);
      await refreshSettings();
      toast({ title: "Ad Networks saved successfully!" });
    } catch (error: any) {
      toast({ title: "Failed to save settings", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 text-foreground bg-[#0f1115] min-h-screen p-6 -m-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Dashboard</span>
          <span>/</span>
          <span>Ads</span>
          <span>/</span>
          <span className="text-white font-medium">Ad Networks</span>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white" disabled={updateSettingsMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Global Master Switch */}
        <div className="bg-[#1a1d24] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Global Ad Networks
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Enable or disable third-party automated ad networks across the entire platform.</p>
            </div>
            <Switch checked={formData.adNetworkEnabled} onCheckedChange={handleToggle} />
          </div>
        </div>

        {/* Google AdMob Settings */}
        <div className={`space-y-6 transition-opacity duration-200 ${!formData.adNetworkEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-[#1a1d24] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-6">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              Google AdMob (Mobile Apps)
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-300">Publisher ID</Label>
                <Input 
                  name="adMobPublisherId" 
                  value={formData.adMobPublisherId} 
                  onChange={handleChange} 
                  placeholder="pub-xxxxxxxxxxxxxxxx" 
                  className="bg-[#0f1115] border-zinc-800 text-white" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Android App ID</Label>
                  <Input name="adMobAppIdAndroid" value={formData.adMobAppIdAndroid} onChange={handleChange} placeholder="ca-app-pub-xxx~xxx" className="bg-[#0f1115] border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">iOS App ID</Label>
                  <Input name="adMobAppIdIos" value={formData.adMobAppIdIos} onChange={handleChange} placeholder="ca-app-pub-xxx~xxx" className="bg-[#0f1115] border-zinc-800 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Android Banner Ad Unit</Label>
                  <Input name="adMobBannerAndroid" value={formData.adMobBannerAndroid} onChange={handleChange} placeholder="ca-app-pub-xxx/xxx" className="bg-[#0f1115] border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">iOS Banner Ad Unit</Label>
                  <Input name="adMobBannerIos" value={formData.adMobBannerIos} onChange={handleChange} placeholder="ca-app-pub-xxx/xxx" className="bg-[#0f1115] border-zinc-800 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Android Interstitial Ad Unit</Label>
                  <Input name="adMobInterstitialAndroid" value={formData.adMobInterstitialAndroid} onChange={handleChange} placeholder="ca-app-pub-xxx/xxx" className="bg-[#0f1115] border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">iOS Interstitial Ad Unit</Label>
                  <Input name="adMobInterstitialIos" value={formData.adMobInterstitialIos} onChange={handleChange} placeholder="ca-app-pub-xxx/xxx" className="bg-[#0f1115] border-zinc-800 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* VAST Settings */}
          <div className="bg-[#1a1d24] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-6">
              <MonitorPlay className="h-5 w-5 text-purple-500" />
              VAST Video Player Ads
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-300">Pre-roll VAST URL</Label>
                <Input name="vastPrerollUrl" value={formData.vastPrerollUrl} onChange={handleChange} placeholder="https://pubads.g.doubleclick.net/gampad/ads?..." className="bg-[#0f1115] border-zinc-800 text-white" />
                <p className="text-xs text-zinc-500">Video ad shown before the main content begins.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Mid-roll VAST URL</Label>
                <Input name="vastMidrollUrl" value={formData.vastMidrollUrl} onChange={handleChange} placeholder="https://pubads.g.doubleclick.net/gampad/ads?..." className="bg-[#0f1115] border-zinc-800 text-white" />
                <p className="text-xs text-zinc-500">Video ad shown during the content (if supported by player).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
