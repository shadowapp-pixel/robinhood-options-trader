/**
 * Multi-agent AI analysis pipeline — mirrors the TradingAgents framework
 * (github.com/TauricResearch/TradingAgents) ported to TypeScript + Claude API
 *
 * Agents (run sequentially, each feeds the next):
 *   1. Technical Analyst   — MACD, RSI, Bollinger, SMA/EMA
 *   2. Fundamental Analyst — P/E, P/B, growth, margins
 *   3. Sentiment Analyst   — news headlines + social sentiment
 *   4. Bull Researcher     — bullish thesis from all three analyses
 *   5. Bear Researcher     — bearish counter-thesis + risks
 *   6. Risk Manager        — position sizing, stop loss, risk level
 *   7. Portfolio Manager   — final BUY / HOLD / SELL / WATCH decision
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ComputedIndicators, FundamentalsData, NewsItem, SentimentData } from '@/lib/finnhub-analysis';

// ─── Config ───────────────────────────────────────────────────────────────────

// Models — claude-3-5-sonnet is broadly available on all Anthropic plans
const ANALYST_MODEL  = 'claude-3-5-sonnet-20241022';
const DECISION_MODEL = 'claude-3-5-sonnet-20241022';

// ─── Output types ─────────────────────────────────────────────────────────────

export interface TechnicalAnalysis {
  trend:        'bullish' | 'bearish' | 'neutral';
  rsiSignal:    'overbought' | 'oversold' | 'neutral';
  macdSignal:   'bullish' | 'bearish' | 'neutral';
  bbPosition:   'upper' | 'lower' | 'middle';
  smaAlignment: 'bullish' | 'bearish' | 'mixed';
  keyLevels:    { support: number; resistance: number };
  summary:      string;
  bullPoints:   string[];
  bearPoints:   string[];
}

export interface FundamentalAnalysis {
  valuation:     'undervalued' | 'fairvalue' | 'overvalued' | 'unavailable';
  peSignal:      'cheap' | 'fair' | 'expensive' | 'unavailable';
  growthOutlook: 'strong' | 'moderate' | 'weak' | 'unavailable';
  summary:       string;
  bullPoints:    string[];
  bearPoints:    string[];
}

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  newsImpact:       'high' | 'medium' | 'low';
  catalysts:        string[];
  risks:            string[];
  summary:          string;
}

export interface BullCase {
  thesis:          string;
  priceTarget:     number;
  targetTimeframe: string;
  catalysts:       string[];
  confidence:      number; // 0–100
}

export interface BearCase {
  thesis:          string;
  downTarget:      number;
  targetTimeframe: string;
  riskFactors:     string[];
  confidence:      number; // 0–100
}

export interface RiskAssessment {
  riskLevel:      'low' | 'medium' | 'high' | 'extreme';
  positionSizing: string;
  stopLoss:       number;
  maxLoss:        string;
  volatilityNote: string;
  recommendation: string;
}

export interface PortfolioDecision {
  action:      'BUY' | 'HOLD' | 'SELL' | 'WATCH';
  confidence:  number; // 0–100
  rationale:   string;
  entryZone:   { low: number; high: number } | null;
  targetPrice: number | null;
  stopLoss:    number | null;
  timeHorizon: string;
  keyRisks:    string[];
}

export interface AnalysisReport {
  symbol:        string;
  currentPrice:  number;
  generatedAt:   string;
  technical:     TechnicalAnalysis;
  fundamental:   FundamentalAnalysis;
  sentiment:     SentimentAnalysis;
  bullCase:      BullCase;
  bearCase:      BearCase;
  risk:          RiskAssessment;
  decision:      PortfolioDecision;
}

// ─── Claude helper ────────────────────────────────────────────────────────────

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

async function callClaude(
  model: string,
  system: string,
  userContent: string,
  maxTokens = 1024,
): Promise<string> {
  const msg = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.3,
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  const block = msg.content[0];
  return block.type === 'text' ? block.text : '';
}

function safeParse<T>(text: string, fallback: T): T {
  try {
    // Strip markdown fences if model included them
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

/** Returns error message string from any thrown value */
function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function n(v: number | null | undefined, decimals = 2): string {
  return v != null ? v.toFixed(decimals) : 'N/A';
}

// ─── Agent 1 — Technical Analyst ─────────────────────────────────────────────

export async function runTechnicalAgent(
  symbol: string,
  price: number,
  changePercent: number,
  indicators: ComputedIndicators | null,
  recentCloses: number[],
): Promise<TechnicalAnalysis> {
  const fallback: TechnicalAnalysis = {
    trend: 'neutral', rsiSignal: 'neutral', macdSignal: 'neutral',
    bbPosition: 'middle', smaAlignment: 'mixed',
    keyLevels: { support: price * 0.97, resistance: price * 1.03 },
    summary: 'Technical analysis unavailable.', bullPoints: [], bearPoints: [],
  };

  const ind = indicators;
  const userContent = `
Symbol: ${symbol} | Price: $${price.toFixed(2)} | Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%

TECHNICAL INDICATORS:
RSI(14): ${n(ind?.rsi14)}
MACD Line: ${n(ind?.macdLine, 4)} | Signal: ${n(ind?.macdSignal, 4)} | Histogram: ${n(ind?.macdHistogram, 4)}
Bollinger Upper: $${n(ind?.bollingerUpper)} | Mid: $${n(ind?.bollingerMid)} | Lower: $${n(ind?.bollingerLower)}
SMA20: $${n(ind?.sma20)} | SMA50: $${n(ind?.sma50)}
EMA12: $${n(ind?.ema12)} | EMA26: $${n(ind?.ema26)}
Annualised Volatility (20d): ${n(ind?.volatility20)}%

Recent 5 Closes: ${recentCloses.slice(-5).map(c => `$${c.toFixed(2)}`).join(', ')}

Analyse these indicators and return ONLY valid JSON (no markdown) with this exact schema:
{
  "trend": "bullish"|"bearish"|"neutral",
  "rsiSignal": "overbought"|"oversold"|"neutral",
  "macdSignal": "bullish"|"bearish"|"neutral",
  "bbPosition": "upper"|"lower"|"middle",
  "smaAlignment": "bullish"|"bearish"|"mixed",
  "keyLevels": { "support": <number>, "resistance": <number> },
  "summary": "<2-3 sentences>",
  "bullPoints": ["<point>", ...],
  "bearPoints": ["<point>", ...]
}
`.trim();

  try {
    const text = await callClaude(
      ANALYST_MODEL,
      'You are a professional technical analyst specialising in short-term equity momentum. ' +
      'Analyse the provided indicators objectively. Respond ONLY with valid JSON — no commentary, no markdown fences.',
      userContent,
    );
    return safeParse<TechnicalAnalysis>(text, { ...fallback, summary: `Parse error — raw: ${text.slice(0, 120)}` });
  } catch (err) {
    return { ...fallback, summary: `Agent error: ${errMsg(err)}` };
  }
}

// ─── Agent 2 — Fundamental Analyst ───────────────────────────────────────────

export async function runFundamentalAgent(
  symbol: string,
  price: number,
  fundamentals: FundamentalsData | null,
): Promise<FundamentalAnalysis> {
  const fallback: FundamentalAnalysis = {
    valuation: 'unavailable', peSignal: 'unavailable', growthOutlook: 'unavailable',
    summary: 'Fundamental data unavailable (ETF or data not returned).', bullPoints: [], bearPoints: [],
  };

  const f = fundamentals;
  // fv: safe formatter — returns 'N/A' when value is null OR when the whole fundamentals object is null
  const fv = (v: number | null | undefined, dec = 1, suffix = '') =>
    v != null ? v.toFixed(dec) + suffix : 'N/A';

  const userContent = `
Symbol: ${symbol} | Current Price: $${price.toFixed(2)}

FUNDAMENTAL METRICS:
P/E Ratio (TTM): ${fv(f?.peRatioTTM)}
P/B Ratio: ${fv(f?.pbRatio, 2)}
EPS Growth (3Y): ${fv(f?.epsGrowth3Y, 1, '%')}
Revenue Growth (3Y): ${fv(f?.revenueGrowth3Y, 1, '%')}
Gross Margin (TTM): ${fv(f?.grossMargin, 1, '%')}
52-Week High: ${f?.week52High != null ? '$' + f.week52High.toFixed(2) : 'N/A'}
52-Week Low: ${f?.week52Low  != null ? '$' + f.week52Low.toFixed(2)  : 'N/A'}
Beta: ${fv(f?.beta, 2)}
Dividend Yield: ${fv(f?.dividendYield, 2, '%')}

Note: If most metrics are N/A, this may be an ETF or index. Set valuation/peSignal/growthOutlook to "unavailable" and explain in summary.

Return ONLY valid JSON:
{
  "valuation": "undervalued"|"fairvalue"|"overvalued"|"unavailable",
  "peSignal": "cheap"|"fair"|"expensive"|"unavailable",
  "growthOutlook": "strong"|"moderate"|"weak"|"unavailable",
  "summary": "<2-3 sentences>",
  "bullPoints": ["<point>", ...],
  "bearPoints": ["<point>", ...]
}
`.trim();

  try {
    const text = await callClaude(
      ANALYST_MODEL,
      'You are a fundamental equity analyst. Evaluate valuation and growth metrics objectively. ' +
      'Respond ONLY with valid JSON — no commentary, no markdown fences.',
      userContent,
    );
    return safeParse<FundamentalAnalysis>(text, { ...fallback, summary: `Parse error — raw: ${text.slice(0, 120)}` });
  } catch (err) {
    return { ...fallback, summary: `Agent error: ${errMsg(err)}` };
  }
}

// ─── Agent 3 — Sentiment Analyst ─────────────────────────────────────────────

export async function runSentimentAgent(
  symbol: string,
  news: NewsItem[],
  sentiment: SentimentData | null,
): Promise<SentimentAnalysis> {
  const fallback: SentimentAnalysis = {
    overallSentiment: 'neutral', newsImpact: 'low',
    catalysts: [], risks: [], summary: 'Sentiment data unavailable.',
  };

  const headlines = news.slice(0, 6).map((n, i) =>
    `${i + 1}. [${n.source}] ${n.headline}${n.summary ? ' — ' + n.summary.slice(0, 120) : ''}`
  ).join('\n');

  const userContent = `
Symbol: ${symbol}

RECENT NEWS (last 7 days):
${headlines || 'No news articles returned.'}

SOCIAL SENTIMENT:
Social Buzz Score: ${sentiment?.buzz != null ? (sentiment.buzz * 100).toFixed(0) + '/100' : 'N/A'}
Bullish %: ${sentiment?.bullishPercent != null ? sentiment.bullishPercent.toFixed(1) + '%' : 'N/A'}
Bearish %: ${sentiment?.bearishPercent != null ? sentiment.bearishPercent.toFixed(1) + '%' : 'N/A'}

Return ONLY valid JSON:
{
  "overallSentiment": "positive"|"negative"|"neutral"|"mixed",
  "newsImpact": "high"|"medium"|"low",
  "catalysts": ["<catalyst 1>", "<catalyst 2>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "summary": "<2-3 sentences>"
}
`.trim();

  try {
    const text = await callClaude(
      ANALYST_MODEL,
      'You are a market sentiment analyst. Assess news tone and social sentiment objectively. ' +
      'Do NOT fabricate news — only reference what is provided. ' +
      'Respond ONLY with valid JSON — no commentary, no markdown fences.',
      userContent,
    );
    return safeParse<SentimentAnalysis>(text, { ...fallback, summary: `Parse error — raw: ${text.slice(0, 120)}` });
  } catch (err) {
    return { ...fallback, summary: `Agent error: ${errMsg(err)}` };
  }
}

// ─── Agent 4 — Bull Researcher ────────────────────────────────────────────────

export async function runBullAgent(
  symbol: string,
  price: number,
  technical: TechnicalAnalysis,
  fundamental: FundamentalAnalysis,
  sentiment: SentimentAnalysis,
): Promise<BullCase> {
  const fallback: BullCase = {
    thesis: 'Bullish analysis unavailable.',
    priceTarget: price * 1.1, targetTimeframe: '1-3 months',
    catalysts: [], confidence: 50,
  };

  const userContent = `
Symbol: ${symbol} | Current Price: $${price.toFixed(2)}

TECHNICAL SUMMARY: ${technical.summary}
Bull technical points: ${technical.bullPoints.join('; ')}

FUNDAMENTAL SUMMARY: ${fundamental.summary}
Bull fundamental points: ${fundamental.bullPoints.join('; ')}

SENTIMENT SUMMARY: ${sentiment.summary}
Catalysts: ${sentiment.catalysts.join('; ')}

Build the strongest possible BULLISH case for ${symbol} based on all of the above.

Return ONLY valid JSON:
{
  "thesis": "<3-4 sentence bullish thesis>",
  "priceTarget": <number — realistic upside price>,
  "targetTimeframe": "<e.g. 1-3 months>",
  "catalysts": ["<catalyst 1>", "<catalyst 2>", "<catalyst 3>"],
  "confidence": <integer 0-100>
}
`.trim();

  try {
    const text = await callClaude(
      ANALYST_MODEL,
      'You are a bullish equity researcher. Your role is to construct the strongest possible bullish investment thesis, grounded in the data provided. Be specific and realistic. ' +
      'Respond ONLY with valid JSON — no commentary, no markdown fences.',
      userContent,
    );
    return safeParse<BullCase>(text, { ...fallback, thesis: `Agent error (parse) — raw: ${text.slice(0, 120)}` });
  } catch (err) {
    return { ...fallback, thesis: `Agent error: ${errMsg(err)}` };
  }
}

// ─── Agent 5 — Bear Researcher ────────────────────────────────────────────────

export async function runBearAgent(
  symbol: string,
  price: number,
  technical: TechnicalAnalysis,
  fundamental: FundamentalAnalysis,
  sentiment: SentimentAnalysis,
): Promise<BearCase> {
  const fallback: BearCase = {
    thesis: 'Bearish analysis unavailable.',
    downTarget: price * 0.9, targetTimeframe: '1-3 months',
    riskFactors: [], confidence: 50,
  };

  const userContent = `
Symbol: ${symbol} | Current Price: $${price.toFixed(2)}

TECHNICAL SUMMARY: ${technical.summary}
Bear technical points: ${technical.bearPoints.join('; ')}

FUNDAMENTAL SUMMARY: ${fundamental.summary}
Bear fundamental points: ${fundamental.bearPoints.join('; ')}

SENTIMENT SUMMARY: ${sentiment.summary}
Risks: ${sentiment.risks.join('; ')}

Build the strongest possible BEARISH case for ${symbol} based on all of the above.

Return ONLY valid JSON:
{
  "thesis": "<3-4 sentence bearish thesis>",
  "downTarget": <number — realistic downside price>,
  "targetTimeframe": "<e.g. 1-3 months>",
  "riskFactors": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "confidence": <integer 0-100>
}
`.trim();

  try {
    const text = await callClaude(
      ANALYST_MODEL,
      'You are a bearish equity researcher and risk analyst. Your role is to construct the strongest possible bearish case, grounded in the data provided. Be specific and realistic. ' +
      'Respond ONLY with valid JSON — no commentary, no markdown fences.',
      userContent,
    );
    return safeParse<BearCase>(text, { ...fallback, thesis: `Agent error (parse) — raw: ${text.slice(0, 120)}` });
  } catch (err) {
    return { ...fallback, thesis: `Agent error: ${errMsg(err)}` };
  }
}

// ─── Agent 6 — Risk Manager ───────────────────────────────────────────────────

export async function runRiskAgent(
  symbol: string,
  price: number,
  bullCase: BullCase,
  bearCase: BearCase,
  volatility: number | null,
  beta: number | null,
): Promise<RiskAssessment> {
  const fallback: RiskAssessment = {
    riskLevel: 'medium',
    positionSizing: '2-3% of portfolio',
    stopLoss: price * 0.92,
    maxLoss: '8% below entry',
    volatilityNote: 'Volatility data unavailable.',
    recommendation: 'Use standard position sizing and set a stop loss.',
  };

  const userContent = `
Symbol: ${symbol} | Current Price: $${price.toFixed(2)}
Annualised Volatility: ${volatility !== null ? volatility.toFixed(1) + '%' : 'N/A'}
Beta: ${beta !== null ? beta.toFixed(2) : 'N/A'}

BULL CASE: ${bullCase.thesis} | Target: $${bullCase.priceTarget.toFixed(2)} | Confidence: ${bullCase.confidence}%
BEAR CASE: ${bearCase.thesis} | Downside: $${bearCase.downTarget.toFixed(2)} | Confidence: ${bearCase.confidence}%

Assess the risk-reward of this trade and provide portfolio management guidance.

Return ONLY valid JSON:
{
  "riskLevel": "low"|"medium"|"high"|"extreme",
  "positionSizing": "<e.g. 2-3% of portfolio>",
  "stopLoss": <price level number>,
  "maxLoss": "<e.g. 8% below entry>",
  "volatilityNote": "<1-2 sentences on volatility>",
  "recommendation": "<1-2 sentences on overall risk management>"
}
`.trim();

  try {
    const text = await callClaude(
      ANALYST_MODEL,
      'You are a risk management professional at a trading firm. Evaluate the risk-reward profile and provide concrete, conservative position sizing guidance. ' +
      'Respond ONLY with valid JSON — no commentary, no markdown fences.',
      userContent,
    );
    return safeParse<RiskAssessment>(text, { ...fallback, recommendation: `Agent error (parse) — raw: ${text.slice(0, 120)}` });
  } catch (err) {
    return { ...fallback, recommendation: `Agent error: ${errMsg(err)}`, volatilityNote: errMsg(err) };
  }
}

// ─── Agent 7 — Portfolio Manager (final decision) ─────────────────────────────

export async function runPortfolioAgent(
  symbol: string,
  price: number,
  technical: TechnicalAnalysis,
  fundamental: FundamentalAnalysis,
  sentiment: SentimentAnalysis,
  bullCase: BullCase,
  bearCase: BearCase,
  risk: RiskAssessment,
): Promise<PortfolioDecision> {
  const fallback: PortfolioDecision = {
    action: 'WATCH', confidence: 50,
    rationale: 'Insufficient data to make a high-conviction decision. Monitor for clearer signals.',
    entryZone: null, targetPrice: null, stopLoss: null,
    timeHorizon: 'Unknown', keyRisks: [],
  };

  const userContent = `
INVESTMENT COMMITTEE REVIEW: ${symbol} @ $${price.toFixed(2)}

━━ TECHNICAL ━━
Trend: ${technical.trend} | RSI: ${technical.rsiSignal} | MACD: ${technical.macdSignal}
${technical.summary}

━━ FUNDAMENTAL ━━
Valuation: ${fundamental.valuation} | Growth: ${fundamental.growthOutlook}
${fundamental.summary}

━━ SENTIMENT ━━
Overall: ${sentiment.overallSentiment} | Impact: ${sentiment.newsImpact}
${sentiment.summary}

━━ BULL CASE ━━
${bullCase.thesis}
Target: $${bullCase.priceTarget.toFixed(2)} | Confidence: ${bullCase.confidence}%

━━ BEAR CASE ━━
${bearCase.thesis}
Downside: $${bearCase.downTarget.toFixed(2)} | Confidence: ${bearCase.confidence}%

━━ RISK ━━
Risk Level: ${risk.riskLevel} | Position: ${risk.positionSizing}
Stop Loss: $${risk.stopLoss.toFixed(2)} | ${risk.recommendation}

As portfolio manager, synthesise all of the above and make a final investment decision.

Return ONLY valid JSON:
{
  "action": "BUY"|"HOLD"|"SELL"|"WATCH",
  "confidence": <integer 0-100>,
  "rationale": "<3-5 sentence synthesis explaining the decision>",
  "entryZone": { "low": <number>, "high": <number> } or null,
  "targetPrice": <number> or null,
  "stopLoss": <number> or null,
  "timeHorizon": "<e.g. 2-4 weeks>",
  "keyRisks": ["<risk 1>", "<risk 2>", "<risk 3>"]
}
`.trim();

  try {
    const text = await callClaude(
      DECISION_MODEL,
      'You are the chief portfolio manager at an investment firm. You have received analysis from your team of analysts. ' +
      'Your job is to synthesise all inputs and make a decisive, well-reasoned investment recommendation. ' +
      'BUY = high conviction entry opportunity. HOLD = already invested, maintain. SELL = exit or avoid. WATCH = wait for a better entry or more clarity. ' +
      'Be decisive. Respond ONLY with valid JSON — no commentary, no markdown fences.',
      userContent,
      1500,
    );
    return safeParse<PortfolioDecision>(text, { ...fallback, rationale: `Agent error (parse) — raw: ${text.slice(0, 200)}` });
  } catch (err) {
    return { ...fallback, rationale: `Agent error: ${errMsg(err)}` };
  }
}
