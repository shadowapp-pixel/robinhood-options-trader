'use client';

/**
 * AdBanner — Google AdSense display ad unit.
 *
 * Setup:
 *  1. Apply at https://adsense.google.com and get approved (~1–2 weeks for new sites).
 *  2. Replace ADSENSE_PUBLISHER_ID below with your real ca-pub-XXXXXXXXXXXXXXXX id.
 *  3. Create ad units in AdSense → Ads → By ad unit, paste each slot id into the
 *     SLOT_IDS map below (or pass a custom slotId prop per placement).
 *  4. The AdSense <script> tag is already injected in app/layout.tsx.
 *
 * Variants:
 *   size="leaderboard"  728×90  — good for between page sections (desktop)
 *   size="banner"       320×50  — good for between sections on mobile
 *   size="rectangle"   300×250 — good for sidebars and paywall cards
 *   size="responsive"           — lets AdSense pick the best size automatically (recommended)
 */

import { useEffect, useRef } from 'react';

// ── Configuration — update these with your real values ──────────────────────
const ADSENSE_PUBLISHER_ID = 'ca-pub-4228062057434580';

// Create one ad unit per placement in your AdSense dashboard and paste the slot IDs here
const SLOT_IDS: Record<string, string> = {
  'landing-between-sections': 'XXXXXXXXXX', // ← replace
  'landing-below-pricing':    'XXXXXXXXXX', // ← replace
  'dashboard-below-tracker':  'XXXXXXXXXX', // ← replace
  'dashboard-paywall':        'XXXXXXXXXX', // ← replace
  default:                    'XXXXXXXXXX', // ← replace (fallback)
};

type AdSize = 'leaderboard' | 'banner' | 'rectangle' | 'responsive';

interface AdBannerProps {
  placement?: keyof typeof SLOT_IDS;
  slotId?: string;         // override slot ID directly
  size?: AdSize;
  className?: string;
}

const SIZE_STYLES: Record<AdSize, { width: number | string; height: number | string }> = {
  leaderboard: { width: 728,    height: 90  },
  banner:      { width: 320,    height: 50  },
  rectangle:   { width: 300,    height: 250 },
  responsive:  { width: '100%', height: 'auto' },
};

const isPending = false; // publisher ID is configured

export default function AdBanner({
  placement = 'default',
  slotId,
  size = 'responsive',
  className = '',
}: AdBannerProps) {
  const adRef   = useRef<HTMLModElement>(null);
  const pushed  = useRef(false);
  const resolvedSlot = slotId ?? SLOT_IDS[placement] ?? SLOT_IDS.default;
  const { width, height } = SIZE_STYLES[size];

  useEffect(() => {
    // Don't push ads while publisher ID is still a placeholder
    if (isPending || pushed.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch { /* AdSense not loaded yet */ }
  }, []);

  // ── Placeholder shown before AdSense is configured ────────────────────────
  if (isPending) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-[#2a2a2a] rounded-xl bg-[#0d0d0d] text-[#3a3a3a] text-xs font-mono ${className}`}
        style={{ width, height: height === 'auto' ? 90 : height, minHeight: 60 }}
      >
        Ad placeholder — configure AdSense publisher ID in components/AdBanner.tsx
      </div>
    );
  }

  // ── Live AdSense unit ──────────────────────────────────────────────────────
  return (
    <div className={`overflow-hidden ${className}`} style={{ width, textAlign: 'center' }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width, height: height === 'auto' ? undefined : height }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={resolvedSlot}
        data-ad-format={size === 'responsive' ? 'auto' : undefined}
        data-full-width-responsive={size === 'responsive' ? 'true' : undefined}
      />
    </div>
  );
}
