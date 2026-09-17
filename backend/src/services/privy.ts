import { PrivyClient } from "@privy-io/server-auth";
import { env } from "../config/env.js";

let client: PrivyClient | null = null;

export function isPrivyConfigured() {
  return Boolean(env.PRIVY_APP_ID && env.PRIVY_APP_SECRET);
}

export function getPrivyClient() {
  if (!isPrivyConfigured()) {
    throw new Error("PRIVY_APP_ID and PRIVY_APP_SECRET are not configured");
  }

  if (!client) {
    client = new PrivyClient(env.PRIVY_APP_ID!, env.PRIVY_APP_SECRET!);
  }

  return client;
}

export function findSolanaWalletOnPrivyUser(
  linkedAccounts: Array<{ type: string; chainType?: string; address?: string }>,
  walletAddress: string,
) {
  const expected = walletAddress.toLowerCase();
  return linkedAccounts.some(
    (account) =>
      account.type === "wallet" &&
      (account.chainType === "ethereum" || account.chainType === "evm") &&
      account.address?.toLowerCase() === expected,
  );
}
