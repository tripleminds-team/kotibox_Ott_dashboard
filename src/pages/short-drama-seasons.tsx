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

export default function ShortDramaSeasonsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [seasons, setSeasons] = useState<SeasonRow[]>(MOCK_SEASONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<SeasonRow | null>(null);

  const filtered = seasons.filter((season) => {
    const matchesSearch = !searchQuery || 
      season.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      season.showName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && season.status) ||
      (statusFilter === "inactive" && !season.status);
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (season: SeasonRow) => {
    setSeasons(seasons.map(s => 
      s._id === season._id ? { ...s, status: !s.status } : s
    ));
    toast({ title: `Season ${season.status ? "deactivated" : "activated"} successfully` });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setSeasons(seasons.filter(s => s._id !== confirmDelete._id));
    setConfirmDelete(null);
    toast({ title: "Season deleted successfully" });
  };

  const handleBulkAction = () => {
    if (selectedIds.length === 0) {
      toast({ title: "No seasons selected", variant: "destructive" });
      return;
    }
    toast({ title: `Bulk action executed on ${selectedIds.length} seasons` });
    setSelectedIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map(s => s._id));
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
        <span className="text-foreground font-medium">Seasons</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-zinc-400 text-sm">{seasons.length} total seasons</p>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search seasons..."
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
        {selectedIds.length > 0 && (
          <>
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-40 bg-card border-border text-foreground h-10 rounded-lg">
                <SelectValue placeholder="Bulk action" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="activate">Activate</SelectItem>
                <SelectItem value="deactivate">Deactivate</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAction} className="bg-blue-600 hover:bg-blue-700 text-foreground h-10 rounded-lg">
              Apply
            </Button>
          </>
        )}
        <Button onClick={() => setLocation("/short-drama-seasons/new")} className="bg-red-600 hover:bg-red-700 text-foreground h-10 gap-2 rounded-lg px-5 font-semibold">
          <Plus className="h-4 w-4" />
          New Season
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
              <TableHead className="text-zinc-400 font-semibold text-sm">Season</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Short Drama</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Episodes</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  No seasons found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((season) => (
                <TableRow key={season._id} className="border-border hover:bg-muted/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(season._id)}
                      onCheckedChange={(checked) => handleSelectOne(season._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 overflow-hidden rounded-lg border border-border bg-muted shrink-0">
                        {season.thumbnail && (
                          <img
                            src={season.thumbnail}
                            alt={season.title}
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{season.title}</p>
                        <p className="text-zinc-500 text-xs">Season {season.seasonNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">{season.showName}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{season.episodeCount}</TableCell>
                  <TableCell>
                    <Switch
                      checked={season.status}
                      onCheckedChange={() => handleToggleStatus(season)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/short-drama-seasons/${season._id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setLocation(`/short-drama-seasons/${season._id}/edit`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(season)}
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
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
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
