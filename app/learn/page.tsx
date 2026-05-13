import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

/* ── helpers ── */
function SectionLabel({ text }: { text: string }) {
  return <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">{text}</p>;
}

function Tag({ children, color = 'green' }: { children: React.ReactNode; color?: 'green' | 'red' | 'amber' | 'blue' }) {
  const styles = {
    green: 'bg-[#00C805]/10 text-[#00C805] border-[#00C805]/30',
    red:   'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blue:  'bg-blue-500/10  text-blue-400  border-blue-500/30',
  };
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest uppercase ${styles[color]}`}>
      {children}
    </span>
  );
}

/* ── Step card ── */
function RHStep({ step, title, description, mockUI }: {
  step: number; title: string; description: string; mockUI: React.ReactNode;
}) {
  return (
    <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-black">{step}</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-[#9e9e9e] text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6">{mockUI}</div>
    </div>
  );
}

/* ── Phone mockup wrapper ── */
function PhoneMock({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-56 bg-[#1a1a1a] border border-[#333] rounded-3xl p-3 shadow-2xl">
      <div className="w-16 h-1 bg-[#333] rounded-full mx-auto mb-3" />
      <div className="bg-black rounded-2xl overflow-hidden min-h-[200px] p-3">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  Main Page                                             */
/* ══════════════════════════════════════════════════════ */
export default function LearnPage() {
  return (
    <main className="min-h-screen bg-black text-white page-bg">

      {/* ── Nav ── */}
      <header className="border-b border-[#2a2a2a] bg-[#111111]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center shadow-[0_0_12px_rgba(0,200,5,0.4)]">
              <span className="text-xs font-black text-black">H</span>
            </div>
            <span className="text-base font-bold tracking-tight">Hood Option</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-[#9e9e9e] hover:text-white transition-colors">← Back to App</Link>
            <Link href="/pricing" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 hover:bg-[#00C805]/25 transition-colors">
              Get Pro
            </Link>
          </div>
        </div>
      </header>

      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-20">

        {/* ── Hero ── */}
        <div className="text-center">
          <SectionLabel text="Options Education" />
          <h1 className="text-4xl font-black tracking-tight mb-4">Learn to Trade 0DTE Options Contracts</h1>
          <p className="text-[#9e9e9e] text-lg max-w-2xl mx-auto">
            A complete guide to understanding, reading, and executing 0DTE option contracts — from the basics to placing your first trade.
          </p>
        </div>

        {/* ════════════════════════════════════════════════ */}
        {/* SECTION 1 — Understanding Option Contracts      */}
        {/* ════════════════════════════════════════════════ */}
        <section>
          <SectionLabel text="Section 1" />
          <h2 className="text-2xl font-black mb-2">Understanding Option Contracts</h2>
          <p className="text-[#9e9e9e] text-sm mb-8">Before you place a trade, you need to understand what you are actually buying.</p>

          {/* What is an option */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 mb-4">
            <h3 className="text-base font-bold mb-3">What is an Option Contract?</h3>
            <p className="text-[#9e9e9e] text-sm leading-relaxed mb-4">
              An option contract gives you the <span className="text-white font-semibold">right — but not the obligation</span> — to buy or sell 100 shares of a stock at a specific price, before a set expiration date. You pay a <span className="text-white font-semibold">premium</span> upfront for that right. On standard brokerage platforms, one contract always controls exactly <span className="text-white font-semibold">100 shares</span>.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><Tag color="green">CALL</Tag></div>
                <p className="text-sm text-[#c4c4c4] leading-relaxed">You believe the stock will go <span className="text-[#00C805] font-semibold">UP</span>. A call gives you the right to buy 100 shares at the strike price. Profit when the stock rises above your strike.</p>
              </div>
              <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><Tag color="red">PUT</Tag></div>
                <p className="text-sm text-[#c4c4c4] leading-relaxed">You believe the stock will go <span className="text-[#EF4444] font-semibold">DOWN</span>. A put gives you the right to sell 100 shares at the strike price. Profit when the stock falls below your strike.</p>
              </div>
            </div>
          </div>

          {/* Key Terms */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 mb-4">
            <h3 className="text-base font-bold mb-4">Key Terms You Must Know</h3>
            <div className="space-y-4">
              {[
                {
                  term: 'Strike Price',
                  color: 'amber' as const,
                  def: 'The agreed price at which you can buy (call) or sell (put) the stock. Hood Option always targets the ATM (At-The-Money) strike — the strike closest to the current stock price.',
                  example: 'SPY is at $737. The ATM strike is $737.',
                },
                {
                  term: 'Expiration Date',
                  color: 'blue' as const,
                  def: '0DTE means the contract expires TODAY — the same trading day you buy it. These are the highest-risk, highest-reward contracts available. If the stock doesn\'t move your way before market close (4:00 PM ET), the contract expires worthless.',
                  example: '0DTE expires at 4:00 PM ET the same day.',
                },
                {
                  term: 'Premium',
                  color: 'green' as const,
                  def: 'The price you pay for the contract. Hood Option shows this as "Premium per Share." Because one contract = 100 shares, multiply by 100 to get your total cost. This is your maximum possible loss.',
                  example: 'Premium $2.10/share × 100 = $210 contract cost.',
                },
                {
                  term: 'ITM / ATM / OTM',
                  color: 'amber' as const,
                  def: 'In-The-Money (ITM) = favorable strike. At-The-Money (ATM) = strike equals current price. Out-of-The-Money (OTM) = unfavorable strike. Hood Option targets ATM for the best balance of cost and probability.',
                  example: 'SPY at $737 → $737 strike = ATM.',
                },
              ].map(({ term, color, def, example }) => (
                <div key={term} className="flex gap-4 pb-4 border-b border-[#1e1e1e] last:border-0 last:pb-0">
                  <div className="shrink-0 pt-0.5"><Tag color={color}>{term}</Tag></div>
                  <div>
                    <p className="text-sm text-[#c4c4c4] leading-relaxed mb-1">{def}</p>
                    <p className="text-xs text-[#6b6b6b] font-mono">Example: {example}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 0DTE Risk box */}
          <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-2xl p-5">
            <p className="text-[#EF4444] font-bold text-sm mb-1">⚠️ 0DTE Risk Warning</p>
            <p className="text-sm text-[#9e9e9e] leading-relaxed">
              0DTE contracts are the most speculative options available. They move extremely fast — a small stock movement can double or zero out your contract within minutes. <span className="text-white font-semibold">Only risk money you can afford to lose entirely.</span> Most traders limit each 0DTE trade to 1–5% of their total portfolio.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════ */}
        {/* SECTION 2 — Reading Hood Option Signals        */}
        {/* ════════════════════════════════════════════════ */}
        <section>
          <SectionLabel text="Section 2" />
          <h2 className="text-2xl font-black mb-2">Reading the Hood Option Dashboard</h2>
          <p className="text-[#9e9e9e] text-sm mb-8">Every signal card on the Market Tracker tells a complete story. Here&apos;s how to read it.</p>

          {/* Signal card anatomy */}
          <div className="bg-[#151515] border border-[#00C805]/30 rounded-2xl overflow-hidden mb-4">
            <div className="bg-[#00C805]/10 px-6 py-4 border-b border-[#2a2a2a]">
              <p className="text-xs text-[#6b6b6b] uppercase tracking-widest font-semibold mb-1">Example Signal Card — SPY</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono">SPY</span>
                    <span className="text-xl font-bold font-mono">$737.62</span>
                    <span className="text-sm text-[#00C805] font-semibold">+0.83%</span>
                  </div>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">S&amp;P 500 ETF · Major ETF</p>
                </div>
                <div className="text-right">
                  <Tag color="green">CALL</Tag>
                  <p className="text-lg font-black text-[#00C805] mt-1">75%</p>
                  <p className="text-[10px] text-[#6b6b6b]">Confidence</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { label: 'A', name: 'Signal Direction', value: 'CALL', color: 'text-[#00C805]', note: 'The overall bias — CALL (bullish), PUT (bearish), or NEUTRAL. Only trade in the signal direction.' },
                { label: 'B', name: 'Confidence Score', value: '75%', color: 'text-[#00C805]', note: 'Percentage of technical conditions met. 75%+ = worth considering. Below 60% = skip the trade.' },
                { label: 'C', name: 'VWAP', value: '$736.10', color: 'text-white', note: 'Volume-Weighted Average Price — the most important intraday benchmark. Price above VWAP = bullish bias. Price below = bearish.' },
                { label: 'D', name: 'Range Position', value: '62%', color: 'text-amber-400', note: 'Where the price sits in today\'s high/low range. Below 30% = potential bounce (CALL). Above 70% = potential reversal (PUT).' },
              ].map(({ label, name, value, color, note }) => (
                <div key={label} className="flex gap-4 pb-3 border-b border-[#1e1e1e] last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-[#9e9e9e]">{label}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{name}</span>
                      <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
                    </div>
                    <p className="text-xs text-[#6b6b6b] leading-relaxed">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade suggestion anatomy */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-base font-bold mb-4">Reading a Trade Suggestion</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Entry Price', value: '$737.62', note: 'Current stock price when signal fired. Buy your option near this price.' },
                { label: 'Stock Target', value: '$740.57', note: 'The stock price you need to reach for the option to gain ~20% in value.' },
                { label: 'Strike', value: '~$738 ATM', note: 'The option strike to select in your brokerage app — always the closest ATM strike.' },
                { label: 'Prem / Share', value: '$2.21', note: 'Estimated premium per share. This is what the option costs before ×100.' },
                { label: 'Contract Cost', value: '$221.00', note: 'Your total cost for 1 contract (premium × 100). This is your max loss.' },
                { label: '+20% Target', value: '$265.20', note: 'Sell your contract when it reaches this value — your profit target.' },
              ].map(({ label, value, note }) => (
                <div key={label} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-3">
                  <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold mb-1">{label}</p>
                  <p className="text-sm font-bold font-mono text-white mb-1">{value}</p>
                  <p className="text-[10px] text-[#4a4a4a] leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════ */}
        {/* SECTION 2B — Signal Confidence Explained         */}
        {/* ════════════════════════════════════════════════ */}
        <section>
          <SectionLabel text="Section 2B" />
          <h2 className="text-2xl font-black mb-2">How Signal Confidence Is Calculated</h2>
          <p className="text-[#9e9e9e] text-sm mb-8">
            The confidence percentage is not a guess — it is a precise score derived from four technical conditions evaluated in real time. Here is exactly how it works.
          </p>

          {/* Formula card */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 mb-4">
            <h3 className="text-base font-bold mb-1">The Formula</h3>
            <p className="text-[#9e9e9e] text-sm mb-5 leading-relaxed">
              Every signal checks up to four conditions. Each one either <span className="text-[#00C805] font-semibold">passes</span> or <span className="text-[#EF4444] font-semibold">fails</span>. The confidence score is simply the fraction of conditions that pass, expressed as a percentage.
            </p>
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-5 text-center mb-5">
              <p className="text-[#6b6b6b] text-xs uppercase tracking-widest font-semibold mb-2">Confidence Formula</p>
              <p className="text-white font-mono text-lg font-bold">
                Confidence = (Conditions Passed ÷ Total Conditions) × 100
              </p>
              <p className="text-[#6b6b6b] text-xs mt-2 font-mono">Example: 3 out of 4 pass → 75% confidence</p>
            </div>

            {/* Possible outcomes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { score: '100%', label: '4 / 4 pass', badge: 'PRIME SIGNAL', badgeColor: 'text-[#00C805]', bg: 'bg-[#00C805]/8 border-[#00C805]/25', note: 'All conditions met. Signal fires as CALL or PUT.' },
                { score: '75%',  label: '3 / 4 pass', badge: 'STRONG',       badgeColor: 'text-[#00C805]', bg: 'bg-[#00C805]/5 border-[#2a2a2a]',   note: 'Worth watching. Signal shows NEUTRAL but bias is clear.' },
                { score: '50%',  label: '2 / 4 pass', badge: 'BORDERLINE',   badgeColor: 'text-amber-400', bg: 'bg-amber-500/5 border-[#2a2a2a]',   note: 'Directional bias exists but confirmation is weak. Use caution.' },
                { score: '0%',   label: 'No bias',    badge: 'NEUTRAL',       badgeColor: 'text-[#6b6b6b]', bg: 'bg-[#1e1e1e] border-[#2a2a2a]',    note: 'Price is not clearly above or below VWAP and open. No trade.' },
              ].map(({ score, label, badge, badgeColor, bg, note }) => (
                <div key={score} className={`rounded-xl border p-3 ${bg}`}>
                  <p className={`text-2xl font-black font-mono mb-0.5 ${badgeColor}`}>{score}</p>
                  <p className="text-[10px] text-[#6b6b6b] font-mono mb-1">{label}</p>
                  <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${badgeColor}`}>{badge}</p>
                  <p className="text-[10px] text-[#4a4a4a] leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The four conditions */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 mb-4">
            <h3 className="text-base font-bold mb-1">The Four Conditions</h3>
            <p className="text-[#9e9e9e] text-sm mb-5 leading-relaxed">
              A separate set of four conditions is evaluated for each potential CALL and PUT direction. Conditions 1 and 2 determine direction; conditions 3 and 4 filter for quality entry timing.
            </p>

            {/* CALL conditions */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag color="green">CALL Conditions</Tag>
                <span className="text-[10px] text-[#6b6b6b]">checked when price is above VWAP and above today&apos;s open</span>
              </div>
              <div className="rounded-xl border border-[#2a2a2a] divide-y divide-[#2a2a2a] overflow-hidden">
                {[
                  {
                    num: 1,
                    label: 'Price above VWAP',
                    always: true,
                    detail: 'VWAP (Volume-Weighted Average Price) is calculated as (High + Low + Close) ÷ 3. Price above VWAP means buyers are in control for the day. This condition always passes when a bullish bias is detected.',
                    code: 'c > vwap',
                  },
                  {
                    num: 2,
                    label: 'Price above today\'s open (intraday uptrend)',
                    always: true,
                    detail: 'The opening price is used as a proxy for the 8-period EMA trend. Price holding above the open signals that the intraday uptrend is intact. This condition always passes for a CALL signal.',
                    code: 'c > open',
                  },
                  {
                    num: 3,
                    label: 'Range position < 30% (intraday pullback)',
                    always: false,
                    detail: 'Range Position = (Current Price − Day Low) ÷ (Day High − Day Low) × 100. Below 30% means the stock has pulled back toward its daily low while remaining in an uptrend — a better entry point with more upside room.',
                    code: 'rangePos < 30',
                  },
                  {
                    num: 4,
                    label: 'Within 1.5% of VWAP',
                    always: false,
                    detail: 'The percentage distance between current price and VWAP. The closer the price is to VWAP, the lower the risk of buying at an extended level. Entries far from VWAP (>1.5%) have a higher chance of mean-reverting against you.',
                    code: 'abs((c − vwap) ÷ vwap) × 100 < 1.5',
                  },
                ].map(({ num, label, always, detail, code }) => (
                  <div key={num} className="flex gap-4 px-4 py-3.5">
                    <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                      <div className="w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                        <span className="text-[10px] font-black text-[#9e9e9e]">{num}</span>
                      </div>
                      {always && (
                        <span className="text-[8px] font-bold text-[#00C805] tracking-widest">AUTO</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-white">{label}</span>
                        {always
                          ? <span className="text-[10px] font-bold text-[#00C805] bg-[#00C805]/10 px-1.5 py-0.5 rounded border border-[#00C805]/25">Always passes</span>
                          : <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25">Conditional</span>
                        }
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed mb-1.5">{detail}</p>
                      <p className="text-[10px] font-mono text-[#4a4a4a] bg-[#1e1e1e] px-2 py-1 rounded border border-[#2a2a2a] inline-block">{code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PUT conditions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag color="red">PUT Conditions</Tag>
                <span className="text-[10px] text-[#6b6b6b]">mirror image — checked when price is below VWAP and below today&apos;s open</span>
              </div>
              <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-sm text-[#9e9e9e] leading-relaxed mb-3">
                  The PUT evaluation uses the exact same four conditions with inverted logic:
                </p>
                <div className="space-y-2">
                  {[
                    { n: 1, text: 'Price below VWAP', auto: true },
                    { n: 2, text: 'Price below today\'s open (intraday downtrend)', auto: true },
                    { n: 3, text: 'Range position > 70% — price extended toward the high, ready to reverse', auto: false },
                    { n: 4, text: 'Within 1.5% of VWAP — same proximity rule applies', auto: false },
                  ].map(({ n, text, auto }) => (
                    <div key={n} className="flex items-start gap-2.5">
                      <span className="text-[#EF4444] font-bold text-xs w-4 shrink-0 mt-0.5">{n}.</span>
                      <span className="text-xs text-[#c4c4c4] leading-relaxed flex-1">{text}</span>
                      {auto && <span className="text-[8px] font-bold text-[#EF4444] tracking-widest shrink-0 mt-0.5">AUTO</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live worked example */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 mb-4">
            <h3 className="text-base font-bold mb-1">Worked Example — 75% CALL Signal</h3>
            <p className="text-[#9e9e9e] text-sm mb-5 leading-relaxed">
              Here is how the engine scores a real-world scenario with AAPL trading at $294.80 intraday.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Current Price', value: '$294.80', color: 'text-white' },
                { label: 'Day Open',      value: '$292.56', color: 'text-white' },
                { label: 'VWAP',          value: '$294.21', color: 'text-[#60a5fa]' },
                { label: 'Day High',      value: '$295.27', color: 'text-[#00C805]' },
                { label: 'Day Low',       value: '$292.56', color: 'text-[#EF4444]' },
                { label: 'Range Pos',     value: '82.7%',   color: 'text-[#EF4444]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3">
                  <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold mb-1">{label}</p>
                  <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#2a2a2a] divide-y divide-[#2a2a2a] overflow-hidden mb-4">
              {[
                { label: 'Price above VWAP',                         pass: true,  reason: '$294.80 > $294.21 ✓' },
                { label: 'Price above open (intraday uptrend)',       pass: true,  reason: '$294.80 > $292.56 ✓' },
                { label: 'Range position < 30 — intraday pullback',  pass: false, reason: '82.7% is not < 30 ✗ — price is near the high' },
                { label: 'Within 1.5% of VWAP',                      pass: true,  reason: '|(294.80 − 294.21) ÷ 294.21| × 100 = 0.20% < 1.5 ✓' },
              ].map(({ label, pass, reason }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`text-xs font-bold w-4 shrink-0 ${pass ? 'text-[#00C805]' : 'text-[#EF4444]'}`}>
                    {pass ? '✓' : '✗'}
                  </span>
                  <span className={`text-xs flex-1 ${pass ? 'text-[#c4c4c4]' : 'text-[#4a4a4a]'}`}>{label}</span>
                  <span className={`text-[10px] font-mono shrink-0 ${pass ? 'text-[#00C805]' : 'text-[#EF4444]'}`}>{reason}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-semibold mb-1">Result</p>
                <p className="text-sm text-[#c4c4c4]">3 of 4 conditions passed → signal shows <span className="text-white font-semibold">NEUTRAL</span> (not all pass), but the underlying direction is <span className="text-[#00C805] font-semibold">CALL</span> with <span className="text-[#00C805] font-semibold">75% confidence</span>.</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-3xl font-black text-[#00C805] font-mono">75%</p>
                <p className="text-[10px] text-[#6b6b6b]">3 ÷ 4 × 100</p>
              </div>
            </div>
          </div>

          {/* Trading guidance */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-base font-bold mb-4">How to Use Confidence in Your Trading</h3>
            <div className="space-y-3">
              {[
                {
                  score: '100%',
                  tag: 'PRIME SIGNAL',
                  tagColor: 'green' as const,
                  text: 'All four conditions pass. The signal fires as CALL or PUT and triggers the prime ribbon on the card plus an audio alert. This is the highest-quality setup Hood Option can produce — the one worth acting on.',
                },
                {
                  score: '75%',
                  tag: 'WORTH WATCHING',
                  tagColor: 'green' as const,
                  text: 'Three conditions pass. The signal shows NEUTRAL (because not all four pass) but the direction and score are visible in the card. Many experienced traders wait for 100% and skip 75% setups, but 75% with a strong day\'s trend can still be a solid trade.',
                },
                {
                  score: '50%',
                  tag: 'USE CAUTION',
                  tagColor: 'amber' as const,
                  text: 'Only the two direction-defining conditions pass. The market has a directional lean but lacks confirmation from the timing filters. Avoid trading on 50% signals alone — wait for a higher score or additional confirmation.',
                },
                {
                  score: '0%',
                  tag: 'NO TRADE',
                  tagColor: 'red' as const,
                  text: 'Price is caught between VWAP and the open — neither clearly bullish nor bearish. The signal shows NEUTRAL with 0% confidence. Sit on your hands and wait for a clearer setup.',
                },
              ].map(({ score, tag, tagColor, text }) => (
                <div key={score} className="flex gap-4 pb-3 border-b border-[#1e1e1e] last:border-0 last:pb-0">
                  <div className="shrink-0 w-12 text-right pt-0.5">
                    <span className="text-base font-black font-mono text-white">{score}</span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1"><Tag color={tagColor}>{tag}</Tag></div>
                    <p className="text-xs text-[#9e9e9e] leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════ */}
        {/* SECTION 3 — Step-by-Step Trade Guide             */}
        {/* ════════════════════════════════════════════════ */}
        <section>
          <SectionLabel text="Section 3" />
          <h2 className="text-2xl font-black mb-2">How to Buy &amp; Sell a 0DTE Options Contract</h2>
          <p className="text-[#9e9e9e] text-sm mb-8">Follow these steps when placing a 0DTE options trade. Steps are illustrated using a typical mobile brokerage app flow.</p>

          <div className="space-y-4">

            <RHStep step={1} title="Find the stock" description="Search for the ticker from your signal card"
              mockUI={
                <PhoneMock>
                  <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 mb-3 flex items-center gap-2 border border-[#333]">
                    <span className="text-[#555] text-xs">🔍</span>
                    <span className="text-white text-xs font-mono">SPY</span>
                    <span className="w-0.5 h-3 bg-[#00C805] ml-0.5 animate-pulse" />
                  </div>
                  <div className="bg-[#111] rounded-xl p-3 border border-[#222]">
                    <p className="text-white text-xs font-bold">SPY</p>
                    <p className="text-[#555] text-[10px]">SPDR S&P 500 ETF Trust</p>
                    <p className="text-white text-sm font-bold font-mono mt-1">$737.62</p>
                    <p className="text-[#00C805] text-[10px]">+$6.04 (0.83%)</p>
                  </div>
                </PhoneMock>
              }
            />

            <RHStep step={2} title="Open the options chain" description="Tap Trade → Options on the stock page"
              mockUI={
                <PhoneMock>
                  <div className="mb-3">
                    <p className="text-[#555] text-[10px] mb-1">SPDR S&P 500 ETF</p>
                    <p className="text-white text-lg font-bold font-mono">$737.62</p>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 bg-[#00C805] rounded-xl py-2 text-center">
                      <p className="text-black text-xs font-bold">Buy</p>
                    </div>
                    <div className="flex-1 bg-[#222] rounded-xl py-2 text-center border border-[#333]">
                      <p className="text-white text-xs font-bold">Sell</p>
                    </div>
                  </div>
                  <div className="bg-[#111] rounded-xl p-2.5 border border-[#222] text-center">
                    <p className="text-[#00C805] text-xs font-bold">Options →</p>
                  </div>
                </PhoneMock>
              }
            />

            <RHStep step={3} title="Select today's expiration" description="Always choose the current date for 0DTE trades"
              mockUI={
                <PhoneMock>
                  <p className="text-[#555] text-[10px] mb-2">Select Expiration</p>
                  <div className="space-y-1.5">
                    {['May 10 (Today)', 'May 17', 'May 24', 'Jun 20'].map((d, i) => (
                      <div key={d} className={`rounded-xl px-3 py-2 border flex items-center justify-between ${i === 0 ? 'bg-[#00C805]/10 border-[#00C805]/40' : 'bg-[#111] border-[#222]'}`}>
                        <p className={`text-xs font-bold ${i === 0 ? 'text-[#00C805]' : 'text-[#555]'}`}>{d}</p>
                        {i === 0 && <span className="text-[10px] text-[#00C805]">✓ 0DTE</span>}
                      </div>
                    ))}
                  </div>
                </PhoneMock>
              }
            />

            <RHStep step={4} title="Choose Call or Put" description="Match the contract type to your Hood Option signal direction"
              mockUI={
                <PhoneMock>
                  <p className="text-[#555] text-[10px] mb-2">Select Type</p>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 bg-[#00C805]/10 border border-[#00C805]/40 rounded-xl py-2.5 text-center">
                      <p className="text-[#00C805] text-xs font-bold">Call ✓</p>
                    </div>
                    <div className="flex-1 bg-[#111] border border-[#222] rounded-xl py-2.5 text-center">
                      <p className="text-[#555] text-xs font-bold">Put</p>
                    </div>
                  </div>
                  <p className="text-[#555] text-[10px]">Signal says CALL → select Call</p>
                </PhoneMock>
              }
            />

            <RHStep step={5} title="Select the ATM strike" description="Pick the strike price closest to the current stock price"
              mockUI={
                <PhoneMock>
                  <p className="text-[#555] text-[10px] mb-2">Strike Price (Calls)</p>
                  <div className="space-y-1.5">
                    {[
                      { strike: '$735', type: 'ITM', premium: '$3.80' },
                      { strike: '$737', type: 'ATM ✓', premium: '$2.21', active: true },
                      { strike: '$740', type: 'OTM', premium: '$0.95' },
                    ].map(({ strike, type, premium, active }) => (
                      <div key={strike} className={`rounded-xl px-3 py-2 border flex items-center justify-between ${active ? 'bg-[#00C805]/10 border-[#00C805]/40' : 'bg-[#111] border-[#222]'}`}>
                        <p className={`text-xs font-bold font-mono ${active ? 'text-[#00C805]' : 'text-[#555]'}`}>{strike}</p>
                        <p className={`text-[10px] ${active ? 'text-[#00C805]' : 'text-[#444]'}`}>{type}</p>
                        <p className={`text-xs font-mono ${active ? 'text-white' : 'text-[#555]'}`}>{premium}</p>
                      </div>
                    ))}
                  </div>
                </PhoneMock>
              }
            />

            <RHStep step={6} title="Set quantity to 1 contract and review" description="Start with 1 contract until you are comfortable with how options move"
              mockUI={
                <PhoneMock>
                  <p className="text-[#555] text-[10px] mb-2">Order Review</p>
                  <div className="space-y-2 mb-3">
                    {[
                      { label: 'Type', val: 'Buy Call' },
                      { label: 'Strike', val: '$737' },
                      { label: 'Expiry', val: 'Today' },
                      { label: 'Contracts', val: '1' },
                      { label: 'Est. Cost', val: '$221.00' },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[#555] text-[10px]">{label}</span>
                        <span className="text-white text-[10px] font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#00C805] rounded-xl py-2 text-center">
                    <p className="text-black text-xs font-black">Submit Order</p>
                  </div>
                </PhoneMock>
              }
            />

            <RHStep step={7} title="Sell to close — don't wait for expiry" description="Sell your contract when it hits the +20% target or if the trade goes against you"
              mockUI={
                <PhoneMock>
                  <p className="text-[#555] text-[10px] mb-1">My Positions</p>
                  <div className="bg-[#111] border border-[#222] rounded-xl p-3 mb-2">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-white text-xs font-bold">SPY $737 Call</p>
                        <p className="text-[#555] text-[10px]">Exp: Today · 1 contract</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#00C805] text-xs font-bold">+$44.20</p>
                        <p className="text-[#00C805] text-[10px]">+20.0%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl py-2 text-center">
                    <p className="text-[#EF4444] text-xs font-bold">Sell to Close →</p>
                  </div>
                </PhoneMock>
              }
            />

          </div>

          {/* Pro tips */}
          <div className="mt-6 bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">⚡ Pro Tips for 0DTE Trades</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { tip: 'Only trade between 9:45–11:30 AM and 2:00–3:30 PM ET', note: 'These windows have the best price action. Avoid the first 15 minutes and the last 30 minutes.' },
                { tip: 'Use limit orders, not market orders', note: 'Options spreads can be wide. Set a limit price between the bid and ask to avoid overpaying.' },
                { tip: 'Set a hard stop at −50%', note: 'If your contract loses half its value, sell immediately. Don\'t hope for a recovery on 0DTE.' },
                { tip: 'Never hold a 0DTE past 3:30 PM ET', note: 'Time decay (theta) accelerates exponentially in the last 30 minutes. Exit early.' },
              ].map(({ tip, note }) => (
                <div key={tip} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-3">
                  <p className="text-white text-xs font-semibold mb-1">{tip}</p>
                  <p className="text-[#6b6b6b] text-[11px] leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="bg-[#0d1a0d] border border-[#00C805]/30 rounded-2xl px-8 py-10 text-center shadow-[0_0_40px_rgba(0,200,5,0.06)]">
          <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">Ready to Trade?</p>
          <h2 className="text-2xl font-black mb-3">Put your knowledge to work</h2>
          <p className="text-[#9e9e9e] text-sm max-w-md mx-auto mb-7">
            Head to the Market Tracker for live signals, or use Trade Search to analyze any ticker on demand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]"
            >
              Open Market Tracker →
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-2.5 bg-[#151515] border border-[#2a2a2a] hover:border-[#00C805]/40 text-white text-sm font-bold rounded-xl transition-colors"
            >
              View Pro Plan
            </Link>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2a2a2a] mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-[11px] text-[#3a3a3a] leading-relaxed text-center">
            This page is for educational purposes only and does not constitute financial advice. Options trading involves substantial risk. Always consult a licensed financial professional before trading.
          </p>
        </div>
      </footer>

    </main>
  );
}
