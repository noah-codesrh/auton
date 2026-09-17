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
