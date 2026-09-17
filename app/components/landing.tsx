import { TRADE_APP_URL } from "../lib/site-urls";
import { AutoTokenSection } from "./auto-token-section";
import { FeatureGrid } from "./feature-grid";
import { Footer } from "./footer";
import { PixelBackground } from "./pixel-background";
import { ProtocolLayers } from "./protocol-layers";
import { TokenAddress } from "./token-address";

const HERO_STATS = [
  { value: "L2", label: "Live layer — Futures" },
  { value: "8", label: "Modular market layers" },
  { value: "100%", label: "On-chain on Solana" },
  { value: "$AUTO", label: "Burned from settlement" },
];

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Landing() {
  return (
    <div className="relative bg-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <PixelBackground theme="light" />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/40 via-transparent to-white" />

        <div className="relative z-10 flex min-h-screen flex-col lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center px-4 pt-28 pb-12 md:px-6 lg:py-24 lg:pr-12 lg:pl-[max(1.5rem,calc((100vw-72rem)/2))]">
            <div className="mx-auto w-full max-w-xl space-y-7 text-center lg:mx-0 lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <span className="pixel-sans inline-flex items-center gap-2 rounded-full border border-[#80a0c1]/30 bg-[#80a0c1]/[0.08] px-4 py-1.5 text-[10px] tracking-widest text-[#4f7299] uppercase md:text-xs">
                  Auton Layer 2 <span className="text-[#80a0c1]/50">//</span> The
                  Liquidity Venue for the Machine Economy
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="pixel-serif text-4xl leading-[1.05] font-bold tracking-tight text-black md:text-6xl">
                  The CME for Machine Resources.
                </h1>
                <p className="pixel-sans mx-auto max-w-2xl text-sm text-black/70 lg:mx-0 md:text-lg">
                  Trade, hedge, and secure the future resources of AI directly
                  from your wallet on Robinhood Chain. Lock in inference rates,
                  speculate on capacity volatility, and earn yield from
                  settlement activity.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <a
                  href={`${TRADE_APP_URL}/trade`}
                  className="pixel-sans inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85"
                >
                  Trade Futures
                  <ArrowIcon />
                </a>
                <a
                  href={`${TRADE_APP_URL}/chat`}
                  className="pixel-sans inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 px-6 py-3 text-sm font-medium text-black transition-colors hover:border-black/30"
                >
                  Try Chat
                  <ArrowIcon />
                </a>
              </div>

              <div className="flex justify-center lg:justify-start">
                <TokenAddress variant="light" />
              </div>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-4 lg:grid-cols-2">
                {HERO_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col gap-1 bg-white px-4 py-4 text-center lg:text-left"
                  >
                    <span className="pixel-serif text-2xl text-black md:text-3xl">
                      {stat.value}
                    </span>
                    <span className="pixel-sans text-[11px] tracking-wide text-black/50 md:text-xs">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-[56%] lg:flex-shrink-0">
            <div
              className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(128,160,193,0.25),transparent_70%)]"
              aria-hidden
            />
            <div className="relative z-10 overflow-hidden border-y border-black/10 bg-white shadow-2xl shadow-black/10 lg:rounded-l-3xl lg:border lg:border-r-0">
              <img
                src="/hero-section.jpg"
                alt="Auton futures trading terminal showing the order book, mark price, and $AUTO collateral controls"
                width={1024}
                height={543}
                loading="eager"
                className="block w-full"
              />
            </div>
          </div>
        </div>

      </section>

      <ProtocolLayers />

      <FeatureGrid />

      <AutoTokenSection />

      <Footer />
    </div>
  );
}
