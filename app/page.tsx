'use client';

import { useState } from 'react';
import { UserButton, useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
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
  const [symbol, setSymbol]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError]         = useState<string | null>(null);

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

  const { user, isLoaded } = useUser();
  const isPro = user?.publicMetadata?.isPro === true;

  const changeNum = stockData ? parseFloat(stockData.change) : 0;
  const isUp = changeNum >= 0;

  return (
    /* Robinhood: pure black page background */
    <main className="min-h-screen bg-black text-white">

      {/* ── Top nav bar ── */}
      <header className="border-b border-[#2a2a2a] bg-[#111111]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center shadow-[0_0_12px_rgba(0,200,5,0.4)]">
              <span className="text-xs font-black text-black">H</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">Hood Options</span>
              <span className="ml-2 text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-widest">Pro</span>
            </div>
          </div>

          {/* Tab switcher */}
          <nav className="flex gap-1 bg-[#1e1e1e] border border-[#2a2a2a] p-1 rounded-xl">
            {(['tracker', 'search'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-[#00C805] text-black shadow'
                    : 'text-[#9e9e9e] hover:text-white'
                }`}
              >
                {tab === 'tracker' ? 'Market Tracker' : 'Trade Search'}
              </button>
            ))}
          </nav>

          {/* Auth controls */}
          <div className="flex items-center gap-3">
            {isLoaded && !user && (
              <SignInButton mode="modal">
                <button className="text-xs font-semibold text-[#9e9e9e] hover:text-white transition-colors">
                  Sign in
                </button>
              </SignInButton>
            )}
            {isLoaded && user && !isPro && (
              <Link
                href="/pricing"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 hover:bg-[#00C805]/25 transition-colors"
              >
                Upgrade to Pro
              </Link>
            )}
            {isLoaded && user && isPro && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 tracking-widest">
                PRO
              </span>
            )}
            {isLoaded && user && (
              <UserButton />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── Market Tracker ── */}
        {activeTab === 'tracker' && <MarketTracker />}

        {/* ── Trade Search ── */}
        {activeTab === 'search' && (
          <div className="space-y-6">

            {/* Search bar card */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6">
              <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold mb-1">Symbol Lookup</p>
              <h2 className="text-lg font-bold text-white mb-4">Get 0DTE Trade Suggestions</h2>
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter ticker — AAPL, TSLA, SPY…"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#00C805]/60 transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] disabled:bg-[#1e1e1e] disabled:text-[#4a4a4a] text-black text-sm font-bold rounded-xl transition-colors"
                >
                  {loading ? 'Loading…' : 'Analyze'}
                </button>
              </form>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl px-5 py-4 text-[#EF4444] text-sm">
                {error}
              </div>
            )}

            {/* Quote banner */}
            {stockData && (
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black font-mono tracking-tight text-white">{stockData.symbol}</span>
                    <span className="text-2xl font-bold font-mono text-white">${stockData.currentPrice}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-md
                      ${isUp ? 'bg-[#00C805]/15 text-[#00C805]' : 'bg-[#EF4444]/15 text-[#EF4444]'}`}>
                      {isUp ? '+' : ''}{stockData.change} ({isUp ? '+' : ''}{stockData.changePercent}%)
                    </span>
                    <span className="text-xs text-[#6b6b6b]">Today</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">Timeframe</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">0DTE</p>
                  <p className="text-[10px] text-[#6b6b6b] mt-0.5">Same-day expiry</p>
                </div>
              </div>
            )}

            {/* Suggestion cards */}
            {stockData && stockData.suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-semibold text-[#9e9e9e] uppercase tracking-widest">Trade Suggestions</h3>
                  <div className="flex-1 h-px bg-[#2a2a2a]" />
                  <span className="text-xs text-[#6b6b6b]">{stockData.suggestions.length} setup{stockData.suggestions.length !== 1 ? 's' : ''}</span>
                </div>

                {stockData.suggestions.map((s, i) => {
                  const isCall    = s.title.toLowerCase().includes('call');
                  const isPut     = s.title.toLowerCase().includes('put');
                  const acBorder  = isCall ? 'border-[#00C805]/30' : isPut ? 'border-[#EF4444]/30' : 'border-[#60a5fa]/30';
                  const acText    = isCall ? 'text-[#00C805]'      : isPut ? 'text-[#EF4444]'      : 'text-[#60a5fa]';
                  const acBg      = isCall ? 'bg-[#00C805]/10'     : isPut ? 'bg-[#EF4444]/10'     : 'bg-[#60a5fa]/10';
                  const typeBadge = isCall ? 'CALL'                : isPut ? 'PUT'                  : 'STRADDLE';
                  const confColor = s.confidence >= 75 ? 'bg-[#00C805]' : s.confidence >= 60 ? 'bg-amber-500' : 'bg-[#EF4444]';

                  return (
                    <div key={i} className={`bg-[#151515] border ${acBorder} rounded-2xl overflow-hidden`}>
                      {/* Card header */}
                      <div className={`px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between ${acBg}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${acBorder} ${acText} uppercase tracking-wider`}>
                              {typeBadge}
                            </span>
                            <span className="text-xs text-[#6b6b6b] font-mono">0DTE · ATM</span>
                          </div>
                          <p className={`text-base font-bold ${acText}`}>{s.title.split('—')[1]?.trim() ?? s.title}</p>
                          <p className="text-xs text-[#9e9e9e] mt-0.5">{s.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Confidence</p>
                          <p className={`text-lg font-bold ${acText}`}>{s.confidence.toFixed(0)}%</p>
                          <div className="w-20 h-1.5 bg-[#2a2a2a] rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${confColor}`} style={{ width: `${s.confidence}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Key metrics grid */}
                      <div className="grid grid-cols-3 divide-x divide-[#2a2a2a] border-b border-[#2a2a2a]">
                        {[
                          { label: 'Entry Price',  value: `$${s.entryPrice}`, sub: 'Stock price now'  },
                          { label: 'Stock Target', value: `$${s.exitPrice}`,  sub: 'Price needed'     },
                          { label: 'Strike',       value: s.strike,           sub: 'Option strike'    },
                        ].map(({ label, value, sub }) => (
                          <div key={label} className="px-5 py-4">
                            <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">{label}</p>
                            <p className="text-base font-bold font-mono text-white mt-1">{value}</p>
                            <p className="text-[10px] text-[#4a4a4a] mt-0.5">{sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Cost grid */}
                      <div className="grid grid-cols-3 divide-x divide-[#2a2a2a]">
                        {[
                          { label: 'Prem / Share',   value: `$${s.premiumPerShare}`, note: 'Estimated ATM premium',   color: 'text-white'       },
                          { label: 'Contract Cost',  value: `$${s.contractCost}`,    note: '×100 shares (Robinhood)', color: 'text-white'       },
                          { label: '+20% Target',    value: `$${s.contractTarget}`,  note: 'Sell contract here',      color: 'text-amber-400'   },
                        ].map(({ label, value, note, color }) => (
                          <div key={label} className="px-5 py-4">
                            <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">{label}</p>
                            <p className={`text-base font-bold font-mono ${color} mt-1`}>{value}</p>
                            <p className="text-[10px] text-[#4a4a4a] mt-0.5">{note}</p>
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
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <p className="text-[#9e9e9e] font-semibold mb-1">Enter a ticker to get started</p>
                <p className="text-[#6b6b6b] text-sm">Real-time 0DTE option setups powered by Finnhub</p>
              </div>
            )}

            {/* No results */}
            {!loading && !error && stockData && stockData.suggestions.length === 0 && (
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-8 text-center">
                <p className="text-[#9e9e9e]">No setups found for {stockData.symbol} right now. Try again during market hours.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
