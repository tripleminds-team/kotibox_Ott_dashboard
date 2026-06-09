
import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, Download, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type Subscription = {
  id: string;
  plan: string;
  duration: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  price: number;
  discount: number;
  couponDiscount: number;
  tax: number;
  totalAmount: number;
  status: "active" | "inactive";
};

const DUMMY_SUBSCRIPTIONS: Subscription[] = [
  { id: "1", plan: "Basic", duration: "1 Month", paymentMethod: "Stripe", startDate: "2026-05-15", endDate: "2026-06-15", price: 5.0, discount: 0, couponDiscount: 0, tax: 0, totalAmount: 5.0, status: "active" },
  { id: "2", plan: "Ultimate Plan", duration: "3 Months", paymentMethod: "Stripe", startDate: "2026-05-11", endDate: "2026-08-11", price: 50.0, discount: 0, couponDiscount: 0, tax: 0, totalAmount: 50.0, status: "active" },
  { id: "3", plan: "Premium Plan", duration: "1 Month", paymentMethod: "-", startDate: "2026-05-10", endDate: "2026-06-09", price: 20.0, discount: 0, couponDiscount: 0, tax: 0, totalAmount: 20.0, status: "active" },
  { id: "4", plan: "Basic", duration: "1 Month", paymentMethod: "-", startDate: "2026-05-09", endDate: "2026-06-09", price: 5.0, discount: 0, couponDiscount: 0, tax: 0, totalAmount: 5.0, status: "active" },
  { id: "5", plan: "Premium Plan", duration: "1 Month", paymentMethod: "Stripe", startDate: "2026-05-06", endDate: "2026-06-06", price: 20.0, discount: 0, couponDiscount: 0, tax: 0, totalAmount: 20.0, status: "active" },
  { id: "6", plan: "Premium Plan", duration: "1 Month", paymentMethod: "Stripe", startDate: "2026-03-08", endDate: "2026-04-08", price: 20.0, discount: 0, couponDiscount: 0, tax: 0, totalAmount: 20.0, status: "inactive" },
  { id: "7", plan: "Ultimate Plan", duration: "3 Months", paymentMethod: "-", startDate: "2026-03-04", endDate: "2026-06-08", price: 50.0, discount: 0, couponDiscount: 0, tax: 0, totalAmount: 50.0, status: "active" },
];

const PLAN_OPTIONS = ["All Plans", "Basic", "Premium Plan", "Ultimate Plan"];

export default function SubscriptionsListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(DUMMY_SUBSCRIPTIONS);
  const [bulkAction, setBulkAction] = useState("");
  const [planFilter, setPlanFilter] = useState("All Plans");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Subscription | null>(null);

  const filtered = subscriptions.filter((s) => {
    const matchPlan = planFilter === "All Plans" || s.plan === planFilter;
    const matchSearch =
      s.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFrom = !dateFrom || s.startDate >= dateFrom;
    const matchTo = !dateTo || s.endDate <= dateTo;
    return matchPlan && matchSearch && matchFrom && matchTo;
  });

  const handleApply = () => {
    if (!bulkAction) {
      toast({ title: "Please select an action", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const headers = ["Plan", "Duration", "Payment Method", "Start Date", "End Date", "Price", "Discount", "Coupon Discount", "Tax", "Total Amount", "Status"];
    const rows = filtered.map((s) => [
      s.plan, s.duration, s.paymentMethod, s.startDate, s.endDate,
      s.price, s.discount, s.couponDiscount, s.tax, s.totalAmount, s.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscriptions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setSubscriptions((prev) => prev.filter((s) => s.id !== confirmDelete.id));
    toast({ title: `Subscription deleted successfully` });
    setConfirmDelete(null);
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Subscriptions</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Bulk Action */}
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

        {/* Export */}
        <Button
          variant="outline"
          onClick={handleExport}
          className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white h-10 gap-2 rounded-lg"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        {/* Plan Filter */}
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            {PLAN_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg text-sm"
          />
          <span className="text-zinc-500 text-sm">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg text-sm"
          />
        </div>

        {/* Filter Button */}
        <Button
          onClick={() => {}}
          className="bg-red-600 hover:bg-red-700 text-white h-10 gap-2 rounded-lg px-4"
        >
          <Filter className="h-4 w-4" />
          Filter
        </Button>

        <div className="flex-1" />

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

        {/* New Button */}
        <Button
          onClick={() => setLocation("/subscriptions/new")}
          className="bg-red-600 hover:bg-red-700 text-white h-10 gap-2 rounded-lg px-5 font-semibold"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Plan</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Duration</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Payment Method</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Start Date</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">End Date</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Price</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Discount</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Coupon Discount</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Tax</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Total Amount</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Status</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-zinc-500 py-10">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sub) => (
                  <TableRow key={sub.id} className="border-zinc-800 hover:bg-zinc-800/40">
                    <TableCell className="text-white font-medium whitespace-nowrap">{sub.plan}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{sub.duration}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{sub.paymentMethod}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{sub.startDate}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{sub.endDate}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{fmt(sub.price)}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{fmt(sub.discount)}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{fmt(sub.couponDiscount)}</TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">{fmt(sub.tax)}</TableCell>
                    <TableCell className="text-white font-semibold whitespace-nowrap">{fmt(sub.totalAmount)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sub.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {sub.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExport}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 transition-colors"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(sub)}
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
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
