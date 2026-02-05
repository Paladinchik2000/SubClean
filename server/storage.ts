import { 
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
  type Currency,
  type Settings,
  type AppState,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAppState(userId: string): Promise<AppState>;
  setOnboardingComplete(userId: string, complete: boolean): Promise<void>;
  getSettings(userId: string): Promise<Settings>;
  updateSettings(userId: string, settings: Partial<Settings>): Promise<Settings>;
  
  getAllSubscriptions(userId: string): Promise<SubscriptionWithUsage[]>;
  getSubscription(userId: string, id: string): Promise<SubscriptionWithUsage | undefined>;
  createSubscription(userId: string, subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: string, id: string, data: Partial<Subscription>): Promise<Subscription | undefined>;
  deleteSubscription(userId: string, id: string): Promise<boolean>;
  cancelSubscription(userId: string, id: string): Promise<Subscription | undefined>;
  
  addUsageRecord(userId: string, record: InsertUsageRecord): Promise<UsageRecord>;
  getUsageRecords(subscriptionId: string): Promise<UsageRecord[]>;
  getLastUsage(subscriptionId: string): Promise<Date | null>;
  
  getAlerts(userId: string): Promise<AlertWithSubscription[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(userId: string, id: string): Promise<Alert | undefined>;
  
  addPriceHistory(history: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(subscriptionId: string): Promise<PriceHistory[]>;
  
  getSavings(userId: string): Promise<{ totalSaved: number; cancelledSubscriptions: SubscriptionWithUsage[] }>;
  
  exportData(userId: string, format: 'json' | 'csv'): Promise<string>;
}

export class MemStorage implements IStorage {
  private subscriptions: Map<string, Subscription>;
  private usageRecords: Map<string, UsageRecord>;
  private alerts: Map<string, Alert>;
  private priceHistories: Map<string, PriceHistory>;
  private userOnboarding: Map<string, boolean>;
  private userSettings: Map<string, Settings>;

  constructor() {
    this.subscriptions = new Map();
    this.usageRecords = new Map();
    this.alerts = new Map();
    this.priceHistories = new Map();
    this.userOnboarding = new Map();
    this.userSettings = new Map();
  }

  private getDefaultSettings(): Settings {
    return {
      defaultCurrency: "USD",
      emailNotifications: false,
      pushoverNotifications: false,
      renewalReminderDays: 7,
    };
  }

  async getAppState(userId: string): Promise<AppState> {
    const onboardingComplete = this.userOnboarding.get(userId) || false;
    const settings = this.userSettings.get(userId) || this.getDefaultSettings();
    return { 
      onboardingComplete,
      ...settings,
    };
  }

  async setOnboardingComplete(userId: string, complete: boolean): Promise<void> {
    this.userOnboarding.set(userId, complete);
  }

  async getSettings(userId: string): Promise<Settings> {
    return this.userSettings.get(userId) || this.getDefaultSettings();
  }

  async updateSettings(userId: string, newSettings: Partial<Settings>): Promise<Settings> {
    const current = this.userSettings.get(userId) || this.getDefaultSettings();
    const updated = { ...current, ...newSettings };
    this.userSettings.set(userId, updated);
    return updated;
  }

  async getAllSubscriptions(userId: string): Promise<SubscriptionWithUsage[]> {
    const subs = Array.from(this.subscriptions.values()).filter(s => s.userId === userId);
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

  async getSubscription(userId: string, id: string): Promise<SubscriptionWithUsage | undefined> {
    const sub = this.subscriptions.get(id);
    if (!sub || sub.userId !== userId) return undefined;

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

  async createSubscription(userId: string, insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const startDate = new Date(insertSubscription.startDate);
    const settings = await this.getSettings(userId);
    
    const nextBillingDate = this.calculateNextBillingDate(startDate, insertSubscription.billingCycle);
    
    const subscription: Subscription = {
      id,
      userId,
      name: insertSubscription.name,
      cost: insertSubscription.cost,
      currency: (insertSubscription.currency || settings.defaultCurrency) as Currency,
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

  async updateSubscription(userId: string, id: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing || existing.userId !== userId) return undefined;

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

  async cancelSubscription(userId: string, id: string): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing || existing.userId !== userId) return undefined;

    const updated: Subscription = {
      ...existing,
      status: "cancelled",
      cancelledDate: new Date(),
      markedForCancellation: false,
    };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async deleteSubscription(userId: string, id: string): Promise<boolean> {
    const existing = this.subscriptions.get(id);
    if (!existing || existing.userId !== userId) return false;
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

  async addUsageRecord(userId: string, record: InsertUsageRecord): Promise<UsageRecord> {
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

  async getAlerts(userId: string): Promise<AlertWithSubscription[]> {
    const userSubIds = new Set(
      Array.from(this.subscriptions.values())
        .filter(s => s.userId === userId)
        .map(s => s.id)
    );
    
    const alertsList = Array.from(this.alerts.values())
      .filter(a => !a.dismissed && userSubIds.has(a.subscriptionId))
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

  async dismissAlert(userId: string, id: string): Promise<Alert | undefined> {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;
    
    const sub = this.subscriptions.get(existing.subscriptionId);
    if (!sub || sub.userId !== userId) return undefined;

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

  async getSavings(userId: string): Promise<{ totalSaved: number; cancelledSubscriptions: SubscriptionWithUsage[] }> {
    const allSubs = await this.getAllSubscriptions(userId);
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

  async exportData(userId: string, format: 'json' | 'csv'): Promise<string> {
    const subs = await this.getAllSubscriptions(userId);
    const settings = await this.getSettings(userId);
    
    if (format === 'json') {
      return JSON.stringify({
        subscriptions: subs.map(s => ({
          name: s.name,
          cost: s.cost / 100,
          currency: s.currency,
          billingCycle: s.billingCycle,
          category: s.category,
          status: s.status,
          startDate: s.startDate,
          trialEndDate: s.trialEndDate,
          cancelledDate: s.cancelledDate,
          notes: s.notes,
          lastUsed: s.lastUsed,
          daysSinceLastUse: s.daysSinceLastUse,
          usageCount: s.usageCount,
        })),
        exportedAt: new Date().toISOString(),
        settings: settings,
      }, null, 2);
    } else {
      const headers = ['Name', 'Cost', 'Currency', 'Billing Cycle', 'Category', 'Status', 'Start Date', 'Trial End Date', 'Cancelled Date', 'Notes', 'Last Used', 'Days Since Last Use', 'Usage Count'];
      const rows = subs.map(s => [
        `"${s.name.replace(/"/g, '""')}"`,
        (s.cost / 100).toFixed(2),
        s.currency,
        s.billingCycle,
        s.category,
        s.status,
        s.startDate?.toISOString() || '',
        s.trialEndDate?.toISOString() || '',
        s.cancelledDate?.toISOString() || '',
        `"${(s.notes || '').replace(/"/g, '""')}"`,
        s.lastUsed?.toISOString() || '',
        s.daysSinceLastUse?.toString() || '',
        s.usageCount.toString(),
      ].join(','));
      
      return [headers.join(','), ...rows].join('\n');
    }
  }
}

export const storage = new MemStorage();
