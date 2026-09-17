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
