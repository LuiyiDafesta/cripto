/**
 * AI Copilot — Trading intelligence via Groq (Llama 3.3 70B, free tier)
 * Combines quantitative analysis with LLM narrative generation
 */

import type { SmartScoreBreakdown, DetectedPattern } from "./scoring";

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ---------- Local rules engine (always works, no API needed) ----------

export interface Signal {
  type: "compra" | "venta" | "neutral";
  symbol: string;
  strength: "fuerte" | "moderada" | "débil";
  reasons: string[];
}

export interface RiskAlert {
  symbol: string;
  level: "alto" | "medio";
  message: string;
}

export interface MarketInsight {
  signals: Signal[];
  risks: RiskAlert[];
  tips: string[];
  summary: string;
  regime: "alcista" | "bajista" | "lateral" | "volátil";
}

export function analyzeMarketLocal(params: {
  scores: Array<{ symbol: string; total: number; structure: number; momentum: number; volume: number; funding: number }>;
  fearGreed?: number;
  btcDominance?: number;
  marketCapChange?: number;
  fundingExtremes?: { positive: Array<{ symbol: string; lastFundingRate: number }>; negative: Array<{ symbol: string; lastFundingRate: number }> };
  patterns?: Array<{ symbol: string; pattern: DetectedPattern; score: number }>;
}): MarketInsight {
  const { scores, fearGreed, btcDominance, marketCapChange, fundingExtremes, patterns } = params;
  const signals: Signal[] = [];
  const risks: RiskAlert[] = [];
  const tips: string[] = [];

  // Determine market regime
  let regime: MarketInsight["regime"] = "lateral";
  if (fearGreed != null) {
    if (fearGreed > 70) regime = "alcista";
    else if (fearGreed < 25) regime = "bajista";
  }
  if (marketCapChange != null) {
    if (Math.abs(marketCapChange) > 3) regime = "volátil";
  }

  // Generate signals from scores
  const sorted = [...scores].sort((a, b) => b.total - a.total);

  // Strong buy signals
  sorted.forEach(s => {
    if (s.total >= 70 && s.structure >= 65 && s.momentum >= 60) {
      signals.push({
        type: "compra",
        symbol: s.symbol,
        strength: s.total >= 80 ? "fuerte" : "moderada",
        reasons: [
          `Score ${s.total}/100 — top del ranking`,
          s.structure >= 70 ? "Estructura de mercado alcista (máximos crecientes)" : "Estructura favorable",
          s.momentum >= 70 ? "Momentum fuerte con RSI saludable" : "Momentum positivo",
          s.volume >= 65 ? "Volumen por encima de la media" : "",
        ].filter(Boolean),
      });
    }
  });

  // Sell/avoid signals
  sorted.forEach(s => {
    if (s.total < 35 && s.momentum < 40) {
      signals.push({
        type: "venta",
        symbol: s.symbol,
        strength: s.total < 25 ? "fuerte" : "moderada",
        reasons: [
          `Score ${s.total}/100 — fondo del ranking`,
          s.structure < 35 ? "Estructura bajista (máximos decrecientes)" : "Estructura débil",
          s.momentum < 30 ? "Momentum muerto, RSI en zona de sobreventa" : "Sin fuerza compradora",
        ],
      });
    }
  });

  // Contrarian signals from funding extremes
  if (fundingExtremes) {
    fundingExtremes.positive.forEach(f => {
      if (f.lastFundingRate > 0.0005) {
        risks.push({
          symbol: f.symbol,
          level: "alto",
          message: `Funding extremo ${(f.lastFundingRate * 100).toFixed(3)}% — posiciones largas saturadas, riesgo de cascada de liquidaciones`,
        });
      }
    });
    fundingExtremes.negative.forEach(f => {
      if (f.lastFundingRate < -0.0003) {
        signals.push({
          type: "compra",
          symbol: f.symbol,
          strength: "débil",
          reasons: [`Funding negativo ${(f.lastFundingRate * 100).toFixed(3)}% — cortos saturados, posible short squeeze`],
        });
      }
    });
  }

  // Pattern-based signals
  patterns?.forEach(p => {
    if (p.pattern.direction === "bullish" && p.score >= 55) {
      const existing = signals.find(s => s.symbol === p.symbol && s.type === "compra");
      if (existing) {
        existing.reasons.push(`Patrón detectado: ${p.pattern.type}`);
      }
    }
  });

  // Risk warnings
  if (fearGreed != null && fearGreed > 80) {
    risks.push({
      symbol: "MERCADO",
      level: "alto",
      message: "Fear & Greed en codicia extrema — históricamente precede correcciones",
    });
  }
  if (fearGreed != null && fearGreed < 20) {
    tips.push("Miedo extremo suele ser oportunidad de compra a mediano plazo — pero esperá confirmación de estructura");
  }

  // Tips based on regime
  if (regime === "volátil") {
    tips.push("Mercado volátil: reducí tamaño de posiciones y ampliá stops a ≥1.5× ATR");
    tips.push("Evitá entrar en los primeros 15 minutos de un movimiento explosivo — esperá retesteo");
  }
  if (regime === "lateral") {
    tips.push("Mercado sin dirección clara — operá en rango o esperá ruptura confirmada con volumen");
  }
  if (regime === "alcista") {
    tips.push("Sesgo general alcista — priorizá largos en pullbacks, no perseguir pumps");
  }
  if (regime === "bajista") {
    tips.push("Sesgo bajista — protegé capital, stops ajustados, tamaño reducido");
  }

  // Always add general tips
  tips.push("Nunca arriesgues más del 1-2% del portfolio en un solo trade");

  // Generate summary
  const buyCount = signals.filter(s => s.type === "compra" && s.strength !== "débil").length;
  const sellCount = signals.filter(s => s.type === "venta").length;
  const topBuy = signals.find(s => s.type === "compra" && s.strength === "fuerte");

  let summary = "";
  if (regime === "alcista" && buyCount > 2) {
    summary = `Mercado alcista con ${buyCount} señales de compra activas.`;
  } else if (regime === "bajista") {
    summary = `Mercado con sesgo bajista — precaución.`;
  } else if (regime === "volátil") {
    summary = `Alta volatilidad — reducí exposición.`;
  } else {
    summary = `Mercado lateral. ${buyCount > 0 ? `${buyCount} oportunidades selectivas.` : "Sin señales claras por ahora."}`;
  }
  if (topBuy) {
    summary += ` ${topBuy.symbol.replace("USDT", "")} destaca como mejor oportunidad (${topBuy.strength}).`;
  }

  return { signals: signals.slice(0, 8), risks: risks.slice(0, 5), tips: tips.slice(0, 5), summary, regime };
}

// ---------- Groq LLM integration ----------

export interface AIBrief {
  content: string;
  generatedAt: number;
  model: string;
}

export async function generateAIBrief(params: {
  insight: MarketInsight;
  scores: Array<{ symbol: string; total: number; base: string }>;
  fearGreed?: number;
  btcDominance?: number;
  marketCapChange?: number;
  btcPrice?: number;
}): Promise<AIBrief> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    // Fallback: generate local brief without LLM
    return {
      content: generateLocalBrief(params),
      generatedAt: Date.now(),
      model: "local",
    };
  }

  const { insight, scores, fearGreed, btcDominance, marketCapChange, btcPrice } = params;

  const top5 = scores.slice(0, 5).map(s => `${s.base}: ${s.total}/100`).join(", ");
  const buySignals = insight.signals.filter(s => s.type === "compra").map(s => `${s.symbol.replace("USDT", "")} (${s.strength}): ${s.reasons[0]}`).join("; ");
  const sellSignals = insight.signals.filter(s => s.type === "venta").map(s => `${s.symbol.replace("USDT", "")} (${s.strength}): ${s.reasons[0]}`).join("; ");
  const riskList = insight.risks.map(r => `${r.symbol}: ${r.message}`).join("; ");

  const prompt = `Sos un analista de trading cripto profesional. Generá un brief de mercado CONCISO en español argentino (máximo 200 palabras) para un trader activo.

DATOS ACTUALES:
- BTC: $${btcPrice?.toLocaleString() ?? "?"}
- Fear & Greed: ${fearGreed ?? "?"}
- Dominancia BTC: ${btcDominance?.toFixed(1) ?? "?"}%
- Cambio mcap 24h: ${marketCapChange?.toFixed(2) ?? "?"}%
- Régimen: ${insight.regime}
- Top 5 Smart Score: ${top5}
- Señales de compra: ${buySignals || "Ninguna"}
- Señales de venta: ${sellSignals || "Ninguna"}
- Riesgos: ${riskList || "Sin alertas"}

FORMATO REQUERIDO:
1. Un párrafo de contexto general (2-3 oraciones)
2. Sección "🟢 Oportunidades" con las mejores compras y por qué
3. Sección "🔴 Evitar" con lo que NO comprar y por qué
4. Sección "⚠️ Riesgos" con alertas activas
5. Sección "💡 Consejo" con un tip operativo concreto

Sé directo. Sin introducciones genéricas. Hablá como un trader profesional, no como un robot.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      console.error("[CipherDesk AI] Groq error:", res.status);
      return { content: generateLocalBrief(params), generatedAt: Date.now(), model: "local-fallback" };
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? generateLocalBrief(params);

    return { content, generatedAt: Date.now(), model: GROQ_MODEL };
  } catch (err) {
    console.error("[CipherDesk AI] Error:", err);
    return { content: generateLocalBrief(params), generatedAt: Date.now(), model: "local-fallback" };
  }
}

// ---------- Asset-specific AI analysis ----------

export async function generateAssetAnalysis(params: {
  symbol: string;
  base: string;
  score: SmartScoreBreakdown;
  price: number;
  change24h: number;
  fundingRate?: number;
  patterns: DetectedPattern[];
  atr: number;
  mode?: "técnico" | "principiante";
}): Promise<AIBrief> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const { symbol, base, score, price, change24h, fundingRate, patterns, atr: atrVal, mode = "técnico" } = params;

  const patternList = patterns.map(p => `${p.type} (${p.direction}, ${p.confidence}%): ${p.description}`).join("; ");

  if (!apiKey) {
    return { content: generateLocalAssetBrief(params), generatedAt: Date.now(), model: "local" };
  }

  const promptBase = `Sos analista cripto profesional. Analizá ${base}/USDT en español argentino (máximo 150 palabras) para un perfil **${mode.toUpperCase()}**.
  
DATOS:
- Precio: $${price.toLocaleString()} (${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}% 24h)
- Smart Score: ${score.total}/100
  - Estructura: ${score.structure} | Momentum: ${score.momentum} | Volumen: ${score.volume}
  - Fuerza Relativa: ${score.relStrength} | Funding: ${score.funding} | OI: ${score.oi}
- ATR(14): $${atrVal.toFixed(2)}
- Funding Rate: ${fundingRate != null ? (fundingRate * 100).toFixed(4) + "%" : "N/A"}
- Patrones: ${patternList || "Ninguno detectado"}`;

  const promptTech = `
RESPONDÉ con jerga técnica:
1. Sesgo actual (alcista/bajista/neutral) argumentando con la data
2. Entrada sugerida, stop-loss y take-profit basados en el ATR
3. Riesgo principal de mercado o liquidación
Sé directo. Sin disclaimers.`;

  const promptBeg = `
RESPONDÉ de forma simple y fácil de entender (sin jerga compleja):
1. ¿Es buen momento para comprar o vender? ¿Por qué?
2. Niveles de precios clave para vigilar
3. Riesgo principal explicado simplemente
Sé directo. Sin disclaimers.`;

  const prompt = promptBase + (mode === "técnico" ? promptTech : promptBeg);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    if (!res.ok) return { content: generateLocalAssetBrief(params), generatedAt: Date.now(), model: "local-fallback" };

    const json = await res.json();
    return { content: json.choices?.[0]?.message?.content ?? generateLocalAssetBrief(params), generatedAt: Date.now(), model: GROQ_MODEL };
  } catch {
    return { content: generateLocalAssetBrief(params), generatedAt: Date.now(), model: "local-fallback" };
  }
}

// ---------- Local fallback generators ----------

function generateLocalBrief(params: {
  insight: MarketInsight;
  scores: Array<{ symbol: string; total: number; base: string }>;
  fearGreed?: number;
  btcPrice?: number;
}): string {
  const { insight, scores, fearGreed, btcPrice } = params;
  const top = scores[0];
  const buys = insight.signals.filter(s => s.type === "compra" && s.strength !== "débil");
  const sells = insight.signals.filter(s => s.type === "venta");

  let out = `**Régimen: ${insight.regime.toUpperCase()}** — `;

  if (fearGreed != null) {
    out += fearGreed > 70 ? "Codicia elevada, precaución con largos agresivos. " :
           fearGreed < 30 ? "Miedo en el mercado — históricamente buen momento para acumular selectivamente. " :
           "Sentimiento neutral. ";
  }

  if (btcPrice) out += `BTC en $${btcPrice.toLocaleString()}. `;
  if (top) out += `${top.base} lidera el ranking con score ${top.total}/100.\n\n`;

  if (buys.length > 0) {
    out += `🟢 **Oportunidades**: ${buys.map(s => `**${s.symbol.replace("USDT", "")}** — ${s.reasons[0]}`).join(". ")}.\n\n`;
  } else {
    out += "🟢 **Oportunidades**: Sin señales de compra fuertes por ahora. Esperá confirmación.\n\n";
  }

  if (sells.length > 0) {
    out += `🔴 **Evitar**: ${sells.map(s => `**${s.symbol.replace("USDT", "")}** — ${s.reasons[0]}`).join(". ")}.\n\n`;
  }

  if (insight.risks.length > 0) {
    out += `⚠️ **Riesgos**: ${insight.risks[0].message}\n\n`;
  }

  out += `💡 **Consejo**: ${insight.tips[0]}`;

  return out;
}

function generateLocalAssetBrief(params: {
  base: string;
  score: SmartScoreBreakdown;
  price: number;
  change24h: number;
  patterns: DetectedPattern[];
}): string {
  const { base, score, price, change24h, patterns } = params;
  const bias = score.structure >= 60 && score.momentum >= 55 ? "alcista" :
               score.structure < 40 && score.momentum < 45 ? "bajista" : "neutral";

  let out = `**${base}** a $${price.toLocaleString()} (${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}% 24h)\n\n`;
  out += `**Sesgo: ${bias.toUpperCase()}** — Score ${score.total}/100\n`;
  out += `Estructura ${score.structure} | Momentum ${score.momentum} | Volumen ${score.volume}\n\n`;

  if (patterns.length > 0) {
    out += `**Patrones**: ${patterns.map(p => `${p.type} (${p.direction === "bullish" ? "alcista" : "bajista"}, ${p.confidence}%)`).join(", ")}\n\n`;
  }

  if (bias === "alcista" && score.total >= 65) {
    out += "🟢 Setup favorable para largo en pullback. Esperá retesteo de soporte antes de entrar.";
  } else if (bias === "bajista") {
    out += "🔴 Evitá largos. Si querés operar, esperá breakdown confirmado con volumen para corto.";
  } else {
    out += "⏸️ Sin setup claro. Mejor esperar una definición de dirección.";
  }

  return out;
}

// ---------- NEW: Contextual AI Endpoints ----------

export async function generateGlobalMarketAnalysis(params: {
  totalMarketCap?: number;
  btcDominance?: number;
  ethDominance?: number;
  fearGreed?: number;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Falta la API Key de Groq para usar la IA.");

  const prompt = `Sos un analista cripto institucional. Explicá en español argentino de manera CLARA, RESUMIDA y CONCISA el estado actual del mercado global.
DATOS:
- Cap. Total: $${params.totalMarketCap?.toLocaleString() ?? "?"}
- Dom. BTC: ${params.btcDominance?.toFixed(1)}% | Dom. ETH: ${params.ethDominance?.toFixed(1)}%
- Fear & Greed: ${params.fearGreed ?? "?"}

Estructurá tu respuesta en 3 párrafos cortos o viñetas:
1. Qué significa la capitalización total actual y si hay entrada/salida de dinero.
2. Qué nos dice la dominancia de BTC (¿estamos en altseason o dominio de Bitcoin?).
3. Interpretación del índice de miedo y codicia.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.6, max_tokens: 300 }),
  });
  if (!res.ok) throw new Error("Error en la API de Groq");
  return (await res.json()).choices[0].message.content;
}

export async function generateWhalesAnalysis(params: {
  tradesCount: number;
  fundingPositive: Array<any>;
  fundingNegative: Array<any>;
  liqTotalUsd: number;
  liqBias: string;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Falta la API Key de Groq para usar la IA.");

  const prompt = `Analista on-chain. Resumen ejecutivo (en español argentino, jerga cripto) del flujo de ballenas y liquidaciones actuales.
DATOS:
- Liquidaciones recientes: $${params.liqTotalUsd.toLocaleString()} (Sesgo: ${params.liqBias})
- Monedas con Funding rate exageradamente positivo (Longs saturados): ${params.fundingPositive.map(f => f.symbol).join(", ")}
- Monedas con Funding negativo (Shorts saturados): ${params.fundingNegative.map(f => f.symbol).join(", ")}
- Cantidad de operaciones ballena recientes: ${params.tradesCount}

FORMATO SUGERIDO:
1. Evaluación del riesgo de liquidación masiva ("Squeeze").
2. Análisis rápido de las monedas con funding extremo (oportunidades de reversion).
3. Conclusión operativa. No excedas las 150 palabras.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 300 }),
  });
  if (!res.ok) throw new Error("Error en la API de Groq");
  return (await res.json()).choices[0].message.content;
}

export async function generateRiskAnalysis(params: {
  btcDom: number;
  fearGreed: number;
  fundingAvg: number;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Falta la API Key de Groq para usar la IA.");

  const prompt = `Gestor de riesgos cripto institucional. Explicá de forma detallada pero fácil de leer (español argentino) el riesgo macro actual del mercado.
DATOS:
- Dom BTC: ${params.btcDom.toFixed(1)}%
- Fear & Greed: ${params.fearGreed}
- Funding Promedio: ${(params.fundingAvg * 100).toFixed(4)}%

Si el funding promedio es > 0.015%, el mercado está muy apalancado en longs.
Si el Fear & Greed es > 75, hay euforia extrema.
Hacé un desglose claro de los riesgos sistémicos actuales y cómo debería proteger su cartera un trader minorista. Máximo 200 palabras.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.6, max_tokens: 350 }),
  });
  if (!res.ok) throw new Error("Error en la API de Groq");
  return (await res.json()).choices[0].message.content;
}

export async function generateScannerAnalysis(params: {
  bullish: Array<any>;
  bearish: Array<any>;
  topScores: Array<any>;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Falta la API Key de Groq para usar la IA.");

  const topBull = params.bullish.slice(0,3).map(x => x.base).join(", ");
  const topBear = params.bearish.slice(0,3).map(x => x.base).join(", ");
  const bestScoring = params.topScores.slice(0,3).map(x => `${x.base}(${x.score})`).join(", ");

  const prompt = `Sos un experto en análisis técnico cripto y escáner algorítmico. Dame un resumen ejecutivo en español argentino sobre las oportunidades detectadas AHORA en el escáner.
DATOS:
- Cantidad de señales alcistas: ${params.bullish.length} (Principales: ${topBull || "Ninguna"})
- Cantidad de señales bajistas: ${params.bearish.length} (Principales: ${topBear || "Ninguna"})
- Mejores Smart Scores del mercado: ${bestScoring}

Instrucciones: Explicá si el escáner muestra un sesgo direccional claro o si está mixto. Detallá qué significan estos setups para un day trader o swing trader. Mantenelo en 150-200 palabras y estructurá con viñetas claras.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 350 }),
  });
  if (!res.ok) throw new Error("Error en la API de Groq");
  return (await res.json()).choices[0].message.content;
}
