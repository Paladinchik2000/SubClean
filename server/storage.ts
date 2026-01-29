import { 
  type User, 
  type InsertUser, 
  type Subscription, 
  type InsertSubscription,
  type UsageRecord,
  type InsertUsageRecord,
  type SubscriptionWithUsage,
  type Alert,
  type InsertAlert,
  type AlertWithSubscription,
  type PriceHistory,
  type InsertPriceHistory,
  type BillingCycle,
  type Category,
  type AlertType,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAppState(): Promise<{ onboardingComplete: boolean }>;
  setOnboardingComplete(complete: boolean): Promise<void>;
  
  getAllSubscriptions(): Promise<SubscriptionWithUsage[]>;
  getSubscription(id: string): Promise<SubscriptionWithUsage | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;
  cancelSubscription(id: string): Promise<Subscription | undefined>;
  
  addUsageRecord(record: InsertUsageRecord): Promise<UsageRecord>;
  getUsageRecords(subscriptionId: string): Promise<UsageRecord[]>;
  getLastUsage(subscriptionId: string): Promise<Date | null>;
  
  getAlerts(): Promise<AlertWithSubscription[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(id: string): Promise<Alert | undefined>;
  
  addPriceHistory(history: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(subscriptionId: string): Promise<PriceHistory[]>;
  
  getSavings(): Promise<{ totalSaved: number; cancelledSubscriptions: SubscriptionWithUsage[] }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subscriptions: Map<string, Subscription>;
  private usageRecords: Map<string, UsageRecord>;
  private alerts: Map<string, Alert>;
  private priceHistories: Map<string, PriceHistory>;
  private onboardingComplete: boolean;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.usageRecords = new Map();
    this.alerts = new Map();
    this.priceHistories = new Map();
    this.onboardingComplete = false;
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
    const user: User = { ...insertUser, id, onboardingComplete: false };
    this.users.set(id, user);
    return user;
  }

  async getAppState(): Promise<{ onboardingComplete: boolean }> {
    return { onboardingComplete: this.onboardingComplete };
  }

  async setOnboardingComplete(complete: boolean): Promise<void> {
    this.onboardingComplete = complete;
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

      const chargeHistory = this.generateChargeHistory(sub);

      subsWithUsage.push({
        ...sub,
        lastUsed,
        daysSinceLastUse,
        usageCount: usageRecords.length,
        chargeHistory,
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

  private generateChargeHistory(sub: Subscription): { date: Date; amount: number }[] {
    const history: { date: Date; amount: number }[] = [];
    const startDate = new Date(sub.startDate);
    const now = new Date();
    let currentDate = new Date(startDate);

    const intervalDays = 
      sub.billingCycle === 'monthly' ? 30 :
      sub.billingCycle === 'yearly' ? 365 :
      sub.billingCycle === 'weekly' ? 7 :
      sub.billingCycle === 'quarterly' ? 90 : 30;

    while (currentDate <= now && history.length < 12) {
      history.push({ date: new Date(currentDate), amount: sub.cost });
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    return history.reverse();
  }

  async getSubscription(id: string): Promise<SubscriptionWithUsage | undefined> {
    const sub = this.subscriptions.get(id);
    if (!sub) return undefined;

    const lastUsed = await this.getLastUsage(sub.id);
    const usageRecords = await this.getUsageRecords(sub.id);
    
    let daysSinceLastUse: number | null = null;
    if (lastUsed) {
      const now = new Date();
      const diffTime = now.getTime() - lastUsed.getTime();
      daysSinceLastUse = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const chargeHistory = this.generateChargeHistory(sub);

    return {
      ...sub,
      lastUsed,
      daysSinceLastUse,
      usageCount: usageRecords.length,
      chargeHistory,
    };
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const startDate = new Date(insertSubscription.startDate);
    
    const nextBillingDate = this.calculateNextBillingDate(startDate, insertSubscription.billingCycle);
    
    const subscription: Subscription = {
      id,
      name: insertSubscription.name,
      cost: insertSubscription.cost,
      billingCycle: insertSubscription.billingCycle as BillingCycle,
      category: insertSubscription.category as Category,
      status: insertSubscription.trialEndDate ? "trial" : "active",
      startDate,
      nextBillingDate,
      trialEndDate: insertSubscription.trialEndDate ? new Date(insertSubscription.trialEndDate) : null,
      cancelledDate: null,
      markedForCancellation: false,
      cancelInstructions: insertSubscription.cancelInstructions ?? null,
      notes: insertSubscription.notes ?? null,
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  private calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
    const now = new Date();
    let nextDate = new Date(startDate);
    
    const intervalDays = 
      billingCycle === 'monthly' ? 30 :
      billingCycle === 'yearly' ? 365 :
      billingCycle === 'weekly' ? 7 :
      billingCycle === 'quarterly' ? 90 : 30;

    while (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    return nextDate;
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing) return undefined;

    if (data.cost && data.cost !== existing.cost) {
      await this.addPriceHistory({
        subscriptionId: id,
        previousCost: existing.cost,
        newCost: data.cost,
        changedAt: new Date(),
      });
      
      await this.createAlert({
        subscriptionId: id,
        type: "price_increase",
        message: `Price changed from $${(existing.cost / 100).toFixed(2)} to $${(data.cost / 100).toFixed(2)}`,
        createdAt: new Date(),
      });
    }

    const updated: Subscription = {
      ...existing,
      ...data,
      id,
    };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing) return undefined;

    const updated: Subscription = {
      ...existing,
      status: "cancelled",
      cancelledDate: new Date(),
      markedForCancellation: false,
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
    
    const alertsToDelete = Array.from(this.alerts.values())
      .filter(a => a.subscriptionId === id)
      .map(a => a.id);
    
    for (const alertId of alertsToDelete) {
      this.alerts.delete(alertId);
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

  async getAlerts(): Promise<AlertWithSubscription[]> {
    const alertsList = Array.from(this.alerts.values())
      .filter(a => !a.dismissed)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const alertsWithSubs: AlertWithSubscription[] = [];
    for (const alert of alertsList) {
      const sub = this.subscriptions.get(alert.subscriptionId);
      alertsWithSubs.push({
        ...alert,
        subscriptionName: sub?.name || "Unknown",
      });
    }
    
    return alertsWithSubs;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const newAlert: Alert = {
      id,
      subscriptionId: alert.subscriptionId,
      type: alert.type as AlertType,
      message: alert.message,
      createdAt: new Date(alert.createdAt),
      dismissed: false,
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async dismissAlert(id: string): Promise<Alert | undefined> {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;

    const updated: Alert = {
      ...existing,
      dismissed: true,
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async addPriceHistory(history: InsertPriceHistory): Promise<PriceHistory> {
    const id = randomUUID();
    const priceHistory: PriceHistory = {
      id,
      subscriptionId: history.subscriptionId,
      previousCost: history.previousCost,
      newCost: history.newCost,
      changedAt: new Date(history.changedAt),
    };
    this.priceHistories.set(id, priceHistory);
    return priceHistory;
  }

  async getPriceHistory(subscriptionId: string): Promise<PriceHistory[]> {
    return Array.from(this.priceHistories.values())
      .filter(p => p.subscriptionId === subscriptionId)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
  }

  async getSavings(): Promise<{ totalSaved: number; cancelledSubscriptions: SubscriptionWithUsage[] }> {
    const allSubs = await this.getAllSubscriptions();
    const cancelledSubs = allSubs.filter(s => s.status === "cancelled");
    
    let totalSaved = 0;
    const now = new Date();
    
    for (const sub of cancelledSubs) {
      if (sub.cancelledDate) {
        const monthsSinceCancelled = Math.floor(
          (now.getTime() - new Date(sub.cancelledDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        
        const monthlyCost = sub.billingCycle === 'monthly' ? sub.cost :
          sub.billingCycle === 'yearly' ? sub.cost / 12 :
          sub.billingCycle === 'weekly' ? sub.cost * 4 :
          sub.billingCycle === 'quarterly' ? sub.cost / 3 : sub.cost;
        
        totalSaved += monthlyCost * Math.max(1, monthsSinceCancelled);
      }
    }

    return { totalSaved, cancelledSubscriptions: cancelledSubs };
  }
}

export const storage = new MemStorage();
