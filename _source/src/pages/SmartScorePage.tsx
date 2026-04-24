import { useState, useMemo } from "react";
import { Panel } from "@/components/Panel";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ChangeChip } from "@/components/ChangeChip";
import { AssetIcon } from "@/components/AssetIcon";
import { Sparkline } from "@/components/Sparkline";
import { InfoTooltip } from "@/components/InfoTooltip";
import { SourceBadge } from "@/components/SourceBadge";
import { LivePriceFlash } from "@/components/LivePriceFlash";
import { useAllSmartScores } from "@/lib/useScores";
import { useUnifiedAssets, type DataSource, type EnrichedAsset } from "@/lib/useUnifiedAssets";
import { fmtPrice, scoreColor, compactUsd } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Clock } from "lucide-react";

type SortKey = "score" | "change24h" | "change7d" | "marketCap" | "volume" | "rank";

export const SmartScorePage = () => {
  const navigate = useNavigate();
  const { rows: binanceRows } = useAllSmartScores();
  const { assets: cmcAssets, lastUpdate } = useUnifiedAssets("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [asc, setAsc] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<DataSource>("all");

  // Merge Binance Smart Scores with CMC unified assets
  const merged = useMemo(() => {
    const binanceScoreMap = new Map(binanceRows.map(r => [r.symbol.replace("USDT", ""), r]));

    const all: Array<{
      symbol: string;
      base: string;
      name: string;
      score: number;
      source: "binance" | "cmc" | "both";
      price: number;
      change24h: number;
      change7d: number;
      marketCap: number;
      volume24h: number;
      rank: number;
      klines4h?: any[];
      // Sub-scores (Binance only)
      structure?: number;
      momentum?: number;
      volumeScore?: number;
      relStrength?: number;
      funding?: number;
      fundingRate?: number;
    }> = [];

    if (cmcAssets.length > 0) {
      cmcAssets.forEach(asset => {
        const binRow = binanceScoreMap.get(asset.symbol);
        if (binRow) {
          // Has Binance data — use full smart score
          all.push({
            symbol: `${asset.symbol}USDT`,
            base: asset.symbol,
            name: asset.name,
            score: binRow.total,
            source: "both",
            price: binRow.price ?? asset.price,
            change24h: asset.change24h,
            change7d: asset.change7d,
            marketCap: asset.marketCap,
            volume24h: asset.volume24h,
            rank: asset.cmcRank,
            klines4h: binRow.klines4h,
            structure: binRow.structure,
            momentum: binRow.momentum,
            volumeScore: binRow.volume,
            relStrength: binRow.relStrength,
            funding: binRow.funding,
            fundingRate: binRow.fundingRate,
          });
          binanceScoreMap.delete(asset.symbol);
        } else {
          // CMC only — simplified score
          all.push({
            symbol: `${asset.symbol}USDT`,
            base: asset.symbol,
            name: asset.name,
            score: (asset as EnrichedAsset).cmcSmartScore,
            source: "cmc",
            price: asset.price,
            change24h: asset.change24h,
            change7d: asset.change7d,
            marketCap: asset.marketCap,
            volume24h: asset.volume24h,
            rank: asset.cmcRank,
          });
        }
      });
    } else {
      // CMC not loaded — show Binance only
      binanceRows.forEach(r => {
        all.push({
          symbol: r.symbol,
          base: r.base ?? r.symbol.replace("USDT", ""),
          name: r.name ?? r.symbol.replace("USDT", ""),
          score: r.total,
          source: "binance",
          price: r.price ?? 0,
          change24h: r.change24h ?? 0,
          change7d: r.change7d ?? 0,
          marketCap: 0,
          volume24h: 0,
          rank: 0,
          klines4h: r.klines4h,
          structure: r.structure,
          momentum: r.momentum,
          volumeScore: r.volume,
          relStrength: r.relStrength,
          funding: r.funding,
          fundingRate: r.fundingRate,
        });
      });
    }

    return all;
  }, [cmcAssets, binanceRows]);

  // Filter by source
  const filtered = useMemo(() => {
    if (sourceFilter === "all") return merged;
    if (sourceFilter === "binance") return merged.filter(a => a.onBinance);
    return merged.filter(a => !a.onBinance);
  }, [merged, sourceFilter]);

  // Sort
  const sorted = useMemo(() => {
    const out = [...filtered];
    out.sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case "score": av = a.score; bv = b.score; break;
        case "change24h": av = a.change24h; bv = b.change24h; break;
        case "change7d": av = a.change7d; bv = b.change7d; break;
        case "marketCap": av = a.marketCap; bv = b.marketCap; break;
        case "volume": av = a.volume24h; bv = b.volume24h; break;
        case "rank": av = a.rank; bv = b.rank; break;
        default: av = a.score; bv = b.score;
      }
      return asc ? av - bv : bv - av;
    });
    return out;
  }, [filtered, sortKey, asc]);

  const setSort = (k: SortKey) => { if (k === sortKey) setAsc(!asc); else { setSortKey(k); setAsc(false); } };

  const Th = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={cn("px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium cursor-pointer select-none hover:text-foreground", right && "text-right")} onClick={() => setSort(k)}>
      <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="h-3 w-3 opacity-40" /></span>
    </th>
  );

  const sourceButtons: { key: DataSource; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "binance", label: "Binance" },
    { key: "cmc", label: "CMC" },
  ];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Ranking Smart Score</h1>
          <InfoTooltip
            title="¿Qué es el Smart Score?"
            description="Puntaje de 0 a 100 que mide la salud técnica de una moneda. Para monedas de Binance analiza tendencia, volumen, fuerza relativa vs Bitcoin y funding de futuros. Para monedas de CMC usa un cálculo simplificado basado en ranking, volumen y momentum. Más alto = mejor momento técnico."
          />
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              CMC: {new Date(lastUpdate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <div className="flex items-center gap-1">
            {sourceButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => setSourceFilter(btn.key)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition",
                  sourceFilter === btn.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 hover:bg-surface-3 text-muted-foreground"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {sorted.length} activos · Score compuesto sobre universo CMC + Binance. Click en una fila para ver detalle.
      </p>
      <Panel>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/50 border-b border-hairline">
              <tr>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-left w-8">#</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-left">Activo</th>
                <Th k="score" label="Score" />
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right">Precio</th>
                <Th k="change24h" label="24h" right />
                <Th k="change7d" label="7d" right />
                <Th k="marketCap" label="Cap. Mercado" right />
                <Th k="volume" label="Vol 24h" right />
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-center">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr
                  key={r.symbol}
                  onClick={() => r.source !== "cmc" ? navigate(`/app/asset/${r.symbol}`) : undefined}
                  className={cn(
                    "border-b border-hairline hover:bg-surface-2/40 transition",
                    r.source !== "cmc" && "cursor-pointer",
                    i < 3 && "bg-primary/5"
                  )}
                >
                  <td className="px-3 py-2.5 num text-[10px] text-muted-foreground">{r.rank || i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <AssetIcon symbol={r.symbol} size={22} />
                      <div>
                        <div className="text-xs font-semibold">{r.base}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{r.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><ScoreBadge score={r.score} showBar /></td>
                  <td className="px-3 py-2.5 num text-right text-xs">
                    <LivePriceFlash value={r.price} formatter={(v) => `$${fmtPrice(v)}`} className="text-foreground" />
                  </td>
                  <td className="px-3 py-2.5 text-right"><ChangeChip value={r.change24h} /></td>
                  <td className="px-3 py-2.5 text-right"><ChangeChip value={r.change7d} /></td>
                  <td className="px-3 py-2.5 num text-right text-xs text-muted-foreground">{r.marketCap > 0 ? compactUsd(r.marketCap) : "—"}</td>
                  <td className="px-3 py-2.5 num text-right text-xs text-muted-foreground">{r.volume24h > 0 ? compactUsd(r.volume24h) : "—"}</td>
                  <td className="px-3 py-2.5 text-center"><SourceBadge source={r.source} size="xs" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default SmartScorePage;
