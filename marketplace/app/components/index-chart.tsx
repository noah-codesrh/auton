import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { IndexPoint } from "../lib/api/indexes";

const HEIGHT = 280;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 52 };

function fmtTime(sec: number): string {
  return new Date(sec * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Reconstructed index history as an area + line chart. Mirrors the vol-smile
 * chart's responsive/hover pattern so the two layers feel like one product.
 */
export function IndexChart({
  history,
  color,
  fmtValue,
}: {
  history: IndexPoint[];
  color: string;
  fmtValue: (v: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gradientId = useId();
  const [width, setWidth] = useState(720);
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

  const bounds = useMemo(() => {
    if (history.length === 0) return null;
    const values = history.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15 || max * 0.02 || 1;
    return { min: min - pad, max: max + pad };
  }, [history]);

  const plotW = Math.max(1, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  if (history.length < 2 || !bounds) {
    return (
      <div className="pixel-sans flex h-[280px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
        Building index history…
      </div>
    );
  }

  const span = bounds.max - bounds.min || 1;
  const n = history.length;
  const xFor = (i: number) => MARGIN.left + (i / (n - 1)) * plotW;
  const yFor = (v: number) => MARGIN.top + (1 - (v - bounds.min) / span) * plotH;

  const line = history
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${xFor(n - 1).toFixed(1)} ${(HEIGHT - MARGIN.bottom).toFixed(1)} L ${xFor(0).toFixed(1)} ${(HEIGHT - MARGIN.bottom).toFixed(1)} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => bounds.min + (span / 4) * i);
  const xTickIdx = [0, Math.floor((n - 1) / 2), n - 1];
  const hovered = hoverIdx !== null ? history[hoverIdx] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width={width} height={HEIGHT} className="block" role="img" aria-label="Index history">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {yTicks.map((v) => {
          const y = yFor(v);
          return (
            <g key={`y-${v}`}>
              <line x1={MARGIN.left} y1={y} x2={width - MARGIN.right} y2={y} stroke="#f1f1f1" />
              <text x={MARGIN.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af" className="pixel-sans">
                {fmtValue(v)}
              </text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradientId})`} stroke="none" />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {xTickIdx.map((i) => (
          <text
            key={`x-${i}`}
            x={xFor(i)}
            y={HEIGHT - MARGIN.bottom + 16}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fontSize={9}
            fill="#9ca3af"
            className="pixel-mono"
          >
            {fmtTime(history[i].time)}
          </text>
        ))}

        {hovered && hoverIdx !== null && (
          <g>
            <line
              x1={xFor(hoverIdx)}
              y1={MARGIN.top}
              x2={xFor(hoverIdx)}
              y2={HEIGHT - MARGIN.bottom}
              stroke="#d1d5db"
              strokeDasharray="4 3"
            />
            <circle cx={xFor(hoverIdx)} cy={yFor(hovered.value)} r={3.5} fill={color} />
          </g>
        )}

        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const rel = (e.clientX - rect.left) / rect.width;
            setHoverIdx(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))));
          }}
          onPointerLeave={() => setHoverIdx(null)}
        />
      </svg>

      {hovered && (
        <div className="pixel-sans pointer-events-none absolute top-3 right-3 rounded-lg border border-black/10 bg-white/95 px-2.5 py-1.5 text-xs shadow-sm">
          <div className="text-black/45">{fmtTime(hovered.time)}</div>
          <div className="pixel-mono text-black">{fmtValue(hovered.value)}</div>
        </div>
      )}
    </div>
  );
}
