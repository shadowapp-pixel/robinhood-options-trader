/**
 * Chart pattern detection engine
 * Detects all 12 patterns from the bullish/bearish continuation & reversal chart:
 *
 * Bullish Continuation:  Triangle, Flag, Wedge, Symmetrical Triangle
 * Bullish Reversal:      Inverted H&S, Falling Wedge, Double Bottom, Triple Bottom
 * Bearish Continuation:  Triangle, Flag, Wedge, Symmetrical Triangle
 * Bearish Reversal:      Head & Shoulders, Rising Wedge, Double Top, Triple Top
 */

export interface PatternResult {
  name:        string;
  type:        'bullish-continuation' | 'bullish-reversal' | 'bearish-continuation' | 'bearish-reversal';
  confidence:  number;   // 0–100
  description: string;
}

// ─── Pivot helpers ────────────────────────────────────────────────────────────

function findPeaks(vals: number[], win = 2): { idx: number; val: number }[] {
  const out: { idx: number; val: number }[] = [];
  for (let i = win; i < vals.length - win; i++) {
    let ok = true;
    for (let j = 1; j <= win; j++) {
      if (vals[i - j] >= vals[i] || vals[i + j] >= vals[i]) { ok = false; break; }
    }
    if (ok) out.push({ idx: i, val: vals[i] });
  }
  return out;
}

function findTroughs(vals: number[], win = 2): { idx: number; val: number }[] {
  const out: { idx: number; val: number }[] = [];
  for (let i = win; i < vals.length - win; i++) {
    let ok = true;
    for (let j = 1; j <= win; j++) {
      if (vals[i - j] <= vals[i] || vals[i + j] <= vals[i]) { ok = false; break; }
    }
    if (ok) out.push({ idx: i, val: vals[i] });
  }
  return out;
}

/** OLS slope of a set of (idx,val) pivot points */
function pivotSlope(pts: { idx: number; val: number }[]): number {
  if (pts.length < 2) return 0;
  const n  = pts.length;
  const sx = pts.reduce((s, p) => s + p.idx, 0);
  const sy = pts.reduce((s, p) => s + p.val, 0);
  const sxy = pts.reduce((s, p) => s + p.idx * p.val, 0);
  const sx2 = pts.reduce((s, p) => s + p.idx * p.idx, 0);
  return (n * sxy - sx * sy) / (n * sx2 - sx * sx);
}

/** Are two prices within `pct` of each other? */
function near(a: number, b: number, pct = 0.03): boolean {
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) <= pct;
}

// ─── Reversal patterns ────────────────────────────────────────────────────────

function doubleBottom(closes: number[], lows: number[]): PatternResult | null {
  const tr = findTroughs(lows, 2);
  if (tr.length < 2) return null;
  const [t1, t2] = [tr[tr.length - 2], tr[tr.length - 1]];
  if (!near(t1.val, t2.val, 0.035)) return null;
  if (t2.idx - t1.idx < 5) return null;
  const neckline = Math.max(...closes.slice(t1.idx, t2.idx + 1));
  const cur = closes[closes.length - 1];
  return {
    name: 'Double Bottom',
    type: 'bullish-reversal',
    confidence: cur >= neckline ? 82 : 62,
    description: `Two lows at ~$${t1.val.toFixed(2)} form strong support${cur >= neckline ? '; price above neckline confirms breakout' : ''}.`,
  };
}

function doubleTop(closes: number[], highs: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2);
  if (pk.length < 2) return null;
  const [p1, p2] = [pk[pk.length - 2], pk[pk.length - 1]];
  if (!near(p1.val, p2.val, 0.035)) return null;
  if (p2.idx - p1.idx < 5) return null;
  const neckline = Math.min(...closes.slice(p1.idx, p2.idx + 1));
  const cur = closes[closes.length - 1];
  return {
    name: 'Double Top',
    type: 'bearish-reversal',
    confidence: cur <= neckline ? 82 : 62,
    description: `Two peaks at ~$${p1.val.toFixed(2)} form strong resistance${cur <= neckline ? '; price below neckline confirms breakdown' : ''}.`,
  };
}

function tripleBottom(lows: number[]): PatternResult | null {
  const tr = findTroughs(lows, 2);
  if (tr.length < 3) return null;
  const [t1, t2, t3] = [tr[tr.length - 3], tr[tr.length - 2], tr[tr.length - 1]];
  if (!near(t1.val, t2.val, 0.04) || !near(t2.val, t3.val, 0.04)) return null;
  if (t3.idx - t1.idx < 10) return null;
  return {
    name: 'Triple Bottom',
    type: 'bullish-reversal',
    confidence: 86,
    description: `Three tests of support at ~$${t1.val.toFixed(2)} — very strong base, high-probability reversal.`,
  };
}

function tripleTop(highs: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2);
  if (pk.length < 3) return null;
  const [p1, p2, p3] = [pk[pk.length - 3], pk[pk.length - 2], pk[pk.length - 1]];
  if (!near(p1.val, p2.val, 0.04) || !near(p2.val, p3.val, 0.04)) return null;
  if (p3.idx - p1.idx < 10) return null;
  return {
    name: 'Triple Top',
    type: 'bearish-reversal',
    confidence: 86,
    description: `Three tests of resistance at ~$${p1.val.toFixed(2)} — strong ceiling, high-probability reversal.`,
  };
}

function headAndShoulders(highs: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2);
  if (pk.length < 3) return null;
  for (let i = pk.length - 3; i >= 0; i--) {
    const [ls, hd, rs] = [pk[i], pk[i + 1], pk[i + 2]];
    if (hd.val <= ls.val || hd.val <= rs.val) continue;
    if (!near(ls.val, rs.val, 0.06)) continue;
    if (rs.idx - ls.idx < 10) continue;
    return {
      name: 'Head & Shoulders',
      type: 'bearish-reversal',
      confidence: near(ls.val, rs.val, 0.02) ? 82 : 68,
      description: `L-shoulder $${ls.val.toFixed(2)}, head $${hd.val.toFixed(2)}, R-shoulder $${rs.val.toFixed(2)} — classic bearish reversal.`,
    };
  }
  return null;
}

function invertedHeadAndShoulders(lows: number[]): PatternResult | null {
  const tr = findTroughs(lows, 2);
  if (tr.length < 3) return null;
  for (let i = tr.length - 3; i >= 0; i--) {
    const [ls, hd, rs] = [tr[i], tr[i + 1], tr[i + 2]];
    if (hd.val >= ls.val || hd.val >= rs.val) continue;
    if (!near(ls.val, rs.val, 0.06)) continue;
    if (rs.idx - ls.idx < 10) continue;
    return {
      name: 'Inverted H&S',
      type: 'bullish-reversal',
      confidence: near(ls.val, rs.val, 0.02) ? 82 : 68,
      description: `Inv L-shoulder $${ls.val.toFixed(2)}, head $${hd.val.toFixed(2)}, R-shoulder $${rs.val.toFixed(2)} — bullish reversal.`,
    };
  }
  return null;
}

function fallingWedge(highs: number[], lows: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2).slice(-4);
  const tr = findTroughs(lows, 2).slice(-4);
  if (pk.length < 2 || tr.length < 2) return null;
  const ps = pivotSlope(pk);
  const ts = pivotSlope(tr);
  // Both trendlines falling, lows falling slower than highs (converging downward)
  if (ps >= 0 || ts >= 0) return null;
  if (ts >= ps) return null; // lows must fall less steeply than highs
  return {
    name: 'Falling Wedge',
    type: 'bullish-reversal',
    confidence: 72,
    description: 'Both highs and lows trending down with narrowing range — bullish reversal on breakout.',
  };
}

function risingWedge(highs: number[], lows: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2).slice(-4);
  const tr = findTroughs(lows, 2).slice(-4);
  if (pk.length < 2 || tr.length < 2) return null;
  const ps = pivotSlope(pk);
  const ts = pivotSlope(tr);
  // Both rising, lows rising faster than highs (converging upward)
  if (ps <= 0 || ts <= 0) return null;
  if (ts <= ps) return null; // lows must rise more steeply than highs
  return {
    name: 'Rising Wedge',
    type: 'bearish-reversal',
    confidence: 72,
    description: 'Both highs and lows trending up with narrowing range — bearish reversal warning.',
  };
}

// ─── Continuation patterns ────────────────────────────────────────────────────

function ascendingTriangle(highs: number[], lows: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2).slice(-4);
  const tr = findTroughs(lows, 2).slice(-4);
  if (pk.length < 2 || tr.length < 2) return null;

  // Flat resistance: peak range < 1.5% of mean
  const pkMean  = pk.reduce((s, p) => s + p.val, 0) / pk.length;
  const pkRange = (Math.max(...pk.map(p => p.val)) - Math.min(...pk.map(p => p.val))) / pkMean;
  if (pkRange > 0.015) return null;

  // Rising support
  if (pivotSlope(tr) <= 0) return null;

  return {
    name: 'Ascending Triangle',
    type: 'bullish-continuation',
    confidence: 74,
    description: `Flat resistance ~$${pkMean.toFixed(2)} with rising support — bullish breakout setup.`,
  };
}

function descendingTriangle(highs: number[], lows: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2).slice(-4);
  const tr = findTroughs(lows, 2).slice(-4);
  if (pk.length < 2 || tr.length < 2) return null;

  // Flat support
  const trMean  = tr.reduce((s, t) => s + t.val, 0) / tr.length;
  const trRange = (Math.max(...tr.map(t => t.val)) - Math.min(...tr.map(t => t.val))) / trMean;
  if (trRange > 0.015) return null;

  // Falling resistance
  if (pivotSlope(pk) >= 0) return null;

  return {
    name: 'Descending Triangle',
    type: 'bearish-continuation',
    confidence: 74,
    description: `Flat support ~$${trMean.toFixed(2)} with falling resistance — bearish breakdown setup.`,
  };
}

function symmetricalTriangle(highs: number[], lows: number[]): PatternResult | null {
  const pk = findPeaks(highs, 2).slice(-4);
  const tr = findTroughs(lows, 2).slice(-4);
  if (pk.length < 2 || tr.length < 2) return null;
  const ps = pivotSlope(pk);
  const ts = pivotSlope(tr);
  // Peaks falling, troughs rising
  if (ps >= 0 || ts <= 0) return null;
  // Roughly symmetric convergence
  if (Math.abs(ps + ts) > Math.abs(ps) * 0.6) return null;
  return {
    name: 'Symmetrical Triangle',
    type: 'bullish-continuation', // neutral; label depends on breakout direction
    confidence: 65,
    description: 'Converging highs and lows — coiling for breakout. Watch for volume expansion to confirm direction.',
  };
}

function bullFlag(closes: number[], highs: number[], lows: number[]): PatternResult | null {
  if (closes.length < 15) return null;
  const n       = closes.length;
  const poleEnd = n - 7;
  const poleSt  = Math.max(0, poleEnd - 8);
  const pole    = (closes[poleEnd] - closes[poleSt]) / closes[poleSt];
  if (pole < 0.03) return null;                              // need ≥3% pole

  const flagC   = closes.slice(poleEnd);
  const flagH   = Math.max(...highs.slice(poleEnd));
  const flagL   = Math.min(...lows.slice(poleEnd));
  const flagRng = (flagH - flagL) / flagH;
  if (flagRng > pole * 0.55) return null;                    // flag < 55% of pole

  const flagTrend = (flagC[flagC.length - 1] - flagC[0]) / flagC[0];
  if (flagTrend > 0.01) return null;                         // flag must not rally

  return {
    name: 'Bull Flag',
    type: 'bullish-continuation',
    confidence: 76,
    description: `Strong +${(pole * 100).toFixed(1)}% pole with tight consolidation — bullish continuation expected.`,
  };
}

function bearFlag(closes: number[], highs: number[], lows: number[]): PatternResult | null {
  if (closes.length < 15) return null;
  const n       = closes.length;
  const poleEnd = n - 7;
  const poleSt  = Math.max(0, poleEnd - 8);
  const pole    = (closes[poleSt] - closes[poleEnd]) / closes[poleSt];
  if (pole < 0.03) return null;

  const flagC   = closes.slice(poleEnd);
  const flagH   = Math.max(...highs.slice(poleEnd));
  const flagL   = Math.min(...lows.slice(poleEnd));
  const flagRng = (flagH - flagL) / flagH;
  if (flagRng > pole * 0.55) return null;

  const flagTrend = (flagC[flagC.length - 1] - flagC[0]) / flagC[0];
  if (flagTrend < -0.01) return null;                        // flag must not sell off hard

  return {
    name: 'Bear Flag',
    type: 'bearish-continuation',
    confidence: 76,
    description: `Strong -${(pole * 100).toFixed(1)}% pole with tight consolidation — bearish continuation expected.`,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run all 12 pattern detectors on a candle series.
 * @param closes  Array of closing prices (oldest → newest)
 * @param highs   Array of daily highs
 * @param lows    Array of daily lows
 * @param lookback How many recent candles to use (default 40)
 */
export function detectPatterns(
  closes: number[],
  highs:  number[],
  lows:   number[],
  lookback = 40,
): PatternResult[] {
  if (closes.length < 8) return [];
  const n = Math.min(closes.length, lookback);
  const c = closes.slice(-n);
  const h = highs.slice(-n);
  const l = lows.slice(-n);

  const detectors = [
    // Reversal patterns
    () => doubleBottom(c, l),
    () => doubleTop(c, h),
    () => tripleBottom(l),
    () => tripleTop(h),
    () => headAndShoulders(h),
    () => invertedHeadAndShoulders(l),
    () => fallingWedge(h, l),
    () => risingWedge(h, l),
    // Continuation patterns
    () => ascendingTriangle(h, l),
    () => descendingTriangle(h, l),
    () => symmetricalTriangle(h, l),
    () => bullFlag(c, h, l),
    () => bearFlag(c, h, l),
  ];

  return detectors
    .map(fn => { try { return fn(); } catch { return null; } })
    .filter((r): r is PatternResult => r !== null)
    .sort((a, b) => b.confidence - a.confidence);
}

/** Format detected patterns into a bullet-point string for AI prompts */
export function summarizePatterns(patterns: PatternResult[]): string {
  if (patterns.length === 0) return 'No chart patterns detected in the recent candle data.';
  return patterns
    .map(p => `• ${p.name} [${p.type}] — ${p.confidence}% conf: ${p.description}`)
    .join('\n');
}

/** Get a net bias score: +1 = strongly bullish, -1 = strongly bearish */
export function patternBias(patterns: PatternResult[]): number {
  if (patterns.length === 0) return 0;
  let score = 0;
  let weight = 0;
  for (const p of patterns) {
    const w = p.confidence / 100;
    const dir = p.type.startsWith('bullish') ? 1 : -1;
    score  += dir * w;
    weight += w;
  }
  return weight > 0 ? score / weight : 0;
}
