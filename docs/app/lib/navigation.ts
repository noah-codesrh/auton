export type DocSection = {
  id: string;
  title: string;
};

export type DocPage = {
  slug: string;
  title: string;
  navLabel: string;
  description: string;
  sections: DocSection[];
  group?: "guide";
};

const isDev = import.meta.env.DEV;

export const APP_URL = isDev
  ? "http://localhost:5173"
  : "https://www.autonairh.xyz";
export const DOCS_URL = isDev
  ? "http://localhost:5174"
  : "https://docs.autonairh.xyz";

export const DOC_PAGES: DocPage[] = [
  {
    slug: "/",
    title: "What is Auton?",
    navLabel: "What is Auton?",
    description:
      "Auton is the derivatives layer for decentralized compute — hedge volatility, guarantee capacity, earn yield.",
    sections: [
      { id: "how-it-works", title: "How it works" },
      { id: "two-tiers", title: "Two tiers" },
      { id: "credits-and-auto", title: "Credits and the $AUTO token" },
      { id: "the-stack", title: "The stack" },
      { id: "why", title: "Why?" },
    ],
  },
  {
    slug: "/why-auton-matters",
    title: "Why Auton matters",
    navLabel: "Why Auton matters",
    description:
      "Spot compute pricing is volatile. Auton brings forward contracts and capacity commitments on-chain.",
    sections: [
      { id: "the-problem", title: "The problem" },
      { id: "the-solution", title: "The solution" },
      { id: "who-its-for", title: "Who it's for" },
    ],
  },
  {
    slug: "/economics",
    title: "The Auton economy",
    navLabel: "Economics",
    description:
      "How Auton's compute economics differ from traditional cloud and API providers — forward pricing, prepaid discounts, on-chain settlement, and a usage-driven token sink.",
    sections: [
      { id: "overview", title: "Two ways to buy compute" },
      { id: "legacy", title: "How compute is priced today" },
      { id: "auton-model", title: "The Auton model" },
      { id: "comparison", title: "Side by side" },
      { id: "flow", title: "How value flows" },
      { id: "token-sink", title: "Why demand accrues to $AUTO" },
      { id: "takeaway", title: "What it means for you" },
    ],
  },
  {
    slug: "/how-it-works",
    title: "How it works",
    navLabel: "How it works",
    description: "From marketplace purchase to gateway inference in four steps.",
    sections: [
      { id: "browse", title: "Browse markets" },
      { id: "lock", title: "Lock a rate" },
      { id: "route", title: "Route inference" },
      { id: "settle", title: "Settle on-chain" },
    ],
  },
  {
    slug: "/architecture",
    title: "Architecture",
    navLabel: "Architecture",
    description: "Protocol components and how they connect.",
    sections: [
      { id: "overview", title: "Overview" },
      { id: "backend", title: "Backend API" },
      { id: "gateway", title: "Inference gateway" },
      { id: "on-chain", title: "On-chain layer" },
    ],
  },
  {
    slug: "/auto-token",
    title: "The $AUTO Token",
    navLabel: "The $AUTO Token",
    description: "Collateral, staking, and value accrual for the Auton network.",
    sections: [
      { id: "futures-collateral", title: "Futures collateral" },
      { id: "verifier-staking", title: "Verifier staking" },
      { id: "buyback-burn", title: "Buyback & burn" },
    ],
  },
  {
    slug: "/staking",
    title: "Staking",
    navLabel: "Staking",
    description: "Stake $AUTO for yield and boosted provider payouts.",
    sections: [
      { id: "self-custody", title: "Self-custody staking" },
      { id: "yield", title: "Yield" },
      { id: "boost", title: "Provider boost" },
    ],
  },
  {
    slug: "/markets",
    title: "Markets",
    navLabel: "Markets",
    description: "Forward contracts and capacity commitments on the Auton marketplace.",
    sections: [
      { id: "futures", title: "Futures" },
      { id: "capacity", title: "Capacity" },
      { id: "purchase", title: "Purchasing" },
    ],
  },
  {
    slug: "/trading",
    title: "Trading compute futures",
    navLabel: "Trading",
    description:
      "Go long or short on model compute prices with leverage, using $AUTO or USDG as collateral.",
    sections: [
      { id: "overview", title: "Overview" },
      { id: "collateral", title: "Collateral & buying power" },
      { id: "deposit", title: "Depositing margin" },
      { id: "open", title: "Opening a position" },
      { id: "pnl", title: "How PnL works" },
      { id: "liquidation", title: "Liquidation" },
      { id: "orderbook", title: "Order book & trades" },
      { id: "risk", title: "Risk & disclaimers" },
    ],
  },
  {
    slug: "/yield-curve",
    title: "Yield Curve (Layer 3)",
    navLabel: "Yield Curve",
    description:
      "The intelligence layer on top of Auton's futures market — a real-time yield curve for AI compute, revealing what the market expects inference to cost at every point in the future.",
    sections: [
      { id: "overview", title: "The intelligence layer" },
      { id: "curve", title: "What the yield curve is" },
      { id: "forms", title: "How the curve forms" },
      { id: "reading", title: "Reading the curve" },
      { id: "architecture", title: "Architecture" },
      { id: "users", title: "Who uses it" },
      { id: "auto", title: "Why it matters for $AUTO" },
      { id: "status", title: "Status" },
    ],
  },
  {
    slug: "/derivatives",
    title: "Options & Derivatives (Layer 4)",
    navLabel: "Derivatives",
    description:
      "The derivatives layer on top of Auton's yield curve — options, Greeks, calendar spreads, and a volatility index for AI compute, priced with Black-76 on the forward curve.",
    sections: [
      { id: "overview", title: "The derivatives layer" },
      { id: "products", title: "What you can trade" },
      { id: "pricing", title: "How options are priced" },
      { id: "greeks", title: "Reading the Greeks" },
      { id: "vol", title: "The volatility index" },
      { id: "architecture", title: "Architecture" },
      { id: "users", title: "Who uses it" },
      { id: "auto", title: "Why it matters for $AUTO" },
      { id: "status", title: "Status" },
    ],
  },
  {
    slug: "/indexes",
    title: "Indexes (Layer 5)",
    navLabel: "Indexes",
    description:
      "Benchmarks for the machine economy — INF100 (the S&P 500 of AI compute), GPU500 supply health, and AGENT CPI, all computed live from Auton's futures market and price engine.",
    sections: [
      { id: "overview", title: "The benchmark layer" },
      { id: "indexes", title: "The three indexes" },
      { id: "calculation", title: "How they're calculated" },
      { id: "architecture", title: "Architecture" },
      { id: "users", title: "Who uses it" },
      { id: "auto", title: "Why it matters for $AUTO" },
      { id: "status", title: "Status" },
    ],
  },
  {
    slug: "/chat",
    title: "Chat & Credits",
    navLabel: "Chat",
    description:
      "Chat with any model from one credit balance — top up with $AUTO or USDG, spend at a discount, and upload images to vision models.",
    sections: [
      { id: "overview", title: "Overview" },
      { id: "credits", title: "Unified credits" },
      { id: "paying", title: "Paying with $AUTO or USDG" },
      { id: "spending", title: "How spending works" },
      { id: "vision", title: "Image upload (vision)" },
      { id: "models", title: "Choosing a model" },
    ],
  },
  {
    slug: "/gateway",
    title: "Gateway",
    navLabel: "Gateway",
    description: "OpenAI-compatible proxy for locked-rate inference.",
    sections: [
      { id: "compatibility", title: "Compatibility" },
      { id: "auth", title: "Authentication" },
      { id: "billing", title: "Billing" },
    ],
  },
  {
    slug: "/agents",
    title: "For Agents",
    navLabel: "For Agents",
    description:
      "Connect AI agents, bots, and automations to Auton via the OpenAI-compatible gateway.",
    sections: [
      { id: "quick-start", title: "Quick start" },
      { id: "base-url", title: "Base URL" },
      { id: "curl", title: "curl" },
      { id: "openai-sdk", title: "OpenAI SDK" },
      { id: "streaming", title: "Streaming" },
      { id: "supported-models", title: "Supported models" },
      { id: "agent-frameworks", title: "Agent frameworks" },
      { id: "errors", title: "Error responses" },
      { id: "env-vars", title: "Environment variables" },
      { id: "billing-agents", title: "Billing for agents" },
      { id: "health", title: "Health checks" },
    ],
  },
  {
    slug: "/api",
    title: "API",
    navLabel: "API",
    description: "REST endpoints for auth, dashboard, staking, and gateway access.",
    sections: [
      { id: "auth", title: "Auth" },
      { id: "dashboard", title: "Dashboard" },
      { id: "staking-api", title: "Staking" },
      { id: "gateway-api", title: "Gateway" },
    ],
  },
  {
    slug: "/user-guide",
    title: "User Guide",
    navLabel: "User Guide",
    description: "Get started as a compute consumer on Auton.",
    group: "guide",
    sections: [
      { id: "connect", title: "Connect wallet" },
      { id: "buy", title: "Buy forward balance" },
      { id: "api-key", title: "Create an API key" },
      { id: "infer", title: "Run inference" },
    ],
  },
  {
    slug: "/provider-guide",
    title: "Provider Guide",
    navLabel: "Provider Guide",
    description: "Supply compute, stake $AUTO, and earn USDG settlements.",
    group: "guide",
    sections: [
      { id: "register", title: "Register capacity" },
      { id: "stake-sla", title: "Stake for SLA" },
      { id: "earn", title: "Earn settlements" },
    ],
  },
];

export function getDocPage(slug: string) {
  return DOC_PAGES.find((page) => page.slug === slug);
}

export function getAdjacentPages(slug: string) {
  const index = DOC_PAGES.findIndex((page) => page.slug === slug);
  return {
    prev: index > 0 ? DOC_PAGES[index - 1] : undefined,
    next: index < DOC_PAGES.length - 1 ? DOC_PAGES[index + 1] : undefined,
  };
}

export const MAIN_NAV = DOC_PAGES.filter((page) => !page.group);
export const GUIDE_NAV = DOC_PAGES.filter((page) => page.group === "guide");

/**
 * Per-page document head meta. The root layout supplies the shared, static OG
 * tags (image, type, site_name, twitter:card); this fills in the page-specific
 * title/description/url for Open Graph and Twitter so link previews render with
 * a real title and summary (previously only a bare <title> was emitted).
 */
export function docMeta(slug: string) {
  const page = getDocPage(slug);
  const title = page ? `${page.title} | Auton — docs` : "Auton — docs";
  const description =
    page?.description ?? "Documentation for the Auton compute derivatives layer.";
  const url = `${DOCS_URL}${slug === "/" ? "" : slug}`;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}
