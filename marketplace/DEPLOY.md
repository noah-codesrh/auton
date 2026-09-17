# Deploy trade app → Vercel

Domain: `app.autonairh.xyz`

## Vercel

- Framework: React Router
- Root directory: `marketplace`
- Env (Production):

```
VITE_AUTON_API_URL=https://api.autonairh.xyz
VITE_SITE_URL=https://app.autonairh.xyz
VITE_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
```

Add `app.autonairh.xyz` as a custom domain.

Marketing site is a **separate** Vercel project from `auton/` → `autonairh.xyz`.
API is Railway → `api.autonairh.xyz`.
