-- Auton ledger schema (fresh Supabase project).
-- Paste this entire file into SQL Editor → Run.
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS column adds.

-- =============================================================================
-- 0001_auton_schema.sql
-- =============================================================================

-- Auton schema for Supabase (run in SQL Editor or via `pnpm db:push`)
-- Prisma manages this schema; this file is a reference / manual fallback.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solana_wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS compute_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_tier TEXT NOT NULL,
  token_balance_remaining BIGINT NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, model_tier)
);
CREATE INDEX IF NOT EXISTS compute_balances_user_id_idx ON compute_balances(user_id);

CREATE TABLE IF NOT EXISTS staking_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_staked_auto BIGINT NOT NULL,
  vault_tx_signature TEXT NOT NULL UNIQUE,
  stake_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimable_usdc_yield DECIMAL(20, 6) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS staking_ledger_user_id_idx ON staking_ledger(user_id);

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  tokens_consumed BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_logs_user_id_idx ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS usage_logs_api_key_id_idx ON usage_logs(api_key_id);

CREATE TABLE IF NOT EXISTS claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_usdc DECIMAL(20, 6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS claim_requests_user_id_idx ON claim_requests(user_id);
CREATE INDEX IF NOT EXISTS claim_requests_status_idx ON claim_requests(status);

-- Row Level Security: backend uses service role (bypasses RLS).
-- Enable RLS if you add direct client access from the frontend later.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE compute_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 0002_privy_user_id.sql
-- =============================================================================

-- Link Auton users to Privy accounts (optional, for Privy token login)
ALTER TABLE users ADD COLUMN IF NOT EXISTS privy_user_id TEXT UNIQUE;


-- =============================================================================
-- 0003_provider_nodes.sql
-- =============================================================================

-- Provider worker nodes (native CLI / future browser workers)
CREATE TABLE IF NOT EXISTS provider_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'native',
  status TEXT NOT NULL DEFAULT 'offline',
  earnings_usdc DECIMAL(20, 6) NOT NULL DEFAULT 0,
  jobs_completed BIGINT NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_nodes_user_id_idx ON provider_nodes(user_id);
CREATE INDEX IF NOT EXISTS provider_nodes_last_seen_idx ON provider_nodes(last_seen_at);


-- =============================================================================
-- 0004_marketplace_purchases.sql
-- =============================================================================

-- On-chain USDC marketplace purchases (one tx signature per purchase)
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_tier TEXT NOT NULL,
  token_amount BIGINT NOT NULL,
  usdc_amount_micro BIGINT NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_purchases_user_id_idx ON marketplace_purchases(user_id);


-- =============================================================================
-- 0005_trading.sql
-- =============================================================================

-- Off-chain leveraged trading clearinghouse: margin accounts, positions, deposits.
-- Collateral is denominated 1 $AUTO = $1 (margin in USD == AUTO tokens).

CREATE TABLE IF NOT EXISTS margin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_collateral NUMERIC NOT NULL DEFAULT 0,
  free_margin NUMERIC NOT NULL DEFAULT 0,
  locked_margin NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_tier TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  leverage INTEGER NOT NULL,
  entry_price NUMERIC NOT NULL,
  size_millions NUMERIC NOT NULL,
  notional_usd NUMERIC NOT NULL,
  locked_collateral NUMERIC NOT NULL,
  liquidation_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'LIQUIDATED')),
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  exit_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS margin_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_auto NUMERIC NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS positions_user_id_idx ON positions(user_id);
CREATE INDEX IF NOT EXISTS positions_status_idx ON positions(status);
CREATE INDEX IF NOT EXISTS margin_deposits_user_id_idx ON margin_deposits(user_id);


-- =============================================================================
-- 0006_multi_collateral.sql
-- =============================================================================

-- Multi-collateral clearinghouse: accept USDC (1:1) and $AUTO (live oracle price).
-- Unified buying power stays in USD; raw token balances tracked separately.

ALTER TABLE margin_accounts
  ADD COLUMN IF NOT EXISTS auto_collateral NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usdc_collateral NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE margin_deposits
  ADD COLUMN IF NOT EXISTS asset TEXT NOT NULL DEFAULT 'AUTO',
  ADD COLUMN IF NOT EXISTS usd_credited NUMERIC NOT NULL DEFAULT 0;


-- =============================================================================
-- 0007_settlement.sql
-- =============================================================================

-- On-chain settlement of closed positions: record the vault payout (margin +
-- profit) sent back to the trader's wallet in $AUTO.

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS settlement_tx TEXT,
  ADD COLUMN IF NOT EXISTS settlement_auto NUMERIC NOT NULL DEFAULT 0;


-- =============================================================================
-- 0008_market_state.sql
-- =============================================================================

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


-- =============================================================================
-- 0009_limit_orders.sql
-- =============================================================================

-- Limit orders: positions can now be placed as resting LIMIT orders that fill
-- when the mark crosses the limit price. Margin is reserved at placement time
-- (free -> locked) just like a market order, and refunded on cancel.

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'MARKET',
  ADD COLUMN IF NOT EXISTS limit_price NUMERIC;

-- Working ('PENDING') and 'CANCELLED' join the original lifecycle states.
ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_status_check;
ALTER TABLE positions
  ADD CONSTRAINT positions_status_check
  CHECK (status IN ('PENDING', 'ACTIVE', 'CLOSED', 'LIQUIDATED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS positions_pending_idx
  ON positions(status)
  WHERE status = 'PENDING';


-- =============================================================================
-- 0010_advanced_orders.sql
-- =============================================================================

-- Advanced order types: Stop (market/limit), Take (market/limit), Scale ladders
-- and TWAP. These all build on the PENDING -> ACTIVE lifecycle from 0009.
--
--   * trigger_price / trigger_above: stop & take orders fire when the mark
--     crosses the trigger in the stored direction.
--   * triggered: a stop/take-LIMIT order that has fired becomes a resting limit.
--   * execute_at: a TWAP slice fills at the mark once this timestamp passes.
--   * parent_id: groups the child orders of a Scale ladder or TWAP schedule.

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS trigger_price NUMERIC,
  ADD COLUMN IF NOT EXISTS trigger_above BOOLEAN,
  ADD COLUMN IF NOT EXISTS triggered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS execute_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_id UUID;

CREATE INDEX IF NOT EXISTS positions_execute_at_idx
  ON positions(execute_at)
  WHERE execute_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS positions_parent_id_idx
  ON positions(parent_id)
  WHERE parent_id IS NOT NULL;


-- =============================================================================
-- 0011_margin_withdrawals.sql
-- =============================================================================

-- Collateral withdrawals: traders pull free buying power back out of the
-- clearinghouse as an on-chain payout from the vault ($AUTO or USDC). Each row
-- records the raw token amount sent, the USD removed from buying power, and the
-- vault payout signature for audit.

CREATE TABLE IF NOT EXISTS margin_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL CHECK (asset IN ('AUTO', 'USDC')),
  amount NUMERIC NOT NULL,
  usd_debited NUMERIC NOT NULL,
  tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS margin_withdrawals_user_id_idx
  ON margin_withdrawals(user_id);


-- =============================================================================
-- 0012_chat_credits.sql
-- =============================================================================

-- Unified USD-denominated chat credit wallet.
-- Sits alongside the per-tier compute_balances forward contracts: a user tops up
-- once (USDC or $AUTO) and spends the single balance across any model in the chat.
-- All amounts are stored in USD micro-units (1 USD = 1_000_000) to match USDC.

CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance_usd_micro BIGINT NOT NULL DEFAULT 0,
  total_purchased_usd_micro BIGINT NOT NULL DEFAULT 0,
  total_spent_usd_micro BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- On-chain top-ups (one tx signature per top-up). Mirrors marketplace_purchases.
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_asset TEXT NOT NULL,
  amount_paid_base BIGINT NOT NULL,
  usd_credited_micro BIGINT NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_purchases_user_id_idx ON credit_purchases(user_id);

-- Per-message spend ledger for the chat (separate from gateway usage_logs).
CREATE TABLE IF NOT EXISTS credit_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  prompt_tokens BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  usd_charged_micro BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_usage_logs_user_id_idx ON credit_usage_logs(user_id);


-- =============================================================================
-- 0013_option_positions.sql
-- =============================================================================

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

