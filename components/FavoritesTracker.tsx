'use client';

import { useCallback, useEffect, useState } from 'react';
import StockChart from '@/components/StockChart';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Condition  { label: string; pass: boolean }
interface Suggestion {
  type: 'CALL' | 'PUT';
  title: string; description: string;
  entryPrice: string; exitPrice: string;
  premiumPerShare: string; contractCost: string;
  contractTarget: string; strike: string;
  timeframe: string; confidence: number;
}
interface FavEntry {
  symbol: string;
  price: number | null;
  dayOpen: number | null; dayHigh: number | null;
  dayLow: number | null;  prevClose: number | null;
  changePercent: number | null;
  indicators: { vwap: number; ema8proxy: number; rangePos: number } | null;
  signal: string; direction: string;
  conditions: Condition[];
  allPass: boolean; confidence: number;
  suggestions: Suggestion[];
  error: string | null;
}

const REFRESH_MS = 30_000;

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function DayRangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = high > low ? ((current - low) / (high - low)) * 100 : 50;
  return (
    <div className="space-y-1">
      <div className="relative h-1 rounded-full bg-[#2a2a2a]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#EF4444]/40 to-[#00C805]/40" />
        <div
          className="absolute top-1/2 w-2 h-2 rounded-full bg-white shadow border border-[#333]"
          style={{ left: `clamp(0%,${pct}%,100%)`, transform: 'translate(-50%,-50%)' }}
        />
      </div>
      <div className="flex justify-between text-[#6b6b6b] font-mono" style={{ fontSize: '10px' }}>
        <span>L ${low.toFixed(2)}</span>
        <span>H ${high.toFixed(2)}</span>
      </div>
    </div>
  );
}

function SignalBadge({ signal, allPass }: { signal: string; allPass: boolean }) {
  if (signal === 'CALL' && allPass)
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 tracking-widest">CALL</span>;
  if (signal === 'PUT' && allPass)
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 tracking-widest">PUT</span>;
  return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#1e1e1e] text-[#6b6b6b] border border-[#2a2a2a] tracking-widest">—</span>;
}

function FavCard({
  entry,
  onRemove,
}: {
  entry: FavEntry;
  onRemove: (symbol: string) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [showChart, setShowChart] = useState(false);

  if (entry.price === null || entry.error) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#151515] border border-[#2a2a2a]">
        <div>
          <span className="text-[#c4c4c4] font-bold text-sm">{entry.symbol}</span>
          <span className="text-[#6b6b6b] text-xs ml-2">{entry.error ?? 'No data'}</span>
        </div>
        <button
          onClick={() => onRemove(entry.symbol)}
          className="text-[#EF4444]/60 hover:text-[#EF4444] text-sm font-bold transition-colors"
          title="Remove from favorites"
        >
          ★
        </button>
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
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base tracking-wide">{entry.symbol}</span>
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

            {/* Expand chevron */}
            <span
              className={`text-[#6b6b6b] text-sm cursor-pointer transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              onClick={() => setExpanded(v => !v)}
            >
              ▼
            </span>

            {/* Remove favorite */}
            <button
              onClick={() => onRemove(entry.symbol)}
              className="text-amber-400 hover:text-amber-300 text-base leading-none transition-colors"
              title="Remove from favorites"
            >
              ★
            </button>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && entry.indicators && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-5">
            {/* Chart toggle */}
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

            {showChart && <StockChart symbol={entry.symbol} />}

            {/* Key levels */}
            <div>
              <div className="text-[#6b6b6b] text-xs font-semibold tracking-widest uppercase mb-2">Key Levels</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Day Open',   value: entry.dayOpen   ? `$${entry.dayOpen.toFixed(2)}`   : '—', color: 'text-white'     },
                  { label: 'VWAP',       value: `$${entry.indicators.vwap.toFixed(2)}`,                   color: 'text-[#60a5fa]' },
                  { label: 'Prev Close', value: entry.prevClose  ? `$${entry.prevClose.toFixed(2)}` : '—', color: 'text-[#c4c4c4]' },
                  { label: 'Day High',   value: entry.dayHigh   ? `$${entry.dayHigh.toFixed(2)}`   : '—', color: 'text-[#00C805]' },
                  { label: 'Day Low',    value: entry.dayLow    ? `$${entry.dayLow.toFixed(2)}`    : '—', color: 'text-[#EF4444]' },
                  {
                    label: 'Range Pos',
                    value: `${entry.indicators.rangePos.toFixed(1)}%`,
                    color: entry.indicators.rangePos < 30 ? 'text-[#00C805]'
                         : entry.indicators.rangePos > 70 ? 'text-[#EF4444]'
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
              <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] divide-y divide-[#222]">
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

            {/* Suggestions */}
            {entry.suggestions.length > 0 && (
              <div>
                <div className="text-[#6b6b6b] text-xs font-semibold tracking-widest uppercase mb-2">
                  0DTE Options — Illustrative Exit Scenarios
                </div>
                <div className="space-y-2">
                  {entry.suggestions.map((s, i) => {
                    const isCall     = s.type === 'CALL';
                    const accentText = isCall ? 'text-[#00C805]' : 'text-[#EF4444]';
                    const accentBg   = isCall ? 'bg-[#00C805]/8'  : 'bg-[#EF4444]/8';
                    const accentBdr  = isCall ? 'border-[#00C805]/25' : 'border-[#EF4444]/25';
                    const isPrimary  = s.type === entry.direction;
                    return (
                      <div key={i} className={`rounded-xl border p-4 ${isPrimary ? `${accentBg} ${accentBdr}` : 'bg-[#111111] border-[#2a2a2a]'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPrimary ? `${accentBg} ${accentText} border ${accentBdr}` : 'bg-[#1e1e1e] text-[#9e9e9e] border border-[#2a2a2a]'}`}>
                            {s.type}
                          </span>
                          <span className={`text-sm font-semibold ${isPrimary ? accentText : 'text-[#c4c4c4]'}`}>
                            {s.title.split('—')[1]?.trim() ?? s.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b6b6b] mb-3">{s.description}</p>

                        {/* Signal Confidence bar */}
                        {(() => {
                          const confColor = s.confidence >= 75 ? 'bg-[#00C805]' : s.confidence >= 60 ? 'bg-amber-500' : 'bg-[#EF4444]';
                          const confText  = s.confidence >= 75 ? 'text-[#00C805]' : s.confidence >= 60 ? 'text-amber-400' : 'text-[#EF4444]';
                          const confLabel = s.confidence >= 75 ? 'Strong setup' : s.confidence >= 60 ? 'Moderate setup' : 'Weak setup';
                          return (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">Signal Confidence</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#6b6b6b]">{confLabel}</span>
                                  <span className={`text-sm font-bold font-mono ${confText}`}>{s.confidence.toFixed(0)}%</span>
                                </div>
                              </div>
                              <div className="h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${confColor}`} style={{ width: `${s.confidence}%` }} />
                              </div>
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Entry',         value: `$${s.entryPrice}`,     color: 'text-white'     },
                            { label: 'Stock Target',  value: `$${s.exitPrice}`,      color: isCall ? 'text-[#00C805]' : 'text-[#EF4444]' },
                            { label: 'Contract Cost', value: `$${s.contractCost}`,   color: 'text-white'     },
                            { label: 'Prem / Share',  value: `$${s.premiumPerShare}`,color: 'text-white'     },
                            { label: 'Exit Scenario', value: `$${s.contractTarget}`, color: 'text-amber-400' },
                            { label: 'Strike',        value: s.strike,               color: 'text-[#60a5fa]' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-[#0d0d0d] rounded-lg p-2 border border-[#2a2a2a]">
                              <div className="text-[#6b6b6b] mb-1" style={{ fontSize: '10px' }}>{label}</div>
                              <div className={`text-sm font-semibold font-mono ${color}`}>{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main FavoritesTracker ──────────────────────────────────────────────── */

interface Props {
  symbols:  string[];
  onRemove: (symbol: string) => void;
}

export default function FavoritesTracker({ symbols, onRemove }: Props) {
  const [data,      setData]      = useState<FavEntry[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (symbols.length === 0) { setData([]); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/favorites/data');
      const json = await res.json() as { data: FavEntry[]; timestamp: string };
      setData(json.data ?? []);
      setTimestamp(json.timestamp);
    } catch { /* keep stale data */ }
    finally { setLoading(false); setCountdown(REFRESH_MS / 1000); }
  }, [symbols.join(',')]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(iv);
  }, [fetchData]);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  /* Empty state */
  if (symbols.length === 0) {
    return (
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">★</span>
        </div>
        <p className="text-white font-bold text-lg mb-2">No favorites yet</p>
        <p className="text-[#6b6b6b] text-sm max-w-sm mx-auto">
          Search any ticker in <strong className="text-[#9e9e9e]">Trade Search</strong> and click
          {' '}<strong className="text-amber-400">☆ Add to Favorites</strong> to track it here with live signals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-xl bg-[#151515] border border-[#2a2a2a] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-[#00C805]'}`} />
          <span className="text-[#9e9e9e] text-xs">
            {loading ? 'Refreshing…' : timestamp ? `Updated ${new Date(timestamp).toLocaleTimeString()}` : '—'}
          </span>
          {!loading && <span className="text-[#6b6b6b] text-xs">· {countdown}s</span>}
        </div>
        <span className="text-[#6b6b6b] text-xs">{symbols.length} / 20 favorites</span>
      </div>

      {/* Cards */}
      {data.length > 0
        ? data.map(entry => (
            <FavCard key={entry.symbol} entry={entry} onRemove={onRemove} />
          ))
        : symbols.map(sym => (
            /* Loading skeletons */
            <div key={sym} className="bg-[#151515] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between animate-pulse">
              <div>
                <div className="h-4 w-16 bg-[#2a2a2a] rounded mb-2" />
                <div className="h-3 w-24 bg-[#1e1e1e] rounded" />
              </div>
              <div className="h-6 w-20 bg-[#2a2a2a] rounded" />
            </div>
          ))
      }
    </div>
  );
}
