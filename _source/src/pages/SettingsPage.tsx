import { Panel } from "@/components/Panel";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnifiedAssets } from "@/lib/useUnifiedAssets";
import { AssetIcon } from "@/components/AssetIcon";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const SettingsPage = () => {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const watchlist = useAppStore((s) => s.watchlist);
  const toggleWatch = useAppStore((s) => s.toggleWatch);
  const resetAll = useAppStore((s) => s.resetAll);
  const { allAssets } = useUnifiedAssets("all");

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ajustes</h1>
        <p className="text-sm text-muted-foreground">Personaliza el terminal · guardado localmente</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Pantalla" className="col-span-12 lg:col-span-6">
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Color de acento</Label>
              <Select value={settings.accent} onValueChange={(v: any) => updateSettings({ accent: v })}>
                <SelectTrigger className="h-9 mt-1 bg-surface-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="violet">Violeta (predeterminado)</SelectItem>
                  <SelectItem value="emerald">Esmeralda</SelectItem>
                  <SelectItem value="amber">Ámbar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Zona horaria</Label>
              <Input value={settings.timezone} onChange={(e) => updateSettings({ timezone: e.target.value })} className="h-9 mt-1 bg-surface-2" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Intervalo de refresco (s)</Label>
              <Input type="number" value={settings.refreshSeconds} onChange={(e) => updateSettings({ refreshSeconds: +e.target.value })} className="h-9 mt-1 bg-surface-2" />
            </div>
          </div>
        </Panel>

        <Panel title="Riesgo por defecto" className="col-span-12 lg:col-span-6">
          <div className="p-4 space-y-4">
            <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Riesgo máx. por operación (%)</Label><Input type="number" step="0.1" value={settings.maxRiskPerTrade} onChange={(e) => updateSettings({ maxRiskPerTrade: +e.target.value })} className="h-9 mt-1 bg-surface-2" /></div>
            <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">R:R preferido</Label><Input type="number" step="0.1" value={settings.preferredRR} onChange={(e) => updateSettings({ preferredRR: +e.target.value })} className="h-9 mt-1 bg-surface-2" /></div>
            <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Máx. posiciones correlacionadas</Label><Input type="number" value={settings.maxCorrelated} onChange={(e) => updateSettings({ maxCorrelated: +e.target.value })} className="h-9 mt-1 bg-surface-2" /></div>
          </div>
        </Panel>

        <Panel title="Gestor de Watchlist" className="col-span-12">
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[400px] overflow-auto">
            {allAssets.map((a) => {
              const fetchSymbol = a.binanceSymbol || `${a.symbol}USDT`;
              const on = watchlist.includes(fetchSymbol);
              return (
                <button
                  key={fetchSymbol}
                  onClick={() => toggleWatch(fetchSymbol)}
                  className={cn(
                    "rounded-lg p-3 flex items-center gap-2 border transition",
                    on ? "border-primary/50 bg-primary/10 shadow-violet" : "border-hairline bg-surface-2 hover:border-strong"
                  )}
                >
                  <AssetIcon symbol={fetchSymbol} size={20} />
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-semibold">{a.symbol}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{a.name}</div>
                  </div>
                  {on && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Datos" className="col-span-12">
          <div className="p-4 flex items-center gap-3">
            <Button variant="outline" onClick={() => {
              const data = JSON.stringify(useAppStore.getState(), null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "cipherdesk-export.json"; a.click();
              URL.revokeObjectURL(url);
            }}>Exportar datos</Button>
            <Button variant="destructive" onClick={() => { if (confirm("¿Restablecer todas las watchlists, alertas y posiciones?")) resetAll(); }}>Restablecer todo</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default SettingsPage;
