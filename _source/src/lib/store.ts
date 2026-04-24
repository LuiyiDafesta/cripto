// Persistent local store — watchlists, alerts, settings, paper positions
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AlertRule {
  id: string;
  symbol: string;
  type: "price_above" | "price_below" | "score_above" | "funding_above" | "vol_spike" | "breakout";
  threshold: number;
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
  note?: string;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  side: "long" | "short";
  size: number;          // USD notional
  entry: number;
  stop?: number;
  target?: number;
  createdAt: number;
}

interface AppState {
  authed: boolean;
  watchlist: string[];
  alerts: AlertRule[];
  triggeredHistory: { id: string; ruleId: string; symbol: string; message: string; at: number }[];
  positions: PaperPosition[];
  settings: {
    accent: "violet" | "emerald" | "amber";
    timezone: string;
    refreshSeconds: number;
    maxRiskPerTrade: number;     // % of account
    preferredRR: number;
    maxCorrelated: number;
  };
  setAuthed: (v: boolean) => void;
  toggleWatch: (symbol: string) => void;
  addAlert: (a: Omit<AlertRule, "id" | "createdAt" | "enabled">) => void;
  toggleAlert: (id: string) => void;
  deleteAlert: (id: string) => void;
  triggerAlert: (rule: AlertRule, message: string) => void;
  addPosition: (p: Omit<PaperPosition, "id" | "createdAt">) => void;
  removePosition: (id: string) => void;
  updateSettings: (s: Partial<AppState["settings"]>) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      authed: false,
      watchlist: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"],
      alerts: [],
      triggeredHistory: [],
      positions: [],
      settings: {
        accent: "violet",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        refreshSeconds: 30,
        maxRiskPerTrade: 1,
        preferredRR: 2.5,
        maxCorrelated: 3,
      },
      setAuthed: (v) => set({ authed: v }),
      toggleWatch: (symbol) =>
        set((s) => ({
          watchlist: s.watchlist.includes(symbol)
            ? s.watchlist.filter((x) => x !== symbol)
            : [...s.watchlist, symbol],
        })),
      addAlert: (a) =>
        set((s) => ({
          alerts: [
            { ...a, id: crypto.randomUUID(), createdAt: Date.now(), enabled: true },
            ...s.alerts,
          ],
        })),
      toggleAlert: (id) =>
        set((s) => ({ alerts: s.alerts.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)) })),
      deleteAlert: (id) => set((s) => ({ alerts: s.alerts.filter((x) => x.id !== id) })),
      triggerAlert: (rule, message) =>
        set((s) => ({
          alerts: s.alerts.map((x) => (x.id === rule.id ? { ...x, lastTriggered: Date.now() } : x)),
          triggeredHistory: [
            { id: crypto.randomUUID(), ruleId: rule.id, symbol: rule.symbol, message, at: Date.now() },
            ...s.triggeredHistory,
          ].slice(0, 200),
        })),
      addPosition: (p) =>
        set((s) => ({ positions: [{ ...p, id: crypto.randomUUID(), createdAt: Date.now() }, ...s.positions] })),
      removePosition: (id) => set((s) => ({ positions: s.positions.filter((x) => x.id !== id) })),
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      resetAll: () =>
        set({
          watchlist: ["BTCUSDT", "ETHUSDT"],
          alerts: [],
          triggeredHistory: [],
          positions: [],
        }),
    }),
    { name: "cipherdesk-store" }
  )
);
