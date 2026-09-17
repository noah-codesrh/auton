import { useCallback, useEffect, useState } from "react";
import {
  fetchMarketplaceCatalog,
  type MarketplaceCatalog,
  type MarketplaceContract,
} from "../lib/api/marketplace";
import { COMPUTE_CONTRACTS } from "../config/marketplace";

const FALLBACK_CONTRACTS: MarketplaceContract[] = COMPUTE_CONTRACTS.map(
  (contract) => ({
    tier: contract.tier,
    name: contract.name,
    subtitle: contract.subtitle,
    type: contract.type,
    models: contract.models.map((id) => ({
      id,
      name: id,
      description: null,
      contextLength: null,
      spotRatePerM: contract.spotRatePerM,
      openRouterAvailable: false,
      pricing: null,
    })),
    modelIds: contract.models,
    expiry: contract.expiry,
    expiryDate: contract.expiry,
    lockedRatePerM: contract.lockedRatePerM,
    spotRatePerM: contract.spotRatePerM,
    minPurchaseTokens: contract.minPurchaseTokens,
    capacityLabel: contract.capacityLabel,
    features: contract.features,
  }),
);

export function useMarketplaceCatalog() {
  const [catalog, setCatalog] = useState<MarketplaceCatalog>({
    paymentRequired: true,
    usdcMint: "",
    treasuryWallet: "",
    openRouterSyncedAt: null,
    openRouterError: null,
    contracts: FALLBACK_CONTRACTS,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketplaceCatalog();
      setCatalog(data);
    } catch {
      setCatalog((current) => ({
        ...current,
        openRouterError: "Could not load marketplace catalog from API",
        contracts: FALLBACK_CONTRACTS,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { catalog, contracts: catalog.contracts, loading, refresh };
}
