import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Billing cycle options
export const billingCycles = ["monthly", "yearly", "weekly", "quarterly"] as const;
export type BillingCycle = typeof billingCycles[number];

// Subscription categories
export const categories = [
  "streaming",
  "music",
  "gaming",
  "productivity",
  "fitness",
  "news",
  "cloud",
  "food",
  "other"
] as const;
export type Category = typeof categories[number];

// Subscription status
export const subscriptionStatuses = ["active", "trial", "cancelled"] as const;
export type SubscriptionStatus = typeof subscriptionStatuses[number];

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cost: integer("cost").notNull(), // stored in cents
  billingCycle: text("billing_cycle").notNull().$type<BillingCycle>(),
  category: text("category").notNull().$type<Category>(),
  status: text("status").notNull().default("active").$type<SubscriptionStatus>(),
  startDate: timestamp("start_date").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  trialEndDate: timestamp("trial_end_date"),
  cancelledDate: timestamp("cancelled_date"),
  markedForCancellation: boolean("marked_for_cancellation").default(false),
  cancelInstructions: text("cancel_instructions"),
  notes: text("notes"),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  markedForCancellation: true,
  nextBillingDate: true,
  cancelledDate: true,
  status: true,
}).extend({
  startDate: z.coerce.date(),
  trialEndDate: z.coerce.date().optional().nullable(),
});

export const updateSubscriptionSchema = insertSubscriptionSchema.partial().extend({
  status: z.enum(subscriptionStatuses).optional(),
  cancelledDate: z.coerce.date().optional().nullable(),
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Usage tracking table
export const usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull(),
  usedAt: timestamp("used_at").notNull(),
});

export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({
  id: true,
});

export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;
export type UsageRecord = typeof usageRecords.$inferSelect;

// Price history for tracking price changes
export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull(),
  previousCost: integer("previous_cost").notNull(),
  newCost: integer("new_cost").notNull(),
  changedAt: timestamp("changed_at").notNull(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
}).extend({
  changedAt: z.coerce.date(),
});

export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;

// Alerts table
export const alertTypes = ["price_increase", "duplicate", "upcoming_renewal", "trial_ending", "unused"] as const;
export type AlertType = typeof alertTypes[number];

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull(),
  type: text("type").notNull().$type<AlertType>(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull(),
  dismissed: boolean("dismissed").default(false),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  dismissed: true,
}).extend({
  createdAt: z.coerce.date(),
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// Helper types for frontend
export interface SubscriptionWithUsage extends Subscription {
  lastUsed: Date | null;
  daysSinceLastUse: number | null;
  usageCount: number;
  chargeHistory?: { date: Date; amount: number }[];
}

export interface AlertWithSubscription extends Alert {
  subscriptionName: string;
}

// App state for onboarding
export interface AppState {
  onboardingComplete: boolean;
}
