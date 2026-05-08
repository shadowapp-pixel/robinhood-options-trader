'use client';

import { useState } from 'react';
import MarketTracker from '@/components/MarketTrackerV2';

type Tab = 'tracker' | 'search';

interface Suggestion {
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

interface StockData {
  symbol: string;
  currentPrice: string;
  change: string;
  changePercent: string;
  suggestions: Suggestion[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    setStockData(null);
    try {
      const response = await fetch(`/api/trades?symbol=${symbol}`);
      const data = await response.json();
      if (data.error) { setError(data.error); return; }
      setStockData(data);
    } catch {
      setError('Failed to fetch data. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const changeNum = stockData ? parseFloat(stockData.change) : 0;
  const isUp = changeNum >= 0;

  return (
    <main className="min-h-screen bg-[#0b0e14] text-white">
      {/* Top nav bar */}
      <header className="border-b border-slate-800 bg-[#0d1117]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
              <span className="text-xs font-black text-white">H</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">Hood Options</span>
              <span className="ml-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Pro</span>
            </div>
          </div>

          {/* Tab switcher */}
          <nav className="flex gap-1 bg-slate-900 border border-slate-700/60 p-1 rounded-xl">
            {(['tracker', 'search'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'tracker' ? 'Market Tracker' : 'Trade Search'}
              </button>
            ))}
          </nav>

          <div className="text-[10px] text-slate-600 font-mono">0DTE · Robinhood</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── Market Tracker ── */}
        {activeTab === 'tracker' && <MarketTracker />}

        {/* ── Trade Search ── */}
        {activeTab === 'search' && (
          <div className="space-y-6">

            {/* Search bar card */}
            <div className="bg-[#131720] border border-slate-700/50 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Symbol Lookup</p>
              <h2 className="text-lg font-bold text-white mb-4">Get 0DTE Trade Suggestions</h2>
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter ticker — AAPL, TSLA, SPY…"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {loading ? 'Loading…' : 'Analyze'}
                </button>
              </form>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl px-5 py-4 text-rose-400 text-sm">
                {error}
              </div>
            )}

            {/* Quote banner */}
            {stockData && (
              <div className="bg-[#131720] border border-slate-700/50 rounded-2xl px-6 py-5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black font-mono tracking-tight text-white">{stockData.symbol}</span>
                    <span className="text-2xl font-bold font-mono text-white">${stockData.currentPrice}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-md ${isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                      {isUp ? '+' : ''}{stockData.change} ({isUp ? '+' : ''}{stockData.changePercent}%)
                    </span>
                    <span className="text-xs text-slate-500">Today</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Timeframe</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">0DTE</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Same-day expiry</p>
                </div>
              </div>
            )}

            {/* Suggestion cards */}
            {stockData && stockData.suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Trade Suggestions</h3>
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-xs text-slate-600">{stockData.suggestions.length} setup{stockData.suggestions.length !== 1 ? 's' : ''}</span>
                </div>

                {stockData.suggestions.map((s, i) => {
                  const isCall = s.title.toLowerCase().includes('call');
                  const isPut  = s.title.toLowerCase().includes('put');
                  const accentBorder = isCall ? 'border-emerald-500/30' : isPut ? 'border-rose-500/30' : 'border-sky-500/30';
                  const accentText   = isCall ? 'text-emerald-400' : isPut ? 'text-rose-400' : 'text-sky-400';
                  const accentBg     = isCall ? 'bg-emerald-500/10' : isPut ? 'bg-rose-500/10' : 'bg-sky-500/10';
                  const typeBadge    = isCall ? 'CALL' : isPut ? 'PUT' : 'STRADDLE';
                  const confColor    = s.confidence >= 75 ? 'bg-emerald-500' : s.confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500';

                  return (
                    <div key={i} className={`bg-[#131720] border ${accentBorder} rounded-2xl overflow-hidden`}>
                      {/* Card header */}
                      <div className={`px-6 py-4 border-b border-slate-800 flex items-center justify-between ${accentBg}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${accentBorder} ${accentText} uppercase tracking-wider`}>
                              {typeBadge}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">0DTE · ATM</span>
                          </div>
                          <p className={`text-base font-bold ${accentText}`}>{s.title.split('—')[1]?.trim() ?? s.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Confidence</p>
                          <p className={`text-lg font-bold ${accentText}`}>{s.confidence.toFixed(0)}%</p>
                          <div className="w-20 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${confColor}`} style={{ width: `${s.confidence}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Key metrics grid */}
                      <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800">
                        {[
                          { label: 'Entry Price',     value: `$${s.entryPrice}`,       sub: 'Stock price now'    },
                          { label: 'Stock Target',    value: `$${s.exitPrice}`,         sub: 'Price needed'      },
                          { label: 'Strike',          value: s.strike,                  sub: 'Option strike'     },
                        ].map(({ label, value, sub }) => (
                          <div key={label} className="px-5 py-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
                            <p className="text-base font-bold font-mono text-white mt-1">{value}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Cost grid */}
                      <div className="grid grid-cols-3 divide-x divide-slate-800">
                        {[
                          { label: 'Prem / Share',     value: `$${s.premiumPerShare}`, note: 'Estimated ATM premium',  color: 'text-white'        },
                          { label: 'Contract Cost',    value: `$${s.contractCost}`,    note: '×100 shares (Robinhood)', color: 'text-white'        },
                          { label: '+20% Target',      value: `$${s.contractTarget}`,  note: 'Sell contract here',      color: 'text-amber-400'    },
                        ].map(({ label, value, note, color }) => (
                          <div key={label} className="px-5 py-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
                            <p className={`text-base font-bold font-mono ${color} mt-1`}>{value}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && !stockData && (
              <div className="bg-[#131720] border border-slate-800 rounded-2xl px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <p className="text-slate-400 font-semibold mb-1">Enter a ticker to get started</p>
                <p className="text-slate-600 text-sm">Real-time 0DTE option setups powered by Finnhub</p>
              </div>
            )}

            {/* No results */}
            {!loading && !error && stockData && stockData.suggestions.length === 0 && (
              <div className="bg-[#131720] border border-slate-800 rounded-2xl px-6 py-8 text-center">
                <p className="text-slate-400">No setups found for {stockData.symbol} right now. Try again during market hours.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
