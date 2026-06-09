
import { useState } from "react";
import { useLocation } from "wouter";
import { Trash2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: string;
  type: string;
  isHighlight: boolean;
  title: string;
  text: string;
  userName: string;
  userEmail: string;
  updatedAt: string;
};

const DUMMY_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "Expiry Plan", isHighlight: true, title: "Subscription Plan Expiry Reminder", text: 'Your subscription plan "Premium Plan" will expire in 0 day(s). Expiry date: 2026-06-06.', userName: "Stella Green", userEmail: "stella@gmail.com", updatedAt: "2026-06-06 14:30:13" },
  { id: "2", type: "Expiry Plan", isHighlight: true, title: "Subscription Plan Expiry Reminder", text: 'Your subscription plan "Ultimate Plan" will expire in 1 day(s). Expiry date: 2026-06-08.', userName: "Tracy Jones", userEmail: "tracy@gmail.com", updatedAt: "2026-06-07 14:30:15" },
  { id: "3", type: "Continue Watch", isHighlight: false, title: "Continue Watch - User Notification", text: 'Continue watch reminder for "Forever and a Day".', userName: "Super Admin", userEmail: "admin@streamit.com", updatedAt: "2026-06-07 16:30:15" },
  { id: "4", type: "Continue Watch", isHighlight: false, title: "Continue Watch - User Notification", text: 'Continue watch reminder for "S1 E1 The Awakening".', userName: "Super Admin", userEmail: "admin@streamit.com", updatedAt: "2026-06-07 16:30:21" },
  { id: "5", type: "Continue Watch", isHighlight: false, title: "Continue Watching Reminder", text: "Continue watching \"Forever and a Day\". You haven't watched this in a while - pick up where you left off!", userName: "John Doe", userEmail: "john@gmail.com", updatedAt: "2026-06-07 17:17:22" },
  { id: "6", type: "Continue Watch", isHighlight: false, title: "Continue Watching Reminder", text: "Continue watching \"S1 E1 The Awakening\". You haven't watched this in a while - pick up where you left off!", userName: "John Doe", userEmail: "john@gmail.com", updatedAt: "2026-06-07 17:17:22" },
  { id: "7", type: "Expiry Plan", isHighlight: true, title: "Subscription Plan Expiry Reminder", text: 'Your subscription plan "Basic" will expire in 1 day(s). Expiry date: 2026-06-09.', userName: "Dorothy Erickson", userEmail: "dorothy@gmail.com", updatedAt: "2026-06-08 14:30:13" },
  { id: "8", type: "New Subscription", isHighlight: false, title: "New Subscription Activated", text: 'Your subscription to "Standard Plan" has been activated successfully.', userName: "Michael Brown", userEmail: "michael@gmail.com", updatedAt: "2026-06-08 10:15:00" },
  { id: "9", type: "Episode Add", isHighlight: false, title: "New Episode Added", text: 'A new episode "S2 E3 The Return" has been added to your watchlist.', userName: "Sarah Connor", userEmail: "sarah@gmail.com", updatedAt: "2026-06-09 08:00:00" },
];

export default function NotificationListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Notification | null>(null);

  const filtered = notifications.filter((n) => {
    const matchType = typeFilter === "all" || n.type === typeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || n.userName.toLowerCase().includes(q) || n.userEmail.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const allSelected = filtered.length > 0 && filtered.every((n) => selectedIds.includes(n.id));

  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : filtered.map((n) => n.id));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      toast({ title: `${selectedIds.length} notification(s) deleted` });
    }
    setBulkAction("");
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setNotifications((prev) => prev.filter((n) => n.id !== confirmDelete.id));
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete.id));
    toast({ title: "Notification deleted successfully" });
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Notification List</span>
      </div>

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

        <div className="flex-1" />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Expiry Plan">Expiry Plan</SelectItem>
            <SelectItem value="Continue Watch">Continue Watch</SelectItem>
            <SelectItem value="New Subscription">New Subscription</SelectItem>
            <SelectItem value="Episode Add">Episode Add</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
          />
        </div>
      </div>

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
              <TableHead className="text-zinc-400 font-semibold text-sm">Type</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Text</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">User</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Updated At</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((notif) => (
                <TableRow key={notif.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(notif.id)}
                      onCheckedChange={() => toggleSelect(notif.id)}
                      className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <span className={notif.isHighlight ? "text-red-400 text-sm font-medium" : "text-zinc-300 text-sm"}>
                      {notif.type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-white font-semibold text-sm">{notif.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5 line-clamp-2">{notif.text}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{notif.userName}</p>
                        <p className="text-zinc-500 text-xs">{notif.userEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm whitespace-nowrap">{notif.updatedAt}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setConfirmDelete(notif)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this notification? This action cannot be undone.
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
