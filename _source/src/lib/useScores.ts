// Aggregated hook that computes Smart Score for all assets at once.
import { useMemo } from "react";
import { useFearGreed, useFundingRates, useGlobalMacro, useMultiKlines } from "./api";
import { computeSmartScore, SmartScoreBreakdown } from "./scoring";
import { useUnifiedAssets } from "./useUnifiedAssets";

export interface AssetScoreRow extends SmartScoreBreakdown {
  symbol: string;
  base: string;
  name: string;
  change24h?: number;
  change7d?: number;
  fundingRate?: number;
  klines4h?: any[];
  source: "binance" | "cmc" | "both";
}

export function useAllSmartScores() {
  const { allAssets, isLoading: assetsLoading } = useUnifiedAssets("all");
  
  // Extract only Binance symbols for klines fetching
  const binanceSymbols = useMemo(() => 
    allAssets.filter(a => a.source === "both").map(a => a.binanceSymbol || `${a.symbol}USDT`),
  [allAssets]);

  const klines4h = useMultiKlines(binanceSymbols, "4h", 60);
  const klines1d = useMultiKlines(binanceSymbols, "1d", 35);
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

    const result: AssetScoreRow[] = allAssets.map((a) => {
      const isBinance = a.source === "both";
      const fetchSymbol = a.binanceSymbol || `${a.symbol}USDT`;
      
      const k4a = k4[fetchSymbol] ?? [];
      const k1a = k1[fetchSymbol] ?? [];
      
      let breakdown: SmartScoreBreakdown;
      
      if (isBinance && k4a.length && k1a.length && btc1d.length) {
        breakdown = computeSmartScore({
          klines4h: k4a,
          klines1d: k1a,
          btcKlines1d: btc1d,
          fundingRate: fundingMap[fetchSymbol],
          btcDominance: btcDom,
          fearGreed: fngVal,
          isBtc: a.symbol === "BTC",
        });
      } else {
        // Fallback or CMC-only score
        breakdown = { 
          total: a.cmcSmartScore, 
          structure: 0, momentum: 0, volume: 0, relStrength: 0, funding: 0, oi: 0, macro: 0, sentiment: 0 
        };
      }

      return {
        ...breakdown,
        symbol: fetchSymbol,
        base: a.symbol,
        name: a.name,
        change24h: a.change24h,
        change7d: a.change7d,
        fundingRate: fundingMap[fetchSymbol],
        klines4h: k4a,
        source: a.source,
      };
    });

    return result.sort((a, b) => b.total - a.total);
  }, [allAssets, klines4h.data, klines1d.data, funding.data, macro.data, fng.data]);

  return {
    rows,
    isLoading: assetsLoading || (binanceSymbols.length > 0 && (klines4h.isLoading || klines1d.isLoading)),
  };
}
