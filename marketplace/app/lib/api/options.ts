import type { CreditBalance } from "./credits";
import { request } from "./client";

/**
 * Layer 4 — option buying API. Users pay a premium from their USD credit wallet
 * for a call/put on a model's compute forward. Pricing is server-authoritative;
 * these types mirror `backend/src/services/options.ts`.
 */

export type OptionSide = "CALL" | "PUT";

export type OptionOrderInput = {
  tier: string;
  side: OptionSide;
  strike: number;
  expiryDate: number;
  contractsMillions: number;
};

export type OptionQuoteResult = {
  tier: string;
  side: OptionSide;
  strike: number;
  expiryDate: number;
  expiryLabel: string;
  daysToExpiry: number;
  yearsToExpiry: number;
  forward: number;
  ivPercent: number;
  premiumPerM: number;
  delta: number;
  breakeven: number;
  contractsMillions: number;
  premiumUsd: number;
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
  markForward: number | null;
  markPremiumPerM: number | null;
  markValueUsd: number | null;
  pnlUsd: number | null;
  pnlPercent: number | null;
  breakeven: number | null;
  inTheMoney: boolean | null;
};

export async function quoteOption(input: OptionOrderInput) {
  return request<OptionQuoteResult>("/api/v1/marketplace/options/quote", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function buyOption(input: OptionOrderInput) {
  return request<{ position: OptionPosition; balance: CreditBalance }>(
    "/api/v1/marketplace/options/buy",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function fetchOptionPositions() {
  return request<{ positions: OptionPosition[] }>(
    "/api/v1/marketplace/options/positions",
  );
}

export async function closeOption(positionId: string) {
  return request<{ position: OptionPosition; balance: CreditBalance }>(
    "/api/v1/marketplace/options/close",
    {
      method: "POST",
      body: JSON.stringify({ positionId }),
    },
  );
}
