'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Dumbbell,
  Search,
  Filter,
  Check,
  Plus,
  Info,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  MUSCLE_BREAKDOWN,
  EXERCISE_EQUIPMENT_GUIDE,
  MuscleCategory,
  EquipmentCategory,
  MuscleExerciseGuide,
} from '@/lib/domain/muscle-directory';
import { db } from '@/lib/db/dexie-db';
import { WorkoutExercise, SetEntry, Exercise } from '@/lib/db/schema';

export default function MuscleGuidePage() {
  const router = useRouter();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleCategory>('chest');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedExerciseId, setAddedExerciseId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const muscleInfo = MUSCLE_BREAKDOWN[selectedMuscle];

  // Filter exercises
  const filteredExercises = EXERCISE_EQUIPMENT_GUIDE.filter((item) => {
    const matchMuscle = item.muscleCategory === selectedMuscle;
    const matchEquipment =
      selectedEquipment === 'all' || item.equipment === selectedEquipment;
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subMuscleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipmentNameId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchMuscle && matchEquipment && matchSearch;
  });

  // Handle adding exercise to today's active workout
  const handleAddToTodayWorkout = async (guide: MuscleExerciseGuide) => {
    setIsAdding(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let workout = await db.workouts
        .filter((w) => w.scheduled_at === todayStr)
        .first();

      if (!workout) {
        const profile = await db.profiles.toCollection().first();
        workout = {
          id: `wkt-${Date.now()}`,
          profile_id: profile?.id || 'usr-demo-01',
          name: 'Latihan Hari Ini (Kustom)',
          scheduled_at: todayStr,
          status: 'scheduled',
          duration_min: 55,
          created_at: new Date().toISOString(),
        };
        await db.workouts.put(workout);
      }

      // Check or create exercise entry
      let ex = await db.exercises.where('name').equals(guide.name).first();
      if (!ex) {
        ex = {
          id: `ex-${Date.now()}`,
          name: guide.name,
          name_id: guide.nameId,
          muscle_group: guide.muscleCategory as any,
          equipment: (guide.equipment === 'smith_machine' ? 'machine' : guide.equipment) as any,
          movement_pattern: 'isolation',
          difficulty: guide.difficulty,
          is_system: false,
        };
        await db.exercises.put(ex);
      }

      const existingWE = await db.workoutExercises
        .where('workout_id')
        .equals(workout.id)
        .toArray();

      const newSortOrder = existingWE.length + 1;
      const workoutExerciseId = `we-${workout.id}-${Date.now()}`;

      const newWE: WorkoutExercise = {
        id: workoutExerciseId,
        workout_id: workout.id,
        exercise_id: ex.id,
        sort_order: newSortOrder,
        target_sets: 3,
        target_reps: guide.defaultRepRange,
        rest_sec: 90,
      };

      await db.workoutExercises.put(newWE);

      // Create 3 default sets
      for (let i = 1; i <= 3; i++) {
        const newSet: SetEntry = {
          id: `set-${workoutExerciseId}-${i}`,
          workout_exercise_id: workoutExerciseId,
          set_no: i,
          set_type: 'normal',
          weight_kg: guide.equipment === 'bodyweight' ? 0 : 15,
          reps: 8,
          completed: false,
          sync_status: 'synced',
        };
        await db.sets.put(newSet);
      }

      setAddedExerciseId(guide.id);
      setTimeout(() => setAddedExerciseId(null), 2500);
      window.dispatchEvent(new Event('lean_data_changed'));
    } catch (e) {
      console.error('Failed to add exercise to workout:', e);
    } finally {
      setIsAdding(false);
    }
  };

  const muscleTabs: Array<{ id: MuscleCategory; label: string }> = [
    { id: 'chest', label: 'Dada' },
    { id: 'back', label: 'Punggung' },
    { id: 'shoulders', label: 'Bahu' },
    { id: 'arms', label: 'Lengan' },
    { id: 'legs', label: 'Kaki' },
    { id: 'core', label: 'Perut' },
  ];

  const equipmentFilters: Array<{ id: EquipmentCategory | 'all'; label: string }> = [
    { id: 'all', label: 'Semua Alat' },
    { id: 'machine', label: 'Mesin Gym' },
    { id: 'cable', label: 'Kabel (Cable)' },
    { id: 'dumbbell', label: 'Dumbbell' },
    { id: 'barbell', label: 'Barbel' },
    { id: 'bodyweight', label: 'Bodyweight' },
  ];

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* 1. Header Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/workout')}
          className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-white tracking-tight">
            Direktori Otot & Mesin Gym
          </h1>
          <p className="text-xs text-mutedText">
            Ketahui anatomi otot dan mesin yang melatihnya
          </p>
        </div>
      </div>

      {/* 2. Muscle Group Horizontal Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {muscleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedMuscle(tab.id);
              setSelectedEquipment('all');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedMuscle === tab.id
                ? 'bg-primary text-black shadow-md shadow-primary/20'
                : 'bg-surface border border-surfaceBorder text-mutedText hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Sub-Muscle Breakdown Card */}
      <section aria-label="Muscle anatomy" className="bg-surface border border-surfaceBorder rounded-2xl p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white">{muscleInfo.nameId}</h2>
            <span className="text-[10px] font-mono text-primary font-semibold">Anatomi</span>
          </div>
          <p className="text-xs text-mutedText mt-1 leading-relaxed">
            {muscleInfo.description}
          </p>
        </div>

        {/* Sub-muscles pill overview */}
        <div className="grid grid-cols-1 gap-2 pt-1 border-t border-surfaceBorder/60">
          {muscleInfo.subMuscles.map((sm) => (
            <div
              key={sm.id}
              className="bg-card/70 border border-surfaceBorder/50 rounded-xl p-2.5 text-xs"
            >
              <span className="font-bold text-slate-200 block text-[11px] text-primary">
                {sm.nameId}
              </span>
              <p className="text-[10px] text-mutedText mt-0.5">
                <strong>Fungsi:</strong> {sm.functionDesc}
              </p>
              <p className="text-[10px] text-subtleText mt-0.5">
                <strong>Peran Visual:</strong> {sm.visualRole}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Equipment Filter & Search */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {equipmentFilters.map((eq) => (
            <button
              key={eq.id}
              onClick={() => setSelectedEquipment(eq.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all ${
                selectedEquipment === eq.id
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-card border-surfaceBorder text-mutedText hover:text-white'
              }`}
            >
              {eq.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama mesin, alat, atau gerakan..."
            className="w-full bg-surface border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 5. Exercise & Gym Machine Directory List */}
      <div className="space-y-3">
        {filteredExercises.length === 0 ? (
          <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 text-center">
            <Dumbbell className="w-8 h-8 text-subtleText mx-auto mb-2" />
            <p className="text-xs text-mutedText">
              Tidak ada gerakan yang cocok dengan filter. Coba ganti filter alat.
            </p>
          </div>
        ) : (
          filteredExercises.map((guide) => {
            const isJustAdded = addedExerciseId === guide.id;
            return (
              <div
                key={guide.id}
                className="bg-surface border border-surfaceBorder hover:border-surfaceBorder/80 rounded-2xl p-4 space-y-3 shadow-sm transition-all"
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                        {guide.subMuscleId}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-card border border-surfaceBorder text-mutedText">
                        {guide.equipmentNameId}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-white">{guide.nameId}</h3>
                    <p className="text-[10px] text-subtleText font-mono">{guide.name}</p>
                  </div>
                </div>

                {/* Where to find machine in gym */}
                <div className="bg-card/80 border border-surfaceBorder/60 rounded-xl p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-accent text-[11px] font-bold">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Cari Alat Ini di Gym:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pl-5">
                    {guide.equipmentLookFor}
                  </p>
                </div>

                {/* Setup and Mind-muscle cues */}
                <div className="space-y-1 text-xs">
                  <p className="text-[11px] text-mutedText">
                    <strong className="text-slate-200">Cara Setup:</strong> {guide.setupTips}
                  </p>
                  <p className="text-[11px] text-mutedText">
                    <strong className="text-primary">Fokus Otot (Cue):</strong> {guide.mindMuscleCue}
                  </p>
                </div>

                {/* Add to Today's Workout CTA */}
                <div className="pt-1 flex items-center justify-between border-t border-surfaceBorder/60">
                  <span className="text-[10px] font-mono text-mutedText">
                    Saran: {guide.defaultRepRange}
                  </span>

                  <button
                    onClick={() => handleAddToTodayWorkout(guide)}
                    disabled={isAdding || isJustAdded}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isJustAdded
                        ? 'bg-primary text-black'
                        : 'bg-card hover:bg-surfaceBorder border border-surfaceBorder text-primary hover:border-primary'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        <span>Ditambahkan!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambahkan ke Latihan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
