import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, updateSubscriptionSchema, settingsSchema, type Subscription } from "@shared/schema";

const LOCAL_USER_ID = "local";

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/app-state", async (_req: Request, res: Response) => {
    try {
      const state = await storage.getAppState(LOCAL_USER_ID);
      res.json(state);
    } catch (error) {
      console.error("Error fetching app state:", error);
      res.status(500).json({ error: "Failed to fetch app state" });
    }
  });

  app.post("/api/onboarding/complete", async (_req: Request, res: Response) => {
    try {
      await storage.setOnboardingComplete(LOCAL_USER_ID, true);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.get("/api/subscriptions", async (_req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getAllSubscriptions(LOCAL_USER_ID);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const subscription = await storage.getSubscription(LOCAL_USER_ID, id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscriptions", async (req: Request, res: Response) => {
    try {
      const parsed = insertSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subscription = await storage.createSubscription(LOCAL_USER_ID, {
        name: parsed.data.name,
        cost: parsed.data.cost,
        currency: parsed.data.currency,
        billingCycle: parsed.data.billingCycle,
        category: parsed.data.category,
        startDate: new Date(parsed.data.startDate),
        trialEndDate: parsed.data.trialEndDate ? new Date(parsed.data.trialEndDate) : null,
        cancelInstructions: parsed.data.cancelInstructions ?? null,
        notes: parsed.data.notes ?? null,
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  app.patch("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const parsed = updateSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subscription = await storage.updateSubscription(LOCAL_USER_ID, id, parsed.data as Partial<Subscription>);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  app.patch("/api/subscriptions/:id/toggle-cancellation", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const existing = await storage.getSubscription(LOCAL_USER_ID, id);
      if (!existing) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const subscription = await storage.updateSubscription(LOCAL_USER_ID, id, {
        markedForCancellation: !existing.markedForCancellation,
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error toggling cancellation:", error);
      res.status(500).json({ error: "Failed to toggle cancellation" });
    }
  });

  app.post("/api/subscriptions/:id/cancel", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const subscription = await storage.cancelSubscription(LOCAL_USER_ID, id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const deleted = await storage.deleteSubscription(LOCAL_USER_ID, id);
      if (!deleted) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  app.post("/api/subscriptions/:id/usage", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const subscription = await storage.getSubscription(LOCAL_USER_ID, id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const usageRecord = await storage.addUsageRecord(LOCAL_USER_ID, {
        subscriptionId: id,
        usedAt: new Date(),
      });

      res.status(201).json(usageRecord);
    } catch (error) {
      console.error("Error adding usage record:", error);
      res.status(500).json({ error: "Failed to add usage record" });
    }
  });

  app.get("/api/subscriptions/:id/usage", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const subscription = await storage.getSubscription(LOCAL_USER_ID, id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const records = await storage.getUsageRecords(id);
      res.json(records);
    } catch (error) {
      console.error("Error fetching usage records:", error);
      res.status(500).json({ error: "Failed to fetch usage records" });
    }
  });

  app.get("/api/alerts", async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getAlerts(LOCAL_USER_ID);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id/dismiss", async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const alert = await storage.dismissAlert(LOCAL_USER_ID, id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ error: "Failed to dismiss alert" });
    }
  });

  app.get("/api/savings", async (_req: Request, res: Response) => {
    try {
      const savings = await storage.getSavings(LOCAL_USER_ID);
      res.json(savings);
    } catch (error) {
      console.error("Error fetching savings:", error);
      res.status(500).json({ error: "Failed to fetch savings" });
    }
  });

  app.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings(LOCAL_USER_ID);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req: Request, res: Response) => {
    try {
      const parsed = settingsSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const settings = await storage.updateSettings(LOCAL_USER_ID, parsed.data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/export/:format", async (req: Request, res: Response) => {
    try {
      const format = getParam(req.params.format) as 'json' | 'csv';
      if (format !== 'json' && format !== 'csv') {
        return res.status(400).json({ error: "Invalid format. Use 'json' or 'csv'" });
      }

      const data = await storage.exportData(LOCAL_USER_ID, format);
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=subclean-export.json');
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=subclean-export.csv');
      }
      
      res.send(data);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  return httpServer;
}
