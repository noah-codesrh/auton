import { assertNoError, getSupabase } from "../db/supabase.js";
import { toBigInt, type OptionPositionRow } from "../db/types.js";
import {
  creditCredits,
  debitCredits,
  getCreditBalance,
  type CreditBalance,
} from "./credits.js";
import {
  buildOptionPricer,
  type OptionQuote,
  type OptionSide,
} from "./derivatives.js";
import { getMarkPrice } from "./price-engine.js";

/**
 * Layer 4 — option buying.
 *
 * Users pay a premium (from the unified USD credit wallet) for the right to a
 * call or put on a model's compute forward. This is a paper/credit desk in the
 * same spirit as the trading positions: no on-chain settlement. Positions are
 * marked-to-market live against the Black-76 surface, and closing sells the
 * option back at its current premium (crediting the wallet). Pricing is always
 * server-authoritative — the client-quoted premium is never trusted.
 */

const USD_MICRO = 1_000_000;
/** Reject dust trades whose premium rounds below this. */
const MIN_PREMIUM_USD = 0.01;
/** Guardrail so a single position can't be absurdly large. */
const MAX_CONTRACTS_MILLIONS = 100_000;
/** How often the autonomous settlement sweep runs. */
const OPTION_SETTLE_MS = 60_000;

export class OptionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "OptionError";
    this.statusCode = statusCode;
  }
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

export type OptionOrderInput = {
  tier: string;
  side: OptionSide;
  strike: number;
  expiryDate: number;
  contractsMillions: number;
};

export type OptionQuoteResult = OptionQuote & {
  contractsMillions: number;
  /** Total premium for the position, USD. */
  premiumUsd: number;
  /** Worst case for a long option = premium paid. */
  maxLossUsd: number;
};

export type OptionPosition = {
  id: string;
  tier: string;
  side: OptionSide;
  strike: number;
  expiryDate: number;
  expiryLabel: string;
  contractsMillions: number;
  entryForward: number;
  entryPremiumPerM: number;
  entryIvPercent: number;
  premiumPaidUsd: number;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
  // live mark (open) or realized (closed)
  markForward: number | null;
  markPremiumPerM: number | null;
  markValueUsd: number | null;
  pnlUsd: number | null;
  pnlPercent: number | null;
  breakeven: number | null;
  inTheMoney: boolean | null;
};

function validateOrder(input: OptionOrderInput): void {
  if (input.side !== "CALL" && input.side !== "PUT") {
    throw new OptionError("side must be CALL or PUT.");
  }
  if (!(input.strike > 0)) {
    throw new OptionError("strike must be positive.");
  }
  if (!Number.isFinite(input.expiryDate) || input.expiryDate <= Date.now()) {
    throw new OptionError("expiry must be a future date.");
  }
  if (
    !Number.isFinite(input.contractsMillions) ||
    input.contractsMillions <= 0 ||
    input.contractsMillions > MAX_CONTRACTS_MILLIONS
  ) {
    throw new OptionError("size (in millions of tokens) is out of range.");
  }
}

/** Price a prospective order against the live surface. */
export async function quoteOption(
  input: OptionOrderInput,
): Promise<OptionQuoteResult> {
  validateOrder(input);

  const pricer = await buildOptionPricer();
  const quote = pricer.price(input.tier, input.side, input.strike, input.expiryDate);
  if (!quote) {
    throw new OptionError("No option surface available for that contract.", 404);
  }

  const premiumUsd = round(quote.premiumPerM * input.contractsMillions, 2);

  return {
    ...quote,
    contractsMillions: input.contractsMillions,
    premiumUsd,
    maxLossUsd: premiumUsd,
  };
}

function formatPosition(
  row: OptionPositionRow,
  live: OptionQuote | null,
): OptionPosition {
  const contracts = Number(row.contracts_millions);
  const side = row.side as OptionSide;
  const strike = Number(row.strike);
  const premiumPaidUsd = Number(toBigInt(row.premium_paid_usd_micro)) / USD_MICRO;
  const status = row.status as "OPEN" | "CLOSED";

  let markForward: number | null = null;
  let markPremiumPerM: number | null = null;
  let markValueUsd: number | null = null;
  let pnlUsd: number | null = null;
  let breakeven: number | null = null;
  let inTheMoney: boolean | null = null;

  if (status === "CLOSED") {
    markPremiumPerM =
      row.close_premium_per_m !== null ? Number(row.close_premium_per_m) : null;
    markValueUsd =
      row.close_value_usd_micro !== null
        ? Number(toBigInt(row.close_value_usd_micro)) / USD_MICRO
        : null;
    pnlUsd =
      row.pnl_usd_micro !== null
        ? Number(toBigInt(row.pnl_usd_micro)) / USD_MICRO
        : null;
  } else if (live) {
    markForward = live.forward;
    markPremiumPerM = live.premiumPerM;
    markValueUsd = round(live.premiumPerM * contracts, 2);
    pnlUsd = round(markValueUsd - premiumPaidUsd, 2);
    breakeven = live.breakeven;
    inTheMoney = side === "CALL" ? live.forward > strike : live.forward < strike;
  }

  const pnlPercent =
    pnlUsd !== null && premiumPaidUsd > 0
      ? round((pnlUsd / premiumPaidUsd) * 100, 1)
      : null;

  return {
    id: row.id,
    tier: row.model_tier,
    side,
    strike: round(strike, 4),
    expiryDate: new Date(row.expiry_date).getTime(),
    expiryLabel: row.expiry_label,
    contractsMillions: contracts,
    entryForward: Number(row.entry_forward),
    entryPremiumPerM: Number(row.entry_premium_per_m),
    entryIvPercent: Number(row.entry_iv_percent),
    premiumPaidUsd: round(premiumPaidUsd, 2),
    status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    markForward,
    markPremiumPerM,
    markValueUsd,
    pnlUsd,
    pnlPercent,
    breakeven,
    inTheMoney,
  };
}

export async function buyOption(
  userId: string,
  input: OptionOrderInput,
): Promise<{ position: OptionPosition; balance: CreditBalance }> {
  validateOrder(input);

  const pricer = await buildOptionPricer();
  const quote = pricer.price(input.tier, input.side, input.strike, input.expiryDate);
  if (!quote) {
    throw new OptionError("No option surface available for that contract.", 404);
  }

  const premiumUsd = quote.premiumPerM * input.contractsMillions;
  if (!(premiumUsd >= MIN_PREMIUM_USD)) {
    throw new OptionError(
      `Premium is below the $${MIN_PREMIUM_USD.toFixed(2)} minimum — increase the size.`,
    );
  }

  const premiumMicro = BigInt(Math.round(premiumUsd * USD_MICRO));

  // Debit first: throws (402) if the wallet can't cover the premium.
  const balance = await debitCredits(userId, premiumMicro);

  const supabase = getSupabase();
  const { data: created, error } = await supabase
    .from("option_positions")
    .insert({
      user_id: userId,
      model_tier: quote.tier,
      side: quote.side,
      strike: quote.strike,
      expiry_date: new Date(quote.expiryDate).toISOString(),
      expiry_label: quote.expiryLabel,
      contracts_millions: input.contractsMillions,
      entry_forward: quote.forward,
      entry_premium_per_m: quote.premiumPerM,
      entry_iv_percent: quote.ivPercent,
      premium_paid_usd_micro: premiumMicro.toString(),
      status: "OPEN",
    })
    .select("*")
    .single();

  if (error || !created) {
    // Roll the premium back so a failed insert never eats the user's balance.
    await creditCredits(userId, premiumMicro).catch(() => undefined);
    throw new OptionError("Failed to record option position.", 500);
  }

  return { position: formatPosition(created, quote), balance };
}

/** Intrinsic value per million tokens at settlement. */
function intrinsicPerM(side: OptionSide, forward: number, strike: number): number {
  return side === "CALL"
    ? Math.max(0, forward - strike)
    : Math.max(0, strike - forward);
}

/**
 * Settle a single expired OPEN row at its intrinsic value against the live
 * underlying (the forward converges to spot at expiry). Uses an atomic
 * status guard so concurrent sweeps/reads can't double-credit. Returns the
 * closed position, or null if it couldn't settle yet (no live mark) or another
 * pass already settled it.
 */
async function settleExpiredRow(
  row: OptionPositionRow,
): Promise<OptionPosition | null> {
  const forward = getMarkPrice(row.model_tier);
  if (forward === null || !(forward > 0)) return null;

  const side = row.side as OptionSide;
  const strike = Number(row.strike);
  const contracts = Number(row.contracts_millions);
  const intrinsic = intrinsicPerM(side, forward, strike);
  const settleMicro = BigInt(
    Math.max(0, Math.round(intrinsic * contracts * USD_MICRO)),
  );
  const pnlMicro = settleMicro - toBigInt(row.premium_paid_usd_micro);

  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from("option_positions")
    .update({
      status: "CLOSED",
      close_premium_per_m: round(intrinsic, 4),
      close_value_usd_micro: settleMicro.toString(),
      pnl_usd_micro: pnlMicro.toString(),
      closed_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "OPEN")
    .select("*")
    .single();

  // Lost the race (already settled) or transient error: skip crediting.
  if (error || !updated) return null;

  if (settleMicro > 0n) {
    await creditCredits(row.user_id, settleMicro).catch(() => undefined);
  }

  return formatPosition(updated, null);
}

/**
 * Settle every OPEN position whose expiry has passed. Idempotent and safe to
 * run on any/all replicas (the atomic status guard elects a single winner per
 * position). Scoped to one user when `userId` is given (lazy settle on read).
 */
export async function sweepExpiredOptions(
  now: number = Date.now(),
  userId?: string,
): Promise<number> {
  const supabase = getSupabase();
  let query = supabase
    .from("option_positions")
    .select("*")
    .eq("status", "OPEN")
    .lte("expiry_date", new Date(now).toISOString())
    .limit(500);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return 0;

  let settled = 0;
  for (const row of data ?? []) {
    const result = await settleExpiredRow(row);
    if (result) settled += 1;
  }
  return settled;
}

export async function listOptionPositions(
  userId: string,
): Promise<OptionPosition[]> {
  // Settle any of this user's expired positions before marking the book.
  await sweepExpiredOptions(Date.now(), userId).catch(() => undefined);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("option_positions")
    .select("*")
    .eq("user_id", userId)
    .order("opened_at", { ascending: false })
    .limit(100);

  assertNoError(error);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  // One surface build marks every open position.
  const hasOpen = rows.some((r) => r.status === "OPEN");
  const pricer = hasOpen ? await buildOptionPricer() : null;

  return rows.map((row) => {
    const live =
      row.status === "OPEN" && pricer
        ? pricer.price(
            row.model_tier,
            row.side as OptionSide,
            Number(row.strike),
            new Date(row.expiry_date).getTime(),
          )
        : null;
    return formatPosition(row, live);
  });
}

export async function closeOption(
  userId: string,
  positionId: string,
): Promise<{ position: OptionPosition; balance: CreditBalance }> {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from("option_positions")
    .select("*")
    .eq("id", positionId)
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error);
  if (!row) throw new OptionError("Option position not found.", 404);
  if (row.status !== "OPEN") {
    throw new OptionError("This position is already closed.", 409);
  }

  // Past expiry: settle at intrinsic rather than selling back time value.
  if (new Date(row.expiry_date).getTime() <= Date.now()) {
    const settled = await settleExpiredRow(row);
    if (!settled) {
      throw new OptionError(
        "Couldn't settle this expired option yet — try again shortly.",
        503,
      );
    }
    const balance = await getCreditBalance(userId);
    return { position: settled, balance };
  }

  const pricer = await buildOptionPricer();
  const quote = pricer.price(
    row.model_tier,
    row.side as OptionSide,
    Number(row.strike),
    new Date(row.expiry_date).getTime(),
  );

  const contracts = Number(row.contracts_millions);
  const closePremiumPerM = quote ? quote.premiumPerM : 0;
  const closeValueUsd = closePremiumPerM * contracts;
  const closeMicro = BigInt(Math.max(0, Math.round(closeValueUsd * USD_MICRO)));
  const pnlMicro = closeMicro - toBigInt(row.premium_paid_usd_micro);

  const { data: updated, error: updateError } = await supabase
    .from("option_positions")
    .update({
      status: "CLOSED",
      close_premium_per_m: round(closePremiumPerM, 4),
      close_value_usd_micro: closeMicro.toString(),
      pnl_usd_micro: pnlMicro.toString(),
      closed_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "OPEN")
    .select("*")
    .single();

  assertNoError(updateError);
  if (!updated) throw new OptionError("Failed to close position.", 500);

  // Credit the sale proceeds back to the wallet.
  let balance: CreditBalance;
  if (closeMicro > 0n) {
    balance = await creditCredits(userId, closeMicro);
  } else {
    balance = await getCreditBalance(userId);
  }

  return { position: formatPosition(updated, null), balance };
}

let settleTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the autonomous settlement loop so options settle at expiry even if no
 * one opens the page. Idempotent per position via the atomic status guard, so
 * it's safe to run on every replica (mirrors the trading risk engine).
 */
export function startOptionSettlement(): void {
  if (settleTimer) return;
  settleTimer = setInterval(() => {
    void sweepExpiredOptions().catch((error) => {
      console.warn("Option settlement sweep failed:", error);
    });
  }, OPTION_SETTLE_MS);
}

export function stopOptionSettlement(): void {
  if (settleTimer) clearInterval(settleTimer);
  settleTimer = null;
}
