/**
 * Finnhub data fetching + technical indicator computation + chart pattern detection
 * Used exclusively by the AI Analysis agent pipeline (/api/analysis/stream)
 */
import { detectPatterns, summarizePatterns, type PatternResult } from './pattern-detection';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { PatternResult };

export interface CandleData {
  closes:     number[];
  highs:      number[];
  lows:       number[];
  opens:      number[];
  volumes:    number[];
  timestamps: number[];
}

export interface ComputedIndicators {
  rsi14:          number | null;
  macdLine:       number | null;
  macdSignal:     number | null;
  macdHistogram:  number | null;
  bollingerUpper: number | null;
  bollingerMid:   number | null;
  bollingerLower: number | null;
  sma20:          number | null;
  sma50:          number | null;
  ema12:          number | null;
  ema26:          number | null;
  volatility20:   number | null; // annualised % (20-day std dev of log returns)
}

export interface FundamentalsData {
  peRatioTTM:      number | null;
  pbRatio:         number | null;
  epsGrowth3Y:     number | null;
  revenueGrowth3Y: number | null;
  grossMargin:     number | null;
  week52High:      number | null;
  week52Low:       number | null;
  beta:            number | null;
  dividendYield:   number | null;
}

export interface NewsItem {
  headline: string;
  summary:  string;
  source:   string;
  datetime: number;
}

export interface SentimentData {
  buzz:           number | null;  // 0–1 social buzz score
  bullishPercent: number | null;
  bearishPercent: number | null;
}

export interface FinnhubBundle {
  symbol:        string;
  currentPrice:  number;
  changePercent: number;
  candles:       CandleData | null;
  indicators:    ComputedIndicators | null;
  fundamentals:  FundamentalsData | null;
  news:          NewsItem[];
  sentiment:     SentimentData | null;
  patterns:      PatternResult[];       // detected chart patterns
  patternSummary: string;               // human-readable summary for AI agents
  fetchedAt:     string;
}

// ─── Technical Indicator Math ─────────────────────────────────────────────────

/** Exponential Moving Average — returns array of EMA values (first value = SMA seed) */
function ema(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k   = 2 / (period + 1);
  const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const result: number[] = [seed];
  for (let i = period; i < values.length; i++) {
    result.push(values[i] * k + result[result.length - 1] * (1 - k));
  }
  return result;
}

function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, diff))  / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -diff)) / period;
  }
  if (avgLoss === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
}

function computeMACD(closes: number[]): { line: number | null; signal: number | null; histogram: number | null } {
  const empty = { line: null, signal: null, histogram: null };
  if (closes.length < 35) return empty; // need 26 for MACD + 9 for signal
  const ema12s = ema(closes, 12);
  const ema26s = ema(closes, 26);
  // Align both to the same dates (ema26s is shorter by 14)
  const overlap   = ema26s.length;
  const macdLine  = ema12s.slice(ema12s.length - overlap).map((v, i) => v - ema26s[i]);
  const signalArr = ema(macdLine, 9);
  if (macdLine.length === 0 || signalArr.length === 0) return empty;
  const last   = macdLine[macdLine.length - 1];
  const signal = signalArr[signalArr.length - 1];
  return {
    line:      parseFloat(last.toFixed(4)),
    signal:    parseFloat(signal.toFixed(4)),
    histogram: parseFloat((last - signal).toFixed(4)),
  };
}

function computeBollinger(closes: number[], period = 20): { upper: number | null; mid: number | null; lower: number | null } {
  if (closes.length < period) return { upper: null, mid: null, lower: null };
  const slice = closes.slice(-period);
  const mean  = slice.reduce((a, b) => a + b, 0) / period;
  const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  return {
    upper: parseFloat((mean + 2 * std).toFixed(2)),
    mid:   parseFloat(mean.toFixed(2)),
    lower: parseFloat((mean - 2 * std).toFixed(2)),
  };
}

function computeSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  return parseFloat((closes.slice(-period).reduce((a, b) => a + b, 0) / period).toFixed(2));
}

function computeVolatility(closes: number[], period = 20): number | null {
  if (closes.length < period + 1) return null;
  const slice   = closes.slice(-(period + 1));
  const returns = slice.slice(1).map((c, i) => Math.log(c / slice[i]));
  const mean    = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return parseFloat((Math.sqrt(variance * 252) * 100).toFixed(2)); // annualised %
}

function computeIndicators(candles: CandleData): ComputedIndicators {
  const c      = candles.closes;
  const ema12s = ema(c, 12);
  const ema26s = ema(c, 26);
  const bb     = computeBollinger(c);
  const macd   = computeMACD(c);
  return {
    rsi14:          computeRSI(c),
    macdLine:       macd.line,
    macdSignal:     macd.signal,
    macdHistogram:  macd.histogram,
    bollingerUpper: bb.upper,
    bollingerMid:   bb.mid,
    bollingerLower: bb.lower,
    sma20:          computeSMA(c, 20),
    sma50:          computeSMA(c, 50),
    ema12:          ema12s.length > 0 ? parseFloat(ema12s[ema12s.length - 1].toFixed(2)) : null,
    ema26:          ema26s.length > 0 ? parseFloat(ema26s[ema26s.length - 1].toFixed(2)) : null,
    volatility20:   computeVolatility(c),
  };
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

function unixNow(): number { return Math.floor(Date.now() / 1000); }
function unixDaysAgo(n: number): number { return unixNow() - n * 86_400; }
function isoDateDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ─── Main fetch function ──────────────────────────────────────────────────────

export async function fetchFinnhubBundle(
  symbol: string,
  apiKey: string,
  currentPrice: number,
  changePercent: number,
): Promise<FinnhubBundle> {
  const base = 'https://finnhub.io/api/v1';
  const tk   = `token=${apiKey}`;

  const [candleRes, metricRes, newsRes, sentRes] = await Promise.allSettled([
    fetch(`${base}/stock/candle?symbol=${symbol}&resolution=D&from=${unixDaysAgo(90)}&to=${unixNow()}&${tk}`, { cache: 'no-store' }),
    fetch(`${base}/stock/metric?symbol=${symbol}&metric=all&${tk}`, { cache: 'no-store' }),
    fetch(`${base}/company-news?symbol=${symbol}&from=${isoDateDaysAgo(7)}&to=${isoDateDaysAgo(0)}&${tk}`, { cache: 'no-store' }),
    fetch(`${base}/news-sentiment?symbol=${symbol}&${tk}`, { cache: 'no-store' }),
  ]);

  // ── Candles + indicators + chart patterns ────────────────────────────────
  let candles:    CandleData | null        = null;
  let indicators: ComputedIndicators | null = null;
  let patterns:   PatternResult[]           = [];
  if (candleRes.status === 'fulfilled' && candleRes.value.ok) {
    try {
      const d = await candleRes.value.json() as {
        s: string; c?: number[]; h?: number[]; l?: number[]; o?: number[]; v?: number[]; t?: number[];
      };
      if (d.s === 'ok' && d.c && d.c.length > 0) {
        candles    = { closes: d.c, highs: d.h!, lows: d.l!, opens: d.o!, volumes: d.v!, timestamps: d.t! };
        indicators = computeIndicators(candles);
        patterns   = detectPatterns(candles.closes, candles.highs, candles.lows);
      }
    } catch { /* ignore */ }
  }

  // ── Fundamentals ─────────────────────────────────────────────────────────
  let fundamentals: FundamentalsData | null = null;
  if (metricRes.status === 'fulfilled' && metricRes.value.ok) {
    try {
      const d = await metricRes.value.json() as { metric?: Record<string, number | null> };
      const m  = d.metric ?? {};
      fundamentals = {
        peRatioTTM:      m['peBasicExclExtraTTM']         ?? null,
        pbRatio:         m['pbAnnual']                     ?? null,
        epsGrowth3Y:     m['epsGrowth3Y']                  ?? null,
        revenueGrowth3Y: m['revenueGrowth3Y']              ?? null,
        grossMargin:     m['grossMarginTTM']               ?? null,
        week52High:      m['52WeekHigh']                   ?? null,
        week52Low:       m['52WeekLow']                    ?? null,
        beta:            m['beta']                         ?? null,
        dividendYield:   m['dividendYieldIndicatedAnnual'] ?? null,
      };
    } catch { /* ignore */ }
  }

  // ── News ──────────────────────────────────────────────────────────────────
  const news: NewsItem[] = [];
  if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
    try {
      const arr = await newsRes.value.json() as Array<{
        headline?: string; summary?: string; source?: string; datetime?: number;
      }>;
      if (Array.isArray(arr)) {
        arr.slice(0, 8).forEach(n => {
          if (n.headline) news.push({ headline: n.headline, summary: n.summary ?? '', source: n.source ?? '', datetime: n.datetime ?? 0 });
        });
      }
    } catch { /* ignore */ }
  }

  // ── Sentiment ─────────────────────────────────────────────────────────────
  let sentiment: SentimentData | null = null;
  if (sentRes.status === 'fulfilled' && sentRes.value.ok) {
    try {
      const d = await sentRes.value.json() as {
        buzz?:      { buzz?: number };
        sentiment?: { bullishPercent?: number; bearishPercent?: number };
      };
      sentiment = {
        buzz:           d.buzz?.buzz               ?? null,
        bullishPercent: d.sentiment?.bullishPercent ?? null,
        bearishPercent: d.sentiment?.bearishPercent ?? null,
      };
    } catch { /* ignore */ }
  }

  return {
    symbol, currentPrice, changePercent,
    candles, indicators, fundamentals, news, sentiment,
    patterns,
    patternSummary: summarizePatterns(patterns),
    fetchedAt: new Date().toISOString(),
  };
}
