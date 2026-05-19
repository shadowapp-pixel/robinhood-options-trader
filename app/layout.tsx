import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/context/ThemeContext';
import Script from 'next/script';
import './globals.css';

// ── Replace with your real AdSense publisher ID once approved ─────────────
const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hood Option',
  description: 'Live 0DTE options signals and trade setups for active traders. Not affiliated with Robinhood Markets, Inc.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {/* Google AdSense — loads asynchronously, does not block rendering */}
          {ADSENSE_PUBLISHER_ID !== 'ca-pub-XXXXXXXXXXXXXXXX' && (
            <Script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          )}
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
