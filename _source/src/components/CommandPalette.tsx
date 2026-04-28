import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUnifiedAssets } from "@/lib/useUnifiedAssets";
import { LayoutDashboard, Radar, Trophy, Waves, ShieldCheck, Newspaper, Bell, Settings } from "lucide-react";

interface Props { open: boolean; onClose: () => void; }

export const CommandPalette = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const [, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const go = (path: string) => { navigate(path); onClose(); };

  const { allAssets } = useUnifiedAssets("all");

  return (
    <CommandDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <CommandInput placeholder="Buscar activos o ir a…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Activos">
          {allAssets.map((a) => (
            <CommandItem key={a.symbol} value={`${a.symbol} ${a.name}`} onSelect={() => go(`/app/crypto/asset/${a.binanceSymbol || `${a.symbol}USDT`}`)}>
              <span className="font-semibold mr-2">{a.symbol}</span>
              <span className="text-muted-foreground">{a.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Páginas">
          <CommandItem onSelect={() => go("/app")}><LayoutDashboard className="h-4 w-4 mr-2" />Panel</CommandItem>
          <CommandItem onSelect={() => go("/app/scanner")}><Radar className="h-4 w-4 mr-2" />Scanner</CommandItem>
          <CommandItem onSelect={() => go("/app/score")}><Trophy className="h-4 w-4 mr-2" />Smart Score</CommandItem>
          <CommandItem onSelect={() => go("/app/whales")}><Waves className="h-4 w-4 mr-2" />Ballenas</CommandItem>
          <CommandItem onSelect={() => go("/app/risk")}><ShieldCheck className="h-4 w-4 mr-2" />Riesgo</CommandItem>
          <CommandItem onSelect={() => go("/app/news")}><Newspaper className="h-4 w-4 mr-2" />Noticias</CommandItem>
          <CommandItem onSelect={() => go("/app/alerts")}><Bell className="h-4 w-4 mr-2" />Alertas</CommandItem>
          <CommandItem onSelect={() => go("/app/settings")}><Settings className="h-4 w-4 mr-2" />Ajustes</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
