'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Dumbbell,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  CheckCircle2,
} from "lucide-react";
import { db } from '@/lib/db/dexie-db';
import { Program, Exercise } from "@/lib/db/schema";
import { ExerciseIllustration } from '@/components/ui/ExerciseIllustration';
import { ExerciseSwapModal } from '@/components/workout/ExerciseSwapModal';

interface ProgramDayRoutine {
  dayName: string;
  dayShort: string;
  splitTag: string;
  isRest: boolean;
  exercises: Array<{
    exercise: Exercise;
    targetSets: number;
    targetReps: string;
    restSec: number;
    warmupSetsCount: number;
  }>;
}

export default function ProgramEditorPage() {
  const router = useRouter();
  const [programName, setProgramName] = useState('PPL x Upper Lower Custom');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [expandedExIdx, setExpandedExIdx] = useState<number | null>(0);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [selectedExToAdd, setSelectedExToAdd] = useState('');

  // Swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetIdx, setSwapTargetIdx] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 7 Days Weekly Program Structure
  const [weekDays, setWeekDays] = useState<ProgramDayRoutine[]>([
    { dayName: 'Senin', dayShort: 'Mon', splitTag: 'Push', isRest: false, exercises: [] },
    { dayName: 'Selasa', dayShort: 'Tue', splitTag: 'Pull', isRest: false, exercises: [] },
    { dayName: 'Rabu', dayShort: 'Wed', splitTag: 'Legs', isRest: false, exercises: [] },
    { dayName: 'Kamis', dayShort: 'Thu', splitTag: 'Rest', isRest: true, exercises: [] },
    { dayName: 'Jumat', dayShort: 'Fri', splitTag: 'Upper', isRest: false, exercises: [] },
    { dayName: 'Sabtu', dayShort: 'Sat', splitTag: 'Lower', isRest: false, exercises: [] },
    { dayName: 'Minggu', dayShort: 'Sun', splitTag: 'Rest', isRest: true, exercises: [] },
  ]);

  useEffect(() => {
    async function initData() {
      const exList = await db.exercises.toArray();
      setAllExercises(exList);
      if (exList.length > 0) setSelectedExToAdd(exList[0].id);

      // Pre-fill initial exercises for Push / Pull / Legs / Upper / Lower
      const bench = exList.find((e) => e.name.includes('Bench Press')) || exList[0];
      const incline = exList.find((e) => e.name.includes('Incline')) || exList[0];
      const latRaise = exList.find((e) => e.name.includes('Lateral')) || exList[0];
      const pushdown = exList.find((e) => e.name.includes('Pushdown')) || exList[0];
      const pulldown = exList.find((e) => e.name.includes('Pulldown')) || exList[1];
      const row = exList.find((e) => e.name.includes('Row')) || exList[1];
      const curl = exList.find((e) => e.name.includes('Curl')) || exList[2];
      const squat = exList.find((e) => e.name.includes('Squat')) || exList[3];
      const legPress = exList.find((e) => e.name.includes('Leg Press')) || exList[3];

      setWeekDays([
        {
          dayName: 'Senin',
          dayShort: 'Mon',
          splitTag: 'Push',
          isRest: false,
          exercises: [
            { exercise: bench, targetSets: 4, targetReps: '10', restSec: 120, warmupSetsCount: 2 },
            { exercise: incline, targetSets: 4, targetReps: '10', restSec: 120, warmupSetsCount: 1 },
            { exercise: latRaise, targetSets: 3, targetReps: '12', restSec: 90, warmupSetsCount: 0 },
            { exercise: pushdown, targetSets: 3, targetReps: '12', restSec: 90, warmupSetsCount: 0 },
          ],
        },
        {
          dayName: 'Selasa',
          dayShort: 'Tue',
          splitTag: 'Pull',
          isRest: false,
          exercises: [
            { exercise: pulldown, targetSets: 4, targetReps: '10', restSec: 120, warmupSetsCount: 2 },
            { exercise: row, targetSets: 4, targetReps: '10', restSec: 120, warmupSetsCount: 1 },
            { exercise: curl, targetSets: 3, targetReps: '12', restSec: 90, warmupSetsCount: 0 },
          ],
        },
        {
          dayName: 'Rabu',
          dayShort: 'Wed',
          splitTag: 'Legs',
          isRest: false,
          exercises: [
            { exercise: squat, targetSets: 4, targetReps: '8', restSec: 150, warmupSetsCount: 2 },
            { exercise: legPress, targetSets: 3, targetReps: '10', restSec: 120, warmupSetsCount: 1 },
          ],
        },
        { dayName: 'Kamis', dayShort: 'Thu', splitTag: 'Rest', isRest: true, exercises: [] },
        {
          dayName: 'Jumat',
          dayShort: 'Fri',
          splitTag: 'Upper',
          isRest: false,
          exercises: [
            { exercise: incline, targetSets: 4, targetReps: '8', restSec: 120, warmupSetsCount: 2 },
            { exercise: pulldown, targetSets: 4, targetReps: '10', restSec: 120, warmupSetsCount: 1 },
            { exercise: latRaise, targetSets: 3, targetReps: '12', restSec: 90, warmupSetsCount: 0 },
          ],
        },
        {
          dayName: 'Sabtu',
          dayShort: 'Sat',
          splitTag: 'Lower',
          isRest: false,
          exercises: [
            { exercise: squat, targetSets: 4, targetReps: '8', restSec: 150, warmupSetsCount: 2 },
            { exercise: legPress, targetSets: 3, targetReps: '10', restSec: 120, warmupSetsCount: 1 },
          ],
        },
        { dayName: 'Minggu', dayShort: 'Sun', splitTag: 'Rest', isRest: true, exercises: [] },
      ]);
    }
    initData();
  }, []);

  const currentDay = weekDays[selectedDayIdx];

  // Add exercise to current day
  const handleAddExerciseToCurrentDay = () => {
    const ex = allExercises.find((e) => e.id === selectedExToAdd);
    if (!ex) return;

    setWeekDays((prev) => {
      const clone = [...prev];
      clone[selectedDayIdx].exercises.push({
        exercise: ex,
        targetSets: 3,
        targetReps: '10',
        restSec: 90,
        warmupSetsCount: 0,
      });
      return clone;
    });
    setIsAddingExercise(false);
  };

  const handleRemoveExercise = (idx: number) => {
    setWeekDays((prev) => {
      const clone = [...prev];
      clone[selectedDayIdx].exercises = clone[selectedDayIdx].exercises.filter((_, i) => i !== idx);
      return clone;
    });
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setWeekDays((prev) => {
      const clone = [...prev];
      const list = clone[selectedDayIdx].exercises;
      const temp = list[idx - 1];
      list[idx - 1] = list[idx];
      list[idx] = temp;
      return clone;
    });
  };

  const handleMoveDown = (idx: number) => {
    if (idx === currentDay.exercises.length - 1) return;
    setWeekDays((prev) => {
      const clone = [...prev];
      const list = clone[selectedDayIdx].exercises;
      const temp = list[idx + 1];
      list[idx + 1] = list[idx];
      list[idx] = temp;
      return clone;
    });
  };

  const handleSaveAndEnable = async () => {
    setIsSaving(true);
    try {
      const profile = await db.profiles.toCollection().first();
      const profileId = profile?.id || 'usr-demo-01';

      // 1. Update/Create active program
      const progId = `prog-${Date.now()}`;
      const allPrograms = await db.programs.toArray();
      for (const p of allPrograms) {
        if (p.active) {
          await db.programs.update(p.id, { active: false });
        }
      }
      await db.programs.put({
        id: progId,
        profile_id: profileId,
        name: programName.trim(),
        split_type: 'custom',
        days_per_week: weekDays.filter((d) => !d.isRest).length,
        start_date: new Date().toISOString().split('T')[0],
        active: true,
        created_at: new Date().toISOString(),
      });

      // 2. Set today's workout to match today's day of week
      const dayOfWeekIdx = (new Date().getDay() + 6) % 7; // Mon=0 ... Sun=6
      const todayRoutine = weekDays[dayOfWeekIdx] || weekDays[0];

      if (!todayRoutine.isRest && todayRoutine.exercises.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const newWktId = `wkt-active-today`;

        // Clear existing today workout
        await db.workouts.where('scheduled_at').equals(todayStr).delete();

        await db.workouts.put({
          id: newWktId,
          profile_id: profileId,
          program_id: progId,
          name: `${todayRoutine.splitTag} Day — ${programName}`,
          scheduled_at: todayStr,
          status: 'scheduled',
          duration_min: 50,
          created_at: new Date().toISOString(),
        });

        for (let i = 0; i < todayRoutine.exercises.length; i++) {
          const item = todayRoutine.exercises[i];
          const weId = `we-${newWktId}-${i + 1}`;
          await db.workoutExercises.put({
            id: weId,
            workout_id: newWktId,
            exercise_id: item.exercise.id,
            sort_order: i + 1,
            target_sets: item.targetSets,
            target_reps: item.targetReps,
            rest_sec: item.restSec,
          });

          for (let s = 1; s <= item.targetSets; s++) {
            await db.sets.put({
              id: `set-${weId}-${s}`,
              workout_exercise_id: weId,
              set_no: s,
              set_type: s <= item.warmupSetsCount ? 'warmup' : 'normal',
              weight_kg: 15,
              reps: parseInt(item.targetReps, 10) || 10,
              completed: false,
              sync_status: 'synced',
            });
          }
        }
      }

      setSuccessMsg('Program berhasil disimpan dan diaktifkan!');
      setTimeout(() => {
        window.dispatchEvent(new Event('lean_data_changed'));
        router.push('/today');
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200">
      {/* 1. Header with Back Button and Program Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/workout')}
            className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="text-base font-black text-white bg-transparent border-b border-transparent focus:border-primary focus:outline-none tracking-tight"
            />
            <p className="text-[10px] text-mutedText">Ketuk judul untuk mengubah nama program</p>
          </div>
        </div>
      </div>

      {/* 2. Days Weekly Grid Selector (Mon - Sun matching Image 3) */}
      <div className="grid grid-cols-7 gap-1 bg-surface border border-surfaceBorder rounded-2xl p-1.5">
        {weekDays.map((d, idx) => {
          const isSelected = selectedDayIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-mutedText hover:text-white'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider">{d.dayShort}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md mt-1 font-bold ${
                  d.isRest
                    ? 'text-subtleText bg-card/60'
                    : isSelected
                    ? 'text-white bg-purple-700'
                    : 'text-purple-400 bg-purple-950/40'
                }`}
              >
                {d.splitTag}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Routine Header Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-white">
            {currentDay.dayName}: {currentDay.splitTag} Day
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Custom Generated
          </span>
        </div>

        {!currentDay.isRest && (
          <button
            onClick={() => setIsAddingExercise(true)}
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Gerakan</span>
          </button>
        )}
      </div>

      {/* 4. Rest Day State */}
      {currentDay.isRest ? (
        <div className="bg-surface border border-surfaceBorder rounded-3xl p-8 text-center space-y-2">
          <Dumbbell className="w-8 h-8 text-subtleText mx-auto" />
          <h3 className="text-sm font-bold text-white">Hari Istirahat & Pemulihan</h3>
          <p className="text-xs text-mutedText max-w-xs mx-auto">
            Otot tumbuh dan pulih saat istirahat. Anda bisa menambahkan jalan santai ringan atau peregangan di hari ini.
          </p>
          <button
            onClick={() => {
              setWeekDays((prev) => {
                const clone = [...prev];
                clone[selectedDayIdx].isRest = false;
                clone[selectedDayIdx].splitTag = 'Training';
                return clone;
              });
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-card border border-surfaceBorder text-xs text-primary font-bold hover:border-primary"
          >
            Ubah Jadi Hari Latihan
          </button>
        </div>
      ) : (
        /* Exercises List matching Image 3 */
        <div className="space-y-3">
          {currentDay.exercises.length === 0 ? (
            <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 text-center">
              <p className="text-xs text-mutedText">Belum ada gerakan di hari ini.</p>
              <button
                onClick={() => setIsAddingExercise(true)}
                className="mt-2 px-3.5 py-2 rounded-xl bg-primary text-black font-bold text-xs"
              >
                + Tambah Gerakan
              </button>
            </div>
          ) : (
            currentDay.exercises.map((item, exIdx) => {
              const isExpanded = expandedExIdx === exIdx;
              return (
                <div
                  key={exIdx}
                  className="bg-surface border border-surfaceBorder rounded-2xl p-3.5 space-y-2 transition-all shadow-sm"
                >
                  {/* Exercise card header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExerciseIllustration
                        exerciseId={item.exercise.id}
                        name={item.exercise.name}
                        muscleGroup={item.exercise.muscle_group}
                        size="md"
                      />
                      <div>
                        <h4 className="text-sm font-extrabold text-white">
                          {item.exercise.name_id || item.exercise.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-mutedText mt-0.5">
                          <span>
                            {item.targetSets} sets × {item.targetReps} reps
                          </span>
                          <span>•</span>
                          <span>{Math.round(item.restSec / 60)}m rest</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSwapTargetIdx(exIdx);
                          setSwapModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-card hover:bg-surfaceBorder text-purple-400 text-xs font-semibold"
                        title="Swap Exercise"
                      >
                        Swap
                      </button>
                      <button
                        onClick={() => setExpandedExIdx(isExpanded ? null : exIdx)}
                        className="p-1.5 rounded-lg text-mutedText hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Set Details (Matching Image 3) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-surfaceBorder/60 space-y-1.5 animate-in fade-in duration-150">
                      {Array.from({ length: item.targetSets }).map((_, sIdx) => {
                        const isWarmup = sIdx < item.warmupSetsCount;
                        return (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-card/60 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-mutedText font-mono font-bold">
                                Set {sIdx + 1}
                              </span>
                              {isWarmup ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 font-semibold">
                                  Warm-up
                                </span>
                              ) : null}
                            </div>
                            <span className="font-mono text-slate-200">
                              {isWarmup ? '15 reps' : `${item.targetReps} reps`}
                            </span>
                          </div>
                        );
                      })}

                      {/* Order and delete controls */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveUp(exIdx)}
                            disabled={exIdx === 0}
                            className="p-1.5 rounded-lg bg-card text-mutedText hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(exIdx)}
                            disabled={exIdx === currentDay.exercises.length - 1}
                            className="p-1.5 rounded-lg bg-card text-mutedText hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveExercise(exIdx)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Gerakan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Add Exercise Sheet Modal */}
      {isAddingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white">
              Tambah Gerakan ke {currentDay.dayName}
            </h3>

            <div>
              <label className="text-xs text-mutedText block mb-1">Pilih dari Katalog Gerakan</label>
              <select
                value={selectedExToAdd}
                onChange={(e) => setSelectedExToAdd(e.target.value)}
                className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
              >
                {allExercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name_id || e.name} ({e.muscle_group} • {e.equipment})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddingExercise(false)}
                className="flex-1 py-2.5 rounded-xl bg-card text-mutedText hover:text-white text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleAddExerciseToCurrentDay}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Exercise Swap Modal */}
      {swapTargetIdx !== null && currentDay.exercises[swapTargetIdx] && (
        <ExerciseSwapModal
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSwapTargetIdx(null);
          }}
          currentExercise={currentDay.exercises[swapTargetIdx].exercise}
          onSwapped={(newEx) => {
            setWeekDays((prev) => {
              const clone = [...prev];
              clone[selectedDayIdx].exercises[swapTargetIdx].exercise = newEx;
              return clone;
            });
          }}
        />
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="fixed top-14 left-0 right-0 z-50 max-w-[400px] mx-auto px-4">
          <div className="bg-primary text-black p-3 rounded-2xl font-bold text-xs text-center shadow-2xl flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* 7. Sticky Bottom Actions (Matching Image 3) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-background/95 backdrop-blur-md border-t border-surfaceBorder p-3 flex gap-2.5">
        <button
          onClick={() => {
            setSuccessMsg('Draft program tersimpan di perangkat.');
            setTimeout(() => setSuccessMsg(null), 2000);
          }}
          className="flex-1 py-3.5 rounded-2xl bg-card border border-surfaceBorder hover:border-mutedText text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Save className="w-4 h-4 text-mutedText" />
          <span>Simpan Draft</span>
        </button>

        <button
          onClick={handleSaveAndEnable}
          disabled={isSaving}
          className="flex-[2] py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4 stroke-[3px]" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan & Aktifkan'}</span>
        </button>
      </div>
    </div>
  );
}
