'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  Globe,
  Database,
  RotateCcw,
  Sparkles,
  Check,
  Save,
  Cloud,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
} from "lucide-react";
import { db, initializeDatabaseWithSeedData, resetDatabaseToFresh } from '@/lib/db/dexie-db';
import { Profile, Goal } from '@/lib/db/schema';
import { Language, t } from '@/lib/domain/i18n';
import { useAuth } from '@/lib/firebase/auth-context';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isConfigured, isGuest, signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser, triggerSync } = useAuth();

  const [lang, setLang] = useState<Language>('id');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [calOverride, setCalOverride] = useState(2100);
  const [protOverride, setProtOverride] = useState(150);
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Email auth inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  const [dbStats, setDbStats] = useState<{ exercises: number; workouts: number; sets: number; meals: number }>({
    exercises: 0,
    workouts: 0,
    sets: 0,
    meals: 0,
  });

  useEffect(() => {
    const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
    setLang(savedLang);

    async function loadData() {
      const p = await db.profiles.toCollection().first();
      setProfile(p || null);

      const g = await db.goals.where('status').equals('active').first();
      if (g) {
        setGoal(g);
        setCalOverride(g.daily_calorie_target);
        setProtOverride(g.daily_protein_target_g);
      }

      const exCount = await db.exercises.count();
      const wCount = await db.workouts.count();
      const sCount = await db.sets.count();
      const mCount = await db.meals.count();

      setDbStats({
        exercises: exCount,
        workouts: wCount,
        sets: sCount,
        meals: mCount,
      });
    }
    loadData();
  }, []);

  const handleSaveOverrides = async () => {
    if (!goal) return;
    await db.goals.update(goal.id, {
      daily_calorie_target: calOverride,
      daily_protein_target_g: protOverride,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  const handleToggleLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lean_lang', newLang);
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await triggerSync();
      setSyncStatusMsg(res.message);
    } catch (err: any) {
      setSyncStatusMsg(err.message || 'Gagal sinkronisasi');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail || !authPassword) return;

    try {
      if (authMode === 'signin') {
        await signInWithEmail(authEmail, authPassword);
      } else {
        await signUpWithEmail(authEmail, authPassword);
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Gagal masuk');
    }
  };

  const handleResetDemoData = async () => {
    if (confirm(lang === 'id' ? 'Muat ulang data sampel demo?' : 'Reload demo sample data?')) {
      await initializeDatabaseWithSeedData(true);
      window.dispatchEvent(new Event('lean_data_changed'));
      router.push('/today');
    }
  };

  const handleFreshOnboarding = async () => {
    if (confirm(lang === 'id' ? 'Mulai ulang dari awal? Semua riwayat saat ini akan dibersihkan.' : 'Start fresh? Current history will be cleared.')) {
      await resetDatabaseToFresh();
      router.push('/onboarding');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-16">
      {/* 1. Profile Identity Header */}
      <div className="bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-extrabold text-xl">
          {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : (profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'A')}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white">
            {user?.displayName || profile?.name || 'Alex Pratama'}
          </h2>
          <p className="text-xs text-mutedText">
            {profile?.height_cm || 176} cm • {profile?.weight_kg || 78.4} kg • {profile?.activity_level || 'moderate'}
          </p>
          <span className="inline-block text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 mt-1">
            Goal: {goal?.goal_type || 'Recomposition'}
          </span>
        </div>
      </div>

      {/* 2. Multi-Device Cloud Sync via Firebase */}
      <section aria-label="Cloud sync" className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Cloud className="w-4 h-4 text-accent" />
            <span>Sinkronisasi Multi-Device (Firebase)</span>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            user && !isGuest
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-card text-mutedText border-surfaceBorder'
          }`}>
            {user ? (isGuest ? 'Mode Tamu (Lokal)' : 'Akun Terhubung') : 'Lokal / Offline'}
          </span>
        </div>

        {user && !isGuest ? (
          <div className="space-y-3 pt-1">
            <div className="bg-card p-3 rounded-xl border border-surfaceBorder flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{user.email || user.displayName || 'Akun Aktif'}</span>
                <span className="text-[10px] text-mutedText">Data sinkron ke cloud Firestore</span>
              </div>
              <button
                onClick={signOutUser}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceBorder text-rose-400 text-xs font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>

            {syncStatusMsg && (
              <p className="text-center text-xs text-primary font-semibold">{syncStatusMsg}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="bg-card/50 p-3 rounded-xl border border-surfaceBorder flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Mode Tamu (Offline)</span>
                <span className="text-[10px] text-mutedText">Data tersimpan di perangkat ini</span>
              </div>
              <button
                onClick={signOutUser}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceBorder text-rose-400 text-xs font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>

            <p className="text-[11px] text-mutedText leading-relaxed">
              Hubungkan akun Google atau Email untuk backup otomatis ke cloud Firestore dan akses di HP/laptop lain.
            </p>

            {isConfigured ? (
              <div className="space-y-2">
                <button
                  onClick={signInWithGoogle}
                  className="w-full py-2.5 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.3l3.7 2.9C6.2 7.2 8.9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 11.6 0 14s.6 4.7 1.6 6.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.2L1.6 16c1.9 3.7 5.8 7 10.4 7z"/>
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>

                {/* Email Form */}
                <form onSubmit={handleEmailAuthSubmit} className="space-y-2 pt-1">
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-mutedText absolute left-3 top-3" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-card border border-surfaceBorder rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-mutedText absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="Password (min. 6 karakter)"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-card border border-surfaceBorder rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  {authError && (
                    <p className="text-[10px] text-rose-400">{authError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      onClick={() => setAuthMode('signin')}
                      className="flex-1 py-2 rounded-xl bg-card border border-surfaceBorder hover:border-primary text-xs font-bold text-white active:scale-95 transition-all"
                    >
                      Masuk
                    </button>
                    <button
                      type="submit"
                      onClick={() => setAuthMode('signup')}
                      className="flex-1 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all"
                    >
                      Daftar Baru
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-card p-3 rounded-xl border border-surfaceBorder/80 text-xs text-mutedText space-y-1">
                <span className="font-bold text-slate-200 block text-[11px]">
                  Mode Offline Aktif
                </span>
                <p className="text-[10px]">
                  Semua data tersimpan aman di IndexedDB perangkat ini. Kunci Firebase dapat ditambahkan di Environment Variables Vercel untuk mengaktifkan cloud sync kapan saja.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Language Switcher */}
      <section aria-label="Language selection" className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Globe className="w-4 h-4 text-primary" />
          <span>{t('language_toggle', lang)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleToggleLang('id')}
            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
              lang === 'id'
                ? 'bg-primary/15 border-primary text-white'
                : 'bg-card border-surfaceBorder text-mutedText'
            }`}
          >
            Bahasa Indonesia (Default)
          </button>
          <button
            onClick={() => handleToggleLang('en')}
            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
              lang === 'en'
                ? 'bg-primary/15 border-primary text-white'
                : 'bg-card border-surfaceBorder text-mutedText'
            }`}
          >
            English
          </button>
        </div>
      </section>

      {/* 4. Daily Target Overrides */}
      <section aria-label="Daily target overrides" className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Settings className="w-4 h-4 text-warning" />
            <span>{lang === 'id' ? 'Ubah Target Nutrisi Harian' : 'Override Daily Targets'}</span>
          </div>
          {isSaved && (
            <span className="text-[10px] text-primary font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Tersimpan
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              {t('calories', lang)} (kcal)
            </label>
            <input
              type="number"
              value={calOverride}
              onChange={(e) => setCalOverride(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 font-mono font-bold text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              {t('protein', lang)} (g)
            </label>
            <input
              type="number"
              value={protOverride}
              onChange={(e) => setProtOverride(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 font-mono font-bold text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={handleSaveOverrides}
          className="w-full py-2 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Perbarui Target' : 'Save Changes'}</span>
        </button>
      </section>

      {/* 5. Local Database & Offline-First Health */}
      <section aria-label="Local database stats" className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            <span>{t('offline_status', lang)}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            IndexedDB Siap
          </span>
        </div>
        <p className="text-[11px] text-mutedText leading-relaxed">
          Semua pencatatan gym langsung disimpan di perangkat tanpa ketergantungan koneksi internet.
        </p>

        <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
          <div className="bg-card p-2 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-mutedText block">Exercises</span>
            <span className="text-xs font-bold text-white">{dbStats.exercises}</span>
          </div>
          <div className="bg-card p-2 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-mutedText block">Workouts</span>
            <span className="text-xs font-bold text-white">{dbStats.workouts}</span>
          </div>
          <div className="bg-card p-2 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-mutedText block">Sets</span>
            <span className="text-xs font-bold text-white">{dbStats.sets}</span>
          </div>
          <div className="bg-card p-2 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-mutedText block">Meals</span>
            <span className="text-xs font-bold text-white">{dbStats.meals}</span>
          </div>
        </div>
      </section>

      {/* 6. Demo Data Management (For testing & evaluation) */}
      <section aria-label="Data controls" className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mutedText">
          {lang === 'id' ? 'Kontrol Evaluasi & Demo' : 'Evaluation & Testing'}
        </h3>

        <div className="space-y-2">
          <button
            onClick={handleResetDemoData}
            className="w-full py-2.5 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-warning" />
            <span>{t('reset_demo', lang)}</span>
          </button>

          <button
            onClick={handleFreshOnboarding}
            className="w-full py-2.5 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{t('fresh_onboarding', lang)}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
