import { request } from "./autonClient";

export type MarketplaceModel = {
  id: string;
  name: string;
  description: string | null;
  contextLength: number | null;
  spotRatePerM: number | null;
  openRouterAvailable: boolean;
  pricing: {
    prompt?: string;
    completion?: string;
  } | null;
};

export type MarketplaceContract = {
  tier: string;
  name: string;
  subtitle: string;
  type: "future" | "capacity";
  models: MarketplaceModel[];
  modelIds: string[];
  expiry: string;
  expiryDate: string;
  lockedRatePerM: number;
  spotRatePerM: number | null;
  minPurchaseTokens: number;
  capacityLabel: string;
  features: string[];
};

export type MarketplaceCatalog = {
  paymentRequired: boolean;
  usdcMint: string;
  treasuryWallet: string;
  openRouterSyncedAt: string | null;
  openRouterError: string | null;
  contracts: MarketplaceContract[];
};

export type PurchasedBalance = {
  id: string;
  modelTier: string;
  tokenBalanceRemaining: string;
  expiryDate: string;
  isExpired: boolean;
};

export type MarketplaceQuote = {
  modelTier: string;
  tokenAmount: number;
  lockedRatePerM: number;
  expiryDate: string;
  paymentRequired: boolean;
  usdcMint: string;
  treasuryWallet: string;
  usdcAmountMicro: string;
  usdcAmount: string;
};

export async function fetchMarketplaceCatalog() {
  return request<MarketplaceCatalog>("/api/v1/marketplace/catalog");
}

export async function fetchMarketplaceQuote(
  modelTier: string,
  tokenAmount: number,
) {
  const params = new URLSearchParams({
    modelTier,
    tokenAmount: String(tokenAmount),
  });

  return request<MarketplaceQuote>(
    `/api/v1/marketplace/quote?${params.toString()}`,
  );
}

export async function purchaseComputeContract(input: {
  modelTier: string;
  tokenAmount: number;
  txSignature?: string;
}) {
  return request<{
    balance: PurchasedBalance;
    payment: { txSignature: string; usdcAmountMicro: string } | null;
    message: string;
  }>("/api/v1/marketplace/purchase", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
