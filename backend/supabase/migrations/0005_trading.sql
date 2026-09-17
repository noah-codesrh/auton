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
