import { env } from "../config/env.js";
import { assertNoError, getSupabase } from "../db/supabase.js";
import { toBigInt, type CreditBalanceRow } from "../db/types.js";
import { getAutoUsdPrice } from "./auto-price.js";
import { TokenVerificationError } from "./solana.js";
import { verifyErc20Deposit } from "./evm.js";

const USD_MICRO = 1_000_000;

export type CreditAsset = "USDC" | "AUTO";

export class CreditError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "CreditError";
    this.statusCode = statusCode;
  }
}

export type CreditBalance = {
  balanceUsdMicro: string;
  balanceUsd: number;
  totalPurchasedUsdMicro: string;
  totalSpentUsdMicro: string;
  updatedAt: string | null;
};

/** Chat top-ups reuse the marketplace skip-payment flag for local dev. */
export function isCreditPaymentRequired() {
  return !env.MARKETPLACE_SKIP_PAYMENT;
}

function microToUsd(micro: bigint): number {
  return Number(micro) / USD_MICRO;
}

/**
 * Base units that must land on-chain for a given human token amount. Uses the
 * same Math.round convention as the frontend's autoToBaseUnits so the verifier
 * matches the transfer the wallet actually signed.
 */
function tokenToBaseUnits(amount: number, decimals: number): bigint {
  const base = Math.round(amount * 10 ** decimals);
  if (!Number.isFinite(base) || base <= 0) {
    throw new CreditError("Top-up amount is too small.");
  }
  return BigInt(base);
}

function emptyBalance(): CreditBalance {
  return {
    balanceUsdMicro: "0",
    balanceUsd: 0,
    totalPurchasedUsdMicro: "0",
    totalSpentUsdMicro: "0",
    updatedAt: null,
  };
}

function formatBalance(row: CreditBalanceRow): CreditBalance {
  const balanceMicro = toBigInt(row.balance_usd_micro);
  return {
    balanceUsdMicro: balanceMicro.toString(),
    balanceUsd: microToUsd(balanceMicro),
    totalPurchasedUsdMicro: toBigInt(row.total_purchased_usd_micro).toString(),
    totalSpentUsdMicro: toBigInt(row.total_spent_usd_micro).toString(),
    updatedAt: row.updated_at,
  };
}

export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("credit_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error);

  return data ? formatBalance(data) : emptyBalance();
}

export type TopUpQuote = {
  asset: CreditAsset;
  usdAmount: number;
  usdMicro: string;
  tokenAmount: number;
  amountBase: string;
  decimals: number;
  mint: string;
  treasuryWallet: string;
  autoPrice: number | null;
  paymentRequired: boolean;
  minTopUpUsd: number;
};

export async function getTopUpQuote(
  usdAmount: number,
  asset: CreditAsset,
): Promise<TopUpQuote> {
  if (!Number.isFinite(usdAmount) || usdAmount < env.CHAT_MIN_TOPUP_USD) {
    throw new CreditError(
      `Minimum top-up is $${env.CHAT_MIN_TOPUP_USD} of credits.`,
    );
  }

  const usdMicro = BigInt(Math.round(usdAmount * USD_MICRO));

  if (asset === "USDC") {
    const tokenAmount = usdAmount;
    return {
      asset,
      usdAmount,
      usdMicro: usdMicro.toString(),
      tokenAmount,
      amountBase: tokenToBaseUnits(tokenAmount, env.USDC_TOKEN_DECIMALS).toString(),
      decimals: env.USDC_TOKEN_DECIMALS,
      mint: env.USDC_TOKEN_MINT,
      treasuryWallet: env.MASTER_VAULT_WALLET,
      autoPrice: null,
      paymentRequired: isCreditPaymentRequired(),
      minTopUpUsd: env.CHAT_MIN_TOPUP_USD,
    };
  }

  if (!env.AUTO_TOKEN_MINT) {
    throw new CreditError("$AUTO is not deployed yet. Top up with USDG.", 400);
  }

  const autoPrice = await getAutoUsdPrice();
  if (!Number.isFinite(autoPrice) || autoPrice <= 0) {
    throw new CreditError("Could not price $AUTO right now. Try again shortly.");
  }

  const tokenAmount = usdAmount / autoPrice;
  return {
    asset,
    usdAmount,
    usdMicro: usdMicro.toString(),
    tokenAmount,
    amountBase: tokenToBaseUnits(tokenAmount, env.AUTO_TOKEN_DECIMALS).toString(),
    decimals: env.AUTO_TOKEN_DECIMALS,
    mint: env.AUTO_TOKEN_MINT,
    treasuryWallet: env.MASTER_VAULT_WALLET,
    autoPrice,
    paymentRequired: isCreditPaymentRequired(),
    minTopUpUsd: env.CHAT_MIN_TOPUP_USD,
  };
}

export async function topUpCredits(params: {
  userId: string;
  wallet: string;
  amount: number;
  asset: CreditAsset;
  txSignature?: string;
}): Promise<{ balance: CreditBalance; creditedUsd: number; txSignature?: string }> {
  const { userId, wallet, amount, asset, txSignature } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new CreditError("Invalid top-up amount.");
  }

  const paymentRequired = isCreditPaymentRequired();
  const decimals =
    asset === "USDC" ? env.USDC_TOKEN_DECIMALS : env.AUTO_TOKEN_DECIMALS;
  const mint = asset === "USDC" ? env.USDC_TOKEN_MINT : env.AUTO_TOKEN_MINT;
  if (!mint) {
    throw new CreditError("$AUTO is not deployed yet. Top up with USDG.", 400);
  }

  // USD value credited: USDC is 1:1; $AUTO is valued at the live oracle price.
  let usdMicro: bigint;
  if (asset === "USDC") {
    usdMicro = BigInt(Math.round(amount * USD_MICRO));
  } else {
    const autoPrice = await getAutoUsdPrice();
    if (!Number.isFinite(autoPrice) || autoPrice <= 0) {
      throw new CreditError("Could not price $AUTO right now. Try again shortly.");
    }
    usdMicro = BigInt(Math.round(amount * autoPrice * USD_MICRO));
  }

  if (usdMicro <= 0n) {
    throw new CreditError("Top-up rounds to zero USD of credits.");
  }

  if (paymentRequired && !txSignature) {
    throw new CreditError(
      "On-chain payment required. Send tokens to the treasury wallet and include txSignature.",
      402,
    );
  }

  const supabase = getSupabase();

  if (paymentRequired && txSignature) {
    const { data: existingTx, error: txLookupError } = await supabase
      .from("credit_purchases")
      .select("id")
      .eq("tx_signature", txSignature)
      .maybeSingle();

    assertNoError(txLookupError);

    if (existingTx) {
      throw new CreditError(
        "This payment transaction has already been credited.",
        409,
      );
    }

    const expectedBase = tokenToBaseUnits(amount, decimals);

    try {
      await verifyErc20Deposit({
        txSignature,
        expectedAmount: expectedBase,
        senderWallet: wallet,
        mint,
        vaultWallet: env.MASTER_VAULT_WALLET,
      });
    } catch (error) {
      if (error instanceof TokenVerificationError) {
        throw new CreditError(error.message, 400);
      }
      throw error;
    }
  }

  const { data: existing, error: lookupError } = await supabase
    .from("credit_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(lookupError);

  let balanceRow: CreditBalanceRow;

  if (existing) {
    const newBalance = toBigInt(existing.balance_usd_micro) + usdMicro;
    const newPurchased =
      toBigInt(existing.total_purchased_usd_micro) + usdMicro;

    const { data: updated, error: updateError } = await supabase
      .from("credit_balances")
      .update({
        balance_usd_micro: newBalance.toString(),
        total_purchased_usd_micro: newPurchased.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    assertNoError(updateError);
    if (!updated) throw new CreditError("Failed to update credit balance.", 500);
    balanceRow = updated;
  } else {
    const { data: created, error: insertError } = await supabase
      .from("credit_balances")
      .insert({
        user_id: userId,
        balance_usd_micro: usdMicro.toString(),
        total_purchased_usd_micro: usdMicro.toString(),
        total_spent_usd_micro: "0",
      })
      .select("*")
      .single();

    assertNoError(insertError);
    if (!created) throw new CreditError("Failed to create credit balance.", 500);
    balanceRow = created;
  }

  if (paymentRequired && txSignature) {
    const { error: logError } = await supabase.from("credit_purchases").insert({
      user_id: userId,
      payment_asset: asset,
      amount_paid_base: tokenToBaseUnits(amount, decimals).toString(),
      usd_credited_micro: usdMicro.toString(),
      tx_signature: txSignature,
    });

    assertNoError(logError);
  }

  return {
    balance: formatBalance(balanceRow),
    creditedUsd: microToUsd(usdMicro),
    txSignature,
  };
}

/**
 * Debit an exact USD amount (micro-units) from the credit wallet, failing if
 * the balance can't cover it. Used by non-chat spends (e.g. option premiums)
 * where a partial charge would be wrong. Returns the updated balance.
 */
export async function debitCredits(
  userId: string,
  usdMicro: bigint,
): Promise<CreditBalance> {
  if (usdMicro <= 0n) {
    throw new CreditError("Debit amount must be positive.");
  }

  const supabase = getSupabase();
  const { data: balance, error } = await supabase
    .from("credit_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error);

  const current = balance ? toBigInt(balance.balance_usd_micro) : 0n;
  if (!balance || current < usdMicro) {
    throw new CreditError(
      "Insufficient credit balance. Top up to cover this premium.",
      402,
    );
  }

  const newBalance = current - usdMicro;
  const newSpent = toBigInt(balance.total_spent_usd_micro) + usdMicro;

  const { data: updated, error: updateError } = await supabase
    .from("credit_balances")
    .update({
      balance_usd_micro: newBalance.toString(),
      total_spent_usd_micro: newSpent.toString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", balance.id)
    .select("*")
    .single();

  assertNoError(updateError);
  if (!updated) throw new CreditError("Failed to debit credit balance.", 500);

  return formatBalance(updated);
}

/**
 * Credit an exact USD amount (micro-units) back to the wallet — e.g. proceeds
 * from closing an option position. Creates the balance row if missing.
 */
export async function creditCredits(
  userId: string,
  usdMicro: bigint,
): Promise<CreditBalance> {
  if (usdMicro < 0n) {
    throw new CreditError("Credit amount must be non-negative.");
  }

  const supabase = getSupabase();
  const { data: balance, error } = await supabase
    .from("credit_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error);

  if (balance) {
    const newBalance = toBigInt(balance.balance_usd_micro) + usdMicro;
    const { data: updated, error: updateError } = await supabase
      .from("credit_balances")
      .update({
        balance_usd_micro: newBalance.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", balance.id)
      .select("*")
      .single();

    assertNoError(updateError);
    if (!updated) throw new CreditError("Failed to credit balance.", 500);
    return formatBalance(updated);
  }

  const { data: created, error: insertError } = await supabase
    .from("credit_balances")
    .insert({
      user_id: userId,
      balance_usd_micro: usdMicro.toString(),
      total_purchased_usd_micro: "0",
      total_spent_usd_micro: "0",
    })
    .select("*")
    .single();

  assertNoError(insertError);
  if (!created) throw new CreditError("Failed to create credit balance.", 500);
  return formatBalance(created);
}

/**
 * Deducts the discounted USD cost of a completed chat request and logs it.
 * promptPrice / completionPrice are OpenRouter spot USD per token.
 */
export async function chargeChatUsage(params: {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  promptPrice: number;
  completionPrice: number;
}): Promise<{ usdChargedMicro: string; balanceUsdMicro: string }> {
  const {
    userId,
    model,
    promptTokens,
    completionTokens,
    promptPrice,
    completionPrice,
  } = params;

  const rawCostUsd =
    promptTokens * promptPrice + completionTokens * completionPrice;
  const discountedUsd = rawCostUsd * env.CHAT_CREDIT_RATE_MULTIPLIER;
  const chargeMicro = BigInt(
    Math.max(0, Math.round(discountedUsd * USD_MICRO)),
  );
  const totalTokens = promptTokens + completionTokens;

  const supabase = getSupabase();

  const { data: balance, error: balanceLookupError } = await supabase
    .from("credit_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(balanceLookupError);

  let newBalanceMicro = balance ? toBigInt(balance.balance_usd_micro) : 0n;

  if (balance && chargeMicro > 0n) {
    const current = toBigInt(balance.balance_usd_micro);
    const applied = chargeMicro > current ? current : chargeMicro;
    newBalanceMicro = current - applied;
    const newSpent = toBigInt(balance.total_spent_usd_micro) + applied;

    const { error: updateError } = await supabase
      .from("credit_balances")
      .update({
        balance_usd_micro: newBalanceMicro.toString(),
        total_spent_usd_micro: newSpent.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", balance.id);

    assertNoError(updateError);
  }

  const { error: logError } = await supabase.from("credit_usage_logs").insert({
    user_id: userId,
    model_used: model,
    prompt_tokens: promptTokens.toString(),
    completion_tokens: completionTokens.toString(),
    total_tokens: totalTokens.toString(),
    usd_charged_micro: chargeMicro.toString(),
  });

  assertNoError(logError);

  return {
    usdChargedMicro: chargeMicro.toString(),
    balanceUsdMicro: newBalanceMicro.toString(),
  };
}

export type CreditUsageEntry = {
  id: string;
  model: string;
  promptTokens: string;
  completionTokens: string;
  totalTokens: string;
  usdChargedMicro: string;
  createdAt: string;
};

export async function getRecentUsage(
  userId: string,
  limit = 20,
): Promise<CreditUsageEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("credit_usage_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  assertNoError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    model: row.model_used,
    promptTokens: toBigInt(row.prompt_tokens).toString(),
    completionTokens: toBigInt(row.completion_tokens).toString(),
    totalTokens: toBigInt(row.total_tokens).toString(),
    usdChargedMicro: toBigInt(row.usd_charged_micro).toString(),
    createdAt: row.created_at,
  }));
}
