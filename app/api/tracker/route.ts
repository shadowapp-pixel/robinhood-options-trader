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

interface DailyCandles { closes: number[]; highs: number[]; lows: number[]; }

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
  const conditions: Condition[] = [];
  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';

  if (bullishBias) {
    direction = 'CALL';
    conditions.push({ label: 'Price above VWAP',                          pass: true });
    conditions.push({ label: 'Price above open (intraday uptrend)',        pass: true });
    conditions.push({ label: 'Range position ≤ 60 — not extended',        pass: rangePos <= 60 });
    conditions.push({ label: 'Within 1.5% of VWAP',                       pass: distFromVWAP < 1.5 });
    conditions.push({ label: 'Green candle with strong body (conviction)', pass: greenBody && bodyRatio >= 0.45 });
    conditions.push({ label: 'No bearish gap-down open',                   pass: !gapDown });
  } else if (bearishBias) {
    direction = 'PUT';
    conditions.push({ label: 'Price below VWAP',                          pass: true });
    conditions.push({ label: 'Price below open (intraday downtrend)',      pass: true });
    conditions.push({ label: 'Range position ≥ 40 — not extended',        pass: rangePos >= 40 });
    conditions.push({ label: 'Within 1.5% of VWAP',                       pass: distFromVWAP < 1.5 });
    conditions.push({ label: 'Red candle with strong body (conviction)',   pass: redBody && bodyRatio >= 0.45 });
    conditions.push({ label: 'No bullish gap-up open',                     pass: !gapUp });
  } else {
    conditions.push({ label: 'No clear intraday bias', pass: false });
  }

  // ── Chart pattern overlay (from daily candles) ────────────────────────────
  const bullPatterns = patterns.filter(p => p.type.startsWith('bullish'));
  const bearPatterns = patterns.filter(p => p.type.startsWith('bearish'));
  const topBull = bullPatterns[0];
  const topBear = bearPatterns[0];

  if (direction === 'CALL') {
    if (topBull) {
      conditions.push({ label: `Bullish chart pattern: ${topBull.name}`, pass: true });
    }
    if (topBear && topBear.type === 'bearish-reversal') {
      conditions.push({ label: `Bearish reversal warning: ${topBear.name}`, pass: false });
    }
  } else if (direction === 'PUT') {
    if (topBear) {
      conditions.push({ label: `Bearish chart pattern: ${topBear.name}`, pass: true });
    }
    if (topBull && topBull.type === 'bullish-reversal') {
      conditions.push({ label: `Bullish reversal warning: ${topBull.name}`, pass: false });
    }
  }

  // ── Confidence: 70% intraday, 30% pattern bias ────────────────────────────
  const baseConds    = conditions.filter(x => !x.label.includes('pattern') && !x.label.includes('warning'));
  const patternConds = conditions.filter(x => x.label.includes('pattern') || x.label.includes('warning'));

  const basePass    = baseConds.filter(x => x.pass).length;
  const patternPass = patternConds.filter(x => x.pass).length;

  const baseConf    = baseConds.length    > 0 ? basePass    / baseConds.length    : 0;
  const patternConf = patternConds.length > 0 ? patternPass / patternConds.length : baseConf;

  // Blend: if no patterns detected, use pure intraday; otherwise blend 70/30
  const bias       = patternBias(patterns); // -1..+1
  const blendRatio = patterns.length > 0 ? 0.30 : 0;
  const blended    = baseConf * (1 - blendRatio) + patternConf * blendRatio;

  // Small extra boost when pattern bias strongly agrees with intraday direction
  const alignBonus = (direction === 'CALL' && bias > 0.5) || (direction === 'PUT' && bias < -0.5) ? 0.05 : 0;

  const confidence = Math.min(100, Math.round((blended + alignBonus) * 100));
  const passCount  = conditions.filter(x => x.pass).length;
  const allPass    = passCount === conditions.length && conditions.length > 1;

  return {
    signal: allPass ? direction : ('NEUTRAL' as const),
    direction, conditions, allPass, confidence,
    indicators: {
      vwap:      parseFloat(vwap.toFixed(4)),
      ema8proxy: parseFloat(ema8proxy.toFixed(4)),
      rangePos:  parseFloat(rangePos.toFixed(1)),
    },
    patterns,  // expose detected patterns in the API response
  };
}

function buildSuggestions(
  symbol: string, price: number, changePercent: number,
  direction: string, signalConfidence: number, volTier: string,
  realOptions?: ATMOptions,
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
      const sig = runSignal(q.c, q.h, q.l, q.o, q.pc, patterns);

      // Fetch real options data if Tradier key is configured
      const realOptions = tradierKey
        ? await fetchATMOptionsCached(symbol, q.c, tradierKey)
        : undefined;

      const suggestions = buildSuggestions(symbol, q.c, q.dp, sig.direction, sig.confidence, volTier, realOptions);
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
