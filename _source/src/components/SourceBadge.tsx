import { cn } from "@/lib/utils";

/**
 * Badge that shows the data source: BIN (Binance), CMC (CoinMarketCap), or both.
 */
export const SourceBadge = ({ source, size = "sm" }: { source: "binance" | "cmc" | "both"; size?: "sm" | "xs" }) => {
  const base = size === "xs" ? "text-[8px] px-1 py-px" : "text-[9px] px-1.5 py-0.5";

  if (source === "both") {
    return (
      <span className="inline-flex gap-0.5">
        <span className={cn(base, "rounded-l font-bold bg-amber-500/15 text-amber-400 tracking-wider")}>BIN</span>
        <span className={cn(base, "rounded-r font-bold bg-cyan-500/15 text-cyan-400 tracking-wider")}>CMC</span>
      </span>
    );
  }

  if (source === "binance") {
    return <span className={cn(base, "rounded font-bold bg-amber-500/15 text-amber-400 tracking-wider")}>BIN</span>;
  }

  return <span className={cn(base, "rounded font-bold bg-cyan-500/15 text-cyan-400 tracking-wider")}>CMC</span>;
};
