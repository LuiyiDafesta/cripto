import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, ArrowRight, Activity, AlertTriangle } from "lucide-react";
import { use24hTickers } from "@/lib/api";
import { Sparkline } from "@/components/Sparkline";
import { useKlines } from "@/lib/api";
import { fmtPct, fmtPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const HeroChart = () => {
  const { data } = useKlines("BTCUSDT", "1h", 80);
  const closes = data?.map((k) => k.close) ?? [];
  return <Sparkline values={closes} width={520} height={160} strokeWidth={2} />;
};

export const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const { data: tickers } = use24hTickers();

  // If already authenticated, redirect
  if (isAuthenticated) {
    navigate("/app");
    return null;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      setError("Ingresa email y contraseña");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate("/app");
    } catch (err: any) {
      const msg = err?.message ?? "Error desconocido";
      if (msg.includes("Invalid login")) {
        setError("Email o contraseña incorrectos");
      } else if (msg.includes("already registered")) {
        setError("Este email ya está registrado. Intentá iniciar sesión.");
      } else if (msg.includes("Password should be")) {
        setError("La contraseña debe tener al menos 6 caracteres");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const top = tickers?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2 overflow-hidden relative">
      {/* Left: visualization */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 bg-surface-1 border-r border-hairline overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-glow opacity-80" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-emerald opacity-10 blur-3xl" />

        <header className="relative z-10 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-violet">
            <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-wide">CipherDesk</span>
        </header>

        <div className="relative z-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary-glow mb-3 flex items-center gap-2">
            <Activity className="h-3 w-3" />
            En vivo · BTCUSDT · 80h
          </div>
          <h2 className="text-4xl font-semibold leading-tight max-w-md">
            El terminal para traders que tratan las decisiones como <span className="text-gradient-emerald">asignación de capital</span>.
          </h2>

          <div className="mt-10 glass rounded-2xl p-5">
            <HeroChart />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {top.slice(0, 3).map((t) => (
                <div key={t.symbol} className="rounded-md bg-surface-2/50 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.symbol.replace("USDT", "")}</div>
                  <div className="num text-sm font-semibold">${fmtPrice(t.lastPrice)}</div>
                  <div className={cn("num text-[10px]", t.priceChangePercent >= 0 ? "text-bull" : "text-bear")}>
                    {fmtPct(t.priceChangePercent)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="relative z-10 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot" />
            <span className="uppercase tracking-wider">Todos los sistemas operativos</span>
          </div>
          © {new Date().getFullYear()} CipherDesk
        </footer>
      </aside>

      {/* Right: form */}
      <main className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-violet">
              <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-wide">CipherDesk</span>
          </div>
        </div>
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold">
            {mode === "login" ? "Entrar al terminal" : "Crear cuenta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "login" 
              ? "Ingresá con tu cuenta para acceder al terminal."
              : "Registrate para comenzar a operar."}
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-bear/10 border border-bear/30 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-bear mt-0.5 shrink-0" />
              <span className="text-sm text-bear">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Correo</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-surface-2 border-strong h-11"
                type="email"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contraseña</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-surface-2 border-strong h-11"
                type="password"
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : ""}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-violet text-base"
            >
              {loading ? "Procesando…" : (
                <>
                  {mode === "login" ? "Entrar al Terminal" : "Crear Cuenta"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-hairline border-t border-hairline" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}
            </span>
            <div className="flex-1 h-px bg-hairline border-t border-hairline" />
          </div>

          <Button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            variant="outline"
            className="w-full h-11 bg-surface-2 border-strong"
          >
            {mode === "login" ? "Crear cuenta nueva" : "Iniciar sesión"}
          </Button>

          <p className="mt-8 text-xs text-muted-foreground text-center">
            Al entrar, reconocés que CipherDesk ofrece soporte de decisión — no asesoría financiera.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
