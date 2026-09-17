import { encodeFunctionData, isAddress, type Address, type Hex } from "viem";
import { erc20Abi } from "../robinhood";

export type EvmTransferRequest = {
  to: Address;
  data: Hex;
};

export function getSolanaRpcUrl() {
  return (
    import.meta.env.VITE_ROBINHOOD_RPC_URL?.trim() ||
    import.meta.env.VITE_SOLANA_RPC_URL?.trim() ||
    "https://rpc.mainnet.chain.robinhood.com"
  );
}

export async function buildUsdcTransferTransaction(params: {
  payer: string;
  treasuryWallet: string;
  usdcMint: string;
  amountMicro: bigint;
}): Promise<EvmTransferRequest> {
  if (!isAddress(params.treasuryWallet, { strict: false })) {
    throw new Error("Treasury is not a Robinhood (EVM) address.");
  }
  if (!isAddress(params.usdcMint, { strict: false })) {
    throw new Error("USDG contract is not configured.");
  }
  if (!isAddress(params.payer, { strict: false })) {
    throw new Error("Connect a Robinhood wallet to pay with USDG.");
  }

  return {
    to: params.usdcMint as Address,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [params.treasuryWallet as Address, params.amountMicro],
    }),
  };
}

export function formatUsdcFromMicro(micro: bigint | string) {
  const value = typeof micro === "string" ? BigInt(micro) : micro;
  const whole = value / 1_000_000n;
  const fraction = value % 1_000_000n;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(6, "0").replace(/0+$/, "")}`;
}
