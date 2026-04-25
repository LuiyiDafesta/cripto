import { Panel } from "@/components/Panel";
import { Clock, Newspaper, Loader2, TrendingUp, Sparkles, Building2 } from "lucide-react";
import { useYahooQuotes } from "@/hooks/useYahooData";
import { ChangeChip } from "@/components/ChangeChip";
import { cn } from "@/lib/utils";

const US_SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO", "TSM",
  "WMT", "JPM", "V", "XOM", "UNH", "MA", "PG", "JNJ", "HD", "COST", "AMD", "^TNX"
];

export const UsDashboard = () => {
  const { data: quotes, isLoading } = useYahooQuotes(US_SYMBOLS);

  const isMarketOpen = true; 
  
  const getQuote = (sym: string) => quotes?.find(q => q.symbol === sym);

  const acciones = US_SYMBOLS.filter(s => s !== "^TNX").map(sym => {
    const quote = getQuote(sym);
    return {
      symbol: sym,
      name: quote?.shortName || sym,
      price: quote?.regularMarketPrice || 0,
      change: quote?.regularMarketChangePercent || 0,
      score: Math.floor(Math.random() * 40) + 60, // Mock score for now
    };
  }).sort((a, b) => b.score - a.score);

  const tnxQuote = getQuote("^TNX");
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
          
          {/* Tarjeta 1: Acciones US - Lista como en Crypto */}
          <Panel title="Top US Equities (Nasdaq, NYSE)">
            <ul className="divide-y divide-hairline max-h-[500px] overflow-auto">
              {isLoading ? (
                <li className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></li>
              ) : (
                acciones.map((a, i) => (
                  <li
                    key={a.symbol}
                    className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer transition group"
                  >
                    <span className="num text-[10px] text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">{a.symbol}</span>
                        <ChangeChip value={a.change} />
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{a.name}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="num text-xs font-bold">${a.price.toFixed(2)}</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-muted-foreground">Score:</span>
                        <span className={cn("font-semibold", a.score > 80 ? "text-bull" : a.score < 50 ? "text-bear" : "text-warn")}>
                          {a.score}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
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
          
          <Panel title={<span className="flex items-center gap-1.5">Copiloto IA - Wall Street</span>} 
                 right={<span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-glow uppercase tracking-wider flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> IA</span>}>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded font-semibold text-bull bg-bull/10">
                  Régimen: Alcista
                </span>
                <span className="text-xs text-muted-foreground">Mercado impulsado por sector tecnológico.</span>
              </div>
              <div className="text-sm leading-relaxed prose prose-invert prose-sm text-muted-foreground">
                Las acciones tecnológicas (NVDA, MSFT, AAPL) continúan liderando el mercado impulsadas por los resultados en inteligencia artificial y semiconductores. El rendimiento del bono a 10 años ({tnxQuote ? tnxQuote.regularMarketPrice.toFixed(2) : "4.25"}%) se mantiene estable, quitando presión a los sectores de crecimiento.
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-bull flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Destacados hoy
                </div>
                {acciones.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded font-semibold bg-bull/20 text-bull">
                      {a.symbol}
                    </span>
                    <span className="text-muted-foreground truncate">Fuerte momentum alcista. Score alto.</span>
                  </div>
                ))}
              </div>
            </div>
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
