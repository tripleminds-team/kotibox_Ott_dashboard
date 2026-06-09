
import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
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

type PlanLimit = {
  id: string;
  plan: string;
  videoCast: boolean;
  ads: boolean;
  deviceLimit: boolean;
  deviceLimitCount: number;
  downloadStatus: boolean;
  supportedDeviceType: boolean;
  supportedDevices: string[];
  profileLimit: boolean;
  profileLimitCount: number;
};

const DUMMY_LIMITS: PlanLimit[] = [
  {
    id: "1", plan: "Ultimate Plan",
    videoCast: true, ads: false,
    deviceLimit: true, deviceLimitCount: 5,
    downloadStatus: true, supportedDeviceType: true,
    supportedDevices: ["Web", "Android", "iOS", "Smart TV", "Roku"],
    profileLimit: true, profileLimitCount: 5,
  },
  {
    id: "2", plan: "Premium Plan",
    videoCast: true, ads: false,
    deviceLimit: true, deviceLimitCount: 3,
    downloadStatus: true, supportedDeviceType: true,
    supportedDevices: ["Web", "Android", "iOS"],
    profileLimit: true, profileLimitCount: 3,
  },
  {
    id: "3", plan: "Standard Plan",
    videoCast: true, ads: true,
    deviceLimit: true, deviceLimitCount: 2,
    downloadStatus: false, supportedDeviceType: true,
    supportedDevices: ["Web", "Android"],
    profileLimit: false, profileLimitCount: 1,
  },
  {
    id: "4", plan: "Basic Plan",
    videoCast: false, ads: true,
    deviceLimit: true, deviceLimitCount: 1,
    downloadStatus: false, supportedDeviceType: false,
    supportedDevices: ["Web"],
    profileLimit: false, profileLimitCount: 1,
  },
  {
    id: "5", plan: "Starter Plan",
    videoCast: false, ads: true,
    deviceLimit: true, deviceLimitCount: 1,
    downloadStatus: false, supportedDeviceType: false,
    supportedDevices: ["Web"],
    profileLimit: false, profileLimitCount: 1,
  },
];

const Badge = ({ on }: { on: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      on ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-red-400"}`} />
    {on ? "On" : "Off"}
  </span>
);

export default function PlanLimitsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [limits, setLimits] = useState<PlanLimit[]>(DUMMY_LIMITS);
  const [bulkAction, setBulkAction] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<PlanLimit | null>(null);

  const filtered = limits.filter((l) => {
    const matchPlan = planFilter === "all" || l.plan === planFilter;
    const matchSearch = l.plan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPlan && matchSearch;
  });

  const handleApply = () => {
    if (!bulkAction) {
      toast({ title: "Please select an action", variant: "destructive" });
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setLimits((prev) => prev.filter((l) => l.id !== confirmDelete.id));
    toast({ title: `Plan limit for "${confirmDelete.plan}" deleted` });
    setConfirmDelete(null);
  };

  const planOptions = ["all", ...Array.from(new Set(DUMMY_LIMITS.map((l) => l.plan)))];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Plan Limits</span>
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

        {/* Plan Filter */}
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            {planOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p === "all" ? "All Plans" : p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        {/* New */}
        <Button
          onClick={() => setLocation("/plan-limits/new")}
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
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Video Cast</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Ads</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Device Limit</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Download</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Supported Devices</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Profile Limit</TableHead>
                <TableHead className="text-zinc-400 font-semibold text-sm whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-zinc-500 py-10">
                    No plan limits found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((limit) => (
                  <TableRow key={limit.id} className="border-zinc-800 hover:bg-zinc-800/40">
                    <TableCell className="text-white font-semibold whitespace-nowrap">
                      {limit.plan}
                    </TableCell>
                    <TableCell><Badge on={limit.videoCast} /></TableCell>
                    <TableCell><Badge on={limit.ads} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge on={limit.deviceLimit} />
                        {limit.deviceLimit && (
                          <span className="text-xs text-zinc-400">({limit.deviceLimitCount})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><Badge on={limit.downloadStatus} /></TableCell>
                    <TableCell>
                      {limit.supportedDeviceType ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {limit.supportedDevices.map((d) => (
                            <span
                              key={d}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-zinc-700 text-zinc-300"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <Badge on={false} />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge on={limit.profileLimit} />
                        {limit.profileLimit && (
                          <span className="text-xs text-zinc-400">({limit.profileLimitCount})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLocation(`/plan-limits/${limit.id}/edit`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(limit)}
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

      {/* Delete Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan Limit</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete the limit settings for "{confirmDelete?.plan}"?
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
