import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useGetGenreById, useCreateGenre, useUpdateGenre, getImageUrl } from "@/lib/api-client";

export default function GenreFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!params.id && params.id !== "new";
  const { data: genreData, isLoading } = useGetGenreById(params.id || "");
  const createGenre = useCreateGenre();
  const updateGenre = useUpdateGenre();

  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (genreData?.data && isEdit) {
      setName(genreData.data.name);
      setActive(genreData.data.active);
      if (genreData.data.image) {
        setImagePreview(getImageUrl(genreData.data.image));
      }
    }
  }, [genreData, isEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('active', active.toString());
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      if (isEdit) {
        await updateGenre.mutateAsync({
  id: params.id!,
  data: formData,
});
        toast({ title: "Genre updated successfully!" });
      } else {
        await createGenre.mutateAsync(formData);
        toast({ title: "Genre created successfully!" });
      }
      setLocation("/genres");
    } catch (error) {
      toast({ title: "Failed to save genre", variant: "destructive" });
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
        <span className="text-foreground font-medium">{isEdit ? "Edit Genre" : "New Genre"}</span>
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
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left — Image upload */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Image</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card hover:border-red-500/60 hover:bg-muted/60 transition-all duration-200 cursor-pointer overflow-hidden"
              style={{ minHeight: "200px" }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
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
                    <X className="h-3.5 w-3.5 text-foreground" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 px-6 text-center select-none">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
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
              <Label htmlFor="genre-name" className="text-foreground font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="genre-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Action Movie"
                className="bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 h-11 rounded-lg"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Status</Label>
              <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-border bg-card">
                <span className="text-sm text-foreground font-medium">Active</span>
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
          className="bg-red-600 hover:bg-red-700 text-foreground h-11 px-8 rounded-lg font-semibold min-w-[100px]"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
