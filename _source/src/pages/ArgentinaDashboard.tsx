import { Panel } from "@/components/Panel";
import { AICopilot } from "@/components/AICopilot";
import { Clock, TrendingUp, TrendingDown, Newspaper } from "lucide-react";

export const ArgentinaDashboard = () => {
  const isMarketOpen = false; // Mock: Fuera de horario de mercado (11 a 17h)
  
  // Mock data para el borrador
  const acciones = [
    { symbol: "GGAL", price: 3450, change: 2.4, score: 85 },
    { symbol: "YPFD", price: 28900, change: -1.2, score: 72 },
    { symbol: "PAMP", price: 2150, change: 0.5, score: 68 },
  ];
  
  const bonos = [
    { symbol: "AL30", price: 62.5, change: 1.1, tir: "18.5%", score: 90 },
    { symbol: "GD30", price: 65.2, change: 0.8, tir: "16.2%", score: 88 },
  ];

  const cedears = [
    { symbol: "AAPL", price: 18500, change: 3.2, score: 95 },
    { symbol: "SPY", price: 32000, change: 1.5, score: 89 },
  ];

  const ons = [
    { symbol: "YCA6O", price: 102.5, change: 0.1, tir: "8.5% USD", score: 75 },
    { symbol: "PTSTO", price: 98.2, change: -0.5, tir: "9.2% USD", score: 70 },
  ];

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
              {acciones.map((a) => (
                <div key={a.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{a.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">Score: {a.score}/100</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">${a.price}</span>
                    <span className={`text-[10px] font-semibold ${a.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {a.change >= 0 ? '+' : ''}{a.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tarjeta 2: Bonos */}
          <Panel title="Bonos Soberanos">
            <div className="p-4 flex flex-col gap-3">
              {bonos.map((b) => (
                <div key={b.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{b.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">TIR: {b.tir}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">u$s {b.price}</span>
                    <span className={`text-[10px] font-semibold ${b.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {b.change >= 0 ? '+' : ''}{b.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tarjeta 3: CEDEARs */}
          <Panel title="CEDEARs (Acciones Globales)">
            <div className="p-4 flex flex-col gap-3">
              {cedears.map((c) => (
                <div key={c.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{c.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">Score: {c.score}/100</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">${c.price}</span>
                    <span className={`text-[10px] font-semibold ${c.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {c.change >= 0 ? '+' : ''}{c.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tarjeta 4: Obligaciones Negociables */}
          <Panel title="Obligaciones Negociables (ONs)">
            <div className="p-4 flex flex-col gap-3">
              {ons.map((o) => (
                <div key={o.symbol} className="flex items-center justify-between p-3 rounded-md bg-surface-2 border border-hairline">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{o.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">TIR: {o.tir}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-sm">u$s {o.price}</span>
                    <span className={`text-[10px] font-semibold ${o.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {o.change >= 0 ? '+' : ''}{o.change}%
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
