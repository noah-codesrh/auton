import { useCallback, useEffect, useState } from "react";
import type { DashboardStats } from "../lib/api/dashboard";
import { createApiKey, fetchDashboardStats } from "../lib/api/dashboard";

const EMPTY_DASHBOARD: DashboardStats = {
  apiKeys: [],
  computeBalances: [],
  staking: {
    totalStakedAuto: "0",
    claimableUsdcYield: "0",
    stakeCount: 0,
  },
};

export function useDashboard(enabled: boolean) {
  const [data, setData] = useState<DashboardStats>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const stats = await fetchDashboardStats();
      setData(stats);
    } catch (err) {
      setData(EMPTY_DASHBOARD);
      setError(
        err instanceof Error ? err.message : "Could not load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const generateKey = useCallback(async (name: string) => {
    const result = await createApiKey(name);
    setNewKey(result.key);
    setData((current) => ({
      ...current,
      apiKeys: [result.apiKey, ...current.apiKeys],
    }));
    return result;
  }, []);

  return {
    data,
    loading,
    error,
    newKey,
    setNewKey,
    refresh,
    generateKey,
  };
}
