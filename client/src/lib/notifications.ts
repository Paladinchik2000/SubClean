export function getNotificationStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function sendLocalNotification(title: string, body: string, tag?: string) {
  if (getNotificationStatus() !== "granted") return;

  new Notification(title, {
    body,
    tag: tag || "subclean-reminder",
    icon: "/favicon.ico",
  });
}

interface SubscriptionForNotification {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: string;
  startDate: string | Date;
}

function getNextBillingDate(sub: SubscriptionForNotification): Date {
  const start = new Date(sub.startDate);
  const now = new Date();
  const next = new Date(start);

  while (next <= now) {
    switch (sub.billingCycle) {
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

export function checkAndNotifyRenewals(
  subscriptions: SubscriptionForNotification[],
  reminderDays: number = 1
) {
  if (getNotificationStatus() !== "granted") return;

  const now = new Date();
  const notifiedKey = "subclean_notified";
  const notified: Record<string, string> = JSON.parse(localStorage.getItem(notifiedKey) || "{}");

  const today = now.toISOString().split("T")[0];

  for (const sub of subscriptions) {
    const nextBilling = getNextBillingDate(sub);
    const diffMs = nextBilling.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= reminderDays && diffDays >= 0) {
      const notifyKey = `${sub.id}_${today}`;
      if (notified[notifyKey]) continue;

      const costStr = (sub.cost / 100).toFixed(2);
      const dayText = diffDays === 0 ? "today" : diffDays === 1 ? "tomorrow" : `in ${diffDays} days`;

      sendLocalNotification(
        `${sub.name} renews ${dayText}`,
        `${sub.currency} ${costStr} will be charged ${dayText}.`,
        `renewal-${sub.id}`
      );

      notified[notifyKey] = today;
    }
  }

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const cutoff = twoDaysAgo.toISOString().split("T")[0];
  for (const key of Object.keys(notified)) {
    if (notified[key] < cutoff) {
      delete notified[key];
    }
  }

  localStorage.setItem(notifiedKey, JSON.stringify(notified));
}
