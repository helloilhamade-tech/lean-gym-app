'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Trophy,
  ArrowLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import {
  Workout,
  WorkoutExercise,
  SetEntry,
  Exercise,
  ExerciseHistory,
} from '@/lib/db/schema';
import {
  calculateEst1RM,
  calculateTotalVolume,
  evaluateProgression,
  checkPersonalRecords,
  PRStatus,
} from '@/lib/domain/progressive-overload';
import { RestTimer } from '@/components/workout/RestTimer';
import { Language, t } from '@/lib/domain/i18n';

interface ActiveExerciseData {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  previousSets: Array<{ weightKg: number; reps: number }>;
  currentSets: SetEntry[];
  progressionNote?: string;
  isPR?: boolean;
}

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('id');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercisesData, setExercisesData] = useState<ActiveExerciseData[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    durationMin: number;
    totalVolumeKg: number;
    totalSetsCompleted: number;
    prsAchieved: string[];
    nextSuggestion: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active workout session clock
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load session from Dexie DB
  useEffect(() => {
    const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
    setLang(savedLang);

    async function loadActiveSession() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        let w = await db.workouts
          .filter((item) => item.scheduled_at === todayStr || item.status === 'in_progress')
          .first();

        if (!w) {
          const profile = await db.profiles.toCollection().first();
          const profileId = profile?.id || 'usr-demo-01';
          const newWorkoutId = `wkt-${Date.now()}`;
          w = {
            id: newWorkoutId,
            profile_id: profileId,
            name: 'Upper Body A (Chest & Back Focus)',
            scheduled_at: todayStr,
            started_at: new Date().toISOString(),
            status: 'in_progress',
            duration_min: 55,
            created_at: new Date().toISOString(),
          };
          await db.workouts.put(w);
        }

        setWorkout(w);

        // Fetch workout exercises
        const weList = await db.workoutExercises
          .where('workout_id')
          .equals(w.id)
          .sortBy('sort_order');

        const allExercises = await db.exercises.toArray();
        const exMap = new Map(allExercises.map((e) => [e.id, e]));

        // Fetch sets for each workout exercise
        const loadedData: ActiveExerciseData[] = [];

        for (const we of weList) {
          const ex = exMap.get(we.exercise_id);
          if (!ex) continue;

          let sets = await db.sets
            .where('workout_exercise_id')
            .equals(we.id)
            .sortBy('set_no');

          // If no sets exist yet, pre-populate default sets
          if (sets.length === 0) {
            const defaultWeight = ex.movement_pattern === 'push' ? 15 : 20;
            for (let i = 1; i <= (we.target_sets || 3); i++) {
              const newSet: SetEntry = {
                id: `set-${we.id}-${i}-${Date.now()}`,
                workout_exercise_id: we.id,
                set_no: i,
                set_type: 'normal',
                weight_kg: defaultWeight,
                reps: 8,
                completed: false,
                sync_status: 'synced',
              };
              await db.sets.put(newSet);
              sets.push(newSet);
            }
          }

          // AT-01: Fetch previous history for this exercise
          const history = await db.exerciseHistory
            .where('exercise_id')
            .equals(ex.id)
            .first();

          const prevSets = history
            ? [
                { weightKg: history.best_weight_kg, reps: history.best_reps },
                { weightKg: history.best_weight_kg, reps: history.best_reps },
                { weightKg: history.best_weight_kg, reps: Math.max(1, history.best_reps - 1) },
              ]
            : [
                { weightKg: 15, reps: 8 },
                { weightKg: 15, reps: 8 },
                { weightKg: 15, reps: 7 },
              ];

          loadedData.push({
            workoutExercise: we,
            exercise: ex,
            previousSets: prevSets,
            currentSets: sets,
          });
        }

        setExercisesData(loadedData);
      } finally {
        setIsLoading(false);
      }
    }

    loadActiveSession();
  }, []);

  // Set field change handler (optimistic and instant local save)
  const handleSetChange = async (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight_kg' | 'reps',
    value: number
  ) => {
    const updated = [...exercisesData];
    const targetSet = updated[exerciseIndex].currentSets[setIndex];
    targetSet[field] = value;
    setExercisesData(updated);

    // Save to Dexie DB immediately
    await db.sets.update(targetSet.id, { [field]: value });
  };

  // Toggle set completed ✓
  const handleToggleComplete = async (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercisesData];
    const exData = updated[exerciseIndex];
    const targetSet = exData.currentSets[setIndex];
    const nextCompleted = !targetSet.completed;
    targetSet.completed = nextCompleted;
    targetSet.completed_at = nextCompleted ? new Date().toISOString() : undefined;

    // Check progressive overload and PR on completion
    if (nextCompleted) {
      const history = await db.exerciseHistory
        .where('exercise_id')
        .equals(exData.exercise.id)
        .first();

      const prStatus = checkPersonalRecords(
        exData.currentSets.map((s) => ({
          weightKg: s.weight_kg,
          reps: s.reps,
          completed: s.completed,
        })),
        history
          ? {
              bestWeightKg: history.best_weight_kg,
              best1rm: history.est_1rm,
              bestVolumeKg: history.volume,
            }
          : undefined
      );

      if (prStatus.isWeightPR || prStatus.is1rmPR) {
        exData.isPR = true;
      }

      // Auto start rest timer (PRD WO-05)
      setRestDuration(exData.workoutExercise.rest_sec || 90);
      setIsTimerActive(true);
    }

    setExercisesData(updated);
    await db.sets.update(targetSet.id, {
      completed: nextCompleted,
      completed_at: targetSet.completed_at,
    });
  };

  // Add Set to exercise
  const handleAddSet = async (exerciseIndex: number) => {
    const updated = [...exercisesData];
    const exData = updated[exerciseIndex];
    const lastSet = exData.currentSets[exData.currentSets.length - 1];
    const nextSetNo = exData.currentSets.length + 1;

    const newSet: SetEntry = {
      id: `set-${exData.workoutExercise.id}-${nextSetNo}-${Date.now()}`,
      workout_exercise_id: exData.workoutExercise.id,
      set_no: nextSetNo,
      set_type: 'normal',
      weight_kg: lastSet ? lastSet.weight_kg : 15,
      reps: lastSet ? lastSet.reps : 8,
      completed: false,
      sync_status: 'synced',
    };

    await db.sets.put(newSet);
    exData.currentSets.push(newSet);
    setExercisesData(updated);
  };

  // Delete Set from exercise
  const handleDeleteSet = async (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercisesData];
    const exData = updated[exerciseIndex];
    if (exData.currentSets.length <= 1) return;

    const [deleted] = exData.currentSets.splice(setIndex, 1);
    await db.sets.delete(deleted.id);

    // Re-index remaining sets
    for (let i = 0; i < exData.currentSets.length; i++) {
      exData.currentSets[i].set_no = i + 1;
      await db.sets.update(exData.currentSets[i].id, { set_no: i + 1 });
    }

    setExercisesData(updated);
  };

  // Finish Workout confirmation
  const handleFinishWorkout = async () => {
    const durationMin = Math.max(1, Math.round(elapsedSeconds / 60));
    let totalVolumeKg = 0;
    let totalSetsCompleted = 0;
    const prsAchieved: string[] = [];

    for (const exData of exercisesData) {
      const completedSets = exData.currentSets.filter((s) => s.completed);
      totalSetsCompleted += completedSets.length;
      totalVolumeKg += calculateTotalVolume(
        completedSets.map((s) => ({
          weight_kg: s.weight_kg,
          reps: s.reps,
          completed: true,
        }))
      );

      if (exData.isPR) {
        prsAchieved.push(exData.exercise.name);
      }

      // Update Exercise History in database
      if (completedSets.length > 0) {
        const maxWeight = Math.max(...completedSets.map((s) => s.weight_kg));
        const maxSet = completedSets.find((s) => s.weight_kg === maxWeight);
        const est1rm = maxSet ? calculateEst1RM(maxSet.weight_kg, maxSet.reps) : 0;
        const vol = calculateTotalVolume(
          completedSets.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps, completed: true }))
        );

        await db.exerciseHistory.put({
          id: `eh-${exData.exercise.id}`,
          profile_id: workout?.profile_id || 'usr-demo-01',
          exercise_id: exData.exercise.id,
          date: new Date().toISOString().split('T')[0],
          best_weight_kg: maxWeight,
          best_reps: maxSet ? maxSet.reps : 8,
          volume: vol,
          est_1rm: est1rm,
        });
      }
    }

    // Evaluate progressive overload for next session (AT-02)
    const firstEx = exercisesData[0];
    const rec = evaluateProgression(
      firstEx?.workoutExercise.target_reps || '6-8',
      firstEx?.currentSets.map((s) => ({
        weightKg: s.weight_kg,
        reps: s.reps,
        completed: s.completed,
      })) || [],
      firstEx?.exercise.muscle_group
    );

    // Mark workout completed in DB
    if (workout) {
      await db.workouts.update(workout.id, {
        status: 'completed',
        finished_at: new Date().toISOString(),
        duration_min: durationMin,
        total_volume_kg: totalVolumeKg,
      });
    }

    setSummaryData({
      durationMin,
      totalVolumeKg,
      totalSetsCompleted,
      prsAchieved,
      nextSuggestion: lang === 'id' ? rec.messageId : rec.message,
    });
    setIsFinishModalOpen(true);
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* 1. Header Bar: Workout Title & Live Elapsed Timer */}
      <div className="sticky top-12 z-20 bg-background/95 backdrop-blur-md py-2 border-b border-surfaceBorder flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/today')}
            className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-white line-clamp-1">
              {workout?.name || 'Upper Body A'}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-mutedText font-mono">
              <span className="flex items-center gap-1 text-primary">
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsedSeconds)}
              </span>
              <span>•</span>
              <span>
                {exercisesData.reduce(
                  (acc, ex) => acc + ex.currentSets.filter((s) => s.completed).length,
                  0
                )}{' '}
                {t('set', lang).toLowerCase()} selesai
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleFinishWorkout}
          className="py-1.5 px-3 rounded-xl bg-primary text-black text-xs font-black hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          {t('finish_workout', lang)}
        </button>
      </div>

      {/* 2. Exercises List */}
      <div className="space-y-4">
        {exercisesData.map((exData, exIdx) => {
          return (
            <div
              key={exData.workoutExercise.id}
              className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-3 transition-all"
            >
              {/* Exercise Title & Target Specs */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-mutedText">
                      #{exIdx + 1}
                    </span>
                    <h2 className="text-sm font-extrabold text-white">
                      {lang === 'id' ? (exData.exercise.name_id || exData.exercise.name) : exData.exercise.name}
                    </h2>
                    {exData.isPR && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning/20 text-warning text-[10px] font-extrabold">
                        <Flame className="w-3 h-3 fill-warning" /> PR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-subtleText mt-0.5">
                    <span className="capitalize">{exData.exercise.muscle_group}</span>
                    <span>•</span>
                    <span>Target: {exData.workoutExercise.target_reps} reps</span>
                    <span>•</span>
                    <span>Rest: {exData.workoutExercise.rest_sec}s</span>
                  </div>
                </div>
              </div>

              {/* AT-01: Previous Performance Hint Banner */}
              <div className="bg-card/70 border border-surfaceBorder/60 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span className="text-subtleText font-semibold">
                  {t('previous', lang)}:
                </span>
                <span className="font-mono text-mutedText font-medium">
                  {exData.previousSets
                    .map((ps) => `${ps.weightKg}kg × ${ps.reps}`)
                    .join('  •  ')}
                </span>
              </div>

              {/* Sets Table: Fast In-Gym Logging (Optimized for iPhone XR) */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-subtleText px-1 text-center">
                  <span className="col-span-2 text-left">{t('set', lang)}</span>
                  <span className="col-span-4">{t('weight_kg', lang)}</span>
                  <span className="col-span-3">{t('reps', lang)}</span>
                  <span className="col-span-3">{t('complete_set', lang)}</span>
                </div>

                {exData.currentSets.map((set, setIdx) => {
                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                        set.completed
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-card border-surfaceBorder'
                      }`}
                    >
                      {/* Set Number */}
                      <span className="col-span-2 text-xs font-mono font-bold text-mutedText text-left pl-1">
                        {setIdx + 1}
                      </span>

                      {/* Weight Stepper / Input */}
                      <div className="col-span-4 flex items-center justify-center">
                        <input
                          type="number"
                          step="1.25"
                          value={set.weight_kg}
                          onChange={(e) =>
                            handleSetChange(
                              exIdx,
                              setIdx,
                              'weight_kg',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-surface border border-surfaceBorder rounded-lg py-1.5 px-2 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Reps Stepper / Input */}
                      <div className="col-span-3 flex items-center justify-center">
                        <input
                          type="number"
                          step="1"
                          value={set.reps}
                          onChange={(e) =>
                            handleSetChange(
                              exIdx,
                              setIdx,
                              'reps',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-full bg-surface border border-surfaceBorder rounded-lg py-1.5 px-2 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Complete Checkmark Button */}
                      <div className="col-span-3 flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleComplete(exIdx, setIdx)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold active:scale-95 transition-all ${
                            set.completed
                              ? 'bg-primary text-black shadow-md shadow-primary/30'
                              : 'bg-surface border border-surfaceBorder text-mutedText hover:border-primary hover:text-white'
                          }`}
                          title="Complete Set"
                        >
                          <Check className="w-5 h-5 stroke-[3px]" />
                        </button>

                        {exData.currentSets.length > 1 && !set.completed && (
                          <button
                            onClick={() => handleDeleteSet(exIdx, setIdx)}
                            className="p-1 text-subtleText hover:text-rose-400"
                            title="Delete Set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Set Button */}
              <button
                onClick={() => handleAddSet(exIdx)}
                className="w-full py-2 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-mutedText hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add_set', lang)}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Floating Persistent Rest Timer (WO-05) */}
      <RestTimer
        initialSeconds={restDuration}
        isActive={isTimerActive}
        onComplete={() => setIsTimerActive(false)}
        onDismiss={() => setIsTimerActive(false)}
        lang={lang}
      />

      {/* 4. Workout Finish Summary Modal (WO-07) */}
      {isFinishModalOpen && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                {lang === 'id' ? 'Latihan Selesai!' : 'Workout Complete!'}
              </h2>
              <p className="text-xs text-mutedText mt-1">
                {lang === 'id' ? 'Kerja keras hari ini terbayar.' : 'Great consistency today.'}
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="bg-card p-2.5 rounded-xl border border-surfaceBorder">
                <span className="text-[10px] text-mutedText block">{t('duration', lang)}</span>
                <span className="text-base font-bold font-mono text-white">{summaryData.durationMin}m</span>
              </div>
              <div className="bg-card p-2.5 rounded-xl border border-surfaceBorder">
                <span className="text-[10px] text-mutedText block">{t('total_volume', lang)}</span>
                <span className="text-base font-bold font-mono text-white">{summaryData.totalVolumeKg}kg</span>
              </div>
              <div className="bg-card p-2.5 rounded-xl border border-surfaceBorder">
                <span className="text-[10px] text-mutedText block">{t('set', lang)}</span>
                <span className="text-base font-bold font-mono text-white">{summaryData.totalSetsCompleted}</span>
              </div>
            </div>

            {/* PR Highlights if any */}
            {summaryData.prsAchieved.length > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-left">
                <div className="flex items-center gap-1.5 text-warning text-xs font-bold mb-1">
                  <Flame className="w-4 h-4 fill-warning" />
                  <span>{t('new_pr', lang)}</span>
                </div>
                <p className="text-xs text-slate-200">
                  {summaryData.prsAchieved.join(', ')}
                </p>
              </div>
            )}

            {/* Progressive Overload Next Session Suggestion */}
            <div className="bg-card border border-primary/20 rounded-xl p-3 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                {t('progression_alert', lang)}
              </span>
              <p className="text-xs text-mutedText leading-relaxed">
                {summaryData.nextSuggestion}
              </p>
            </div>

            {/* CTA Return to Today */}
            <button
              onClick={() => {
                window.dispatchEvent(new Event('lean_data_changed'));
                router.push('/today');
              }}
              className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-sm shadow-lg shadow-primary/25 active:scale-95 transition-all"
            >
              {lang === 'id' ? 'Kembali ke Hari Ini' : 'Return to Today'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
