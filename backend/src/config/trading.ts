import { MARKETPLACE_CATALOG } from "./marketplace-catalog.js";

/** Leverage options offered in the UI. */
export const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10] as const;
export const MAX_LEVERAGE = 10;

/** Maintenance margin fraction — position liquidates when equity falls below this. */
export const MAINTENANCE_MARGIN_FRACTION = 0.05;

/** Taker fee charged on notional when opening/closing (informational MVP). */
export const TAKER_FEE_RATE = 0.0006;

/** Price oracle tick cadence (ms). */
export const PRICE_TICK_MS = 3_000;

/** Risk engine cadence (ms). */
export const RISK_TICK_MS = 4_000;

/**
 * Per-tick volatility of the simulated mark price (fraction of price).
 *
 * Ticks fire every PRICE_TICK_MS (3s), so a 1-minute candle accumulates ~20
 * ticks; a candle's intra-bar move is ≈ TICK_VOLATILITY * sqrt(20). Keeping
 * this ~0.1%/tick gives small, readable candle bodies rather than tall spikes.
 */
export const TICK_VOLATILITY = 0.001;

/**
 * Soft mean-reversion pull back toward the real OpenRouter spot each tick.
 *
 * This is the single biggest driver of how the chart *reads*. Strong reversion
 * (half-life of a couple of minutes) snaps the mark back to spot so fast that a
 * multi-hour view is just a flat noise band. A gentle pull (half-life ~20 min:
 * ln 2 / SPOT_REVERSION ticks × 3s) lets the walk form real multi-candle trends
 * while still tracking OpenRouter over the long run. The mark's stationary std
 * is ≈ TICK_VOLATILITY / sqrt(2 * SPOT_REVERSION).
 */
export const SPOT_REVERSION = 0.0015;

export type TradingMarket = {
  tier: string;
  symbol: string;
  name: string;
  modelIds: string[];
};

/** Trading markets mirror the futures tiers (one market per tier). */
export const TRADING_MARKETS: TradingMarket[] = MARKETPLACE_CATALOG.filter(
  (entry) => entry.type === "future",
).map((entry) => ({
  tier: entry.tier,
  symbol: marketSymbol(entry.tier),
  name: entry.name.replace(/ Inference Future$/i, ""),
  modelIds: entry.models,
}));

export function marketSymbol(tier: string) {
  // cSEEK-SEP26 -> SEEK-SEP26 ; used as the chart ticker label.
  return tier.replace(/^c/, "");
}

export function getTradingMarket(tier: string): TradingMarket | null {
  return TRADING_MARKETS.find((market) => market.tier === tier) ?? null;
}
