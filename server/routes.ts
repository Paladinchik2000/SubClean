import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, updateSubscriptionSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
        notes: parsed.data.notes ?? null,
        nextBillingDate: null,
        markedForCancellation: false,
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

      const subscription = await storage.updateSubscription(req.params.id, parsed.data);
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

  return httpServer;
}
