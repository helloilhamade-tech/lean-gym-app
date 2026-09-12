'use client';

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Dumbbell, ArrowUp, ArrowDown } from "lucide-react";
import { db } from '@/lib/db/dexie-db';
import { Exercise, Workout, WorkoutExercise } from '@/lib/db/schema';

interface RoutineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function RoutineEditorModal({ isOpen, onClose, onSaved }: RoutineEditorModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [durationMin, setDurationMin] = useState(50);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [routineItems, setRoutineItems] = useState<
    Array<{
      exercise: Exercise;
      targetSets: number;
      targetReps: string;
      restSec: number;
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadEx() {
      const list = await db.exercises.toArray();
      setAllExercises(list);
      if (list.length > 0) {
        setSelectedExerciseId(list[0].id);
      }
    }
    if (isOpen) {
      loadEx();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddExercise = () => {
    const ex = allExercises.find((e) => e.id === selectedExerciseId);
    if (!ex) return;

    setRoutineItems((prev) => [
      ...prev,
      {
        exercise: ex,
        targetSets: 3,
        targetReps: '8-10',
        restSec: 90,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setRoutineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setRoutineItems((prev) => {
      const clone = [...prev];
      const temp = clone[index - 1];
      clone[index - 1] = clone[index];
      clone[index] = temp;
      return clone;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === routineItems.length - 1) return;
    setRoutineItems((prev) => {
      const clone = [...prev];
      const temp = clone[index + 1];
      clone[index + 1] = clone[index];
      clone[index] = temp;
      return clone;
    });
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim() || routineItems.length === 0) return;
    setIsSaving(true);
    try {
      const profile = await db.profiles.toCollection().first();
      const profileId = profile?.id || 'usr-demo-01';
      const newWorkoutId = `wkt-custom-${Date.now()}`;

      // Save Workout record
      const newWorkout: Workout = {
        id: newWorkoutId,
        profile_id: profileId,
        name: routineName.trim(),
        scheduled_at: new Date().toISOString().split('T')[0],
        status: 'scheduled',
        duration_min: durationMin,
        created_at: new Date().toISOString(),
      };
      await db.workouts.put(newWorkout);

      // Save WorkoutExercises and sets
      for (let i = 0; i < routineItems.length; i++) {
        const item = routineItems[i];
        const weId = `we-${newWorkoutId}-${i + 1}`;
        await db.workoutExercises.put({
          id: weId,
          workout_id: newWorkoutId,
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
            set_type: 'normal',
            weight_kg: 15,
            reps: 8,
            completed: false,
            sync_status: 'synced',
          });
        }
      }

      if (onSaved) onSaved();
      onClose();
      setRoutineName('');
      setRoutineItems([]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[90vh] flex flex-col bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Buat Sesi / Rutinitas Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              Nama Sesi / Rutinitas
            </label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="cth. Push Day (Dada & Bahu)"
              className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              Estimasi Durasi (Menit)
            </label>
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value, 10) || 45)}
              className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Add exercise selector */}
          <div className="pt-2 border-t border-surfaceBorder/60 space-y-2">
            <label className="text-[10px] font-semibold text-mutedText block">
              Pilih Gerakan untuk Ditambahkan
            </label>
            <div className="flex gap-2">
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="flex-1 bg-card border border-surfaceBorder rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                {allExercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name_id || e.name} ({e.muscle_group})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddExercise}
                className="px-3 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exercise items list */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
              Daftar Gerakan ({routineItems.length})
            </span>

            {routineItems.length === 0 ? (
              <p className="text-xs text-subtleText text-center py-4 bg-card rounded-xl">
                Belum ada gerakan dipilih.
              </p>
            ) : (
              routineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-surfaceBorder rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block text-xs">
                      {idx + 1}. {item.exercise.name_id || item.exercise.name}
                    </span>
                    <span className="text-[10px] text-mutedText">
                      {item.targetSets} set • {item.targetReps} reps • {item.restSec}s rest
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 text-mutedText hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === routineItems.length - 1}
                      className="p-1 text-mutedText hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-subtleText hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-surfaceBorder">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-card text-mutedText hover:text-white text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handleSaveRoutine}
            disabled={!routineName.trim() || routineItems.length === 0 || isSaving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
          >
            Simpan Rutinitas
          </button>
        </div>
      </div>
    </div>
  );
}
