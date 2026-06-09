import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// Dummy data for edit mode (same as genres list)
const DUMMY_GENRES: Record<string, { name: string; image: string; active: boolean }> = {
  "1": { name: "Action", image: "https://picsum.photos/seed/gen-action/200/200", active: true },
  "2": { name: "Animation", image: "https://picsum.photos/seed/gen-anim/200/200", active: true },
  "3": { name: "Comedy", image: "https://picsum.photos/seed/gen-comedy/200/200", active: true },
  "4": { name: "Historical", image: "https://picsum.photos/seed/gen-hist/200/200", active: true },
  "5": { name: "Horror", image: "https://picsum.photos/seed/gen-horror/200/200", active: true },
  "6": { name: "Romance", image: "https://picsum.photos/seed/gen-romance/200/200", active: false },
  "7": { name: "Sci-Fi", image: "https://picsum.photos/seed/gen-scifi/200/200", active: true },
  "8": { name: "Thriller", image: "https://picsum.photos/seed/gen-thriller/200/200", active: true },
  "9": { name: "Documentary", image: "https://picsum.photos/seed/gen-doc/200/200", active: false },
  "10": { name: "Adventure", image: "https://picsum.photos/seed/gen-adv/200/200", active: true },
};

export default function GenreFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!params.id && params.id !== "new";
  const existing = isEdit ? DUMMY_GENRES[params.id!] : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [active, setActive] = useState(existing?.active ?? true);
  const [imagePreview, setImagePreview] = useState<string | null>(existing?.image ?? null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: isEdit ? "Genre updated successfully!" : "Genre created successfully!" });
      setLocation("/genres");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">{isEdit ? "Edit Genre" : "New Genre"}</span>
      </div>

      {/* Back */}
      <button
        onClick={() => setLocation("/genres")}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
      >
        <span className="text-base leading-none">«</span>
        Back
      </button>

      {/* Form Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left — Image upload */}
          <div className="space-y-2">
            <Label className="text-gray-300 font-medium">Image</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 hover:border-red-500/60 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer overflow-hidden"
              style={{ minHeight: "200px" }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ maxHeight: "220px" }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg z-10"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 px-6 text-center select-none">
                  <ImageIcon className="h-10 w-10 text-zinc-600" />
                  <p className="text-sm text-gray-500">Choose Media to Upload</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Right — Name + Status */}
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="genre-name" className="text-gray-300 font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="genre-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Action Movie"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-11 rounded-lg"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">Status</Label>
              <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-zinc-700 bg-zinc-900">
                <span className="text-sm text-gray-300 font-medium">Active</span>
                <Switch
                  checked={active}
                  onCheckedChange={setActive}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save button — bottom right */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white h-11 px-8 rounded-lg font-semibold min-w-[100px]"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
