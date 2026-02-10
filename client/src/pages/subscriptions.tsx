import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Filter, Plus, CreditCard, Calendar, AlertTriangle, Flag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getMonthlyCost, getCategoryLabel } from "@/lib/utils";
import { ServiceIcon } from "@/components/service-icon";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";
import type { SubscriptionWithUsage, AppState, Currency } from "@shared/schema";

type FilterType = "all" | "monthly" | "yearly" | "trials" | "flagged";

export default function Subscriptions() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subscriptions, isLoading } = useQuery<SubscriptionWithUsage[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: appState } = useQuery<AppState>({
    queryKey: ["/api/app-state"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      cost: number;
      currency?: Currency;
      billingCycle: string;
      category: string;
      startDate: Date;
      trialEndDate?: Date | null;
      cancelInstructions?: string;
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

  const activeSubscriptions = subscriptions?.filter(s => s.status !== "cancelled") || [];

  const filteredSubscriptions = activeSubscriptions.filter((sub) => {
    const matchesSearch = searchQuery.trim() === "" || 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case "monthly":
        return sub.billingCycle === "monthly";
      case "yearly":
        return sub.billingCycle === "yearly";
      case "trials":
        return sub.status === "trial";
      case "flagged":
        return sub.markedForCancellation || (sub.daysSinceLastUse !== null && sub.daysSinceLastUse >= 60);
      default:
        return true;
    }
  });

  const counts = {
    all: activeSubscriptions.length,
    monthly: activeSubscriptions.filter(s => s.billingCycle === "monthly").length,
    yearly: activeSubscriptions.filter(s => s.billingCycle === "yearly").length,
    trials: activeSubscriptions.filter(s => s.status === "trial").length,
    flagged: activeSubscriptions.filter(s => s.markedForCancellation || (s.daysSinceLastUse !== null && s.daysSinceLastUse >= 60)).length,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-subscriptions-title">
          Subscriptions
        </h1>
        <AddSubscriptionDialog
          onAdd={(data) => addMutation.mutate(data)}
          isPending={addMutation.isPending}
          defaultCurrency={appState?.defaultCurrency}
          existingSubscriptions={subscriptions || []}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subscriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-subscriptions"
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="gap-1" data-testid="filter-all">
            <Filter className="w-3.5 h-3.5" />
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1" data-testid="filter-monthly">
            <Calendar className="w-3.5 h-3.5" />
            Monthly ({counts.monthly})
          </TabsTrigger>
          <TabsTrigger value="yearly" className="gap-1" data-testid="filter-yearly">
            <Calendar className="w-3.5 h-3.5" />
            Yearly ({counts.yearly})
          </TabsTrigger>
          <TabsTrigger value="trials" className="gap-1" data-testid="filter-trials">
            <CreditCard className="w-3.5 h-3.5" />
            Trials ({counts.trials})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="gap-1" data-testid="filter-flagged">
            <Flag className="w-3.5 h-3.5" />
            Flagged ({counts.flagged})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {filter === "all" ? "No subscriptions yet" : `No ${filter} subscriptions`}
              </h3>
              <p className="text-muted-foreground text-sm">
                {filter === "all" 
                  ? "Add your first subscription to start tracking." 
                  : "Try changing the filter to see more subscriptions."}
              </p>
            </div>
            {filter === "all" && (
              <AddSubscriptionDialog
                onAdd={(data) => addMutation.mutate(data)}
                isPending={addMutation.isPending}
                defaultCurrency={appState?.defaultCurrency}
                existingSubscriptions={subscriptions || []}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubscriptions.map((sub) => {
            const isUnused = sub.daysSinceLastUse !== null && sub.daysSinceLastUse >= 60;
            
            return (
              <Link key={sub.id} href={`/subscriptions/${sub.id}`}>
                <Card 
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-subscription-${sub.id}`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <ServiceIcon name={sub.name} category={sub.category as any} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground truncate" data-testid={`text-sub-name-${sub.id}`}>
                          {sub.name}
                        </p>
                        {sub.status === "trial" && (
                          <Badge variant="secondary" className="text-xs">Trial</Badge>
                        )}
                        {sub.markedForCancellation && (
                          <Badge variant="destructive" className="text-xs">Cancel</Badge>
                        )}
                        {isUnused && !sub.markedForCancellation && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Unused
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryLabel(sub.category)} · {sub.billingCycle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground" data-testid={`text-sub-cost-${sub.id}`}>
                        {formatCurrency(sub.cost, sub.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{sub.billingCycle.replace("ly", "")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
