import { config } from "dotenv";
import { existsSync } from "node:fs";
import { z } from "zod";

// Local dev only — Railway injects vars into process.env at runtime.
// override: true so a stale shell CORS_ORIGINS cannot shadow backend/.env.
if (existsSync(".env")) {
  config({ override: true });
}

const requiredKeys = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "MASTER_VAULT_WALLET",
  "OPENROUTER_API_KEY",
] as const;

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SOLANA_RPC_URL: z
    .string()
    .url()
    .default("https://rpc.mainnet.chain.robinhood.com"),
  ROBINHOOD_RPC_URL: z
    .string()
    .url()
    .default("https://rpc.mainnet.chain.robinhood.com"),
  ROBINHOOD_CHAIN_ID: z.coerce.number().int().positive().default(4663),
  MASTER_VAULT_WALLET: z.string().min(32),
  AUTO_TOKEN_MINT: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().min(40).optional(),
  ),
  AUTO_TOKEN_DECIMALS: z.coerce.number().int().positive().default(6),
  // Used for $AUTO/USD valuation until a Robinhood DEX oracle exists.
  AUTO_USD_PRICE: z.coerce.number().positive().default(0.005),
  // User-facing settlement token is USDG on Robinhood. Internal asset code stays "USDC".
  USDC_TOKEN_MINT: z
    .string()
    .min(40)
    .default("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"),
  USDC_TOKEN_DECIMALS: z.coerce.number().int().positive().default(6),
  MARKETPLACE_SKIP_PAYMENT: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  OPENROUTER_API_KEY: z.string().min(1),
  // Chat credit pricing: charge users this fraction of OpenRouter spot per token.
  // 0.85 => 15% cheaper than spot ("lesser credits"). Margin comes from Auton
  // buying compute wholesale. Must be > 0; values >= 1 disable the discount.
  CHAT_CREDIT_RATE_MULTIPLIER: z.coerce.number().positive().default(0.85),
  // Smallest USD top-up accepted for the unified credit wallet.
  CHAT_MIN_TOPUP_USD: z.coerce.number().positive().default(1),
  // 0x-prefixed EVM key for MASTER_VAULT_WALLET. When set, closed positions
  // and withdrawals pay USDG on-chain. Leave empty for ledger-only settlement.
  VAULT_PRIVATE_KEY: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .regex(
        /^0x[0-9a-fA-F]{64}$/,
        "VAULT_PRIVATE_KEY must be a 0x-prefixed 32-byte EVM key",
      )
      .optional(),
  ),
  PRIVY_APP_ID: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().min(1).optional(),
  ),
  PRIVY_APP_SECRET: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().min(1).optional(),
  ),
});

const parsed = envSchema.safeParse({ ...process.env });

if (!parsed.success) {
  const presence = Object.fromEntries(
    requiredKeys.map((key) => [
      key,
      process.env[key] === undefined ? "missing" : `set (${process.env[key]!.length} chars)`,
    ]),
  );

  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  console.error("Required variable presence:", presence);
  console.error("Runtime context:", {
    nodeEnv: process.env.NODE_ENV ?? "(unset)",
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT ?? "(unset)",
    railwayService: process.env.RAILWAY_SERVICE_NAME ?? "(unset)",
    port: process.env.PORT ?? "(unset)",
  });
  console.error(
    "\nIf running on Railway: add these variables on the service (not just the project),",
    "confirm each value is non-empty, then redeploy from Deployments → Redeploy.",
  );
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
