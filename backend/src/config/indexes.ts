/**
 * Layer 5 — index configuration.
 *
 * Three benchmarks are derived from the live market underneath AUTON:
 *
 *   - INF100    — a volume-weighted index of the inference market (the "S&P 500
 *                 of AI compute"). Constituents are the listed model families,
 *                 weighted by their share of AUTON contract volume.
 *   - GPU500    — a supply-side health index for decentralized GPU networks.
 *                 Modeled from AUTON's clearing prices (cheaper clearing compute
 *                 ⇒ more supply online) until direct network feeds are wired in.
 *   - AGENT CPI — the cost of running a standard autonomous agent over time:
 *                 a fixed basket of compute + storage + bandwidth + data access.
 *                 The compute leg is live (inference prices); the rest are
 *                 modeled baselines. Rising = agents getting more expensive.
 *
 * Weights and baskets live here so the calculation engine stays pure. When the
 * futures market later exposes real per-contract volume, the weights below get
 * replaced by measured volume with no change to the engine or the API shape.
 */

/** Index base levels at inception (calibration constants). */
export const INDEX_BASE = {
  INF100: 1000,
  GPU500: 500,
  AGENT_CPI: 100,
} as const;

/**
 * Relative AUTON contract-volume weight per model family (matched on tier).
 * These stand in for measured volume weighting; they only need to be relative.
 */
const FAMILY_VOLUME_WEIGHTS: { match: string; weight: number }[] = [
  { match: "SEEK", weight: 34 }, // DeepSeek — highest inference volume
  { match: "LLAMA", weight: 22 },
  { match: "QWEN", weight: 14 },
  { match: "GPT", weight: 12 },
  { match: "GEMINI", weight: 9 },
  { match: "CLAUDE", weight: 6 },
  { match: "MISTRAL", weight: 3 },
];

export function familyVolumeWeight(tier: string): number {
  return FAMILY_VOLUME_WEIGHTS.find((f) => tier.includes(f.match))?.weight ?? 4;
}

/**
 * Decentralized GPU networks tracked by GPU500, with a relative supply weight
 * (share of decentralized GPU capacity) and a brand color for the breakdown.
 */
export const GPU_NETWORKS: { key: string; label: string; weight: number; color: string }[] = [
  { key: "akash", label: "Akash", weight: 26, color: "#ff414c" },
  { key: "ionet", label: "io.net", weight: 24, color: "#111827" },
  { key: "render", label: "Render", weight: 18, color: "#f5a623" },
  { key: "filecoin", label: "Filecoin", weight: 14, color: "#0090ff" },
  { key: "aethir", label: "Aethir", weight: 10, color: "#7c3aed" },
  { key: "nosana", label: "Nosana", weight: 8, color: "#16a34a" },
];

/**
 * Supply elasticity for GPU500: how strongly modeled supply reacts to clearing
 * price. supply ∝ (baseline / live)^elasticity, so a 10% price drop implies a
 * ~11% supply-health uptick at elasticity 1.1.
 */
export const GPU_SUPPLY_ELASTICITY = 1.1;

/**
 * The standard autonomous-agent cost basket for AGENT CPI. The compute leg is
 * priced live off inference; the others are modeled unit prices (USD).
 */
export const AGENT_BASKET = {
  /** Millions of inference tokens consumed per period (priced live, $/M). */
  computeTokensM: 8,
  /** GB-months of storage @ unit price. */
  storage: { qty: 40, price: 0.015, label: "Storage" },
  /** GB of egress bandwidth @ unit price. */
  bandwidth: { qty: 120, price: 0.02, label: "Bandwidth" },
  /** Thousands of data / tool API calls @ unit price. */
  data: { qty: 25, price: 0.03, label: "Data access" },
} as const;
