import Dexie, { Table } from 'dexie';
import {
  Profile,
  Goal,
  Program,
  Workout,
  Exercise,
  WorkoutExercise,
  SetEntry,
  ExerciseHistory,
  Food,
  Meal,
  MealItem,
  MealTemplate,
  Measurement,
  DailyLog,
  Recommendation,
  Reminder,
} from './schema';
import {
  SEED_EXERCISES,
  SEED_FOODS,
  SAMPLE_USER_PROFILE,
  SAMPLE_USER_GOAL,
  SAMPLE_USER_PROGRAM,
  SAMPLE_MEASUREMENTS,
  SAMPLE_TODAY_WORKOUT,
  SAMPLE_TODAY_WORKOUT_EXERCISES,
  SAMPLE_EXERCISE_HISTORY,
  SAMPLE_TODAY_MEALS,
  SAMPLE_TODAY_DAILY_LOG,
} from './seed-data';

export class LeanDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  goals!: Table<Goal, string>;
  programs!: Table<Program, string>;
  workouts!: Table<Workout, string>;
  exercises!: Table<Exercise, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  sets!: Table<SetEntry, string>;
  exerciseHistory!: Table<ExerciseHistory, string>;
  foods!: Table<Food, string>;
  meals!: Table<Meal, string>;
  mealItems!: Table<MealItem, string>;
  mealTemplates!: Table<MealTemplate, string>;
  measurements!: Table<Measurement, string>;
  dailyLogs!: Table<DailyLog, string>;
  recommendations!: Table<Recommendation, string>;
  reminders!: Table<Reminder, string>;

  constructor() {
    super('LeanGymTrackerDB');
    this.version(1).stores({
      profiles: 'id',
      goals: 'id, profile_id, status',
      programs: 'id, profile_id, active',
      workouts: 'id, profile_id, scheduled_at, status',
      exercises: 'id, muscle_group, movement_pattern',
      workoutExercises: 'id, workout_id, exercise_id, sort_order',
      sets: 'id, workout_exercise_id, set_no, completed',
      exerciseHistory: 'id, profile_id, exercise_id, date',
      foods: 'id, name, category',
      meals: 'id, profile_id, eaten_at, meal_type',
      mealItems: 'id, meal_id, food_id',
      mealTemplates: 'id, profile_id',
      measurements: 'id, profile_id, measured_at',
      dailyLogs: 'id, [profile_id+date], date',
      recommendations: 'id, profile_id, status, priority',
      reminders: 'id, profile_id, type',
    });
  }
}

export const db = new LeanDatabase();

/**
 * Initialize system catalog (Exercises & Foods) only, without any sample user data
 */
export async function initializeDatabaseWithSeedData(forceDemoReset = false) {
  if (typeof window === 'undefined') return;

  const count = await db.exercises.count();
  if (count === 0) {
    // Only populate system catalog
    await db.exercises.bulkPut(SEED_EXERCISES);
    await db.foods.bulkPut(SEED_FOODS);
  }

  if (forceDemoReset) {
    await loadSampleDemoData();
  }
}

/**
 * Explicitly load sample demo user data (Alex Pratama) only when requested
 */
export async function loadSampleDemoData() {
  if (typeof window === 'undefined') return;

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });

  // Populate system catalogs
  await db.exercises.bulkPut(SEED_EXERCISES);
  await db.foods.bulkPut(SEED_FOODS);

  // Populate sample user
  await db.profiles.put(SAMPLE_USER_PROFILE);
  await db.goals.put(SAMPLE_USER_GOAL);
  await db.programs.put(SAMPLE_USER_PROGRAM);
  await db.measurements.bulkPut(SAMPLE_MEASUREMENTS);
  await db.exerciseHistory.bulkPut(SAMPLE_EXERCISE_HISTORY);

  // Populate sample workout
  await db.workouts.put(SAMPLE_TODAY_WORKOUT);
  for (const we of SAMPLE_TODAY_WORKOUT_EXERCISES) {
    await db.workoutExercises.put({
      id: we.id,
      workout_id: we.workout_id,
      exercise_id: we.exercise_id,
      sort_order: we.sort_order,
      target_sets: we.target_sets,
      target_reps: we.target_reps,
      rest_sec: we.rest_sec,
    });

    for (let i = 1; i <= we.target_sets; i++) {
      const prev = we.previousSets[i - 1] || we.previousSets[0] || { weightKg: 15, reps: 8 };
      await db.sets.put({
        id: `set-${we.id}-${i}`,
        workout_exercise_id: we.id,
        set_no: i,
        set_type: 'normal',
        weight_kg: prev.weightKg,
        reps: prev.reps,
        completed: false,
        sync_status: 'synced',
      });
    }
  }

  await db.meals.bulkPut(SAMPLE_TODAY_MEALS);
  await db.dailyLogs.put(SAMPLE_TODAY_DAILY_LOG);
}

/**
 * Reset database to completely fresh blank state for onboarding
 */
export async function resetDatabaseToFresh() {
  if (typeof window === 'undefined') return;

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });

  // Keep system exercises and foods so onboarding and catalog work cleanly
  await db.exercises.bulkPut(SEED_EXERCISES);
  await db.foods.bulkPut(SEED_FOODS);
}
