# Deploy Auton on autonairh.xyz

Single repo: `noah-codesrh/auton`.

| App | Host | Domain | Root directory |
| --- | --- | --- | --- |
| Marketing site (`auton/`) | Vercel | `autonairh.xyz` and `www.autonairh.xyz` | `auton` |
| Trade app (`marketplace/`) | Vercel | `app.autonairh.xyz` | `marketplace` |
| API (`backend/`) | Railway | `api.autonairh.xyz` | `backend` |

Docs stay unpublished.

## DNS (at your registrar)

| Name | Type | Value |
| --- | --- | --- |
| `@` | A / ALIAS | Vercel marketing project |
| `www` | CNAME | `cname.vercel-dns.com` |
| `app` | CNAME | `cname.vercel-dns.com` |
| `api` | CNAME | Railway custom-domain target |

Vercel and Railway show the exact records after you add each domain.

## 1. Backend → Railway

Repo: `noah-codesrh/auton`. Railway **Root Directory** = `backend`.

1. New Railway project → deploy that GitHub repo (root directory `backend`).
2. Service **Variables** → Raw Editor. From `backend/` run `pnpm railway:env` (never commit `.env`).
3. Set production CORS (required):

```
CORS_ORIGINS=https://autonairh.xyz,https://www.autonairh.xyz,https://app.autonairh.xyz
NODE_ENV=production
```

Required to boot:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (32+ chars)
- `SOLANA_RPC_URL` (can be `https://rpc.mainnet.chain.robinhood.com`)
- `MASTER_VAULT_WALLET`
- `OPENROUTER_API_KEY`

Also set:

- `ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com`
- `USDC_TOKEN_MINT=0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`
- `VAULT_PRIVATE_KEY` (same wallet as `MASTER_VAULT_WALLET`) so USDG withdraws/closes pay out
- `PRIVY_APP_ID` / `PRIVY_APP_SECRET`

Do **not** set `PORT`. Do **not** require `AUTO_TOKEN_MINT` until `$AUTO` is deployed.

4. Networking → custom domain `api.autonairh.xyz`.
5. Confirm `https://api.autonairh.xyz/health` and `/health/db`.

## 2. Marketing → Vercel

Repo: `noah-codesrh/auton`.

Vercel project settings:

- Framework: React Router
- Root directory: `auton`
- Env:

```
VITE_SITE_URL=https://www.autonairh.xyz
VITE_AUTON_API_URL=https://api.autonairh.xyz
VITE_PRIVY_APP_ID=<same Privy app>
VITE_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
```

Domains: `autonairh.xyz`, `www.autonairh.xyz`.

## 3. Trade app → Vercel

Repo: `noah-codesrh/auton`. Same GitHub repo, second Vercel project.

- Framework: React Router
- Root directory: `marketplace`
- Env:

```
VITE_AUTON_API_URL=https://api.autonairh.xyz
VITE_SITE_URL=https://app.autonairh.xyz
VITE_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
```

Domain: `app.autonairh.xyz`.

## 4. Privy

dashboard.privy.io → Configuration → Domains, add (no trailing slash):

- `https://autonairh.xyz`
- `https://www.autonairh.xyz`
- `https://app.autonairh.xyz`
- local origins if you still develop locally

## Order

1. Railway API + `api.autonairh.xyz` healthy  
2. Vercel marketing + trade with the env above  
3. Attach DNS  
4. Privy domains  
5. Smoke test: connect wallet on trade, deposit USDG, open a tiny position
