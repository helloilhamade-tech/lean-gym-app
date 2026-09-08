'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { QuickActionModal } from './QuickActionModal';
import { Language } from '@/lib/domain/i18n';
import { initializeDatabaseWithSeedData } from '@/lib/db/dexie-db';
import { AuthProvider, useAuth } from '@/lib/firebase/auth-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [lang, setLang] = useState<Language>('id');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isOnboarding = pathname === '/onboarding';

  useEffect(() => {
    // Check saved language
    const savedLang = localStorage.getItem('lean_lang') as Language;
    if (savedLang === 'id' || savedLang === 'en') {
      setLang(savedLang);
    }

    // Initialize DB with seed catalog if needed
    initializeDatabaseWithSeedData();
  }, []);

  // Strict Global Route Guard: Lock all features until user logs in
  useEffect(() => {
    if (loading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
    }
  }, [user, loading, isLoginPage, router]);

  const handleToggleLang = () => {
    const nextLang: Language = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);
    localStorage.setItem('lean_lang', nextLang);
  };

  // 1. If still checking Firebase auth, show full loading splash screen
  if (loading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center font-sans">
        <div className="w-full max-w-[430px] min-h-screen bg-background border-x border-surfaceBorder/40 flex flex-col items-center justify-center space-y-4 p-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
            <Dumbbell className="w-7 h-7 stroke-[2.2px]" />
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-xl font-black text-white tracking-tight">LEAN</h1>
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            </div>
            <p className="text-xs text-mutedText">Memeriksa status akun...</p>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // 2. If not logged in and trying to access any page other than /login, block completely
  if (!user && !isLoginPage) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center font-sans">
        <div className="w-full max-w-[430px] min-h-screen bg-background border-x border-surfaceBorder/40 flex flex-col items-center justify-center space-y-3 p-6 shadow-2xl">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-mutedText">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  // 3. Authenticated (or on /login): Show features and navigation conditionally
  const showChrome = Boolean(user && !isLoginPage && !isOnboarding);

  return (
    <div className="min-h-screen bg-black text-slate-100 flex justify-center font-sans antialiased selection:bg-primary selection:text-black">
      {/* Mobile-First Frame: Baseline iPhone XR (414px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-background border-x border-surfaceBorder/40 flex flex-col relative shadow-2xl">
        {showChrome && <Header lang={lang} onToggleLang={handleToggleLang} />}

        <main className={`flex-1 px-4 pt-3 overflow-y-auto ${showChrome ? 'pb-24' : 'pb-6'}`}>
          {children}
        </main>

        {showChrome && (
          <BottomNav
            lang={lang}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
          />
        )}

        {showChrome && (
          <QuickActionModal
            isOpen={isQuickActionOpen}
            onClose={() => setIsQuickActionOpen(false)}
            lang={lang}
            onDataLogged={() => {
              window.dispatchEvent(new Event('lean_data_changed'));
            }}
          />
        )}
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AuthProvider>
  );
}
