'use client';

import Link from 'next/link';
import { User, Globe } from 'lucide-react';
import { Language } from '@/lib/domain/i18n';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  title?: string;
}

export function Header({ lang, onToggleLang, title = 'LEAN' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-surfaceBorder px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/today" className="flex items-center gap-1.5 focus:outline-none">
          <span className="font-extrabold tracking-tight text-xl text-white">LEAN</span>
          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-surfaceBorder text-xs font-semibold text-mutedText hover:text-white transition-colors"
          title="Switch Language (ID / EN)"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang.toUpperCase()}</span>
        </button>

        {/* Profile */}
        <Link
          href="/profile"
          className="p-1.5 rounded-full bg-surface border border-surfaceBorder text-mutedText hover:text-white transition-colors"
          title="Profile & Settings"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
