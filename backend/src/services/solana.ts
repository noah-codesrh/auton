import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { env } from "../config/env.js";

let connection: Connection | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(env.SOLANA_RPC_URL, {
      commitment: "confirmed",
    });
  }
  return connection;
}

export type VerifiedTokenTransfer = {
  signature: string;
  amount: bigint;
  sender: string;
  destination: string;
  mint: string;
};

export class TokenVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenVerificationError";
  }
}

/** @deprecated use TokenVerificationError */
export class StakeVerificationError extends TokenVerificationError {
  constructor(message: string) {
    super(message);
    this.name = "StakeVerificationError";
  }
}

type ParsedTransfer = {
  destination: string;
  authority: string;
  mint: string;
  rawAmount: bigint;
};

function readParsedTransfer(
  parsed: unknown,
  fallbackMint: string,
): ParsedTransfer | null {
  if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;

  const type = String((parsed as { type: unknown }).type);
  if (type !== "transfer" && type !== "transferChecked") return null;

  const info = (parsed as { info?: Record<string, unknown> }).info;
  if (!info) return null;
  const destination = String(info.destination ?? "");
  const authority = String(info.authority ?? info.owner ?? "");
  const mint =
    type === "transferChecked"
      ? String(info.mint ?? "")
      : fallbackMint;

  const rawAmount =
    type === "transferChecked"
      ? BigInt(
          String(
            (info.tokenAmount as { amount?: string } | undefined)?.amount ??
              info.amount ??
              "0",
          ),
        )
      : BigInt(String(info.amount ?? "0"));

  return { destination, authority, mint, rawAmount };
}

function scanInstructions(
  instructions: ReadonlyArray<{ parsed?: unknown }>,
  expectedMint: string,
  expectedVaultAtas: PublicKey[],
  vaultWallet: PublicKey,
  sender: PublicKey,
  expectedAmount: bigint,
): VerifiedTokenTransfer | null {
  for (const ix of instructions) {
    if (!("parsed" in ix)) continue;

    const transfer = readParsedTransfer(ix.parsed, expectedMint);
    if (!transfer) continue;

    let isVaultDestination = false;
    try {
      const destinationPubkey = new PublicKey(transfer.destination);
      isVaultDestination =
        destinationPubkey.equals(vaultWallet) ||
        expectedVaultAtas.some((ata) => destinationPubkey.equals(ata));
    } catch {
      continue;
    }

    if (
      transfer.mint === expectedMint &&
      isVaultDestination &&
      transfer.authority === sender.toBase58() &&
      transfer.rawAmount === expectedAmount
    ) {
      return {
        signature: "",
        amount: transfer.rawAmount,
        sender: sender.toBase58(),
        destination: vaultWallet.toBase58(),
        mint: expectedMint,
      };
    }
  }

  return null;
}

export async function verifySplTokenDeposit(params: {
  txSignature: string;
  expectedAmount: bigint;
  senderWallet: string;
  mint: string;
  vaultWallet: string;
}): Promise<VerifiedTokenTransfer> {
  const conn = getConnection();
  const vault = new PublicKey(params.vaultWallet);
  const mint = new PublicKey(params.mint);
  const sender = new PublicKey(params.senderWallet);

  // The client confirms the transfer then immediately calls us, but the RPC we
  // query may not have indexed it yet. Retry a few times so a propagation lag
  // doesn't strand the user's funds in the vault uncredited.
  let tx = await conn.getParsedTransaction(params.txSignature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  for (let attempt = 0; !tx && attempt < 6; attempt += 1) {
    await sleep(2_000);
    tx = await conn.getParsedTransaction(params.txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  }

  if (!tx) {
    throw new TokenVerificationError(
      "Transaction not found on-chain yet. If the transfer succeeded, retry the deposit with the same transaction in a moment.",
    );
  }

  if (tx.meta?.err) {
    throw new TokenVerificationError("Transaction failed on-chain");
  }

  // Accept either classic SPL or Token-2022 vault ATA so the same verifier
  // works for USDC (classic) and $AUTO (Token-2022) deposits.
  const expectedVaultAtas = [
    getAssociatedTokenAddressSync(mint, vault, false, TOKEN_PROGRAM_ID),
    getAssociatedTokenAddressSync(mint, vault, false, TOKEN_2022_PROGRAM_ID),
  ];

  let matched =
    scanInstructions(
      tx.transaction.message.instructions as ReadonlyArray<{ parsed?: unknown }>,
      params.mint,
      expectedVaultAtas,
      vault,
      sender,
      params.expectedAmount,
    ) ?? null;

  if (!matched) {
    for (const group of tx.meta?.innerInstructions ?? []) {
      matched = scanInstructions(
        group.instructions as ReadonlyArray<{ parsed?: unknown }>,
        params.mint,
        expectedVaultAtas,
        vault,
        sender,
        params.expectedAmount,
      );
      if (matched) break;
    }
  }

  if (!matched) {
    throw new TokenVerificationError(
      `No valid transfer of ${params.mint} to the vault found in this transaction`,
    );
  }

  return { ...matched, signature: params.txSignature };
}

function requireAutoMint() {
  if (!env.AUTO_TOKEN_MINT) {
    throw new TokenVerificationError(
      "$AUTO is not deployed yet. Use USDG until AUTO_TOKEN_MINT is set.",
    );
  }
  return env.AUTO_TOKEN_MINT;
}

export async function verifyAutoStakeDeposit(
  txSignature: string,
  expectedAmount: bigint,
  senderWallet: string,
): Promise<VerifiedTokenTransfer> {
  const { verifyErc20Deposit } = await import("./evm.js");
  return verifyErc20Deposit({
    txSignature,
    expectedAmount,
    senderWallet,
    mint: requireAutoMint(),
    vaultWallet: env.MASTER_VAULT_WALLET,
  });
}

export async function verifyAutoMarginDeposit(
  txSignature: string,
  expectedAmount: bigint,
  senderWallet: string,
): Promise<VerifiedTokenTransfer> {
  const { verifyErc20Deposit } = await import("./evm.js");
  return verifyErc20Deposit({
    txSignature,
    expectedAmount,
    senderWallet,
    mint: requireAutoMint(),
    vaultWallet: env.MASTER_VAULT_WALLET,
  });
}

export async function verifyUsdcPurchasePayment(
  txSignature: string,
  expectedAmount: bigint,
  senderWallet: string,
): Promise<VerifiedTokenTransfer> {
  const { verifyErc20Deposit } = await import("./evm.js");
  return verifyErc20Deposit({
    txSignature,
    expectedAmount,
    senderWallet,
    mint: env.USDC_TOKEN_MINT,
    vaultWallet: env.MASTER_VAULT_WALLET,
  });
}

export function parseTokenAmount(
  amount: number | string,
  decimals = env.AUTO_TOKEN_DECIMALS,
): bigint {
  const numeric = typeof amount === "string" ? Number(amount) : amount;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new TokenVerificationError("Invalid token amount");
  }

  const [whole, fraction = ""] = numeric.toString().split(".");
  const paddedFraction = fraction
    .padEnd(decimals, "0")
    .slice(0, decimals);

  const multiplier = 10n ** BigInt(decimals);
  return BigInt(whole) * multiplier + BigInt(paddedFraction || "0");
}

export function parseUsdcAmount(amountUsd: number | string): bigint {
  return parseTokenAmount(amountUsd, env.USDC_TOKEN_DECIMALS);
}
