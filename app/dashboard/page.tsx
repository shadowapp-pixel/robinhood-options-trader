'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UserButton, useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import MarketTracker      from '@/components/MarketTrackerV2';
import StockChart         from '@/components/StockChart';
import ThemeToggle        from '@/components/ThemeToggle';
import FavoritesTracker   from '@/components/FavoritesTracker';
import AIAnalysisPanel    from '@/components/AIAnalysisPanel';

type Tab = 'tracker' | 'search' | 'favorites' | 'ai';

/* ─── Trade Search types ─────────────────────────────────────────────────── */

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

/* ─── Contract Tracker types ─────────────────────────────────────────────── */

type ContractType   = 'CALL' | 'PUT' | 'STRADDLE';
type ContractStatus = 'active' | 'won' | 'lost';

interface TrackedContract {
  id: string;
  symbol: string;
  type: ContractType;
  strike: string;
  entryStockPrice: number;
  entryContractCost: number;
  trackedAt: number;
  status: ContractStatus;
  currentStockPrice: number;
  currentSimValue: number;
  resolvedAt?: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Simplified ATM option sim: delta ≈ 0.5, 100 shares per contract */
function calcSimValue(c: TrackedContract, currentPrice: number): number {
  const priceDelta =
    c.type === 'CALL'    ? currentPrice - c.entryStockPrice :
    c.type === 'PUT'     ? c.entryStockPrice - currentPrice :
    /* STRADDLE */         Math.abs(currentPrice - c.entryStockPrice);
  return Math.max(0, c.entryContractCost + priceDelta * 0.5 * 100);
}

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

const STORAGE_KEY = 'hood_tracked_contracts_v1';
const FAV_KEY     = 'hood_favorites_v1';

/* ── Favorites helpers ────────────────────────────────────────────────────── */

function loadFavoritesFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveFavoritesToStorage(symbols: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(symbols)); }
  catch { /* ignore quota errors */ }
}

async function fetchFavoritesFromServer(): Promise<string[] | null> {
  try {
    const res = await fetch('/api/favorites');
    if (!res.ok) return null;
    const { symbols } = await res.json() as { symbols: string[] };
    return Array.isArray(symbols) ? symbols : null;
  } catch { return null; }
}

async function saveFavoritesToServer(symbols: string[]) {
  try {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
  } catch { /* localStorage is the fallback */ }
}

function loadFromStorage(): TrackedContract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackedContract[]) : [];
  } catch { return []; }
}

function saveToStorage(contracts: TrackedContract[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts)); }
  catch { /* ignore quota errors */ }
}

async function fetchFromServer(): Promise<TrackedContract[] | null> {
  try {
    const res = await fetch('/api/contracts');
    if (!res.ok) return null;
    const { contracts } = await res.json() as { contracts: TrackedContract[] };
    return Array.isArray(contracts) ? contracts : null;
  } catch { return null; }
}

async function saveToServer(contracts: TrackedContract[]) {
  try {
    await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contracts }),
    });
  } catch { /* ignore — localStorage is the fallback */ }
}

/* ─── TrackerRow ─────────────────────────────────────────────────────────── */

function TrackerRow({
  contract: c,
  onRemove,
}: {
  contract: TrackedContract;
  onRemove: (id: string) => void;
}) {
  const [tick, setTick] = useState(0);

  /* Re-render every second so "timeAgo" stays current while active */
  useEffect(() => {
    if (c.status !== 'active') return;
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [c.status]);

  void tick; // suppress unused-var lint

  const pnl    = c.currentSimValue - c.entryContractCost;
  const pnlPct = c.entryContractCost > 0
    ? (pnl / c.entryContractCost) * 100
    : 0;

  const typeColors =
    c.type === 'CALL'    ? 'text-[#00C805] border-[#00C805]/40 bg-[#00C805]/10' :
    c.type === 'PUT'     ? 'text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10' :
                           'text-[#60a5fa] border-[#60a5fa]/40 bg-[#60a5fa]/10';

  const statusColors =
    c.status === 'won'  ? 'text-[#00C805] bg-[#00C805]/10 border-[#00C805]/30' :
    c.status === 'lost' ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30' :
                          'text-amber-400  bg-amber-500/10  border-amber-500/30';

  const statusLabel =
    c.status === 'won'  ? '✓ WIN' :
    c.status === 'lost' ? '✕ LOSS' :
                          '● Active';

  const pnlColor =
    pnl > 0 ? 'text-[#00C805]' :
    pnl < 0 ? 'text-[#EF4444]' :
              'text-[#9e9e9e]';

  return (
    <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">

      {/* Type badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 font-mono tracking-wider ${typeColors}`}>
        {c.type}
      </span>

      {/* Symbol + strike */}
      <div className="shrink-0 min-w-[64px]">
        <p className="text-sm font-bold text-white font-mono leading-tight">{c.symbol}</p>
        <p className="text-[10px] text-[#6b6b6b] leading-tight">{c.strike}</p>
      </div>

      {/* Entry → Current stock price */}
      <div className="shrink-0 border-l border-[#2a2a2a] pl-3">
        <p className="text-[10px] text-[#6b6b6b]">Entry → Now</p>
        <p className="text-xs font-mono text-white leading-tight">
          ${c.entryStockPrice.toFixed(2)}
          {' → '}
          <span className={c.status === 'active' ? 'text-white' : 'text-[#9e9e9e]'}>
            ${c.currentStockPrice.toFixed(2)}
          </span>
        </p>
      </div>

      {/* Sim value + P&L */}
      <div className="shrink-0 border-l border-[#2a2a2a] pl-3">
        <p className="text-[10px] text-[#6b6b6b]">Sim Value</p>
        <p className="text-xs font-mono leading-tight">
          <span className="text-white">${c.currentSimValue.toFixed(0)}</span>
          {' '}
          <span className={`font-bold ${pnlColor}`}>
            ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
          </span>
        </p>
      </div>

      {/* Entry cost */}
      <div className="shrink-0 border-l border-[#2a2a2a] pl-3">
        <p className="text-[10px] text-[#6b6b6b]">Cost</p>
        <p className="text-xs font-mono text-[#9e9e9e] leading-tight">
          ${c.entryContractCost.toFixed(0)}
        </p>
      </div>

      {/* Time */}
      <div className="shrink-0 border-l border-[#2a2a2a] pl-3 flex-1">
        <p className="text-[10px] text-[#6b6b6b]">
          {c.status === 'active' ? 'Tracking' : c.status === 'won' ? 'Won' : 'Lost'}
        </p>
        <p className="text-xs text-[#9e9e9e] leading-tight">{timeAgo(c.resolvedAt ?? c.trackedAt)}</p>
      </div>

      {/* Status badge */}
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusColors}`}>
        {statusLabel}
      </span>

      {/* Remove */}
      <button
        onClick={() => onRemove(c.id)}
        title="Remove"
        className="text-[#3a3a3a] hover:text-[#9e9e9e] text-lg leading-none shrink-0 transition-colors ml-1"
      >
        ×
      </button>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function Home() {
  /* ── Auth ── */
  const { user, isLoaded } = useUser();
  const adminEmails = new Set(
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  );
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? '';
  const isAdmin   = adminEmails.has(userEmail);
  const isPro     = isAdmin || user?.publicMetadata?.isPro === true;

  /* ── Tab ── */
  const [activeTab, setActiveTab] = useState<Tab>('tracker');

  /* ── Trade Search state ── */
  const [symbol,    setSymbol]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  /* ── Contract Tracker state ── */
  const [trackedContracts, setTrackedContracts] = useState<TrackedContract[]>([]);
  const [trackerReady,     setTrackerReady]     = useState(false);
  const trackedRef  = useRef<TrackedContract[]>([]);
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);
  trackedRef.current = trackedContracts;

  /* ── Favorites state ── */
  const [favorites,       setFavorites]       = useState<string[]>([]);
  const [favReady,        setFavReady]        = useState(false);
  const favSaveTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFavFirstLoad    = useRef(true);

  /* Load on mount — try server first, fall back to localStorage */
  useEffect(() => {
    if (!isPro) { setTrackerReady(true); return; }
    (async () => {
      const serverContracts = await fetchFromServer();
      if (serverContracts && serverContracts.length > 0) {
        setTrackedContracts(serverContracts);
        saveToStorage(serverContracts);
      } else {
        setTrackedContracts(loadFromStorage());
      }
      setTrackerReady(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  /* Persist whenever contracts change — localStorage immediately, server debounced */
  useEffect(() => {
    if (!trackerReady) return;
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    saveToStorage(trackedContracts);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveToServer(trackedContracts), 1500);
  }, [trackedContracts, trackerReady]);

  /* Load favorites on mount */
  useEffect(() => {
    if (!isPro) { setFavReady(true); return; }
    (async () => {
      const serverFavs = await fetchFavoritesFromServer();
      if (serverFavs && serverFavs.length > 0) {
        setFavorites(serverFavs);
        saveFavoritesToStorage(serverFavs);
      } else {
        setFavorites(loadFavoritesFromStorage());
      }
      setFavReady(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  /* Persist favorites whenever they change */
  useEffect(() => {
    if (!favReady) return;
    if (isFavFirstLoad.current) { isFavFirstLoad.current = false; return; }
    saveFavoritesToStorage(favorites);
    if (favSaveTimer.current) clearTimeout(favSaveTimer.current);
    favSaveTimer.current = setTimeout(() => saveFavoritesToServer(favorites), 1500);
  }, [favorites, favReady]);

  /* ── Price polling for active contracts ── */
  const activeSymbolsKey = trackedContracts
    .filter(c => c.status === 'active')
    .map(c => c.symbol)
    .sort()
    .join(',');

  useEffect(() => {
    if (!activeSymbolsKey) return;

    const poll = async () => {
      const current   = trackedRef.current;
      const activeNow = current.filter(c => c.status === 'active');
      if (activeNow.length === 0) return;

      const symbols = [...new Set(activeNow.map(c => c.symbol))];
      const prices: Record<string, number> = {};

      await Promise.all(
        symbols.map(async sym => {
          try {
            const res  = await fetch(`/api/price?symbol=${sym}`);
            const data = await res.json() as { price?: number };
            if (data.price) prices[sym] = data.price;
          } catch { /* ignore */ }
        })
      );

      if (Object.keys(prices).length === 0) return;

      setTrackedContracts(prev =>
        prev.map(c => {
          if (c.status !== 'active') return c;
          const price = prices[c.symbol];
          if (!price) return c;

          const simValue = calcSimValue(c, price);
          const pnlPct   = c.entryContractCost > 0
            ? (simValue - c.entryContractCost) / c.entryContractCost
            : 0;

          if (pnlPct >= 0.20) {
            return { ...c, currentStockPrice: price, currentSimValue: simValue, status: 'won',  resolvedAt: Date.now() };
          }
          if (pnlPct <= -0.50) {
            return { ...c, currentStockPrice: price, currentSimValue: simValue, status: 'lost', resolvedAt: Date.now() };
          }
          return { ...c, currentStockPrice: price, currentSimValue: simValue };
        })
      );
    };

    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbolsKey]);

  /* ── Add / Remove tracked contracts ── */
  const addContract = useCallback((suggestion: Suggestion, sym: string) => {
    const title  = suggestion.title.toLowerCase();
    const type: ContractType =
      title.includes('call') ? 'CALL' :
      title.includes('put')  ? 'PUT'  :
                               'STRADDLE';

    const entryStockPrice   = parseFloat(suggestion.entryPrice);
    const entryContractCost = parseFloat(suggestion.contractCost);

    if (isNaN(entryStockPrice) || isNaN(entryContractCost) || entryContractCost <= 0) return;

    const newContract: TrackedContract = {
      id:               `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      symbol:           sym,
      type,
      strike:           suggestion.strike,
      entryStockPrice,
      entryContractCost,
      trackedAt:        Date.now(),
      status:           'active',
      currentStockPrice: entryStockPrice,
      currentSimValue:   entryContractCost,
    };

    setTrackedContracts(prev => [newContract, ...prev]);
  }, []);

  const removeContract = useCallback((id: string) => {
    setTrackedContracts(prev => prev.filter(c => c.id !== id));
  }, []);

  /* ── Add / Remove favorites ── */
  const addFavorite = useCallback((sym: string) => {
    setFavorites(prev => {
      if (prev.includes(sym)) return prev;
      if (prev.length >= 20) return prev;
      return [...prev, sym];
    });
  }, []);

  const removeFavorite = useCallback((sym: string) => {
    setFavorites(prev => prev.filter(s => s !== sym));
  }, []);

  /* ── Trade Search handler ── */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    setStockData(null);
    try {
      const response = await fetch(`/api/trades?symbol=${symbol}`);
      const data     = await response.json() as StockData & { error?: string };
      if (data.error) { setError(data.error); return; }
      setStockData(data);
    } catch {
      setError('Failed to fetch data. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Derived display values ── */
  const changeNum = stockData ? parseFloat(stockData.change) : 0;
  const isUp      = changeNum >= 0;

  const activeContracts   = trackedContracts.filter(c => c.status === 'active');
  const resolvedContracts = trackedContracts.filter(c => c.status !== 'active');

  /* ── Render ── */
  return (
    <main className="min-h-screen bg-black text-white page-bg">

      {/* ── Top nav bar ── */}
      <header className="border-b border-[#2a2a2a] bg-[#111111]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center shadow-[0_0_12px_rgba(0,200,5,0.4)]">
              <span className="text-xs font-black text-black">H</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">Hood Option</span>
              <span className="ml-2 text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-widest">Pro</span>
            </div>
          </Link>

          {/* Tab switcher */}
          <nav className="flex gap-1 bg-[#1e1e1e] border border-[#2a2a2a] p-1 rounded-xl">
            {(['tracker', 'search', 'favorites', 'ai'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-[#00C805] text-black shadow'
                    : 'text-[#9e9e9e] hover:text-white'
                }`}
              >
                {tab === 'tracker'   ? 'Market Tracker' :
                 tab === 'search'    ? 'Trade Search'   :
                 tab === 'favorites' ? '★ Favorites'    :
                                      '🤖 AI Analysis'}
              </button>
            ))}
          </nav>

          {/* Auth controls */}
          <div className="flex items-center gap-3">
            <Link href="/learn" className="text-xs text-[#9e9e9e] hover:text-white transition-colors hidden sm:block">Learn</Link>
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
            {isLoaded && user && isAdmin && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-widest">
                ADMIN
              </span>
            )}
            {isLoaded && user && isPro && !isAdmin && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 tracking-widest">
                PRO
              </span>
            )}
            {isLoaded && user && <UserButton />}
          </div>
        </div>
      </header>

      <ThemeToggle />
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── Market Tracker tab ── */}
        {activeTab === 'tracker' && <MarketTracker />}

        {/* ── AI Analysis tab — paywall ── */}
        {activeTab === 'ai' && !isPro && (
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-5 text-2xl">
              🤖
            </div>
            <p className="text-white font-bold text-lg mb-2">AI Analysis is a Pro feature</p>
            <p className="text-[#6b6b6b] text-sm max-w-sm mx-auto mb-6">
              Run a 7-agent deep analysis on any stock — Technical, Fundamental, Sentiment,
              Bull/Bear Research, Risk Management, and a final Portfolio Manager decision.
            </p>
            {isLoaded && !user ? (
              <SignInButton mode="modal">
                <button className="px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]">
                  Sign in to upgrade
                </button>
              </SignInButton>
            ) : (
              <a
                href="/pricing"
                className="inline-block px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]"
              >
                Upgrade to Pro →
              </a>
            )}
          </div>
        )}

        {/* ── AI Analysis tab — Pro ── */}
        {activeTab === 'ai' && isPro && <AIAnalysisPanel />}

        {/* ── Favorites tab — paywall ── */}
        {activeTab === 'favorites' && !isPro && (
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">★</span>
            </div>
            <p className="text-white font-bold text-lg mb-2">Favorites is a Pro feature</p>
            <p className="text-[#6b6b6b] text-sm max-w-sm mx-auto mb-6">
              Save any stock to your personal watchlist and get live signals, charts, and trade setups — unlocked with Hood Option Pro.
            </p>
            {isLoaded && !user ? (
              <SignInButton mode="modal">
                <button className="px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]">
                  Sign in to upgrade
                </button>
              </SignInButton>
            ) : (
              <a
                href="/pricing"
                className="inline-block px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]"
              >
                Upgrade to Pro →
              </a>
            )}
          </div>
        )}

        {/* ── Favorites tab — Pro ── */}
        {activeTab === 'favorites' && isPro && favReady && (
          <FavoritesTracker symbols={favorites} onRemove={removeFavorite} />
        )}

        {/* ── Trade Search tab — paywall ── */}
        {activeTab === 'search' && !isPro && (
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-white font-bold text-lg mb-2">Trade Search is a Pro feature</p>
            <p className="text-[#6b6b6b] text-sm max-w-sm mx-auto mb-6">
              Search any ticker for live 0DTE call, put &amp; straddle setups — unlocked with Hood Option Pro.
            </p>
            {isLoaded && !user ? (
              <SignInButton mode="modal">
                <button className="px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]">
                  Sign in to upgrade
                </button>
              </SignInButton>
            ) : (
              <a
                href="/pricing"
                className="inline-block px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]"
              >
                Upgrade to Pro →
              </a>
            )}
          </div>
        )}

        {/* ── Trade Search tab — Pro ── */}
        {activeTab === 'search' && isPro && (
          <div className="space-y-6">

            {/* Search bar */}
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
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black font-mono tracking-tight text-white">{stockData.symbol}</span>
                      <span className="text-2xl font-bold font-mono text-white">${stockData.currentPrice}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-md ${isUp ? 'bg-[#00C805]/15 text-[#00C805]' : 'bg-[#EF4444]/15 text-[#EF4444]'}`}>
                        {isUp ? '+' : ''}{stockData.change} ({isUp ? '+' : ''}{stockData.changePercent}%)
                      </span>
                      <span className="text-xs text-[#6b6b6b]">Today</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <div className="text-right">
                      <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">Timeframe</p>
                      <p className="text-sm font-bold text-amber-400 mt-0.5">0DTE</p>
                      <p className="text-[10px] text-[#6b6b6b] mt-0.5">Same-day expiry</p>
                    </div>
                    {/* Add to Favorites button */}
                    {(() => {
                      const isFav = favorites.includes(stockData.symbol);
                      return (
                        <button
                          onClick={() => isFav ? removeFavorite(stockData.symbol) : addFavorite(stockData.symbol)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            isFav
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#9e9e9e] hover:text-amber-400 hover:border-amber-500/30'
                          }`}
                        >
                          <span>{isFav ? '★' : '☆'}</span>
                          {isFav ? 'Favorited' : 'Add to Favorites'}
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => setShowChart(v => !v)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        showChart
                          ? 'bg-[#00C805]/15 border-[#00C805]/30 text-[#00C805]'
                          : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#9e9e9e] hover:text-white'
                      }`}
                    >
                      <span>📈</span>
                      {showChart ? 'Hide Chart' : 'Show Chart'}
                    </button>
                  </div>
                </div>

                {/* Chart */}
                {showChart && (
                  <div className="px-6 pb-6 border-t border-[#2a2a2a] pt-4">
                    <StockChart symbol={stockData.symbol} />
                  </div>
                )}
              </div>
            )}

            {/* ── Suggestion cards ── */}
            {stockData && stockData.suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-semibold text-[#9e9e9e] uppercase tracking-widest">Trade Suggestions</h3>
                  <div className="flex-1 h-px bg-[#2a2a2a]" />
                  <span className="text-xs text-[#6b6b6b]">
                    {stockData.suggestions.length} setup{stockData.suggestions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {stockData.suggestions.map((s, i) => {
                  const isCall    = s.title.toLowerCase().includes('call');
                  const isPut     = s.title.toLowerCase().includes('put');
                  const acBorder  = isCall ? 'border-[#00C805]/30' : isPut ? 'border-[#EF4444]/30' : 'border-[#60a5fa]/30';
                  const acText    = isCall ? 'text-[#00C805]'      : isPut ? 'text-[#EF4444]'      : 'text-[#60a5fa]';
                  const acBg      = isCall ? 'bg-[#00C805]/10'     : isPut ? 'bg-[#EF4444]/10'     : 'bg-[#60a5fa]/10';
                  const typeBadge = isCall ? 'CALL'                : isPut ? 'PUT'                  : 'STRADDLE';
                  const confColor = s.confidence >= 75 ? 'bg-[#00C805]' : s.confidence >= 60 ? 'bg-amber-500' : 'bg-[#EF4444]';

                  /* Check if this suggestion is already actively tracked */
                  const alreadyTracked = trackedContracts.some(
                    c => c.symbol === stockData.symbol &&
                         c.type   === typeBadge &&
                         c.strike === s.strike &&
                         c.status === 'active'
                  );

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
                          <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-1">Signal Score</p>
                          <p className={`text-2xl font-bold ${acText}`}>{s.confidence.toFixed(0)}%</p>
                        </div>
                      </div>

                      {/* Signal Confidence — full-width bar */}
                      <div className="px-6 py-3 border-b border-[#2a2a2a]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">Signal Confidence</span>
                          <span className={`text-[10px] font-semibold text-[#6b6b6b]`}>
                            {s.confidence >= 75 ? 'Strong setup' : s.confidence >= 60 ? 'Moderate setup' : 'Weak setup'}
                          </span>
                        </div>
                        <div className="h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${confColor}`} style={{ width: `${s.confidence}%` }} />
                        </div>
                      </div>

                      {/* Key metrics grid */}
                      <div className="grid grid-cols-3 divide-x divide-[#2a2a2a] border-b border-[#2a2a2a]">
                        {[
                          { label: 'Entry Price',  value: `$${s.entryPrice}`, sub: 'Stock price now' },
                          { label: 'Stock Target', value: `$${s.exitPrice}`,  sub: 'Price needed'    },
                          { label: 'Strike',       value: s.strike,           sub: 'Option strike'   },
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
                          { label: 'Prem / Share',  value: `$${s.premiumPerShare}`, note: 'Estimated ATM premium',    color: 'text-white'     },
                          { label: 'Contract Cost', value: `$${s.contractCost}`,    note: '×100 shares per contract', color: 'text-white'     },
                          { label: 'Exit Scenario', value: `$${s.contractTarget}`,  note: 'Illustrative exit price',  color: 'text-amber-400' },
                        ].map(({ label, value, note, color }) => (
                          <div key={label} className="px-5 py-4">
                            <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold">{label}</p>
                            <p className={`text-base font-bold font-mono ${color} mt-1`}>{value}</p>
                            <p className="text-[10px] text-[#4a4a4a] mt-0.5">{note}</p>
                          </div>
                        ))}
                      </div>

                      {/* Track button */}
                      <div className="px-6 py-3 border-t border-[#2a2a2a] flex items-center justify-between">
                        <p className="text-[10px] text-[#4a4a4a]">
                          Track whether this contract would hit +20% profit or −50% loss in real time
                        </p>
                        <button
                          onClick={() => addContract(s, stockData.symbol)}
                          disabled={alreadyTracked}
                          className={`shrink-0 ml-4 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            alreadyTracked
                              ? 'bg-[#1e1e1e] text-[#4a4a4a] cursor-default border border-[#2a2a2a]'
                              : `border ${acBorder} ${acText} hover:${acBg} bg-transparent hover:bg-opacity-100`
                          }`}
                          style={alreadyTracked ? {} : undefined}
                        >
                          {alreadyTracked ? '✓ Tracking' : '+ Track Contract'}
                        </button>
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

            {/* ── Contract Tracker section ── */}
            {trackerReady && trackedContracts.length > 0 && (
              <div className="space-y-3 pt-2">

                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[#9e9e9e] uppercase tracking-widest">Contract Tracker</h3>
                    {activeContracts.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {activeContracts.length} live
                      </span>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-[#2a2a2a]" />
                  <span className="text-xs text-[#6b6b6b]">
                    {resolvedContracts.length > 0 && `${resolvedContracts.length} resolved · `}
                    Updates every 30s
                  </span>
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-[#3a3a3a]">
                  Simulated using ~0.5 delta approximation. For educational purposes only — not a guarantee of actual option pricing.
                </p>

                {/* Active contracts */}
                {activeContracts.map(c => (
                  <TrackerRow key={c.id} contract={c} onRemove={removeContract} />
                ))}

                {/* Resolved contracts */}
                {resolvedContracts.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-semibold">Resolved</span>
                      <div className="flex-1 h-px bg-[#1e1e1e]" />
                    </div>
                    {resolvedContracts.map(c => (
                      <TrackerRow key={c.id} contract={c} onRemove={removeContract} />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Tracker empty hint (only after a search, no contracts yet) */}
            {trackerReady && trackedContracts.length === 0 && stockData && (
              <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-5 py-3 flex items-center gap-3">
                <span className="text-lg">📊</span>
                <p className="text-[10px] text-[#4a4a4a]">
                  Click <span className="text-[#6b6b6b] font-semibold">+ Track Contract</span> on any suggestion above to monitor it in real time.
                  Results are saved across sessions.
                </p>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
