import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { BillingCycle, Category } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function getMonthlyCost(cost: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case "weekly":
      return cost * 4.33;
    case "monthly":
      return cost;
    case "quarterly":
      return cost / 3;
    case "yearly":
      return cost / 12;
    default:
      return cost;
  }
}

export function getYearlyCost(cost: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case "weekly":
      return cost * 52;
    case "monthly":
      return cost * 12;
    case "quarterly":
      return cost * 4;
    case "yearly":
      return cost;
    default:
      return cost * 12;
  }
}

export function getCategoryLabel(category: Category): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  };
  return labels[cycle];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function getDaysAgo(date: Date | string | null): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
