import { useSettings } from "@/contexts/SettingsContext";
import { 
  useGetMe, 
  useGetDashboardStats, 
  useGetRevenueData, 
  useGetNewSubscribersData, 
  useGetMostWatchedData, 
  useGetTopGenresData, 
  useGetReviews, 
  useGetTransactions 
} from "../lib/api-client";
import {
  User,
  Users,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Film,
  Play,
  DollarSign,
  Activity,
  Calendar,
  Star,
  PieChart as PieChartIcon,
  BarChart3,
  Bell,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444'];

export default function Dashboard() {
  const { settings } = useSettings();
  const formatCurrency = (val) => {
    const num = Number(val && typeof val === "string" ? val.replace(/[^0-9.-]+/g,"") : val) || 0;
    return settings.currencyPosition === "before" ? `${settings.currencySymbol}${num.toFixed(settings.decimalPlaces)}` : `${num.toFixed(settings.decimalPlaces)} ${settings.currencySymbol}`;
  };
  const { data: user } = useGetMe();
  const { data: dashboardStats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: revenueData = [], isLoading: revenueLoading } = useGetRevenueData();
  const { data: newSubscribersData = [], isLoading: subscribersLoading } = useGetNewSubscribersData();
  const { data: mostWatchedData = [], isLoading: mostWatchedLoading } = useGetMostWatchedData();
  const { data: topGenresData = [], isLoading: topGenresLoading } = useGetTopGenresData();
  const { data: reviewsData = [], isLoading: reviewsLoading } = useGetReviews();
  const { data: transactionsData = [], isLoading: transactionsLoading } = useGetTransactions();
  const { t } = useLanguage();
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartColors = {
    grid: isDark ? "#27272a" : "#e4e4e7",
    axis: isDark ? "#71717a" : "#71717a",
    tooltipBg: isDark ? "#27272a" : "#ffffff",
    tooltipBorder: isDark ? "#3f3f46" : "#e4e4e7",
    tooltipLabel: isDark ? "#e4e4e7" : "#18181b",
  };

  const stats = [
    {
      title: "Total Users",
      value: dashboardStats?.totalUsers?.toString() || "0",
      icon: Users,
      iconBg: "from-primary to-primary/80",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Total Subscribers",
      value: dashboardStats?.totalSubscribers?.toString() || "0",
      icon: Users,
      iconBg: "from-primary to-primary/80",
      trend: "+18%",
      trendUp: true,
    },
    {
      title: "Total Soon to Expire",
      value: dashboardStats?.soonToExpire?.toString() || "0",
      icon: Clock,
      iconBg: "from-primary to-primary/80",
      trend: "+10%",
      trendUp: true,
    },
    {
      title: "Total Reviews",
      value: dashboardStats?.totalReviews?.toString() || "0",
      icon: Star,
      iconBg: "from-primary to-primary/80",
      trend: "+9.23%",
      trendUp: true,
    },
    {
      title: "Total Storage Usage",
      value: dashboardStats?.totalStorageUsage || "0 MB",
      icon: TrendingUp,
      iconBg: "from-primary to-primary/80",
      trend: "+18%",
      trendUp: true,
    },
    {
      title: "Rest Content",
      value: dashboardStats?.restContent?.toString() || "0",
      icon: Film,
      iconBg: "from-primary to-primary/80",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Subscription Revenue",
      value: dashboardStats?.subscriptionRevenue ? formatCurrency(dashboardStats.subscriptionRevenue) : formatCurrency(0),
      icon: DollarSign,
      iconBg: "from-primary to-primary/80",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Rent Revenue",
      value: dashboardStats?.rentRevenue ? formatCurrency(dashboardStats.rentRevenue) : formatCurrency(0),
      icon: DollarSign,
      iconBg: "from-primary to-primary/80",
      trend: "+10%",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: dashboardStats?.totalRevenue ? formatCurrency(dashboardStats.totalRevenue) : formatCurrency(0),
      icon: DollarSign,
      iconBg: "from-primary to-primary/80",
      trend: "+12%",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">2026-01-01 to 2026-06-</div>
          <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg">
            Submit
          </Button>
          <Button className="bg-primary hover:bg-primary/80 text-foreground rounded-lg">
            Reset
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              className="bg-card border-border text-foreground shadow-lg border-0 overflow-hidden"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.iconBg} text-foreground`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${stat.trendUp ? "text-green-500" : "text-primary"}`}>
                    {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.trend}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total Revenue Chart */}
        <Card className="bg-card border-border text-foreground shadow-lg border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Total Revenue</CardTitle>
            <Select defaultValue="year">
              <SelectTrigger className="w-24 bg-input border-border text-foreground h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-input border-border text-foreground">
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
                  <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '12px' }}
                    labelStyle={{ color: chartColors.tooltipLabel }}
                    itemStyle={{ color: '#ef4444' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* New Subscribers Chart */}
        <Card className="bg-card border-border text-foreground shadow-lg border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">New Subscribers</CardTitle>
            <Select defaultValue="year">
              <SelectTrigger className="w-24 bg-input border-border text-foreground h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-input border-border text-foreground">
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newSubscribersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
                  <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '12px' }}
                    labelStyle={{ color: chartColors.tooltipLabel }}
                  />
                  <Legend wrapperStyle={{ color: chartColors.tooltipLabel }} />
                  <Bar dataKey="basic" fill="#dc2626" radius={[6, 6, 0, 0]} name="Basic" />
                  <Bar dataKey="premium" fill="#7f1d1d" radius={[6, 6, 0, 0]} name="Premium Plan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Most Watched Chart */}
        <Card className="bg-card border-border text-foreground shadow-lg border-0 overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Most Watched</CardTitle>
            <Select defaultValue="year">
              <SelectTrigger className="w-24 bg-input border-border text-foreground h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-input border-border text-foreground">
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostWatchedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
                  <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '12px' }}
                    labelStyle={{ color: chartColors.tooltipLabel }}
                  />
                  <Legend wrapperStyle={{ color: chartColors.tooltipLabel }} />
                  <Bar dataKey="movies" fill="#dc2626" radius={[6, 6, 0, 0]} name="Movies" />
                  <Bar dataKey="tvShows" fill="#7f1d1d" radius={[6, 6, 0, 0]} name="TV Shows" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Rated Chart */}
        <Card className="bg-card border-border text-foreground shadow-lg border-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Top Rated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topGenresData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topGenresData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {topGenresData.map((genre, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-foreground">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span>{genre.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="bg-card border-border text-foreground shadow-lg border-0 overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Reviews</CardTitle>
            <Button variant="ghost" className="text-primary hover:text-primary p-0 h-auto text-sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto max-h-80 custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {reviewsData.map((review, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-muted rounded-lg">
                          <AvatarFallback className="text-sm text-primary">{review.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-foreground">{review.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{review.date}</td>
                    <td className="py-3 px-4 text-muted-foreground">{review.category}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-card border-border text-foreground shadow-lg border-0 overflow-hidden lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Transactions</CardTitle>
            <Button variant="ghost" className="text-primary hover:text-primary p-0 h-auto text-sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto max-h-80 custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Plan</th>
                  <th className="text-left py-3 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactionsData.map((transaction, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 bg-muted rounded-lg">
                          <AvatarFallback className="text-xs text-primary">{transaction.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-foreground">{transaction.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{transaction.date}</td>
                    <td className="py-3 px-2 text-muted-foreground">{transaction.plan}</td>
                    <td className="py-3 px-2 text-foreground font-medium">{transaction.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
