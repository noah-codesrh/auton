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
