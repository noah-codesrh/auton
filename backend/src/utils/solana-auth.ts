import bs58 from "bs58";
import nacl from "tweetnacl";

export function verifySolanaSignature(
  walletAddress: string,
  message: string,
  signature: string,
): boolean {
  try {
    const publicKeyBytes = bs58.decode(walletAddress);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);

    if (publicKeyBytes.length !== 32 || signatureBytes.length !== 64) {
      return false;
    }

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
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
