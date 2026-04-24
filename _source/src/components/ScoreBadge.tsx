import { cn } from "@/lib/utils";
import { scoreBg, scoreColor } from "@/lib/format";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showBar?: boolean;
  className?: string;
}

export const ScoreBadge = ({ score, size = "md", showBar = false, className }: ScoreBadgeProps) => {
  const sz = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-lg px-3 py-1.5" : "text-sm px-2.5 py-1";
  const ringGlow = score >= 80 ? "ring-1 ring-primary/40 shadow-violet" : "";
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-md font-mono font-semibold bg-surface-2 border border-hairline",
          scoreColor(score),
          ringGlow,
          sz
        )}
      >
        {score}
      </div>
      {showBar && (
        <div className="h-1.5 w-20 rounded-full bg-surface-3 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", scoreBg(score))}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
};
