import { useEffect, useMemo, useRef, useState } from "react";
import {
  curveBounds,
  rateAtDate,
  type ModelCurve,
} from "../lib/yield-curve";

const HEIGHT = 380;
const MARGIN = { top: 18, right: 18, bottom: 38, left: 56 };

function formatRate(rate: number): string {
  return `$${rate.toFixed(rate < 1 ? 3 : 2)}`;
}

function monthTicks(minDate: number, maxDate: number): number[] {
  const ticks: number[] = [];
  const start = new Date(minDate);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const cursor = new Date(start);
  // Step month-by-month from the first month boundary to just past maxDate.
  while (cursor.getTime() <= maxDate) {
    if (cursor.getTime() >= minDate) ticks.push(cursor.getTime());
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return ticks.length > 0 ? ticks : [minDate, maxDate];
}

function formatMonth(ms: number): string {
  const d = new Date(ms);
  const month = d.toLocaleDateString(undefined, { month: "short" });
  return d.getMonth() === 0 ? `${month} '${String(d.getFullYear()).slice(2)}` : month;
}

export function YieldCurveChart({ curves }: { curves: ModelCurve[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(820);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visible = useMemo(
    () => curves.filter((c) => !hidden.has(c.tier)),
    [curves, hidden],
  );

  const bounds = useMemo(
    () => curveBounds(visible.length > 0 ? visible : curves),
    [visible, curves],
  );

  const plotW = Math.max(1, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const scales = useMemo(() => {
    if (!bounds) return null;
    const dateSpan = bounds.maxDate - bounds.minDate || 1;
    const rateSpan = bounds.maxRate - bounds.minRate || 1;
    const xFor = (date: number) =>
      MARGIN.left + ((date - bounds.minDate) / dateSpan) * plotW;
    const yFor = (rate: number) =>
      MARGIN.top + (1 - (rate - bounds.minRate) / rateSpan) * plotH;
    return { xFor, yFor, dateSpan };
  }, [bounds, plotW, plotH]);

  const yTicks = useMemo(() => {
    if (!bounds) return [];
    const count = 5;
    const step = (bounds.maxRate - bounds.minRate) / count;
    return Array.from({ length: count + 1 }, (_, i) => bounds.minRate + step * i);
  }, [bounds]);

  if (!bounds || !scales) {
    return (
      <div className="pixel-sans flex h-[380px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
        No curve data yet.
      </div>
    );
  }

  const hoverDate =
    hoverX !== null
      ? bounds.minDate +
        ((Math.min(Math.max(hoverX, MARGIN.left), MARGIN.left + plotW) -
          MARGIN.left) /
          plotW) *
          scales.dateSpan
      : null;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverX(e.clientX - rect.left);
  };

  const toggle = (tier: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const hoverReadouts =
    hoverDate !== null
      ? visible
          .map((curve) => ({ curve, rate: rateAtDate(curve, hoverDate) }))
          .filter((r): r is { curve: ModelCurve; rate: number } => r.rate !== null)
          .sort((a, b) => b.rate - a.rate)
      : [];

  const hoverPx = hoverDate !== null ? scales.xFor(hoverDate) : null;
  const tooltipLeft =
    hoverPx !== null ? Math.min(Math.max(hoverPx + 12, 8), width - 168) : 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        className="block touch-none"
        onPointerMove={handlePointer}
        onPointerLeave={() => setHoverX(null)}
        role="img"
        aria-label="Yield curve of AI compute price per million tokens across expiries"
      >
        {/* y gridlines + labels */}
        {yTicks.map((rate) => {
          const y = scales.yFor(rate);
          return (
            <g key={`y-${rate}`}>
              <line
                x1={MARGIN.left}
                y1={y}
                x2={width - MARGIN.right}
                y2={y}
                stroke="#f1f1f1"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="#9ca3af"
                className="pixel-sans"
              >
                {formatRate(rate)}
              </text>
            </g>
          );
        })}

        {/* x month ticks */}
        {monthTicks(bounds.minDate, bounds.maxDate).map((ms) => {
          const x = scales.xFor(ms);
          return (
            <text
              key={`x-${ms}`}
              x={x}
              y={HEIGHT - MARGIN.bottom + 18}
              textAnchor="middle"
              fontSize={10}
              fill="#9ca3af"
              className="pixel-sans"
            >
              {formatMonth(ms)}
            </text>
          );
        })}

        {/* axes */}
        <line
          x1={MARGIN.left}
          y1={HEIGHT - MARGIN.bottom}
          x2={width - MARGIN.right}
          y2={HEIGHT - MARGIN.bottom}
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        {/* hover crosshair */}
        {hoverPx !== null && (
          <line
            x1={hoverPx}
            y1={MARGIN.top}
            x2={hoverPx}
            y2={HEIGHT - MARGIN.bottom}
            stroke="#d1d5db"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* curves */}
        {visible.map((curve) => {
          const path = curve.points
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${scales.xFor(p.date).toFixed(1)} ${scales
                  .yFor(p.rate)
                  .toFixed(1)}`,
            )
            .join(" ");
          return (
            <g key={curve.tier}>
              <path
                d={path}
                fill="none"
                stroke={curve.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {curve.points.map((p) => (
                <circle
                  key={`${curve.tier}-${p.date}`}
                  cx={scales.xFor(p.date)}
                  cy={scales.yFor(p.rate)}
                  r={p.real ? 3.5 : 2}
                  fill={p.real ? curve.color : "#ffffff"}
                  stroke={curve.color}
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}

        {/* hover dots */}
        {hoverDate !== null &&
          hoverReadouts.map(({ curve, rate }) => (
            <circle
              key={`hover-${curve.tier}`}
              cx={scales.xFor(hoverDate)}
              cy={scales.yFor(rate)}
              r={3}
              fill={curve.color}
            />
          ))}
      </svg>

      {/* hover tooltip */}
      {hoverDate !== null && hoverReadouts.length > 0 && (
        <div
          className="pixel-sans pointer-events-none absolute top-4 z-10 w-40 rounded-lg border border-black/10 bg-white/95 p-2 text-xs shadow-md backdrop-blur-sm"
          style={{ left: tooltipLeft }}
        >
          <div className="mb-1 text-[11px] text-black/45">
            {new Date(hoverDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          {hoverReadouts.map(({ curve, rate }) => (
            <div
              key={curve.tier}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: curve.color }}
                />
                <span className="text-black/60">{curve.label}</span>
              </span>
              <span className="text-black">{formatRate(rate)}/M</span>
            </div>
          ))}
        </div>
      )}

      {/* legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {curves.map((curve) => {
          const isHidden = hidden.has(curve.tier);
          return (
            <button
              key={curve.tier}
              type="button"
              onClick={() => toggle(curve.tier)}
              className={`pixel-sans flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                isHidden
                  ? "border-black/10 text-black/30"
                  : "border-black/15 text-black/70 hover:border-black/30"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: isHidden ? "#d1d5db" : curve.color }}
              />
              {curve.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
