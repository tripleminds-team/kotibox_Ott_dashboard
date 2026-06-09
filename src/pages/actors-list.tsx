
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Plus, Edit2, Trash2, Search, Upload, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

type Actor = {
  id: string;
  name: string;
  designation: string;
  image: string;
  dateOfBirth: string;
  birthPlace: string;
  status: boolean;
};

const DUMMY_ACTORS: Actor[] = [
  { id: "1", name: "Michael Johnson", designation: "Main Actor", image: "", dateOfBirth: "1985-04-13", birthPlace: "New York, USA", status: true },
  { id: "2", name: "James Williams", designation: "Main Actor", image: "", dateOfBirth: "1980-04-14", birthPlace: "Los Angeles, USA", status: true },
  { id: "3", name: "Robert Brown", designation: "Actor", image: "", dateOfBirth: "1990-02-07", birthPlace: "Chicago, USA", status: true },
  { id: "4", name: "David Jones", designation: "Actor", image: "", dateOfBirth: "1985-08-04", birthPlace: "London, UK", status: false },
  { id: "5", name: "Emily Davis", designation: "Supporting Actor", image: "", dateOfBirth: "1992-11-20", birthPlace: "Toronto, Canada", status: true },
  { id: "6", name: "Sarah Miller", designation: "Supporting Actor", image: "", dateOfBirth: "1988-06-15", birthPlace: "Sydney, Australia", status: true },
];

export default function ActorsListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [actors, setActors] = useState<Actor[]>(DUMMY_ACTORS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Actor | null>(null);

  const filtered = actors.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.birthPlace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((a) => selectedIds.includes(a.id));

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : filtered.map((a) => a.id));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleStatus = (id: string) =>
    setActors((prev) => prev.map((a) => a.id === id ? { ...a, status: !a.status } : a));

  const handleApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      setActors((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
      setSelectedIds([]);
      toast({ title: `${selectedIds.length} actor(s) deleted` });
    }
    setBulkAction("");
  };

  const handleExport = () => {
    const rows = filtered.map((a) => [a.name, a.designation, a.dateOfBirth, a.birthPlace, a.status ? "Active" : "Inactive"]);
    const csv = [["Name", "Designation", "Date Of Birth", "Birth Place", "Status"], ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "actors.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setActors((prev) => prev.filter((a) => a.id !== confirmDelete.id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete.id));
    toast({ title: `"${confirmDelete.name}" deleted successfully` });
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Actors</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={bulkAction} onValueChange={setBulkAction}>
          <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleApply} className="bg-red-700 hover:bg-red-600 text-white h-10 px-5 rounded-lg font-semibold">
          Apply
        </Button>
        <Button variant="outline" onClick={handleExport} className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white h-10 gap-2 rounded-lg">
          <Upload className="h-4 w-4" />Export
        </Button>
        <Button variant="outline" onClick={() => importRef.current?.click()} className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white h-10 gap-2 rounded-lg">
          <Download className="h-4 w-4" />Import
        </Button>
        <input ref={importRef} type="file" accept=".csv" className="hidden" />

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
          />
        </div>
        <Button onClick={() => setLocation("/actors/new")} className="bg-red-600 hover:bg-red-700 text-white h-10 gap-2 rounded-lg px-5 font-semibold">
          <Plus className="h-4 w-4" />New
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Actors</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Date Of Birth</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Birth Place</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">No actors found</TableCell>
              </TableRow>
            ) : (
              filtered.map((actor) => (
                <TableRow key={actor.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(actor.id)} onCheckedChange={() => toggleSelect(actor.id)} className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {actor.image ? (
                        <img src={actor.image} alt={actor.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold text-sm">{actor.name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{actor.designation}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm whitespace-nowrap">{actor.dateOfBirth}</TableCell>
                  <TableCell className="text-zinc-300 text-sm whitespace-nowrap">{actor.birthPlace}</TableCell>
                  <TableCell>
                    <Switch checked={actor.status} onCheckedChange={() => toggleStatus(actor.id)} className="data-[state=checked]:bg-red-600" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setLocation(`/actors/${actor.id}/edit`)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(actor)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors">
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
            <AlertDialogTitle>Delete Actor</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{confirmDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
