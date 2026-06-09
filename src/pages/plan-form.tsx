import { useState } from "react";
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

type PlanData = {
  name: string;
  duration: string;
  durationValue: string;
  price: string;
  discount: boolean;
  status: boolean;
  description: string;
  // plan limits
  videoCast: boolean;
  ads: boolean;
  deviceLimit: boolean;
  deviceLimitCount: string;
  downloadStatus: boolean;
  supportedDeviceType: boolean;
  profileLimit: boolean;
  // download quality (edit only)
  q480p: boolean;
  q720p: boolean;
  q1080p: boolean;
  q1440p: boolean;
  q2k: boolean;
  q4k: boolean;
};

const DUMMY_PLANS: Record<string, PlanData & { level: string }> = {
  "1": {
    name: "Ultimate Plan", duration: "Year", durationValue: "1", price: "199.99",
    discount: true, status: true, description: "Full access to all content with 4K streaming.",
    videoCast: true, ads: false, deviceLimit: true, deviceLimitCount: "5",
    downloadStatus: true, supportedDeviceType: true, profileLimit: true,
    q480p: true, q720p: true, q1080p: true, q1440p: true, q2k: true, q4k: true,
    level: "5",
  },
  "2": {
    name: "Premium Plan", duration: "6 Months", durationValue: "6", price: "99.99",
    discount: true, status: true, description: "Premium access with 1080p streaming.",
    videoCast: true, ads: false, deviceLimit: true, deviceLimitCount: "3",
    downloadStatus: true, supportedDeviceType: true, profileLimit: true,
    q480p: true, q720p: true, q1080p: true, q1440p: false, q2k: false, q4k: false,
    level: "4",
  },
  "3": {
    name: "Standard Plan", duration: "3 Months", durationValue: "3", price: "59.99",
    discount: true, status: true, description: "Standard access with 720p streaming.",
    videoCast: true, ads: true, deviceLimit: true, deviceLimitCount: "2",
    downloadStatus: false, supportedDeviceType: true, profileLimit: false,
    q480p: true, q720p: true, q1080p: false, q1440p: false, q2k: false, q4k: false,
    level: "3",
  },
  "4": {
    name: "Basic Plan", duration: "Month", durationValue: "1", price: "19.99",
    discount: false, status: true, description: "Basic access with 480p streaming.",
    videoCast: false, ads: true, deviceLimit: true, deviceLimitCount: "1",
    downloadStatus: false, supportedDeviceType: false, profileLimit: false,
    q480p: true, q720p: false, q1080p: false, q1440p: false, q2k: false, q4k: false,
    level: "2",
  },
  "5": {
    name: "Starter Plan", duration: "Week", durationValue: "1", price: "6.99",
    discount: false, status: false, description: "Try out the platform.",
    videoCast: false, ads: true, deviceLimit: true, deviceLimitCount: "1",
    downloadStatus: false, supportedDeviceType: false, profileLimit: false,
    q480p: true, q720p: false, q1080p: false, q1440p: false, q2k: false, q4k: false,
    level: "1",
  },
  "6": {
    name: "Trial Plan", duration: "Day", durationValue: "1", price: "1.99",
    discount: false, status: true, description: "One day trial access.",
    videoCast: false, ads: true, deviceLimit: true, deviceLimitCount: "1",
    downloadStatus: false, supportedDeviceType: false, profileLimit: false,
    q480p: true, q720p: false, q1080p: false, q1440p: false, q2k: false, q4k: false,
    level: "1",
  },
};

const DURATION_OPTIONS = ["Day", "Week", "Month", "3 Months", "6 Months", "Year"];

const PLAN_LIMITS = [
  { key: "videoCast", label: "Video Cast" },
  { key: "ads", label: "Ads" },
  { key: "deviceLimit", label: "Device Limit" },
  { key: "downloadStatus", label: "Download Status" },
  { key: "supportedDeviceType", label: "Supported Device Type" },
  { key: "profileLimit", label: "Profile Limit" },
] as const;

const DOWNLOAD_QUALITIES = [
  { key: "q480p", label: "480p" },
  { key: "q720p", label: "720p" },
  { key: "q1080p", label: "1080p" },
  { key: "q1440p", label: "1440p" },
  { key: "q2k", label: "2K" },
  { key: "q4k", label: "4K" },
] as const;

const inputCls =
  "bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-600 focus:border-red-500 h-11 rounded-lg";
const labelCls = "text-gray-300 text-sm font-medium";

export default function PlanFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();

  const isEdit = !!params.id && params.id !== "new";
  const existing = isEdit ? DUMMY_PLANS[params.id!] : null;

  const [form, setForm] = useState<PlanData>({
    name: existing?.name ?? "",
    duration: existing?.duration ?? "",
    durationValue: existing?.durationValue ?? "",
    price: existing?.price ?? "",
    discount: existing?.discount ?? false,
    status: existing?.status ?? true,
    description: existing?.description ?? "",
    videoCast: existing?.videoCast ?? false,
    ads: existing?.ads ?? false,
    deviceLimit: existing?.deviceLimit ?? false,
    deviceLimitCount: existing?.deviceLimitCount ?? "1",
    downloadStatus: existing?.downloadStatus ?? false,
    supportedDeviceType: existing?.supportedDeviceType ?? false,
    profileLimit: existing?.profileLimit ?? false,
    q480p: existing?.q480p ?? false,
    q720p: existing?.q720p ?? false,
    q1080p: existing?.q1080p ?? false,
    q1440p: existing?.q1440p ?? false,
    q2k: existing?.q2k ?? false,
    q4k: existing?.q4k ?? false,
  });

  const [saving, setSaving] = useState(false);

  const set = (key: keyof PlanData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
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
    setTimeout(() => {
      setSaving(false);
      toast({ title: isEdit ? "Plan updated successfully!" : "Plan created successfully!" });
      setLocation("/plans");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span
          className="text-gray-400 hover:text-white cursor-pointer transition-colors"
          onClick={() => setLocation("/plans")}
        >
          Plans
        </span>
        <span>/</span>
        <span className="text-white font-medium">{isEdit ? "Edit Plan" : "New Plan"}</span>
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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
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
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-11 rounded-lg">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
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

        {/* Row 2: Discount toggle, Status toggle, (edit: Level) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-zinc-700 bg-zinc-900">
            <span className={labelCls}>Discount</span>
            <Switch
              checked={form.discount}
              onCheckedChange={(v) => set("discount", v)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-zinc-700 bg-zinc-900">
            <span className={labelCls}>Status</span>
            <Switch
              checked={form.status}
              onCheckedChange={(v) => set("status", v)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          {isEdit && existing && (
            <div className="space-y-2">
              <Label className={labelCls}>Level</Label>
              <Input
                value={existing.level}
                readOnly
                className="bg-zinc-900/50 border-zinc-700 text-gray-400 h-11 rounded-lg cursor-not-allowed"
              />
            </div>
          )}
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
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-600 focus:border-red-500 rounded-lg resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Plan Limits */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-base font-semibold text-white mb-5">Plan Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLAN_LIMITS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-zinc-700 bg-zinc-900">
                <span className="text-sm text-gray-300 font-medium">{label}</span>
                <Switch
                  checked={form[key as keyof PlanData] as boolean}
                  onCheckedChange={(v) => set(key as keyof PlanData, v)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              {/* Device Limit count input */}
              {key === "deviceLimit" && form.deviceLimit && (
                <div className="mt-2 px-1">
                  <Input
                    type="number"
                    min="1"
                    value={form.deviceLimitCount}
                    onChange={(e) => set("deviceLimitCount", e.target.value)}
                    placeholder="Number of devices"
                    className="bg-zinc-900 border-zinc-700 text-white focus:border-red-500 h-10 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Download Quality (edit only) */}
      {isEdit && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="text-base font-semibold text-white mb-5">Download Quality Option</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DOWNLOAD_QUALITIES.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between h-12 px-4 rounded-lg border border-zinc-700 bg-zinc-900"
              >
                <span className="text-sm text-gray-300 font-medium">{label}</span>
                <Switch
                  checked={form[key as keyof PlanData] as boolean}
                  onCheckedChange={(v) => set(key as keyof PlanData, v)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white h-11 px-10 rounded-lg font-semibold min-w-[120px]"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
