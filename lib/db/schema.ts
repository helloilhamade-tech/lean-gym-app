export type GoalType = 'lean' | 'fat_loss' | 'recomposition' | 'build_muscle';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type SplitType = 'upper_lower' | 'full_body' | 'ppl' | 'custom';
export type WorkoutStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped';
export type SetType = 'warmup' | 'normal' | 'drop' | 'failure';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';
export type Equipment = 'dumbbell' | 'barbell' | 'cable' | 'machine' | 'bodyweight';
export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'isolation';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ReadinessLevel = 'good' | 'moderate' | 'low';
export type RecommendationType = 'training' | 'nutrition' | 'activity' | 'recovery';
export type RecommendationAction = 'start_workout' | 'log_meal' | 'log_walk' | 'rest' | 'adjust_calories' | 'log_water';

export interface Profile {
  id: string;
  name: string;
  height_cm: number;
  weight_kg: number;
  gender?: 'male' | 'female';
  age?: number;
  activity_level: ActivityLevel;
  units: 'metric' | 'imperial';
  timezone: string;
  language: 'id' | 'en';
  created_at: string;
  updated_at?: string;
}

export interface Goal {
  id: string;
  profile_id: string;
  goal_type: GoalType;
  target_weight_kg: number;
  target_date?: string;
  weekly_rate_kg: number; // e.g. -0.5 for fat loss
  status: 'active' | 'completed' | 'paused';
  daily_calorie_target: number;
  daily_protein_target_g: number;
  created_at: string;
}

export interface Program {
  id: string;
  profile_id: string;
  name: string;
  split_type: SplitType;
  days_per_week: number;
  start_date: string;
  active: boolean;
  created_at: string;
}

export interface Workout {
  id: string;
  profile_id: string;
  program_id?: string;
  name: string;
  scheduled_at: string; // ISO date string YYYY-MM-DD or full timestamp
  started_at?: string;
  finished_at?: string;
  status: WorkoutStatus;
  duration_min?: number;
  total_volume_kg?: number;
  notes?: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  name_id?: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  movement_pattern: MovementPattern;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_system: boolean;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: string; // e.g. "6-8" or "8-10" or "10-12"
  rep_min?: number;
  rep_max?: number;
  rest_sec: number; // default 90s
  notes?: string;
}

export interface SetEntry {
  id: string;
  workout_exercise_id: string;
  set_no: number;
  set_type: SetType;
  weight_kg: number;
  reps: number;
  rpe?: number; // 1-10
  rir?: number; // Reps In Reserve
  completed: boolean;
  completed_at?: string;
  sync_status?: 'synced' | 'pending';
}

export interface ExerciseHistory {
  id: string;
  profile_id: string;
  exercise_id: string;
  date: string;
  best_weight_kg: number;
  best_reps: number;
  volume: number;
  est_1rm: number;
}

export interface Food {
  id: string;
  name: string;
  name_id?: string;
  serving_size: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  category: 'protein' | 'carb' | 'fat' | 'staple' | 'snack';
  is_custom: boolean;
}

export interface Meal {
  id: string;
  profile_id: string;
  eaten_at: string;
  meal_type: MealType;
  name?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: 'manual' | 'saved_food' | 'template' | 'quick_add';
  created_at: string;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id?: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealTemplate {
  id: string;
  profile_id: string;
  name: string;
  meal_type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: Array<{
    food_name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
}

export interface Measurement {
  id: string;
  profile_id: string;
  measured_at: string; // ISO string
  weight_kg: number;
  waist_cm?: number;
  chest_cm?: number;
  arm_cm?: number;
  body_fat_pct?: number;
  photo_data_url?: string;
  notes?: string;
  created_at: string;
}

export interface DailyLog {
  id: string;
  profile_id: string;
  date: string; // YYYY-MM-DD
  steps: number;
  water_ml: number;
  sleep_hours: number;
  subjective_energy?: number; // 1-5
  soreness?: number; // 1-5
  active_calories?: number;
  readiness: ReadinessLevel;
}

export interface Recommendation {
  id: string;
  profile_id: string;
  type: RecommendationType;
  priority: number; // 1 (highest) to 10
  category: 'Do' | 'Eat' | 'Recover';
  title: string;
  title_id: string;
  rationale: string;
  rationale_id: string;
  action_type: RecommendationAction;
  action_payload?: Record<string, any>;
  status: 'active' | 'dismissed' | 'actioned';
  created_at: string;
  expires_at?: string;
}

export interface Reminder {
  id: string;
  profile_id: string;
  type: 'workout' | 'weigh_in' | 'meal' | 'hydration' | 'recovery';
  title: string;
  scheduled_time: string; // HH:mm
  recurrence: 'daily' | 'workout_days' | 'weekly';
  enabled: boolean;
}
