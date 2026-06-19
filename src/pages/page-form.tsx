import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUpdatePage, useCreatePage, useGetPages } from "@/lib/api-client";

export default function PageForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEditMode = !!id && id !== "new";

  const { data: pagesData } = useGetPages();
  const updateMutation = useUpdatePage();
  const createMutation = useCreatePage();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    status: "published" as "published" | "draft",
    order: 0,
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    if (isEditMode && pagesData?.data) {
      const page = pagesData.data.find((p: any) => p._id === id);
      if (page) {
        setFormData({
          title: page.title || "",
          slug: page.slug || "",
          content: page.content || "",
          status: page.status || "published",
          order: page.order || 0,
          metaTitle: page.metaTitle || "",
          metaDescription: page.metaDescription || "",
        });
      }
    }
  }, [id, pagesData, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id, data: formData });
        toast({ title: "Page updated successfully!" });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Page created successfully!" });
      }
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setLocation("/pages");
    } catch {
      toast({ title: isEditMode ? "Update failed" : "Creation failed", variant: "destructive" });
    }
  };

  const set = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <button
          onClick={() => setLocation("/pages")}
          className="text-gray-500 hover:text-foreground transition-colors"
        >
          Pages
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{isEditMode ? "Edit Page" : "Create New Page"}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-foreground font-semibold text-base">Page Info</h3>
            <p className="text-zinc-500 text-sm mt-0.5">Enter page details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-zinc-400 text-sm">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => set("title", e.target.value)}
                required
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-zinc-400 text-sm">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => set("slug", e.target.value)}
                required
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3.5 h-[52px]">
              <div>
                <Label htmlFor="status" className="text-foreground text-sm font-medium cursor-pointer">
                  Published
                </Label>
                <p className="text-zinc-500 text-xs">Show this page in the app</p>
              </div>
              <Switch
                id="status"
                checked={formData.status === "published"}
                onCheckedChange={(checked) =>
                  set("status", checked ? "published" : "draft")
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order" className="text-zinc-400 text-sm">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-sm">Content</Label>
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="bg-muted border border-border p-1 rounded-lg gap-1">
                <TabsTrigger
                  value="editor"
                  className="flex items-center gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-zinc-400 rounded-md px-4 py-1.5 text-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-zinc-400 rounded-md px-4 py-1.5 text-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="mt-3">
                <Textarea
                  id="content"
                  rows={12}
                  value={formData.content}
                  onChange={(e) => set("content", e.target.value)}
                  required
                  placeholder="Enter HTML content here..."
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary resize-none font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-3">
                <div
                  className="border border-border rounded-lg p-6 min-h-[300px] bg-muted text-foreground prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.content || "<p class='text-zinc-500'>No content yet</p>" }}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="metaTitle" className="text-zinc-400 text-sm">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metaDescription" className="text-zinc-400 text-sm">Meta Description</Label>
              <Textarea
                id="metaDescription"
                rows={3}
                value={formData.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/pages")}
            className="bg-muted border-border text-foreground hover:bg-muted px-6 h-11"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending || createMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-foreground px-6 h-11 font-semibold"
          >
            {isEditMode ? "Save Changes" : "Create Page"}
          </Button>
        </div>
      </form>
    </div>
  );
}
