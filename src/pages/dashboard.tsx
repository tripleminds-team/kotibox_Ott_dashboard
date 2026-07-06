import { useState, useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  useGetDashboardStats,
  useGetRevenueData,
  useGetNewSubscribersData,
  useGetMostWatchedData,
  useGetTopGenresData,
  useGetReviews,
  useGetTransactions,
} from "../lib/api-client";
import {
  Users, Clock, TrendingUp, Film, DollarSign, Star, HardDrive,
  CalendarRange, RefreshCw, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const COLORS = ["#dc2626", "#7f1d1d", "#991b1b", "#b91c1c", "#ef4444"];

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1);
  return {
    from: start.toISOString().split("T")[0],
    to: end.toISOString().split("T")[0],
  };
};

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
};

function ChartEmpty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
      <Icon className="w-8 h-8 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function ChartLoader() {
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function Dashboard() {
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // ── Date range ──────────────────────────────────────────────────────────
  const def = defaultDateRange();
  const [fromInput, setFromInput] = useState(def.from);
  const [toInput, setToInput] = useState(def.to);
  const [appliedFrom, setAppliedFrom] = useState(def.from);
  const [appliedTo, setAppliedTo] = useState(def.to);

  // ── Per-chart period ────────────────────────────────────────────────────
  const [revPeriod, setRevPeriod] = useState("year");
  const [subPeriod, setSubPeriod] = useState("year");
  const [watchPeriod, setWatchPeriod] = useState("year");

  const dateOpts = { startDate: appliedFrom, endDate: appliedTo };

  const getChartOpts = (period: string) => period === "custom" ? { ...dateOpts, period: "custom" } : { period };

  // ── Currency formatter ──────────────────────────────────────────────────
  const formatCurrency = useCallback((val: any) => {
    const num = Number(typeof val === "string" ? val.replace(/[^0-9.-]+/g, "") : val) || 0;
    const sym = settings.currencySymbol || "₹";
    const dp = settings.decimalPlaces ?? 2;
    return settings.currencyPosition === "after"
      ? `${num.toFixed(dp)} ${sym}`
      : `${sym}${num.toFixed(dp)}`;
  }, [settings]);

  const formatStatRevenue = (v: any) =>
    v && typeof v === "string" ? v : formatCurrency(v ?? 0);

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(dateOpts);
  const { data: revenueData = [], isLoading: revLoading } = useGetRevenueData(getChartOpts(revPeriod));
  const { data: newSubsData = [], isLoading: subLoading } = useGetNewSubscribersData(getChartOpts(subPeriod));
  const { data: mostWatchedData = [], isLoading: watchLoading } = useGetMostWatchedData(getChartOpts(watchPeriod));
  const { data: topGenresData = [] } = useGetTopGenresData();
  const { data: reviewsData = [] } = useGetReviews();
  const { data: transactionsData = [] } = useGetTransactions();

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!fromInput || !toInput || new Date(fromInput) > new Date(toInput)) return;
    setAppliedFrom(fromInput);
    setAppliedTo(toInput);
    setRevPeriod("custom");
    setSubPeriod("custom");
    setWatchPeriod("custom");
  };

  const handleReset = () => {
    const d = defaultDateRange();
    setFromInput(d.from);
    setToInput(d.to);
    setAppliedFrom(d.from);
    setAppliedTo(d.to);
    setRevPeriod("year");
    setSubPeriod("year");
    setWatchPeriod("year");
  };

  const chartColors = {
    grid: isDark ? "#27272a" : "#e4e4e7",
    axis: isDark ? "#71717a" : "#71717a",
    tooltipBg: isDark ? "#18181b" : "#ffffff",
    tooltipBorder: isDark ? "#3f3f46" : "#e4e4e7",
    tooltipLabel: isDark ? "#e4e4e7" : "#18181b",
  };

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers?.toLocaleString() ?? "0", icon: Users, sub: "All registered accounts" },
    { title: "Active Subscribers", value: stats?.totalSubscribers?.toLocaleString() ?? "0", icon: Users, sub: "Currently active plans" },
    { title: "Expiring Soon", value: stats?.soonToExpire?.toLocaleString() ?? "0", icon: Clock, sub: "Within next 7 days" },
    { title: "Total Reviews", value: stats?.totalReviews?.toLocaleString() ?? "0", icon: Star, sub: "Published reviews" },
    { title: "Total Storage Usage", value: stats?.totalStorageUsage ?? "0 MB", icon: HardDrive, sub: "Media files stored" },
    { title: "Content Library", value: stats?.restContent?.toLocaleString() ?? "0", icon: Film, sub: "Movies + TV shows" },
    { title: "Subscription Revenue", value: formatStatRevenue(stats?.subscriptionRevenue), icon: DollarSign, sub: "Active plans revenue" },
    { title: "Rent Revenue", value: formatStatRevenue(stats?.rentRevenue), icon: DollarSign, sub: "Pay-per-view revenue" },
    { title: "Total Revenue", value: formatStatRevenue(stats?.totalRevenue), icon: TrendingUp, sub: "Combined earnings" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header + Date Controls ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Data from{" "}
            <span className="font-semibold text-foreground">{fmtDate(appliedFrom)}</span>
            {" to "}
            <span className="font-semibold text-foreground">{fmtDate(appliedTo)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-2.5">
            <CalendarRange className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              max={toInput}
              className="bg-transparent text-foreground text-sm outline-none w-[130px] [color-scheme:dark]"
            />
            <span className="text-muted-foreground text-sm px-1">→</span>
            <input
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              min={fromInput}
              max={new Date().toISOString().split("T")[0]}
              className="bg-transparent text-foreground text-sm outline-none w-[130px] [color-scheme:dark]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!fromInput || !toInput || new Date(fromInput) > new Date(toInput)}
            className="bg-primary hover:bg-primary/90 text-white h-[42px] px-5 rounded-xl font-semibold text-sm gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Submit
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
            className="border-border text-foreground hover:bg-muted h-[42px] px-4 rounded-xl font-semibold text-sm gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="bg-card border-border shadow-sm overflow-hidden">
              <CardContent className="pt-5 pb-5">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 w-fit mb-3">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className={`text-2xl font-black text-foreground mb-0.5 ${statsLoading ? "animate-pulse opacity-50" : ""}`}>
                  {statsLoading ? "—" : s.value}
                </div>
                <div className="text-sm font-semibold text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Charts Row 1 ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Total Revenue</CardTitle>
            <Select value={revPeriod} onValueChange={setRevPeriod}>
              <SelectTrigger className="w-24 bg-input border-border text-foreground h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                {revPeriod === "custom" && <SelectItem value="custom">Custom</SelectItem>}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {revLoading ? <ChartLoader /> : revenueData.length === 0 ? (
              <ChartEmpty icon={DollarSign} text="No revenue data for this period" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis dataKey="name" stroke={chartColors.axis} tick={{ fill: chartColors.axis, fontSize: 11 }} />
                    <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: "10px" }} labelStyle={{ color: chartColors.tooltipLabel }} itemStyle={{ color: "#ef4444" }} />
                    <Area type="monotone" dataKey="value" name="Revenue" stroke="#dc2626" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Subscribers */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-foreground">New Subscribers</CardTitle>
            <Select value={subPeriod} onValueChange={setSubPeriod}>
              <SelectTrigger className="w-24 bg-input border-border text-foreground h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                {subPeriod === "custom" && <SelectItem value="custom">Custom</SelectItem>}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {subLoading ? <ChartLoader /> : newSubsData.length === 0 ? (
              <ChartEmpty icon={Users} text="No subscriber data for this period" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={newSubsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis dataKey="name" stroke={chartColors.axis} tick={{ fill: chartColors.axis, fontSize: 11 }} />
                    <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: "10px" }} labelStyle={{ color: chartColors.tooltipLabel }} />
                    <Legend wrapperStyle={{ color: chartColors.tooltipLabel, fontSize: 12 }} />
                    <Bar dataKey="basic" fill="#dc2626" radius={[4, 4, 0, 0]} name="Basic" />
                    <Bar dataKey="premium" fill="#7f1d1d" radius={[4, 4, 0, 0]} name="Premium" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Most Watched */}
        <Card className="bg-card border-border shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Most Watched</CardTitle>
            <Select value={watchPeriod} onValueChange={setWatchPeriod}>
              <SelectTrigger className="w-24 bg-input border-border text-foreground h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                {watchPeriod === "custom" && <SelectItem value="custom">Custom</SelectItem>}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {watchLoading ? <ChartLoader /> : mostWatchedData.length === 0 ? (
              <ChartEmpty icon={Film} text="No watch data for this period" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mostWatchedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis dataKey="name" stroke={chartColors.axis} tick={{ fill: chartColors.axis, fontSize: 11 }} />
                    <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: "10px" }} labelStyle={{ color: chartColors.tooltipLabel }} />
                    <Legend wrapperStyle={{ color: chartColors.tooltipLabel, fontSize: 12 }} />
                    <Bar dataKey="movies" fill="#dc2626" radius={[4, 4, 0, 0]} name="Movies" />
                    <Bar dataKey="tvShows" fill="#7f1d1d" radius={[4, 4, 0, 0]} name="TV Shows" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Genres */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Top Genres</CardTitle>
          </CardHeader>
          <CardContent>
            {topGenresData.length === 0 ? (
              <ChartEmpty icon={Star} text="No genre data available" />
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topGenresData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={4} dataKey="value">
                        {topGenresData.map((_: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2">
                  {topGenresData.map((g: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate max-w-[72px]">{g.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tables Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reviews */}
        <Card className="bg-card border-border shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Recent Reviews</CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{reviewsData.length} total</span>
          </CardHeader>
          <CardContent className="overflow-x-auto" style={{ maxHeight: 320, overflowY: "auto" }}>
            {reviewsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Star className="w-8 h-8 opacity-30" />
                <p className="text-sm">No reviews yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold">User</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold">Date</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold">Type</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsData.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 bg-primary/20 rounded-lg flex-shrink-0">
                            <AvatarFallback className="text-xs text-primary font-bold">{r.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="text-foreground font-medium text-sm truncate max-w-[120px]">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">{r.date}</td>
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">{r.category}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, j) => (
                            <Star key={j} className={`h-3.5 w-3.5 ${j < r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40"}`} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Transactions</CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{transactionsData.length} recent</span>
          </CardHeader>
          <CardContent className="overflow-x-auto" style={{ maxHeight: 320, overflowY: "auto" }}>
            {transactionsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <DollarSign className="w-8 h-8 opacity-30" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2.5 px-2 font-semibold">User</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Plan</th>
                    <th className="text-right py-2.5 px-2 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsData.map((t: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6 bg-primary/20 rounded-md flex-shrink-0">
                            <AvatarFallback className="text-[10px] text-primary font-bold">{t.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-foreground font-medium truncate max-w-[80px]">{t.name}</p>
                            <p className="text-muted-foreground text-[10px]">{t.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground truncate max-w-[70px]">{t.plan}</td>
                      <td className="py-2.5 px-2 text-foreground font-semibold text-right whitespace-nowrap">{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
