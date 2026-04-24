// Real-time liquidation data from Binance Futures WebSocket
import { useEffect, useRef, useState, useMemo } from "react";

export interface Liquidation {
  symbol: string;
  side: "BUY" | "SELL";  // BUY = short liquidated, SELL = long liquidated
  orderType: string;
  quantity: number;
  price: number;
  avgPrice: number;
  usd: number;
  status: string;
  time: number;
}

export interface LiquidationCluster {
  priceLevel: number;
  longLiqs: number;    // USD value of long liquidations at this level
  shortLiqs: number;   // USD value of short liquidations at this level
  count: number;
}

/**
 * Live liquidation stream from Binance Futures
 * Connects to wss://fstream.binance.com/ws/!forceOrder@arr
 */
export function useLiveLiquidations(maxKeep = 150) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr");
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const o = msg.o;
        if (!o) return;

        const price = +o.p;
        const qty = +o.q;
        const avgPrice = +o.ap;
        const usd = avgPrice * qty;

        const liq: Liquidation = {
          symbol: o.s,
          side: o.S,
          orderType: o.o,
          quantity: qty,
          price,
          avgPrice,
          usd,
          status: o.X,
          time: +o.T,
        };

        setLiquidations(prev => [liq, ...prev].slice(0, maxKeep));
      } catch (_) { /* ignore malformed */ }
    };

    ws.onerror = () => {
      // Reconnect after 5s on error
      setTimeout(() => {
        if (wsRef.current === ws) {
          try { ws.close(); } catch (_) {}
          // Component will remount and reconnect
        }
      }, 5000);
    };

    return () => {
      try { ws.close(); } catch (_) {}
    };
  }, [symbolSet, maxKeep]);

  return liquidations;
}

/**
 * Aggregate liquidations into price clusters for a specific symbol
 * Creates a mini-heatmap by grouping liquidations into price buckets
 */
export function useLiquidationClusters(
  liquidations: Liquidation[],
  symbol: string,
  bucketCount = 12
): LiquidationCluster[] {
  return useMemo(() => {
    const symLiqs = liquidations.filter(l => l.symbol === symbol);
    if (symLiqs.length < 2) return [];

    const prices = symLiqs.map(l => l.avgPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;

    if (range === 0) return [];

    const bucketSize = range / bucketCount;
    const clusters: LiquidationCluster[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const low = minPrice + i * bucketSize;
      const high = low + bucketSize;
      const level = (low + high) / 2;

      const bucket = symLiqs.filter(l => l.avgPrice >= low && l.avgPrice < high);

      clusters.push({
        priceLevel: level,
        longLiqs: bucket.filter(l => l.side === "SELL").reduce((s, l) => s + l.usd, 0),
        shortLiqs: bucket.filter(l => l.side === "BUY").reduce((s, l) => s + l.usd, 0),
        count: bucket.length,
      });
    }

    return clusters;
  }, [liquidations, symbol, bucketCount]);
}

/**
 * Aggregate stats from liquidations
 */
export function useLiquidationStats(liquidations: Liquidation[]) {
  return useMemo(() => {
    const totalLongLiqUsd = liquidations
      .filter(l => l.side === "SELL")
      .reduce((s, l) => s + l.usd, 0);
    const totalShortLiqUsd = liquidations
      .filter(l => l.side === "BUY")
      .reduce((s, l) => s + l.usd, 0);

    // Group by symbol
    const bySymbol: Record<string, { longUsd: number; shortUsd: number; count: number }> = {};
    liquidations.forEach(l => {
      if (!bySymbol[l.symbol]) bySymbol[l.symbol] = { longUsd: 0, shortUsd: 0, count: 0 };
      bySymbol[l.symbol].count++;
      if (l.side === "SELL") bySymbol[l.symbol].longUsd += l.usd;
      else bySymbol[l.symbol].shortUsd += l.usd;
    });

    const topSymbols = Object.entries(bySymbol)
      .map(([sym, data]) => ({ symbol: sym, ...data, totalUsd: data.longUsd + data.shortUsd }))
      .sort((a, b) => b.totalUsd - a.totalUsd);

    return {
      totalLongLiqUsd,
      totalShortLiqUsd,
      totalCount: liquidations.length,
      bias: totalLongLiqUsd > totalShortLiqUsd ? "bearish" as const : "bullish" as const,
      topSymbols,
    };
  }, [liquidations]);
}
