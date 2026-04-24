import { useState, useMemo } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTooltip } from "@/components/InfoTooltip";
import { SourceBadge } from "@/components/SourceBadge";
import { useAppStore, AlertRule } from "@/lib/store";
import { useUnifiedAssets } from "@/lib/useUnifiedAssets";
import { AssetIcon } from "@/components/AssetIcon";
import { timeAgo } from "@/lib/format";
import { Trash2, Bell } from "lucide-react";

const TYPE_LABELS: Record<AlertRule["type"], string> = {
  price_above: "Precio por encima",
  price_below: "Precio por debajo",
  score_above: "Smart Score ≥",
  funding_above: "Funding ≥",
  vol_spike: "Pico de volumen ×",
  breakout: "Breakout confirmado",
};

const TYPE_HELP: Record<AlertRule["type"], string> = {
  price_above: "Se dispara cuando el precio sube por encima del umbral que definas.",
  price_below: "Se dispara cuando el precio baja por debajo del umbral.",
  score_above: "Se dispara cuando el Smart Score de la moneda supera el umbral.",
  funding_above: "Se dispara cuando el funding rate (costo de futuros) supera el umbral.",
  vol_spike: "Se dispara cuando el volumen sube X veces respecto al promedio.",
  breakout: "Se dispara cuando el precio rompe un rango con volumen alto.",
};

export const AlertsPage = () => {
  const alerts = useAppStore((s) => s.alerts);
  const history = useAppStore((s) => s.triggeredHistory);
  const addAlert = useAppStore((s) => s.addAlert);
  const toggleAlert = useAppStore((s) => s.toggleAlert);
  const deleteAlert = useAppStore((s) => s.deleteAlert);
  const { allAssets } = useUnifiedAssets("all");

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [type, setType] = useState<AlertRule["type"]>("price_above");
  const [threshold, setThreshold] = useState(70000);

  // Build asset options: Binance + CMC Top 50
  const assetOptions = useMemo(() => {
    const opts = allAssets
      .filter(a => a.source === "both")
      .map(a => ({ value: a.binanceSymbol || `${a.symbol}USDT`, label: a.symbol, source: "binance" as const }));
    
    // Add top CMC-only coins
    allAssets
      .filter(a => a.source === "cmc")
      .slice(0, 50)
      .forEach(a => {
        opts.push({ value: `${a.symbol}USDT`, label: a.symbol, source: "cmc" as const });
      });

    return opts;
  }, [allAssets]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Centro de Alertas</h1>
        <InfoTooltip
          title="¿Cómo funcionan las alertas?"
          description="Creá reglas automáticas para cualquier moneda. Ejemplo: 'avisame cuando BTC baje de $70,000'. Cuando se cumple la condición, la alerta se dispara y aparece en el historial y en el dashboard. Podés crear alertas para monedas de Binance y CoinMarketCap."
        />
      </div>
      <p className="text-sm text-muted-foreground">Notificaciones in-app basadas en reglas · sin ruido · Binance + CMC</p>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Crear alerta" className="col-span-12 lg:col-span-4">
          <div className="p-4 space-y-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Activo</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="h-9 mt-1 bg-surface-2"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {assetOptions.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      <span className="flex items-center gap-2">
                        {a.label}
                        <SourceBadge source={a.source === "cmc" ? "cmc" : "binance"} size="xs" />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Disparador</Label>
                <InfoTooltip title="Tipos de disparo" description={TYPE_HELP[type]} />
              </div>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="h-9 mt-1 bg-surface-2"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Umbral</Label>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="h-9 mt-1 bg-surface-2" />
            </div>
            <Button onClick={() => addAlert({ symbol, type, threshold })} className="w-full bg-gradient-primary">
              <Bell className="h-4 w-4 mr-1.5" /> Crear alerta
            </Button>
          </div>
        </Panel>

        <Panel title="Alertas activas" className="col-span-12 lg:col-span-8">
          <ul className="divide-y divide-hairline">
            {alerts.map((a) => (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                <Switch checked={a.enabled} onCheckedChange={() => toggleAlert(a.id)} />
                <AssetIcon symbol={a.symbol} size={20} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.symbol.replace("USDT", "")} · {TYPE_LABELS[a.type]} <span className="num">{a.threshold}</span></div>
                  <div className="text-[11px] text-muted-foreground">{a.lastTriggered ? `Disparada hace ${timeAgo(a.lastTriggered)}` : "Aún no disparada"}</div>
                </div>
                <button onClick={() => deleteAlert(a.id)} className="text-muted-foreground hover:text-bear"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
            {alerts.length === 0 && <li className="p-6 text-center text-xs text-muted-foreground">Aún no hay alertas. Crea una a la izquierda.</li>}
          </ul>
        </Panel>

        <Panel title="Historial" className="col-span-12">
          <ul className="divide-y divide-hairline max-h-[300px] overflow-auto">
            {history.map((h) => (
              <li key={h.id} className="px-4 py-2 flex items-center gap-3 text-xs">
                <AssetIcon symbol={h.symbol} size={16} />
                <span className="font-semibold">{h.symbol.replace("USDT", "")}</span>
                <span className="text-muted-foreground flex-1">{h.message}</span>
                <span className="num text-muted-foreground">hace {timeAgo(h.at)}</span>
              </li>
            ))}
            {history.length === 0 && <li className="p-6 text-center text-xs text-muted-foreground">El historial se irá llenando cuando se disparen alertas.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

export default AlertsPage;
