import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, CreditCard, AlertTriangle, Bell } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getMonthlyCost, getYearlyCost } from "@/lib/utils";
import { StatsCard } from "@/components/stats-card";
import { SpendingChart } from "@/components/spending-chart";
import { SubscriptionCard } from "@/components/subscription-card";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";
import { EmptyState } from "@/components/empty-state";
import { 
  SubscriptionListSkeleton, 
  StatsCardSkeleton 
} from "@/components/subscription-list-skeleton";
import type { SubscriptionWithUsage } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: subscriptions, isLoading } = useQuery<SubscriptionWithUsage[]>({
    queryKey: ["/api/subscriptions"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      cost: number;
      billingCycle: string;
      category: string;
      startDate: Date;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/subscriptions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription added",
        description: "Your subscription has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markUsedMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await apiRequest("POST", `/api/subscriptions/${subscriptionId}/usage`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Usage recorded",
        description: "Usage has been recorded for this subscription.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCancellationMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await apiRequest("PATCH", `/api/subscriptions/${subscriptionId}/toggle-cancellation`);
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription deleted",
        description: "The subscription has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalMonthly = subscriptions?.reduce((acc, sub) => {
    return acc + getMonthlyCost(sub.cost, sub.billingCycle);
  }, 0) || 0;

  const totalYearly = subscriptions?.reduce((acc, sub) => {
    return acc + getYearlyCost(sub.cost, sub.billingCycle);
  }, 0) || 0;

  const unusedCount = subscriptions?.filter(
    (sub) => sub.daysSinceLastUse !== null && sub.daysSinceLastUse >= 60
  ).length || 0;

  const cancellationCount = subscriptions?.filter(
    (sub) => sub.markedForCancellation
  ).length || 0;

  const unusedSubscriptions = subscriptions?.filter(
    (sub) => sub.daysSinceLastUse !== null && sub.daysSinceLastUse >= 60 && !sub.markedForCancellation
  ) || [];

  const cancellationReminders = subscriptions?.filter(
    (sub) => sub.markedForCancellation
  ) || [];

  const activeSubscriptions = subscriptions?.filter(
    (sub) => !sub.markedForCancellation && (sub.daysSinceLastUse === null || sub.daysSinceLastUse < 60)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-app-title">SubClean</h1>
              <p className="text-muted-foreground" data-testid="text-app-subtitle">Track and manage your subscriptions</p>
            </div>
            <AddSubscriptionDialog 
              onAdd={(data) => addMutation.mutate(data)} 
              isPending={addMutation.isPending}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {isLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Monthly Spending"
                value={formatCurrency(totalMonthly)}
                subtitle={`${formatCurrency(totalYearly)}/year`}
                icon={DollarSign}
                testId="text-monthly-spending"
              />
              <StatsCard
                title="Active Subscriptions"
                value={subscriptions?.length || 0}
                subtitle="Total tracked"
                icon={CreditCard}
                testId="text-active-count"
              />
              <StatsCard
                title="Unused (60+ days)"
                value={unusedCount}
                subtitle={unusedCount > 0 ? "Consider cancelling" : "All being used"}
                icon={AlertTriangle}
                variant={unusedCount > 0 ? "warning" : "default"}
                testId="text-unused-count"
              />
              <StatsCard
                title="Cancel Reminders"
                value={cancellationCount}
                subtitle={cancellationCount > 0 ? "Ready to review" : "No reminders set"}
                icon={Bell}
                variant={cancellationCount > 0 ? "danger" : "default"}
                testId="text-cancel-count"
              />
            </>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {cancellationReminders.length > 0 && (
              <section data-testid="section-cancel-reminders">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-section-cancel-reminders">
                  <Bell className="w-5 h-5 text-destructive" />
                  Cancel Reminders
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({cancellationReminders.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {cancellationReminders.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onMarkUsed={(id) => markUsedMutation.mutate(id)}
                      onToggleCancellation={(id) => toggleCancellationMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isMarkingUsed={markUsedMutation.isPending}
                      isTogglingCancellation={toggleCancellationMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            {unusedSubscriptions.length > 0 && (
              <section data-testid="section-unused-subscriptions">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-section-unused">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Not Used in 60+ Days
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({unusedSubscriptions.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {unusedSubscriptions.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onMarkUsed={(id) => markUsedMutation.mutate(id)}
                      onToggleCancellation={(id) => toggleCancellationMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isMarkingUsed={markUsedMutation.isPending}
                      isTogglingCancellation={toggleCancellationMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            <section data-testid="section-all-subscriptions">
              <h2 className="text-lg font-semibold mb-4" data-testid="text-section-all">
                {activeSubscriptions.length > 0 ? "All Subscriptions" : ""}
              </h2>
              {isLoading ? (
                <SubscriptionListSkeleton />
              ) : subscriptions?.length === 0 ? (
                <EmptyState
                  title="No subscriptions yet"
                  description="Add your first subscription to start tracking your spending and usage."
                  action={
                    <AddSubscriptionDialog 
                      onAdd={(data) => addMutation.mutate(data)} 
                      isPending={addMutation.isPending}
                    />
                  }
                />
              ) : (
                <div className="space-y-3">
                  {activeSubscriptions.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onMarkUsed={(id) => markUsedMutation.mutate(id)}
                      onToggleCancellation={(id) => toggleCancellationMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isMarkingUsed={markUsedMutation.isPending}
                      isTogglingCancellation={toggleCancellationMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {!isLoading && subscriptions && subscriptions.length > 0 && (
              <SpendingChart subscriptions={subscriptions} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
