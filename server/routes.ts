import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, updateSubscriptionSchema, type Subscription } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/app-state", async (req, res) => {
    try {
      const state = await storage.getAppState();
      res.json(state);
    } catch (error) {
      console.error("Error fetching app state:", error);
      res.status(500).json({ error: "Failed to fetch app state" });
    }
  });

  app.post("/api/onboarding/complete", async (req, res) => {
    try {
      await storage.setOnboardingComplete(true);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.get("/api/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const parsed = insertSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subscription = await storage.createSubscription({
        name: parsed.data.name,
        cost: parsed.data.cost,
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

  app.patch("/api/subscriptions/:id", async (req, res) => {
    try {
      const parsed = updateSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subscription = await storage.updateSubscription(req.params.id, parsed.data as Partial<Subscription>);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  app.patch("/api/subscriptions/:id/toggle-cancellation", async (req, res) => {
    try {
      const existing = await storage.getSubscription(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const subscription = await storage.updateSubscription(req.params.id, {
        markedForCancellation: !existing.markedForCancellation,
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error toggling cancellation:", error);
      res.status(500).json({ error: "Failed to toggle cancellation" });
    }
  });

  app.post("/api/subscriptions/:id/cancel", async (req, res) => {
    try {
      const subscription = await storage.cancelSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSubscription(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  app.post("/api/subscriptions/:id/usage", async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const usageRecord = await storage.addUsageRecord({
        subscriptionId: req.params.id,
        usedAt: new Date(),
      });

      res.status(201).json(usageRecord);
    } catch (error) {
      console.error("Error adding usage record:", error);
      res.status(500).json({ error: "Failed to add usage record" });
    }
  });

  app.get("/api/subscriptions/:id/usage", async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const records = await storage.getUsageRecords(req.params.id);
      res.json(records);
    } catch (error) {
      console.error("Error fetching usage records:", error);
      res.status(500).json({ error: "Failed to fetch usage records" });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id/dismiss", async (req, res) => {
    try {
      const alert = await storage.dismissAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ error: "Failed to dismiss alert" });
    }
  });

  app.get("/api/savings", async (req, res) => {
    try {
      const savings = await storage.getSavings();
      res.json(savings);
    } catch (error) {
      console.error("Error fetching savings:", error);
      res.status(500).json({ error: "Failed to fetch savings" });
    }
  });

  return httpServer;
}
