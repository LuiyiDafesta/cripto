import { Panel } from "@/components/Panel";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useFearGreed } from "@/lib/api";
import { useRealNews } from "@/lib/news";
import { cn } from "@/lib/utils";
import { ExternalLink, RefreshCw } from "lucide-react";

const SENT_COLORS: Record<string, string> = {
  bullish: "text-bull bg-bull/10",
  bearish: "text-bear bg-bear/10",
  neutral: "text-muted-foreground bg-muted/10",
};

const SENT_LABELS: Record<string, string> = {
  bullish: "Alcista",
  bearish: "Bajista",
  neutral: "Neutral",
};

const IMPACT_LABELS: Record<string, string> = {
  high: "alto",
  med: "medio",
  low: "bajo",
};

export const NewsPage = () => {
  const { data: fng } = useFearGreed();
  const { data: news, isLoading, dataUpdatedAt } = useRealNews(40);
  const current = fng?.[0]?.value ?? 50;
  const trend30 = fng ?? [];

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Inteligencia de Noticias</h1>
            <InfoTooltip
              title="Noticias del Mercado"
              description="Feed en tiempo real de noticias cripto de CryptoCompare. Cada noticia tiene un análisis de sentimiento: Alcista (positiva para el precio), Bajista (negativa) o Neutral. El índice Fear & Greed mide el miedo o euforia general del mercado del 0 (pánico extremo) al 100 (codicia extrema)."
            />
          </div>
          <p className="text-sm text-muted-foreground">Feed real de CryptoCompare con análisis de sentimiento · régimen Fear & Greed</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          <span>Actualizado: {lastUpdate}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Feed en vivo" className="col-span-12 lg:col-span-8">
          <ul className="divide-y divide-hairline max-h-[700px] overflow-auto">
            {isLoading && !news && (
              <li className="p-6 text-center text-xs text-muted-foreground">Cargando noticias reales…</li>
            )}
            {news?.map((n) => (
              <li key={n.id} className="px-4 py-3 hover:bg-surface-2/30 transition group">
                <div className="flex items-start gap-3">
                  <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold shrink-0 mt-0.5", SENT_COLORS[n.sentiment])}>
                    {SENT_LABELS[n.sentiment]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium leading-snug hover:text-primary-glow transition flex items-start gap-1"
                    >
                      {n.title}
                      <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-50 transition" />
                    </a>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                      <span className="font-medium">{n.source}</span>
                      <span>·</span>
                      {n.relatedAssets.length > 0 && (
                        <>
                          <span className="font-semibold">{n.relatedAssets.map(a => a.replace("USDT", "")).join(", ")}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>hace {Math.max(1, Math.floor((Date.now() - n.publishedAt) / 60000))} min</span>
                      <span className={cn(
                        "ml-auto px-1.5 py-0.5 rounded uppercase tracking-wider text-[9px]",
                        n.impact === "high" ? "bg-warn/20 text-warn" : "bg-surface-3"
                      )}>
                        {IMPACT_LABELS[n.impact]}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {news?.length === 0 && (
              <li className="p-6 text-center text-xs text-muted-foreground">No se encontraron noticias recientes.</li>
            )}
          </ul>
        </Panel>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Panel title="Fear & Greed">
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" stroke="hsl(var(--surface-3))" strokeWidth="8" fill="none" />
                    <circle
                      cx="50" cy="50" r="42"
                      stroke={current < 25 ? "hsl(var(--bear))" : current < 50 ? "hsl(var(--warn))" : current < 75 ? "hsl(var(--bull))" : "hsl(var(--primary))"}
                      strokeWidth="8" fill="none"
                      strokeDasharray={`${(current / 100) * 264} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="num text-2xl font-bold">{current}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">{fng?.[0]?.classification ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">Índice · 24h</div>
                </div>
              </div>
              {/* 30d sparkline */}
              <div className="mt-4 flex items-end h-16 gap-0.5">
                {trend30.slice().reverse().map((d, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${d.value}%`, background: d.value < 25 ? "hsl(var(--bear))" : d.value < 50 ? "hsl(var(--warn))" : d.value < 75 ? "hsl(var(--bull))" : "hsl(var(--primary))" }} />
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Tendencia 30 días</div>
            </div>
          </Panel>

          <Panel title="Sentimiento agregado">
            <div className="p-4">
              {news && news.length > 0 ? (() => {
                const bullish = news.filter(n => n.sentiment === "bullish").length;
                const bearish = news.filter(n => n.sentiment === "bearish").length;
                const neutral = news.filter(n => n.sentiment === "neutral").length;
                const total = news.length;
                return (
                  <div className="space-y-3">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div className="bg-bull" style={{ width: `${(bullish / total) * 100}%` }} />
                      <div className="bg-muted-foreground/30" style={{ width: `${(neutral / total) * 100}%` }} />
                      <div className="bg-bear" style={{ width: `${(bearish / total) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-bull font-semibold">Alcista {bullish} ({((bullish / total) * 100).toFixed(0)}%)</span>
                      <span className="text-muted-foreground">Neutral {neutral}</span>
                      <span className="text-bear font-semibold">Bajista {bearish}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Basado en {total} noticias recientes · análisis de keywords
                    </div>
                  </div>
                );
              })() : (
                <div className="text-xs text-muted-foreground">Cargando sentimiento…</div>
              )}
            </div>
          </Panel>

          <Panel title="Tickers en tendencia">
            <ul className="p-4 space-y-2 text-xs">
              {news && (() => {
                const counts: Record<string, number> = {};
                news.forEach(n => {
                  n.relatedAssets.forEach(a => {
                    counts[a] = (counts[a] ?? 0) + 1;
                  });
                });
                return Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([sym, count], i) => (
                    <li key={sym} className="flex items-center justify-between">
                      <span><span className="num text-muted-foreground mr-2">{i + 1}.</span><span className="font-semibold">{sym.replace("USDT", "")}</span></span>
                      <span className="num text-muted-foreground">{count} menciones</span>
                    </li>
                  ));
              })()}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
