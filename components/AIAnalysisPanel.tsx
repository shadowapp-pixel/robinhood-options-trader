'use client';

import { useState, useRef, useEffect } from 'react';
import type {
  AnalysisReport,
  TechnicalAnalysis,
  FundamentalAnalysis,
  SentimentAnalysis,
  BullCase,
  BearCase,
  RiskAssessment,
  PortfolioDecision,
} from '@/lib/trading-agents';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentStep {
  label:  string;
  status: 'pending' | 'running' | 'done';
}

type Phase =
  | { name: 'idle' }
  | { name: 'loading'; steps: AgentStep[] }
  | { name: 'complete'; report: AnalysisReport; fromCache: boolean }
  | { name: 'error'; message: string };

interface ProgressEvent {
  type:   'progress';
  step:   number;
  agent:  string;
  status: 'running' | 'done';
}
interface CompleteEvent { type: 'complete'; report: AnalysisReport }
interface CachedEvent   { type: 'cached';   report: AnalysisReport }
interface ErrorEvent    { type: 'error';    message: string }
type StreamEvent = ProgressEvent | CompleteEvent | CachedEvent | ErrorEvent;

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Fetching market data',
  'Technical Analyst',
  'Fundamental Analyst',
  'Sentiment Analyst',
  'Bull Researcher',
  'Bear Researcher',
  'Risk Manager',
  'Portfolio Manager',
];

const initialSteps = (): AgentStep[] =>
  STEP_LABELS.map(label => ({ label, status: 'pending' }));

// ─── Small helper components ──────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a1a] transition-colors"
      >
        <span className="text-xs font-bold text-[#9e9e9e] uppercase tracking-widest">{title}</span>
        <span className="text-[#4a4a4a] text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function ConfBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-block text-[11px] bg-[#1e1e1e] border border-[#2a2a2a] text-[#9e9e9e] rounded-lg px-2.5 py-1 mr-1.5 mb-1.5">
      {text}
    </span>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────

function StepList({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            {step.status === 'done'    && <span className="text-[#00C805] text-xs font-bold">✓</span>}
            {step.status === 'running' && (
              <span className="w-4 h-4 rounded-full border-2 border-[#00C805] border-t-transparent animate-spin inline-block" />
            )}
            {step.status === 'pending' && <span className="w-2 h-2 rounded-full bg-[#2a2a2a] inline-block" />}
          </div>
          <span className={`text-xs ${step.status === 'done' ? 'text-[#9e9e9e]' : step.status === 'running' ? 'text-white font-semibold' : 'text-[#4a4a4a]'}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Decision Banner ──────────────────────────────────────────────────────────

function DecisionBanner({ decision, symbol, price }: { decision: PortfolioDecision; symbol: string; price: number }) {
  const actionColors: Record<string, string> = {
    BUY:   'bg-[#00C805]/15 border-[#00C805]/40 text-[#00C805]',
    HOLD:  'bg-amber-500/15  border-amber-500/40  text-amber-400',
    SELL:  'bg-[#EF4444]/15  border-[#EF4444]/40  text-[#EF4444]',
    WATCH: 'bg-[#60a5fa]/15  border-[#60a5fa]/40  text-[#60a5fa]',
  };
  const confColor =
    decision.confidence >= 75 ? 'bg-[#00C805]' :
    decision.confidence >= 55 ? 'bg-amber-500' : 'bg-[#EF4444]';
  const ac = actionColors[decision.action] ?? actionColors.WATCH;

  return (
    <div className={`border rounded-2xl overflow-hidden ${ac}`}>
      {/* Top row */}
      <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-black tracking-tight ${ac.split(' ')[2]}`}>{decision.action}</div>
          <div>
            <p className="text-xs text-[#6b6b6b] uppercase tracking-widest mb-1">AI Recommendation</p>
            <p className="text-white text-sm font-semibold">{symbol} · ${price.toFixed(2)}</p>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{decision.timeHorizon}</p>
          </div>
        </div>
        {/* Confidence */}
        <div className="text-right">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Confidence</p>
          <p className={`text-3xl font-black font-mono ${ac.split(' ')[2]}`}>{decision.confidence}%</p>
          <div className="w-24 mt-1 ml-auto">
            <ConfBar value={decision.confidence} color={confColor} />
          </div>
        </div>
      </div>

      {/* Rationale */}
      <div className="px-6 pb-4">
        <p className="text-sm text-[#9e9e9e] leading-relaxed">{decision.rationale}</p>
      </div>

      {/* Entry / Target / Stop grid */}
      <div className="grid grid-cols-3 divide-x divide-[#2a2a2a] border-t border-[#2a2a2a]">
        <div className="px-5 py-3.5">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Entry Zone</p>
          <p className="text-sm font-bold font-mono text-white">
            {decision.entryZone ? `$${decision.entryZone.low.toFixed(2)} – $${decision.entryZone.high.toFixed(2)}` : '—'}
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Price Target</p>
          <p className="text-sm font-bold font-mono text-[#00C805]">
            {decision.targetPrice ? `$${decision.targetPrice.toFixed(2)}` : '—'}
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Stop Loss</p>
          <p className="text-sm font-bold font-mono text-[#EF4444]">
            {decision.stopLoss ? `$${decision.stopLoss.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>

      {/* Key risks */}
      {decision.keyRisks.length > 0 && (
        <div className="px-6 py-3.5 border-t border-[#2a2a2a]">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-2">Key Risks</p>
          <div>{decision.keyRisks.map((r, i) => <Pill key={i} text={r} />)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Technical card ───────────────────────────────────────────────────────────

function TechnicalCard({ t }: { t: TechnicalAnalysis }) {
  const trendColor = t.trend === 'bullish' ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
                     t.trend === 'bearish' ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
                                             'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return (
    <SectionCard title="📈 Technical Analysis">
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge label={`Trend: ${t.trend}`} color={trendColor} />
        <Badge label={`RSI: ${t.rsiSignal}`}
          color={t.rsiSignal === 'overbought' ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
                 t.rsiSignal === 'oversold'   ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
                                               'text-[#6b6b6b] border-[#2a2a2a] bg-[#1e1e1e]'} />
        <Badge label={`MACD: ${t.macdSignal}`}
          color={t.macdSignal === 'bullish' ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
                 t.macdSignal === 'bearish' ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
                                             'text-[#6b6b6b] border-[#2a2a2a] bg-[#1e1e1e]'} />
        <Badge label={`BB: ${t.bbPosition}`} color="text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/10" />
      </div>
      <p className="text-sm text-[#9e9e9e] leading-relaxed mb-4">{t.summary}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-xl p-3">
          <p className="text-[10px] text-[#00C805] uppercase tracking-widest font-bold mb-2">Bull Points</p>
          <ul className="space-y-1">
            {t.bullPoints.map((p, i) => <li key={i} className="text-xs text-[#9e9e9e] flex gap-2"><span className="text-[#00C805] shrink-0">+</span>{p}</li>)}
          </ul>
        </div>
        <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-3">
          <p className="text-[10px] text-[#EF4444] uppercase tracking-widest font-bold mb-2">Bear Points</p>
          <ul className="space-y-1">
            {t.bearPoints.map((p, i) => <li key={i} className="text-xs text-[#9e9e9e] flex gap-2"><span className="text-[#EF4444] shrink-0">−</span>{p}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
        <div className="text-center">
          <p className="text-[10px] text-[#6b6b6b] mb-0.5">Support</p>
          <p className="text-sm font-mono font-bold text-white">${t.keyLevels.support.toFixed(2)}</p>
        </div>
        <div className="h-px flex-1 bg-[#2a2a2a] mx-4" />
        <div className="text-center">
          <p className="text-[10px] text-[#6b6b6b] mb-0.5">Resistance</p>
          <p className="text-sm font-mono font-bold text-white">${t.keyLevels.resistance.toFixed(2)}</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Fundamental card ─────────────────────────────────────────────────────────

function FundamentalCard({ f }: { f: FundamentalAnalysis }) {
  const valColor =
    f.valuation === 'undervalued' ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
    f.valuation === 'overvalued'  ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
    f.valuation === 'fairvalue'   ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                    'text-[#6b6b6b] border-[#2a2a2a] bg-[#1e1e1e]';
  return (
    <SectionCard title="📊 Fundamental Analysis">
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge label={`Valuation: ${f.valuation}`} color={valColor} />
        <Badge label={`P/E: ${f.peSignal}`}
          color={f.peSignal === 'cheap' ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
                 f.peSignal === 'expensive' ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
                                             'text-[#6b6b6b] border-[#2a2a2a] bg-[#1e1e1e]'} />
        <Badge label={`Growth: ${f.growthOutlook}`}
          color={f.growthOutlook === 'strong' ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
                 f.growthOutlook === 'weak'   ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
                                               'text-[#6b6b6b] border-[#2a2a2a] bg-[#1e1e1e]'} />
      </div>
      <p className="text-sm text-[#9e9e9e] leading-relaxed mb-4">{f.summary}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-xl p-3">
          <p className="text-[10px] text-[#00C805] uppercase tracking-widest font-bold mb-2">Bull Points</p>
          <ul className="space-y-1">
            {f.bullPoints.length > 0 ? f.bullPoints.map((p, i) => <li key={i} className="text-xs text-[#9e9e9e] flex gap-2"><span className="text-[#00C805] shrink-0">+</span>{p}</li>) : <li className="text-xs text-[#4a4a4a]">None identified</li>}
          </ul>
        </div>
        <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-3">
          <p className="text-[10px] text-[#EF4444] uppercase tracking-widest font-bold mb-2">Bear Points</p>
          <ul className="space-y-1">
            {f.bearPoints.length > 0 ? f.bearPoints.map((p, i) => <li key={i} className="text-xs text-[#9e9e9e] flex gap-2"><span className="text-[#EF4444] shrink-0">−</span>{p}</li>) : <li className="text-xs text-[#4a4a4a]">None identified</li>}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Sentiment card ───────────────────────────────────────────────────────────

function SentimentCard({ s }: { s: SentimentAnalysis }) {
  const sentColor =
    s.overallSentiment === 'positive' ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
    s.overallSentiment === 'negative' ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
    s.overallSentiment === 'mixed'    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                        'text-[#6b6b6b] border-[#2a2a2a] bg-[#1e1e1e]';
  return (
    <SectionCard title="📰 News & Sentiment">
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge label={s.overallSentiment} color={sentColor} />
        <Badge label={`News Impact: ${s.newsImpact}`}
          color={s.newsImpact === 'high'   ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                 s.newsImpact === 'medium' ? 'text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/10' :
                                            'text-[#6b6b6b] border-[#2a2a2a] bg-[#1e1e1e]'} />
      </div>
      <p className="text-sm text-[#9e9e9e] leading-relaxed mb-4">{s.summary}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-[#00C805] uppercase tracking-widest font-bold mb-2">Catalysts</p>
          {s.catalysts.length > 0 ? s.catalysts.map((c, i) => <Pill key={i} text={c} />) : <p className="text-xs text-[#4a4a4a]">None identified</p>}
        </div>
        <div>
          <p className="text-[10px] text-[#EF4444] uppercase tracking-widest font-bold mb-2">Risks</p>
          {s.risks.length > 0 ? s.risks.map((r, i) => <Pill key={i} text={r} />) : <p className="text-xs text-[#4a4a4a]">None identified</p>}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Bull vs Bear ─────────────────────────────────────────────────────────────

function BullBearSection({ bull, bear, price }: { bull: BullCase; bear: BearCase; price: number }) {
  const bullUpside = price > 0 ? ((bull.priceTarget - price) / price * 100) : 0;
  const bearDown   = price > 0 ? ((price - bear.downTarget) / price * 100) : 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Bull */}
      <div className="bg-[#151515] border border-[#00C805]/30 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#00C805]/20 bg-[#00C805]/5 flex items-center justify-between">
          <span className="text-xs font-bold text-[#00C805] uppercase tracking-widest">🐂 Bull Case</span>
          <span className="text-xs font-mono text-[#00C805]">+{bullUpside.toFixed(1)}% upside</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-[#9e9e9e] leading-relaxed mb-3">{bull.thesis}</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#6b6b6b]">Target: ${bull.priceTarget.toFixed(2)} · {bull.targetTimeframe}</span>
            <span className="text-[10px] text-[#00C805] font-bold">{bull.confidence}% conf.</span>
          </div>
          <ConfBar value={bull.confidence} color="bg-[#00C805]" />
          {bull.catalysts.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-[#6b6b6b] mb-1.5 uppercase tracking-widest">Catalysts</p>
              <div>{bull.catalysts.map((c, i) => <Pill key={i} text={c} />)}</div>
            </div>
          )}
        </div>
      </div>
      {/* Bear */}
      <div className="bg-[#151515] border border-[#EF4444]/30 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#EF4444]/20 bg-[#EF4444]/5 flex items-center justify-between">
          <span className="text-xs font-bold text-[#EF4444] uppercase tracking-widest">🐻 Bear Case</span>
          <span className="text-xs font-mono text-[#EF4444]">−{bearDown.toFixed(1)}% downside</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-[#9e9e9e] leading-relaxed mb-3">{bear.thesis}</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#6b6b6b]">Target: ${bear.downTarget.toFixed(2)} · {bear.targetTimeframe}</span>
            <span className="text-[10px] text-[#EF4444] font-bold">{bear.confidence}% conf.</span>
          </div>
          <ConfBar value={bear.confidence} color="bg-[#EF4444]" />
          {bear.riskFactors.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-[#6b6b6b] mb-1.5 uppercase tracking-widest">Risk Factors</p>
              <div>{bear.riskFactors.map((r, i) => <Pill key={i} text={r} />)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Risk panel ───────────────────────────────────────────────────────────────

function RiskPanel({ risk }: { risk: RiskAssessment }) {
  const levelColor =
    risk.riskLevel === 'low'     ? 'text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10' :
    risk.riskLevel === 'medium'  ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
    risk.riskLevel === 'high'    ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10' :
                                   'text-red-300 border-red-500/30 bg-red-500/10';
  return (
    <SectionCard title="⚠️ Risk Assessment">
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge label={`Risk: ${risk.riskLevel.toUpperCase()}`} color={levelColor} />
        <Badge label={risk.positionSizing} color="text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/10" />
      </div>
      <p className="text-sm text-[#9e9e9e] leading-relaxed mb-3">{risk.recommendation}</p>
      <p className="text-xs text-[#6b6b6b] mb-4">{risk.volatilityNote}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1e1e1e] rounded-xl p-3">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Stop Loss</p>
          <p className="text-base font-bold font-mono text-[#EF4444]">${risk.stopLoss.toFixed(2)}</p>
        </div>
        <div className="bg-[#1e1e1e] rounded-xl p-3">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Max Loss Est.</p>
          <p className="text-base font-bold font-mono text-[#EF4444]">{risk.maxLoss}</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Cache badge ──────────────────────────────────────────────────────────────

function CacheBadge({ generatedAt }: { generatedAt: string }) {
  const ageMs    = Date.now() - new Date(generatedAt).getTime();
  const ageMins  = Math.floor(ageMs / 60_000);
  const expiresIn = Math.max(0, 30 - ageMins);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] text-[#6b6b6b]">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Cached · expires in ~{expiresIn}m
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIAnalysisPanel() {
  const [inputSymbol, setInputSymbol] = useState('');
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const esRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => { esRef.current?.close(); };
  }, []);

  const runAnalysis = (sym: string) => {
    const upper = sym.toUpperCase().trim();
    if (!upper || !/^[A-Z]{1,5}$/.test(upper)) return;

    // Close any existing stream
    esRef.current?.close();

    setPhase({ name: 'loading', steps: initialSteps() });

    // Always send fresh=1 so each button click bypasses the Redis cache
    // and calls Claude with the current API key / model
    const es = new EventSource(`/api/analysis/stream?symbol=${upper}&fresh=1`);
    esRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as StreamEvent;

      if (data.type === 'cached') {
        es.close();
        setPhase({ name: 'complete', report: data.report, fromCache: true });
        return;
      }

      if (data.type === 'complete') {
        es.close();
        setPhase({ name: 'complete', report: data.report, fromCache: false });
        return;
      }

      if (data.type === 'error') {
        es.close();
        const msg =
          data.message === 'pro_required'
            ? 'AI Analysis is a Pro feature. Upgrade to access.'
            : data.message;
        setPhase({ name: 'error', message: msg });
        return;
      }

      if (data.type === 'progress') {
        setPhase(prev => {
          if (prev.name !== 'loading') return prev;
          const next = [...prev.steps];
          // step 0 = data fetch, steps 1-7 = agents
          const idx = data.step;
          if (idx < next.length) {
            if (data.status === 'running') next[idx] = { ...next[idx], status: 'running' };
            if (data.status === 'done')    next[idx] = { ...next[idx], status: 'done' };
          }
          return { name: 'loading', steps: next };
        });
      }
    };

    es.onerror = () => {
      es.close();
      setPhase(prev =>
        prev.name === 'loading'
          ? { name: 'error', message: 'Connection lost. Please try again.' }
          : prev
      );
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(inputSymbol);
  };

  const reset = () => {
    esRef.current?.close();
    setPhase({ name: 'idle' });
  };

  return (
    <div className="space-y-6">

      {/* Search bar */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-1">
          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">Multi-Agent AI Analysis</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-[#00C805] border-[#00C805]/30 bg-[#00C805]/10 uppercase tracking-wider">
            7 Agents
          </span>
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Deep Investment Analysis</h2>
        <p className="text-xs text-[#6b6b6b] mb-4">
          Runs Technical → Fundamental → Sentiment → Bull/Bear Research → Risk → Portfolio Manager.
          Results cached 30 min · Takes ~20–40 s for a fresh analysis.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Ticker — AAPL, NVDA, SPY…"
            value={inputSymbol}
            onChange={e => setInputSymbol(e.target.value.toUpperCase())}
            disabled={phase.name === 'loading'}
            className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#00C805]/60 transition-colors font-mono disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={phase.name === 'loading' || !inputSymbol.trim()}
            className="px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] disabled:bg-[#1e1e1e] disabled:text-[#4a4a4a] text-black text-sm font-bold rounded-xl transition-colors shrink-0"
          >
            {phase.name === 'loading' ? 'Analysing…' : 'Run Analysis'}
          </button>
          {(phase.name === 'complete' || phase.name === 'error') && (
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] text-[#9e9e9e] hover:text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Loading — agent stepper */}
      {phase.name === 'loading' && (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6">
          <p className="text-xs font-bold text-[#9e9e9e] uppercase tracking-widest mb-4">Running Agent Pipeline</p>
          <StepList steps={phase.steps} />
          <p className="text-[10px] text-[#3a3a3a] mt-4">Each agent feeds its analysis to the next. Please wait…</p>
        </div>
      )}

      {/* Error */}
      {phase.name === 'error' && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl px-5 py-4 text-[#EF4444] text-sm">
          {phase.message}
        </div>
      )}

      {/* Complete — full report */}
      {phase.name === 'complete' && (() => {
        const { report, fromCache } = phase;
        return (
          <div className="space-y-4">

            {/* Report header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-[#9e9e9e] uppercase tracking-widest">
                  Analysis Report — {report.symbol}
                </h3>
                {fromCache && <CacheBadge generatedAt={report.generatedAt} />}
              </div>
              <span className="text-xs text-[#4a4a4a]">
                {new Date(report.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Diagnostic banner — shown when agents failed (error injected into summary) */}
            {report.technical.summary.startsWith('Agent error:') && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl px-5 py-4">
                <p className="text-[10px] text-[#EF4444] uppercase tracking-widest font-bold mb-1">⚠ Claude API Error Detected</p>
                <p className="text-xs text-[#EF4444] font-mono break-all">{report.technical.summary}</p>
                <p className="text-[10px] text-[#9e9e9e] mt-2">
                  Check that <span className="font-mono text-white">ANTHROPIC_API_KEY</span> is set correctly in Vercel → Settings → Environment Variables, then redeploy.
                </p>
              </div>
            )}

            {/* 1. Decision banner */}
            <DecisionBanner
              decision={report.decision}
              symbol={report.symbol}
              price={report.currentPrice}
            />

            {/* 2. Bull vs Bear */}
            <div>
              <p className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-semibold mb-3">Researcher Debate</p>
              <BullBearSection
                bull={report.bullCase}
                bear={report.bearCase}
                price={report.currentPrice}
              />
            </div>

            {/* 3. Analyst cards (2-col on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TechnicalCard   t={report.technical}   />
              <FundamentalCard f={report.fundamental} />
            </div>
            <SentimentCard s={report.sentiment} />

            {/* 4. Risk */}
            <RiskPanel risk={report.risk} />

            {/* Disclaimer */}
            <p className="text-[10px] text-[#3a3a3a] text-center pb-2">
              AI-generated analysis is for educational purposes only and does not constitute financial advice.
              Always do your own research before making investment decisions.
            </p>
          </div>
        );
      })()}

      {/* Idle empty state */}
      {phase.name === 'idle' && (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4 text-2xl">
            🤖
          </div>
          <p className="text-white font-bold mb-1">7 AI Agents, 1 Decision</p>
          <p className="text-[#6b6b6b] text-sm max-w-sm mx-auto">
            Enter any ticker above to run a full investment analysis — Technical, Fundamental,
            Sentiment, Bull/Bear Research, Risk Management, and a final Portfolio Manager verdict.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['AAPL', 'NVDA', 'TSLA', 'SPY', 'MSFT'].map(s => (
              <button
                key={s}
                onClick={() => { setInputSymbol(s); runAnalysis(s); }}
                className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] text-[#9e9e9e] hover:text-white hover:border-[#00C805]/40 text-xs font-mono font-bold rounded-lg transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
