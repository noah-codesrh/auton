import { env } from "../config/env.js";
import {
  MARKETPLACE_CATALOG,
  type MarketplaceTierConfig,
} from "../config/marketplace-catalog.js";
import {
  enrichModelFromOpenRouter,
  fetchOpenRouterModels,
  openRouterSpotRatePerM,
  type OpenRouterModel,
} from "./openrouter.js";

function tierSpotRatePerM(
  tier: MarketplaceTierConfig,
  openRouterModels: Map<string, OpenRouterModel>,
) {
  const rates = tier.models
    .map((modelId) => {
      const live =
        openRouterModels.get(modelId) ??
        openRouterModels.get(modelId.toLowerCase());
      return live ? openRouterSpotRatePerM(live) : null;
    })
    .filter((rate): rate is number => rate !== null);

  if (rates.length === 0) {
    return null;
  }

  return (
    Math.round((rates.reduce((sum, rate) => sum + rate, 0) / rates.length) * 100) /
    100
  );
}

export async function buildMarketplaceCatalog() {
  let openRouterModels = new Map<string, OpenRouterModel>();
  let openRouterSyncedAt: string | null = null;
  let openRouterError: string | null = null;

  try {
    openRouterModels = await fetchOpenRouterModels();
    openRouterSyncedAt = new Date().toISOString();
  } catch (error) {
    openRouterError =
      error instanceof Error ? error.message : "Failed to sync OpenRouter models";
  }

  const contracts = MARKETPLACE_CATALOG.map((tier) => {
    const models = tier.models.map((modelId) =>
      enrichModelFromOpenRouter(modelId, openRouterModels),
    );

    const spotRatePerM = tierSpotRatePerM(tier, openRouterModels);

    return {
      tier: tier.tier,
      name: tier.name,
      subtitle: tier.subtitle,
      type: tier.type,
      models,
      modelIds: tier.models,
      expiry: tier.expiryLabel,
      expiryDate: tier.expiryDate,
      lockedRatePerM: tier.lockedRatePerM,
      spotRatePerM,
      minPurchaseTokens: tier.minPurchaseTokens,
      capacityLabel: tier.capacityLabel,
      features: tier.features,
    };
  });

  return {
    paymentRequired: !env.MARKETPLACE_SKIP_PAYMENT,
    usdcMint: env.USDC_TOKEN_MINT,
    treasuryWallet: env.MASTER_VAULT_WALLET,
    openRouterSyncedAt,
    openRouterError,
    contracts,
  };
}

export async function buildGatewayModelsList() {
  const catalog = await buildMarketplaceCatalog();

  const data = catalog.contracts.flatMap((contract) =>
    contract.models.map((model) => ({
      id: model.id,
      object: "model" as const,
      created: Math.floor(Date.now() / 1000),
      owned_by: "openrouter",
      tier: contract.tier,
      name: model.name,
      context_length: model.contextLength,
    })),
  );

  return {
    object: "list" as const,
    data,
  };
}
