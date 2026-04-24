// Bidirectional sync between Zustand store and Supabase
import { useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore, AlertRule, PaperPosition } from "@/lib/store";

/**
 * Syncs the Zustand store with Supabase on login.
 * Loads data from DB → store on mount, and provides
 * wrapped actions that write to both store + DB.
 */
export function useSupabaseSync(userId: string | undefined) {
  const store = useAppStore();

  // ---- Load from DB on auth ----
  useEffect(() => {
    if (!userId) return;
    loadAll(userId);
  }, [userId]);

  const loadAll = async (uid: string) => {
    try {
      // Watchlist
      const { data: wl } = await supabase
        .from("watchlists")
        .select("symbol")
        .eq("user_id", uid);
      if (wl && wl.length > 0) {
        useAppStore.setState({ watchlist: wl.map(w => w.symbol) });
      }

      // Alerts
      const { data: alerts } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (alerts) {
        useAppStore.setState({
          alerts: alerts.map(a => ({
            id: a.id,
            symbol: a.symbol,
            type: a.type as AlertRule["type"],
            threshold: Number(a.threshold),
            enabled: a.enabled,
            createdAt: new Date(a.created_at).getTime(),
            lastTriggered: a.last_triggered_at
              ? new Date(a.last_triggered_at).getTime()
              : undefined,
            note: a.note ?? undefined,
          })),
        });
      }

      // Alert history
      const { data: hist } = await supabase
        .from("alert_history")
        .select("*")
        .eq("user_id", uid)
        .order("triggered_at", { ascending: false })
        .limit(100);
      if (hist) {
        useAppStore.setState({
          triggeredHistory: hist.map(h => ({
            id: h.id,
            ruleId: h.alert_id ?? "",
            symbol: h.symbol,
            message: h.message,
            at: new Date(h.triggered_at).getTime(),
          })),
        });
      }

      // Positions
      const { data: pos } = await supabase
        .from("paper_positions")
        .select("*")
        .eq("user_id", uid)
        .is("closed_at", null)
        .order("created_at", { ascending: false });
      if (pos) {
        useAppStore.setState({
          positions: pos.map(p => ({
            id: p.id,
            symbol: p.symbol,
            side: p.side as "long" | "short",
            size: Number(p.size),
            entry: Number(p.entry_price),
            stop: p.stop_price ? Number(p.stop_price) : undefined,
            target: p.target_price ? Number(p.target_price) : undefined,
            createdAt: new Date(p.created_at).getTime(),
          })),
        });
      }

      // Settings
      const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", uid)
        .single();
      if (settings) {
        useAppStore.setState({
          settings: {
            accent: settings.accent as "violet" | "emerald" | "amber",
            timezone: settings.timezone,
            refreshSeconds: settings.refresh_seconds,
            maxRiskPerTrade: Number(settings.max_risk_per_trade),
            preferredRR: Number(settings.preferred_rr),
            maxCorrelated: settings.max_correlated,
          },
        });
      }
    } catch (err) {
      console.error("[CipherDesk] Error loading from Supabase:", err);
    }
  };

  // ---- Wrapped DB actions ----
  const syncToggleWatch = useCallback(async (symbol: string) => {
    if (!userId) return;
    const current = useAppStore.getState().watchlist;
    store.toggleWatch(symbol);

    if (current.includes(symbol)) {
      await supabase.from("watchlists").delete().eq("user_id", userId).eq("symbol", symbol);
    } else {
      await supabase.from("watchlists").insert({ user_id: userId, symbol });
    }
  }, [userId, store]);

  const syncAddAlert = useCallback(async (a: Omit<AlertRule, "id" | "createdAt" | "enabled">) => {
    if (!userId) return;
    store.addAlert(a);

    // Get the alert that was just added (first in the array)
    const latest = useAppStore.getState().alerts[0];
    if (latest) {
      await supabase.from("alerts").insert({
        id: latest.id,
        user_id: userId,
        symbol: a.symbol,
        type: a.type,
        threshold: a.threshold,
        note: a.note,
      });
    }
  }, [userId, store]);

  const syncToggleAlert = useCallback(async (id: string) => {
    if (!userId) return;
    store.toggleAlert(id);
    const alert = useAppStore.getState().alerts.find(a => a.id === id);
    if (alert) {
      await supabase.from("alerts").update({ enabled: alert.enabled }).eq("id", id);
    }
  }, [userId, store]);

  const syncDeleteAlert = useCallback(async (id: string) => {
    if (!userId) return;
    store.deleteAlert(id);
    await supabase.from("alerts").delete().eq("id", id);
  }, [userId, store]);

  const syncAddPosition = useCallback(async (p: Omit<PaperPosition, "id" | "createdAt">) => {
    if (!userId) return;
    store.addPosition(p);
    const latest = useAppStore.getState().positions[0];
    if (latest) {
      await supabase.from("paper_positions").insert({
        id: latest.id,
        user_id: userId,
        symbol: p.symbol,
        side: p.side,
        size: p.size,
        entry_price: p.entry,
        stop_price: p.stop ?? null,
        target_price: p.target ?? null,
      });
    }
  }, [userId, store]);

  const syncRemovePosition = useCallback(async (id: string) => {
    if (!userId) return;
    store.removePosition(id);
    await supabase.from("paper_positions").update({ closed_at: new Date().toISOString() }).eq("id", id);
  }, [userId, store]);

  const syncUpdateSettings = useCallback(async (s: Partial<ReturnType<typeof useAppStore.getState>["settings"]>) => {
    if (!userId) return;
    store.updateSettings(s);

    const mapped: Record<string, any> = {};
    if (s.accent !== undefined) mapped.accent = s.accent;
    if (s.timezone !== undefined) mapped.timezone = s.timezone;
    if (s.refreshSeconds !== undefined) mapped.refresh_seconds = s.refreshSeconds;
    if (s.maxRiskPerTrade !== undefined) mapped.max_risk_per_trade = s.maxRiskPerTrade;
    if (s.preferredRR !== undefined) mapped.preferred_rr = s.preferredRR;
    if (s.maxCorrelated !== undefined) mapped.max_correlated = s.maxCorrelated;
    mapped.updated_at = new Date().toISOString();

    // Upsert settings
    await supabase.from("user_settings").upsert({
      user_id: userId,
      ...mapped,
    }, { onConflict: "user_id" });
  }, [userId, store]);

  const syncTriggerAlert = useCallback(async (rule: AlertRule, message: string) => {
    if (!userId) return;
    store.triggerAlert(rule, message);

    await supabase.from("alert_history").insert({
      user_id: userId,
      alert_id: rule.id,
      symbol: rule.symbol,
      message,
    });
    await supabase.from("alerts").update({
      last_triggered_at: new Date().toISOString(),
    }).eq("id", rule.id);
  }, [userId, store]);

  return {
    syncToggleWatch,
    syncAddAlert,
    syncToggleAlert,
    syncDeleteAlert,
    syncAddPosition,
    syncRemovePosition,
    syncUpdateSettings,
    syncTriggerAlert,
    reload: () => userId && loadAll(userId),
  };
}
