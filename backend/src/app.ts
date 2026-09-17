import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { corsOrigins, env } from "./config/env.js";
import { checkSupabaseConnection } from "./db/supabase.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { configRouter } from "./routes/config.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { gatewayRouter } from "./routes/gateway.js";
import { stakeRouter } from "./routes/stake.js";
import { providersRouter } from "./routes/providers.js";
import { marketplaceRouter } from "./routes/marketplace.js";
import { tradeRouter } from "./routes/trade.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = origin.replace(/\/+$/, "");
        if (corsOrigins.includes(normalizedOrigin)) {
          callback(null, origin);
          return;
        }

        if (env.NODE_ENV === "development") {
          try {
            const { hostname } = new URL(origin);
            if (hostname === "localhost" || hostname === "127.0.0.1") {
              callback(null, origin);
              return;
            }
          } catch {
            // ignore malformed Origin
          }
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "auton-backend",
      environment: env.NODE_ENV,
      database: "supabase",
    });
  });

  app.get("/health/db", async (_req, res) => {
    const supabase = await checkSupabaseConnection();

    res.status(supabase.ok ? 200 : 503).json({
      status: supabase.ok ? "ok" : "degraded",
      database: "supabase",
      supabase,
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/config", configRouter);
  app.use("/api/v1/stake", stakeRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/providers", providersRouter);
  app.use("/api/v1/marketplace", marketplaceRouter);
  app.use("/api/v1/trade", tradeRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1/gateway", gatewayRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
