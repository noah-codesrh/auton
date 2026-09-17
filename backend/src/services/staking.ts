import { assertNoError, getSupabase } from "../db/supabase.js";
import { toBigInt, toDecimalString, type StakingLedgerRow } from "../db/types.js";
import {
  parseTokenAmount,
  StakeVerificationError,
  verifyAutoStakeDeposit,
} from "./solana.js";

export async function recordStakeDeposit(
  userId: string,
  walletAddress: string,
  txSignature: string,
  amount: number | string,
) {
  const supabase = getSupabase();

  const { data: existing, error: lookupError } = await supabase
    .from("staking_ledger")
    .select("id")
    .eq("vault_tx_signature", txSignature)
    .maybeSingle();

  assertNoError(lookupError);

  if (existing) {
    throw new StakeServiceError("This transaction has already been recorded", 409);
  }

  const amountLamports = parseTokenAmount(amount);

  const verified = await verifyAutoStakeDeposit(
    txSignature,
    amountLamports,
    walletAddress,
  );

  const { data: entry, error: insertError } = await supabase
    .from("staking_ledger")
    .insert({
      user_id: userId,
      amount_staked_auto: verified.amount.toString(),
      vault_tx_signature: verified.signature,
    })
    .select()
    .single();

  assertNoError(insertError);
  if (!entry) {
    throw new StakeServiceError("Failed to record stake deposit", 500);
  }

  const totals = await getStakingTotals(userId);

  return {
    ledgerEntry: serializeLedgerEntry(entry),
    totals,
  };
}

export async function claimUsdcYield(userId: string, walletAddress: string) {
  const supabase = getSupabase();

  const { data: entries, error: fetchError } = await supabase
    .from("staking_ledger")
    .select("*")
    .eq("user_id", userId);

  assertNoError(fetchError);

  const claimable = (entries ?? []).reduce(
    (sum, entry) => sum + Number(entry.claimable_usdc_yield),
    0,
  );

  if (claimable <= 0) {
    throw new StakeServiceError("No claimable USDG yield available", 400);
  }

  const { error: resetError } = await supabase
    .from("staking_ledger")
    .update({ claimable_usdc_yield: 0 })
    .eq("user_id", userId);

  assertNoError(resetError);

  const { data: claimRequest, error: claimError } = await supabase
    .from("claim_requests")
    .insert({
      user_id: userId,
      wallet_address: walletAddress,
      amount_usdc: claimable.toFixed(6),
      status: "pending",
    })
    .select()
    .single();

  assertNoError(claimError);
  if (!claimRequest) {
    throw new StakeServiceError("Failed to queue claim request", 500);
  }

  return {
    claimRequestId: claimRequest.id,
    amountUsdc: toDecimalString(claimRequest.amount_usdc),
    status: claimRequest.status,
    message:
      "Claim queued for processing. USDC will be sent to your wallet shortly.",
  };
}

export async function getStakingTotals(userId: string) {
  const supabase = getSupabase();

  const { data: entries, error } = await supabase
    .from("staking_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("stake_timestamp", { ascending: false });

  assertNoError(error);

  const rows = entries ?? [];

  const totalStakedAuto = rows.reduce(
    (sum, entry) => sum + toBigInt(entry.amount_staked_auto),
    0n,
  );

  const claimableUsdcYield = rows
    .reduce((sum, entry) => sum + Number(entry.claimable_usdc_yield), 0)
    .toFixed(6);

  return {
    totalStakedAuto: totalStakedAuto.toString(),
    claimableUsdcYield,
    stakeCount: rows.length,
    recentDeposits: rows.slice(0, 10).map(serializeLedgerEntry),
  };
}

function serializeLedgerEntry(entry: StakingLedgerRow) {
  return {
    id: entry.id,
    amountStakedAuto: toBigInt(entry.amount_staked_auto).toString(),
    vaultTxSignature: entry.vault_tx_signature,
    stakeTimestamp: entry.stake_timestamp,
    claimableUsdcYield: toDecimalString(entry.claimable_usdc_yield),
  };
}

export class StakeServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "StakeServiceError";
  }
}
