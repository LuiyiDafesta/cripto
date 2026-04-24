import { Panel } from "@/components/Panel";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ChangeChip } from "@/components/ChangeChip";
import { AssetIcon } from "@/components/AssetIcon";
import { InfoTooltip } from "@/components/InfoTooltip";
import { SourceBadge } from "@/components/SourceBadge";
import { AIContextPanel } from "@/components/AIContextPanel";
import { useAllSmartScores } from "@/lib/useScores";
import { useUnifiedAssets } from "@/lib/useUnifiedAssets";
import { use24hTickers } from "@/lib/api";
import { detectPatterns } from "@/lib/scoring";
import { compactUsd, fmtPrice } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Bot, RefreshCw, Sparkles } from "lucide-react";

type SignalType = "all" | "bullish" | "bearish";

export const ScannerPage = () => {
  const navigate = useNavigate();
  const { rows } = useAllSmartScores();
  const { data: tickers } = use24hTickers();
  const { assets: cmcAssets } = useUnifiedAssets("all");
  const [filter, setFilter] = useState<SignalType>("all");

  // Binance detections (pattern-based)
  const binanceDetections = useMemo(() => {
    const out: { symbol: string; base: string; score: number; patterns: any[]; ticker?: any; source: "binance" | "both" }[] = [];
    rows.forEach((r) => {
      if (!r.klines4h?.length) return;
      const p = detectPatterns(r.symbol, r.klines4h);
      if (p.length > 0) out.push({
        symbol: r.symbol,
        base: r.base ?? r.symbol.replace("USDT", ""),
        score: r.total,
        patterns: p,
        ticker: tickers?.find((t) => t.symbol === r.symbol),
        source: "both",
      });
    });
    return out;
  }, [rows, tickers]);

  // CMC momentum detections (price-based)
  const cmcDetections = useMemo(() => {
    return cmcAssets
      .filter(a => !a.onBinance)
      .filter(a => Math.abs(a.change24h) > 5 || Math.abs(a.change7d) > 15)
      .map(a => {
        const patterns: any[] = [];
        if (a.change24h > 10) patterns.push({ type: "Momentum Explosivo", direction: "bullish", description: `+${a.change24h.toFixed(1)}% en 24h — rally fuerte` });
        else if (a.change24h > 5) patterns.push({ type: "Momentum Alcista", direction: "bullish", description: `+${a.change24h.toFixed(1)}% en 24h` });
        if (a.change24h < -10) patterns.push({ type: "Caída Libre", direction: "bearish", description: `${a.change24h.toFixed(1)}% en 24h — sell-off` });
        else if (a.change24h < -5) patterns.push({ type: "Presión Bajista", direction: "bearish", description: `${a.change24h.toFixed(1)}% en 24h` });
        if (a.change7d > 20) patterns.push({ type: "Rally Semanal", direction: "bullish", description: `+${a.change7d.toFixed(1)}% en 7d` });
        if (a.change7d < -20) patterns.push({ type: "Retroceso Semanal", direction: "bearish", description: `${a.change7d.toFixed(1)}% en 7d` });

        return {
          symbol: `${a.symbol}USDT`,
          base: a.symbol,
          score: (a as any).cmcSmartScore ?? 50,
          patterns,
          price: a.price,
          volume: a.volume24h,
          source: "cmc" as const,
        };
      })
      .filter(d => d.patterns.length > 0);
  }, [cmcAssets]);

  // Merge all detections
  const allDetections = useMemo(() => {
    const all = [
      ...binanceDetections.map(d => ({
        ...d,
        price: d.ticker?.lastPrice ?? 0,
        volume: d.ticker?.quoteVolume ?? 0,
      })),
      ...cmcDetections,
    ].sort((a, b) => b.score - a.score);

    if (filter === "all") return all;
    if (filter === "bullish") return all.filter(d => d.patterns.some((p: any) => p.direction === "bullish"));
    return all.filter(d => d.patterns.some((p: any) => p.direction === "bearish"));
  }, [binanceDetections, cmcDetections, filter]);

  const filterButtons: { key: SignalType; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "bullish", label: "🟢 Alcistas" },
    { key: "bearish", label: "🔴 Bajistas" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Scanner de Mercado</h1>
          <InfoTooltip
            title="¿Cómo funciona el Scanner?"
            description="Detecta patrones técnicos automáticamente en las monedas de Binance (soportes, resistencias, divergencias) y cambios de precio fuertes en todas las monedas de CMC. Señal verde (alcista) = la moneda podría subir. Señal roja (bajista) = podría bajar. No es consejo financiero."
          />
        </div>
        <div className="flex items-center gap-1">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg transition",
                filter === btn.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 hover:bg-surface-3 text-muted-foreground"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{allDetections.length} señales detectadas · Binance (patrones técnicos) + CMC (momentum de precio)</p>

      {/* Signal Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allDetections.map((d) => (
          <button
            key={d.symbol}
            onClick={() => navigate(`/app/asset/${d.symbol}`)}
            className="text-left glass rounded-xl p-4 hover:border-primary/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-3">
              <AssetIcon symbol={d.symbol} size={26} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  {d.base}
                  <SourceBadge source={d.source} size="xs" />
                </div>
                <div className="num text-xs text-muted-foreground">${fmtPrice(d.price)} · {compactUsd(d.volume)}</div>
              </div>
              <ScoreBadge score={d.score} size="sm" />
            </div>
            <ul className="space-y-1.5">
              {d.patterns.slice(0, 3).map((p: any, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", p.direction === "bullish" ? "bg-bull" : "bg-bear")} />
                  <div className="min-w-0">
                    <span className={cn("font-semibold", p.direction === "bullish" ? "text-bull" : "text-bear")}>{p.type}</span>
                    <span className="text-muted-foreground"> — {p.description}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-hairline flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{d.patterns.length} señales</span>
              <span className="text-primary-glow text-[10px]">Ver detalle →</span>
            </div>
          </button>
        ))}
        {allDetections.length === 0 && <div className="col-span-3 text-center text-sm text-muted-foreground py-12">Escaneando mercado…</div>}
      </div>

      {/* AI Analysis Box */}
      <AIContextPanel
        title="Análisis IA del Scanner"
        defaultText="Generá un resumen ejecutivo con la Inteligencia Artificial analizando los setups actuales."
        onAnalyze={() => import('@/lib/ai-copilot').then(m => m.generateScannerAnalysis({
          bullish: allDetections.filter(d => d.patterns.some((p: any) => p.direction === "bullish")),
          bearish: allDetections.filter(d => d.patterns.some((p: any) => p.direction === "bearish")),
          topScores: allDetections.filter(d => d.score >= 60).sort((a,b) => b.score - a.score),
        }))}
      />
    </div>
  );
};

export default ScannerPage;
