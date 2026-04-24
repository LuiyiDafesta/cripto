// Pure formatting helpers used everywhere in the terminal
export const fmtPrice = (n: number | undefined | null, opts?: { compact?: boolean }) => {
  if (n == null || isNaN(n)) return "—";
  if (opts?.compact && Math.abs(n) >= 1000) return compactNumber(n);
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (n >= 0.01) return n.toLocaleString("en-US", { maximumFractionDigits: 5 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
};

export const fmtUsd = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return "—";
  return "$" + fmtPrice(n);
};

export const fmtPct = (n: number | undefined | null, digits = 2) => {
  if (n == null || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
};

export const compactNumber = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
};

export const compactUsd = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return "—";
  return "$" + compactNumber(n);
};

export const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
};

export const timeAgo = (ts: number) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const changeColor = (n: number | undefined | null) => {
  if (n == null) return "text-muted-foreground";
  return n > 0 ? "text-bull" : n < 0 ? "text-bear" : "text-muted-foreground";
};

export const scoreColor = (score: number) => {
  if (score >= 80) return "text-primary-glow";
  if (score >= 65) return "text-bull";
  if (score >= 40) return "text-warn";
  return "text-bear";
};

export const scoreBg = (score: number) => {
  if (score >= 80) return "bg-primary";
  if (score >= 65) return "bg-bull";
  if (score >= 40) return "bg-warn";
  return "bg-bear";
};
