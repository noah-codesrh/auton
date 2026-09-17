import { Link } from "react-router";
import type { ModelDerivatives } from "../lib/api/derivatives";
import { formatRatePerM } from "../config/marketplace";

function fmtPremium(value: number): string {
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.001) return value.toFixed(4);
  return value.toExponential(1);
}

function fmtStrike(value: number): string {
  return `$${value.toFixed(value < 1 ? 3 : 2)}`;
}

/**
 * Compact options snapshot for the trading terminal: the front-expiry board's
 * strikes nearest the money, calls vs puts, plus the ATM straddle cost.
 */
export function MiniOptions({
  model,
  loading,
}: {
  model: ModelDerivatives | null;
  loading: boolean;
}) {
  const board = model?.boards[0] ?? null;

  if (!model || !board) {
    return (
      <div className="pixel-sans p-4 text-center text-xs text-black/40">
        {loading ? "Pricing options…" : "No options for this market."}
      </div>
    );
  }

  // Show the strikes closest to the forward (ATM ± a couple).
  const atmIndex = board.rows.findIndex((r) => r.strike === board.atmStrike);
  const start = Math.max(0, atmIndex - 2);
  const rows = board.rows.slice(start, start + 5);

  const atmRow = board.rows[atmIndex];
  const straddle = atmRow ? atmRow.call.price + atmRow.put.price : null;

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: model.color }} />
          <span className="pixel-sans text-xs font-medium text-black">{model.label}</span>
        </span>
        <span className="pixel-sans rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] text-black/55">
          {board.expiryLabel} · {board.daysToExpiry}d
        </span>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-black/[0.03] px-2.5 py-1.5">
          <div className="pixel-sans text-[10px] text-black/45">IV (ATM)</div>
          <div className="pixel-mono text-xs text-black">{board.atmIvPercent.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg bg-black/[0.03] px-2.5 py-1.5">
          <div className="pixel-sans text-[10px] text-black/45">Forward</div>
          <div className="pixel-mono text-xs text-black">{formatRatePerM(board.forward)}</div>
        </div>
      </div>

      <table className="w-full text-right text-[11px]">
        <thead>
          <tr className="pixel-sans text-[9px] uppercase tracking-wide text-black/35">
            <th className="py-1 text-left font-normal text-emerald-700/70">Call</th>
            <th className="py-1 text-center font-normal">Strike</th>
            <th className="py-1 text-right font-normal text-red-600/70">Put</th>
          </tr>
        </thead>
        <tbody className="pixel-mono">
          {rows.map((r) => {
            const isAtm = r.strike === board.atmStrike;
            return (
              <tr key={r.strike} className={`border-t border-black/5 ${isAtm ? "bg-black/[0.03]" : ""}`}>
                <td className="py-1 text-left text-emerald-800/80">{fmtPremium(r.call.price)}</td>
                <td className="py-1 text-center text-black/70">{fmtStrike(r.strike)}</td>
                <td className="py-1 text-right text-red-700/80">{fmtPremium(r.put.price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {straddle !== null && (
        <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 pixel-sans text-[11px]">
          <span className="text-black/45">ATM straddle</span>
          <span className="pixel-mono text-black">{fmtPremium(straddle)}/M</span>
        </div>
      )}

      <Link
        to="/derivatives"
        className="pixel-sans mt-2 block rounded-lg border border-black/15 py-1.5 text-center text-[11px] text-black/60 hover:border-black/30 hover:text-black"
      >
        Open options chain →
      </Link>
    </div>
  );
}
