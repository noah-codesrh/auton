# Auton Backend

Node.js / Express API for **Auton** — the derivatives layer for decentralized compute.

**Database: Supabase only** (`@supabase/supabase-js` with service role)

## Architecture

```
Express API  →  @supabase/supabase-js  →  Supabase Postgres
```

Wallet auth stays on Solana signatures + JWT — **not** Supabase Auth.

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a project.

### 2. Run the schema migration

Open **SQL Editor** in the Supabase dashboard and run the full ledger schema:

```
supabase/bootstrap.sql
```

That file is every migration concatenated (`0001`–`0013`). Do not run only `0001` — trading, credits, and options tables live in the later files.

### 3. Configure `.env`

```bash
cp .env.example .env
```

| Variable | Where to find it |
|----------|------------------|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` (secret) |

### 4. Install and run

```bash
pnpm install
pnpm dev
```

Verify: `GET http://localhost:4000/health/db`

## Railway deployment

The service needs **6 required variables** on the **auton-backend service** (not just the project). The start script exits immediately if any are missing, so the healthcheck at `/health` never succeeds.

| Variable | Notes |
|----------|-------|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` / `sb_secret_…` |
| `JWT_SECRET` | Min 32 characters — `openssl rand -base64 64` |
| `SOLANA_RPC_URL` | `https://rpc.mainnet.chain.robinhood.com` is fine |
| `MASTER_VAULT_WALLET` | Treasury `0x` address that receives USDG |
| `OPENROUTER_API_KEY` | From [openrouter.ai](https://openrouter.ai) |

Also set:

| Variable | Suggested value |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://autonairh.xyz,https://www.autonairh.xyz,https://app.autonairh.xyz` |
| `USDC_TOKEN_MINT` | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| `VAULT_PRIVATE_KEY` | `0x` key for `MASTER_VAULT_WALLET` |
| `AUTO_TOKEN_MINT` | Only after `$AUTO` is deployed |

### Paste variables from local `.env`

```bash
cp .env.example .env   # fill in values locally first
pnpm railway:env       # prints a block for Railway Raw Editor
```

In Railway: **auton-backend → Variables → Raw Editor** → paste → save → **Deployments → Redeploy**.

If variables were added after a failed deploy, you must redeploy — existing containers do not pick up new values until redeployed.

Check deploy logs for `[env] OK:` lines. All seven should show `(N chars)`. If you see `[env] MISSING:`, that variable is empty or not attached to this service.

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET | `/health/db` | — | Supabase connectivity |
| GET | `/api/v1/auth/nonce/:wallet` | — | Get sign-in message |
| POST | `/api/v1/auth/login` | — | Verify signature, issue JWT |
| GET | `/api/v1/dashboard/` | JWT | API keys, balances, yield |
| POST | `/api/v1/dashboard/api-keys` | JWT | Create gateway API key |
| POST | `/api/v1/stake/deposit` | JWT | Verify & log stake tx |
| POST | `/api/v1/stake/claim` | JWT | Queue USDC yield payout |
| GET | `/api/v1/stake/summary` | JWT | Staking totals |
| ANY | `/api/v1/gateway/*` | API Key | OpenRouter proxy |

## Database tables

- `users` — Solana wallet addresses
- `api_keys` — Hashed Auton API keys
- `compute_balances` — Forward contract token balances
- `staking_ledger` — Verified `$AUTO` deposits
- `usage_logs` — Per-request token consumption
- `claim_requests` — USDC payout queue
