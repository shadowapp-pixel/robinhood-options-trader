import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isProUser } from '@/lib/auth';
import { redis } from '@/lib/redis';

const CACHE_TTL = 28; // seconds — shared cache key with /api/tracker

export async function GET(request: Request) {
  const user = await currentUser();
  if (!isProUser(user)) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase().trim();
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const cacheKey = `quote:${symbol}`;

    // Check Redis cache first — shared with /api/tracker
    const cached = await redis.get<{ c: number }>(cacheKey);
    if (cached?.c) {
      return NextResponse.json({ symbol, price: cached.c });
    }

    // Cache miss — fetch from Finnhub
    const res  = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { cache: 'no-store' }
    );
    const data = await res.json() as { c?: number; h?: number; l?: number; o?: number; pc?: number; dp?: number };
    if (!data.c || data.c === 0) {
      return NextResponse.json({ error: 'Price unavailable' }, { status: 404 });
    }

    await redis.set(cacheKey, data, { ex: CACHE_TTL });
    return NextResponse.json({ symbol, price: data.c });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
