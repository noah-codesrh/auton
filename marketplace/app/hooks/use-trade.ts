import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMarkets,
  fetchOrderbook,
  fetchTrades,
  fetchTradingAccount,
  type MarketsResponse,
  type Orderbook,
  type TradeTick,
  type TradingAccount,
} from "../lib/api/trade";

export function useTradeMarkets() {
  const [data, setData] = useState<MarketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetchMarkets();
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load markets");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const id = setInterval(load, 3_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { data, loading, error };
}

export function useMarketDepth(tier: string | null) {
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [trades, setTrades] = useState<TradeTick[]>([]);

  useEffect(() => {
    if (!tier) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [book, tradeRes] = await Promise.all([
          fetchOrderbook(tier),
          fetchTrades(tier),
        ]);
        if (!cancelled) {
          setOrderbook(book);
          setTrades(tradeRes.trades);
        }
      } catch {
        // transient; keep last values
      }
    };

    void load();
    const id = setInterval(load, 2_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [tier]);

  return { orderbook, trades };
}

export function useTradingAccount(enabled: boolean) {
  const [data, setData] = useState<TradingAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const refresh = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      const res = await fetchTradingAccount();
      setData(res);
    } catch {
      // keep last
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      return;
    }
    setLoading(true);
    void refresh();
    const id = setInterval(refresh, 4_000);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { data, loading, refresh };
}
