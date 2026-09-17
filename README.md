# Auton

**The CME for machine resources — the liquidity venue for the machine economy.**

Auton is an on-chain marketplace, built on Solana, for trading the resources that power AI: compute, GPUs, storage, and bandwidth. It lets builders trade, hedge, and secure future AI capacity directly from their wallet — locking in inference rates, speculating on capacity volatility, and earning yield from settlement activity.

This repository contains the **marketing/landing site** for Auton.

- **App / trading terminal:** https://trade.autonairobinhood.xyz
- **Docs:** https://docs.autonairobinhood.xyz
- **X:** https://x.com/autonai_robinhood
- **Telegram:** https://t.me/autonai_robinhood

## What is Auton?

Modern AI runs on a volatile, fragmented market for compute. Auton turns those resources into tradable financial primitives so AI builders can budget with certainty and suppliers can monetize spare capacity.

| Capability | What it means |
| --- | --- |
| **Hedge volatility** | Lock in compute prices with futures and options, protecting workloads from spot market swings. |
| **Guarantee capacity** | Reserve GPU hours on decentralized networks so jobs run when you need them. |
| **On-chain markets** | Trade compute derivatives directly from your wallet, with no intermediaries. |
| **Earn yield** | Provide liquidity to compute markets and earn fees and staking rewards. |

## The protocol layers

Auton is designed as a modular stack of eight market layers. The first two are live today; the rest are on the roadmap.

| Layer | Name | Status |
| --- | --- | --- |
| L1 | Spot Markets — raw compute, storage, bandwidth, and GPUs at the live price | Live |
| L2 | Futures Markets — lock in inference capacity weeks/months ahead (the current entry point) | Live |
| L3 | Yield Curves — forward curves that turn locked capacity into a fixed-income market | Building |
| L4 | Derivatives — options, perpetuals, calendar spreads, and capacity insurance | Roadmap |
| L5 | Macro Indexes — tradable baskets tracking the cost of AI labor | Roadmap |
| L6 | Agent Treasury Management — autonomous agents that hedge their own compute overhead | Roadmap |
| L7 | Resource-Backed Stablecoins — `iUSD`, backed by locked, productive compute | Roadmap |
| L8 | Universal Infrastructure Exchange — uniting Web2 cloud giants with DePIN protocols | Roadmap |

## The $AUTO token

`$AUTO` is the settlement and collateral asset of the venue.

- **Futures collateral** — open positions post `$AUTO` as margin, locking it off the market.
- **Verifier staking** — compute suppliers stake `$AUTO` to guarantee their SLA, earning settlement fees in `$USDG` (and risking slashing if they go offline).
- **Buyback & burn** — 100% of futures settlement fees go to the treasury; half burns `$AUTO`, half is paid to stakers.

**Contract address (Solana):** `7io8XEMRMoQoCvD3phKR2QR5EeoMmJnYM1dsjVdYpump`

## Tech stack

- [React Router 7](https://reactrouter.com/) (server-side rendering)
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vite](https://vite.dev/)
- Solana wallet integration via [Privy](https://www.privy.io/) and [`@solana/kit`](https://github.com/solana-labs/solana-web3.js)
- Deployed on [Vercel](https://vercel.com/)

## Running locally

Requires [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```bash
# Install dependencies
pnpm install

# Start the dev server (with hot module replacement)
pnpm run dev
```

The site will be available at `http://localhost:5173`.

### Other commands

```bash
pnpm run build      # Create a production build
pnpm run start      # Serve the production build
pnpm run typecheck  # Run the TypeScript type checker
```

## Project structure

```
app/
├── components/   # Landing page sections (hero, protocol layers, feature grid, token, footer)
├── routes/       # Pages: home, markets, dashboard, staking, treasury, earn
├── lib/          # Shared helpers (site metadata, etc.)
└── root.tsx      # App shell

build/
├── client/       # Static assets (after build)
└── server/       # Server-side code (after build)
```

---

> Disclaimer: Auton involves trading financial instruments and crypto assets. Nothing in this repository is financial advice. Always do your own research.
