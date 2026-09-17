import { isAddress } from "viem";
import { env } from "../config/env.js";

/**
 * $AUTO/USD oracle.
 * Solana mints still try Jupiter. Robinhood (0x) tokens use AUTO_USD_PRICE
 * until a DEX feed exists on Robinhood Chain.
 */

const JUPITER_PRICE_URL = "https://api.jup.ag/price/v3";
const CACHE_TTL_MS = 30_000;

export type AutoPriceInfo = {
  price: number;
  change24h: number | null;
  updatedAt: string;
  source: "jupiter" | "cache" | "fallback" | "config";
};

let cached: { info: AutoPriceInfo; fetchedAt: number } | null = null;
let inflight: Promise<AutoPriceInfo> | null = null;

function configPrice(): AutoPriceInfo {
  return {
    price: env.AUTO_USD_PRICE,
    change24h: null,
    updatedAt: new Date().toISOString(),
    source: "config",
  };
}

function parseJupiter(payload: unknown, mint: string): { price: number; change24h: number | null } | null {
  if (!payload || typeof payload !== "object") return null;

  const direct = (payload as Record<string, unknown>)[mint];
  if (direct && typeof direct === "object") {
    const usd = (direct as { usdPrice?: unknown; price?: unknown }).usdPrice ??
      (direct as { price?: unknown }).price;
    const price = typeof usd === "string" ? Number(usd) : (usd as number);
    if (Number.isFinite(price) && price > 0) {
      const ch = (direct as { priceChange24h?: unknown }).priceChange24h;
      const change24h = typeof ch === "number" ? ch : null;
      return { price, change24h };
    }
  }

  const data = (payload as { data?: Record<string, unknown> }).data;
  if (data && typeof data === "object") {
    const entry = data[mint] as { price?: unknown } | undefined;
    const price = typeof entry?.price === "string" ? Number(entry.price) : (entry?.price as number);
    if (Number.isFinite(price) && price > 0) {
      return { price, change24h: null };
    }
  }

  return null;
}

async function fetchFromJupiter(): Promise<AutoPriceInfo> {
  const mint = env.AUTO_TOKEN_MINT;
  if (!mint) return configPrice();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);
    const res = await fetch(`${JUPITER_PRICE_URL}?ids=${mint}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Jupiter ${res.status}`);
    const json = await res.json();
    const parsed = parseJupiter(json, mint);
    if (!parsed) throw new Error("AUTO price not in Jupiter response");

    const info: AutoPriceInfo = {
      price: parsed.price,
      change24h: parsed.change24h,
      updatedAt: new Date().toISOString(),
      source: "jupiter",
    };
    cached = { info, fetchedAt: Date.now() };
    return info;
  } catch {
    if (cached) {
      return { ...cached.info, source: "cache" };
    }
    return { ...configPrice(), source: "fallback" };
  }
}

export async function getAutoPriceInfo(): Promise<AutoPriceInfo> {
  if (!env.AUTO_TOKEN_MINT || isAddress(env.AUTO_TOKEN_MINT, { strict: false })) {
    return configPrice();
  }

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.info;
  }
  if (inflight) return inflight;

  inflight = fetchFromJupiter().finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function getAutoUsdPrice(): Promise<number> {
  const info = await getAutoPriceInfo();
  return info.price;
}
