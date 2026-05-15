/**
 * GET /api/check-models
 * Diagnostic: lists Anthropic models available on this API key
 */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'No ANTHROPIC_API_KEY set' }, { status: 500 });

  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      cache: 'no-store',
    });
    const body = await res.json();
    return NextResponse.json({ status: res.status, body });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
