import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isProUser } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { runSignal, buildSuggestions, type Quote } from '@/lib/signals';

const CACHE_TTL = 28; // seconds — shared cache key with /api/tracker

async function fetchQuoteCached(symbol: string, apiKey: string): Promise<Quote> {
  const cacheKey = `quote:${symbol}`;
  const cached   = await redis.get<Quote>(cacheKey);
  if (cached) return cached;

  const res  = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json() as Quote;
  if (!data.c || data.c === 0) throw new Error('No price data');

  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
}

export async function GET() {
  const user = await currentUser();
  if (!user || !isProUser(user)) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  /* Load this user's favorite symbols from Redis */
  const symbols: string[] = (await redis.get(`favorites:${user.id}`)) ?? [];
  if (symbols.length === 0) {
    return NextResponse.json({ data: [], timestamp: new Date().toISOString() });
  }

  /* Fetch all quotes concurrently */
  const settled = await Promise.allSettled(
    symbols.map(async symbol => {
      const q   = await fetchQuoteCached(symbol, apiKey);
      const sig = runSignal(q.c, q.h, q.l, q.o);
      const suggestions = buildSuggestions(symbol, q.c, q.dp, sig.direction, sig.confidence);
      return {
        symbol,
        price:         q.c,
        dayOpen:       q.o,
        dayHigh:       q.h,
        dayLow:        q.l,
        prevClose:     q.pc,
        changePercent: q.dp,
        signal:        sig.signal,
        direction:     sig.direction,
        conditions:    sig.conditions,
        allPass:       sig.allPass,
        confidence:    sig.confidence,
        indicators:    sig.indicators,
        suggestions,
        error:         null as string | null,
      };
    })
  );

  const data = symbols.map((symbol, i) => {
    const r = settled[i];
    if (r.status === 'fulfilled') return r.value;
    return {
      symbol,
      price: null, dayOpen: null, dayHigh: null, dayLow: null,
      prevClose: null, changePercent: null, indicators: null,
      signal: 'NEUTRAL', direction: 'NEUTRAL',
      conditions: [], allPass: false, confidence: 0, suggestions: [],
      error: (r.reason as Error).message,
    };
  });

  return NextResponse.json({ data, timestamp: new Date().toISOString() });
}
