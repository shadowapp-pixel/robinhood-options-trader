import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isProUser } from '@/lib/auth';
import { redis } from '@/lib/redis';

const KEY = (userId: string) => `contracts:${userId}`;
const TTL = 60 * 60 * 24 * 30; // 30 days

export async function GET() {
  const user = await currentUser();
  if (!user || !isProUser(user)) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  try {
    const contracts = (await redis.get(KEY(user.id))) ?? [];
    return NextResponse.json({ contracts });
  } catch {
    return NextResponse.json({ contracts: [] });
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || !isProUser(user)) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  try {
    const { contracts } = (await request.json()) as { contracts: unknown[] };
    await redis.set(KEY(user.id), contracts, { ex: TTL });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
