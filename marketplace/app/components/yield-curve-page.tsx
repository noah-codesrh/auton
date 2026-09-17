import { useMemo } from "react";
import { Link } from "react-router";
import { formatRatePerM } from "../config/marketplace";
import { useYieldCurve } from "../hooks/use-yield-curve";
import type { CurveShape, ModelCurve } from "../lib/api/curve";
import { YieldCurveChart } from "./yield-curve-chart";

const SHAPE_STYLES: Record<CurveShape, { label: string; className: string }> = {
  backwardation: {
    label: "Backwardation",
    className: "bg-emerald-50 text-emerald-700",
  },
  contango: { label: "Contango", className: "bg-amber-50 text-amber-700" },
  flat: { label: "Flat", className: "bg-black/[0.05] text-black/55" },
  unknown: { label: "—", className: "bg-black/[0.05] text-black/40" },
};

function signedPercent(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function percentToneClass(value: number | null): string {
  if (value === null) return "text-black/40";
  if (value < 0) return "text-emerald-700";
  if (value > 0) return "text-amber-700";
  return "text-black/55";
}

function CurveCard({ curve }: { curve: ModelCurve }) {
  const shape = SHAPE_STYLES[curve.shape];

  return (
    <article className="flex flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: curve.color }}
          />
          <h3 className="pixel-serif text-xl text-black">{curve.label}</h3>
        </div>
        <span
          className={`pixel-sans rounded-full px-2.5 py-1 text-[11px] ${shape.className}`}
        >
          {shape.label}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/[0.03] p-3">
          <div className="pixel-sans flex items-center gap-1.5 text-xs text-black/45">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Spot now
          </div>
          <div className="pixel-serif mt-1 text-lg text-black">
            {formatRatePerM(curve.spot)}
          </div>
        </div>
        <div className="rounded-xl bg-black/[0.03] p-3">
          <div className="pixel-sans text-xs text-black/45">
            Locked · {curve.expiryLabel}
          </div>
          <div className="pixel-serif mt-1 text-lg text-black">
            {formatRatePerM(curve.locked)}
          </div>
        </div>
      </div>

      <div className="pixel-sans flex items-center justify-between border-t border-black/5 pt-3 text-sm">
        <div>
          <div className="text-xs text-black/45">Basis</div>
          <div className={percentToneClass(curve.basisPercent)}>
            {signedPercent(curve.basisPercent)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-black/45">Annualized</div>
          <div className={percentToneClass(curve.annualizedPercent)}>
            {signedPercent(curve.annualizedPercent)}
          </div>
        </div>
      </div>
    </article>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
      <div className="pixel-sans text-xs text-black/45">{label}</div>
      <div className="pixel-serif mt-1 text-xl text-black">{value}</div>
    </div>
  );
}

export function YieldCurvePage() {
  const { data, curves, loading, error } = useYieldCurve();
  const syncedAt = data?.syncedAt ?? null;

  const stats = useMemo(() => {
    const withBasis = curves.filter((c) => c.annualizedPercent !== null);
    const contango = curves.filter((c) => c.shape === "contango").length;
    const backwardation = curves.filter(
      (c) => c.shape === "backwardation",
    ).length;
    const avgAnnualized =
      withBasis.length > 0
        ? withBasis.reduce((sum, c) => sum + (c.annualizedPercent ?? 0), 0) /
          withBasis.length
        : null;
    return { contango, backwardation, avgAnnualized, total: curves.length };
  }, [curves]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="pixel-sans rounded-full border border-[#80a0c1]/30 bg-[#80a0c1]/[0.08] px-2.5 py-1 text-[11px] tracking-wider text-[#4f7299] uppercase">
            Layer 3
          </span>
          {loading && curves.length > 0 && (
            <span className="pixel-sans text-xs text-black/40">Updating…</span>
          )}
        </div>
        <h1 className="pixel-serif text-3xl text-black md:text-4xl">
          Yield Curve
        </h1>
        <p className="pixel-sans mt-2 max-w-2xl text-sm text-black/60 md:text-base">
          The term structure of AI compute — what the market prices inference at
          across expiries, built live from the futures market. An upward slope
          (contango) means future compute is priced above today; a downward
          slope (backwardation) means it's cheaper.
        </p>
      </header>

      {error && curves.length === 0 ? (
        <div className="pixel-sans rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : loading && curves.length === 0 ? (
        <div className="pixel-sans flex h-[420px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
          Loading the curve…
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Models" value={String(stats.total)} />
            <StatTile label="In backwardation" value={String(stats.backwardation)} />
            <StatTile label="In contango" value={String(stats.contango)} />
            <StatTile
              label="Avg annualized basis"
              value={
                stats.avgAnnualized !== null
                  ? `${stats.avgAnnualized > 0 ? "+" : ""}${stats.avgAnnualized.toFixed(1)}%`
                  : "—"
              }
            />
          </div>

          <section className="mb-8 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="pixel-serif text-lg text-black">
                Compute price · $/M tokens
              </h2>
              <span className="pixel-sans text-xs text-black/40">
                time to expiry →
              </span>
            </div>
            <YieldCurveChart curves={curves} />
          </section>

          <section>
            <h2 className="pixel-serif mb-4 text-lg text-black">By model</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {curves.map((curve) => (
                <CurveCard key={curve.tier} curve={curve} />
              ))}
            </div>
          </section>

          <div className="pixel-sans mt-8 flex flex-wrap items-center gap-4 text-sm">
            <Link
              to="/"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-500"
            >
              Lock a rate
            </Link>
            <Link
              to="/trade"
              className="rounded-xl border border-black/15 px-5 py-3 text-black hover:bg-black/[0.03]"
            >
              Trade the curve
            </Link>
            {syncedAt && (
              <span className="text-xs text-black/40">
                Spot synced {new Date(syncedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </>
      )}
    </main>
  );
}
