import { Link } from "react-router";
import type { CurveShape, ModelCurve } from "../lib/api/curve";
import { formatRatePerM } from "../config/marketplace";

const W = 268;
const H = 132;
const M = { top: 12, right: 12, bottom: 22, left: 40 };

const SHAPE_STYLES: Record<CurveShape, { label: string; className: string }> = {
  backwardation: {
    label: "Backwardation",
    className: "bg-emerald-50 text-emerald-700",
  },
  contango: { label: "Contango", className: "bg-amber-50 text-amber-700" },
  flat: { label: "Flat", className: "bg-black/[0.05] text-black/55" },
  unknown: { label: "—", className: "bg-black/[0.05] text-black/40" },
};

function fmtRate(rate: number): string {
  return `$${rate.toFixed(rate < 1 ? 3 : 2)}`;
}

function signedPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function toneClass(value: number | null): string {
  if (value === null) return "text-black/40";
  if (value < 0) return "text-emerald-700";
  if (value > 0) return "text-amber-700";
  return "text-black/55";
}

/** Compact single-model term-structure sparkline for the trading terminal. */
export function MiniYieldCurve({
  curve,
  loading,
}: {
  curve: ModelCurve | null;
  loading: boolean;
}) {
  if (!curve) {
    return (
      <div className="pixel-sans p-4 text-center text-xs text-black/40">
        {loading ? "Loading curve…" : "No curve for this market."}
      </div>
    );
  }

  const pts = curve.points;
  const shape = SHAPE_STYLES[curve.shape];

  const dates = pts.map((p) => p.date);
  const rates = pts.map((p) => p.rate);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const pad = (maxRate - minRate) * 0.18 || maxRate * 0.08 || 0.01;
  const lo = Math.max(0, minRate - pad);
  const hi = maxRate + pad;

  const dateSpan = maxDate - minDate || 1;
  const rateSpan = hi - lo || 1;
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const xFor = (d: number) => M.left + ((d - minDate) / dateSpan) * plotW;
  const yFor = (r: number) => M.top + (1 - (r - lo) / rateSpan) * plotH;

  const path = pts
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xFor(p.date).toFixed(1)} ${yFor(p.rate).toFixed(1)}`,
    )
    .join(" ");

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: curve.color }}
          />
          <span className="pixel-sans text-xs font-medium text-black">
            {curve.label}
          </span>
        </span>
        <span
          className={`pixel-sans rounded-full px-2 py-0.5 text-[10px] ${shape.className}`}
        >
          {shape.label}
        </span>
      </div>

      <svg width={W} height={H} className="block" role="img" aria-label={`${curve.label} yield curve`}>
        <line
          x1={M.left}
          y1={H - M.bottom}
          x2={W - M.right}
          y2={H - M.bottom}
          stroke="#e5e7eb"
        />
        <text x={M.left - 6} y={M.top + 4} textAnchor="end" fontSize={9} fill="#9ca3af" className="pixel-sans">
          {fmtRate(hi)}
        </text>
        <text x={M.left - 6} y={H - M.bottom} textAnchor="end" fontSize={9} fill="#9ca3af" className="pixel-sans">
          {fmtRate(lo)}
        </text>
        <path
          d={path}
          fill="none"
          stroke={curve.color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p) => (
          <g key={p.date}>
            <circle
              cx={xFor(p.date)}
              cy={yFor(p.rate)}
              r={p.real ? 3 : 1.8}
              fill={p.real ? curve.color : "#ffffff"}
              stroke={curve.color}
              strokeWidth={1.4}
            />
            <text
              x={xFor(p.date)}
              y={H - M.bottom + 14}
              textAnchor="middle"
              fontSize={8.5}
              fill="#9ca3af"
              className="pixel-sans"
            >
              {p.tenorLabel}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-black/[0.03] px-2.5 py-1.5">
          <div className="pixel-sans text-[10px] text-black/45">Spot now</div>
          <div className="pixel-mono text-xs text-black">
            {formatRatePerM(curve.spot)}
          </div>
        </div>
        <div className="rounded-lg bg-black/[0.03] px-2.5 py-1.5">
          <div className="pixel-sans text-[10px] text-black/45">
            Locked · {curve.expiryLabel}
          </div>
          <div className="pixel-mono text-xs text-black">
            {formatRatePerM(curve.locked)}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 pixel-sans text-[11px]">
        <span className="text-black/45">
          Basis{" "}
          <span className={`pixel-mono ${toneClass(curve.basisPercent)}`}>
            {signedPercent(curve.basisPercent)}
          </span>
        </span>
        <span className="text-black/45">
          Annualized{" "}
          <span className={`pixel-mono ${toneClass(curve.annualizedPercent)}`}>
            {signedPercent(curve.annualizedPercent)}
          </span>
        </span>
      </div>

      <Link
        to="/yield-curve"
        className="pixel-sans mt-2 block rounded-lg border border-black/15 py-1.5 text-center text-[11px] text-black/60 hover:border-black/30 hover:text-black"
      >
        Open full curve →
      </Link>
    </div>
  );
}
