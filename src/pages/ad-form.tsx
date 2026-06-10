import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAd, useGetAds } from "@/lib/api-client";

export default function AdForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: adsData } = useGetAds({ admin: true });
  const updateMutation = useUpdateAd();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "banner" as "banner" | "interstitial" | "rewarded" | "native",
    imageUrl: "",
    videoUrl: "",
    linkUrl: "",
    isActive: true,
    priority: 0,
  });

  useEffect(() => {
    if (id && adsData?.data) {
      const ad = adsData.data.find((a: any) => a._id === id);
      if (ad) {
        setFormData({
          title: ad.title || "",
          description: ad.description || "",
          type: ad.type || "banner",
          imageUrl: ad.imageUrl || "",
          videoUrl: ad.videoUrl || "",
          linkUrl: ad.linkUrl || "",
          isActive: ad.isActive !== false,
          priority: ad.priority || 0,
        });
      }
    }
  }, [id, adsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      toast({ title: "Ad not found", variant: "destructive" });
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      toast({ title: "Ad updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setLocation("/ads");
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const set = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <button
          onClick={() => setLocation("/ads")}
          className="text-gray-500 hover:text-foreground transition-colors"
        >
          Ads
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">Edit Ad</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-foreground font-semibold text-base">Ad Info</h3>
            <p className="text-zinc-500 text-sm mt-0.5">Edit ad details</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-zinc-400 text-sm">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => set("title", e.target.value)}
              required
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-zinc-400 text-sm">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => set("description", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-zinc-400 text-sm">Type</Label>
            <Select value={formData.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="bg-muted border-border text-foreground h-11 focus:border-red-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border text-foreground">
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="interstitial">Interstitial</SelectItem>
                <SelectItem value="rewarded">Rewarded</SelectItem>
                <SelectItem value="native">Native</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl" className="text-zinc-400 text-sm">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="videoUrl" className="text-zinc-400 text-sm">Video URL</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="linkUrl" className="text-zinc-400 text-sm">Link URL</Label>
            <Input
              id="linkUrl"
              value={formData.linkUrl}
              onChange={(e) => set("linkUrl", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority" className="text-zinc-400 text-sm">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => set("priority", Number(e.target.value) || 0)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3.5">
            <div>
              <Label htmlFor="isActive" className="text-foreground text-sm font-medium cursor-pointer">
                Active
              </Label>
              <p className="text-zinc-500 text-xs mt-0.5">Show this ad in the app</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(v) => set("isActive", v)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/ads")}
            className="bg-muted border-border text-foreground hover:bg-muted px-6 h-11"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-foreground px-6 h-11 font-semibold"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
