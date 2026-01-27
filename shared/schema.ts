import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cost: integer("cost").notNull(), // stored in cents
  billingCycle: text("billing_cycle").notNull().$type<BillingCycle>(),
  category: text("category").notNull().$type<Category>(),
  startDate: timestamp("start_date").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  markedForCancellation: boolean("marked_for_cancellation").default(false),
  notes: text("notes"),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  markedForCancellation: true,
  nextBillingDate: true,
}).extend({
  startDate: z.coerce.date(),
});

export const updateSubscriptionSchema = insertSubscriptionSchema.partial();

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

// Helper types for frontend
export interface SubscriptionWithUsage extends Subscription {
  lastUsed: Date | null;
  daysSinceLastUse: number | null;
  usageCount: number;
}
