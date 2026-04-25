import { Panel } from "@/components/Panel";
import { AICopilot } from "@/components/AICopilot";
import { Clock, Newspaper, Loader2 } from "lucide-react";
import { useYahooQuotes } from "@/hooks/useYahooData";

export const UsDashboard = () => {
  const { data: quotes, isLoading } = useYahooQuotes(["NVDA", "AAPL", "TSLA", "^TNX"]);

  const isMarketOpen = true; // Todavía puede mejorarse con lógica de horario real
  
  // Mapear los datos de Yahoo a las tarjetas. Si está cargando, usamos placeholders vacíos o evitamos el error.
  const acciones = ["NVDA", "AAPL", "TSLA"].map(sym => {
    const quote = quotes?.find(q => q.symbol === sym);
    return {
      symbol: sym,
      price: quote?.regularMarketPrice || 0,
      change: quote?.regularMarketChangePercent || 0,
      score: 85, // Mock score
      eps: quote?.epsTrailingTwelveMonths?.toFixed(2) || "-",
      pe: quote?.trailingPE?.toFixed(1) || "-",
    };
  });

  const tnxQuote = quotes?.find(q => q.symbol === "^TNX");
  const treasuries = [
    { 
      symbol: "US10Y (^TNX)", 
      price: tnxQuote?.regularMarketPrice || 0, 
      yield: tnxQuote ? `${tnxQuote.regularMarketPrice.toFixed(2)}%` : "-", 
      change: tnxQuote?.regularMarketChange || 0, 
      score: 80 
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold flex items-center gap-2">
            🇺🇸 US Market
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground mt-1">
            US Equities (Nasdaq, NYSE) & Treasuries.
          </p>
        </div>
        
        {/* Indicador de Mercado */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border ${isMarketOpen ? 'bg-bull/10 border-bull/30 text-bull' : 'bg-surface-2 border-strong text-muted-foreground'}`}>
          <Clock className="w-4 h-4" />
          {isMarketOpen ? "Market Open" : "Market Closed"}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Columna Izquierda: Paneles de activos */}
        <div className="col-span-1 lg:col-span-8 grid grid-cols-1 gap-4 lg:gap-6">
          
          {/* Tarjeta 1: Acciones US */}
          <Panel title="Top US Equities">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-3 flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                acciones.map((a) => (
                <div key={a.symbol} className="flex flex-col gap-2 p-4 rounded-lg bg-surface-2 border border-hairline hover:border-strong transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg leading-none">{a.symbol}</h3>
                      <span className="text-[10px] text-muted-foreground">Score: {a.score}/100</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">${a.price.toFixed(2)}</span>
                      <span className={`text-[10px] font-bold ${a.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                        {a.change >= 0 ? '+' : ''}{a.change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline text-[10px] text-muted-foreground">
                    <span>EPS: {a.eps}</span>
                    <span>P/E: {a.pe}</span>
                  </div>
                </div>
              )))}
            </div>
          </Panel>

          {/* Tarjeta 2: Treasuries */}
          <Panel title="US Treasuries (Bonds)">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? null : treasuries.map((b) => (
                <div key={b.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold">{b.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">Score: {b.score}/100</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">Yield: {b.yield}</span>
                    <span className={`text-[10px] font-semibold ${b.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {b.change > 0 ? '+' : ''}{b.change.toFixed(2)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

        </div>

        {/* Columna Derecha: IA Copilot & Noticias */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
          <Panel title="AI Copilot - Wall Street" className="flex-1 flex flex-col min-h-[400px]">
             {/* El Copilot usará mock context de estos activos */}
            <AICopilot context="Tech stocks are rallying today, led by NVDA (+4.5%) after strong AI server demand guidance. The US 10-year yield is up 5 bps to 4.25%, signaling persistent inflation concerns. Overall market sentiment is Bullish." />
          </Panel>

          <Panel title="Financial News">
            <div className="p-4 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <Newspaper className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <div className="text-xs font-semibold leading-tight mb-1">Federal Reserve holds rates steady</div>
                  <div className="text-[10px] text-muted-foreground">1 hour ago - Powell hints at one more hike this year.</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Newspaper className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <div className="text-xs font-semibold leading-tight mb-1">Nvidia hits all-time high</div>
                  <div className="text-[10px] text-muted-foreground">3 hours ago - Market cap surpasses $3T amid AI boom.</div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
};
