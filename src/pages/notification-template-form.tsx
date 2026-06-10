
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  X, Plus, Bold, Italic, Strikethrough, Link2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Code, ImageIcon, Undo, Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGetNotificationTemplateById, useCreateNotificationTemplate, useUpdateNotificationTemplate } from "../lib/api-client";

const NOTIFICATION_PARAMS = [
  "ID", "User Name", "Description / Note", "Your Name", "Your Position",
  "User' ID", "User Password", "Site URL", "Episode Name", "Movie Name",
  "Season Name", "TV Show Name", "End Date", "Start Date", "Plan Name",
  "Content Type", "OTP Code", "Payment Method", "Price", "Discount",
  "Coupon Discount", "Tax", "Total Amount", "Duration",
];

const ALL_RECIPIENTS = ["User", "Admin", "Demo Admin", "Super Admin"];

type TemplateFormData = {
  type: string;
  userType: string;
  recipients: string[];
  status: boolean;
  notifSubject: string;
  notifTemplate: string;
  emailSubject: string;
  emailTemplate: string;
};

const labelCls = "text-foreground text-sm font-medium";
const inputCls = "bg-muted border-border text-foreground placeholder:text-gray-600 focus:border-red-500 h-10 rounded-lg";

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/80 flex-wrap">
        {["File", "Edit", "View", "Insert", "Format"].map((m) => (
          <button
            key={m}
            type="button"
            className="flex items-center gap-0.5 px-2 py-1 text-xs text-zinc-300 hover:bg-muted rounded transition-colors"
          >
            {m} <span className="text-[9px] opacity-70">▾</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/80 flex-wrap">
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><Undo className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><Redo className="h-3.5 w-3.5" /></button>
        <div className="w-px h-4 bg-muted mx-1" />
        <button type="button" className="flex items-center gap-0.5 px-2 py-0.5 text-xs text-zinc-300 hover:bg-muted rounded transition-colors">
          Formats <span className="text-[9px] opacity-70">▾</span>
        </button>
        <div className="w-px h-4 bg-muted mx-1" />
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><Bold className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><Italic className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><Strikethrough className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><Link2 className="h-3.5 w-3.5" /></button>
        <div className="w-px h-4 bg-muted mx-1" />
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><AlignLeft className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><AlignCenter className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><AlignRight className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><AlignJustify className="h-3.5 w-3.5" /></button>
        <div className="w-px h-4 bg-muted mx-1" />
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><Code className="h-3.5 w-3.5" /></button>
        <button type="button" className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-zinc-400 transition-colors"><ImageIcon className="h-3.5 w-3.5" /></button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="rounded-none border-0 bg-card text-foreground placeholder:text-gray-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-sm leading-relaxed"
        placeholder="Enter template content..."
      />
      <div className="px-3 py-1 bg-muted/80 border-t border-border text-right">
        <span className="text-[10px] text-muted-foreground tracking-wide">POWERED BY TINYMCE</span>
      </div>
    </div>
  );
}

export default function NotificationTemplateFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();
  const { data: existingData, isLoading: isLoadingExisting } = useGetNotificationTemplateById(params.id);
  const createMutation = useCreateNotificationTemplate();
  const updateMutation = useUpdateNotificationTemplate();

  const existing = existingData?.data;
  const isEdit = !!params.id;

  const [form, setForm] = useState<TemplateFormData>({
    type: "",
    userType: "user",
    recipients: ["User"],
    status: true,
    notifSubject: "",
    notifTemplate: "",
    emailSubject: "",
    emailTemplate: "",
  });
  const [saving, setSaving] = useState(false);
  const [recipientSelectKey, setRecipientSelectKey] = useState(0);

  useEffect(() => {
    if (existing) {
      setForm({
        type: existing.type,
        userType: existing.userType,
        recipients: existing.recipients,
        status: existing.status,
        notifSubject: existing.notifSubject,
        notifTemplate: existing.notifTemplate,
        emailSubject: existing.emailSubject,
        emailTemplate: existing.emailTemplate,
      });
    }
  }, [existing]);

  const set = <K extends keyof TemplateFormData>(key: K, value: TemplateFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addRecipient = (r: string) => {
    if (r && !form.recipients.includes(r)) {
      set("recipients", [...form.recipients, r]);
      setRecipientSelectKey((k) => k + 1);
    }
  };

  const removeRecipient = (r: string) =>
    set("recipients", form.recipients.filter((x) => x !== r));

  const availableRecipients = ALL_RECIPIENTS.filter((r) => !form.recipients.includes(r));

  const handleParamClick = (param: string) => {
    const key = `[[ ${param.toLowerCase().replace(/[\s'/]+/g, "_")} ]]`;
    navigator.clipboard.writeText(key).catch(() => {});
    toast({ title: `Copied: ${key}`, description: "Paste in the template where needed." });
  };

  const handleSave = async () => {
    if (!form.type.trim()) {
      toast({ title: "Type is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ templateId: params.id, data: form });
        toast({ title: "Template updated successfully!" });
      } else {
        await createMutation.mutateAsync({ data: form });
        toast({ title: "Template created successfully!" });
      }
      setLocation("/notification-templates");
    } catch {
      toast({ title: "Failed to save template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoadingExisting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span
          className="cursor-pointer hover:text-foreground transition-colors"
          onClick={() => setLocation("/notification-templates")}
        >
          Notification Templates
        </span>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isEdit ? "Edit Notification Template" : "New Template"}
        </span>
      </div>

      <button
        onClick={() => setLocation("/notification-templates")}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
      >
        <span className="text-base leading-none">«</span>
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">
        {/* Left Panel */}
        <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
          {/* Type */}
          <div className="space-y-2">
            <Label className={labelCls}>
              Type <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              placeholder="e.g. Change Password"
              className={inputCls}
              readOnly={isEdit}
            />
          </div>

          {/* Notification Parameters */}
          <div className="space-y-3">
            <Label className={labelCls}>Notification Parameters</Label>
            <div className="flex flex-wrap gap-1.5">
              {NOTIFICATION_PARAMS.map((param) => (
                <button
                  key={param}
                  type="button"
                  onClick={() => handleParamClick(param)}
                  title={`Click to copy [[ ${param.toLowerCase().replace(/[\s'/]+/g, "_")} ]]`}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-foreground text-xs font-medium transition-colors"
                >
                  {param}
                </button>
              ))}
            </div>
          </div>

          {/* User Type */}
          <div className="space-y-2">
            <Label className={labelCls}>
              User Type <span className="text-red-500">*</span>
            </Label>
            <Select value={form.userType} onValueChange={(v) => set("userType", v)}>
              <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border text-foreground">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* To (recipients) */}
          <div className="space-y-2">
            <Label className={labelCls}>To</Label>
            <div className="min-h-[42px] px-2 py-2 rounded-lg border border-border bg-muted flex flex-wrap gap-2 items-center">
              {form.recipients.map((r) => (
                <span
                  key={r}
                  className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-red-600 text-foreground text-xs rounded font-medium"
                >
                  {r}
                  <button
                    type="button"
                    onClick={() => removeRecipient(r)}
                    className="ml-0.5 hover:text-red-200 transition-colors flex items-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {availableRecipients.length > 0 && (
                <Select key={recipientSelectKey} onValueChange={addRecipient}>
                  <SelectTrigger className="h-7 w-auto min-w-[60px] border border-dashed border-border bg-transparent text-zinc-400 hover:text-foreground text-xs rounded px-2 gap-1 shadow-none focus:ring-0">
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-foreground">
                    {availableRecipients.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className={labelCls}>Status</Label>
            <div className="flex items-center justify-between h-10 px-4 rounded-lg border border-border bg-muted">
              <span className="text-sm text-foreground font-medium">Active</span>
              <Switch
                checked={form.status}
                onCheckedChange={(v) => set("status", v)}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Notification Template */}
          <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
            <h3 className="text-foreground font-semibold text-base">Notification Template</h3>
            <div className="space-y-2">
              <Label className={labelCls}>Subject</Label>
              <Input
                value={form.notifSubject}
                onChange={(e) => set("notifSubject", e.target.value)}
                placeholder="Notification subject..."
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelCls}>Template</Label>
              <RichEditor
                value={form.notifTemplate}
                onChange={(v) => set("notifTemplate", v)}
              />
            </div>
          </div>

          {/* Email Template */}
          <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
            <h3 className="text-foreground font-semibold text-base">E-Mail Template</h3>
            <div className="space-y-2">
              <Label className={labelCls}>Subject</Label>
              <Input
                value={form.emailSubject}
                onChange={(e) => set("emailSubject", e.target.value)}
                placeholder="Email subject..."
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelCls}>Template</Label>
              <RichEditor
                value={form.emailTemplate}
                onChange={(v) => set("emailTemplate", v)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-foreground h-11 px-10 rounded-lg font-semibold min-w-[100px]"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
