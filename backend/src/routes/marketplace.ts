import {
  Router,
  type NextFunction,
  type Response,
  type Router as RouterType,
} from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { buildDerivatives } from "../services/derivatives.js";
import { buildIndexes } from "../services/indexes.js";
import { buildMarketplaceCatalog } from "../services/marketplace-catalog.js";
import { buildModelDirectory } from "../services/model-directory.js";
import { buildYieldCurve } from "../services/yield-curve.js";
import {
  getPurchaseQuote,
  MarketplaceError,
  purchaseComputeContract,
} from "../services/marketplace.js";
import {
  buyOption,
  closeOption,
  listOptionPositions,
  OptionError,
  quoteOption,
} from "../services/options.js";
import { TokenVerificationError } from "../services/solana.js";

export const marketplaceRouter: RouterType = Router();

marketplaceRouter.get("/catalog", async (_req, res, next) => {
  try {
    const catalog = await buildMarketplaceCatalog();
    res.json(catalog);
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get("/models", async (_req, res, next) => {
  try {
    const directory = await buildModelDirectory();
    res.json(directory);
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get("/curve", async (_req, res, next) => {
  try {
    const curve = await buildYieldCurve();
    res.json(curve);
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get("/derivatives", async (_req, res, next) => {
  try {
    const derivatives = await buildDerivatives();
    res.json(derivatives);
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get("/indexes", async (_req, res, next) => {
  try {
    const indexes = await buildIndexes();
    res.json(indexes);
  } catch (error) {
    next(error);
  }
});

const optionOrderSchema = z.object({
  tier: z.string().min(1),
  side: z.enum(["CALL", "PUT"]),
  strike: z.number().positive(),
  expiryDate: z.number().int().positive(),
  contractsMillions: z.number().positive(),
});

function handleOptionError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof OptionError) {
    res
      .status(error.statusCode)
      .json({ error: { message: error.message, code: "option_error" } });
    return;
  }
  next(error);
}

marketplaceRouter.post("/options/quote", async (req, res, next) => {
  try {
    const body = optionOrderSchema.parse(req.body);
    const quote = await quoteOption(body);
    res.json(quote);
  } catch (error) {
    handleOptionError(error, res, next);
  }
});

marketplaceRouter.post("/options/buy", requireAuth, async (req, res, next) => {
  try {
    const body = optionOrderSchema.parse(req.body);
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const result = await buyOption(userId, body);
    res.status(201).json(result);
  } catch (error) {
    handleOptionError(error, res, next);
  }
});

marketplaceRouter.get("/options/positions", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const positions = await listOptionPositions(userId);
    res.json({ positions });
  } catch (error) {
    handleOptionError(error, res, next);
  }
});

const closeSchema = z.object({ positionId: z.string().uuid() });

marketplaceRouter.post("/options/close", requireAuth, async (req, res, next) => {
  try {
    const { positionId } = closeSchema.parse(req.body);
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const result = await closeOption(userId, positionId);
    res.json(result);
  } catch (error) {
    handleOptionError(error, res, next);
  }
});

marketplaceRouter.get("/quote", (req, res) => {
  try {
    const modelTier = String(req.query.modelTier ?? "");
    const tokenAmount = Number(req.query.tokenAmount);

    const quote = getPurchaseQuote(modelTier, tokenAmount);
    res.json(quote);
  } catch (error) {
    if (error instanceof MarketplaceError) {
      return res.status(error.statusCode).json({
        error: { message: error.message, code: "marketplace_error" },
      });
    }
    throw error;
  }
});

const purchaseSchema = z.object({
  modelTier: z.string().min(1),
  tokenAmount: z.number().int().positive(),
  txSignature: z.string().min(64).max(128).optional(),
});

marketplaceRouter.post("/purchase", requireAuth, async (req, res, next) => {
  try {
    const body = purchaseSchema.parse(req.body);
    const { sub: userId, wallet } = (req as AuthenticatedRequest).auth;

    const result = await purchaseComputeContract(
      userId,
      wallet,
      body.modelTier,
      body.tokenAmount,
      body.txSignature,
    );

    res.status(201).json({
      ...result,
      message: body.txSignature
        ? "Forward compute contract purchased with on-chain USDG payment."
        : "Forward compute contract purchased. Use your dashboard API key at the gateway.",
    });
  } catch (error) {
    if (error instanceof TokenVerificationError) {
      return res.status(400).json({
        error: { message: error.message, code: error.name },
      });
    }
    if (error instanceof MarketplaceError) {
      return res.status(error.statusCode).json({
        error: { message: error.message, code: "marketplace_error" },
      });
    }
    next(error);
  }
});
