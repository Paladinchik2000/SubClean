import { AlertTriangle, CheckCircle2, Clock, Bell, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceIcon } from "@/components/service-icon";
import { 
  formatCurrency, 
  getMonthlyCost, 
  getCategoryLabel, 
  getBillingCycleLabel 
} from "@/lib/utils";
import type { Category, SubscriptionWithUsage } from "@shared/schema";

interface SubscriptionCardProps {
  subscription: SubscriptionWithUsage;
  onMarkUsed: (id: string) => void;
  onToggleCancellation: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingUsed?: boolean;
  isTogglingCancellation?: boolean;
}

export function SubscriptionCard({ 
  subscription, 
  onMarkUsed, 
  onToggleCancellation,
  onDelete,
  isMarkingUsed,
  isTogglingCancellation,
}: SubscriptionCardProps) {
  const monthlyCost = getMonthlyCost(subscription.cost, subscription.billingCycle);
  const isUnused = subscription.daysSinceLastUse !== null && subscription.daysSinceLastUse >= 60;
  const isWarning = subscription.daysSinceLastUse !== null && 
    subscription.daysSinceLastUse >= 30 && 
    subscription.daysSinceLastUse < 60;

  return (
    <Card 
      className={`p-4 transition-all ${
        subscription.markedForCancellation 
          ? "border-destructive/50 bg-destructive/5" 
          : isUnused 
            ? "border-yellow-500/50 dark:border-yellow-400/50" 
            : ""
      }`}
      data-testid={`card-subscription-${subscription.id}`}
    >
      <div className="flex items-start gap-4">
        <ServiceIcon 
          name={subscription.name} 
          category={subscription.category as Category} 
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-foreground" data-testid={`text-subscription-name-${subscription.id}`}>
                {subscription.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {getCategoryLabel(subscription.category as Category)} · {getBillingCycleLabel(subscription.billingCycle)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg" data-testid={`text-subscription-cost-${subscription.id}`}>
                {formatCurrency(subscription.cost)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(monthlyCost)}/mo
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {subscription.markedForCancellation && (
              <Badge variant="destructive" className="text-xs" data-testid={`badge-cancel-${subscription.id}`}>
                <Bell className="w-3 h-3 mr-1" />
                Cancel Reminder
              </Badge>
            )}
            
            {isUnused && !subscription.markedForCancellation && (
              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-600 dark:text-yellow-400" data-testid={`badge-unused-${subscription.id}`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Not used in {subscription.daysSinceLastUse} days
              </Badge>
            )}
            
            {isWarning && !subscription.markedForCancellation && (
              <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600 dark:text-orange-400">
                <Clock className="w-3 h-3 mr-1" />
                {subscription.daysSinceLastUse} days since last use
              </Badge>
            )}

            {subscription.daysSinceLastUse !== null && subscription.daysSinceLastUse < 30 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Used {subscription.daysSinceLastUse === 0 ? "today" : `${subscription.daysSinceLastUse}d ago`}
              </Badge>
            )}

            {subscription.lastUsed === null && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                Never used
              </Badge>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkUsed(subscription.id)}
              disabled={isMarkingUsed}
              data-testid={`button-mark-used-${subscription.id}`}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Mark Used
            </Button>
            
            <Button
              size="sm"
              variant={subscription.markedForCancellation ? "secondary" : "destructive"}
              onClick={() => onToggleCancellation(subscription.id)}
              disabled={isTogglingCancellation}
              data-testid={`button-toggle-cancel-${subscription.id}`}
            >
              <Bell className="w-4 h-4 mr-1" />
              {subscription.markedForCancellation ? "Remove Reminder" : "Remind to Cancel"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(subscription.id)}
              className="text-muted-foreground hover:text-destructive"
              data-testid={`button-delete-${subscription.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
