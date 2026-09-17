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
