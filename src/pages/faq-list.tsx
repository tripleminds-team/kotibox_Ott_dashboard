
import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
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

type FAQ = {
  id: string;
  question: string;
  answer: string;
  status: boolean;
};

const DUMMY_FAQS: FAQ[] = [
  { id: "1", question: "What is this platform?", answer: "This is a cutting-edge streaming platform that allows users to watch movies, TV shows, and live content seamlessly. It provides a feature-rich experience with personalized...", status: true },
  { id: "2", question: "How can I create an account?", answer: "To create an account, simply click on the \"Sign Up\" button on the homepage, enter your details, and follow the on-screen instructions. Once registered, you can start exploring our extensive content library.", status: true },
  { id: "3", question: "What subscription plans are available?", answer: "We offer multiple subscription plans tailored to your needs: - Basic Plan: Weekly subscription. - Premium Plan: Monthly subscription. - Ultimate Plan: Quarterly subscription. Each plan offers...", status: true },
  { id: "4", question: "What payment methods do you accept?", answer: "We accept a variety of payment gateways for your convenience: Stripe, RazorPay, Paystack, PayPal, FlutterWave. You can choose your preferred method at checkout.", status: true },
  { id: "5", question: "How can I manage my subscription?", answer: "To manage your subscription, log into your account, go to the \"Account Settings\" section, and select \"Subscription.\" From there, you can upgrade, downgrade, or cancel your plan at any time.", status: true },
  { id: "6", question: "How can I add content to my watchlist?", answer: "While browsing movies or TV shows, simply click on the \"Add to Watchlist\" button. You can view your watchlist anytime under the \"My Watchlist\" section of your account dashboard.", status: true },
  { id: "7", question: "Can I download content for offline viewing?", answer: "Yes, you can download selected content for offline viewing, depending on your subscription plan. Look for the download icon next to eligible content.", status: false },
];

export default function FaqListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>(DUMMY_FAQS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<FAQ | null>(null);

  const filtered = faqs.filter((f) => {
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? f.status : !f.status);
    const matchSearch =
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const allSelected = filtered.length > 0 && filtered.every((f) => selectedIds.includes(f.id));

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : filtered.map((f) => f.id));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleStatus = (id: string) =>
    setFaqs((prev) => prev.map((f) => f.id === id ? { ...f, status: !f.status } : f));

  const handleApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      setFaqs((prev) => prev.filter((f) => !selectedIds.includes(f.id)));
      setSelectedIds([]);
      toast({ title: `${selectedIds.length} FAQ(s) deleted` });
    }
    setBulkAction("");
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setFaqs((prev) => prev.filter((f) => f.id !== confirmDelete.id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete.id));
    toast({ title: "FAQ deleted successfully" });
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">FAQ</span>
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
        <Button
          onClick={handleApply}
          className="bg-red-700 hover:bg-red-600 text-white h-10 px-5 rounded-lg font-semibold"
        >
          Apply
        </Button>

        {/* Status Filter */}
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

        <Button
          onClick={() => setLocation("/faq/new")}
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
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Question</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Answer</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-10">
                  No FAQs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((faq) => (
                <TableRow key={faq.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(faq.id)}
                      onCheckedChange={() => toggleSelect(faq.id)}
                      className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell className="text-white font-medium max-w-[280px]">
                    {faq.question}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm max-w-[500px]">
                    <span className="line-clamp-2">{faq.answer}</span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={faq.status}
                      onCheckedChange={() => toggleStatus(faq.id)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLocation(`/faq/${faq.id}/edit`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(faq)}
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
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
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
