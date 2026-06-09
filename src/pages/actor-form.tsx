
import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ActorData = {
  name: string;
  designation: string;
  dateOfBirth: string;
  birthPlace: string;
  bio: string;
  status: boolean;
  image: string;
};

const DUMMY_ACTORS: Record<string, ActorData> = {
  "1": { name: "Michael Johnson", designation: "Main Actor", dateOfBirth: "1985-04-13", birthPlace: "New York, USA", bio: "Michael Johnson is an acclaimed American actor known for his versatile performances in Hollywood blockbusters.", status: true, image: "" },
  "2": { name: "James Williams", designation: "Main Actor", dateOfBirth: "1980-04-14", birthPlace: "Los Angeles, USA", bio: "James Williams is a seasoned Hollywood actor with over 20 years of experience in film and television.", status: true, image: "" },
};

const inputCls = "bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-600 focus:border-red-500 h-11 rounded-lg";
const labelCls = "text-gray-300 text-sm font-medium";

export default function ActorFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!params.id && params.id !== "new";
  const existing = isEdit ? DUMMY_ACTORS[params.id!] : null;

  const [form, setForm] = useState<ActorData>({
    name: existing?.name ?? "",
    designation: existing?.designation ?? "",
    dateOfBirth: existing?.dateOfBirth ?? "",
    birthPlace: existing?.birthPlace ?? "",
    bio: existing?.bio ?? "",
    status: existing?.status ?? true,
    image: existing?.image ?? "",
  });
  const [imagePreview, setImagePreview] = useState<string>(existing?.image ?? "");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ActorData>(key: K, value: ActorData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    set("image", url);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!form.dateOfBirth) { toast({ title: "Date of birth is required", variant: "destructive" }); return; }
    if (!form.birthPlace.trim()) { toast({ title: "Birth place is required", variant: "destructive" }); return; }
    if (!form.bio.trim()) { toast({ title: "Bio is required", variant: "destructive" }); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: isEdit ? "Actor updated successfully!" : "Actor created successfully!" });
      setLocation("/actors");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">{isEdit ? "Edit Actor" : "New Actor"}</span>
      </div>

      {/* Back */}
      <button
        onClick={() => setLocation("/actors")}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
      >
        <span className="text-base leading-none">«</span>
        Back
      </button>

      {/* Form Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className={labelCls}>Photo</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-zinc-700 hover:border-red-500 bg-zinc-900 flex flex-col items-center justify-center cursor-pointer transition-colors group overflow-hidden"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                    <p className="text-white text-sm font-medium">Change Photo</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(""); set("image", ""); }}
                    className="absolute top-2 right-2 h-6 w-6 bg-red-600 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-zinc-600 mb-2" />
                  <p className="text-sm text-zinc-500">Choose Media to Upload</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-2">
              <Label className={labelCls}>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Henry Williams" className={inputCls} />
            </div>

            {/* Date Of Birth */}
            <div className="space-y-2">
              <Label className={labelCls}>Date Of Birth <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} placeholder="e.g. 1994-07-24" className={inputCls} />
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Label className={labelCls}>Designation</Label>
              <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. director" className={inputCls} />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className={labelCls}>Status</Label>
              <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-zinc-700 bg-zinc-900">
                <span className="text-sm text-gray-300 font-medium">Active</span>
                <Switch checked={form.status} onCheckedChange={(v) => set("status", v)} className="data-[state=checked]:bg-red-600" />
              </div>
            </div>

            {/* Birth Place */}
            <div className="space-y-2 md:col-span-2">
              <Label className={labelCls}>Birth Place <span className="text-red-500">*</span></Label>
              <Input value={form.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} placeholder="e.g. New York, USA" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <Label className={labelCls}>Bio <span className="text-red-500">*</span></Label>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <span className="h-3 w-3 rounded-full border border-red-400 flex items-center justify-center text-[8px]">✦</span>
              Generate Description with AI
            </button>
          </div>
          <Textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="e.g. Henry Williams is an American character actor and director. Born and raised in Portland, Oregon..."
            rows={5}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-600 focus:border-red-500 rounded-lg resize-none"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white h-11 px-10 rounded-lg font-semibold min-w-[100px]">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
