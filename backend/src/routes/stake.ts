import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  claimUsdcYield,
  recordStakeDeposit,
  StakeServiceError,
} from "../services/staking.js";
import { StakeVerificationError } from "../services/solana.js";

export const stakeRouter: RouterType = Router();

const depositSchema = z.object({
  txSignature: z.string().min(64).max(128),
  amount: z.union([z.number().positive(), z.string().min(1)]),
});

stakeRouter.post("/deposit", requireAuth, async (req, res, next) => {
  try {
    const body = depositSchema.parse(req.body);
    const { sub: userId, wallet } = (req as AuthenticatedRequest).auth;

    const result = await recordStakeDeposit(
      userId,
      wallet,
      body.txSignature,
      body.amount,
    );

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof StakeVerificationError) {
      return res.status(400).json({
        error: { message: error.message, code: error.name },
      });
    }
    if (error instanceof StakeServiceError) {
      return res.status(error.statusCode).json({
        error: { message: error.message, code: error.name },
      });
    }
    next(error);
  }
});

stakeRouter.post("/claim", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId, wallet } = (req as AuthenticatedRequest).auth;
    const result = await claimUsdcYield(userId, wallet);
    res.json(result);
  } catch (error) {
    if (error instanceof StakeServiceError) {
      return res.status(error.statusCode).json({
        error: { message: error.message, code: error.name },
      });
    }
    next(error);
  }
});

stakeRouter.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const { sub: userId } = (req as AuthenticatedRequest).auth;
    const { getStakingTotals } = await import("../services/staking.js");
    const totals = await getStakingTotals(userId);
    res.json(totals);
  } catch (error) {
    next(error);
  }
});
