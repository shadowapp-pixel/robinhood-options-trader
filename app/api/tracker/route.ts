import { NextResponse } from 'next/server';

const WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple', type: 'mag7' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'mag7' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'mag7' },
  { symbol: 'AMZN', name: 'Amazon', type: 'mag7' },
  { symbol: 'META', name: 'Meta', type: 'mag7' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'mag7' },
  { symbol: 'TSLA', name: 'Tesla', type: 'mag7' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', type: 'etf' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'etf' },
  { symbol: 'VIX', name: 'CBOE Volatility Index', type: 'index' },
];

interface Candle {
  time: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

function calcEMA(closes: number[], period: number): number {
  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * multiplier + ema * (1 - multiplier);
  }
  return ema;
}

function calcRSI(closes: number[], period = 3): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

// Session VWAP — resets at midnight UTC, same as the bot
function calcVWAP(candles: Candle[]): number | null {
  const midnightUTC = new Date();
  midnightUTC.setUTCHours(0, 0, 0, 0);
  const sessionCandles = candles.filter(c => c.time >= midnightUTC.getTime() / 1000);
  if (sessionCandles.length === 0) return null;
  const cumTPV = sessionCandles.reduce((sum, c) => sum + ((c.h + c.l + c.c) / 3) * c.v, 0);
  const cumVol = sessionCandles.reduce((sum, c) => sum + c.v, 0);
  return cumVol === 0 ? null : cumTPV / cumVol;
}

async function fetchCandles(symbol: string, apiKey: string): Promise<Candle[]> {
  const to = Math.floor(Date.now() / 1000);
  // ~100 30-min candles (~2 trading days)
  const from = to - 30 * 60 * 120;

  // Finnhub uses ^VIX for the volatility index
  const finnhubSymbol = symbol === 'VIX' ? '^VIX' : symbol;
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=30&from=${from}&to=${to}&token=${apiKey}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);

  const data = await res.json();
  if (data.s !== 'ok' || !data.t || data.t.length === 0) {
    throw new Error('No candle data returned');
  }

  return (data.t as number[]).map((time: number, i: number) => ({
    time,
    o: data.o[i],
    h: data.h[i],
    l: data.l[i],
    c: data.c[i],
    v: data.v[i],
  }));
}

// Exact same signal logic as the bot (EMA8 + VWAP + RSI3 + proximity)
function runSignal(price: number, ema8: number, vwap: number, rsi3: number) {
  const bullishBias = price > vwap && price > ema8;
  const bearishBias = price < vwap && price < ema8;
  const distFromVWAP = Math.abs((price - vwap) / vwap) * 100;

  type Condition = { label: string; pass: boolean };
  const conditions: Condition[] = [];
  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';

  if (bullishBias) {
    direction = 'CALL';
    conditions.push({ label: 'Price above VWAP', pass: price > vwap });
    conditions.push({ label: 'Price above EMA(8)', pass: price > ema8 });
    conditions.push({ label: 'RSI(3) < 30 — pullback in uptrend', pass: rsi3 < 30 });
    conditions.push({ label: 'Within 1.5% of VWAP', pass: distFromVWAP < 1.5 });
  } else if (bearishBias) {
    direction = 'PUT';
    conditions.push({ label: 'Price below VWAP', pass: price < vwap });
    conditions.push({ label: 'Price below EMA(8)', pass: price < ema8 });
    conditions.push({ label: 'RSI(3) > 70 — reversal in downtrend', pass: rsi3 > 70 });
    conditions.push({ label: 'Within 1.5% of VWAP', pass: distFromVWAP < 1.5 });
  } else {
    conditions.push({ label: 'No clear market bias', pass: false });
  }

  const passCount = conditions.filter(c => c.pass).length;
  const allPass = passCount === conditions.length;
  const confidence = Math.round((passCount / Math.max(conditions.length, 1)) * 100);

  return {
    signal: allPass ? direction : 'NEUTRAL' as const,
    direction,
    conditions,
    allPass,
    confidence,
  };
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
  }

  const settled = await Promise.allSettled(
    WATCHLIST.map(async ({ symbol, name, type }) => {
      const candles = await fetchCandles(symbol, apiKey);
      const closes = candles.map(c => c.c);

      if (closes.length < 10) throw new Error('Insufficient candle data');

      const price = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2] ?? price;
      const changePercent = ((price - prevClose) / prevClose) * 100;

      const ema8 = calcEMA(closes, 8);
      const vwap = calcVWAP(candles);
      const rsi3 = calcRSI(closes, 3);

      if (vwap === null || rsi3 === null) throw new Error('Cannot calculate indicators');

      const { signal, direction, conditions, allPass, confidence } = runSignal(price, ema8, vwap, rsi3);

      return {
        symbol,
        name,
        type,
        price,
        changePercent,
        indicators: {
          ema8: parseFloat(ema8.toFixed(4)),
          vwap: parseFloat(vwap.toFixed(4)),
          rsi3: parseFloat(rsi3.toFixed(2)),
        },
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
      error: (result.reason as Error).message,
    };
  });

  return NextResponse.json({ data, timestamp: new Date().toISOString() });
}
