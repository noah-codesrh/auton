# Auton demo walkthrough

Live stack:

| Service | URL |
|---------|-----|
| Frontend | https://www.autonairobinhood.xyz (or `pnpm dev` → localhost:5173) |
| Backend API | https://api.autonairobinhood.xyz |
| Health | https://api.autonairobinhood.xyz/health |
| DB health | https://api.autonairobinhood.xyz/health/db |
| On-chain config | https://api.autonairobinhood.xyz/api/v1/config |

The frontend pulls `$AUTO` mint + vault from `/api/v1/config` automatically — no need to duplicate Railway values in Vercel unless you want local overrides.

---

## Before you demo

### Railway (backend)

1. All 7 required env vars set (see `backend/RAILWAY.md`)
2. `CORS_ORIGINS` includes your frontend URL:
   ```
   https://www.autonairobinhood.xyz,https://autonairobinhood.xyz,http://localhost:5173
   ```
3. `NODE_ENV=production`
4. Deploy logs show `Auton backend listening on port ...`
5. Push latest backend (includes `/api/v1/config` route)

### Vercel / local (frontend)

```bash
cd auton
cp .env.example .env   # fill VITE_PRIVY_APP_ID + VITE_SOLANA_RPC_URL
pnpm install
pnpm dev
```

Required frontend vars:

| Variable | Value |
|----------|-------|
| `VITE_AUTON_API_URL` | `https://api.autonairobinhood.xyz` |
| `VITE_PRIVY_APP_ID` | From [dashboard.privy.io](https://dashboard.privy.io) |
| `VITE_SOLANA_RPC_URL` | Helius mainnet RPC |

### Privy dashboard

Add allowed domains:

- `http://localhost:5173`
- `https://www.autonairobinhood.xyz`
- `https://autonairobinhood.xyz`

Enable **Solana wallets** (Phantom, Solflare, Backpack).

---

## Demo script (~5 min)

### 1. Landing → Markets (30 sec)

Open `/` — show the hero and value prop.

Go to **Markets** (`/markets`):

- Walk through forward contracts (DeepSeek, Llama, Q3 GPU)
- Point out locked rate vs spot savings
- Explain tiers = tokenized compute capacity

### 2. Connect wallet + backend auth (1 min)

Go to **Dashboard** (`/dashboard`).

- Confirm green **API online** badge and `$AUTO: xxxx…yyyy` (mint from backend)
- Click **Connect wallet** → Privy modal → Phantom/Solflare
- Click **Activate dashboard** → sign message (Solana auth, no gas)
- JWT stored in localStorage; dashboard loads real data from Supabase

If badge shows **API offline**, check Railway deploy + CORS.

### 3. Create API key (1 min)

On dashboard:

- Enter key name → **Create key**
- Copy the `auton_sk_...` key (shown once)
- Show **Gateway endpoint**:
  ```
  https://api.autonairobinhood.xyz/api/v1/gateway/v1/chat/completions
  ```

### 4. Live inference call (1 min)

Terminal demo with your API key:

```bash
curl https://api.autonairobinhood.xyz/api/v1/gateway/v1/chat/completions \
  -H "Authorization: Bearer YOUR_AUTON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-chat",
    "messages": [{"role": "user", "content": "Say hello in one sentence."}],
    "max_tokens": 50
  }'
```

Expected without compute balance: **402 payment required** (proves gateway + auth work).

To get a successful response, add a row in Supabase `compute_balances` for your user + tier, or implement purchase flow.

### 5. Staking + Treasury (1 min)

**Staking** (`/staking`):

- Shows `$AUTO` token status from backend config
- `pending` → no mint configured
- `token-only` → mint set, no Streamflow pool yet
- `live` → full stake/unstake (needs `VITE_AUTO_STAKE_POOL`)

**Treasury** (`/treasury`):

- Burn / stake metrics (uses fallback data until treasury API exists)

### 6. Architecture talking points (30 sec)

- Wallet auth: Solana signature → JWT (not Supabase Auth)
- Gateway: OpenRouter proxy, balances deduct per token
- On-chain: `$AUTO` mint + vault from Railway, verified on stake deposit
- Derivatives layer: hedge volatility, guarantee capacity, earn yield

---

## Quick verification checklist

```bash
# Backend up?
curl -s https://api.autonairobinhood.xyz/health | jq .

# Supabase connected?
curl -s https://api.autonairobinhood.xyz/health/db | jq .

# Your mint + vault from Railway?
curl -s https://api.autonairobinhood.xyz/api/v1/config | jq .

# Auth nonce works?
curl -s "https://api.autonairobinhood.xyz/api/v1/auth/nonce/YOUR_WALLET" | jq .
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard shows mock/fallback data | API unreachable or not signed in — check API badge |
| CORS error in browser console | Add frontend URL to Railway `CORS_ORIGINS`, redeploy |
| Privy login fails | Add domain in Privy dashboard |
| `$AUTO` not showing on dashboard | Redeploy backend with `/api/v1/config`; check Railway mint vars |
| Gateway 401 | Invalid or missing API key |
| Gateway 402 | No compute balance for that model tier |
| Sign message fails | Use a Solana wallet via Privy, not Twitter-only login |
