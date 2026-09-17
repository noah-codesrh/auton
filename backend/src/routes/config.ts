import { Router, type Router as RouterType } from "express";
import { env } from "../config/env.js";
import {
  ROBINHOOD_CHAIN_ID,
  ROBINHOOD_EXPLORER,
} from "../config/chain.js";

export const configRouter: RouterType = Router();

/** Public on-chain config — safe to expose (no secrets). */
configRouter.get("/", (_req, res) => {
  res.json({
    autoTokenMint: env.AUTO_TOKEN_MINT ?? "",
    masterVaultWallet: env.MASTER_VAULT_WALLET,
    autoTokenDecimals: env.AUTO_TOKEN_DECIMALS,
    usdcTokenMint: env.USDC_TOKEN_MINT,
    usdcTokenDecimals: env.USDC_TOKEN_DECIMALS,
    settlementAsset: "USDG",
    chainId: env.ROBINHOOD_CHAIN_ID || ROBINHOOD_CHAIN_ID,
    chainName: "Robinhood Chain",
    explorerUrl: ROBINHOOD_EXPLORER,
    marketplacePaymentRequired: !env.MARKETPLACE_SKIP_PAYMENT,
    gatewayPath: "/api/v1/gateway/v1/chat/completions",
    chatCompletionsPath: "/api/v1/chat/completions",
    chatRateMultiplier: env.CHAT_CREDIT_RATE_MULTIPLIER,
    chatMinTopUpUsd: env.CHAT_MIN_TOPUP_USD,
  });
});
