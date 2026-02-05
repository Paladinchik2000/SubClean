import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Trash2, 
  Bell, 
  BellOff, 
  CheckCircle, 
  ExternalLink,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCategoryIcon, getCategoryLabel, getMonthlyCost } from "@/lib/utils";
import type { SubscriptionWithUsage } from "@shared/schema";

export default function SubscriptionDetail() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/subscriptions/:id");

  const { data: subscription, isLoading } = useQuery<SubscriptionWithUsage>({
    queryKey: ["/api/subscriptions", params?.id],
    enabled: !!params?.id,
  });

  const markUsedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/subscriptions/${params?.id}/usage`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Usage recorded",
        description: "Usage has been recorded for this subscription.",
      });
    },
  });

  const toggleCancellationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/subscriptions/${params?.id}/toggle-cancellation`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: data.markedForCancellation ? "Reminder set" : "Reminder removed",
        description: data.markedForCancellation 
          ? "You'll be reminded to cancel this subscription."
          : "The cancellation reminder has been removed.",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/subscriptions/${params?.id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/savings"] });
      toast({
        title: "Subscription cancelled",
        description: "This subscription has been marked as cancelled.",
      });
      navigate("/savings");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/subscriptions/${params?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription deleted",
        description: "The subscription has been removed.",
      });
      navigate("/subscriptions");
    },
  });

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Subscription not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/subscriptions")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(subscription.category);
  const isUnused = subscription.daysSinceLastUse !== null && subscription.daysSinceLastUse >= 60;
  const monthlyEquivalent = getMonthlyCost(subscription.cost, subscription.billingCycle);

  return (
    <div className="p-6 space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate("/subscriptions")}
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <CategoryIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold" data-testid="text-detail-name">
                  {subscription.name}
                </h1>
                {subscription.status === "trial" && (
                  <Badge variant="secondary">Trial</Badge>
                )}
                {subscription.status === "cancelled" && (
                  <Badge variant="destructive">Cancelled</Badge>
                )}
                {subscription.markedForCancellation && subscription.status !== "cancelled" && (
                  <Badge variant="destructive">Cancel Reminder</Badge>
                )}
                {isUnused && !subscription.markedForCancellation && subscription.status !== "cancelled" && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    Unused 60+ days
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{getCategoryLabel(subscription.category)}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" data-testid="text-detail-cost">
                {formatCurrency(subscription.cost, subscription.currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                /{subscription.billingCycle.replace("ly", "")}
              </p>
              {subscription.billingCycle !== "monthly" && (
                <p className="text-xs text-muted-foreground mt-1">
                  ({formatCurrency(monthlyEquivalent, subscription.currency)}/mo)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Next Billing Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold" data-testid="text-next-billing">
              {subscription.nextBillingDate 
                ? new Date(subscription.nextBillingDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold" data-testid="text-last-used">
              {subscription.lastUsed 
                ? `${subscription.daysSinceLastUse} days ago`
                : "Never tracked"}
            </p>
          </CardContent>
        </Card>
      </div>

      {subscription.chargeHistory && subscription.chargeHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Charge Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscription.chargeHistory.slice(0, 6).map((charge, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-muted-foreground">
                    {new Date(charge.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-medium">{formatCurrency(charge.amount, subscription.currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {subscription.status !== "cancelled" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => markUsedMutation.mutate()}
              disabled={markUsedMutation.isPending}
              data-testid="button-mark-used"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Used Today
            </Button>

            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => toggleCancellationMutation.mutate()}
              disabled={toggleCancellationMutation.isPending}
              data-testid="button-toggle-reminder"
            >
              {subscription.markedForCancellation ? (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Remove Cancel Reminder
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Set Cancel Reminder
                </>
              )}
            </Button>

            {subscription.cancelInstructions && (
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => window.open(subscription.cancelInstructions!, "_blank")}
                data-testid="button-cancel-instructions"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Cancel Instructions
              </Button>
            )}

            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-subscription"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Mark as Cancelled
            </Button>

            <Button 
              className="w-full justify-start text-destructive hover:text-destructive" 
              variant="outline"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {subscription.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{subscription.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
