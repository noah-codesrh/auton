import { buildUsdcTransferTransaction, type EvmTransferRequest } from "./usdc-transfer";

export function autoToBaseUnits(amount: number, decimals: number): bigint {
  const base = Math.round(amount * 10 ** decimals);
  if (!Number.isFinite(base) || base <= 0) {
    throw new Error("Amount is too small.");
  }
  return BigInt(base);
}

export async function buildAutoTransferTransaction(params: {
  payer: string;
  vaultWallet: string;
  autoMint: string;
  amountBase: bigint;
  decimals: number;
}): Promise<EvmTransferRequest> {
  return buildUsdcTransferTransaction({
    payer: params.payer,
    treasuryWallet: params.vaultWallet,
    usdcMint: params.autoMint,
    amountMicro: params.amountBase,
  });
}
