import { NextResponse } from 'next/server';

const WATCHLIST = [
  { symbol: 'AAPL',  name: 'Apple',                type: 'mag7'  },
  { symbol: 'MSFT',  name: 'Microsoft',             type: 'mag7'  },
  { symbol: 'GOOGL', name: 'Alphabet',              type: 'mag7'  },
  { symbol: 'AMZN',  name: 'Amazon',                type: 'mag7'  },
  { symbol: 'META',  name: 'Meta',                  type: 'mag7'  },
  { symbol: 'NVDA',  name: 'NVIDIA',                type: 'mag7'  },
  { symbol: 'TSLA',  name: 'Tesla',                 type: 'mag7'  },
  { symbol: 'QQQ',   name: 'Nasdaq 100 ETF',        type: 'etf'   },
  { symbol: 'SPY',   name: 'S&P 500 ETF',           type: 'etf'   },
  { symbol: '^VIX',  name: 'CBOE Volatility Index', type: 'index' },
];

// Finnhub quote: c=current, h=high, l=low, o=open, pc=prev close, dp=change%
async function fetchQuote(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json();
  if (!data.c || data.c === 0) throw new Error('No quote data');
  return data as { c: number; h: number; l: number; o: number; pc: number; dp: number };
}

// Signal logic adapted from the bot — using quote fields as proxies:
//   VWAP proxy  → (H + L + C) / 3  (standard typical price)
//   EMA(8) proxy → today's open     (intraday trend anchor)
//   RSI(3) proxy → range position   (C - L) / (H - L) × 100
//     range < 30 = intraday pullback  (maps to RSI < 30 = CALL setup)
//     range > 70 = intraday extension (maps to RSI > 70 = PUT setup)
function runSignal(c: number, h: number, l: number, o: number) {
  const vwap = (h + l + c) / 3;
  const ema8proxy = o;
  const rangeSpan = h - l;
  const rangePos = rangeSpan > 0 ? ((c - l) / rangeSpan) * 100 : 50;
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

  const passCount = conditions.filter(c => c.pass).length;
  const allPass = passCount === conditions.length;
  const confidence = Math.round((passCount / Math.max(conditions.length, 1)) * 100);

  return {
    signal: allPass ? direction : ('NEUTRAL' as const),
    direction,
    conditions,
    allPass,
    confidence,
    indicators: {
      vwap: parseFloat(vwap.toFixed(4)),
      ema8proxy: parseFloat(ema8proxy.toFixed(4)),
      rangePos: parseFloat(rangePos.toFixed(1)),
    },
  };
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
  }

  const settled = await Promise.allSettled(
    WATCHLIST.map(async ({ symbol, name, type }) => {
      const q = await fetchQuote(symbol, apiKey);
      const { signal, direction, conditions, allPass, confidence, indicators } = runSignal(q.c, q.h, q.l, q.o);

      return {
        symbol: symbol === '^VIX' ? 'VIX' : symbol,
        name,
        type,
        price: q.c,
        changePercent: q.dp,
        indicators,
        signal,
        direction,
        conditions,
        allPass,
        confidence,
        error: null,
      };
    })
  );

  const data = WATCHLIST.map(({ symbol, name, type }, i) => {
    const result = settled[i];
    if (result.status === 'fulfilled') return result.value;
    return {
      symbol: symbol === '^VIX' ? 'VIX' : symbol,
      name,
      type,
      price: null,
      changePercent: null,
      indicators: null,
      signal: 'NEUTRAL',
      direction: 'NEUTRAL',
      conditions: [],
      allPass: false,
      confidence: 0,
      error: (result.reason as Error).message,
    };
  });

  return NextResponse.json({ data, timestamp: new Date().toISOString() });
}
