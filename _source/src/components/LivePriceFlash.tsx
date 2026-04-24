import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Displays a price with a brief green/red flash when it changes.
 */
export const LivePriceFlash = ({
  value,
  formatter,
  className,
}: {
  value: number;
  formatter: (v: number) => string;
  className?: string;
}) => {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? "up" : "down");
    prev.current = value;
    const timer = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <span
      className={cn(
        "transition-colors duration-300",
        flash === "up" && "text-bull",
        flash === "down" && "text-bear",
        !flash && className
      )}
    >
      {formatter(value)}
    </span>
  );
};
