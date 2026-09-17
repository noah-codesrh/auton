import { useCallback, useEffect, useState } from "react";
import type { DashboardStats } from "../lib/api/types";
import {
  createApiKey,
  fetchDashboardStats,
  hasActiveSession,
} from "../lib/api/autonClient";
import { FALLBACK_DASHBOARD } from "../lib/api/fallback-data";

export function useDashboard(enabled: boolean) {
  const [data, setData] = useState<DashboardStats>(FALLBACK_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);

    try {
      const stats = await fetchDashboardStats();
      setData(stats);
    } catch {
      setData(FALLBACK_DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generateKey = useCallback(
    async (name: string) => {
      const result = await createApiKey(name);
      setNewKey(result.key);
      setData((current) => ({
        ...current,
        apiKeys: [result.apiKey, ...current.apiKeys],
      }));
      return result;
    },
    [],
  );

  return {
    data,
    loading,
    newKey,
    setNewKey,
    refresh,
    generateKey,
    hasSession: hasActiveSession(),
  };
}
