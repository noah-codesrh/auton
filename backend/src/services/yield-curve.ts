import {
  curveColor,
  curveLabel,
  forwardsForTier,
} from "../config/yield-curve.js";
import { buildMarketplaceCatalog } from "./marketplace-catalog.js";

export type CurveShape = "contango" | "backwardation" | "flat" | "unknown";

export type CurvePoint = {
  /** Unix ms on the calendar x-axis. */
  date: number;
  /** Short label: "Now" for spot, otherwise the expiry like "Sep '26". */
  tenorLabel: string;
  /** Months from today (0 at spot). */
  monthsOut: number;
  /** Rate in USD per million tokens. */
  rate: number;
  /** True for market-observed points (spot today + each listed contract). */
  real: boolean;
};

export type ModelCurve = {
  tier: string;
  label: string;
  color: string;
  spot: number | null;
  /** Nearest (front) contract locked rate. */
  locked: number;
  expiryDate: number;
  expiryLabel: string;
  daysToExpiry: number;
  /** Front basis: locked − spot (USD/M). Negative = future cheaper. */
  basis: number | null;
  basisPercent: number | null;
  /** Front basis annualized to a 365-day horizon, percent. */
  annualizedPercent: number | null;
  shape: CurveShape;
  points: CurvePoint[];
};

export type YieldCurveResponse = {
  syncedAt: string | null;
  error: string | null;
  curves: ModelCurve[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const FLAT_THRESHOLD_PCT = 0.5;

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function shortExpiry(expiryMs: number): string {
  const date = new Date(expiryMs);
  if (Number.isNaN(date.getTime())) return "Expiry";
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${month} '${String(date.getFullYear()).slice(2)}`;
}

function classifyShape(percent: number | null): CurveShape {
  if (percent === null) return "unknown";
  if (Math.abs(percent) < FLAT_THRESHOLD_PCT) return "flat";
  return percent > 0 ? "contango" : "backwardation";
}

/**
 * Build the full per-model yield curve from live spot + the front futures
 * contract + the listed forward schedule.
 */
export async function buildYieldCurve(
  now: number = Date.now(),
): Promise<YieldCurveResponse> {
  const catalog = await buildMarketplaceCatalog();

  const futures = catalog.contracts.filter(
    (contract) => contract.type === "future",
  );

  const curves: ModelCurve[] = [];

  for (const contract of futures) {
    const label = curveLabel(contract.tier, contract.name);
    const color = curveColor(contract.tier);
    const locked = contract.lockedRatePerM;
    const spot =
      typeof contract.spotRatePerM === "number" && contract.spotRatePerM > 0
        ? contract.spotRatePerM
        : null;

    const frontExpiry = new Date(contract.expiryDate).getTime();
    if (Number.isNaN(frontExpiry)) continue;

    const daysToExpiry = Math.max(1, Math.round((frontExpiry - now) / DAY_MS));

    // Gather the real contract anchors (front + forwards), sorted by expiry.
    const contractPoints = [
      { expiryMs: frontExpiry, rate: locked },
      ...forwardsForTier(contract.tier)
        .map((f) => ({ expiryMs: new Date(f.expiryDate).getTime(), rate: f.lockedRatePerM }))
        .filter((f) => !Number.isNaN(f.expiryMs) && f.expiryMs > frontExpiry),
    ].sort((a, b) => a.expiryMs - b.expiryMs);

    const points: CurvePoint[] = [];

    // Spot anchor (today).
    if (spot !== null) {
      points.push({
        date: now,
        tenorLabel: "Now",
        monthsOut: 0,
        rate: round(spot, 4),
        real: true,
      });
    }

    // Each listed forward contract.
    for (const cp of contractPoints) {
      points.push({
        date: cp.expiryMs,
        tenorLabel: shortExpiry(cp.expiryMs),
        monthsOut: round((cp.expiryMs - now) / DAY_MS / 30, 2),
        rate: round(cp.rate, 4),
        real: true,
      });
    }

    if (points.length === 0) continue;

    const basis = spot !== null ? round(locked - spot, 4) : null;
    const basisPercent =
      spot !== null && spot > 0 ? round(((locked - spot) / spot) * 100, 2) : null;
    const annualizedPercent =
      basisPercent !== null
        ? round(basisPercent * (365 / daysToExpiry), 2)
        : null;

    // Classify the overall slope (farthest listed rate vs spot).
    const farRate = contractPoints[contractPoints.length - 1]?.rate ?? locked;
    const slopePercent =
      spot !== null && spot > 0 ? ((farRate - spot) / spot) * 100 : null;

    curves.push({
      tier: contract.tier,
      label,
      color,
      spot,
      locked,
      expiryDate: frontExpiry,
      expiryLabel: shortExpiry(frontExpiry),
      daysToExpiry,
      basis,
      basisPercent,
      annualizedPercent,
      shape: classifyShape(slopePercent),
      points,
    });
  }

  curves.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  return {
    syncedAt: catalog.openRouterSyncedAt,
    error: catalog.openRouterError,
    curves,
  };
}
