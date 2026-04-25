import { Search, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CommandPalette } from "./CommandPalette";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

export const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const market = location.pathname.split("/")[2] || "crypto";
  
  const setAuthed = useAppStore((s) => s.setAuthed);
  const resetAll = useAppStore((s) => s.resetAll);
  const watchlist = useAppStore((s) => s.watchlist);
  const { signOut } = useAuth();
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
    <header className="h-14 border-b border-hairline bg-background/60 backdrop-blur-md flex items-center justify-between px-4 lg:px-5 gap-3 lg:gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[68px] border-r-0 bg-sidebar">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        <h1 className="text-sm font-semibold tracking-wide hidden sm:flex items-center">
          <span className="text-gradient-violet">CipherDesk</span>
        </h1>

        {/* Market Switcher */}
        <Select 
          value={market} 
          onValueChange={(val) => {
            const newPath = location.pathname.replace(`/app/${market}`, `/app/${val}`);
            navigate(newPath);
          }}
        >
          <SelectTrigger className="h-8 text-xs font-semibold w-[130px] lg:w-[150px] bg-surface-2 border-hairline shadow-none">
            <SelectValue placeholder="Seleccionar Mercado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crypto">🪙 Mercado Cripto</SelectItem>
            <SelectItem value="argentina">🇦🇷 Mercado Argentino</SelectItem>
            <SelectItem value="us">🇺🇸 Mercado US</SelectItem>
          </SelectContent>
        </Select>
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
          onClick={async () => {
            try {
              await signOut();
            } catch (err) {
              console.error("Error signing out:", err);
            }
            resetAll();
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
