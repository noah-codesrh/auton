import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useIndexes } from "../hooks/use-indexes";
import type { IndexConstituent, IndexSeries } from "../lib/api/indexes";
import { IndexChart } from "./index-chart";

function fmtLevel(series: Pick<IndexSeries, "unit">, value: number): string {
  if (series.unit === "idx") return value.toFixed(2);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtConstituent(c: IndexConstituent): string {
  if (c.value === null) return "—";
  if (c.unit === "$/M") return `$${c.value.toFixed(c.value < 1 ? 4 : 2)}/M`;
  if (c.unit === "$") return `$${c.value.toFixed(2)}`;
  return c.value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function ChangeBadge({ pct, abs, unit }: { pct: number; abs: number; unit: string }) {
  const up = pct >= 0;
  const absStr = unit === "idx" ? Math.abs(abs).toFixed(2) : Math.abs(abs).toFixed(1);
  return (
    <span
      className={`pixel-mono inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {up ? "▲" : "▼"} {up ? "+" : "−"}
      {absStr} ({up ? "+" : "−"}
      {Math.abs(pct).toFixed(2)}%)
    </span>
  );
}

function IndexSummaryCard({
  series,
  active,
  onSelect,
}: {
  series: IndexSeries;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${
        active
          ? "border-black/30 bg-black/[0.03] shadow-sm"
          : "border-black/10 bg-white hover:border-black/25"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="pixel-serif text-sm tracking-wide text-black">{series.symbol}</span>
        <ChangeBadge pct={series.changePercent} abs={series.changeAbs} unit={series.unit} />
      </div>
      <div className="pixel-mono text-2xl text-black">{fmtLevel(series, series.level)}</div>
      <div className="pixel-sans text-[11px] text-black/45">{series.tagline}</div>
    </button>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
      <div className="pixel-sans text-xs text-black/45">{label}</div>
      <div className="pixel-serif mt-1 text-xl text-black">{value}</div>
      {sub && <div className="pixel-sans mt-0.5 text-[11px] text-black/40">{sub}</div>}
    </div>
  );
}

function Constituents({ series }: { series: IndexSeries }) {
  const title =
    series.id === "INF100"
      ? "Constituents · by volume weight"
      : series.id === "GPU500"
        ? "Networks · by supply weight"
        : "Cost basket · by share";

  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex items-baseline justify-between border-b border-black/10 px-5 py-3">
        <h2 className="pixel-serif text-lg text-black">{title}</h2>
        <span className="pixel-sans text-xs text-black/40">
          {series.id === "INF100" ? "live $/M" : series.id === "AGENT_CPI" ? "USD / period" : "index pts"}
        </span>
      </div>
      <div className="flex flex-col divide-y divide-black/5">
        {series.constituents.map((c) => (
          <div key={c.key} className="flex items-center gap-3 px-5 py-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="pixel-sans w-28 shrink-0 truncate text-sm text-black">{c.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, c.weightPercent)}%`, backgroundColor: c.color }}
              />
            </div>
            <span className="pixel-mono w-12 shrink-0 text-right text-xs text-black/50">
              {c.weightPercent.toFixed(1)}%
            </span>
            <span className="pixel-mono w-20 shrink-0 text-right text-xs text-black">
              {fmtConstituent(c)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IndexesPage() {
  const { data, indexes, loading, error } = useIndexes();
  const syncedAt = data?.syncedAt ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && indexes.length > 0) setSelectedId(indexes[0].id);
  }, [indexes, selectedId]);

  const series = useMemo(
    () => indexes.find((s) => s.id === selectedId) ?? indexes[0] ?? null,
    [indexes, selectedId],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="pixel-sans rounded-full border border-[#80a0c1]/30 bg-[#80a0c1]/[0.08] px-2.5 py-1 text-[11px] tracking-wider text-[#4f7299] uppercase">
            Layer 5
          </span>
          {loading && indexes.length > 0 && (
            <span className="pixel-sans text-xs text-black/40">Updating…</span>
          )}
        </div>
        <h1 className="pixel-serif text-3xl text-black md:text-4xl">Indexes</h1>
        <p className="pixel-sans mt-2 max-w-2xl text-sm text-black/60 md:text-base">
          Benchmarks for the machine economy, computed live from the{" "}
          <Link to="/yield-curve" className="text-[#4f7299] underline-offset-2 hover:underline">
            futures market
          </Link>{" "}
          underneath AUTON — the S&amp;P 500 of AI compute, a GPU supply index,
          and the inflation index of autonomous agents.
        </p>
      </header>

      {error && indexes.length === 0 ? (
        <div className="pixel-sans rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : loading && indexes.length === 0 ? (
        <div className="pixel-sans flex h-[420px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
          Computing indexes…
        </div>
      ) : series ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {indexes.map((s) => (
              <IndexSummaryCard
                key={s.id}
                series={s}
                active={s.id === series.id}
                onSelect={() => setSelectedId(s.id)}
              />
            ))}
          </div>

          <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <h2 className="pixel-serif text-lg text-black">
                    {series.name}{" "}
                    <span className="pixel-mono text-sm text-black/40">{series.symbol}</span>
                  </h2>
                  <p className="pixel-sans text-xs text-black/45">{series.tagline}</p>
                </div>
                <div className="text-right">
                  <div className="pixel-mono text-2xl text-black">
                    {fmtLevel(series, series.level)}
                  </div>
                  <ChangeBadge pct={series.changePercent} abs={series.changeAbs} unit={series.unit} />
                </div>
              </div>
              <IndexChart
                history={series.history}
                color="#4f7299"
                fmtValue={(v) => fmtLevel(series, v)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <StatTile label="Level" value={fmtLevel(series, series.level)} sub={`base ${series.base}`} />
              <StatTile
                label="Session high"
                value={fmtLevel(series, series.high)}
                sub={`low ${fmtLevel(series, series.low)}`}
              />
              <StatTile
                label="Change"
                value={`${series.changePercent >= 0 ? "+" : ""}${series.changePercent.toFixed(2)}%`}
                sub="vs window open"
              />
            </div>
          </section>

          <section className="mb-6">
            <Constituents series={series} />
          </section>

          <section className="mb-8 rounded-2xl border border-black/10 bg-black/[0.02] p-5">
            <h3 className="pixel-serif text-sm text-black">About {series.symbol}</h3>
            <p className="pixel-sans mt-1.5 text-sm text-black/60">{series.description}</p>
          </section>

          <div className="pixel-sans mt-2 flex flex-wrap items-center gap-4 text-sm">
            <Link
              to="/derivatives"
              className="rounded-xl border border-black/15 px-5 py-3 text-black hover:bg-black/[0.03]"
            >
              Options desk
            </Link>
            <Link
              to="/yield-curve"
              className="rounded-xl border border-black/15 px-5 py-3 text-black hover:bg-black/[0.03]"
            >
              View the yield curve
            </Link>
            {syncedAt && (
              <span className="text-xs text-black/40">
                Spot synced {new Date(syncedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <p className="pixel-sans mt-6 text-[11px] leading-relaxed text-black/35">
            Indexes are computed live from AUTON's futures market and price
            engine — INF100 is volume-weighted across model families, GPU500
            models decentralized supply health from clearing prices, and AGENT
            CPI tracks a fixed compute-plus-infra basket. Read-only analytics for
            now; not yet tradeable assets.
          </p>
        </>
      ) : (
        <div className="pixel-sans flex h-[300px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
          No indexes available yet.
        </div>
      )}
    </main>
  );
}
