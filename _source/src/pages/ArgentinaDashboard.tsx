import { Panel } from "@/components/Panel";
import { AICopilot } from "@/components/AICopilot";
import { Clock, TrendingUp, TrendingDown, Newspaper, Loader2 } from "lucide-react";
import { useYahooQuotes } from "@/hooks/useYahooData";

export const ArgentinaDashboard = () => {
  const { data: quotes, isLoading } = useYahooQuotes([
    "GGAL.BA", "YPFD.BA", "PAMP.BA", 
    "AL30.BA", "GD30.BA", 
    "AAPL.BA", "SPY.BA", 
    "YCA6O.BA", "PTSTO.BA"
  ]);

  const isMarketOpen = false; // Mock
  
  const getAssetData = (symbol: string, defaultTir?: string) => {
    const quote = quotes?.find(q => q.symbol === symbol);
    return {
      symbol: symbol.replace('.BA', ''), // Limpiamos el .BA para mostrar
      price: quote?.regularMarketPrice || 0,
      change: quote?.regularMarketChangePercent || 0,
      score: 85,
      tir: defaultTir
    };
  };

  const acciones = ["GGAL.BA", "YPFD.BA", "PAMP.BA"].map(s => getAssetData(s));
  const bonos = ["AL30.BA", "GD30.BA"].map((s, i) => getAssetData(s, i === 0 ? "18.5%" : "16.2%"));
  const cedears = ["AAPL.BA", "SPY.BA"].map(s => getAssetData(s));
  const ons = ["YCA6O.BA", "PTSTO.BA"].map((s, i) => getAssetData(s, i === 0 ? "8.5% USD" : "9.2% USD"));

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold flex items-center gap-2">
            🇦🇷 Mercado Argentino
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground mt-1">
            Acciones, Bonos Sobeanos, CEDEARs y Obligaciones Negociables.
          </p>
        </div>
        
        {/* Indicador de Mercado */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border ${isMarketOpen ? 'bg-bull/10 border-bull/30 text-bull' : 'bg-surface-2 border-strong text-muted-foreground'}`}>
          <Clock className="w-4 h-4" />
          {isMarketOpen ? "Mercado Abierto" : "Mercado Cerrado (Cotizaciones previas)"}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Columna Izquierda: Los 4 paneles de activos */}
        <div className="col-span-1 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          
          {/* Tarjeta 1: Acciones Locales */}
          <Panel title="Acciones Líderes (Merval)">
            <div className="p-4 flex flex-col gap-3">
              {isLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div> : acciones.map((a) => (
                <div key={a.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{a.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">Score: {a.score}/100</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">${a.price.toLocaleString('es-AR')}</span>
                    <span className={`text-[10px] font-semibold ${a.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {a.change >= 0 ? '+' : ''}{a.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tarjeta 2: Bonos */}
          <Panel title="Bonos Soberanos">
            <div className="p-4 flex flex-col gap-3">
              {isLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div> : bonos.map((b) => (
                <div key={b.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{b.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">TIR: {b.tir}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">${b.price.toLocaleString('es-AR')}</span>
                    <span className={`text-[10px] font-semibold ${b.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {b.change >= 0 ? '+' : ''}{b.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tarjeta 3: CEDEARs */}
          <Panel title="CEDEARs (Acciones Globales)">
            <div className="p-4 flex flex-col gap-3">
              {isLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div> : cedears.map((c) => (
                <div key={c.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{c.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">Score: {c.score}/100</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">${c.price.toLocaleString('es-AR')}</span>
                    <span className={`text-[10px] font-semibold ${c.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tarjeta 4: Obligaciones Negociables */}
          <Panel title="Obligaciones Negociables (ONs)">
            <div className="p-4 flex flex-col gap-3">
              {isLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div> : ons.map((o) => (
                <div key={o.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{o.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">TIR: {o.tir}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">${o.price.toLocaleString('es-AR')}</span>
                    <span className={`text-[10px] font-semibold ${o.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {o.change >= 0 ? '+' : ''}{o.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

        </div>

        {/* Columna Derecha: IA Copilot & Noticias */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
          <Panel title="Análisis IA - Mercado Local" className="flex-1 flex flex-col min-h-[400px]">
             {/* El Copilot usará mock context de estos activos */}
            <AICopilot context="Mercado local cerrado. Los bonos soberanos AL30 y GD30 lideraron subas con fuerte compresión de TIR (promedio 16.2%). El CCL implicito cerró en $1150. Las ONs corporativas mantienen yields comprimidos entre 8% y 9%." />
          </Panel>

          <Panel title="Noticias BYMA">
            <div className="p-4 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <Newspaper className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <div className="text-xs font-semibold leading-tight mb-1">El BCRA baja la tasa de política monetaria</div>
                  <div className="text-[10px] text-muted-foreground">Hace 2 horas - Impacto esperado en Lecaps y Boncer.</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Newspaper className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <div className="text-xs font-semibold leading-tight mb-1">YPF presenta balance del Q3</div>
                  <div className="text-[10px] text-muted-foreground">Hace 5 horas - Ebitda superó expectativas de Wall Street.</div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
};
