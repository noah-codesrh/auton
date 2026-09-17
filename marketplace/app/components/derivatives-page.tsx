import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { formatRatePerM } from "../config/marketplace";
import { useBackendSession } from "../hooks/use-backend-session";
import { useCredits } from "../hooks/use-credits";
import { useDerivatives } from "../hooks/use-derivatives";
import { useOptions } from "../hooks/use-options";
import type { ModelDerivatives } from "../lib/api/derivatives";
import type { OptionOrderInput, OptionSide } from "../lib/api/options";
import { BuyOptionModal, type OptionDraft } from "./buy-option-modal";
import { LoginModal } from "./login-modal";
import { OptionPositions } from "./option-positions";
import { OptionsChain } from "./options-chain";
import { SuccessOverlay } from "./success-check";
import { VolSmileChart } from "./vol-smile-chart";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
      <div className="pixel-sans text-xs text-black/45">{label}</div>
      <div className="pixel-serif mt-1 text-xl text-black">{value}</div>
      {sub && <div className="pixel-sans mt-0.5 text-[11px] text-black/40">{sub}</div>}
    </div>
  );
}

function CalendarSpreads({ model }: { model: ModelDerivatives }) {
  if (model.calendarSpreads.length === 0) {
    return (
      <p className="pixel-sans p-4 text-center text-xs text-black/40">
        Needs two or more expiries to form a calendar spread.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="pixel-sans text-[10px] uppercase tracking-wide text-black/35">
            <th className="px-4 py-1.5 font-normal">Strike (ATM)</th>
            <th className="px-4 py-1.5 font-normal">Near</th>
            <th className="px-4 py-1.5 font-normal">Far</th>
            <th className="px-4 py-1.5 font-normal">Near premium</th>
            <th className="px-4 py-1.5 font-normal">Far premium</th>
            <th className="px-4 py-1.5 text-right font-normal">Spread</th>
          </tr>
        </thead>
        <tbody className="pixel-mono">
          {model.calendarSpreads.map((cs) => {
            const up = cs.spread >= 0;
            return (
              <tr key={`${cs.nearLabel}-${cs.farLabel}`} className="border-t border-black/5">
                <td className="px-4 py-2 text-black">${cs.strike.toFixed(cs.strike < 1 ? 3 : 2)}</td>
                <td className="pixel-sans px-4 py-2 text-black/60">{cs.nearLabel}</td>
                <td className="pixel-sans px-4 py-2 text-black/60">{cs.farLabel}</td>
                <td className="px-4 py-2 text-black/60">{cs.nearPremium.toFixed(4)}</td>
                <td className="px-4 py-2 text-black/60">{cs.farPremium.toFixed(4)}</td>
                <td className={`px-4 py-2 text-right ${up ? "text-emerald-700" : "text-red-600"}`}>
                  {up ? "+" : ""}
                  {cs.spread.toFixed(4)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DerivativesPage() {
  const { data, models, loading, error } = useDerivatives();
  const syncedAt = data?.syncedAt ?? null;

  const { hasSession } = useBackendSession();
  const { balance, refresh: refreshBalance } = useCredits();
  const {
    openPositions,
    closedPositions,
    working,
    buy,
    close,
  } = useOptions();

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [boardIdx, setBoardIdx] = useState(0);
  const [draft, setDraft] = useState<OptionDraft | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTier && models.length > 0) setSelectedTier(models[0].tier);
  }, [models, selectedTier]);

  const model = useMemo(
    () => models.find((m) => m.tier === selectedTier) ?? models[0] ?? null,
    [models, selectedTier],
  );

  // Clamp the board selection whenever the model changes.
  useEffect(() => {
    setBoardIdx(0);
  }, [selectedTier]);

  const board = model?.boards[Math.min(boardIdx, (model?.boards.length ?? 1) - 1)] ?? null;

  const handleBuyClick = useCallback(
    (side: OptionSide, strike: number) => {
      if (!model || !board) return;
      setDraft({
        tier: model.tier,
        label: model.label,
        side,
        strike,
        expiryDate: board.expiryDate,
        expiryLabel: board.expiryLabel,
      });
    },
    [model, board],
  );

  const handleConfirm = useCallback(
    async (input: OptionOrderInput) => {
      await buy(input);
      await refreshBalance();
      setDraft(null);
      setSuccess(
        `${input.side === "CALL" ? "Call" : "Put"} bought — position is now live in your book.`,
      );
    },
    [buy, refreshBalance],
  );

  const handleClose = useCallback(
    async (positionId: string) => {
      await close(positionId);
      await refreshBalance();
    },
    [close, refreshBalance],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="pixel-sans rounded-full border border-[#80a0c1]/30 bg-[#80a0c1]/[0.08] px-2.5 py-1 text-[11px] tracking-wider text-[#4f7299] uppercase">
              Layer 4
            </span>
            {loading && models.length > 0 && (
              <span className="pixel-sans text-xs text-black/40">Updating…</span>
            )}
          </div>
          {hasSession ? (
            <span className="pixel-sans rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-black/60">
              Credits:{" "}
              <span className="pixel-mono text-black">
                ${balance ? balance.balanceUsd.toFixed(2) : "0.00"}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="pixel-sans rounded-full border border-black/15 px-3 py-1 text-xs text-black/60 hover:border-black/40"
            >
              Connect wallet
            </button>
          )}
        </div>
        <h1 className="pixel-serif text-3xl text-black md:text-4xl">
          Options & Derivatives
        </h1>
        <p className="pixel-sans mt-2 max-w-2xl text-sm text-black/60 md:text-base">
          Calls and puts on AI compute, priced with Black-76 off the{" "}
          <Link to="/yield-curve" className="text-[#4f7299] underline-offset-2 hover:underline">
            yield curve
          </Link>
          . Buy a call to lock today's price against a future spike, grab
          downside protection with puts, or trade pure volatility — premium is
          paid from your credit balance.
        </p>
      </header>

      {error && models.length === 0 ? (
        <div className="pixel-sans rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : loading && models.length === 0 ? (
        <div className="pixel-sans flex h-[420px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
          Pricing the surface…
        </div>
      ) : model ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Compute VIX"
              value={data?.computeVixPercent !== null && data?.computeVixPercent !== undefined ? `${data.computeVixPercent.toFixed(1)}%` : "—"}
              sub="avg ATM vol, all models"
            />
            <StatTile
              label={`${model.label} vol index`}
              value={model.volIndexPercent !== null ? `${model.volIndexPercent.toFixed(1)}%` : "—"}
              sub="front-board ATM vol"
            />
            <StatTile label="Spot now" value={formatRatePerM(model.spot)} sub="live blended rate" />
            <StatTile
              label="Risk-free rate"
              value={data ? `${(data.riskFreeRate * 100).toFixed(1)}%` : "—"}
              sub="discounting"
            />
          </div>

          {/* Model selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {models.map((m) => {
              const active = m.tier === model.tier;
              return (
                <button
                  key={m.tier}
                  type="button"
                  onClick={() => setSelectedTier(m.tier)}
                  className={`pixel-sans flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    active
                      ? "border-black/30 bg-black/[0.04] text-black"
                      : "border-black/15 text-black/60 hover:border-black/30"
                  }`}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Expiry selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {model.boards.map((b, i) => {
              const active = b === board;
              return (
                <button
                  key={b.expiryDate}
                  type="button"
                  onClick={() => setBoardIdx(i)}
                  className={`pixel-sans rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-black/15 text-black/60 hover:border-black/30"
                  }`}
                >
                  {b.expiryLabel}
                  <span className={`pixel-mono ml-1.5 text-[10px] ${active ? "text-white/60" : "text-black/35"}`}>
                    {b.daysToExpiry}d
                  </span>
                </button>
              );
            })}
          </div>

          {/* Smile + board summary */}
          <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="pixel-serif text-lg text-black">Volatility smile</h2>
                <span className="pixel-sans text-xs text-black/40">IV vs strike</span>
              </div>
              <VolSmileChart board={board} color={model.color} />
            </div>
            <div className="flex flex-col gap-3">
              <StatTile label="Forward" value={board ? formatRatePerM(board.forward) : "—"} sub="option underlying" />
              <StatTile label="ATM strike" value={board ? `$${board.atmStrike.toFixed(board.atmStrike < 1 ? 3 : 2)}` : "—"} />
              <StatTile
                label="Time to expiry"
                value={board ? `${board.daysToExpiry}d` : "—"}
                sub={board ? `${board.yearsToExpiry.toFixed(2)} yr` : undefined}
              />
            </div>
          </section>

          {/* Options chain */}
          <section className="mb-8 rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-black/10 px-5 py-3">
              <h2 className="pixel-serif text-lg text-black">
                {model.label} chain · {board?.expiryLabel}
              </h2>
              <span className="pixel-sans text-xs text-black/40">
                tap a premium to buy · $/M tokens
              </span>
            </div>
            <OptionsChain board={board} onBuy={handleBuyClick} />
          </section>

          {/* Your positions */}
          <section className="mb-8 rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-black/10 px-5 py-3">
              <h2 className="pixel-serif text-lg text-black">Your option positions</h2>
              <span className="pixel-sans text-xs text-black/40">marked-to-market live</span>
            </div>
            <OptionPositions
              open={openPositions}
              closed={closedPositions}
              hasSession={hasSession}
              working={working}
              onClose={handleClose}
              onConnect={() => setLoginOpen(true)}
            />
          </section>

          {/* Calendar spreads */}
          <section className="mb-8 rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-black/10 px-5 py-3">
              <h2 className="pixel-serif text-lg text-black">Calendar spreads</h2>
              <span className="pixel-sans text-xs text-black/40">ATM call · far − near</span>
            </div>
            <CalendarSpreads model={model} />
          </section>

          <div className="pixel-sans mt-8 flex flex-wrap items-center gap-4 text-sm">
            <Link
              to="/yield-curve"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-500"
            >
              View the yield curve
            </Link>
            <Link
              to="/trade"
              className="rounded-xl border border-black/15 px-5 py-3 text-black hover:bg-black/[0.03]"
            >
              Trade futures
            </Link>
            {syncedAt && (
              <span className="text-xs text-black/40">
                Spot synced {new Date(syncedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <p className="pixel-sans mt-6 text-[11px] leading-relaxed text-black/35">
            Premia and Greeks are model-derived (Black-76 on the live forward
            curve with a family volatility surface). Options are bought and
            marked in USD credits — a paper compute-options desk for hedging and
            price discovery, with no on-chain settlement.
          </p>
        </>
      ) : (
        <div className="pixel-sans flex h-[300px] items-center justify-center rounded-2xl border border-black/10 text-sm text-black/40">
          No derivatives available yet.
        </div>
      )}

      {draft && (
        <BuyOptionModal
          draft={draft}
          hasSession={hasSession}
          balanceUsd={balance ? balance.balanceUsd : null}
          onConnect={() => {
            setDraft(null);
            setLoginOpen(true);
          }}
          onClose={() => setDraft(null)}
          onConfirm={handleConfirm}
        />
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <SuccessOverlay
        open={Boolean(success)}
        title="Option bought"
        message={success}
        onDone={() => setSuccess(null)}
      />
    </main>
  );
}
