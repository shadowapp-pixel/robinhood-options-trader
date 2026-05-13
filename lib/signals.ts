/**
 * Shared market signal + suggestion logic
 * Used by /api/tracker and /api/favorites/data
 */

export type Quote = { c: number; h: number; l: number; o: number; pc: number; dp: number };
export type Condition = { label: string; pass: boolean };

export const VOL_MOVE: Record<string, number> = {
  low:    0.003,
  medium: 0.005,
  high:   0.008,
};

export function runSignal(c: number, h: number, l: number, o: number) {
  const vwap         = (h + l + c) / 3;
  const ema8proxy    = o;
  const rangeSpan    = h - l;
  const rangePos     = rangeSpan > 0 ? ((c - l) / rangeSpan) * 100 : 50;
  const distFromVWAP = Math.abs((c - vwap) / vwap) * 100;

  const bullishBias = c > vwap && c > ema8proxy;
  const bearishBias = c < vwap && c < ema8proxy;

  const conditions: Condition[] = [];
  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';

  if (bullishBias) {
    direction = 'CALL';
    conditions.push({ label: 'Price above VWAP',                         pass: true           });
    conditions.push({ label: 'Price above open (intraday uptrend)',       pass: true           });
    conditions.push({ label: 'Range position < 30 — intraday pullback',  pass: rangePos < 30  });
    conditions.push({ label: 'Within 1.5% of VWAP',                      pass: distFromVWAP < 1.5 });
  } else if (bearishBias) {
    direction = 'PUT';
    conditions.push({ label: 'Price below VWAP',                          pass: true           });
    conditions.push({ label: 'Price below open (intraday downtrend)',      pass: true           });
    conditions.push({ label: 'Range position > 70 — intraday extension',  pass: rangePos > 70  });
    conditions.push({ label: 'Within 1.5% of VWAP',                       pass: distFromVWAP < 1.5 });
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

export function buildSuggestions(
  symbol: string, price: number, changePercent: number,
  direction: string, signalConfidence: number, volTier = 'medium',
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
      type: 'CALL' as const,
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
      type: 'PUT' as const,
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
