import { useEffect, useMemo, useRef, useState } from "react";
import type { ExpiryBoard } from "../lib/api/derivatives";

const HEIGHT = 240;
const MARGIN = { top: 16, right: 16, bottom: 34, left: 44 };

function fmtStrike(value: number): string {
  return `$${value.toFixed(value < 1 ? 3 : 2)}`;
}

/** Implied-vol smile: IV (%) across the strike ladder for one expiry board. */
export function VolSmileChart({
  board,
  color,
}: {
  board: ExpiryBoard | null;
  color: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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

  const rows = board?.rows ?? [];

  const bounds = useMemo(() => {
    if (rows.length === 0) return null;
    const strikes = rows.map((r) => r.strike);
    const ivs = rows.map((r) => r.ivPercent);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    const minIv = Math.min(...ivs);
    const maxIv = Math.max(...ivs);
    const pad = (maxIv - minIv) * 0.2 || maxIv * 0.1 || 1;
    return {
      minStrike,
      maxStrike,
      minIv: Math.max(0, minIv - pad),
      maxIv: maxIv + pad,
    };
  }, [rows]);

  const plotW = Math.max(1, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  if (!board || !bounds || rows.length === 0) {
    return (
      <div className="pixel-sans flex h-[240px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
        No option board selected.
      </div>
    );
  }

  const strikeSpan = bounds.maxStrike - bounds.minStrike || 1;
  const ivSpan = bounds.maxIv - bounds.minIv || 1;
  const xFor = (s: number) =>
    MARGIN.left + ((s - bounds.minStrike) / strikeSpan) * plotW;
  const yFor = (iv: number) =>
    MARGIN.top + (1 - (iv - bounds.minIv) / ivSpan) * plotH;

  const path = rows
    .map(
      (r, i) =>
        `${i === 0 ? "M" : "L"} ${xFor(r.strike).toFixed(1)} ${yFor(r.ivPercent).toFixed(1)}`,
    )
    .join(" ");

  const yTicks = Array.from({ length: 5 }, (_, i) => bounds.minIv + (ivSpan / 4) * i);
  const hovered = hoverIdx !== null ? rows[hoverIdx] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width={width} height={HEIGHT} className="block" role="img" aria-label="Implied volatility smile across strikes">
        {yTicks.map((iv) => {
          const y = yFor(iv);
          return (
            <g key={`y-${iv}`}>
              <line x1={MARGIN.left} y1={y} x2={width - MARGIN.right} y2={y} stroke="#f1f1f1" />
              <text x={MARGIN.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af" className="pixel-sans">
                {iv.toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* ATM marker */}
        <line
          x1={xFor(board.atmStrike)}
          y1={MARGIN.top}
          x2={xFor(board.atmStrike)}
          y2={HEIGHT - MARGIN.bottom}
          stroke="#d1d5db"
          strokeDasharray="4 3"
        />
        <text
          x={xFor(board.atmStrike)}
          y={MARGIN.top - 4}
          textAnchor="middle"
          fontSize={9}
          fill="#9ca3af"
          className="pixel-sans"
        >
          ATM
        </text>

        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {rows.map((r, i) => (
          <g key={r.strike}>
            <circle cx={xFor(r.strike)} cy={yFor(r.ivPercent)} r={3} fill={color} />
            <text
              x={xFor(r.strike)}
              y={HEIGHT - MARGIN.bottom + 16}
              textAnchor="middle"
              fontSize={8.5}
              fill="#9ca3af"
              className="pixel-mono"
            >
              {fmtStrike(r.strike)}
            </text>
            <rect
              x={xFor(r.strike) - plotW / rows.length / 2}
              y={MARGIN.top}
              width={plotW / rows.length}
              height={plotH}
              fill="transparent"
              onPointerEnter={() => setHoverIdx(i)}
              onPointerLeave={() => setHoverIdx(null)}
            />
          </g>
        ))}
      </svg>

      {hovered && (
        <div className="pixel-sans pointer-events-none absolute top-3 right-3 rounded-lg border border-black/10 bg-white/95 px-2.5 py-1.5 text-xs shadow-sm">
          <div className="text-black/45">Strike {fmtStrike(hovered.strike)}</div>
          <div className="text-black">IV {hovered.ivPercent.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}
