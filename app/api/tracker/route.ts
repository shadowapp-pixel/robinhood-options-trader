import { NextResponse } from 'next/server';

const WATCHLIST = [
  { symbol: 'AAPL',  name: 'Apple',           type: 'mag7',  volTier: 'low'    },
  { symbol: 'MSFT',  name: 'Microsoft',        type: 'mag7',  volTier: 'low'    },
  { symbol: 'GOOGL', name: 'Alphabet',         type: 'mag7',  volTier: 'low'    },
  { symbol: 'AMZN',  name: 'Amazon',           type: 'mag7',  volTier: 'medium' },
  { symbol: 'META',  name: 'Meta',             type: 'mag7',  volTier: 'medium' },
  { symbol: 'NVDA',  name: 'NVIDIA',           type: 'mag7',  volTier: 'high'   },
  { symbol: 'TSLA',  name: 'Tesla',            type: 'mag7',  volTier: 'high'   },
  { symbol: 'QQQ',   name: 'Nasdaq 100 ETF',   type: 'etf',   volTier: 'low'    },
  { symbol: 'SPY',   name: 'S&P 500 ETF',      type: 'etf',   volTier: 'low'    },
  { symbol: 'VXX',   name: 'VIX Futures ETF',  type: 'index', volTier: 'high'   },
];

// Stock move needed for ATM 0DTE option to gain ~20%
// 0DTE premiums are thinner — smaller moves produce larger % gains
// Delta ≈ 0.5 for ATM, gamma is much higher intraday
const VOL_MOVE: Record<string, number> = {
  low:    0.003,  // 0.3% stock move → ~20% ATM 0DTE gain (SPY, QQQ, AAPL, MSFT, GOOGL)
  medium: 0.005,  // 0.5%                                  (AMZN, META)
  high:   0.008,  // 0.8%                                  (NVDA, TSLA, VXX)
};

async function fetchQuote(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json();
  if (!data.c || data.c === 0) throw new Error('No quote data');
  return data as { c: number; h: number; l: number; o: number; pc: number; dp: number };
}

// Signal logic using quote fields as proxies:
//   VWAP proxy     → (H + L + C) / 3
//   Trend anchor   → today's open (replaces EMA8)
//   Range position → (C - L) / (H - L) × 100 (replaces RSI3)
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

// Generate 1-day options suggestions targeting 20% premium gain.
// Entry = current stock price (where to enter the position).
// Exit  = stock price target at which the ATM option gains ~20%.
function buildSuggestions(
  symbol: string,
  price: number,
  changePercent: number,
  direction: string,
  signalConfidence: number,
  volTier: string,
) {
  const move = VOL_MOVE[volTier] ?? VOL_MOVE.medium;

  // Premium per share estimate for ATM 1DTE option
  const premiumPerShare = parseFloat((price * move * 2).toFixed(2));
  // Robinhood contract = 100 shares — this is what you actually pay
  const contractCost   = parseFloat((premiumPerShare * 100).toFixed(2));
  const contractTarget = parseFloat((contractCost * 1.2).toFixed(2));

  const callEntry = parseFloat(price.toFixed(2));
  const callExit  = parseFloat((price * (1 + move)).toFixed(2));
  const putEntry  = parseFloat(price.toFixed(2));
  const putExit   = parseFloat((price * (1 - move)).toFixed(2));

  const callConf = direction === 'CALL'
    ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2)
    : Math.max(40, signalConfidence - 20);
  const putConf  = direction === 'PUT'
    ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2)
    : Math.max(40, signalConfidence - 20);

  return [
    {
      type: 'CALL',
      title: `${symbol} Call Option — ${direction === 'CALL' ? 'Bullish Momentum' : 'Counter-trend Play'}`,
      description: direction === 'CALL'
        ? `Uptrend confirmed. Stock needs to reach $${callExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${callExit} to capture 20% premium gain.`,
      entryPrice: callEntry.toFixed(2),
      exitPrice: callExit.toFixed(2),
      premiumPerShare: premiumPerShare.toFixed(2),
      contractCost: contractCost.toFixed(2),
      contractTarget: contractTarget.toFixed(2),
      strike: `~$${callEntry.toFixed(0)} ATM`,
      timeframe: '0DTE (Today)',
      confidence: parseFloat(callConf.toFixed(2)),
    },
    {
      type: 'PUT',
      title: `${symbol} Put Option — ${direction === 'PUT' ? 'Bearish Pressure' : 'Counter-trend Play'}`,
      description: direction === 'PUT'
        ? `Downtrend confirmed. Stock needs to reach $${putExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${putExit} to capture 20% premium gain.`,
      entryPrice: putEntry.toFixed(2),
      exitPrice: putExit.toFixed(2),
      premiumPerShare: premiumPerShare.toFixed(2),
      contractCost: contractCost.toFixed(2),
      contractTarget: contractTarget.toFixed(2),
      strike: `~$${putEntry.toFixed(0)} ATM`,
      timeframe: '0DTE (Today)',
      confidence: parseFloat(putConf.toFixed(2)),
    },
  ];
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
  }

  const settled = await Promise.allSettled(
    WATCHLIST.map(async ({ symbol, name, type, volTier }) => {
      const q = await fetchQuote(symbol, apiKey);
      const { signal, direction, conditions, allPass, confidence, indicators } = runSignal(q.c, q.h, q.l, q.o);
      const suggestions = buildSuggestions(symbol, q.c, q.dp, direction, confidence, volTier);

      return {
        symbol,
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
        suggestions,
        error: null,
      };
    })
  );

  const data = WATCHLIST.map(({ symbol, name, type }, i) => {
    const result = settled[i];
    if (result.status === 'fulfilled') return result.value;
    return {
      symbol,
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
      suggestions: [],
      error: (result.reason as Error).message,
    };
  });

  return NextResponse.json({ data, timestamp: new Date().toISOString() });
}
