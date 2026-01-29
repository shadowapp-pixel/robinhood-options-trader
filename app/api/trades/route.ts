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

  try {
    // Mock trade suggestions for demonstration
    const suggestions = [
      {
        title: `${symbol} Call Option - Bullish`,
        description: 'Based on technical analysis and market sentiment',
        entryPrice: 45.50,
        exitPrice: 52.00,
        timeframe: '2-4 weeks',
        confidence: 78,
      },
      {
        title: `${symbol} Put Option - Bearish`,
        description: 'Support level breakdown detected',
        entryPrice: 42.00,
        exitPrice: 35.50,
        timeframe: '1-3 weeks',
        confidence: 65,
      },
      {
        title: `${symbol} Spread Strategy`,
        description: 'Low volatility play with defined risk',
        entryPrice: 48.00,
        exitPrice: 51.00,
        timeframe: '3-5 weeks',
        confidence: 72,
      },
    ];

    return NextResponse.json({
      symbol,
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
