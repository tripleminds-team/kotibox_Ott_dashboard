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

type AccessType = "paid" | "free" | "pay_per_view";

type MovieRow = {
  _id: string;
  title: string;
  thumbnail: string;
  genres: string[];
  releaseDate?: string;
  likes: number;
  watches: number;
  access: AccessType;
  plan: string;
  language: string;
  status: boolean;
  restricted: boolean;
};

const MOCK_MOVIES: MovieRow[] = [
  {
    _id: "1", title: "The Silent Sentinel", thumbnail: "",
    genres: ["Historical", "Thriller"], likes: 0, watches: 1,
    access: "pay_per_view", plan: "-", language: "English", status: true, restricted: false,
  },
  {
    _id: "2", title: "Hearts of Valor", thumbnail: "",
    genres: ["Animation", "Horror", "Thriller"], releaseDate: "2025-07-31",
    likes: 1, watches: 1, access: "free", plan: "-", language: "English", status: true, restricted: true,
  },
  {
    _id: "3", title: "Bluey", thumbnail: "",
    genres: ["Action", "Thriller"], releaseDate: "2025-07-27",
    likes: 0, watches: 1, access: "free", plan: "-", language: "English", status: true, restricted: false,
  },
  {
    _id: "4", title: "Against All Odds", thumbnail: "",
    genres: ["Historical", "Romantic", "Inspirational"], likes: 0, watches: 2,
    access: "paid", plan: "Basic", language: "English", status: true, restricted: false,
  },
  {
    _id: "5", title: "Neon Prophecy", thumbnail: "",
    genres: ["Sci-Fi", "Action"], likes: 5, watches: 12,
    access: "paid", plan: "Premium", language: "English", status: false, restricted: false,
  },
];

const ACCESS_BADGE: Record<AccessType, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-blue-500/20 text-blue-400" },
  free: { label: "Free", className: "bg-green-500/20 text-green-400" },
  pay_per_view: { label: "Pay Per View", className: "bg-zinc-700/80 text-zinc-300" },
};

export default function MoviesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [movies, setMovies] = useState<MovieRow[]>(MOCK_MOVIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<MovieRow | null>(null);

  const filtered = movies.filter((m) => {
    const matchSearch = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && m.status) ||
      (statusFilter === "inactive" && !m.status);
    return matchSearch && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.includes(m._id));

  const toggleAll = () =>
    allSelected ? setSelectedIds([]) : setSelectedIds(filtered.map((m) => m._id));

  const toggleOne = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleToggleStatus = (id: string) =>
    setMovies((prev) => prev.map((m) => (m._id === id ? { ...m, status: !m.status } : m)));

  const handleToggleRestricted = (id: string) =>
    setMovies((prev) => prev.map((m) => (m._id === id ? { ...m, restricted: !m.restricted } : m)));

  const handleDelete = () => {
    if (!confirmDelete) return;
    setMovies((prev) => prev.filter((m) => m._id !== confirmDelete._id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete._id));
    toast({ title: "Movie deleted successfully!" });
    setConfirmDelete(null);
  };

  const handleApplyBulk = () => {
    if (bulkAction === "delete" && selectedIds.length > 0) {
      setMovies((prev) => prev.filter((m) => !selectedIds.includes(m._id)));
      toast({ title: `${selectedIds.length} movie(s) deleted.` });
      setSelectedIds([]);
    } else if (bulkAction === "activate" && selectedIds.length > 0) {
      setMovies((prev) => prev.map((m) => selectedIds.includes(m._id) ? { ...m, status: true } : m));
      toast({ title: `${selectedIds.length} movie(s) activated.` });
    } else if (bulkAction === "deactivate" && selectedIds.length > 0) {
      setMovies((prev) => prev.map((m) => selectedIds.includes(m._id) ? { ...m, status: false } : m));
      toast({ title: `${selectedIds.length} movie(s) deactivated.` });
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">Movies</span>
      </div>

      {/* Toolbar */}
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
        <Button
          variant="outline"
          className="bg-card border-border text-foreground h-10 gap-2 rounded-lg text-sm hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          className="bg-card border-border text-foreground h-10 gap-2 rounded-lg text-sm hover:bg-muted"
        >
          <Upload className="h-4 w-4" />
          Import
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

        <Button
          variant="outline"
          className="bg-card border-border text-foreground h-10 gap-2 rounded-lg text-sm hover:bg-muted"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filter
        </Button>

        <Button
          onClick={() => setLocation("/movies/new")}
          className="bg-red-600 hover:bg-red-700 text-white h-10 gap-2 rounded-lg px-5 font-semibold text-sm"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Table */}
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
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide min-w-[200px]">Movie</TableHead>
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
                <TableCell colSpan={10} className="text-center text-zinc-500 py-14">
                  No movies yet
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((movie) => {
                const badge = ACCESS_BADGE[movie.access];
                return (
                  <TableRow key={movie._id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(movie._id)}
                        onCheckedChange={() => toggleOne(movie._id)}
                        className="border-border data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-11 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
                          {movie.thumbnail ? (
                            <img src={movie.thumbnail} alt={movie.title} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium text-sm">{movie.title}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {movie.genres.map((g) => (
                              <span key={g} className="text-xs text-zinc-500">{g}</span>
                            ))}
                          </div>
                          {movie.releaseDate && (
                            <p className="text-xs text-zinc-600 mt-0.5">{movie.releaseDate}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{movie.likes}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{movie.watches}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{movie.plan}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{movie.language}</TableCell>
                    <TableCell>
                      <Switch
                        checked={movie.status}
                        onCheckedChange={() => handleToggleStatus(movie._id)}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={movie.restricted}
                        onCheckedChange={() => handleToggleRestricted(movie._id)}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLocation(`/movies/${movie._id}/edit`)}
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
                          onClick={() => setConfirmDelete(movie)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movie</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted">
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
