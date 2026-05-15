/**
 * SSE streaming route — runs the 7-agent TradingAgents pipeline
 * and emits progress events as each agent completes.
 *
 * GET /api/analysis/stream?symbol=AAPL
 *
 * Event types emitted:
 *   { type: 'cached',   report: AnalysisReport }         ← immediate Redis hit
 *   { type: 'progress', step: number, agent: string, status: 'running'|'done' }
 *   { type: 'complete', report: AnalysisReport }          ← pipeline finished
 *   { type: 'error',    message: string }
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isProUser } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { fetchFinnhubBundle } from '@/lib/finnhub-analysis';
import {
  runTechnicalAgent,
  runFundamentalAgent,
  runSentimentAgent,
  runBullAgent,
  runBearAgent,
  runRiskAgent,
  runPortfolioAgent,
  type AnalysisReport,
} from '@/lib/trading-agents';

export const runtime    = 'nodejs';
export const maxDuration = 60; // Vercel: allow up to 60 s (requires Hobby or Pro plan)

const CACHE_TTL = 1_800; // 30 minutes

const AGENTS = [
  'Technical Analyst',
  'Fundamental Analyst',
  'Sentiment Analyst',
  'Bull Researcher',
  'Bear Researcher',
  'Risk Manager',
  'Portfolio Manager',
];

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')?.toUpperCase().trim();

  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch { /* stream may have closed */ }
      };

      try {
        // ── Auth ─────────────────────────────────────────────────────────────
        const user  = await currentUser();
        const isPro = isProUser(user);
        if (!isPro) {
          send({ type: 'error', message: 'pro_required' });
          controller.close();
          return;
        }

        // ── Validate symbol ──────────────────────────────────────────────────
        if (!symbol || !/^[A-Z]{1,5}$/.test(symbol)) {
          send({ type: 'error', message: 'Invalid symbol. Use 1–5 uppercase letters (e.g. AAPL).' });
          controller.close();
          return;
        }

        // ── API keys ─────────────────────────────────────────────────────────
        const finnhubKey    = process.env.FINNHUB_API_KEY;
        const anthropicKey  = process.env.ANTHROPIC_API_KEY;

        if (!finnhubKey || finnhubKey === 'your_finnhub_key_here') {
          send({ type: 'error', message: 'FINNHUB_API_KEY is not configured. Add it to your Vercel environment variables.' });
          controller.close();
          return;
        }
        if (!anthropicKey || anthropicKey === 'your_anthropic_key_here') {
          send({ type: 'error', message: 'ANTHROPIC_API_KEY is not configured. Add your Anthropic API key to Vercel environment variables at vercel.com → your project → Settings → Environment Variables.' });
          controller.close();
          return;
        }

        // ── Redis cache check (skip if ?fresh=1) ────────────────────────────
        // v3 key — invalidates all previously cached error results
        const cacheKey  = `ai-analysis:v3:${symbol}`;
        const wantFresh = request.nextUrl.searchParams.get('fresh') === '1';
        if (!wantFresh) {
          const cached = await redis.get<AnalysisReport>(cacheKey);
          if (cached) {
            send({ type: 'cached', report: cached });
            controller.close();
            return;
          }
        } else {
          // Delete stale cache so fresh result is written after the run
          await redis.del(cacheKey);
        }

        // ── 1. Fetch live quote to get current price ─────────────────────────
        const quoteRes = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`,
          { cache: 'no-store' },
        );
        const quote = await quoteRes.json() as { c?: number; dp?: number };
        if (!quote.c || quote.c === 0) {
          send({ type: 'error', message: `No market data found for "${symbol}". Check the ticker and try again during market hours.` });
          controller.close();
          return;
        }

        const price         = quote.c;
        const changePercent = quote.dp ?? 0;

        // ── 2. Fetch Finnhub bundle (candles, fundamentals, news, sentiment) ─
        send({ type: 'progress', step: 0, agent: 'Fetching market data', status: 'running' });
        const bundle = await fetchFinnhubBundle(symbol, finnhubKey, price, changePercent);
        send({ type: 'progress', step: 0, agent: 'Fetching market data', status: 'done' });

        // ── 3. Run agents sequentially ───────────────────────────────────────

        // Agent 1 — Technical
        send({ type: 'progress', step: 1, agent: AGENTS[0], status: 'running' });
        const technical = await runTechnicalAgent(
          symbol, price, changePercent,
          bundle.indicators,
          bundle.candles?.closes ?? [],
        );
        send({ type: 'progress', step: 1, agent: AGENTS[0], status: 'done' });

        // Agent 2 — Fundamental
        send({ type: 'progress', step: 2, agent: AGENTS[1], status: 'running' });
        const fundamental = await runFundamentalAgent(symbol, price, bundle.fundamentals);
        send({ type: 'progress', step: 2, agent: AGENTS[1], status: 'done' });

        // Agent 3 — Sentiment
        send({ type: 'progress', step: 3, agent: AGENTS[2], status: 'running' });
        const sentiment = await runSentimentAgent(symbol, bundle.news, bundle.sentiment);
        send({ type: 'progress', step: 3, agent: AGENTS[2], status: 'done' });

        // Agent 4 — Bull Researcher
        send({ type: 'progress', step: 4, agent: AGENTS[3], status: 'running' });
        const bullCase = await runBullAgent(symbol, price, technical, fundamental, sentiment);
        send({ type: 'progress', step: 4, agent: AGENTS[3], status: 'done' });

        // Agent 5 — Bear Researcher
        send({ type: 'progress', step: 5, agent: AGENTS[4], status: 'running' });
        const bearCase = await runBearAgent(symbol, price, technical, fundamental, sentiment);
        send({ type: 'progress', step: 5, agent: AGENTS[4], status: 'done' });

        // Agent 6 — Risk Manager
        send({ type: 'progress', step: 6, agent: AGENTS[5], status: 'running' });
        const risk = await runRiskAgent(
          symbol, price, bullCase, bearCase,
          bundle.indicators?.volatility20 ?? null,
          bundle.fundamentals?.beta ?? null,
        );
        send({ type: 'progress', step: 6, agent: AGENTS[5], status: 'done' });

        // Agent 7 — Portfolio Manager
        send({ type: 'progress', step: 7, agent: AGENTS[6], status: 'running' });
        const decision = await runPortfolioAgent(
          symbol, price, technical, fundamental, sentiment,
          bullCase, bearCase, risk,
        );
        send({ type: 'progress', step: 7, agent: AGENTS[6], status: 'done' });

        // ── 4. Assemble report ───────────────────────────────────────────────
        const report: AnalysisReport = {
          symbol, currentPrice: price,
          generatedAt: new Date().toISOString(),
          technical, fundamental, sentiment,
          bullCase, bearCase, risk, decision,
        };

        // ── 5. Cache in Redis ────────────────────────────────────────────────
        await redis.set(cacheKey, report, { ex: CACHE_TTL });

        send({ type: 'complete', report });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Analysis failed. Please try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering (important for SSE on some hosts)
    },
  });
}
