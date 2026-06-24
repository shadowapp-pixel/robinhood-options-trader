import Link from 'next/link';

export const metadata = {
  title: 'Options Greeks Explained: Delta, Theta, and Vega for 0DTE Traders — Hood Option',
  description: 'Delta, theta, and vega are the three Greeks that matter most for 0DTE options. Understanding them will change how you evaluate contracts and manage risk.',
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
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest uppercase bg-amber-500/10 text-amber-400 border-amber-500/30">Education</span>
            <span className="text-[#4a4a4a] text-xs">11 min read · June 17, 2025</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-tight mb-4">Options Greeks Explained: Delta, Theta, and Vega for 0DTE Traders</h1>
          <p className="text-[#9e9e9e] text-lg leading-relaxed">The Greeks are not optional knowledge for options traders — they are the language the market speaks. Understanding delta, theta, and vega will completely change how you evaluate a contract before you buy it.</p>
        </div>

        <div className="space-y-8 text-[#c4c4c4] text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-white mb-3">What Are the Greeks?</h2>
            <p>Options Greeks are sensitivity measures that describe how an option&apos;s price changes in response to different variables — stock price movement, time, volatility, and interest rates. There are five main Greeks (delta, gamma, theta, vega, rho), but for 0DTE traders, three dominate everything: delta, theta, and vega.</p>
            <p className="mt-3">Think of the Greeks as the controls on a mixing board. Delta controls how much the option moves with the stock. Theta controls how fast the option loses value over time. Vega controls how sensitive the option is to changes in market volatility. On a 0DTE contract, all three are dialed to extremes.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Delta — How Much Your Option Moves</h2>
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5 mb-4">
              <p className="text-[#6b6b6b] text-xs uppercase tracking-widest font-semibold mb-2">Definition</p>
              <p className="text-white font-bold">Delta = change in option price per $1 move in the stock</p>
              <p className="text-xs text-[#6b6b6b] mt-1">Range: 0 to 1.0 for calls, 0 to −1.0 for puts</p>
            </div>
            <p>If a CALL option has a delta of 0.50, it means for every $1 the stock moves up, the option gains approximately $0.50 in value (per share, so $50 per contract). If the stock drops $1, the option loses $0.50.</p>
            <p className="mt-3">Delta is also a rough probability estimate. A delta of 0.50 means the market is pricing in approximately a 50% chance the option expires in-the-money. A delta of 0.80 suggests an 80% probability.</p>

            <h3 className="text-base font-bold text-white mt-5 mb-3">Delta by Moneyness</h3>
            <div className="space-y-2">
              {[
                { type: 'Deep ITM Call', delta: '~0.90', meaning: 'Moves almost like owning the stock. Expensive, but very high probability.' },
                { type: 'ATM Call (Hood Option target)', delta: '~0.50', meaning: 'Best balance of leverage and probability. Gains $50 per $1 stock move per contract.' },
                { type: 'OTM Call', delta: '~0.20', meaning: 'Cheap but requires a large stock move to become profitable. High risk of expiring worthless.' },
                { type: 'ATM Put', delta: '~−0.50', meaning: 'Same as ATM call but for downside exposure. Loses $50 per $1 stock rise per contract.' },
              ].map(({ type, delta, meaning }) => (
                <div key={type} className="flex gap-4 bg-[#151515] border border-[#2a2a2a] rounded-xl px-4 py-3">
                  <div className="shrink-0 w-40">
                    <p className="text-xs font-semibold text-white">{type}</p>
                    <p className="text-[#00C805] font-mono font-bold text-sm">{delta}</p>
                  </div>
                  <p className="text-xs text-[#9e9e9e] leading-relaxed">{meaning}</p>
                </div>
              ))}
            </div>

            <h3 className="text-base font-bold text-white mt-5 mb-2">Gamma — Delta in Motion</h3>
            <p>Gamma measures how fast delta changes as the stock price moves. ATM 0DTE options have extremely high gamma — which means delta can change dramatically with small stock moves. This is what creates the explosive gains (and losses) in 0DTE trading. A contract that starts at 0.50 delta can quickly move to 0.80 or 0.20 as the stock moves just a few dollars.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Theta — The Silent Killer</h2>
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-2xl p-5 mb-4">
              <p className="text-[#EF4444] font-bold mb-1">Definition</p>
              <p className="text-white font-bold">Theta = daily dollar loss in option value from time decay</p>
              <p className="text-xs text-[#6b6b6b] mt-1">Always negative for option buyers. Measured per day.</p>
            </div>
            <p>Every option loses value each day simply because there is less time remaining for the stock to move in your favor. This erosion is called theta decay, and it is the single biggest reason most options expire worthless.</p>
            <p className="mt-3">On a 0DTE contract, theta is catastrophic compared to longer-dated options. Here is why: an option with 30 days to expiration might lose $5 per day to theta. The same option with 1 day to expiration might lose $100 per day — and that $100 decay is concentrated into a single 6.5-hour trading session.</p>

            <h3 className="text-base font-bold text-white mt-5 mb-3">How Theta Accelerates Throughout the Day</h3>
            <div className="space-y-2">
              {[
                { time: '9:30 AM', theta: 'Low-moderate', note: 'Full day remaining. Theta is spread across 6.5 hours. Option still has significant time value.' },
                { time: '11:00 AM', theta: 'Moderate', note: 'About 5 hours remain. ATM option has lost perhaps 15–20% of its morning time value to decay.' },
                { time: '1:00 PM', theta: 'Accelerating', note: '3 hours remain. Decay has visibly accelerated. Out-of-the-money contracts are losing value fast.' },
                { time: '2:30 PM', theta: 'High', note: '90 minutes remain. An out-of-the-money contract that was $1.00 in the morning may now be $0.20.' },
                { time: '3:30 PM', theta: 'Extreme', note: '30 minutes remain. Theta is at its maximum rate of decay. Any contract not deep in-the-money is approaching zero.' },
              ].map(({ time, theta, note }) => (
                <div key={time} className="flex gap-4 bg-[#151515] border border-[#2a2a2a] rounded-xl px-4 py-3">
                  <div className="shrink-0 w-20">
                    <p className="font-mono text-xs font-bold text-white">{time}</p>
                    <p className="text-[10px] text-[#EF4444]">{theta}</p>
                  </div>
                  <p className="text-xs text-[#9e9e9e] leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">This is the fundamental reason for the 3:30 PM exit rule. In the final 30 minutes, theta is consuming option premium at its maximum rate. The risk/reward of holding through that window is almost never favorable for the buyer.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Vega — Volatility&apos;s Impact on Your Option</h2>
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5 mb-4">
              <p className="text-[#6b6b6b] text-xs uppercase tracking-widest font-semibold mb-2">Definition</p>
              <p className="text-white font-bold">Vega = change in option price per 1% change in implied volatility</p>
              <p className="text-xs text-[#6b6b6b] mt-1">Higher vega = more sensitive to volatility changes</p>
            </div>
            <p>Implied volatility (IV) is the market&apos;s expectation of how much the stock will move over the option&apos;s remaining life. When IV rises, options become more expensive (more uncertainty = more premium). When IV falls, options become cheaper.</p>
            <p className="mt-3">For 0DTE traders, vega is particularly relevant in two scenarios:</p>
            <div className="mt-3 space-y-3">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <p className="text-amber-400 font-bold text-xs mb-1">IV Crush — the hidden cost</p>
                <p className="text-xs text-[#9e9e9e] leading-relaxed">If you buy a 0DTE option when implied volatility is elevated (e.g., before a major economic report), and the report is released with no surprise, IV can collapse immediately afterward even if the stock moves in your direction. This &quot;IV crush&quot; can actually cause your option to lose value even when you were right about direction. Always check if you are entering around a major data event.</p>
              </div>
              <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-xl p-4">
                <p className="text-[#00C805] font-bold text-xs mb-1">Volatility expansion — a tailwind</p>
                <p className="text-xs text-[#9e9e9e] leading-relaxed">When unexpected news hits and volatility spikes, all options become more expensive — even if the stock has not moved much yet. If you entered a position before the volatility spike, your contract benefits from both directional movement AND the volatility expansion. These are some of the most profitable 0DTE situations available.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Applying the Greeks to Real 0DTE Trades</h2>
            <p>Here is how to think about the Greeks together when evaluating a 0DTE setup:</p>
            <div className="mt-4 bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5">
              <p className="text-[#6b6b6b] text-xs uppercase tracking-widest font-semibold mb-4">Example: SPY ATM CALL at 10:00 AM</p>
              <div className="space-y-3 text-xs">
                <div className="flex gap-4 pb-3 border-b border-[#2a2a2a]">
                  <span className="text-[#00C805] font-bold w-16 shrink-0">Delta: 0.52</span>
                  <span className="text-[#9e9e9e]">For every $1 SPY moves up, this contract gains ~$52. A $2 move produces ~$104 gain per contract.</span>
                </div>
                <div className="flex gap-4 pb-3 border-b border-[#2a2a2a]">
                  <span className="text-[#EF4444] font-bold w-16 shrink-0">Theta: −$45</span>
                  <span className="text-[#9e9e9e]">If SPY does not move at all, this contract loses approximately $45 per hour to time decay. Across the remaining 5.5 hours, that is $247 in pure decay — which means SPY must move in your favor just to stay profitable.</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-amber-400 font-bold w-16 shrink-0">Vega: $12</span>
                  <span className="text-[#9e9e9e]">If implied volatility rises 1%, the contract gains $12. If IV falls 1% (common after a data release), the contract loses $12 even if SPY moves favorably.</span>
                </div>
              </div>
            </div>
            <p className="mt-4">Reading these numbers together: you need SPY to move meaningfully in your direction before theta eats your premium. The sooner you are in a winning position, the better — which is why entering close to VWAP (as Hood Option signals require) gives you better odds than chasing an extended move.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Key Takeaways for 0DTE Greek Awareness</h2>
            <div className="space-y-2">
              {[
                'ATM strikes have ~0.50 delta — this is the target for balanced leverage and probability.',
                'Theta on 0DTE contracts is severe — every hour that passes without a favorable stock move is working against you.',
                'Never hold a 0DTE contract past 3:30 PM — theta in the final 30 minutes is destructive.',
                'Be aware of IV levels before entering — buying into a volatility spike risks IV crush.',
                'High gamma on 0DTE contracts means delta changes fast — a winning trade can flip to a loser quickly if the stock reverses.',
              ].map((point, i) => (
                <div key={i} className="flex gap-3 bg-[#151515] border border-[#2a2a2a] rounded-xl px-4 py-2.5">
                  <span className="text-[#00C805] font-bold shrink-0">✓</span>
                  <p className="text-xs text-[#c4c4c4]">{point}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-[#0d1a0d] border border-[#00C805]/30 rounded-2xl p-6 text-center">
              <p className="text-white font-bold mb-2">See real options pricing in action</p>
              <p className="text-[#9e9e9e] text-sm mb-4">Hood Option&apos;s Trade Search shows live ATM premiums and contract costs so you can apply what you learned here.</p>
              <Link href="/pricing" className="inline-block px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors">Unlock Trade Search →</Link>
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
