
import { useState } from "react";
import { useLocation } from "wouter";
import { Edit2, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useGetPromotionsList, useDeletePromotion } from "../lib/api-client";

export default function PromotionsList() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [page] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data, isLoading } = useGetPromotionsList({ page, limit: 20 });
  const deleteMutation = useDeletePromotion();

  const promotions = data?.data || [];
  const filtered = promotions.filter((p: any) =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => {
        toast({ title: "Promotion deleted successfully" });
        setConfirmDelete(null);
      },
      onError: () => {
        toast({ title: "Failed to delete promotion", variant: "destructive" });
        setConfirmDelete(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Promotions</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
          onClick={() => setLocation("/promotions/new")}
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
              <TableHead className="text-zinc-400 font-semibold text-sm">Title</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Order</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500 py-10">
                  Loading promotions...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500 py-10">
                  No promotions found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((promotion: any) => (
                <TableRow key={promotion.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell className="text-white font-medium text-sm">{promotion.title}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        promotion.isActive
                          ? "bg-green-500/15 text-green-400"
                          : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {promotion.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">{promotion.order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/promotions/${promotion.id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(promotion)}
                        disabled={deleteMutation.isPending}
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

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
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
