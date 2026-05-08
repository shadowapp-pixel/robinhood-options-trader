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

// Yahoo Finance — free, no auth, supports 30-min intraday
async function fetchCandles(symbol: string): Promise<Candle[]> {
  // Yahoo uses ^VIX for VIX index
  const yahooSymbol = symbol === 'VIX' ? '%5EVIX' : symbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=30m&range=2d`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data from Yahoo Finance');

  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote || timestamps.length === 0) throw new Error('Empty candle data');

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i] ?? 0;
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({ time: timestamps[i], o, h, l, c, v });
  }

  if (candles.length === 0) throw new Error('No valid candles');
  return candles;
}

// Same signal logic as the bot: EMA(8) + VWAP + RSI(3) + VWAP proximity
function runSignal(price: number, ema8: number, vwap: number, rsi3: number) {
  const bullishBias = price > vwap && price > ema8;
  const bearishBias = price < vwap && price < ema8;
  const distFromVWAP = Math.abs((price - vwap) / vwap) * 100;

  type Condition = { label: string; pass: boolean };
  const conditions: Condition[] = [];
  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';

  if (bullishBias) {
    direction = 'CALL';
    conditions.push({ label: 'Price above VWAP', pass: true });
    conditions.push({ label: 'Price above EMA(8)', pass: true });
    conditions.push({ label: 'RSI(3) < 30 — pullback in uptrend', pass: rsi3 < 30 });
    conditions.push({ label: 'Within 1.5% of VWAP', pass: distFromVWAP < 1.5 });
  } else if (bearishBias) {
    direction = 'PUT';
    conditions.push({ label: 'Price below VWAP', pass: true });
    conditions.push({ label: 'Price below EMA(8)', pass: true });
    conditions.push({ label: 'RSI(3) > 70 — reversal in downtrend', pass: rsi3 > 70 });
    conditions.push({ label: 'Within 1.5% of VWAP', pass: distFromVWAP < 1.5 });
  } else {
    conditions.push({ label: 'No clear market bias', pass: false });
  }

  const passCount = conditions.filter(c => c.pass).length;
  const allPass = passCount === conditions.length;
  const confidence = Math.round((passCount / Math.max(conditions.length, 1)) * 100);

  return { signal: allPass ? direction : ('NEUTRAL' as const), direction, conditions, allPass, confidence };
}

export async function GET() {
  const settled = await Promise.allSettled(
    WATCHLIST.map(async ({ symbol, name, type }) => {
      const candles = await fetchCandles(symbol);
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
