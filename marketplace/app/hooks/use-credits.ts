import { useCallback, useEffect, useState } from "react";
import { hasActiveSession } from "../lib/api/client";
import {
  fetchCreditBalance,
  fetchTopUpQuote,
  topUpCredits as apiTopUpCredits,
  type CreditAsset,
  type CreditBalance,
  type TopUpResult,
} from "../lib/api/credits";
import { buildAutoTransferTransaction } from "../lib/solana/auto-transfer";
import { buildUsdcTransferTransaction } from "../lib/solana/usdc-transfer";
import { useSolanaWallet } from "./use-solana-wallet";
import { useWallet } from "./use-wallet";

export function useCredits() {
  const { address } = useSolanaWallet();
  const { signAndSendTransaction } = useWallet();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);

  const refresh = useCallback(async () => {
    if (!hasActiveSession()) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      setBalance(await fetchCreditBalance());
    } catch {
      // keep last known balance
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, address]);

  const topUp = useCallback(
    async (usdAmount: number, asset: CreditAsset): Promise<TopUpResult> => {
      setToppingUp(true);
      try {
        const quote = await fetchTopUpQuote(usdAmount, asset);
        let txSignature: string | undefined;

        if (quote.paymentRequired) {
          if (!address) {
            throw new Error("Connect a wallet to pay for credits.");
          }

          const amountBase = BigInt(quote.amountBase);
          const transaction =
            asset === "USDC"
              ? await buildUsdcTransferTransaction({
                  payer: address,
                  treasuryWallet: quote.treasuryWallet,
                  usdcMint: quote.mint,
                  amountMicro: amountBase,
                })
              : await buildAutoTransferTransaction({
                  payer: address,
                  vaultWallet: quote.treasuryWallet,
                  autoMint: quote.mint,
                  amountBase,
                  decimals: quote.decimals,
                });

          txSignature = await signAndSendTransaction(transaction);
        }

        const result = await apiTopUpCredits({
          amount: quote.tokenAmount,
          asset,
          txSignature,
        });

        setBalance(result.balance);
        return result;
      } finally {
        setToppingUp(false);
      }
    },
    [address, signAndSendTransaction],
  );

  // Optimistically reflect a post-message balance from the stream trailer.
  const applyBalanceMicro = useCallback((balanceUsdMicro: string) => {
    setBalance((prev) =>
      prev
        ? {
            ...prev,
            balanceUsdMicro,
            balanceUsd: Number(BigInt(balanceUsdMicro)) / 1_000_000,
          }
        : prev,
    );
  }, []);

  return { balance, loading, toppingUp, refresh, topUp, applyBalanceMicro };
}
