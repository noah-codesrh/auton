import { request } from "./client";

/**
 * Layer 4 — derivatives API types. These mirror the backend engine
 * (`backend/src/services/derivatives.ts`) exactly so the options chain, vol
 * smile, and calendar-spread views consume the response with no transformation.
 */

export type OptionLeg = {
  price: number;
  delta: number;
  gamma: number;
  /** Per +1 vol point (+1%). */
  vega: number;
  /** 1-day time decay (usually negative for long options). */
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
  atmStrike: number;
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
  /** Annualized ATM vol of the front board, percent (family "vol index"). */
  volIndexPercent: number | null;
  boards: ExpiryBoard[];
  calendarSpreads: CalendarSpread[];
};

export type DerivativesResponse = {
  syncedAt: string | null;
  error: string | null;
  riskFreeRate: number;
  /** Average of family vol indices, percent (the "compute VIX"). */
  computeVixPercent: number | null;
  models: ModelDerivatives[];
};

export async function fetchDerivatives() {
  return request<DerivativesResponse>("/api/v1/marketplace/derivatives");
}
