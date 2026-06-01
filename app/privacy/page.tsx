import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Hood Option',
  description: 'How Hood Option collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-black tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-[#6b6b6b] text-sm">Last updated: {updated}</p>
        </div>

        <p className="text-[#9e9e9e] text-sm leading-relaxed">
          Hood Option (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website hoodoption.com (the &quot;Service&quot;). This Privacy Policy explains what information we collect, how we use it, and your rights with respect to it. By using the Service you agree to the practices described in this policy.
        </p>

        {[
          {
            title: '1. Information We Collect',
            body: [
              {
                sub: 'Account Information',
                text: 'When you create an account we collect your email address and, optionally, your name. Authentication is handled by Clerk (clerk.com). We do not store your password — Clerk manages credentials on our behalf.',
              },
              {
                sub: 'Payment Information',
                text: 'Pro subscription payments are processed by Stripe (stripe.com). Hood Option never receives or stores your full card number. Stripe provides us with a non-sensitive token and basic billing details (last 4 digits, card brand, expiry month/year).',
              },
              {
                sub: 'Usage Data',
                text: 'We automatically collect information your browser sends: IP address, browser type and version, pages visited, time and date of your visit, and time spent on each page. This data is used solely for service improvement and is not sold.',
              },
              {
                sub: 'Watchlist & Preferences',
                text: 'If you are a Pro subscriber, the tickers you add to your Favorites Watchlist and any app preferences are stored in our database (Upstash Redis) so they persist across sessions and devices.',
              },
            ],
          },
          {
            title: '2. Cookies and Tracking Technologies',
            body: [
              {
                sub: 'Essential Cookies',
                text: 'We use cookies to maintain your authenticated session. These are strictly necessary for the Service to function and cannot be disabled.',
              },
              {
                sub: 'Google AdSense',
                text: 'We display advertisements served by Google AdSense. Google may use cookies, web beacons, and similar technologies to serve personalised ads based on your prior visits to our site and other websites. You can opt out of personalised advertising by visiting https://www.google.com/settings/ads or by using the NAI opt-out tool at https://optout.networkadvertising.org. Google\'s use of advertising cookies is governed by Google\'s Privacy Policy at https://policies.google.com/privacy.',
              },
              {
                sub: 'Analytics',
                text: 'We may use aggregated, anonymised analytics to understand which features are most used. No personally identifiable information is shared with analytics providers.',
              },
            ],
          },
          {
            title: '3. How We Use Your Information',
            body: [
              { sub: 'Provide and improve the Service', text: 'To authenticate you, process payments, deliver live market signals, and personalise your dashboard.' },
              { sub: 'Communications', text: 'To send transactional emails (account confirmation, payment receipts). We do not send marketing emails unless you explicitly opt in.' },
              { sub: 'Legal compliance', text: 'To comply with applicable laws and regulations and to enforce our Terms of Service.' },
            ],
          },
          {
            title: '4. How We Share Your Information',
            body: [
              { sub: 'Service providers', text: 'We share data with Clerk (auth), Stripe (payments), Upstash (data storage), Vercel (hosting), Finnhub (market data), and Google (advertising). Each provider is contractually obligated to protect your data.' },
              { sub: 'Legal requirements', text: 'We may disclose your information if required by law or in response to a valid legal request from a government authority.' },
              { sub: 'No sale of data', text: 'We do not sell, trade, or rent your personal information to third parties.' },
            ],
          },
          {
            title: '5. Data Retention',
            body: [
              { sub: '', text: 'Account data is retained for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law or for fraud prevention. Market signal cache data (Redis) is ephemeral and automatically expires within seconds to hours.' },
            ],
          },
          {
            title: '6. Your Rights',
            body: [
              { sub: 'Access & portability', text: 'You may request a copy of the personal data we hold about you.' },
              { sub: 'Correction', text: 'You may update your account information at any time through your account settings.' },
              { sub: 'Deletion', text: 'You may request deletion of your account and associated personal data by emailing us at the address below.' },
              { sub: 'Opt-out of personalised ads', text: 'See Section 2 (Google AdSense) for ad opt-out options.' },
              { sub: 'California residents (CCPA)', text: 'California residents have the right to know what personal information we collect, the right to delete it, and the right to opt out of its sale. We do not sell personal information.' },
              { sub: 'EU/UK residents (GDPR)', text: 'Where GDPR applies, our legal basis for processing your data is contract performance (account and payment), legitimate interests (service improvement and security), and consent (personalised advertising).' },
            ],
          },
          {
            title: '7. Security',
            body: [
              { sub: '', text: 'We use industry-standard security measures including HTTPS encryption, secure third-party authentication, and access controls to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.' },
            ],
          },
          {
            title: '8. Children\'s Privacy',
            body: [
              { sub: '', text: 'Hood Option is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.' },
            ],
          },
          {
            title: '9. Third-Party Links',
            body: [
              { sub: '', text: 'The Service may contain links to third-party websites (e.g., brokerage affiliate links). We are not responsible for the privacy practices or content of those sites. We encourage you to review their privacy policies.' },
            ],
          },
          {
            title: '10. Changes to This Policy',
            body: [
              { sub: '', text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy.' },
            ],
          },
          {
            title: '11. Contact Us',
            body: [
              { sub: '', text: 'If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at: support@hoodoption.com' },
            ],
          },
        ].map(({ title, body }) => (
          <section key={title} className="bg-[#151515] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <div className="space-y-3">
              {body.map(({ sub, text }) => (
                <div key={sub || text.slice(0, 30)}>
                  {sub && <p className="text-sm font-semibold text-[#c4c4c4] mb-1">{sub}</p>}
                  <p className="text-sm text-[#9e9e9e] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
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
