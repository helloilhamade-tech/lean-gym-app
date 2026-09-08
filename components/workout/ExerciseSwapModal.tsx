'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Sparkles, Check, ArrowRightLeft } from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Exercise, WorkoutExercise } from '@/lib/db/schema';
import { ExerciseIllustration } from '@/components/ui/ExerciseIllustration';

interface ExerciseSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise?: Exercise;
  workoutExerciseId?: string;
  onSwapped?: (newExercise: Exercise) => void;
}

export function ExerciseSwapModal({
  isOpen,
  onClose,
  currentExercise,
  workoutExerciseId,
  onSwapped,
}: ExerciseSwapModalProps) {
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    async function loadAlternatives() {
      if (!currentExercise) return;
      // Find all exercises targeting the same muscle group
      const list = await db.exercises
        .where('muscle_group')
        .equals(currentExercise.muscle_group)
        .toArray();

      // Filter out the current exercise itself
      const alts = list.filter((e) => e.id !== currentExercise.id);
      setAlternatives(alts);
    }

    if (isOpen && currentExercise) {
      loadAlternatives();
    }
  }, [isOpen, currentExercise]);

  if (!isOpen || !currentExercise) return null;

  const handleSwapIn = async (newEx: Exercise) => {
    if (!workoutExerciseId) return;
    setIsSwapping(true);
    try {
      await db.workoutExercises.update(workoutExerciseId, {
        exercise_id: newEx.id,
      });

      if (onSwapped) onSwapped(newEx);
      onClose();
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header matching Image 2 */}
        <div className="flex items-start justify-between pb-2 border-b border-surfaceBorder">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <ArrowRightLeft className="w-3 h-3" />
              <span>Ganti Alternatif Gerakan</span>
            </div>
            <h3 className="text-sm font-extrabold text-white">
              Cari Alternatif untuk {currentExercise.name}
            </h3>
            <p className="text-[11px] text-mutedText mt-0.5 leading-relaxed">
              Pilihan mesin/alat lain yang sama-sama melatih otot{' '}
              <strong className="text-primary">{currentExercise.muscle_group}</strong> Anda.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alternatives List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {alternatives.length === 0 ? (
            <p className="text-xs text-mutedText text-center py-6">
              Tidak ada alternatif gerakan lain di grup otot ini.
            </p>
          ) : (
            alternatives.map((alt) => (
              <div
                key={alt.id}
                className="bg-card border border-surfaceBorder rounded-2xl p-3 flex items-center justify-between hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ExerciseIllustration
                    exerciseId={alt.id}
                    name={alt.name}
                    muscleGroup={alt.muscle_group}
                    size="sm"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {alt.name_id || alt.name}
                    </h4>
                    <p className="text-[10px] text-subtleText capitalize mt-0.5">
                      {alt.muscle_group} • {alt.equipment}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSwapIn(alt)}
                  disabled={isSwapping}
                  className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-purple-600/20"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Swap in</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
