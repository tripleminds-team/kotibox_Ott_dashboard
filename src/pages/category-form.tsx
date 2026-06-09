import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useGetCategoryById, useCreateCategory, useUpdateCategory } from "../lib/api-client";

type FormDataState = {
  name: string;
  description: string;
  active: boolean;
};

export default function CategoryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();

  const isEdit = !!id;

  const { data: categoryData } = useGetCategoryById(id || "");
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    description: "",
    active: true,
  });

  useEffect(() => {
    if (isEdit && categoryData) {
      setFormData({
        name: categoryData.name || "",
        description: categoryData.description || "",
        active: categoryData.active !== undefined ? categoryData.active : true,
      });
    }
  }, [isEdit, categoryData]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("isActive", formData.active.toString());

      if (isEdit) {
        await updateMutation.mutateAsync({ categoryId: id, data: formDataToSend });
        toast({ title: "Category updated successfully!" });
      } else {
        await createMutation.mutateAsync({ data: formDataToSend });
        toast({ title: "Category created successfully!" });
      }

      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      setLocation("/categories");
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <button
          onClick={() => setLocation("/categories")}
          className="text-gray-500 hover:text-white transition-colors"
        >
          Categories
        </button>
        <span>/</span>
        <span className="text-white font-medium">{isEdit ? "Edit Category" : "New Category"}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-white font-semibold text-base">Category Details</h3>
            <p className="text-zinc-500 text-sm mt-0.5">Name and description for the category.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-zinc-400 text-sm">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Category name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-red-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-zinc-400 text-sm">Description</Label>
            <Textarea
              id="description"
              placeholder="A small description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-red-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-3.5">
            <div>
              <Label htmlFor="active" className="text-white text-sm font-medium cursor-pointer">
                Active
              </Label>
              <p className="text-zinc-500 text-xs mt-0.5">Set category as active</p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/categories")}
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 px-6 h-11"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-6 h-11 font-semibold"
          >
            {isEdit ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </div>
  );
}
