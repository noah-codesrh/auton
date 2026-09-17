import { request } from "./client";

/**
 * Layer 5 — indexes API types. These mirror the backend engine
 * (`backend/src/services/indexes.ts`) exactly so the dashboard and charts
 * consume the response with no transformation.
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
  level: number;
  /** Change vs the first point of the returned history. */
  changeAbs: number;
  changePercent: number;
  high: number;
  low: number;
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

export async function fetchIndexes() {
  return request<IndexesResponse>("/api/v1/marketplace/indexes");
}
