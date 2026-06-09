
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const PLAN_OPTIONS = [
  { id: "1", name: "Ultimate Plan" },
  { id: "2", name: "Premium Plan" },
  { id: "3", name: "Standard Plan" },
  { id: "4", name: "Basic Plan" },
  { id: "5", name: "Starter Plan" },
];

const DEVICE_TYPES = ["Web", "Android", "iOS", "Smart TV", "Roku", "Fire TV", "Apple TV"];

const DOWNLOAD_QUALITIES = [
  { key: "q480p", label: "480p" },
  { key: "q720p", label: "720p" },
  { key: "q1080p", label: "1080p" },
  { key: "q1440p", label: "1440p" },
  { key: "q2k", label: "2K" },
  { key: "q4k", label: "4K" },
] as const;

type FormData = {
  planId: string;
  videoCast: boolean;
  ads: boolean;
  deviceLimit: boolean;
  deviceLimitCount: string;
  downloadStatus: boolean;
  supportedDeviceType: boolean;
  supportedDevices: string[];
  profileLimit: boolean;
  profileLimitCount: string;
  q480p: boolean;
  q720p: boolean;
  q1080p: boolean;
  q1440p: boolean;
  q2k: boolean;
  q4k: boolean;
};

const DUMMY_DATA: Record<string, FormData> = {
  "1": {
    planId: "1", videoCast: true, ads: false,
    deviceLimit: true, deviceLimitCount: "5",
    downloadStatus: true, supportedDeviceType: true,
    supportedDevices: ["Web", "Android", "iOS", "Smart TV", "Roku"],
    profileLimit: true, profileLimitCount: "5",
    q480p: true, q720p: true, q1080p: true, q1440p: true, q2k: true, q4k: true,
  },
  "2": {
    planId: "2", videoCast: true, ads: false,
    deviceLimit: true, deviceLimitCount: "3",
    downloadStatus: true, supportedDeviceType: true,
    supportedDevices: ["Web", "Android", "iOS"],
    profileLimit: true, profileLimitCount: "3",
    q480p: true, q720p: true, q1080p: true, q1440p: false, q2k: false, q4k: false,
  },
};

const inputCls = "bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-600 focus:border-red-500 h-11 rounded-lg";
const labelCls = "text-gray-300 text-sm font-medium";

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-zinc-700 bg-zinc-900">
    <span className="text-sm text-gray-300 font-medium">{label}</span>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      className="data-[state=checked]:bg-red-600"
    />
  </div>
);

export default function PlanLimitFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();

  const isEdit = !!params.id && params.id !== "new";
  const existing = isEdit ? DUMMY_DATA[params.id!] : null;

  const [form, setForm] = useState<FormData>({
    planId: existing?.planId ?? "",
    videoCast: existing?.videoCast ?? false,
    ads: existing?.ads ?? false,
    deviceLimit: existing?.deviceLimit ?? false,
    deviceLimitCount: existing?.deviceLimitCount ?? "1",
    downloadStatus: existing?.downloadStatus ?? false,
    supportedDeviceType: existing?.supportedDeviceType ?? false,
    supportedDevices: existing?.supportedDevices ?? [],
    profileLimit: existing?.profileLimit ?? false,
    profileLimitCount: existing?.profileLimitCount ?? "1",
    q480p: existing?.q480p ?? false,
    q720p: existing?.q720p ?? false,
    q1080p: existing?.q1080p ?? false,
    q1440p: existing?.q1440p ?? false,
    q2k: existing?.q2k ?? false,
    q4k: existing?.q4k ?? false,
  });

  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDevice = (device: string) => {
    setForm((prev) => ({
      ...prev,
      supportedDevices: prev.supportedDevices.includes(device)
        ? prev.supportedDevices.filter((d) => d !== device)
        : [...prev.supportedDevices, device],
    }));
  };

  const handleSave = () => {
    if (!form.planId) {
      toast({ title: "Please select a plan", variant: "destructive" });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: isEdit ? "Plan limit updated!" : "Plan limit created!" });
      setLocation("/plan-limits");
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
          onClick={() => setLocation("/plan-limits")}
        >
          Plan Limits
        </span>
        <span>/</span>
        <span className="text-white font-medium">{isEdit ? "Edit" : "New"} Plan Limit</span>
      </div>

      {/* Back */}
      <button
        onClick={() => setLocation("/plan-limits")}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
      >
        <span className="text-base leading-none">«</span>
        Back
      </button>

      {/* Plan Selection */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="max-w-sm space-y-2">
          <Label className={labelCls}>
            Plan <span className="text-red-500">*</span>
          </Label>
          <Select value={form.planId} onValueChange={(v) => set("planId", v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-11 rounded-lg">
              <SelectValue placeholder="Select Plan" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
              {PLAN_OPTIONS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Plan Limits Toggles */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Plan Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video Cast */}
          <ToggleRow
            label="Video Cast"
            checked={form.videoCast}
            onChange={(v) => set("videoCast", v)}
          />

          {/* Ads */}
          <ToggleRow
            label="Ads"
            checked={form.ads}
            onChange={(v) => set("ads", v)}
          />

          {/* Device Limit */}
          <div className="space-y-2">
            <ToggleRow
              label="Device Limit"
              checked={form.deviceLimit}
              onChange={(v) => set("deviceLimit", v)}
            />
            {form.deviceLimit && (
              <Input
                type="number"
                min="1"
                value={form.deviceLimitCount}
                onChange={(e) => set("deviceLimitCount", e.target.value)}
                placeholder="Number of devices"
                className={`${inputCls} h-10 text-sm`}
              />
            )}
          </div>

          {/* Download Status */}
          <ToggleRow
            label="Download Status"
            checked={form.downloadStatus}
            onChange={(v) => set("downloadStatus", v)}
          />

          {/* Supported Device Type */}
          <div className="space-y-2 md:col-span-2">
            <ToggleRow
              label="Supported Device Type"
              checked={form.supportedDeviceType}
              onChange={(v) => set("supportedDeviceType", v)}
            />
            {form.supportedDeviceType && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1 px-1">
                {DEVICE_TYPES.map((device) => (
                  <label
                    key={device}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <Checkbox
                      checked={form.supportedDevices.includes(device)}
                      onCheckedChange={() => toggleDevice(device)}
                      className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                      {device}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Profile Limit */}
          <div className="space-y-2">
            <ToggleRow
              label="Profile Limit"
              checked={form.profileLimit}
              onChange={(v) => set("profileLimit", v)}
            />
            {form.profileLimit && (
              <Input
                type="number"
                min="1"
                value={form.profileLimitCount}
                onChange={(e) => set("profileLimitCount", e.target.value)}
                placeholder="Number of profiles"
                className={`${inputCls} h-10 text-sm`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Download Quality */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Download Quality Option</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DOWNLOAD_QUALITIES.map(({ key, label }) => (
            <ToggleRow
              key={key}
              label={label}
              checked={form[key]}
              onChange={(v) => set(key, v)}
            />
          ))}
        </div>
      </div>

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
