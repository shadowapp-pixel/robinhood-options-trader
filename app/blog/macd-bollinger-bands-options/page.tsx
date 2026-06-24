import Link from 'next/link';

export const metadata = {
  title: 'MACD and Bollinger Bands: How Indicators Drive Options Signals — Hood Option',
  description: 'MACD and Bollinger Bands explained from the ground up. Learn how Hood Option uses them together to filter high-quality setups from noise.',
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
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest uppercase bg-blue-500/10 text-blue-400 border-blue-500/30">Technical Analysis</span>
            <span className="text-[#4a4a4a] text-xs">9 min read · May 28, 2025</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-tight mb-4">MACD and Bollinger Bands: How Indicators Drive Options Signals</h1>
          <p className="text-[#9e9e9e] text-lg leading-relaxed">MACD and Bollinger Bands are two of the most widely used technical indicators in the world. Used together, they provide a powerful filter for separating genuine momentum from choppy noise — which is exactly how Hood Option uses them.</p>
        </div>

        <div className="space-y-8 text-[#c4c4c4] text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-white mb-3">Part 1 — MACD: Measuring Momentum</h2>
            <p>MACD stands for Moving Average Convergence Divergence. Despite the complicated name, the concept is straightforward: it measures the relationship between two exponential moving averages (EMAs) of the closing price to detect changes in momentum.</p>

            <h3 className="text-base font-bold text-white mt-5 mb-2">The Three Components</h3>
            <div className="space-y-3">
              {[
                { name: 'MACD Line', formula: 'EMA(12) − EMA(26)', desc: 'The difference between the 12-period and 26-period exponential moving averages. When short-term momentum is stronger than long-term momentum, this line is positive. When long-term momentum dominates, it is negative.' },
                { name: 'Signal Line', formula: 'EMA(9) of MACD Line', desc: 'A 9-period EMA of the MACD line itself. It smooths the MACD line and acts as a trigger for crossover signals.' },
                { name: 'Histogram', formula: 'MACD Line − Signal Line', desc: 'The bar chart displayed below the MACD line. When positive and growing, momentum is accelerating upward. When negative and shrinking, downward momentum may be exhausting.' },
              ].map(({ name, formula, desc }) => (
                <div key={name} className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-bold text-white">{name}</p>
                    <span className="font-mono text-xs text-[#00C805] bg-[#00C805]/10 px-2 py-0.5 rounded border border-[#00C805]/20">{formula}</span>
                  </div>
                  <p className="text-xs text-[#9e9e9e] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">How Hood Option Uses MACD</h2>
            <p>Hood Option checks two MACD conditions on the daily chart (12/26/9 standard settings):</p>
            <div className="mt-4 space-y-3">
              <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-xl p-4">
                <p className="text-[#00C805] font-bold mb-1">Bullish MACD: CALL direction</p>
                <ul className="text-xs text-[#9e9e9e] space-y-1">
                  <li>• MACD Line is above the Signal Line (bullish crossover)</li>
                  <li>• The spread between them is at least 0.1% of the stock price (filters out weak, insignificant crossovers)</li>
                  <li>• The histogram is expanding — momentum is accelerating, not decelerating</li>
                </ul>
              </div>
              <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-4">
                <p className="text-[#EF4444] font-bold mb-1">Bearish MACD: PUT direction</p>
                <ul className="text-xs text-[#9e9e9e] space-y-1">
                  <li>• MACD Line is below the Signal Line (bearish crossover)</li>
                  <li>• The spread is at least 0.1% of price (same filter)</li>
                  <li>• The histogram is expanding negatively — downward momentum is increasing</li>
                </ul>
              </div>
            </div>
            <p className="mt-3">The 0.1% minimum spread filter is crucial. Without it, MACD generates constant false signals when the two lines are almost on top of each other. Hood Option only acts when the crossover has real conviction behind it.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Part 2 — Bollinger Bands: Measuring Volatility</h2>
            <p>Bollinger Bands were developed by John Bollinger in the 1980s. They consist of three lines plotted around price:</p>
            <div className="mt-4 bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5 space-y-3">
              <div><p className="font-mono text-sm text-white">Middle Band = 20-period Simple Moving Average (SMA)</p><p className="text-xs text-[#6b6b6b] mt-0.5">The baseline — the average closing price over the last 20 periods.</p></div>
              <div><p className="font-mono text-sm text-white">Upper Band = SMA + (2 × Standard Deviation)</p><p className="text-xs text-[#6b6b6b] mt-0.5">Two standard deviations above the mean. Price touching here is statistically &quot;high.&quot;</p></div>
              <div><p className="font-mono text-sm text-white">Lower Band = SMA − (2 × Standard Deviation)</p><p className="text-xs text-[#6b6b6b] mt-0.5">Two standard deviations below the mean. Price touching here is statistically &quot;low.&quot;</p></div>
            </div>
            <p className="mt-4">Statistically, approximately 95% of price action falls within the two standard deviation bands. When price is near the upper band, it is extended relative to recent history. When near the lower band, it is compressed.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">The %B Indicator</h2>
            <p>Hood Option uses a derived metric called %B, which tells you exactly where price sits within the Bollinger Bands on a 0–100 scale:</p>
            <div className="mt-3 bg-[#151515] border border-[#2a2a2a] rounded-2xl p-5">
              <p className="font-mono text-sm text-white mb-3">%B = (Price − Lower Band) ÷ (Upper Band − Lower Band) × 100</p>
              <div className="space-y-2">
                {[
                  { val: '%B > 80', meaning: 'Price is near the upper band — extended, potential reversal zone for PUTs', color: 'text-[#EF4444]' },
                  { val: '%B 50–80', meaning: 'Price is in the upper half of the bands — bullish territory', color: 'text-[#00C805]' },
                  { val: '%B 20–50', meaning: 'Price is in the lower half of the bands — bearish territory', color: 'text-[#EF4444]' },
                  { val: '%B < 20', meaning: 'Price is near the lower band — extended downside, potential bounce zone for CALLs', color: 'text-[#00C805]' },
                ].map(({ val, meaning, color }) => (
                  <div key={val} className="flex gap-3 text-xs">
                    <span className={`font-mono font-bold shrink-0 ${color}`}>{val}</span>
                    <span className="text-[#9e9e9e]">{meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">The Squeeze — When Bands Compress</h2>
            <p>One of the most powerful Bollinger Band signals is the &quot;squeeze&quot; — when the upper and lower bands move very close together. A squeeze indicates that volatility has compressed and a large move is coming. The direction of the breakout from a squeeze is the trade.</p>
            <p className="mt-3">Hood Option uses a <span className="text-white font-semibold">bandwidth ≥ 4% filter</span> to avoid acting on signals during a squeeze. Bandwidth is calculated as:</p>
            <div className="mt-3 bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
              <p className="font-mono text-sm text-white">Bandwidth = (Upper Band − Lower Band) ÷ Middle Band × 100</p>
              <p className="text-xs text-[#6b6b6b] mt-2">When bandwidth is below 4%, the bands are too tight to provide reliable directional information. The signal engine skips the Bollinger Band check in this scenario.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">MACD + Bollinger Bands Together: The Combined Signal</h2>
            <p>Neither MACD nor Bollinger Bands alone is sufficient for a high-quality signal. Together, they form a much stronger confirmation:</p>
            <div className="mt-4 space-y-3">
              <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-2xl p-5">
                <p className="text-[#00C805] font-bold mb-3">Strong CALL confirmation</p>
                <ul className="space-y-1 text-xs text-[#9e9e9e]">
                  <li>✓ MACD Line above Signal Line with expanding histogram</li>
                  <li>✓ %B between 50 and 80 (bullish but not extended)</li>
                  <li>✓ Bandwidth above 4% (no squeeze — volatility is normal)</li>
                </ul>
                <p className="text-xs text-[#6b6b6b] mt-3">This means: daily momentum is bullish AND price is positioned in the upper half of its recent range without being dangerously extended. A strong setup for CALLs.</p>
              </div>
              <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-2xl p-5">
                <p className="text-[#EF4444] font-bold mb-3">Strong PUT confirmation</p>
                <ul className="space-y-1 text-xs text-[#9e9e9e]">
                  <li>✓ MACD Line below Signal Line with expanding negative histogram</li>
                  <li>✓ %B between 20 and 50 (bearish but not oversold)</li>
                  <li>✓ Bandwidth above 4% (no squeeze)</li>
                </ul>
                <p className="text-xs text-[#6b6b6b] mt-3">This means: daily momentum is bearish AND price is in the lower half of its recent range. A strong setup for PUTs.</p>
              </div>
            </div>
            <p className="mt-4">This combined daily technical check contributes 25% to the overall Hood Option confidence score, sitting alongside 50% intraday conditions and 25% chart pattern detection. A ticker that scores well on all three tiers is a genuinely high-conviction setup.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">Key Takeaways</h2>
            <div className="space-y-2">
              {[
                'MACD measures momentum shifts between short-term and long-term moving averages.',
                'The 0.1% minimum MACD spread filter eliminates weak, noise-driven crossovers.',
                'Bollinger Bands measure where price sits within its recent volatility range.',
                'The %B indicator gives a precise 0–100 reading of where price sits in the bands.',
                'The 4% bandwidth filter prevents acting on squeeze conditions.',
                'Together, these two indicators add a significant daily technical confirmation layer on top of intraday VWAP analysis.',
              ].map((point, i) => (
                <div key={i} className="flex gap-3 bg-[#151515] border border-[#2a2a2a] rounded-xl px-4 py-2.5">
                  <span className="text-[#00C805] font-bold shrink-0">✓</span>
                  <p className="text-sm text-[#c4c4c4]">{point}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-[#0d1a0d] border border-[#00C805]/30 rounded-2xl p-6 text-center">
              <p className="text-white font-bold mb-2">See these indicators in action</p>
              <p className="text-[#9e9e9e] text-sm mb-4">The Trade Search panel shows MACD and Bollinger Band readings for any ticker you analyze.</p>
              <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors">Open Trade Search →</Link>
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
