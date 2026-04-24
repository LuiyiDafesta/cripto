/**
 * Unified asset hook — merges Binance (ASSETS) + CoinMarketCap (Top 100)
 * into a single, filterable list used across ALL modules.
 * 
 * - Binance assets: full data (klines, funding, WS, Smart Score completo)
 * - CMC-only assets: price, market cap, volume, change % (Smart Score simplificado)
 * - Both: best of both worlds
 */

import { useMemo } from "react";
import { ASSETS, type Asset } from "./assets";
import { useCMCListings, cmcToUnified, type UnifiedAsset } from "./coinmarketcap";
import { use24hTickers } from "./api";

export type DataSource = "all" | "binance" | "cmc";

export interface EnrichedAsset extends UnifiedAsset {
  source: "binance" | "cmc" | "both";
  onBinance: boolean;
  /** Simplified Smart Score for CMC-only coins (0-100) */
  cmcSmartScore: number;
}

/**
 * Compute simplified smart score for CMC-only coins
 * Based on: rank (40%), volume/mcap ratio (30%), 24h momentum (30%)
 */
function computeCMCSmartScore(asset: UnifiedAsset): number {
  // Rank component: rank 1 = 100pts, rank 100 = 0pts
  const rankScore = Math.max(0, 100 - (asset.cmcRank - 1));

  // Volume/mcap ratio: healthy = 5-15%, excellent = 15%+
  const volMcapRatio = asset.marketCap > 0 ? (asset.volume24h / asset.marketCap) * 100 : 0;
  const volScore = Math.min(100, volMcapRatio * 5);

  // Momentum: +10% = 100pts, -10% = 0pts, linear
  const momScore = Math.max(0, Math.min(100, 50 + (asset.change24h * 5)));

  return Math.round(rankScore * 0.4 + volScore * 0.3 + momScore * 0.3);
}

export function useUnifiedAssets(filter: DataSource = "all") {
  const { data: cmcCoins, isLoading: cmcLoading, dataUpdatedAt: cmcUpdatedAt } = useCMCListings(100);
  const { data: tickers } = use24hTickers();

  const binanceSymbolSet = useMemo(() => new Set(ASSETS.map(a => a.symbol)), []);
  const binanceBaseSet = useMemo(() => new Set(ASSETS.map(a => a.base)), []);

  const unified = useMemo<EnrichedAsset[]>(() => {
    if (!cmcCoins) return [];

    // Convert CMC data to unified format
    const cmcUnified = cmcToUnified(cmcCoins, binanceSymbolSet);

    // Enrich with source tag + simplified score
    return cmcUnified.map(asset => {
      const onBinance = binanceBaseSet.has(asset.symbol);

      // If on Binance, use live Binance price
      if (onBinance && tickers) {
        const binTicker = tickers.find(t => t.symbol === `${asset.symbol}USDT`);
        if (binTicker) {
          asset.price = binTicker.lastPrice;
        }
      }

      return {
        ...asset,
        source: onBinance ? "both" : "cmc",
        onBinance,
        cmcSmartScore: computeCMCSmartScore(asset),
      } as EnrichedAsset;
    });
  }, [cmcCoins, tickers, binanceSymbolSet, binanceBaseSet]);

  const filtered = useMemo(() => {
    if (filter === "all") return unified;
    if (filter === "binance") return unified.filter(a => a.source === "both");
    return unified.filter(a => a.source === "cmc");
  }, [unified, filter]);

  return {
    assets: filtered,
    allAssets: unified,
    isLoading: cmcLoading,
    lastUpdate: cmcUpdatedAt ? new Date(cmcUpdatedAt) : null,
  };
}

/** Get all asset options for select dropdowns (CMC + Binance) */
export function useAllAssetOptions() {
  const { allAssets } = useUnifiedAssets("all");

  return useMemo(() => {
    // Start with Binance assets (always available)
    const options = ASSETS.map(a => ({
      value: a.symbol,
      label: a.base,
      name: a.name,
      source: "binance" as const,
    }));

    // Add CMC-only assets
    if (allAssets.length > 0) {
      allAssets.forEach(a => {
        if (a.source === "cmc") {
          options.push({
            value: `${a.symbol}USDT`,
            label: a.symbol,
            name: a.name,
            source: "cmc" as const,
          });
        }
      });
    }

    return options;
  }, [allAssets]);
}
