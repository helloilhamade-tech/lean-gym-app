import { describe, it, expect } from 'vitest';
import {
  calculateNavyBodyFat,
  calculateBmiBodyFat,
  classifyBodyFat,
  calculateBodyComposition,
  getCategoryThresholds,
} from '../lib/domain/body-fat';

describe('Body Fat Domain Calculations & Categorization', () => {
  it('calculates US Navy body fat percentage correctly for men', () => {
    // Standard athletic male: Height 178cm, Waist 82cm, Neck 38cm
    const bf = calculateNavyBodyFat({
      gender: 'male',
      heightCm: 178,
      waistCm: 82,
      neckCm: 38,
    });

    expect(bf).toBeGreaterThan(12);
    expect(bf).toBeLessThan(17);
    expect(typeof bf).toBe('number');
  });

  it('calculates US Navy body fat percentage correctly for women', () => {
    // Active female: Height 165cm, Waist 70cm, Hip 95cm, Neck 33cm
    const bf = calculateNavyBodyFat({
      gender: 'female',
      heightCm: 165,
      waistCm: 70,
      neckCm: 33,
      hipCm: 95,
    });

    expect(bf).toBeGreaterThan(20);
    expect(bf).toBeLessThan(26);
  });

  it('calculates Deurenberg BMI-based body fat estimation', () => {
    // Male: 176cm, 78kg (BMI ~25.2), Age 25
    const bfMale = calculateBmiBodyFat({
      gender: 'male',
      heightCm: 176,
      weightKg: 78,
      age: 25,
    });

    // Female: 165cm, 60kg (BMI ~22.0), Age 25
    const bfFemale = calculateBmiBodyFat({
      gender: 'female',
      heightCm: 165,
      weightKg: 60,
      age: 25,
    });

    expect(bfMale).toBeGreaterThan(17);
    expect(bfMale).toBeLessThan(23);
    // Females naturally have higher essential and total body fat
    expect(bfFemale).toBeGreaterThan(bfMale);
  });

  it('accurately classifies male body fat categories according to ACE standards', () => {
    expect(classifyBodyFat(4.5, 'male').category).toBe('essential');
    expect(classifyBodyFat(10.2, 'male').category).toBe('athletes');
    expect(classifyBodyFat(15.8, 'male').category).toBe('fitness');
    expect(classifyBodyFat(21.4, 'male').category).toBe('average');
    expect(classifyBodyFat(27.0, 'male').category).toBe('high');
  });

  it('accurately classifies female body fat categories according to ACE standards', () => {
    expect(classifyBodyFat(12.0, 'female').category).toBe('essential');
    expect(classifyBodyFat(18.5, 'female').category).toBe('athletes');
    expect(classifyBodyFat(23.2, 'female').category).toBe('fitness');
    expect(classifyBodyFat(28.0, 'female').category).toBe('average');
    expect(classifyBodyFat(34.5, 'female').category).toBe('high');
  });

  it('calculates full body composition breakdown (fat mass vs lean mass in kg)', () => {
    // 80 kg individual at 15.0% body fat
    const composition = calculateBodyComposition(80, 15.0, 'male');
    expect(composition.fatMassKg).toBe(12.0);
    expect(composition.leanMassKg).toBe(68.0);
    expect(composition.classification.category).toBe('fitness');
  });

  it('provides correct category threshold limits for visual bar gauge', () => {
    const maleThresholds = getCategoryThresholds('male');
    expect(maleThresholds.essentialMax).toBe(6);
    expect(maleThresholds.athletesMax).toBe(14);
    expect(maleThresholds.fitnessMax).toBe(18);
    expect(maleThresholds.averageMax).toBe(25);

    const femaleThresholds = getCategoryThresholds('female');
    expect(femaleThresholds.essentialMax).toBe(14);
    expect(femaleThresholds.athletesMax).toBe(21);
    expect(femaleThresholds.fitnessMax).toBe(25);
    expect(femaleThresholds.averageMax).toBe(32);
  });
});
