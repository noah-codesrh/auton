import {
  impliedVol,
  RISK_FREE_RATE,
  STRIKE_MONEYNESS,
} from "../config/derivatives.js";
import { black76Greeks, type Greeks } from "./black-scholes.js";
import { getCandles, getMarkPrice } from "./price-engine.js";
import { buildYieldCurve, type ModelCurve } from "./yield-curve.js";

/**
 * Layer 4 — derivatives engine.
 *
 * Builds a full options surface on top of the Layer 3 yield curve. For each
 * model family, every forward point on the curve becomes an expiry board; each
 * board is priced across a strike ladder with the Black-76 model, yielding
 * call/put premia and Greeks per strike. From those we also derive:
 *
 *   - a per-family volatility index (the annualized ATM "compute vol"),
 *   - calendar spreads (ATM call, far expiry − near expiry),
 *   - an aggregate "compute VIX" across all families.
 *
 * The surface is *live*: the front expiry's forward is anchored to the price
 * engine's current mark (the same tick the trading terminal shows), the rest of
 * the curve is scaled to keep its shape, and the ATM vol level breathes with the
 * underlying's recent realized choppiness. So premia, Greeks, calendar spreads
 * and the vol index all move with the market rather than sitting on static config.
 *
 * This is a pure analytics layer — no positions, ledger, or settlement.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How volatile the underlying has been lately, as a multiplier on the family's
 * base vol. We measure mean absolute per-candle log return over the recent
 * window and map it against a reference level so that "normal" choppiness maps
 * to ~1.0. Clamped so a mean-reverting simulation can never blow the surface up.
 */
function realizedVolFactor(tier: string): number {
  const candles = getCandles(tier).slice(-60);
  if (candles.length < 12) return 1;

  let sumAbs = 0;
  let n = 0;
  for (let i = 1; i < candles.length; i += 1) {
    const prev = candles[i - 1].close;
    const cur = candles[i].close;
    if (prev > 0 && cur > 0) {
      sumAbs += Math.abs(Math.log(cur / prev));
      n += 1;
    }
  }
  if (n === 0) return 1;

  const meanAbs = sumAbs / n;
  // Reference per-minute move that corresponds to the base (config) vol.
  const REFERENCE = 0.0025;
  const factor = meanAbs / REFERENCE;
  return Math.min(1.5, Math.max(0.65, factor));
}

export type OptionLeg = {
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
};

export type OptionRow = {
  strike: number;
  /** Strike / forward. 1.0 is at-the-money. */
  moneyness: number;
  /** Annualized implied vol used for this strike (with skew), percent. */
  ivPercent: number;
  call: OptionLeg;
  put: OptionLeg;
};

export type ExpiryBoard = {
  expiryDate: number;
  expiryLabel: string;
  daysToExpiry: number;
  yearsToExpiry: number;
  /** Forward compute rate at this expiry (the option underlying), $/M. */
  forward: number;
  /** Strike nearest the forward. */
  atmStrike: number;
  /** ATM annualized implied vol, percent. */
  atmIvPercent: number;
  rows: OptionRow[];
};

export type CalendarSpread = {
  strike: number;
  nearLabel: string;
  farLabel: string;
  nearPremium: number;
  farPremium: number;
  /** far − near ATM call premium ($/M). Positive = upward-sloping term vol. */
  spread: number;
};

export type ModelDerivatives = {
  tier: string;
  label: string;
  color: string;
  spot: number | null;
  /** Annualized ATM vol of the front board, percent (the family "vol index"). */
  volIndexPercent: number | null;
  boards: ExpiryBoard[];
  calendarSpreads: CalendarSpread[];
};

export type DerivativesResponse = {
  syncedAt: string | null;
  error: string | null;
  riskFreeRate: number;
  /** Notional-agnostic average of family vol indices, percent. */
  computeVixPercent: number | null;
  models: ModelDerivatives[];
};

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

/** Round a strike to a readable tick based on its magnitude. */
function roundStrike(value: number): number {
  if (value >= 1) return round(value, 2);
  if (value >= 0.1) return round(value, 3);
  return round(value, 4);
}

function toLeg(g: Greeks): OptionLeg {
  return {
    price: round(g.price, 4),
    delta: round(g.delta, 3),
    gamma: round(g.gamma, 3),
    vega: round(g.vega, 4),
    theta: round(g.theta, 4),
  };
}

function buildBoard(
  tier: string,
  forward: number,
  expiryDate: number,
  expiryLabel: string,
  now: number,
  volScale: number,
): ExpiryBoard {
  const daysToExpiry = Math.max(1, Math.round((expiryDate - now) / DAY_MS));
  const yearsToExpiry = daysToExpiry / 365;

  const strikes = STRIKE_MONEYNESS.map((m) => roundStrike(forward * m));
  // De-dupe strikes that collapse after rounding on small-priced families.
  const uniqueStrikes = Array.from(new Set(strikes)).sort((a, b) => a - b);

  const rows: OptionRow[] = uniqueStrikes.map((strike) => {
    const vol = impliedVol(tier, forward, strike, volScale);
    const call = black76Greeks("call", forward, strike, yearsToExpiry, vol, RISK_FREE_RATE);
    const put = black76Greeks("put", forward, strike, yearsToExpiry, vol, RISK_FREE_RATE);
    return {
      strike,
      moneyness: round(strike / forward, 3),
      ivPercent: round(vol * 100, 1),
      call: toLeg(call),
      put: toLeg(put),
    };
  });

  const atmStrike = uniqueStrikes.reduce((best, s) =>
    Math.abs(s - forward) < Math.abs(best - forward) ? s : best,
  uniqueStrikes[0]);
  const atmVol = impliedVol(tier, forward, atmStrike, volScale);

  return {
    expiryDate,
    expiryLabel,
    daysToExpiry,
    yearsToExpiry: round(yearsToExpiry, 4),
    forward: round(forward, 4),
    atmStrike,
    atmIvPercent: round(atmVol * 100, 1),
    rows,
  };
}

/** ATM call premium on a board (nearest strike to the forward). */
function atmCallPremium(board: ExpiryBoard): number {
  const row = board.rows.find((r) => r.strike === board.atmStrike);
  return row?.call.price ?? 0;
}

type ForwardContext = {
  forwardPoints: { date: number; rate: number; tenorLabel: string }[];
  /** Multiplier that pins the front forward point onto the live futures mark. */
  scale: number;
  /** Vol multiplier from the underlying's recent realized choppiness. */
  volScale: number;
  liveMark: number | null;
};

/**
 * Resolve the live anchoring for a model curve: the forward points (expiries),
 * the mark-based scale that pins them to the live futures price, and the vol
 * scale from recent realized choppiness. Shared by the surface builder and the
 * option pricer so a bought position is always marked against the same numbers
 * the chain shows.
 */
function forwardContext(curve: ModelCurve, now: number): ForwardContext | null {
  const forwardPoints = curve.points
    .filter((p) => p.date > now && p.tenorLabel !== "Now")
    .map((p) => ({ date: p.date, rate: p.rate, tenorLabel: p.tenorLabel }))
    .sort((a, b) => a.date - b.date);
  if (forwardPoints.length === 0) return null;

  // Anchor the whole surface to the live futures mark (same tick the trading
  // terminal shows). We scale every forward point by mark / front-forward so the
  // front board sits exactly on the live price while the configured term
  // structure (contango / backwardation shape) is preserved.
  const liveMark = getMarkPrice(curve.tier);
  const frontRate = forwardPoints[0].rate;
  const scale =
    liveMark && liveMark > 0 && frontRate > 0 ? liveMark / frontRate : 1;

  // Breathe the ATM vol with how choppy the underlying has been recently.
  const volScale = realizedVolFactor(curve.tier);

  return { forwardPoints, scale, volScale, liveMark };
}

function buildModelDerivatives(
  curve: ModelCurve,
  now: number,
): ModelDerivatives | null {
  const ctx = forwardContext(curve, now);
  if (!ctx) return null;
  const { forwardPoints, scale, volScale, liveMark } = ctx;

  const boards = forwardPoints.map((p) =>
    buildBoard(curve.tier, p.rate * scale, p.date, p.tenorLabel, now, volScale),
  );
  boards.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  // Calendar spreads: ATM call premium, each expiry minus the one before it.
  const calendarSpreads: CalendarSpread[] = [];
  for (let i = 1; i < boards.length; i += 1) {
    const near = boards[i - 1];
    const far = boards[i];
    const nearPremium = atmCallPremium(near);
    const farPremium = atmCallPremium(far);
    calendarSpreads.push({
      strike: near.atmStrike,
      nearLabel: near.expiryLabel,
      farLabel: far.expiryLabel,
      nearPremium: round(nearPremium, 4),
      farPremium: round(farPremium, 4),
      spread: round(farPremium - nearPremium, 4),
    });
  }

  const volIndexPercent = boards[0]?.atmIvPercent ?? null;

  return {
    tier: curve.tier,
    label: curve.label,
    color: curve.color,
    // Prefer the live mark so the spot tile ticks in lockstep with the chain.
    spot: liveMark ?? curve.spot,
    volIndexPercent,
    boards,
    calendarSpreads,
  };
}

export async function buildDerivatives(
  now: number = Date.now(),
): Promise<DerivativesResponse> {
  const curve = await buildYieldCurve(now);

  const models: ModelDerivatives[] = [];
  for (const modelCurve of curve.curves) {
    const derivatives = buildModelDerivatives(modelCurve, now);
    if (derivatives) models.push(derivatives);
  }

  const volIndices = models
    .map((m) => m.volIndexPercent)
    .filter((v): v is number => v !== null);
  const computeVixPercent =
    volIndices.length > 0
      ? round(volIndices.reduce((sum, v) => sum + v, 0) / volIndices.length, 1)
      : null;

  return {
    syncedAt: curve.syncedAt,
    error: curve.error,
    riskFreeRate: RISK_FREE_RATE,
    computeVixPercent,
    models,
  };
}

export type OptionSide = "CALL" | "PUT";

export type OptionQuote = {
  tier: string;
  side: OptionSide;
  strike: number;
  /** Resolved expiry (nearest listed forward point to the requested date). */
  expiryDate: number;
  expiryLabel: string;
  daysToExpiry: number;
  yearsToExpiry: number;
  /** Live forward (option underlying) at this expiry, $/M. */
  forward: number;
  ivPercent: number;
  /** Premium per million tokens, $/M. */
  premiumPerM: number;
  delta: number;
  /**
   * Price at/above which the option finishes in profit at expiry (per token
   * rate): calls = strike + premium, puts = strike − premium.
   */
  breakeven: number;
};

/**
 * A live option pricer bound to the current surface. Build it once (one yield
 * curve fetch), then price any exact (tier, side, strike, expiry) — used for
 * quoting a buy, marking open positions, and settling a close so every path
 * agrees with the visible chain.
 */
export async function buildOptionPricer(now: number = Date.now()) {
  const curve = await buildYieldCurve(now);
  const byTier = new Map(curve.curves.map((c) => [c.tier, c] as const));

  const price = (
    tier: string,
    side: OptionSide,
    strike: number,
    expiryDate: number,
  ): OptionQuote | null => {
    const modelCurve = byTier.get(tier);
    if (!modelCurve || !(strike > 0)) return null;

    const ctx = forwardContext(modelCurve, now);
    if (!ctx) return null;

    // Snap the requested expiry to the nearest listed forward point.
    const point = ctx.forwardPoints.reduce((best, p) =>
      Math.abs(p.date - expiryDate) < Math.abs(best.date - expiryDate) ? p : best,
    ctx.forwardPoints[0]);

    const forward = point.rate * ctx.scale;
    const daysToExpiry = Math.max(1, Math.round((point.date - now) / DAY_MS));
    const yearsToExpiry = daysToExpiry / 365;
    const vol = impliedVol(tier, forward, strike, ctx.volScale);
    const greeks = black76Greeks(
      side === "CALL" ? "call" : "put",
      forward,
      strike,
      yearsToExpiry,
      vol,
      RISK_FREE_RATE,
    );

    const breakeven = side === "CALL" ? strike + greeks.price : strike - greeks.price;

    return {
      tier,
      side,
      strike: round(strike, 4),
      expiryDate: point.date,
      expiryLabel: point.tenorLabel,
      daysToExpiry,
      yearsToExpiry: round(yearsToExpiry, 4),
      forward: round(forward, 4),
      ivPercent: round(vol * 100, 1),
      premiumPerM: round(greeks.price, 4),
      delta: round(greeks.delta, 3),
      breakeven: round(breakeven, 4),
    };
  };

  return { syncedAt: curve.syncedAt, tiers: [...byTier.keys()], price };
}
