import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: string | ReactNode;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  glow?: "violet" | "emerald" | "none";
}

export const Panel = ({ title, subtitle, right, children, className, bodyClassName, glow = "none" }: PanelProps) => {
  return (
    <section
      className={cn(
        "glass rounded-xl overflow-hidden flex flex-col",
        glow === "violet" && "shadow-violet",
        glow === "emerald" && "shadow-emerald",
        className
      )}
    >
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-hairline">
          <div className="min-w-0">
            {typeof title === "string" ? (
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      <div className={cn("flex-1 min-h-0", bodyClassName)}>{children}</div>
    </section>
  );
};
