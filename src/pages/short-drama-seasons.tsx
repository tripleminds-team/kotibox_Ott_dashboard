import { useState } from "react";
import { useLocation } from "wouter";
import { Edit2, Eye, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useGetSeasonList, getImageUrl } from "@/lib/api-client";

type SeasonRow = {
  seasonId: string;
  contentId: string;
  season: number;
  episodeCount: number;
  showName: string;
  thumbnail: string;
  status: string;
};

export default function ShortDramaSeasonsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");

  const { data: seasonsData, isLoading } = useGetSeasonList({ contentType: "drama" });

  const seasons: SeasonRow[] = seasonsData?.data || [];

  const filtered = seasons.filter((season) => {
    const matchesSearch =
      !searchQuery || season.showName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && season.status === "published") ||
      (statusFilter === "inactive" && season.status !== "published");
    return matchesSearch && matchesStatus;
  });

  const handleBulkAction = () => {
    if (selectedIds.length === 0) {
      toast({ title: "No seasons selected", variant: "destructive" });
      return;
    }
    toast({ title: `Bulk action executed on ${selectedIds.length} seasons` });
    setSelectedIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((s) => s.seasonId) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id));
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
            className="pl-9 w-52 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-primary h-10 rounded-lg"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-card border-border text-foreground h-10 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Published</SelectItem>
            <SelectItem value="inactive">Draft</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <>
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-40 bg-card border-border text-foreground h-10 rounded-lg">
                <SelectValue placeholder="Bulk action" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleBulkAction}
              className="bg-primary hover:bg-primary/90 text-foreground h-10 rounded-lg"
            >
              Apply
            </Button>
          </>
        )}
        <Button
          onClick={() => setLocation("/short-dramas/new")}
          className="bg-primary hover:bg-primary/90 text-foreground h-10 gap-2 rounded-lg px-5 font-semibold"
        >
          <Plus className="h-4 w-4" />
          New Drama
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  Loading seasons...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                  No seasons found. Add episodes to a short drama first.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((season) => (
                <TableRow key={season.seasonId} className="border-border hover:bg-muted/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(season.seasonId)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(season.seasonId, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 overflow-hidden rounded-lg border border-border bg-muted shrink-0">
                        {season.thumbnail && (
                          <img
                            src={getImageUrl(season.thumbnail)}
                            alt={`Season ${season.season}`}
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">
                          Season {season.season}
                        </p>
                        <p className="text-zinc-500 text-xs">{season.episodeCount} episodes</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">{season.showName}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{season.episodeCount}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        season.status === "published"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-muted text-zinc-400"
                      }`}
                    >
                      {season.status || "draft"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLocation(`/short-dramas/${season.contentId}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/15 text-blue-400 hover:bg-primary/80/30 transition-colors"
                        title="View Drama"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setLocation(
                            `/short-drama-episodes?contentId=${season.contentId}&season=${season.season}`
                          )
                        }
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                        title="View Episodes"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
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
  );
}
