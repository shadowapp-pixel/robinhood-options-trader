import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isProUser } from '@/lib/auth';

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
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    if (!data.c || data.c === 0) {
      return NextResponse.json({ error: 'Price unavailable' }, { status: 404 });
    }
    return NextResponse.json({ symbol, price: data.c as number });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
