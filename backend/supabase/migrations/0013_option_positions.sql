-- Layer 4 — bought option positions (calls / puts on AI compute).
-- Premium is paid from the unified USD credit wallet (credit_balances), so this
-- is a paper/credit options desk in the same spirit as the trading positions:
-- no on-chain settlement. Each row snapshots the entry surface; open rows are
-- marked-to-market live against the Black-76 engine, and closing sells the
-- option back at the current premium (crediting the wallet).
-- USD amounts are stored in micro-units (1 USD = 1_000_000) to match credits.

CREATE TABLE IF NOT EXISTS option_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_tier TEXT NOT NULL,
  side TEXT NOT NULL,                       -- 'CALL' | 'PUT'
  strike NUMERIC NOT NULL,                  -- $/M tokens
  expiry_date TIMESTAMPTZ NOT NULL,
  expiry_label TEXT NOT NULL,
  contracts_millions NUMERIC NOT NULL,      -- position size in millions of tokens
  -- entry surface snapshot
  entry_forward NUMERIC NOT NULL,
  entry_premium_per_m NUMERIC NOT NULL,
  entry_iv_percent NUMERIC NOT NULL,
  premium_paid_usd_micro BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',       -- 'OPEN' | 'CLOSED'
  -- exit snapshot (null while open)
  close_premium_per_m NUMERIC,
  close_value_usd_micro BIGINT,
  pnl_usd_micro BIGINT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS option_positions_user_idx
  ON option_positions(user_id, status);
