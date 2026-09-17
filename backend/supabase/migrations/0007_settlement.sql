-- On-chain settlement of closed positions: record the vault payout (margin +
-- profit) sent back to the trader's wallet in $AUTO.

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS settlement_tx TEXT,
  ADD COLUMN IF NOT EXISTS settlement_auto NUMERIC NOT NULL DEFAULT 0;
