/**
 * Layer 4 — derivatives (options) configuration.
 *
 * The options layer prices calls/puts on top of the Layer 3 yield curve: the
 * underlying for each expiry board is the *forward* rate at that expiry (so we
 * price options-on-forwards with the Black-76 model). This file supplies the
 * assumptions that turn a forward curve into a full options surface:
 *
 *   - a per-family annualized volatility (the "compute vol"),
 *   - a volatility skew so out-of-the-money puts price richer than calls
 *     (downside protection against API-cost spikes is in demand),
 *   - the strike ladder (moneyness multipliers around the forward),
 *   - a single risk-free rate used for discounting.
 *
 * Like the Layer 3 forward schedule, these are config-driven analytics inputs —
 * no ledger or on-chain settlement is involved. When a real options venue is
 * later wired up, the same surface feeds live pricing unchanged.
 */

/** Annualized risk-free rate used to discount option premia. */
export const RISK_FREE_RATE = 0.05;

/**
 * Strike ladder as moneyness multipliers of the forward (F). 1.0 is at-the-money.
 * Values below 1.0 are downside strikes (puts of interest); above are upside.
 */
export const STRIKE_MONEYNESS = [0.7, 0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2, 1.35];

export type FamilyVol = {
  /** Substring matched against the contract tier. */
  match: string;
  /** Base annualized at-the-money volatility (e.g. 0.6 = 60%). */
  baseVol: number;
  /**
   * Skew slope: extra vol added per unit of downside log-moneyness. Positive
   * values lift vol on lower strikes (a classic put skew).
   */
  skew: number;
};

/**
 * Per-family volatility assumptions. Compute prices are volatile — a major model
 * release or price war can reprice a family overnight — so annualized vols sit
 * well above traditional asset classes. Frontier/hosted models are steadier than
 * fast-moving open-weight families.
 */
export const FAMILY_VOLS: FamilyVol[] = [
  { match: "SEEK", baseVol: 0.68, skew: 0.18 },
  { match: "LLAMA", baseVol: 0.58, skew: 0.15 },
  { match: "QWEN", baseVol: 0.62, skew: 0.16 },
  { match: "MISTRAL", baseVol: 0.52, skew: 0.13 },
  { match: "GPT", baseVol: 0.44, skew: 0.11 },
  { match: "GEMINI", baseVol: 0.5, skew: 0.12 },
  { match: "CLAUDE", baseVol: 0.42, skew: 0.1 },
  { match: "FRONTIER", baseVol: 0.46, skew: 0.11 },
];

const DEFAULT_VOL: FamilyVol = { match: "", baseVol: 0.5, skew: 0.12 };

export function familyVol(tier: string): FamilyVol {
  return FAMILY_VOLS.find((f) => tier.includes(f.match)) ?? DEFAULT_VOL;
}

/**
 * Implied volatility for a given strike vs forward, applying the family skew.
 * Uses log-moneyness ln(F/K): positive for downside strikes (K < F), so a
 * positive skew raises their vol and produces a put-side smile.
 *
 * `volScale` lets the derivatives engine breathe the whole surface with the
 * underlying's realized choppiness (1.0 = the static base assumption). Only the
 * ATM level scales; the skew slope stays fixed so the smile shape is stable.
 */
export function impliedVol(
  tier: string,
  forward: number,
  strike: number,
  volScale = 1,
): number {
  const { baseVol, skew } = familyVol(tier);
  const scaledBase = baseVol * volScale;
  if (forward <= 0 || strike <= 0) return scaledBase;
  const logMoneyness = Math.log(forward / strike);
  const vol = scaledBase + skew * logMoneyness;
  // Keep vol in a sane band so deep strikes never go non-positive or absurd.
  return Math.min(2.5, Math.max(0.05, vol));
}
