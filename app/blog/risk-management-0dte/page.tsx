import Link from 'next/link';

export const metadata = {
  title: '0DTE Risk Management: The Rules Every Options Trader Needs — Hood Option',
  description: 'Most 0DTE traders lose money not because they pick wrong direction, but because they manage risk badly. Learn position sizing, stop-losses, profit targets, and the habits that separate consistent traders.',
};

export default function Article() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-[#2a2a2a] bg-[#111111]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#00C805] flex items-center justify-center"><span className="text-xs font-black text-black">H</span></div>
            <span className="text-base font-bold tracking-tight">Hood Option</span>
          </Link>
          <Link href="/blog" className="text-xs text-[#9e9e9e] hover:text-white transition-colors">← Back to Blog</Link>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest uppercase bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30">Risk Management</span>
            <span className="text-[#4a4a4a] text-xs">10 min read · June 3, 2025</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-tight mb-4">0DTE Risk Management: The Rules Every Options Trader Needs</h1>
          <p className="text-[#9e9e9e] text-lg leading-relaxed">Studies consistently show that most retail options traders lose money — not because they cannot pick direction, but because they do not manage risk consistently. These are the rules that change that.</p>
        </div>

        <div className="space-y-8 text-[#c4c4c4] text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-white mb-3">Why Risk Management Matters More Than Direction</h2>
            <p>Here is a scenario most new options traders encounter: they pick the right direction 6 times out of 10. That sounds like a winning strategy. But if their average loss is three times their average gain, they still lose money over 100 trades.</p>
            <p className="mt-3">This is the central paradox of options trading. Being right about direction is necessary but not sufficient. What determines your long-term outcome is the ratio of your average win to your average loss — and that is entirely controlled by risk management.</p>
            <div className="mt-4 bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5">
              <p className="text-[#6b6b6b] text-xs uppercase tracking-widest font-semibold mb-3">Example: Two traders, same win rate</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-3">
                  <p className="text-[#EF4444] font-bold text-xs mb-2">Trader A — no risk rules</p>
                  <p className="text-xs text-[#9e9e9e]">Wins: 6 × $100 = $600<br/>Losses: 4 × $300 = $1,200<br/><span className="text-[#EF4444] font-bold">Net: −$600</span></p>
                </div>
                <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-xl p-3">
                  <p className="text-[#00C805] font-bold text-xs mb-2">Trader B — strict risk rules</p>
                  <p className="text-xs text-[#9e9e9e]">Wins: 6 × $100 = $600<br/>Losses: 4 × $50 = $200<br/><span className="text-[#00C805] font-bold">Net: +$400</span></p>
                </div>
              </div>
              <p className="text-xs text-[#6b6b6b] mt-3">Same 60% win rate. Same $100 average win. The only difference is how they handle losses.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Rule 1: The 1–5% Position Sizing Rule</h2>
            <p>Never risk more than 1–5% of your total trading account on a single 0DTE trade. This is not a suggestion — it is the most important rule in this entire article.</p>
            <p className="mt-3">If you have a $5,000 trading account:</p>
            <ul className="mt-2 space-y-1">
              <li>• 1% = $50 maximum risk per trade (conservative — recommended for beginners)</li>
              <li>• 2% = $100 maximum risk per trade (moderate)</li>
              <li>• 5% = $250 maximum risk per trade (aggressive — only for experienced traders)</li>
            </ul>
            <p className="mt-3">Since the maximum loss on a long option is the premium you paid, your position size per trade should not exceed your percentage risk limit. If a contract costs $300 and your 2% limit is $100, do not take the trade — the contract is too expensive relative to your account size.</p>
            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 font-bold text-xs mb-1">Why this rule saves accounts</p>
              <p className="text-xs text-[#9e9e9e] leading-relaxed">Even the best signal engines produce losing trades. If you risk 20% per trade and hit three consecutive losers — which happens — you have lost 60% of your account. Recovering from a 60% drawdown requires a 150% gain. At 2% per trade, three consecutive losses cost you 6% — bad but survivable.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Rule 2: The −50% Hard Stop</h2>
            <p>Every 0DTE trade must have a predetermined exit point for a loss. The standard rule is −50% of your entry premium. If you paid $2.00 per share ($200 per contract), you exit if the contract drops to $1.00.</p>
            <p className="mt-3">This rule feels painful because it means admitting you were wrong. But holding a losing 0DTE contract and hoping for a recovery is one of the most dangerous mistakes in options trading. Here is why:</p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2"><span className="text-[#EF4444] font-bold shrink-0">→</span><span>Theta decay accelerates as the day goes on. A contract that has dropped 50% will decay even faster toward zero in the final hours.</span></li>
              <li className="flex gap-2"><span className="text-[#EF4444] font-bold shrink-0">→</span><span>The stock that went against you is now further from your strike. It needs a larger move to recover than it needed in the first place.</span></li>
              <li className="flex gap-2"><span className="text-[#EF4444] font-bold shrink-0">→</span><span>Holding a loser takes up mental bandwidth and capital that could be deployed in the next setup.</span></li>
            </ul>
            <p className="mt-3">Set the −50% rule before you enter. If your broker supports conditional orders, set a sell order at 50% of your purchase price the moment you open the position. Remove the emotion from the decision.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Rule 3: The +20% Profit Target</h2>
            <p>Hood Option targets a +20% gain on every suggested contract as the standard profit target. This is not arbitrary — it reflects the realistic gain available on a quality ATM 0DTE setup without being greedy.</p>
            <p className="mt-3">Many new traders make the mistake of holding a winning 0DTE too long, watching a +30% gain evaporate back to breakeven as the contract decays. The discipline of taking the first +20% and moving on compounds much better over time than swinging for home runs.</p>
            <div className="mt-4 bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5">
              <p className="text-[#6b6b6b] text-xs uppercase tracking-widest font-semibold mb-3">Math of the 20/50 system over 20 trades (60% win rate)</p>
              <div className="space-y-1 text-xs text-[#9e9e9e]">
                <p>12 winners × +$200 (20% gain on $1,000 risked) = <span className="text-[#00C805] font-bold">+$2,400</span></p>
                <p>8 losers × −$500 (50% loss on $1,000 risked) = <span className="text-[#EF4444] font-bold">−$4,000</span></p>
                <p className="mt-2 text-[#4a4a4a]">Wait — that is still negative. This is why position sizing matters. Now apply 1% rule on a $50,000 account ($500 max per trade):</p>
                <p className="mt-2">12 winners × +$100 (20% of $500) = <span className="text-[#00C805] font-bold">+$1,200</span></p>
                <p>8 losers × −$250 (50% of $500) = <span className="text-[#EF4444] font-bold">−$2,000</span></p>
                <p className="mt-2 text-amber-400 font-semibold">Still negative at 60% win rate with asymmetric stops. You need a higher win rate OR a better reward ratio. Target +30% stops at −30% to improve the math.</p>
              </div>
            </div>
            <p className="mt-4">The honest truth: 0DTE trading with a +20% target and −50% stop requires a win rate above 70% to be profitable. This is achievable with a quality signal system and patient trade selection — but it requires discipline.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Rule 4: Maximum Daily Loss Limit</h2>
            <p>Set a maximum daily loss limit and stop trading when you hit it. A reasonable limit is 3–5% of your trading account. If you hit it, close your platform and do not trade again until the next session.</p>
            <p className="mt-3">Bad trading days happen. The market can be choppy, news can disrupt all setups, or you may simply be off your game. Chasing losses to recover a bad day is one of the fastest paths to blowing up an account. The best traders know when to walk away.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Rule 5: Never Hold Past 3:30 PM ET</h2>
            <p>This rule is non-negotiable. The last 30 minutes of the trading day are the most dangerous for 0DTE options holders because:</p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2"><span className="text-[#EF4444] font-bold">1.</span><span>Theta decay is at its absolute maximum. An ATM contract can lose 20–40% of its value in the final 30 minutes even if the stock barely moves.</span></li>
              <li className="flex gap-2"><span className="text-[#EF4444] font-bold">2.</span><span>Institutional end-of-day positioning can create unpredictable price action that has nothing to do with the signal that got you into the trade.</span></li>
              <li className="flex gap-2"><span className="text-[#EF4444] font-bold">3.</span><span>Spreads widen in the final minutes as market makers price in the uncertainty of the closing auction.</span></li>
            </ul>
            <p className="mt-3">Set a calendar reminder or an alarm. At 3:28 PM ET, close any open 0DTE positions regardless of their profit or loss. No exceptions.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">The Complete Risk Framework Summary</h2>
            <div className="space-y-2">
              {[
                { rule: 'Position size', detail: 'Never risk more than 1–5% of your account on a single trade' },
                { rule: 'Stop loss', detail: 'Exit immediately at −50% of your entry premium' },
                { rule: 'Profit target', detail: 'Take profits at +20% — do not get greedy' },
                { rule: 'Daily loss limit', detail: 'Stop trading for the day when you hit 3–5% account loss' },
                { rule: 'Time cutoff', detail: 'Close all 0DTE positions by 3:30 PM ET, no exceptions' },
                { rule: 'Signal quality', detail: 'Only trade setups with 80%+ confidence and a PRIME designation' },
                { rule: 'Trade frequency', detail: 'Quality over quantity — 1–2 high-conviction trades per day beats 10 mediocre ones' },
              ].map(({ rule, detail }) => (
                <div key={rule} className="flex gap-4 bg-[#151515] border border-[#2a2a2a] rounded-xl px-4 py-3">
                  <p className="font-bold text-[#00C805] shrink-0 w-28 text-xs">{rule}</p>
                  <p className="text-xs text-[#9e9e9e]">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-[#0d1a0d] border border-[#00C805]/30 rounded-2xl p-6 text-center">
              <p className="text-white font-bold mb-2">Apply these rules to live signals</p>
              <p className="text-[#9e9e9e] text-sm mb-4">Hood Option displays confidence scores, signal quality, and profit targets to help you trade with discipline.</p>
              <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors">Open Market Tracker →</Link>
            </div>
          </section>

          <div className="border-t border-[#2a2a2a] pt-6 text-[10px] text-[#3a3a3a] leading-relaxed">
            <p>This article is for educational purposes only and does not constitute financial advice. Options trading involves substantial risk of loss. Always consult a licensed financial professional before trading.</p>
          </div>
        </div>
      </article>

      <footer className="border-t border-[#2a2a2a] bg-[#111111]">
        <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#3a3a3a]">© {new Date().getFullYear()} Hood Option.</p>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
