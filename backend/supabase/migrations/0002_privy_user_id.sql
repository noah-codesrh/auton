-- Link Auton users to Privy accounts (optional, for Privy token login)
ALTER TABLE users ADD COLUMN IF NOT EXISTS privy_user_id TEXT UNIQUE;
