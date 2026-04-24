import { cn } from "@/lib/utils";
import { ASSETS, getAsset } from "@/lib/assets";

interface AssetIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

// Custom SVG-style colored chip with the ticker letter — avoids 3rd-party icon network deps.
const PALETTE: Record<string, string> = {
  BTC: "from-amber-400 to-orange-500",
  ETH: "from-indigo-400 to-violet-500",
  SOL: "from-fuchsia-400 to-purple-600",
  BNB: "from-yellow-300 to-amber-500",
  XRP: "from-slate-300 to-slate-500",
  ADA: "from-blue-400 to-blue-600",
  DOGE: "from-yellow-200 to-amber-400",
  AVAX: "from-rose-400 to-red-500",
  LINK: "from-sky-400 to-blue-600",
  TON: "from-cyan-300 to-blue-500",
  DOT: "from-pink-400 to-rose-600",
  MATIC: "from-purple-400 to-violet-600",
  LTC: "from-zinc-300 to-zinc-500",
  BCH: "from-emerald-400 to-green-600",
  NEAR: "from-emerald-300 to-teal-500",
  ATOM: "from-violet-400 to-indigo-600",
  APT: "from-slate-200 to-slate-400",
  ARB: "from-blue-300 to-cyan-500",
  OP: "from-red-400 to-rose-600",
  INJ: "from-cyan-400 to-blue-600",
};

export const AssetIcon = ({ symbol, size = 24, className }: AssetIconProps) => {
  const a = getAsset(symbol);
  const base = a?.base ?? symbol.replace("USDT", "");
  const grad = PALETTE[base] ?? "from-violet-400 to-indigo-600";
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-background shadow-inner",
        grad,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={base}
    >
      {base.slice(0, 3)}
    </div>
  );
};

export const KNOWN_BASES = ASSETS.map((a) => a.base);
