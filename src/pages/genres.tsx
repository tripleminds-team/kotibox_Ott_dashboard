import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Plus, Edit2, Trash2, Upload, Download, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type Genre = {
  id: string;
  name: string;
  image: string;
  active: boolean;
};

const DUMMY_GENRES: Genre[] = [
  { id: "1", name: "Action", image: "https://picsum.photos/seed/gen-action/60/60", active: true },
  { id: "2", name: "Animation", image: "https://picsum.photos/seed/gen-anim/60/60", active: true },
  { id: "3", name: "Comedy", image: "https://picsum.photos/seed/gen-comedy/60/60", active: true },
  { id: "4", name: "Historical", image: "https://picsum.photos/seed/gen-hist/60/60", active: true },
  { id: "5", name: "Horror", image: "https://picsum.photos/seed/gen-horror/60/60", active: true },
  { id: "6", name: "Romance", image: "https://picsum.photos/seed/gen-romance/60/60", active: false },
  { id: "7", name: "Sci-Fi", image: "https://picsum.photos/seed/gen-scifi/60/60", active: true },
  { id: "8", name: "Thriller", image: "https://picsum.photos/seed/gen-thriller/60/60", active: true },
  { id: "9", name: "Documentary", image: "https://picsum.photos/seed/gen-doc/60/60", active: false },
  { id: "10", name: "Adventure", image: "https://picsum.photos/seed/gen-adv/60/60", active: true },
];

export default function GenresPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [genres, setGenres] = useState<Genre[]>(DUMMY_GENRES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkAction, setBulkAction] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Genre | null>(null);

  const filtered = genres.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && g.active) ||
      (statusFilter === "inactive" && !g.active);
    return matchSearch && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((g) => selectedIds.includes(g.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((g) => g.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleStatus = (id: string) => {
    setGenres((prev) =>
      prev.map((g) => (g.id === id ? { ...g, active: !g.active } : g))
    );
  };

  const handleApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      setGenres((prev) => prev.filter((g) => !selectedIds.includes(g.id)));
      setSelectedIds([]);
      toast({ title: `${selectedIds.length} genre(s) deleted` });
    }
    setBulkAction("");
  };

  const handleDelete = (genre: Genre) => setConfirmDelete(genre);

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    setGenres((prev) => prev.filter((g) => g.id !== confirmDelete.id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete.id));
    toast({ title: `"${confirmDelete.name}" deleted successfully` });
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Genres</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Bulk action */}
        <Select value={bulkAction} onValueChange={setBulkAction}>
          <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleApply}
          className="bg-red-700 hover:bg-red-600 text-white h-10 px-5 rounded-lg font-semibold"
        >
          Apply
        </Button>

        <div className="flex-1" />

        {/* Export / Import */}
        <Button
          variant="outline"
          className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white h-10 gap-2 rounded-lg"
        >
          <Upload className="h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white h-10 gap-2 rounded-lg"
        >
          <Download className="h-4 w-4" />
          Import
        </Button>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
          />
        </div>

        {/* New button */}
        <Button
          onClick={() => setLocation("/genres/new")}
          className="bg-red-600 hover:bg-red-700 text-white h-10 gap-2 rounded-lg px-5 font-semibold"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">
                  Genres
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                </div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">
                  Status
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                </div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={4} className="text-center text-gray-500 py-16">
                  No genres found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((genre) => (
                <TableRow
                  key={genre.id}
                  className="border-zinc-800 hover:bg-zinc-900/60 transition-colors"
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedIds.includes(genre.id)}
                      onCheckedChange={() => toggleSelect(genre.id)}
                      className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={genre.image}
                        alt={genre.name}
                        className="h-10 w-10 rounded-lg object-cover border border-zinc-700"
                      />
                      <span className="font-medium text-white">{genre.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={genre.active}
                      onCheckedChange={() => toggleStatus(genre.id)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setLocation(`/genres/${genre.id}/edit`)}
                        className="h-8 w-8 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(genre)}
                        className="h-8 w-8 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Showing count */}
      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {genres.length} genres
      </p>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Genre</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-200">"{confirmDelete?.name}"</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAction}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
