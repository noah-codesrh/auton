import { useState, type ReactNode } from "react";
import type { OptionPosition } from "../lib/api/options";

function fmtUsd(value: number | null): string {
  if (value === null) return "—";
  if (Math.abs(value) >= 1000)
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${value.toFixed(2)}`;
}

function fmtRate(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

export function OptionPositions({
  open,
  closed,
  hasSession,
  working,
  onClose,
  onConnect,
}: {
  open: OptionPosition[];
  closed: OptionPosition[];
  hasSession: boolean;
  working: boolean;
  onClose: (positionId: string) => Promise<void>;
  onConnect: () => void;
}) {
  const [showClosed, setShowClosed] = useState(false);

  if (!hasSession) {
    return (
      <div className="pixel-sans flex flex-col items-center gap-3 p-8 text-center text-sm text-black/45">
        <p>Connect your wallet to buy options and track positions.</p>
        <button
          type="button"
          onClick={onConnect}
          className="pixel-sans rounded-xl bg-black px-4 py-2 text-white hover:bg-black/85"
        >
          Connect wallet
        </button>
      </div>
    );
  }

  if (open.length === 0 && closed.length === 0) {
    return (
      <p className="pixel-sans p-8 text-center text-sm text-black/40">
        No positions yet. Tap a call or put premium in the chain above to buy
        one.
      </p>
    );
  }

  const rows = showClosed ? closed : open;

  return (
    <div>
      {closed.length > 0 && (
        <div className="flex gap-1 border-b border-black/5 px-4 py-2">
          <Tab active={!showClosed} onClick={() => setShowClosed(false)}>
            Open ({open.length})
          </Tab>
          <Tab active={showClosed} onClick={() => setShowClosed(true)}>
            Closed ({closed.length})
          </Tab>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="pixel-sans p-6 text-center text-xs text-black/40">
          {showClosed ? "No closed positions." : "No open positions."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="pixel-sans text-[10px] uppercase tracking-wide text-black/35">
                <th className="px-4 py-2 font-normal">Contract</th>
                <th className="px-4 py-2 font-normal">Size</th>
                <th className="px-4 py-2 font-normal">Premium paid</th>
                <th className="px-4 py-2 font-normal">
                  {showClosed ? "Sold for" : "Value now"}
                </th>
                <th className="px-4 py-2 font-normal">P/L</th>
                <th className="px-4 py-2 text-right font-normal">
                  {showClosed ? "Status" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="pixel-mono">
              {rows.map((p) => (
                <PositionRow
                  key={p.id}
                  position={p}
                  working={working}
                  onClose={onClose}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PositionRow({
  position: p,
  working,
  onClose,
}: {
  position: OptionPosition;
  working: boolean;
  onClose: (positionId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const isCall = p.side === "CALL";
  const value = p.markValueUsd;
  const pnl = p.pnlUsd;
  const pnlUp = (pnl ?? 0) >= 0;

  const handleClose = async () => {
    setBusy(true);
    try {
      await onClose(p.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-t border-black/5">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`pixel-sans rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
              isCall ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {p.side}
          </span>
          <span className="pixel-sans text-black">{p.tier}</span>
          <span className="text-black/45">
            {fmtRate(p.strike)} · {p.expiryLabel}
          </span>
          {p.status === "OPEN" && p.inTheMoney && (
            <span className="pixel-sans rounded bg-black/[0.06] px-1 py-0.5 text-[9px] text-black/50">
              ITM
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5 text-black/60">{p.contractsMillions}M</td>
      <td className="px-4 py-2.5 text-black/60">{fmtUsd(p.premiumPaidUsd)}</td>
      <td className="px-4 py-2.5 text-black/70">{fmtUsd(value)}</td>
      <td className={`px-4 py-2.5 ${pnlUp ? "text-emerald-700" : "text-red-600"}`}>
        {pnl !== null ? `${pnlUp ? "+" : ""}${fmtUsd(pnl)}` : "—"}
        {p.pnlPercent !== null && (
          <span className="ml-1 text-[11px] text-black/40">
            ({pnlUp ? "+" : ""}
            {p.pnlPercent.toFixed(0)}%)
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        {p.status === "OPEN" ? (
          <button
            type="button"
            onClick={handleClose}
            disabled={busy || working}
            className="pixel-sans rounded-lg border border-black/15 px-3 py-1 text-xs text-black/70 hover:border-black/40 disabled:opacity-40"
          >
            {busy ? "Closing…" : "Close"}
          </button>
        ) : (
          <span className="pixel-sans text-xs text-black/40">Closed</span>
        )}
      </td>
    </tr>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pixel-sans rounded-lg px-3 py-1 text-xs transition-colors ${
        active ? "bg-black/[0.06] text-black" : "text-black/50 hover:text-black/70"
      }`}
    >
      {children}
    </button>
  );
}
