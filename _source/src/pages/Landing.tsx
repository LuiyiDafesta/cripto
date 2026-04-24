import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Activity,
  Brain,
  ShieldCheck,
  Waves,
  Newspaper,
  Sparkles,
  TrendingUp,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { use24hTickers, useFearGreed, useGlobalMacro } from "@/lib/api";
import { compactUsd, fmtPct, fmtPrice } from "@/lib/format";
import { AssetIcon } from "@/components/AssetIcon";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Brain, title: "Motor Smart Score", text: "Ranking compuesto 0–100 a partir de estructura, momentum, volumen, funding y sentimiento — recalculado de forma continua." },
  { icon: ShieldCheck, title: "Motor de Riesgo", text: "Stops basados en ATR, análisis de R:R, detección de sobrecarga por correlación y riesgo de sesión antes de pulsar enviar." },
  { icon: Waves, title: "Radar de Ballenas", text: "Cinta de operaciones grandes en vivo filtradas a ≥250.000 USD. Clusters de liquidaciones, anomalías de OI y extremos de funding." },
  { icon: Newspaper, title: "Inteligencia de Noticias", text: "Feed etiquetado por sentimiento con avisos de manipulación. Régimen de Fear & Greed superpuesto." },
  { icon: Activity, title: "Detección de Patrones", text: "Liquidity grabs, breakouts, falsas rupturas, acumulación, cambios de momentum — visualizados sobre el gráfico." },
  { icon: Zap, title: "Validador de Trades", text: "Pega una idea. Recibe un veredicto Pasa / Precaución / Rechazo con lógica de invalidación concreta." },
];

const TIERS = [
  {
    name: "Analyst",
    price: 299,
    features: ["Universo Top 20", "Ranking Smart Score", "Cinta de ballenas ≥250 K", "10 alertas activas"],
  },
  {
    name: "Professional",
    price: 499,
    featured: true,
    features: ["Todo lo de Analyst", "Motor de Riesgo + Validador", "Inteligencia de Noticias", "Alertas ilimitadas", "Watchlists personalizadas"],
  },
  {
    name: "Institutional",
    price: 999,
    features: ["Todo lo de Pro", "Portafolio multi-cuenta", "Acceso por API", "Soporte dedicado", "Indicadores personalizados"],
  },
];

const HEROSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];

export const Landing = () => {
  const { data: tickers } = use24hTickers();
  const { data: macro } = useGlobalMacro();
  const { data: fng } = useFearGreed();

  const heroTickers = tickers?.filter((t) => HEROSymbols.includes(t.symbol)) ?? [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-glow opacity-80 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 h-16 flex items-center justify-between px-6 lg:px-12 border-b border-hairline backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-violet">
            <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-wide">CipherDesk</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Funcionalidades</a>
          <a href="#pricing" className="hover:text-foreground transition">Precios</a>
          <a href="#data" className="hover:text-foreground transition">Datos</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition hidden sm:inline">
            Iniciar sesión
          </Link>
          <Link to="/login">
            <Button className="bg-gradient-primary hover:opacity-90 shadow-violet">
              Entrar al Terminal
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-12 pt-20 pb-24 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6 text-xs">
          <span className="status-dot" />
          <span className="uppercase tracking-[0.2em] text-muted-foreground">En vivo · Binance · CoinGecko · Alternative.me</span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.05]">
          Opera con{" "}
          <span className="text-gradient-violet">claridad institucional</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          CipherDesk es el terminal de soporte de decisión para traders de cripto serios. Datos reales de Binance,
          un motor Smart Score, seguimiento de flujo de ballenas y un motor de riesgo que te dice cuándo{" "}
          <span className="text-foreground">no</span> tomar la operación.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/login">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-violet h-12 px-7 text-base">
              Entrar al Terminal
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
            Ver cómo funciona →
          </a>
        </div>

        {/* Live market strip */}
        <div className="mt-16 glass rounded-2xl p-4 lg:p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {HEROSymbols.map((sym) => {
            const t = heroTickers.find((x) => x.symbol === sym);
            return (
              <div key={sym} className="rounded-xl bg-surface-2/50 border border-hairline p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AssetIcon symbol={sym} size={22} />
                  <span className="font-medium text-sm">{sym.replace("USDT", "")}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-wider">USDT</span>
                </div>
                <div className="num text-xl font-semibold">{t ? "$" + fmtPrice(t.lastPrice) : "—"}</div>
                <div
                  className={cn(
                    "num text-xs mt-1",
                    (t?.priceChangePercent ?? 0) >= 0 ? "text-bull" : "text-bear"
                  )}
                >
                  {t ? fmtPct(t.priceChangePercent) : ""} 24h
                </div>
              </div>
            );
          })}
        </div>

        {/* Macro chips under hero */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-hairline">
            <span className="text-muted-foreground">Cap. total </span>
            <span className="num font-semibold">{compactUsd(macro?.totalMarketCap)}</span>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-hairline">
            <span className="text-muted-foreground">Dom. BTC </span>
            <span className="num font-semibold">{macro?.btcDominance.toFixed(2) ?? "—"}%</span>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-hairline">
            <span className="text-muted-foreground">F&G </span>
            <span className="num font-semibold">{fng?.[0]?.value ?? "—"}</span>
            <span className="text-muted-foreground"> · {fng?.[0]?.classification ?? ""}</span>
          </span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-20 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-primary-glow">Capacidades</span>
            <h2 className="text-3xl lg:text-4xl font-semibold mt-2">Una capa de inteligencia completa.</h2>
          </div>
          <p className="text-muted-foreground max-w-md hidden md:block">
            Cada panel está diseñado bajo una sola regla: claridad sobre ruido. Sin señales. Sin bots. Solo mejores decisiones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 hover:border-primary/40 transition-colors group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-primary/10 border border-primary/30 flex items-center justify-center mb-5 group-hover:shadow-violet transition">
                <f.icon className="h-5 w-5 text-primary-glow" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data section */}
      <section id="data" className="relative z-10 px-6 lg:px-12 py-20 max-w-7xl mx-auto">
        <div className="glass rounded-2xl p-8 lg:p-12 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-secondary">Datos</span>
            <h2 className="text-3xl font-semibold mt-2 mb-4">En vivo, transparentes, sin caja negra.</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Conexiones directas REST + WebSocket a infraestructura pública de mercado. Cada score es reproducible.
              Cada señal cita la vela que la disparó.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Binance — precios, klines, funding, OI, WS aggTrade",
                "CoinGecko — capitalización total, dominancia BTC, dominancia ETH",
                "Alternative.me — índice Fear & Greed",
                "Agregadores públicos de noticias — etiquetado de sentimiento e impacto",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-glow opacity-50 blur-2xl" />
            <div className="relative glass-strong rounded-xl p-6 font-mono text-xs leading-relaxed">
              <div className="text-muted-foreground mb-3">// smart_score(BTCUSDT)</div>
              <div><span className="text-primary-glow">estructura</span>: 78 <span className="text-muted-foreground">// HH/HL en 4h</span></div>
              <div><span className="text-primary-glow">momentum</span>:   64 <span className="text-muted-foreground">// RSI 58, pendiente MACD+</span></div>
              <div><span className="text-primary-glow">volumen</span>:    71 <span className="text-muted-foreground">// 1,8× media 20 barras</span></div>
              <div><span className="text-primary-glow">fuerza_rel</span>: 58 <span className="text-muted-foreground">// vs BTC 30d</span></div>
              <div><span className="text-primary-glow">funding</span>:    55 <span className="text-muted-foreground">// 0,012% — neutro</span></div>
              <div><span className="text-primary-glow">delta_oi</span>:   62 <span className="text-muted-foreground">// sube con el precio</span></div>
              <div><span className="text-primary-glow">macro</span>:      60 <span className="text-muted-foreground">// F&G 52</span></div>
              <div className="mt-3 pt-3 border-t border-hairline">
                <span className="text-secondary">compuesto</span>: <span className="text-2xl text-primary-glow">68</span> <span className="text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 lg:px-12 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-primary-glow">Precios</span>
          <h2 className="text-3xl lg:text-4xl font-semibold mt-2">Pensado para capital serio.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={cn(
                "rounded-2xl p-7 flex flex-col",
                t.featured ? "glass-strong border-primary/40 shadow-violet" : "glass"
              )}
            >
              {t.featured && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary-glow font-semibold mb-3">
                  ★ Más popular
                </span>
              )}
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <div className="mt-4 mb-6">
                <span className="num text-4xl font-bold">${t.price}</span>
                <span className="text-muted-foreground text-sm">/mes</span>
              </div>
              <ul className="space-y-2 text-sm flex-1 mb-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-secondary mt-1 shrink-0" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login">
                <Button
                  className={cn(
                    "w-full",
                    t.featured ? "bg-gradient-primary shadow-violet hover:opacity-90" : "bg-surface-3 hover:bg-surface-3/70"
                  )}
                >
                  Probar Demo
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Precios mostrados con fines de posicionamiento del producto. El acceso demo está abierto durante esta vista previa.
        </p>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-hairline px-6 lg:px-12 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-white" strokeWidth={2.5} />
            </div>
            <span>CipherDesk · Soporte de decisión, no asesoría financiera.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground transition">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition">Precios</a>
            <a href="#data" className="hover:text-foreground transition">Datos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
