/**
 * Layer 3 — yield curve forward schedule.
 *
 * Each model family has one "front" futures contract in MARKETPLACE_CATALOG
 * (the nearest expiry, which is the tradeable + gateway-routable tier). To give
 * the term structure real depth we list additional, further-dated forward
 * points here. The curve engine combines: live spot (today) + the front
 * contract (from the catalog) + these forward points.
 *
 * Keeping the forwards here — rather than as extra catalog tiers — means the
 * gateway's 1:1 model→tier routing and the trading markets are untouched. When
 * these forwards are later promoted to fully tradeable contracts, the curve
 * keeps working unchanged.
 */

export type ForwardPoint = {
  /** ISO expiry date for this forward point (must be after the front expiry). */
  expiryDate: string;
  /** Locked forward rate in USD per million tokens. */
  lockedRatePerM: number;
};

/** Additional forward expiries keyed by the family's front-contract tier. */
export const CURVE_FORWARD_SCHEDULE: Record<string, ForwardPoint[]> = {
  "cSEEK-SEP26": [
    { expiryDate: "2026-12-31T00:00:00.000Z", lockedRatePerM: 0.135 },
    { expiryDate: "2027-03-31T00:00:00.000Z", lockedRatePerM: 0.13 },
  ],
  "cLLAMA-AUG26": [
    { expiryDate: "2026-11-30T00:00:00.000Z", lockedRatePerM: 0.175 },
    { expiryDate: "2027-02-28T00:00:00.000Z", lockedRatePerM: 0.17 },
  ],
  "cQWEN-OCT26": [
    { expiryDate: "2027-01-31T00:00:00.000Z", lockedRatePerM: 0.155 },
    { expiryDate: "2027-04-30T00:00:00.000Z", lockedRatePerM: 0.15 },
  ],
  "cMISTRAL-NOV26": [
    { expiryDate: "2027-02-28T00:00:00.000Z", lockedRatePerM: 0.215 },
    { expiryDate: "2027-05-31T00:00:00.000Z", lockedRatePerM: 0.21 },
  ],
  "cGPT-DEC26": [
    { expiryDate: "2027-03-31T00:00:00.000Z", lockedRatePerM: 3.4 },
    { expiryDate: "2027-06-30T00:00:00.000Z", lockedRatePerM: 3.3 },
  ],
  "cGEMINI-DEC26": [
    { expiryDate: "2027-03-31T00:00:00.000Z", lockedRatePerM: 2.45 },
    { expiryDate: "2027-06-30T00:00:00.000Z", lockedRatePerM: 2.4 },
  ],
  "cCLAUDE-DEC26": [
    { expiryDate: "2027-03-31T00:00:00.000Z", lockedRatePerM: 1.78 },
    { expiryDate: "2027-06-30T00:00:00.000Z", lockedRatePerM: 1.75 },
  ],
};

const FAMILY_COLORS: { match: string; label: string; color: string }[] = [
  { match: "SEEK", label: "DeepSeek", color: "#4f7299" },
  { match: "LLAMA", label: "Llama", color: "#d97706" },
  { match: "QWEN", label: "Qwen", color: "#7c3aed" },
  { match: "MISTRAL", label: "Mistral", color: "#dc2626" },
  { match: "GPT", label: "GPT", color: "#16a34a" },
  { match: "GEMINI", label: "Gemini", color: "#2563eb" },
  { match: "CLAUDE", label: "Claude", color: "#db2777" },
  { match: "FRONTIER", label: "Frontier", color: "#0891b2" },
];

export function curveLabel(tier: string, fallbackName: string): string {
  const hit = FAMILY_COLORS.find((f) => tier.includes(f.match));
  if (hit) return hit.label;
  return fallbackName.replace(/ Inference Future$/i, "");
}

export function curveColor(tier: string): string {
  return FAMILY_COLORS.find((f) => tier.includes(f.match))?.color ?? "#6b7280";
}

export function forwardsForTier(tier: string): ForwardPoint[] {
  return CURVE_FORWARD_SCHEDULE[tier] ?? [];
}
