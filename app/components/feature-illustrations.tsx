import { FlowPath, PulsingCenter } from "./flow-animation";

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="7" y="2" width="6" height="6" fill="currentColor" />
      <rect x="4" y="10" width="12" height="8" fill="currentColor" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4" y="4" width="24" height="24" fill="currentColor" />
      <rect x="6" y="6" width="20" height="20" fill="black" />
      <rect x="8" y="9" width="16" height="3" fill="currentColor" />
      <rect x="8" y="14" width="12" height="3" fill="currentColor" />
      <rect x="8" y="19" width="8" height="3" fill="currentColor" />
      <rect x="2" y="2" width="4" height="4" fill="currentColor" />
      <rect x="26" y="2" width="4" height="4" fill="currentColor" />
      <rect x="2" y="26" width="4" height="4" fill="currentColor" />
      <rect x="26" y="26" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

function ProviderIcon() {
  return (
    <svg width="24" height="22" viewBox="0 0 24 22" fill="none" aria-hidden>
      <rect x="2" y="0" width="20" height="14" fill="currentColor" />
      <rect x="4" y="2" width="16" height="10" fill="black" />
      <rect x="6" y="4" width="2" height="2" fill="currentColor" />
      <rect x="10" y="4" width="4" height="2" fill="currentColor" />
      <rect x="6" y="7" width="8" height="2" fill="currentColor" />
      <rect x="10" y="14" width="4" height="2" fill="currentColor" />
      <rect x="6" y="16" width="12" height="2" fill="currentColor" />
    </svg>
  );
}

export function HedgeVolatilityIllustration() {
  const hedgers = [
    { x: 20, y: 40 },
    { x: 20, y: 80 },
    { x: 20, y: 120 },
  ];

  const providers = [
    { x: 300, y: 40 },
    { x: 300, y: 80 },
    { x: 300, y: 120 },
  ];

  const flows = [
    { user: hedgers[1], worker: providers[0], delay: 0 },
    { user: hedgers[0], worker: providers[2], delay: 6 },
    { user: hedgers[2], worker: providers[1], delay: 12 },
  ];

  const centerX = 160;
  const centerY = 80;

  return (
    <div className="relative h-full min-h-[180px] w-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[160px] w-full max-w-[340px]">
          {hedgers.map((hedger, i) => (
            <svg
              key={`line-h-${i}`}
              className="absolute inset-0 h-full w-full"
              style={{ overflow: "visible" }}
            >
              <line
                x1={hedger.x + 10}
                y1={hedger.y}
                x2={centerX}
                y2={centerY}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            </svg>
          ))}

          {providers.map((provider, i) => (
            <svg
              key={`line-p-${i}`}
              className="absolute inset-0 h-full w-full"
              style={{ overflow: "visible" }}
            >
              <line
                x1={centerX}
                y1={centerY}
                x2={provider.x - 10}
                y2={provider.y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            </svg>
          ))}

          {flows.map((flow, i) => (
            <FlowPath
              key={i}
              user={flow.user}
              worker={flow.worker}
              centerX={centerX}
              centerY={centerY}
              totalDuration={18}
              startDelay={flow.delay}
            />
          ))}

          {hedgers.map((hedger, i) => (
            <div
              key={`hedger-${i}`}
              className="absolute text-white"
              style={{ left: hedger.x - 10, top: hedger.y - 10 }}
            >
              <PersonIcon />
            </div>
          ))}

          <PulsingCenter>
            <QueueIcon />
          </PulsingCenter>

          {providers.map((provider, i) => (
            <div
              key={`provider-${i}`}
              className="absolute text-white"
              style={{ left: provider.x - 12, top: provider.y - 11 }}
            >
              <ProviderIcon />
            </div>
          ))}

          <span
            className="pixel-sans absolute text-[10px] tracking-wider text-white/60"
            style={{ left: 8, top: 145 }}
          >
            HEDGERS
          </span>
          <span
            className="pixel-sans absolute text-[10px] tracking-wider text-white/60"
            style={{ left: 142, top: 145 }}
          >
            MARKET
          </span>
          <span
            className="pixel-sans absolute text-[10px] tracking-wider text-white/60"
            style={{ left: 272, top: 145 }}
          >
            PROVIDERS
          </span>
        </div>
      </div>
    </div>
  );
}

export function GuaranteeCapacityIllustration() {
  return (
    <svg
      width="200"
      height="160"
      viewBox="0 0 160 140"
      fill="none"
      className="h-full w-full max-w-[200px]"
      aria-hidden
    >
      <defs>
        <pattern id="halftone-capacity" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
      </defs>
      <g transform="translate(10, 35)">
        <rect x="0" y="0" width="40" height="50" fill="black" stroke="white" strokeWidth="1.5" />
        <rect x="5" y="8" width="20" height="3" fill="white" opacity="0.9" />
        <rect x="5" y="15" width="30" height="3" fill="white" opacity="0.9" />
        <rect x="5" y="22" width="25" height="3" fill="white" opacity="0.9" />
        <rect x="5" y="29" width="28" height="3" fill="white" opacity="0.9" />
        <rect x="5" y="36" width="18" height="3" fill="white" opacity="0.9" />
      </g>
      <g transform="translate(55, 55)">
        <rect x="0" y="3" width="15" height="4" fill="white" opacity="0.5" />
        <polygon points="15,0 15,10 22,5" fill="white" opacity="0.5" />
      </g>
      <g transform="translate(72, 30)">
        <rect
          x="0"
          y="25"
          width="30"
          height="24"
          fill="url(#halftone-capacity)"
          stroke="white"
          strokeWidth="1.5"
        />
        <rect x="3" y="28" width="24" height="18" fill="black" />
        <circle cx="15" cy="35" r="4" fill="white" />
        <rect x="13" y="35" width="4" height="7" fill="white" />
        <rect x="5" y="10" width="4" height="17" fill="white" />
        <rect x="21" y="10" width="4" height="17" fill="white" />
        <rect x="5" y="6" width="20" height="6" fill="white" />
        <rect x="9" y="10" width="12" height="4" fill="black" />
      </g>
      <g transform="translate(107, 55)">
        <rect x="0" y="3" width="15" height="4" fill="white" opacity="0.5" />
        <polygon points="15,0 15,10 22,5" fill="white" opacity="0.5" />
      </g>
      <g transform="translate(125, 35)">
        <rect
          x="0"
          y="0"
          width="40"
          height="50"
          fill="url(#halftone-capacity)"
          stroke="white"
          strokeWidth="1.5"
        />
        <rect x="2" y="2" width="36" height="46" fill="black" />
        <rect x="5" y="8" width="8" height="3" fill="white" opacity="0.4" />
        <rect x="15" y="8" width="5" height="3" fill="white" opacity="0.4" />
        <rect x="22" y="8" width="10" height="3" fill="white" opacity="0.4" />
        <rect x="5" y="15" width="12" height="3" fill="white" opacity="0.4" />
        <rect x="20" y="15" width="7" height="3" fill="white" opacity="0.4" />
        <rect x="5" y="22" width="6" height="3" fill="white" opacity="0.4" />
        <rect x="13" y="22" width="14" height="3" fill="white" opacity="0.4" />
        <rect x="5" y="29" width="10" height="3" fill="white" opacity="0.4" />
        <rect x="17" y="29" width="8" height="3" fill="white" opacity="0.4" />
        <rect x="5" y="36" width="5" height="3" fill="white" opacity="0.4" />
        <rect x="12" y="36" width="12" height="3" fill="white" opacity="0.4" />
      </g>
      <text x="30" y="100" fill="white" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.4">
        DEMAND
      </text>
      <text x="87" y="100" fill="white" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.4">
        RESERVE
      </text>
      <text x="145" y="100" fill="white" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.4">
        LOCKED
      </text>
    </svg>
  );
}

export function OnChainMarketsIllustration() {
  return (
    <svg
      width="200"
      height="150"
      viewBox="0 0 160 120"
      fill="none"
      className="h-full w-full max-w-[200px]"
      aria-hidden
    >
      <defs>
        <pattern id="halftone-browser" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="white" />
        </pattern>
      </defs>
      <g transform="translate(10, 10)">
        <rect x="0" y="0" width="140" height="95" fill="white" stroke="white" strokeWidth="2" />
        <rect x="0" y="0" width="140" height="16" fill="white" />
        <rect x="5" y="5" width="6" height="6" fill="black" />
        <rect x="14" y="5" width="6" height="6" fill="black" />
        <rect x="23" y="5" width="6" height="6" fill="black" />
        <rect x="35" y="4" width="100" height="8" fill="black" />
        <rect x="37" y="5" width="55" height="6" fill="white" opacity="0.3" />
        <rect x="2" y="18" width="136" height="75" fill="black" />
        <text x="8" y="32" fill="white" fontSize="9" fontFamily="monospace" opacity="0.5">
          &gt;
        </text>
        <rect x="18" y="25" width="50" height="6" fill="white" opacity="0.35" />
        <text x="8" y="46" fill="white" fontSize="9" fontFamily="monospace" opacity="0.5">
          &gt;
        </text>
        <rect x="18" y="39" width="75" height="6" fill="white" opacity="0.35" />
        <rect x="18" y="52" width="45" height="6" fill="white" opacity="0.2" />
        <text x="8" y="72" fill="white" fontSize="9" fontFamily="monospace" opacity="0.5">
          &gt;
        </text>
        <rect x="18" y="65" width="8" height="8" fill="white" />
        <rect
          x="8"
          y="80"
          width="120"
          height="6"
          fill="white"
          opacity="0.1"
          stroke="white"
          strokeWidth="0.5"
        />
        <rect x="9" y="81" width="80" height="4" fill="url(#halftone-browser)" />
      </g>
    </svg>
  );
}

export function EarnYieldIllustration() {
  return (
    <svg
      width="260"
      height="140"
      viewBox="0 0 260 140"
      fill="none"
      className="h-full w-full max-w-[260px]"
      aria-hidden
    >
      <defs>
        <pattern id="halftone-coin-surface" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.7" fill="white" />
        </pattern>
        <pattern id="halftone-coin-side" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="white" />
        </pattern>
      </defs>
      <g transform="translate(45, 65)">
        <ellipse cx="28" cy="45" rx="28" ry="9" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <path d="M0,37 L0,45 A28,9 0 0,0 56,45 L56,37" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="37" rx="28" ry="9" fill="black" stroke="white" strokeWidth="1" />
        <path d="M0,27 L0,35 A28,9 0 0,0 56,35 L56,27" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="27" rx="28" ry="9" fill="black" stroke="white" strokeWidth="1" />
        <path d="M0,17 L0,25 A28,9 0 0,0 56,25 L56,17" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="17" rx="28" ry="9" fill="black" stroke="white" strokeWidth="1.5" />
        <text x="28" y="21" fill="white" fontSize="11" fontFamily="monospace" textAnchor="middle">$</text>
      </g>
      <g transform="translate(102, 25)">
        <ellipse cx="28" cy="85" rx="28" ry="9" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <path d="M0,77 L0,85 A28,9 0 0,0 56,85 L56,77" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="77" rx="28" ry="9" fill="url(#halftone-coin-surface)" stroke="white" strokeWidth="1" />
        <path d="M0,67 L0,75 A28,9 0 0,0 56,75 L56,67" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="67" rx="28" ry="9" fill="url(#halftone-coin-surface)" stroke="white" strokeWidth="1" />
        <path d="M0,57 L0,65 A28,9 0 0,0 56,65 L56,57" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="57" rx="28" ry="9" fill="url(#halftone-coin-surface)" stroke="white" strokeWidth="1" />
        <path d="M0,47 L0,55 A28,9 0 0,0 56,55 L56,47" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="47" rx="28" ry="9" fill="url(#halftone-coin-surface)" stroke="white" strokeWidth="1" />
        <path d="M0,37 L0,45 A28,9 0 0,0 56,45 L56,37" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="37" rx="28" ry="9" fill="black" stroke="white" strokeWidth="1" />
        <path d="M0,27 L0,35 A28,9 0 0,0 56,35 L56,27" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="27" rx="28" ry="9" fill="black" stroke="white" strokeWidth="1.5" />
        <text x="28" y="31" fill="white" fontSize="11" fontFamily="monospace" textAnchor="middle">$</text>
      </g>
      <g transform="translate(159, 55)">
        <ellipse cx="28" cy="55" rx="28" ry="9" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <path d="M0,47 L0,55 A28,9 0 0,0 56,55 L56,47" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="47" rx="28" ry="9" fill="url(#halftone-coin-surface)" stroke="white" strokeWidth="1" />
        <path d="M0,37 L0,45 A28,9 0 0,0 56,45 L56,37" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="37" rx="28" ry="9" fill="url(#halftone-coin-surface)" stroke="white" strokeWidth="1" />
        <path d="M0,27 L0,35 A28,9 0 0,0 56,35 L56,27" fill="url(#halftone-coin-side)" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="27" rx="28" ry="9" fill="black" stroke="white" strokeWidth="1" />
        <path d="M0,17 L0,25 A28,9 0 0,0 56,25 L56,17" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1" />
        <ellipse cx="28" cy="17" rx="28" ry="9" fill="black" stroke="white" strokeWidth="1.5" />
        <text x="28" y="21" fill="white" fontSize="11" fontFamily="monospace" textAnchor="middle">$</text>
      </g>
    </svg>
  );
}
