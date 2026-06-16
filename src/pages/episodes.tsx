import { useState } from "react";
import { useLocation } from "wouter";
import {
  Edit2, Eye, Trash2, Search, Plus, Download, Upload,
  SlidersHorizontal, ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type AccessType = "paid" | "free";

type EpisodeRow = {
  _id: string;
  thumbnail: string;
  title: string;
  episodeNumber: number;
  seasonName: string;
  showName: string;
  duration: string;
  access: AccessType;
  status: boolean;
};

const MOCK_EPISODES: EpisodeRow[] = [
  { _id: "1", thumbnail: "", title: "The Beginning", episodeNumber: 1, seasonName: "Season 1", showName: "The Smiling doll", duration: "45:00", access: "free", status: true },
  { _id: "2", thumbnail: "", title: "The Awakening", episodeNumber: 2, seasonName: "Season 1", showName: "The Smiling doll", duration: "42:30", access: "free", status: true },
  { _id: "3", thumbnail: "", title: "First Encounter", episodeNumber: 1, seasonName: "Season 1", showName: "Gunslinger's Justice", duration: "52:00", access: "paid", status: true },
  { _id: "4", thumbnail: "", title: "The Desert Run", episodeNumber: 2, seasonName: "Season 1", showName: "Gunslinger's Justice", duration: "49:15", access: "paid", status: true },
  { _id: "5", thumbnail: "", title: "The Journey Begins", episodeNumber: 1, seasonName: "Season 1", showName: "Raziel's Daring Rescue", duration: "48:15", access: "paid", status: false },
];

const ACCESS_BADGE: Record<AccessType, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-blue-500/20 text-blue-400" },
  free: { label: "Free", className: "bg-green-500/20 text-green-400" },
};

export default function EpisodesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [episodes, setEpisodes] = useState<EpisodeRow[]>(MOCK_EPISODES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<EpisodeRow | null>(null);

  const filtered = episodes.filter((ep) => {
    const matchSearch =
      !searchQuery ||
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.showName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && ep.status) ||
      (statusFilter === "inactive" && !ep.status);
    return matchSearch && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((ep) => selectedIds.includes(ep._id));

  const toggleAll = () =>
    allSelected ? setSelectedIds([]) : setSelectedIds(filtered.map((ep) => ep._id));

  const toggleOne = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleToggleStatus = (id: string) =>
    setEpisodes((prev) => prev.map((ep) => (ep._id === id ? { ...ep, status: !ep.status } : ep)));

  const handleDelete = () => {
    if (!confirmDelete) return;
    setEpisodes((prev) => prev.filter((ep) => ep._id !== confirmDelete._id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete._id));
    toast({ title: "Episode deleted successfully!" });
    setConfirmDelete(null);
  };

  const handleApplyBulk = () => {
    if (bulkAction === "delete" && selectedIds.length > 0) {
      setEpisodes((prev) => prev.filter((ep) => !selectedIds.includes(ep._id)));
      toast({ title: `${selectedIds.length} episode(s) deleted.` });
      setSelectedIds([]);
    } else if (bulkAction === "activate" && selectedIds.length > 0) {
      setEpisodes((prev) => prev.map((ep) => selectedIds.includes(ep._id) ? { ...ep, status: true } : ep));
      toast({ title: `${selectedIds.length} episode(s) activated.` });
    } else if (bulkAction === "deactivate" && selectedIds.length > 0) {
      setEpisodes((prev) => prev.map((ep) => selectedIds.includes(ep._id) ? { ...ep, status: false } : ep));
      toast({ title: `${selectedIds.length} episode(s) deactivated.` });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">Episodes</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={bulkAction} onValueChange={setBulkAction}>
          <SelectTrigger className="w-36 bg-card border-border text-foreground h-10 rounded-lg text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground">
            <SelectItem value="action">Action</SelectItem>
            <SelectItem value="delete">Delete Selected</SelectItem>
            <SelectItem value="activate">Activate</SelectItem>
            <SelectItem value="deactivate">Deactivate</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleApplyBulk} className="bg-red-600 hover:bg-red-700 text-white h-10 px-5 rounded-lg font-semibold text-sm">
          Apply
        </Button>
        <Button variant="outline" className="bg-card border-border text-foreground h-10 gap-2 rounded-lg text-sm hover:bg-muted">
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button variant="outline" className="bg-card border-border text-foreground h-10 gap-2 rounded-lg text-sm hover:bg-muted">
          <Upload className="h-4 w-4" /> Import
        </Button>

        <div className="flex-1" />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 bg-card border-border text-foreground h-10 rounded-lg text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-card border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm focus:border-red-500"
          />
        </div>

        <Button variant="outline" className="bg-card border-border text-foreground h-10 gap-2 rounded-lg text-sm hover:bg-muted">
          <SlidersHorizontal className="h-4 w-4" /> Advanced Filter
        </Button>

        <Button
          onClick={() => setLocation("/episodes/new")}
          className="bg-red-600 hover:bg-red-700 text-white h-10 gap-2 rounded-lg px-5 font-semibold text-sm"
        >
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-card hover:bg-card">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  className="border-border data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide min-w-[200px]">Episode</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Season</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">TV Show</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Duration</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Access</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-500 py-14">No episodes yet</TableCell>
              </TableRow>
            ) : (
              filtered.map((ep) => {
                const badge = ACCESS_BADGE[ep.access];
                return (
                  <TableRow key={ep._id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(ep._id)}
                        onCheckedChange={() => toggleOne(ep._id)}
                        className="border-border data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-20 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
                          {ep.thumbnail ? (
                            <img src={ep.thumbnail} alt={ep.title} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium text-sm">{ep.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Episode {ep.episodeNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{ep.seasonName}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{ep.showName}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{ep.duration}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ep.status}
                        onCheckedChange={() => handleToggleStatus(ep._id)}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLocation(`/episodes/${ep._id}/edit`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 transition-colors"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(ep)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors"
                          title="Delete"
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
              Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
