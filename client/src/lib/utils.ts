import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  Tv, 
  Music, 
  Gamepad2, 
  Briefcase, 
  Dumbbell, 
  Newspaper, 
  Cloud, 
  UtensilsCrossed, 
  Package,
  type LucideIcon 
} from "lucide-react";
import type { BillingCycle, Category } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const categoryIcons: Record<Category, LucideIcon> = {
  streaming: Tv,
  music: Music,
  gaming: Gamepad2,
  productivity: Briefcase,
  fitness: Dumbbell,
  news: Newspaper,
  cloud: Cloud,
  food: UtensilsCrossed,
  other: Package,
};

export function getCategoryIcon(category: Category | string): LucideIcon {
  return categoryIcons[category as Category] || Package;
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

export function getNextBillingDate(startDate: Date | string, billingCycle: BillingCycle): Date {
  const start = typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  let next = new Date(start);
  next.setHours(0, 0, 0, 0);
  
  const addPeriod = (date: Date, cycle: BillingCycle): Date => {
    const result = new Date(date);
    switch (cycle) {
      case "weekly":
        result.setDate(result.getDate() + 7);
        break;
      case "monthly":
        result.setMonth(result.getMonth() + 1);
        break;
      case "quarterly":
        result.setMonth(result.getMonth() + 3);
        break;
      case "yearly":
        result.setFullYear(result.getFullYear() + 1);
        break;
    }
    return result;
  };
  
  while (next <= now) {
    next = addPeriod(next, billingCycle);
  }
  
  return next;
}

export function getDaysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffTime = d.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
