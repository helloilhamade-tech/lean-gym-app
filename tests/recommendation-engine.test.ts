import { describe, it, expect } from 'vitest';
import {
  calculate7DayWeightAverage,
  calculateReadiness,
  generateDailyRecommendations,
} from '../lib/domain/recommendations';
import { Goal, Workout, Meal } from '../lib/db/schema';

describe('Recommendation Engine v1 & Weight Trend', () => {
  it('AT-03: 7-day rolling average filters out single-day weight spikes', () => {
    // 7 days of weights with day 3 having a temporary water retention spike (80.5 kg)
    const weights = [
      { date: '2026-09-08', weightKg: 78.4 },
      { date: '2026-09-07', weightKg: 78.5 },
      { date: '2026-09-06', weightKg: 78.6 },
      { date: '2026-09-05', weightKg: 78.7 },
      { date: '2026-09-04', weightKg: 80.5 }, // 1-day spike from salty food
      { date: '2026-09-03', weightKg: 78.9 },
      { date: '2026-09-02', weightKg: 79.0 },
    ];

    const result = calculate7DayWeightAverage(weights);
    // Average of 78.4+78.5+78.6+78.7+80.5+78.9+79.0 = 552.6 / 7 = 78.94 -> 78.9 kg
    expect(result.rollingAverageKg).toBe(78.9);
    // The latest weight is 78.4 kg
    expect(result.latestWeightKg).toBe(78.4);
    // Smooth trend is maintained despite the spike
    expect(result.rollingAverageKg).toBeLessThan(79.5);
  });

  it('Calculates readiness correctly based on sleep hours and subjective energy', () => {
    // Poor sleep (< 5.5h) or low energy -> 'low'
    expect(calculateReadiness(5.0, 2, 3)).toBe('low');
    expect(calculateReadiness(8.0, 1, 1)).toBe('low');

    // Good sleep (>= 7h) and good energy (>= 3.5) and low soreness -> 'good'
    expect(calculateReadiness(7.5, 4, 2)).toBe('good');

    // Moderate cases
    expect(calculateReadiness(6.5, 3, 3)).toBe('moderate');
  });

  it('AT-05: Ranks high-protein / lower-calorie options higher when protein gap is large and calories are limited', () => {
    const goal: Goal = {
      id: 'g-1',
      profile_id: 'p-1',
      goal_type: 'recomposition',
      target_weight_kg: 75,
      weekly_rate_kg: -0.4,
      status: 'active',
      daily_calorie_target: 2000,
      daily_protein_target_g: 150,
      created_at: new Date().toISOString(),
    };

    // User consumed 1700 kcal and 105g protein (remaining: 300 kcal and 45g protein)
    const meals: Meal[] = [
      {
        id: 'm-1',
        profile_id: 'p-1',
        eaten_at: new Date().toISOString(),
        meal_type: 'lunch',
        calories: 1700,
        protein_g: 105,
        carbs_g: 150,
        fat_g: 50,
        source: 'manual',
        created_at: new Date().toISOString(),
      },
    ];

    const recs = generateDailyRecommendations({
      profileId: 'p-1',
      goal,
      todayMeals: meals,
      recentWeights: [{ date: '2026-09-08', weightKg: 78.4 }],
    });

    const nutritionRec = recs.find((r) => r.type === 'nutrition');
    expect(nutritionRec).toBeDefined();
    // Should prioritize high-protein lean options
    expect(nutritionRec?.action_payload?.suggested_type).toBe('high_protein_lean');
    expect(nutritionRec?.rationale).toContain('protein');
  });

  it('Generates volume modification recommendation if readiness is low for today workout', () => {
    const todayWorkout: Workout = {
      id: 'wkt-1',
      profile_id: 'p-1',
      name: 'Upper Body A',
      scheduled_at: '2026-09-08',
      status: 'scheduled',
      created_at: new Date().toISOString(),
    };

    const recs = generateDailyRecommendations({
      profileId: 'p-1',
      todayWorkout,
      todayDailyLog: { sleep_hours: 5.0, subjective_energy: 2, soreness: 4, readiness: 'low' },
      recentWeights: [],
      todayMeals: [],
    });

    const trainingRec = recs.find((r) => r.type === 'training');
    expect(trainingRec).toBeDefined();
    // Does NOT cancel workout, but modifies volume/intensity
    expect(trainingRec?.title).toContain('Modifikasi Beban');
    expect(trainingRec?.rationale).toContain('kurangi 1 set aksesori');
  });
});
