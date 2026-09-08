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
  Shield,
  Smartphone,
  Save,
} from 'lucide-react';
import { db, initializeDatabaseWithSeedData, resetDatabaseToFresh } from '@/lib/db/dexie-db';
import { Profile, Goal } from '@/lib/db/schema';
import { Language, t } from '@/lib/domain/i18n';

export default function ProfilePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('id');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [calOverride, setCalOverride] = useState(2100);
  const [protOverride, setProtOverride] = useState(150);
  const [isSaved, setIsSaved] = useState(false);
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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Profile Identity Header */}
      <div className="bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-extrabold text-xl">
          {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'A'}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white">
            {profile?.name || 'Alex Pratama'}
          </h2>
          <p className="text-xs text-mutedText">
            {profile?.height_cm || 176} cm • {profile?.weight_kg || 78.4} kg • {profile?.activity_level || 'moderate'}
          </p>
          <span className="inline-block text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 mt-1">
            Goal: {goal?.goal_type || 'Recomposition'}
          </span>
        </div>
      </div>

      {/* 2. Language Switcher */}
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

      {/* 3. Daily Target Overrides */}
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

      {/* 4. Local Database & Offline-First Health */}
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

      {/* 5. Demo Data Management (For testing & evaluation) */}
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
