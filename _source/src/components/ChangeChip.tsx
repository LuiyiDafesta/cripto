import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/lib/format";

interface ChangeChipProps {
  value: number | undefined | null;
  digits?: number;
  className?: string;
  withFlash?: boolean;
}

export const ChangeChip = ({ value, digits = 2, className, withFlash }: ChangeChipProps) => {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [prev, setPrev] = useState<number | null>(value ?? null);
  useEffect(() => {
    if (!withFlash || value == null) return;
    if (prev != null && value !== prev) {
      setFlash(value > prev ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 700);
      setPrev(value);
      return () => clearTimeout(t);
    }
    setPrev(value);
  }, [value, withFlash, prev]);

  if (value == null) return <span className={cn("num text-muted-foreground", className)}>—</span>;
  const positive = value > 0;
  return (
    <span
      className={cn(
        "num inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-colors",
        positive ? "text-bull bg-bull/10" : value < 0 ? "text-bear bg-bear/10" : "text-muted-foreground",
        flash === "up" && "animate-flash-up",
        flash === "down" && "animate-flash-down",
        className
      )}
    >
      {fmtPct(value, digits)}
    </span>
  );
};
