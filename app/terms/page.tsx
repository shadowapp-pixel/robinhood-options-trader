import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Hood Option',
  description: 'Terms and conditions governing your use of Hood Option.',
};

export default function TermsPage() {
  const updated = 'June 1, 2025';

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
          <Link href="/" className="text-xs text-[#9e9e9e] hover:text-white transition-colors">← Back to Home</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div>
          <p className="text-[#00C805] text-xs font-bold tracking-widest uppercase mb-3">Legal</p>
          <h1 className="text-4xl font-black tracking-tight mb-3">Terms of Service</h1>
          <p className="text-[#6b6b6b] text-sm">Last updated: {updated}</p>
        </div>

        <p className="text-[#9e9e9e] text-sm leading-relaxed">
          Please read these Terms of Service (&quot;Terms&quot;) carefully before using hoodoption.com (the &quot;Service&quot;) operated by Hood Option (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using the Service you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        {[
          {
            title: '1. Description of Service',
            paras: [
              'Hood Option is a web application that provides algorithmically generated options trading signals, market data displays, and educational content for informational purposes only. The Service does not execute trades, manage money, or provide personalised investment advice.',
              'Features available without an account: Market Tracker (live signals for 10 tickers). Features requiring a Pro subscription: Trade Search, AI Analysis, Favorites Watchlist, Contract Tracker, and alerts.',
            ],
          },
          {
            title: '2. Not Financial Advice',
            paras: [
              'ALL CONTENT ON THIS PLATFORM — including signals, confidence scores, trade setups, AI analysis, estimated time to target, and educational material — IS PROVIDED FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY. NOTHING ON HOOD OPTION CONSTITUTES FINANCIAL ADVICE, INVESTMENT ADVICE, TRADING ADVICE, OR ANY OTHER TYPE OF PROFESSIONAL ADVICE.',
              'Hood Option is not a registered investment adviser, broker-dealer, financial planner, or commodity trading adviser under any applicable law. We do not recommend that any specific security, portfolio of securities, transaction, or investment strategy is suitable for any specific person.',
              'Options trading involves substantial risk of loss, including the risk of losing your entire investment. 0DTE (zero days to expiration) options are highly speculative. Past signal performance is not indicative of future results. You are solely responsible for your own investment decisions.',
            ],
          },
          {
            title: '3. Eligibility',
            paras: [
              'You must be at least 18 years old to use the Service. By using the Service you represent that you are 18 or older and that you have the legal capacity to enter into these Terms.',
            ],
          },
          {
            title: '4. Accounts',
            paras: [
              'To access Pro features you must create an account and provide accurate, complete information. You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorised use of your account.',
              'We reserve the right to terminate accounts that violate these Terms, are suspected of fraudulent activity, or remain inactive for an extended period.',
            ],
          },
          {
            title: '5. Subscriptions and Payments',
            paras: [
              'Pro features are available via a monthly subscription billed through Stripe. Prices are listed on the Pricing page and may change upon 30 days\' notice.',
              'Subscriptions renew automatically each billing period. You may cancel at any time through your account settings; cancellation takes effect at the end of the current billing period and you retain access until then.',
              'All fees are non-refundable except where required by applicable law or at our sole discretion in exceptional circumstances.',
            ],
          },
          {
            title: '6. Acceptable Use',
            paras: [
              'You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-engineer, scrape, or systematically extract data from the Service; (c) redistribute, resell, or republish signals or content from the Service without written permission; (d) interfere with or disrupt the Service or its infrastructure; (e) use automated tools (bots, scrapers) to access the Service; (f) attempt to gain unauthorised access to any part of the Service.',
            ],
          },
          {
            title: '7. Market Data and Third-Party Sources',
            paras: [
              'Market data is sourced from Finnhub and Tradier (sandbox/delayed data). Hood Option makes no representation that data is accurate, complete, or timely. Market data is provided solely for informational purposes and should not be relied upon for trading decisions without independent verification.',
              'Options pricing from Tradier is sandbox/15-minute-delayed data. Actual market prices may differ materially.',
            ],
          },
          {
            title: '8. Advertising',
            paras: [
              'The Service displays advertisements served by Google AdSense. We are not responsible for the content of third-party advertisements. Advertisement placement does not constitute an endorsement of the advertised product or service.',
            ],
          },
          {
            title: '9. Affiliate Disclosure',
            paras: [
              'The Service may contain affiliate links (e.g., brokerage referral links). If you click an affiliate link and sign up for a product or service, we may receive compensation. This does not affect the price you pay and does not influence our signal generation.',
            ],
          },
          {
            title: '10. Intellectual Property',
            paras: [
              'All content, design, code, signals, algorithms, and branding on the Service are the property of Hood Option and are protected by copyright and other intellectual property laws. You may not copy, reproduce, modify, or distribute any part of the Service without our prior written consent.',
            ],
          },
          {
            title: '11. Disclaimer of Warranties',
            paras: [
              'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, HOOD OPTION DISCLAIMS ALL WARRANTIES INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
              'WE DO NOT WARRANT THAT (a) THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE; (b) SIGNALS WILL BE ACCURATE OR PROFITABLE; (c) ANY DEFECTS WILL BE CORRECTED; OR (d) THE SERVICE IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.',
            ],
          },
          {
            title: '12. Limitation of Liability',
            paras: [
              'TO THE MAXIMUM EXTENT PERMITTED BY LAW, HOOD OPTION SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, TRADING LOSSES, LOSS OF DATA, OR GOODWILL — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
              'OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100 USD, WHICHEVER IS GREATER.',
            ],
          },
          {
            title: '13. Indemnification',
            paras: [
              'You agree to indemnify and hold Hood Option, its owners, employees, and agents harmless from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.',
            ],
          },
          {
            title: '14. Modifications to the Service and Terms',
            paras: [
              'We reserve the right to modify or discontinue the Service (or any part of it) at any time without notice. We may update these Terms at any time. Material changes will be communicated by updating the "Last updated" date at the top of this page. Your continued use of the Service after changes take effect constitutes acceptance of the new Terms.',
            ],
          },
          {
            title: '15. Governing Law',
            paras: [
              'These Terms are governed by and construed in accordance with the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive or other equitable relief in a court of competent jurisdiction.',
            ],
          },
          {
            title: '16. Severability',
            paras: [
              'If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.',
            ],
          },
          {
            title: '17. Contact',
            paras: [
              'Questions about these Terms? Contact us at support@hoodoption.com.',
            ],
          },
        ].map(({ title, paras }) => (
          <section key={title} className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">{title}</h2>
            {paras.map((p, i) => (
              <p key={i} className="text-sm text-[#9e9e9e] leading-relaxed">{p}</p>
            ))}
          </section>
        ))}

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
