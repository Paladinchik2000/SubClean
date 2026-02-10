import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DollarSign, CreditCard, TrendingUp, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentCalendar } from "@/components/payment-calendar";
import { ServiceIcon } from "@/components/service-icon";
import { formatCurrency, getMonthlyCost, getYearlyCost, getCategoryLabel } from "@/lib/utils";
import type { SubscriptionWithUsage } from "@shared/schema";

export default function Home() {
  const { data: subscriptions, isLoading } = useQuery<SubscriptionWithUsage[]>({
    queryKey: ["/api/subscriptions"],
  });

  const activeSubscriptions = subscriptions?.filter(s => s.status !== "cancelled") || [];
  
  const totalMonthly = activeSubscriptions.reduce((acc, sub) => {
    return acc + getMonthlyCost(sub.cost, sub.billingCycle);
  }, 0);

  const totalYearly = activeSubscriptions.reduce((acc, sub) => {
    return acc + getYearlyCost(sub.cost, sub.billingCycle);
  }, 0);

  const topSubscriptions = [...activeSubscriptions]
    .sort((a, b) => getMonthlyCost(b.cost, b.billingCycle) - getMonthlyCost(a.cost, a.billingCycle))
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Monthly Spending</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-foreground" data-testid="text-total-monthly">
                  {formatCurrency(totalMonthly)}
                </span>
                <span className="text-lg text-muted-foreground">/mo</span>
              </div>
              <p className="text-muted-foreground text-sm" data-testid="text-subscription-count">
                {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background border-orange-500/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Annual Spending</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-foreground" data-testid="text-total-yearly">
                  {formatCurrency(totalYearly)}
                </span>
                <span className="text-lg text-muted-foreground">/yr</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {formatCurrency(totalYearly / 12)} average per month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No subscriptions yet</h3>
              <p className="text-muted-foreground text-sm">
                Add your first subscription to start tracking your spending.
              </p>
            </div>
            <Link href="/subscriptions">
              <Button data-testid="button-add-first">
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Top 3 Biggest
                </h2>
                <Link href="/subscriptions">
                  <Button variant="ghost" size="sm" data-testid="link-view-all">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {topSubscriptions.map((sub, index) => {
                  return (
                    <Link key={sub.id} href={`/subscriptions/${sub.id}`}>
                      <Card 
                        className="hover-elevate cursor-pointer"
                        data-testid={`card-top-subscription-${index}`}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <ServiceIcon name={sub.name} category={sub.category as any} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">{getCategoryLabel(sub.category)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              {formatCurrency(getMonthlyCost(sub.cost, sub.billingCycle))}
                            </p>
                            <p className="text-xs text-muted-foreground">/month</p>
                          </div>
                          {sub.status === "trial" && (
                            <Badge variant="secondary">Trial</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground" data-testid="text-avg-monthly">
                    {formatCurrency(totalMonthly / Math.max(1, activeSubscriptions.length))}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg. per Sub</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground" data-testid="text-daily-cost">
                    {formatCurrency(totalYearly / 365)}
                  </p>
                  <p className="text-xs text-muted-foreground">Daily Cost</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <PaymentCalendar subscriptions={activeSubscriptions} />
        </div>
      )}
    </div>
  );
}
