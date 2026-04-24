import { Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";

export const TopBar = () => {
  const navigate = useNavigate();
  const setAuthed = useAppStore((s) => s.setAuthed);
  const watchlist = useAppStore((s) => s.watchlist);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="h-14 border-b border-hairline bg-background/60 backdrop-blur-md flex items-center justify-between px-5 gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-wide">
          <span className="text-gradient-violet">CipherDesk</span>
          <span className="text-muted-foreground/60 ml-2 text-xs uppercase tracking-[0.2em]">Terminal</span>
        </h1>
      </div>

      <button
        onClick={() => setPaletteOpen(true)}
        className="flex-1 max-w-md mx-auto flex items-center gap-2 h-9 px-3 rounded-md bg-surface-2 border border-hairline hover:border-strong text-muted-foreground text-sm transition"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar activos, ejecutar comando…</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 h-5 rounded bg-background/60 border border-hairline text-[10px] num">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="num text-foreground">{watchlist.length}</span>
          <span>en seguimiento</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAuthed(false);
            navigate("/login");
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
};
