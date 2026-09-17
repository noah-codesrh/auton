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
