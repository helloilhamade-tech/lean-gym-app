export type MealProgramType = 'cutting' | 'bulking' | 'recomp';

export type ScheduledMealSlot = 'breakfast' | 'lunch' | 'snack_pre' | 'dinner' | 'snack_post';

export interface ScheduledMealItem {
  id: string;
  foodId?: string;
  name: string;
  portion: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  category?: 'protein' | 'staple' | 'fat' | 'snack';
}

export interface ScheduledMeal {
  slot: ScheduledMealSlot;
  title: string;
  titleEn: string;
  timeRange: string;
  targetCalories: number;
  targetProteinG: number;
  items: ScheduledMealItem[];
  logged: boolean;
}

export interface DailyMealPlan {
  program: MealProgramType;
  programName: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  meals: ScheduledMeal[];
  totalPlanCalories: number;
  totalPlanProteinG: number;
  totalPlanCarbsG: number;
  totalPlanFatG: number;
}

/**
 * Calculates total macros across all scheduled meals
 */
export function calculatePlanTotals(meals: ScheduledMeal[]) {
  let totalCalories = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;

  for (const meal of meals) {
    for (const item of meal.items) {
      totalCalories += item.calories || 0;
      totalProteinG += item.proteinG || 0;
      totalCarbsG += item.carbsG || 0;
      totalFatG += item.fatG || 0;
    }
  }

  return {
    calories: Math.round(totalCalories),
    proteinG: Math.round(totalProteinG * 10) / 10,
    carbsG: Math.round(totalCarbsG * 10) / 10,
    fatG: Math.round(totalFatG * 10) / 10,
  };
}

/**
 * Generates an optimized scheduled daily meal plan based on weight, height, and goal
 */
export function generateDailyMealPlan(params: {
  weightKg: number;
  heightCm?: number;
  program: MealProgramType;
}): DailyMealPlan {
  const { weightKg, heightCm = 175, program } = params;
  const safeWeight = Math.max(45, Math.min(130, weightKg));

  // Base BMR estimation
  const bmr = 10 * safeWeight + 6.25 * heightCm - 5 * 25 + 5;
  const tdee = Math.round(bmr * 1.45); // Active gym-goer baseline

  let targetCalories = tdee;
  let proteinPerKg = 2.0;
  let programName = 'Lean Recomposition (Seimbang)';

  if (program === 'cutting') {
    // 400-500 kcal deficit; 2.2 g/kg protein to protect muscle mass
    targetCalories = Math.max(1500, tdee - 450);
    proteinPerKg = 2.2;
    programName = 'Nurunin Berat Badan (Cutting / Fat Loss)';
  } else if (program === 'bulking') {
    // +350-400 kcal surplus; 1.9 g/kg protein
    targetCalories = tdee + 350;
    proteinPerKg = 1.9;
    programName = 'Naikin Berat & Massa Otot (Bulking)';
  }

  const targetProteinG = Math.round(safeWeight * proteinPerKg);
  const targetFatG = Math.round((targetCalories * 0.25) / 9);
  const targetCarbsG = Math.max(
    50,
    Math.round((targetCalories - targetProteinG * 4 - targetFatG * 9) / 4)
  );

  let meals: ScheduledMeal[] = [];

  if (program === 'cutting') {
    // CUTTING: High volume, high lean protein, moderate carbs, low fats
    meals = [
      {
        slot: 'breakfast',
        title: 'Sarapan Pagi Tinggi Protein',
        titleEn: 'High-Protein Breakfast',
        timeRange: '07:00 – 08:30',
        targetCalories: Math.round(targetCalories * 0.24),
        targetProteinG: Math.round(targetProteinG * 0.25),
        logged: false,
        items: [
          {
            id: 'item-c-bf-1',
            foodId: 'pf-putih-telur',
            name: 'Putih Telur Rebus',
            portion: 120,
            unit: 'g (±4 butir)',
            calories: 62,
            proteinG: 13.2,
            carbsG: 0.8,
            fatG: 0.2,
            category: 'protein',
          },
          {
            id: 'item-c-bf-2',
            foodId: 'pf-telur-utuh',
            name: 'Telur Ayam Utuh Rebus',
            portion: 1,
            unit: 'butir',
            calories: 78,
            proteinG: 6.3,
            carbsG: 0.6,
            fatG: 5.3,
            category: 'protein',
          },
          {
            id: 'item-c-bf-3',
            name: 'Roti Gandum Utuh',
            portion: 2,
            unit: 'lembar',
            calories: 170,
            proteinG: 8,
            carbsG: 30,
            fatG: 2.4,
            category: 'staple',
          },
        ],
      },
      {
        slot: 'lunch',
        title: 'Makan Siang Lean & Padat Serat',
        titleEn: 'Lean & High-Fiber Lunch',
        timeRange: '12:00 – 13:30',
        targetCalories: Math.round(targetCalories * 0.35),
        targetProteinG: Math.round(targetProteinG * 0.35),
        logged: false,
        items: [
          {
            id: 'item-c-lu-1',
            foodId: 'pf-dada-ayam',
            name: 'Dada Ayam Fillet Panggang',
            portion: 160,
            unit: 'g',
            calories: 264,
            proteinG: 49.6,
            carbsG: 0,
            fatG: 5.8,
            category: 'protein',
          },
          {
            id: 'item-c-lu-2',
            name: 'Nasi Merah Pulen',
            portion: 120,
            unit: 'g',
            calories: 133,
            proteinG: 3.1,
            carbsG: 27.6,
            fatG: 1.1,
            category: 'staple',
          },
          {
            id: 'item-c-lu-3',
            foodId: 'pf-tahu-putih',
            name: 'Tahu Putih Kukus',
            portion: 100,
            unit: 'g',
            calories: 80,
            proteinG: 8,
            carbsG: 2,
            fatG: 4.8,
            category: 'protein',
          },
          {
            id: 'item-c-lu-4',
            name: 'Brokoli / Buncis Rebus',
            portion: 100,
            unit: 'g',
            calories: 35,
            proteinG: 2.8,
            carbsG: 7,
            fatG: 0.4,
            category: 'staple',
          },
        ],
      },
      {
        slot: 'snack_pre',
        title: 'Snack Pre-Workout / Sore',
        titleEn: 'Pre-Workout Energizer',
        timeRange: '16:00 – 17:00',
        targetCalories: Math.round(targetCalories * 0.16),
        targetProteinG: Math.round(targetProteinG * 0.15),
        logged: false,
        items: [
          {
            id: 'item-c-sn-1',
            name: 'Pisang Cavendish Segar',
            portion: 1,
            unit: 'buah',
            calories: 105,
            proteinG: 1.3,
            carbsG: 27,
            fatG: 0.3,
            category: 'snack',
          },
          {
            id: 'item-c-sn-2',
            foodId: 'pf-greek-yogurt',
            name: 'Greek Yogurt Plain',
            portion: 120,
            unit: 'g',
            calories: 104,
            proteinG: 12,
            carbsG: 4.8,
            fatG: 3.2,
            category: 'protein',
          },
        ],
      },
      {
        slot: 'dinner',
        title: 'Makan Malam Pemulihan Otot',
        titleEn: 'Recovery Dinner',
        timeRange: '19:00 – 20:30',
        targetCalories: Math.round(targetCalories * 0.25),
        targetProteinG: Math.round(targetProteinG * 0.25),
        logged: false,
        items: [
          {
            id: 'item-c-di-1',
            foodId: 'pf-ikan-nila',
            name: 'Ikan Nila / Tuna Panggang',
            portion: 150,
            unit: 'g',
            calories: 192,
            proteinG: 39,
            carbsG: 0,
            fatG: 4.1,
            category: 'protein',
          },
          {
            id: 'item-c-di-2',
            name: 'Kentang Rebus / Nasi Merah',
            portion: 150,
            unit: 'g',
            calories: 130,
            proteinG: 2.8,
            carbsG: 30,
            fatG: 0.2,
            category: 'staple',
          },
          {
            id: 'item-c-di-3',
            foodId: 'pf-tempe-kukus',
            name: 'Tempe Kukus Bumbu Kuning',
            portion: 60,
            unit: 'g',
            calories: 114,
            proteinG: 11.4,
            carbsG: 5.4,
            fatG: 6.6,
            category: 'protein',
          },
        ],
      },
    ];
  } else if (program === 'bulking') {
    // BULKING: Nutrient dense, calorie surplus, ample carbs for heavy lifting, healthy fats
    meals = [
      {
        slot: 'breakfast',
        title: 'Sarapan Berenergi Tinggi & Protein',
        titleEn: 'Power Breakfast',
        timeRange: '07:00 – 08:30',
        targetCalories: Math.round(targetCalories * 0.25),
        targetProteinG: Math.round(targetProteinG * 0.25),
        logged: false,
        items: [
          {
            id: 'item-b-bf-1',
            foodId: 'pf-telur-utuh',
            name: 'Telur Ayam Utuh Rebus/Orak-arik',
            portion: 3,
            unit: 'butir',
            calories: 234,
            proteinG: 18.9,
            carbsG: 1.8,
            fatG: 15.9,
            category: 'protein',
          },
          {
            id: 'item-b-bf-2',
            name: 'Rolled Oats / Oatmeal',
            portion: 50,
            unit: 'g',
            calories: 190,
            proteinG: 6.6,
            carbsG: 33.7,
            fatG: 3.4,
            category: 'staple',
          },
          {
            id: 'item-b-bf-3',
            foodId: 'pf-susu-lowfat',
            name: 'Susu Low Fat UHT',
            portion: 250,
            unit: 'ml',
            calories: 125,
            proteinG: 8.5,
            carbsG: 12,
            fatG: 3.5,
            category: 'protein',
          },
          {
            id: 'item-b-bf-4',
            name: 'Pisang Cavendish',
            portion: 1,
            unit: 'buah',
            calories: 105,
            proteinG: 1.3,
            carbsG: 27,
            fatG: 0.3,
            category: 'snack',
          },
        ],
      },
      {
        slot: 'lunch',
        title: 'Makan Siang Surplus Otot & Karbo Kompleks',
        titleEn: 'Mass Building Lunch',
        timeRange: '12:00 – 13:30',
        targetCalories: Math.round(targetCalories * 0.35),
        targetProteinG: Math.round(targetProteinG * 0.35),
        logged: false,
        items: [
          {
            id: 'item-b-lu-1',
            foodId: 'pf-daging-sapi-lean',
            name: 'Daging Sapi Has Dalam / Dada Ayam',
            portion: 160,
            unit: 'g',
            calories: 344,
            proteinG: 41.6,
            carbsG: 0,
            fatG: 19.2,
            category: 'protein',
          },
          {
            id: 'item-b-lu-2',
            name: 'Nasi Putih Pulen',
            portion: 200,
            unit: 'g',
            calories: 260,
            proteinG: 5.4,
            carbsG: 56,
            fatG: 0.6,
            category: 'staple',
          },
          {
            id: 'item-b-lu-3',
            foodId: 'pf-tempe-kukus',
            name: 'Tempe Kedelai Panggang',
            portion: 100,
            unit: 'g',
            calories: 190,
            proteinG: 19,
            carbsG: 9,
            fatG: 11,
            category: 'protein',
          },
          {
            id: 'item-b-lu-4',
            name: 'Tumis Buncis & Jagung Manis',
            portion: 100,
            unit: 'g',
            calories: 60,
            proteinG: 2,
            carbsG: 11,
            fatG: 1,
            category: 'staple',
          },
        ],
      },
      {
        slot: 'snack_pre',
        title: 'Snack Pre/Post-Workout Power',
        titleEn: 'Pre/Post Workout Shake & Snack',
        timeRange: '16:00 – 17:00',
        targetCalories: Math.round(targetCalories * 0.18),
        targetProteinG: Math.round(targetProteinG * 0.18),
        logged: false,
        items: [
          {
            id: 'item-b-sn-1',
            name: 'Roti Gandum Utuh',
            portion: 2,
            unit: 'lembar',
            calories: 170,
            proteinG: 8,
            carbsG: 30,
            fatG: 2.4,
            category: 'staple',
          },
          {
            id: 'item-b-sn-2',
            foodId: 'pf-selai-kacang',
            name: 'Selai Kacang Alami',
            portion: 25,
            unit: 'g (1.5 sdm)',
            calories: 156,
            proteinG: 6.6,
            carbsG: 5,
            fatG: 13.3,
            category: 'fat',
          },
          {
            id: 'item-b-sn-3',
            foodId: 'pf-whey-isolate',
            name: 'Whey Protein Isolate',
            portion: 1,
            unit: 'scoop (30g)',
            calories: 120,
            proteinG: 25,
            carbsG: 2,
            fatG: 1,
            category: 'protein',
          },
        ],
      },
      {
        slot: 'dinner',
        title: 'Makan Malam Padat Protein & Asam Lemak Sehat',
        titleEn: 'High Anabolic Dinner',
        timeRange: '19:00 – 20:30',
        targetCalories: Math.round(targetCalories * 0.22),
        targetProteinG: Math.round(targetProteinG * 0.22),
        logged: false,
        items: [
          {
            id: 'item-b-di-1',
            foodId: 'pf-ikan-salmon',
            name: 'Ikan Salmon Panggang',
            portion: 150,
            unit: 'g',
            calories: 309,
            proteinG: 33,
            carbsG: 0,
            fatG: 18.5,
            category: 'protein',
          },
          {
            id: 'item-b-di-2',
            name: 'Nasi Putih Pulen / Kentang',
            portion: 150,
            unit: 'g',
            calories: 195,
            proteinG: 4,
            carbsG: 42,
            fatG: 0.5,
            category: 'staple',
          },
          {
            id: 'item-b-di-3',
            foodId: 'pf-tahu-putih',
            name: 'Tahu Putih Bacem / Panggang',
            portion: 100,
            unit: 'g',
            calories: 80,
            proteinG: 8,
            carbsG: 2,
            fatG: 4.8,
            category: 'protein',
          },
        ],
      },
    ];
  } else {
    // RECOMP / MAINTENANCE
    meals = [
      {
        slot: 'breakfast',
        title: 'Sarapan Seimbang',
        titleEn: 'Balanced Breakfast',
        timeRange: '07:00 – 08:30',
        targetCalories: Math.round(targetCalories * 0.25),
        targetProteinG: Math.round(targetProteinG * 0.25),
        logged: false,
        items: [
          {
            id: 'item-r-bf-1',
            foodId: 'pf-telur-utuh',
            name: 'Telur Ayam Utuh',
            portion: 2,
            unit: 'butir',
            calories: 156,
            proteinG: 12.6,
            carbsG: 1.2,
            fatG: 10.6,
            category: 'protein',
          },
          {
            id: 'item-r-bf-2',
            name: 'Roti Gandum Utuh',
            portion: 2,
            unit: 'lembar',
            calories: 170,
            proteinG: 8,
            carbsG: 30,
            fatG: 2.4,
            category: 'staple',
          },
          {
            id: 'item-r-bf-3',
            name: 'Pisang Cavendish',
            portion: 1,
            unit: 'buah',
            calories: 105,
            proteinG: 1.3,
            carbsG: 27,
            fatG: 0.3,
            category: 'snack',
          },
        ],
      },
      {
        slot: 'lunch',
        title: 'Makan Siang Berprotein Tinggi',
        titleEn: 'High Protein Lunch',
        timeRange: '12:00 – 13:30',
        targetCalories: Math.round(targetCalories * 0.35),
        targetProteinG: Math.round(targetProteinG * 0.35),
        logged: false,
        items: [
          {
            id: 'item-r-lu-1',
            foodId: 'pf-dada-ayam',
            name: 'Dada Ayam Fillet Panggang',
            portion: 150,
            unit: 'g',
            calories: 247,
            proteinG: 46.5,
            carbsG: 0,
            fatG: 5.4,
            category: 'protein',
          },
          {
            id: 'item-r-lu-2',
            name: 'Nasi Putih / Merah',
            portion: 150,
            unit: 'g',
            calories: 195,
            proteinG: 4,
            carbsG: 42,
            fatG: 0.5,
            category: 'staple',
          },
          {
            id: 'item-r-lu-3',
            foodId: 'pf-tempe-kukus',
            name: 'Tempe Kedelai Kukus',
            portion: 80,
            unit: 'g',
            calories: 152,
            proteinG: 15.2,
            carbsG: 7.2,
            fatG: 8.8,
            category: 'protein',
          },
        ],
      },
      {
        slot: 'snack_pre',
        title: 'Snack Protein Sore',
        titleEn: 'Afternoon Protein Snack',
        timeRange: '16:00 – 17:00',
        targetCalories: Math.round(targetCalories * 0.15),
        targetProteinG: Math.round(targetProteinG * 0.15),
        logged: false,
        items: [
          {
            id: 'item-r-sn-1',
            foodId: 'pf-greek-yogurt',
            name: 'Greek Yogurt Plain',
            portion: 150,
            unit: 'g',
            calories: 130,
            proteinG: 15,
            carbsG: 6,
            fatG: 4,
            category: 'protein',
          },
        ],
      },
      {
        slot: 'dinner',
        title: 'Makan Malam Pemulihan',
        titleEn: 'Recovery Dinner',
        timeRange: '19:00 – 20:30',
        targetCalories: Math.round(targetCalories * 0.25),
        targetProteinG: Math.round(targetProteinG * 0.25),
        logged: false,
        items: [
          {
            id: 'item-r-di-1',
            foodId: 'pf-ikan-nila',
            name: 'Ikan Nila / Tuna Bakar',
            portion: 140,
            unit: 'g',
            calories: 179,
            proteinG: 36.4,
            carbsG: 0,
            fatG: 3.8,
            category: 'protein',
          },
          {
            id: 'item-r-di-2',
            name: 'Kentang Rebus',
            portion: 150,
            unit: 'g',
            calories: 130,
            proteinG: 2.8,
            carbsG: 30,
            fatG: 0.2,
            category: 'staple',
          },
        ],
      },
    ];
  }

  const totals = calculatePlanTotals(meals);

  return {
    program,
    programName,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    meals,
    totalPlanCalories: totals.calories,
    totalPlanProteinG: totals.proteinG,
    totalPlanCarbsG: totals.carbsG,
    totalPlanFatG: totals.fatG,
  };
}

/**
 * Adds an item to a specific meal slot
 */
export function addMealItem(
  plan: DailyMealPlan,
  slot: ScheduledMealSlot,
  item: ScheduledMealItem
): DailyMealPlan {
  const updatedMeals = plan.meals.map((meal) => {
    if (meal.slot === slot) {
      return {
        ...meal,
        items: [...meal.items, item],
      };
    }
    return meal;
  });

  const totals = calculatePlanTotals(updatedMeals);
  return {
    ...plan,
    meals: updatedMeals,
    totalPlanCalories: totals.calories,
    totalPlanProteinG: totals.proteinG,
    totalPlanCarbsG: totals.carbsG,
    totalPlanFatG: totals.fatG,
  };
}

/**
 * Updates an item's portion and recalculates its macros proportionally
 */
export function updateMealItemPortion(
  plan: DailyMealPlan,
  slot: ScheduledMealSlot,
  itemId: string,
  newPortion: number
): DailyMealPlan {
  const updatedMeals = plan.meals.map((meal) => {
    if (meal.slot === slot) {
      const updatedItems = meal.items.map((it) => {
        if (it.id === itemId && it.portion > 0 && newPortion > 0) {
          const ratio = newPortion / it.portion;
          return {
            ...it,
            portion: newPortion,
            calories: Math.round(it.calories * ratio),
            proteinG: Math.round(it.proteinG * ratio * 10) / 10,
            carbsG: Math.round(it.carbsG * ratio * 10) / 10,
            fatG: Math.round(it.fatG * ratio * 10) / 10,
          };
        }
        return it;
      });
      return { ...meal, items: updatedItems };
    }
    return meal;
  });

  const totals = calculatePlanTotals(updatedMeals);
  return {
    ...plan,
    meals: updatedMeals,
    totalPlanCalories: totals.calories,
    totalPlanProteinG: totals.proteinG,
    totalPlanCarbsG: totals.carbsG,
    totalPlanFatG: totals.fatG,
  };
}

/**
 * Removes an item from a scheduled meal slot
 */
export function removeMealItem(
  plan: DailyMealPlan,
  slot: ScheduledMealSlot,
  itemId: string
): DailyMealPlan {
  const updatedMeals = plan.meals.map((meal) => {
    if (meal.slot === slot) {
      return {
        ...meal,
        items: meal.items.filter((it) => it.id !== itemId),
      };
    }
    return meal;
  });

  const totals = calculatePlanTotals(updatedMeals);
  return {
    ...plan,
    meals: updatedMeals,
    totalPlanCalories: totals.calories,
    totalPlanProteinG: totals.proteinG,
    totalPlanCarbsG: totals.carbsG,
    totalPlanFatG: totals.fatG,
  };
}

/**
 * Swaps an existing item with a replacement item
 */
export function swapMealItem(
  plan: DailyMealPlan,
  slot: ScheduledMealSlot,
  itemId: string,
  newItem: ScheduledMealItem
): DailyMealPlan {
  const updatedMeals = plan.meals.map((meal) => {
    if (meal.slot === slot) {
      return {
        ...meal,
        items: meal.items.map((it) => (it.id === itemId ? newItem : it)),
      };
    }
    return meal;
  });

  const totals = calculatePlanTotals(updatedMeals);
  return {
    ...plan,
    meals: updatedMeals,
    totalPlanCalories: totals.calories,
    totalPlanProteinG: totals.proteinG,
    totalPlanCarbsG: totals.carbsG,
    totalPlanFatG: totals.fatG,
  };
}

/**
 * Toggles or sets the logged status of a meal
 */
export function setMealLoggedStatus(
  plan: DailyMealPlan,
  slot: ScheduledMealSlot,
  logged: boolean
): DailyMealPlan {
  const updatedMeals = plan.meals.map((meal) => {
    if (meal.slot === slot) {
      return { ...meal, logged };
    }
    return meal;
  });

  return {
    ...plan,
    meals: updatedMeals,
  };
}
