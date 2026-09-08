import { describe, it, expect } from 'vitest';
import {
  calculateEst1RM,
  calculateTotalVolume,
  evaluateProgression,
  checkPersonalRecords,
} from '../lib/domain/progressive-overload';

describe('Progressive Overload Domain Engine', () => {
  it('calculates estimated 1RM using Epley formula correctly', () => {
    // 1RM = weight * (1 + reps / 30)
    expect(calculateEst1RM(100, 1)).toBe(100);
    // 100 kg x 10 reps -> 100 * (1 + 10/30) = 133.3 kg
    expect(calculateEst1RM(100, 10)).toBe(133.3);
    // 15 kg x 8 reps -> 15 * (1 + 8/30) = 19.0 kg
    expect(calculateEst1RM(15, 8)).toBe(19);
    // 0 or invalid input returns 0
    expect(calculateEst1RM(0, 5)).toBe(0);
    expect(calculateEst1RM(50, 0)).toBe(0);
  });

  it('calculates total workout session volume in kg', () => {
    const sets = [
      { weight_kg: 15, reps: 8, completed: true },
      { weight_kg: 15, reps: 8, completed: true },
      { weight_kg: 15, reps: 7, completed: true },
      { weight_kg: 20, reps: 10, completed: false }, // uncompleted set should be ignored
    ];
    // 15*8 + 15*8 + 15*7 = 120 + 120 + 105 = 345 kg
    expect(calculateTotalVolume(sets)).toBe(345);
  });

  it('AT-02: Suggests load increase when all working sets hit upper rep ceiling with RPE <= 8', () => {
    // Target is 6-8 reps. User performed 3 sets of 8 reps with RPE <= 8.
    const sets = [
      { weightKg: 15, reps: 8, rpe: 8, completed: true },
      { weightKg: 15, reps: 8, rpe: 7.5, completed: true },
      { weightKg: 15, reps: 8, rpe: 8, completed: true },
    ];

    const result = evaluateProgression('6-8', sets, 'chest');
    expect(result.type).toBe('increase_weight');
    expect(result.suggestedWeightKg).toBe(17.5); // 15 + 2.5
    expect(result.incrementKg).toBe(2.5);
    expect(result.message).toContain('Add 2.5 kg (17.5 kg)');
  });

  it('Suggests repeating weight and aiming for more reps when ceiling is not yet achieved', () => {
    // User achieved 8, 8, 7 reps (last set missed top ceiling of 8)
    const sets = [
      { weightKg: 15, reps: 8, rpe: 8, completed: true },
      { weightKg: 15, reps: 8, rpe: 8, completed: true },
      { weightKg: 15, reps: 7, rpe: 9, completed: true },
    ];

    const result = evaluateProgression('6-8', sets, 'chest');
    expect(result.type).toBe('aim_reps');
    expect(result.suggestedWeightKg).toBe(15);
    expect(result.message).toContain('Repeat 15 kg and aim for 8 reps');
  });

  it('Detects personal record (PR) on higher weight or 1RM', () => {
    const currentSets = [
      { weightKg: 17.5, reps: 8, completed: true },
    ];
    const previousHistory = {
      bestWeightKg: 15,
      best1rm: 19.0,
      bestVolumeKg: 345,
    };

    const pr = checkPersonalRecords(currentSets, previousHistory);
    expect(pr.isWeightPR).toBe(true);
    expect(pr.is1rmPR).toBe(true);
    expect(pr.newBestWeightKg).toBe(17.5);
  });
});
