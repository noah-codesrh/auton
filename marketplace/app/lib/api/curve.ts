import { request } from "./client";

/**
 * Layer 3 — yield curve API types. These mirror the backend curve engine
 * (`backend/src/services/yield-curve.ts`) exactly so the chart and cards can
 * consume the response with no transformation.
 */

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

export async function fetchYieldCurve() {
  return request<YieldCurveResponse>("/api/v1/marketplace/curve");
}
