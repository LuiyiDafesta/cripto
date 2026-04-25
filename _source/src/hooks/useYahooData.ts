import { useQuery } from "@tanstack/react-query";

// Determina automáticamente el endpoint base basado en el entorno
// En DEV: usa el proxy de Vite (/api/yahoo)
// En PROD: usa el script de PHP en Ferozo
const getYahooBaseUrl = (path: string, params: string) => {
  if (import.meta.env.DEV) {
    return `/api/yahoo${path}${params}`;
  }
  // URL de producción (Ferozo)
  const baseUrl = "https://lsnethub.com/aurafinance/yahoo-proxy.php";
  return `${baseUrl}?path=${encodeURIComponent(path)}&params=${encodeURIComponent(params)}`;
};

export interface YahooQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketChange: number;
  epsTrailingTwelveMonths?: number;
  trailingPE?: number;
}

export function useYahooQuotes(symbols: string[], enabled = true) {
  return useQuery({
    queryKey: ["yahoo", "quotes", symbols.join(",")],
    queryFn: async () => {
      if (symbols.length === 0) return [];
      
      const path = "/v8/finance/spark";
      const params = `?symbols=${symbols.join(",")}`;
      const url = getYahooBaseUrl(path, params);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Yahoo fetch failed");
      
      const data = await res.json();
      
      const results: YahooQuote[] = [];
      for (const symbol of symbols) {
        const item = data[symbol];
        if (item) {
          const closes = item.close || [];
          const lastPrice = closes.length > 0 ? closes[closes.length - 1] : 0;
          const prevClose = item.previousClose || lastPrice;
          const change = lastPrice - prevClose;
          const changePercent = prevClose ? (change / prevClose) * 100 : 0;
          
          results.push({
            symbol: item.symbol || symbol,
            shortName: item.symbol || symbol,
            regularMarketPrice: lastPrice,
            regularMarketChangePercent: changePercent,
            regularMarketChange: change,
            epsTrailingTwelveMonths: undefined,
            trailingPE: undefined,
          });
        }
      }
      
      return results;
    },
    enabled: enabled && symbols.length > 0,
    refetchInterval: 60000, // Cada 1 minuto
    staleTime: 30000,
  });
}
