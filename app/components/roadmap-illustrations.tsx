/**
 * Compact line-art illustrations for each roadmap phase. All strokes use
 * `currentColor` so the parent card controls the tint (accent for live phases,
 * muted for the roadmap). Kept deliberately minimal and on-brand with the
 * pixel/line aesthetic used elsewhere on the site.
 */

type IlloProps = { className?: string };

const BASE = "h-full w-full";

function Svg({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 120 84"
      fill="none"
      className={BASE}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

/** Phase 1 — Inference Futures: candlesticks locked in. */
export function FuturesIllo(_: IlloProps) {
  return (
    <Svg label="Inference futures">
      <line x1="14" y1="10" x2="14" y2="66" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="14" y1="66" x2="112" y2="66" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* candles */}
      <g stroke="currentColor" strokeWidth="1.5">
        <line x1="30" y1="24" x2="30" y2="56" />
        <rect x="25" y="34" width="10" height="16" fill="currentColor" fillOpacity="0.12" />
        <line x1="50" y1="20" x2="50" y2="52" />
        <rect x="45" y="28" width="10" height="14" fill="currentColor" fillOpacity="0.12" />
        <line x1="70" y1="30" x2="70" y2="60" />
        <rect x="65" y="40" width="10" height="14" fill="currentColor" fillOpacity="0.12" />
      </g>
      {/* lock */}
      <g stroke="currentColor" strokeWidth="1.5">
        <rect x="90" y="30" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.14" />
        <path d="M93 30v-4a6 6 0 0 1 12 0v4" />
        <circle cx="99" cy="37" r="2" fill="currentColor" />
      </g>
    </Svg>
  );
}

/** Phase 2 — Yield Curves: a rising forward curve with anchor points. */
export function CurveIllo(_: IlloProps) {
  return (
    <Svg label="Yield curve">
      <line x1="14" y1="10" x2="14" y2="66" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="14" y1="66" x2="112" y2="66" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M18 58 C 40 52, 52 34, 72 28 S 100 18, 108 14"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {[
        [18, 58],
        [45, 44],
        [72, 28],
        [108, 14],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="currentColor" />
      ))}
      <text x="112" y="80" fontSize="7" fontFamily="monospace" fill="currentColor" opacity="0.5" textAnchor="end">
        1w · 1m · 3m · 1y
      </text>
    </Svg>
  );
}

/** Phase 3 — Derivatives: a long-call payoff hockey stick + strike ladder. */
export function DerivativesIllo(_: IlloProps) {
  return (
    <Svg label="Options and derivatives">
      <line x1="14" y1="58" x2="108" y2="58" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="60" y1="12" x2="60" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
      <polyline points="18,58 60,58 100,20" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* strike ladder ticks */}
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <line x1="40" y1="55" x2="40" y2="61" />
        <line x1="80" y1="55" x2="80" y2="61" />
      </g>
      <text x="102" y="18" fontSize="7" fontFamily="monospace" fill="currentColor">σ</text>
    </Svg>
  );
}

/** Phase 4 — Indexes: a basket of weighted bars (an index). */
export function IndexIllo(_: IlloProps) {
  const bars = [
    [24, 30],
    [40, 18],
    [56, 40],
    [72, 24],
    [88, 34],
  ];
  return (
    <Svg label="Compute indexes">
      <line x1="14" y1="66" x2="112" y2="66" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {bars.map(([x, h], i) => (
        <rect
          key={i}
          x={x}
          y={66 - h}
          width="10"
          height={h}
          fill="currentColor"
          fillOpacity={i === 2 ? "0.3" : "0.14"}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
      <path d="M20 40 L44 30 L60 46 L78 26 L98 32" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
    </Svg>
  );
}

/** Phase 5 — Agent Treasury: a bot managing a vault of gears. */
export function AgentIllo(_: IlloProps) {
  return (
    <Svg label="Agent treasury management">
      {/* bot */}
      <g stroke="currentColor" strokeWidth="1.5">
        <rect x="20" y="28" width="26" height="22" rx="3" fill="currentColor" fillOpacity="0.12" />
        <line x1="33" y1="22" x2="33" y2="28" />
        <circle cx="33" cy="20" r="2.5" fill="currentColor" />
        <circle cx="28" cy="38" r="2.5" fill="currentColor" />
        <circle cx="38" cy="38" r="2.5" fill="currentColor" />
        <line x1="28" y1="45" x2="38" y2="45" />
      </g>
      {/* flow arrow */}
      <path d="M50 39 H66" stroke="currentColor" strokeWidth="1.5" className="roadmap-dash" />
      <path d="M64 35 l5 4 -5 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* gear / vault */}
      <g stroke="currentColor" strokeWidth="1.5">
        <circle cx="88" cy="39" r="12" fill="currentColor" fillOpacity="0.1" />
        <circle cx="88" cy="39" r="4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          const x1 = 88 + Math.cos(r) * 12;
          const y1 = 39 + Math.sin(r) * 12;
          const x2 = 88 + Math.cos(r) * 15;
          const y2 = 39 + Math.sin(r) * 15;
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
    </Svg>
  );
}

/** Phase 6 — Ecosystem: a hub wired to satellite integrations. */
export function EcosystemIllo(_: IlloProps) {
  const nodes = [
    [22, 20],
    [22, 58],
    [98, 20],
    [98, 58],
    [60, 12],
    [60, 66],
  ];
  return (
    <Svg label="Ecosystem and integrations">
      {nodes.map(([x, y], i) => (
        <line key={`l${i}`} x1="60" y1="39" x2={x} y2={y} stroke="currentColor" strokeWidth="1" opacity="0.35" />
      ))}
      {nodes.map(([x, y], i) => (
        <rect key={`n${i}`} x={x - 6} y={y - 5} width="12" height="10" rx="1.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.2" />
      ))}
      <circle cx="60" cy="39" r="8" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="60" cy="39" r="2.5" fill="currentColor" />
    </Svg>
  );
}

/** Phase 7 — Resource-backed stablecoin iUSD. */
export function StablecoinIllo(_: IlloProps) {
  return (
    <Svg label="Resource-backed stablecoin iUSD">
      <ellipse cx="60" cy="24" rx="26" ry="9" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34 24 v22 a26 9 0 0 0 52 0 v-22" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.06" />
      <ellipse cx="60" cy="24" rx="26" ry="9" fill="black" fillOpacity="0" stroke="currentColor" strokeWidth="1.5" />
      <text x="60" y="28" fontSize="11" fontFamily="monospace" fill="currentColor" textAnchor="middle">
        iUSD
      </text>
      {/* backing resource ticks */}
      <text x="60" y="60" fontSize="7" fontFamily="monospace" fill="currentColor" opacity="0.55" textAnchor="middle">
        compute · storage · bw
      </text>
    </Svg>
  );
}

/** Phase 8 — Universal exchange: a globe grid of suppliers. */
export function ExchangeIllo(_: IlloProps) {
  return (
    <Svg label="Universal infrastructure exchange">
      <circle cx="60" cy="40" r="26" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.06" />
      <ellipse cx="60" cy="40" rx="26" ry="10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <ellipse cx="60" cy="40" rx="10" ry="26" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="34" y1="40" x2="86" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {[
        [60, 14],
        [86, 40],
        [60, 66],
        [34, 40],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 4} y={y - 4} width="8" height="8" rx="1" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
      ))}
    </Svg>
  );
}

/** Final Layer — Intelligence futures: a mind radiating outcomes. */
export function IntelligenceIllo(_: IlloProps) {
  const rays = [0, 60, 120, 180, 240, 300];
  return (
    <Svg label="Intelligence futures">
      {rays.map((a) => {
        const r = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={60 + Math.cos(r) * 16}
            y1={40 + Math.sin(r) * 16}
            x2={60 + Math.cos(r) * 30}
            y2={40 + Math.sin(r) * 30}
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.4"
          />
        );
      })}
      <circle cx="60" cy="40" r="16" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M54 40 q0 -8 6 -8 q6 0 6 8 q0 8 -6 8 q-6 0 -6 -8"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        opacity="0.8"
      />
      <circle cx="60" cy="40" r="2.5" fill="currentColor" />
    </Svg>
  );
}
