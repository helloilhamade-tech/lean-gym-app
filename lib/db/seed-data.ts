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
} from './schema';

export const SEED_EXERCISES: Exercise[] = [
  // CHEST
  { id: 'ex-incline-db-press', name: 'Incline Dumbbell Press', name_id: 'Incline DB Press', muscle_group: 'chest', equipment: 'dumbbell', movement_pattern: 'push', difficulty: 'intermediate', is_system: true },
  { id: 'ex-bench-press', name: 'Barbell Bench Press', name_id: 'Bench Press Barbel', muscle_group: 'chest', equipment: 'barbell', movement_pattern: 'push', difficulty: 'intermediate', is_system: true },
  { id: 'ex-chest-fly', name: 'Cable Chest Fly', name_id: 'Cable Fly Dada', muscle_group: 'chest', equipment: 'cable', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },
  
  // BACK
  { id: 'ex-lat-pulldown', name: 'Lat Pulldown', name_id: 'Lat Pulldown', muscle_group: 'back', equipment: 'cable', movement_pattern: 'pull', difficulty: 'beginner', is_system: true },
  { id: 'ex-seated-row', name: 'Seated Cable Row', name_id: 'Seated Cable Row', muscle_group: 'back', equipment: 'cable', movement_pattern: 'pull', difficulty: 'beginner', is_system: true },
  { id: 'ex-dumbbell-row', name: 'One-Arm Dumbbell Row', name_id: 'Dumbbell Row Satu Tangan', muscle_group: 'back', equipment: 'dumbbell', movement_pattern: 'pull', difficulty: 'intermediate', is_system: true },
  
  // SHOULDERS
  { id: 'ex-seated-db-shoulder-press', name: 'Seated DB Shoulder Press', name_id: 'Shoulder Press Dumbbell Duduk', muscle_group: 'shoulders', equipment: 'dumbbell', movement_pattern: 'push', difficulty: 'intermediate', is_system: true },
  { id: 'ex-lateral-raise', name: 'Dumbbell Lateral Raise', name_id: 'Lateral Raise Dumbbell', muscle_group: 'shoulders', equipment: 'dumbbell', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },
  { id: 'ex-face-pull', name: 'Cable Face Pull', name_id: 'Cable Face Pull', muscle_group: 'shoulders', equipment: 'cable', movement_pattern: 'pull', difficulty: 'beginner', is_system: true },

  // ARMS
  { id: 'ex-tricep-pushdown', name: 'Tricep Rope Pushdown', name_id: 'Tricep Rope Pushdown', muscle_group: 'triceps', equipment: 'cable', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },
  { id: 'ex-overhead-tricep-ext', name: 'Overhead Tricep Extension', name_id: 'Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'cable', movement_pattern: 'isolation', difficulty: 'intermediate', is_system: true },
  { id: 'ex-dumbbell-curl', name: 'Incline Dumbbell Curl', name_id: 'Incline Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },
  { id: 'ex-hammer-curl', name: 'Dumbbell Hammer Curl', name_id: 'Hammer Curl Dumbbell', muscle_group: 'biceps', equipment: 'dumbbell', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },

  // LEGS
  { id: 'ex-barbell-squat', name: 'Barbell Back Squat', name_id: 'Squat Barbel', muscle_group: 'quads', equipment: 'barbell', movement_pattern: 'squat', difficulty: 'advanced', is_system: true },
  { id: 'ex-leg-press', name: 'Leg Press', name_id: 'Leg Press Mesin', muscle_group: 'quads', equipment: 'machine', movement_pattern: 'squat', difficulty: 'intermediate', is_system: true },
  { id: 'ex-leg-extension', name: 'Leg Extension', name_id: 'Leg Extension Mesin', muscle_group: 'quads', equipment: 'machine', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },
  { id: 'ex-romanian-deadlift', name: 'Romanian Deadlift (DB/Barbell)', name_id: 'Romanian Deadlift (RDL)', muscle_group: 'hamstrings', equipment: 'dumbbell', movement_pattern: 'hinge', difficulty: 'intermediate', is_system: true },
  { id: 'ex-leg-curl', name: 'Lying Leg Curl', name_id: 'Leg Curl Rebahan Mesin', muscle_group: 'hamstrings', equipment: 'machine', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },
  { id: 'ex-standing-calf-raise', name: 'Standing Calf Raise', name_id: 'Calf Raise Berdiri', muscle_group: 'calves', equipment: 'machine', movement_pattern: 'isolation', difficulty: 'beginner', is_system: true },

  // CORE
  { id: 'ex-plank', name: 'Forearm Plank', name_id: 'Plank Lengan', muscle_group: 'core', equipment: 'bodyweight', movement_pattern: 'carry', difficulty: 'beginner', is_system: true },
  { id: 'ex-hanging-knee-raise', name: 'Hanging Knee Raise', name_id: 'Hanging Knee Raise', muscle_group: 'core', equipment: 'bodyweight', movement_pattern: 'isolation', difficulty: 'intermediate', is_system: true },
  { id: 'ex-cable-crunch', name: 'Kneeling Cable Crunch', name_id: 'Cable Crunch Berlutut', muscle_group: 'core', equipment: 'cable', movement_pattern: 'isolation', difficulty: 'intermediate', is_system: true },
];

export const SEED_FOODS: Food[] = [
  { id: 'food-dada-ayam', name: 'Dada Ayam Fillet (Kukus/Panggang)', name_id: 'Dada Ayam Fillet', serving_size: 100, unit: 'g', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, category: 'protein', is_custom: false },
  { id: 'food-telur-rebus', name: 'Telur Ayam Utuh Rebus', name_id: 'Telur Ayam Rebus', serving_size: 50, unit: 'butir', calories: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3, category: 'protein', is_custom: false },
  { id: 'food-putih-telur', name: 'Putih Telur Rebus', name_id: 'Putih Telur Rebus', serving_size: 100, unit: 'g', calories: 52, protein_g: 11, carbs_g: 0.7, fat_g: 0.2, category: 'protein', is_custom: false },
  { id: 'food-whey-isolate', name: 'Whey Protein Isolate (1 Scoop)', name_id: 'Whey Protein Isolate', serving_size: 30, unit: 'scoop', calories: 120, protein_g: 25, carbs_g: 2, fat_g: 1, category: 'protein', is_custom: false },
  { id: 'food-tempe-kukus', name: 'Tempe Kedelai Kukus', name_id: 'Tempe Kukus', serving_size: 100, unit: 'g', calories: 190, protein_g: 19, carbs_g: 9, fat_g: 11, category: 'protein', is_custom: false },
  { id: 'food-tahu-putih', name: 'Tahu Putih Kukus/Rebus', name_id: 'Tahu Putih', serving_size: 100, unit: 'g', calories: 80, protein_g: 8, carbs_g: 2, fat_g: 4.8, category: 'protein', is_custom: false },
  { id: 'food-daging-sapi-lean', name: 'Daging Sapi Has Dalam (Tenderloin)', name_id: 'Daging Sapi Lean', serving_size: 100, unit: 'g', calories: 215, protein_g: 26, carbs_g: 0, fat_g: 12, category: 'protein', is_custom: false },
  { id: 'food-ikan-salmon', name: 'Ikan Salmon Panggang', name_id: 'Ikan Salmon', serving_size: 100, unit: 'g', calories: 206, protein_g: 22, carbs_g: 0, fat_g: 12.3, category: 'protein', is_custom: false },
  { id: 'food-ikan-tuna', name: 'Ikan Tuna Kaleng in Water', name_id: 'Ikan Tuna in Water', serving_size: 100, unit: 'g', calories: 116, protein_g: 26, carbs_g: 0, fat_g: 1, category: 'protein', is_custom: false },
  { id: 'food-ikan-nila', name: 'Ikan Nila Bakar', name_id: 'Ikan Nila Bakar', serving_size: 100, unit: 'g', calories: 128, protein_g: 26, carbs_g: 0, fat_g: 2.7, category: 'protein', is_custom: false },
  
  // STAPLES & CARBS
  { id: 'food-nasi-putih', name: 'Nasi Putih Pulen', name_id: 'Nasi Putih', serving_size: 100, unit: 'g', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, category: 'staple', is_custom: false },
  { id: 'food-nasi-merah', name: 'Nasi Merah', name_id: 'Nasi Merah', serving_size: 100, unit: 'g', calories: 111, protein_g: 2.6, carbs_g: 23, fat_g: 0.9, category: 'staple', is_custom: false },
  { id: 'food-kentang-rebus', name: 'Kentang Rebus', name_id: 'Kentang Rebus', serving_size: 100, unit: 'g', calories: 87, protein_g: 1.9, carbs_g: 20, fat_g: 0.1, category: 'staple', is_custom: false },
  { id: 'food-oatmeal', name: 'Rolled Oats / Oatmeal', name_id: 'Oatmeal', serving_size: 40, unit: 'g', calories: 152, protein_g: 5.3, carbs_g: 27, fat_g: 2.7, category: 'staple', is_custom: false },
  { id: 'food-roti-gandum', name: 'Roti Gandum Utuh (Whole Wheat)', name_id: 'Roti Gandum', serving_size: 35, unit: 'lembar', calories: 85, protein_g: 4, carbs_g: 15, fat_g: 1.2, category: 'staple', is_custom: false },
  
  // SNACKS & HEALTHY FATS
  { id: 'food-greek-yogurt', name: 'Greek Yogurt Plain', name_id: 'Greek Yogurt Plain', serving_size: 150, unit: 'g', calories: 130, protein_g: 15, carbs_g: 6, fat_g: 4, category: 'snack', is_custom: false },
  { id: 'food-pisang', name: 'Pisang Cavendish Segar', name_id: 'Pisang Cavendish', serving_size: 120, unit: 'buah', calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.3, category: 'snack', is_custom: false },
  { id: 'food-alpukat', name: 'Alpukat Segar', name_id: 'Alpukat', serving_size: 100, unit: 'g', calories: 160, protein_g: 2, carbs_g: 8.5, fat_g: 14.7, category: 'fat', is_custom: false },
  { id: 'food-kacang-almond', name: 'Kacang Almond Panggang', name_id: 'Kacang Almond', serving_size: 28, unit: 'g', calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14, category: 'fat', is_custom: false },
  { id: 'food-susu-lowfat', name: 'Susu Low Fat', name_id: 'Susu Low Fat', serving_size: 250, unit: 'ml', calories: 125, protein_g: 8.5, carbs_g: 12, fat_g: 3.5, category: 'snack', is_custom: false },
  { id: 'food-brokoli', name: 'Brokoli Rebus / Tumis', name_id: 'Brokoli', serving_size: 100, unit: 'g', calories: 35, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, category: 'staple', is_custom: false },
];

export const SAMPLE_USER_PROFILE: Profile = {
  id: 'usr-demo-01',
  name: 'Alex Pratama',
  height_cm: 176,
  weight_kg: 78.4,
  activity_level: 'moderate',
  units: 'metric',
  timezone: 'Asia/Jakarta',
  language: 'id',
  created_at: '2026-08-25T08:00:00.000Z',
};

export const SAMPLE_USER_GOAL: Goal = {
  id: 'goal-demo-01',
  profile_id: 'usr-demo-01',
  goal_type: 'recomposition',
  target_weight_kg: 75.0,
  target_date: '2026-11-20',
  weekly_rate_kg: -0.4,
  status: 'active',
  daily_calorie_target: 2100,
  daily_protein_target_g: 155,
  created_at: '2026-08-25T08:00:00.000Z',
};

export const SAMPLE_USER_PROGRAM: Program = {
  id: 'prog-upper-lower-4d',
  profile_id: 'usr-demo-01',
  name: 'Lean Recomp — 4 Hari Upper / Lower',
  split_type: 'upper_lower',
  days_per_week: 4,
  start_date: '2026-08-25',
  active: true,
  created_at: '2026-08-25T08:00:00.000Z',
};

// Realistic past 7 daily weights (showing gradual trend 79.0 -> 78.4 kg)
export const SAMPLE_MEASUREMENTS: Measurement[] = [
  { id: 'm-01', profile_id: 'usr-demo-01', measured_at: '2026-09-02T07:15:00.000Z', weight_kg: 79.0, waist_cm: 84.5, notes: 'Mulai minggu kedua', created_at: '2026-09-02T07:15:00.000Z' },
  { id: 'm-02', profile_id: 'usr-demo-01', measured_at: '2026-09-03T07:20:00.000Z', weight_kg: 78.9, waist_cm: 84.5, created_at: '2026-09-03T07:20:00.000Z' },
  { id: 'm-03', profile_id: 'usr-demo-01', measured_at: '2026-09-04T07:10:00.000Z', weight_kg: 79.1, waist_cm: 84.4, notes: 'Sedikit retensi air setelah makan asin kemarin malam', created_at: '2026-09-04T07:10:00.000Z' },
  { id: 'm-04', profile_id: 'usr-demo-01', measured_at: '2026-09-05T07:15:00.000Z', weight_kg: 78.7, waist_cm: 84.2, created_at: '2026-09-05T07:15:00.000Z' },
  { id: 'm-05', profile_id: 'usr-demo-01', measured_at: '2026-09-06T07:30:00.000Z', weight_kg: 78.6, waist_cm: 84.0, created_at: '2026-09-06T07:30:00.000Z' },
  { id: 'm-06', profile_id: 'usr-demo-01', measured_at: '2026-09-07T07:10:00.000Z', weight_kg: 78.5, waist_cm: 84.0, created_at: '2026-09-07T07:10:00.000Z' },
  { id: 'm-07', profile_id: 'usr-demo-01', measured_at: '2026-09-08T07:15:00.000Z', weight_kg: 78.4, waist_cm: 83.8, notes: 'Pinggang turun 0.7cm dalam 7 hari!', created_at: '2026-09-08T07:15:00.000Z' },
];

// Today's workout session template (Upper Body)
export const SAMPLE_TODAY_WORKOUT: Workout = {
  id: 'wkt-today-upper',
  profile_id: 'usr-demo-01',
  program_id: 'prog-upper-lower-4d',
  name: 'Upper Body A (Chest & Back Focus)',
  scheduled_at: new Date().toISOString().split('T')[0],
  status: 'scheduled',
  duration_min: 55,
  created_at: new Date().toISOString(),
};

export const SAMPLE_TODAY_WORKOUT_EXERCISES: Array<WorkoutExercise & { exercise: Exercise; previousSets: Array<{ weightKg: number; reps: number }> }> = [
  {
    id: 'we-01',
    workout_id: 'wkt-today-upper',
    exercise_id: 'ex-incline-db-press',
    sort_order: 1,
    target_sets: 3,
    target_reps: '6-8',
    rest_sec: 90,
    exercise: SEED_EXERCISES[0], // Incline DB Press
    previousSets: [
      { weightKg: 15, reps: 8 },
      { weightKg: 15, reps: 8 },
      { weightKg: 15, reps: 7 },
    ],
  },
  {
    id: 'we-02',
    workout_id: 'wkt-today-upper',
    exercise_id: 'ex-lat-pulldown',
    sort_order: 2,
    target_sets: 3,
    target_reps: '8-10',
    rest_sec: 90,
    exercise: SEED_EXERCISES[3], // Lat Pulldown
    previousSets: [
      { weightKg: 50, reps: 10 },
      { weightKg: 50, reps: 10 },
      { weightKg: 50, reps: 9 },
    ],
  },
  {
    id: 'we-03',
    workout_id: 'wkt-today-upper',
    exercise_id: 'ex-seated-db-shoulder-press',
    sort_order: 3,
    target_sets: 3,
    target_reps: '8-10',
    rest_sec: 90,
    exercise: SEED_EXERCISES[6], // Seated DB Shoulder Press
    previousSets: [
      { weightKg: 12.5, reps: 10 },
      { weightKg: 12.5, reps: 9 },
      { weightKg: 12.5, reps: 8 },
    ],
  },
  {
    id: 'we-04',
    workout_id: 'wkt-today-upper',
    exercise_id: 'ex-tricep-pushdown',
    sort_order: 4,
    target_sets: 3,
    target_reps: '10-12',
    rest_sec: 60,
    exercise: SEED_EXERCISES[9], // Tricep Rope Pushdown
    previousSets: [
      { weightKg: 22.5, reps: 12 },
      { weightKg: 22.5, reps: 12 },
      { weightKg: 22.5, reps: 11 },
    ],
  },
  {
    id: 'we-05',
    workout_id: 'wkt-today-upper',
    exercise_id: 'ex-hammer-curl',
    sort_order: 5,
    target_sets: 3,
    target_reps: '10-12',
    rest_sec: 60,
    exercise: SEED_EXERCISES[12], // Dumbbell Hammer Curl
    previousSets: [
      { weightKg: 10, reps: 12 },
      { weightKg: 10, reps: 11 },
      { weightKg: 10, reps: 10 },
    ],
  },
];

// Historical Exercise Records (for PR and progressive overload comparison)
export const SAMPLE_EXERCISE_HISTORY: ExerciseHistory[] = [
  { id: 'eh-01', profile_id: 'usr-demo-01', exercise_id: 'ex-incline-db-press', date: '2026-09-04', best_weight_kg: 15, best_reps: 8, volume: 345, est_1rm: 19.0 },
  { id: 'eh-02', profile_id: 'usr-demo-01', exercise_id: 'ex-lat-pulldown', date: '2026-09-04', best_weight_kg: 50, best_reps: 10, volume: 1450, est_1rm: 66.7 },
  { id: 'eh-03', profile_id: 'usr-demo-01', exercise_id: 'ex-seated-db-shoulder-press', date: '2026-09-04', best_weight_kg: 12.5, best_reps: 10, volume: 337.5, est_1rm: 16.7 },
  { id: 'eh-04', profile_id: 'usr-demo-01', exercise_id: 'ex-tricep-pushdown', date: '2026-09-04', best_weight_kg: 22.5, best_reps: 12, volume: 787.5, est_1rm: 31.5 },
  { id: 'eh-05', profile_id: 'usr-demo-01', exercise_id: 'ex-hammer-curl', date: '2026-09-04', best_weight_kg: 10, best_reps: 12, volume: 330, est_1rm: 14.0 },
];

// Today's Meals logged so far
export const SAMPLE_TODAY_MEALS: Meal[] = [
  {
    id: 'meal-01',
    profile_id: 'usr-demo-01',
    eaten_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    meal_type: 'breakfast',
    name: 'Sarapan Tinggi Protein (Telur + Oats)',
    calories: 340,
    protein_g: 22,
    carbs_g: 34,
    fat_g: 13,
    source: 'saved_food',
    created_at: new Date().toISOString(),
  },
  {
    id: 'meal-02',
    profile_id: 'usr-demo-01',
    eaten_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    meal_type: 'lunch',
    name: 'Makan Siang: Dada Ayam & Nasi Putih',
    calories: 520,
    protein_g: 54,
    carbs_g: 45,
    fat_g: 11,
    source: 'saved_food',
    created_at: new Date().toISOString(),
  },
];

// Today's Daily Log (Steps, Water, Sleep, Readiness)
export const SAMPLE_TODAY_DAILY_LOG: DailyLog = {
  id: 'log-today',
  profile_id: 'usr-demo-01',
  date: new Date().toISOString().split('T')[0],
  steps: 6420,
  water_ml: 2250,
  sleep_hours: 7.5,
  subjective_energy: 4,
  soreness: 2,
  active_calories: 380,
  readiness: 'good',
};
