import { use24hTickers, useFearGreed, useGlobalMacro } from "@/lib/api";
import { compactUsd, fmtPct, fmtPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AssetIcon } from "./AssetIcon";

const TICKER_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "AVAXUSDT", "LINKUSDT"];

const FngBadge = ({ value }: { value?: number }) => {
  if (value == null) return null;
  const color =
    value < 25 ? "text-bear" : value < 45 ? "text-warn" : value < 60 ? "text-muted-foreground" : value < 75 ? "text-bull" : "text-primary-glow";
  const label = value < 25 ? "Miedo extremo" : value < 45 ? "Miedo" : value < 55 ? "Neutral" : value < 75 ? "Codicia" : "Codicia extrema";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">F&G</span>
      <span className={cn("num text-sm font-semibold", color)}>{value}</span>
      <span className="text-[10px] text-muted-foreground hidden md:inline">{label}</span>
    </div>
  );
};

export const TopTicker = () => {
  const { data: tickers } = use24hTickers();
  const { data: macro } = useGlobalMacro();
  const { data: fng } = useFearGreed();

  const tickerMap: Record<string, { price: number; change: number }> = {};
  tickers?.forEach((t) => (tickerMap[t.symbol] = { price: t.lastPrice, change: t.priceChangePercent }));

  return (
    <div className="h-9 border-b border-hairline bg-background/70 backdrop-blur-md flex items-center text-xs overflow-hidden">
      {/* Macro chips */}
      <div className="flex items-center gap-5 px-4 shrink-0 border-r border-hairline h-full">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">MCAP</span>
          <span className="num font-semibold">{compactUsd(macro?.totalMarketCap)}</span>
          <span className={cn("num text-xs", (macro?.marketCapChangePct24h ?? 0) >= 0 ? "text-bull" : "text-bear")}>
            {macro ? fmtPct(macro.marketCapChangePct24h, 2) : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">BTC.D</span>
          <span className="num font-semibold">{macro?.btcDominance.toFixed(2) ?? "—"}%</span>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">ETH.D</span>
          <span className="num font-semibold">{macro?.ethDominance.toFixed(2) ?? "—"}%</span>
        </div>
        <FngBadge value={fng?.[0]?.value} />
      </div>

      {/* Symbol scroller */}
      <div className="relative flex-1 overflow-hidden h-full">
        <div className="absolute inset-y-0 flex items-center gap-8 animate-ticker whitespace-nowrap pl-4">
          {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((sym, i) => {
            const t = tickerMap[sym];
            return (
              <div key={`${sym}-${i}`} className="flex items-center gap-2 shrink-0">
                <AssetIcon symbol={sym} size={16} />
                <span className="text-foreground/90 font-medium">{sym.replace("USDT", "")}</span>
                <span className="num">{t ? "$" + fmtPrice(t.price) : "—"}</span>
                <span className={cn("num text-xs", (t?.change ?? 0) >= 0 ? "text-bull" : "text-bear")}>
                  {t ? fmtPct(t.change, 2) : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
