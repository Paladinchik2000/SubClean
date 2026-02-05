import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, updateSubscriptionSchema, settingsSchema, type Subscription } from "@shared/schema";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";

interface AuthenticatedRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

function getUserId(req: AuthenticatedRequest): string {
  return req.user?.claims?.sub || "";
}

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/app-state", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const state = await storage.getAppState(userId);
      res.json(state);
    } catch (error) {
      console.error("Error fetching app state:", error);
      res.status(500).json({ error: "Failed to fetch app state" });
    }
  });

  app.post("/api/onboarding/complete", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      await storage.setOnboardingComplete(userId, true);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.get("/api/subscriptions", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const subscriptions = await storage.getAllSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const subscription = await storage.getSubscription(userId, id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscriptions", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const parsed = insertSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subscription = await storage.createSubscription(userId, {
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

  app.patch("/api/subscriptions/:id", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const parsed = updateSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subscription = await storage.updateSubscription(userId, id, parsed.data as Partial<Subscription>);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  app.patch("/api/subscriptions/:id/toggle-cancellation", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const existing = await storage.getSubscription(userId, id);
      if (!existing) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const subscription = await storage.updateSubscription(userId, id, {
        markedForCancellation: !existing.markedForCancellation,
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error toggling cancellation:", error);
      res.status(500).json({ error: "Failed to toggle cancellation" });
    }
  });

  app.post("/api/subscriptions/:id/cancel", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const subscription = await storage.cancelSubscription(userId, id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const deleted = await storage.deleteSubscription(userId, id);
      if (!deleted) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  app.post("/api/subscriptions/:id/usage", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const subscription = await storage.getSubscription(userId, id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const usageRecord = await storage.addUsageRecord(userId, {
        subscriptionId: id,
        usedAt: new Date(),
      });

      res.status(201).json(usageRecord);
    } catch (error) {
      console.error("Error adding usage record:", error);
      res.status(500).json({ error: "Failed to add usage record" });
    }
  });

  app.get("/api/subscriptions/:id/usage", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const subscription = await storage.getSubscription(userId, id);
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

  app.get("/api/alerts", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const alerts = await storage.getAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id/dismiss", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const alert = await storage.dismissAlert(userId, id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ error: "Failed to dismiss alert" });
    }
  });

  app.get("/api/savings", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const savings = await storage.getSavings(userId);
      res.json(savings);
    } catch (error) {
      console.error("Error fetching savings:", error);
      res.status(500).json({ error: "Failed to fetch savings" });
    }
  });

  app.get("/api/settings", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const settings = await storage.getSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const parsed = settingsSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const settings = await storage.updateSettings(userId, parsed.data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/export/:format", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const format = getParam(req.params.format) as 'json' | 'csv';
      if (format !== 'json' && format !== 'csv') {
        return res.status(400).json({ error: "Invalid format. Use 'json' or 'csv'" });
      }

      const data = await storage.exportData(userId, format);
      
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
