// TradingView-style candlestick chart using lightweight-charts v4.
import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { Kline } from "@/lib/api";

interface Props {
  klines: Kline[];
  height?: number;
  showVolume?: boolean;
  zones?: { from: number; to: number; color: string; label?: string }[];
}

export const Candles = ({ klines, height = 460, showVolume = true, zones = [] }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Create chart instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous chart if exists
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch (_) {}
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    }

    try {
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { color: "transparent" },
          textColor: "#8B92A5",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(30, 35, 50, 0.6)" },
          horzLines: { color: "rgba(30, 35, 50, 0.6)" },
        },
        rightPriceScale: { borderColor: "#1E2332" },
        timeScale: { borderColor: "#1E2332", timeVisible: true, secondsVisible: false },
        crosshair: {
          vertLine: { color: "rgba(124, 77, 255, 0.4)", labelBackgroundColor: "#7C4DFF" },
          horzLine: { color: "rgba(124, 77, 255, 0.4)", labelBackgroundColor: "#7C4DFF" },
        },
      });
      chartRef.current = chart;

      const candle = chart.addCandlestickSeries({
        upColor: "#2ECC71",
        downColor: "#E74C5A",
        borderUpColor: "#2ECC71",
        borderDownColor: "#E74C5A",
        wickUpColor: "#2ECC71",
        wickDownColor: "#E74C5A",
      });
      candleRef.current = candle;

      if (showVolume) {
        const vol = chart.addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
          color: "rgba(124, 77, 255, 0.5)",
        });
        vol.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
        volRef.current = vol;
      }

      const ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      ro.observe(containerRef.current);

      return () => {
        ro.disconnect();
        try { chart.remove(); } catch (_) {}
        chartRef.current = null;
        candleRef.current = null;
        volRef.current = null;
      };
    } catch (err) {
      console.error("[Candles] Chart creation error:", err);
    }
  }, [height, showVolume]);

  // Update data
  useEffect(() => {
    if (!candleRef.current || !klines || klines.length === 0) return;

    try {
      // Deduplicate and sort by time to avoid lightweight-charts errors
      const seen = new Set<number>();
      const deduped = klines.filter(k => {
        const t = Math.floor(k.openTime / 1000);
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      }).sort((a, b) => a.openTime - b.openTime);

      const candleData = deduped.map((k) => ({
        time: Math.floor(k.openTime / 1000) as Time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));

      candleRef.current.setData(candleData);

      if (volRef.current) {
        volRef.current.setData(
          deduped.map((k) => ({
            time: Math.floor(k.openTime / 1000) as Time,
            value: k.volume,
            color: k.close >= k.open ? "rgba(46, 204, 113, 0.4)" : "rgba(231, 76, 90, 0.4)",
          }))
        );
      }

      chartRef.current?.timeScale().fitContent();
    } catch (err) {
      console.error("[Candles] Data update error:", err);
    }
  }, [klines]);

  // Add price-level zone lines for detected patterns
  useEffect(() => {
    const c = candleRef.current;
    if (!c || !zones.length) return;
    try {
      const lines = zones.map((z) =>
        c.createPriceLine({
          price: z.from,
          color: z.color,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: z.label ?? "",
        })
      );
      return () => { lines.forEach((l) => { try { c.removePriceLine(l); } catch (_) {} }); };
    } catch (err) {
      console.error("[Candles] Zone lines error:", err);
    }
  }, [zones]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="w-full" style={{ height }} />
      {(!klines || klines.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-surface/80">
          Cargando gráfico…
        </div>
      )}
    </div>
  );
};
