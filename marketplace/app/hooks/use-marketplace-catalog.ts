import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMarketplaceCatalog,
  type MarketplaceCatalog,
  type MarketplaceContract,
} from "../lib/api/marketplace";

const EMPTY_CATALOG: MarketplaceCatalog = {
  paymentRequired: true,
  usdcMint: "",
  treasuryWallet: "",
  openRouterSyncedAt: null,
  openRouterError: null,
  contracts: [],
};

/** How often to re-pull live OpenRouter pricing (ms). */
const REFRESH_INTERVAL_MS = 60_000;

export function useMarketplaceCatalog() {
  const [catalog, setCatalog] = useState<MarketplaceCatalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedOnceRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadedOnceRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchMarketplaceCatalog();
      setCatalog(data);
      loadedOnceRef.current = true;
    } catch (err) {
      if (!loadedOnceRef.current) {
        setCatalog(EMPTY_CATALOG);
      }
      setError(
        err instanceof Error ? err.message : "Could not load marketplace catalog",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const interval = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const contracts = catalog.contracts.filter(
    (contract): contract is MarketplaceContract => contract.type === "future",
  );

  return {
    catalog,
    contracts,
    loading,
    refreshing,
    error,
    refresh,
    syncedAt: catalog.openRouterSyncedAt,
    syncError: catalog.openRouterError,
  };
}
