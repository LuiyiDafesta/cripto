import { useState, useEffect, useMemo } from "react";
import { Panel } from "./Panel";
import { InfoTooltip } from "./InfoTooltip";
import { cn } from "@/lib/utils";
import { analyzeMarketLocal, generateAIBrief, type AIBrief, type MarketInsight } from "@/lib/ai-copilot";
import { useAllSmartScores } from "@/lib/useScores";
import { use24hTickers, useFearGreed, useFundingRates, useGlobalMacro } from "@/lib/api";
import { detectPatterns } from "@/lib/scoring";
import { Bot, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import { fmtPrice } from "@/lib/format";

export const AICopilot = ({ compact = false }: { compact?: boolean }) => {
  const { rows } = useAllSmartScores();
  const { data: tickers } = use24hTickers();
  const { data: fng } = useFearGreed();
  const { data: macro } = useGlobalMacro();
  const { data: funding } = useFundingRates();
  const [brief, setBrief] = useState<AIBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  // Local analysis (always available)
  const insight = useMemo<MarketInsight | null>(() => {
    if (!rows.length) return null;

    const fundingExtremes = funding ? (() => {
      const sorted = [...funding].sort((a, b) => b.lastFundingRate - a.lastFundingRate);
      return { positive: sorted.slice(0, 4), negative: sorted.slice(-4).reverse() };
    })() : undefined;

    const patterns = rows.flatMap(r => {
      if (!r.klines4h?.length) return [];
      return detectPatterns(r.symbol, r.klines4h).slice(0, 1).map(p => ({ symbol: r.symbol, pattern: p, score: r.total }));
    }).sort((a, b) => b.score - a.score).slice(0, 8);

    return analyzeMarketLocal({
      scores: rows.map(r => ({
        symbol: r.symbol,
        total: r.total,
        structure: r.structure,
        momentum: r.momentum,
        volume: r.volume,
        funding: r.funding,
      })),
      fearGreed: fng?.[0]?.value,
      btcDominance: macro?.btcDominance,
      marketCapChange: macro?.marketCapChangePct24h,
      fundingExtremes,
      patterns,
    });
  }, [rows, fng, macro, funding]);

  // Generate AI brief
  const generateBrief = async () => {
    if (!insight || !rows.length) return;
    setLoading(true);
    try {
      const btcTicker = tickers?.find(t => t.symbol === "BTCUSDT");
      const result = await generateAIBrief({
        insight,
        scores: rows.map(r => ({ symbol: r.symbol, total: r.total, base: r.base ?? r.symbol.replace("USDT", "") })),
        fearGreed: fng?.[0]?.value,
        btcDominance: macro?.btcDominance,
        marketCapChange: macro?.marketCapChangePct24h,
        btcPrice: btcTicker?.lastPrice,
      });
      setBrief(result);
    } catch (err) {
      console.error("[AI Copilot]", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on first load
  useEffect(() => {
    if (insight && !brief && rows.length > 5) {
      generateBrief();
    }
  }, [insight, rows.length]);

  if (!insight) {
    return (
      <Panel title="Copiloto IA" right={<Bot className="h-3.5 w-3.5 text-primary-glow" />}>
        <div className="p-4 text-xs text-muted-foreground">Cargando datos para análisis…</div>
      </Panel>
    );
  }

  const REGIME_COLORS: Record<string, string> = {
    alcista: "text-bull bg-bull/10",
    bajista: "text-bear bg-bear/10",
    lateral: "text-muted-foreground bg-surface-3",
    "volátil": "text-warn bg-warn/10",
  };

  const buys = insight.signals.filter(s => s.type === "compra");
  const sells = insight.signals.filter(s => s.type === "venta");

  return (
    <Panel
      title={<span className="flex items-center gap-1.5">Copiloto IA <InfoTooltip title="Copiloto de Inteligencia Artificial" description="Analiza toda la data del mercado (precios, volumen, funding, patrones) con inteligencia artificial y te da un resumen en español. Incluye señales de compra/venta, nivel de riesgo y consejos. Presioná 'Analizar' para generar un reporte actualizado. El análisis se genera bajo demanda, no en tiempo real." /></span>}
      right={
        <div className="flex items-center gap-2">
          {brief?.model && brief.model !== "local" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-glow uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Groq
            </span>
          )}
          <button
            onClick={generateBrief}
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary-glow hover:bg-primary/20 transition flex items-center gap-1"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            {loading ? "Analizando…" : "Analizar"}
          </button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        {/* Regime badge */}
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 rounded font-semibold", REGIME_COLORS[insight.regime])}>
            Régimen: {insight.regime}
          </span>
          <span className="text-xs text-muted-foreground">{insight.summary}</span>
        </div>

        {/* AI Brief (from Groq or local) */}
        {brief && (
          <div
            className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <div className="whitespace-pre-line">{brief.content}</div>
            ) : (
              <div className="line-clamp-3 text-muted-foreground">{brief.content}</div>
            )}
          </div>
        )}

        {/* Quick signals */}
        {!expanded && (
          <>
            {/* Buy signals */}
            {buys.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-bull flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Señales de compra
                </div>
                {buys.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded font-semibold",
                      s.strength === "fuerte" ? "bg-bull/20 text-bull" : "bg-bull/10 text-bull/70"
                    )}>
                      {s.symbol.replace("USDT", "")}
                    </span>
                    <span className="text-muted-foreground truncate">{s.reasons[0]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sell signals */}
            {sells.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-bear flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Señales de venta
                </div>
                {sells.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded font-semibold bg-bear/20 text-bear">
                      {s.symbol.replace("USDT", "")}
                    </span>
                    <span className="text-muted-foreground truncate">{s.reasons[0]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Risks */}
            {insight.risks.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-warn flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Riesgos
                </div>
                {insight.risks.slice(0, 2).map((r, i) => (
                  <div key={i} className="text-xs text-muted-foreground">{r.message}</div>
                ))}
              </div>
            )}

            {/* Tips */}
            <div className="pt-2 border-t border-hairline">
              <div className="text-[10px] uppercase tracking-wider text-primary-glow flex items-center gap-1 mb-1">
                <Lightbulb className="h-3 w-3" /> Consejo
              </div>
              <div className="text-xs text-muted-foreground">{insight.tips[0]}</div>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
};
