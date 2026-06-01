import Link from 'next/link';

export const metadata = {
  title: 'About — Hood Option',
  description: 'Learn about Hood Option — who we are, what we build, and why we built it.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* Nav */}
      <header className="border-b border-[#2a2a2a] bg-[#111111]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center shadow-[0_0_12px_rgba(0,200,5,0.4)]">
              <span className="text-xs font-black text-black">H</span>
            </div>
            <span className="text-base font-bold tracking-tight">Hood Option</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-[#9e9e9e] hover:text-white transition-colors">App</Link>
            <Link href="/pricing" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 hover:bg-[#00C805]/25 transition-colors">
              Get Pro
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">

        {/* Hero */}
        <div>
          <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">About Us</p>
          <h1 className="text-4xl font-black tracking-tight mb-4">Built by traders, for traders.</h1>
          <p className="text-[#9e9e9e] text-lg leading-relaxed">
            Hood Option is an independent options signal platform built to give retail traders the same real-time technical edge that institutional desks use every day — presented simply, refreshed every 30 seconds, and available to anyone.
          </p>
        </div>

        {/* Mission */}
        <section className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8">
          <h2 className="text-xl font-black mb-4">Our Mission</h2>
          <p className="text-[#9e9e9e] text-sm leading-relaxed mb-4">
            Retail options traders are at a structural disadvantage. Institutional algorithms process thousands of signals per second. Most individual traders are left reading candlestick charts on a 15-minute delay, guessing direction, and paying full option premium for the privilege.
          </p>
          <p className="text-[#9e9e9e] text-sm leading-relaxed mb-4">
            We built Hood Option to change that. Our signal engine processes real-time market data — VWAP, MACD, Bollinger Bands, 13 chart pattern detectors, and live options pricing — and distills it into a single, clear directional bias: CALL, PUT, or NEUTRAL. No jargon. No noise. Just the setup.
          </p>
          <p className="text-[#9e9e9e] text-sm leading-relaxed">
            The Market Tracker is permanently free. We believe every trader deserves access to quality signals regardless of account size.
          </p>
        </section>

        {/* What we built */}
        <section>
          <h2 className="text-xl font-black mb-6">What We Built</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: '📊',
                title: 'Market Tracker',
                desc: 'Live 0DTE signals for 10 major tickers — SPY, QQQ, the Magnificent 7, and VXX — refreshed every 30 seconds. Completely free, no account required.',
              },
              {
                icon: '🔍',
                title: 'Trade Search',
                desc: 'Run the full signal engine on any ticker on demand. Get a CALL, PUT, or Straddle setup with entry price, strike, contract cost, and 20% profit target.',
              },
              {
                icon: '🤖',
                title: '7-Agent AI Analysis',
                desc: 'A pipeline of Claude AI agents — Technical, Fundamental, Sentiment, Bull, Bear, Risk, and Portfolio — produce a comprehensive per-stock research report.',
              },
              {
                icon: '🎯',
                title: 'Contract Tracker',
                desc: 'Track any trade idea in real time. The virtual tracker monitors whether your simulated contract hits a +20% win or −50% stop-loss throughout the session.',
              },
              {
                icon: '★',
                title: 'Favorites Watchlist',
                desc: 'Save up to 20 stocks. Get live signals, intraday charts, and 0DTE setups for your personal picks — synced across all your devices.',
              },
              {
                icon: '📚',
                title: 'Learn Center',
                desc: 'A complete options education guide — from what a contract is, to reading every metric on the dashboard, to placing your first 0DTE trade.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-[#9e9e9e] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How the signal engine works */}
        <section className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8">
          <h2 className="text-xl font-black mb-4">How the Signal Engine Works</h2>
          <p className="text-[#9e9e9e] text-sm leading-relaxed mb-4">
            Every signal is produced by a three-tier confidence model:
          </p>
          <div className="space-y-3 mb-4">
            {[
              { pct: '50%', label: 'Intraday conditions', desc: 'VWAP position, day range location, candle body strength, and gap filter.' },
              { pct: '25%', label: 'Daily technicals', desc: 'MACD 12/26/9 crossover with histogram expansion, and Bollinger Bands (20-period, 2σ) with squeeze guard.' },
              { pct: '25%', label: 'Chart patterns', desc: '13 pattern detectors — double top/bottom, head & shoulders, wedges, flags, triangles, and more.' },
            ].map(({ pct, label, desc }) => (
              <div key={label} className="flex gap-4 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3">
                <div className="shrink-0 w-10 text-right">
                  <span className="text-sm font-black text-[#00C805]">{pct}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[#9e9e9e] text-sm leading-relaxed">
            A <span className="text-white font-semibold">Prime Signal</span> fires only when all intraday conditions pass and the blended confidence score reaches 80% or above — the highest-quality setup the engine produces.
          </p>
        </section>

        {/* Tech stack */}
        <section className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8">
          <h2 className="text-xl font-black mb-4">Technology</h2>
          <p className="text-[#9e9e9e] text-sm leading-relaxed mb-5">
            Hood Option is built on modern, reliable infrastructure designed for low latency and high availability during market hours.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Framework', value: 'Next.js 15 (App Router)' },
              { label: 'Hosting', value: 'Vercel' },
              { label: 'Auth', value: 'Clerk' },
              { label: 'Cache', value: 'Upstash Redis' },
              { label: 'Market Data', value: 'Finnhub API' },
              { label: 'Options Data', value: 'Tradier API' },
              { label: 'Payments', value: 'Stripe' },
              { label: 'AI Models', value: 'Anthropic Claude' },
              { label: 'Styling', value: 'Tailwind CSS' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold mb-0.5">{label}</p>
                <p className="text-xs font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-[#6b6b6b] mb-3 uppercase tracking-widest">Important Disclaimer</h2>
          <p className="text-xs text-[#4a4a4a] leading-relaxed mb-2">
            Hood Option is an independent, technology-driven platform designed solely for informational and educational purposes. All signals, trade setups, confidence scores, and analysis are generated algorithmically and do not constitute financial advice, investment recommendations, or solicitations to buy or sell any security.
          </p>
          <p className="text-xs text-[#4a4a4a] leading-relaxed mb-2">
            Options trading involves substantial risk of loss. 0DTE options are highly speculative instruments that can expire worthless within a single trading session. Past signal performance is not indicative of future results.
          </p>
          <p className="text-xs text-[#4a4a4a] leading-relaxed">
            Hood Option is not a registered investment adviser or broker-dealer. Always consult a licensed financial professional before making investment decisions. Hood Option is not affiliated with, endorsed by, or connected to Robinhood Markets, Inc.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8 text-center">
          <h2 className="text-xl font-black mb-3">Get in Touch</h2>
          <p className="text-[#9e9e9e] text-sm leading-relaxed mb-4">
            Questions, feedback, or support requests? We read every email.
          </p>
          <a
            href="mailto:support@hoodoption.com"
            className="inline-block px-6 py-2.5 bg-[#00C805]/10 border border-[#00C805]/30 text-[#00C805] text-sm font-bold rounded-xl hover:bg-[#00C805]/20 transition-colors"
          >
            support@hoodoption.com
          </a>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3.5 bg-[#00C805] hover:bg-[#00a004] text-black font-bold rounded-xl transition-colors shadow-[0_0_24px_rgba(0,200,5,0.3)] text-sm"
          >
            Open Market Tracker — Free →
          </Link>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#111111] mt-12">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#3a3a3a]">© {new Date().getFullYear()} Hood Option. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/about" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
