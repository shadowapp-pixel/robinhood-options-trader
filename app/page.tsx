import Link from 'next/link';

const FREE_FEATURES = [
  'SPY & QQQ live signals',
  '0DTE CALL / PUT suggestions',
  'Day range bar & key levels',
  'Real-time 30-second refresh',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Full Mag7 watchlist (AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA)',
  'VXX volatility tracker',
  'Trade Search — analyze any ticker on demand',
  'Virtual Contract Tracker — simulate +20% / −50% outcomes in real time',
  'Visual + audio alerts on prime signals',
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* ── Nav ── */}
      <header className="border-b border-[#2a2a2a] bg-[#111111]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center shadow-[0_0_12px_rgba(0,200,5,0.4)]">
              <span className="text-xs font-black text-black">H</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">Hood Options</span>
              <span className="ml-2 text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-widest">Pro</span>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-sm text-[#9e9e9e] hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[#9e9e9e] hover:text-white transition-colors">Pricing</a>
            <Link href="/learn" className="text-sm text-[#9e9e9e] hover:text-white transition-colors">Learn</Link>
            <Link href="/dashboard" className="text-sm text-[#9e9e9e] hover:text-white transition-colors">App</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#9e9e9e] hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-[#00C805] hover:bg-[#00a004] text-black text-xs font-bold rounded-xl transition-colors shadow-[0_0_16px_rgba(0,200,5,0.3)]"
            >
              Get Pro
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00C805]/10 border border-[#00C805]/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C805] animate-pulse" />
          <span className="text-[#00C805] text-xs font-bold tracking-widest uppercase">Live 0DTE Signals</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
          Trade smarter with<br />
          <span className="text-[#00C805]">real-time options signals</span>
        </h1>
        <p className="text-[#9e9e9e] text-lg max-w-2xl mx-auto mb-6">
          Hood Options delivers live 0DTE call &amp; put setups for the biggest tickers — powered by Finnhub market data, built for active options traders.
        </p>
        <p className="text-[#4a4a4a] text-xs mb-10">
          Independent platform — not affiliated with, endorsed by, or connected to Robinhood Markets, Inc.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 bg-[#00C805] hover:bg-[#00a004] text-black font-bold rounded-xl transition-colors shadow-[0_0_24px_rgba(0,200,5,0.3)] text-sm"
          >
            Open Market Tracker →
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3.5 bg-[#151515] border border-[#2a2a2a] hover:border-[#00C805]/40 text-white font-bold rounded-xl transition-colors text-sm"
          >
            View Pricing
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="flex items-center justify-center gap-8 mt-14 flex-wrap">
          {[
            { value: '10+', label: 'Tickers tracked' },
            { value: '0DTE', label: 'Same-day expiry focus' },
            { value: '30s', label: 'Signal refresh rate' },
            { value: '24/7', label: 'Always-on alerts' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-[#00C805]">{value}</p>
              <p className="text-xs text-[#6b6b6b] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">What&apos;s Inside</p>
            <h2 className="text-3xl font-black tracking-tight">Powerful tools, one dashboard</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Market Tracker */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-[#00C805]/10 border border-[#00C805]/20 flex items-center justify-center mb-5">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Market Tracker</h3>
              <p className="text-[#9e9e9e] text-sm mb-6 leading-relaxed">
                Live signal dashboard covering SPY, QQQ, the full Magnificent 7, and VXX. Each card shows the current price, intraday bias (CALL / PUT / NEUTRAL), VWAP indicator, confidence score, and 0DTE option setups — refreshed every 30 seconds.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['VWAP + intraday trend analysis', 'CALL / PUT / NEUTRAL signal per ticker', 'Day range bar with key price levels', 'Visual & audio alerts on prime signals'].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#c4c4c4]">
                    <CheckIcon green />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-2.5 rounded-xl bg-[#00C805]/10 border border-[#00C805]/30 text-[#00C805] text-sm font-bold hover:bg-[#00C805]/20 transition-colors"
              >
                Open Market Tracker →
              </Link>
            </div>

            {/* Trade Search */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                <span className="text-xl">🔍</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">Trade Search</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 tracking-widest">PRO</span>
              </div>
              <p className="text-[#9e9e9e] text-sm mb-6 leading-relaxed">
                Search any ticker symbol for instant 0DTE trade setups. Enter a stock, get a live quote plus CALL, PUT, and Straddle suggestions — complete with entry price, strike, premium cost, and a +20% profit target.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Any ticker — not just the watchlist', 'Live quote with intraday change', 'CALL, PUT & Straddle setups', 'Contract cost & 20% exit target'].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#c4c4c4]">
                    <CheckIcon green />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block text-center py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-colors"
              >
                Unlock Trade Search →
              </Link>
            </div>

            {/* Contract Tracker */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
                <span className="text-xl">🎯</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">Contract Tracker</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 tracking-widest">PRO</span>
              </div>
              <p className="text-[#9e9e9e] text-sm mb-6 leading-relaxed">
                Found a setup you like? Track it live. The Contract Tracker simulates whether a contract would have hit a +20% profit or −50% loss from the moment you mark it — with real-time price updates every 30 seconds.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['One-click tracking from any Trade Search result', '+20% win / −50% loss auto-resolution', 'Live simulated P&L using delta approximation', 'Full history saved across sessions'].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#c4c4c4]">
                    <CheckIcon green />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block text-center py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-bold hover:bg-purple-500/20 transition-colors"
              >
                Unlock Contract Tracker →
              </Link>
            </div>

            {/* Learn Center */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                <span className="text-xl">📚</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Learn Center</h3>
              <p className="text-[#9e9e9e] text-sm mb-6 leading-relaxed">
                New to options? Start here. A complete beginner-friendly guide covering what option contracts are, how to read every signal on the dashboard, and a step-by-step walkthrough of placing your first trade.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['What calls, puts & strikes mean', 'How to read VWAP & signal scores', 'Step-by-step options trade guide', 'Pro tips for 0DTE risk management'].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#c4c4c4]">
                    <CheckIcon green />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/learn"
                className="block text-center py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition-colors"
              >
                Start Learning →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Referral Banner ── */}
      <section className="border-t border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-14 text-center">
          <p className="text-[#6b6b6b] text-xs font-bold tracking-widest uppercase mb-3">Before You Trade</p>
          <h2 className="text-2xl font-black tracking-tight mb-7">No brokerage account yet? Get a free stock when you create one here.</h2>
          <a
            href="https://join.robinhood.com/jamesh4964"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#151515] border border-[#2a2a2a] hover:border-[#00C805]/40 rounded-2xl px-7 py-4 transition-colors group"
          >
            <span className="text-2xl">🏦</span>
            <div className="text-left">
              <p className="text-white text-sm font-bold group-hover:text-[#00C805] transition-colors">Open a Brokerage Account →</p>
              <p className="text-[#6b6b6b] text-xs">Get a free stock when you sign up &amp; fund</p>
            </div>
          </a>
          <p className="text-[#3a3a3a] text-[10px] mt-4">
            Affiliate disclosure: We may receive compensation if you sign up through this link. Hood Options is not affiliated with Robinhood Markets, Inc.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl font-black tracking-tight">From signal to trade in seconds</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '📡', title: 'Live data pulled', body: 'Finnhub delivers real-time quotes every 30 seconds — price, open, high, low, and previous close.' },
              { step: '02', icon: '🧠', title: 'Signal generated', body: 'VWAP and intraday trend are analyzed to determine bullish, bearish, or neutral bias with a confidence score.' },
              { step: '03', icon: '⚡', title: 'Trade setup delivered', body: 'A complete 0DTE option setup appears — strike, premium, contract cost, and a +20% profit target.' },
            ].map(({ step, icon, title, body }) => (
              <div key={step} className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-black text-[#3a3a3a] tracking-widest">{step}</span>
                </div>
                <h4 className="text-base font-bold mb-2">{title}</h4>
                <p className="text-sm text-[#9e9e9e] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-3xl font-black tracking-tight mb-4">Start free. Upgrade when you&apos;re ready.</h2>
            <p className="text-[#9e9e9e] text-base max-w-xl mx-auto">
              Get live signals for SPY &amp; QQQ at no cost — or unlock the full suite with Pro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Free */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-[#9e9e9e] text-xs font-bold uppercase tracking-widest mb-2">Free</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-[#6b6b6b] mb-1">/mo</span>
                </div>
                <p className="text-[#6b6b6b] text-sm">SPY &amp; QQQ signals — no credit card needed</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#c4c4c4]">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-2.5 rounded-xl border border-[#2a2a2a] text-[#9e9e9e] text-sm font-semibold hover:border-[#3a3a3a] hover:text-white transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#0d1a0d] border border-[#00C805]/40 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(0,200,5,0.08)]">
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
              <Link
                href="/pricing"
                className="block text-center py-2.5 rounded-xl bg-[#00C805] text-black text-sm font-bold hover:bg-[#00a004] transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="border-t border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-4">Ready to trade with an edge?</h2>
          <p className="text-[#9e9e9e] text-lg mb-8 max-w-xl mx-auto">
            Join Hood Options and get live 0DTE signals delivered straight to your screen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-[#00C805] hover:bg-[#00a004] text-black font-bold rounded-xl transition-colors shadow-[0_0_24px_rgba(0,200,5,0.3)] text-sm"
            >
              Open Market Tracker — Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 bg-[#151515] border border-[#2a2a2a] hover:border-[#00C805]/40 text-white font-bold rounded-xl transition-colors text-sm"
            >
              View Pro Plan
            </Link>
            <Link
              href="/learn"
              className="px-8 py-3.5 bg-[#151515] border border-[#2a2a2a] hover:border-[#00C805]/40 text-white font-bold rounded-xl transition-colors text-sm"
            >
              📚 Learn to Trade
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2a2a2a] bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">

          {/* Top row — brand + links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#00C805] flex items-center justify-center">
                <span className="text-[10px] font-black text-black">H</span>
              </div>
              <span className="text-sm font-bold text-white">Hood Options</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">App</Link>
              <Link href="/pricing" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Pricing</Link>
              <Link href="/learn" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Learn</Link>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#1e1e1e] mb-6" />

          {/* Legal disclaimer */}
          <div className="space-y-3">
            <p className="text-[11px] text-[#4a4a4a] leading-relaxed">
              <span className="text-[#6b6b6b] font-semibold">IMPORTANT DISCLAIMER:</span> Hood Options is an independent, technology-driven platform designed solely for informational and educational purposes. All signals, trade setups, confidence scores, and analysis provided on this platform are generated algorithmically and do not constitute financial advice, investment recommendations, or solicitations to buy or sell any security or financial instrument.
            </p>
            <p className="text-[11px] text-[#4a4a4a] leading-relaxed">
              Options trading involves substantial risk of loss and is not appropriate for all investors. 0DTE (zero days to expiration) options are highly speculative instruments that can expire worthless within a single trading session. Past signal performance is not indicative of future results. You may lose some or all of your invested capital.
            </p>
            <p className="text-[11px] text-[#4a4a4a] leading-relaxed">
              Hood Options is not a registered investment adviser, broker-dealer, or financial planner. Nothing on this platform should be construed as personalized financial, legal, or tax advice. Always conduct your own due diligence and consult a licensed financial professional before making any investment decisions.
            </p>
            <p className="text-[11px] text-[#3a3a3a] leading-relaxed">
              © {new Date().getFullYear()} Hood Options. All rights reserved. Use of this platform constitutes acceptance of our terms. Market data provided for informational purposes only.
            </p>
          </div>

        </div>
      </footer>

    </main>
  );
}
