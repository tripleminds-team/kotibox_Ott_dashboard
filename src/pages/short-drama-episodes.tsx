import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Eye, Trash2, Search, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  useGetEpisodeList, useDeleteEpisode, useToggleEpisodeLock, getImageUrl,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

type EpisodeRow = {
  _id: string;
  id: string;
  thumbnail: string;
  title: string;
  episode: number;
  season: number;
  showName: string;
  duration?: number;
  isFree: boolean;
  isLocked: boolean;
  processingStatus: string;
  contentId: any;
};

const formatDuration = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds)) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function ShortDramaEpisodesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialContentId = params.get("contentId") || "";
  const initialSeason = params.get("season") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<EpisodeRow | null>(null);

  const { data: episodesData, isLoading } = useGetEpisodeList({
    contentType: "drama",
    ...(initialContentId ? { contentId: initialContentId } : {}),
    ...(initialSeason ? { season: Number(initialSeason) } : {}),
  });
  const deleteMutation = useDeleteEpisode();
  const lockMutation = useToggleEpisodeLock();

  const episodes: EpisodeRow[] = episodesData?.data || [];

  const filtered = episodes.filter((ep) => {
    const matchesSearch =
      !searchQuery ||
      ep.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.showName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && ep.processingStatus === "ready") ||
      (statusFilter === "inactive" && ep.processingStatus !== "ready");
    const matchesAccess =
      accessFilter === "all" ||
      (accessFilter === "free" && ep.isFree) ||
      (accessFilter === "paid" && !ep.isFree);
    return matchesSearch && matchesStatus && matchesAccess;
  });

  const handleToggleAccess = async (ep: EpisodeRow) => {
    try {
      const epId = ep._id || ep.id;
      await lockMutation.mutateAsync({ id: epId, isLocked: ep.isFree });
      queryClient.invalidateQueries({ queryKey: ["episode-list"] });
      toast({ title: "Episode access updated" });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete._id || confirmDelete.id);
      queryClient.invalidateQueries({ queryKey: ["episode-list"] });
      queryClient.invalidateQueries({ queryKey: ["season-list"] });
      toast({ title: "Episode deleted successfully" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleBulkAction = () => {
    if (selectedIds.length === 0) {
      toast({ title: "No episodes selected", variant: "destructive" });
      return;
    }
    toast({ title: `Bulk action executed on ${selectedIds.length} episodes` });
    setSelectedIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((e) => e._id || e.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-gray-500">Short Dramas</span>
        <span>/</span>
        <span className="text-foreground font-medium">Episodes</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-zinc-400 text-sm">{episodes.length} total episodes</p>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-primary h-10 rounded-lg"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-card border-border text-foreground h-10 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Ready</SelectItem>
            <SelectItem value="inactive">Processing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={accessFilter} onValueChange={setAccessFilter}>
          <SelectTrigger className="w-32 bg-card border-border text-foreground h-10 rounded-lg">
            <SelectValue placeholder="Access" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <>
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-40 bg-card border-border text-foreground h-10 rounded-lg">
                <SelectValue placeholder="Bulk action" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleBulkAction}
              className="bg-primary hover:bg-primary/90 text-foreground h-10 rounded-lg"
            >
              Apply
            </Button>
          </>
        )}
        <Button
          onClick={() => setLocation("/short-dramas/new")}
          className="bg-primary hover:bg-primary/90 text-foreground h-10 gap-2 rounded-lg px-5 font-semibold"
        >
          <Plus className="h-4 w-4" />
          New Drama
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-card hover:bg-card">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === filtered.length && filtered.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Episode</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Short Drama</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Season</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Duration</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Access</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-500 py-10">
                  Loading episodes...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-500 py-10">
                  No episodes found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ep) => {
                const epId = ep._id || ep.id;
                const dramaId =
                  typeof ep.contentId === "object" ? ep.contentId?._id : ep.contentId;
                return (
                  <TableRow key={epId} className="border-border hover:bg-muted/40">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(epId)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(epId, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-12 overflow-hidden rounded-lg border border-border bg-muted shrink-0">
                          {ep.thumbnail && (
                            <img
                              src={getImageUrl(ep.thumbnail)}
                              alt={ep.title}
                              className="h-full w-full object-contain"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium text-sm">{ep.title}</p>
                          <p className="text-zinc-500 text-xs">Episode {ep.episode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">{ep.showName}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">Season {ep.season}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">
                      {formatDuration(ep.duration)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ep.isFree
                            ? "bg-green-500/20 text-green-400"
                            : "bg-primary/20 text-blue-400"
                        }`}
                      >
                        {ep.isFree ? "Free" : "Paid"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          ep.processingStatus === "ready"
                            ? "bg-green-500/15 text-green-400"
                            : ep.processingStatus === "failed"
                            ? "bg-primary/15 text-primary"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {ep.processingStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => dramaId && setLocation(`/short-dramas/${dramaId}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/15 text-blue-400 hover:bg-primary/80/30 transition-colors"
                          title="View Drama"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleAccess(ep)}
                          disabled={lockMutation.isPending}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-purple-600/15 text-purple-400 hover:bg-purple-600/30 transition-colors"
                          title={ep.isFree ? "Make Paid" : "Make Free"}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(ep)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/80/30 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-primary hover:bg-primary/90 text-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
