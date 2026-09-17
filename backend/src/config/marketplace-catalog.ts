export type ContractType = "future" | "capacity";

export type MarketplaceTierConfig = {
  tier: string;
  name: string;
  subtitle: string;
  type: ContractType;
  models: string[];
  expiryDate: string;
  expiryLabel: string;
  lockedRatePerM: number;
  minPurchaseTokens: number;
  capacityLabel: string;
  features: string[];
};

/** Canonical inference futures catalog (OpenRouter model IDs). */
export const MARKETPLACE_CATALOG: MarketplaceTierConfig[] = [
  {
    tier: "cSEEK-SEP26",
    name: "DeepSeek Inference Future",
    subtitle: "Fixed-rate forward contract for DeepSeek models through September 2026",
    type: "future",
    models: [
      "deepseek/deepseek-chat",
      "deepseek/deepseek-chat-v3.1",
      "deepseek/deepseek-v3.2",
      "deepseek/deepseek-r1",
      "deepseek/deepseek-r1-0528",
      "deepseek/deepseek-r1-distill-llama-70b",
    ],
    expiryDate: "2026-09-30T00:00:00.000Z",
    expiryLabel: "2026-09-30",
    lockedRatePerM: 0.14,
    minPurchaseTokens: 1_000_000,
    capacityLabel: "1M token notional",
    features: [
      "Locked inference rate",
      "OpenRouter-routed",
      "USDC settlement",
    ],
  },
  {
    tier: "cLLAMA-AUG26",
    name: "Llama Inference Future",
    subtitle: "Fixed-rate Llama 3.x and Llama 4 inference through August 2026",
    type: "future",
    models: [
      "meta-llama/llama-3.3-70b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
      "meta-llama/llama-3.1-8b-instruct",
      "meta-llama/llama-3.2-3b-instruct",
      "meta-llama/llama-4-maverick",
      "meta-llama/llama-4-scout",
    ],
    expiryDate: "2026-08-31T00:00:00.000Z",
    expiryLabel: "2026-08-31",
    lockedRatePerM: 0.18,
    minPurchaseTokens: 1_000_000,
    capacityLabel: "1M token notional",
    features: [
      "Multi-model tier",
      "Gateway-ready",
      "USDC settlement",
    ],
  },
  {
    tier: "cQWEN-OCT26",
    name: "Qwen Inference Future",
    subtitle: "Fixed-rate Qwen 2.5 and Qwen3 inference through October 2026",
    type: "future",
    models: [
      "qwen/qwen-2.5-72b-instruct",
      "qwen/qwen-2.5-coder-32b-instruct",
      "qwen/qwen3-235b-a22b",
      "qwen/qwen3-30b-a3b",
    ],
    expiryDate: "2026-10-31T00:00:00.000Z",
    expiryLabel: "2026-10-31",
    lockedRatePerM: 0.16,
    minPurchaseTokens: 1_000_000,
    capacityLabel: "1M token notional",
    features: [
      "Reasoning + coder models",
      "OpenRouter-routed",
      "USDC settlement",
    ],
  },
  {
    tier: "cMISTRAL-NOV26",
    name: "Mistral Inference Future",
    subtitle: "Fixed-rate Mistral and Codestral inference through November 2026",
    type: "future",
    models: [
      "mistralai/mistral-large-2512",
      "mistralai/mistral-medium-3.1",
      "mistralai/mistral-small-24b-instruct-2501",
      "mistralai/codestral-2508",
      "mistralai/mistral-nemo",
    ],
    expiryDate: "2026-11-30T00:00:00.000Z",
    expiryLabel: "2026-11-30",
    lockedRatePerM: 0.22,
    minPurchaseTokens: 1_000_000,
    capacityLabel: "1M token notional",
    features: [
      "EU-built models",
      "Gateway-ready",
      "USDC settlement",
    ],
  },
  {
    tier: "cGPT-DEC26",
    name: "GPT Inference Future",
    subtitle: "Fixed-rate OpenAI GPT inference through December 2026",
    type: "future",
    models: [
      "openai/gpt-4o",
      "openai/gpt-4.1",
      "openai/gpt-4.1-mini",
    ],
    expiryDate: "2026-12-31T00:00:00.000Z",
    expiryLabel: "2026-12-31",
    lockedRatePerM: 3.5,
    minPurchaseTokens: 500_000,
    capacityLabel: "500K token notional",
    features: [
      "OpenAI frontier models",
      "OpenRouter-routed",
      "USDC settlement",
    ],
  },
  {
    tier: "cGEMINI-DEC26",
    name: "Gemini Inference Future",
    subtitle: "Fixed-rate Google Gemini inference through December 2026",
    type: "future",
    models: [
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
      "google/gemini-2.5-pro",
    ],
    expiryDate: "2026-12-31T00:00:00.000Z",
    expiryLabel: "2026-12-31",
    lockedRatePerM: 2.5,
    minPurchaseTokens: 500_000,
    capacityLabel: "500K token notional",
    features: [
      "Google frontier models",
      "OpenRouter-routed",
      "USDC settlement",
    ],
  },
  {
    tier: "cCLAUDE-DEC26",
    name: "Claude Inference Future",
    subtitle: "Fixed-rate Anthropic Claude inference through December 2026",
    type: "future",
    models: [
      "anthropic/claude-3.5-haiku",
      "anthropic/claude-haiku-4.5",
    ],
    expiryDate: "2026-12-31T00:00:00.000Z",
    expiryLabel: "2026-12-31",
    lockedRatePerM: 1.8,
    minPurchaseTokens: 500_000,
    capacityLabel: "500K token notional",
    features: [
      "Anthropic Claude models",
      "OpenRouter-routed",
      "USDC settlement",
    ],
  },
];

export const MARKETPLACE_TIERS = Object.fromEntries(
  MARKETPLACE_CATALOG.map((entry) => [
    entry.tier,
    {
      minPurchaseTokens: entry.minPurchaseTokens,
      expiryDate: entry.expiryDate,
      lockedRatePerM: entry.lockedRatePerM,
      models: entry.models,
    },
  ]),
) as Record<
  string,
  {
    minPurchaseTokens: number;
    expiryDate: string;
    lockedRatePerM: number;
    models: string[];
  }
>;

export function getTierConfig(tier: string) {
  return MARKETPLACE_CATALOG.find((entry) => entry.tier === tier) ?? null;
}
