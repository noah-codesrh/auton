# Deploy marketing site → Vercel

Domain: `autonairh.xyz` and `www.autonairh.xyz`

## Vercel

- Framework: React Router
- Root directory: `auton`
- Env (Production):

```
VITE_SITE_URL=https://www.autonairh.xyz
VITE_AUTON_API_URL=https://api.autonairh.xyz
VITE_PRIVY_APP_ID=<same Privy app as local>
VITE_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
```

Then add both domains in the Vercel project.

Trade app is a **separate** Vercel project from `marketplace/` → `app.autonairh.xyz`.
API is Railway → `api.autonairh.xyz`.
