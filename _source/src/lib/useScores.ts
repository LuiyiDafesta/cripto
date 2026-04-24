// Aggregated hook that computes Smart Score for all 20 assets at once.
import { useMemo } from "react";
import { ASSETS } from "./assets";
import { useFearGreed, useFundingRates, useGlobalMacro, useMultiKlines } from "./api";
import { computeSmartScore, SmartScoreBreakdown } from "./scoring";

export interface AssetScoreRow extends SmartScoreBreakdown {
  symbol: string;
  base: string;
  name: string;
  change24h?: number;
  change7d?: number;
  fundingRate?: number;
  klines4h?: any[];
}

export function useAllSmartScores() {
  const symbols = ASSETS.map((a) => a.symbol);
  const klines4h = useMultiKlines(symbols, "4h", 60);
  const klines1d = useMultiKlines(symbols, "1d", 35);
  const funding = useFundingRates();
  const macro = useGlobalMacro();
  const fng = useFearGreed();

  const rows = useMemo(() => {
    const k4 = klines4h.data ?? {};
    const k1 = klines1d.data ?? {};
    const fundingMap: Record<string, number> = {};
    funding.data?.forEach((f) => (fundingMap[f.symbol] = f.lastFundingRate));

    const btc1d = k1["BTCUSDT"] ?? [];
    const fngVal = fng.data?.[0]?.value;
    const btcDom = macro.data?.btcDominance;

    const result: AssetScoreRow[] = ASSETS.map((a) => {
      const k4a = k4[a.symbol] ?? [];
      const k1a = k1[a.symbol] ?? [];
      const breakdown = (k4a.length && k1a.length && btc1d.length)
        ? computeSmartScore({
            klines4h: k4a,
            klines1d: k1a,
            btcKlines1d: btc1d,
            fundingRate: fundingMap[a.perpSymbol],
            btcDominance: btcDom,
            fearGreed: fngVal,
            isBtc: a.base === "BTC",
          })
        : { total: 0, structure: 0, momentum: 0, volume: 0, relStrength: 0, funding: 0, oi: 0, macro: 0, sentiment: 0 };

      // 24h change from last 6 4h-bars
      const change24h = k4a.length >= 7
        ? ((k4a[k4a.length - 1].close / k4a[k4a.length - 7].close) - 1) * 100
        : undefined;
      // 7d change from 1d klines
      const change7d = k1a.length >= 8
        ? ((k1a[k1a.length - 1].close / k1a[k1a.length - 8].close) - 1) * 100
        : undefined;

      return {
        ...breakdown,
        symbol: a.symbol,
        base: a.base,
        name: a.name,
        change24h,
        change7d,
        fundingRate: fundingMap[a.perpSymbol],
        klines4h: k4a,
      };
    });

    return result;
  }, [klines4h.data, klines1d.data, funding.data, macro.data, fng.data]);

  return {
    rows,
    isLoading: klines4h.isLoading || klines1d.isLoading,
  };
}
