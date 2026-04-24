// Alert evaluation engine — runs periodically against live market data
import { useEffect, useRef } from "react";
import { useAppStore, AlertRule } from "@/lib/store";
import { use24hTickers } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface AlertContext {
  syncTriggerAlert: (rule: AlertRule, message: string) => Promise<void>;
}

/**
 * Evaluates all active alerts against current market data every N seconds.
 * Should be mounted once in AppLayout.
 */
export function useAlertEngine(ctx: AlertContext) {
  const alerts = useAppStore(s => s.alerts);
  const settings = useAppStore(s => s.settings);
  const { data: tickers } = use24hTickers();

  const lastCheckRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!tickers || tickers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const tickerMap: Record<string, { lastPrice: number; quoteVolume: number; priceChangePercent: number }> = {};
      tickers.forEach(t => {
        tickerMap[t.symbol] = t;
      });

      alerts.forEach(rule => {
        if (!rule.enabled) return;

        // Debounce: don't trigger same alert more than once per 5 minutes
        const lastCheck = lastCheckRef.current[rule.id] ?? 0;
        if (now - lastCheck < 5 * 60 * 1000 && rule.lastTriggered && now - rule.lastTriggered < 5 * 60 * 1000) return;

        const ticker = tickerMap[rule.symbol];
        if (!ticker) return;

        let triggered = false;
        let message = "";

        switch (rule.type) {
          case "price_above":
            if (ticker.lastPrice >= rule.threshold) {
              triggered = true;
              message = `${rule.symbol.replace("USDT", "")} superó $${rule.threshold.toLocaleString()} — precio actual $${ticker.lastPrice.toLocaleString()}`;
            }
            break;

          case "price_below":
            if (ticker.lastPrice <= rule.threshold) {
              triggered = true;
              message = `${rule.symbol.replace("USDT", "")} cayó bajo $${rule.threshold.toLocaleString()} — precio actual $${ticker.lastPrice.toLocaleString()}`;
            }
            break;

          case "vol_spike":
            // threshold is the multiplier (e.g., 2 = 2x normal volume)
            // We approximate by comparing current 24h change magnitude
            if (Math.abs(ticker.priceChangePercent) >= rule.threshold) {
              triggered = true;
              message = `${rule.symbol.replace("USDT", "")} movimiento de ${ticker.priceChangePercent.toFixed(2)}% — umbral ${rule.threshold}%`;
            }
            break;

          case "funding_above":
            // This would need funding data passed in; skip for now if not available
            break;

          case "score_above":
            // This would need Smart Score data; skip for now
            break;

          case "breakout":
            // Breakout detection is done in the pattern engine
            break;
        }

        if (triggered) {
          lastCheckRef.current[rule.id] = now;
          ctx.syncTriggerAlert(rule, message);

          // Show toast notification
          toast({
            title: `🔔 Alerta: ${rule.symbol.replace("USDT", "")}`,
            description: message,
            duration: 8000,
          });
        }
      });
    }, (settings.refreshSeconds || 30) * 1000);

    return () => clearInterval(interval);
  }, [alerts, tickers, settings.refreshSeconds, ctx]);
}
