import { createPublicClient, http, isAddress, type Address } from "viem";
import { erc20Abi, getRobinhoodRpcUrl, robinhoodChain } from "../robinhood";

export async function fetchWalletAutoBalance(
  walletAddress: string,
  mintAddress: string,
  _decimals: number,
): Promise<bigint> {
  if (
    !isAddress(walletAddress, { strict: false }) ||
    !isAddress(mintAddress, { strict: false })
  ) {
    return 0n;
  }

  try {
    const client = createPublicClient({
      chain: robinhoodChain,
      transport: http(getRobinhoodRpcUrl()),
    });

    return await client.readContract({
      address: mintAddress as Address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [walletAddress as Address],
    });
  } catch {
    return 0n;
  }
}

export function formatAutoAmount(amount: bigint, decimals: number) {
  if (amount === 0n) return "0";

  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  if (fraction === 0n) {
    return whole.toLocaleString();
  }

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return `${whole.toLocaleString()}.${fractionText}`;
}
