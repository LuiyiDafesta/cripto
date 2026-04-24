// Real crypto news from public RSS feeds via RSS2JSON (free, no API key)
import { useQuery } from "@tanstack/react-query";

// Multiple RSS sources for diverse coverage
const RSS_SOURCES = [
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "The Block", url: "https://www.theblock.co/rss.xml" },
];

const RSS2JSON_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  thumbnail: string;
  publishedAt: number;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  impact: "high" | "med" | "low";
  relatedAssets: string[];
}

// Keyword-based sentiment analysis
const BULLISH_KEYWORDS = [
  "surge", "rally", "soar", "bull", "breakout", "gain", "record",
  "adoption", "institutional", "etf", "approval", "upgrade", "launch",
  "partnership", "integration", "growth", "rise", "pump", "inflow",
  "positive", "optimis", "accumulate", "buy", "support", "recover",
  "all-time high", "ath", "milestone", "boost",
];

const BEARISH_KEYWORDS = [
  "crash", "drop", "fall", "bear", "dump", "decline", "sell",
  "hack", "exploit", "ban", "restrict", "investigation", "fraud",
  "lawsuit", "sec", "regulation", "fine", "warning", "risk",
  "outflow", "liquidat", "bankrupt", "collapse", "fear", "plunge",
  "scam", "rug pull", "ponzi", "arrest", "guilty",
];

// Map keywords in titles to asset symbols
const ASSET_KEYWORDS: Record<string, string> = {
  bitcoin: "BTCUSDT", btc: "BTCUSDT",
  ethereum: "ETHUSDT", eth: "ETHUSDT", ether: "ETHUSDT",
  solana: "SOLUSDT", sol: "SOLUSDT",
  bnb: "BNBUSDT", binance: "BNBUSDT",
  xrp: "XRPUSDT", ripple: "XRPUSDT",
  cardano: "ADAUSDT", ada: "ADAUSDT",
  dogecoin: "DOGEUSDT", doge: "DOGEUSDT",
  avalanche: "AVAXUSDT", avax: "AVAXUSDT",
  chainlink: "LINKUSDT", link: "LINKUSDT",
  polkadot: "DOTUSDT", dot: "DOTUSDT",
  polygon: "MATICUSDT", matic: "MATICUSDT",
  litecoin: "LTCUSDT", ltc: "LTCUSDT",
  near: "NEARUSDT",
  cosmos: "ATOMUSDT", atom: "ATOMUSDT",
  aptos: "APTUSDT", apt: "APTUSDT",
  arbitrum: "ARBUSDT", arb: "ARBUSDT",
  optimism: "OPUSDT", op: "OPUSDT",
  injective: "INJUSDT", inj: "INJUSDT",
  toncoin: "TONUSDT", ton: "TONUSDT",
};

function analyzeSentiment(text: string): {
  sentiment: "bullish" | "bearish" | "neutral";
  score: number;
  impact: "high" | "med" | "low";
} {
  const lower = text.toLowerCase();

  let bullishHits = 0;
  let bearishHits = 0;

  BULLISH_KEYWORDS.forEach(k => { if (lower.includes(k)) bullishHits++; });
  BEARISH_KEYWORDS.forEach(k => { if (lower.includes(k)) bearishHits++; });

  const total = bullishHits + bearishHits;
  let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
  let score = 50;

  if (total > 0) {
    const ratio = bullishHits / total;
    if (ratio > 0.6) {
      sentiment = "bullish";
      score = 50 + Math.min(50, bullishHits * 12);
    } else if (ratio < 0.4) {
      sentiment = "bearish";
      score = 50 - Math.min(50, bearishHits * 12);
    }
  }

  const impact: "high" | "med" | "low" =
    total >= 3 ? "high" : total >= 1 ? "med" : "low";

  return { sentiment, score: Math.max(0, Math.min(100, score)), impact };
}

function extractAssets(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  Object.entries(ASSET_KEYWORDS).forEach(([keyword, symbol]) => {
    // Match as whole word (with word boundaries)
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(lower)) found.add(symbol);
  });
  return Array.from(found);
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim() ?? "";
}

async function fetchFeed(source: typeof RSS_SOURCES[0]): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${RSS2JSON_BASE}${encodeURIComponent(source.url)}`);
    if (!res.ok) return [];
    const json = await res.json();

    if (json.status !== "ok" || !json.items) return [];

    return json.items.map((item: any, idx: number) => {
      const title = stripHtml(item.title ?? "");
      const description = stripHtml(item.description ?? "").slice(0, 300);
      const fullText = `${title} ${description}`;
      const { sentiment, score, impact } = analyzeSentiment(fullText);

      return {
        id: `${source.name}-${idx}-${item.pubDate}`,
        title,
        description,
        url: item.link ?? "",
        source: source.name,
        thumbnail: item.thumbnail ?? item.enclosure?.link ?? "",
        publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        sentiment,
        sentimentScore: score,
        impact,
        relatedAssets: extractAssets(fullText),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch real crypto news from multiple RSS feeds
 * 100% free, no API key required
 */
export function useRealNews(limit = 40) {
  return useQuery({
    queryKey: ["news", "rss-multi", limit],
    queryFn: async () => {
      const results = await Promise.allSettled(
        RSS_SOURCES.map(s => fetchFeed(s))
      );

      const all: NewsItem[] = [];
      results.forEach(r => {
        if (r.status === "fulfilled") all.push(...r.value);
      });

      // Sort by publish date, newest first
      all.sort((a, b) => b.publishedAt - a.publishedAt);
      return all.slice(0, limit);
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Get aggregate sentiment score for Smart Score integration
 * Returns 0-100 score based on recent news sentiment
 */
export function useNewsSentiment(symbol?: string) {
  const { data: news } = useRealNews(50);

  if (!news || news.length === 0) return undefined;

  const relevant = symbol
    ? news.filter(n => n.relatedAssets.includes(symbol) || n.relatedAssets.length === 0)
    : news;

  if (relevant.length === 0) return 50;

  let totalWeight = 0;
  let weightedSum = 0;

  relevant.forEach((n, i) => {
    const recency = Math.max(0.2, 1 - i * 0.03);
    const impactMul = n.impact === "high" ? 1.5 : n.impact === "med" ? 1 : 0.5;
    const w = recency * impactMul;
    totalWeight += w;
    weightedSum += n.sentimentScore * w;
  });

  return Math.round(totalWeight > 0 ? weightedSum / totalWeight : 50);
}
