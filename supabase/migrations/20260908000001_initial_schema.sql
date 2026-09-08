-- ====================================================================
-- LEAN Gym Tracker — Initial Schema Migration
-- Matches PRD & ERD specifications with PK/FK, indexes, and RLS
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active')),
    units TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    language TEXT NOT NULL DEFAULT 'id' CHECK (language IN ('id', 'en')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. GOALS
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('lean', 'fat_loss', 'recomposition', 'build_muscle')),
    target_weight_kg NUMERIC(5,2) NOT NULL,
    target_date DATE,
    weekly_rate_kg NUMERIC(4,2) NOT NULL DEFAULT -0.5,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    daily_calorie_target INTEGER NOT NULL,
    daily_protein_target_g INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_goals_profile ON goals(profile_id);

-- 3. PROGRAMS
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    split_type TEXT NOT NULL CHECK (split_type IN ('upper_lower', 'full_body', 'ppl', 'custom')),
    days_per_week INTEGER NOT NULL DEFAULT 4,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_programs_profile ON programs(profile_id);

-- 4. WORKOUTS
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    scheduled_at DATE NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped')),
    duration_min INTEGER,
    total_volume_kg NUMERIC(8,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workouts_profile ON workouts(profile_id);
CREATE INDEX idx_workouts_scheduled ON workouts(scheduled_at);

-- 5. EXERCISES
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_id TEXT,
    muscle_group TEXT NOT NULL,
    equipment TEXT NOT NULL,
    movement_pattern TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'intermediate',
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WORKOUT EXERCISES
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    target_sets INTEGER NOT NULL DEFAULT 3,
    target_reps TEXT NOT NULL DEFAULT '8-10',
    rest_sec INTEGER NOT NULL DEFAULT 90,
    notes TEXT
);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);

-- 7. SETS
CREATE TABLE IF NOT EXISTS sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_no INTEGER NOT NULL,
    set_type TEXT NOT NULL DEFAULT 'normal' CHECK (set_type IN ('warmup', 'normal', 'drop', 'failure')),
    weight_kg NUMERIC(6,2) NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    rpe NUMERIC(3,1),
    rir INTEGER,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sets_workout_exercise ON sets(workout_exercise_id);

-- 8. EXERCISE HISTORY
CREATE TABLE IF NOT EXISTS exercise_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    best_weight_kg NUMERIC(6,2) NOT NULL,
    best_reps INTEGER NOT NULL,
    volume NUMERIC(8,2) NOT NULL,
    est_1rm NUMERIC(6,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_history_profile_exercise ON exercise_history(profile_id, exercise_id);

-- 9. FOODS
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_id TEXT,
    serving_size NUMERIC(6,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'g',
    calories INTEGER NOT NULL,
    protein_g NUMERIC(5,2) NOT NULL,
    carbs_g NUMERIC(5,2) NOT NULL,
    fat_g NUMERIC(5,2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'protein',
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. MEALS
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    eaten_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    name TEXT,
    calories INTEGER NOT NULL DEFAULT 0,
    protein_g NUMERIC(5,2) NOT NULL DEFAULT 0,
    carbs_g NUMERIC(5,2) NOT NULL DEFAULT 0,
    fat_g NUMERIC(5,2) NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'saved_food', 'template', 'quick_add')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_meals_profile_date ON meals(profile_id, eaten_at);

-- 11. MEAL ITEMS
CREATE TABLE IF NOT EXISTS meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    food_name TEXT NOT NULL,
    quantity NUMERIC(6,2) NOT NULL,
    unit TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein_g NUMERIC(5,2) NOT NULL,
    carbs_g NUMERIC(5,2) NOT NULL,
    fat_g NUMERIC(5,2) NOT NULL
);
CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);

-- 12. MEASUREMENTS
CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weight_kg NUMERIC(5,2) NOT NULL,
    waist_cm NUMERIC(5,2),
    chest_cm NUMERIC(5,2),
    arm_cm NUMERIC(5,2),
    body_fat_pct NUMERIC(4,2),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_measurements_profile_date ON measurements(profile_id, measured_at);

-- 13. DAILY LOGS
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER NOT NULL DEFAULT 0,
    water_ml INTEGER NOT NULL DEFAULT 0,
    sleep_hours NUMERIC(4,2) NOT NULL DEFAULT 7.0,
    subjective_energy INTEGER CHECK (subjective_energy BETWEEN 1 AND 5),
    soreness INTEGER CHECK (soreness BETWEEN 1 AND 5),
    active_calories INTEGER DEFAULT 0,
    readiness TEXT NOT NULL DEFAULT 'good' CHECK (readiness IN ('good', 'moderate', 'low')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, date)
);
CREATE INDEX idx_daily_logs_profile_date ON daily_logs(profile_id, date);

-- 14. RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('training', 'nutrition', 'activity', 'recovery')),
    priority INTEGER NOT NULL DEFAULT 5,
    category TEXT NOT NULL CHECK (category IN ('Do', 'Eat', 'Recover')),
    title TEXT NOT NULL,
    title_id TEXT NOT NULL,
    rationale TEXT NOT NULL,
    rationale_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_payload JSONB,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_recommendations_profile ON recommendations(profile_id, status);

-- 15. REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    scheduled_time TIME NOT NULL,
    recurrence TEXT NOT NULL DEFAULT 'daily',
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);
