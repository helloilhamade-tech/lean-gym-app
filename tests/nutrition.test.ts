import { describe, it, expect } from 'vitest';
import {
  calculateNutritionTargets,
  calculateMacroSummary,
} from '../lib/domain/nutrition';

describe('Nutrition Domain Calculations', () => {
  it('calculates baseline TDEE and goal targets for 79kg male', () => {
    // 79kg, 176cm, 26yo, male, moderate activity
    const targets = calculateNutritionTargets(79, 176, 26, true, 'moderate', 'recomposition');

    // TDEE for 79kg male @ moderate activity (1.55x BMR of ~1765) is ~2736 kcal
    expect(targets.tdee).toBeGreaterThan(2500);
    expect(targets.tdee).toBeLessThan(2900);

    // Recomp calorie target is slightly below maintenance (-250 kcal)
    expect(targets.calorieTarget).toBe(targets.tdee - 250);

    // Protein target for 79kg @ 2.0g/kg is ~158g
    expect(targets.proteinTargetG).toBe(158);

    // Water target for 79kg @ 35ml/kg is ~2750ml
    expect(targets.waterTargetMl).toBe(2750);
  });

  it('calculates macro remaining budget and percentage', () => {
    const meals = [
      { calories: 340, protein_g: 22, carbs_g: 34, fat_g: 13 },
      { calories: 520, protein_g: 54, carbs_g: 45, fat_g: 11 },
    ];

    const summary = calculateMacroSummary(2100, 150, meals);

    // Consumed calories: 340 + 520 = 860 kcal
    expect(summary.consumedCalories).toBe(860);
    // Consumed protein: 22 + 54 = 76 g
    expect(summary.consumedProteinG).toBe(76);
    // Remaining calories: 2100 - 860 = 1240 kcal
    expect(summary.remainingCalories).toBe(1240);
    // Remaining protein: 150 - 76 = 74 g
    expect(summary.remainingProteinG).toBe(74);

    // Progress percentage
    expect(summary.calorieProgressPct).toBe(Math.round((860 / 2100) * 100));
    expect(summary.proteinProgressPct).toBe(Math.round((76 / 150) * 100));
  });
});
