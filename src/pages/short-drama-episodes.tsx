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

export default function ShortDramaEpisodesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [episodes, setEpisodes] = useState<EpisodeRow[]>(MOCK_EPISODES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<EpisodeRow | null>(null);

  const filtered = episodes.filter((episode) => {
    const matchesSearch = !searchQuery || 
      episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.showName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.seasonName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && episode.status) ||
      (statusFilter === "inactive" && !episode.status);
    const matchesAccess = accessFilter === "all" || episode.access === accessFilter;
    return matchesSearch && matchesStatus && matchesAccess;
  });

  const handleToggleStatus = (episode: EpisodeRow) => {
    setEpisodes(episodes.map(e => 
      e._id === episode._id ? { ...e, status: !e.status } : e
    ));
    toast({ title: `Episode ${episode.status ? "deactivated" : "activated"} successfully` });
  };

  const handleToggleAccess = (episode: EpisodeRow) => {
    const newAccess: AccessType = episode.access === "free" ? "paid" : "free";
    setEpisodes(episodes.map(e => 
      e._id === episode._id ? { ...e, access: newAccess } : e
    ));
    toast({ title: `Episode access changed to ${newAccess}` });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setEpisodes(episodes.filter(e => e._id !== confirmDelete._id));
    setConfirmDelete(null);
    toast({ title: "Episode deleted successfully" });
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
    if (checked) {
      setSelectedIds(filtered.map(e => e._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
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
            className="pl-9 w-52 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-card border-border text-foreground h-10 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
                <SelectItem value="activate">Activate</SelectItem>
                <SelectItem value="deactivate">Deactivate</SelectItem>
                <SelectItem value="make-free">Make Free</SelectItem>
                <SelectItem value="make-paid">Make Paid</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAction} className="bg-blue-600 hover:bg-blue-700 text-foreground h-10 rounded-lg">
              Apply
            </Button>
          </>
        )}
        <Button onClick={() => setLocation("/short-drama-episodes/new")} className="bg-red-600 hover:bg-red-700 text-foreground h-10 gap-2 rounded-lg px-5 font-semibold">
          <Plus className="h-4 w-4" />
          New Episode
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-500 py-10">
                  No episodes found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((episode) => (
                <TableRow key={episode._id} className="border-border hover:bg-muted/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(episode._id)}
                      onCheckedChange={(checked) => handleSelectOne(episode._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 overflow-hidden rounded-lg border border-border bg-muted shrink-0">
                        {episode.thumbnail && (
                          <img
                            src={episode.thumbnail}
                            alt={episode.title}
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{episode.title}</p>
                        <p className="text-zinc-500 text-xs">Episode {episode.episodeNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">{episode.showName}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{episode.seasonName}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{episode.duration}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACCESS_BADGE[episode.access].className}`}>
                      {ACCESS_BADGE[episode.access].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={episode.status}
                      onCheckedChange={() => handleToggleStatus(episode)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/short-drama-episodes/${episode._id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setLocation(`/short-drama-episodes/${episode._id}/edit`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleAccess(episode)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-purple-600/15 text-purple-400 hover:bg-purple-600/30 transition-colors"
                        title={episode.access === "free" ? "Make Paid" : "Make Free"}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(episode)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors"
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
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
