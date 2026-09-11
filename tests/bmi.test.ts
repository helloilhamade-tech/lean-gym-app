import { describe, it, expect } from 'vitest';
import {
  calculateBmi,
  classifyBmi,
  calculateIdealWeightRange,
  analyzeBmi,
} from '../lib/domain/bmi';

describe('BMI Domain Calculations & Categorization', () => {
  it('calculates BMI correctly from height and weight', () => {
    // 176cm, 78.4kg -> 78.4 / (1.76 * 1.76) = 25.3
    const bmi = calculateBmi(176, 78.4);
    expect(bmi).toBe(25.3);

    // 170cm, 65kg -> 65 / (1.7 * 1.7) = 22.5
    expect(calculateBmi(170, 65)).toBe(22.5);
  });

  it('calculates ideal weight range for given height', () => {
    // For 175cm in Asia standard (18.5 - 22.9 BMI)
    const rangeAsia = calculateIdealWeightRange(175, 'asia');
    expect(rangeAsia.minKg).toBe(56.7);
    expect(rangeAsia.maxKg).toBe(70.1);

    // For 175cm in WHO standard (18.5 - 24.9 BMI)
    const rangeWho = calculateIdealWeightRange(175, 'who');
    expect(rangeWho.minKg).toBe(56.7);
    expect(rangeWho.maxKg).toBe(76.3);
  });

  it('classifies Asia-Pacific BMI categories accurately', () => {
    expect(classifyBmi(17.5, 'asia').category).toBe('underweight');
    expect(classifyBmi(21.0, 'asia').category).toBe('normal');
    expect(classifyBmi(24.0, 'asia').category).toBe('overweight');
    expect(classifyBmi(27.5, 'asia').category).toBe('obese1');
    expect(classifyBmi(32.0, 'asia').category).toBe('obese2');
  });

  it('classifies WHO International BMI categories accurately', () => {
    expect(classifyBmi(17.5, 'who').category).toBe('underweight');
    expect(classifyBmi(23.5, 'who').category).toBe('normal');
    expect(classifyBmi(27.0, 'who').category).toBe('overweight');
    expect(classifyBmi(32.0, 'who').category).toBe('obese1');
  });

  it('performs complete BMI analysis with weight delta to ideal range', () => {
    // 176cm individual at 78.4kg -> max ideal Asia is 70.9kg -> +7.5kg diff
    const result = analyzeBmi(176, 78.4, 'asia');
    expect(result.bmi).toBe(25.3);
    expect(result.classification.category).toBe('obese1');
    expect(result.weightDiffKg).toBeGreaterThan(7.0);
    expect(result.weightDiffKg).toBeLessThan(8.0);
  });
});
