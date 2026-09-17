import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useAutonConfig } from "./use-auton-config";
import { useSolanaWallet } from "./use-solana-wallet";
import {
  fetchMarketplaceQuote,
  purchaseComputeContract,
} from "../lib/api/marketplace";
import { ROBINHOOD_CHAIN_ID } from "../lib/robinhood";
import { buildUsdcTransferTransaction } from "../lib/solana/usdc-transfer";
import { ensureRobinhoodOnProvider } from "../lib/evm/send-usdg";

export function useMarketplacePurchase() {
  const { config } = useAutonConfig();
  const { address } = useSolanaWallet();
  const { wallets } = useWallets();
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

      const wallet =
        wallets.find(
          (entry) => entry.address.toLowerCase() === address.toLowerCase(),
        ) ?? wallets[0];

      if (!wallet) {
        throw new Error("No Robinhood wallet available for payment.");
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
        const request = await buildUsdcTransferTransaction({
          payer: address,
          treasuryWallet,
          usdcMint,
          amountMicro,
        });

        const provider = await wallet.getEthereumProvider();
        await ensureRobinhoodOnProvider(provider);

        if (wallet.switchChain) {
          await wallet.switchChain(ROBINHOOD_CHAIN_ID);
        }

        const txSignature = String(
          await provider.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: address,
                to: request.to,
                data: request.data,
              },
            ],
          }),
        );

        return purchaseComputeContract({
          modelTier,
          tokenAmount,
          txSignature,
        });
      } finally {
        setPaying(false);
      }
    },
    [address, config, wallets],
  );

  return { purchase, paying };
}
