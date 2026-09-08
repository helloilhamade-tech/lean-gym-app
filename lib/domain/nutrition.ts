import { ActivityLevel, GoalType } from '@/lib/db/schema';

export interface NutritionTargets {
  tdee: number;
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  waterTargetMl: number;
}

export interface MacroSummary {
  targetCalories: number;
  targetProteinG: number;
  consumedCalories: number;
  consumedProteinG: number;
  consumedCarbsG: number;
  consumedFatG: number;
  remainingCalories: number;
  remainingProteinG: number;
  calorieProgressPct: number;
  proteinProgressPct: number;
}

/**
 * Calculates Baseline TDEE and Goal Targets using Mifflin-St Jeor
 */
export function calculateNutritionTargets(
  weightKg: number,
  heightCm: number,
  age: number = 26,
  isMale: boolean = true,
  activityLevel: ActivityLevel = 'moderate',
  goalType: GoalType = 'recomposition'
): NutritionTargets {
  // Mifflin-St Jeor BMR
  const bmr = isMale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };

  const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.4));

  // Goal Calorie Offsets
  let calorieTarget = tdee;
  let proteinPerKg = 2.0;

  switch (goalType) {
    case 'fat_loss':
      calorieTarget = tdee - 450;
      proteinPerKg = 2.2;
      break;
    case 'lean':
    case 'recomposition':
      calorieTarget = tdee - 250;
      proteinPerKg = 2.0;
      break;
    case 'build_muscle':
      calorieTarget = tdee + 300;
      proteinPerKg = 1.8;
      break;
  }

  // Protein target in grams
  const proteinTargetG = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinTargetG * 4;

  // Fat target ~ 25% of total calories (9 kcal/g)
  const fatCalories = calorieTarget * 0.25;
  const fatTargetG = Math.round(fatCalories / 9);

  // Remaining calories go to carbs (4 kcal/g)
  const remainingCarbCalories = Math.max(0, calorieTarget - proteinCalories - fatCalories);
  const carbsTargetG = Math.round(remainingCarbCalories / 4);

  // Water baseline ~ 35ml per kg of bodyweight, rounded to nearest 250ml
  const waterTargetMl = Math.max(2000, Math.round((weightKg * 35) / 250) * 250);

  return {
    tdee,
    calorieTarget: Math.round(calorieTarget),
    proteinTargetG,
    carbsTargetG,
    fatTargetG,
    waterTargetMl,
  };
}

/**
 * Calculates current remaining budget and progress percentages
 */
export function calculateMacroSummary(
  targetCalories: number,
  targetProteinG: number,
  meals: Array<{ calories: number; protein_g: number; carbs_g?: number; fat_g?: number }>
): MacroSummary {
  const consumedCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const consumedProteinG = meals.reduce((acc, m) => acc + (m.protein_g || 0), 0);
  const consumedCarbsG = meals.reduce((acc, m) => acc + (m.carbs_g || 0), 0);
  const consumedFatG = meals.reduce((acc, m) => acc + (m.fat_g || 0), 0);

  const remainingCalories = targetCalories - consumedCalories;
  const remainingProteinG = Math.max(0, targetProteinG - consumedProteinG);

  const calorieProgressPct = targetCalories > 0
    ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100))
    : 0;

  const proteinProgressPct = targetProteinG > 0
    ? Math.min(100, Math.round((consumedProteinG / targetProteinG) * 100))
    : 0;

  return {
    targetCalories,
    targetProteinG,
    consumedCalories,
    consumedProteinG,
    consumedCarbsG,
    consumedFatG,
    remainingCalories,
    remainingProteinG,
    calorieProgressPct,
    proteinProgressPct,
  };
}
