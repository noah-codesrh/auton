import { useCallback, useEffect, useState } from "react";
import { hasActiveSession } from "../lib/api/client";
import {
  buyOption as apiBuyOption,
  closeOption as apiCloseOption,
  fetchOptionPositions,
  type OptionOrderInput,
  type OptionPosition,
} from "../lib/api/options";
import type { CreditBalance } from "../lib/api/credits";

const POLL_MS = 8_000;

/**
 * Manages the user's bought option positions: fetches + polls them so open
 * positions stay marked-to-market, and exposes buy/close actions. Balance
 * updates from buy/close are returned to the caller so the credit chip can
 * refresh immediately.
 */
export function useOptions() {
  const [positions, setPositions] = useState<OptionPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    if (!hasActiveSession()) {
      setPositions([]);
      return;
    }
    setLoading(true);
    try {
      const { positions: next } = await fetchOptionPositions();
      setPositions(next);
    } catch {
      // keep last known positions
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Poll unconditionally; refresh() no-ops without a session, so positions
    // start marking as soon as the wallet connects mid-session.
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const buy = useCallback(
    async (input: OptionOrderInput): Promise<CreditBalance> => {
      setWorking(true);
      try {
        const { balance } = await apiBuyOption(input);
        await refresh();
        return balance;
      } finally {
        setWorking(false);
      }
    },
    [refresh],
  );

  const close = useCallback(
    async (positionId: string): Promise<CreditBalance> => {
      setWorking(true);
      try {
        const { balance } = await apiCloseOption(positionId);
        await refresh();
        return balance;
      } finally {
        setWorking(false);
      }
    },
    [refresh],
  );

  const openPositions = positions.filter((p) => p.status === "OPEN");
  const closedPositions = positions.filter((p) => p.status === "CLOSED");

  return {
    positions,
    openPositions,
    closedPositions,
    loading,
    working,
    refresh,
    buy,
    close,
  };
}
