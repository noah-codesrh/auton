# Auton Docs

Documentation site for [Auton](https://www.autonairh.xyz) — the derivatives layer for decentralized compute.

Built with React Router 7, Tailwind CSS v4, and SSR.

## Getting started

```bash
pnpm install
pnpm run dev
```

Dev server: `http://localhost:5174`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start dev server with HMR |
| `pnpm run build` | Production build |
| `pnpm run start` | Serve production build |
| `pnpm run typecheck` | Generate route types and run TypeScript |

## Deployment

### Node

```bash
pnpm install
pnpm run build
pnpm run start
```

### Docker

```bash
docker build -t auton-docs .
docker run -p 3000:3000 auton-docs
```

Deploy the output of `pnpm run build`:

```
├── package.json
├── pnpm-lock.yaml
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Project structure

```
app/
├── components/
│   ├── doc-page.tsx      # Page wrapper with prev/next nav
│   └── docs-shell.tsx    # Layout, sidebar, TOC, header
├── lib/
│   └── navigation.ts     # Nav items, slugs, section IDs
├── routes/               # One file per docs page
├── app.css               # Tailwind + docs prose styles
└── root.tsx              # Fonts, favicons, HTML shell
public/
├── favicon.ico
├── og-image.png
└── logos/                # Favicon variants
```

## Adding or editing pages

1. Add the page metadata to `app/lib/navigation.ts` (`DOC_PAGES`).
2. Create a route file in `app/routes/`.
3. Register the route in `app/routes.ts`.
4. Use `<DocPage page={page}>` and section headings with matching `id` attributes for the table of contents.

Example section heading:

```tsx
<h2 id="how-it-works">How it works</h2>
```

## Docs pages

- What is Auton?
- Why Auton matters
- How it works
- Architecture
- The $AUTO Token
- Staking
- Markets
- Gateway
- For Agents
- API
- User Guide
- Provider Guide

## Links

- App: [autonairh.xyz](https://www.autonairh.xyz)
- API: [api.autonairh.xyz](https://api.autonairh.xyz)
- X: [@autonairh](https://x.com/autonairh)
- Telegram: [t.me/autonai_robinhood](https://t.me/autonai_robinhood)
