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
