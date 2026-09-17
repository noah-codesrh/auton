import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createApiKey, getDashboardStats } from "../services/dashboard.js";

export const dashboardRouter: RouterType = Router();

const createKeySchema = z.object({
  name: z.string().min(1).max(64),
});

dashboardRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const stats = await getDashboardStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

dashboardRouter.post("/api-keys", requireAuth, async (req, res, next) => {
  try {
    const body = createKeySchema.parse(req.body);
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const result = await createApiKey(userId, body.name);

    res.status(201).json({
      apiKey: result.apiKey,
      key: result.plainKey,
      warning: "Store this key securely. It will not be shown again.",
    });
  } catch (error) {
    next(error);
  }
});
