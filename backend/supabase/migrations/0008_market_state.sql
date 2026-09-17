-- Shared, persisted state for the simulated price engine.
--
-- Previously candles/mark lived only in each Node process's memory. In prod that
-- meant the series reset on every restart/redeploy and diverged across
-- load-balanced replicas, so the chart rendered as a flat "heartbeat" band of
-- smeared noise instead of one continuous random walk (which is what a single
-- long-lived local dev process produces).
--
-- market_state persists the per-tier simulation so it survives restarts, and
-- engine_locks is a cooperative leadership lease so exactly one replica advances
-- the simulation while the others mirror it.

CREATE TABLE IF NOT EXISTS market_state (
  tier TEXT PRIMARY KEY,
  spot NUMERIC NOT NULL,
  mark NUMERIC NOT NULL,
  day_open NUMERIC NOT NULL,
  candles JSONB NOT NULL DEFAULT '[]'::jsonb,
  trades JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS engine_locks (
  name TEXT PRIMARY KEY,
  holder TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
