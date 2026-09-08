import { describe, it, expect } from 'vitest';
import {
  MUSCLE_BREAKDOWN,
  EXERCISE_EQUIPMENT_GUIDE,
  MuscleCategory,
} from '../lib/domain/muscle-directory';

describe('Muscle Anatomy & Gym Equipment Directory', () => {
  it('contains valid anatomy breakdown for all 6 muscle categories', () => {
    const categories: MuscleCategory[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];

    for (const cat of categories) {
      const info = MUSCLE_BREAKDOWN[cat];
      expect(info).toBeDefined();
      expect(info.nameId).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(info.subMuscles.length).toBeGreaterThanOrEqual(2);

      for (const sm of info.subMuscles) {
        expect(sm.id).toBeTruthy();
        expect(sm.nameId).toBeTruthy();
        expect(sm.functionDesc).toBeTruthy();
        expect(sm.visualRole).toBeTruthy();
      }
    }
  });

  it('contains comprehensive exercises mapped with equipment look-for and mind-muscle cues', () => {
    expect(EXERCISE_EQUIPMENT_GUIDE.length).toBeGreaterThanOrEqual(15);

    for (const guide of EXERCISE_EQUIPMENT_GUIDE) {
      expect(guide.name).toBeTruthy();
      expect(guide.nameId).toBeTruthy();
      expect(guide.equipmentLookFor).toBeTruthy();
      expect(guide.setupTips).toBeTruthy();
      expect(guide.mindMuscleCue).toBeTruthy();
      expect(guide.defaultRepRange).toBeTruthy();
    }
  });

  it('filters exercises accurately by muscle category and equipment', () => {
    const chestMachineExercises = EXERCISE_EQUIPMENT_GUIDE.filter(
      (e) => e.muscleCategory === 'chest' && e.equipment === 'machine'
    );
    expect(chestMachineExercises.length).toBeGreaterThan(0);
    expect(chestMachineExercises[0].name).toContain('Machine');

    const backCableExercises = EXERCISE_EQUIPMENT_GUIDE.filter(
      (e) => e.muscleCategory === 'back' && e.equipment === 'cable'
    );
    expect(backCableExercises.length).toBeGreaterThan(0);
  });
});
