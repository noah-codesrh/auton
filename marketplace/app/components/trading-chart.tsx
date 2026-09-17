import {
  CandlestickSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { fetchCandles } from "../lib/api/trade";

export function TradingChart({
  tier,
  markPrice,
}: {
  tier: string;
  markPrice?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const framedRef = useRef(false);

  // Create the chart once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#6b7280",
        fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "#f3f4f6" },
        horzLines: { color: "#f3f4f6" },
      },
      rightPriceScale: { borderColor: "#e5e7eb" },
      timeScale: {
        borderColor: "#e5e7eb",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderUpColor: "#16a34a",
      borderDownColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Load (and poll) candles whenever the market changes.
  useEffect(() => {
    if (!tier) return;
    let cancelled = false;
    // Re-frame the view to the recent window once per market, then leave the
    // user's pan/zoom alone on subsequent polls.
    framedRef.current = false;

    // How many candles to show by default. The engine keeps ~24h of 1-minute
    // history; framing the most recent ~90 (1.5h) renders readable candles
    // instead of cramming the whole series into a solid band. History stays
    // available by scrolling/zooming out.
    const DEFAULT_BARS = 90;

    const load = async () => {
      try {
        const { candles } = await fetchCandles(tier);
        if (cancelled || !seriesRef.current) return;

        const data: CandlestickData[] = candles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        seriesRef.current.setData(data);
        lastCandleRef.current = data.length ? { ...data[data.length - 1] } : null;

        if (data.length && !framedRef.current) {
          chartRef.current?.timeScale().setVisibleLogicalRange({
            from: Math.max(0, data.length - DEFAULT_BARS),
            to: data.length + 1,
          });
          framedRef.current = true;
        }
      } catch {
        // transient
      }
    };

    void load();
    const id = setInterval(load, 5_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [tier]);

  // Live-update the forming candle from the latest mark price.
  useEffect(() => {
    const last = lastCandleRef.current;
    if (!markPrice || !seriesRef.current || !last) return;

    const updated: CandlestickData = {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, markPrice),
      low: Math.min(last.low, markPrice),
      close: markPrice,
    };
    lastCandleRef.current = updated;
    seriesRef.current.update(updated);
  }, [markPrice]);

  return <div ref={containerRef} className="h-full w-full" />;
}
