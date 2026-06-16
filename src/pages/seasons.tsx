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

type SeasonRow = {
  _id: string;
  thumbnail: string;
  seasonNumber: number;
  title: string;
  showName: string;
  episodeCount: number;
  status: boolean;
};

const MOCK_SEASONS: SeasonRow[] = [
  { _id: "1", thumbnail: "", seasonNumber: 1, title: "Season 1", showName: "The Smiling doll", episodeCount: 8, status: true },
  { _id: "2", thumbnail: "", seasonNumber: 2, title: "Season 2", showName: "The Smiling doll", episodeCount: 6, status: true },
  { _id: "3", thumbnail: "", seasonNumber: 1, title: "Season 1", showName: "Gunslinger's Justice", episodeCount: 10, status: true },
  { _id: "4", thumbnail: "", seasonNumber: 1, title: "Season 1", showName: "Raziel's Daring Rescue", episodeCount: 12, status: false },
  { _id: "5", thumbnail: "", seasonNumber: 1, title: "Season 1", showName: "Shadow Pursuit", episodeCount: 5, status: true },
];

export default function SeasonsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [seasons, setSeasons] = useState<SeasonRow[]>(MOCK_SEASONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<SeasonRow | null>(null);

  const filtered = seasons.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.showName.toLowerCase().includes(searchQuery.toLowerCase());
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
    setSeasons((prev) => prev.map((s) => (s._id === id ? { ...s, status: !s.status } : s)));

  const handleDelete = () => {
    if (!confirmDelete) return;
    setSeasons((prev) => prev.filter((s) => s._id !== confirmDelete._id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete._id));
    toast({ title: "Season deleted successfully!" });
    setConfirmDelete(null);
  };

  const handleApplyBulk = () => {
    if (bulkAction === "delete" && selectedIds.length > 0) {
      setSeasons((prev) => prev.filter((s) => !selectedIds.includes(s._id)));
      toast({ title: `${selectedIds.length} season(s) deleted.` });
      setSelectedIds([]);
    } else if (bulkAction === "activate" && selectedIds.length > 0) {
      setSeasons((prev) => prev.map((s) => selectedIds.includes(s._id) ? { ...s, status: true } : s));
      toast({ title: `${selectedIds.length} season(s) activated.` });
    } else if (bulkAction === "deactivate" && selectedIds.length > 0) {
      setSeasons((prev) => prev.map((s) => selectedIds.includes(s._id) ? { ...s, status: false } : s));
      toast({ title: `${selectedIds.length} season(s) deactivated.` });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">Seasons</span>
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
          onClick={() => setLocation("/seasons/new")}
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
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide min-w-[220px]">Season</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">TV Show</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Episodes</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-xs uppercase tracking-wide">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-14">No seasons yet</TableCell>
              </TableRow>
            ) : (
              filtered.map((season) => (
                <TableRow key={season._id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(season._id)}
                      onCheckedChange={() => toggleOne(season._id)}
                      className="border-border data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
                        {season.thumbnail ? (
                          <img src={season.thumbnail} alt={season.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{season.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Season {season.seasonNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{season.showName}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                      {season.episodeCount} Episodes
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={season.status}
                      onCheckedChange={() => handleToggleStatus(season._id)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/seasons/${season._id}/edit`)}
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
                        onClick={() => setConfirmDelete(season)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors"
                        title="Delete"
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
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.title}" of "{confirmDelete?.showName}"? This action cannot be undone.
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
