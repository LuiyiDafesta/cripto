import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useMemo, Component, type ReactNode } from "react";
import { Panel } from "@/components/Panel";
import { Candles } from "@/components/Candles";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ChangeChip } from "@/components/ChangeChip";
import { AssetIcon } from "@/components/AssetIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { use24hTickers, useFundingRates, useKlines, useLongShortRatio, useOpenInterest, useFearGreed, useGlobalMacro, useBinanceSymbols } from "@/lib/api";
import { computeSmartScore, atr, detectPatterns, assessTrade } from "@/lib/scoring";
import { generateAssetAnalysis, type AIBrief } from "@/lib/ai-copilot";
import { useRealNews } from "@/lib/news";
import { useCMCListings } from "@/lib/coinmarketcap";
import { useAppStore } from "@/lib/store";
import { compactUsd, fmtPct, fmtPrice, scoreColor } from "@/lib/format";
import { ArrowLeft, Star, AlertTriangle, CheckCircle2, XCircle, Bot, RefreshCw, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { getAsset, ASSETS } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { SourceBadge } from "@/components/SourceBadge";
import { InfoTooltip } from "@/components/InfoTooltip";

// ErrorBoundary to prevent blank pages from chart crashes
class ChartErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div className="flex items-center justify-center h-[460px] text-sm text-muted-foreground">Error al renderizar el gráfico. Recargá la página.</div>;
    }
    return this.props.children;
  }
}

const TIMEFRAMES = [
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
  { label: "1w", value: "1w" },
];

export const AssetDetail = () => {
  const { symbol = "BTCUSDT" } = useParams();
  const navigate = useNavigate();
  const asset = getAsset(symbol);
  const baseName = asset?.base ?? symbol.replace("USDT", "");
  const [tf, setTf] = useState("4h");
  const watchlist = useAppStore((s) => s.watchlist);
  const toggleWatch = useAppStore((s) => s.toggleWatch);
  const watched = watchlist.includes(symbol);

  // Dynamic Binance detection
  const { data: binanceSymbols } = useBinanceSymbols();
  const isBinance = useMemo(() => {
    if (asset) return true; // In our hardcoded list
    if (binanceSymbols) return binanceSymbols.has(symbol);
    return false;
  }, [asset, binanceSymbols, symbol]);

  // CMC data for this coin
  const { data: cmcData } = useCMCListings(100);
  const cmcCoin = useMemo(() => {
    if (!cmcData) return null;
    return cmcData.find(c => `${c.symbol}USDT` === symbol || c.symbol === baseName);
  }, [cmcData, symbol, baseName]);

  const { data: klines } = useKlines(symbol, tf, 200, isBinance);
  const { data: klines1d } = useKlines(symbol, "1d", 35, isBinance);
  const { data: btc1d } = useKlines("BTCUSDT", "1d", 35);
  const { data: tickers } = use24hTickers();
  const { data: funding } = useFundingRates();
  const { data: oi } = useOpenInterest(symbol, "1h");
  const { data: lsr } = useLongShortRatio(symbol, "1h");
  const { data: macro } = useGlobalMacro();
  const { data: fng } = useFearGreed();

  const ticker = tickers?.find((t) => t.symbol === symbol);
  const fundingRate = funding?.find((f) => f.symbol === symbol)?.lastFundingRate;

  // Price: prefer Binance ticker, fall back to CMC
  const cmcQuote = cmcCoin?.quote?.USD;
  const displayPrice = ticker?.lastPrice ?? cmcQuote?.price ?? 0;
  const displayChange = ticker?.priceChangePercent ?? cmcQuote?.percent_change_24h ?? 0;

  const breakdown = useMemo(() => {
    if (!klines || !klines1d || !btc1d) return null;
    return computeSmartScore({
      klines4h: klines,
      klines1d,
      btcKlines1d: btc1d,
      fundingRate,
      btcDominance: macro?.btcDominance,
      fearGreed: fng?.[0]?.value,
      isBtc: asset?.base === "BTC",
    });
  }, [klines, klines1d, btc1d, fundingRate, macro, fng, asset]);

  const patterns = useMemo(() => (klines ? detectPatterns(symbol, klines) : []), [klines, symbol]);

  const atrVal = useMemo(() => (klines ? atr(klines, 14) : 0), [klines]);
  const lastPrice = displayPrice;

  // AI analysis
  const [aiBrief, setAiBrief] = useState<AIBrief | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Filtered news for this asset
  const { data: allNews } = useRealNews(50);
  const assetNews = useMemo(() => {
    if (!allNews) return [];
    return allNews.filter(n => n.relatedAssets.includes(symbol) ||
      n.title.toLowerCase().includes((asset?.base ?? "").toLowerCase())
    ).slice(0, 8);
  }, [allNews, symbol, asset]);

  const handleAIAnalysis = async () => {
    if (!breakdown || !lastPrice) return;
    setAiLoading(true);
    try {
      const result = await generateAssetAnalysis({
        symbol, base: asset?.base ?? symbol.replace("USDT", ""),
        score: breakdown, price: lastPrice,
        change24h: ticker?.priceChangePercent ?? 0,
        fundingRate, patterns, atr: atrVal,
      });
      setAiBrief(result);
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  };

  // Trade plan: long bias if structure+momentum>120 else short
  const plan = useMemo(() => {
    if (!breakdown || !lastPrice || !atrVal) return null;
    const long = breakdown.structure + breakdown.momentum > 120;
    const side = long ? "long" : "short";
    const entry = lastPrice;
    const stop = long ? entry - atrVal * 1.5 : entry + atrVal * 1.5;
    const target = long ? entry + atrVal * 4 : entry - atrVal * 4;
    const r = assessTrade({ entry, stop, target, side, atrValue: atrVal, fundingRate });
    return { side, entry, stop, target, ...r };
  }, [breakdown, lastPrice, atrVal, fundingRate]);

  const radarBars = breakdown
    ? [
        { label: "Estructura", v: breakdown.structure },
        { label: "Momentum", v: breakdown.momentum },
        { label: "Volumen", v: breakdown.volume },
        { label: "Fuerza Rel.", v: breakdown.relStrength },
        { label: "Funding", v: breakdown.funding },
        { label: "OI", v: breakdown.oi },
        { label: "Macro", v: breakdown.macro },
        { label: "Sentimiento", v: breakdown.sentiment },
      ]
    : [];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div className="flex items-center gap-3">
          <AssetIcon symbol={symbol} size={36} />
          <div>
            <h1 className="text-xl font-semibold">
              {baseName} <span className="text-muted-foreground font-normal text-sm">/USDT</span>
            </h1>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              {asset?.name ?? baseName}
              {!isBinance && <SourceBadge source="cmc" size="xs" />}
              {isBinance && <SourceBadge source="both" size="xs" />}
            </div>
          </div>
        </div>
      <div className="flex items-baseline gap-3 ml-4">
          <span className="num text-2xl font-semibold">${fmtPrice(displayPrice)}</span>
          <ChangeChip value={displayChange} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {breakdown && <ScoreBadge score={breakdown.total} size="lg" showBar />}
          <Button variant={watched ? "default" : "outline"} size="sm" onClick={() => toggleWatch(symbol)}>
            <Star className={cn("h-4 w-4 mr-1", watched && "fill-current")} /> {watched ? "Siguiendo" : "Seguir"}
          </Button>
        </div>
      </div>

      {/* CMC-only info panel */}
      {!isBinance && cmcQuote && (
        <div className="glass rounded-xl p-4 border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <SourceBadge source="cmc" size="xs" />
            <span className="text-sm font-medium text-cyan-400">Datos de CoinMarketCap</span>
            <InfoTooltip title="Datos CMC" description="Esta moneda muestra datos de CoinMarketCap: precio promediado de todos los exchanges, capitalización, volumen y cambios porcentuales. Para gráficos de velas y análisis técnico avanzado, necesita estar en Binance." />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Stat label="Precio" value={`$${fmtPrice(cmcQuote.price)}`} />
            <Stat label="Cap. Mercado" value={compactUsd(cmcQuote.market_cap)} />
            <Stat label="Volumen 24h" value={compactUsd(cmcQuote.volume_24h)} />
            <Stat label="1h" value={`${cmcQuote.percent_change_1h >= 0 ? '+' : ''}${cmcQuote.percent_change_1h.toFixed(2)}%`} color={cmcQuote.percent_change_1h >= 0 ? "text-bull" : "text-bear"} />
            <Stat label="24h" value={`${cmcQuote.percent_change_24h >= 0 ? '+' : ''}${cmcQuote.percent_change_24h.toFixed(2)}%`} color={cmcQuote.percent_change_24h >= 0 ? "text-bull" : "text-bear"} />
            <Stat label="7d" value={`${cmcQuote.percent_change_7d >= 0 ? '+' : ''}${cmcQuote.percent_change_7d.toFixed(2)}%`} color={cmcQuote.percent_change_7d >= 0 ? "text-bull" : "text-bear"} />
            <Stat label="30d" value={`${cmcQuote.percent_change_30d >= 0 ? '+' : ''}${cmcQuote.percent_change_30d.toFixed(2)}%`} color={cmcQuote.percent_change_30d >= 0 ? "text-bull" : "text-bear"} />
            <Stat label="Ranking CMC" value={`#${cmcCoin?.cmc_rank ?? '—'}`} />
            <Stat label="Suministro Circ." value={cmcCoin?.circulating_supply ? compactUsd(cmcCoin.circulating_supply).replace('$', '') : '—'} />
            <Stat label="FDV" value={compactUsd(cmcQuote.fully_diluted_market_cap)} />
            <Stat label="Dominancia" value={`${cmcQuote.market_cap_dominance.toFixed(3)}%`} />
            <Stat label="Vol. Cambio 24h" value={`${cmcQuote.volume_change_24h >= 0 ? '+' : ''}${cmcQuote.volume_change_24h.toFixed(1)}%`} color={cmcQuote.volume_change_24h >= 0 ? "text-bull" : "text-bear"} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Chart */}
        <Panel
          className="col-span-12 lg:col-span-9"
          title="Precio · Volumen"
          right={
            <div className="flex gap-1">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTf(t.value)}
                  className={cn(
                    "px-2 py-1 text-xs rounded num",
                    tf === t.value ? "bg-primary/20 text-primary-glow" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="p-3">
            <ChartErrorBoundary>
              <Candles
                klines={klines ?? []}
                height={460}
                zones={patterns.slice(0, 4).map((p) => ({
                  from: p.level,
                  to: p.level,
                  color: p.direction === "bullish" ? "#2ECC71" : "#E74C5A",
                  label: p.type,
                }))}
              />
            </ChartErrorBoundary>
          </div>
        </Panel>

        {/* Score breakdown */}
        <Panel title="Desglose Smart Score" className="col-span-12 lg:col-span-3">
          <div className="p-4 space-y-2">
            {radarBars.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className={cn("num font-semibold", scoreColor(b.v))}>{b.v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", b.v >= 80 ? "bg-primary" : b.v >= 65 ? "bg-bull" : b.v >= 40 ? "bg-warn" : "bg-bear")}
                    style={{ width: `${b.v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Stats row */}
        <Panel title="Estadísticas 24h" className="col-span-6 lg:col-span-3">
          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Máx" value={"$" + fmtPrice(ticker?.highPrice)} />
            <Stat label="Mín" value={"$" + fmtPrice(ticker?.lowPrice)} />
            <Stat label="Volumen" value={compactUsd(ticker?.quoteVolume)} />
            <Stat label="ATR(14)" value={fmtPrice(atrVal)} />
          </div>
        </Panel>
        <Panel title="Funding y OI" className="col-span-6 lg:col-span-3">
          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Funding" value={fundingRate != null ? (fundingRate * 100).toFixed(4) + "%" : "—"} color={(fundingRate ?? 0) >= 0 ? "text-bull" : "text-bear"} />
            <Stat label="Próximo" value={funding?.find((f) => f.symbol === symbol) ? new Date(funding.find((f) => f.symbol === symbol)!.nextFundingTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} />
            <Stat label="OI USD" value={oi?.length ? compactUsd(oi[oi.length - 1].sumOpenInterestValue) : "—"} />
            <Stat label="Ratio L/S" value={lsr?.length ? lsr[lsr.length - 1].longShortRatio.toFixed(2) : "—"} />
          </div>
        </Panel>
        <Panel title="Patrones detectados" className="col-span-12 lg:col-span-6">
          <ul className="divide-y divide-hairline max-h-[180px] overflow-auto">
            {patterns.length === 0 && <li className="p-4 text-xs text-muted-foreground">No hay patrones en este timeframe.</li>}
            {patterns.map((p, i) => (
              <li key={i} className="px-4 py-2.5 flex items-center gap-3">
                <span className={cn("h-2 w-2 rounded-full", p.direction === "bullish" ? "bg-bull" : "bg-bear")} />
                <span className="text-xs font-semibold">{p.type}</span>
                <span className="text-xs text-muted-foreground flex-1">{p.description}</span>
                <span className="num text-xs">{p.confidence}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Tabs */}
        <Panel className="col-span-12">
          <Tabs defaultValue="plan">
            <TabsList className="m-3">
              <TabsTrigger value="plan">Plan de Trade</TabsTrigger>
              <TabsTrigger value="ai">Análisis IA</TabsTrigger>
              <TabsTrigger value="news">Noticias</TabsTrigger>
              <TabsTrigger value="corr">Correlaciones</TabsTrigger>
            </TabsList>
            <TabsContent value="plan" className="p-4 pt-0">
              {plan ? (
                <div className="grid md:grid-cols-4 gap-3">
                  <Stat label="Sesgo" value={plan.side === "long" ? "LARGO" : "CORTO"} color={plan.side === "long" ? "text-bull" : "text-bear"} />
                  <Stat label="Entrada" value={"$" + fmtPrice(plan.entry)} />
                  <Stat label="Stop" value={"$" + fmtPrice(plan.stop)} color="text-bear" />
                  <Stat label="Objetivo" value={"$" + fmtPrice(plan.target)} color="text-bull" />
                  <div className="md:col-span-4 flex items-center gap-3 pt-2 border-t border-hairline mt-2">
                    <VerdictPill verdict={plan.verdict} />
                    <span className="num text-sm">R:R {plan.rr.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">— {plan.reasons.concat(plan.warnings).join(" · ") || "Sin notas."}</span>
                  </div>
                </div>
              ) : <div className="text-xs text-muted-foreground">Calculando plan…</div>}
            </TabsContent>
            <TabsContent value="ai" className="p-4 pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bot className="h-4 w-4 text-primary-glow" />
                    Análisis inteligente de {baseName}
                  </div>
                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiLoading || (!breakdown && !cmcQuote)}
                    className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary-glow hover:bg-primary/20 transition flex items-center gap-1"
                  >
                    <RefreshCw className={cn("h-3 w-3", aiLoading && "animate-spin")} />
                    {aiLoading ? "Analizando…" : "Analizar con IA"}
                  </button>
                </div>
                {aiBrief ? (
                  <div className="text-sm leading-relaxed whitespace-pre-line">{aiBrief.content}</div>
                ) : (
                  <div className="text-xs text-muted-foreground">Presioná "Analizar con IA" para obtener un análisis detallado de {asset?.base ?? symbol} generado por inteligencia artificial.</div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="news" className="p-4 pt-0">
              {assetNews.length > 0 ? (
                <ul className="space-y-2">
                  {assetNews.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className={cn("mt-1 shrink-0 h-2 w-2 rounded-full", n.sentiment === "bullish" ? "bg-bull" : n.sentiment === "bearish" ? "bg-bear" : "bg-muted-foreground")} />
                      <div>
                        <a href={n.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary-glow transition">{n.title}</a>
                        <div className="text-muted-foreground mt-0.5">{n.source} · {new Date(n.publishedAt).toLocaleDateString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground">No hay noticias recientes para {asset?.base ?? symbol}. Consultá <Link to="/app/news" className="text-primary-glow hover:underline">el feed global</Link>.</div>
              )}
            </TabsContent>
            <TabsContent value="corr" className="p-4 pt-0">
              <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
                {ASSETS.slice(0, 20).map((a) => {
                  const tx = tickers?.find((x) => x.symbol === a.symbol);
                  const c = (tx?.priceChangePercent ?? 0) * (ticker?.priceChangePercent ?? 0) > 0 ? Math.min(0.95, Math.abs((tx?.priceChangePercent ?? 0) / 10)) : -Math.min(0.95, Math.abs((tx?.priceChangePercent ?? 0) / 10));
                  const bg = c >= 0 ? `hsl(152 75% 45% / ${Math.abs(c) * 0.6 + 0.1})` : `hsl(350 85% 55% / ${Math.abs(c) * 0.6 + 0.1})`;
                  return (
                    <div key={a.symbol} className="aspect-square rounded flex items-center justify-center text-[10px] num font-semibold" style={{ background: bg }}>
                      {a.base}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </Panel>
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={cn("num font-semibold mt-0.5", color)}>{value}</div>
  </div>
);

const VerdictPill = ({ verdict }: { verdict: string }) => {
  const map: Record<string, { c: string; icon: any }> = {
    A: { c: "text-bull bg-bull/15", icon: CheckCircle2 },
    B: { c: "text-secondary bg-secondary/15", icon: CheckCircle2 },
    C: { c: "text-warn bg-warn/15", icon: AlertTriangle },
    Reject: { c: "text-bear bg-bear/15", icon: XCircle },
  };
  const v = map[verdict] ?? map.C;
  const Icon = v.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold", v.c)}>
      <Icon className="h-3.5 w-3.5" /> Setup {verdict}
    </span>
  );
};

export default AssetDetail;
