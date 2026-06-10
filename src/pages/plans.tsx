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
import {
  useGetSubscriptionPlans,
  useDeleteSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useBulkDeleteSubscriptionPlans,
} from "@/lib/api-client";

type Plan = {
  id: string;
  name: string;
  duration: string;
  durationValue: number;
  level: number;
  price: number;
  discount: number;
  totalPrice: number;
  status: boolean;
  description: string;
};

export default function PlansPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: plansData, isLoading } = useGetSubscriptionPlans();
  const deletePlan = useDeleteSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const bulkDeletePlans = useBulkDeleteSubscriptionPlans();
  
  const plans = plansData?.data || [];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkAction, setBulkAction] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState("10");

  const filtered = plans.filter((p: Plan) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.status) ||
      (statusFilter === "inactive" && !p.status);
    return matchSearch && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const plan = plans.find((p: Plan) => p.id === id);
    if (!plan) return;
    
    await updatePlan.mutateAsync({
      id,
      data: { status: !currentStatus },
    });
  };

  const handleApply = async () => {
    if (!bulkAction || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      await bulkDeletePlans.mutateAsync(selectedIds);
      setSelectedIds([]);
      toast({ title: `${selectedIds.length} plan(s) deleted` });
    }
    setBulkAction("");
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    await deletePlan.mutateAsync(confirmDelete.id);
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete.id));
    toast({ title: `"${confirmDelete.name}" deleted successfully` });
    setConfirmDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">Plans</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Show entries */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
            <SelectTrigger className="w-20 bg-card border-border text-foreground h-10 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border text-foreground">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        {/* Bulk action */}
        <Select value={bulkAction} onValueChange={setBulkAction}>
          <SelectTrigger className="w-36 bg-card border-border text-foreground h-10 rounded-lg">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border text-foreground">
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleApply}
          className="bg-red-700 hover:bg-red-600 text-foreground h-10 px-5 rounded-lg font-semibold"
        >
          Apply
        </Button>

        <div className="flex-1" />

        {/* Export / Import */}
        <Button
          variant="outline"
          className="border-border text-foreground hover:bg-muted hover:text-foreground h-10 gap-2 rounded-lg"
        >
          <Upload className="h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          className="border-border text-foreground hover:bg-muted hover:text-foreground h-10 gap-2 rounded-lg"
        >
          <Download className="h-4 w-4" />
          Import
        </Button>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 bg-card border-border text-foreground h-10 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
          />
        </div>

        {/* New button */}
        <Button
          onClick={() => setLocation("/plans/new")}
          className="bg-red-600 hover:bg-red-700 text-foreground h-10 gap-2 rounded-lg px-5 font-semibold"
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
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-border data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm">
                <div className="flex items-center gap-1">Name <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm">
                <div className="flex items-center gap-1">Duration <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm">
                <div className="flex items-center gap-1">Level <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm">
                <div className="flex items-center gap-1">Price <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm">
                <div className="flex items-center gap-1">Discount <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm">
                <div className="flex items-center gap-1">Total Price <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm">
                <div className="flex items-center gap-1">Status <ChevronDown className="h-3.5 w-3.5 text-gray-500" /></div>
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={9} className="text-center text-gray-500 py-16">
                  No plans found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((plan) => (
                <TableRow
                  key={plan.id}
                  className="border-border hover:bg-card/60 transition-colors"
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedIds.includes(plan.id)}
                      onCheckedChange={() => toggleSelect(plan.id)}
                      className="border-border data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{plan.name}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-full bg-muted text-foreground text-xs font-medium border border-border">
                      {plan.duration}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground font-medium">{plan.level}</span>
                  </TableCell>
                  <TableCell className="text-foreground">${Number(plan.price).toFixed(2)}</TableCell>
                  <TableCell>
                    {plan.discount > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-green-600/20 text-green-400 text-xs font-semibold border border-green-600/30">
                        {plan.discount}%
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground font-semibold">${Number(plan.totalPrice).toFixed(2)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={plan.status}
                      onCheckedChange={() => toggleStatus(plan.id, plan.status)}
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
        <AlertDialogContent className="bg-card border border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Plan</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-200">"{confirmDelete?.name}"</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAction}
              className="bg-red-600 hover:bg-red-700 text-foreground border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
