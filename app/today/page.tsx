'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Flame,
  Footprints,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Profile, Goal, Workout, DailyLog, Meal, Recommendation } from '@/lib/db/schema';
import { calculate7DayWeightAverage, generateDailyRecommendations } from '@/lib/domain/recommendations';
import { calculateMacroSummary } from '@/lib/domain/nutrition';
import { Language, t } from '@/lib/domain/i18n';

export default function TodayPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('id');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weightSummary, setWeightSummary] = useState<{
    rollingAverageKg: number | null;
    latestWeightKg: number | null;
    deltaKg: number | null;
    trend: 'down' | 'up' | 'stable';
  }>({ rollingAverageKg: null, latestWeightKg: null, deltaKg: null, trend: 'stable' });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
      setLang(savedLang);

      const p = await db.profiles.toCollection().first();
      if (!p) {
        router.replace('/onboarding');
        return;
      }
      setProfile(p);

      const g = await db.goals.where('profile_id').equals(p.id).first();
      setGoal(g || null);

      const todayStr = new Date().toISOString().split('T')[0];
      const w = await db.workouts
        .where('profile_id')
        .equals(p.id)
        .filter((wkt) => wkt.scheduled_at === todayStr)
        .first();
      setTodayWorkout(w || null);

      const d = await db.dailyLogs
        .where({ profile_id: p.id, date: todayStr })
        .first();
      setDailyLog(d || null);

      const m = await db.meals
        .where('profile_id')
        .equals(p.id)
        .filter((meal) => meal.eaten_at.startsWith(todayStr))
        .toArray();
      setMeals(m);

      const measurements = await db.measurements
        .where('profile_id')
        .equals(p.id)
        .toArray();
      const recentWeights = measurements.map((item) => ({
        date: item.measured_at,
        weightKg: item.weight_kg,
      }));
      const wtTrend = calculate7DayWeightAverage(recentWeights);
      setWeightSummary(wtTrend);

      // Run Recommendation Engine
      const recs = generateDailyRecommendations({
        profileId: p.id,
        goal: g || undefined,
        todayWorkout: w || undefined,
        todayDailyLog: d || undefined,
        recentWeights,
        todayMeals: m,
        language: savedLang,
      });
      setRecommendations(recs);
    } catch (e) {
      console.error('Error loading Today dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();

    const handleDataChange = () => {
      loadDashboardData();
    };
    window.addEventListener('lean_data_changed', handleDataChange);
    return () => window.removeEventListener('lean_data_changed', handleDataChange);
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Macro calculations
  const calorieTarget = goal?.daily_calorie_target || 2100;
  const proteinTarget = goal?.daily_protein_target_g || 150;
  const macroSummary = calculateMacroSummary(calorieTarget, proteinTarget, meals);

  const primaryRec = recommendations[0];
  const secondaryRecs = recommendations.slice(1, 3);

  // Readiness presentation
  const readiness = dailyLog?.readiness || 'good';
  const readinessColors = {
    good: 'text-primary bg-primary/10 border-primary/20',
    moderate: 'text-warning bg-warning/10 border-warning/20',
    low: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  const readinessLabel = {
    good: t('readiness_good', lang),
    moderate: t('readiness_moderate', lang),
    low: t('readiness_low', lang),
  }[readiness];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Goal State Header Bar */}
      <section aria-label="Goal status" className="bg-surface border border-surfaceBorder rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mutedText block">
            {t('goal_title', lang)}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-white font-mono">
              {weightSummary.latestWeightKg ?? profile?.weight_kg ?? '--'}
              <span className="text-xs font-normal text-mutedText ml-0.5">kg</span>
            </span>
            <span className="text-xs text-subtleText">
              → {goal?.target_weight_kg ?? 75} kg
            </span>
          </div>
        </div>

        {/* 7-day trend badge */}
        <div className="text-right">
          <span className="text-[10px] text-mutedText block">{t('week_delta', lang)}</span>
          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-card border border-surfaceBorder text-xs font-mono font-medium">
            {weightSummary.trend === 'down' && (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary">{weightSummary.deltaKg} kg</span>
              </>
            )}
            {weightSummary.trend === 'up' && (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">+{weightSummary.deltaKg} kg</span>
              </>
            )}
            {weightSummary.trend === 'stable' && (
              <>
                <Minus className="w-3.5 h-3.5 text-mutedText" />
                <span className="text-mutedText">0.0 kg</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Today's Workout Card (Hero Action) */}
      <section aria-label="Today workout" className="relative overflow-hidden bg-gradient-to-br from-card to-surface border border-surfaceBorder rounded-3xl p-5 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
              <Dumbbell className="w-3 h-3" />
              <span>{lang === 'id' ? 'Latihan Hari Ini' : "Today's Workout"}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
              {todayWorkout?.name || (lang === 'id' ? 'Upper Body A' : 'Upper Body A')}
            </h2>
            <div className="flex items-center gap-3 text-xs text-mutedText pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{todayWorkout?.duration_min || 55} min
              </span>
              <span>•</span>
              <span>5 {t('exercises', lang).toLowerCase()}</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Dumbbell className="w-6 h-6 stroke-[2px]" />
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-5">
          <button
            onClick={() => router.push('/workout/active')}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
          >
            <span>
              {todayWorkout?.status === 'in_progress'
                ? t('resume_workout', lang)
                : t('start_workout', lang)}
            </span>
            <ChevronRight className="w-4 h-4 stroke-[3px]" />
          </button>
        </div>
      </section>

      {/* 3. Nutrition & Activity Quick Overview (Side-by-side) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Protein / Calories */}
        <div
          onClick={() => router.push('/nutrition')}
          className="bg-surface border border-surfaceBorder rounded-2xl p-3.5 cursor-pointer hover:border-surfaceBorder/80 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase text-mutedText">
              {t('protein', lang)}
            </span>
            <Flame className="w-4 h-4 text-warning" />
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {macroSummary.consumedProteinG}
            <span className="text-xs font-normal text-mutedText"> / {macroSummary.targetProteinG}g</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-card h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-warning h-full rounded-full transition-all duration-500"
              style={{ width: `${macroSummary.proteinProgressPct}%` }}
            />
          </div>
          <div className="text-[10px] text-subtleText mt-1.5">
            {macroSummary.remainingCalories} kcal {t('remaining', lang).toLowerCase()}
          </div>
        </div>

        {/* Activity / Steps */}
        <div className="bg-surface border border-surfaceBorder rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase text-mutedText">
              {t('activity', lang)}
            </span>
            <Footprints className="w-4 h-4 text-accent" />
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {(dailyLog?.steps || 6420).toLocaleString()}
            <span className="text-xs font-normal text-mutedText"> / 8,000</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-card h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round(((dailyLog?.steps || 6420) / 8000) * 100))}%` }}
            />
          </div>
          <div className="text-[10px] text-subtleText mt-1.5">
            {dailyLog?.water_ml || 2250} ml {t('water', lang).toLowerCase()}
          </div>
        </div>
      </div>

      {/* 4. Readiness & Recovery Signal */}
      <section aria-label="Readiness and recovery" className="bg-surface border border-surfaceBorder rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-mutedText">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">{t('readiness', lang)}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${readinessColors[readiness]}`}>
                {readinessLabel}
              </span>
            </div>
            <p className="text-[11px] text-mutedText mt-0.5">
              {dailyLog?.sleep_hours || 7.5} jam tidur • Energi optimal
            </p>
          </div>
        </div>
      </section>

      {/* 5. Personalized Recommendation Engine (Dominant Action + Secondary) */}
      <section aria-label="Daily recommendations" className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-mutedText">
            {t('next_best_action', lang)}
          </h3>
        </div>

        {primaryRec ? (
          <div className="bg-gradient-to-r from-card to-surface border border-primary/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {primaryRec.category}
              </span>
              <span className="text-[10px] text-subtleText">
                {lang === 'id' ? 'Saran Utama' : 'Top Suggestion'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {lang === 'id' ? primaryRec.title_id : primaryRec.title}
            </h4>
            <p className="text-xs text-mutedText leading-relaxed">
              {lang === 'id' ? primaryRec.rationale_id : primaryRec.rationale}
            </p>
          </div>
        ) : null}

        {/* Secondary Recommendations */}
        {secondaryRecs.map((rec) => (
          <div
            key={rec.id}
            className="bg-surface border border-surfaceBorder rounded-xl p-3 flex items-start justify-between"
          >
            <div>
              <span className="text-[10px] font-semibold text-subtleText uppercase tracking-wider block mb-0.5">
                {rec.category}
              </span>
              <h5 className="text-xs font-bold text-slate-200">
                {lang === 'id' ? rec.title_id : rec.title}
              </h5>
              <p className="text-[11px] text-mutedText mt-0.5">
                {lang === 'id' ? rec.rationale_id : rec.rationale}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
