import { 
  type User, 
  type InsertUser, 
  type Subscription, 
  type InsertSubscription,
  type UsageRecord,
  type InsertUsageRecord,
  type SubscriptionWithUsage,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllSubscriptions(): Promise<SubscriptionWithUsage[]>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;
  
  addUsageRecord(record: InsertUsageRecord): Promise<UsageRecord>;
  getUsageRecords(subscriptionId: string): Promise<UsageRecord[]>;
  getLastUsage(subscriptionId: string): Promise<Date | null>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subscriptions: Map<string, Subscription>;
  private usageRecords: Map<string, UsageRecord>;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.usageRecords = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllSubscriptions(): Promise<SubscriptionWithUsage[]> {
    const subs = Array.from(this.subscriptions.values());
    const subsWithUsage: SubscriptionWithUsage[] = [];

    for (const sub of subs) {
      const lastUsed = await this.getLastUsage(sub.id);
      const usageRecords = await this.getUsageRecords(sub.id);
      
      let daysSinceLastUse: number | null = null;
      if (lastUsed) {
        const now = new Date();
        const diffTime = now.getTime() - lastUsed.getTime();
        daysSinceLastUse = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      subsWithUsage.push({
        ...sub,
        lastUsed,
        daysSinceLastUse,
        usageCount: usageRecords.length,
      });
    }

    return subsWithUsage.sort((a, b) => {
      if (a.markedForCancellation && !b.markedForCancellation) return -1;
      if (!a.markedForCancellation && b.markedForCancellation) return 1;
      
      const aUnused = a.daysSinceLastUse !== null && a.daysSinceLastUse >= 60;
      const bUnused = b.daysSinceLastUse !== null && b.daysSinceLastUse >= 60;
      if (aUnused && !bUnused) return -1;
      if (!aUnused && bUnused) return 1;
      
      return b.cost - a.cost;
    });
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      id,
      name: insertSubscription.name,
      cost: insertSubscription.cost,
      billingCycle: insertSubscription.billingCycle,
      category: insertSubscription.category,
      startDate: new Date(insertSubscription.startDate),
      nextBillingDate: insertSubscription.nextBillingDate 
        ? new Date(insertSubscription.nextBillingDate) 
        : null,
      markedForCancellation: insertSubscription.markedForCancellation ?? false,
      notes: insertSubscription.notes ?? null,
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing) return undefined;

    const updated: Subscription = {
      ...existing,
      ...data,
      id,
    };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const deleted = this.subscriptions.delete(id);
    
    const usageToDelete = Array.from(this.usageRecords.values())
      .filter(u => u.subscriptionId === id)
      .map(u => u.id);
    
    for (const usageId of usageToDelete) {
      this.usageRecords.delete(usageId);
    }
    
    return deleted;
  }

  async addUsageRecord(record: InsertUsageRecord): Promise<UsageRecord> {
    const id = randomUUID();
    const usageRecord: UsageRecord = {
      id,
      subscriptionId: record.subscriptionId,
      usedAt: new Date(record.usedAt),
    };
    this.usageRecords.set(id, usageRecord);
    return usageRecord;
  }

  async getUsageRecords(subscriptionId: string): Promise<UsageRecord[]> {
    return Array.from(this.usageRecords.values())
      .filter(u => u.subscriptionId === subscriptionId)
      .sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime());
  }

  async getLastUsage(subscriptionId: string): Promise<Date | null> {
    const records = await this.getUsageRecords(subscriptionId);
    return records.length > 0 ? records[0].usedAt : null;
  }
}

export const storage = new MemStorage();
