import type { ExpiryBoard, OptionRow } from "../lib/api/derivatives";
import type { OptionSide } from "../lib/api/options";

function fmtPremium(value: number): string {
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.001) return value.toFixed(4);
  return value.toExponential(1);
}

function fmtStrike(value: number): string {
  return `$${value.toFixed(value < 1 ? 3 : 2)}`;
}

/**
 * Options chain for one expiry board: calls on the left, strike in the middle,
 * puts on the right — the standard options-desk layout. In-the-money legs are
 * tinted (calls ITM below the forward, puts ITM above it).
 */
export function OptionsChain({
  board,
  onBuy,
}: {
  board: ExpiryBoard | null;
  /** When provided, call/put premium cells become buyable buttons. */
  onBuy?: (side: OptionSide, strike: number) => void;
}) {
  if (!board || board.rows.length === 0) {
    return (
      <div className="pixel-sans p-6 text-center text-sm text-black/40">
        No option board selected.
      </div>
    );
  }

  const forward = board.forward;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-right text-sm">
        <thead>
          <tr className="pixel-sans text-[10px] uppercase tracking-wide text-black/35">
            <th className="px-3 py-1.5 text-left font-normal text-emerald-700/70">Call δ</th>
            <th className="px-3 py-1.5 font-normal text-emerald-700/70">Call θ</th>
            <th className="px-3 py-1.5 font-normal text-emerald-700/80">
              {onBuy ? "Buy call" : "Call price"}
            </th>
            <th className="px-3 py-1.5 text-center font-normal">IV</th>
            <th className="px-3 py-1.5 text-center font-medium text-black/60">Strike</th>
            <th className="px-3 py-1.5 font-normal text-red-600/80">
              {onBuy ? "Buy put" : "Put price"}
            </th>
            <th className="px-3 py-1.5 font-normal text-red-600/70">Put θ</th>
            <th className="px-3 py-1.5 text-right font-normal text-red-600/70">Put δ</th>
          </tr>
        </thead>
        <tbody className="pixel-mono">
          {board.rows.map((row) => (
            <ChainRow
              key={row.strike}
              row={row}
              forward={forward}
              atm={board.atmStrike}
              onBuy={onBuy}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChainRow({
  row,
  forward,
  atm,
  onBuy,
}: {
  row: OptionRow;
  forward: number;
  atm: number;
  onBuy?: (side: OptionSide, strike: number) => void;
}) {
  const callItm = row.strike < forward;
  const putItm = row.strike > forward;
  const isAtm = row.strike === atm;

  return (
    <tr className={`border-t border-black/5 ${isAtm ? "bg-black/[0.03]" : ""}`}>
      <td className="px-3 py-1.5 text-left text-black/55">{row.call.delta.toFixed(2)}</td>
      <td className="px-3 py-1.5 text-black/45">{row.call.theta.toFixed(4)}</td>
      <td className={`px-1.5 py-1 ${callItm ? "bg-emerald-50/70" : ""}`}>
        {onBuy ? (
          <button
            type="button"
            onClick={() => onBuy("CALL", row.strike)}
            className={`w-full rounded-md px-2 py-1 text-right transition-colors hover:bg-emerald-600 hover:text-white ${
              callItm ? "text-emerald-800" : "text-black/70"
            }`}
            title={`Buy the $${fmtStrike(row.strike)} call`}
          >
            {fmtPremium(row.call.price)}
          </button>
        ) : (
          <span className={callItm ? "text-emerald-800" : "text-black/70"}>
            {fmtPremium(row.call.price)}
          </span>
        )}
      </td>
      <td className="px-3 py-1.5 text-center text-black/45">{row.ivPercent.toFixed(0)}%</td>
      <td className="px-3 py-1.5 text-center font-medium text-black">
        {fmtStrike(row.strike)}
        {isAtm && (
          <span className="pixel-sans ml-1 rounded bg-black/[0.06] px-1 py-0.5 text-[9px] text-black/45">
            ATM
          </span>
        )}
      </td>
      <td className={`px-1.5 py-1 ${putItm ? "bg-red-50/70" : ""}`}>
        {onBuy ? (
          <button
            type="button"
            onClick={() => onBuy("PUT", row.strike)}
            className={`w-full rounded-md px-2 py-1 text-right transition-colors hover:bg-red-600 hover:text-white ${
              putItm ? "text-red-700" : "text-black/70"
            }`}
            title={`Buy the $${fmtStrike(row.strike)} put`}
          >
            {fmtPremium(row.put.price)}
          </button>
        ) : (
          <span className={putItm ? "text-red-700" : "text-black/70"}>
            {fmtPremium(row.put.price)}
          </span>
        )}
      </td>
      <td className="px-3 py-1.5 text-black/45">{row.put.theta.toFixed(4)}</td>
      <td className="px-3 py-1.5 text-right text-black/55">{row.put.delta.toFixed(2)}</td>
    </tr>
  );
}
