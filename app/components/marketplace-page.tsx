import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  formatRatePerM,
  formatTokenMillions,
  hedgeSavingsPercent,
} from "../config/marketplace";
import { useBackendSession } from "../hooks/use-backend-session";
import { useDashboard } from "../hooks/use-dashboard";
import { useMarketplaceCatalog } from "../hooks/use-marketplace-catalog";
import { useMarketplacePurchase } from "../hooks/use-marketplace-purchase";
import { useAutonConfig } from "../hooks/use-auton-config";
import { useSolanaWallet } from "../hooks/use-solana-wallet";
import type { MarketplaceContract } from "../lib/api/marketplace";
import { formatUsdcFromMicro } from "../lib/solana/usdc-transfer";
import { LoginModal } from "./login-modal";
import { PixelBackground } from "./pixel-background";

const TYPE_FILTERS: { id: "all" | "future" | "capacity"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "future", label: "Futures" },
  { id: "capacity", label: "Capacity" },
];

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
  const modelLabel =
    contract.models.length > 0
      ? contract.models.map((model) => model.id).join(", ")
      : "Auton provider network (GPU workers)";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-colors hover:border-black/20 hover:bg-white md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="pixel-sans text-xs tracking-widest text-[#5a7a9a] uppercase">
            {contract.tier}
          </div>
          <h2 className="pixel-serif mt-1 text-xl text-black md:text-2xl">
            {contract.name}
          </h2>
          <p className="pixel-sans mt-2 text-sm text-black/60">
            {contract.subtitle}
          </p>
        </div>
        <span
          className={`pixel-sans shrink-0 rounded-lg border px-2.5 py-1 text-xs ${
            contract.type === "future"
              ? "border-emerald-500/30 text-emerald-700"
              : "border-[#80a0c1]/40 text-[#5a7a9a]"
          }`}
        >
          {contract.type === "future" ? "Future" : "Capacity"}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-black/8 bg-black/[0.03] p-3">
          <div className="pixel-sans text-xs text-black/45">Locked rate</div>
          <div className="pixel-serif mt-1 text-lg text-emerald-700">
            {formatRatePerM(contract.lockedRatePerM)}
          </div>
        </div>
        <div className="rounded-xl border border-black/8 bg-black/[0.03] p-3">
          <div className="pixel-sans text-xs text-black/45">Spot</div>
          <div className="pixel-serif mt-1 text-lg text-black/50 line-through decoration-black/25">
            {formatRatePerM(contract.spotRatePerM)}
          </div>
        </div>
      </div>

      <div className="pixel-sans mb-4 flex flex-wrap gap-2 text-xs text-black/55">
        <span className="rounded-md border border-black/10 px-2 py-1">
          {savings > 0 ? `Save ${savings}%` : "OpenRouter spot"}
        </span>
        <span className="rounded-md border border-black/10 px-2 py-1">
          Exp {contract.expiry}
        </span>
        <span className="rounded-md border border-black/10 px-2 py-1">
          Min {formatTokenMillions(contract.minPurchaseTokens)} tokens
        </span>
      </div>

      <ul className="pixel-sans mb-4 space-y-1.5 text-xs text-black/60">
        {contract.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="text-emerald-600/80">▸</span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="pixel-sans mb-4 text-xs text-black/45">
        <span className="text-black/55">OpenRouter models: </span>
        {modelLabel}
      </div>

      {userBalance !== undefined && (
        <div className="pixel-sans mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-800/90">
          Your balance: {formatTokenMillions(Number(userBalance))} tokens
          {Number(userBalance) <= 0 ? " — purchase to activate" : ""}
        </div>
      )}

      <div className="mt-auto flex gap-2">
        <Link
          to={`/dashboard?tier=${encodeURIComponent(contract.tier)}`}
          className="pixel-serif flex-1 rounded-xl border border-black/15 bg-black/[0.04] py-3 text-center text-sm text-black transition-colors hover:border-black/25"
        >
          Manage
        </Link>
        <button
          type="button"
          onClick={() => onPurchase(contract)}
          className="pixel-serif flex-1 rounded-xl border border-emerald-600/30 bg-emerald-600/10 py-3 text-sm text-emerald-800 transition-colors hover:border-emerald-600/45"
        >
          Purchase
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
  paymentRequired,
  onTokenAmountChange,
  onClose,
  onConfirm,
}: {
  contract: MarketplaceContract | null;
  open: boolean;
  purchasing: boolean;
  error: string | null;
  tokenAmount: string;
  paymentRequired: boolean;
  onTokenAmountChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !contract) return null;

  const estimatedCost =
    (Number(tokenAmount.replace(/,/g, "")) / 1_000_000) *
    contract.lockedRatePerM;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Purchase ${contract.name}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md border border-black/10 bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="pixel-serif text-xl text-black">{contract.name}</h2>
            <p className="pixel-sans mt-1 text-xs text-black/50">
              {contract.tier} · {formatRatePerM(contract.lockedRatePerM)} locked
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-black/50 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <label className="pixel-sans block text-xs text-black/50">
          Token amount (min {formatTokenMillions(contract.minPurchaseTokens)})
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={tokenAmount}
          onChange={(event) =>
            onTokenAmountChange(event.target.value.replace(/[^\d]/g, ""))
          }
          className="pixel-sans mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black focus:border-black/30 focus:outline-none"
        />

        <p className="pixel-sans mt-3 text-xs text-black/45">
          {paymentRequired ? "Pay" : "Est. cost"} ~ $
          {Number.isFinite(estimatedCost) ? estimatedCost.toFixed(2) : "0.00"}{" "}
          USDG · Expires {contract.expiry}
        </p>

        {error && (
          <p className="pixel-sans mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={purchasing}
            className="pixel-serif flex-1 rounded-xl border border-black/15 py-3 text-sm text-black/60 hover:border-black/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={purchasing}
            className="pixel-serif flex-1 rounded-xl border border-emerald-600/30 bg-emerald-600/10 py-3 text-sm text-emerald-800 hover:border-emerald-600/45 disabled:opacity-50"
          >
            {purchasing
              ? paymentRequired
                ? "Confirm in wallet..."
                : "Purchasing..."
              : paymentRequired
                ? "Pay USDG & purchase"
                : "Confirm purchase"}
          </button>
        </div>

        <p className="pixel-sans mt-4 text-[10px] leading-relaxed text-black/35">
          {paymentRequired
            ? "You will approve a USDG transfer to the Auton treasury, then your forward compute balance credits after on-chain confirmation."
            : "Credits your forward compute balance immediately (demo mode)."}
        </p>
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<"all" | "future" | "capacity">("all");
  const [loginOpen, setLoginOpen] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<MarketplaceContract | null>(
    null,
  );
  const [tokenAmount, setTokenAmount] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const navigate = useNavigate();
  const { authenticated, hasSession, syncing } = useBackendSession();
  const { address } = useSolanaWallet();
  const { data, refresh } = useDashboard(authenticated && hasSession);
  const { config } = useAutonConfig();
  const { catalog, contracts, loading: catalogLoading } = useMarketplaceCatalog();
  const { purchase, paying } = useMarketplacePurchase();
  const paymentRequired = config?.marketplacePaymentRequired ?? catalog.paymentRequired;

  const balanceByTier = useMemo(() => {
    const map = new Map<string, string>();
    for (const balance of data?.computeBalances ?? []) {
      map.set(balance.modelTier, balance.tokenBalanceRemaining);
    }
    return map;
  }, [data]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return contracts.filter((contract) => {
      const matchesType =
        typeFilter === "all" || contract.type === typeFilter;
      const matchesQuery =
        !normalized ||
        contract.name.toLowerCase().includes(normalized) ||
        contract.tier.toLowerCase().includes(normalized) ||
        contract.modelIds.some((model) =>
          model.toLowerCase().includes(normalized),
        ) ||
        contract.models.some(
          (model) =>
            model.name.toLowerCase().includes(normalized) ||
            model.id.toLowerCase().includes(normalized),
        );

      return matchesType && matchesQuery;
    });
  }, [query, typeFilter, contracts]);

  const handlePurchaseClick = (contract: MarketplaceContract) => {
    if (!authenticated) {
      setLoginOpen(true);
      return;
    }

    if (!hasSession) {
      setPurchaseError(
        syncing
          ? "Connecting to backend — try again in a moment."
          : "Could not connect to backend. Refresh and sign in again.",
      );
      return;
    }

    if (paymentRequired && !address) {
      setPurchaseError(
        "Connect a Robinhood wallet to pay with USDG. Twitter-only login cannot send on-chain payments.",
      );
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
        `Minimum purchase is ${formatTokenMillions(purchaseTarget.minPurchaseTokens)} tokens.`,
      );
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await purchase(purchaseTarget.tier, amount);
      await refresh();
      setPurchaseTarget(null);
      const usdcPaid = result.payment
        ? formatUsdcFromMicro(result.payment.usdcAmountMicro)
        : null;
      setPurchaseSuccess(
        usdcPaid
          ? `Paid ${usdcPaid} USDG for ${formatTokenMillions(amount)} tokens on ${purchaseTarget.name}. Balance: ${formatTokenMillions(Number(result.balance.tokenBalanceRemaining))}.`
          : `Purchased ${formatTokenMillions(amount)} tokens on ${purchaseTarget.name}. Balance: ${formatTokenMillions(Number(result.balance.tokenBalanceRemaining))}.`,
      );
    } catch (err) {
      setPurchaseError(
        err instanceof Error ? err.message : "Purchase failed",
      );
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <PixelBackground variant="fine" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="pixel-serif text-3xl text-black md:text-4xl">
            Compute Marketplace
          </h1>
          <p className="pixel-sans mt-4 max-w-3xl text-sm leading-relaxed text-black/60 md:text-base">
            Lock in fixed inference rates with forward contracts. Models and spot
            pricing sync from OpenRouter; gateway routes to the same model IDs.
          </p>
          {catalog.openRouterSyncedAt && (
            <p className="pixel-sans mt-2 text-xs text-emerald-700/80">
              OpenRouter catalog synced{" "}
              {new Date(catalog.openRouterSyncedAt).toLocaleString()}
            </p>
          )}
          {catalog.openRouterError && (
            <p className="pixel-sans mt-2 text-xs text-amber-700/80">
              OpenRouter sync: {catalog.openRouterError}
            </p>
          )}
          {catalogLoading && (
            <p className="pixel-sans mt-2 text-xs text-black/40">
              Loading live model catalog...
            </p>
          )}
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models, tiers, or capacity..."
            className="pixel-sans w-full rounded-xl border border-black/15 bg-white/80 px-4 py-3 text-sm text-black placeholder:text-black/40 backdrop-blur-sm focus:border-black/30 focus:outline-none md:max-w-md"
          />
          <div className="flex gap-2">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTypeFilter(filter.id)}
                className={`pixel-sans rounded-lg border px-3 py-2 text-xs transition-colors ${
                  typeFilter === filter.id
                    ? "border-black/25 bg-black/5 text-black"
                    : "border-black/10 text-black/50 hover:text-black"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {!authenticated && (
          <div className="pixel-sans mb-8 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black/60 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="text-[#80a0c1] transition-colors hover:text-[#80a0c1]/80"
            >
              Connect wallet
            </button>{" "}
            to purchase contracts and see your balances.
          </div>
        )}

        {purchaseSuccess && (
          <div className="pixel-sans mb-8 flex flex-col gap-3 rounded-2xl border border-emerald-600/25 bg-emerald-600/5 px-4 py-3 text-sm text-emerald-900/90 sm:flex-row sm:items-center sm:justify-between">
            <span>{purchaseSuccess}</span>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="text-left text-[#80a0c1] hover:underline sm:text-right"
            >
              Open dashboard →
            </button>
          </div>
        )}

        {purchaseError && !purchaseTarget && (
          <div className="pixel-sans mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {purchaseError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contract) => (
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

        {filtered.length === 0 && (
          <p className="pixel-sans mt-12 text-center text-sm text-black/40">
            No contracts match your search.
          </p>
        )}

        <section className="mt-16 border-t border-black/10 pt-12">
          <h2 className="pixel-serif mb-6 text-2xl text-black">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Purchase a forward tier",
                body: "Buy tokenized compute capacity at today's locked rate before spot moves.",
              },
              {
                step: "02",
                title: "Get an API key",
                body: "Generate a gateway key in your dashboard for autonomous agents.",
              },
              {
                step: "03",
                title: "Route inference",
                body: "Point any OpenAI-compatible client at Auton — balances deduct per token.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-black/10 bg-white/70 p-5 backdrop-blur-sm"
              >
                <div className="pixel-serif text-2xl text-black/30">
                  {item.step}
                </div>
                <h3 className="pixel-serif mt-2 text-lg text-black">
                  {item.title}
                </h3>
                <p className="pixel-sans mt-2 text-sm text-black/60">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <PurchaseModal
        contract={purchaseTarget}
        open={purchaseTarget !== null}
        purchasing={purchasing || paying}
        paymentRequired={paymentRequired}
        error={purchaseError}
        tokenAmount={tokenAmount}
        onTokenAmountChange={setTokenAmount}
        onClose={() => {
          if (purchasing) return;
          setPurchaseTarget(null);
          setPurchaseError(null);
        }}
        onConfirm={() => void handleConfirmPurchase()}
      />
    </div>
  );
}
