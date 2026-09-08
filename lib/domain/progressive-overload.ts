import { SetEntry, WorkoutExercise } from '@/lib/db/schema';

export interface ExercisePerformanceHistory {
  exerciseId: string;
  bestWeightKg: number;
  bestReps: number;
  best1rm: number;
  lastSessions: Array<{
    date: string;
    sets: Array<{ weightKg: number; reps: number; rpe?: number; completed: boolean }>;
    totalVolumeKg: number;
  }>;
}

export interface ProgressionRecommendation {
  type: 'increase_weight' | 'aim_reps' | 'repeat_weight' | 'hold_or_deload';
  suggestedWeightKg: number;
  suggestedRepRange: string;
  message: string;
  messageId: string;
  incrementKg: number;
}

export interface PRStatus {
  isWeightPR: boolean;
  is1rmPR: boolean;
  isVolumePR: boolean;
  previousBestWeightKg?: number;
  previousBest1rm?: number;
  previousBestVolumeKg?: number;
  newBestWeightKg?: number;
  newBest1rm?: number;
  newBestVolumeKg?: number;
}

/**
 * Calculates estimated 1 Rep Max (Epley Formula)
 * 1RM = weight * (1 + reps / 30)
 */
export function calculateEst1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  const est = weightKg * (1 + reps / 30);
  return Math.round(est * 10) / 10;
}

/**
 * Calculates total session volume in kg (sum of weight * reps for completed sets)
 */
export function calculateTotalVolume(sets: Array<{ weight_kg: number; reps: number; completed: boolean }>): number {
  return sets
    .filter((s) => s.completed && s.weight_kg > 0 && s.reps > 0)
    .reduce((acc, s) => acc + s.weight_kg * s.reps, 0);
}

/**
 * Evaluates double-progression rules based on previous session logs
 * Acceptance Test AT-02:
 * Given 3 working sets all reach the top rep range with RPE <= 8, next-session suggestion increases load by one increment.
 */
export function evaluateProgression(
  targetRepRange: string, // e.g. "6-8" or "8-10" or "10-12"
  previousSets: Array<{ weightKg: number; reps: number; rpe?: number; completed: boolean }>,
  muscleGroup?: string,
  historicalSessions: Array<{ totalVolumeKg: number }> = []
): ProgressionRecommendation {
  // Parse target reps range
  const parts = targetRepRange.split('-').map((s) => parseInt(s.trim(), 10));
  const minReps = parts[0] || 8;
  const maxReps = parts[1] || minReps;

  // Default increment: 2.5 kg for compounds, 1.25 or 2.0 kg for accessories/dumbbells
  const isCompound = muscleGroup === 'quads' || muscleGroup === 'chest' || muscleGroup === 'back';
  const increment = isCompound ? 2.5 : 1.25;

  const validSets = previousSets.filter((s) => s.completed && s.weightKg > 0);
  if (validSets.length === 0) {
    return {
      type: 'repeat_weight',
      suggestedWeightKg: 0,
      suggestedRepRange: targetRepRange,
      message: 'Establish baseline on first working set',
      messageId: 'Tentukan beban dasar pada set pertama',
      incrementKg: increment,
    };
  }

  const lastWeight = Math.max(...validSets.map((s) => s.weightKg));
  const allHitCeiling = validSets.every((s) => s.reps >= maxReps && (!s.rpe || s.rpe <= 8));

  // Check regression across last 2 sessions if available
  if (historicalSessions.length >= 2) {
    const s1 = historicalSessions[0].totalVolumeKg;
    const s2 = historicalSessions[1].totalVolumeKg;
    if (s1 < s2 * 0.9) {
      return {
        type: 'hold_or_deload',
        suggestedWeightKg: lastWeight,
        suggestedRepRange: `${minReps}-${maxReps}`,
        message: 'Fatigue detected across sessions: hold current weight or reduce volume by 1 set.',
        messageId: 'Kelelahan terdeteksi: pertahankan beban saat ini atau kurangi volume 1 set.',
        incrementKg: 0,
      };
    }
  }

  if (allHitCeiling) {
    const nextWeight = lastWeight + increment;
    return {
      type: 'increase_weight',
      suggestedWeightKg: nextWeight,
      suggestedRepRange: `${minReps}-${maxReps}`,
      message: `Target reached! Add ${increment} kg (${nextWeight} kg) and aim for ${minReps} reps.`,
      messageId: `Target tercapai! Tambah ${increment} kg (${nextWeight} kg) dan targetkan ${minReps} repetisi.`,
      incrementKg: increment,
    };
  }

  // Not all hit top of range yet, aim for more reps with same weight
  const lowestReps = Math.min(...validSets.map((s) => s.reps));
  const nextRepGoal = Math.min(maxReps, lowestReps + 1);

  return {
    type: 'aim_reps',
    suggestedWeightKg: lastWeight,
    suggestedRepRange: `${minReps}-${maxReps}`,
    message: `Repeat ${lastWeight} kg and aim for ${nextRepGoal} reps before adding weight.`,
    messageId: `Ulangi ${lastWeight} kg dan targetkan ${nextRepGoal} repetisi sebelum menambah beban.`,
    incrementKg: 0,
  };
}

/**
 * Check if the workout set or session achieved any Personal Records
 */
export function checkPersonalRecords(
  currentSets: Array<{ weightKg: number; reps: number; completed: boolean }>,
  history?: { bestWeightKg: number; best1rm: number; bestVolumeKg?: number }
): PRStatus {
  const validSets = currentSets.filter((s) => s.completed && s.weightKg > 0 && s.reps > 0);
  if (validSets.length === 0) {
    return { isWeightPR: false, is1rmPR: false, isVolumePR: false };
  }

  const currentMaxWeight = Math.max(...validSets.map((s) => s.weightKg));
  const currentMax1rm = Math.max(...validSets.map((s) => calculateEst1RM(s.weightKg, s.reps)));
  const currentVolume = calculateTotalVolume(
    validSets.map((s) => ({ weight_kg: s.weightKg, reps: s.reps, completed: true }))
  );

  const prevWeight = history?.bestWeightKg || 0;
  const prev1rm = history?.best1rm || 0;
  const prevVolume = history?.bestVolumeKg || 0;

  const isWeightPR = prevWeight > 0 && currentMaxWeight > prevWeight;
  const is1rmPR = prev1rm > 0 && currentMax1rm > prev1rm;
  const isVolumePR = prevVolume > 0 && currentVolume > prevVolume;

  return {
    isWeightPR,
    is1rmPR,
    isVolumePR,
    previousBestWeightKg: prevWeight,
    previousBest1rm: prev1rm,
    previousBestVolumeKg: prevVolume,
    newBestWeightKg: currentMaxWeight,
    newBest1rm: currentMax1rm,
    newBestVolumeKg: currentVolume,
  };
}
