import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Bullish call option (if stock is trending up)
    if (change > 0) {
      suggestions.push({
        title: `${symbol} Call Option - Bullish Momentum`,
        description: `Stock up ${changePercent.toFixed(2)}% today. Momentum suggests continued upside.`,
        entryPrice: (currentPrice * 1.02).toFixed(2),
        exitPrice: (currentPrice * 1.08).toFixed(2),
        timeframe: '2-4 weeks',
        confidence: Math.min(85, 70 + Math.abs(changePercent)),
      });
    }

    // Bearish put option (if stock is trending down)
    if (change < 0) {
      suggestions.push({
        title: `${symbol} Put Option - Bearish Pressure`,
        description: `Stock down ${Math.abs(changePercent).toFixed(2)}% today. Downward pressure detected.`,
        entryPrice: (currentPrice * 0.98).toFixed(2),
        exitPrice: (currentPrice * 0.92).toFixed(2),
        timeframe: '1-3 weeks',
        confidence: Math.min(85, 70 + Math.abs(changePercent)),
      });
    }

    // Neutral spread strategy (always available)
    suggestions.push({
      title: `${symbol} Iron Condor - Range-Bound Strategy`,
      description: `Current price: $${currentPrice.toFixed(2)}. Profit from low volatility.`,
      entryPrice: (currentPrice * 0.97).toFixed(2),
      exitPrice: (currentPrice * 1.03).toFixed(2),
      timeframe: '3-5 weeks',
      confidence: 72,
    });

    // Add at-the-money straddle for high volatility
    if (Math.abs(changePercent) > 3) {
      suggestions.push({
        title: `${symbol} Long Straddle - High Volatility Play`,
        description: `Significant ${changePercent > 0 ? 'upward' : 'downward'} movement. Volatility opportunity.`,
        entryPrice: currentPrice.toFixed(2),
        exitPrice: (currentPrice * (changePercent > 0 ? 1.10 : 0.90)).toFixed(2),
        timeframe: '1-2 weeks',
        confidence: Math.min(88, 75 + Math.abs(changePercent) / 2),
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
