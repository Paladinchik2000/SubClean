import { useQuery } from "@tanstack/react-query";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getMonthlyCost, getYearlyCost, getCategoryLabel } from "@/lib/utils";
import type { SubscriptionWithUsage, Category } from "@shared/schema";

const COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(173, 80%, 40%)",
  "hsl(43, 96%, 56%)",
  "hsl(340, 82%, 52%)",
  "hsl(200, 90%, 50%)",
  "hsl(280, 70%, 55%)",
  "hsl(150, 70%, 45%)",
  "hsl(30, 90%, 55%)",
  "hsl(220, 70%, 55%)",
];

interface SavingsData {
  totalSaved: number;
  cancelledSubscriptions: SubscriptionWithUsage[];
}

export default function Analytics() {
  const { data: subscriptions, isLoading: subsLoading } = useQuery<SubscriptionWithUsage[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: savings, isLoading: savingsLoading } = useQuery<SavingsData>({
    queryKey: ["/api/savings"],
  });

  const isLoading = subsLoading || savingsLoading;

  const activeSubscriptions = subscriptions?.filter(s => s.status !== "cancelled") || [];
  const cancelledSubscriptions = savings?.cancelledSubscriptions || [];

  const totalMonthly = activeSubscriptions.reduce((acc, sub) => {
    return acc + getMonthlyCost(sub.cost, sub.billingCycle);
  }, 0);

  const totalYearly = activeSubscriptions.reduce((acc, sub) => {
    return acc + getYearlyCost(sub.cost, sub.billingCycle);
  }, 0);

  const monthlySavings = cancelledSubscriptions.reduce((acc, sub) => {
    return acc + getMonthlyCost(sub.cost, sub.billingCycle);
  }, 0);

  const categorySpending = activeSubscriptions.reduce((acc, sub) => {
    const category = sub.category as Category;
    const monthlyCost = getMonthlyCost(sub.cost, sub.billingCycle);
    acc[category] = (acc[category] || 0) + monthlyCost;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categorySpending)
    .map(([name, value]) => ({
      name: getCategoryLabel(name as Category),
      value: Math.round(value),
      rawValue: value,
    }))
    .sort((a, b) => b.value - a.value);

  const billingCycleData = [
    { name: "Weekly", count: 0, total: 0 },
    { name: "Monthly", count: 0, total: 0 },
    { name: "Quarterly", count: 0, total: 0 },
    { name: "Yearly", count: 0, total: 0 },
  ];

  activeSubscriptions.forEach(sub => {
    const idx = billingCycleData.findIndex(d => d.name.toLowerCase() === sub.billingCycle);
    if (idx !== -1) {
      billingCycleData[idx].count++;
      billingCycleData[idx].total += sub.cost;
    }
  });

  const barData = billingCycleData.filter(d => d.count > 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-analytics-title">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold" data-testid="stat-monthly-spend">
                  {formatCurrency(totalMonthly)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <BarChart3 className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yearly Spend</p>
                <p className="text-2xl font-bold" data-testid="stat-yearly-spend">
                  {formatCurrency(totalYearly)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-monthly-savings">
                  {formatCurrency(monthlySavings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <PieChartIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold" data-testid="stat-active-count">
                  {activeSubscriptions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No subscriptions to display
              </div>
            ) : (
              <div className="h-64" data-testid="chart-category-spending">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value * 100)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend 
                      formatter={(value) => (
                        <span className="text-sm text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Subscriptions by Billing Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No subscriptions to display
              </div>
            ) : (
              <div className="h-64" data-testid="chart-billing-cycle">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "count") return [`${value} subscription${value !== 1 ? "s" : ""}`, "Count"];
                        return [formatCurrency(value), "Total"];
                      }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(262, 83%, 58%)" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Add subscriptions to see your spending breakdown
            </div>
          ) : (
            <div className="space-y-3" data-testid="list-category-breakdown">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="flex-1 font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.rawValue)}/mo
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((item.rawValue / totalMonthly) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
