import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { formatCurrency, getNextBillingDate, getCategoryIcon, formatDate } from "@/lib/utils";
import type { SubscriptionWithUsage, BillingCycle } from "@shared/schema";

interface PaymentCalendarProps {
  subscriptions: SubscriptionWithUsage[];
}

interface UpcomingPayment {
  subscription: SubscriptionWithUsage;
  date: Date;
}

export function PaymentCalendar({ subscriptions }: PaymentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());

  const upcomingPayments: UpcomingPayment[] = subscriptions
    .filter(s => s.status !== "cancelled")
    .map(sub => ({
      subscription: sub,
      date: getNextBillingDate(sub.startDate, sub.billingCycle as BillingCycle),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const paymentDates = upcomingPayments.map(p => {
    const d = new Date(p.date);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const getPaymentsForDate = (date: Date): UpcomingPayment[] => {
    return upcomingPayments.filter(p => {
      const pDate = new Date(p.date);
      return (
        pDate.getDate() === date.getDate() &&
        pDate.getMonth() === date.getMonth() &&
        pDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const selectedPayments = selectedDate ? getPaymentsForDate(selectedDate) : [];

  const next30Days = upcomingPayments.filter(p => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return p.date >= now && p.date <= thirtyDaysFromNow;
  });

  const totalNext30Days = next30Days.reduce((acc, p) => acc + p.subscription.cost, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Payment Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            onMonthChange={setMonth}
            modifiers={{
              payment: paymentDates,
            }}
            modifiersStyles={{
              payment: {
                backgroundColor: "hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary))",
                fontWeight: "bold",
              },
            }}
            className="rounded-md border"
          />
        </div>

        {selectedDate && selectedPayments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Payments on {formatDate(selectedDate)}:
            </p>
            <div className="space-y-2">
              {selectedPayments.map(({ subscription }) => {
                const CategoryIcon = getCategoryIcon(subscription.category);
                return (
                  <div
                    key={subscription.id}
                    className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                    data-testid={`calendar-payment-${subscription.id}`}
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <CategoryIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="flex-1 text-sm font-medium">{subscription.name}</span>
                    <span className="font-semibold">{formatCurrency(subscription.cost)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next 30 days:</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" data-testid="badge-payment-count">
                {next30Days.length} payment{next30Days.length !== 1 ? "s" : ""}
              </Badge>
              <span className="font-semibold" data-testid="text-30day-total">
                {formatCurrency(totalNext30Days)}
              </span>
            </div>
          </div>
        </div>

        {next30Days.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Upcoming Payments
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {next30Days.slice(0, 5).map(({ subscription, date }) => {
                const CategoryIcon = getCategoryIcon(subscription.category);
                return (
                  <div
                    key={subscription.id}
                    className="flex items-center gap-2 py-1"
                    data-testid={`upcoming-payment-${subscription.id}`}
                  >
                    <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{subscription.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(date)}
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(subscription.cost)}
                    </span>
                  </div>
                );
              })}
              {next30Days.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{next30Days.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
