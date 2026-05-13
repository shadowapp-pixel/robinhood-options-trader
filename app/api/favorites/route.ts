import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isProUser } from '@/lib/auth';
import { redis } from '@/lib/redis';

const KEY = (userId: string) => `favorites:${userId}`;
const MAX_FAVORITES = 20;

export async function GET() {
  const user = await currentUser();
  if (!user || !isProUser(user)) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }
  try {
    const symbols = (await redis.get<string[]>(KEY(user.id))) ?? [];
    return NextResponse.json({ symbols });
  } catch {
    return NextResponse.json({ symbols: [] });
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || !isProUser(user)) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }
  try {
    const { symbols } = (await request.json()) as { symbols: string[] };
    const cleaned = [...new Set(symbols.map(s => s.toUpperCase().trim()))].slice(0, MAX_FAVORITES);
    await redis.set(KEY(user.id), cleaned, { ex: 60 * 60 * 24 * 365 }); // 1 year TTL
    return NextResponse.json({ ok: true, symbols: cleaned });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
