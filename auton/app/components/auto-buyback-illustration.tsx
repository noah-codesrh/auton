const INK = "#1a1a1a";
const STEEL = "#80a0c1";
const STEEL_DEEP = "#4f7299";

function TreasuryMark({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="28" fill="#fff" stroke={STEEL} strokeWidth="1.25" />
      <g
        fill="none"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
        transform="translate(-11 -10)"
      >
        <path d="M11 1.5 21 8H1Z" />
        <path d="M3 8v10h16V8" />
        <path d="M1 18.5h20" />
        <circle cx="11" cy="13" r="2.2" />
      </g>
    </g>
  );
}

function TerminalMark({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="28" fill="#fff" stroke={STEEL} strokeWidth="1.25" />
      <g fill="none" stroke={INK} strokeWidth="1.4" transform="translate(-12 -8)">
        <rect x="0.5" y="0.5" width="23" height="15" rx="2" />
        <circle cx="4.2" cy="4.2" r="0.7" fill={INK} stroke="none" />
        <circle cx="6.6" cy="4.2" r="0.7" fill={INK} stroke="none" />
        <path d="M4 8h10M4 11h7" />
        <path d="M3 18h18" />
      </g>
    </g>
  );
}

function TapeMark({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="28" fill="#fff" stroke={STEEL} strokeWidth="1.25" />
      <g stroke={INK} strokeWidth="1.35" fill="none" transform="translate(-13 -8)">
        <line x1="3" y1="16" x2="23" y2="16" />
        <line x1="7" y1="4" x2="7" y2="14" />
        <rect x="5.2" y="7" width="3.6" height="5" fill={INK} fillOpacity="0.12" />
        <line x1="13" y1="2" x2="13" y2="14" />
        <rect x="11.2" y="5" width="3.6" height="6" fill={INK} fillOpacity="0.12" />
        <line x1="19" y1="6" x2="19" y2="14" />
        <rect x="17.2" y="8.5" width="3.6" height="4" fill={INK} fillOpacity="0.12" />
      </g>
    </g>
  );
}

function AutoMark({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="28" fill="#fff" stroke={STEEL} strokeWidth="1.25" />
      <circle r="16" fill="none" stroke={INK} strokeWidth="1.5" />
      <text
        textAnchor="middle"
        y="5.2"
        fill={INK}
        fontFamily="Syne, ui-sans-serif, system-ui, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="-0.04em"
      >
        A
      </text>
    </g>
  );
}

export function AutoBuybackIllustration() {
  const cx = 480;
  const cy = 270;
  const orbit = 168;

  return (
    <svg
      viewBox="0 0 960 540"
      className="h-auto w-full"
      role="img"
      aria-label="Every settlement fee flows to the treasury and buys back $AUTO"
    >
      <defs>
        <radialGradient id="auto-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={STEEL} stopOpacity="0.16" />
          <stop offset="62%" stopColor={STEEL} stopOpacity="0.04" />
          <stop offset="100%" stopColor={STEEL} stopOpacity="0" />
        </radialGradient>
        <marker
          id="auto-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 1.2 L 9 5 L 0 8.8"
            fill="none"
            stroke={STEEL_DEEP}
            strokeWidth="1.4"
          />
        </marker>
      </defs>

      <circle cx={cx} cy={cy} r="250" fill="url(#auto-halo)" />

      {[92, 148, 210, 258].map((r) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={STEEL}
          strokeWidth={r === 210 ? 1.15 : 0.7}
          strokeDasharray={r === 210 ? undefined : "1.5 6"}
          opacity={r === 210 ? 0.55 : 0.35}
        />
      ))}

      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2;
        const inner = i % 3 === 0 ? 78 : 84;
        const outer = i % 3 === 0 ? 268 : 252;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * inner}
            y1={cy + Math.sin(a) * inner}
            x2={cx + Math.cos(a) * outer}
            y2={cy + Math.sin(a) * outer}
            stroke={STEEL}
            strokeWidth={i % 3 === 0 ? 0.7 : 0.45}
            opacity={i % 3 === 0 ? 0.28 : 0.16}
          />
        );
      })}

      <circle
        cx={cx}
        cy={cy}
        r={orbit}
        fill="none"
        stroke={STEEL_DEEP}
        strokeWidth="1.1"
        opacity="0.55"
      />

      {[
        { from: -78, to: -12 },
        { from: 12, to: 78 },
        { from: 102, to: 168 },
        { from: 192, to: 258 },
      ].map((arc) => (
        <path
          key={`${arc.from}-${arc.to}`}
          d={`M ${cx + Math.cos((arc.from * Math.PI) / 180) * orbit} ${
            cy + Math.sin((arc.from * Math.PI) / 180) * orbit
          } A ${orbit} ${orbit} 0 0 1 ${
            cx + Math.cos((arc.to * Math.PI) / 180) * orbit
          } ${cy + Math.sin((arc.to * Math.PI) / 180) * orbit}`}
          fill="none"
          stroke={STEEL_DEEP}
          strokeWidth="1.35"
          markerEnd="url(#auto-arrow)"
        />
      ))}

      <circle cx={cx} cy={cy} r="58" fill="#c5d0dc" />
      <circle cx={cx} cy={cy} r="58" fill="none" stroke={STEEL} strokeWidth="1" />
      <text
        x={cx}
        y={cy + 7}
        textAnchor="middle"
        fill={INK}
        fontFamily="Syne, ui-sans-serif, system-ui, sans-serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="0.14em"
      >
        $AUTO
      </text>

      <TreasuryMark x={cx} y={cy - orbit} />
      <TapeMark x={cx + orbit} y={cy} />
      <AutoMark x={cx} y={cy + orbit} />
      <TerminalMark x={cx - orbit} y={cy} />
    </svg>
  );
}
