import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { LEVERAGE_OPTIONS, TRADING_MARKETS } from "../config/trading.js";
import { getSupabase } from "../db/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { getAutoPriceInfo } from "../services/auto-price.js";
import {
  getAllMarketSummaries,
  getCandles,
  getOrderbook,
  getSimulatedTrades,
  type Trade,
} from "../services/price-engine.js";
import {
  cancelOrder,
  closePosition,
  depositMargin,
  getTradingAccount,
  openPosition,
  TradingError,
  withdrawMargin,
} from "../services/trading.js";

export const tradeRouter: RouterType = Router();

function handleError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof TradingError) {
    return res.status(error.statusCode).json({
      error: { message: error.message, code: "trading_error" },
    });
  }
  next(error);
}

tradeRouter.get("/markets", (_req, res) => {
  const summaries = getAllMarketSummaries();
  const byTier = new Map(summaries.map((s) => [s.tier, s]));

  const markets = TRADING_MARKETS.map((market) => {
    const summary = byTier.get(market.tier) ?? {
      markPrice: 0,
      spotPrice: 0,
      dayOpen: 0,
      changePercent: 0,
    };
    return {
      ...summary,
      tier: market.tier,
      symbol: market.symbol,
      name: market.name,
      modelIds: market.modelIds,
    };
  });

  res.json({
    markets,
    leverageOptions: LEVERAGE_OPTIONS,
    autoTokenMint: env.AUTO_TOKEN_MINT ?? "",
    autoTokenDecimals: env.AUTO_TOKEN_DECIMALS,
    usdcTokenMint: env.USDC_TOKEN_MINT,
    usdcTokenDecimals: env.USDC_TOKEN_DECIMALS,
    vaultWallet: env.MASTER_VAULT_WALLET,
    depositRequired: !env.MARKETPLACE_SKIP_PAYMENT,
  });
});

tradeRouter.get("/auto-price", async (_req, res, next) => {
  try {
    res.json(await getAutoPriceInfo());
  } catch (error) {
    next(error);
  }
});

tradeRouter.get("/markets/:tier/candles", (req, res) => {
  res.json({ candles: getCandles(req.params.tier) });
});

tradeRouter.get("/markets/:tier/orderbook", (req, res) => {
  res.json(getOrderbook(req.params.tier));
});

tradeRouter.get("/markets/:tier/trades", async (req, res, next) => {
  try {
    const tier = req.params.tier;
    const sim = getSimulatedTrades(tier);

    // Merge real on-chain purchases of this tier's compute as "market" trades.
    let real: Trade[] = [];
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("marketplace_purchases")
        .select("id, token_amount, usdc_amount_micro, created_at")
        .eq("model_tier", tier)
        .order("created_at", { ascending: false })
        .limit(15);

      real = (data ?? []).map((row) => {
        const sizeMillions = Number(row.token_amount) / 1_000_000;
        const usdc = Number(row.usdc_amount_micro) / 1_000_000;
        const price = sizeMillions > 0 ? usdc / sizeMillions : 0;
        return {
          id: row.id,
          time: new Date(row.created_at).getTime(),
          price: Math.round(price * 10000) / 10000,
          sizeMillions: Math.round(sizeMillions * 100) / 100,
          side: "buy" as const,
          source: "market" as const,
        };
      });
    } catch {
      real = [];
    }

    const merged = [...real, ...sim]
      .sort((a, b) => b.time - a.time)
      .slice(0, 40);

    res.json({ trades: merged });
  } catch (error) {
    next(error);
  }
});

tradeRouter.get("/account", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    res.json(await getTradingAccount(userId));
  } catch (error) {
    handleError(error, res, next);
  }
});

const depositSchema = z.object({
  amount: z.number().positive(),
  asset: z.enum(["AUTO", "USDC"]).default("USDC"),
  txSignature: z.string().min(32).max(128).optional(),
});

tradeRouter.post("/deposit", requireAuth, async (req, res, next) => {
  try {
    const body = depositSchema.parse(req.body);
    const { sub: userId, wallet } = (req as AuthenticatedRequest).auth;
    const account = await depositMargin(
      userId,
      wallet,
      body.amount,
      body.asset,
      body.txSignature,
    );
    res.status(201).json({ account });
  } catch (error) {
    handleError(error, res, next);
  }
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
  asset: z.enum(["AUTO", "USDC"]).default("USDC"),
});

tradeRouter.post("/withdraw", requireAuth, async (req, res, next) => {
  try {
    const body = withdrawSchema.parse(req.body);
    const { sub: userId, wallet } = (req as AuthenticatedRequest).auth;
    const result = await withdrawMargin(userId, wallet, body.amount, body.asset);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
});

const openSchema = z
  .object({
    marketTier: z.string().min(1),
    side: z.enum(["LONG", "SHORT"]),
    leverage: z.number().int().positive(),
    sizeMillions: z.number().positive(),
    orderType: z
      .enum([
        "MARKET",
        "LIMIT",
        "STOP_MARKET",
        "STOP_LIMIT",
        "TAKE_MARKET",
        "TAKE_LIMIT",
        "SCALE",
        "TWAP",
      ])
      .default("MARKET"),
    limitPrice: z.number().positive().optional(),
    triggerPrice: z.number().positive().optional(),
    scaleLow: z.number().positive().optional(),
    scaleHigh: z.number().positive().optional(),
    scaleCount: z.number().int().min(2).max(20).optional(),
    twapDurationMinutes: z.number().positive().optional(),
    twapCount: z.number().int().min(2).max(50).optional(),
  })
  .superRefine((body, ctx) => {
    const needsLimit = ["LIMIT", "STOP_LIMIT", "TAKE_LIMIT"];
    const needsTrigger = [
      "STOP_MARKET",
      "STOP_LIMIT",
      "TAKE_MARKET",
      "TAKE_LIMIT",
    ];
    if (needsLimit.includes(body.orderType) && typeof body.limitPrice !== "number") {
      ctx.addIssue({
        code: "custom",
        message: "limitPrice is required for this order type",
        path: ["limitPrice"],
      });
    }
    if (
      needsTrigger.includes(body.orderType) &&
      typeof body.triggerPrice !== "number"
    ) {
      ctx.addIssue({
        code: "custom",
        message: "triggerPrice is required for this order type",
        path: ["triggerPrice"],
      });
    }
    if (body.orderType === "SCALE") {
      if (
        typeof body.scaleLow !== "number" ||
        typeof body.scaleHigh !== "number" ||
        typeof body.scaleCount !== "number"
      ) {
        ctx.addIssue({
          code: "custom",
          message: "scaleLow, scaleHigh and scaleCount are required for a scale order",
          path: ["scaleCount"],
        });
      }
    }
    if (body.orderType === "TWAP") {
      if (
        typeof body.twapDurationMinutes !== "number" ||
        typeof body.twapCount !== "number"
      ) {
        ctx.addIssue({
          code: "custom",
          message: "twapDurationMinutes and twapCount are required for a TWAP order",
          path: ["twapCount"],
        });
      }
    }
  });

tradeRouter.post("/positions/open", requireAuth, async (req, res, next) => {
  try {
    const body = openSchema.parse(req.body);
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    res.status(201).json(await openPosition(userId, body));
  } catch (error) {
    handleError(error, res, next);
  }
});

tradeRouter.post("/positions/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    res.json(await cancelOrder(userId, String(req.params.id)));
  } catch (error) {
    handleError(error, res, next);
  }
});

tradeRouter.post("/positions/:id/close", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId, wallet } = (req as AuthenticatedRequest).auth;
    res.json(await closePosition(userId, String(req.params.id), wallet));
  } catch (error) {
    handleError(error, res, next);
  }
});
