import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isProUser } from '@/lib/auth';
import { redis } from '@/lib/redis';

const CACHE_TTL = 28; // seconds — slightly under the 30s client refresh interval

const WATCHLIST = [
  { symbol: 'AAPL',  name: 'Apple',           type: 'mag7',  volTier: 'low',    pro: true  },
  { symbol: 'MSFT',  name: 'Microsoft',        type: 'mag7',  volTier: 'low',    pro: true  },
  { symbol: 'GOOGL', name: 'Alphabet',         type: 'mag7',  volTier: 'low',    pro: true  },
  { symbol: 'AMZN',  name: 'Amazon',           type: 'mag7',  volTier: 'medium', pro: true  },
  { symbol: 'META',  name: 'Meta',             type: 'mag7',  volTier: 'medium', pro: true  },
  { symbol: 'NVDA',  name: 'NVIDIA',           type: 'mag7',  volTier: 'high',   pro: true  },
  { symbol: 'TSLA',  name: 'Tesla',            type: 'mag7',  volTier: 'high',   pro: true  },
  { symbol: 'QQQ',   name: 'Nasdaq 100 ETF',   type: 'etf',   volTier: 'low',    pro: false },
  { symbol: 'SPY',   name: 'S&P 500 ETF',      type: 'etf',   volTier: 'low',    pro: false },
  { symbol: 'VXX',   name: 'VIX Futures ETF',  type: 'index', volTier: 'high',   pro: true  },
];

const VOL_MOVE: Record<string, number> = {
  low:    0.003,
  medium: 0.005,
  high:   0.008,
};

type Quote = { c: number; h: number; l: number; o: number; pc: number; dp: number };

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

function runSignal(c: number, h: number, l: number, o: number) {
  const vwap         = (h + l + c) / 3;
  const ema8proxy    = o;
  const rangeSpan    = h - l;
  const rangePos     = rangeSpan > 0 ? ((c - l) / rangeSpan) * 100 : 50;
  const distFromVWAP = Math.abs((c - vwap) / vwap) * 100;

  const bullishBias = c > vwap && c > ema8proxy;
  const bearishBias = c < vwap && c < ema8proxy;

  type Condition = { label: string; pass: boolean };
  const conditions: Condition[] = [];
  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';

  if (bullishBias) {
    direction = 'CALL';
    conditions.push({ label: 'Price above VWAP', pass: true });
    conditions.push({ label: 'Price above open (intraday uptrend)', pass: true });
    conditions.push({ label: 'Range position < 30 — intraday pullback', pass: rangePos < 30 });
    conditions.push({ label: 'Within 1.5% of VWAP', pass: distFromVWAP < 1.5 });
  } else if (bearishBias) {
    direction = 'PUT';
    conditions.push({ label: 'Price below VWAP', pass: true });
    conditions.push({ label: 'Price below open (intraday downtrend)', pass: true });
    conditions.push({ label: 'Range position > 70 — intraday extension', pass: rangePos > 70 });
    conditions.push({ label: 'Within 1.5% of VWAP', pass: distFromVWAP < 1.5 });
  } else {
    conditions.push({ label: 'No clear intraday bias', pass: false });
  }

  const passCount  = conditions.filter(c => c.pass).length;
  const allPass    = passCount === conditions.length;
  const confidence = Math.round((passCount / Math.max(conditions.length, 1)) * 100);

  return {
    signal: allPass ? direction : ('NEUTRAL' as const),
    direction, conditions, allPass, confidence,
    indicators: {
      vwap:      parseFloat(vwap.toFixed(4)),
      ema8proxy: parseFloat(ema8proxy.toFixed(4)),
      rangePos:  parseFloat(rangePos.toFixed(1)),
    },
  };
}

function buildSuggestions(
  symbol: string, price: number, changePercent: number,
  direction: string, signalConfidence: number, volTier: string,
) {
  const move            = VOL_MOVE[volTier] ?? VOL_MOVE.medium;
  const premiumPerShare = parseFloat((price * move * 2).toFixed(2));
  const contractCost    = parseFloat((premiumPerShare * 100).toFixed(2));
  const contractTarget  = parseFloat((contractCost * 1.2).toFixed(2));
  const callEntry       = parseFloat(price.toFixed(2));
  const callExit        = parseFloat((price * (1 + move)).toFixed(2));
  const putEntry        = parseFloat(price.toFixed(2));
  const putExit         = parseFloat((price * (1 - move)).toFixed(2));
  const callConf = direction === 'CALL'
    ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2)
    : Math.max(40, signalConfidence - 20);
  const putConf = direction === 'PUT'
    ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2)
    : Math.max(40, signalConfidence - 20);

  return [
    {
      type: 'CALL',
      title: `${symbol} Call Option — ${direction === 'CALL' ? 'Bullish Momentum' : 'Counter-trend Play'}`,
      description: direction === 'CALL'
        ? `Uptrend confirmed. Stock needs to reach $${callExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${callExit} to capture 20% premium gain.`,
      entryPrice: callEntry.toFixed(2), exitPrice: callExit.toFixed(2),
      premiumPerShare: premiumPerShare.toFixed(2), contractCost: contractCost.toFixed(2),
      contractTarget: contractTarget.toFixed(2), strike: `~$${callEntry.toFixed(0)} ATM`,
      timeframe: '0DTE (Today)', confidence: parseFloat(callConf.toFixed(2)),
    },
    {
      type: 'PUT',
      title: `${symbol} Put Option — ${direction === 'PUT' ? 'Bearish Pressure' : 'Counter-trend Play'}`,
      description: direction === 'PUT'
        ? `Downtrend confirmed. Stock needs to reach $${putExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${putExit} to capture 20% premium gain.`,
      entryPrice: putEntry.toFixed(2), exitPrice: putExit.toFixed(2),
      premiumPerShare: premiumPerShare.toFixed(2), contractCost: contractCost.toFixed(2),
      contractTarget: contractTarget.toFixed(2), strike: `~$${putEntry.toFixed(0)} ATM`,
      timeframe: '0DTE (Today)', confidence: parseFloat(putConf.toFixed(2)),
    },
  ];
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
  }

  // ── Subscription check (Stripe subscriber OR admin email) ────────────────
  const user  = await currentUser();
  const isPro = isProUser(user);

  const active = WATCHLIST.filter(w => isPro || !w.pro);
  const locked = WATCHLIST.filter(w => !isPro && w.pro);

  // ── Fetch live quotes for active tickers ──────────────────────────────────
  const settled = await Promise.allSettled(
    active.map(async ({ symbol, name, type, volTier }) => {
      const q = await fetchQuote(symbol, apiKey);
      const sig = runSignal(q.c, q.h, q.l, q.o);
      const suggestions = buildSuggestions(symbol, q.c, q.dp, sig.direction, sig.confidence, volTier);
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

  const activeData = active.map(({ symbol, name, type }, i) => {
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

  // ── Locked stubs (no price data) ──────────────────────────────────────────
  const lockedData = locked.map(({ symbol, name, type }) => ({
    symbol, name, type, locked: true,
    price: null, dayOpen: null, dayHigh: null, dayLow: null, prevClose: null,
    changePercent: null, indicators: null,
    signal: 'NEUTRAL', direction: 'NEUTRAL',
    conditions: [], allPass: false, confidence: 0, suggestions: [], error: null,
  }));

  // ── Restore original watchlist order ──────────────────────────────────────
  const allData = WATCHLIST.map(w =>
    activeData.find(d => d.symbol === w.symbol) ??
    lockedData.find(d => d.symbol === w.symbol)!
  );

  return NextResponse.json({ data: allData, timestamp: new Date().toISOString(), isPro });
}
