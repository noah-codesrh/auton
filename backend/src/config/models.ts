import { MARKETPLACE_CATALOG } from "./marketplace-catalog.js";

/** Maps OpenRouter model IDs → forward-contract tier. Built from marketplace catalog. */
export const MODEL_TO_TIER: Record<string, string> = Object.fromEntries(
  MARKETPLACE_CATALOG.flatMap((tier) =>
    tier.models.map((model) => [model, tier.tier]),
  ),
);

export function resolveModelTier(model: string): string | null {
  if (MODEL_TO_TIER[model]) {
    return MODEL_TO_TIER[model];
  }

  const normalized = model.toLowerCase();
  for (const [openRouterModel, tier] of Object.entries(MODEL_TO_TIER)) {
    if (openRouterModel.toLowerCase() === normalized) {
      return tier;
    }
  }

  return null;
}

export function listGatewayModelIds(): string[] {
  return MARKETPLACE_CATALOG.flatMap((tier) => tier.models);
}

export const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://www.autonairh.xyz",
  "X-Title": "Auton Compute Layer",
} as const;
