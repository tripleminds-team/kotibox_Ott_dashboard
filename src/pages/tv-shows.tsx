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

type TvShowRow = {
  _id: string;
  title: string;
  thumbnail: string;
  genres: string[];
  releaseDate?: string;
  likes: number | string;
  watches: number;
  access: AccessType;
  plan: string;
  language: string;
  status: boolean;
  restricted: boolean;
};

const MOCK_TV_SHOWS: TvShowRow[] = [
  {
    _id: "1", title: "The Smiling doll", thumbnail: "",
    genres: ["Horror", "Action", "Comedy"], releaseDate: "2019-04-23",
    likes: 3, watches: 4, access: "free", plan: "-", language: "English", status: true, restricted: false,
  },
  {
    _id: "2", title: "Gunslinger's Justice", thumbnail: "",
    genres: ["Animation", "Historical", "Inspirational"], releaseDate: "2026-07-02",
    likes: "-", watches: 1, access: "paid", plan: "Basic", language: "English", status: true, restricted: true,
  },
  {
    _id: "3", title: "Raziel's Daring Rescue", thumbnail: "",
    genres: ["Animation", "Romantic", "Thriller"], releaseDate: "2026-06-30",
    likes: "-", watches: 1, access: "paid", plan: "Premium Plan", language: "English", status: true, restricted: true,
  },
  {
    _id: "4", title: "Shadow Pursuit", thumbnail: "",
    genres: ["Thriller", "Inspirational", "Historical"], releaseDate: "2026-06-15",
    likes: 1, watches: 3, access: "paid", plan: "Ultimate Plan", language: "English", status: true, restricted: false,
  },
  {
    _id: "5", title: "Neon Dreams", thumbnail: "",
    genres: ["Sci-Fi", "Romance"], releaseDate: "2025-11-20",
    likes: 12, watches: 28, access: "free", plan: "-", language: "English", status: false, restricted: false,
  },
];

const ACCESS_BADGE: Record<AccessType, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-blue-500/20 text-blue-400" },
  free: { label: "Free", className: "bg-green-500/20 text-green-400" },
};

export default function TvShowsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shows, setShows] = useState<TvShowRow[]>(MOCK_TV_SHOWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<TvShowRow | null>(null);

  const filtered = shows.filter((s) => {
    const matchSearch = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.status) ||
      (statusFilter === "inactive" && !s.status);
    return matchSearch && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.includes(s._id));

  const toggleAll = () =>
    allSelected ? setSelectedIds([]) : setSelectedIds(filtered.map((s) => s._id));

  const toggleOne = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleToggleStatus = (id: string) =>
    setShows((prev) => prev.map((s) => (s._id === id ? { ...s, status: !s.status } : s)));

  const handleToggleRestricted = (id: string) =>
    setShows((prev) => prev.map((s) => (s._id === id ? { ...s, restricted: !s.restricted } : s)));

  const handleDelete = () => {
    if (!confirmDelete) return;
    setShows((prev) => prev.filter((s) => s._id !== confirmDelete._id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete._id));
    toast({ title: "TV Show deleted successfully!" });
    setConfirmDelete(null);
  };

  const handleApplyBulk = () => {
    if (bulkAction === "delete" && selectedIds.length > 0) {
      setShows((prev) => prev.filter((s) => !selectedIds.includes(s._id)));
      toast({ title: `${selectedIds.length} TV show(s) deleted.` });
      setSelectedIds([]);
    } else if (bulkAction === "activate" && selectedIds.length > 0) {
      setShows((prev) => prev.map((s) => selectedIds.includes(s._id) ? { ...s, status: true } : s));
      toast({ title: `${selectedIds.length} TV show(s) activated.` });
    } else if (bulkAction === "deactivate" && selectedIds.length > 0) {
      setShows((prev) => prev.map((s) => selectedIds.includes(s._id) ? { ...s, status: false } : s));
      toast({ title: `${selectedIds.length} TV show(s) deactivated.` });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">TV Shows</span>
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
        <Button
          onClick={handleApplyBulk}
          className="bg-red-600 hover:bg-red-700 text-white h-10 px-5 rounded-lg font-semibold text-sm"
        >
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
          onClick={() => setLocation("/tv-shows/new")}
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
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide min-w-[220px]">TV Show</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Like</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Watch</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Access</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Plan</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Language</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Restricted Content</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-zinc-500 py-14">No TV shows yet</TableCell>
              </TableRow>
            ) : (
              filtered.map((show) => {
                const badge = ACCESS_BADGE[show.access];
                return (
                  <TableRow key={show._id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(show._id)}
                        onCheckedChange={() => toggleOne(show._id)}
                        className="border-border data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-11 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
                          {show.thumbnail ? (
                            <img src={show.thumbnail} alt={show.title} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium text-sm">{show.title}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {show.genres.map((g) => (
                              <span key={g} className="text-xs text-zinc-500">{g}</span>
                            ))}
                          </div>
                          {show.releaseDate && (
                            <p className="text-xs text-zinc-600 mt-0.5">{show.releaseDate}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{show.likes}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{show.watches}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{show.plan}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{show.language}</TableCell>
                    <TableCell>
                      <Switch
                        checked={show.status}
                        onCheckedChange={() => handleToggleStatus(show._id)}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={show.restricted}
                        onCheckedChange={() => handleToggleRestricted(show._id)}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLocation(`/tv-shows/${show._id}/edit`)}
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
                          onClick={() => setConfirmDelete(show)}
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
            <AlertDialogTitle>Delete TV Show</AlertDialogTitle>
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
