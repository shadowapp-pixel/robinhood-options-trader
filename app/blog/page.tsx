import Link from 'next/link';

export const metadata = {
  title: 'Options Trading Blog — Hood Option',
  description: 'In-depth articles on 0DTE options trading, technical analysis, risk management, and market strategy for active traders.',
};

const ARTICLES = [
  {
    slug: '0dte-options-trading-guide',
    title: 'What Is 0DTE Options Trading? A Complete Beginner Guide',
    description: 'Zero days to expiration options are the most exciting — and most dangerous — instruments in the market. Learn how they work, why traders use them, and how to approach them responsibly.',
    category: 'Beginner',
    readTime: '8 min read',
    date: 'May 15, 2025',
  },
  {
    slug: 'how-to-read-vwap',
    title: 'How to Use VWAP for Intraday Options Trading',
    description: 'VWAP (Volume-Weighted Average Price) is the single most important intraday benchmark for short-term traders. This guide explains what it is, how it is calculated, and exactly how to use it to time options entries.',
    category: 'Technical Analysis',
    readTime: '7 min read',
    date: 'May 22, 2025',
  },
  {
    slug: 'macd-bollinger-bands-options',
    title: 'MACD and Bollinger Bands: How Indicators Drive Options Signals',
    description: 'Two of the most powerful technical tools — MACD and Bollinger Bands — explained from the ground up. Learn how Hood Option uses them together to filter high-quality setups from noise.',
    category: 'Technical Analysis',
    readTime: '9 min read',
    date: 'May 28, 2025',
  },
  {
    slug: 'risk-management-0dte',
    title: '0DTE Risk Management: The Rules Every Options Trader Needs',
    description: 'Most 0DTE traders lose money — not because they pick the wrong direction, but because they manage risk badly. This guide covers position sizing, stop-losses, profit targets, and the habits that separate consistent traders from gamblers.',
    category: 'Risk Management',
    readTime: '10 min read',
    date: 'June 3, 2025',
  },
  {
    slug: 'spy-qqq-options-strategy',
    title: 'Trading SPY and QQQ Options: The Most Liquid 0DTE Market',
    description: 'SPY and QQQ are the most actively traded options in the world. Learn why these ETFs are ideal for 0DTE trading, how to read their unique signal behavior, and the specific setups that work best on index ETFs.',
    category: 'Strategy',
    readTime: '8 min read',
    date: 'June 10, 2025',
  },
  {
    slug: 'understanding-options-greeks',
    title: 'Options Greeks Explained: Delta, Theta, and Vega for 0DTE Traders',
    description: 'Delta, theta, and vega are the three Greeks that matter most for 0DTE options. Understanding them will completely change how you evaluate contracts, estimate profit targets, and manage risk in real time.',
    category: 'Education',
    readTime: '11 min read',
    date: 'June 17, 2025',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Beginner': 'bg-[#00C805]/10 text-[#00C805] border-[#00C805]/30',
  'Technical Analysis': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Risk Management': 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
  'Strategy': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Education': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export default function BlogPage() {
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
          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/#features" className="text-sm text-[#9e9e9e] hover:text-white transition-colors">Features</Link>
            <Link href="/learn" className="text-sm text-[#9e9e9e] hover:text-white transition-colors">Learn</Link>
            <Link href="/blog" className="text-sm text-white font-semibold">Blog</Link>
            <Link href="/about" className="text-sm text-[#9e9e9e] hover:text-white transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-[#9e9e9e] hover:text-white transition-colors">Sign in</Link>
            <Link href="/pricing" className="px-4 py-2 bg-[#00C805] hover:bg-[#00a004] text-black text-xs font-bold rounded-xl transition-colors">Get Pro</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-14">
          <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">Options Trading Blog</p>
          <h1 className="text-4xl font-black tracking-tight mb-4">Learn to trade smarter</h1>
          <p className="text-[#9e9e9e] text-lg max-w-2xl">
            In-depth guides on 0DTE options strategy, technical analysis, risk management, and how to get the most from Hood Option signals.
          </p>
        </div>

        {/* Articles grid */}
        <div className="space-y-6">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest uppercase ${CATEGORY_COLORS[article.category]}`}>
                      {article.category}
                    </span>
                    <span className="text-[#4a4a4a] text-xs">{article.readTime}</span>
                    <span className="text-[#4a4a4a] text-xs">·</span>
                    <span className="text-[#4a4a4a] text-xs">{article.date}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2 group-hover:text-[#00C805] transition-colors leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-sm text-[#9e9e9e] leading-relaxed">
                    {article.description}
                  </p>
                </div>
                <div className="shrink-0 text-[#3a3a3a] group-hover:text-[#00C805] transition-colors text-xl mt-1">→</div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-[#0d1a0d] border border-[#00C805]/30 rounded-2xl px-8 py-10 text-center">
          <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">Ready to Put It Into Practice?</p>
          <h2 className="text-2xl font-black mb-3">See live signals on the Market Tracker</h2>
          <p className="text-[#9e9e9e] text-sm max-w-md mx-auto mb-7">
            Everything you learn here is applied in real time on the Hood Option dashboard — free, no account required.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-[#00C805] hover:bg-[#00a004] text-black text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,200,5,0.25)]"
          >
            Open Market Tracker →
          </Link>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#111111] mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#3a3a3a]">© {new Date().getFullYear()} Hood Option. All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/about" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">About</Link>
            <Link href="/blog" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Blog</Link>
            <Link href="/learn" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Learn</Link>
            <Link href="/privacy" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-[#6b6b6b] hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
