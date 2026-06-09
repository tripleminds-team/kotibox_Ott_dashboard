import { useState } from "react";
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

type Plan = {
  id: string;
  name: string;
  duration: string;
  level: number;
  price: number;
  discount: number;
  totalPrice: number;
  status: boolean;
};

const DUMMY_PLANS: Plan[] = [
  { id: "1", name: "Ultimate Plan", duration: "Year", level: 5, price: 199.99, discount: 20, totalPrice: 159.99, status: true },
  { id: "2", name: "Premium Plan", duration: "6 Months", level: 4, price: 99.99, discount: 10, totalPrice: 89.99, status: true },
  { id: "3", name: "Standard Plan", duration: "3 Months", level: 3, price: 59.99, discount: 5, totalPrice: 56.99, status: true },
  { id: "4", name: "Basic Plan", duration: "Month", level: 2, price: 19.99, discount: 0, totalPrice: 19.99, status: true },
  { id: "5", name: "Starter Plan", duration: "Week", level: 1, price: 6.99, discount: 0, totalPrice: 6.99, status: false },
  { id: "6", name: "Trial Plan", duration: "Day", level: 1, price: 1.99, discount: 0, totalPrice: 1.99, status: true },
];

export default function PlansPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>(DUMMY_PLANS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkAction, setBulkAction] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState("10");

  const filtered = plans.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.status) ||
      (statusFilter === "inactive" && !p.status);
    return matchSearch && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : filtered.map((p) => p.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleStatus = (id: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status: !p.status } : p)));
  };

  const handleApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      setPlans((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast({ title: `${selectedIds.length} plan(s) deleted` });
    }
    setBulkAction("");
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    setPlans((prev) => prev.filter((p) => p.id !== confirmDelete.id));
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
        <span className="text-white font-medium">Plans</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Show entries */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Show</span>
          <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
            <SelectTrigger className="w-20 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-400">entries</span>
        </div>

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
          onClick={() => setLocation("/plans/new")}
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
                <div className="flex items-center gap-1">Name <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">Duration <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">Level <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">Price <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">Discount <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">Total Price <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm">
                <div className="flex items-center gap-1">Status <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold text-sm text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={9} className="text-center text-gray-500 py-16">
                  No plans found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((plan) => (
                <TableRow
                  key={plan.id}
                  className="border-zinc-800 hover:bg-zinc-900/60 transition-colors"
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedIds.includes(plan.id)}
                      onCheckedChange={() => toggleSelect(plan.id)}
                      className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-white">{plan.name}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-gray-300 text-xs font-medium border border-zinc-700">
                      {plan.duration}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-300 font-medium">{plan.level}</span>
                  </TableCell>
                  <TableCell className="text-gray-300">${plan.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {plan.discount > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-green-600/20 text-green-400 text-xs font-semibold border border-green-600/30">
                        {plan.discount}%
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white font-semibold">${plan.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={plan.status}
                      onCheckedChange={() => toggleStatus(plan.id)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setLocation(`/plans/${plan.id}/edit`)}
                        className="h-8 w-8 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setConfirmDelete(plan)}
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

      {/* Footer */}
      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {plans.length} plans
      </p>

      {/* Delete Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Plan</AlertDialogTitle>
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
