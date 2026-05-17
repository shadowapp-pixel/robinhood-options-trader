import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getATMOptions, type ATMOptions } from '@/lib/tradier';
import { detectPatterns, patternBias, type PatternResult } from '@/lib/pattern-detection';

const CACHE_TTL         = 28;    // seconds — slightly under the 30s client refresh interval
const TRADIER_CACHE_TTL = 60;    // Tradier data is ~15 min delayed; 60 s extra cache is negligible
const CANDLE_CACHE_TTL  = 3_600; // 1 hour — daily candles change once per day

const WATCHLIST = [
  { symbol: 'AAPL',  name: 'Apple',           type: 'mag7',  volTier: 'low',    pro: false },
  { symbol: 'MSFT',  name: 'Microsoft',        type: 'mag7',  volTier: 'low',    pro: false },
  { symbol: 'GOOGL', name: 'Alphabet',         type: 'mag7',  volTier: 'low',    pro: false },
  { symbol: 'AMZN',  name: 'Amazon',           type: 'mag7',  volTier: 'medium', pro: false },
  { symbol: 'META',  name: 'Meta',             type: 'mag7',  volTier: 'medium', pro: false },
  { symbol: 'NVDA',  name: 'NVIDIA',           type: 'mag7',  volTier: 'high',   pro: false },
  { symbol: 'TSLA',  name: 'Tesla',            type: 'mag7',  volTier: 'high',   pro: false },
  { symbol: 'QQQ',   name: 'Nasdaq 100 ETF',   type: 'etf',   volTier: 'low',    pro: false },
  { symbol: 'SPY',   name: 'S&P 500 ETF',      type: 'etf',   volTier: 'low',    pro: false },
  { symbol: 'VXX',   name: 'VIX Futures ETF',  type: 'index', volTier: 'high',   pro: false },
];

const VOL_MOVE: Record<string, number> = {
  low:    0.003,
  medium: 0.005,
  high:   0.008,
};

type Quote = { c: number; h: number; l: number; o: number; pc: number; dp: number };

async function fetchATMOptionsCached(symbol: string, price: number, token: string): Promise<ATMOptions> {
  const cacheKey = `tradier:atm:${symbol}`;
  const cached   = await redis.get<ATMOptions>(cacheKey);
  if (cached) return cached;
  const data = await getATMOptions(symbol, price, token);
  await redis.set(cacheKey, data, { ex: TRADIER_CACHE_TTL });
  return data;
}

// ─── Daily indicator computation ─────────────────────────────────────────────

interface DailyCandles { closes: number[]; highs: number[]; lows: number[]; }

interface MACDResult {
  line:          number;
  signal:        number;
  histogram:     number;
  prevHistogram: number; // previous candle's histogram — detects expanding vs shrinking momentum
}

interface BollingerResult {
  upper:     number;
  mid:       number;
  lower:     number;
  percentB:  number; // 0=at lower band, 0.5=midline, 1=at upper band, >1 or <0 = outside band
  bandwidth: number; // (upper−lower)/mid × 100 — squeeze detector
}

function emaLocal(vals: number[], period: number): number[] {
  if (vals.length < period) return [];
  const k    = 2 / (period + 1);
  const seed = vals.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const out  = [seed];
  for (let i = period; i < vals.length; i++) {
    out.push(vals[i] * k + out[out.length - 1] * (1 - k));
  }
  return out;
}

/**
 * MACD 12/26/9 on daily closes.
 * Conservative: also captures previous histogram so we can detect
 * whether momentum is BUILDING (expanding histogram) vs stalling.
 */
function computeMACDLocal(closes: number[]): MACDResult | null {
  if (closes.length < 36) return null; // 26 for MACD + 9 for signal + 1 for prev
  const ema12 = emaLocal(closes, 12);
  const ema26 = emaLocal(closes, 26);
  const overlap  = ema26.length;
  const macdLine = ema12.slice(ema12.length - overlap).map((v, i) => v - ema26[i]);
  const sigLine  = emaLocal(macdLine, 9);
  if (macdLine.length < 2 || sigLine.length < 2) return null;

  const lastMacd = macdLine[macdLine.length - 1];
  const lastSig  = sigLine[sigLine.length - 1];
  const prevMacd = macdLine[macdLine.length - 2];
  const prevSig  = sigLine[sigLine.length - 2];

  return {
    line:          lastMacd,
    signal:        lastSig,
    histogram:     lastMacd - lastSig,
    prevHistogram: prevMacd - prevSig,
  };
}

/**
 * Bollinger Bands 20-period, 2.0σ (standard — provides reliable extreme readings).
 * Returns %B (position within band) and bandwidth (squeeze indicator).
 */
function computeBollingerLocal(closes: number[], period = 20): BollingerResult | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean  = slice.reduce((a, b) => a + b, 0) / period;
  const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  const upper = mean + 2.0 * std;
  const lower = mean - 2.0 * std;
  const cur   = closes[closes.length - 1];
  return {
    upper,
    mid:       mean,
    lower,
    percentB:  upper !== lower ? (cur - lower) / (upper - lower) : 0.5,
    bandwidth: mean > 0 ? ((upper - lower) / mean) * 100 : 0,
  };
}

/**
 * 20-day annualised volatility (%) from daily closes.
 * Used to estimate how long a price move will take.
 */
function computeVolatility20(closes: number[]): number | null {
  if (closes.length < 21) return null;
  const slice   = closes.slice(-21);
  const returns = slice.slice(1).map((c, i) => Math.log(c / slice[i]));
  const mean    = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance * 252) * 100; // annualised %
}

/**
 * Estimates how many trading hours it will take for the stock to move
 * from currentPrice to targetPrice, based on historical hourly volatility.
 *
 * Formula:  hourlyVol = annualisedVol / sqrt(252 × 6.5)
 *           estimatedHours = |move%| / hourlyVol%
 */
function estimateTimeToTarget(
  currentPrice: number,
  targetPrice:  number,
  annualisedVolPct: number | null,
): { label: string; moveNeeded: string } {
  const movePct = ((targetPrice - currentPrice) / currentPrice) * 100;
  const moveStr = `${movePct >= 0 ? '+' : ''}${movePct.toFixed(2)}%`;

  if (!annualisedVolPct || annualisedVolPct <= 0) {
    return { label: '—', moveNeeded: moveStr };
  }

  // Convert annualised vol → hourly vol (6.5 trading hours/day, 252 trading days/year)
  const hourlyVolPct = annualisedVolPct / Math.sqrt(252 * 6.5);
  const hours        = Math.abs(movePct) / hourlyVolPct;

  let label: string;
  if      (hours < 0.33) label = '< 20 min';
  else if (hours < 0.58) label = '~30 min';
  else if (hours < 0.83) label = '~45 min';
  else if (hours < 1.25) label = '~1 hour';
  else if (hours < 1.75) label = '~1–2 hours';
  else if (hours < 2.5)  label = '~2 hours';
  else if (hours < 3.5)  label = '~3 hours';
  else if (hours < 5.0)  label = '~4 hours';
  else if (hours < 6.5)  label = '~5–6 hours';
  else                   label = 'Multi-session';

  return { label, moveNeeded: moveStr };
}

async function fetchDailyCandles(symbol: string, apiKey: string): Promise<DailyCandles | null> {
  const cacheKey = `candles:daily:${symbol}`;
  const cached   = await redis.get<DailyCandles>(cacheKey);
  if (cached) return cached;

  const now  = Math.floor(Date.now() / 1000);
  const from = now - 60 * 86_400; // 60 days of daily candles
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${now}&token=${apiKey}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const d = await res.json() as { s: string; c?: number[]; h?: number[]; l?: number[] };
    if (d.s !== 'ok' || !d.c?.length) return null;
    const candles: DailyCandles = { closes: d.c, highs: d.h!, lows: d.l! };
    await redis.set(cacheKey, candles, { ex: CANDLE_CACHE_TTL });
    return candles;
  } catch { return null; }
}

async function fetchQuote(symbol: string, apiKey: string): Promise<Quote> {
  const cacheKey = `quote:${symbol}`;

  // Check Redis cache first — shared across all serverless instances & users
  const cached = await redis.get<Quote>(cacheKey);
  if (cached) return cached;

  // Cache miss — call Finnhub and store result
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
  const res  = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json() as Quote;
  if (!data.c || data.c === 0) throw new Error('No quote data');

  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
}

function runSignal(
  c: number, h: number, l: number, o: number, pc: number,
  patterns: PatternResult[] = [],
  macd: MACDResult | null = null,
  bb: BollingerResult | null = null,
) {
  const vwap         = (h + l + c) / 3;
  const ema8proxy    = o;
  const rangeSpan    = h - l;
  const rangePos     = rangeSpan > 0 ? ((c - l) / rangeSpan) * 100 : 50;
  const distFromVWAP = Math.abs((c - vwap) / vwap) * 100;

  // ── Intraday candle analysis ──────────────────────────────────────────────
  const gapUp      = pc > 0 && o > pc * 1.005;
  const gapDown    = pc > 0 && o < pc * 0.995;
  const bodySize   = Math.abs(c - o);
  const totalRange = Math.max(h - l, 0.01);
  const bodyRatio  = bodySize / totalRange; // 0–1; >0.5 = strong conviction candle
  const greenBody  = c > o;
  const redBody    = c < o;

  const bullishBias = c > vwap && c > ema8proxy;
  const bearishBias = c < vwap && c < ema8proxy;

  type Condition = { label: string; pass: boolean };
  const intradayConds:  Condition[] = [];
  const technicalConds: Condition[] = []; // MACD + Bollinger (daily)
  const patternConds:   Condition[] = []; // Chart patterns (daily)
  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';

  if (bullishBias) {
    direction = 'CALL';
    intradayConds.push({ label: 'Price above VWAP',                          pass: true });
    intradayConds.push({ label: 'Price above open (intraday uptrend)',        pass: true });
    intradayConds.push({ label: 'Range position ≤ 60 — not extended',        pass: rangePos <= 60 });
    intradayConds.push({ label: 'Within 1.5% of VWAP',                       pass: distFromVWAP < 1.5 });
    intradayConds.push({ label: 'Green candle with strong body (conviction)', pass: greenBody && bodyRatio >= 0.45 });
    intradayConds.push({ label: 'No bearish gap-down open',                   pass: !gapDown });
  } else if (bearishBias) {
    direction = 'PUT';
    intradayConds.push({ label: 'Price below VWAP',                          pass: true });
    intradayConds.push({ label: 'Price below open (intraday downtrend)',      pass: true });
    intradayConds.push({ label: 'Range position ≥ 40 — not extended',        pass: rangePos >= 40 });
    intradayConds.push({ label: 'Within 1.5% of VWAP',                       pass: distFromVWAP < 1.5 });
    intradayConds.push({ label: 'Red candle with strong body (conviction)',   pass: redBody && bodyRatio >= 0.45 });
    intradayConds.push({ label: 'No bullish gap-up open',                     pass: !gapUp });
  } else {
    intradayConds.push({ label: 'No clear intraday bias', pass: false });
  }

  // ── MACD crossover + momentum expansion (daily) ───────────────────────────
  // Conservative: require min 0.1% of price spread to filter noise
  const minMACDSpread = c * 0.001;
  if (macd && direction !== 'NEUTRAL') {
    if (direction === 'CALL') {
      technicalConds.push({
        label: 'MACD bullish crossover (daily)',
        pass:  macd.line > macd.signal && (macd.line - macd.signal) >= minMACDSpread,
      });
      technicalConds.push({
        label: 'MACD momentum building (histogram expanding)',
        pass:  macd.histogram > macd.prevHistogram,
      });
    } else {
      technicalConds.push({
        label: 'MACD bearish crossover (daily)',
        pass:  macd.line < macd.signal && (macd.signal - macd.line) >= minMACDSpread,
      });
      technicalConds.push({
        label: 'MACD momentum building (histogram expanding)',
        pass:  macd.histogram < macd.prevHistogram, // more negative = bearish expansion
      });
    }
  }

  // ── Bollinger Band position (daily) ───────────────────────────────────────
  // Conservative: bandwidth ≥ 4% to avoid low-vol squeeze whipsaws
  if (bb && direction !== 'NEUTRAL') {
    const noSqueeze = bb.bandwidth >= 4.0;
    if (direction === 'CALL') {
      // Avoid entering when price is already overbought (> 60% of band)
      technicalConds.push({
        label: 'Bollinger %B not overbought (< 60%)',
        pass:  bb.percentB < 0.60,
      });
      technicalConds.push({
        label: 'Bollinger bands wide — no squeeze',
        pass:  noSqueeze,
      });
      // Bonus: deeply oversold = high-probability mean-reversion entry
      if (bb.percentB < 0.30) {
        technicalConds.push({ label: 'Bollinger %B oversold (< 30%) — high-prob entry', pass: true });
      }
    } else {
      // Avoid entering when price is already oversold (< 40% of band)
      technicalConds.push({
        label: 'Bollinger %B not oversold (> 40%)',
        pass:  bb.percentB > 0.40,
      });
      technicalConds.push({
        label: 'Bollinger bands wide — no squeeze',
        pass:  noSqueeze,
      });
      // Bonus: deeply overbought = high-probability mean-reversion entry
      if (bb.percentB > 0.70) {
        technicalConds.push({ label: 'Bollinger %B overbought (> 70%) — high-prob entry', pass: true });
      }
    }
  }

  // ── Chart pattern overlay (from daily candles) ────────────────────────────
  const bullPatterns = patterns.filter(p => p.type.startsWith('bullish'));
  const bearPatterns = patterns.filter(p => p.type.startsWith('bearish'));
  const topBull = bullPatterns[0];
  const topBear = bearPatterns[0];

  if (direction === 'CALL') {
    if (topBull) {
      patternConds.push({ label: `Bullish chart pattern: ${topBull.name}`, pass: true });
    }
    if (topBear && topBear.type === 'bearish-reversal') {
      patternConds.push({ label: `Bearish reversal warning: ${topBear.name}`, pass: false });
    }
  } else if (direction === 'PUT') {
    if (topBear) {
      patternConds.push({ label: `Bearish chart pattern: ${topBear.name}`, pass: true });
    }
    if (topBull && topBull.type === 'bullish-reversal') {
      patternConds.push({ label: `Bullish reversal warning: ${topBull.name}`, pass: false });
    }
  }

  // ── Three-tier confidence: 50% intraday / 25% MACD+BB / 25% patterns ─────
  const intradayScore = intradayConds.length > 0
    ? intradayConds.filter(x => x.pass).length / intradayConds.length
    : 0;

  // When daily data is unavailable, fall back to intraday score so we don't penalise
  const techScore = technicalConds.length > 0
    ? technicalConds.filter(x => x.pass).length / technicalConds.length
    : intradayScore;

  const bias = patternBias(patterns); // -1..+1
  const patScore = patternConds.length > 0
    ? patternConds.filter(x => x.pass).length / patternConds.length
    : intradayScore;

  // Small alignment bonus when pattern bias strongly agrees with intraday direction
  const alignBonus = (direction === 'CALL' && bias > 0.5) || (direction === 'PUT' && bias < -0.5) ? 0.05 : 0;

  const confidence = Math.min(100, Math.round(
    (intradayScore * 0.50 + techScore * 0.25 + patScore * 0.25 + alignBonus) * 100,
  ));

  // Prime signal: ALL intraday conditions must pass AND blended confidence ≥ 80
  const allIntradayPass = intradayConds.length > 1 && intradayConds.every(x => x.pass);
  const allPass = allIntradayPass && confidence >= 80;

  const conditions = [...intradayConds, ...technicalConds, ...patternConds];

  return {
    signal: allPass ? direction : ('NEUTRAL' as const),
    direction, conditions, allPass, confidence,
    indicators: {
      vwap:      parseFloat(vwap.toFixed(4)),
      ema8proxy: parseFloat(ema8proxy.toFixed(4)),
      rangePos:  parseFloat(rangePos.toFixed(1)),
    },
    patterns,
  };
}

function buildSuggestions(
  symbol: string, price: number, changePercent: number,
  direction: string, signalConfidence: number, volTier: string,
  realOptions?: ATMOptions,
  vol?: number | null,
) {
  const move = VOL_MOVE[volTier] ?? VOL_MOVE.medium;

  const callAsk    = realOptions?.call?.ask  && realOptions.call.ask  > 0 ? realOptions.call.ask  : price * move * 2;
  const putAsk     = realOptions?.put?.ask   && realOptions.put.ask   > 0 ? realOptions.put.ask   : price * move * 2;
  const callStrike = realOptions?.call?.strike ?? price;
  const putStrike  = realOptions?.put?.strike  ?? price;
  const expLabel   = realOptions?.expiration ? `Exp ${realOptions.expiration}` : '0DTE (Today)';

  const callContractCost = parseFloat((callAsk * 100).toFixed(2));
  const putContractCost  = parseFloat((putAsk  * 100).toFixed(2));
  const callExit = parseFloat((price * (1 + move)).toFixed(2));
  const putExit  = parseFloat((price * (1 - move)).toFixed(2));

  const callConf = direction === 'CALL'
    ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2)
    : Math.max(40, signalConfidence - 20);
  const putConf = direction === 'PUT'
    ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2)
    : Math.max(40, signalConfidence - 20);

  const fmtStrike = (strike: number, isReal: boolean) =>
    isReal ? `$${strike % 1 === 0 ? strike.toFixed(0) : strike.toFixed(2)}` : `~$${Math.round(strike)} ATM`;

  const callTime = estimateTimeToTarget(price, callExit, vol ?? null);
  const putTime  = estimateTimeToTarget(price, putExit,  vol ?? null);

  return [
    {
      type: 'CALL',
      title: `${symbol} Call Option — ${direction === 'CALL' ? 'Bullish Momentum' : 'Counter-trend Play'}`,
      description: direction === 'CALL'
        ? `Uptrend confirmed. Stock needs to reach $${callExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${callExit} to capture 20% premium gain.`,
      entryPrice: price.toFixed(2), exitPrice: callExit.toFixed(2),
      premiumPerShare: callAsk.toFixed(2), contractCost: callContractCost.toFixed(2),
      contractTarget: (callContractCost * 1.2).toFixed(2),
      strike: fmtStrike(callStrike, !!realOptions?.call),
      timeframe: expLabel, confidence: parseFloat(callConf.toFixed(2)),
      estimatedTime: callTime.label, moveNeeded: callTime.moveNeeded,
    },
    {
      type: 'PUT',
      title: `${symbol} Put Option — ${direction === 'PUT' ? 'Bearish Pressure' : 'Counter-trend Play'}`,
      description: direction === 'PUT'
        ? `Downtrend confirmed. Stock needs to reach $${putExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${putExit} to capture 20% premium gain.`,
      entryPrice: price.toFixed(2), exitPrice: putExit.toFixed(2),
      premiumPerShare: putAsk.toFixed(2), contractCost: putContractCost.toFixed(2),
      contractTarget: (putContractCost * 1.2).toFixed(2),
      strike: fmtStrike(putStrike, !!realOptions?.put),
      timeframe: expLabel, confidence: parseFloat(putConf.toFixed(2)),
      estimatedTime: putTime.label, moveNeeded: putTime.moveNeeded,
    },
  ];
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
  }

  // ── Market Tracker is fully public — no auth check needed ──────────────────
  const tradierKey = process.env.TRADIER_SANDBOX_KEY;

  // ── Fetch live quotes + daily candles for all tickers ────────────────────
  const settled = await Promise.allSettled(
    WATCHLIST.map(async ({ symbol, name, type, volTier }) => {
      const [q, candles] = await Promise.all([
        fetchQuote(symbol, apiKey),
        fetchDailyCandles(symbol, apiKey),
      ]);
      const patterns = candles
        ? detectPatterns(candles.closes, candles.highs, candles.lows)
        : [];
      const macd = candles ? computeMACDLocal(candles.closes)     : null;
      const bb   = candles ? computeBollingerLocal(candles.closes) : null;
      const vol  = candles ? computeVolatility20(candles.closes)   : null;
      const sig  = runSignal(q.c, q.h, q.l, q.o, q.pc, patterns, macd, bb);

      // Fetch real options data if Tradier key is configured
      const realOptions = tradierKey
        ? await fetchATMOptionsCached(symbol, q.c, tradierKey)
        : undefined;

      const suggestions = buildSuggestions(symbol, q.c, q.dp, sig.direction, sig.confidence, volTier, realOptions, vol);
      return {
        symbol, name, type, locked: false,
        price: q.c, dayOpen: q.o, dayHigh: q.h, dayLow: q.l, prevClose: q.pc,
        changePercent: q.dp,
        indicators: sig.indicators, signal: sig.signal, direction: sig.direction,
        conditions: sig.conditions, allPass: sig.allPass, confidence: sig.confidence,
        suggestions, error: null,
      };
    })
  );

  const allData = WATCHLIST.map(({ symbol, name, type }, i) => {
    const result = settled[i];
    if (result.status === 'fulfilled') return result.value;
    return {
      symbol, name, type, locked: false,
      price: null, dayOpen: null, dayHigh: null, dayLow: null, prevClose: null,
      changePercent: null, indicators: null,
      signal: 'NEUTRAL', direction: 'NEUTRAL',
      conditions: [], allPass: false, confidence: 0, suggestions: [],
      error: (result.reason as Error).message,
    };
  });

  return NextResponse.json({ data: allData, timestamp: new Date().toISOString(), isPro: true });
}
