import { Goal, DailyLog, Meal, Workout, Recommendation, ReadinessLevel } from '@/lib/db/schema';

export interface RecommendationEngineInputs {
  profileId: string;
  goal?: Goal;
  todayWorkout?: Workout;
  yesterdayWorkout?: Workout;
  todayDailyLog?: Partial<DailyLog>;
  recentWeights: Array<{ date: string; weightKg: number }>;
  todayMeals: Meal[];
  language?: 'id' | 'en';
}

/**
 * Calculates 7-day rolling weight average.
 * Acceptance Test AT-03: Given 7 daily weights, dashboard uses the 7-day rolling average
 * and does not change target based on a one-day spike.
 */
export function calculate7DayWeightAverage(recentWeights: Array<{ date: string; weightKg: number }>): {
  rollingAverageKg: number | null;
  latestWeightKg: number | null;
  deltaKg: number | null;
  trend: 'down' | 'up' | 'stable';
} {
  if (!recentWeights || recentWeights.length === 0) {
    return { rollingAverageKg: null, latestWeightKg: null, deltaKg: null, trend: 'stable' };
  }

  // Sort descending by date
  const sorted = [...recentWeights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestWeightKg = sorted[0].weightKg;

  // Take up to 7 most recent weights
  const windowWeights = sorted.slice(0, 7);
  const avg = windowWeights.reduce((acc, w) => acc + w.weightKg, 0) / windowWeights.length;
  const rollingAverageKg = Math.round(avg * 10) / 10;

  // If we have previous days before the latest
  let deltaKg = 0;
  let trend: 'down' | 'up' | 'stable' = 'stable';

  if (windowWeights.length > 1) {
    const prevWeights = windowWeights.slice(1);
    const prevAvg = prevWeights.reduce((acc, w) => acc + w.weightKg, 0) / prevWeights.length;
    deltaKg = Math.round((rollingAverageKg - prevAvg) * 10) / 10;
    if (deltaKg < -0.1) trend = 'down';
    else if (deltaKg > 0.1) trend = 'up';
  }

  return {
    rollingAverageKg,
    latestWeightKg,
    deltaKg,
    trend,
  };
}

/**
 * Calculates Readiness Score from sleep, subjective energy, and soreness
 */
export function calculateReadiness(
  sleepHours: number = 7,
  energy: number = 4, // 1-5
  soreness: number = 2 // 1-5
): ReadinessLevel {
  if (sleepHours < 5.5 || energy <= 2 || soreness >= 4) {
    return 'low';
  }
  if (sleepHours >= 7 && energy >= 3.5 && soreness <= 2.5) {
    return 'good';
  }
  return 'moderate';
}

/**
 * Generate Structured Action Recommendations (Rule-based Engine v1)
 */
export function generateDailyRecommendations(inputs: RecommendationEngineInputs): Recommendation[] {
  const {
    profileId,
    goal,
    todayWorkout,
    yesterdayWorkout,
    todayDailyLog,
    recentWeights,
    todayMeals,
  } = inputs;

  const recommendations: Recommendation[] = [];
  const nowStr = new Date().toISOString();

  // 1. Calculate readiness
  const sleep = todayDailyLog?.sleep_hours ?? 7;
  const energy = todayDailyLog?.subjective_energy ?? 4;
  const soreness = todayDailyLog?.soreness ?? 2;
  const readiness = todayDailyLog?.readiness || calculateReadiness(sleep, energy, soreness);

  // 2. Training / Workout recommendation ("Do")
  if (yesterdayWorkout && yesterdayWorkout.status === 'scheduled') {
    // Missed session recovery
    recommendations.push({
      id: `rec-missed-${Date.now()}`,
      profile_id: profileId,
      type: 'training',
      category: 'Do',
      priority: 1,
      title: 'Sesi kemarin terlewat',
      title_id: 'Sesi kemarin terlewat',
      rationale: 'Jaga konsistensi mingguan. Geser latihan ke hari ini atau gabungkan sesi singkat.',
      rationale_id: 'Jaga konsistensi mingguan. Geser latihan ke hari ini atau gabungkan sesi singkat.',
      action_type: 'start_workout',
      action_payload: { workout_id: yesterdayWorkout.id },
      status: 'active',
      created_at: nowStr,
    });
  } else if (todayWorkout && todayWorkout.status !== 'completed') {
    if (readiness === 'low') {
      recommendations.push({
        id: `rec-train-low-${Date.now()}`,
        profile_id: profileId,
        type: 'training',
        category: 'Do',
        priority: 2,
        title: `${todayWorkout.name} (Modifikasi Beban)`,
        title_id: `${todayWorkout.name} (Modifikasi Beban)`,
        rationale: 'Kesiapan tubuh rendah hari ini. Tetap latihan, tetapi gunakan repetisi batas bawah atau kurangi 1 set aksesori.',
        rationale_id: 'Kesiapan tubuh rendah hari ini. Tetap latihan, tetapi gunakan repetisi batas bawah atau kurangi 1 set aksesori.',
        action_type: 'start_workout',
        action_payload: { workout_id: todayWorkout.id, volume_reduction: 1 },
        status: 'active',
        created_at: nowStr,
      });
    } else {
      recommendations.push({
        id: `rec-train-ready-${Date.now()}`,
        profile_id: profileId,
        type: 'training',
        category: 'Do',
        priority: 1,
        title: `Latihan Hari Ini: ${todayWorkout.name}`,
        title_id: `Latihan Hari Ini: ${todayWorkout.name}`,
        rationale: 'Kondisi fisik optimal. Lakukan pemanasan terarah dan fokus pada progres beban di set utama.',
        rationale_id: 'Kondisi fisik optimal. Lakukan pemanasan terarah dan fokus pada progres beban di set utama.',
        action_type: 'start_workout',
        action_payload: { workout_id: todayWorkout.id },
        status: 'active',
        created_at: nowStr,
      });
    }
  }

  // 3. Nutrition Recommendation ("Eat")
  if (goal) {
    const consumedCal = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const consumedProt = todayMeals.reduce((acc, m) => acc + (m.protein_g || 0), 0);
    const remainingProt = Math.max(0, goal.daily_protein_target_g - consumedProt);
    const remainingCal = goal.daily_calorie_target - consumedCal;

    // AT-05: Given protein remaining is high and calories remaining are low, rank high-protein / lower-calorie options higher
    if (remainingProt >= 30 && remainingCal <= 450 && remainingCal > 0) {
      recommendations.push({
        id: `rec-nutri-dense-${Date.now()}`,
        profile_id: profileId,
        type: 'nutrition',
        category: 'Eat',
        priority: 3,
        title: `Prioritas Protein Tinggi (${Math.round(remainingProt)}g tersisa)`,
        title_id: `Prioritas Protein Tinggi (${Math.round(remainingProt)}g tersisa)`,
        rationale: `Kalori tersisa ${remainingCal} kcal tetapi butuh ${Math.round(remainingProt)}g protein. Pilih dada ayam rebus atau whey isolate.`,
        rationale_id: `Kalori tersisa ${remainingCal} kcal tetapi butuh ${Math.round(remainingProt)}g protein. Pilih dada ayam rebus atau whey isolate.`,
        action_type: 'log_meal',
        action_payload: { suggested_type: 'high_protein_lean', protein_needed: remainingProt },
        status: 'active',
        created_at: nowStr,
      });
    } else if (remainingProt > 20) {
      recommendations.push({
        id: `rec-nutri-normal-${Date.now()}`,
        profile_id: profileId,
        type: 'nutrition',
        category: 'Eat',
        priority: 4,
        title: `Penuhi Target Protein (${Math.round(remainingProt)}g lagi)`,
        title_id: `Penuhi Target Protein (${Math.round(remainingProt)}g lagi)`,
        rationale: `Target harian ${goal.daily_protein_target_g}g menjaga massa otot saat defisit. Tambahkan menu berprotein.`,
        rationale_id: `Target harian ${goal.daily_protein_target_g}g menjaga massa otot saat defisit. Tambahkan menu berprotein.`,
        action_type: 'log_meal',
        action_payload: { protein_needed: remainingProt },
        status: 'active',
        created_at: nowStr,
      });
    }
  }

  // 4. Activity / Recovery ("Recover")
  const steps = todayDailyLog?.steps ?? 0;
  if (readiness === 'low') {
    recommendations.push({
      id: `rec-recov-sleep-${Date.now()}`,
      profile_id: profileId,
      type: 'recovery',
      category: 'Recover',
      priority: 5,
      title: 'Prioritaskan Istirahat Malam Ini',
      title_id: 'Prioritaskan Istirahat Malam Ini',
      rationale: `Tidur terakhir ${sleep} jam. Usahakan tidur 7.5-8 jam untuk pemulihan otot dan regulasi hormon nafsu makan.`,
      rationale_id: `Tidur terakhir ${sleep} jam. Usahakan tidur 7.5-8 jam untuk pemulihan otot dan regulasi hormon nafsu makan.`,
      action_type: 'rest',
      status: 'active',
      created_at: nowStr,
    });
  } else if (steps < 6000) {
    recommendations.push({
      id: `rec-act-walk-${Date.now()}`,
      profile_id: profileId,
      type: 'activity',
      category: 'Do',
      priority: 6,
      title: 'Jalan Santai 20-30 Menit',
      title_id: 'Jalan Santai 20-30 Menit',
      rationale: `Langkah baru ${steps.toLocaleString()}. Jalan santai membantu pembakaran kalori harian tanpa membebani pemulihan otot.`,
      rationale_id: `Langkah baru ${steps.toLocaleString()}. Jalan santai membantu pembakaran kalori harian tanpa membebani pemulihan otot.`,
      action_type: 'log_walk',
      action_payload: { target_minutes: 25 },
      status: 'active',
      created_at: nowStr,
    });
  }

  // Sort by priority ascending (1 = highest priority)
  return recommendations.sort((a, b) => a.priority - b.priority);
}
