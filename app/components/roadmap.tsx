import { useEffect, useRef, type ReactNode } from "react";
import { DOCS_URL, TRADE_APP_URL } from "../lib/site-urls";
import { Footer } from "./footer";
import { PixelBackground } from "./pixel-background";
import {
  AgentIllo,
  CurveIllo,
  DerivativesIllo,
  EcosystemIllo,
  ExchangeIllo,
  FuturesIllo,
  IndexIllo,
  IntelligenceIllo,
  StablecoinIllo,
} from "./roadmap-illustrations";

type Status = "live" | "next" | "roadmap";

type Phase = {
  phase: string;
  layer?: string;
  code: string;
  title: string;
  status: Status;
  blurb: string;
  points: string[];
  highlight?: string;
  Illo: (props: { className?: string }) => ReactNode;
};

const PHASES: Phase[] = [
  {
    phase: "Phase 1 — Foundation",
    layer: "Layer 2",
    code: "L2",
    title: "Inference Futures",
    status: "live",
    blurb:
      "The first compute-futures protocol on Robinhood Chain. Lock in inference prices for DeepSeek, Llama, and more before you need them — pay USDG, get your API key, use at the locked rate before expiry.",
    points: [
      "Futures contracts on inference capacity",
      "OpenRouter integration for model routing",
      "Robinhood USDG settlement",
      "Pay-per-use AI chat, $AUTO burned on every message",
    ],
    Illo: FuturesIllo,
  },
  {
    phase: "Phase 2 — Price Discovery",
    layer: "Layer 3",
    code: "L3",
    title: "Yield Curves",
    status: "live",
    blurb:
      "Every locked futures contract becomes a data point. Stack enough across timeframes and a forward curve emerges — what the market believes compute will cost 1 week, 1 month, 3 months, and 1 year out.",
    points: [
      "Live forward curves per model",
      "Backwardation & contango detection",
      "Basis and annualized-rate tracking",
      "Full curve explorer",
    ],
    Illo: CurveIllo,
  },
  {
    phase: "Phase 3 — Derivatives",
    layer: "Layer 4",
    code: "L4",
    title: "Options & Complex Derivatives",
    status: "live",
    blurb:
      "The full financial toolkit for managing compute exposure — calls, puts, spreads, and a volatility index built directly on the curve below.",
    points: [
      "Call & put options on inference capacity",
      "Live options chain with strike prices",
      "Implied-volatility surface",
      "ATM straddles & spreads",
      "Perpetual DEX for inference futures",
      "Structured products bundling futures + options",
      "Compute Volatility Index — the VIX for AI inference",
      "$AUTO as margin collateral with a liquidation engine",
    ],
    highlight: "78.7% IV on DeepSeek",
    Illo: DerivativesIllo,
  },
  {
    phase: "Phase 4 — Indexes",
    layer: "Layer 5",
    code: "L5",
    title: "Macro Indexes",
    status: "next",
    blurb:
      "The market needed pricing data. Now it needs benchmarks — tradeable baskets that track the real cost of the machine economy.",
    points: [
      "INF100 — top 100 inference providers by volume, the S&P 500 of AI compute",
      "GPU500 — global GPU supply across decentralized networks",
      "AGENT CPI — the inflation index of the autonomous economy",
      "Indexes as tradeable assets",
      "Third-party data terminals built on AUTON feeds",
    ],
    Illo: IndexIllo,
  },
  {
    phase: "Phase 5 — Agent Treasury",
    layer: "Layer 6",
    code: "L6",
    title: "Agent Treasury Management",
    status: "roadmap",
    blurb:
      "Autonomous companies hedge their own infrastructure — forecasting compute needs and managing risk with zero human oversight.",
    points: [
      "Agents forecast quarterly compute needs and buy futures automatically",
      "Post margin, exercise options, and settle contracts autonomously",
      "Programmatic treasury management via SDK",
      "An AI law firm, hedge fund, or research lab — all hedging compute like airlines hedge jet fuel",
    ],
    Illo: AgentIllo,
  },
  {
    phase: "Phase 6 — Ecosystem",
    code: "ECO",
    title: "Ecosystem & Integrations",
    status: "roadmap",
    blurb: "This is where AUTON becomes infrastructure other products build on.",
    points: [
      "Wallet integrations — Phantom, Backpack, and others offer AUTON futures natively",
      "Enterprise SDK — apps self-hedge their own compute costs automatically",
      "Compute-network partnerships — io.net, Akash, Filecoin settle & hedge on AUTON",
      "Asset listings — networks list their capacity as tradeable assets",
      "Structured-product desks & insurance protocols on AUTON's options layer",
      "Liquidity-provider program for market makers and quant funds",
    ],
    Illo: EcosystemIllo,
  },
  {
    phase: "Phase 7 — Stablecoins",
    layer: "Layer 7",
    code: "L7",
    title: "Resource-Backed Stablecoins",
    status: "roadmap",
    blurb: "Not dollar-backed. Resource-backed. The reserve asset of the machine economy.",
    points: [
      "iUSD — redeemable for inference, storage, and bandwidth",
      "Backed by AUTON's settled contracts and locked futures",
      "Holds value because it's redeemable for real machine resources",
    ],
    Illo: StablecoinIllo,
  },
  {
    phase: "Phase 8 — Universal Exchange",
    layer: "Layer 8",
    code: "L8",
    title: "Universal Infrastructure Exchange",
    status: "roadmap",
    blurb: "Everything on one exchange — the market the entire machine economy settles through.",
    points: [
      "Amazon, Google, NVIDIA, Cloudflare alongside Filecoin, Akash & decentralized networks",
      "A global market for energy, compute, storage, bandwidth, APIs, datasets & model access",
      "Unified pricing across centralized and decentralized supply",
    ],
    Illo: ExchangeIllo,
  },
  {
    phase: "The Final Layer",
    code: "∞",
    title: "Intelligence Futures",
    status: "roadmap",
    blurb:
      "Not compute. Outcomes. Trade cognitive labor itself as a financial primitive.",
    points: [
      '"I need 10 million legal documents processed" — buy a futures contract',
      '"I need 100,000 hours of medical reasoning" — hedge the cost',
      '"I need 1 billion video generations" — lock the price today',
      "Machines become full economic actors — hedging, borrowing, lending, insuring",
      "AUTON becomes the CME + Nasdaq + Bloomberg Terminal for the autonomous economy",
    ],
    Illo: IntelligenceIllo,
  },
];

const RAIL: { code: string; label: string; status: Status }[] = [
  { code: "L2", label: "Futures", status: "live" },
  { code: "L3", label: "Curves", status: "live" },
  { code: "L4", label: "Options", status: "live" },
  { code: "L5", label: "Indexes", status: "next" },
  { code: "L6", label: "Agents", status: "roadmap" },
  { code: "L7", label: "iUSD", status: "roadmap" },
  { code: "L8", label: "Exchange", status: "roadmap" },
  { code: "∞", label: "Minds", status: "roadmap" },
];

const TOKEN_POINTS = [
  "Collateral for every futures position",
  "Margin for every derivatives trade",
  "Staking with slashing for suppliers guaranteeing SLA",
  "Burns on every settlement, liquidation & premium",
  "Supply shrinks as the network grows",
  "Structurally priced into the expansion of AI compute",
];

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  live: {
    label: "Live",
    className: "border-[#80a0c1]/50 bg-[#80a0c1]/15 text-[#4f7299]",
  },
  next: {
    label: "Building next",
    className: "border-[#80a0c1]/40 bg-[#80a0c1]/[0.08] text-[#4f7299]",
  },
  roadmap: {
    label: "Roadmap",
    className: "border-black/15 bg-black/[0.02] text-black/45",
  },
};

/** Reveal-on-scroll wrapper. Falls back to visible without IntersectionObserver. */
function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`roadmap-reveal ${className ?? ""}`}>
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayerRail() {
  const nextIdx = RAIL.findIndex((r) => r.status === "next");

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
      <div className="flex min-w-[640px] items-start justify-between md:min-w-0">
        {RAIL.map((node, i) => {
          const live = node.status === "live";
          const next = node.status === "next";
          const connectorSolid = i < nextIdx;
          return (
            <div key={node.code} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span className="h-px flex-1" />
                <span
                  className={`pixel-serif flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm ${
                    live
                      ? "border-[#80a0c1] bg-[#80a0c1] text-white"
                      : next
                        ? "roadmap-pulse border-[#80a0c1] bg-white text-[#4f7299]"
                        : "border-black/15 bg-white text-black/40"
                  }`}
                >
                  {node.code}
                </span>
                {i < RAIL.length - 1 ? (
                  <svg className="h-2 flex-1" preserveAspectRatio="none" viewBox="0 0 40 2">
                    <line
                      x1="0"
                      y1="1"
                      x2="40"
                      y2="1"
                      stroke={connectorSolid ? "#80a0c1" : "rgba(0,0,0,0.18)"}
                      strokeWidth="2"
                      className={i === nextIdx - 1 ? "roadmap-dash" : undefined}
                      strokeDasharray={connectorSolid ? undefined : "3 4"}
                    />
                  </svg>
                ) : (
                  <span className="h-px flex-1" />
                )}
              </div>
              <span
                className={`pixel-sans mt-2 text-[11px] tracking-wide ${
                  live || next ? "text-[#4f7299]" : "text-black/40"
                }`}
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NodeMarker({ phase }: { phase: Phase }) {
  const { status, code } = phase;
  const live = status === "live";
  const next = status === "next";
  return (
    <span
      className={`pixel-serif flex h-11 w-11 items-center justify-center rounded-full border text-sm shadow-sm ${
        live
          ? "border-[#80a0c1] bg-[#80a0c1] text-white"
          : next
            ? "roadmap-pulse border-[#80a0c1] bg-white text-[#4f7299]"
            : "border-black/15 bg-white text-black/40"
      }`}
    >
      {live ? <CheckIcon /> : code}
    </span>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  const badge = STATUS_BADGE[phase.status];
  const muted = phase.status === "roadmap";
  const Illo = phase.Illo;

  return (
    <article
      className={`rounded-2xl border p-5 transition-colors md:p-6 ${
        phase.status === "live"
          ? "border-[#80a0c1]/40 bg-[#80a0c1]/[0.04]"
          : phase.status === "next"
            ? "border-[#80a0c1]/30 bg-white"
            : "border-black/10 bg-black/[0.015]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="pixel-sans text-[11px] tracking-widest text-black/40 uppercase">
          {phase.phase}
          {phase.layer ? (
            <span className="text-[#4f7299]"> · {phase.layer}</span>
          ) : null}
        </div>
        <span
          className={`pixel-sans inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-widest uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div
          className={`roadmap-float hidden h-16 w-24 shrink-0 sm:block ${
            muted ? "text-black/30" : "text-[#4f7299]"
          }`}
        >
          <Illo />
        </div>
        <div>
          <h3 className="pixel-serif text-xl text-black md:text-2xl">
            {phase.title}
          </h3>
          <p className="pixel-sans mt-1.5 text-sm text-black/60">{phase.blurb}</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {phase.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5">
            <span
              className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                muted ? "bg-black/25" : "bg-[#80a0c1]"
              }`}
            />
            <span className="pixel-sans text-sm text-black/70">{point}</span>
          </li>
        ))}
      </ul>

      {phase.highlight ? (
        <div className="pixel-sans mt-4 inline-flex items-center gap-2 rounded-lg border border-[#80a0c1]/40 bg-[#80a0c1]/[0.08] px-3 py-1.5 text-xs text-[#4f7299]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#80a0c1]" />
          {phase.highlight}
        </div>
      ) : null}
    </article>
  );
}

function PhaseRow({ phase, index }: { phase: Phase; index: number }) {
  const left = index % 2 === 0;
  return (
    <div className="relative pl-16 md:grid md:grid-cols-2 md:gap-x-16 md:pl-0">
      <div className="absolute left-6 top-7 z-10 -translate-x-1/2 md:left-1/2">
        <NodeMarker phase={phase} />
      </div>
      <Reveal
        className={
          left
            ? "md:col-span-1 md:col-start-1 md:row-start-1 md:pr-10"
            : "md:col-span-1 md:col-start-2 md:row-start-1 md:pl-10"
        }
      >
        <PhaseCard phase={phase} />
      </Reveal>
    </div>
  );
}

export function Roadmap() {
  return (
    <div className="relative bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <PixelBackground theme="light" variant="fine" />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/50 via-transparent to-white" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-10 text-center md:px-6 md:pt-20 md:pb-14">
          <span className="pixel-sans inline-flex items-center gap-2 rounded-full border border-[#80a0c1]/30 bg-[#80a0c1]/[0.08] px-4 py-1.5 text-[10px] tracking-widest text-[#4f7299] uppercase md:text-xs">
            Roadmap <span className="text-[#80a0c1]/50">//</span> The CME for Machine Resources
          </span>
          <h1 className="pixel-serif mx-auto mt-5 max-w-3xl text-4xl leading-[1.05] font-bold tracking-tight text-black md:text-6xl">
            Built layer by layer, in public, on Solana.
          </h1>
          <p className="pixel-sans mx-auto mt-4 max-w-2xl text-sm text-black/60 md:text-lg">
            The compute market needed a financial system. We are building it —
            from the first inference future to a universal exchange for the
            entire machine economy.
          </p>

          <div className="mt-10">
            <LayerRail />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative border-t border-black/10 py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="relative mx-auto max-w-5xl">
            {/* animated spine */}
            <div className="pointer-events-none absolute top-0 left-6 h-full w-px -translate-x-1/2 overflow-hidden bg-black/10 md:left-1/2">
              <div className="roadmap-comet absolute left-1/2 h-24 w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#80a0c1] to-transparent" />
            </div>

            <div className="flex flex-col gap-8 md:gap-14">
              {PHASES.map((phase, index) => (
                <PhaseRow key={phase.phase} phase={phase} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* $AUTO backbone */}
      <section className="relative overflow-hidden border-t border-white/10 bg-black py-16 text-white md:py-24">
        <div className="absolute inset-0 z-0 opacity-70">
          <PixelBackground theme="dark" variant="fine" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-6">
          <div className="max-w-2xl">
            <span className="pixel-sans text-xs tracking-widest text-[#80a0c1] uppercase">
              The token
            </span>
            <h2 className="pixel-serif mt-3 text-3xl md:text-4xl">
              <span className="dollar">$</span>AUTO — the economic backbone
            </h2>
            <p className="pixel-sans mt-4 text-sm text-white/60 md:text-base">
              Every layer above routes value through one asset. As the network
              expands, the sinks compound and supply shrinks.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {TOKEN_POINTS.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 bg-black px-5 py-5"
              >
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#80a0c1]" />
                <span className="pixel-sans text-sm text-white/80">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="relative border-t border-black/10 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="pixel-serif text-3xl text-black md:text-5xl">
            The compute market needed a financial system.
            <span className="block text-[#4f7299]">We are building it.</span>
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={`${TRADE_APP_URL}/trade`}
              className="pixel-sans inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85"
            >
              Trade the live layers
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-sans inline-flex items-center justify-center rounded-xl border border-black/15 px-6 py-3 text-sm font-medium text-black transition-colors hover:border-black/30"
            >
              Read the Docs
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
