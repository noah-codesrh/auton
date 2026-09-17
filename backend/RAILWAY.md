# Fresh Railway deploy — auton-backend

## 1. Supabase first

In the Supabase SQL Editor run:

```
supabase/bootstrap.sql
```

## 2. Create the Railway project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select this backend repo (not the marketing or trade repo)
3. Do **not** set a custom root directory

## 3. Variables **before** the first deploy

Railway → service → **Variables** → **Raw Editor**

From your machine (filled-in `.env`):

```bash
pnpm railway:env
```

Paste, then add:

```
NODE_ENV=production
CORS_ORIGINS=https://autonairh.xyz,https://www.autonairh.xyz,https://app.autonairh.xyz
```

### Required to boot

| Variable | Notes |
| --- | --- |
| `SUPABASE_URL` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `secret` / `service_role` (`sb_secret_…`) |
| `JWT_SECRET` | Min 32 chars — `openssl rand -base64 64` |
| `MASTER_VAULT_WALLET` | Treasury `0x…` that receives USDG |
| `OPENROUTER_API_KEY` | openrouter.ai |

### Also set

| Variable | Value |
| --- | --- |
| `SOLANA_RPC_URL` | Optional. Defaults to Robinhood RPC |
| `ROBINHOOD_RPC_URL` | `https://rpc.mainnet.chain.robinhood.com` |
| `USDC_TOKEN_MINT` | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| `VAULT_PRIVATE_KEY` | `0x` key for `MASTER_VAULT_WALLET` |
| `PRIVY_APP_ID` / `PRIVY_APP_SECRET` | Same Privy app as the frontends |
| `AUTO_TOKEN_MINT` | Only after `$AUTO` is deployed |

Do **not** set `PORT`.

## 4. Domain

Settings → **Networking** → `api.autonairh.xyz`.

Then:

- `GET https://api.autonairh.xyz/health`
- `GET https://api.autonairh.xyz/health/db`

## 5. Frontends

Set `VITE_AUTON_API_URL=https://api.autonairh.xyz` on both Vercel projects.

Optional: `PUBLIC_API_URL=https://api.autonairh.xyz` so provider worker scripts print the live API.
