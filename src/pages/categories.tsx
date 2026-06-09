import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2, Film, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDeleteCategory, useBulkDeleteCategories, useGetCategoriesList } from "@/lib/api-client";

type CategoryRow = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoryRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: categoriesData, isLoading } = useGetCategoriesList({ admin: true, page: currentPage, limit: itemsPerPage });
  const deleteMutation = useDeleteCategory();
  const bulkDeleteMutation = useBulkDeleteCategories();

  const categories: CategoryRow[] = categoriesData?.data || [];
  const pagination = categoriesData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

  const filtered = categories.filter((c) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : filtered.map((c) => c.id));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleApply = async () => {
    if (!bulkAction || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      try {
        await bulkDeleteMutation.mutateAsync(selectedIds);
        setSelectedIds([]);
        toast({ title: "Categories deleted successfully!" });
      } catch {
        toast({ title: "Bulk delete failed", variant: "destructive" });
      }
    }
    setBulkAction("");
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeletingId(confirmDelete.id);
      await deleteMutation.mutateAsync(confirmDelete.id);
      toast({ title: "Category deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Categories</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={bulkAction} onValueChange={setBulkAction}>
          <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleApply}
          disabled={bulkDeleteMutation.isPending}
          className="bg-red-700 hover:bg-red-600 text-white h-10 px-5 rounded-lg font-semibold"
        >
          Apply
        </Button>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
          />
        </div>
        <Button
          onClick={() => setLocation("/categories/new")}
          className="bg-red-600 hover:bg-red-700 text-white h-10 gap-2 rounded-lg px-5 font-semibold"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Category</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Content</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-10">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-10">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((category) => (
                <TableRow key={category.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(category.id)}
                      onCheckedChange={() => toggleSelect(category.id)}
                      className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="text-white font-medium text-sm">{category.name}</p>
                    {category.description && (
                      <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{category.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        category.active
                          ? "bg-green-500/15 text-green-400"
                          : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {category.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">{category.contentCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/categories/${category.id}/shows`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 transition-colors"
                        title="View Shows"
                      >
                        <Film className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setLocation(`/categories/${category.id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(category)}
                        disabled={deletingId === category.id}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page === 1}
              className="h-8 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  pagination.page === i + 1
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page === pagination.pages}
              className="h-8 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
