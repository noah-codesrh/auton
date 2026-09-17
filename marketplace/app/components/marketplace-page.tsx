import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  contractLabel,
  contractModelFamily,
  formatExpiryShort,
  formatRatePerM,
  formatRelativeTime,
  formatTokenMillions,
  hedgeSavingsPerM,
  hedgeSavingsPercent,
} from "../config/marketplace";
import { useBackendSession } from "../hooks/use-backend-session";
import { useConfig } from "../hooks/use-config";
import { useDashboard } from "../hooks/use-dashboard";
import { useMarketplaceCatalog } from "../hooks/use-marketplace-catalog";
import { useMarketplacePurchase } from "../hooks/use-marketplace-purchase";
import { useSolanaWallet } from "../hooks/use-solana-wallet";
import type { MarketplaceContract } from "../lib/api/marketplace";
import { LoginModal } from "./login-modal";
import { SuccessOverlay } from "./success-check";

function ContractCard({
  contract,
  userBalance,
  onPurchase,
}: {
  contract: MarketplaceContract;
  userBalance?: string;
  onPurchase: (contract: MarketplaceContract) => void;
}) {
  const savings = hedgeSavingsPercent(contract);
  const savingsPerM = hedgeSavingsPerM(contract);
  const label = contractLabel(contract.tier, contract.name);
  const balance = userBalance !== undefined ? Number(userBalance) : null;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="pixel-serif text-2xl text-black">{label}</h2>
          <p className="pixel-sans mt-1 text-sm text-black/50">
            {contractModelFamily(contract.tier)}
          </p>
        </div>
        {savings > 0 && (
          <span className="pixel-sans rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
            −{savings}%
          </span>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/[0.03] p-3">
          <div className="pixel-sans text-xs text-black/45">Your price</div>
          <div className="pixel-serif mt-1 text-xl text-black">
            {formatRatePerM(contract.lockedRatePerM)}
          </div>
          <div className="pixel-sans mt-1 text-[11px] text-black/40">
            Locked futures rate
          </div>
        </div>
        <div className="rounded-xl bg-black/[0.03] p-3">
          <div className="pixel-sans flex items-center gap-1.5 text-xs text-black/45">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Market now
          </div>
          <div className="pixel-serif mt-1 text-xl text-black/35 line-through">
            {formatRatePerM(contract.spotRatePerM)}
          </div>
          <div className="pixel-sans mt-1 text-[11px] text-black/40">
            {savingsPerM && savingsPerM > 0
              ? `Save ${formatRatePerM(savingsPerM)}`
              : "Live OpenRouter rate"}
          </div>
        </div>
      </div>

      <div className="pixel-sans mb-5 flex gap-4 text-sm text-black/50">
        <span>Until {formatExpiryShort(contract.expiry)}</span>
        <span>·</span>
        <span>From {formatTokenMillions(contract.minPurchaseTokens)}</span>
      </div>

      {balance !== null && (
        <div className="pixel-sans mb-5 text-sm text-black/70">
          Balance:{" "}
          <span className="text-emerald-700">
            {formatTokenMillions(balance)}
          </span>
        </div>
      )}

      <div className="mt-auto flex gap-2">
        {balance !== null && balance > 0 && (
          <Link
            to={`/dashboard?tier=${encodeURIComponent(contract.tier)}`}
            className="pixel-sans flex-1 rounded-xl border border-black/15 py-3 text-center text-sm text-black hover:bg-black/[0.03]"
          >
            View
          </Link>
        )}
        <button
          type="button"
          onClick={() => onPurchase(contract)}
          className="pixel-sans flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Buy
        </button>
      </div>
    </article>
  );
}

function PurchaseModal({
  contract,
  open,
  purchasing,
  error,
  tokenAmount,
  quoteUsdc,
  onTokenAmountChange,
  onClose,
  onConfirm,
}: {
  contract: MarketplaceContract | null;
  open: boolean;
  purchasing: boolean;
  error: string | null;
  tokenAmount: string;
  quoteUsdc: string | null;
  onTokenAmountChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !contract) return null;

  const label = contractLabel(contract.tier, contract.name);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Buy ${label}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <h2 className="pixel-serif text-xl text-black">Buy {label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-black/40 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <label className="pixel-sans block text-sm text-black/50">
          Tokens
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={tokenAmount}
          onChange={(event) =>
            onTokenAmountChange(event.target.value.replace(/[^\d]/g, ""))
          }
          className="pixel-sans mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-lg text-black focus:border-black/30 focus:outline-none"
        />
        <p className="pixel-sans mt-2 text-xs text-black/40">
          Min {formatTokenMillions(contract.minPurchaseTokens)}
        </p>

        <div className="pixel-sans mt-5 flex items-center justify-between rounded-xl bg-black/[0.03] px-4 py-3">
          <span className="text-black/50">Total</span>
          <span className="text-lg text-black">
            {quoteUsdc ? `$${quoteUsdc}` : "—"} USDG
          </span>
        </div>

        {error && (
          <p className="pixel-sans mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={purchasing}
          className="pixel-sans mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {purchasing ? "Confirm in wallet..." : `Pay ${quoteUsdc ? `$${quoteUsdc}` : ""}`}
        </button>
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [purchaseTarget, setPurchaseTarget] =
    useState<MarketplaceContract | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  const navigate = useNavigate();
  const { authenticated, hasSession, syncing } = useBackendSession();
  const { address } = useSolanaWallet();
  const { config } = useConfig();
  const { data, refresh } = useDashboard(authenticated && hasSession);
  const {
    contracts,
    loading,
    refreshing,
    error: catalogError,
    refresh: refreshCatalog,
    syncedAt,
    syncError,
  } = useMarketplaceCatalog();
  const { purchase, paying } = useMarketplacePurchase();

  const paymentRequired = config?.marketplacePaymentRequired ?? true;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);
  const syncedLabel = useMemo(
    () => formatRelativeTime(syncedAt),
    // re-derive as time ticks
    [syncedAt, now],
  );

  const balanceByTier = useMemo(() => {
    const map = new Map<string, string>();
    for (const balance of data?.computeBalances ?? []) {
      map.set(balance.modelTier, balance.tokenBalanceRemaining);
    }
    return map;
  }, [data]);

  const quoteUsdc = useMemo(() => {
    if (!purchaseTarget) return null;
    const amount = Number(tokenAmount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const cost = (amount / 1_000_000) * purchaseTarget.lockedRatePerM;
    return cost.toFixed(2);
  }, [purchaseTarget, tokenAmount]);

  const handlePurchaseClick = (contract: MarketplaceContract) => {
    if (!authenticated) {
      setLoginOpen(true);
      return;
    }

    if (!hasSession) {
      setPurchaseError(
        syncing ? "Connecting..." : "Couldn't connect. Try again.",
      );
      return;
    }

    if (paymentRequired && !address) {
      setPurchaseError("Connect a wallet to pay.");
      setLoginOpen(true);
      return;
    }

    setPurchaseError(null);
    setPurchaseSuccess(null);
    setPurchaseTarget(contract);
    setTokenAmount(String(contract.minPurchaseTokens));
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseTarget) return;

    const amount = Number(tokenAmount);
    if (!Number.isFinite(amount) || amount < purchaseTarget.minPurchaseTokens) {
      setPurchaseError(
        `Minimum is ${formatTokenMillions(purchaseTarget.minPurchaseTokens)}.`,
      );
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await purchase(purchaseTarget.tier, amount);
      await refresh();
      setPurchaseTarget(null);
      const label = contractLabel(purchaseTarget.tier, purchaseTarget.name);
      setPurchaseSuccess(
        `${formatTokenMillions(amount)} ${label} credits added.`,
      );
      setShowSuccessCheck(true);
    } catch (err) {
      setPurchaseError(
        err instanceof Error ? err.message : "Purchase failed",
      );
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-10 text-center">
        <h1 className="pixel-serif text-3xl text-black md:text-4xl">
          Buy AI credits early
        </h1>
        <p className="pixel-sans mt-3 text-black/50">
          Lock today&apos;s price. Use anytime before expiry.
        </p>

        <div className="pixel-sans mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-black/55">
          {syncError ? (
            <>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Market pricing temporarily unavailable</span>
            </>
          ) : (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span>
                Live market pricing from OpenRouter
                {syncedLabel ? ` · updated ${syncedLabel}` : ""}
              </span>
              <button
                type="button"
                onClick={() => void refreshCatalog()}
                disabled={refreshing}
                className="ml-1 text-emerald-700 hover:text-emerald-600 disabled:opacity-50"
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </>
          )}
        </div>
      </div>

      {!authenticated && (
        <div className="pixel-sans mb-8 text-center text-sm text-black/50">
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="text-emerald-700 hover:text-emerald-600"
          >
            Connect wallet
          </button>{" "}
          to buy or see your balance
        </div>
      )}

      {purchaseSuccess && (
        <div className="pixel-sans mb-8 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{purchaseSuccess}</span>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 text-emerald-700 hover:underline"
          >
            Dashboard →
          </button>
        </div>
      )}

      {purchaseError && !purchaseTarget && (
        <div className="pixel-sans mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {purchaseError}
        </div>
      )}

      {catalogError && (
        <div className="pixel-sans mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {catalogError}
        </div>
      )}

      {loading && contracts.length === 0 && (
        <p className="pixel-sans text-center text-sm text-black/40">Loading...</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => (
          <ContractCard
            key={contract.tier}
            contract={contract}
            userBalance={
              authenticated && hasSession
                ? balanceByTier.get(contract.tier) ?? "0"
                : undefined
            }
            onPurchase={handlePurchaseClick}
          />
        ))}
      </div>

      {!loading && contracts.length > 0 && (
        <div className="pixel-sans mt-12 flex justify-center gap-8 text-center text-sm text-black/40">
          <div>
            <div className="mb-1 text-black/70">1. Buy</div>
            Pay USDG
          </div>
          <div>
            <div className="mb-1 text-black/70">2. Key</div>
            Get API key
          </div>
          <div>
            <div className="mb-1 text-black/70">3. Use</div>
            Run AI apps
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <PurchaseModal
        contract={purchaseTarget}
        open={purchaseTarget !== null}
        purchasing={purchasing || paying}
        error={purchaseError}
        tokenAmount={tokenAmount}
        quoteUsdc={quoteUsdc}
        onTokenAmountChange={setTokenAmount}
        onClose={() => {
          if (purchasing) return;
          setPurchaseTarget(null);
          setPurchaseError(null);
        }}
        onConfirm={() => void handleConfirmPurchase()}
      />

      <SuccessOverlay
        open={showSuccessCheck}
        title="Purchase complete"
        message={purchaseSuccess}
        onDone={() => setShowSuccessCheck(false)}
      />
    </main>
  );
}
