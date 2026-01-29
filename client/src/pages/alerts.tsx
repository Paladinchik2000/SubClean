import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Bell, 
  TrendingUp, 
  Copy, 
  Calendar, 
  Clock, 
  AlertTriangle,
  X,
  CheckCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AlertWithSubscription, SubscriptionWithUsage } from "@shared/schema";

const alertIcons = {
  price_increase: TrendingUp,
  duplicate: Copy,
  upcoming_renewal: Calendar,
  trial_ending: Clock,
  unused: AlertTriangle,
};

const alertColors = {
  price_increase: "text-red-500",
  duplicate: "text-orange-500",
  upcoming_renewal: "text-blue-500",
  trial_ending: "text-yellow-500",
  unused: "text-yellow-600",
};

const alertLabels = {
  price_increase: "Price Increase",
  duplicate: "Duplicate",
  upcoming_renewal: "Upcoming Renewal",
  trial_ending: "Trial Ending",
  unused: "Unused",
};

export default function Alerts() {
  const { toast } = useToast();

  const { data: alerts, isLoading: alertsLoading } = useQuery<AlertWithSubscription[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: subscriptions } = useQuery<SubscriptionWithUsage[]>({
    queryKey: ["/api/subscriptions"],
  });

  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiRequest("PATCH", `/api/alerts/${alertId}/dismiss`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert dismissed",
        description: "The alert has been dismissed.",
      });
    },
  });

  const upcomingRenewals = subscriptions?.filter((sub) => {
    if (!sub.nextBillingDate || sub.status === "cancelled") return false;
    const daysUntilRenewal = Math.ceil(
      (new Date(sub.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilRenewal <= 7 && daysUntilRenewal >= 0;
  }) || [];

  const unusedSubscriptions = subscriptions?.filter((sub) => {
    return sub.status !== "cancelled" && 
           sub.daysSinceLastUse !== null && 
           sub.daysSinceLastUse >= 60;
  }) || [];

  const trialEnding = subscriptions?.filter((sub) => {
    if (sub.status !== "trial" || !sub.trialEndDate) return false;
    const daysUntilEnd = Math.ceil(
      (new Date(sub.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilEnd <= 7 && daysUntilEnd >= 0;
  }) || [];

  const isLoading = alertsLoading;
  const hasAlerts = (alerts && alerts.length > 0) || 
                    upcomingRenewals.length > 0 || 
                    unusedSubscriptions.length > 0 ||
                    trialEnding.length > 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-alerts-title">
        <Bell className="w-6 h-6" />
        Alerts
      </h1>

      {!hasAlerts ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">All caught up!</h3>
              <p className="text-muted-foreground text-sm">
                You don't have any alerts at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {alerts && alerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-500" />
                Price Changes
              </h2>
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const Icon = alertIcons[alert.type];
                  const colorClass = alertColors[alert.type];
                  
                  return (
                    <Card key={alert.id} data-testid={`card-alert-${alert.id}`}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10`}>
                          <Icon className={`w-5 h-5 ${colorClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{alert.subscriptionName}</p>
                            <Badge variant="outline" className="text-xs">
                              {alertLabels[alert.type]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => dismissMutation.mutate(alert.id)}
                          data-testid={`button-dismiss-${alert.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {upcomingRenewals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Upcoming Renewals
              </h2>
              <div className="space-y-3">
                {upcomingRenewals.map((sub) => {
                  const daysUntil = Math.ceil(
                    (new Date(sub.nextBillingDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <Link key={sub.id} href={`/subscriptions/${sub.id}`}>
                      <Card className="hover-elevate cursor-pointer" data-testid={`card-renewal-${sub.id}`}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                            <Calendar className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Renews in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            ${(sub.cost / 100).toFixed(2)}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {trialEnding.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Trials Ending Soon
              </h2>
              <div className="space-y-3">
                {trialEnding.map((sub) => {
                  const daysUntil = Math.ceil(
                    (new Date(sub.trialEndDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <Link key={sub.id} href={`/subscriptions/${sub.id}`}>
                      <Card className="hover-elevate cursor-pointer" data-testid={`card-trial-${sub.id}`}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/10">
                            <Clock className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Trial ends in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            Trial
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {unusedSubscriptions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Unused Subscriptions
              </h2>
              <div className="space-y-3">
                {unusedSubscriptions.map((sub) => (
                  <Link key={sub.id} href={`/subscriptions/${sub.id}`}>
                    <Card className="hover-elevate cursor-pointer" data-testid={`card-unused-${sub.id}`}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/10">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{sub.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Not used in {sub.daysSinceLastUse} days
                          </p>
                        </div>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          Consider cancelling
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
