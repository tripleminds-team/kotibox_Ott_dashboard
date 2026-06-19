import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Trash2, Search, Filter, Download, Plus, ChevronDown } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useGetAds, useUpdateAd, useDeleteAd, useBulkDeleteAds } from "@/lib/api-client";

type AdRow = {
  _id: string;
  adName: string;
  adType: string;
  placement: string;
  redirectUrl?: string;
  targetContentType?: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function AdsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [action, setAction] = useState<string>("");

  const { data: adsData, isLoading } = useGetAds();
  const deleteMutation = useDeleteAd();
  const updateMutation = useUpdateAd();
  const bulkDeleteMutation = useBulkDeleteAds();

  const ads: AdRow[] = adsData?.data || [];

  const handleToggleStatus = async (ad: AdRow) => {
    try {
      const newStatus = ad.status === 'active' ? 'inactive' : 'active';
      await updateMutation.mutateAsync({ id: ad._id, data: { status: newStatus } });
      toast({ title: `Ad ${newStatus === 'active' ? "activated" : "deactivated"} successfully!` });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeletingId(confirmDelete._id);
      await deleteMutation.mutateAsync(confirmDelete._id);
      toast({ title: "Ad deleted successfully!" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(ads.map(ad => ad._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApplyAction = async () => {
    if (action === "delete" && selectedIds.length > 0) {
      if (confirm(`Are you sure you want to delete ${selectedIds.length} ads?`)) {
        try {
          await bulkDeleteMutation.mutateAsync(selectedIds);
          toast({ title: `${selectedIds.length} ads deleted successfully!` });
          setSelectedIds([]);
          setAction("");
        } catch {
          toast({ title: "Bulk delete failed", variant: "destructive" });
        }
      }
    }
  };

  const handleExport = () => {
    if (!ads.length) return toast({ title: "No data to export", variant: "destructive" });
    const headers = ["Ad Name", "Ad Type", "Placement", "Target Content Type", "Start Date", "End Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...ads.map(ad => [
        `"${ad.adName || ''}"`,
        `"${ad.adType || ''}"`,
        `"${ad.placement || ''}"`,
        `"${ad.targetContentType || ''}"`,
        `"${new Date(ad.startDate).toISOString().split('T')[0]}"`,
        `"${new Date(ad.endDate).toISOString().split('T')[0]}"`,
        `"${ad.status || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-foreground bg-[#0f1115] min-h-screen p-6 -m-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Custom Ads</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select 
            className="bg-[#1a1d24] border border-zinc-800 text-zinc-300 hover:bg-[#252830] rounded-md px-3 py-2 text-sm outline-none"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">Action</option>
            <option value="delete">Delete Selected</option>
          </select>
          <Button 
            onClick={handleApplyAction} 
            disabled={bulkDeleteMutation.isPending || selectedIds.length === 0 || !action}
            className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
          >
            {bulkDeleteMutation.isPending ? "Deleting..." : "Apply"}
          </Button>
          <Button onClick={handleExport} variant="outline" className="bg-[#1a1d24] border-zinc-800 text-zinc-300 hover:bg-[#252830]">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-[250px] bg-[#1a1d24] border-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>
          <Button variant="outline" className="bg-[#1a1d24] border-zinc-800 text-zinc-300 hover:bg-[#252830]">
            <Filter className="mr-2 h-4 w-4" /> Advanced Filter
          </Button>
          <Button onClick={() => setLocation('/ads/new')} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#1a1d24]">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-12 text-center text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                <input 
                  type="checkbox" 
                  className="rounded bg-zinc-800 border-zinc-700" 
                  checked={ads.length > 0 && selectedIds.length === ads.length}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Ad Name</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Ad Type</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Ad Placement</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Redirect URL</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Target Content Type</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Start Date</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">End Date</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-zinc-500 py-10">Loading ads...</TableCell>
              </TableRow>
            ) : ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-zinc-500 py-10">No ads yet</TableCell>
              </TableRow>
            ) : (
              ads.map((ad) => (
                <TableRow key={ad._id} className="border-zinc-800 hover:bg-[#252830]">
                  <TableCell className="text-center">
                    <input 
                      type="checkbox" 
                      className="rounded bg-zinc-800 border-zinc-700" 
                      checked={selectedIds.includes(ad._id)}
                      onChange={() => handleSelectOne(ad._id)}
                    />
                  </TableCell>
                  <TableCell className="text-white font-medium text-sm">{ad.adName}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{ad.adType}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{ad.placement}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{ad.redirectUrl || '--'}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{ad.targetContentType || '--'}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{new Date(ad.startDate).toISOString().split('T')[0]}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{new Date(ad.endDate).toISOString().split('T')[0]}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={ad.status === 'active'} 
                      onCheckedChange={() => handleToggleStatus(ad)} 
                      disabled={updateMutation.isPending}
                      className="data-[state=checked]:bg-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLocation(`/ads/${ad._id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(ad)}
                        disabled={deletingId === ad._id}
                        className="h-8 w-8 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <AlertDialogContent className="bg-[#1a1d24] border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.adName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#252830] border-zinc-800 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-primary hover:bg-primary/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
