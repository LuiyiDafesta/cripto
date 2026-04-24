/**
 * CoinMarketCap API integration
 * 
 * Dev:  Uses Vite proxy (/api/cmc) — API key injected server-side by vite.config.ts
 * Prod: Uses VITE_CMC_PROXY_URL (your Dokploy microservice) — API key on VPS
 * 
 * Provides: Top 100 rankings, global metrics, detailed coin data
 * Coexists with Binance data — CMC for broad market view, Binance for trading depth
 */

import { useQuery } from "@tanstack/react-query";

// In dev: "/api/cmc" → Vite proxy → CMC API
// In prod: "https://cmc.tudominio.com" → Dokploy proxy → CMC API
const CMC_PROXY = import.meta.env.VITE_CMC_PROXY_URL || "/api/cmc";

// ---------- Types ----------

export interface CMCCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  infinite_supply: boolean;
  date_added: string;
  tags: string[];
  platform: { id: number; name: string; symbol: string; slug: string } | null;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
  };
}

export interface CMCGlobalMetrics {
  active_cryptocurrencies: number;
  total_cryptocurrencies: number;
  active_exchanges: number;
  total_exchanges: number;
  btc_dominance: number;
  eth_dominance: number;
  defi_volume_24h: number;
  defi_market_cap: number;
  stablecoin_volume_24h: number;
  stablecoin_market_cap: number;
  quote: {
    USD: {
      total_market_cap: number;
      total_volume_24h: number;
      total_market_cap_yesterday: number;
      total_volume_24h_yesterday: number;
      total_market_cap_yesterday_percentage_change: number;
      total_volume_24h_yesterday_percentage_change: number;
      altcoin_market_cap: number;
      altcoin_volume_24h: number;
      last_updated: string;
    };
  };
}

// ---------- API Fetchers ----------

async function cmcFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams(params);
  const res = await fetch(`${CMC_PROXY}${endpoint}?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`CMC API error: ${res.status}`);
  const json = await res.json();
  if (json.status?.error_code && json.status.error_code !== 0) {
    throw new Error(`CMC: ${json.status.error_message}`);
  }
  return json.data;
}

// ---------- React Query Hooks ----------

/**
 * Top 100 cryptocurrencies by market cap
 * Refreshes every 3 minutes (CMC free tier: 333 calls/day = ~1 every 4.3 min)
 */
export function useCMCListings(limit = 100) {
  return useQuery({
    queryKey: ["cmc", "listings", limit],
    queryFn: () => cmcFetch<CMCCoin[]>("/v1/cryptocurrency/listings/latest", {
      limit: String(limit),
      sort: "market_cap",
      convert: "USD",
    }),
    refetchInterval: 10 * 60 * 1000, // 10 min — CMC free tier: ~144 calls/day
    staleTime: 8 * 60 * 1000,
  });
}

/**
 * Global market metrics (total mcap, dominance, defi, stablecoins)
 */
export function useCMCGlobalMetrics() {
  return useQuery({
    queryKey: ["cmc", "global-metrics"],
    queryFn: () => cmcFetch<CMCGlobalMetrics>("/v1/global-metrics/quotes/latest"),
    refetchInterval: 15 * 60 * 1000, // 15 min — CMC free tier: ~96 calls/day
    staleTime: 12 * 60 * 1000,
  });
}

/**
 * Specific coin quotes by symbol (e.g., "NEXO,BTC,ETH")
 */
export function useCMCQuotes(symbols: string[]) {
  const symbolStr = symbols.join(",");
  return useQuery({
    queryKey: ["cmc", "quotes", symbolStr],
    queryFn: () => cmcFetch<Record<string, CMCCoin[]>>("/v2/cryptocurrency/quotes/latest", {
      symbol: symbolStr,
    }),
    enabled: symbols.length > 0,
    refetchInterval: 3 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

// ---------- Utility: Merge CMC + Binance data ----------

export interface UnifiedAsset {
  // Identity
  symbol: string;         // e.g. "BTC"
  name: string;           // e.g. "Bitcoin"
  cmcRank: number;
  cmcId: number;
  // Price data (CMC = averaged across exchanges)
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  // Market structure
  marketCap: number;
  volume24h: number;
  volumeChange24h: number;
  dominance: number;
  fdv: number;
  // Supply
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  // Source flags
  onBinance: boolean;     // Has Binance Spot/Futures pair
  binanceSymbol?: string; // e.g. "BTCUSDT"
  // Tags
  tags: string[];
}

/**
 * Convert CMC listings to unified format
 */
export function cmcToUnified(coins: CMCCoin[], binanceSymbols: Set<string>): UnifiedAsset[] {
  return coins.map(c => {
    const q = c.quote.USD;
    const bSymbol = `${c.symbol}USDT`;
    return {
      symbol: c.symbol,
      name: c.name,
      cmcRank: c.cmc_rank,
      cmcId: c.id,
      price: q.price,
      change1h: q.percent_change_1h,
      change24h: q.percent_change_24h,
      change7d: q.percent_change_7d,
      change30d: q.percent_change_30d,
      marketCap: q.market_cap,
      volume24h: q.volume_24h,
      volumeChange24h: q.volume_change_24h,
      dominance: q.market_cap_dominance,
      fdv: q.fully_diluted_market_cap,
      circulatingSupply: c.circulating_supply,
      totalSupply: c.total_supply,
      maxSupply: c.max_supply,
      onBinance: binanceSymbols.has(bSymbol),
      binanceSymbol: binanceSymbols.has(bSymbol) ? bSymbol : undefined,
      tags: c.tags?.slice(0, 5) ?? [],
    };
  });
}
