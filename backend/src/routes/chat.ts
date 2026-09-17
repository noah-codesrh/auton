import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ChatError, handleChatCompletion } from "../services/chat.js";
import {
  CreditError,
  getCreditBalance,
  getRecentUsage,
  getTopUpQuote,
  topUpCredits,
  type CreditAsset,
} from "../services/credits.js";
import { TokenVerificationError } from "../services/solana.js";

export const chatRouter: RouterType = Router();

const assetSchema = z.enum(["USDC", "AUTO"]);

chatRouter.get("/balance", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const balance = await getCreditBalance(userId);
    res.json(balance);
  } catch (error) {
    next(error);
  }
});

chatRouter.get("/usage", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const usage = await getRecentUsage(userId);
    res.json({ usage });
  } catch (error) {
    next(error);
  }
});

chatRouter.get("/quote", requireAuth, async (req, res) => {
  try {
    const usdAmount = Number(req.query.usdAmount);
    const asset = assetSchema.parse(req.query.asset) as CreditAsset;
    const quote = await getTopUpQuote(usdAmount, asset);
    res.json(quote);
  } catch (error) {
    if (error instanceof CreditError) {
      return res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: "credit_error" } });
    }
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: { message: "asset must be USDC or AUTO", code: "invalid_request" } });
    }
    throw error;
  }
});

const topUpSchema = z.object({
  // Token amount actually transferred on-chain (USDC tokens, or $AUTO tokens).
  amount: z.number().positive(),
  asset: assetSchema,
  txSignature: z.string().min(64).max(128).optional(),
});

chatRouter.post("/topup", requireAuth, async (req, res, next) => {
  try {
    const body = topUpSchema.parse(req.body);
    const { sub: userId, wallet } = (req as AuthenticatedRequest).auth;

    const result = await topUpCredits({
      userId,
      wallet,
      amount: body.amount,
      asset: body.asset,
      txSignature: body.txSignature,
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof TokenVerificationError) {
      return res
        .status(400)
        .json({ error: { message: error.message, code: error.name } });
    }
    if (error instanceof CreditError) {
      return res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: "credit_error" } });
    }
    next(error);
  }
});

const completionSchema = z
  .object({
    model: z.string().min(1),
    messages: z.array(z.record(z.string(), z.unknown())).min(1),
    stream: z.boolean().optional(),
  })
  .passthrough();

chatRouter.post("/completions", requireAuth, async (req, res, next) => {
  try {
    completionSchema.parse(req.body);
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    await handleChatCompletion(req, res, { userId });
  } catch (error) {
    if (res.headersSent) {
      // Streaming already started; surface the error in-band and close.
      const message =
        error instanceof Error ? error.message : "Chat request failed";
      res.write(`data: ${JSON.stringify({ error: { message } })}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    }
    if (error instanceof ChatError) {
      return res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: "chat_error" } });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { message: "Invalid chat request body", code: "invalid_request" },
      });
    }
    next(error);
  }
});
