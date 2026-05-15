/**
 * Tradier Sandbox options-chain helper
 * Docs: https://documentation.tradier.com/brokerage-api/markets/get-option-chains
 *
 * Sandbox base URL  : https://sandbox.tradier.com/v1
 * Auth header       : Authorization: Bearer <TRADIER_SANDBOX_KEY>
 * Data delay        : ~15 minutes behind real-time (free tier)
 *
 * Strike prices returned are always accurate (strikes don't change intraday).
 * Ask/bid prices reflect market conditions from ~15 minutes ago.
 */

const TRADIER_BASE = 'https://sandbox.tradier.com/v1';

export interface ATMOption {
  strike:     number;   // exact strike price from the options chain
  ask:        number;   // ask price per share (multiply × 100 for contract cost)
  bid:        number;
  expiration: string;   // 'YYYY-MM-DD'
  isRealData: true;
}

export interface ATMOptions {
  call: ATMOption | null;
  put:  ATMOption | null;
  expiration: string | null;
}

interface TradierRawOption {
  option_type:     'call' | 'put';
  strike:          number;
  ask:             number | null;
  bid:             number | null;
  last:            number | null;
  expiration_date: string;
}

/**
 * Fetch the nearest-expiration ATM call and put for `symbol`.
 * Returns null fields if Tradier is unreachable, the key is missing,
 * or no liquid contracts are found — callers fall back to the formula.
 */
export async function getATMOptions(
  symbol: string,
  currentPrice: number,
  token: string,
): Promise<ATMOptions> {
  const empty: ATMOptions = { call: null, put: null, expiration: null };

  try {
    // ── 1. Get valid expiration dates ──────────────────────────────────────
    const expRes = await fetch(
      `${TRADIER_BASE}/markets/options/expirations?symbol=${encodeURIComponent(symbol)}&includeAllRoots=true`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    if (!expRes.ok) return empty;

    const expJson = await expRes.json() as { expirations?: { date?: string | string[] } };
    const rawDates = expJson?.expirations?.date;
    if (!rawDates) return empty;

    // API returns a string when there's only one date, array otherwise
    const dates: string[] = Array.isArray(rawDates) ? rawDates : [rawDates];
    if (dates.length === 0) return empty;

    // Prefer today (0DTE); otherwise pick the nearest future expiration
    const today   = new Date().toISOString().split('T')[0];
    const nearest = dates.find(d => d >= today) ?? dates[0];

    // ── 2. Fetch the options chain for that expiration ─────────────────────
    const chainRes = await fetch(
      `${TRADIER_BASE}/markets/options/chains?symbol=${encodeURIComponent(symbol)}&expiration=${nearest}&greeks=false`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    if (!chainRes.ok) return empty;

    const chainJson = await chainRes.json() as { options?: { option?: TradierRawOption | TradierRawOption[] } };
    const rawOptions = chainJson?.options?.option;
    if (!rawOptions) return empty;

    // API returns a single object when chain has one strike; normalize to array
    const options: TradierRawOption[] = Array.isArray(rawOptions) ? rawOptions : [rawOptions];

    // ── 3. Find ATM call and put (closest strike to current price) ─────────
    const byDistance = (a: TradierRawOption, b: TradierRawOption) =>
      Math.abs(a.strike - currentPrice) - Math.abs(b.strike - currentPrice);

    const atmCall = options.filter(o => o.option_type === 'call').sort(byDistance)[0] ?? null;
    const atmPut  = options.filter(o => o.option_type === 'put' ).sort(byDistance)[0] ?? null;

    const toATM = (o: TradierRawOption | null): ATMOption | null => {
      if (!o) return null;
      const ask = o.ask ?? o.last ?? 0;
      const bid = o.bid ?? 0;
      if (ask <= 0) return null;   // no quote → fall back to formula
      return { strike: o.strike, ask, bid, expiration: nearest, isRealData: true };
    };

    return { call: toATM(atmCall), put: toATM(atmPut), expiration: nearest };
  } catch {
    return empty;   // network error, bad JSON, etc. — silent fallback
  }
}
