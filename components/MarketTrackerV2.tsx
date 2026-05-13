'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import StockChart from '@/components/StockChart';

interface Condition  { label: string; pass: boolean; }
interface Suggestion {
  type: 'CALL' | 'PUT';
  title: string;
  description: string;
  entryPrice: string;
  exitPrice: string;
  premiumPerShare: string;
  contractCost: string;
  contractTarget: string;
  strike: string;
  timeframe: string;
  confidence: number;
}
interface TrackerEntry {
  symbol: string;
  name: string;
  type: string;
  locked?: boolean;
  price: number | null;
  dayOpen: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  prevClose: number | null;
  changePercent: number | null;
  indicators: { ema8proxy: number; vwap: number; rangePos: number } | null;
  signal: string;
  direction: string;
  conditions: Condition[];
  allPass: boolean;
  confidence: number;
  suggestions: Suggestion[];
  error: string | null;
}
interface TrackerResponse { data: TrackerEntry[]; timestamp: string; isPro: boolean; }

interface AlertToast {
  id: number;
  symbol: string;
  name: string;
  signal: 'CALL' | 'PUT';
  price: number;
  confidence: number;
  firedAt: Date;
}

// ─── Color tokens ─────────────────────────────────────────────────────────────
// GREEN    = #00C805  RED     = #EF4444
// BG       = #000000  SURFACE = #151515  SURFACE2 = #1e1e1e
// BORDER   = #2a2a2a  TEXT2   = #9e9e9e  TEXT3    = #6b6b6b

const REFRESH_MS = 30_000;
const TOAST_TTL  = 12_000;

function playAlertBeep(signal: 'CALL' | 'PUT') {
  try {
    const ctx  = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const freqs = signal === 'CALL' ? [660, 880] : [440, 330];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.35);
    });
  } catch { /* browser may block autoplay */ }
}

// ─── Market session ───────────────────────────────────────────────────────────

type MarketSession = 'open' | 'premarket' | 'afterhours' | 'closed';

function getMarketSession(): MarketSession {
  const now  = new Date();
  const et   = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day  = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  if (day === 0 || day === 6) return 'closed';
  if (mins >= 240  && mins < 570)  return 'premarket';
  if (mins >= 570  && mins < 960)  return 'open';
  if (mins >= 960  && mins < 1200) return 'afterhours';
  return 'closed';
}

function SessionBadge() {
  const [session, setSession] = useState(getMarketSession());
  useEffect(() => {
    const t = setInterval(() => setSession(getMarketSession()), 60_000);
    return () => clearInterval(t);
  }, []);
  const cfgMap = {
    open:       { label: 'Market Open',   dot: 'bg-[#00C805] animate-pulse', text: 'text-[#00C805]', border: 'border-[#00C805]/30 bg-[#00C805]/10' },
    premarket:  { label: 'Pre-Market',    dot: 'bg-amber-400',               text: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/10' },
    afterhours: { label: 'After Hours',   dot: 'bg-[#60a5fa]',               text: 'text-[#60a5fa]', border: 'border-[#60a5fa]/30 bg-[#60a5fa]/10' },
    closed:     { label: 'Market Closed', dot: 'bg-[#6b6b6b]',               text: 'text-[#6b6b6b]', border: 'border-[#2a2a2a] bg-[#1e1e1e]'      },
  };
  const cfg = cfgMap[session] ?? cfgMap.closed;
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.border} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
}

// ─── Day range bar ────────────────────────────────────────────────────────────

function DayRangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = high > low ? ((current - low) / (high - low)) * 100 : 50;
  return (
    <div className="space-y-1">
      <div className="relative h-1 rounded-full bg-[#2a2a2a]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#EF4444]/40 to-[#00C805]/40" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow shadow-white/30 border border-[#333333]"
          style={{ left: `clamp(0%, ${pct}%, 100%)`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between text-[#6b6b6b] font-mono" style={{ fontSize: '10px' }}>
        <span>L ${low.toFixed(2)}</span>
        <span>H ${high.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Signal badge ─────────────────────────────────────────────────────────────

function SignalBadge({ signal, allPass }: { signal: string; allPass: boolean }) {
  if (signal === 'CALL' && allPass)
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 tracking-widest">CALL</span>;
  if (signal === 'PUT' && allPass)
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 tracking-widest">PUT</span>;
  return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#1e1e1e] text-[#6b6b6b] border border-[#2a2a2a] tracking-widest">—</span>;
}

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-[#2a2a2a] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-[#c4c4c4] w-10 text-right">{value.toFixed(1)}%</span>
    </div>
  );
}

// ─── Suggestion card ──────────────────────────────────────────────────────────

function SuggestionCard({ s, isPrimary }: { s: Suggestion; isPrimary: boolean }) {
  const isCall     = s.type === 'CALL';
  const accentText = isCall ? 'text-[#00C805]' : 'text-[#EF4444]';
  const accentBg   = isCall ? 'bg-[#00C805]/8'  : 'bg-[#EF4444]/8';
  const accentBdr  = isCall ? 'border-[#00C805]/25' : 'border-[#EF4444]/25';
  const barColor   = isCall ? 'bg-[#00C805]' : 'bg-[#EF4444]';

  return (
    <div className={`rounded-xl border p-4 ${isPrimary ? `${accentBg} ${accentBdr}` : 'bg-[#111111] border-[#2a2a2a]'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPrimary ? `${accentBg} ${accentText} border ${accentBdr}` : 'bg-[#1e1e1e] text-[#9e9e9e] border border-[#2a2a2a]'}`}>
              {s.type}
            </span>
            <span className="text-xs text-[#6b6b6b]">{s.timeframe}</span>
          </div>
          <div className={`text-sm font-semibold mt-1 ${isPrimary ? accentText : 'text-[#c4c4c4]'}`}>{s.title}</div>
          <div className="text-xs text-[#6b6b6b] mt-0.5 leading-relaxed">{s.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Entry',         value: `$${s.entryPrice}`,     color: 'text-white'       },
          { label: 'Stock Target',  value: `$${s.exitPrice}`,      color: isCall ? 'text-[#00C805]' : 'text-[#EF4444]' },
          { label: 'Strike',        value: s.strike,               color: 'text-[#60a5fa]'   },
          { label: 'Prem / Share',  value: `$${s.premiumPerShare}`,color: 'text-white'       },
          { label: 'Contract Cost', value: `$${s.contractCost}`,   color: 'text-white'       },
          { label: 'Exit Scenario', value: `$${s.contractTarget}`, color: 'text-amber-400'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111111] rounded-lg p-2 border border-[#2a2a2a]">
            <div className="text-[#6b6b6b] mb-1" style={{ fontSize: '10px' }}>{label}</div>
            <div className={`text-sm font-semibold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center" style={{ fontSize: '10px' }}>
          <span className="text-[#6b6b6b] uppercase tracking-wider">Signal Confidence</span>
          <span className={`font-bold font-mono ${isPrimary ? accentText : 'text-[#9e9e9e]'}`}>{s.confidence.toFixed(2)}%</span>
        </div>
        <ConfidenceBar value={s.confidence} color={isPrimary ? barColor : 'bg-[#333333]'} />
      </div>
    </div>
  );
}

// ─── Alert toast ──────────────────────────────────────────────────────────────

function AlertToastCard({ toast, onDismiss }: { toast: AlertToast; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const isCall = toast.signal === 'CALL';

  useEffect(() => {
    const step = 100 / (TOAST_TTL / 100);
    const t = setInterval(() => setProgress(p => Math.max(0, p - step)), 100);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm overflow-hidden
        ${isCall
          ? 'bg-[#001a00] border-[#00C805]/50 shadow-[0_8px_32px_rgba(0,200,5,0.15)]'
          : 'bg-[#1a0000] border-[#EF4444]/50 shadow-[0_8px_32px_rgba(239,68,68,0.15)]'
        }`}
      style={{ minWidth: 260, maxWidth: 320 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-2 py-0.5 rounded border tracking-widest
            ${isCall ? 'bg-[#00C805]/20 text-[#00C805] border-[#00C805]/40' : 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'}`}>
            {toast.signal}
          </span>
          <span className={`text-sm font-bold ${isCall ? 'text-[#00C805]' : 'text-[#EF4444]'}`}>
            {toast.symbol}
          </span>
          <span className="text-[#6b6b6b] text-xs">{toast.name}</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#6b6b6b] hover:text-white text-base leading-none ml-2 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-[10px] uppercase tracking-widest font-semibold ${isCall ? 'text-[#00C805]/60' : 'text-[#EF4444]/60'}`}>
            All conditions met
          </div>
          <div className="text-white font-mono font-bold text-base mt-0.5">
            ${toast.price.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#6b6b6b] text-[10px] uppercase tracking-wider">Confidence</div>
          <div className={`font-bold font-mono text-sm ${isCall ? 'text-[#00C805]' : 'text-[#EF4444]'}`}>
            {toast.confidence}%
          </div>
        </div>
      </div>

      <div className={`text-[10px] ${isCall ? 'text-[#00C805]/40' : 'text-[#EF4444]/40'}`}>
        {toast.firedAt.toLocaleTimeString()} · 0DTE opportunity
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2a2a2a]">
        <div
          className={`h-full transition-none ${isCall ? 'bg-[#00C805]' : 'bg-[#EF4444]'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Locked card (free-tier placeholder) ─────────────────────────────────────

function LockedCard({ entry }: { entry: TrackerEntry }) {
  return (
    <div className="relative rounded-xl border border-[#2a2a2a] bg-[#151515] overflow-hidden">
      {/* Blurred skeleton */}
      <div className="p-4 select-none pointer-events-none opacity-20 blur-[3px]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-bold text-base">{entry.symbol}</span>
              <span className="text-[#6b6b6b] text-xs">{entry.name}</span>
            </div>
            <div className="h-1 w-40 bg-[#2a2a2a] rounded-full" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-6 w-20 bg-[#2a2a2a] rounded ml-auto" />
            <div className="h-4 w-12 bg-[#2a2a2a] rounded ml-auto" />
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px]">
        <div className="text-center px-4">
          <div className="w-8 h-8 rounded-full border border-[#2a2a2a] bg-[#1e1e1e] flex items-center justify-center mx-auto mb-2">
            <span className="text-sm">🔒</span>
          </div>
          <p className="text-white text-sm font-bold mb-0.5">{entry.symbol}</p>
          <p className="text-[#6b6b6b] text-xs mb-3">{entry.name} · Pro only</p>
          <a
            href="/pricing"
            className="inline-block px-4 py-1.5 bg-[#00C805] text-black text-xs font-bold rounded-lg hover:bg-[#00a004] transition-colors"
          >
            Upgrade to Pro →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Ticker card ──────────────────────────────────────────────────────────────

function TickerCard({ entry, vixLevel, isPro }: { entry: TrackerEntry; vixLevel: number | null; isPro: boolean }) {
  const [expanded,  setExpanded]  = useState(false);
  const [showChart, setShowChart] = useState(false);

  if (entry.locked) return <LockedCard entry={entry} />;

  if (entry.error || entry.price === null) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#151515] border border-[#2a2a2a]">
        <div>
          <span className="text-[#c4c4c4] font-bold text-sm">{entry.symbol}</span>
          <span className="text-[#6b6b6b] text-xs ml-2">{entry.name}</span>
        </div>
        <span className="text-[#6b6b6b] text-xs">No data</span>
      </div>
    );
  }

  const up          = (entry.changePercent ?? 0) >= 0;
  const changeColor = up ? 'text-[#00C805]' : 'text-[#EF4444]';
  const changeBg    = up ? 'bg-[#00C805]/10' : 'bg-[#EF4444]/10';
  const isPrime     = entry.allPass && entry.signal !== 'NEUTRAL';
  const isCall      = entry.signal === 'CALL';

  const borderGlow = isPrime
    ? isCall
      ? 'border-[#00C805]/40 shadow-[0_0_16px_-4px_rgba(0,200,5,0.3)]'
      : 'border-[#EF4444]/40 shadow-[0_0_16px_-4px_rgba(239,68,68,0.3)]'
    : 'border-[#2a2a2a]';

  const cardBg = isPrime
    ? isCall ? 'bg-[#001200]' : 'bg-[#1a0000]'
    : 'bg-[#151515]';

  return (
    <div className={`rounded-xl border transition-all duration-300 ${cardBg} ${borderGlow}`}>
      {/* Prime ribbon */}
      {isPrime && (
        <div className={`rounded-t-xl px-4 py-1.5 flex items-center gap-2 text-xs font-bold tracking-wider
          ${isCall ? 'bg-[#00C805]/15 text-[#00C805]' : 'bg-[#EF4444]/15 text-[#EF4444]'}`}>
          <span className="animate-pulse">●</span>
          PRIME SIGNAL — {entry.signal} OPPORTUNITY
        </div>
      )}

      <div className="p-4">
        {/* Main row */}
        <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(v => !v)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base tracking-wide">{entry.symbol}</span>
              <span className="text-[#6b6b6b] text-xs hidden sm:inline">{entry.name}</span>
            </div>
            {entry.dayHigh && entry.dayLow && (
              <div className="mt-2 max-w-[180px]">
                <DayRangeBar low={entry.dayLow} high={entry.dayHigh} current={entry.price} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <div className="text-white font-bold font-mono text-lg leading-tight">
                ${entry.price.toFixed(2)}
              </div>
              <div className={`text-xs font-semibold font-mono px-1.5 py-0.5 rounded ${changeBg} ${changeColor} inline-block mt-0.5`}>
                {up ? '+' : ''}{(entry.changePercent ?? 0).toFixed(2)}%
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <SignalBadge signal={entry.signal} allPass={entry.allPass} />
              {entry.confidence > 0 && (
                <span className="text-[#6b6b6b] font-mono" style={{ fontSize: '10px' }}>{entry.confidence}% conf</span>
              )}
            </div>

            <span className={`text-[#6b6b6b] text-sm transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </div>

        {/* Expanded */}
        {expanded && entry.indicators && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-5">
            {/* Chart toggle — Pro only */}
            {isPro && (
              <button
                onClick={() => setShowChart(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  showChart
                    ? 'bg-[#00C805]/15 border-[#00C805]/30 text-[#00C805]'
                    : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#9e9e9e] hover:text-white'
                }`}
              >
                <span>📈</span>
                {showChart ? 'Hide Chart' : 'Show Chart'}
              </button>
            )}

            {/* Chart */}
            {isPro && showChart && (
              <StockChart symbol={entry.symbol} />
            )}
            {/* Key levels */}
            <div>
              <div className="text-[#6b6b6b] text-xs font-semibold tracking-widest uppercase mb-2">Key Levels</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Day Open',  value: entry.dayOpen  ? `$${entry.dayOpen.toFixed(2)}`  : '—', color: 'text-white'      },
                  { label: 'VWAP',      value: `$${entry.indicators.vwap.toFixed(2)}`,                  color: 'text-[#60a5fa]'  },
                  { label: 'Prev Close',value: entry.prevClose ? `$${entry.prevClose.toFixed(2)}`: '—', color: 'text-[#c4c4c4]'  },
                  { label: 'Day High',  value: entry.dayHigh  ? `$${entry.dayHigh.toFixed(2)}`  : '—', color: 'text-[#00C805]'  },
                  { label: 'Day Low',   value: entry.dayLow   ? `$${entry.dayLow.toFixed(2)}`   : '—', color: 'text-[#EF4444]'  },
                  {
                    label: 'Range Pos',
                    value: `${entry.indicators.rangePos.toFixed(1)}%`,
                    color: entry.indicators.rangePos < 30
                      ? 'text-[#00C805]'
                      : entry.indicators.rangePos > 70
                        ? 'text-[#EF4444]'
                        : 'text-white',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#111111] rounded-lg p-2.5 border border-[#2a2a2a]">
                    <div className="text-[#6b6b6b] mb-1" style={{ fontSize: '10px' }}>{label}</div>
                    <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signal conditions */}
            <div>
              <div className="text-[#6b6b6b] text-xs font-semibold tracking-widest uppercase mb-2">Signal Conditions</div>
              <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] divide-y divide-[#222222]">
                {entry.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <span className={`text-xs font-bold w-4 ${c.pass ? 'text-[#00C805]' : 'text-[#EF4444]'}`}>
                      {c.pass ? '✓' : '✗'}
                    </span>
                    <span className={`text-xs ${c.pass ? 'text-[#c4c4c4]' : 'text-[#4a4a4a]'}`}>{c.label}</span>
                    <span className={`ml-auto text-xs font-semibold ${c.pass ? 'text-[#00C805]' : 'text-[#EF4444]'}`}>
                      {c.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 0DTE suggestions */}
            {entry.suggestions.length > 0 && (
              <div>
                <div className="text-[#6b6b6b] text-xs font-semibold tracking-widest uppercase mb-2">
                  0DTE Options — Illustrative Exit Scenarios
                </div>
                <div className="space-y-2">
                  {entry.suggestions.map((s, i) => (
                    <SuggestionCard key={i} s={s} isPrimary={s.type === entry.direction} />
                  ))}
                </div>
              </div>
            )}

            {/* VXX risk note */}
            {vixLevel !== null && vixLevel >= 20 && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs">
                <span className="font-bold mt-px">⚠</span>
                <span>VXX at <strong>{vixLevel.toFixed(2)}</strong> — elevated volatility. 0DTE premiums are inflated; consider wider profit targets or smaller size.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main tracker ─────────────────────────────────────────────────────────────

export default function MarketTracker() {
  const [data, setData]           = useState<TrackerEntry[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const [toasts, setToasts]       = useState<AlertToast[]>([]);
  const [isPro, setIsPro]         = useState(false);
  const prevPrimeKeys             = useRef<Set<string>>(new Set());
  const isFirstFetch              = useRef(true);
  const toastCounter              = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const json: TrackerResponse = await fetch('/api/tracker').then(r => r.json());
      setData(json.data);
      setTimestamp(json.timestamp);
      setIsPro(json.isPro);

      const currentPrime = json.data.filter(d => d.allPass && d.signal !== 'NEUTRAL' && d.price !== null);

      if (!isFirstFetch.current) {
        const newFires = currentPrime.filter(d => !prevPrimeKeys.current.has(d.symbol));
        if (newFires.length > 0) {
          playAlertBeep(newFires[0].signal as 'CALL' | 'PUT');
          const fresh: AlertToast[] = newFires.map(d => ({
            id:         ++toastCounter.current,
            symbol:     d.symbol,
            name:       d.name,
            signal:     d.signal as 'CALL' | 'PUT',
            price:      d.price!,
            confidence: d.confidence,
            firedAt:    new Date(),
          }));
          setToasts(prev => [...fresh, ...prev].slice(0, 5));
          fresh.forEach(t => { setTimeout(() => dismissToast(t.id), TOAST_TTL); });
        }
      }

      prevPrimeKeys.current = new Set(currentPrime.map(d => d.symbol));
      isFirstFetch.current  = false;
    } catch (err) { console.error('Tracker fetch error:', err); }
    finally { setLoading(false); setCountdown(REFRESH_MS / 1000); }
  }, [dismissToast]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(iv);
  }, [fetchData]);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const vxxEntry     = data.find(d => d.symbol === 'VXX');
  const vixLevel     = vxxEntry?.price ?? null;
  const mag7         = data.filter(d => d.type === 'mag7');
  const etfs         = data.filter(d => d.type === 'etf');
  const indices      = data.filter(d => d.type === 'index');
  const primeSignals = data.filter(d => d.allPass && d.signal !== 'NEUTRAL');
  const calls        = primeSignals.filter(d => d.signal === 'CALL');
  const puts         = primeSignals.filter(d => d.signal === 'PUT');

  return (
    <div className="space-y-6">
      {/* Toast stack — fixed top-right */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <AlertToastCard toast={t} onDismiss={() => dismissToast(t.id)} />
            </div>
          ))}
        </div>
      )}

      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#151515] border border-[#2a2a2a] px-4 py-3">
        <div className="flex items-center gap-3">
          <SessionBadge />
          <div className="h-4 w-px bg-[#2a2a2a]" />
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-[#00C805]'}`} />
            <span className="text-[#9e9e9e] text-xs">
              {loading ? 'Refreshing…' : timestamp ? `Updated ${new Date(timestamp).toLocaleTimeString()}` : '—'}
            </span>
            {!loading && <span className="text-[#6b6b6b] text-xs">· {countdown}s</span>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {vixLevel !== null && (
            <div className={`text-xs font-semibold ${vixLevel >= 30 ? 'text-[#EF4444]' : vixLevel >= 20 ? 'text-amber-400' : 'text-[#00C805]'}`}>
              VXX {vixLevel.toFixed(2)} — {vixLevel >= 30 ? 'Extreme Vol' : vixLevel >= 20 ? 'Elevated Vol' : 'Low Vol'}
            </div>
          )}
          {primeSignals.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              {calls.length > 0 && <span className="px-2 py-0.5 rounded bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/25 font-bold">{calls.length} CALL{calls.length > 1 ? 'S' : ''}</span>}
              {puts.length  > 0 && <span className="px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25 font-bold">{puts.length} PUT{puts.length > 1 ? 'S' : ''}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Prime signals summary strip */}
      {primeSignals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {primeSignals.map(e => (
            <div
              key={e.symbol}
              className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
                e.signal === 'CALL'
                  ? 'bg-[#00C805]/8 border-[#00C805]/25'
                  : 'bg-[#EF4444]/8 border-[#EF4444]/25'
              }`}
            >
              <div>
                <div className={`text-sm font-bold ${e.signal === 'CALL' ? 'text-[#00C805]' : 'text-[#EF4444]'}`}>
                  {e.symbol} <span className="font-normal text-[#9e9e9e]">·</span> {e.signal}
                </div>
                <div className="text-[#6b6b6b] text-xs mt-0.5">{e.name}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-mono font-bold text-sm">${e.price?.toFixed(2)}</div>
                <div className="text-[#6b6b6b] text-xs font-mono">{e.confidence}% conf</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Magnificent 7 */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-[#9e9e9e]">Magnificent 7</h3>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>
        <div className="space-y-2">
          {mag7.map(e => <TickerCard key={e.symbol} entry={e} vixLevel={vixLevel} isPro={isPro} />)}
        </div>
      </section>

      {/* Major ETFs */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-[#9e9e9e]">Major ETFs</h3>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>
        <div className="space-y-2">
          {etfs.map(e => <TickerCard key={e.symbol} entry={e} vixLevel={vixLevel} isPro={isPro} />)}
        </div>
      </section>

      {/* Volatility */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-[#9e9e9e]">Volatility</h3>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>
        <div className="space-y-2">
          {indices.map(e => <TickerCard key={e.symbol} entry={e} vixLevel={vixLevel} isPro={isPro} />)}
        </div>
      </section>
    </div>
  );
}
