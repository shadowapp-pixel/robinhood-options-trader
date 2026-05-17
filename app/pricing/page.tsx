'use client';

import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

const FREE_FEATURES = [
  'Full Market Tracker — SPY, QQQ, Mag7 & VXX live signals',
  'CALL / PUT / NEUTRAL signal with confidence score',
  'Day range bar, VWAP & key price levels',
  'Interactive intraday charts per ticker',
  'Real-time 30-second refresh',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Trade Search — analyze any ticker on demand',
  'Virtual Contract Tracker — simulate +20% / −50% outcomes in real time',
  'Favorites Watchlist — save up to 20 stocks with live signals & charts',
  'Visual + audio alerts on prime signals',
  '7-Agent AI Analysis — deep per-stock research report',
  'Access to the Learn center',
  'Priority support',
];

function CheckIcon({ green }: { green?: boolean }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${green ? 'text-[#00C805]' : 'text-[#9e9e9e]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PricingContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const adminEmails = new Set(
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  );
  const userEmail  = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? '';
  const isAdmin    = adminEmails.has(userEmail);
  const isPro      = isAdmin || user?.publicMetadata?.isPro === true;
  const isSuccess  = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  const handleUpgrade = async () => {
    if (!user) { window.location.href = '/sign-up'; return; }
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const { url, error } = await res.json();
    if (error) { alert(error); setLoading(false); return; }
    window.location.href = url;
  };

  const handleManage = async () => {
    setLoading(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const { url, error } = await res.json();
    if (error) { alert(error); setLoading(false); return; }
    window.location.href = url;
  };

  return (
    <main className="min-h-screen bg-black text-white page-bg">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#111111]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center shadow-[0_0_12px_rgba(0,200,5,0.4)]">
              <span className="text-xs font-black text-black">H</span>
            </div>
            <span className="text-base font-bold tracking-tight">Hood Option</span>
          </Link>
          <Link href="/dashboard" className="text-[#9e9e9e] text-sm hover:text-white transition-colors">← Back to app</Link>
        </div>
      </header>

      <ThemeToggle />
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">Pricing</p>
          <h1 className="text-4xl font-black tracking-tight mb-4">
            Start free. Upgrade when you&apos;re ready.
          </h1>
          <p className="text-[#9e9e9e] text-lg max-w-xl mx-auto">
            The full Market Tracker — all 10 tickers, charts &amp; signals — is free forever. Upgrade Pro for Trade Search, AI Analysis &amp; more.
          </p>
        </div>

        {/* Success / Canceled banners */}
        {isSuccess && (
          <div className="mb-8 rounded-xl bg-[#00C805]/10 border border-[#00C805]/30 px-5 py-4 text-center">
            <p className="text-[#00C805] font-bold text-lg mb-1">🎉 Welcome to Hood Option Pro!</p>
            <p className="text-[#9e9e9e] text-sm">Your account is now upgraded. All tickers and alerts are unlocked.</p>
          </div>
        )}
        {isCanceled && (
          <div className="mb-8 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 px-5 py-4 text-center">
            <p className="text-[#EF4444] font-bold">Checkout canceled — no charge was made.</p>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free plan */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-[#9e9e9e] text-xs font-bold uppercase tracking-widest mb-2">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black">$0</span>
                <span className="text-[#6b6b6b] mb-1">/mo</span>
              </div>
              <p className="text-[#6b6b6b] text-sm">Full Market Tracker — all 10 tickers, no credit card needed</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#c4c4c4]">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            {!isLoaded || isPro ? null : (
              <Link
                href="/dashboard"
                className="block text-center py-2.5 rounded-xl border border-[#2a2a2a] text-[#9e9e9e] text-sm font-semibold hover:border-[#3a3a3a] hover:text-white transition-colors"
              >
                {user ? 'Current plan' : 'Get started free'}
              </Link>
            )}
          </div>

          {/* Pro plan */}
          <div className="bg-[#0d1a0d] border border-[#00C805]/40 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(0,200,5,0.08)]">
            {/* Popular badge */}
            <div className="absolute top-4 right-4 bg-[#00C805] text-black text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase">
              Popular
            </div>

            <div className="mb-6">
              <p className="text-[#00C805] text-xs font-bold uppercase tracking-widest mb-2">Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black">$19.99</span>
                <span className="text-[#6b6b6b] mb-1">/mo</span>
              </div>
              <p className="text-[#6b6b6b] text-sm">Cancel anytime · billed monthly</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#c4c4c4]">
                  <CheckIcon green />
                  {f}
                </li>
              ))}
            </ul>

            {!isLoaded ? (
              <div className="h-11 bg-[#1e1e1e] rounded-xl animate-pulse" />
            ) : isAdmin ? (
              <div className="w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-bold text-center">
                ✦ Admin Access — Complimentary
              </div>
            ) : isPro ? (
              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-[#00C805]/40 text-[#00C805] text-sm font-bold hover:bg-[#00C805]/10 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading…' : 'Manage Subscription'}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#00C805] text-black text-sm font-bold hover:bg-[#00a004] disabled:opacity-50 transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]"
              >
                {loading ? 'Loading…' : user ? 'Upgrade to Pro' : 'Sign up & Upgrade'}
              </button>
            )}
          </div>
        </div>

        {/* Affiliate CTA */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-3 bg-[#151515] border border-[#2a2a2a] rounded-2xl px-6 py-4">
            <span className="text-2xl">🏦</span>
            <div className="text-left">
              <p className="text-white text-sm font-semibold">Don&apos;t have a brokerage account?</p>
              <p className="text-[#6b6b6b] text-xs">Get a free stock when you sign up and fund your account</p>
            </div>
            <a
              href="https://join.robinhood.com/jamesh4964"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-white text-xs font-semibold rounded-xl hover:border-[#00C805]/40 hover:text-[#00C805] transition-colors"
            >
              Open Account →
            </a>
          </div>
          <p className="text-[#3a3a3a] text-[10px] mt-3">
            Affiliate disclosure: We may receive compensation if you sign up through this link. Hood Option is not affiliated with Robinhood Markets, Inc.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PricingContent />
    </Suspense>
  );
}
