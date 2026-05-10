import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isProUser } from '@/lib/auth';

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

  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }
 
  try {
    // Fetch real stock quote
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );
    const quoteData = await quoteResponse.json();

    if (!quoteData.c) {
      return NextResponse.json(
        { error: 'Invalid symbol or no data available' },
        { status: 404 }
      );
    }

    const currentPrice = quoteData.c; // Current price
    const change = quoteData.d; // Change
    const changePercent = quoteData.dp; // Change percent

    // Generate intelligent suggestions based on real data
    const suggestions = [];

    // 0DTE ATM premium estimate (per share): ~0.4% of price for low-vol, more for high-vol
    const premiumPerShare = parseFloat((currentPrice * 0.004 + Math.abs(changePercent) * 0.001 * currentPrice).toFixed(2));
    const contractCost    = parseFloat((premiumPerShare * 100).toFixed(2));
    const contractTarget  = parseFloat((contractCost * 1.2).toFixed(2));

    // 0DTE CALL — stock needs ~0.4% move up for ~20% premium gain
    if (change > 0) {
      const exitPrice = parseFloat((currentPrice * 1.004).toFixed(2));
      suggestions.push({
        title: `${symbol} Call Option — Bullish Momentum`,
        description: `Up ${changePercent.toFixed(2)}% today. Needs $${exitPrice} for ~20% premium gain.`,
        entryPrice: currentPrice.toFixed(2),
        exitPrice: exitPrice.toFixed(2),
        premiumPerShare: premiumPerShare.toFixed(2),
        contractCost: contractCost.toFixed(2),
        contractTarget: contractTarget.toFixed(2),
        strike: `~$${Math.round(currentPrice)} ATM`,
        timeframe: '0DTE (Today)',
        confidence: Math.min(85, 70 + Math.abs(changePercent)),
      });
    }

    // 0DTE PUT — stock needs ~0.4% move down for ~20% premium gain
    if (change < 0) {
      const exitPrice = parseFloat((currentPrice * 0.996).toFixed(2));
      suggestions.push({
        title: `${symbol} Put Option — Bearish Pressure`,
        description: `Down ${Math.abs(changePercent).toFixed(2)}% today. Needs $${exitPrice} for ~20% premium gain.`,
        entryPrice: currentPrice.toFixed(2),
        exitPrice: exitPrice.toFixed(2),
        premiumPerShare: premiumPerShare.toFixed(2),
        contractCost: contractCost.toFixed(2),
        contractTarget: contractTarget.toFixed(2),
        strike: `~$${Math.round(currentPrice)} ATM`,
        timeframe: '0DTE (Today)',
        confidence: Math.min(85, 70 + Math.abs(changePercent)),
      });
    }

    // 0DTE Straddle — bet on big move in either direction
    if (Math.abs(changePercent) > 1.5) {
      const straddleCost   = parseFloat((premiumPerShare * 2 * 100).toFixed(2));
      const straddleTarget = parseFloat((straddleCost * 1.2).toFixed(2));
      suggestions.push({
        title: `${symbol} Straddle — High Volatility Play`,
        description: `${Math.abs(changePercent).toFixed(2)}% move today. Buy both ATM call + put for a big directional move.`,
        entryPrice: currentPrice.toFixed(2),
        exitPrice: changePercent > 0
          ? (currentPrice * 1.008).toFixed(2)
          : (currentPrice * 0.992).toFixed(2),
        premiumPerShare: (premiumPerShare * 2).toFixed(2),
        contractCost: straddleCost.toFixed(2),
        contractTarget: straddleTarget.toFixed(2),
        strike: `~$${Math.round(currentPrice)} ATM`,
        timeframe: '0DTE (Today)',
        confidence: Math.min(88, 72 + Math.abs(changePercent) / 2),
      });
    }

    return NextResponse.json({
      symbol,
      currentPrice: currentPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching trade suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade suggestions' },
      { status: 500 }
    );
  }
}
