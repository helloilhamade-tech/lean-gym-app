import { describe, it, expect } from 'vitest';
import {
  generateDailyMealPlan,
  calculatePlanTotals,
  addMealItem,
  removeMealItem,
  swapMealItem,
  updateMealItemPortion,
} from '@/lib/domain/meal-planner';
import {
  PROTEIN_FOODS_CATALOG,
  getProteinFoodsByCategory,
  getProteinFoodsByProgram,
  searchProteinFoods,
} from '@/lib/domain/protein-foods';

describe('Protein Foods Catalog', () => {
  it('contains diverse animal, plant, and dairy/supplement sources', () => {
    expect(PROTEIN_FOODS_CATALOG.length).toBeGreaterThan(10);
    const animal = getProteinFoodsByCategory('animal');
    const plant = getProteinFoodsByCategory('plant');
    const dairySupp = getProteinFoodsByCategory('dairy_supp');

    expect(animal.length).toBeGreaterThan(0);
    expect(plant.length).toBeGreaterThan(0);
    expect(dairySupp.length).toBeGreaterThan(0);
  });

  it('filters foods suitable for cutting and bulking correctly', () => {
    const cuttingFoods = getProteinFoodsByProgram('cutting');
    const bulkingFoods = getProteinFoodsByProgram('bulking');

    // Dada ayam should be in both
    expect(cuttingFoods.some((f) => f.id === 'pf-dada-ayam')).toBe(true);
    expect(bulkingFoods.some((f) => f.id === 'pf-dada-ayam')).toBe(true);

    // Peanut butter should be in bulking
    expect(bulkingFoods.some((f) => f.id === 'pf-selai-kacang')).toBe(true);
  });

  it('searches foods by Indonesian name or keyword', () => {
    const ayamMatches = searchProteinFoods('ayam');
    expect(ayamMatches.length).toBeGreaterThan(0);
    expect(ayamMatches[0].name.toLowerCase()).toContain('ayam');

    const tempeMatches = searchProteinFoods('tempe');
    expect(tempeMatches.length).toBeGreaterThan(0);
  });
});

describe('Meal Planner Engine', () => {
  it('generates a calorie deficit and high protein target for cutting', () => {
    const plan = generateDailyMealPlan({
      weightKg: 75,
      heightCm: 175,
      program: 'cutting',
    });

    expect(plan.program).toBe('cutting');
    // Protein target for 75kg at 2.2 g/kg = 165g
    expect(plan.targetProteinG).toBe(165);
    // Calories must be lower than standard maintenance
    expect(plan.targetCalories).toBeLessThan(2300);
    // 4 standard daily slots
    expect(plan.meals.length).toBe(4);
    expect(plan.meals.some((m) => m.slot === 'breakfast')).toBe(true);
    expect(plan.meals.some((m) => m.slot === 'lunch')).toBe(true);
    expect(plan.meals.some((m) => m.slot === 'dinner')).toBe(true);
  });

  it('generates a calorie surplus with higher energy for bulking', () => {
    const plan = generateDailyMealPlan({
      weightKg: 75,
      heightCm: 175,
      program: 'bulking',
    });

    expect(plan.program).toBe('bulking');
    // Protein target for 75kg at 1.9 g/kg = 143g
    expect(plan.targetProteinG).toBe(143);
    // Calories must be higher than cutting
    expect(plan.targetCalories).toBeGreaterThan(2400);
    expect(plan.meals.length).toBe(4);
  });

  it('updates plan totals when adding a meal item', () => {
    const plan = generateDailyMealPlan({
      weightKg: 75,
      program: 'cutting',
    });
    const initialCalories = plan.totalPlanCalories;

    const updated = addMealItem(plan, 'breakfast', {
      id: 'test-item-1',
      name: 'Telur Tambahan',
      portion: 1,
      unit: 'butir',
      calories: 78,
      proteinG: 6.3,
      carbsG: 0.6,
      fatG: 5.3,
    });

    expect(updated.totalPlanCalories).toBe(initialCalories + 78);
    expect(updated.totalPlanProteinG).toBeCloseTo(plan.totalPlanProteinG + 6.3, 1);
  });

  it('updates portion and scales macros proportionally', () => {
    const plan = generateDailyMealPlan({
      weightKg: 75,
      program: 'cutting',
    });

    const targetItem = plan.meals[0].items[0]; // Putih telur 120g, 62 kcal
    const updated = updateMealItemPortion(plan, 'breakfast', targetItem.id, 240); // 2x portion

    const updatedItem = updated.meals[0].items.find((i) => i.id === targetItem.id);
    expect(updatedItem?.portion).toBe(240);
    expect(updatedItem?.calories).toBe(Math.round(targetItem.calories * 2));
    expect(updatedItem?.proteinG).toBeCloseTo(targetItem.proteinG * 2, 1);
  });

  it('removes and swaps meal items cleanly', () => {
    const plan = generateDailyMealPlan({
      weightKg: 75,
      program: 'cutting',
    });

    const itemToRemove = plan.meals[0].items[0];
    const afterRemove = removeMealItem(plan, 'breakfast', itemToRemove.id);
    expect(afterRemove.meals[0].items.some((i) => i.id === itemToRemove.id)).toBe(false);

    // Swap item
    const itemToSwap = plan.meals[1].items[0]; // Lunch dada ayam
    const afterSwap = swapMealItem(plan, 'lunch', itemToSwap.id, {
      id: 'swapped-salmon',
      name: 'Ikan Salmon Panggang',
      portion: 150,
      unit: 'g',
      calories: 309,
      proteinG: 33,
      carbsG: 0,
      fatG: 18.5,
    });

    expect(afterSwap.meals[1].items.some((i) => i.name === 'Ikan Salmon Panggang')).toBe(true);
    expect(afterSwap.meals[1].items.some((i) => i.id === itemToSwap.id)).toBe(false);
  });
});
