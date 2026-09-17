import { useCallback, useEffect, useState } from "react";
import type { StakePool } from "@streamflow/staking";
import { autoStakingConfig } from "../config/auto-staking";
import { useStakingStatusFromConfig } from "./use-auton-config";
import {
  fetchStakePool,
  fetchUserStakeEntries,
} from "../lib/staking/client";

type StakeEntryAccount = Awaited<
  ReturnType<typeof fetchUserStakeEntries>
>[number];

export function useStaking(walletAddress: string | null) {
  const status = useStakingStatusFromConfig();
  const [pool, setPool] = useState<StakePool | null>(null);
  const [entries, setEntries] = useState<StakeEntryAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "live") {
      setPool(null);
      setEntries([]);
      return;
    }

    setLoading(true);

    try {
      const [poolData, userEntries] = await Promise.all([
        fetchStakePool(),
        walletAddress
          ? fetchUserStakeEntries(walletAddress)
          : Promise.resolve([]),
      ]);

      setPool(poolData);
      setEntries(userEntries);
    } catch {
      setPool(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [status, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    pool,
    entries,
    loading,
    refresh,
    config: autoStakingConfig,
  };
}
