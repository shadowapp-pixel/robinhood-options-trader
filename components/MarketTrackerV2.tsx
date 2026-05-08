'use client';

import { useEffect, useState, useCallback } from 'react';

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
interface TrackerResponse { data: TrackerEntry[]; timestamp: string; }

const REFRESH_MS = 30_000;

// ─── Market session ───────────────────────────────────────────────────────────

type MarketSession = 'open' | 'premarket' | 'afterhours' | 'closed';

function getMarketSession(): MarketSession {
  const now   = new Date();
  const et    = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day   = et.getDay(); // 0=Sun, 6=Sat
  const mins  = et.getHours() * 60 + et.getMinutes();
  if (day === 0 || day === 6) return 'closed';
  if (mins >= 240  && mins < 570)  return 'premarket';   // 4:00–9:30 AM ET
  if (mins >= 570  && mins < 960)  return 'open';        // 9:30 AM–4:00 PM ET
  if (mins >= 960  && mins < 1200) return 'afterhours';  // 4:00–8:00 PM ET
  return 'closed';
}

function SessionBadge() {
  const [session, setSession] = useState(getMarketSession());
  useEffect(() => {
    const t = setInterval(() => setSession(getMarketSession()), 60_000);
    return () => clearInterval(t);
  }, []);
  const cfgMap = {
    open:       { label: 'Market Open',   dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/10' },
    premarket:  { label: 'Pre-Market',    dot: 'bg-amber-400',                 text: 'text-amber-400',   border: 'border-amber-500/30 bg-amber-500/10'   },
    afterhours: { label: 'After Hours',   dot: 'bg-sky-400',                   text: 'text-sky-400',     border: 'border-sky-500/30 bg-sky-500/10'       },
    closed:     { label: 'Market Closed', dot: 'bg-slate-500',                 text: 'text-slate-400',   border: 'border-slate-600/40 bg-slate-800/40'   },
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
      <div className="relative h-1 rounded-full bg-slate-700">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/40 to-emerald-500/40" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow shadow-white/30 border border-slate-600"
          style={{ left: `clamp(0%, ${pct}%, 100%)`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between text-slate-500 font-mono" style={{ fontSize: '10px' }}>
        <span>L ${low.toFixed(2)}</span>
        <span>H ${high.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Signal badge ─────────────────────────────────────────────────────────────

function SignalBadge({ signal, allPass }: { signal: string; allPass: boolean }) {
  if (signal === 'CALL' && allPass)
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tracking-widest">CALL</span>;
  if (signal === 'PUT' && allPass)
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 tracking-widest">PUT</span>;
  return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-700/50 text-slate-500 border border-slate-600/50 tracking-widest">—</span>;
}

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-10 text-right">{value.toFixed(1)}%</span>
    </div>
  );
}

// ─── Suggestion card ──────────────────────────────────────────────────────────

function SuggestionCard({ s, isPrimary }: { s: Suggestion; isPrimary: boolean }) {
  const isCall     = s.type === 'CALL';
  const accentText = isCall ? 'text-emerald-400' : 'text-rose-400';
  const accentBg   = isCall ? 'bg-emerald-500/8' : 'bg-rose-500/8';
  const accentBdr  = isCall ? 'border-emerald-500/25' : 'border-rose-500/25';
  const barColor   = isCall ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className={`rounded-xl border p-4 ${isPrimary ? `${accentBg} ${accentBdr}` : 'bg-slate-900/50 border-slate-700/50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPrimary ? `${accentBg} ${accentText} border ${accentBdr}` : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              {s.type}
            </span>
            <span className="text-xs text-slate-500">{s.timeframe}</span>
          </div>
          <div className={`text-sm font-semibold mt-1 ${isPrimary ? accentText : 'text-slate-300'}`}>{s.title}</div>
          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Entry',           value: `$${s.entryPrice}`,    color: 'text-white' },
          { label: 'Stock Target',    value: `$${s.exitPrice}`,     color: isCall ? 'text-emerald-400' : 'text-rose-400' },
          { label: 'Strike',          value: s.strike,              color: 'text-sky-400' },
          { label: 'Prem / Share',    value: `$${s.premiumPerShare}`,color: 'text-white' },
          { label: 'Contract Cost',   value: `$${s.contractCost}`,  color: 'text-white' },
          { label: '+20% Target',     value: `$${s.contractTarget}`, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/60 rounded-lg p-2">
            <div className="text-slate-500 mb-1" style={{ fontSize: '10px' }}>{label}</div>
            <div className={`text-sm font-semibold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center" style={{ fontSize: '10px' }}>
          <span className="text-slate-500 uppercase tracking-wider">Signal Confidence</span>
          <span className={`font-bold font-mono ${isPrimary ? accentText : 'text-slate-400'}`}>{s.confidence.toFixed(2)}%</span>
        </div>
        <ConfidenceBar value={s.confidence} color={isPrimary ? barColor : 'bg-slate-600'} />
      </div>
    </div>
  );
}

// ─── Ticker card ──────────────────────────────────────────────────────────────

function TickerCard({ entry, vixLevel }: { entry: TrackerEntry; vixLevel: number | null }) {
  const [expanded, setExpanded] = useState(false);

  if (entry.error || entry.price === null) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
        <div>
          <span className="text-slate-300 font-bold text-sm">{entry.symbol}</span>
          <span className="text-slate-600 text-xs ml-2">{entry.name}</span>
        </div>
        <span className="text-slate-600 text-xs">No data</span>
      </div>
    );
  }

  const up          = (entry.changePercent ?? 0) >= 0;
  const changeColor = up ? 'text-emerald-400' : 'text-rose-400';
  const changeBg    = up ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const isPrime     = entry.allPass && entry.signal !== 'NEUTRAL';
  const isCall      = entry.signal === 'CALL';

  const borderGlow = isPrime
    ? isCall
      ? 'border-emerald-500/40 shadow-[0_0_12px_-3px_rgba(16,185,129,0.25)]'
      : 'border-rose-500/40 shadow-[0_0_12px_-3px_rgba(244,63,94,0.25)]'
    : 'border-slate-700/60';

  const cardBg = isPrime
    ? isCall ? 'bg-[#0a1a12]' : 'bg-[#1a0a0e]'
    : 'bg-slate-800/50';

  return (
    <div className={`rounded-xl border transition-all duration-300 ${cardBg} ${borderGlow}`}>
      {/* Prime ribbon */}
      {isPrime && (
        <div className={`rounded-t-xl px-4 py-1.5 flex items-center gap-2 text-xs font-bold tracking-wider ${isCall ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
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
              <span className="text-slate-500 text-xs hidden sm:inline">{entry.name}</span>
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
                <span className="text-slate-600 font-mono" style={{ fontSize: '10px' }}>{entry.confidence}% conf</span>
              )}
            </div>

            <span className={`text-slate-600 text-sm transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </div>

        {/* Expanded */}
        {expanded && entry.indicators && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-5">
            {/* Key levels */}
            <div>
              <div className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-2">Key Levels</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Day Open',  value: entry.dayOpen   ? `$${entry.dayOpen.toFixed(2)}`   : '—', color: 'text-white' },
                  { label: 'VWAP',      value: `$${entry.indicators.vwap.toFixed(2)}`,                   color: 'text-sky-400' },
                  { label: 'Prev Close',value: entry.prevClose  ? `$${entry.prevClose.toFixed(2)}` : '—', color: 'text-slate-300' },
                  { label: 'Day High',  value: entry.dayHigh   ? `$${entry.dayHigh.toFixed(2)}`   : '—', color: 'text-emerald-400' },
                  { label: 'Day Low',   value: entry.dayLow    ? `$${entry.dayLow.toFixed(2)}`    : '—', color: 'text-rose-400' },
                  {
                    label: 'Range Pos',
                    value: `${entry.indicators.rangePos.toFixed(1)}%`,
                    color: entry.indicators.rangePos < 30 ? 'text-emerald-400' : entry.indicators.rangePos > 70 ? 'text-rose-400' : 'text-white',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40">
                    <div className="text-slate-500 mb-1" style={{ fontSize: '10px' }}>{label}</div>
                    <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signal conditions */}
            <div>
              <div className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-2">Signal Conditions</div>
              <div className="rounded-xl bg-slate-900/50 border border-slate-700/40 divide-y divide-slate-700/30">
                {entry.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <span className={`text-xs font-bold w-4 ${c.pass ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {c.pass ? '✓' : '✗'}
                    </span>
                    <span className={`text-xs ${c.pass ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
                    <span className={`ml-auto text-xs font-semibold ${c.pass ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {c.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 0DTE suggestions */}
            {entry.suggestions.length > 0 && (
              <div>
                <div className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-2">
                  0DTE Options — +20% Premium Target
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

  const fetchData = useCallback(async () => {
    try {
      const json: TrackerResponse = await fetch('/api/tracker').then(r => r.json());
      setData(json.data);
      setTimestamp(json.timestamp);
    } catch (err) { console.error('Tracker fetch error:', err); }
    finally { setLoading(false); setCountdown(REFRESH_MS / 1000); }
  }, []);

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
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <SessionBadge />
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-slate-400 text-xs">
              {loading ? 'Refreshing…' : timestamp ? `Updated ${new Date(timestamp).toLocaleTimeString()}` : '—'}
            </span>
            {!loading && <span className="text-slate-600 text-xs">· {countdown}s</span>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {vixLevel !== null && (
            <div className={`text-xs font-semibold ${vixLevel >= 30 ? 'text-rose-400' : vixLevel >= 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
              VXX {vixLevel.toFixed(2)} — {vixLevel >= 30 ? 'Extreme Vol' : vixLevel >= 20 ? 'Elevated Vol' : 'Low Vol'}
            </div>
          )}
          {primeSignals.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              {calls.length > 0 && <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">{calls.length} CALL{calls.length > 1 ? 'S' : ''}</span>}
              {puts.length > 0  && <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25 font-bold">{puts.length} PUT{puts.length > 1 ? 'S' : ''}</span>}
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
                  ? 'bg-emerald-500/8 border-emerald-500/25'
                  : 'bg-rose-500/8 border-rose-500/25'
              }`}
            >
              <div>
                <div className={`text-sm font-bold ${e.signal === 'CALL' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {e.symbol} <span className="font-normal text-slate-400">·</span> {e.signal}
                </div>
                <div className="text-slate-500 text-xs mt-0.5">{e.name}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-mono font-bold text-sm">${e.price?.toFixed(2)}</div>
                <div className="text-slate-500 text-xs font-mono">{e.confidence}% conf</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Magnificent 7 */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400">Magnificent 7</h3>
          <div className="flex-1 h-px bg-slate-700/60" />
        </div>
        <div className="space-y-2">
          {mag7.map(e => <TickerCard key={e.symbol} entry={e} vixLevel={vixLevel} />)}
        </div>
      </section>

      {/* Major ETFs */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400">Major ETFs</h3>
          <div className="flex-1 h-px bg-slate-700/60" />
        </div>
        <div className="space-y-2">
          {etfs.map(e => <TickerCard key={e.symbol} entry={e} vixLevel={vixLevel} />)}
        </div>
      </section>

      {/* Volatility */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400">Volatility</h3>
          <div className="flex-1 h-px bg-slate-700/60" />
        </div>
        <div className="space-y-2">
          {indices.map(e => <TickerCard key={e.symbol} entry={e} vixLevel={vixLevel} />)}
        </div>
      </section>
    </div>
  );
}
