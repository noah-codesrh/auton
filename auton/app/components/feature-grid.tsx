import type { ReactNode } from "react";
import { TRADE_APP_URL } from "../lib/site-urls";
import {
  EarnYieldIllustration,
  GuaranteeCapacityIllustration,
  HedgeVolatilityIllustration,
  OnChainMarketsIllustration,
} from "./feature-illustrations";

const FEATURES = [
  {
    title: "Hedge Volatility",
    description:
      "Lock in compute prices with futures and options. Protect workloads from spot market swings and budget with certainty.",
    large: true,
    colSpan: "col-span-3",
    illustration: <HedgeVolatilityIllustration />,
  },
  {
    title: "Guarantee Capacity",
    description:
      "Reserve GPU hours on decentralized networks. Capacity commitments ensure your jobs run when you need them.",
    large: false,
    colSpan: "col-span-2",
    illustration: <GuaranteeCapacityIllustration />,
  },
  {
    title: "On-Chain Markets",
    description: "No intermediaries. Trade compute derivatives directly from your wallet.",
    large: false,
    colSpan: "col-span-2",
    illustration: <OnChainMarketsIllustration />,
  },
  {
    title: "Earn Yield",
    description:
      "Provide liquidity to compute derivatives markets. Earn fees and staking rewards in stablecoins.",
    large: true,
    colSpan: "col-span-3",
    illustration: <EarnYieldIllustration />,
  },
] as const;

function FeatureCard({
  title,
  description,
  large,
  illustration,
  className = "",
}: {
  title: string;
  description: string;
  large: boolean;
  illustration: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] transition-colors hover:bg-black/[0.04] ${large ? "p-8" : "p-6"} ${className}`}
    >
      <h3 className={`pixel-serif text-black ${large ? "text-2xl md:text-3xl" : "text-xl"}`}>
        {title}
      </h3>
      <p className={`pixel-sans text-sm text-black/70 ${large ? "mt-3" : "mt-2"}`}>
        {description}
      </p>
      <div className="mt-4 flex flex-1 items-center justify-center invert">{illustration}</div>
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section id="markets" className="bg-white py-12 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="pixel-serif text-3xl text-black md:text-4xl">
              Compute derivatives
            </h2>
            <p className="pixel-sans mt-3 max-w-xl text-sm text-black/60">
              Trade forward contracts and capacity commitments on-chain.
            </p>
          </div>
          <a
            href={TRADE_APP_URL}
            className="pixel-sans text-sm text-[#4f7299] transition-colors hover:text-[#4f7299]/80"
          >
            Open marketplace →
          </a>
        </div>
        <div className="flex flex-col gap-4 md:hidden">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-black/10 bg-black/[0.02] p-6"
            >
              <h3 className="pixel-serif text-xl text-black">{feature.title}</h3>
              <p className="pixel-sans mt-2 text-sm text-black/70">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="hidden h-[750px] grid-cols-5 grid-rows-2 gap-4 md:grid">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} className={feature.colSpan} />
          ))}
        </div>
      </div>
    </section>
  );
}
