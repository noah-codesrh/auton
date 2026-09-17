import { type ReactNode } from "react";
import { autoTreasuryConfig } from "../config/auto-treasury";
import { useTreasury } from "../hooks/use-treasury";
import {
  formatCompactNumber,
  formatPercent,
  formatTokenCount,
  formatUsd,
} from "../lib/treasury/format";
import { PixelBackground } from "./pixel-background";
import { TreasuryAreaChart } from "./treasury-area-chart";

function StatCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function TreasuryPage() {
  const { data, loading } = useTreasury();
  const { stats, lockedHistory } = data;

  return (
    <div className="relative min-h-screen bg-white">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <PixelBackground variant="fine" />
      </div>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="pixel-serif text-3xl text-black md:text-4xl">
            Treasury
          </h1>
          <p className="pixel-sans mt-4 max-w-3xl text-sm leading-relaxed text-black/60 md:text-base">
            100% of the compute margin and a share of{" "}
            <span className="dollar">$</span>AUTO trading fees flow into this
            treasury. Half funds buybacks; half is paid to stakers in USDC.{" "}
            <span className="dollar">$</span>AUTO supply is locked on-chain via{" "}
            <a
              href={autoTreasuryConfig.streamflowLockUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#80a0c1] hover:underline"
            >
              Streamflow
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <StatCard className="border-emerald-600/20 bg-emerald-600/[0.04]">
            <div className="pixel-serif text-3xl text-emerald-700 md:text-4xl">
              {loading ? "..." : formatTokenCount(stats.totalLocked)}
            </div>
            <div className="pixel-sans mt-2 text-sm text-black/70">
              <span className="dollar">$</span>AUTO locked on Streamflow
            </div>
            <div className="pixel-sans mt-1 text-xs text-emerald-700/80">
              {loading
                ? "..."
                : `${formatPercent(stats.lockedSupplyPercent, 1)} of supply locked`}
            </div>
            <a
              href={autoTreasuryConfig.streamflowLockUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-sans mt-3 inline-block text-xs text-[#80a0c1] hover:underline"
            >
              View lock contract →
            </a>
          </StatCard>

          <StatCard>
            <div className="pixel-serif text-3xl text-black md:text-4xl">
              {loading ? "..." : formatUsd(stats.buybacksUsdcCompleted)}
            </div>
            <div className="pixel-sans mt-2 text-sm text-black/70">
              buybacks USDC completed
            </div>
            <div className="pixel-sans mt-1 text-xs text-black/45">
              {loading
                ? "..."
                : `${stats.buybackCount} buyback${stats.buybackCount === 1 ? "" : "s"} executed`}
            </div>
          </StatCard>

          <StatCard>
            <div className="pixel-serif text-3xl text-black/40 md:text-4xl">
              —
            </div>
            <div className="pixel-sans mt-2 text-sm text-black/70">
              <span className="dollar">$</span>AUTO staked
            </div>
            <div className="pixel-sans mt-1 text-xs text-black/45">
              coming soon
            </div>
          </StatCard>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          <StatCard>
            <div className="mb-4">
              <div className="pixel-sans text-xs uppercase tracking-wide text-black/45">
                Cumulative locked
              </div>
              <div className="pixel-serif mt-1 text-2xl text-black">
                {loading
                  ? "..."
                  : `${formatCompactNumber(stats.totalLocked)} AUTO`}
              </div>
              <div className="pixel-sans mt-1 text-xs text-black/45">
                {loading
                  ? "..."
                  : `locked via Streamflow · ${formatPercent(stats.lockedSupplyPercent, 1)} of supply`}
              </div>
            </div>
            <TreasuryAreaChart
              data={lockedHistory}
              color="#059669"
              gradientId="treasury-locked-gradient"
              stepped
              theme="light"
            />
          </StatCard>

          <StatCard>
            <div className="mb-4">
              <div className="pixel-sans text-xs uppercase tracking-wide text-black/45">
                <span className="dollar">$</span>AUTO stake over time
              </div>
              <div className="pixel-serif mt-1 text-2xl text-black/40">
                Coming soon
              </div>
              <div className="pixel-sans mt-1 text-xs text-black/45">
                Staking rewards and charts launch with the Streamflow stake pool
              </div>
            </div>
            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-black/12 bg-black/[0.02]">
              <span className="pixel-sans text-sm text-black/35">
                (coming soon)
              </span>
            </div>
          </StatCard>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <StatCard>
            <div className="pixel-serif text-2xl text-black md:text-3xl">
              {loading ? "..." : formatUsd(stats.buybackSpendUsdc)}
            </div>
            <div className="pixel-sans mt-2 text-sm text-black/50">
              spent on buybacks
            </div>
          </StatCard>

          <StatCard>
            <div className="pixel-serif text-2xl text-black/40 md:text-3xl">
              —
            </div>
            <div className="pixel-sans mt-2 text-sm text-black/50">
              paid to stakers
            </div>
            <div className="pixel-sans mt-1 text-xs text-black/40">
              coming soon
            </div>
          </StatCard>

          <StatCard>
            <div className="pixel-serif text-2xl text-black md:text-3xl">
              {loading ? "..." : formatUsd(stats.settlementFeesUsdc)}
            </div>
            <div className="pixel-sans mt-2 text-sm text-black/50">
              settlement fees collected
            </div>
          </StatCard>
        </div>
      </main>
    </div>
  );
}
