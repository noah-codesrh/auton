import { randomUUID } from "node:crypto";
import { MARKETPLACE_CATALOG } from "../config/marketplace-catalog.js";
import {
  PRICE_TICK_MS,
  SPOT_REVERSION,
  TICK_VOLATILITY,
  TRADING_MARKETS,
} from "../config/trading.js";
import { getSupabase } from "../db/supabase.js";
import { buildMarketplaceCatalog } from "./marketplace-catalog.js";

export type Candle = {
  time: number; // unix seconds (start of minute)
  open: number;
  high: number;
  low: number;
  close: number;
};

export type Trade = {
  id: string;
  time: number; // unix ms
  price: number;
  sizeMillions: number;
  side: "buy" | "sell";
  source: "market" | "sim";
};

type MarketState = {
  tier: string;
  spot: number; // real anchor (OpenRouter blended), refreshed periodically
  mark: number; // current simulated mark price
  dayOpen: number;
  candles: Candle[];
  trades: Trade[];
};

const CANDLE_SECONDS = 60;
const SEED_CANDLES = 240;
const MAX_CANDLES = 1_440;
const MAX_TRADES = 60;

/** Cooperative leadership lease: only the holder advances + persists the sim. */
const ENGINE_LOCK_NAME = "price-engine";
const LEASE_MS = 15_000;
const SPOT_REFRESH_MS = 5 * 60 * 1000;

const state = new Map<string, MarketState>();
let tickTimer: NodeJS.Timeout | null = null;
let spotTimer: NodeJS.Timeout | null = null;
let started = false;
let instanceId = "";
let ticking = false; // reentrancy guard so slow DB calls don't pile up ticks

function lockedRateFor(tier: string): number {
  const entry = MARKETPLACE_CATALOG.find((m) => m.tier === tier);
  return entry?.lockedRatePerM ?? 0.2;
}

function randn(): number {
  // Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function floorToMinute(ms: number): number {
  return Math.floor(ms / 1000 / CANDLE_SECONDS) * CANDLE_SECONDS;
}

// Per-minute candle volatility for seeding ≈ one minute of accumulated ticks.
const SEED_CANDLE_VOL = TICK_VOLATILITY * Math.sqrt(60_000 / PRICE_TICK_MS);
const SEED_WICK_VOL = SEED_CANDLE_VOL * 0.4;

function seedCandles(anchor: number): Candle[] {
  const nowMinute = floorToMinute(Date.now());

  // Walk backwards from the anchor so the most recent candle ≈ anchor. Each
  // candle's open connects to the previous (older) candle's close, producing a
  // single continuous random walk instead of disconnected noise.
  let close = anchor;
  const reversed: Candle[] = [];
  for (let i = 0; i < SEED_CANDLES; i += 1) {
    let open = close * (1 + randn() * SEED_CANDLE_VOL);
    if (open <= 0) open = close * 0.5;
    const high = Math.max(open, close) * (1 + Math.abs(randn()) * SEED_WICK_VOL);
    const low = Math.min(open, close) * (1 - Math.abs(randn()) * SEED_WICK_VOL);
    reversed.push({
      time: nowMinute - i * CANDLE_SECONDS,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
    });
    // The older candle closes where this one opened → continuous series.
    close = open;
  }

  reversed.reverse();
  return reversed;
}

/**
 * Detect a persisted series produced by an older, too-volatile parameter set.
 * Those rows render as a solid band of noise; when we spot one we discard it and
 * re-seed a clean series instead of waiting ~24h for them to roll off
 * MAX_CANDLES. With the current parameters a 1-minute candle's range averages
 * ~0.7% and rarely exceeds ~1.5%, so a run of >1.4%-range candles is a reliable
 * fingerprint of stale, over-volatile data.
 */
function looksLegacyNoise(candles: Candle[]): boolean {
  const recent = candles.slice(-90);
  if (recent.length < 30) return false;
  let oversized = 0;
  for (const c of recent) {
    const ref = c.close || c.open || 1;
    if ((c.high - c.low) / ref > 0.014) oversized += 1;
  }
  return oversized > recent.length * 0.3;
}

function buildSeededMarket(tier: string, anchor: number): MarketState {
  const candles = seedCandles(anchor);
  const mark = candles[candles.length - 1]?.close ?? anchor;
  return {
    tier,
    spot: anchor,
    mark,
    dayOpen: candles[0]?.open ?? anchor,
    candles,
    trades: seedTrades(mark),
  };
}

/** Replace a market's series in place with a fresh clean seed (keeps the tier). */
function reseedMarket(market: MarketState): void {
  const anchor =
    market.spot > 0
      ? market.spot
      : market.mark > 0
        ? market.mark
        : lockedRateFor(market.tier) * 1.3;
  const fresh = buildSeededMarket(market.tier, anchor);
  market.spot = anchor;
  market.mark = fresh.mark;
  market.dayOpen = fresh.dayOpen;
  market.candles = fresh.candles;
  market.trades = fresh.trades;
}

function seedTrades(mark: number): Trade[] {
  const trades: Trade[] = [];
  const now = Date.now();
  for (let i = 0; i < 18; i += 1) {
    trades.push(makeSimTrade(mark, now - i * 9_000));
  }
  return trades.reverse();
}

function makeSimTrade(mark: number, time: number): Trade {
  const side: "buy" | "sell" = Math.random() > 0.5 ? "buy" : "sell";
  const drift = side === "buy" ? 1 : -1;
  return {
    id: `sim_${time}_${Math.random().toString(36).slice(2, 8)}`,
    time,
    price: round(mark * (1 + drift * Math.random() * 0.0008)),
    sizeMillions: round(0.2 + Math.random() * 6, 2),
    side,
    source: "sim",
  };
}

function round(value: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

async function loadSpotRates(): Promise<Record<string, number>> {
  try {
    const catalog = await buildMarketplaceCatalog();
    const rates: Record<string, number> = {};
    for (const contract of catalog.contracts) {
      rates[contract.tier] =
        contract.spotRatePerM ?? lockedRateFor(contract.tier) * 1.3;
    }
    return rates;
  } catch {
    return {};
  }
}

function safeSupabase() {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

/** Load all persisted market state into a fresh map (empty on any failure). */
async function loadPersistedState(): Promise<Map<string, MarketState>> {
  const map = new Map<string, MarketState>();
  const supabase = safeSupabase();
  if (!supabase) return map;

  try {
    const { data, error } = await supabase.from("market_state").select("*");
    if (error || !data) return map;
    for (const row of data) {
      map.set(row.tier, {
        tier: row.tier,
        spot: Number(row.spot),
        mark: Number(row.mark),
        dayOpen: Number(row.day_open),
        candles: Array.isArray(row.candles) ? (row.candles as Candle[]) : [],
        trades: Array.isArray(row.trades) ? (row.trades as Trade[]) : [],
      });
    }
  } catch {
    return new Map();
  }
  return map;
}

/** Followers mirror the leader's persisted state into local memory. */
async function syncFromPersistedState(): Promise<void> {
  const persisted = await loadPersistedState();
  for (const [tier, market] of persisted) {
    if (market.candles.length > 0) state.set(tier, market);
  }
}

/** Best-effort snapshot of every market to the shared store. */
async function persistState(): Promise<void> {
  const supabase = safeSupabase();
  if (!supabase) return;

  const rows = [...state.values()].map((market) => ({
    tier: market.tier,
    spot: market.spot,
    mark: market.mark,
    day_open: market.dayOpen,
    candles: market.candles,
    trades: market.trades,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return;

  try {
    await supabase.from("market_state").upsert(rows, { onConflict: "tier" });
  } catch {
    // Degrade to in-memory only; the simulation keeps running locally.
  }
}

/**
 * Cooperative leadership lease so exactly one replica advances the simulation.
 * Falls back to acting as leader if the lock store is unavailable, which keeps
 * single-process / local dev behaving exactly as before.
 */
async function ensureLeadership(): Promise<boolean> {
  const supabase = safeSupabase();
  if (!supabase) return true;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const expiresIso = new Date(now + LEASE_MS).toISOString();

  try {
    // Renew a lease we already hold.
    const { data: renewed } = await supabase
      .from("engine_locks")
      .update({ holder: instanceId, expires_at: expiresIso })
      .eq("name", ENGINE_LOCK_NAME)
      .eq("holder", instanceId)
      .select("name");
    if (renewed && renewed.length > 0) return true;

    // Take over an expired lease.
    const { data: taken } = await supabase
      .from("engine_locks")
      .update({ holder: instanceId, expires_at: expiresIso })
      .eq("name", ENGINE_LOCK_NAME)
      .lt("expires_at", nowIso)
      .select("name");
    if (taken && taken.length > 0) return true;

    // Claim the lease for the first time (no row yet). A losing racer hits the
    // primary-key conflict and simply stays a follower.
    const { data: claimed, error: claimError } = await supabase
      .from("engine_locks")
      .insert({
        name: ENGINE_LOCK_NAME,
        holder: instanceId,
        expires_at: expiresIso,
      })
      .select("name");
    if (!claimError && claimed && claimed.length > 0) return true;

    return false;
  } catch {
    // Lock store unavailable (e.g. migration not yet applied): behave like a
    // standalone single process so the chart still renders.
    return true;
  }
}

export async function initPriceEngine(): Promise<void> {
  const rates = await loadSpotRates();
  const persisted = await loadPersistedState();

  let seededAny = false;
  for (const market of TRADING_MARKETS) {
    const existing = persisted.get(market.tier);
    if (
      existing &&
      existing.candles.length > 0 &&
      !looksLegacyNoise(existing.candles)
    ) {
      // Resume the persisted random walk; refresh the real spot anchor when we
      // have a fresh rate so mean-reversion keeps tracking OpenRouter.
      const anchor = rates[market.tier];
      if (typeof anchor === "number" && anchor > 0) existing.spot = anchor;
      state.set(market.tier, existing);
      continue;
    }

    const anchor = rates[market.tier] ?? lockedRateFor(market.tier) * 1.3;
    state.set(market.tier, buildSeededMarket(market.tier, anchor));
    seededAny = true;
  }

  // Persist freshly seeded markets so restarts and other replicas resume the
  // same series instead of re-seeding their own.
  if (seededAny) await persistState();
}

function tickMarket(market: MarketState) {
  // Random walk with mild mean-reversion toward the real spot.
  const shock = randn() * TICK_VOLATILITY;
  const reversion = (market.spot - market.mark) / market.spot * SPOT_REVERSION;
  let next = market.mark * (1 + shock + reversion);
  if (next <= 0) next = market.spot * 0.5;
  market.mark = round(next);

  // Update or append the current-minute candle.
  const minute = floorToMinute(Date.now());
  const last = market.candles[market.candles.length - 1];

  if (last && last.time === minute) {
    last.close = market.mark;
    last.high = Math.max(last.high, market.mark);
    last.low = Math.min(last.low, market.mark);
  } else {
    market.candles.push({
      time: minute,
      open: market.mark,
      high: market.mark,
      low: market.mark,
      close: market.mark,
    });
    if (market.candles.length > MAX_CANDLES) market.candles.shift();
  }

  // Emit a simulated trade most ticks.
  if (Math.random() > 0.25) {
    market.trades.push(makeSimTrade(market.mark, Date.now()));
    if (market.trades.length > MAX_TRADES) market.trades.shift();
  }
}

async function runTick(): Promise<void> {
  const leader = await ensureLeadership();
  if (leader) {
    for (const market of state.values()) {
      // Self-heal: a leader may inherit a legacy high-volatility series (e.g.
      // re-synced from a stale leader during a rolling deploy). Re-seed it once
      // here so the persisted source of truth converges to a clean series even
      // when the startup re-seed in initPriceEngine got overwritten.
      if (looksLegacyNoise(market.candles)) reseedMarket(market);
      tickMarket(market);
    }
    await persistState();
  } else {
    // Followers mirror the single source of truth so every client sees one
    // continuous random walk instead of N independent ones.
    await syncFromPersistedState();
  }
}

export function startPriceEngine(): void {
  if (started) return;
  started = true;
  instanceId = randomUUID();

  tickTimer = setInterval(() => {
    if (ticking) return;
    ticking = true;
    void runTick().finally(() => {
      ticking = false;
    });
  }, PRICE_TICK_MS);

  // Refresh the real spot anchor every 5 minutes (leader uses it for reversion;
  // followers pick it up on their next state sync).
  spotTimer = setInterval(() => {
    void loadSpotRates().then((rates) => {
      for (const [tier, rate] of Object.entries(rates)) {
        const market = state.get(tier);
        if (market && rate > 0) market.spot = rate;
      }
    });
  }, SPOT_REFRESH_MS);
}

export function stopPriceEngine(): void {
  if (tickTimer) clearInterval(tickTimer);
  if (spotTimer) clearInterval(spotTimer);
  tickTimer = null;
  spotTimer = null;
  started = false;
}

export function getMarkPrice(tier: string): number | null {
  return state.get(tier)?.mark ?? null;
}

export function getMarketSummary(tier: string) {
  const market = state.get(tier);
  if (!market) return null;
  const change = market.dayOpen
    ? ((market.mark - market.dayOpen) / market.dayOpen) * 100
    : 0;
  return {
    tier,
    markPrice: market.mark,
    spotPrice: market.spot,
    dayOpen: market.dayOpen,
    changePercent: round(change, 2),
  };
}

export function getAllMarketSummaries() {
  return TRADING_MARKETS.map((m) => getMarketSummary(m.tier)).filter(
    (s): s is NonNullable<ReturnType<typeof getMarketSummary>> => s !== null,
  );
}

export function getCandles(tier: string): Candle[] {
  return state.get(tier)?.candles ?? [];
}

export function getSimulatedTrades(tier: string): Trade[] {
  return [...(state.get(tier)?.trades ?? [])].reverse();
}

/** Synthesized order book around the current mark price. */
export function getOrderbook(tier: string, levels = 11) {
  const market = state.get(tier);
  if (!market) return { bids: [], asks: [], mark: 0, spread: 0 };

  const mark = market.mark;
  const tick = Math.max(mark * 0.001, 0.0001);

  const bids: { price: number; size: number; total: number }[] = [];
  const asks: { price: number; size: number; total: number }[] = [];

  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 1; i <= levels; i += 1) {
    const bidSize = round(2 + Math.random() * 40, 2);
    bidTotal += bidSize;
    bids.push({
      price: round(mark - tick * i),
      size: bidSize,
      total: round(bidTotal, 2),
    });

    const askSize = round(2 + Math.random() * 40, 2);
    askTotal += askSize;
    asks.push({
      price: round(mark + tick * i),
      size: askSize,
      total: round(askTotal, 2),
    });
  }

  return {
    bids,
    asks,
    mark,
    spread: round(asks[0].price - bids[0].price),
  };
}
