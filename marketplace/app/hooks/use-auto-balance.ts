import { useEffect, useState } from "react";
import { useConfig } from "./use-config";
import {
  fetchWalletAutoBalance,
  formatAutoAmount,
} from "../lib/solana/auto-balance";

export function useAutoBalance(walletAddress: string | null) {
  const { config } = useConfig();
  const [walletAuto, setWalletAuto] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mint = config?.autoTokenMint?.trim() ?? "";
  const decimals = config?.autoTokenDecimals ?? 6;

  useEffect(() => {
    if (!walletAddress || !mint) {
      setWalletAuto(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchWalletAutoBalance(walletAddress, mint, decimals)
      .then((amount) => {
        if (!cancelled) setWalletAuto(amount);
      })
      .catch((err) => {
        if (!cancelled) {
          setWalletAuto(null);
          setError(
            err instanceof Error ? err.message : "Could not load $AUTO balance",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress, mint, decimals]);

  return {
    walletAuto,
    walletAutoDisplay:
      walletAuto === null ? null : formatAutoAmount(walletAuto, decimals),
    loading,
    error,
    mintConfigured: mint.length > 0,
  };
}
