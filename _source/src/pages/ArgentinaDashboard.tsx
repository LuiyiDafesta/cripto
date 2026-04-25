import { Panel } from "@/components/Panel";
import { Clock, Newspaper, Loader2, Sparkles, TrendingUp, Building2, Landmark } from "lucide-react";
import { useYahooQuotes } from "@/hooks/useYahooData";
import { ChangeChip } from "@/components/ChangeChip";
import { cn } from "@/lib/utils";

const ARG_SYMBOLS = [
  // Acciones
  "GGAL.BA", "YPFD.BA", "PAMP.BA", "BMA.BA", "SUPV.BA", "EDN.BA", "CEPU.BA", "TXAR.BA", "ALUA.BA", "CRES.BA",
  // Bonos
  "AL30.BA", "GD30.BA", "AL29.BA", "GD29.BA", "AL35.BA", "GD35.BA",
  // CEDEARs
  "AAPL.BA", "SPY.BA", "QQQ.BA", "MSFT.BA", "KO.BA", "MELI.BA", "V.BA", "AMZN.BA",
  // ONs
  "YCA6O.BA", "PTSTO.BA", "IRC1O.BA"
];

export const ArgentinaDashboard = () => {
  const { data: quotes, isLoading } = useYahooQuotes(ARG_SYMBOLS);

  const isMarketOpen = false; // Mock
  
  const getAssetData = (symbol: string, defaultTir?: string) => {
    const quote = quotes?.find(q => q.symbol === symbol);
    return {
      symbol: symbol.replace('.BA', ''),
      name: quote?.shortName || symbol.replace('.BA', ''),
      price: quote?.regularMarketPrice || 0,
      change: quote?.regularMarketChangePercent || 0,
      score: Math.floor(Math.random() * 40) + 60, // Mock
      tir: defaultTir
    };
  };

  const acciones = ARG_SYMBOLS.slice(0, 10).map(s => getAssetData(s)).sort((a,b)=>b.score-a.score);
  const bonos = ARG_SYMBOLS.slice(10, 16).map((s, i) => getAssetData(s, ["18.5%", "16.2%", "19.1%", "15.8%", "14.5%", "14.0%"][i]));
  const cedears = ARG_SYMBOLS.slice(16, 24).map(s => getAssetData(s)).sort((a,b)=>b.score-a.score);
  const ons = ARG_SYMBOLS.slice(24).map((s, i) => getAssetData(s, ["8.5% USD", "9.2% USD", "8.9% USD"][i]));

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
            <ul className="divide-y divide-hairline max-h-[300px] overflow-auto">
              {isLoading ? <li className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></li> : acciones.map((a, i) => (
                <li key={a.symbol} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer transition group">
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
                    <span className="num text-xs font-bold">${a.price.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-muted-foreground">Score:</span>
                      <span className={cn("font-semibold", a.score > 80 ? "text-bull" : a.score < 50 ? "text-bear" : "text-warn")}>{a.score}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Tarjeta 2: Bonos */}
          <Panel title="Bonos Soberanos">
            <ul className="divide-y divide-hairline max-h-[300px] overflow-auto">
              {isLoading ? <li className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></li> : bonos.map((b, i) => (
                <li key={b.symbol} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer transition group">
                  <span className="num text-[10px] text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                    <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{b.symbol}</span>
                      <ChangeChip value={b.change} />
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">Bono Soberano</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="num text-xs font-bold">${b.price.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-muted-foreground">TIR:</span>
                      <span className="font-semibold">{b.tir}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Tarjeta 3: CEDEARs */}
          <Panel title="CEDEARs (Acciones Globales)">
            <ul className="divide-y divide-hairline max-h-[300px] overflow-auto">
              {isLoading ? <li className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></li> : cedears.map((c, i) => (
                <li key={c.symbol} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer transition group">
                  <span className="num text-[10px] text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{c.symbol}</span>
                      <ChangeChip value={c.change} />
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.name}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="num text-xs font-bold">${c.price.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-muted-foreground">Score:</span>
                      <span className={cn("font-semibold", c.score > 80 ? "text-bull" : c.score < 50 ? "text-bear" : "text-warn")}>{c.score}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Tarjeta 4: Obligaciones Negociables */}
          <Panel title="Obligaciones Negociables (ONs)">
            <ul className="divide-y divide-hairline max-h-[300px] overflow-auto">
              {isLoading ? <li className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></li> : ons.map((o, i) => (
                <li key={o.symbol} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer transition group">
                  <span className="num text-[10px] text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                    <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{o.symbol}</span>
                      <ChangeChip value={o.change} />
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">Obligación Corp.</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="num text-xs font-bold">${o.price.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-muted-foreground">TIR:</span>
                      <span className="font-semibold">{o.tir}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

        </div>

        {/* Columna Derecha: IA Copilot & Noticias */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
          <Panel title={<span className="flex items-center gap-1.5">Copiloto IA - Local</span>} 
                 right={<span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-glow uppercase tracking-wider flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> IA</span>}>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded font-semibold text-bull bg-bull/10">
                  Régimen: Alcista Moderado
                </span>
                <span className="text-xs text-muted-foreground">Mercado impulsado por bonos y bancos.</span>
              </div>
              <div className="text-sm leading-relaxed prose prose-invert prose-sm text-muted-foreground">
                Mercado local firme. Los bonos soberanos AL30 y GD30 continúan liderando las subas con una fuerte compresión de TIR (promediando 16.2%). El CCL implícito se mantiene estabilizado. Las Obligaciones Negociables corporativas mantienen yields comprimidos entre 8% y 9%.
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-bull flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Fuerte Momentum
                </div>
                {acciones.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded font-semibold bg-bull/20 text-bull">
                      {a.symbol}
                    </span>
                    <span className="text-muted-foreground truncate">Buen comportamiento relativo vs CCL.</span>
                  </div>
                ))}
              </div>
            </div>
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
