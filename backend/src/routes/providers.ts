import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  enrollProviderNode,
  getNetworkStats,
  getProviderStatus,
  getWorkerScriptSource,
  recordWorkerHeartbeat,
} from "../services/providers.js";
import { isAutonWorkerToken } from "../utils/workerTokens.js";

export const providersRouter: RouterType = Router();

providersRouter.get("/network", async (_req, res, next) => {
  try {
    const stats = await getNetworkStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

providersRouter.get("/status", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const status = await getProviderStatus(userId);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

providersRouter.post("/enroll", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({ label: z.enum(["native", "browser"]).default("native") })
      .parse(req.body ?? {});

    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const result = await enrollProviderNode(userId, body.label);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

providersRouter.post("/heartbeat", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!isAutonWorkerToken(token)) {
      return res.status(401).json({
        error: { message: "Invalid worker token", code: "invalid_worker_token" },
      });
    }

    const body = z
      .object({ version: z.string().optional() })
      .parse(req.body ?? {});

    const result = await recordWorkerHeartbeat(token, body);

    if (!result) {
      return res.status(401).json({
        error: { message: "Unknown worker token", code: "invalid_worker_token" },
      });
    }

    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

providersRouter.get("/worker.mjs", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(getWorkerScriptSource());
});
