import { isAddress, verifyMessage, type Address, type Hex } from "viem";

export function isEvmAddress(value: string): value is Address {
  return isAddress(value, { strict: false });
}

export async function verifyEvmSignature(
  walletAddress: string,
  message: string,
  signature: string,
): Promise<boolean> {
  if (!isEvmAddress(walletAddress)) return false;
  if (!signature.startsWith("0x") || signature.length < 130) return false;

  try {
    return await verifyMessage({
      address: walletAddress,
      message,
      signature: signature as Hex,
    });
  } catch {
    return false;
  }
}

export function buildLoginMessage(walletAddress: string, nonce: string): string {
  return [
    "Sign in to Auton",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    "",
    "This request will not trigger a blockchain transaction or cost any gas fees.",
  ].join("\n");
}
