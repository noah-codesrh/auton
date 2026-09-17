import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import {
  LEVERAGE_OPTIONS,
  MAINTENANCE_MARGIN_FRACTION,
  RISK_TICK_MS,
  getTradingMarket,
} from "../config/trading.js";
import { assertNoError, getSupabase } from "../db/supabase.js";
import { getAutoUsdPrice } from "./auto-price.js";
import { getMarkPrice } from "./price-engine.js";
import {
  TokenVerificationError,
  verifyAutoMarginDeposit,
  verifyUsdcPurchasePayment,
} from "./solana.js";
import {
  isVaultSignerConfigured,
  sendAutoFromVault,
  sendUsdcFromVault,
} from "./vault.js";

export type CollateralAsset = "AUTO" | "USDC";

export class TradingError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "TradingError";
    this.statusCode = statusCode;
  }
}

export type Side = "LONG" | "SHORT";
export type OrderType =
  | "MARKET"
  | "LIMIT"
  | "STOP_MARKET"
  | "STOP_LIMIT"
  | "TAKE_MARKET"
  | "TAKE_LIMIT"
  | "SCALE"
  | "TWAP";

/** Stop/Take orders that wait for the mark to cross a trigger price. */
const TRIGGER_TYPES = new Set<OrderType>([
  "STOP_MARKET",
  "STOP_LIMIT",
  "TAKE_MARKET",
  "TAKE_LIMIT",
]);
/** Trigger types that, once fired, rest as a limit order. */
const TRIGGER_LIMIT_TYPES = new Set<OrderType>(["STOP_LIMIT", "TAKE_LIMIT"]);

const SCALE_MIN_LEGS = 2;
const SCALE_MAX_LEGS = 20;
const TWAP_MIN_SLICES = 2;
const TWAP_MAX_SLICES = 50;

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function round(value: number, dp = 6): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

/** Narrow a Supabase `.single()` result to non-null after `assertNoError`. */
function requireRow<T>(row: T | null | undefined, what = "record"): T {
  if (row == null) {
    throw new TradingError(`Failed to load ${what} after write`, 500);
  }
  return row;
}

export function liquidationPrice(
  entry: number,
  leverage: number,
  side: Side,
): number {
  const move = 1 / leverage - MAINTENANCE_MARGIN_FRACTION;
  return side === "LONG"
    ? round(entry * (1 - move))
    : round(entry * (1 + move));
}

export function positionPnl(
  side: Side,
  entry: number,
  mark: number,
  sizeMillions: number,
): number {
  const diff = side === "LONG" ? mark - entry : entry - mark;
  return round(diff * sizeMillions);
}

async function getOrCreateAccount(userId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("margin_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error);
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("margin_accounts")
    .insert({
      user_id: userId,
      total_collateral: 0,
      free_margin: 0,
      locked_margin: 0,
    })
    .select("*")
    .single();

  assertNoError(insertError);
  if (!created) throw new TradingError("Failed to create margin account", 500);
  return created;
}

/**
 * Deposit-to-Credit clearinghouse: deposit either native USDC (1:1 USD) or
 * Pump.fun $AUTO (valued at the live Jupiter oracle price). The trading account
 * is credited in unified USD while the raw token balance is tracked separately.
 */
export async function depositMargin(
  userId: string,
  walletAddress: string,
  amount: number,
  asset: CollateralAsset,
  txSignature?: string,
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new TradingError("Deposit amount must be positive");
  }
  if (asset !== "AUTO" && asset !== "USDC") {
    throw new TradingError("asset must be AUTO or USDC");
  }
  if (asset === "AUTO" && !env.AUTO_TOKEN_MINT) {
    throw new TradingError("$AUTO is not deployed yet. Deposit USDG instead.");
  }

  const supabase = getSupabase();
  const skip = env.MARKETPLACE_SKIP_PAYMENT;

  // Resolve the USD value credited to the unified buying-power balance.
  const autoPrice = await getAutoUsdPrice();
  const usdCredit =
    asset === "USDC" ? round(amount) : round(amount * autoPrice);

  if (usdCredit <= 0) {
    throw new TradingError("Deposit value rounds to zero in USD");
  }

  if (!skip) {
    if (!txSignature) {
      throw new TradingError(
        `Send ${asset} to the vault and include txSignature.`,
        402,
      );
    }

    const { data: existing, error: dupError } = await supabase
      .from("margin_deposits")
      .select("id")
      .eq("tx_signature", txSignature)
      .maybeSingle();
    assertNoError(dupError);
    if (existing) {
      throw new TradingError("This deposit transaction was already credited", 409);
    }

    const decimals =
      asset === "USDC" ? env.USDC_TOKEN_DECIMALS : env.AUTO_TOKEN_DECIMALS;
    const expectedBase = BigInt(Math.round(amount * 10 ** decimals));

    try {
      if (asset === "USDC") {
        await verifyUsdcPurchasePayment(txSignature, expectedBase, walletAddress);
      } else {
        await verifyAutoMarginDeposit(txSignature, expectedBase, walletAddress);
      }
    } catch (error) {
      if (error instanceof TokenVerificationError) {
        throw new TradingError(error.message, 400);
      }
      throw error;
    }
  }

  const account = await getOrCreateAccount(userId);

  const { data: updated, error: updateError } = await supabase
    .from("margin_accounts")
    .update({
      total_collateral: round(num(account.total_collateral) + usdCredit),
      free_margin: round(num(account.free_margin) + usdCredit),
      auto_collateral: round(
        num(account.auto_collateral) + (asset === "AUTO" ? amount : 0),
      ),
      usdc_collateral: round(
        num(account.usdc_collateral) + (asset === "USDC" ? amount : 0),
      ),
    })
    .eq("id", account.id)
    .select("*")
    .single();
  assertNoError(updateError);

  if (txSignature) {
    const { error: logError } = await supabase.from("margin_deposits").insert({
      user_id: userId,
      asset,
      amount_auto: amount,
      usd_credited: usdCredit,
      tx_signature: txSignature,
    });
    assertNoError(logError);
  }

  return {
    ...formatAccount(requireRow(updated, "margin account")),
    autoPrice,
    usdCredited: usdCredit,
  };
}

/**
 * Withdraw free buying power back to the trader's wallet as an on-chain vault
 * payout. Debits the ledger first (so concurrent requests can't double-spend),
 * sends the tokens, and refunds the ledger if the payout fails.
 */
export async function withdrawMargin(
  userId: string,
  walletAddress: string,
  amount: number,
  asset: CollateralAsset,
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new TradingError("Withdrawal amount must be positive");
  }
  if (asset !== "AUTO" && asset !== "USDC") {
    throw new TradingError("asset must be AUTO or USDC");
  }
  if (asset === "AUTO" && !env.AUTO_TOKEN_MINT) {
    throw new TradingError("$AUTO is not deployed yet. Withdraw USDG instead.");
  }
  if (!walletAddress) {
    throw new TradingError("No wallet on file to withdraw to", 400);
  }
  if (!isVaultSignerConfigured()) {
    throw new TradingError(
      "Withdrawals are temporarily unavailable. Please contact support.",
      503,
    );
  }

  const supabase = getSupabase();
  const account = await getOrCreateAccount(userId);

  const autoPrice = await getAutoUsdPrice();
  const usdValue = asset === "USDC" ? round(amount) : round(amount * autoPrice);
  if (usdValue <= 0) {
    throw new TradingError("Withdrawal value rounds to zero in USD");
  }

  const assetBalance =
    asset === "USDC"
      ? num(account.usdc_collateral)
      : num(account.auto_collateral);
  if (amount > assetBalance + 1e-9) {
    throw new TradingError(
      `You can withdraw at most ${round(assetBalance)} ${asset} of deposited collateral.`,
      400,
    );
  }
  if (usdValue > num(account.free_margin) + 1e-9) {
    throw new TradingError(
      `Insufficient free buying power. Withdrawing needs ${usdValue} USD but only ${round(num(account.free_margin))} is free (the rest is locked in positions).`,
      402,
    );
  }

  // Optimistic debit before payout so a second request can't spend the same
  // balance; we re-credit below if the on-chain transfer fails.
  const debited = {
    total_collateral: round(num(account.total_collateral) - usdValue),
    free_margin: round(num(account.free_margin) - usdValue),
    auto_collateral: round(
      num(account.auto_collateral) - (asset === "AUTO" ? amount : 0),
    ),
    usdc_collateral: round(
      num(account.usdc_collateral) - (asset === "USDC" ? amount : 0),
    ),
  };

  const { data: afterDebit, error: debitError } = await supabase
    .from("margin_accounts")
    .update(debited)
    .eq("id", account.id)
    .select("*")
    .single();
  assertNoError(debitError);

  let txSignature: string;
  try {
    txSignature =
      asset === "USDC"
        ? await sendUsdcFromVault(walletAddress, amount)
        : await sendAutoFromVault(walletAddress, amount);
  } catch (error) {
    // Refund the optimistic debit — the funds never left the vault.
    await supabase
      .from("margin_accounts")
      .update({
        total_collateral: round(num(account.total_collateral)),
        free_margin: round(num(account.free_margin)),
        auto_collateral: round(num(account.auto_collateral)),
        usdc_collateral: round(num(account.usdc_collateral)),
      })
      .eq("id", account.id);
    const message =
      error instanceof Error ? error.message : "Vault payout failed";
    throw new TradingError(`Withdrawal payout failed: ${message}`, 502);
  }

  const { error: logError } = await supabase
    .from("margin_withdrawals")
    .insert({
      user_id: userId,
      asset,
      amount,
      usd_debited: usdValue,
      tx_signature: txSignature,
      status: "COMPLETED",
    });
  assertNoError(logError);

  return {
    account: formatAccount(requireRow(afterDebit, "margin account")),
    txSignature,
    asset,
    amount,
    usdDebited: usdValue,
  };
}

type OrderLeg = {
  status: "ACTIVE" | "PENDING";
  entry_price: number;
  size_millions: number;
  notional_usd: number;
  locked_collateral: number;
  liquidation_price: number;
  order_type: OrderType;
  limit_price: number | null;
  trigger_price: number | null;
  trigger_above: boolean | null;
  triggered: boolean;
  execute_at: string | null;
  parent_id: string | null;
};

function requirePositivePrice(value: number | undefined, name: string): number {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) {
    throw new TradingError(`${name} must be a positive number`);
  }
  return round(value as number);
}

/**
 * Place an order. Supports market/limit fills, stop & take triggers, scale
 * ladders and TWAP schedules. Every order type reserves margin up front and
 * (except immediate market fills) rests as PENDING until the fill engine
 * activates it. Scale/TWAP expand into multiple child legs sharing a parent id.
 */
export async function openPosition(
  userId: string,
  input: {
    marketTier: string;
    side: Side;
    leverage: number;
    sizeMillions: number;
    orderType?: OrderType;
    limitPrice?: number;
    triggerPrice?: number;
    scaleLow?: number;
    scaleHigh?: number;
    scaleCount?: number;
    twapDurationMinutes?: number;
    twapCount?: number;
  },
) {
  const market = getTradingMarket(input.marketTier);
  if (!market) throw new TradingError("Unknown market", 404);

  if (input.side !== "LONG" && input.side !== "SHORT") {
    throw new TradingError("side must be LONG or SHORT");
  }

  if (!LEVERAGE_OPTIONS.includes(input.leverage as never)) {
    throw new TradingError(`leverage must be one of ${LEVERAGE_OPTIONS.join(", ")}`);
  }

  if (!Number.isFinite(input.sizeMillions) || input.sizeMillions <= 0) {
    throw new TradingError("sizeMillions must be positive");
  }

  const orderType: OrderType = input.orderType ?? "MARKET";
  const { side, leverage } = input;

  const mark = getMarkPrice(input.marketTier);
  if (mark === null) throw new TradingError("Market price unavailable", 503);

  const makeLeg = (opts: {
    status: "ACTIVE" | "PENDING";
    entry: number;
    sizingPrice: number;
    size: number;
    orderType: OrderType;
    limit?: number | null;
    trigger?: number | null;
    triggerAbove?: boolean | null;
    triggered?: boolean;
    executeAt?: string | null;
    parentId?: string | null;
  }): OrderLeg => {
    const notional = round(opts.size * opts.sizingPrice);
    const locked = round(notional / leverage);
    if (locked <= 0) throw new TradingError("Order is too small");
    return {
      status: opts.status,
      entry_price: round(opts.entry),
      size_millions: opts.size,
      notional_usd: notional,
      locked_collateral: locked,
      liquidation_price: liquidationPrice(opts.entry, leverage, side),
      order_type: opts.orderType,
      limit_price: opts.limit ?? null,
      trigger_price: opts.trigger ?? null,
      trigger_above: opts.triggerAbove ?? null,
      triggered: opts.triggered ?? false,
      execute_at: opts.executeAt ?? null,
      parent_id: opts.parentId ?? null,
    };
  };

  const legs: OrderLeg[] = [];

  switch (orderType) {
    case "MARKET": {
      legs.push(
        makeLeg({
          status: "ACTIVE",
          entry: mark,
          sizingPrice: mark,
          size: input.sizeMillions,
          orderType: "MARKET",
        }),
      );
      break;
    }

    case "LIMIT": {
      const limit = requirePositivePrice(input.limitPrice, "limitPrice");
      const fillsNow = side === "LONG" ? mark <= limit : mark >= limit;
      legs.push(
        makeLeg({
          status: fillsNow ? "ACTIVE" : "PENDING",
          entry: fillsNow ? mark : limit,
          sizingPrice: limit,
          size: input.sizeMillions,
          orderType: "LIMIT",
          limit,
        }),
      );
      break;
    }

    case "STOP_MARKET":
    case "TAKE_MARKET": {
      const trigger = requirePositivePrice(input.triggerPrice, "triggerPrice");
      legs.push(
        makeLeg({
          status: "PENDING",
          entry: trigger,
          sizingPrice: trigger,
          size: input.sizeMillions,
          orderType,
          trigger,
          triggerAbove: trigger >= mark,
        }),
      );
      break;
    }

    case "STOP_LIMIT":
    case "TAKE_LIMIT": {
      const trigger = requirePositivePrice(input.triggerPrice, "triggerPrice");
      const limit = requirePositivePrice(input.limitPrice, "limitPrice");
      legs.push(
        makeLeg({
          status: "PENDING",
          entry: limit,
          sizingPrice: limit,
          size: input.sizeMillions,
          orderType,
          limit,
          trigger,
          triggerAbove: trigger >= mark,
        }),
      );
      break;
    }

    case "SCALE": {
      const low = requirePositivePrice(input.scaleLow, "scaleLow");
      const high = requirePositivePrice(input.scaleHigh, "scaleHigh");
      const count = Math.floor(input.scaleCount ?? 0);
      if (count < SCALE_MIN_LEGS || count > SCALE_MAX_LEGS) {
        throw new TradingError(
          `scaleCount must be between ${SCALE_MIN_LEGS} and ${SCALE_MAX_LEGS}`,
        );
      }
      if (low >= high) {
        throw new TradingError("scaleLow must be less than scaleHigh");
      }
      const legSize = round(input.sizeMillions / count, 4);
      if (legSize <= 0) throw new TradingError("Scale legs are too small");
      const parentId = randomUUID();
      for (let i = 0; i < count; i += 1) {
        const price = round(low + ((high - low) * i) / (count - 1));
        const fillsNow = side === "LONG" ? mark <= price : mark >= price;
        legs.push(
          makeLeg({
            status: fillsNow ? "ACTIVE" : "PENDING",
            entry: fillsNow ? mark : price,
            sizingPrice: price,
            size: legSize,
            orderType: "SCALE",
            limit: price,
            parentId,
          }),
        );
      }
      break;
    }

    case "TWAP": {
      const count = Math.floor(input.twapCount ?? 0);
      const durationMinutes = input.twapDurationMinutes ?? 0;
      if (count < TWAP_MIN_SLICES || count > TWAP_MAX_SLICES) {
        throw new TradingError(
          `twapCount must be between ${TWAP_MIN_SLICES} and ${TWAP_MAX_SLICES}`,
        );
      }
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new TradingError("twapDurationMinutes must be positive");
      }
      const legSize = round(input.sizeMillions / count, 4);
      if (legSize <= 0) throw new TradingError("TWAP slices are too small");
      const parentId = randomUUID();
      const stepMs = (durationMinutes * 60_000) / count;
      const now = Date.now();
      for (let i = 0; i < count; i += 1) {
        legs.push(
          makeLeg({
            status: "PENDING",
            entry: mark,
            sizingPrice: mark,
            size: legSize,
            orderType: "TWAP",
            executeAt: new Date(now + Math.round(stepMs * (i + 1))).toISOString(),
            parentId,
          }),
        );
      }
      break;
    }

    default:
      throw new TradingError(`Unsupported order type: ${String(orderType)}`);
  }

  const totalRequiredMargin = round(
    legs.reduce((sum, leg) => sum + leg.locked_collateral, 0),
  );
  if (totalRequiredMargin <= 0) throw new TradingError("Position too small");

  const supabase = getSupabase();
  const account = await getOrCreateAccount(userId);

  if (num(account.free_margin) < totalRequiredMargin) {
    throw new TradingError(
      `Insufficient margin. Need ${totalRequiredMargin} AUTO, have ${num(account.free_margin)}.`,
      402,
    );
  }

  const insertRows = legs.map((leg) => ({
    user_id: userId,
    market_tier: input.marketTier,
    side,
    leverage,
    entry_price: leg.entry_price,
    size_millions: leg.size_millions,
    notional_usd: leg.notional_usd,
    locked_collateral: leg.locked_collateral,
    liquidation_price: leg.liquidation_price,
    status: leg.status,
    order_type: leg.order_type,
    limit_price: leg.limit_price,
    trigger_price: leg.trigger_price,
    trigger_above: leg.trigger_above,
    triggered: leg.triggered,
    execute_at: leg.execute_at,
    parent_id: leg.parent_id,
    realized_pnl: 0,
  }));

  const { data: inserted, error: posError } = await supabase
    .from("positions")
    .insert(insertRows)
    .select("*");
  assertNoError(posError);

  // Reserve total margin once for all legs.
  const { data: updated, error: updateError } = await supabase
    .from("margin_accounts")
    .update({
      free_margin: round(num(account.free_margin) - totalRequiredMargin),
      locked_margin: round(num(account.locked_margin) + totalRequiredMargin),
    })
    .eq("id", account.id)
    .select("*")
    .single();
  assertNoError(updateError);

  const rows = inserted ?? [];
  return {
    position: formatPosition(requireRow(rows[0], "position"), mark),
    orders: rows.map((row) => formatPosition(row, mark)),
    account: formatAccount(requireRow(updated, "margin account")),
  };
}

export async function cancelOrder(userId: string, positionId: string) {
  const supabase = getSupabase();

  const { data: order, error } = await supabase
    .from("positions")
    .select("*")
    .eq("id", positionId)
    .eq("user_id", userId)
    .maybeSingle();
  assertNoError(error);

  if (!order) throw new TradingError("Order not found", 404);
  if (order.status !== "PENDING") {
    throw new TradingError("Only pending limit orders can be cancelled", 409);
  }

  // Guarded transition: only cancel while still PENDING (the fill engine may
  // have just activated it) so reserved margin is never released twice.
  const { data: cancelled, error: cancelError } = await supabase
    .from("positions")
    .update({ status: "CANCELLED", closed_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "PENDING")
    .select("id");
  assertNoError(cancelError);
  if (!cancelled || cancelled.length === 0) {
    throw new TradingError("Order is no longer pending", 409);
  }

  const locked = num(order.locked_collateral);
  const account = await getOrCreateAccount(userId);

  const { data: updated, error: accError } = await supabase
    .from("margin_accounts")
    .update({
      free_margin: round(num(account.free_margin) + locked),
      locked_margin: round(Math.max(0, num(account.locked_margin) - locked)),
    })
    .eq("id", account.id)
    .select("*")
    .single();
  assertNoError(accError);

  return {
    position: formatPosition(
      { ...order, status: "CANCELLED" },
      num(order.limit_price) || num(order.entry_price),
    ),
    account: formatAccount(requireRow(updated, "margin account")),
  };
}

export async function closePosition(
  userId: string,
  positionId: string,
  walletAddress?: string,
) {
  const supabase = getSupabase();

  const { data: position, error } = await supabase
    .from("positions")
    .select("*")
    .eq("id", positionId)
    .eq("user_id", userId)
    .maybeSingle();
  assertNoError(error);

  if (!position) throw new TradingError("Position not found", 404);
  if (position.status !== "ACTIVE") {
    throw new TradingError("Position is not active", 409);
  }

  const mark = getMarkPrice(position.market_tier) ?? num(position.entry_price);
  const locked = num(position.locked_collateral);
  let pnl = positionPnl(
    position.side as Side,
    num(position.entry_price),
    mark,
    num(position.size_millions),
  );
  // A close can never lose more than the locked collateral.
  if (pnl < -locked) pnl = -locked;

  const account = await getOrCreateAccount(userId);
  const settle = isVaultSignerConfigured() && Boolean(walletAddress);

  // Amount owed back to the trader on close: their margin plus realized PnL.
  const payoutUsd = Math.max(0, round(locked + pnl));

  let settlementTx: string | null = null;
  let settlementAuto = 0;
  let settlementError: string | null = null;

  if (settle && payoutUsd > 0) {
    settlementAuto = payoutUsd;

    try {
      settlementTx = await sendUsdcFromVault(walletAddress!, payoutUsd);
    } catch (error) {
      // Don't block the close if the on-chain payout fails — record it so it
      // can be retried/audited, and fall back to crediting the ledger.
      settlementError =
        error instanceof Error ? error.message : "Vault payout failed";
      console.warn("Vault settlement failed:", settlementError);
    }
  }

  const paidOut = settlementTx !== null;

  const { error: posUpdateError } = await supabase
    .from("positions")
    .update({
      status: "CLOSED",
      exit_price: mark,
      realized_pnl: pnl,
      closed_at: new Date().toISOString(),
      settlement_tx: settlementTx,
      settlement_auto: settlementAuto,
    })
    .eq("id", position.id);
  assertNoError(posUpdateError);

  // Ledger accounting:
  // - paidOut: the margin + PnL left the vault to the wallet, so remove the
  //   locked margin from the account (do NOT credit free margin).
  // - otherwise (no signer, or payout failed): credit the ledger as before so
  //   funds remain accounted for and withdrawable later.
  const accountUpdate = paidOut
    ? {
        locked_margin: round(Math.max(0, num(account.locked_margin) - locked)),
        total_collateral: round(Math.max(0, num(account.total_collateral) - locked)),
        usdc_collateral: round(Math.max(0, num(account.usdc_collateral) - locked)),
      }
    : {
        free_margin: round(num(account.free_margin) + locked + pnl),
        locked_margin: round(Math.max(0, num(account.locked_margin) - locked)),
        total_collateral: round(num(account.total_collateral) + pnl),
      };

  const { data: updated, error: accError } = await supabase
    .from("margin_accounts")
    .update(accountUpdate)
    .eq("id", account.id)
    .select("*")
    .single();
  assertNoError(accError);

  return {
    position: formatPosition(
      { ...position, exit_price: mark, realized_pnl: pnl, status: "CLOSED" },
      mark,
    ),
    account: formatAccount(requireRow(updated, "margin account")),
    realizedPnl: pnl,
    settlement: {
      paidOut,
      asset: "USDG" as const,
      amountAuto: settlementAuto,
      payoutUsd,
      txSignature: settlementTx,
      error: settlementError,
    },
  };
}

export async function getTradingAccount(userId: string) {
  const supabase = getSupabase();
  const account = await getOrCreateAccount(userId);

  const { data: positions, error } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  assertNoError(error);

  const rows = positions ?? [];
  const open = rows
    .filter((p) => p.status === "ACTIVE")
    .map((p) => formatPosition(p, getMarkPrice(p.market_tier) ?? num(p.entry_price)));
  const openOrders = rows
    .filter((p) => p.status === "PENDING")
    .map((p) => formatPosition(p, getMarkPrice(p.market_tier) ?? num(p.entry_price)));
  const history = rows
    .filter((p) => p.status !== "ACTIVE" && p.status !== "PENDING")
    .map((p) => formatPosition(p, num(p.exit_price) || num(p.entry_price)));

  // Live equity = total collateral + unrealized PnL of open positions.
  const unrealized = open.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const autoPrice = await getAutoUsdPrice();

  return {
    account: {
      ...formatAccount(account),
      unrealizedPnl: round(unrealized),
      equity: round(num(account.total_collateral) + unrealized),
      buyingPowerUsd: round(num(account.free_margin)),
      autoPrice,
    },
    openPositions: open,
    openOrders,
    history,
  };
}

/** Background liquidation loop. */
let riskTimer: NodeJS.Timeout | null = null;

export function startRiskEngine(): void {
  if (riskTimer) return;
  riskTimer = setInterval(() => {
    void runRiskPass().catch((error) => {
      console.warn("Risk engine pass failed:", error);
    });
    void fillPendingOrders().catch((error) => {
      console.warn("Limit fill pass failed:", error);
    });
  }, RISK_TICK_MS);
}

async function activateOrder(
  supabase: ReturnType<typeof getSupabase>,
  id: string,
  fillPrice: number,
  leverage: number,
  side: Side,
): Promise<void> {
  // Margin was reserved at placement; the status guard keeps this idempotent
  // across replicas (only one PENDING -> ACTIVE transition wins).
  await supabase
    .from("positions")
    .update({
      status: "ACTIVE",
      triggered: true,
      entry_price: round(fillPrice),
      liquidation_price: liquidationPrice(fillPrice, leverage, side),
    })
    .eq("id", id)
    .eq("status", "PENDING");
}

/**
 * Activate resting orders whose conditions are met:
 *   - TWAP slices fill at the mark once their scheduled time passes.
 *   - Stop/Take orders fire when the mark crosses the trigger (market types
 *     fill at the mark; limit types then rest as a limit order).
 *   - Limit / Scale (and triggered stop/take-limit) fill when the mark crosses
 *     the limit price.
 */
async function fillPendingOrders(): Promise<void> {
  const supabase = getSupabase();
  const { data: orders, error } = await supabase
    .from("positions")
    .select("*")
    .eq("status", "PENDING");
  if (error) return;

  const now = Date.now();

  for (const order of orders ?? []) {
    const mark = getMarkPrice(order.market_tier);
    if (mark === null) continue;

    const side = order.side as Side;
    const type = (order.order_type as OrderType) ?? "MARKET";

    // 1. TWAP slice: time-based, fills at the mark once its slot arrives.
    if (order.execute_at) {
      if (Date.parse(order.execute_at) <= now) {
        await activateOrder(supabase, order.id, mark, order.leverage, side);
      }
      continue;
    }

    // 2. Stop/Take trigger: wait for the mark to cross the trigger price.
    if (TRIGGER_TYPES.has(type) && !order.triggered) {
      const trigger = num(order.trigger_price);
      if (trigger <= 0) continue;
      const above = order.trigger_above ?? trigger >= mark;
      const fired = above ? mark >= trigger : mark <= trigger;
      if (!fired) continue;

      if (TRIGGER_LIMIT_TYPES.has(type)) {
        // From here it behaves as a resting limit order.
        await supabase
          .from("positions")
          .update({ triggered: true })
          .eq("id", order.id)
          .eq("status", "PENDING");
      } else {
        await activateOrder(supabase, order.id, mark, order.leverage, side);
      }
      continue;
    }

    // 3. Limit-style: plain LIMIT, SCALE legs, or a triggered stop/take-limit.
    const limitStyle =
      type === "LIMIT" ||
      type === "SCALE" ||
      (TRIGGER_LIMIT_TYPES.has(type) && order.triggered);
    if (limitStyle) {
      const limit = num(order.limit_price);
      if (limit <= 0) continue;
      const crossed = side === "LONG" ? mark <= limit : mark >= limit;
      if (crossed) {
        await activateOrder(supabase, order.id, limit, order.leverage, side);
      }
    }
  }
}

export function stopRiskEngine(): void {
  if (riskTimer) clearInterval(riskTimer);
  riskTimer = null;
}

async function runRiskPass(): Promise<void> {
  const supabase = getSupabase();
  const { data: positions, error } = await supabase
    .from("positions")
    .select("*")
    .eq("status", "ACTIVE");
  if (error) return;

  for (const position of positions ?? []) {
    const mark = getMarkPrice(position.market_tier);
    if (mark === null) continue;

    const side = position.side as Side;
    const liq = num(position.liquidation_price);
    const hit = side === "LONG" ? mark <= liq : mark >= liq;
    if (!hit) continue;

    const locked = num(position.locked_collateral);

    await supabase
      .from("positions")
      .update({
        status: "LIQUIDATED",
        exit_price: liq,
        realized_pnl: -locked,
        closed_at: new Date().toISOString(),
      })
      .eq("id", position.id)
      .eq("status", "ACTIVE");

    const { data: account } = await supabase
      .from("margin_accounts")
      .select("*")
      .eq("user_id", position.user_id)
      .maybeSingle();

    if (account) {
      await supabase
        .from("margin_accounts")
        .update({
          locked_margin: round(Math.max(0, num(account.locked_margin) - locked)),
          total_collateral: round(Math.max(0, num(account.total_collateral) - locked)),
        })
        .eq("id", account.id);
    }
    // NOTE: seized collateral (50% burn / 50% staking) is accounted here but the
    // on-chain transfer requires a vault signer and is intentionally out of MVP scope.
  }
}

function formatAccount(row: {
  total_collateral: number | string;
  free_margin: number | string;
  locked_margin: number | string;
  auto_collateral?: number | string;
  usdc_collateral?: number | string;
}) {
  return {
    totalCollateral: round(num(row.total_collateral)),
    freeMargin: round(num(row.free_margin)),
    lockedMargin: round(num(row.locked_margin)),
    autoCollateral: round(num(row.auto_collateral)),
    usdcCollateral: round(num(row.usdc_collateral)),
  };
}

function formatPosition(
  row: {
    id: string;
    market_tier: string;
    side: string;
    leverage: number;
    entry_price: number | string;
    size_millions: number | string;
    notional_usd: number | string;
    locked_collateral: number | string;
    liquidation_price: number | string;
    status: string;
    realized_pnl: number | string;
    exit_price?: number | string | null;
    created_at?: string;
    closed_at?: string | null;
    order_type?: string;
    limit_price?: number | string | null;
    trigger_price?: number | string | null;
    triggered?: boolean;
    execute_at?: string | null;
    parent_id?: string | null;
  },
  mark: number,
) {
  const side = row.side as Side;
  const entry = num(row.entry_price);
  const size = num(row.size_millions);
  const locked = num(row.locked_collateral);
  const unrealizedPnl =
    row.status === "ACTIVE" ? positionPnl(side, entry, mark, size) : 0;
  const pnlPercent = locked > 0 ? round((unrealizedPnl / locked) * 100, 2) : 0;

  return {
    id: row.id,
    marketTier: row.market_tier,
    side,
    leverage: row.leverage,
    entryPrice: entry,
    markPrice: round(mark),
    sizeMillions: size,
    notionalUsd: num(row.notional_usd),
    lockedCollateral: locked,
    liquidationPrice: num(row.liquidation_price),
    status: row.status,
    orderType: (row.order_type as OrderType) ?? "MARKET",
    limitPrice:
      row.limit_price === null || row.limit_price === undefined
        ? null
        : num(row.limit_price),
    triggerPrice:
      row.trigger_price === null || row.trigger_price === undefined
        ? null
        : num(row.trigger_price),
    triggered: Boolean(row.triggered),
    executeAt: row.execute_at ?? null,
    parentId: row.parent_id ?? null,
    unrealizedPnl,
    pnlPercent,
    realizedPnl: num(row.realized_pnl),
    exitPrice: row.exit_price === null || row.exit_price === undefined ? null : num(row.exit_price),
    createdAt: row.created_at ?? null,
    closedAt: row.closed_at ?? null,
  };
}
