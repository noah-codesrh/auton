import { useEffect, useMemo, useState } from "react";
import { contractLabel } from "../config/marketplace";
import { useAutoPrice } from "../hooks/use-auto-price";
import { useBackendSession } from "../hooks/use-backend-session";
import { useTradeActions } from "../hooks/use-trade-actions";
import { useWalletBalances } from "../hooks/use-wallet-balances";
import {
  useMarketDepth,
  useTradeMarkets,
  useTradingAccount,
} from "../hooks/use-trade";
import type {
  CollateralAsset,
  MarginAccount,
  OrderType,
  Orderbook,
  Position,
  TradeMarket,
  TradeTick,
} from "../lib/api/trade";
import type { WalletBalances } from "../hooks/use-wallet-balances";
import { useDerivatives } from "../hooks/use-derivatives";
import { useYieldCurve } from "../hooks/use-yield-curve";
import { LoginModal } from "./login-modal";
import { MiniOptions } from "./mini-options";
import { MiniYieldCurve } from "./mini-yield-curve";
import { SuccessOverlay } from "./success-check";
import { TradingChart } from "./trading-chart";

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  MARKET: "Market",
  LIMIT: "Limit",
  STOP_MARKET: "Stop Market",
  STOP_LIMIT: "Stop Limit",
  TAKE_MARKET: "Take Market",
  TAKE_LIMIT: "Take Limit",
  SCALE: "Scale",
  TWAP: "TWAP",
};

const ORDER_TYPE_SHORT: Record<OrderType, string> = {
  MARKET: "Market",
  LIMIT: "Limit",
  STOP_MARKET: "Stop",
  STOP_LIMIT: "Stop Limit",
  TAKE_MARKET: "Take",
  TAKE_LIMIT: "Take Limit",
  SCALE: "Scale",
  TWAP: "TWAP",
};

const PRO_ORDER_TYPES: OrderType[] = [
  "SCALE",
  "STOP_LIMIT",
  "STOP_MARKET",
  "TAKE_LIMIT",
  "TAKE_MARKET",
  "TWAP",
];

const TYPES_NEEDING_LIMIT: OrderType[] = ["LIMIT", "STOP_LIMIT", "TAKE_LIMIT"];
const TYPES_NEEDING_TRIGGER: OrderType[] = [
  "STOP_MARKET",
  "STOP_LIMIT",
  "TAKE_MARKET",
  "TAKE_LIMIT",
];

function fmtPrice(value: number) {
  return `$${value.toFixed(4)}`;
}

function fmtUsd(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Top ticker strip — every market, compact and horizontally scrollable. */
function TickerStrip({
  markets,
  selectedTier,
  onSelect,
}: {
  markets: TradeMarket[];
  selectedTier: string | null;
  onSelect: (tier: string) => void;
}) {
  return (
    <div className="flex items-stretch overflow-x-auto border-b border-black/10 bg-black/[0.015]">
      {markets.map((market) => {
        const active = market.tier === selectedTier;
        const up = market.changePercent >= 0;
        return (
          <button
            key={market.tier}
            type="button"
            onClick={() => onSelect(market.tier)}
            className={`flex shrink-0 items-center gap-2 border-r border-black/10 px-3 py-1.5 transition-colors ${
              active ? "bg-white" : "hover:bg-white/60"
            }`}
          >
            <span className="pixel-sans text-xs font-medium text-black">
              {contractLabel(market.tier, market.name)}
            </span>
            <span className="pixel-mono text-[11px] text-black/55">
              {fmtPrice(market.markPrice)}
            </span>
            <span
              className={`pixel-mono text-[11px] ${
                up ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {up ? "+" : ""}
              {market.changePercent}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Instrument header bar: symbol + live stats, like BULK's market info row. */
function MarketHeader({
  market,
  markets,
  onSelect,
}: {
  market: TradeMarket;
  markets: TradeMarket[];
  onSelect: (tier: string) => void;
}) {
  const up = market.changePercent >= 0;
  const Stat = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
    <div className="px-4 py-2">
      <div className="pixel-sans text-[10px] uppercase tracking-wide text-black/35">
        {label}
      </div>
      <div className={`pixel-mono text-sm ${tone ?? "text-black"}`}>{value}</div>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center divide-x divide-black/10 border-b border-black/10">
      <div className="px-3 py-1.5">
        <MarketSelect
          market={market}
          markets={markets}
          onSelect={onSelect}
        />
      </div>
      <Stat
        label="Mark"
        value={fmtPrice(market.markPrice)}
        tone={up ? "text-emerald-600" : "text-red-600"}
      />
      <Stat label="Spot (live)" value={fmtPrice(market.spotPrice)} tone="text-black/70" />
      <Stat
        label="24h change"
        value={`${up ? "+" : ""}${market.changePercent}%`}
        tone={up ? "text-emerald-600" : "text-red-600"}
      />
      <Stat label="Models" value={`${market.modelIds.length} routable`} tone="text-black/70" />
    </div>
  );
}

/** Clickable market name with a dropdown to switch between models. */
function MarketSelect({
  market,
  markets,
  onSelect,
}: {
  market: TradeMarket;
  markets: TradeMarket[];
  onSelect: (tier: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-black/[0.04]"
      >
        <span className="pixel-serif text-base text-black">
          {contractLabel(market.tier, market.name)}
        </span>
        <span className="pixel-sans rounded bg-black/[0.06] px-1.5 py-0.5 text-[10px] uppercase text-black/50">
          Future
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-30 mt-1 max-h-[340px] w-72 overflow-y-auto rounded-xl border border-black/10 bg-white py-1 shadow-xl">
            <div className="pixel-sans px-3 py-1.5 text-[10px] uppercase tracking-wide text-black/30">
              Select market
            </div>
            {markets.map((m) => {
              const active = m.tier === market.tier;
              const mUp = m.changePercent >= 0;
              return (
                <button
                  key={m.tier}
                  type="button"
                  onClick={() => {
                    onSelect(m.tier);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
                    active ? "bg-black/[0.04]" : "hover:bg-black/[0.03]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="pixel-sans text-sm text-black">
                      {contractLabel(m.tier, m.name)}
                    </span>
                    <span className="pixel-sans text-[10px] text-black/30">
                      {m.symbol}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="pixel-mono text-xs text-black/60">
                      {fmtPrice(m.markPrice)}
                    </span>
                    <span
                      className={`pixel-mono text-[11px] ${
                        mUp ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {mUp ? "+" : ""}
                      {m.changePercent}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function OrderBookPanel({ book }: { book: Orderbook | null }) {
  if (!book) {
    return (
      <div className="pixel-sans p-4 text-center text-xs text-black/40">
        Loading book…
      </div>
    );
  }

  const maxTotal = Math.max(
    book.bids[book.bids.length - 1]?.total ?? 1,
    book.asks[book.asks.length - 1]?.total ?? 1,
  );

  const Row = ({
    level,
    side,
  }: {
    level: Orderbook["bids"][number];
    side: "bid" | "ask";
  }) => (
    <div className="relative grid grid-cols-3 px-3 py-[3px] text-[11px]">
      <div
        className={`absolute inset-y-0 right-0 ${
          side === "bid" ? "bg-emerald-50" : "bg-red-50"
        }`}
        style={{ width: `${(level.total / maxTotal) * 100}%` }}
      />
      <span
        className={`pixel-mono relative ${
          side === "bid" ? "text-emerald-700" : "text-red-600"
        }`}
      >
        {level.price.toFixed(4)}
      </span>
      <span className="pixel-mono relative text-right text-black/60">
        {level.size.toFixed(1)}
      </span>
      <span className="pixel-mono relative text-right text-black/35">
        {level.total.toFixed(0)}
      </span>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] uppercase tracking-wide text-black/35">
        <span>Price</span>
        <span className="text-right">Size (M)</span>
        <span className="text-right">Total</span>
      </div>
      <div className="flex flex-col-reverse">
        {book.asks.map((level) => (
          <Row key={`a${level.price}`} level={level} side="ask" />
        ))}
      </div>
      <div className="flex items-baseline justify-between border-y border-black/10 px-3 py-1.5">
        <span className="pixel-mono text-sm text-black">{fmtPrice(book.mark)}</span>
        <span className="pixel-sans text-[10px] text-black/40">
          spread {book.spread.toFixed(4)}
        </span>
      </div>
      <div>
        {book.bids.map((level) => (
          <Row key={`b${level.price}`} level={level} side="bid" />
        ))}
      </div>
    </div>
  );
}

function TradesPanel({ trades }: { trades: TradeTick[] }) {
  return (
    <div>
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] uppercase tracking-wide text-black/35">
        <span>Price</span>
        <span className="text-right">Size (M)</span>
        <span className="text-right">Time</span>
      </div>
      <div className="max-h-[560px] overflow-y-auto">
        {trades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-3 px-3 py-[3px] text-[11px]">
            <span
              className={`pixel-mono ${
                trade.side === "buy" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {trade.price.toFixed(4)}
              {trade.source === "market" && (
                <span className="ml-1 text-[9px] text-black/40">●</span>
              )}
            </span>
            <span className="pixel-mono text-right text-black/60">
              {trade.sizeMillions.toFixed(2)}
            </span>
            <span className="pixel-mono text-right text-black/35">
              {fmtTime(trade.time)}
            </span>
          </div>
        ))}
        {trades.length === 0 && (
          <p className="pixel-sans p-3 text-center text-xs text-black/40">
            No trades yet
          </p>
        )}
      </div>
    </div>
  );
}

export function TradePage() {
  const { data: marketsData, loading, error } = useTradeMarkets();
  const markets = useMemo(() => marketsData?.markets ?? [], [marketsData]);
  const leverageOptions = marketsData?.leverageOptions ?? [1, 2, 5, 10];

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedTier && markets.length) setSelectedTier(markets[0].tier);
  }, [markets, selectedTier]);

  const selected = markets.find((m) => m.tier === selectedTier) ?? null;

  const { authenticated, hasSession, address } = useBackendSession();
  const accountEnabled = authenticated && hasSession;
  const { data: account, refresh } = useTradingAccount(accountEnabled);
  const { orderbook, trades } = useMarketDepth(selectedTier);
  const { curves, loading: curvesLoading } = useYieldCurve();
  const selectedCurve =
    curves.find((c) => c.tier === selectedTier) ?? null;
  const { models: derivModels, loading: derivLoading } = useDerivatives();
  const selectedDeriv =
    derivModels.find((m) => m.tier === selectedTier) ?? null;
  const autoPrice = useAutoPrice();
  const { balances: walletBalances } = useWalletBalances(address, {
    autoMint: marketsData?.autoTokenMint,
    autoDecimals: marketsData?.autoTokenDecimals,
    usdcMint: marketsData?.usdcTokenMint,
    usdcDecimals: marketsData?.usdcTokenDecimals,
  });
  const actions = useTradeActions({
    vaultWallet: marketsData?.vaultWallet,
    autoTokenMint: marketsData?.autoTokenMint,
    autoTokenDecimals: marketsData?.autoTokenDecimals,
    usdcTokenMint: marketsData?.usdcTokenMint,
    usdcTokenDecimals: marketsData?.usdcTokenDecimals,
    depositRequired: marketsData?.depositRequired,
  });

  const [leverage, setLeverage] = useState(2);
  const [sizeInput, setSizeInput] = useState("1");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [proOpen, setProOpen] = useState(false);
  const [limitPriceInput, setLimitPriceInput] = useState("");
  const [triggerPriceInput, setTriggerPriceInput] = useState("");
  const [scaleLowInput, setScaleLowInput] = useState("");
  const [scaleHighInput, setScaleHighInput] = useState("");
  const [scaleCountInput, setScaleCountInput] = useState("5");
  const [twapDurationInput, setTwapDurationInput] = useState("30");
  const [twapCountInput, setTwapCountInput] = useState("6");
  const [depthTab, setDepthTab] = useState<
    "book" | "trades" | "curve" | "options"
  >("book");
  const [bottomTab, setBottomTab] = useState<
    "positions" | "orders" | "balances" | "history"
  >("positions");
  const [loginOpen, setLoginOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositInput, setDepositInput] = useState("");
  const [depositAsset, setDepositAsset] = useState<CollateralAsset>("USDC");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawInput, setWithdrawInput] = useState("");
  const [withdrawAsset, setWithdrawAsset] = useState<CollateralAsset>("USDC");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const sizeMillions = Number(sizeInput) || 0;
  const mark = selected?.markPrice ?? 0;
  const limitPrice = Number(limitPriceInput) || 0;
  const triggerPrice = Number(triggerPriceInput) || 0;
  const scaleLow = Number(scaleLowInput) || 0;
  const scaleHigh = Number(scaleHighInput) || 0;
  const scaleCount = Math.floor(Number(scaleCountInput) || 0);
  const twapDuration = Number(twapDurationInput) || 0;
  const twapCount = Math.floor(Number(twapCountInput) || 0);

  const needsLimit = TYPES_NEEDING_LIMIT.includes(orderType);
  const needsTrigger = TYPES_NEEDING_TRIGGER.includes(orderType);
  const isScale = orderType === "SCALE";
  const isTwap = orderType === "TWAP";
  const isMarket = orderType === "MARKET";

  // Estimate the fill price used to size margin / liquidation in the summary.
  const refPrice =
    needsLimit && limitPrice > 0
      ? limitPrice
      : needsTrigger && !needsLimit && triggerPrice > 0
        ? triggerPrice
        : isScale && scaleLow > 0 && scaleHigh > 0
          ? (scaleLow + scaleHigh) / 2
          : mark;
  const notional = sizeMillions * refPrice;
  const requiredMargin = leverage > 0 ? notional / leverage : 0;
  const freeMargin = account?.account.freeMargin ?? 0;
  const longLiq = refPrice * (1 - (1 / leverage - 0.05));
  const shortLiq = refPrice * (1 + (1 / leverage - 0.05));

  const handleOpen = async (side: "LONG" | "SHORT") => {
    if (!accountEnabled) {
      setLoginOpen(true);
      return;
    }
    if (!selected) return;
    if (sizeMillions <= 0) {
      setActionError("Enter a position size.");
      return;
    }
    if (needsLimit && limitPrice <= 0) {
      setActionError("Enter a limit price.");
      return;
    }
    if (needsTrigger && triggerPrice <= 0) {
      setActionError("Enter a trigger price.");
      return;
    }
    if (isScale) {
      if (scaleLow <= 0 || scaleHigh <= 0) {
        setActionError("Enter scale low and high prices.");
        return;
      }
      if (scaleLow >= scaleHigh) {
        setActionError("Scale low must be below scale high.");
        return;
      }
      if (scaleCount < 2) {
        setActionError("Scale needs at least 2 orders.");
        return;
      }
    }
    if (isTwap) {
      if (twapDuration <= 0) {
        setActionError("Enter a TWAP duration.");
        return;
      }
      if (twapCount < 2) {
        setActionError("TWAP needs at least 2 slices.");
        return;
      }
    }
    if (requiredMargin > freeMargin) {
      setActionError(
        `Need ${fmtUsd(requiredMargin)} margin, have ${fmtUsd(freeMargin)} buying power. Deposit more collateral.`,
      );
      return;
    }

    setActionError(null);
    try {
      await actions.open({
        marketTier: selected.tier,
        side,
        leverage,
        sizeMillions,
        orderType,
        ...(needsLimit ? { limitPrice } : {}),
        ...(needsTrigger ? { triggerPrice } : {}),
        ...(isScale ? { scaleLow, scaleHigh, scaleCount } : {}),
        ...(isTwap
          ? { twapDurationMinutes: twapDuration, twapCount }
          : {}),
      });
      await refresh();
      const label = contractLabel(selected.tier, selected.name);
      setSuccessMsg(
        `${ORDER_TYPE_SHORT[orderType]} ${side} ${sizeMillions}M ${label}`,
      );
      setShowSuccess(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not place order");
    }
  };

  const handleCancel = async (order: Position) => {
    setActionError(null);
    try {
      await actions.cancel(order.id);
      await refresh();
      setSuccessMsg(
        `Cancelled limit order · ${contractLabel(order.marketTier, order.marketTier)}`,
      );
      setShowSuccess(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not cancel order");
    }
  };

  const handleClose = async (position: Position) => {
    setActionError(null);
    try {
      const result = await actions.close(position.id);
      await refresh();
      setSuccessMsg(
        `Closed ${contractLabel(position.marketTier, position.marketTier)} · PnL ${fmtUsd(result.realizedPnl)}`,
      );
      setShowSuccess(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not close position");
    }
  };

  const handleDeposit = async () => {
    const amount = Number(depositInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter a deposit amount.");
      return;
    }
    setActionError(null);
    try {
      await actions.deposit(amount, depositAsset);
      await refresh();
      setDepositOpen(false);
      setDepositInput("");
      setSuccessMsg(
        `${amount.toLocaleString()} ${depositAsset === "AUTO" ? "$AUTO" : "USDG"} collateral deposited`,
      );
      setShowSuccess(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter a withdrawal amount.");
      return;
    }
    setActionError(null);
    try {
      const result = await actions.withdraw(amount, withdrawAsset);
      // Close and clear the modal BEFORE refreshing. Otherwise the refresh
      // lowers the balance while the modal is still mounted with the old input,
      // briefly flashing the "amount exceeds available" warning.
      setWithdrawOpen(false);
      setWithdrawInput("");
      setSuccessMsg(
        `${amount.toLocaleString()} ${withdrawAsset} withdrawn to your wallet`,
      );
      setShowSuccess(true);
      await refresh();
      return result;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Withdrawal failed");
    }
  };

  if (loading && markets.length === 0) {
    return (
      <p className="pixel-sans py-20 text-center text-sm text-black/40">
        Loading markets…
      </p>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="pixel-sans border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <TickerStrip
        markets={markets}
        selectedTier={selectedTier}
        onSelect={setSelectedTier}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px_300px] lg:divide-x lg:divide-black/10">
        {/* Chart column */}
        <section className="min-w-0">
          {selected && (
            <MarketHeader
              market={selected}
              markets={markets}
              onSelect={setSelectedTier}
            />
          )}
          <div className="h-[360px] w-full md:h-[520px]">
            {selectedTier && <TradingChart tier={selectedTier} markPrice={mark} />}
          </div>
        </section>

        {/* Book + trades column (tabbed) */}
        <section className="border-t border-black/10 lg:border-t-0">
          <div className="flex border-b border-black/10">
            {(["book", "trades", "curve", "options"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setDepthTab(tab)}
                className={`pixel-sans flex-1 px-1.5 py-2 text-xs font-medium capitalize ${
                  depthTab === tab
                    ? "border-b-2 border-black text-black"
                    : "text-black/40 hover:text-black/70"
                }`}
              >
                {tab === "book"
                  ? "Book"
                  : tab === "trades"
                    ? "Trades"
                    : tab === "curve"
                      ? "Curve"
                      : "Options"}
              </button>
            ))}
          </div>
          {depthTab === "book" ? (
            <OrderBookPanel book={orderbook} />
          ) : depthTab === "trades" ? (
            <TradesPanel trades={trades} />
          ) : depthTab === "curve" ? (
            <MiniYieldCurve curve={selectedCurve} loading={curvesLoading} />
          ) : (
            <MiniOptions model={selectedDeriv} loading={derivLoading} />
          )}
        </section>

        {/* Order entry column */}
        <section className="border-t border-black/10 lg:border-t-0">
          <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
            <span className="pixel-sans rounded bg-black/[0.06] px-2 py-1 text-[11px] text-black/60">
              Cross
            </span>
            <span className="pixel-mono rounded bg-black/[0.06] px-2 py-1 text-[11px] text-black/60">
              {leverage}x
            </span>
          </div>

          <div className="flex items-center border-b border-black/10">
            {(["MARKET", "LIMIT"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setOrderType(type);
                  setProOpen(false);
                }}
                className={`pixel-sans px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  orderType === type
                    ? "border-b-2 border-black text-black"
                    : "text-black/30 hover:text-black/60"
                }`}
              >
                {type.toLowerCase()}
              </button>
            ))}

            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setProOpen((v) => !v)}
                className={`pixel-sans flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                  PRO_ORDER_TYPES.includes(orderType)
                    ? "border-b-2 border-black text-black"
                    : "text-black/40 hover:text-black/70"
                }`}
              >
                {PRO_ORDER_TYPES.includes(orderType)
                  ? ORDER_TYPE_LABELS[orderType]
                  : "Pro"}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden
                  className={`transition-transform ${proOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M2 3.5 5 6.5 8 3.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {proOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg">
                  {PRO_ORDER_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setOrderType(type);
                        setProOpen(false);
                      }}
                      className={`pixel-sans block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-black/[0.04] ${
                        orderType === type ? "text-black" : "text-black/60"
                      }`}
                    >
                      {ORDER_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3">
            {accountEnabled && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-black/10 bg-black/[0.02] px-2.5 py-1.5">
                  <div className="pixel-sans text-[10px] text-black/40">
                    Deposited $AUTO
                  </div>
                  <div className="pixel-mono truncate text-xs text-black">
                    {(account?.account.autoCollateral ?? 0).toLocaleString()} AUTO
                  </div>
                </div>
                <div className="rounded-lg border border-black/10 bg-black/[0.02] px-2.5 py-1.5">
                  <div className="pixel-sans text-[10px] text-black/40">
                    Deposited USDG
                  </div>
                  <div className="pixel-mono truncate text-xs text-black">
                    {(account?.account.usdcCollateral ?? 0).toLocaleString()} USDG
                  </div>
                </div>
              </div>
            )}

            <div className="mb-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="pixel-sans text-[11px] text-black/40">
                  Buying power
                </span>
                <span className="pixel-mono text-xs text-black">
                  {fmtUsd(freeMargin)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pixel-sans text-[11px] text-black/40">
                  Total collateral
                </span>
                <span className="pixel-mono text-xs text-black/70">
                  {fmtUsd(account?.account.totalCollateral ?? 0)}
                </span>
              </div>
            </div>

            <div className="pixel-sans mb-1 text-[11px] text-black/40">Leverage</div>
            <div className="mb-3 flex gap-1">
              {leverageOptions.map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setLeverage(lev)}
                  className={`pixel-mono flex-1 rounded border py-1 text-[11px] ${
                    leverage === lev
                      ? "border-black bg-black text-white"
                      : "border-black/15 text-black/55 hover:border-black/30"
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>

            {needsTrigger && (
              <>
                <div className="pixel-sans mb-1 flex items-center justify-between text-[11px] text-black/40">
                  <span>Trigger price</span>
                  <button
                    type="button"
                    onClick={() => setTriggerPriceInput(mark ? String(mark) : "")}
                    className="pixel-mono text-[10px] text-black/40 underline-offset-2 hover:text-black hover:underline"
                  >
                    Mark {fmtPrice(mark)}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={triggerPriceInput}
                  placeholder={mark ? fmtPrice(mark) : "0.0000"}
                  onChange={(e) =>
                    setTriggerPriceInput(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  className="pixel-mono mb-3 w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
                />
              </>
            )}

            {needsLimit && (
              <>
                <div className="pixel-sans mb-1 flex items-center justify-between text-[11px] text-black/40">
                  <span>Limit price</span>
                  <button
                    type="button"
                    onClick={() => setLimitPriceInput(mark ? String(mark) : "")}
                    className="pixel-mono text-[10px] text-black/40 underline-offset-2 hover:text-black hover:underline"
                  >
                    Mark {fmtPrice(mark)}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={limitPriceInput}
                  placeholder={mark ? fmtPrice(mark) : "0.0000"}
                  onChange={(e) =>
                    setLimitPriceInput(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  className="pixel-mono mb-3 w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
                />
              </>
            )}

            {isScale && (
              <>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="pixel-sans mb-1 text-[11px] text-black/40">
                      From price
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={scaleLowInput}
                      placeholder="0.0000"
                      onChange={(e) =>
                        setScaleLowInput(e.target.value.replace(/[^\d.]/g, ""))
                      }
                      className="pixel-mono w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="pixel-sans mb-1 text-[11px] text-black/40">
                      To price
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={scaleHighInput}
                      placeholder="0.0000"
                      onChange={(e) =>
                        setScaleHighInput(e.target.value.replace(/[^\d.]/g, ""))
                      }
                      className="pixel-mono w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="pixel-sans mb-1 text-[11px] text-black/40">
                  Number of orders
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={scaleCountInput}
                  placeholder="5"
                  onChange={(e) =>
                    setScaleCountInput(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className="pixel-mono mb-3 w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
                />
              </>
            )}

            {isTwap && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="pixel-sans mb-1 text-[11px] text-black/40">
                    Duration (min)
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={twapDurationInput}
                    placeholder="30"
                    onChange={(e) =>
                      setTwapDurationInput(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    className="pixel-mono w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="pixel-sans mb-1 text-[11px] text-black/40">
                    Slices
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={twapCountInput}
                    placeholder="6"
                    onChange={(e) =>
                      setTwapCountInput(e.target.value.replace(/[^\d]/g, ""))
                    }
                    className="pixel-mono w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pixel-sans mb-1 text-[11px] text-black/40">
              Size (millions of tokens)
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value.replace(/[^\d.]/g, ""))}
              className="pixel-mono mb-3 w-full rounded border border-black/15 px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
            />

            {actionError && (
              <p className="pixel-sans mb-3 rounded bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
                {actionError}
              </p>
            )}

            {accountEnabled ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={actions.busy}
                  onClick={() => void handleOpen("LONG")}
                  className="pixel-sans rounded bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isMarket ? "Buy / Long" : `${ORDER_TYPE_SHORT[orderType]} Buy`}
                </button>
                <button
                  type="button"
                  disabled={actions.busy}
                  onClick={() => void handleOpen("SHORT")}
                  className="pixel-sans rounded bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isMarket
                    ? "Sell / Short"
                    : `${ORDER_TYPE_SHORT[orderType]} Sell`}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="pixel-sans w-full rounded border border-emerald-600/30 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 hover:border-emerald-600/50"
              >
                Connect wallet to trade
              </button>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  accountEnabled ? setDepositOpen(true) : setLoginOpen(true)
                }
                className="pixel-sans rounded border border-black/15 py-2 text-xs text-black/60 hover:border-black/30 hover:text-black"
              >
                + Deposit
              </button>
              <button
                type="button"
                onClick={() =>
                  accountEnabled ? setWithdrawOpen(true) : setLoginOpen(true)
                }
                className="pixel-sans rounded border border-black/15 py-2 text-xs text-black/60 hover:border-black/30 hover:text-black"
              >
                − Withdraw
              </button>
            </div>

            <div className="mt-3 space-y-1.5 border-t border-black/10 pt-3 pixel-sans text-[11px] text-black/45">
              <Row label="Order value" value={fmtUsd(notional)} />
              <Row label="Margin required" value={fmtUsd(requiredMargin)} />
              <Row
                label={
                  needsLimit
                    ? "Limit price"
                    : needsTrigger
                      ? "Trigger price"
                      : isScale
                        ? "Avg price"
                        : "Entry (mark)"
                }
                value={fmtPrice(refPrice)}
              />
              <Row
                label="Liq. price L / S"
                value={`${longLiq.toFixed(4)} / ${shortLiq.toFixed(4)}`}
              />
              <Row
                label="Locked margin"
                value={fmtUsd(account?.account.lockedMargin ?? 0)}
              />
              {account?.account.equity !== undefined && (
                <Row label="Equity" value={fmtUsd(account.account.equity ?? 0)} />
              )}
              {(account?.account.autoCollateral ?? 0) > 0 && (
                <Row
                  label="$AUTO collateral"
                  value={`${(account?.account.autoCollateral ?? 0).toLocaleString()} AUTO`}
                />
              )}
              {(account?.account.usdcCollateral ?? 0) > 0 && (
                <Row
                  label="USDG collateral"
                  value={`${(account?.account.usdcCollateral ?? 0).toLocaleString()} USDG`}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Positions bar */}
      <section className="border-t border-black/10">
        <div className="flex items-center gap-1 border-b border-black/10 px-3 py-1.5">
          {([
            ["positions", `Positions (${account?.openPositions.length ?? 0})`],
            ["orders", `Open Orders (${account?.openOrders.length ?? 0})`],
            ["balances", "Balances"],
            ["history", `History (${account?.history.length ?? 0})`],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setBottomTab(tab)}
              className={`pixel-sans rounded-md px-3 py-1 text-xs transition-colors ${
                bottomTab === tab
                  ? "bg-black/[0.06] font-medium text-black"
                  : "text-black/40 hover:text-black/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {bottomTab === "positions" && (
          <PositionsTable
            positions={account?.openPositions ?? []}
            markets={markets}
            busy={actions.busy}
            onClose={handleClose}
            authed={accountEnabled}
          />
        )}

        {bottomTab === "orders" && (
          <OpenOrdersTable
            orders={account?.openOrders ?? []}
            markets={markets}
            busy={actions.busy}
            onCancel={handleCancel}
            authed={accountEnabled}
          />
        )}

        {bottomTab === "history" && (
          <HistoryTable
            positions={account?.history ?? []}
            markets={markets}
            authed={accountEnabled}
          />
        )}

        {bottomTab === "balances" && (
          <BalancesPanel
            account={account?.account ?? null}
            walletBalances={walletBalances}
            authed={accountEnabled}
          />
        )}
      </section>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {depositOpen && (
        <DepositModal
          value={depositInput}
          onChange={setDepositInput}
          asset={depositAsset}
          onAssetChange={setDepositAsset}
          autoPrice={autoPrice?.price ?? account?.account.autoPrice ?? null}
          walletBalance={
            depositAsset === "AUTO"
              ? walletBalances?.auto ?? null
              : walletBalances?.usdc ?? null
          }
          busy={actions.busy}
          depositRequired={marketsData?.depositRequired ?? true}
          autoAvailable={Boolean(marketsData?.autoTokenMint)}
          onClose={() => setDepositOpen(false)}
          onConfirm={() => void handleDeposit()}
        />
      )}

      {withdrawOpen && (
        <WithdrawModal
          value={withdrawInput}
          onChange={setWithdrawInput}
          asset={withdrawAsset}
          onAssetChange={setWithdrawAsset}
          autoPrice={autoPrice?.price ?? account?.account.autoPrice ?? null}
          freeMargin={account?.account.freeMargin ?? 0}
          autoCollateral={account?.account.autoCollateral ?? 0}
          usdcCollateral={account?.account.usdcCollateral ?? 0}
          busy={actions.busy}
          autoAvailable={Boolean(marketsData?.autoTokenMint)}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={() => void handleWithdraw()}
        />
      )}

      <SuccessOverlay
        open={showSuccess}
        title="Done"
        message={successMsg}
        onDone={() => setShowSuccess(false)}
      />
    </div>
  );
}

function fmtAutoPrice(value: number) {
  if (value >= 1) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toExponential(2)}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="pixel-mono text-black">{value}</span>
    </div>
  );
}

function PositionsTable({
  positions,
  markets,
  busy,
  onClose,
  authed,
}: {
  positions: Position[];
  markets: TradeMarket[];
  busy: boolean;
  onClose: (position: Position) => void;
  authed: boolean;
}) {
  if (!authed) {
    return (
      <p className="pixel-sans px-4 py-6 text-center text-sm text-black/40">
        Connect your wallet to view positions.
      </p>
    );
  }

  if (positions.length === 0) {
    return (
      <p className="pixel-sans px-4 py-6 text-center text-sm text-black/40">
        No open positions.
      </p>
    );
  }

  const nameFor = (tier: string) =>
    contractLabel(tier, markets.find((m) => m.tier === tier)?.name ?? tier);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="pixel-sans text-[10px] uppercase tracking-wide text-black/35">
            <th className="px-4 py-1.5 font-normal">Market</th>
            <th className="px-4 py-1.5 font-normal">Side</th>
            <th className="px-4 py-1.5 font-normal">Size</th>
            <th className="px-4 py-1.5 font-normal">Entry</th>
            <th className="px-4 py-1.5 font-normal">Mark</th>
            <th className="px-4 py-1.5 font-normal">Liq.</th>
            <th className="px-4 py-1.5 font-normal">Margin</th>
            <th className="px-4 py-1.5 font-normal">PnL</th>
            <th className="px-4 py-1.5 font-normal" />
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const up = p.unrealizedPnl >= 0;
            return (
              <tr key={p.id} className="border-t border-black/5">
                <td className="pixel-sans px-4 py-2 text-black">
                  {nameFor(p.marketTier)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`pixel-sans rounded px-1.5 py-0.5 text-[11px] ${
                      p.side === "LONG"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {p.side} {p.leverage}x
                  </span>
                </td>
                <td className="pixel-mono px-4 py-2 text-black/70">
                  {p.sizeMillions}M
                </td>
                <td className="pixel-mono px-4 py-2 text-black/70">
                  {fmtPrice(p.entryPrice)}
                </td>
                <td className="pixel-mono px-4 py-2 text-black/70">
                  {fmtPrice(p.markPrice)}
                </td>
                <td className="pixel-mono px-4 py-2 text-red-600/80">
                  {fmtPrice(p.liquidationPrice)}
                </td>
                <td className="pixel-mono px-4 py-2 text-black/70">
                  {p.lockedCollateral.toFixed(2)}
                </td>
                <td
                  className={`pixel-mono px-4 py-2 ${
                    up ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {fmtUsd(p.unrealizedPnl)} ({p.pnlPercent}%)
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onClose(p)}
                    className="pixel-sans rounded border border-black/15 px-3 py-1 text-xs text-black hover:bg-black/5 disabled:opacity-50"
                  >
                    Close
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OpenOrdersTable({
  orders,
  markets,
  busy,
  onCancel,
  authed,
}: {
  orders: Position[];
  markets: TradeMarket[];
  busy: boolean;
  onCancel: (order: Position) => void;
  authed: boolean;
}) {
  if (!authed) {
    return (
      <p className="pixel-sans px-4 py-6 text-center text-sm text-black/40">
        Connect your wallet to view open orders.
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="pixel-sans px-4 py-6 text-center text-sm text-black/40">
        No open orders.
      </p>
    );
  }

  const nameFor = (tier: string) =>
    contractLabel(tier, markets.find((m) => m.tier === tier)?.name ?? tier);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="pixel-sans text-[10px] uppercase tracking-wide text-black/35">
            <th className="px-4 py-1.5 font-normal">Market</th>
            <th className="px-4 py-1.5 font-normal">Type</th>
            <th className="px-4 py-1.5 font-normal">Side</th>
            <th className="px-4 py-1.5 font-normal">Size</th>
            <th className="px-4 py-1.5 font-normal">Trigger / Limit</th>
            <th className="px-4 py-1.5 font-normal">Mark</th>
            <th className="px-4 py-1.5 font-normal">Margin</th>
            <th className="px-4 py-1.5 font-normal" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-black/5">
              <td className="pixel-sans px-4 py-2 text-black">
                {nameFor(o.marketTier)}
              </td>
              <td className="pixel-sans px-4 py-2 text-black/70">
                <span className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[11px]">
                  {ORDER_TYPE_LABELS[o.orderType]}
                </span>
                {o.triggered && o.orderType !== "TWAP" && (
                  <span className="pixel-sans ml-1 text-[10px] text-emerald-600">
                    armed
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`pixel-sans rounded px-1.5 py-0.5 text-[11px] ${
                    o.side === "LONG"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {o.side} {o.leverage}x
                </span>
              </td>
              <td className="pixel-mono px-4 py-2 text-black/70">
                {o.sizeMillions}M
              </td>
              <td className="pixel-mono px-4 py-2 text-black/70">
                {o.orderType === "TWAP"
                  ? o.executeAt
                    ? fmtTime(Date.parse(o.executeAt))
                    : "—"
                  : o.triggerPrice && !o.triggered
                    ? `${fmtPrice(o.triggerPrice)} trig`
                    : fmtPrice(o.limitPrice ?? o.entryPrice)}
              </td>
              <td className="pixel-mono px-4 py-2 text-black/70">
                {fmtPrice(o.markPrice)}
              </td>
              <td className="pixel-mono px-4 py-2 text-black/70">
                {o.lockedCollateral.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onCancel(o)}
                  className="pixel-sans rounded border border-black/15 px-3 py-1 text-xs text-black hover:bg-black/5 disabled:opacity-50"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({
  positions,
  markets,
  authed,
}: {
  positions: Position[];
  markets: TradeMarket[];
  authed: boolean;
}) {
  if (!authed) {
    return (
      <p className="pixel-sans px-4 py-6 text-center text-sm text-black/40">
        Connect your wallet to view history.
      </p>
    );
  }

  if (positions.length === 0) {
    return (
      <p className="pixel-sans px-4 py-6 text-center text-sm text-black/40">
        No closed positions yet.
      </p>
    );
  }

  const nameFor = (tier: string) =>
    contractLabel(tier, markets.find((m) => m.tier === tier)?.name ?? tier);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="pixel-sans text-[10px] uppercase tracking-wide text-black/35">
            <th className="px-4 py-1.5 font-normal">Market</th>
            <th className="px-4 py-1.5 font-normal">Side</th>
            <th className="px-4 py-1.5 font-normal">Size</th>
            <th className="px-4 py-1.5 font-normal">Entry</th>
            <th className="px-4 py-1.5 font-normal">Exit</th>
            <th className="px-4 py-1.5 font-normal">Status</th>
            <th className="px-4 py-1.5 font-normal">Realized PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const up = p.realizedPnl >= 0;
            return (
              <tr key={p.id} className="border-t border-black/5">
                <td className="pixel-sans px-4 py-2 text-black">
                  {nameFor(p.marketTier)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`pixel-sans rounded px-1.5 py-0.5 text-[11px] ${
                      p.side === "LONG"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {p.side} {p.leverage}x
                  </span>
                </td>
                <td className="pixel-mono px-4 py-2 text-black/70">
                  {p.sizeMillions}M
                </td>
                <td className="pixel-mono px-4 py-2 text-black/70">
                  {fmtPrice(p.entryPrice)}
                </td>
                <td className="pixel-mono px-4 py-2 text-black/70">
                  {p.exitPrice !== null ? fmtPrice(p.exitPrice) : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`pixel-sans rounded px-1.5 py-0.5 text-[11px] ${
                      p.status === "LIQUIDATED"
                        ? "bg-red-50 text-red-600"
                        : "bg-black/[0.06] text-black/60"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td
                  className={`pixel-mono px-4 py-2 ${
                    up ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {fmtUsd(p.realizedPnl)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BalancesPanel({
  account,
  walletBalances,
  authed,
}: {
  account: MarginAccount | null;
  walletBalances: WalletBalances | null;
  authed: boolean;
}) {
  if (!authed || !account) {
    return (
      <p className="pixel-sans px-4 py-6 text-center text-sm text-black/40">
        Connect your wallet to view balances.
      </p>
    );
  }

  const Cell = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2.5">
      <div className="pixel-sans text-[10px] uppercase tracking-wide text-black/40">
        {label}
      </div>
      <div className="pixel-mono mt-0.5 text-sm text-black">{value}</div>
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="pixel-sans mb-2 text-[11px] uppercase tracking-wide text-black/35">
          Trading account (USD)
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Cell label="Buying power" value={fmtUsd(account.freeMargin)} />
          <Cell label="Locked margin" value={fmtUsd(account.lockedMargin)} />
          <Cell label="Equity" value={fmtUsd(account.equity ?? account.totalCollateral)} />
          <Cell label="Unrealized PnL" value={fmtUsd(account.unrealizedPnl ?? 0)} />
          <Cell label="Total collateral" value={fmtUsd(account.totalCollateral)} />
        </div>
      </div>

      <div>
        <div className="pixel-sans mb-2 text-[11px] uppercase tracking-wide text-black/35">
          Collateral deposited (raw tokens)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Cell
            label="$AUTO collateral"
            value={`${(account.autoCollateral ?? 0).toLocaleString()} AUTO`}
          />
          <Cell
            label="USDG collateral"
            value={`${(account.usdcCollateral ?? 0).toLocaleString()} USDG`}
          />
        </div>
      </div>

      <div className="border-t border-black/5 pt-3">
        <div className="pixel-sans mb-2 text-[10px] uppercase tracking-wide text-black/25">
          Connected wallet (not deposited)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Cell
            label="Wallet $AUTO"
            value={walletBalances ? `${walletBalances.autoDisplay} AUTO` : "—"}
          />
          <Cell
            label="Wallet USDG"
            value={walletBalances ? `${walletBalances.usdcDisplay} USDG` : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function DepositModal({
  value,
  onChange,
  asset,
  onAssetChange,
  autoPrice,
  walletBalance,
  busy,
  depositRequired,
  autoAvailable = false,
  onClose,
  onConfirm,
}: {
  value: string;
  onChange: (v: string) => void;
  asset: CollateralAsset;
  onAssetChange: (asset: CollateralAsset) => void;
  autoPrice: number | null;
  walletBalance: number | null;
  busy: boolean;
  depositRequired: boolean;
  autoAvailable?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const amount = Number(value) || 0;
  const price = autoPrice ?? 0;
  const usdCredit = asset === "USDC" ? amount : amount * price;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <h2 className="pixel-serif mb-1 text-xl text-black">Deposit collateral</h2>
        <p className="pixel-sans mb-4 text-xs text-black/50">
          Deposit USDG to open positions. Credited as unified USD buying power.{" "}
          {depositRequired
            ? "Tokens are sent to the treasury."
            : "Dev mode: credited without an on-chain transfer."}
        </p>

        <div className="mb-3 flex gap-2">
          {(
            (autoAvailable ? ["AUTO", "USDC"] : ["USDC"]) as CollateralAsset[]
          ).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onAssetChange(option)}
              className={`pixel-sans flex-1 rounded-xl border py-2 text-sm ${
                asset === option
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/60 hover:border-black/30"
              }`}
            >
              {option === "AUTO" ? "$AUTO" : "USDG"}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <label className="pixel-sans block text-sm text-black/50">
            Amount ({asset === "AUTO" ? "$AUTO" : "USDG"})
          </label>
          {walletBalance !== null && (
            <span className="pixel-sans text-[11px] text-black/40">
              Balance:{" "}
              <span className="pixel-mono text-black/70">
                {walletBalance.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}
              </span>
              <button
                type="button"
                onClick={() => onChange(String(walletBalance))}
                className="pixel-sans ml-1.5 text-emerald-700 hover:text-emerald-600"
              >
                Max
              </button>
            </span>
          )}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          className="pixel-mono mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-lg text-black focus:border-black/30 focus:outline-none"
        />

        <div className="mt-3 space-y-1 rounded-xl bg-black/[0.03] px-3 py-2.5 pixel-sans text-xs text-black/50">
          {asset === "AUTO" && (
            <div className="flex justify-between">
              <span>$AUTO price (live)</span>
              <span className="pixel-mono text-black">
                {price > 0 ? fmtAutoPrice(price) : "—"}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Buying power credited</span>
            <span className="pixel-mono text-emerald-700">
              {fmtUsd(usdCredit)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="pixel-sans mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Confirm in wallet…" : `Deposit ${asset === "AUTO" ? "$AUTO" : "USDG"}`}
        </button>
      </div>
    </div>
  );
}

function WithdrawModal({
  value,
  onChange,
  asset,
  onAssetChange,
  autoPrice,
  freeMargin,
  autoCollateral,
  usdcCollateral,
  busy,
  autoAvailable = false,
  onClose,
  onConfirm,
}: {
  value: string;
  onChange: (v: string) => void;
  asset: CollateralAsset;
  onAssetChange: (asset: CollateralAsset) => void;
  autoPrice: number | null;
  freeMargin: number;
  autoCollateral: number;
  usdcCollateral: number;
  busy: boolean;
  autoAvailable?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const amount = Number(value) || 0;
  const price = autoPrice ?? 0;
  const usdDebit = asset === "USDC" ? amount : amount * price;

  // Withdrawable is bounded by both deposited collateral of that asset and free
  // (unlocked) USD buying power.
  const collateralBalance = asset === "USDC" ? usdcCollateral : autoCollateral;
  const marginCapInAsset =
    asset === "USDC" ? freeMargin : price > 0 ? freeMargin / price : 0;
  const maxWithdraw = Math.max(0, Math.min(collateralBalance, marginCapInAsset));

  const exceeds = amount > maxWithdraw + 1e-9;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <h2 className="pixel-serif mb-1 text-xl text-black">
          Withdraw collateral
        </h2>
        <p className="pixel-sans mb-4 text-xs text-black/50">
          Sends tokens from the system vault back to your connected wallet.
          Limited to your free (unlocked) buying power.
        </p>

        <div className="mb-3 flex gap-2">
          {(
            (autoAvailable ? ["AUTO", "USDC"] : ["USDC"]) as CollateralAsset[]
          ).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onAssetChange(option)}
              className={`pixel-sans flex-1 rounded-xl border py-2 text-sm ${
                asset === option
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/60 hover:border-black/30"
              }`}
            >
              {option === "AUTO" ? "$AUTO" : "USDG"}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <label className="pixel-sans block text-sm text-black/50">
            Amount ({asset === "AUTO" ? "$AUTO" : "USDG"})
          </label>
          <span className="pixel-sans text-[11px] text-black/40">
            Available:{" "}
            <span className="pixel-mono text-black/70">
              {maxWithdraw.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
            </span>
            <button
              type="button"
              onClick={() => onChange(String(maxWithdraw))}
              className="pixel-sans ml-1.5 text-emerald-700 hover:text-emerald-600"
            >
              Max
            </button>
          </span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          className="pixel-mono mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-lg text-black focus:border-black/30 focus:outline-none"
        />

        <div className="mt-3 space-y-1 rounded-xl bg-black/[0.03] px-3 py-2.5 pixel-sans text-xs text-black/50">
          {asset === "AUTO" && (
            <div className="flex justify-between">
              <span>$AUTO price (live)</span>
              <span className="pixel-mono text-black">
                {price > 0 ? fmtAutoPrice(price) : "—"}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Buying power debited</span>
            <span className="pixel-mono text-black">{fmtUsd(usdDebit)}</span>
          </div>
        </div>

        {exceeds && (
          <p className="pixel-sans mt-3 rounded bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
            Amount exceeds your available {asset} balance.
          </p>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={busy || exceeds || amount <= 0}
          className="pixel-sans mt-5 w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-black/85 disabled:opacity-50"
        >
          {busy
            ? "Processing…"
            : `Withdraw ${asset === "AUTO" ? "$AUTO" : "USDG"}`}
        </button>
      </div>
    </div>
  );
}
