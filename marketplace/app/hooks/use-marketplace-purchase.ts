import { useCallback, useState } from "react";
import { useConfig } from "./use-config";
import { useSolanaWallet } from "./use-solana-wallet";
import { useWallet } from "./use-wallet";
import {
  fetchMarketplaceQuote,
  purchaseComputeContract,
} from "../lib/api/marketplace";
import { buildUsdcTransferTransaction } from "../lib/solana/usdc-transfer";

export function useMarketplacePurchase() {
  const { config } = useConfig();
  const { address } = useSolanaWallet();
  const { signAndSendTransaction } = useWallet();
  const [paying, setPaying] = useState(false);

  const purchase = useCallback(
    async (modelTier: string, tokenAmount: number) => {
      const paymentRequired = config?.marketplacePaymentRequired ?? true;

      if (!paymentRequired) {
        return purchaseComputeContract({ modelTier, tokenAmount });
      }

      if (!address) {
        throw new Error("Connect a wallet to pay with USDG.");
      }

      const treasuryWallet = config?.masterVaultWallet?.trim();
      const usdcMint = config?.usdcTokenMint?.trim();

      if (!treasuryWallet || !usdcMint) {
        throw new Error(
          "Marketplace payment is not configured. Try again later.",
        );
      }

      setPaying(true);

      try {
        const quote = await fetchMarketplaceQuote(modelTier, tokenAmount);
        const amountMicro = BigInt(quote.usdcAmountMicro);

        const transaction = await buildUsdcTransferTransaction({
          payer: address,
          treasuryWallet,
          usdcMint,
          amountMicro,
        });

        const txSignature = await signAndSendTransaction(transaction);

        return purchaseComputeContract({
          modelTier,
          tokenAmount,
          txSignature,
        });
      } finally {
        setPaying(false);
      }
    },
    [address, config, signAndSendTransaction],
  );

  return { purchase, paying };
}
