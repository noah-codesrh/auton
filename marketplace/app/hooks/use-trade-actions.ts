import { useCallback, useState } from "react";
import {
  cancelOrder,
  closePosition,
  depositMargin,
  openPosition,
  withdrawMargin,
  type CollateralAsset,
  type OrderType,
  type Side,
} from "../lib/api/trade";
import {
  autoToBaseUnits,
  buildAutoTransferTransaction,
} from "../lib/solana/auto-transfer";
import { buildUsdcTransferTransaction } from "../lib/solana/usdc-transfer";
import { useConfig } from "./use-config";
import { useSolanaWallet } from "./use-solana-wallet";
import { useWallet } from "./use-wallet";

export function useTradeActions(meta: {
  vaultWallet?: string;
  autoTokenMint?: string;
  autoTokenDecimals?: number;
  usdcTokenMint?: string;
  usdcTokenDecimals?: number;
  depositRequired?: boolean;
}) {
  const { config } = useConfig();
  const { address } = useSolanaWallet();
  const { signAndSendTransaction } = useWallet();
  const [busy, setBusy] = useState(false);

  const deposit = useCallback(
    async (amount: number, asset: CollateralAsset) => {
      setBusy(true);
      try {
        if (!meta.depositRequired) {
          return await depositMargin(amount, asset);
        }

        if (!address) throw new Error("Connect a wallet to deposit collateral.");

        const vaultWallet = meta.vaultWallet?.trim();
        if (!vaultWallet) throw new Error("Trading vault is not configured.");

        let txSignature: string;

        if (asset === "USDC") {
          const usdcMint =
            meta.usdcTokenMint?.trim() || config?.usdcTokenMint?.trim();
          if (!usdcMint) throw new Error("USDG contract is not configured.");
          const decimals =
            meta.usdcTokenDecimals ?? config?.usdcTokenDecimals ?? 6;
          const transaction = await buildUsdcTransferTransaction({
            payer: address,
            treasuryWallet: vaultWallet,
            usdcMint,
            amountMicro: autoToBaseUnits(amount, decimals),
          });
          txSignature = await signAndSendTransaction(transaction);
        } else {
          const autoMint =
            meta.autoTokenMint?.trim() || config?.autoTokenMint?.trim();
          if (!autoMint) throw new Error("$AUTO mint is not configured.");
          const decimals =
            meta.autoTokenDecimals ?? config?.autoTokenDecimals ?? 6;
          const transaction = await buildAutoTransferTransaction({
            payer: address,
            vaultWallet,
            autoMint,
            amountBase: autoToBaseUnits(amount, decimals),
            decimals,
          });
          txSignature = await signAndSendTransaction(transaction);
        }

        return await depositMargin(amount, asset, txSignature);
      } finally {
        setBusy(false);
      }
    },
    [address, config, meta, signAndSendTransaction],
  );

  const open = useCallback(
    async (input: {
      marketTier: string;
      side: Side;
      leverage: number;
      sizeMillions: number;
      orderType?: OrderType;
      limitPrice?: number;
      triggerPrice?: number;
      scaleLow?: number;
      scaleHigh?: number;
      scaleCount?: number;
      twapDurationMinutes?: number;
      twapCount?: number;
    }) => {
      setBusy(true);
      try {
        return await openPosition(input);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const close = useCallback(async (positionId: string) => {
    setBusy(true);
    try {
      return await closePosition(positionId);
    } finally {
      setBusy(false);
    }
  }, []);

  const cancel = useCallback(async (positionId: string) => {
    setBusy(true);
    try {
      return await cancelOrder(positionId);
    } finally {
      setBusy(false);
    }
  }, []);

  const withdraw = useCallback(
    async (amount: number, asset: CollateralAsset) => {
      setBusy(true);
      try {
        return await withdrawMargin(amount, asset);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { deposit, open, close, cancel, withdraw, busy };
}
