
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import {
  useGetSubscriptionPlans,
  useGetSubscriptionPlanById,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useGetPlanLimits,
  useGetPlanLimitById,
  useCreatePlanLimit,
  useUpdatePlanLimit,
} from "@/lib/api-client";

const DURATION_OPTIONS = ["Day", "Week", "Month", "Year"];

const inputCls =
  "bg-card border-border text-foreground placeholder:text-gray-600 focus:border-red-500 h-11 rounded-lg";
const labelCls = "text-foreground text-sm font-medium";

export default function PlanFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();

  const isEdit = !!params.id && params.id !== "new";

  // Hooks
  const { data: plansData } = useGetSubscriptionPlans();
  const { data: existingPlanData } = useGetSubscriptionPlanById(params.id || "");
  const { data: planLimitsData } = useGetPlanLimits({ planId: params.id || "" });
  const existingLimit = planLimitsData?.data?.[0] || null;
  const { data: existingLimitData } = useGetPlanLimitById(existingLimit?.id || "");

  const createSubscriptionPlan = useCreateSubscriptionPlan();
  const updateSubscriptionPlan = useUpdateSubscriptionPlan();
  const createPlanLimit = useCreatePlanLimit();
  const updatePlanLimit = useUpdatePlanLimit();

  const [form, setForm] = useState({
    name: "",
    duration: "Month",
    durationValue: "1",
    price: "",
    discount: "0",
    status: true,
    description: "",
    level: "1",
    // Plan limits
    videoCast: false,
    ads: false,
    deviceLimit: false,
    deviceLimitCount: "1",
    downloadStatus: false,
    supportedDeviceType: false,
    supportedDevices: [] as string[],
    profileLimit: false,
    profileLimitCount: "1",
    q480p: false,
    q720p: false,
    q1080p: false,
    q1440p: false,
    q2k: false,
    q4k: false,
  });

  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && existingPlanData?.data) {
      const plan = existingPlanData.data;
      setForm((prev) => ({
        ...prev,
        name: plan.name,
        duration: plan.duration,
        durationValue: String(plan.durationValue),
        price: String(plan.price),
        discount: String(plan.discount),
        status: plan.status,
        description: plan.description,
        level: String(plan.level),
      }));

      if (existingLimitData?.data) {
        const limit = existingLimitData.data;
        setForm((prev) => ({
          ...prev,
          videoCast: limit.videoCast,
          ads: limit.ads,
          deviceLimit: limit.deviceLimit,
          deviceLimitCount: String(limit.deviceLimitCount),
          downloadStatus: limit.downloadStatus,
          supportedDeviceType: limit.supportedDeviceType,
          supportedDevices: limit.supportedDevices,
          profileLimit: limit.profileLimit,
          profileLimitCount: String(limit.profileLimitCount),
          q480p: limit.q480p,
          q720p: limit.q720p,
          q1080p: limit.q1080p,
          q1440p: limit.q1440p,
          q2k: limit.q2k,
          q4k: limit.q4k,
        }));
      }
    }
  }, [isEdit, existingPlanData, existingLimitData]);

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDevice = (device: string) => {
    if (form.supportedDevices.includes(device)) {
      set("supportedDevices", form.supportedDevices.filter((d) => d !== device));
    } else {
      set("supportedDevices", [...form.supportedDevices, device]);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Plan name is required", variant: "destructive" });
      return;
    }
    if (!form.duration) {
      toast({ title: "Duration is required", variant: "destructive" });
      return;
    }
    if (!form.price) {
      toast({ title: "Price is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let planId = params.id;
      const totalPrice = Number(form.price) - Number(form.discount);

      // Save plan
      if (isEdit && planId) {
        await updateSubscriptionPlan.mutateAsync({
          id: planId,
          data: {
            name: form.name,
            duration: form.duration,
            durationValue: Number(form.durationValue),
            price: Number(form.price),
            discount: Number(form.discount),
            totalPrice: totalPrice,
            status: form.status,
            description: form.description,
            level: Number(form.level),
          },
        });
      } else {
        const newPlan = await createSubscriptionPlan.mutateAsync({
          name: form.name,
          duration: form.duration,
          durationValue: Number(form.durationValue),
          price: Number(form.price),
          discount: Number(form.discount),
          totalPrice: totalPrice,
          status: form.status,
          description: form.description,
          level: Number(form.level),
        });
        planId = newPlan.data.id;
      }

      // Save plan limit
      const limitData = {
        planId: planId!,
        videoCast: form.videoCast,
        ads: form.ads,
        deviceLimit: form.deviceLimit,
        deviceLimitCount: Number(form.deviceLimitCount),
        downloadStatus: form.downloadStatus,
        supportedDeviceType: form.supportedDeviceType,
        supportedDevices: form.supportedDevices,
        profileLimit: form.profileLimit,
        profileLimitCount: Number(form.profileLimitCount),
        q480p: form.q480p,
        q720p: form.q720p,
        q1080p: form.q1080p,
        q1440p: form.q1440p,
        q2k: form.q2k,
        q4k: form.q4k,
      };

      if (isEdit && existingLimit?.id) {
        await updatePlanLimit.mutateAsync({
          id: existingLimit.id,
          data: limitData,
        });
      } else {
        await createPlanLimit.mutateAsync(limitData);
      }

      toast({ title: isEdit ? "Plan updated successfully!" : "Plan created successfully!" });
      setLocation("/plans");
    } catch (error) {
      toast({ title: `Failed to ${isEdit ? "update" : "create"} plan`, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span
          className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          onClick={() => setLocation("/plans")}
        >
          Plans
        </span>
        <span>/</span>
        <span className="text-foreground font-medium">{isEdit ? "Edit Plan" : "New Plan"}</span>
      </div>

      {/* Back */}
      <button
        onClick={() => setLocation("/plans")}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
      >
        <span className="text-base leading-none">«</span>
        Back
      </button>

      {/* Main Form Card */}
      <div className="rounded-xl border border-border bg-card/50 p-6 space-y-6">
        {/* Row 1: Name, Duration, Duration Value, Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-2">
            <Label className={labelCls}>
              Plan Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Premium Plan"
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>
              Duration <span className="text-red-500">*</span>
            </Label>
            <Select value={form.duration} onValueChange={(v) => set("duration", v)}>
              <SelectTrigger className="bg-card border-border text-foreground h-11 rounded-lg">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border text-foreground">
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>
              Duration Value <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              value={form.durationValue}
              onChange={(e) => set("durationValue", e.target.value)}
              placeholder="1"
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>
              Price ($) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
        </div>

        {/* Row 2: Discount, Status, Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-2">
            <Label className={labelCls}>Discount ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={(e) => set("discount", e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
          <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-border bg-card">
            <span className={labelCls}>Status</span>
            <Switch
              checked={form.status}
              onCheckedChange={(v) => set("status", v)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>Level</Label>
            <Input
              type="number"
              min="1"
              value={form.level}
              onChange={(e) => set("level", e.target.value)}
              placeholder="1"
              className={inputCls}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className={labelCls}>
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Write a description for this plan..."
            className="bg-card border-border text-foreground placeholder:text-gray-600 focus:border-red-500 rounded-lg resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Plan Limits */}
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <h3 className="text-base font-semibold text-foreground mb-5">Plan Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video Cast */}
          <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card">
            <span className="text-sm text-foreground font-medium">Video Cast</span>
            <Switch
              checked={form.videoCast}
              onCheckedChange={(v) => set("videoCast", v)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>

          {/* Ads */}
          <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card">
            <span className="text-sm text-foreground font-medium">Ads</span>
            <Switch
              checked={form.ads}
              onCheckedChange={(v) => set("ads", v)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>

          {/* Device Limit with count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card">
              <span className="text-sm text-foreground font-medium">Device Limit</span>
              <Switch
                checked={form.deviceLimit}
                onCheckedChange={(v) => set("deviceLimit", v)}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
            {form.deviceLimit && (
              <Input
                type="number"
                min="1"
                value={form.deviceLimitCount}
                onChange={(e) => set("deviceLimitCount", e.target.value)}
                placeholder="Number of devices"
                className="bg-card border-border text-foreground focus:border-red-500 h-10 rounded-lg text-sm"
              />
            )}
          </div>

          {/* Download Status */}
          <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card">
            <span className="text-sm text-foreground font-medium">Download Status</span>
            <Switch
              checked={form.downloadStatus}
              onCheckedChange={(v) => set("downloadStatus", v)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>

          {/* Supported Device Type with options */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card">
              <span className="text-sm text-foreground font-medium">Supported Device Type</span>
              <Switch
                checked={form.supportedDeviceType}
                onCheckedChange={(v) => set("supportedDeviceType", v)}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
            {form.supportedDeviceType && (
              <div className="flex flex-wrap gap-2 p-3 bg-zinc-950 rounded-lg border border-border">
                {["mobile", "tablet", "tv", "desktop"].map((device) => (
                  <button
                    key={device}
                    type="button"
                    onClick={() => toggleDevice(device)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      form.supportedDevices.includes(device)
                        ? "border-red-500/60 bg-red-600/20 text-red-300"
                        : "border-border bg-card text-muted-foreground hover:border-border"
                    }`}
                  >
                    {device}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Limit with count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card">
              <span className="text-sm text-foreground font-medium">Profile Limit</span>
              <Switch
                checked={form.profileLimit}
                onCheckedChange={(v) => set("profileLimit", v)}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
            {form.profileLimit && (
              <Input
                type="number"
                min="1"
                value={form.profileLimitCount}
                onChange={(e) => set("profileLimitCount", e.target.value)}
                placeholder="Number of profiles"
                className="bg-card border-border text-foreground focus:border-red-500 h-10 rounded-lg text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Download Quality Options */}
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <h3 className="text-base font-semibold text-foreground mb-5">Download Quality Option</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: "q480p" as const, label: "480p" },
            { key: "q720p" as const, label: "720p" },
            { key: "q1080p" as const, label: "1080p" },
            { key: "q1440p" as const, label: "1440p" },
            { key: "q2k" as const, label: "2K" },
            { key: "q4k" as const, label: "4K" },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between h-12 px-4 rounded-lg border border-border bg-card"
            >
              <span className="text-sm text-foreground font-medium">{label}</span>
              <Switch
                checked={form[key]}
                onCheckedChange={(v) => set(key, v)}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-foreground h-11 px-10 rounded-lg font-semibold min-w-[120px]"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
