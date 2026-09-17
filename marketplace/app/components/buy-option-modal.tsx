import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  quoteOption,
  type OptionOrderInput,
  type OptionQuoteResult,
  type OptionSide,
} from "../lib/api/options";

export type OptionDraft = {
  tier: string;
  label: string;
  side: OptionSide;
  strike: number;
  expiryDate: number;
  expiryLabel: string;
};

const QUOTE_POLL_MS = 5_000;

function fmtUsd(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function fmtRate(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}/M`;
}

export function BuyOptionModal({
  draft,
  hasSession,
  balanceUsd,
  onConnect,
  onClose,
  onConfirm,
}: {
  draft: OptionDraft;
  hasSession: boolean;
  balanceUsd: number | null;
  onConnect: () => void;
  onClose: () => void;
  onConfirm: (input: OptionOrderInput) => Promise<void>;
}) {
  const [sizeMillions, setSizeMillions] = useState("10");
  const [quote, setQuote] = useState<OptionQuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const size = Number(sizeMillions);
  const validSize = Number.isFinite(size) && size > 0;

  const loadQuote = useCallback(async () => {
    try {
      const q = await quoteOption({
        tier: draft.tier,
        side: draft.side,
        strike: draft.strike,
        expiryDate: draft.expiryDate,
        contractsMillions: validSize ? size : 1,
      });
      setQuote(q);
      setQuoteError(null);
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Could not price option");
    }
  }, [draft.tier, draft.side, draft.strike, draft.expiryDate, size, validSize]);

  // Keep the premium fresh while the modal is open (the surface moves live).
  useEffect(() => {
    void loadQuote();
    timer.current = setInterval(loadQuote, QUOTE_POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [loadQuote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const premiumPerM = quote?.premiumPerM ?? null;
  const totalPremium = useMemo(
    () => (premiumPerM !== null && validSize ? premiumPerM * size : null),
    [premiumPerM, size, validSize],
  );
  const insufficient =
    totalPremium !== null && balanceUsd !== null && totalPremium > balanceUsd;

  const isCall = draft.side === "CALL";

  const handleConfirm = async () => {
    if (!validSize || totalPremium === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        tier: draft.tier,
        side: draft.side,
        strike: draft.strike,
        expiryDate: draft.expiryDate,
        contractsMillions: size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`pixel-sans rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
              isCall ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {isCall ? "Call" : "Put"}
          </span>
          <h2 className="pixel-serif text-xl text-black">{draft.label}</h2>
        </div>
        <p className="pixel-sans text-sm text-black/55">
          {isCall
            ? `Right to access ${draft.label} compute at ${fmtRate(
                draft.strike,
              )} through ${draft.expiryLabel}. If the rate spikes, you're protected; if it doesn't, you only lose the premium.`
            : `Right to sell ${draft.label} compute at ${fmtRate(
                draft.strike,
              )} through ${draft.expiryLabel}. Pays off if the rate falls; the most you can lose is the premium.`}
        </p>

        <label className="pixel-sans mt-5 block text-xs text-black/50">
          Size — millions of tokens
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={sizeMillions}
          onChange={(e) => setSizeMillions(e.target.value)}
          className="pixel-mono mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-black outline-none focus:border-black/40"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["10", "50", "100", "500"].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setSizeMillions(preset)}
              className="pixel-sans rounded-lg border border-black/15 px-2.5 py-1 text-xs text-black/60 hover:border-black/40"
            >
              {preset}M
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-2 rounded-xl bg-black/[0.03] p-4">
          <Row label="Premium" value={premiumPerM !== null ? fmtRate(premiumPerM) : "…"} />
          <Row
            label="Strike"
            value={`${fmtRate(draft.strike)}`}
          />
          <Row
            label="Forward now"
            value={quote ? fmtRate(quote.forward) : "…"}
          />
          <Row
            label="Breakeven"
            value={quote ? fmtRate(quote.breakeven) : "…"}
          />
          <Row label="Implied vol" value={quote ? `${quote.ivPercent.toFixed(1)}%` : "…"} />
          <Row
            label="Expiry"
            value={`${draft.expiryLabel} · ${quote?.daysToExpiry ?? "—"}d`}
          />
          <div className="my-1 border-t border-black/10" />
          <Row
            label="Total premium"
            value={totalPremium !== null ? fmtUsd(totalPremium) : "…"}
            strong
          />
          <Row
            label="Max loss"
            value={totalPremium !== null ? fmtUsd(totalPremium) : "…"}
            hint="premium only"
          />
        </div>

        {balanceUsd !== null && (
          <p className="pixel-sans mt-2 text-[11px] text-black/40">
            Credit balance: {fmtUsd(balanceUsd)} · debited on purchase
          </p>
        )}

        {quoteError && (
          <p className="pixel-sans mt-3 text-xs text-red-600">{quoteError}</p>
        )}
        {error && <p className="pixel-sans mt-3 text-xs text-red-600">{error}</p>}
        {insufficient && !error && (
          <p className="pixel-sans mt-3 text-xs text-amber-600">
            Premium exceeds your credit balance. Top up in Chat to buy.
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="pixel-sans rounded-xl border border-black/15 px-4 py-2.5 text-sm text-black/70 hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          {!hasSession ? (
            <button
              type="button"
              onClick={onConnect}
              className="pixel-sans flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-black/85"
            >
              Connect wallet to buy
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={
                submitting ||
                !validSize ||
                totalPremium === null ||
                Boolean(insufficient)
              }
              className={`pixel-sans flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                isCall ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {submitting
                ? "Buying…"
                : totalPremium !== null
                  ? `Buy for ${fmtUsd(totalPremium)}`
                  : "Buy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  hint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="pixel-sans text-xs text-black/45">
        {label}
        {hint && <span className="ml-1 text-black/30">({hint})</span>}
      </span>
      <span
        className={`pixel-mono ${strong ? "text-base font-medium text-black" : "text-sm text-black/70"}`}
      >
        {value}
      </span>
    </div>
  );
}
