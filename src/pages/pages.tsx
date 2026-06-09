import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2, Search } from "lucide-react";
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
import { useGetPages, useUpdatePage, useDeletePage, useBulkDeletePages } from "@/lib/api-client";

type PageRow = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export default function PagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PageRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: pagesData, isLoading } = useGetPages({ page: currentPage, limit: itemsPerPage });
  const deleteMutation = useDeletePage();
  const updateMutation = useUpdatePage();
  const bulkDeleteMutation = useBulkDeletePages();

  const pages: PageRow[] = pagesData?.data || [];
  const pagination = pagesData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

  const filtered = pages.filter((p) =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p._id));

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : filtered.map((p) => p._id));
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
        toast({ title: "Pages deleted successfully!" });
      } catch {
        toast({ title: "Bulk delete failed", variant: "destructive" });
      }
    }
    setBulkAction("");
  };

  const handleToggleActive = async (page: PageRow) => {
    try {
      const newStatus = page.status === "published" ? "draft" : "published";
      await updateMutation.mutateAsync({ id: page._id, data: { status: newStatus } });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({ title: `Page ${newStatus === "published" ? "activated" : "deactivated"} successfully!` });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeletingId(confirmDelete._id);
      await deleteMutation.mutateAsync(confirmDelete._id);
      toast({ title: "Page deleted successfully!" });
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
        <span className="text-white font-medium">Pages</span>
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
          onClick={() => setLocation("/pages/new")}
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
              <TableHead className="text-zinc-400 font-semibold text-sm">Name</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Slug</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Order</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  Loading pages...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  No pages yet
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((page) => (
                <TableRow key={page._id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(page._id)}
                      onCheckedChange={() => toggleSelect(page._id)}
                      className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell className="text-white font-medium text-sm">{page.title}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{page.slug}</TableCell>
                  <TableCell>
                    <Switch
                      checked={page.status === "published"}
                      onCheckedChange={() => handleToggleActive(page)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">{page.order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/pages/${page._id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(page)}
                        disabled={deletingId === page._id}
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
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be undone.
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
