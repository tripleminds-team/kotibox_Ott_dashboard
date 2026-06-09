import { useState } from "react";
import { Link } from "wouter";
import { useGetUsersList, useBanUser, useUnbanUser } from "../lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ShieldAlert, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

export default function UsersList() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const params: any = { page };
  if (search) params.search = search;
  if (plan !== "all") params.plan = plan;

  const { data, isLoading } = useGetUsersList(params);

  const handleBan = (userId: string) => {
    banMutation.mutate(userId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users-list"] });
        toast({ title: "User suspended successfully" });
      },
      onError: () => {
        toast({ title: "Failed to suspend user", variant: "destructive" });
      },
    });
  };

  const handleUnban = (userId: string) => {
    unbanMutation.mutate(userId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users-list"] });
        toast({ title: "User unsuspended successfully" });
      },
      onError: () => {
        toast({ title: "Failed to unsuspend user", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Users</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1" />
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-gray-300 h-10 rounded-lg">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-9 w-52 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="text-zinc-400 font-semibold text-sm">Name</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Plan</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Watch Time</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Joined</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((user) => (
                <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-full border border-zinc-700">
                        {user.avatar && <AvatarImage src={user.avatar} />}
                        <AvatarFallback className="bg-zinc-700 text-white text-sm">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-zinc-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          user.status === "banned" ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                      <span className="text-zinc-300 text-sm capitalize">
                        {user.status || "active"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.subscriptionPlan === "premium"
                          ? "bg-red-500/15 text-red-400"
                          : user.subscriptionPlan === "standard"
                          ? "bg-blue-500/15 text-blue-400"
                          : user.subscriptionPlan === "basic"
                          ? "bg-zinc-600/50 text-zinc-300"
                          : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {user.subscriptionPlan || "Free"}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">
                    {user.totalWatchTime ? `${Math.round(user.totalWatchTime / 60)} hrs` : "0 hrs"}
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/users/${user.id}`}>
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      {user.status === "banned" ? (
                        <button
                          onClick={() => handleUnban(user.id)}
                          disabled={unbanMutation.isPending}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-600/15 text-green-400 hover:bg-green-600/30 transition-colors"
                          title="Unsuspend"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBan(user.id)}
                          disabled={banMutation.isPending}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors"
                          title="Suspend"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{" "}
            {data.pagination.total} users
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, data.pagination.page - 1))}
              disabled={data.pagination.page <= 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">
              {data.pagination.page} / {data.pagination.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.pagination.pages, data.pagination.page + 1))}
              disabled={data.pagination.page >= data.pagination.pages}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
