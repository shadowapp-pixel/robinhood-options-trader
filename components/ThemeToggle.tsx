'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-end gap-2">
        <span className="text-[10px] text-[#3a3a3a] uppercase tracking-widest font-semibold">Background</span>
        <button
          onClick={toggle}
          aria-label="Toggle background color"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold transition-all ${
            isLight
              ? 'bg-white border-[#d0d0d0] text-[#333333]'
              : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#6b6b6b] hover:text-[#9e9e9e]'
          }`}
        >
          <span>{isLight ? '🌙' : '☀️'}</span>
          <span>{isLight ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </div>
  );
}
