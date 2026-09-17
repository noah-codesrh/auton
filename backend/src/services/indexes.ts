import {
  AGENT_BASKET,
  familyVolumeWeight,
  GPU_NETWORKS,
  GPU_SUPPLY_ELASTICITY,
  INDEX_BASE,
} from "../config/indexes.js";
import { getCandles, getMarkPrice, type Candle } from "./price-engine.js";
import { buildYieldCurve } from "./yield-curve.js";

/**
 * Layer 5 — index engine.
 *
 * Builds three benchmarks (INF100, GPU500, AGENT CPI) from the same live market
 * the rest of AUTON runs on: the yield curve gives each model family's baseline
 * (its locked forward) and identity, the price engine gives the live mark and
 * the minute-candle history. Because every index is a pure function of those
 * inputs, the historical series is *reconstructed* from the candle history — no
 * separate index table or writer is needed, and the chart lines up tick-for-tick
 * with the trading terminal.
 *
 * This is a read-only analytics layer. The indexes are not yet tradeable assets.
 */

export type IndexId = "INF100" | "GPU500" | "AGENT_CPI";

export type IndexPoint = {
  /** Unix seconds (candle-aligned). */
  time: number;
  value: number;
};

export type IndexConstituent = {
  key: string;
  label: string;
  color: string;
  /** Share of the index, percent. */
  weightPercent: number;
  /** Current representative value in `unit`. */
  value: number | null;
  unit: string;
};

export type IndexSeries = {
  id: IndexId;
  symbol: string;
  name: string;
  tagline: string;
  description: string;
  base: number;
  /** Current index level. */
  level: number;
  /** Change vs the first point of the returned history. */
  changeAbs: number;
  changePercent: number;
  high: number;
  low: number;
  /** Display unit for the level (e.g. "pts"). */
  unit: string;
  constituents: IndexConstituent[];
  history: IndexPoint[];
};

export type IndexesResponse = {
  syncedAt: string | null;
  error: string | null;
  asOf: number;
  indexes: IndexSeries[];
};

/** Longest raw candle window to consider (minutes) and target point count. */
const MAX_RAW_POINTS = 720; // ~12h of minute candles
const TARGET_POINTS = 140;

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

type Family = {
  tier: string;
  label: string;
  color: string;
  weight: number;
  baseline: number;
  live: number;
  candles: Candle[];
};

/** Build a shared, downsampled time grid from the union of all candle series. */
function buildGrid(families: Family[]): number[] {
  const times = new Set<number>();
  for (const f of families) {
    for (const c of f.candles) times.add(c.time);
  }
  let sorted = [...times].sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  sorted = sorted.slice(-MAX_RAW_POINTS);

  const step = Math.max(1, Math.ceil(sorted.length / TARGET_POINTS));
  const grid: number[] = [];
  for (let i = 0; i < sorted.length; i += step) grid.push(sorted[i]);
  const last = sorted[sorted.length - 1];
  if (grid[grid.length - 1] !== last) grid.push(last);
  return grid;
}

/** Forward-fill a candle series onto the grid (back-filling any leading gap). */
function alignSeries(candles: Candle[], grid: number[]): number[] {
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  const out: number[] = [];
  let j = 0;
  let last = sorted[0]?.close ?? 0;
  for (const t of grid) {
    while (j < sorted.length && sorted[j].time <= t) {
      last = sorted[j].close;
      j += 1;
    }
    out.push(last);
  }
  return out;
}

/** Weighted sum of family values at one aligned index. */
function weightedAt(families: Family[], aligned: number[][], i: number): number {
  let sum = 0;
  for (let f = 0; f < families.length; f += 1) sum += families[f].weight * aligned[f][i];
  return sum;
}

function statsFor(history: IndexPoint[], level: number, base: number) {
  const first = history[0]?.value ?? level;
  const values = history.map((p) => p.value);
  const high = values.length ? Math.max(...values) : level;
  const low = values.length ? Math.min(...values) : level;
  const changeAbs = level - first;
  const changePercent = first > 0 ? (changeAbs / first) * 100 : 0;
  return {
    level: round(level, 2),
    base,
    changeAbs: round(changeAbs, 2),
    changePercent: round(changePercent, 2),
    high: round(Math.max(high, level), 2),
    low: round(Math.min(low, level), 2),
  };
}

export async function buildIndexes(
  now: number = Date.now(),
): Promise<IndexesResponse> {
  const curve = await buildYieldCurve(now);
  const nowSec = Math.floor(now / 1000);

  const families: Family[] = curve.curves
    .map((c) => {
      const baseline = c.locked > 0 ? c.locked : c.spot && c.spot > 0 ? c.spot : 0;
      const live = getMarkPrice(c.tier) ?? c.spot ?? baseline;
      return {
        tier: c.tier,
        label: c.label,
        color: c.color,
        weight: familyVolumeWeight(c.tier),
        baseline,
        live: live > 0 ? live : baseline,
        candles: getCandles(c.tier),
      };
    })
    .filter((f) => f.baseline > 0 && f.weight > 0);

  const empty: IndexesResponse = {
    syncedAt: curve.syncedAt,
    error: curve.error,
    asOf: now,
    indexes: [],
  };
  if (families.length === 0) return empty;

  const totalWeight = families.reduce((s, f) => s + f.weight, 0);
  const grid = buildGrid(families);
  const aligned = families.map((f) => alignSeries(f.candles, grid));

  // Baseline weighted price (the calibration reference for every index).
  const weightedBaseline = families.reduce((s, f) => s + f.weight * f.baseline, 0);
  const weightedLiveNow = families.reduce((s, f) => s + f.weight * f.live, 0);

  // ── INF100 — volume-weighted inference market index ──────────────────────
  const inf100History: IndexPoint[] = grid.map((t, i) => ({
    time: t,
    value: round((INDEX_BASE.INF100 * weightedAt(families, aligned, i)) / weightedBaseline, 2),
  }));
  const inf100Level = (INDEX_BASE.INF100 * weightedLiveNow) / weightedBaseline;
  pushLive(inf100History, nowSec, inf100Level);

  const inf100: IndexSeries = {
    id: "INF100",
    symbol: "INF100",
    name: "Inference 100",
    tagline: "The S&P 500 of AI compute",
    description:
      "A volume-weighted index of the inference market on AUTON. Each model family carries weight in proportion to its contract volume, giving a single read on how inference pricing is moving as a whole.",
    unit: "pts",
    ...statsFor(inf100History, inf100Level, INDEX_BASE.INF100),
    constituents: families
      .map((f) => ({
        key: f.tier,
        label: f.label,
        color: f.color,
        weightPercent: round((f.weight / totalWeight) * 100, 1),
        value: round(f.live, 4),
        unit: "$/M",
      }))
      .sort((a, b) => b.weightPercent - a.weightPercent),
    history: inf100History,
  };

  // ── GPU500 — decentralized GPU supply-health index ───────────────────────
  // Modeled inverse to clearing price: cheaper compute ⇒ more supply online.
  const gpuValueAt = (weighted: number) =>
    INDEX_BASE.GPU500 * (weightedBaseline / weighted) ** GPU_SUPPLY_ELASTICITY;
  const gpu500History: IndexPoint[] = grid.map((t, i) => ({
    time: t,
    value: round(gpuValueAt(weightedAt(families, aligned, i)), 2),
  }));
  const gpu500Level = gpuValueAt(weightedLiveNow);
  pushLive(gpu500History, nowSec, gpu500Level);

  const gpuTotal = GPU_NETWORKS.reduce((s, n) => s + n.weight, 0);
  const gpu500: IndexSeries = {
    id: "GPU500",
    symbol: "GPU500",
    name: "GPU 500",
    tagline: "Supply health of the machine economy",
    description:
      "Tracks global GPU supply across decentralized networks — Akash, io.net, Render, Filecoin and more. Modeled from AUTON's clearing prices as a supply proxy (cheaper clearing compute implies more capacity online) until direct network feeds are integrated.",
    unit: "pts",
    ...statsFor(gpu500History, gpu500Level, INDEX_BASE.GPU500),
    constituents: GPU_NETWORKS.map((n) => ({
      key: n.key,
      label: n.label,
      color: n.color,
      weightPercent: round((n.weight / gpuTotal) * 100, 1),
      value: round(gpu500Level * (n.weight / gpuTotal), 1),
      unit: "pts",
    })),
    history: gpu500History,
  };

  // ── AGENT CPI — cost of running a standard autonomous agent ──────────────
  const otherCost =
    AGENT_BASKET.storage.qty * AGENT_BASKET.storage.price +
    AGENT_BASKET.bandwidth.qty * AGENT_BASKET.bandwidth.price +
    AGENT_BASKET.data.qty * AGENT_BASKET.data.price;
  const computePriceBaseline = weightedBaseline / totalWeight; // avg $/M
  const computePriceNow = weightedLiveNow / totalWeight;
  const costBaseline = AGENT_BASKET.computeTokensM * computePriceBaseline + otherCost;

  const cpiValueAt = (weighted: number) => {
    const computePrice = weighted / totalWeight;
    const cost = AGENT_BASKET.computeTokensM * computePrice + otherCost;
    return (INDEX_BASE.AGENT_CPI * cost) / costBaseline;
  };
  const cpiHistory: IndexPoint[] = grid.map((t, i) => ({
    time: t,
    value: round(cpiValueAt(weightedAt(families, aligned, i)), 3),
  }));
  const cpiLevel = cpiValueAt(weightedLiveNow);
  pushLive(cpiHistory, nowSec, cpiLevel);

  const computeCostNow = AGENT_BASKET.computeTokensM * computePriceNow;
  const buckets = [
    { key: "compute", label: "Compute", color: "#4f7299", cost: computeCostNow },
    {
      key: "storage",
      label: AGENT_BASKET.storage.label,
      color: "#d97706",
      cost: AGENT_BASKET.storage.qty * AGENT_BASKET.storage.price,
    },
    {
      key: "bandwidth",
      label: AGENT_BASKET.bandwidth.label,
      color: "#7c3aed",
      cost: AGENT_BASKET.bandwidth.qty * AGENT_BASKET.bandwidth.price,
    },
    {
      key: "data",
      label: AGENT_BASKET.data.label,
      color: "#16a34a",
      cost: AGENT_BASKET.data.qty * AGENT_BASKET.data.price,
    },
  ];
  const totalCostNow = buckets.reduce((s, b) => s + b.cost, 0);

  const agentCpi: IndexSeries = {
    id: "AGENT_CPI",
    symbol: "AGENT CPI",
    name: "Agent CPI",
    tagline: "Inflation index of the autonomous economy",
    description:
      "The total cost of running a standard autonomous agent over time — a fixed basket of compute, storage, bandwidth, and data access. Rising means agents are getting more expensive to run; falling means the machine economy is getting more efficient. Based at 100.",
    unit: "idx",
    ...statsFor(cpiHistory, cpiLevel, INDEX_BASE.AGENT_CPI),
    constituents: buckets.map((b) => ({
      key: b.key,
      label: b.label,
      color: b.color,
      weightPercent: totalCostNow > 0 ? round((b.cost / totalCostNow) * 100, 1) : 0,
      value: round(b.cost, 3),
      unit: "$",
    })),
    history: cpiHistory,
  };

  return {
    syncedAt: curve.syncedAt,
    error: curve.error,
    asOf: now,
    indexes: [inf100, gpu500, agentCpi],
  };
}

/**
 * Append (or replace) a live point at `nowSec` so the series ends on the current
 * mark even between candle closes, keeping the tail monotonic in time.
 */
function pushLive(history: IndexPoint[], nowSec: number, level: number): void {
  const value = round(level, 3);
  const last = history[history.length - 1];
  if (!last) {
    // No candle history yet: emit a short flat lead-in so the chart renders.
    history.push({ time: nowSec - 3600, value }, { time: nowSec, value });
    return;
  }
  if (last.time >= nowSec) {
    last.value = value;
  } else {
    history.push({ time: nowSec, value });
  }
}
