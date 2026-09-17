import { env } from "../config/env.js";
import { MARKETPLACE_TIERS } from "../config/marketplace-catalog.js";
import { assertNoError, getSupabase } from "../db/supabase.js";
import { toBigInt } from "../db/types.js";
import {
  TokenVerificationError,
  verifyUsdcPurchasePayment,
} from "./solana.js";

export { MARKETPLACE_TIERS } from "../config/marketplace-catalog.js";

export class MarketplaceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "MarketplaceError";
    this.statusCode = statusCode;
  }
}

export function isMarketplacePaymentRequired() {
  return !env.MARKETPLACE_SKIP_PAYMENT;
}

/** USDC micro-units (6 decimals) for a token purchase at the tier locked rate. */
export function computePurchaseUsdcMicro(
  tokenAmount: number,
  lockedRatePerM: number,
): bigint {
  const micro = Math.round(tokenAmount * lockedRatePerM);
  if (!Number.isFinite(micro) || micro <= 0) {
    throw new MarketplaceError("Purchase amount is too small to price in USDG");
  }
  return BigInt(micro);
}

export function computePurchaseUsdcDisplay(
  tokenAmount: number,
  lockedRatePerM: number,
) {
  const micro = computePurchaseUsdcMicro(tokenAmount, lockedRatePerM);
  return {
    usdcAmountMicro: micro.toString(),
    usdcAmount: (Number(micro) / 1_000_000).toFixed(6).replace(/\.?0+$/, ""),
  };
}

export function getPurchaseQuote(modelTier: string, tokenAmount: number) {
  const tier = MARKETPLACE_TIERS[modelTier];
  if (!tier) {
    throw new MarketplaceError(`Unknown contract tier: ${modelTier}`, 404);
  }

  if (!Number.isFinite(tokenAmount) || tokenAmount < tier.minPurchaseTokens) {
    throw new MarketplaceError(
      `Minimum purchase is ${tier.minPurchaseTokens.toLocaleString()} tokens for ${modelTier}`,
    );
  }

  const pricing = computePurchaseUsdcDisplay(tokenAmount, tier.lockedRatePerM);

  return {
    modelTier,
    tokenAmount,
    lockedRatePerM: tier.lockedRatePerM,
    expiryDate: tier.expiryDate,
    paymentRequired: isMarketplacePaymentRequired(),
    usdcMint: env.USDC_TOKEN_MINT,
    treasuryWallet: env.MASTER_VAULT_WALLET,
    ...pricing,
  };
}

export async function purchaseComputeContract(
  userId: string,
  walletAddress: string,
  modelTier: string,
  tokenAmount: number,
  txSignature?: string,
) {
  const tier = MARKETPLACE_TIERS[modelTier];

  if (!tier) {
    throw new MarketplaceError(`Unknown contract tier: ${modelTier}`, 404);
  }

  if (!Number.isFinite(tokenAmount) || tokenAmount < tier.minPurchaseTokens) {
    throw new MarketplaceError(
      `Minimum purchase is ${tier.minPurchaseTokens.toLocaleString()} tokens for ${modelTier}`,
    );
  }

  const tokens = BigInt(Math.floor(tokenAmount));
  const paymentRequired = isMarketplacePaymentRequired();

  if (paymentRequired && !txSignature) {
    throw new MarketplaceError(
      "USDG payment required. Send USDG to the treasury wallet and include txSignature.",
      402,
    );
  }

  let usdcMicro = 0n;

  if (paymentRequired && txSignature) {
    usdcMicro = computePurchaseUsdcMicro(tokenAmount, tier.lockedRatePerM);

    const supabase = getSupabase();
    const { data: existingTx, error: txLookupError } = await supabase
      .from("marketplace_purchases")
      .select("id")
      .eq("tx_signature", txSignature)
      .maybeSingle();

    assertNoError(txLookupError);

    if (existingTx) {
      throw new MarketplaceError(
        "This payment transaction has already been used for a purchase",
        409,
      );
    }

    try {
      await verifyUsdcPurchasePayment(txSignature, usdcMicro, walletAddress);
    } catch (error) {
      if (error instanceof TokenVerificationError) {
        throw new MarketplaceError(error.message, 400);
      }
      throw error;
    }
  }

  const supabase = getSupabase();

  const { data: existing, error: lookupError } = await supabase
    .from("compute_balances")
    .select("*")
    .eq("user_id", userId)
    .eq("model_tier", modelTier)
    .maybeSingle();

  assertNoError(lookupError);

  let balanceRow;

  if (existing) {
    const newBalance = toBigInt(existing.token_balance_remaining) + tokens;

    const { data: updated, error: updateError } = await supabase
      .from("compute_balances")
      .update({
        token_balance_remaining: newBalance.toString(),
        expiry_date: tier.expiryDate,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    assertNoError(updateError);

    if (!updated) {
      throw new MarketplaceError("Failed to update compute balance", 500);
    }

    balanceRow = updated;
  } else {
    const { data: created, error: insertError } = await supabase
      .from("compute_balances")
      .insert({
        user_id: userId,
        model_tier: modelTier,
        token_balance_remaining: tokens.toString(),
        expiry_date: tier.expiryDate,
      })
      .select("*")
      .single();

    assertNoError(insertError);

    if (!created) {
      throw new MarketplaceError("Failed to create compute balance", 500);
    }

    balanceRow = created;
  }

  if (paymentRequired && txSignature) {
    const { error: purchaseLogError } = await supabase
      .from("marketplace_purchases")
      .insert({
        user_id: userId,
        model_tier: modelTier,
        token_amount: tokens.toString(),
        usdc_amount_micro: usdcMicro.toString(),
        tx_signature: txSignature,
      });

    assertNoError(purchaseLogError);
  }

  return {
    balance: formatBalance(balanceRow),
    payment: paymentRequired
      ? {
          txSignature,
          usdcAmountMicro: usdcMicro.toString(),
        }
      : null,
  };
}

function formatBalance(row: {
  id: string;
  model_tier: string;
  token_balance_remaining: number | string;
  expiry_date: string;
}) {
  return {
    id: row.id,
    modelTier: row.model_tier,
    tokenBalanceRemaining: toBigInt(row.token_balance_remaining).toString(),
    expiryDate: row.expiry_date,
    isExpired: new Date(row.expiry_date) < new Date(),
  };
}
