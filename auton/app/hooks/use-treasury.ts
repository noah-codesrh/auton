import { useCallback, useEffect, useState } from "react";
import { fetchTreasuryStats } from "../lib/api/autonClient";
import { FALLBACK_TREASURY } from "../lib/api/fallback-data";
import type { TreasuryData } from "../lib/treasury/types";

export function useTreasury() {
  const [data, setData] = useState<TreasuryData>(FALLBACK_TREASURY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const stats = await fetchTreasuryStats();
      setData(stats);
    } catch {
      setData(FALLBACK_TREASURY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
