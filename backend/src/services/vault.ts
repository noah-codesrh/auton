import {
  createWalletClient,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { env } from "../config/env.js";
import { erc20Abi, robinhoodChain } from "../config/chain.js";

function evmPrivateKey(): Hex | null {
  const raw = env.VAULT_PRIVATE_KEY?.trim();
  if (!raw) return null;
  if (/^0x[0-9a-fA-F]{64}$/.test(raw)) return raw as Hex;
  return null;
}

/** True when an EVM vault signer is configured (on-chain USDG settlement). */
export function isVaultSignerConfigured(): boolean {
  return Boolean(evmPrivateKey());
}

function getVaultAccount() {
  const key = evmPrivateKey();
  if (!key) {
    throw new Error(
      "VAULT_PRIVATE_KEY must be a 0x-prefixed Robinhood (EVM) private key",
    );
  }

  const account = privateKeyToAccount(key);
  if (account.address.toLowerCase() !== env.MASTER_VAULT_WALLET.toLowerCase()) {
    throw new Error(
      "VAULT_PRIVATE_KEY does not match MASTER_VAULT_WALLET — refusing to sign",
    );
  }

  return account;
}

function getWalletClient() {
  const account = getVaultAccount();
  return createWalletClient({
    account,
    chain: {
      ...robinhoodChain,
      rpcUrls: { default: { http: [env.ROBINHOOD_RPC_URL] } },
    },
    transport: http(env.ROBINHOOD_RPC_URL),
  });
}

/**
 * Sends $AUTO (ERC-20) from the system vault to a recipient on Robinhood Chain.
 */
export async function sendAutoFromVault(
  recipientWallet: string,
  autoAmount: number,
): Promise<string> {
  if (!isAddress(recipientWallet, { strict: false })) {
    throw new Error("Recipient is not a Robinhood (EVM) address");
  }
  if (!env.AUTO_TOKEN_MINT || !isAddress(env.AUTO_TOKEN_MINT, { strict: false })) {
    throw new Error("$AUTO is not deployed yet. Set AUTO_TOKEN_MINT after deploy.");
  }

  const decimals = env.AUTO_TOKEN_DECIMALS;
  const baseUnits = BigInt(Math.round(autoAmount * 10 ** decimals));
  if (baseUnits <= 0n) {
    throw new Error("Payout amount rounds to zero");
  }

  const client = getWalletClient();
  return client.writeContract({
    address: env.AUTO_TOKEN_MINT as Address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipientWallet as Address, baseUnits],
  });
}

/**
 * Sends USDG (ERC-20) from the system vault to a recipient on Robinhood Chain.
 */
export async function sendUsdcFromVault(
  recipientWallet: string,
  usdcAmount: number,
): Promise<string> {
  if (!isAddress(recipientWallet, { strict: false })) {
    throw new Error("Recipient is not a Robinhood (EVM) address");
  }
  if (!isAddress(env.USDC_TOKEN_MINT, { strict: false })) {
    throw new Error("USDC_TOKEN_MINT is not a Robinhood USDG contract address");
  }

  const decimals = env.USDC_TOKEN_DECIMALS;
  const baseUnits = BigInt(Math.round(usdcAmount * 10 ** decimals));
  if (baseUnits <= 0n) {
    throw new Error("Payout amount rounds to zero");
  }

  const client = getWalletClient();
  return client.writeContract({
    address: env.USDC_TOKEN_MINT as Address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipientWallet as Address, baseUnits],
  });
}
