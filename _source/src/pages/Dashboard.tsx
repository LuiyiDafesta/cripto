import { Panel } from "@/components/Panel";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Sparkline } from "@/components/Sparkline";
import { AssetIcon } from "@/components/AssetIcon";
import { ChangeChip } from "@/components/ChangeChip";
import { AICopilot } from "@/components/AICopilot";
import { InfoTooltip } from "@/components/InfoTooltip";
import { use24hTickers, useFearGreed, useFundingRates, useGlobalMacro, useAggTrades } from "@/lib/api";
import { useAllSmartScores } from "@/lib/useScores";
import { useUnifiedAssets } from "@/lib/useUnifiedAssets";
import { compactUsd, fmtPct, fmtPrice, scoreColor, timeAgo } from "@/lib/format";
import { detectPatterns } from "@/lib/scoring";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useAppStore } from "@/lib/store";

const HeatCell = ({ symbol, change, vol }: { symbol: string; change?: number; vol?: number }) => {
  const navigate = useNavigate();
  const c = change ?? 0;
  // Map -8..+8 to opacity 0.15..1
  const intensity = Math.min(1, Math.abs(c) / 8) * 0.85 + 0.15;
  const bg = c >= 0
    ? `hsl(152 75% 45% / ${intensity * 0.5})`
    : `hsl(350 85% 55% / ${intensity * 0.5})`;
  const border = c >= 0
    ? `hsl(152 75% 50% / ${intensity})`
    : `hsl(350 85% 55% / ${intensity})`;
  return (
    <button
      onClick={() => navigate(`/app/asset/${symbol}`)}
      className="rounded-lg p-3 text-left flex flex-col gap-1 hover:scale-[1.03] transition-transform"
      style={{ background: bg, border: `1px solid ${border}` }}
      title={`${symbol} · vol ${compactUsd(vol)}`}
    >
      <div className="flex items-center gap-1.5">
        <AssetIcon symbol={symbol} size={16} />
        <span className="text-xs font-semibold">{symbol.replace("USDT", "")}</span>
      </div>
      <div className="num text-xs font-semibold">{fmtPct(change ?? 0, 2)}</div>
      <div className="num text-[10px] text-foreground/70">{compactUsd(vol)}</div>
    </button>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data: tickers } = use24hTickers();
  const { data: macro } = useGlobalMacro();
  const { data: fng } = useFearGreed();
  const { data: funding } = useFundingRates();
  const { rows } = useAllSmartScores();
  const { allAssets } = useUnifiedAssets("all");

  // Track whales for Top 50 Binance assets
  const whaleSymbols = useMemo(() => 
    allAssets.filter(a => a.source === "both").slice(0, 50).map(a => a.binanceSymbol || `${a.symbol}USDT`)
  , [allAssets]);
  const whaleTrades = useAggTrades(whaleSymbols, 100_000, 10);

  const tickerMap = useMemo(() => {
    const m: Record<string, typeof tickers extends Array<infer T> ? T : never> = {} as any;
    tickers?.forEach((t) => ((m as any)[t.symbol] = t));
    return m as Record<string, NonNullable<typeof tickers>[number]>;
  }, [tickers]);

  const top10 = useMemo(() => [...rows].filter((r) => r.total > 0).sort((a, b) => b.total - a.total).slice(0, 10), [rows]);

  // Opportunity feed: scan top assets for patterns
  const opportunities = useMemo(() => {
    const out: { symbol: string; pattern: any; score: number }[] = [];
    rows.forEach((r) => {
      if (!r.klines4h?.length) return;
      const patterns = detectPatterns(r.symbol, r.klines4h);
      patterns.slice(0, 1).forEach((p) => out.push({ symbol: r.symbol, pattern: p, score: r.total }));
    });
    return out.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [rows]);

  const fundingExtremes = useMemo(() => {
    if (!funding) return { positive: [], negative: [] };
    const sorted = [...funding].sort((a, b) => b.lastFundingRate - a.lastFundingRate);
    return { positive: sorted.slice(0, 4), negative: sorted.slice(-4).reverse() };
  }, [funding]);

  const riskWarnings = useMemo(() => {
    const out: { symbol: string; reason: string; level: "warn" | "high" }[] = [];
    rows.forEach((r) => {
      if (r.funding < 25) out.push({ symbol: r.symbol, reason: "Funding muy estirado — riesgo de squeeze", level: "high" });
      else if (r.momentum > 85 && r.structure < 50) out.push({ symbol: r.symbol, reason: "Momentum caliente pero estructura débil", level: "warn" });
      else if (r.volume > 90 && r.total < 50) out.push({ symbol: r.symbol, reason: "Pico de volumen sobre setup pobre", level: "warn" });
    });
    return out.slice(0, 5);
  }, [rows]);

  const fngVal = fng?.[0]?.value;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Macro strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MacroCard label="Cap. Total" value={compactUsd(macro?.totalMarketCap)} change={macro?.marketCapChangePct24h} />
        
        {/* Dominance visualizer takes 2 cols */}
        <div className="col-span-2 glass rounded-lg px-4 py-3 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dominancia del Mercado</span>
            <span className="text-xs font-semibold">BTC {macro?.btcDominance.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden flex">
            <div className="h-full bg-bull" style={{ width: `${macro?.btcDominance ?? 0}%` }} title={`BTC: ${macro?.btcDominance.toFixed(1)}%`} />
            <div className="h-full bg-primary/60" style={{ width: `${macro?.ethDominance ?? 0}%` }} title={`ETH: ${macro?.ethDominance.toFixed(1)}%`} />
            <div className="h-full bg-muted" style={{ width: `${100 - (macro?.btcDominance ?? 0) - (macro?.ethDominance ?? 0)}%` }} title="Altcoins" />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>BTC</span>
            <span>ETH {macro?.ethDominance.toFixed(1)}%</span>
            <span>Alts {(100 - (macro?.btcDominance ?? 0) - (macro?.ethDominance ?? 0)).toFixed(1)}%</span>
          </div>
        </div>

        <MacroCard label="Fear & Greed" value={fngVal != null ? String(fngVal) : "—"} sub={fng?.[0]?.classification} />
        <MacroCard
          label="Volatilidad media"
          value={
            tickers
              ? (
                  tickers.reduce((s, t) => s + Math.abs(t.priceChangePercent), 0) / tickers.length
                ).toFixed(2) + "%"
              : "—"
          }
        />
        <MacroCard
          label="Volumen 24h"
          value={compactUsd(tickers?.reduce((s, t) => s + t.quoteVolume, 0))}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Smart Score top 10 */}
        <Panel
          title={<span className="flex items-center gap-1.5">Smart Score · Top 10 <InfoTooltip title="Smart Score" description="Puntaje de 0-100 que mide la salud técnica de una moneda. Analiza tendencia, volumen, fuerza relativa vs Bitcoin y funding de futuros. Más alto = mejor momento técnico." /></span>}
          right={
            <button onClick={() => navigate("/app/smart-score")} className="text-[10px] uppercase tracking-wider text-primary-glow hover:underline">
              Ranking completo →
            </button>
          }
          className="col-span-12 lg:col-span-3"
        >
          <ul className="divide-y divide-hairline">
            {top10.map((r, i) => {
              const t = tickerMap[r.symbol];
              const sparkVals = r.klines4h?.slice(-30).map((k) => k.close) ?? [];
              return (
                <li
                  key={r.symbol}
                  onClick={() => navigate(`/app/asset/${r.symbol}`)}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer transition group"
                >
                  <span className="num text-[10px] text-muted-foreground w-4">{i + 1}</span>
                  <AssetIcon symbol={r.symbol} size={22} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{r.base}</span>
                      <ChangeChip value={t?.priceChangePercent} />
                    </div>
                    <div className="num text-[10px] text-muted-foreground truncate">${fmtPrice(t?.lastPrice)}</div>
                  </div>
                  <Sparkline values={sparkVals} width={50} height={20} />
                  <ScoreBadge score={r.total} size="sm" />
                </li>
              );
            })}
            {top10.length === 0 && <li className="p-4 text-xs text-muted-foreground">Cargando scores…</li>}
          </ul>
        </Panel>

        {/* Center: heatmap + opportunity feed */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <Panel title={<span className="flex items-center gap-1.5">Mapa de calor · 24h <InfoTooltip title="Mapa de Calor" description="Cada cuadro representa una moneda. Verde = subió, rojo = bajó en las últimas 24 horas. Cuanto más intenso el color, mayor fue el movimiento. Hacé click en cualquiera para ver su detalle completo." /></span>} subtitle="Color = % cambio · Tamaño = nivel de volumen">
            <div className="p-3 grid grid-cols-4 md:grid-cols-5 gap-2 max-h-[420px] overflow-auto">
              {allAssets.map((a) => {
                const fetchSymbol = a.binanceSymbol || `${a.symbol}USDT`;
                const t = tickerMap[fetchSymbol];
                // For CMC-only assets, use the CMC data as fallback if ticker is missing
                const change = t?.priceChangePercent ?? a.change24h;
                const vol = t?.quoteVolume ?? a.volume24h;
                return <HeatCell key={fetchSymbol} symbol={fetchSymbol} change={change} vol={vol} />;
              })}
            </div>
          </Panel>

          <Panel title={<span className="flex items-center gap-1.5">Feed de oportunidades <InfoTooltip title="Oportunidades" description="Señales detectadas automáticamente por el scanner de patrones técnicos. Verde (alcista) = posible oportunidad de compra. Rojo (bajista) = posible señal de venta. No es consejo financiero." /></span>} right={<Flame className="h-3.5 w-3.5 text-warn" />}>
            <ul className="divide-y divide-hairline max-h-[420px] overflow-auto">
              {opportunities.map((o, i) => (
                <li
                  key={i}
                  onClick={() => navigate(`/app/asset/${o.symbol}`)}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer animate-fade-in-up"
                >
                  <AssetIcon symbol={o.symbol} size={26} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{o.symbol.replace("USDT", "")}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        o.pattern.direction === "bullish" ? "text-bull bg-bull/10" : "text-bear bg-bear/10"
                      )}>
                        {o.pattern.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{o.pattern.description}</p>
                  </div>
                  <ScoreBadge score={o.score} size="sm" />
                </li>
              ))}
              {opportunities.length === 0 && <li className="p-4 text-xs text-muted-foreground">Escaneando patrones…</li>}
            </ul>
          </Panel>
        </div>

        {/* Right rail */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <AICopilot />

          <Panel title={<span className="flex items-center gap-1.5">Avisos de riesgo <InfoTooltip title="Avisos de Riesgo" description="El sistema detecta automáticamente situaciones peligrosas: funding muy estirado (riesgo de squeeze), momentum caliente con estructura débil, o picos de volumen sobre setups pobres. Te ayuda a evitar trampas del mercado." /></span>} right={<AlertTriangle className="h-3.5 w-3.5 text-warn" />}>
            <ul className="divide-y divide-hairline">
              {riskWarnings.map((w, i) => (
                <li key={i} onClick={() => navigate(`/app/asset/${w.symbol}`)} className="px-4 py-2.5 flex items-start gap-2 hover:bg-surface-2/40 cursor-pointer">
                  <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", w.level === "high" ? "bg-bear" : "bg-warn")} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{w.symbol.replace("USDT", "")}</div>
                    <div className="text-xs text-muted-foreground">{w.reason}</div>
                  </div>
                </li>
              ))}
              {riskWarnings.length === 0 && <li className="p-4 text-xs text-muted-foreground">Sin avisos activos.</li>}
            </ul>
          </Panel>

          <Panel title="Pulso de Ballenas" right={<div className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-warn" /><span className="text-[10px] text-muted-foreground num">{whaleTrades.length} trades</span></div>}>
            <div className="divide-y divide-hairline">
              {whaleTrades.slice(0, 5).map((t, i) => (
                <div key={i} className="px-4 py-2 flex items-center justify-between text-xs animate-fade-in-up">
                  <div className="flex items-center gap-2">
                    <AssetIcon symbol={t.symbol} size={14} />
                    <span className="font-medium">{t.symbol.replace("USDT", "")}</span>
                    <span className={cn("font-semibold", t.isBuyerMaker ? "text-bear" : "text-bull")}>
                      {t.isBuyerMaker ? "VENTA" : "COMPRA"}
                    </span>
                  </div>
                  <span className="num font-semibold">{compactUsd(t.usd)}</span>
                </div>
              ))}
              {whaleTrades.length === 0 && (
                <div className="p-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><span className="status-dot" /> Conectando stream en vivo…</div>
                </div>
              )}
              <div className="px-4 py-2 border-t border-hairline">
                <button onClick={() => navigate("/app/whales")} className="text-[10px] text-primary-glow hover:underline uppercase tracking-wider">Ver todo →</button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Bottom: funding extremes */}
        <Panel title={<span className="flex items-center gap-1.5">Extremos de Funding <InfoTooltip title="Funding Rate" description="Costo que pagan los traders apalancados cada 8 horas. Funding alto (rojo) = demasiados largos apostando a subida, riesgo de corrección. Funding negativo (verde) = demasiados cortos, posible rebote alcista." /></span>} className="col-span-12 lg:col-span-6">
          <div className="grid grid-cols-2 divide-x divide-hairline">
            <FundingList title="Más saturado en largos" items={fundingExtremes.positive} variant="bear" />
            <FundingList title="Más saturado en cortos" items={fundingExtremes.negative} variant="bull" />
          </div>
        </Panel>

        <Panel title="Watchlist activa" className="col-span-12 lg:col-span-6">
          <WatchlistMini tickers={tickerMap} />
        </Panel>

        {/* Alerts tracking widget */}
        <Panel
          title={<span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5 text-primary-glow" /> Alertas Configuradas <InfoTooltip title="Tus Alertas" description="Acá ves todas las alertas que configuraste. Cuando se cumple una condición, aparece como disparada. Hacé click en 'Gestionar' para crear nuevas alertas o editar las existentes." /></span>}
          right={<button onClick={() => navigate("/app/alerts")} className="text-[10px] uppercase tracking-wider text-primary-glow hover:underline">Gestionar →</button>}
          className="col-span-12"
        >
          <AlertsMiniWidget />
        </Panel>
      </div>
    </div>
  );
};

const MacroCard = ({ label, value, change, sub }: { label: string; value: string; change?: number; sub?: string }) => (
  <div className="glass rounded-lg px-4 py-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="num text-base font-semibold mt-1">{value}</div>
    {change != null && <ChangeChip value={change} className="mt-1" />}
    {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
  </div>
);

const FundingList = ({ title, items, variant }: { title: string; items: any[]; variant: "bull" | "bear" }) => (
  <div className="p-4">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
    <ul className="space-y-1.5">
      {items.map((f) => (
        <li key={f.symbol} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AssetIcon symbol={f.symbol} size={16} />
            <span className="font-medium">{f.symbol.replace("USDT", "")}</span>
          </div>
          <span className={cn("num font-semibold", variant === "bear" ? "text-bear" : "text-bull")}>
            {(f.lastFundingRate * 100).toFixed(4)}%
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const WatchlistMini = ({ tickers }: { tickers: Record<string, any> }) => {
  const navigate = useNavigate();
  const list = useAppStore((s) => s.watchlist);
  return (
    <ul className="divide-y divide-hairline max-h-[260px] overflow-auto">
      {list.map((sym) => {
        const t = tickers[sym];
        return (
          <li key={sym} onClick={() => navigate(`/app/asset/${sym}`)} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2/40 cursor-pointer">
            <AssetIcon symbol={sym} size={20} />
            <span className="text-xs font-semibold flex-1">{sym.replace("USDT", "")}</span>
            <span className="num text-xs">${t ? fmtPrice(t.lastPrice) : "—"}</span>
            <ChangeChip value={t?.priceChangePercent} />
          </li>
        );
      })}
      {list.length === 0 && <li className="p-4 text-xs text-muted-foreground">No hay símbolos en seguimiento. Añádelos desde cualquier página de activo.</li>}
    </ul>
  );
};

const TYPE_LABELS: Record<string, string> = {
  price_above: "Precio ≥",
  price_below: "Precio ≤",
  score_above: "Score ≥",
  funding_above: "Funding ≥",
  vol_spike: "Vol. pico ×",
  breakout: "Breakout",
};

const AlertsMiniWidget = () => {
  const alerts = useAppStore((s) => s.alerts);
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">No tenés alertas configuradas</p>
        <button onClick={() => navigate("/app/alerts")} className="text-xs text-primary-glow hover:underline">Crear tu primera alerta →</button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-3">
      {alerts.map((a) => (
        <div key={a.id} className={cn("glass rounded-lg px-3 py-2.5 flex items-center gap-2 text-xs", a.enabled ? "border-primary/20" : "opacity-50")}>
          <AssetIcon symbol={a.symbol} size={18} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{a.symbol.replace("USDT", "")}</div>
            <div className="text-[10px] text-muted-foreground truncate">{TYPE_LABELS[a.type] || a.type} {a.threshold}</div>
          </div>
          <span className={cn("h-2 w-2 rounded-full shrink-0", a.enabled ? "bg-bull animate-pulse" : "bg-muted-foreground")} />
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
