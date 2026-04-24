// Live data layer — direct calls to public APIs with permissive CORS.
// Binance public REST/WS, alternative.me Fear & Greed (CORS-enabled),
// CoinGecko global (CORS-enabled).

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ASSETS } from "./assets";

const BINANCE_SPOT = "https://api.binance.com";
const BINANCE_FUTURES = "https://fapi.binance.com";

// ---------- Binance Exchange Info (all available USDT pairs) ----------
// Cache of valid Binance USDT symbols for dynamic detection
let _binanceSymbolsCache: Set<string> | null = null;

export function useBinanceSymbols() {
  return useQuery({
    queryKey: ["binance", "exchangeInfo"],
    queryFn: async () => {
      if (_binanceSymbolsCache) return _binanceSymbolsCache;
      const res = await fetch(`${BINANCE_SPOT}/api/v3/exchangeInfo`);
      if (!res.ok) return new Set<string>();
      const data = await res.json();
      const symbols = new Set<string>();
      for (const s of data.symbols) {
        if (s.quoteAsset === "USDT" && s.status === "TRADING") {
          symbols.add(s.symbol);
        }
      }
      _binanceSymbolsCache = symbols;
      return symbols;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 60 * 60 * 1000,
  });
}

/** Check if a symbol exists on Binance (instant from cache) */
export function isOnBinance(symbol: string): boolean {
  return _binanceSymbolsCache?.has(symbol) ?? ASSETS.some(a => a.symbol === symbol);
}

export interface Ticker24h {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;          // base
  quoteVolume: number;     // USDT
  openPrice: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
}

const parseKline = (k: any[]): Kline => ({
  openTime: k[0],
  open: +k[1],
  high: +k[2],
  low: +k[3],
  close: +k[4],
  volume: +k[5],
  closeTime: k[6],
  quoteVolume: +k[7],
  trades: +k[8],
});

// ---------- 24h tickers (one call gets all symbols) ----------
export function use24hTickers() {
  return useQuery({
    queryKey: ["binance", "ticker24h-batch"],
    queryFn: async () => {
      const url = `${BINANCE_SPOT}/api/v3/ticker/24hr`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tickers");
      const data = await res.json();
      return (data as any[])
        .filter(d => d.symbol.endsWith("USDT"))
        .map((d) => ({
          symbol: d.symbol,
          lastPrice: +d.lastPrice,
          priceChangePercent: +d.priceChangePercent,
          highPrice: +d.highPrice,
          lowPrice: +d.lowPrice,
          volume: +d.volume,
          quoteVolume: +d.quoteVolume,
          openPrice: +d.openPrice,
        })) as Ticker24h[];
    },
    refetchInterval: 8000,
    staleTime: 5000,
  });
}

// ---------- Klines ----------
export function useKlines(symbol: string, interval: string = "1h", limit = 200, enabled = true) {
  return useQuery({
    queryKey: ["binance", "klines", symbol, interval, limit],
    queryFn: async () => {
      const url = `${BINANCE_SPOT}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Klines failed");
      const data = await res.json();
      return (data as any[]).map(parseKline);
    },
    enabled: enabled && !!symbol,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

// Multi-symbol klines (parallel) — used by the score engine
export function useMultiKlines(symbols: string[], interval = "4h", limit = 60) {
  return useQuery({
    queryKey: ["binance", "multi-klines", symbols.join(","), interval, limit],
    queryFn: async () => {
      const out: Record<string, Kline[]> = {};
      await Promise.all(
        symbols.map(async (s) => {
          try {
            const url = `${BINANCE_SPOT}/api/v3/klines?symbol=${s}&interval=${interval}&limit=${limit}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              out[s] = (data as any[]).map(parseKline);
            }
          } catch (_) { /* ignore individual symbol */ }
        })
      );
      return out;
    },
    enabled: symbols.length > 0,
    refetchInterval: 60000,
    staleTime: 45000,
  });
}

// ---------- Funding rates (futures) ----------
export interface FundingInfo { symbol: string; lastFundingRate: number; nextFundingTime: number; markPrice: number; }
export function useFundingRates() {
  return useQuery({
    queryKey: ["binance", "premiumIndex"],
    queryFn: async () => {
      const res = await fetch(`${BINANCE_FUTURES}/fapi/v1/premiumIndex`);
      if (!res.ok) throw new Error("Funding fetch failed");
      const data = (await res.json()) as any[];
      return data
        .filter((d) => d.symbol.endsWith("USDT"))
        .map<FundingInfo>((d) => ({
          symbol: d.symbol,
          lastFundingRate: +d.lastFundingRate,
          nextFundingTime: +d.nextFundingTime,
          markPrice: +d.markPrice,
        }));
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

// ---------- Open interest history ----------
export function useOpenInterest(symbol: string, period = "1h") {
  return useQuery({
    queryKey: ["binance", "oi", symbol, period],
    queryFn: async () => {
      const url = `${BINANCE_FUTURES}/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=48`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("OI failed");
      const data = (await res.json()) as any[];
      return data.map((d) => ({
        timestamp: +d.timestamp,
        sumOpenInterest: +d.sumOpenInterest,
        sumOpenInterestValue: +d.sumOpenInterestValue,
      }));
    },
    enabled: !!symbol,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

// ---------- Long/Short ratio ----------
export function useLongShortRatio(symbol: string, period = "1h") {
  return useQuery({
    queryKey: ["binance", "lsr", symbol, period],
    queryFn: async () => {
      const url = `${BINANCE_FUTURES}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=48`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("LSR failed");
      const data = (await res.json()) as any[];
      return data.map((d) => ({
        timestamp: +d.timestamp,
        longShortRatio: +d.longShortRatio,
        longAccount: +d.longAccount,
        shortAccount: +d.shortAccount,
      }));
    },
    enabled: !!symbol,
    refetchInterval: 60000,
  });
}

// ---------- Fear & Greed ----------
export function useFearGreed() {
  return useQuery({
    queryKey: ["fng"],
    queryFn: async () => {
      const res = await fetch("https://api.alternative.me/fng/?limit=30");
      if (!res.ok) throw new Error("FNG failed");
      const data = await res.json();
      return (data.data as any[]).map((d) => ({
        value: +d.value,
        classification: d.value_classification as string,
        timestamp: +d.timestamp * 1000,
      }));
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });
}

// ---------- CoinGecko global (Total MCAP, BTC.D) ----------
export function useGlobalMacro() {
  return useQuery({
    queryKey: ["cg", "global"],
    queryFn: async () => {
      const res = await fetch("https://api.coingecko.com/api/v3/global");
      if (!res.ok) throw new Error("global failed");
      const json = await res.json();
      const d = json.data;
      return {
        totalMarketCap: d.total_market_cap.usd as number,
        totalVolume: d.total_volume.usd as number,
        marketCapChangePct24h: d.market_cap_change_percentage_24h_usd as number,
        btcDominance: d.market_cap_percentage.btc as number,
        ethDominance: d.market_cap_percentage.eth as number,
        activeCryptocurrencies: d.active_cryptocurrencies as number,
      };
    },
    refetchInterval: 2 * 60 * 1000,
    staleTime: 90 * 1000,
  });
}

// ---------- WebSocket: live mini-ticker for top symbols ----------
export interface MiniTick { symbol: string; close: number; open: number; high: number; low: number; volume: number; quoteVolume: number; }

export function useLiveMiniTickers(symbols: string[]) {
  const [ticks, setTicks] = useState<Record<string, MiniTick>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbols.length) return;
    const streams = symbols.map((s) => `${s.toLowerCase()}@miniTicker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const d = msg.data;
        if (!d) return;
        setTicks((prev) => ({
          ...prev,
          [d.s]: {
            symbol: d.s,
            close: +d.c,
            open: +d.o,
            high: +d.h,
            low: +d.l,
            volume: +d.v,
            quoteVolume: +d.q,
          },
        }));
      } catch (_) { /* ignore */ }
    };
    return () => { try { ws.close(); } catch (_) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  return ticks;
}

// ---------- WebSocket: aggregate trades (whale tape) ----------
export interface AggTrade { symbol: string; price: number; qty: number; usd: number; time: number; isBuyerMaker: boolean; }

export function useAggTrades(symbols: string[], minUsd = 250_000, maxKeep = 80) {
  const [trades, setTrades] = useState<AggTrade[]>([]);
  useEffect(() => {
    if (!symbols.length) return;
    const streams = symbols.map((s) => `${s.toLowerCase()}@aggTrade`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const d = msg.data;
        if (!d) return;
        const price = +d.p;
        const qty = +d.q;
        const usd = price * qty;
        if (usd < minUsd) return;
        const t: AggTrade = { symbol: d.s, price, qty, usd, time: +d.T, isBuyerMaker: !!d.m };
        setTrades((prev) => [t, ...prev].slice(0, maxKeep));
      } catch (_) { /* ignore */ }
    };
    return () => { try { ws.close(); } catch (_) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(","), minUsd]);
  return trades;
}
