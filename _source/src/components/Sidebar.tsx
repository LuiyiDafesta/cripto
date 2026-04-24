import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Radar,
  Trophy,
  Waves,
  ShieldCheck,
  Newspaper,
  Bell,
  Settings,
  TrendingUp,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const NAV = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Panel", end: true },
  { to: "/app/markets", icon: Globe, label: "Mercados" },
  { to: "/app/scanner", icon: Radar, label: "Scanner" },
  { to: "/app/smart-score", icon: Trophy, label: "Score" },
  { to: "/app/whales", icon: Waves, label: "Ballenas" },
  { to: "/app/risk", icon: ShieldCheck, label: "Riesgo" },
  { to: "/app/news", icon: Newspaper, label: "Noticias" },
  { to: "/app/alerts", icon: Bell, label: "Alertas" },
  { to: "/app/settings", icon: Settings, label: "Ajustes" },
];

export const Sidebar = () => {
  const alertsCount = useAppStore((s) => s.alerts.filter((a) => a.enabled).length);

  return (
    <aside className="w-[68px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Brand */}
      <NavLink to="/app" className="h-14 flex items-center justify-center border-b border-sidebar-border group">
        <div className="relative">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-violet group-hover:scale-105 transition-transform">
            <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </NavLink>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group relative h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all",
                "hover:bg-sidebar-accent",
                isActive
                  ? "bg-sidebar-accent text-primary-glow shadow-[inset_2px_0_0_hsl(var(--primary))]"
                  : "text-sidebar-foreground"
              )
            }
            title={label}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span className="text-[9px] uppercase tracking-wider font-medium">{label.split(" ")[0]}</span>
            {label === "Alertas" && alertsCount > 0 && (
              <span className="absolute top-1.5 right-2 h-4 min-w-[16px] px-1 text-[9px] rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center num">
                {alertsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="flex flex-col items-center gap-1 py-2">
          <span className="status-dot" />
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">En vivo</span>
        </div>
      </div>
    </aside>
  );
};
