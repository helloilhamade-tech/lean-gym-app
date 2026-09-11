import { db } from '@/lib/db/dexie-db';
import { Workout, WorkoutExercise, SetEntry, Exercise, MuscleGroup } from '@/lib/db/schema';
import { SEED_EXERCISES } from '@/lib/db/seed-data';
import { getLocalDateString } from './calendar-sync';

export type WorkoutFocus = 'upper' | 'lower' | 'push' | 'pull' | 'legs' | 'core' | 'rest';
export type WorkoutDuration = 30 | 45 | 60;
export type EquipmentPreference = 'gym' | 'dumbbell' | 'bodyweight';
export type EnergyLevel = 'high' | 'moderate' | 'low';

export interface FocusOption {
  id: WorkoutFocus;
  labelId: string;
  name: string;
  desc: string;
  muscles: MuscleGroup[];
  defaultDuration: number;
}

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: 'upper',
    labelId: 'Upper Body',
    name: 'Upper Body (Dada, Punggung, Bahu & Lengan)',
    desc: 'Melatih seluruh otot tubuh bagian atas secara seimbang.',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    defaultDuration: 50,
  },
  {
    id: 'lower',
    labelId: 'Lower Body',
    name: 'Lower Body (Paha, Hamstring, Bokong & Betis)',
    desc: 'Fokus kekuatan dan hipertrofi kaki untuk postur kokoh.',
    muscles: ['quads', 'hamstrings', 'calves', 'glutes'],
    defaultDuration: 50,
  },
  {
    id: 'push',
    labelId: 'Push Day',
    name: 'Push Day (Dada, Bahu Depan & Triceps)',
    desc: 'Latihan dorong untuk menebalkan dada dan bahu kekar.',
    muscles: ['chest', 'shoulders', 'triceps'],
    defaultDuration: 45,
  },
  {
    id: 'pull',
    labelId: 'Pull Day',
    name: 'Pull Day (Punggung, Traps & Biceps)',
    desc: 'Latihan tarik untuk membentuk punggung V-taper dan lengan.',
    muscles: ['back', 'biceps'],
    defaultDuration: 45,
  },
  {
    id: 'legs',
    labelId: 'Legs & Abs',
    name: 'Legs & Abs (Kaki & Otot Perut)',
    desc: 'Squat, lunges, leg press, dan penguatan otot core.',
    muscles: ['quads', 'hamstrings', 'calves', 'core'],
    defaultDuration: 50,
  },
  {
    id: 'core',
    labelId: 'Core & Cardio',
    name: 'Core & Active Recovery',
    desc: 'Fokus perut six-pack, stabilitas tulang belakang, dan jalan kaki.',
    muscles: ['core'],
    defaultDuration: 35,
  },
  {
    id: 'rest',
    labelId: 'Rest Day',
    name: 'Istirahat / Pemulihan Penuh',
    desc: 'Hari jeda agar jaringan otot pulih optimal dan siap push beban.',
    muscles: [],
    defaultDuration: 0,
  },
];

export interface GenerateWorkoutParams {
  focus: WorkoutFocus;
  durationMin?: WorkoutDuration;
  equipment?: EquipmentPreference;
  energyLevel?: EnergyLevel;
  dateStr?: string;
  profileId?: string;
}

/**
 * Filter exercises from database/seeds matching focus, equipment, and duration count
 */
export function selectExercisesForFocus(
  allExercises: Exercise[],
  focus: WorkoutFocus,
  equipment: EquipmentPreference = 'gym',
  durationMin: WorkoutDuration = 45
): Exercise[] {
  if (focus === 'rest') return [];

  const focusConfig = FOCUS_OPTIONS.find((f) => f.id === focus) || FOCUS_OPTIONS[0];
  const targetMuscles = focusConfig.muscles;

  // 1. Filter by muscle groups
  let candidates = allExercises.filter((e) => targetMuscles.includes(e.muscle_group));
  if (candidates.length === 0) {
    candidates = SEED_EXERCISES.filter((e) => targetMuscles.includes(e.muscle_group));
  }

  // 2. Filter / prioritize by equipment
  if (equipment === 'dumbbell') {
    const dbOnly = candidates.filter((e) => e.equipment === 'dumbbell' || e.equipment === 'bodyweight');
    if (dbOnly.length >= 3) candidates = dbOnly;
  } else if (equipment === 'bodyweight') {
    const bwOnly = candidates.filter((e) => e.equipment === 'bodyweight');
    if (bwOnly.length >= 2) candidates = bwOnly;
  }

  // 3. Determine number of exercises based on duration
  const targetCount = durationMin === 30 ? 3 : durationMin === 60 ? 6 : 4;

  // 4. Ensure diverse muscle distribution (e.g. 1 chest, 1 back, 1 shoulder, 1 arm)
  const selected: Exercise[] = [];
  const muscleTracker = new Set<string>();

  for (const ex of candidates) {
    if (selected.length >= targetCount) break;
    if (!muscleTracker.has(ex.muscle_group) || selected.length >= targetMuscles.length) {
      selected.push(ex);
      muscleTracker.add(ex.muscle_group);
    }
  }

  // Fill up if still less than targetCount
  if (selected.length < targetCount) {
    for (const ex of candidates) {
      if (selected.length >= targetCount) break;
      if (!selected.some((s) => s.id === ex.id)) {
        selected.push(ex);
      }
    }
  }

  return selected;
}

/**
 * Generate a tailored workout and persist directly into Dexie DB
 */
export async function generateAndSaveFocusWorkout(
  params: GenerateWorkoutParams
): Promise<{ workout: Workout; exercises: Exercise[] }> {
  const localToday = getLocalDateString();
  const isoToday = new Date().toISOString().split('T')[0];
  const {
    focus,
    durationMin = 45,
    equipment = 'gym',
    energyLevel = 'moderate',
    dateStr = localToday,
  } = params;

  const profile = await db.profiles.toCollection().first();
  const profileId = params.profileId || profile?.id || 'usr-default';

  // Load existing exercises from DB or seed
  let dbExercises = await db.exercises.toArray();
  if (dbExercises.length === 0) {
    dbExercises = SEED_EXERCISES;
  }

  const focusConfig = FOCUS_OPTIONS.find((f) => f.id === focus) || FOCUS_OPTIONS[0];

  // Helper to remove any workouts for this date
  const existingForDate = await db.workouts
    .filter((w) => w.scheduled_at === dateStr || (dateStr === localToday && w.scheduled_at === isoToday))
    .toArray();

  for (const ew of existingForDate) {
    const oldWE = await db.workoutExercises.where('workout_id').equals(ew.id).toArray();
    for (const we of oldWE) {
      await db.sets.where('workout_exercise_id').equals(we.id).delete();
    }
    await db.workoutExercises.where('workout_id').equals(ew.id).delete();
    await db.workouts.delete(ew.id);
  }

  // Clear any old in_progress flags across DB so the new focus workout is the sole candidate
  const staleInProgress = await db.workouts.filter((w) => w.status === 'in_progress').toArray();
  for (const st of staleInProgress) {
    await db.workouts.update(st.id, { status: 'completed' });
  }

  // If focus is REST DAY:
  if (focus === 'rest') {
    const restWorkout: Workout = {
      id: `wkt-rest-${dateStr}-${Date.now()}`,
      profile_id: profileId,
      name: 'Hari Istirahat & Pemulihan Aktif',
      scheduled_at: dateStr,
      status: 'completed',
      duration_min: 0,
      notes: 'Otot beristirahat dan memulihkan glikogen.',
      created_at: new Date().toISOString(),
    };

    await db.workouts.put(restWorkout);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lean_data_changed'));
    }
    return { workout: restWorkout, exercises: [] };
  }

  // Select exercises
  const selectedExercises = selectExercisesForFocus(dbExercises, focus, equipment, durationMin);
  const workoutId = `wkt-${dateStr}-${Date.now()}`;
  const workoutName = `${focusConfig.labelId} (${selectedExercises.map((e) => e.muscle_group).slice(0, 2).map((m) => m.toUpperCase()).join(' & ')})`;

  const newWorkout: Workout = {
    id: workoutId,
    profile_id: profileId,
    name: workoutName,
    scheduled_at: dateStr,
    status: 'scheduled',
    duration_min: durationMin,
    notes: `Fokus: ${focusConfig.name} • Alat: ${equipment} • Energi: ${energyLevel}`,
    created_at: new Date().toISOString(),
  };

  await db.workouts.put(newWorkout);

  // Sets count per exercise depending on energy & duration
  const targetSets = energyLevel === 'high' ? 4 : energyLevel === 'low' ? 2 : 3;

  for (let idx = 0; idx < selectedExercises.length; idx++) {
    const ex = selectedExercises[idx];
    const weId = `we-${workoutId}-${idx + 1}`;

    const we: WorkoutExercise = {
      id: weId,
      workout_id: workoutId,
      exercise_id: ex.id,
      sort_order: idx + 1,
      target_sets: targetSets,
      target_reps: ex.movement_pattern === 'push' || ex.movement_pattern === 'squat' ? '8-10' : '10-12',
      rest_sec: energyLevel === 'high' ? 120 : 90,
    };

    await db.workoutExercises.put(we);

    // Pre-create initial sets
    const defaultWeight = ex.equipment === 'dumbbell' ? 12 : ex.equipment === 'barbell' ? 30 : 25;
    for (let s = 1; s <= targetSets; s++) {
      const setEntry: SetEntry = {
        id: `set-${weId}-${s}-${Date.now()}`,
        workout_exercise_id: weId,
        set_no: s,
        set_type: 'normal',
        weight_kg: defaultWeight,
        reps: 10,
        completed: false,
        sync_status: 'synced',
      };
      await db.sets.put(setEntry);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lean_data_changed'));
  }

  return { workout: newWorkout, exercises: selectedExercises };
}
