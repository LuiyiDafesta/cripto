import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIContextPanelProps {
  title?: string;
  onAnalyze: () => Promise<string>;
  defaultText?: string;
  className?: string;
}

export const AIContextPanel = ({
  title = "Análisis Contextual de IA",
  onAnalyze,
  defaultText = "Analizá los datos actuales con Inteligencia Artificial para obtener un panorama detallado.",
  className,
}: AIContextPanelProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onAnalyze();
      setContent(res);
    } catch (e: any) {
      setError(e.message || "Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("glass rounded-xl border border-primary/20 overflow-hidden relative", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Bot className="w-32 h-32 text-primary" />
      </div>

      <div className="p-4 flex items-center justify-between border-b border-hairline/50 bg-primary/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {!content && !loading && (
          <Button size="sm" onClick={handleAnalyze} className="h-7 text-xs bg-primary/20 text-primary-glow hover:bg-primary/30 border border-primary/30">
            Generar Análisis
          </Button>
        )}
      </div>

      <div className="p-4 relative z-10 text-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-muted-foreground animate-pulse">
            <Bot className="w-8 h-8 text-primary/50 animate-bounce" />
            <span className="text-xs">Procesando contexto de mercado...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-warn bg-warn/10 p-3 rounded-lg border border-warn/20">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-xs">{error}</span>
            <Button size="sm" variant="ghost" onClick={handleAnalyze} className="h-6 px-2 text-[10px] ml-auto">Reintentar</Button>
          </div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground">
            {content.split("\n\n").map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">{defaultText}</p>
        )}
      </div>
    </div>
  );
};
