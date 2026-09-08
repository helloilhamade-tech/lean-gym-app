'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dumbbell, Utensils, TrendingUp, Plus } from 'lucide-react';
import { Language, t } from '@/lib/domain/i18n';

interface BottomNavProps {
  lang: Language;
  onOpenQuickAction: () => void;
}

export function BottomNav({ lang, onOpenQuickAction }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/today', label: t('today', lang), icon: LayoutDashboard },
    { href: '/workout', label: t('workout', lang), icon: Dumbbell },
    { href: '/nutrition', label: t('nutrition', lang), icon: Utensils },
    { href: '/progress', label: t('progress', lang), icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-[430px] mx-auto bg-surface/95 backdrop-blur-md border-t border-surfaceBorder px-2 py-1.5 flex items-center justify-around safe-bottom">
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-subtleText hover:text-mutedText'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      {/* Center Floating Quick Action Button */}
      <div className="flex flex-col items-center justify-center -mt-5">
        <button
          onClick={onOpenQuickAction}
          className="w-12 h-12 rounded-full bg-primary text-black font-bold flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform hover:bg-primary-hover focus:outline-none"
          title="Quick Action"
        >
          <Plus className="w-6 h-6 stroke-[2.5px]" />
        </button>
      </div>

      {navItems.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-subtleText hover:text-mutedText'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
