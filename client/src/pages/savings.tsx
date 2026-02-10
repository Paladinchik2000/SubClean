import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PiggyBank, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getCategoryLabel, getMonthlyCost } from "@/lib/utils";
import { ServiceIcon } from "@/components/service-icon";
import type { SubscriptionWithUsage } from "@shared/schema";

interface SavingsData {
  totalSaved: number;
  cancelledSubscriptions: SubscriptionWithUsage[];
}

export default function Savings() {
  const { data: savings, isLoading } = useQuery<SavingsData>({
    queryKey: ["/api/savings"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const totalSaved = savings?.totalSaved || 0;
  const cancelledSubscriptions = savings?.cancelledSubscriptions || [];

  const potentialMonthlySavings = cancelledSubscriptions.reduce((acc, sub) => {
    return acc + getMonthlyCost(sub.cost, sub.billingCycle);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-savings-title">Savings</h1>

      <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-background border-green-500/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <PiggyBank className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">You've saved</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-green-600" data-testid="text-total-saved">
                {formatCurrency(totalSaved)}
              </span>
            </div>
            <p className="text-muted-foreground">
              by cancelling subscriptions
            </p>
          </div>
        </CardContent>
      </Card>

      {cancelledSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No cancelled subscriptions yet</h3>
              <p className="text-muted-foreground text-sm">
                When you cancel subscriptions, your savings will appear here.
              </p>
            </div>
            <Link href="/subscriptions">
              <Button variant="outline" data-testid="link-view-subscriptions">
                View Subscriptions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Monthly Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600" data-testid="text-monthly-savings">
                {formatCurrency(potentialMonthlySavings)}/mo
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                That's {formatCurrency(potentialMonthlySavings * 12)} per year!
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-4">Cancelled Subscriptions</h2>
            <div className="space-y-3">
              {cancelledSubscriptions.map((sub) => {
                return (
                  <Card key={sub.id} data-testid={`card-cancelled-${sub.id}`}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <ServiceIcon name={sub.name} category={sub.category as any} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{sub.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Cancelled {sub.cancelledDate 
                              ? new Date(sub.cancelledDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "recently"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{formatCurrency(getMonthlyCost(sub.cost, sub.billingCycle))}
                        </p>
                        <p className="text-xs text-muted-foreground">/mo saved</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
