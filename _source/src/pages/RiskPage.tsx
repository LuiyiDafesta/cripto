import { useState, useMemo } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useAppStore } from "@/lib/store";
import { use24hTickers, useKlines, useMultiKlines } from "@/lib/api";
import { useUnifiedAssets } from "@/lib/useUnifiedAssets";
import { compactUsd, fmtPrice } from "@/lib/format";
import { atr, assessTrade, computeCorrelationMatrix } from "@/lib/scoring";
import { CheckCircle2, AlertTriangle, XCircle, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetIcon } from "@/components/AssetIcon";

export const RiskPage = () => {
  const positions = useAppStore((s) => s.positions);
  const addPosition = useAppStore((s) => s.addPosition);
  const removePosition = useAppStore((s) => s.removePosition);
  const { data: tickers } = use24hTickers();
  const { allAssets } = useUnifiedAssets("all");

  const binanceAssets = useMemo(() => allAssets.filter(a => a.source === "both"), [allAssets]);
  const corrSymbols = useMemo(() => binanceAssets.slice(0, 10).map(a => a.binanceSymbol || `${a.symbol}USDT`), [binanceAssets]);

  // Add position form
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<"long" | "short">("long");
  const [size, setSize] = useState(1000);
  const [entry, setEntry] = useState(0);

  // Validator
  const [vSymbol, setVSymbol] = useState("BTCUSDT");
  const [vSide, setVSide] = useState<"long" | "short">("long");
  const [vEntry, setVEntry] = useState(0);
  const [vStop, setVStop] = useState(0);
  const [vTarget, setVTarget] = useState(0);
  const { data: vKlines } = useKlines(vSymbol, "4h", 60);
  const vAtr = useMemo(() => (vKlines ? atr(vKlines, 14) : 0), [vKlines]);

  const verdict = useMemo(() => {
    if (!vEntry || !vStop || !vTarget) return null;
    return assessTrade({ entry: vEntry, stop: vStop, target: vTarget, side: vSide, atrValue: vAtr });
  }, [vEntry, vStop, vTarget, vSide, vAtr]);

  const totalExposure = positions.reduce((s, p) => s + p.size, 0);

  // Real correlation matrix
  const { data: multiKlines } = useMultiKlines(corrSymbols, "1d", 60);
  const corrMatrix = useMemo(() => {
    if (!multiKlines || Object.keys(multiKlines).length < 3) return null;
    return computeCorrelationMatrix(multiKlines);
  }, [multiKlines]);

  // Dangerous hours
  const hour = new Date().getHours();
  const dangerous = (hour >= 22 || hour <= 4);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Centro de Control de Riesgo</h1>
          <InfoTooltip
            title="¿Para qué sirve el Control de Riesgo?"
            description="Simulador de portafolio para practicar sin dinero real. Agregá posiciones virtuales y mirá cómo les iría según el mercado actual. También podés validar un trade antes de ejecutarlo: la herramienta evalúa si el riesgo/retorno es aceptable."
          />
        </div>
        <p className="text-sm text-muted-foreground">Simulación de portafolio, validación de trades y matriz de correlación.</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Portfolio sim */}
        <Panel title={<span className="flex items-center gap-1.5">Portafolio en Papel <InfoTooltip title="Portafolio en Papel" description="Simulá operaciones sin arriesgar dinero real. Elegí una moneda, si va a subir (largo) o bajar (corto), cuánto invertir y a qué precio. El sistema calcula tu ganancia o pérdida en tiempo real según el precio actual del mercado." /></span>} className="col-span-12 lg:col-span-7">
          <div className="p-4 grid grid-cols-2 lg:grid-cols-5 gap-2 border-b border-hairline">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Activo</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="h-9 mt-1 bg-surface-2"><SelectValue /></SelectTrigger>
                <SelectContent>{binanceAssets.map((a) => <SelectItem key={a.symbol} value={a.binanceSymbol || `${a.symbol}USDT`}>{a.symbol}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Lado</Label>
              <Select value={side} onValueChange={(v: any) => setSide(v)}>
                <SelectTrigger className="h-9 mt-1 bg-surface-2"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="long">Largo</SelectItem><SelectItem value="short">Corto</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tamaño USD</Label>
              <Input type="number" value={size} onChange={(e) => setSize(+e.target.value)} className="h-9 mt-1 bg-surface-2" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Entrada</Label>
              <Input type="number" value={entry} onChange={(e) => setEntry(+e.target.value)} className="h-9 mt-1 bg-surface-2" placeholder="mercado" />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  const e = entry || tickers?.find((t) => t.symbol === symbol)?.lastPrice || 0;
                  if (e && size) { addPosition({ symbol, side, size, entry: e }); setSize(1000); setEntry(0); }
                }}
                className="w-full bg-gradient-primary"
              >
                Añadir posición
              </Button>
            </div>
          </div>
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead><tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                <th className="px-3 py-2 text-left">Activo</th><th className="px-3 py-2">Lado</th><th className="px-3 py-2 text-right">Tamaño</th><th className="px-3 py-2 text-right">Entrada</th><th className="px-3 py-2 text-right">Marca</th><th className="px-3 py-2 text-right">PnL</th><th></th>
              </tr></thead>
              <tbody>
                {positions.map((p) => {
                  const mark = tickers?.find((t) => t.symbol === p.symbol)?.lastPrice ?? p.entry;
                  const pnl = p.side === "long" ? (mark - p.entry) / p.entry * p.size : (p.entry - mark) / p.entry * p.size;
                  return (
                    <tr key={p.id} className="border-b border-hairline">
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><AssetIcon symbol={p.symbol} size={16} />{p.symbol.replace("USDT", "")}</div></td>
                      <td className={cn("px-3 py-2 text-center text-xs font-semibold", p.side === "long" ? "text-bull" : "text-bear")}>{p.side === "long" ? "LARGO" : "CORTO"}</td>
                      <td className="px-3 py-2 num text-right">{compactUsd(p.size)}</td>
                      <td className="px-3 py-2 num text-right">${fmtPrice(p.entry)}</td>
                      <td className="px-3 py-2 num text-right">${fmtPrice(mark)}</td>
                      <td className={cn("px-3 py-2 num text-right font-semibold", pnl >= 0 ? "text-bull" : "text-bear")}>{pnl >= 0 ? "+" : ""}{compactUsd(pnl)}</td>
                      <td className="px-3 py-2"><button onClick={() => removePosition(p.id)} className="text-muted-foreground hover:text-bear"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  );
                })}
                {positions.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">Aún no hay posiciones en papel.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-hairline flex items-center gap-6 text-xs">
            <span><span className="text-muted-foreground">Exposición total </span><span className="num font-semibold">{compactUsd(totalExposure)}</span></span>
            <span><span className="text-muted-foreground">Posiciones </span><span className="num font-semibold">{positions.length}</span></span>
          </div>
        </Panel>

        {/* Validator */}
        <Panel title={<span className="flex items-center gap-1.5">Validador de Trades <InfoTooltip title="Validador de Trades" description="Antes de abrir un trade, poné tu precio de entrada, stop loss (donde cortás la pérdida) y objetivo (donde tomás ganancia). El sistema evalúa la calidad del setup. R:R 2.0 = podés ganar el doble de lo que arriesgás. ATR = volatilidad promedio de la moneda." /></span>} className="col-span-12 lg:col-span-5" glow="violet">
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Activo</Label>
                <Select value={vSymbol} onValueChange={setVSymbol}>
                  <SelectTrigger className="h-9 mt-1 bg-surface-2"><SelectValue /></SelectTrigger>
                  <SelectContent>{binanceAssets.map((a) => <SelectItem key={a.symbol} value={a.binanceSymbol || `${a.symbol}USDT`}>{a.symbol}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Lado</Label>
                <Select value={vSide} onValueChange={(v: any) => setVSide(v)}>
                  <SelectTrigger className="h-9 mt-1 bg-surface-2"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="long">Largo</SelectItem><SelectItem value="short">Corto</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Entrada</Label><Input type="number" value={vEntry} onChange={(e) => setVEntry(+e.target.value)} className="h-9 mt-1 bg-surface-2" /></div>
              <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Stop</Label><Input type="number" value={vStop} onChange={(e) => setVStop(+e.target.value)} className="h-9 mt-1 bg-surface-2" /></div>
              <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Objetivo</Label><Input type="number" value={vTarget} onChange={(e) => setVTarget(+e.target.value)} className="h-9 mt-1 bg-surface-2" /></div>
              <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">ATR(14)</Label><div className="h-9 mt-1 px-3 flex items-center bg-surface-2 rounded-md border border-hairline num text-sm">{fmtPrice(vAtr)}</div></div>
            </div>
            {verdict && (
              <div className="rounded-lg p-3 bg-surface-2/50 border border-hairline space-y-2">
                <div className="flex items-center gap-2">
                  {verdict.verdict === "Reject" ? <XCircle className="h-5 w-5 text-bear" /> : verdict.verdict === "C" ? <AlertTriangle className="h-5 w-5 text-warn" /> : <CheckCircle2 className="h-5 w-5 text-bull" />}
                  <span className="font-semibold">Calidad del setup: {verdict.verdict === "Reject" ? "Rechazo" : verdict.verdict}</span>
                  <span className="num text-sm ml-auto">R:R {verdict.rr.toFixed(2)}</span>
                </div>
                {verdict.reasons.map((r, i) => <div key={i} className="text-xs text-bull flex gap-2"><span>✓</span>{r}</div>)}
                {verdict.warnings.map((w, i) => <div key={i} className="text-xs text-warn flex gap-2"><span>!</span>{w}</div>)}
              </div>
            )}
          </div>
        </Panel>

        {/* Dangerous hours */}
        <Panel title={<span className="flex items-center gap-1.5">Riesgo de Sesión <InfoTooltip title="Riesgo de Sesión" description="En horarios de baja liquidez (22hs a 4hs) hay menos compradores y vendedores en el mercado. Esto puede causar movimientos bruscos de precio (mechas) y peores precios al ejecutar órdenes. Es más seguro operar en sesión activa." /></span>} className="col-span-12 lg:col-span-4">
          <div className="p-4">
            <div className={cn("rounded-lg p-3 flex items-center gap-3", dangerous ? "bg-warn/10 border border-warn/30" : "bg-bull/10 border border-bull/20")}>
              <Clock className={cn("h-5 w-5", dangerous ? "text-warn" : "text-bull")} />
              <div>
                <div className="text-sm font-semibold">{dangerous ? "Ventana de baja liquidez" : "Sesión activa"}</div>
                <div className="text-xs text-muted-foreground">{dangerous ? "Slippage y riesgo de mecha elevados" : "Profundidad sana en los pares principales"}</div>
              </div>
            </div>
          </div>
        </Panel>

        {/* REAL Correlation Matrix */}
        <Panel
          title={<span className="flex items-center gap-1.5">Matriz de Correlación (Pearson · 60d) <InfoTooltip title="¿Qué es la Correlación?" description="Muestra qué tan parecido se mueven dos monedas. Si BTC y ETH tienen correlación 0.95, suben y bajan juntos. Sirve para no duplicar riesgo: si tus 3 monedas están muy correlacionadas, es como apostar todo a lo mismo. Correlación negativa (-0.5) = se mueven en sentidos opuestos, lo cual es bueno para diversificar." /></span>}
          subtitle={corrMatrix ? `${corrMatrix.symbols.length} activos calculados` : "Calculando…"}
          className="col-span-12 lg:col-span-8"
        >
          {corrMatrix ? (
            <div className="p-4 overflow-auto">
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `48px repeat(${corrMatrix.symbols.length}, 1fr)`,
                  gridTemplateRows: `32px repeat(${corrMatrix.symbols.length}, 1fr)`,
                }}
              >
                {/* Empty corner */}
                <div />
                {/* Column headers */}
                {corrMatrix.symbols.map(s => (
                  <div key={`h-${s}`} className="flex items-center justify-center text-[10px] num font-semibold text-muted-foreground">
                    {s.replace("USDT", "")}
                  </div>
                ))}
                {/* Matrix rows */}
                {corrMatrix.symbols.map((rowSym, i) => (
                  <>
                    <div key={`r-${rowSym}`} className="flex items-center justify-end pr-2 text-[10px] num font-semibold text-muted-foreground">
                      {rowSym.replace("USDT", "")}
                    </div>
                    {corrMatrix.matrix[i].map((corr, j) => {
                      const abs = Math.abs(corr);
                      // Better color scale: high corr = red (risk), low corr = green (diversified), negative = blue (hedge)
                      let bg: string;
                      let textColor: string;
                      if (i === j) {
                        bg = "hsl(220 20% 25% / 0.8)";
                        textColor = "text-muted-foreground";
                      } else if (corr >= 0.8) {
                        bg = `hsl(350 80% 55% / ${0.3 + abs * 0.5})`; // Red = high risk
                        textColor = "text-red-300";
                      } else if (corr >= 0.5) {
                        bg = `hsl(35 80% 50% / ${0.15 + abs * 0.35})`; // Orange = moderate
                        textColor = "text-amber-300";
                      } else if (corr >= 0) {
                        bg = `hsl(152 60% 45% / ${0.1 + abs * 0.3})`; // Green = low = good
                        textColor = "text-emerald-300";
                      } else {
                        bg = `hsl(210 80% 55% / ${0.15 + abs * 0.5})`; // Blue = negative = hedge
                        textColor = "text-blue-300";
                      }
                      return (
                        <Tooltip key={`c-${i}-${j}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn("aspect-square rounded flex items-center justify-center text-[9px] num font-medium cursor-default hover:ring-1 hover:ring-primary/50 transition", textColor)}
                              style={{ background: bg }}
                            >
                              {i === j ? "1.0" : corr.toFixed(2)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-0.5">
                              <div>{corrMatrix.symbols[i].replace("USDT", "")} ↔ {corrMatrix.symbols[j].replace("USDT", "")}: <strong>{corr.toFixed(4)}</strong></div>
                              <div className="text-muted-foreground">
                                {corr >= 0.8 ? "⚠️ Muy correlacionadas — alto riesgo si operás ambas" :
                                 corr >= 0.5 ? "⚡ Correlación moderada — diversificación parcial" :
                                 corr >= 0 ? "✅ Baja correlación — buena diversificación" :
                                 "🔵 Correlación negativa — se mueven en sentidos opuestos (cobertura)"}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: "hsl(350 80% 55% / 0.7)" }} />
                  <span>Alta (⚠️ riesgo duplicado)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: "hsl(35 80% 50% / 0.4)" }} />
                  <span>Moderada</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: "hsl(152 60% 45% / 0.3)" }} />
                  <span>Baja (✅ diversificado)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: "hsl(210 80% 55% / 0.5)" }} />
                  <span>Negativa (🔵 cobertura)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">Calculando correlaciones reales entre los top 10 activos…</div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default RiskPage;
