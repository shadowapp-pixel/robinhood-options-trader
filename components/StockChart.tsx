'use client';

import { useEffect, useRef, useState } from 'react';

type Interval = '60' | '240' | 'D';

interface Props {
  symbol: string;
  defaultInterval?: Interval;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { TradingView: any; } }

/* Load TradingView script once, shared across all chart instances */
let tvScriptLoaded = false;
const tvCallbacks: (() => void)[] = [];

function loadTVScript(cb: () => void) {
  if (tvScriptLoaded) { cb(); return; }
  tvCallbacks.push(cb);
  if (tvCallbacks.length > 1) return; // already loading
  const script = document.createElement('script');
  script.src   = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  script.onload = () => {
    tvScriptLoaded = true;
    tvCallbacks.forEach(fn => fn());
    tvCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

export default function StockChart({ symbol, defaultInterval = '60' }: Props) {
  const [interval, setInterval] = useState<Interval>(defaultInterval);
  const containerRef = useRef<HTMLDivElement>(null);
  /* Stable unique ID per mount — avoids TradingView container conflicts */
  const containerId  = useRef(`tv_${symbol}_${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    el.id        = containerId;

    const init = () => {
      if (!window.TradingView || !document.getElementById(containerId)) return;
      new window.TradingView.widget({
        autosize:            true,
        symbol,
        interval,
        timezone:            'America/New_York',
        theme:               'dark',
        style:               '1',           // candlestick
        locale:              'en',
        toolbar_bg:          '#111111',
        enable_publishing:   false,
        allow_symbol_change: false,
        container_id:        containerId,
        backgroundColor:     '#0a0a0a',
        gridColor:           '#1a1a1a',
        hide_top_toolbar:    false,
        hide_legend:         false,
        save_image:          false,
        withdateranges:      true,
      });
    };

    loadTVScript(init);

    return () => { if (el) el.innerHTML = ''; };
  }, [symbol, interval, containerId]);

  return (
    <div className="space-y-2">
      {/* Timeframe + hint */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {([
            { label: '1H', value: '60'  },
            { label: '4H', value: '240' },
            { label: '1D', value: 'D'   },
          ] as { label: string; value: Interval }[]).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setInterval(value)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                interval === value
                  ? 'bg-[#00C805] text-black'
                  : 'bg-[#1e1e1e] text-[#9e9e9e] hover:text-white border border-[#2a2a2a]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-[#3a3a3a]">
          Use the toolbar inside the chart to draw trend lines &amp; shapes
        </span>
      </div>

      {/* Chart */}
      <div className="rounded-xl overflow-hidden border border-[#2a2a2a]" style={{ height: 420 }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}
