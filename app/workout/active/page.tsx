'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ArrowRightLeft,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import {
  Workout,
  WorkoutExercise,
  SetEntry,
  Exercise,
  ExerciseHistory,
  MuscleGroup,
} from '@/lib/db/schema';
import { SEED_EXERCISES } from '@/lib/db/seed-data';
import { getLocalDateString } from '@/lib/domain/calendar-sync';
import { generateAndSaveFocusWorkout } from '@/lib/domain/workout-generator';
import {
  calculateEst1RM,
  calculateTotalVolume,
  evaluateProgression,
  checkPersonalRecords,
  PRStatus,
} from '@/lib/domain/progressive-overload';
import { RestTimer } from '@/components/workout/RestTimer';
import { Language, t } from '@/lib/domain/i18n';
import { ExerciseIllustration } from '@/components/ui/ExerciseIllustration';
import { BodyAnatomyVisualizer } from '@/components/ui/BodyAnatomyVisualizer';
import { ExerciseSwapModal } from '@/components/workout/ExerciseSwapModal';

interface ActiveExerciseData {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  previousSets: Array<{ weightKg: number; reps: number }>;
  currentSets: SetEntry[];
  progressionNote?: string;
  isPR?: boolean;
}

function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workoutIdParam = searchParams.get('id');
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

  // Exercise Swap Modal State
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapTargetExercise, setSwapTargetExercise] = useState<Exercise | null>(null);
  const [swapTargetWEId, setSwapTargetWEId] = useState<string | null>(null);
  const [swapTargetIndex, setSwapTargetIndex] = useState<number | null>(null);

  // Body Anatomy Visualizer Collapsible State
  const [showAnatomy, setShowAnatomy] = useState(false);

  // Active targeted muscles in today's workout
  const activeMuscles: MuscleGroup[] = Array.from(
    new Set(exercisesData.map((e) => e.exercise.muscle_group as MuscleGroup))
  );

  const handleExerciseSwapped = (newExercise: Exercise) => {
    if (swapTargetIndex !== null) {
      setExercisesData((prev) => {
        const next = [...prev];
        next[swapTargetIndex] = {
          ...next[swapTargetIndex],
          exercise: newExercise,
        };
        return next;
      });
    }
  };

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
        const localToday = getLocalDateString();
        const isoToday = new Date().toISOString().split('T')[0];
        let w: Workout | undefined;

        // 1. If explicit workout ID provided in URL (?id=...)
        if (workoutIdParam) {
          const directW = await db.workouts.get(workoutIdParam);
          if (directW) {
            w = directW;
          }
        }

        // 2. If not found or no param, search for today's workout (local or ISO)
        if (!w) {
          const todayWorkouts = await db.workouts
            .filter((item) => item.scheduled_at === localToday || item.scheduled_at === isoToday)
            .toArray();

          if (todayWorkouts.length > 0) {
            // Pick in_progress if active, otherwise the newest one created today
            w = todayWorkouts.find((item) => item.status === 'in_progress') || todayWorkouts[todayWorkouts.length - 1];
          }
        }

        // 3. If still not found, check if there is an in_progress workout from recent sessions
        if (!w) {
          const inProgress = await db.workouts
            .filter((item) => item.status === 'in_progress')
            .toArray();
          if (inProgress.length > 0) {
            w = inProgress[inProgress.length - 1];
          }
        }

        // 4. If no workout exists at all, generate a fresh workout with real exercises & sets
        if (!w) {
          const generated = await generateAndSaveFocusWorkout({
            focus: 'upper',
            dateStr: localToday,
          });
          w = generated.workout;
        }

        // Ensure status is marked in_progress and update started_at
        if (w.status !== 'in_progress') {
          await db.workouts.update(w.id, {
            status: 'in_progress',
            started_at: w.started_at || new Date().toISOString(),
          });
          w.status = 'in_progress';
        }

        // Reset any other stale in_progress workouts across DB to avoid future collisions
        const otherInProgress = await db.workouts
          .filter((item) => item.id !== w!.id && item.status === 'in_progress')
          .toArray();
        for (const o of otherInProgress) {
          await db.workouts.update(o.id, { status: 'completed' });
        }

        setWorkout(w);

        // Fetch workout exercises
        let weList = await db.workoutExercises
          .where('workout_id')
          .equals(w.id)
          .sortBy('sort_order');

        // Fallback safety: If this workout has no exercises attached, auto-populate from catalog
        if (weList.length === 0) {
          let allEx = await db.exercises.toArray();
          if (allEx.length === 0) allEx = SEED_EXERCISES;
          const fallbackCandidates = allEx.slice(0, 4);
          for (let idx = 0; idx < fallbackCandidates.length; idx++) {
            const ex = fallbackCandidates[idx];
            const weId = `we-${w.id}-${idx + 1}`;
            const newWE: WorkoutExercise = {
              id: weId,
              workout_id: w.id,
              exercise_id: ex.id,
              sort_order: idx + 1,
              target_sets: 3,
              target_reps: '8-10',
              rest_sec: 90,
            };
            await db.workoutExercises.put(newWE);
            weList.push(newWE);
          }
        }

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
  }, [workoutIdParam]);

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
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-surfaceBorder flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/today')}
            className="p-1.5 -ml-1 rounded-full hover:bg-card text-mutedText hover:text-white transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-white line-clamp-1">
              {workout?.name || (lang === 'id' ? 'Sesi Latihan Aktif' : 'Active Workout Session')}
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

      {/* 2. Muscle Target Anatomy Preview (Collapsible) */}
      <div className="bg-card border border-surfaceBorder rounded-2xl overflow-hidden transition-all">
        <button
          onClick={() => setShowAnatomy(!showAnatomy)}
          className="w-full p-3.5 flex items-center justify-between hover:bg-surface/50 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white block">
                Otot Target Sesi Ini
              </span>
              <span className="text-[10px] text-mutedText">
                {activeMuscles.length > 0
                  ? activeMuscles.map((m) => m.toUpperCase()).join(' • ')
                  : 'Fokus Tubuh'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
            <span>{showAnatomy ? 'Tutup' : 'Lihat Visual'}</span>
            {showAnatomy ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showAnatomy && (
          <div className="p-3 pt-0 border-t border-surfaceBorder/60 flex flex-col items-center">
            <p className="text-[11px] text-mutedText text-center mb-2">
              Bagian tubuh yang menyala hijau adalah target stimulasi latihan hari ini.
            </p>
            <BodyAnatomyVisualizer
              activeMuscles={activeMuscles}
              size="sm"
              showLabels={false}
            />
          </div>
        )}
      </div>

      {/* 3. Exercises List */}
      <div className="space-y-4">
        {exercisesData.map((exData, exIdx) => {
          return (
            <div
              key={exData.workoutExercise.id}
              className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-3 transition-all"
            >
              {/* Exercise Title & Target Specs */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-card border border-surfaceBorder/70 p-1 flex items-center justify-center shrink-0">
                    <ExerciseIllustration
                      exerciseId={exData.exercise.id}
                      name={exData.exercise.name}
                      muscleGroup={exData.exercise.muscle_group}
                      size="md"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                      <span className="capitalize text-primary font-bold">{exData.exercise.muscle_group}</span>
                      <span>•</span>
                      <span>Target: {exData.workoutExercise.target_reps} reps</span>
                      <span>•</span>
                      <span>Rest: {exData.workoutExercise.rest_sec}s</span>
                    </div>
                  </div>
                </div>

                {/* In-Workout Swap Button (Inspired by Buffro Image 2) */}
                <button
                  onClick={() => {
                    setSwapTargetExercise(exData.exercise);
                    setSwapTargetWEId(exData.workoutExercise.id);
                    setSwapTargetIndex(exIdx);
                    setIsSwapModalOpen(true);
                  }}
                  className="py-1 px-2.5 rounded-lg bg-card hover:bg-surfaceBorder border border-surfaceBorder text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                  title="Cari alternatif mesin/alat lain"
                >
                  <ArrowRightLeft className="w-3 h-3 text-accent" />
                  <span>Ganti</span>
                </button>
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

      {/* 5. In-Workout Exercise Swap Sheet (Inspired by Buffro Image 2) */}
      <ExerciseSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => {
          setIsSwapModalOpen(false);
          setSwapTargetExercise(null);
          setSwapTargetWEId(null);
          setSwapTargetIndex(null);
        }}
        currentExercise={swapTargetExercise || undefined}
        workoutExerciseId={swapTargetWEId || undefined}
        onSwapped={handleExerciseSwapped}
      />
    </div>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ActiveWorkoutContent />
    </Suspense>
  );
}
