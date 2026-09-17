# Auton Marketplace

The web app for **Auton** — the derivatives layer for decentralized compute. It's
the user-facing surface where people buy inference futures, trade compute prices,
chat with AI models from a prepaid credit balance, browse the model catalog, and
manage their account.

It's a server-side-rendered React Router app that talks to the Auton backend API
and signs transactions with a Solana wallet.

## Features

The app is a single layout (`routes/_layout.tsx`) with these routes:

| Route | What it does |
| --- | --- |
| `/` | **Marketplace** — browse inference futures, see live spot vs. locked rates and hedge savings, and purchase forward balance with $AUTO or USDC |
| `/trade` | **Trading** — go long/short on model compute prices with leverage, live candlestick chart (`lightweight-charts`), order book, and positions |
| `/chat` | **Chat** — talk to any supported model from one prepaid credit balance, top up with $AUTO or USDC, and upload images to vision models |
| `/models` | **Model directory** — searchable catalog of every supported model with pricing and modalities |
| `/how-it-works` | Explainer page for new users |
| `/dashboard` | Account overview — balances, staking, usage, and API keys |

### Wallet & auth

- Connect **Phantom**, **Solflare**, or **Backpack** (see `app/lib/solana/wallets.ts`).
- Sign-in is a Solana message signature — the app fetches a nonce, signs it, and
  exchanges the signature for a JWT from the backend. The JWT is stored in
  `localStorage` and attached to authenticated API calls.
- On-chain payments (futures purchases, credit top-ups, margin deposits) are built
  client-side as SPL token transfers ($AUTO is Token-2022, USDC is classic SPL)
  and submitted through the connected wallet.

## Tech stack

- [React Router v7](https://reactrouter.com/) (framework mode, SSR)
- React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- Vite 8
- [`@solana/web3.js`](https://solana.com/) + [`@solana/spl-token`](https://spl.solana.com/token) for wallet and token transfers
- [`lightweight-charts`](https://tradingview.github.io/lightweight-charts/) for the trading chart

## Prerequisites

- Node.js 20+
- pnpm 11+
- A running [Auton backend](../backend) (the app calls its REST API and gateway)

## Environment variables

Create a `.env` (or `.env.local`) in this directory. All client env vars must be
prefixed with `VITE_`:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_AUTON_API_URL` | Yes (prod) | `https://api.autonairh.xyz` | Base URL of the Auton backend API |
| `VITE_ROBINHOOD_RPC_URL` | Recommended | `https://rpc.mainnet.chain.robinhood.com` | Robinhood Chain RPC for wallet reads and USDG transfers |
| `VITE_SITE_URL` | No | `https://app.autonairh.xyz` | Canonical site URL used for Open Graph / link-preview meta |

## Getting started

Install dependencies:

```bash
pnpm install
```

Start the dev server with HMR:

```bash
pnpm run dev
```

The app runs at `http://localhost:5173`. Make sure the backend is running (see
[`../backend`](../backend)) and its CORS allows this origin, or API calls will fail
with a "Could not reach Auton backend" error.

Type-check the project:

```bash
pnpm run typecheck
```

## Building for production

```bash
pnpm run build
pnpm run start
```

`start` serves the SSR build via `react-router-serve` at the
`build/server/index.js` entry. The build output is:

```
build/
├── client/    # static assets
└── server/    # SSR server bundle
```

## Project structure

```
app/
├── routes/         # route modules (_layout, home, trade, chat, models, dashboard, how-it-works)
├── components/     # page + UI components (trade-page, chat-page, marketplace-page, login-modal, ...)
├── hooks/          # data + wallet hooks (use-wallet, use-trade, use-credits, use-dashboard, ...)
├── lib/
│   ├── api/        # typed backend clients (client, trade, chat, credits, models, marketplace, ...)
│   ├── solana/     # wallet adapters + SPL token transfers ($AUTO, USDC)
│   └── images.ts   # client-side image downscaling for vision chat
├── config/         # site + marketplace formatting helpers
├── providers.tsx   # app-wide context providers
└── root.tsx        # HTML document + meta
```

## Deployment

The app is containerized via the included `Dockerfile` (a multi-stage build that
ends with `pnpm run start`) and deploys to any Docker-friendly host — Railway,
Fly.io, Cloud Run, etc. It listens on port `3000`.

```bash
docker build -t auton-marketplace .
docker run -p 3000:3000 auton-marketplace
```

> **Important:** `VITE_*` variables are inlined at **build time**, not runtime, so
> passing them with `docker run -e` has no effect. They must be present when
> `pnpm run build` runs inside the image. The `Dockerfile` copies the build
> context (`COPY . /app/`), so the simplest approach is to provide a `.env` file in
> this directory before building. On platforms like Railway, set them as
> **build-time** environment variables.
