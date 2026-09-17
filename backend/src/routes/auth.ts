import { randomUUID } from "node:crypto";
import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { AuthError, loginWithPrivy, loginWithWallet } from "../services/auth.js";
import { buildLoginMessage } from "../utils/evm-auth.js";

export const authRouter: RouterType = Router();

const evmAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Expected a Robinhood (EVM) wallet address");

const loginSchema = z.object({
  walletAddress: evmAddress,
  message: z.string().min(1).max(1024),
  signature: z.string().min(80).max(200),
});

const privyLoginSchema = z.object({
  accessToken: z.string().min(1),
  walletAddress: evmAddress,
});

authRouter.get("/nonce/:walletAddress", (req, res) => {
  const walletAddress = req.params.walletAddress;
  const nonce = randomUUID();

  res.json({
    nonce,
    message: buildLoginMessage(walletAddress, nonce),
  });
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginWithWallet(
      body.walletAddress,
      body.message,
      body.signature,
    );

    res.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: { message: error.message, code: "auth_failed" },
      });
    }
    next(error);
  }
});

authRouter.post("/privy", async (req, res, next) => {
  try {
    const body = privyLoginSchema.parse(req.body);
    const result = await loginWithPrivy(body.accessToken, body.walletAddress);

    res.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: { message: error.message, code: "auth_failed" },
      });
    }
    next(error);
  }
});
