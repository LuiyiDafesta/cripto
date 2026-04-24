import { useState, useMemo } from "react";
import { Panel } from "@/components/Panel";
import { AssetIcon } from "@/components/AssetIcon";
import { ChangeChip } from "@/components/ChangeChip";
import { useCMCListings, useCMCGlobalMetrics, cmcToUnified, type UnifiedAsset } from "@/lib/coinmarketcap";
import { use24hTickers } from "@/lib/api";
import { compactUsd, fmtPct, fmtPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Search, Globe, TrendingUp, ArrowUpDown, Star, ExternalLink } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

const TABS = [
  { label: "Top 100", value: "all" },
  { label: "Ganadores", value: "gainers" },
  { label: "Perdedores", value: "losers" },
  { label: "Tendencia", value: "trending" },
  { label: "Solo Binance", value: "binance" },
];

export const MarketsPage = () => {
  const navigate = useNavigate();
  const { data: cmcData, isLoading } = useCMCListings(100);
  const { data: globalMetrics } = useCMCGlobalMetrics();
  const { data: tickers } = use24hTickers();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sortCol, setSortCol] = useState<"rank" | "price" | "24h" | "7d" | "mcap" | "vol">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Build set of Binance-available symbols
  const binanceSymbols = useMemo(() => {
    const s = new Set<string>();
    tickers?.forEach(t => s.add(t.symbol));
    return s;
  }, [tickers]);

  // Convert to unified format
  const assets = useMemo<UnifiedAsset[]>(() => {
    if (!cmcData) return [];
    return cmcToUnified(cmcData, binanceSymbols);
  }, [cmcData, binanceSymbols]);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = [...assets];

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    }

    // Tab filter
    switch (tab) {
      case "gainers":
        list = list.filter(a => a.change24h > 0).sort((a, b) => b.change24h - a.change24h);
        break;
      case "losers":
        list = list.filter(a => a.change24h < 0).sort((a, b) => a.change24h - b.change24h);
        break;
      case "trending":
        list = list.sort((a, b) => Math.abs(b.change1h) - Math.abs(a.change1h));
        break;
      case "binance":
        list = list.filter(a => a.onBinance);
        break;
    }

    // Column sort (only for "all" tab)
    if (tab === "all") {
      list.sort((a, b) => {
        let diff = 0;
        switch (sortCol) {
          case "rank": diff = a.cmcRank - b.cmcRank; break;
          case "price": diff = a.price - b.price; break;
          case "24h": diff = a.change24h - b.change24h; break;
          case "7d": diff = a.change7d - b.change7d; break;
          case "mcap": diff = a.marketCap - b.marketCap; break;
          case "vol": diff = a.volume24h - b.volume24h; break;
        }
        return sortDir === "asc" ? diff : -diff;
      });
    }

    return list;
  }, [assets, search, tab, sortCol, sortDir]);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir(col === "rank" ? "asc" : "desc");
    }
  };

  const gm = globalMetrics;
  const gmq = gm?.quote?.USD;

  const handleClick = (a: UnifiedAsset) => {
    if (a.onBinance && a.binanceSymbol) {
      navigate(`/app/asset/${a.binanceSymbol}`);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Mercados — Top 100</h1>
            <InfoTooltip
              title="Mercados"
              description="Vista general de las 100 criptomonedas más grandes por capitalización de mercado. Los datos vienen de CoinMarketCap (precios promediados de todos los exchanges). Las que tienen badge BIN también están disponibles en Binance con datos en tiempo real."
            />
          </div>
          <p className="text-sm text-muted-foreground">Datos de CoinMarketCap · Precios promediados de todos los exchanges</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar moneda…"
            className="pl-9 pr-4 py-2 rounded-lg bg-surface-2 border border-hairline text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Global metrics strip */}
      {gm && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <MetricCard label="Cap. Total" value={compactUsd(gmq?.total_market_cap)} change={gmq?.total_market_cap_yesterday_percentage_change} />
          <MetricCard label="Vol. 24h" value={compactUsd(gmq?.total_volume_24h)} change={gmq?.total_volume_24h_yesterday_percentage_change} />
          <MetricCard label="Dom. BTC" value={`${gm.btc_dominance.toFixed(1)}%`} />
          <MetricCard label="Dom. ETH" value={`${gm.eth_dominance.toFixed(1)}%`} />
          <MetricCard label="DeFi Vol." value={compactUsd(gm.defi_volume_24h)} />
          <MetricCard label="Stablecoin Vol." value={compactUsd(gm.stablecoin_volume_24h)} />
          <MetricCard label="Cryptos activas" value={gm.active_cryptocurrencies.toLocaleString()} />
        </div>
      )}

      {/* Tab filters */}
      <div className="flex items-center gap-1">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg transition",
              tab === t.value ? "bg-primary text-primary-foreground" : "bg-surface-2 hover:bg-surface-3"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                <SortHeader label="#" col="rank" current={sortCol} dir={sortDir} onSort={handleSort} className="w-12 pl-4" />
                <th className="py-3 text-left pl-2">Moneda</th>
                <SortHeader label="Precio" col="price" current={sortCol} dir={sortDir} onSort={handleSort} className="text-right" />
                <SortHeader label="1h %" col="24h" current={sortCol} dir={sortDir} onSort={handleSort} className="text-right hidden md:table-cell" />
                <SortHeader label="24h %" col="24h" current={sortCol} dir={sortDir} onSort={handleSort} className="text-right" />
                <SortHeader label="7d %" col="7d" current={sortCol} dir={sortDir} onSort={handleSort} className="text-right hidden md:table-cell" />
                <SortHeader label="Cap. Mercado" col="mcap" current={sortCol} dir={sortDir} onSort={handleSort} className="text-right hidden lg:table-cell" />
                <SortHeader label="Volumen 24h" col="vol" current={sortCol} dir={sortDir} onSort={handleSort} className="text-right hidden lg:table-cell" />
                <th className="py-3 text-right pr-4 hidden xl:table-cell">Dominancia</th>
                <th className="py-3 text-center pr-4 w-16">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Cargando datos de CoinMarketCap…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
              ) : (
                filtered.map(a => (
                  <tr
                    key={a.cmcId}
                    onClick={() => handleClick(a)}
                    className={cn(
                      "border-b border-hairline/50 hover:bg-surface-2/40 transition",
                      a.onBinance ? "cursor-pointer" : "cursor-default opacity-80"
                    )}
                  >
                    <td className="py-2.5 pl-4 num text-muted-foreground">{a.cmcRank}</td>
                    <td className="py-2.5 pl-2">
                      <div className="flex items-center gap-2">
                        <AssetIcon symbol={`${a.symbol}USDT`} size={22} />
                        <div>
                          <div className="font-semibold">{a.symbol}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{a.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right num font-medium">${fmtPrice(a.price)}</td>
                    <td className="py-2.5 text-right hidden md:table-cell"><ChangeChip value={a.change1h} /></td>
                    <td className="py-2.5 text-right"><ChangeChip value={a.change24h} /></td>
                    <td className="py-2.5 text-right hidden md:table-cell"><ChangeChip value={a.change7d} /></td>
                    <td className="py-2.5 text-right num hidden lg:table-cell">{compactUsd(a.marketCap)}</td>
                    <td className="py-2.5 text-right num hidden lg:table-cell">{compactUsd(a.volume24h)}</td>
                    <td className="py-2.5 text-right num hidden xl:table-cell text-muted-foreground">{a.dominance.toFixed(2)}%</td>
                    <td className="py-2.5 text-center pr-4">
                      <div className="flex items-center justify-center gap-1">
                        {a.onBinance && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-bull/10 text-bull font-medium">BIN</span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-glow font-medium">CMC</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

const MetricCard = ({ label, value, change }: { label: string; value: string; change?: number }) => (
  <div className="glass rounded-lg px-4 py-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="num text-base font-semibold mt-1">{value}</div>
    {change != null && <ChangeChip value={change} className="mt-1" />}
  </div>
);

const SortHeader = ({
  label, col, current, dir, onSort, className = "",
}: {
  label: string; col: string; current: string; dir: string;
  onSort: (c: any) => void; className?: string;
}) => (
  <th
    className={cn("py-3 cursor-pointer select-none hover:text-foreground transition", className)}
    onClick={() => onSort(col)}
  >
    <span className="inline-flex items-center gap-0.5">
      {label}
      {current === col && <ArrowUpDown className="h-2.5 w-2.5" />}
    </span>
  </th>
);

export default MarketsPage;
