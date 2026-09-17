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
