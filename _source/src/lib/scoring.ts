// Smart Score engine — composite 0–100 from normalized signals.
// All inputs derived from Binance klines + funding/OI + macro.

import type { Kline } from "./api";

// ---------- Indicators ----------
export const sma = (arr: number[], period: number) => {
  if (arr.length < period) return NaN;
  let s = 0;
  for (let i = arr.length - period; i < arr.length; i++) s += arr[i];
  return s / period;
};

export const rsi = (closes: number[], period = 14) => {
  if (closes.length < period + 1) return 50;
  let gain = 0, loss = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff; else loss -= diff;
  }
  const avgG = gain / period;
  const avgL = loss / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
};

export const ema = (arr: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const out: number[] = [];
  arr.forEach((v, i) => {
    if (i === 0) out.push(v);
    else out.push(v * k + out[i - 1] * (1 - k));
  });
  return out;
};

export const macdSlope = (closes: number[]) => {
  if (closes.length < 35) return 0;
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const macdLine = e12.map((v, i) => v - e26[i]);
  const sig = ema(macdLine, 9);
  const hist = macdLine.map((v, i) => v - sig[i]);
  // slope = last - 3 bars ago, normalized by price
  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 4] ?? last;
  const px = closes[closes.length - 1] || 1;
  return ((last - prev) / px) * 1000;
};

export const atr = (klines: Kline[], period = 14) => {
  if (klines.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < klines.length; i++) {
    const k = klines[i], p = klines[i - 1];
    trs.push(Math.max(k.high - k.low, Math.abs(k.high - p.close), Math.abs(k.low - p.close)));
  }
  return sma(trs, Math.min(period, trs.length));
};

// Higher-Highs / Higher-Lows structure score on swing pivots
export const structureScore = (klines: Kline[]) => {
  if (klines.length < 20) return 50;
  const highs = klines.map((k) => k.high);
  const lows = klines.map((k) => k.low);
  // pick last 5 swing highs / lows using a simple 3-bar pivot
  const pivots = (arr: number[], type: "high" | "low") => {
    const out: { i: number; v: number }[] = [];
    for (let i = 2; i < arr.length - 2; i++) {
      const v = arr[i];
      const cond = type === "high"
        ? v > arr[i - 1] && v > arr[i - 2] && v > arr[i + 1] && v > arr[i + 2]
        : v < arr[i - 1] && v < arr[i - 2] && v < arr[i + 1] && v < arr[i + 2];
      if (cond) out.push({ i, v });
    }
    return out.slice(-4);
  };
  const ph = pivots(highs, "high");
  const pl = pivots(lows, "low");
  let score = 50;
  if (ph.length >= 2) {
    const up = ph[ph.length - 1].v > ph[ph.length - 2].v;
    score += up ? 18 : -18;
  }
  if (pl.length >= 2) {
    const up = pl[pl.length - 1].v > pl[pl.length - 2].v;
    score += up ? 18 : -18;
  }
  // bias by latest close vs sma50
  const closes = klines.map((k) => k.close);
  const s50 = sma(closes, Math.min(50, closes.length));
  if (!isNaN(s50)) score += closes[closes.length - 1] > s50 ? 8 : -8;
  return Math.max(0, Math.min(100, score));
};

export const momentumScore = (closes: number[]) => {
  if (closes.length < 30) return 50;
  const r = rsi(closes, 14);
  const ms = macdSlope(closes);
  // Map RSI 30→0, 50→50, 70→90, then clamp; combine with MACD slope
  const rsiPart = Math.max(0, Math.min(100, (r - 30) * 2.5));
  const macdPart = Math.max(0, Math.min(100, 50 + ms * 10));
  return 0.6 * rsiPart + 0.4 * macdPart;
};

export const volumeAnomalyScore = (klines: Kline[]) => {
  if (klines.length < 22) return 50;
  const vols = klines.map((k) => k.quoteVolume);
  const last = vols[vols.length - 1];
  const baseline = sma(vols.slice(0, -1), 20);
  if (!baseline) return 50;
  const ratio = last / baseline;
  // ratio 0.5 → 25, 1 → 50, 2 → 75, 3+ → 95
  const score = 50 + Math.log2(Math.max(0.25, ratio)) * 25;
  return Math.max(0, Math.min(100, score));
};

// Relative strength of asset's 30-period return vs BTC's
export const relativeStrengthScore = (closes: number[], btcCloses: number[]) => {
  const period = Math.min(30, closes.length - 1, btcCloses.length - 1);
  if (period < 5) return 50;
  const ret = (closes[closes.length - 1] / closes[closes.length - 1 - period]) - 1;
  const btcRet = (btcCloses[btcCloses.length - 1] / btcCloses[btcCloses.length - 1 - period]) - 1;
  const diff = ret - btcRet; // outperformance
  // ±15% diff maps to 0..100
  return Math.max(0, Math.min(100, 50 + (diff * 100) * 3.3));
};

// Funding bias: extreme positive funding => contrarian bearish
export const fundingScore = (rate: number | undefined) => {
  if (rate == null) return 50;
  // typical funding 0.0001 (0.01%) — extreme >0.05%
  const pct = rate * 100;
  // Slight positive funding (0–0.02) is healthy → 60
  // Very high (>0.08) → 20 ; very negative (<-0.05) → 80 (contrarian long)
  const score = 60 - pct * 600;
  return Math.max(0, Math.min(100, score));
};

// OI delta: rising OI with price up → bullish (high score)
export const oiScore = (oiSeries: number[], priceSeries: number[]) => {
  if (oiSeries.length < 6 || priceSeries.length < 6) return 50;
  const oiChange = (oiSeries[oiSeries.length - 1] / oiSeries[oiSeries.length - 6]) - 1;
  const pxChange = (priceSeries[priceSeries.length - 1] / priceSeries[priceSeries.length - 6]) - 1;
  // both up → 80; oi up px down → 30 (squeeze risk); both down → 50
  if (oiChange > 0 && pxChange > 0) return Math.min(95, 60 + oiChange * 200);
  if (oiChange > 0 && pxChange < 0) return Math.max(15, 40 + pxChange * 200);
  if (oiChange < 0 && pxChange < 0) return 45;
  return 55;
};

// Macro context: BTC.D trend & FNG
export const macroScore = (btcDominance: number | undefined, fng: number | undefined, isBtc: boolean) => {
  let s = 50;
  if (fng != null) {
    // Extreme fear (<25) is contrarian bullish → +15; extreme greed (>75) → -10
    if (fng < 25) s += 15;
    else if (fng < 45) s += 5;
    else if (fng > 75) s -= 10;
  }
  if (btcDominance != null) {
    // For alts: rising dominance is bad; for BTC: rising dominance is good
    // We don't have trend here, just absolute. Neutralize.
    if (!isBtc && btcDominance > 55) s -= 5;
    if (isBtc && btcDominance > 55) s += 5;
  }
  return Math.max(0, Math.min(100, s));
};

export const sentimentScore = (newsScore: number | undefined) => {
  if (newsScore == null) return 50;
  return Math.max(0, Math.min(100, newsScore));
};

// ---------- Composite ----------
export interface SmartScoreInput {
  klines4h: Kline[];                  // for structure & volume
  klines1d: Kline[];                  // for momentum & relStrength
  btcKlines1d: Kline[];               // benchmark
  fundingRate?: number;
  oiSeries?: number[];
  oiPriceSeries?: number[];
  btcDominance?: number;
  fearGreed?: number;
  newsSentiment?: number;
  isBtc?: boolean;
}

export interface SmartScoreBreakdown {
  total: number;
  structure: number;
  momentum: number;
  volume: number;
  relStrength: number;
  funding: number;
  oi: number;
  macro: number;
  sentiment: number;
}

export const computeSmartScore = (input: SmartScoreInput): SmartScoreBreakdown => {
  const closes1d = input.klines1d.map((k) => k.close);
  const btcCloses1d = input.btcKlines1d.map((k) => k.close);

  const structure = structureScore(input.klines4h);
  const momentum = momentumScore(closes1d);
  const volume = volumeAnomalyScore(input.klines4h);
  const relStrength = relativeStrengthScore(closes1d, btcCloses1d);
  const funding = fundingScore(input.fundingRate);
  const oi = input.oiSeries && input.oiPriceSeries
    ? oiScore(input.oiSeries, input.oiPriceSeries)
    : 50;
  const macro = macroScore(input.btcDominance, input.fearGreed, !!input.isBtc);
  const sentiment = sentimentScore(input.newsSentiment);

  const total =
    structure * 0.20 +
    momentum * 0.15 +
    volume * 0.15 +
    relStrength * 0.15 +
    funding * 0.10 +
    oi * 0.10 +
    macro * 0.10 +
    sentiment * 0.05;

  return {
    total: Math.round(total),
    structure: Math.round(structure),
    momentum: Math.round(momentum),
    volume: Math.round(volume),
    relStrength: Math.round(relStrength),
    funding: Math.round(funding),
    oi: Math.round(oi),
    macro: Math.round(macro),
    sentiment: Math.round(sentiment),
  };
};

// ---------- Pattern detection (for opportunity feed) ----------
export type PatternType =
  | "Barrida de liquidez"
  | "Pico de volumen"
  | "Zona de ruptura"
  | "Bloque de órdenes"
  | "Cambio de momentum"
  | "Expansión de volatilidad"
  | "Ruptura falsa"
  | "Acumulación";

export interface DetectedPattern {
  type: PatternType;
  symbol: string;
  level: number;
  confidence: number;     // 0–100
  direction: "bullish" | "bearish";
  description: string;
  detectedAt: number;
}

export const detectPatterns = (symbol: string, klines: Kline[]): DetectedPattern[] => {
  const out: DetectedPattern[] = [];
  if (klines.length < 30) return out;
  const closes = klines.map((k) => k.close);
  const highs = klines.map((k) => k.high);
  const lows = klines.map((k) => k.low);
  const vols = klines.map((k) => k.quoteVolume);
  const last = klines[klines.length - 1];
  const prev = klines[klines.length - 2];

  const recentHigh = Math.max(...highs.slice(-20, -1));
  const recentLow = Math.min(...lows.slice(-20, -1));
  const avgVol = sma(vols.slice(-21, -1), 20);
  const r = rsi(closes, 14);
  const a = atr(klines, 14);
  const lastRange = last.high - last.low;

  // Liquidity grab: wick beyond range then close back inside
  if (last.high > recentHigh && last.close < recentHigh) {
    out.push({
      type: "Barrida de liquidez",
      symbol,
      level: recentHigh,
      confidence: 75,
      direction: "bearish",
      description: `Barrió liquidez sobre ${recentHigh.toFixed(2)} y revirtió`,
      detectedAt: last.closeTime,
    });
  }
  if (last.low < recentLow && last.close > recentLow) {
    out.push({
      type: "Barrida de liquidez",
      symbol,
      level: recentLow,
      confidence: 75,
      direction: "bullish",
      description: `Barrió liquidez bajo ${recentLow.toFixed(2)} y recuperó`,
      detectedAt: last.closeTime,
    });
  }
  // Volume spike
  if (last.quoteVolume > avgVol * 2.2) {
    out.push({
      type: "Pico de volumen",
      symbol,
      level: last.close,
      confidence: 70,
      direction: last.close > last.open ? "bullish" : "bearish",
      description: `Volumen ${(last.quoteVolume / avgVol).toFixed(1)}× sobre la media de 20 barras`,
      detectedAt: last.closeTime,
    });
  }
  // Breakout
  if (last.close > recentHigh && prev.close < recentHigh) {
    out.push({
      type: "Zona de ruptura",
      symbol,
      level: recentHigh,
      confidence: 80,
      direction: "bullish",
      description: `Cerró sobre resistencia de 20 barras en ${recentHigh.toFixed(2)}`,
      detectedAt: last.closeTime,
    });
  }
  // Volatility expansion
  if (a > 0 && lastRange > a * 1.8) {
    out.push({
      type: "Expansión de volatilidad",
      symbol,
      level: last.close,
      confidence: 65,
      direction: last.close > last.open ? "bullish" : "bearish",
      description: `Rango ${(lastRange / a).toFixed(1)}× ATR — posible cambio de régimen`,
      detectedAt: last.closeTime,
    });
  }
  // Momentum shift via RSI extremes
  if (r > 70) {
    out.push({
      type: "Cambio de momentum",
      symbol,
      level: last.close,
      confidence: 60,
      direction: "bearish",
      description: `RSI ${r.toFixed(0)} — sobrecomprado, atención a distribución`,
      detectedAt: last.closeTime,
    });
  } else if (r < 30) {
    out.push({
      type: "Cambio de momentum",
      symbol,
      level: last.close,
      confidence: 60,
      direction: "bullish",
      description: `RSI ${r.toFixed(0)} — sobrevendido, atención a acumulación`,
      detectedAt: last.closeTime,
    });
  }

  return out;
};

// ---------- Risk verdict ----------
export type RiskVerdict = "A" | "B" | "C" | "Reject";
export interface RiskAssessment {
  verdict: RiskVerdict;
  rr: number;
  reasons: string[];
  warnings: string[];
}

export const assessTrade = (params: {
  entry: number;
  stop: number;
  target: number;
  side: "long" | "short";
  atrValue: number;
  fundingRate?: number;
  correlationCount?: number;
  volatilityPercentile?: number;   // 0..100
}): RiskAssessment => {
  const { entry, stop, target, side, atrValue, fundingRate, correlationCount, volatilityPercentile } = params;
  const risk = side === "long" ? entry - stop : stop - entry;
  const reward = side === "long" ? target - entry : entry - target;
  const rr = risk > 0 ? reward / risk : 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (risk <= 0) return { verdict: "Reject", rr: 0, reasons: ["El stop está del lado equivocado de la entrada"], warnings: [] };
  if (reward <= 0) return { verdict: "Reject", rr: 0, reasons: ["El objetivo está del lado equivocado de la entrada"], warnings: [] };

  // Stop too tight vs ATR
  if (atrValue > 0 && risk < atrValue * 0.4) warnings.push(`Stop a solo ${(risk / atrValue).toFixed(2)}× ATR — probable que te saquen con mecha`);
  if (atrValue > 0 && risk > atrValue * 4) warnings.push(`Stop a ${(risk / atrValue).toFixed(1)}× ATR — sobredimensionado`);

  if (rr >= 3) reasons.push(`Excelente R:R de ${rr.toFixed(2)}`);
  else if (rr >= 2) reasons.push(`Buen R:R de ${rr.toFixed(2)}`);
  else if (rr >= 1.5) reasons.push(`R:R aceptable de ${rr.toFixed(2)}`);
  else warnings.push(`R:R de solo ${rr.toFixed(2)} — debajo del mínimo institucional`);

  if (fundingRate != null) {
    const pct = fundingRate * 100;
    if (side === "long" && pct > 0.05) warnings.push(`Funding ${pct.toFixed(3)}% — largos saturados`);
    if (side === "short" && pct < -0.03) warnings.push(`Funding ${pct.toFixed(3)}% — cortos saturados`);
  }
  if (correlationCount && correlationCount > 3) warnings.push(`${correlationCount} posiciones correlacionadas — exposición concentrada`);
  if (volatilityPercentile != null && volatilityPercentile > 85) warnings.push(`Volatilidad en el percentil top 15% — riesgo de slippage y mechas`);

  let verdict: RiskVerdict;
  if (rr < 1.2 || warnings.length >= 4) verdict = "Reject";
  else if (rr >= 2.5 && warnings.length === 0) verdict = "A";
  else if (rr >= 1.8 && warnings.length <= 1) verdict = "B";
  else verdict = "C";

  return { verdict, rr, reasons, warnings };
};

// ---------- Real Correlation Matrix ----------
export const computeReturns = (closes: number[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  return returns;
};

export const pearsonCorrelation = (a: number[], b: number[]): number => {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;

  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }

  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt(
    (n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
};

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][]; // [i][j] = correlation between symbol i and symbol j
}

export const computeCorrelationMatrix = (
  klinesMap: Record<string, Kline[]>
): CorrelationMatrix => {
  const symbols = Object.keys(klinesMap).filter(s => klinesMap[s]?.length >= 10);
  const returnsMap: Record<string, number[]> = {};

  symbols.forEach(s => {
    returnsMap[s] = computeReturns(klinesMap[s].map(k => k.close));
  });

  const matrix: number[][] = [];
  for (let i = 0; i < symbols.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < symbols.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else if (j < i) {
        matrix[i][j] = matrix[j][i]; // Symmetric
      } else {
        matrix[i][j] = pearsonCorrelation(returnsMap[symbols[i]], returnsMap[symbols[j]]);
      }
    }
  }

  return { symbols, matrix };
};

