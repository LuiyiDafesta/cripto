import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  title: string;
  description: string;
  className?: string;
}

/**
 * Universal help tooltip — ℹ️ icon that shows a glassmorphism popup
 * explaining what a section does in plain language.
 */
export const InfoTooltip = ({ title, description, className }: InfoTooltipProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className={cn("relative inline-flex", className)} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary-glow transition-colors"
        aria-label={`Ayuda: ${title}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute z-50 top-7 left-0 w-72 sm:w-80 animate-fade-in-up">
          <div className="glass rounded-xl p-4 shadow-2xl border border-primary/20 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
