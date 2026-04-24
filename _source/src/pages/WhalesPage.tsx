import { useState, useMemo } from "react";
import { Panel } from "@/components/Panel";
import { AssetIcon } from "@/components/AssetIcon";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useAggTrades, useFundingRates } from "@/lib/api";
import { useLiveLiquidations, useLiquidationStats } from "@/lib/liquidations";
import { compactUsd, fmtPrice, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Zap, Wifi, WifiOff } from "lucide-react";

import { useUnifiedAssets } from "@/lib/useUnifiedAssets";

const FILTERS = [50_000, 250_000, 500_000, 1_000_000, 5_000_000];

export const WhalesPage = () => {
  const [min, setMin] = useState(50_000);
  const { allAssets } = useUnifiedAssets("all");
  const symbols = useMemo(() => 
    allAssets.filter(a => a.source === "both").slice(0, 50).map(a => a.binanceSymbol || `${a.symbol}USDT`)
  , [allAssets]);
  const trades = useAggTrades(symbols, min, 100);
  const { data: funding } = useFundingRates();

  // Real liquidations from Binance Futures WebSocket
  const liquidations = useLiveLiquidations(200);
  const liqStats = useLiquidationStats(liquidations);
  const isConnected = trades.length > 0 || liqStats.totalCount > 0;

  const fundingExtremes = useMemo(() => {
    if (!funding) return { p: [], n: [] };
    const s = [...funding].sort((a, b) => b.lastFundingRate - a.lastFundingRate);
    return { p: s.slice(0, 6), n: s.slice(-6).reverse() };
  }, [funding]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Seguimiento de Ballenas</h1>
              <InfoTooltip
                title="¿Qué son las Ballenas?"
                description="Las ballenas son inversores que mueven grandes cantidades de dinero (>$50K USD por operación). Acá ves sus compras y ventas en tiempo real en Binance. Si una ballena compra mucho BTC, puede empujar el precio arriba. Solo muestra monedas de Binance Futures — las operaciones tardan en aparecer según la actividad del mercado."
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">Operaciones grandes en vivo · Binance top 20</p>
              <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded", isConnected ? "bg-bull/10 text-bull" : "bg-warn/10 text-warn")}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? "En vivo" : "Conectando…"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Filtrar ≥</span>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setMin(f)}
              className={cn("px-2.5 py-1 text-xs rounded num", min === f ? "bg-primary text-primary-foreground" : "bg-surface-2 hover:bg-surface-3")}
            >
              ${compactUsd(f).replace("$", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Cinta de operaciones en vivo" className="col-span-12 lg:col-span-8">
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-2/90 backdrop-blur border-b border-hairline">
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 text-left">Hora</th>
                  <th className="px-3 py-2 text-left">Activo</th>
                  <th className="px-3 py-2 text-right">Lado</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">Nocional USD</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={i} className="border-b border-hairline animate-fade-in-up">
                    <td className="px-3 py-2 num text-xs text-muted-foreground">{fmtTime(t.time)}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><AssetIcon symbol={t.symbol} size={18} /><span className="text-xs font-semibold">{t.symbol.replace("USDT", "")}</span></div></td>
                    <td className={cn("px-3 py-2 text-right text-xs font-semibold", t.isBuyerMaker ? "text-bear" : "text-bull")}>{t.isBuyerMaker ? "VENTA" : "COMPRA"}</td>
                    <td className="px-3 py-2 num text-right">${fmtPrice(t.price)}</td>
                    <td className="px-3 py-2 num text-right text-xs">{t.qty.toFixed(4)}</td>
                    <td className={cn("px-3 py-2 num text-right font-semibold", t.usd >= 1_000_000 ? "text-primary-glow" : t.usd >= 500_000 ? "text-bull" : "")}>{compactUsd(t.usd)}</td>
                  </tr>
                ))}
                {trades.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">Conectando al WS… las operaciones grandes aparecerán aquí.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Panel title="Funding · Largos saturados">
            <ul className="divide-y divide-hairline">
              {fundingExtremes.p.map((f) => (
                <li key={f.symbol} className="px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><AssetIcon symbol={f.symbol} size={16} /><span className="font-medium">{f.symbol.replace("USDT", "")}</span></div>
                  <span className="num font-semibold text-bear">{(f.lastFundingRate * 100).toFixed(4)}%</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Funding · Cortos saturados">
            <ul className="divide-y divide-hairline">
              {fundingExtremes.n.map((f) => (
                <li key={f.symbol} className="px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><AssetIcon symbol={f.symbol} size={16} /><span className="font-medium">{f.symbol.replace("USDT", "")}</span></div>
                  <span className="num font-semibold text-bull">{(f.lastFundingRate * 100).toFixed(4)}%</span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Real liquidation data from Binance Futures forceOrder */}
          <Panel
            title="Liquidaciones en vivo"
            right={<div className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-warn" /><span className="text-[10px] text-muted-foreground">{liqStats.totalCount} detectadas</span></div>}
          >
            <div className="p-4 space-y-3">
              {/* Bias indicator */}
              <div className={cn(
                "rounded-lg p-3 flex items-center gap-3",
                liqStats.bias === "bullish" ? "bg-bull/10 border border-bull/20" : "bg-bear/10 border border-bear/20"
              )}>
                <div className="text-xs">
                  <div className="font-semibold">
                    Sesgo: {liqStats.bias === "bullish" ? "Más shorts liquidados" : "Más longs liquidados"}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    Longs: {compactUsd(liqStats.totalLongLiqUsd)} · Shorts: {compactUsd(liqStats.totalShortLiqUsd)}
                  </div>
                </div>
              </div>

              {/* Top symbols by liquidation volume */}
              <div className="space-y-1.5">
                {liqStats.topSymbols.slice(0, 8).map((s) => {
                  const total = s.longUsd + s.shortUsd;
                  const longPct = total > 0 ? (s.longUsd / total) * 100 : 50;
                  return (
                    <div key={s.symbol} className="flex items-center gap-2 text-xs">
                      <AssetIcon symbol={s.symbol} size={14} />
                      <span className="font-medium w-12">{s.symbol.replace("USDT", "")}</span>
                      <div className="flex-1 h-3 rounded overflow-hidden flex">
                        <div className="bg-bear/60" style={{ width: `${longPct}%` }} title={`Longs liq: ${compactUsd(s.longUsd)}`} />
                        <div className="bg-bull/60" style={{ width: `${100 - longPct}%` }} title={`Shorts liq: ${compactUsd(s.shortUsd)}`} />
                      </div>
                      <span className="num w-14 text-right text-muted-foreground">{compactUsd(s.totalUsd)}</span>
                    </div>
                  );
                })}
              </div>

              {liqStats.totalCount === 0 && (
                <p className="text-[10px] text-muted-foreground">Conectando al stream de liquidaciones… los datos aparecerán en vivo.</p>
              )}

              {/* Recent liquidations feed */}
              {liquidations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-hairline">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Últimas liquidaciones</div>
                  <div className="space-y-1 max-h-[200px] overflow-auto">
                    {liquidations.slice(0, 20).map((l, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] animate-fade-in-up">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("font-semibold", l.side === "SELL" ? "text-bear" : "text-bull")}>
                            {l.side === "SELL" ? "LONG" : "SHORT"}
                          </span>
                          <span className="text-muted-foreground">{l.symbol.replace("USDT", "")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="num">${fmtPrice(l.avgPrice)}</span>
                          <span className={cn("num font-semibold", l.usd >= 100_000 ? "text-warn" : "")}>
                            {compactUsd(l.usd)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default WhalesPage;
