import { useCallback, useEffect, useState } from "react";
import {
  fetchWalletAutoBalance,
  formatAutoAmount,
} from "../lib/solana/auto-balance";

type Mints = {
  autoMint?: string;
  autoDecimals?: number;
  usdcMint?: string;
  usdcDecimals?: number;
};

export type WalletBalances = {
  auto: number;
  usdc: number;
  autoDisplay: string;
  usdcDisplay: string;
};

/** Live wallet balances for both collateral assets ($AUTO + USDC). */
export function useWalletBalances(
  walletAddress: string | null,
  mints: Mints,
) {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(false);

  const autoMint = mints.autoMint?.trim() ?? "";
  const usdcMint = mints.usdcMint?.trim() ?? "";
  const autoDecimals = mints.autoDecimals ?? 6;
  const usdcDecimals = mints.usdcDecimals ?? 6;

  const refresh = useCallback(async () => {
    if (!walletAddress || (!autoMint && !usdcMint)) {
      setBalances(null);
      return;
    }

    setLoading(true);
    try {
      const [autoRaw, usdcRaw] = await Promise.all([
        autoMint
          ? fetchWalletAutoBalance(walletAddress, autoMint, autoDecimals)
          : Promise.resolve(0n),
        usdcMint
          ? fetchWalletAutoBalance(walletAddress, usdcMint, usdcDecimals)
          : Promise.resolve(0n),
      ]);

      setBalances({
        auto: Number(autoRaw) / 10 ** autoDecimals,
        usdc: Number(usdcRaw) / 10 ** usdcDecimals,
        autoDisplay: formatAutoAmount(autoRaw, autoDecimals),
        usdcDisplay: formatAutoAmount(usdcRaw, usdcDecimals),
      });
    } catch {
      // keep last known
    } finally {
      setLoading(false);
    }
  }, [walletAddress, autoMint, usdcMint, autoDecimals, usdcDecimals]);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 20_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { balances, loading, refresh };
}
