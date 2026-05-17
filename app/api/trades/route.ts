/**
 * Trade Search API — returns the same signal analysis as Market Tracker
 * but for any arbitrary ticker entered by a Pro user.
 *
 * GET /api/trades?symbol=AAPL
 */
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isProUser } from '@/lib/auth';
import { getATMOptions } from '@/lib/tradier';
import { detectPatterns, patternBias, type PatternResult } from '@/lib/pattern-detection';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyCandles { closes: number[]; highs: number[]; lows: number[]; }

interface MACDResult {
  line: number; signal: number; histogram: number; prevHistogram: number;
}

interface BollingerResult {
  upper: number; mid: number; lower: number; percentB: number; bandwidth: number;
}

// ─── Indicator math (mirrors tracker route exactly) ───────────────────────────

function emaLocal(vals: number[], period: number): number[] {
  if (vals.length < period) return [];
  const k    = 2 / (period + 1);
  const seed = vals.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const out  = [seed];
  for (let i = period; i < vals.length; i++) out.push(vals[i] * k + out[out.length - 1] * (1 - k));
  return out;
}

function computeMACDLocal(closes: number[]): MACDResult | null {
  if (closes.length < 36) return null;
  const ema12    = emaLocal(closes, 12);
  const ema26    = emaLocal(closes, 26);
  const overlap  = ema26.length;
  const macdLine = ema12.slice(ema12.length - overlap).map((v, i) => v - ema26[i]);
  const sigLine  = emaLocal(macdLine, 9);
  if (macdLine.length < 2 || sigLine.length < 2) return null;
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSig  = sigLine[sigLine.length - 1];
  const prevMacd = macdLine[macdLine.length - 2];
  const prevSig  = sigLine[sigLine.length - 2];
  return { line: lastMacd, signal: lastSig, histogram: lastMacd - lastSig, prevHistogram: prevMacd - prevSig };
}

function computeBollingerLocal(closes: number[], period = 20): BollingerResult | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean  = slice.reduce((a, b) => a + b, 0) / period;
  const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  const upper = mean + 2.0 * std;
  const lower = mean - 2.0 * std;
  const cur   = closes[closes.length - 1];
  return {
    upper, mid: mean, lower,
    percentB:  upper !== lower ? (cur - lower) / (upper - lower) : 0.5,
    bandwidth: mean > 0 ? ((upper - lower) / mean) * 100 : 0,
  };
}

/** 20-day annualised volatility (%) from daily closes. */
function computeVolatility20(closes: number[]): number | null {
  if (closes.length < 21) return null;
  const slice    = closes.slice(-21);
  const returns  = slice.slice(1).map((c, i) => Math.log(c / slice[i]));
  const mean     = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance * 252) * 100;
}

/** Estimates trading hours to reach targetPrice from currentPrice given annualised vol. */
function estimateTimeToTarget(
  currentPrice: number,
  targetPrice:  number,
  annualisedVolPct: number | null,
): { label: string; moveNeeded: string } {
  const movePct = ((targetPrice - currentPrice) / currentPrice) * 100;
  const moveStr = `${movePct >= 0 ? '+' : ''}${movePct.toFixed(2)}%`;
  if (!annualisedVolPct || annualisedVolPct <= 0) return { label: '—', moveNeeded: moveStr };
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

// ─── Daily candle fetch ───────────────────────────────────────────────────────

async function fetchDailyCandles(symbol: string, apiKey: string): Promise<DailyCandles | null> {
  const now  = Math.floor(Date.now() / 1000);
  const from = now - 60 * 86_400;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${now}&token=${apiKey}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const d = await res.json() as { s: string; c?: number[]; h?: number[]; l?: number[] };
    if (d.s !== 'ok' || !d.c?.length) return null;
    return { closes: d.c, highs: d.h!, lows: d.l! };
  } catch { return null; }
}

// ─── Signal engine (mirrors tracker route exactly) ────────────────────────────

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

  const gapUp      = pc > 0 && o > pc * 1.005;
  const gapDown    = pc > 0 && o < pc * 0.995;
  const bodySize   = Math.abs(c - o);
  const totalRange = Math.max(h - l, 0.01);
  const bodyRatio  = bodySize / totalRange;
  const greenBody  = c > o;
  const redBody    = c < o;
  const bullishBias = c > vwap && c > ema8proxy;
  const bearishBias = c < vwap && c < ema8proxy;

  type Condition = { label: string; pass: boolean };
  const intradayConds:  Condition[] = [];
  const technicalConds: Condition[] = [];
  const patternConds:   Condition[] = [];
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

  // MACD crossover + momentum (0.1% min spread to filter noise)
  const minMACDSpread = c * 0.001;
  if (macd && direction !== 'NEUTRAL') {
    if (direction === 'CALL') {
      technicalConds.push({ label: 'MACD bullish crossover (daily)',                pass: macd.line > macd.signal && (macd.line - macd.signal) >= minMACDSpread });
      technicalConds.push({ label: 'MACD momentum building (histogram expanding)', pass: macd.histogram > macd.prevHistogram });
    } else {
      technicalConds.push({ label: 'MACD bearish crossover (daily)',                pass: macd.line < macd.signal && (macd.signal - macd.line) >= minMACDSpread });
      technicalConds.push({ label: 'MACD momentum building (histogram expanding)', pass: macd.histogram < macd.prevHistogram });
    }
  }

  // Bollinger %B + bandwidth squeeze guard
  if (bb && direction !== 'NEUTRAL') {
    const noSqueeze = bb.bandwidth >= 4.0;
    if (direction === 'CALL') {
      technicalConds.push({ label: 'Bollinger %B not overbought (< 60%)',               pass: bb.percentB < 0.60 });
      technicalConds.push({ label: 'Bollinger bands wide — no squeeze',                 pass: noSqueeze });
      if (bb.percentB < 0.30) technicalConds.push({ label: 'Bollinger %B oversold (< 30%) — high-prob entry',   pass: true });
    } else {
      technicalConds.push({ label: 'Bollinger %B not oversold (> 40%)',                 pass: bb.percentB > 0.40 });
      technicalConds.push({ label: 'Bollinger bands wide — no squeeze',                 pass: noSqueeze });
      if (bb.percentB > 0.70) technicalConds.push({ label: 'Bollinger %B overbought (> 70%) — high-prob entry', pass: true });
    }
  }

  // Chart patterns
  const bullPatterns = patterns.filter(p => p.type.startsWith('bullish'));
  const bearPatterns = patterns.filter(p => p.type.startsWith('bearish'));
  if (direction === 'CALL') {
    if (bullPatterns[0]) patternConds.push({ label: `Bullish chart pattern: ${bullPatterns[0].name}`,   pass: true });
    if (bearPatterns[0]?.type === 'bearish-reversal') patternConds.push({ label: `Bearish reversal warning: ${bearPatterns[0].name}`, pass: false });
  } else if (direction === 'PUT') {
    if (bearPatterns[0]) patternConds.push({ label: `Bearish chart pattern: ${bearPatterns[0].name}`,   pass: true });
    if (bullPatterns[0]?.type === 'bullish-reversal') patternConds.push({ label: `Bullish reversal warning: ${bullPatterns[0].name}`, pass: false });
  }

  // Three-tier confidence: 50% intraday / 25% MACD+BB / 25% patterns
  const intradayScore = intradayConds.length > 0 ? intradayConds.filter(x => x.pass).length / intradayConds.length : 0;
  const techScore     = technicalConds.length > 0 ? technicalConds.filter(x => x.pass).length / technicalConds.length : intradayScore;
  const bias          = patternBias(patterns);
  const patScore      = patternConds.length  > 0 ? patternConds.filter(x => x.pass).length  / patternConds.length  : intradayScore;
  const alignBonus    = (direction === 'CALL' && bias > 0.5) || (direction === 'PUT' && bias < -0.5) ? 0.05 : 0;

  const confidence       = Math.min(100, Math.round((intradayScore * 0.50 + techScore * 0.25 + patScore * 0.25 + alignBonus) * 100));
  const allIntradayPass  = intradayConds.length > 1 && intradayConds.every(x => x.pass);
  const allPass          = allIntradayPass && confidence >= 80;
  const conditions       = [...intradayConds, ...technicalConds, ...patternConds];

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

// ─── Suggestion builder (mirrors tracker logic) ───────────────────────────────

function buildSuggestions(
  symbol: string, price: number, changePercent: number,
  direction: string, signalConfidence: number,
  realOptions?: { call?: { ask: number; strike: number } | null; put?: { ask: number; strike: number } | null; expiration?: string | null } | null,
  vol?: number | null,
) {
  const move = 0.004 + Math.abs(changePercent) * 0.001;

  const callAsk    = realOptions?.call?.ask  && realOptions.call.ask  > 0 ? realOptions.call.ask  : parseFloat((price * move).toFixed(2));
  const putAsk     = realOptions?.put?.ask   && realOptions.put.ask   > 0 ? realOptions.put.ask   : parseFloat((price * move).toFixed(2));
  const callStrike = realOptions?.call?.strike ?? price;
  const putStrike  = realOptions?.put?.strike  ?? price;
  const expLabel   = realOptions?.expiration ?? null ? `Exp ${realOptions!.expiration}` : '0DTE (Today)';

  const callContractCost = parseFloat((callAsk * 100).toFixed(2));
  const putContractCost  = parseFloat((putAsk  * 100).toFixed(2));
  const callExit = parseFloat((price * (1 + move)).toFixed(2));
  const putExit  = parseFloat((price * (1 - move)).toFixed(2));

  const callConf = direction === 'CALL' ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2) : Math.max(40, signalConfidence - 20);
  const putConf  = direction === 'PUT'  ? Math.min(88, signalConfidence + Math.abs(changePercent) * 2) : Math.max(40, signalConfidence - 20);

  const fmtStrike = (strike: number, isReal: boolean) =>
    isReal ? `$${strike % 1 === 0 ? strike.toFixed(0) : strike.toFixed(2)}` : `~$${Math.round(strike)} ATM`;

  const callTime = estimateTimeToTarget(price, callExit, vol ?? null);
  const putTime  = estimateTimeToTarget(price, putExit,  vol ?? null);

  const suggestions: {
    type: string; title: string; description: string;
    entryPrice: string; exitPrice: string; premiumPerShare: string;
    contractCost: string; contractTarget: string; strike: string;
    timeframe: string; confidence: number;
    estimatedTime: string; moveNeeded: string;
  }[] = [
    {
      type: 'CALL',
      title:       `${symbol} Call Option — ${direction === 'CALL' ? 'Bullish Momentum' : 'Counter-trend Play'}`,
      description: direction === 'CALL'
        ? `Uptrend confirmed. Stock needs to reach $${callExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${callExit} to capture 20% premium gain.`,
      entryPrice: price.toFixed(2), exitPrice: callExit.toFixed(2),
      premiumPerShare: callAsk.toFixed(2), contractCost: callContractCost.toFixed(2),
      contractTarget: (callContractCost * 1.2).toFixed(2),
      strike: fmtStrike(callStrike, !!realOptions?.call), timeframe: expLabel,
      confidence: parseFloat(callConf.toFixed(2)),
      estimatedTime: callTime.label, moveNeeded: callTime.moveNeeded,
    },
    {
      type: 'PUT',
      title:       `${symbol} Put Option — ${direction === 'PUT' ? 'Bearish Pressure' : 'Counter-trend Play'}`,
      description: direction === 'PUT'
        ? `Downtrend confirmed. Stock needs to reach $${putExit} for ~20% premium gain.`
        : `Low-conviction reversal setup. Needs $${putExit} to capture 20% premium gain.`,
      entryPrice: price.toFixed(2), exitPrice: putExit.toFixed(2),
      premiumPerShare: putAsk.toFixed(2), contractCost: putContractCost.toFixed(2),
      contractTarget: (putContractCost * 1.2).toFixed(2),
      strike: fmtStrike(putStrike, !!realOptions?.put), timeframe: expLabel,
      confidence: parseFloat(putConf.toFixed(2)),
      estimatedTime: putTime.label, moveNeeded: putTime.moveNeeded,
    },
  ];

  // Straddle for high-vol sessions
  if (Math.abs(changePercent) > 1.5) {
    const straddleAsk   = parseFloat((callAsk + putAsk).toFixed(2));
    const straddleCost  = parseFloat((straddleAsk * 100).toFixed(2));
    const straddleExit  = parseFloat((changePercent > 0 ? price * 1.008 : price * 0.992).toFixed(2));
    const straddleTime  = estimateTimeToTarget(price, straddleExit, vol ?? null);
    suggestions.push({
      type: 'STRADDLE',
      title:       `${symbol} Straddle — High Volatility Play`,
      description: `${Math.abs(changePercent).toFixed(2)}% move today. Buy ATM call + put for a big directional move.`,
      entryPrice: price.toFixed(2),
      exitPrice:  straddleExit.toFixed(2),
      premiumPerShare: straddleAsk.toFixed(2), contractCost: straddleCost.toFixed(2),
      contractTarget: (straddleCost * 1.2).toFixed(2),
      strike: fmtStrike(callStrike, !!realOptions?.call), timeframe: expLabel,
      confidence: parseFloat(Math.min(88, 72 + Math.abs(changePercent) / 2).toFixed(2)),
      estimatedTime: straddleTime.label, moveNeeded: straddleTime.moveNeeded,
    });
  }

  return suggestions;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ── Pro gate ──────────────────────────────────────────────────────────────
  const user  = await currentUser();
  const isPro = isProUser(user);
  if (!isPro) {
    return NextResponse.json(
      { error: 'pro_required', message: 'Trade Search is a Pro feature. Upgrade to access custom ticker analysis.' },
      { status: 403 }
    );
  }

  const raw    = request.nextUrl.searchParams.get('symbol');
  const symbol = raw?.toUpperCase().trim();
  if (!symbol || !/^[A-Z]{1,10}$/.test(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol. Use 1–10 uppercase letters (e.g. AAPL).' }, { status: 400 });
  }

  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (!finnhubKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  try {
    // Fetch quote + daily candles in parallel
    const [quoteRes, candles] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`, { cache: 'no-store' }),
      fetchDailyCandles(symbol, finnhubKey),
    ]);

    const quoteData = await quoteRes.json() as { c?: number; d?: number; dp?: number; h?: number; l?: number; o?: number; pc?: number };
    if (!quoteData.c || quoteData.c === 0) {
      return NextResponse.json({ error: `No market data found for "${symbol}". Check the ticker and try again during market hours.` }, { status: 404 });
    }

    const currentPrice  = quoteData.c;
    const change        = quoteData.d  ?? 0;
    const changePercent = quoteData.dp ?? 0;
    const h  = quoteData.h  ?? currentPrice;
    const l  = quoteData.l  ?? currentPrice;
    const o  = quoteData.o  ?? currentPrice;
    const pc = quoteData.pc ?? currentPrice;

    // Run signal engine
    const patterns = candles ? detectPatterns(candles.closes, candles.highs, candles.lows) : [];
    const macd     = candles ? computeMACDLocal(candles.closes)      : null;
    const bb       = candles ? computeBollingerLocal(candles.closes)  : null;
    const vol      = candles ? computeVolatility20(candles.closes)    : null;
    const sig      = runSignal(currentPrice, h, l, o, pc, patterns, macd, bb);

    // Fetch real ATM options (if Tradier key configured)
    const tradierKey  = process.env.TRADIER_SANDBOX_KEY;
    const realOptions = tradierKey ? await getATMOptions(symbol, currentPrice, tradierKey) : null;

    const suggestions = buildSuggestions(symbol, currentPrice, changePercent, sig.direction, sig.confidence, realOptions, vol);

    return NextResponse.json({
      symbol,
      currentPrice:     currentPrice.toFixed(2),
      change:           change.toFixed(2),
      changePercent:    changePercent.toFixed(2),
      dayHigh:          h.toFixed(2),
      dayLow:           l.toFixed(2),
      dayOpen:          o.toFixed(2),
      prevClose:        pc.toFixed(2),
      // ── Signal analysis (same as Market Tracker) ──
      signal:     sig.signal,
      direction:  sig.direction,
      confidence: sig.confidence,
      allPass:    sig.allPass,
      conditions: sig.conditions,
      indicators: sig.indicators,
      patterns:   sig.patterns,
      // ── Suggestions ──────────────────────────────
      suggestions,
      usingRealOptions: !!realOptions?.call || !!realOptions?.put,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Trade Search error:', err);
    return NextResponse.json({ error: 'Failed to fetch trade data. Please try again.' }, { status: 500 });
  }
}
