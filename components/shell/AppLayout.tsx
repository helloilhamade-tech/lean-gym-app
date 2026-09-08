'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { QuickActionModal } from './QuickActionModal';
import { Language } from '@/lib/domain/i18n';
import { initializeDatabaseWithSeedData } from '@/lib/db/dexie-db';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [lang, setLang] = useState<Language>('id');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    // Check saved language
    const savedLang = localStorage.getItem('lean_lang') as Language;
    if (savedLang === 'id' || savedLang === 'en') {
      setLang(savedLang);
    }

    // Initialize DB with seed data if needed
    initializeDatabaseWithSeedData().then(() => {
      setIsDbReady(true);
    });
  }, []);

  const handleToggleLang = () => {
    const nextLang: Language = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);
    localStorage.setItem('lean_lang', nextLang);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex justify-center font-sans antialiased selection:bg-primary selection:text-black">
      {/* Mobile-First Frame: Baseline iPhone XR (414px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-background border-x border-surfaceBorder/40 flex flex-col relative shadow-2xl">
        <Header lang={lang} onToggleLang={handleToggleLang} />

        <main className="flex-1 pb-24 px-4 pt-3 overflow-y-auto">
          {children}
        </main>

        <BottomNav
          lang={lang}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
        />

        <QuickActionModal
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
          lang={lang}
          onDataLogged={() => {
            // Trigger refresh event
            window.dispatchEvent(new Event('lean_data_changed'));
          }}
        />
      </div>
    </div>
  );
}
