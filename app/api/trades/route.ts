import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isProUser } from '@/lib/auth';
import { getATMOptions } from '@/lib/tradier';

export async function GET(request: NextRequest) {
  // ── Pro gate ──────────────────────────────────────────────────────────────
  const user  = await currentUser();
  const isPro = isProUser(user);
  if (!isPro) {
    return NextResponse.json(
      { error: 'pro_required', message: 'Trade Search is a Pro feature. Upgrade to access custom ticker analysis.' },
      { status: 403 }
    );
  }

  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });

  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (!finnhubKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  try {
    // ── 1. Fetch live stock quote from Finnhub ─────────────────────────────
    const quoteRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`,
      { cache: 'no-store' }
    );
    const quoteData = await quoteRes.json();

    if (!quoteData.c) {
      return NextResponse.json({ error: 'Invalid symbol or no data available' }, { status: 404 });
    }

    const currentPrice  = quoteData.c  as number;
    const change        = quoteData.d  as number;
    const changePercent = quoteData.dp as number;

    // ── 2. Fetch real ATM options from Tradier sandbox (if key configured) ─
    const tradierKey  = process.env.TRADIER_SANDBOX_KEY;
    const realOptions = tradierKey
      ? await getATMOptions(symbol, currentPrice, tradierKey)
      : null;

    // ── 3. Build suggestions using real data where available ───────────────
    const move = 0.004 + Math.abs(changePercent) * 0.001;   // fallback move estimate

    // Call premium: real ask if available, else formula
    const callAsk    = realOptions?.call?.ask  && realOptions.call.ask  > 0 ? realOptions.call.ask  : parseFloat((currentPrice * move).toFixed(2));
    const putAsk     = realOptions?.put?.ask   && realOptions.put.ask   > 0 ? realOptions.put.ask   : parseFloat((currentPrice * move).toFixed(2));
    const callStrike = realOptions?.call?.strike ?? currentPrice;
    const putStrike  = realOptions?.put?.strike  ?? currentPrice;
    const expLabel   = realOptions?.expiration ? `Exp ${realOptions.expiration}` : '0DTE (Today)';
    const hasReal    = !!realOptions?.call || !!realOptions?.put;

    const fmtStrike = (strike: number, isReal: boolean) =>
      isReal ? `$${strike % 1 === 0 ? strike.toFixed(0) : strike.toFixed(2)}` : `~$${Math.round(strike)} ATM`;

    const suggestions = [];

    // CALL suggestion (show when bullish or always show both)
    if (change >= 0 || hasReal) {
      const contractCost   = parseFloat((callAsk * 100).toFixed(2));
      const contractTarget = parseFloat((contractCost * 1.2).toFixed(2));
      const exitPrice      = parseFloat((currentPrice * 1.004).toFixed(2));
      suggestions.push({
        title:           `${symbol} Call Option — Bullish Momentum`,
        description:     `Up ${changePercent.toFixed(2)}% today. Needs $${exitPrice} for ~20% premium gain.`,
        entryPrice:      currentPrice.toFixed(2),
        exitPrice:       exitPrice.toFixed(2),
        premiumPerShare: callAsk.toFixed(2),
        contractCost:    contractCost.toFixed(2),
        contractTarget:  contractTarget.toFixed(2),
        strike:          fmtStrike(callStrike, !!realOptions?.call),
        timeframe:       expLabel,
        confidence:      Math.min(85, 70 + Math.abs(changePercent)),
      });
    }

    // PUT suggestion
    if (change <= 0 || hasReal) {
      const contractCost   = parseFloat((putAsk * 100).toFixed(2));
      const contractTarget = parseFloat((contractCost * 1.2).toFixed(2));
      const exitPrice      = parseFloat((currentPrice * 0.996).toFixed(2));
      suggestions.push({
        title:           `${symbol} Put Option — Bearish Pressure`,
        description:     `Down ${Math.abs(changePercent).toFixed(2)}% today. Needs $${exitPrice} for ~20% premium gain.`,
        entryPrice:      currentPrice.toFixed(2),
        exitPrice:       exitPrice.toFixed(2),
        premiumPerShare: putAsk.toFixed(2),
        contractCost:    contractCost.toFixed(2),
        contractTarget:  contractTarget.toFixed(2),
        strike:          fmtStrike(putStrike, !!realOptions?.put),
        timeframe:       expLabel,
        confidence:      Math.min(85, 70 + Math.abs(changePercent)),
      });
    }

    // Straddle (high vol)
    if (Math.abs(changePercent) > 1.5) {
      const straddleAsk    = parseFloat((callAsk + putAsk).toFixed(2));
      const straddleCost   = parseFloat((straddleAsk * 100).toFixed(2));
      const straddleTarget = parseFloat((straddleCost * 1.2).toFixed(2));
      suggestions.push({
        title:           `${symbol} Straddle — High Volatility Play`,
        description:     `${Math.abs(changePercent).toFixed(2)}% move today. Buy ATM call + put for a big directional move.`,
        entryPrice:      currentPrice.toFixed(2),
        exitPrice:       changePercent > 0
          ? (currentPrice * 1.008).toFixed(2)
          : (currentPrice * 0.992).toFixed(2),
        premiumPerShare: straddleAsk.toFixed(2),
        contractCost:    straddleCost.toFixed(2),
        contractTarget:  straddleTarget.toFixed(2),
        strike:          fmtStrike(callStrike, !!realOptions?.call),
        timeframe:       expLabel,
        confidence:      Math.min(88, 72 + Math.abs(changePercent) / 2),
      });
    }

    return NextResponse.json({
      symbol,
      currentPrice:  currentPrice.toFixed(2),
      change:        change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      suggestions,
      usingRealOptions: hasReal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching trade suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch trade suggestions' }, { status: 500 });
  }
}
