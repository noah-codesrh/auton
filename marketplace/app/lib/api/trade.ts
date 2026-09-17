import { getBackendUrl, request } from "./client";

export type TradeMarket = {
  tier: string;
  symbol: string;
  name: string;
  modelIds: string[];
  markPrice: number;
  spotPrice: number;
  dayOpen: number;
  changePercent: number;
};

export type MarketsResponse = {
  markets: TradeMarket[];
  leverageOptions: number[];
  autoTokenMint: string;
  autoTokenDecimals: number;
  usdcTokenMint: string;
  usdcTokenDecimals: number;
  vaultWallet: string;
  depositRequired: boolean;
};

export type CollateralAsset = "AUTO" | "USDC";

export type AutoPriceInfo = {
  price: number;
  change24h: number | null;
  updatedAt: string;
  source: "jupiter" | "cache" | "fallback";
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type OrderbookLevel = { price: number; size: number; total: number };

export type Orderbook = {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  mark: number;
  spread: number;
};

export type TradeTick = {
  id: string;
  time: number;
  price: number;
  sizeMillions: number;
  side: "buy" | "sell";
  source: "market" | "sim";
};

export type Side = "LONG" | "SHORT";
export type OrderType =
  | "MARKET"
  | "LIMIT"
  | "STOP_MARKET"
  | "STOP_LIMIT"
  | "TAKE_MARKET"
  | "TAKE_LIMIT"
  | "SCALE"
  | "TWAP";

export type Position = {
  id: string;
  marketTier: string;
  side: Side;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  sizeMillions: number;
  notionalUsd: number;
  lockedCollateral: number;
  liquidationPrice: number;
  status: "PENDING" | "ACTIVE" | "CLOSED" | "LIQUIDATED" | "CANCELLED";
  orderType: OrderType;
  limitPrice: number | null;
  triggerPrice: number | null;
  triggered: boolean;
  executeAt: string | null;
  parentId: string | null;
  unrealizedPnl: number;
  pnlPercent: number;
  realizedPnl: number;
  exitPrice: number | null;
  createdAt: string | null;
  closedAt: string | null;
};

export type MarginAccount = {
  totalCollateral: number;
  freeMargin: number;
  lockedMargin: number;
  autoCollateral?: number;
  usdcCollateral?: number;
  unrealizedPnl?: number;
  equity?: number;
  buyingPowerUsd?: number;
  autoPrice?: number;
};

export type TradingAccount = {
  account: MarginAccount;
  openPositions: Position[];
  openOrders: Position[];
  history: Position[];
};

export async function fetchMarkets() {
  return request<MarketsResponse>("/api/v1/trade/markets");
}

export async function fetchCandles(tier: string) {
  const res = await fetch(
    `${getBackendUrl()}/api/v1/trade/markets/${encodeURIComponent(tier)}/candles`,
  );
  if (!res.ok) throw new Error(`Failed to load candles (${res.status})`);
  return (await res.json()) as { candles: Candle[] };
}

export async function fetchOrderbook(tier: string) {
  const res = await fetch(
    `${getBackendUrl()}/api/v1/trade/markets/${encodeURIComponent(tier)}/orderbook`,
  );
  if (!res.ok) throw new Error(`Failed to load orderbook (${res.status})`);
  return (await res.json()) as Orderbook;
}

export async function fetchTrades(tier: string) {
  const res = await fetch(
    `${getBackendUrl()}/api/v1/trade/markets/${encodeURIComponent(tier)}/trades`,
  );
  if (!res.ok) throw new Error(`Failed to load trades (${res.status})`);
  return (await res.json()) as { trades: TradeTick[] };
}

export async function fetchTradingAccount() {
  return request<TradingAccount>("/api/v1/trade/account");
}

export async function fetchAutoPrice() {
  const res = await fetch(`${getBackendUrl()}/api/v1/trade/auto-price`);
  if (!res.ok) throw new Error(`Failed to load $AUTO price (${res.status})`);
  return (await res.json()) as AutoPriceInfo;
}

export async function depositMargin(
  amount: number,
  asset: CollateralAsset,
  txSignature?: string,
) {
  return request<{ account: MarginAccount }>("/api/v1/trade/deposit", {
    method: "POST",
    body: JSON.stringify({ amount, asset, txSignature }),
  });
}

export async function openPosition(input: {
  marketTier: string;
  side: Side;
  leverage: number;
  sizeMillions: number;
  orderType?: OrderType;
  limitPrice?: number;
  triggerPrice?: number;
  scaleLow?: number;
  scaleHigh?: number;
  scaleCount?: number;
  twapDurationMinutes?: number;
  twapCount?: number;
}) {
  return request<{ position: Position; account: MarginAccount }>(
    "/api/v1/trade/positions/open",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function cancelOrder(positionId: string) {
  return request<{ position: Position; account: MarginAccount }>(
    `/api/v1/trade/positions/${positionId}/cancel`,
    { method: "POST" },
  );
}

export type WithdrawResult = {
  account: MarginAccount;
  txSignature: string;
  asset: CollateralAsset;
  amount: number;
  usdDebited: number;
};

export async function withdrawMargin(amount: number, asset: CollateralAsset) {
  return request<WithdrawResult>("/api/v1/trade/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount, asset }),
  });
}

export async function closePosition(positionId: string) {
  return request<{ position: Position; account: MarginAccount; realizedPnl: number }>(
    `/api/v1/trade/positions/${positionId}/close`,
    { method: "POST" },
  );
}
