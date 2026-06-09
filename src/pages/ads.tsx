import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useGetAds, useUpdateAd, useDeleteAd } from "@/lib/api-client";

type AdRow = {
  _id: string;
  title: string;
  description?: string;
  type: string;
  isActive: boolean;
  views: number;
  clicks: number;
  priority: number;
};

export default function AdsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdRow | null>(null);

  const { data: adsData, isLoading } = useGetAds({ admin: true });
  const deleteMutation = useDeleteAd();
  const updateMutation = useUpdateAd();

  const ads: AdRow[] = adsData?.data || [];
  const activeCount = ads.filter((ad) => ad.isActive).length;

  const handleToggleActive = async (ad: AdRow) => {
    try {
      await updateMutation.mutateAsync({ id: ad._id, data: { isActive: !ad.isActive } });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: `Ad ${!ad.isActive ? "activated" : "deactivated"} successfully!` });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeletingId(confirmDelete._id);
      await deleteMutation.mutateAsync(confirmDelete._id);
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: "Ad deleted successfully!" });
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
        <span className="text-white font-medium">Ads</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-sm">{ads.length} total · {activeCount} active</p>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="text-zinc-400 font-semibold text-sm">Ad</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Type</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Views / Clicks</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Priority</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  Loading ads...
                </TableCell>
              </TableRow>
            ) : ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  No ads yet
                </TableCell>
              </TableRow>
            ) : (
              ads.map((ad) => (
                <TableRow key={ad._id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <p className="text-white font-medium text-sm">{ad.title}</p>
                    {ad.description && (
                      <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{ad.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-700 text-zinc-300">
                      {ad.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">
                    {ad.views} / {ad.clicks}
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">{ad.priority}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        ad.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {ad.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/ads/${ad._id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(ad)}
                        disabled={updateMutation.isPending}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-40"
                        title={ad.isActive ? "Deactivate" : "Activate"}
                      >
                        {ad.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(ad)}
                        disabled={deletingId === ad._id}
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
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
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
