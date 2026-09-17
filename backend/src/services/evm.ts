import {
  createPublicClient,
  decodeEventLog,
  http,
  isAddress,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
} from "viem";
import { env } from "../config/env.js";
import { erc20Abi, robinhoodChain } from "../config/chain.js";
import { TokenVerificationError } from "./solana.js";

let client: PublicClient | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRobinhoodClient(): PublicClient {
  if (!client) {
    client = createPublicClient({
      chain: {
        ...robinhoodChain,
        rpcUrls: {
          default: { http: [env.ROBINHOOD_RPC_URL] },
        },
      },
      transport: http(env.ROBINHOOD_RPC_URL),
    });
  }
  return client;
}

export type VerifiedErc20Transfer = {
  signature: string;
  amount: bigint;
  sender: string;
  destination: string;
  mint: string;
};

function requireAddress(value: string, label: string): Address {
  if (!isAddress(value, { strict: false })) {
    throw new TokenVerificationError(
      `${label} is not a Robinhood (EVM) address. Set MASTER_VAULT_WALLET and USDC_TOKEN_MINT to 0x… values on Robinhood Chain.`,
    );
  }
  return value;
}

/**
 * Confirms an ERC-20 Transfer of `mint` from `sender` to `vault` for `expectedAmount`.
 * `txSignature` is an EVM transaction hash.
 */
export async function verifyErc20Deposit(params: {
  txSignature: string;
  expectedAmount: bigint;
  senderWallet: string;
  mint: string;
  vaultWallet: string;
}): Promise<VerifiedErc20Transfer> {
  const hash = params.txSignature as Hash;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new TokenVerificationError(
      "Expected a Robinhood transaction hash (0x…).",
    );
  }

  const mint = requireAddress(params.mint, "Token contract");
  const vault = requireAddress(params.vaultWallet, "Treasury wallet");
  const sender = requireAddress(params.senderWallet, "Sender wallet");
  const rpc = getRobinhoodClient();

  let receipt = await rpc.getTransactionReceipt({ hash }).catch(() => null);
  for (let attempt = 0; !receipt && attempt < 8; attempt += 1) {
    await sleep(2_000);
    receipt = await rpc.getTransactionReceipt({ hash }).catch(() => null);
  }

  if (!receipt) {
    throw new TokenVerificationError(
      "Transaction not found on Robinhood Chain yet. If the transfer succeeded, retry with the same hash in a moment.",
    );
  }

  if (receipt.status !== "success") {
    throw new TokenVerificationError("Transaction failed on-chain");
  }

  const mintLower = mint.toLowerCase();
  const vaultLower = vault.toLowerCase();
  const senderLower = sender.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== mintLower) continue;

    try {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        data: log.data as Hex,
        topics: log.topics,
      });

      if (decoded.eventName !== "Transfer") continue;

      const from = String(decoded.args.from).toLowerCase();
      const to = String(decoded.args.to).toLowerCase();
      const amount = decoded.args.value;

      if (from === senderLower && to === vaultLower && amount === params.expectedAmount) {
        return {
          signature: hash,
          amount,
          sender,
          destination: vault,
          mint,
        };
      }
    } catch {
      continue;
    }
  }

  throw new TokenVerificationError(
    `No valid token transfer to the treasury found in this transaction`,
  );
}
