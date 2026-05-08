'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Condition {
  label: string;
  pass: boolean;
}

interface TrackerEntry {
  symbol: string;
  name: string;
  type: string;
  price: number | null;
  changePercent: number | null;
  indicators: { ema8: number; vwap: number; rsi3: number } | null;
  signal: string;
  direction: string;
  conditions: Condition[];
  allPass: boolean;
  confidence: number;
  error: string | null;
}

interface TrackerResponse {
  data: TrackerEntry[];
  timestamp: string;
}

const REFRESH_INTERVAL_MS = 30_000;

function SignalBadge({ signal, allPass }: { signal: string; allPass: boolean }) {
  if (signal === 'CALL' && allPass) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40 tracking-wider">
        CALL
      </span>
    );
  }
  if (signal === 'PUT' && allPass) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 tracking-wider">
        PUT
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-600/40 text-slate-400 border border-slate-600 tracking-wider">
      NEUTRAL
    </span>
  );
}

function VixGauge({ vix }: { vix: number }) {
  let label = 'Low';
  let color = 'text-green-400';
  if (vix >= 30) { label = 'Extreme'; color = 'text-red-400'; }
  else if (vix >= 20) { label = 'Elevated'; color = 'text-yellow-400'; }
  else if (vix >= 15) { label = 'Moderate'; color = 'text-orange-400'; }

  return (
    <div className={`text-xs font-semibold ${color}`}>
      VIX {label} ({vix >= 20 ? 'Wider spreads advised' : 'Normal conditions'})
    </div>
  );
}

function TickerCard({ entry, vixLevel }: { entry: TrackerEntry; vixLevel: number | null }) {
  const [expanded, setExpanded] = useState(false);

  if (entry.error) {
    return (
      <Card className="bg-slate-800/60 border-slate-700">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-bold text-sm">{entry.symbol}</span>
              <span className="text-slate-500 text-xs ml-2">{entry.name}</span>
            </div>
            <span className="text-slate-500 text-xs">No data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priceStr = entry.price !== null ? `$${entry.price.toFixed(2)}` : '—';
  const changeStr = entry.changePercent !== null
    ? `${entry.changePercent >= 0 ? '+' : ''}${entry.changePercent.toFixed(2)}%`
    : '—';
  const changeColor = (entry.changePercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400';

  const isPrime = entry.allPass && entry.signal !== 'NEUTRAL';
  const borderClass = isPrime
    ? entry.signal === 'CALL'
      ? 'border-green-500/50 bg-green-500/5'
      : 'border-red-500/50 bg-red-500/5'
    : 'border-slate-700 bg-slate-800/60';

  return (
    <Card className={`${borderClass} transition-all duration-300`}>
      <CardContent className="pt-4 pb-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{entry.symbol}</span>
                {isPrime && (
                  <span className="text-xs text-yellow-400 font-semibold animate-pulse">
                    ★ PRIME
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-xs">{entry.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white font-semibold">{priceStr}</div>
              <div className={`text-xs ${changeColor}`}>{changeStr}</div>
            </div>
            <SignalBadge signal={entry.signal} allPass={entry.allPass} />
            {entry.confidence > 0 && (
              <div className="text-slate-400 text-xs w-10 text-right">{entry.confidence}%</div>
            )}
            <span className="text-slate-500 text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {expanded && entry.indicators && (
          <div className="mt-4 border-t border-slate-700 pt-4 space-y-3">
            {/* Indicators */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                <div className="text-slate-400 text-xs mb-1">EMA(8)</div>
                <div className="text-white text-sm font-mono">${entry.indicators.ema8.toFixed(2)}</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                <div className="text-slate-400 text-xs mb-1">VWAP</div>
                <div className="text-white text-sm font-mono">${entry.indicators.vwap.toFixed(2)}</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                <div className="text-slate-400 text-xs mb-1">RSI(3)</div>
                <div className={`text-sm font-mono font-semibold ${
                  entry.indicators.rsi3 < 30 ? 'text-green-400' :
                  entry.indicators.rsi3 > 70 ? 'text-red-400' :
                  'text-white'
                }`}>
                  {entry.indicators.rsi3.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Signal conditions */}
            <div className="space-y-1.5">
              <div className="text-slate-400 text-xs font-semibold mb-1.5">30-MIN SIGNAL CONDITIONS</div>
              {entry.conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{c.pass ? '✅' : '🚫'}</span>
                  <span className={c.pass ? 'text-slate-300' : 'text-slate-500'}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* VIX risk note */}
            {vixLevel !== null && vixLevel >= 20 && (
              <div className="text-xs text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/20 rounded px-2 py-1.5">
                ⚠ VIX {vixLevel.toFixed(1)} — elevated volatility, use wider stops on options
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MarketTracker() {
  const [data, setData] = useState<TrackerEntry[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tracker');
      const json: TrackerResponse = await res.json();
      setData(json.data);
      setTimestamp(json.timestamp);
    } catch (err) {
      console.error('Tracker fetch error:', err);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL_MS / 1000);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  const vixEntry = data.find(d => d.symbol === 'VIX');
  const vixLevel = vixEntry?.price ?? null;

  const mag7 = data.filter(d => d.type === 'mag7');
  const etfs = data.filter(d => d.type === 'etf');
  const indices = data.filter(d => d.type === 'index');

  const primeSignals = data.filter(d => d.allPass && d.signal !== 'NEUTRAL');

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-slate-400 text-sm">
            {loading ? 'Loading...' : `Last updated ${timestamp ? new Date(timestamp).toLocaleTimeString() : '—'}`}
          </span>
          {!loading && (
            <span className="text-slate-600 text-xs">· refresh in {countdown}s</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {vixLevel !== null && <VixGauge vix={vixLevel} />}
          {primeSignals.length > 0 && (
            <span className="text-yellow-400 text-sm font-semibold">
              ★ {primeSignals.length} prime signal{primeSignals.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Prime signals summary */}
      {primeSignals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {primeSignals.map(entry => (
            <div
              key={entry.symbol}
              className={`rounded-lg px-4 py-2.5 border text-sm font-semibold flex items-center justify-between ${
                entry.signal === 'CALL'
                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                  : 'bg-red-500/10 border-red-500/40 text-red-400'
              }`}
            >
              <span>{entry.symbol} — {entry.signal}</span>
              <span className="text-xs opacity-70">{entry.confidence}% match</span>
            </div>
          ))}
        </div>
      )}

      {/* Mag 7 */}
      <div>
        <h3 className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-3">
          Magnificent 7
        </h3>
        <div className="grid gap-2">
          {mag7.map(entry => (
            <TickerCard key={entry.symbol} entry={entry} vixLevel={vixLevel} />
          ))}
        </div>
      </div>

      {/* ETFs */}
      <div>
        <h3 className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-3">
          Major ETFs
        </h3>
        <div className="grid gap-2">
          {etfs.map(entry => (
            <TickerCard key={entry.symbol} entry={entry} vixLevel={vixLevel} />
          ))}
        </div>
      </div>

      {/* Indices */}
      <div>
        <h3 className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-3">
          Volatility
        </h3>
        <div className="grid gap-2">
          {indices.map(entry => (
            <TickerCard key={entry.symbol} entry={entry} vixLevel={vixLevel} />
          ))}
        </div>
      </div>
    </div>
  );
}
