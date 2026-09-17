-- Multi-collateral clearinghouse: accept USDC (1:1) and $AUTO (live oracle price).
-- Unified buying power stays in USD; raw token balances tracked separately.

ALTER TABLE margin_accounts
  ADD COLUMN IF NOT EXISTS auto_collateral NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usdc_collateral NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE margin_deposits
  ADD COLUMN IF NOT EXISTS asset TEXT NOT NULL DEFAULT 'AUTO',
  ADD COLUMN IF NOT EXISTS usd_credited NUMERIC NOT NULL DEFAULT 0;
