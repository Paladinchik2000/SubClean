import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import type { SubscriptionWithUsage, Category } from "@shared/schema";
import { getMonthlyCost, formatCurrency, getCategoryLabel } from "@/lib/utils";

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

interface SpendingChartProps {
  subscriptions: SubscriptionWithUsage[];
}

export function SpendingChart({ subscriptions }: SpendingChartProps) {
  const categorySpending = subscriptions.reduce((acc, sub) => {
    const category = sub.category as Category;
    const monthlyCost = getMonthlyCost(sub.cost, sub.billingCycle);
    acc[category] = (acc[category] || 0) + monthlyCost;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categorySpending)
    .map(([name, value]) => ({
      name: getCategoryLabel(name as Category),
      value: Math.round(value),
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="p-6" data-testid="card-spending-chart">
        <h3 className="font-semibold mb-4" data-testid="text-chart-title">Spending by Category</h3>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground" data-testid="text-chart-empty">
          No subscriptions to display
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="card-spending-chart">
      <h3 className="font-semibold mb-4" data-testid="text-chart-title">Spending by Category</h3>
      <div className="h-[250px]" data-testid="chart-spending">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
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
    </Card>
  );
}
