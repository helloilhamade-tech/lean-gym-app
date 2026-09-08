'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Plus,
  Droplet,
  Search,
  Check,
  Bookmark,
  Trash2,
  Utensils,
  ChevronRight,
  Info,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Food, Meal, Goal, DailyLog, MealType } from '@/lib/db/schema';
import { calculateMacroSummary } from '@/lib/domain/nutrition';
import { Language, t } from '@/lib/domain/i18n';

export default function NutritionPage() {
  const [lang, setLang] = useState<Language>('id');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'log' | 'food_library' | 'templates'>('log');

  // Quick 5-second Direct Add State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickCalories, setQuickCalories] = useState('450');
  const [quickProtein, setQuickProtein] = useState('35');
  const [quickMealType, setQuickMealType] = useState<MealType>('lunch');
  const [quickMealName, setQuickMealName] = useState('');

  // Selected food for portion add
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  const loadData = useCallback(async () => {
    const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
    setLang(savedLang);

    const g = await db.goals.where('status').equals('active').first();
    setGoal(g || null);

    const todayStr = new Date().toISOString().split('T')[0];
    const m = await db.meals
      .filter((meal) => meal.eaten_at.startsWith(todayStr))
      .toArray();
    setTodayMeals(m);

    const d = await db.dailyLogs.where('date').equals(todayStr).first();
    setDailyLog(d || null);

    const fList = await db.foods.toArray();
    setFoods(fList);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle 5-second Direct Calorie & Protein Log
  const handleQuickAdd = async () => {
    const cal = parseInt(quickCalories, 10) || 0;
    const prot = parseFloat(quickProtein) || 0;
    if (cal <= 0 && prot <= 0) return;

    const profile = await db.profiles.toCollection().first();
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      profile_id: profile?.id || 'usr-demo-01',
      eaten_at: new Date().toISOString(),
      meal_type: quickMealType,
      name: quickMealName.trim() || (lang === 'id' ? 'Menu Cepat' : 'Quick Meal'),
      calories: cal,
      protein_g: prot,
      carbs_g: Math.round(Math.max(0, (cal - prot * 4 - 45) / 4)),
      fat_g: 5,
      source: 'quick_add',
      created_at: new Date().toISOString(),
    };

    await db.meals.put(newMeal);
    setIsQuickAddOpen(false);
    setQuickMealName('');
    await loadData();
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  // Handle adding pre-seeded food item
  const handleAddFoodItem = async (food: Food, mult: number) => {
    const profile = await db.profiles.toCollection().first();
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      profile_id: profile?.id || 'usr-demo-01',
      eaten_at: new Date().toISOString(),
      meal_type: 'lunch',
      name: `${food.name} (${Math.round(food.serving_size * mult)}${food.unit})`,
      calories: Math.round(food.calories * mult),
      protein_g: Math.round(food.protein_g * mult * 10) / 10,
      carbs_g: Math.round(food.carbs_g * mult * 10) / 10,
      fat_g: Math.round(food.fat_g * mult * 10) / 10,
      source: 'saved_food',
      created_at: new Date().toISOString(),
    };

    await db.meals.put(newMeal);
    setSelectedFood(null);
    setPortionMultiplier(1);
    await loadData();
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  // Quick Water Increment
  const handleAddWater = async (amountMl: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = await db.dailyLogs.where('date').equals(todayStr).first();
    if (existing) {
      await db.dailyLogs.update(existing.id, {
        water_ml: (existing.water_ml || 0) + amountMl,
      });
    } else {
      const profile = await db.profiles.toCollection().first();
      await db.dailyLogs.add({
        id: `log-${Date.now()}`,
        profile_id: profile?.id || 'usr-demo-01',
        date: todayStr,
        steps: 0,
        water_ml: amountMl,
        sleep_hours: 7.0,
        readiness: 'good',
      });
    }
    await loadData();
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  // Delete Meal entry
  const handleDeleteMeal = async (mealId: string) => {
    await db.meals.delete(mealId);
    await loadData();
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  const calorieTarget = goal?.daily_calorie_target || 2100;
  const proteinTarget = goal?.daily_protein_target_g || 150;
  const macroSummary = calculateMacroSummary(calorieTarget, proteinTarget, todayMeals);

  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Nutrition Daily Budget Rings */}
      <section aria-label="Daily nutrition budget" className="bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-mutedText">
            {t('daily_budget', lang)}
          </span>
          <span className="text-xs font-mono text-primary font-semibold">
            {macroSummary.remainingCalories} kcal {t('remaining', lang).toLowerCase()}
          </span>
        </div>

        {/* Big Dual Bars */}
        <div className="space-y-3">
          {/* Calories */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-200 font-semibold">{t('calories', lang)}</span>
              <span className="font-mono text-mutedText">
                <strong className="text-white">{macroSummary.consumedCalories}</strong> / {calorieTarget} kcal
              </span>
            </div>
            <div className="w-full bg-card h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${macroSummary.calorieProgressPct}%` }}
              />
            </div>
          </div>

          {/* Protein (Primary driver for Lean Body Goal) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">{t('protein', lang)}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-warning/20 text-warning font-bold">
                  Kunci Lean
                </span>
              </div>
              <span className="font-mono text-mutedText">
                <strong className="text-white">{macroSummary.consumedProteinG}</strong> / {proteinTarget} g
              </span>
            </div>
            <div className="w-full bg-card h-2 rounded-full overflow-hidden">
              <div
                className="bg-warning h-full rounded-full transition-all duration-500"
                style={{ width: `${macroSummary.proteinProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick 5s Add Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="w-full py-3 rounded-2xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span>{t('quick_add_title', lang)}</span>
        </button>
      </section>

      {/* 2. Water Tracker Quick Bar */}
      <div className="bg-surface border border-surfaceBorder rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {dailyLog?.water_ml || 0} / 2,500 ml
            </span>
            <span className="text-[10px] text-mutedText">{t('water', lang)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddWater(250)}
            className="px-2.5 py-1.5 rounded-xl bg-card border border-surfaceBorder text-xs font-bold text-blue-400 hover:bg-blue-500/10 active:scale-95 transition-all"
          >
            +250 ml
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="px-2.5 py-1.5 rounded-xl bg-card border border-surfaceBorder text-xs font-bold text-blue-400 hover:bg-blue-500/10 active:scale-95 transition-all"
          >
            +500 ml
          </button>
        </div>
      </div>

      {/* 3. Sub-navigation: Hari Ini vs Food Library */}
      <div className="flex bg-surface rounded-xl p-1 border border-surfaceBorder">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'log'
              ? 'bg-card text-white shadow'
              : 'text-mutedText hover:text-white'
          }`}
        >
          {lang === 'id' ? 'Catatan Hari Ini' : "Today's Meals"}
        </button>
        <button
          onClick={() => setActiveTab('food_library')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'food_library'
              ? 'bg-card text-white shadow'
              : 'text-mutedText hover:text-white'
          }`}
        >
          {t('food_library', lang)}
        </button>
      </div>

      {/* 4. Active Tab Content */}
      {activeTab === 'log' ? (
        <div className="space-y-2">
          {todayMeals.length === 0 ? (
            <div className="text-center py-10 bg-surface border border-surfaceBorder rounded-2xl p-6">
              <Utensils className="w-8 h-8 text-subtleText mx-auto mb-2" />
              <p className="text-xs text-mutedText">
                {lang === 'id' ? 'Belum ada makanan yang dicatat hari ini.' : 'No meals logged yet today.'}
              </p>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-primary text-black font-bold text-xs"
              >
                {t('quick_add_title', lang)}
              </button>
            </div>
          ) : (
            todayMeals.map((meal) => (
              <div
                key={meal.id}
                className="bg-surface border border-surfaceBorder rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
                    {meal.meal_type}
                  </span>
                  <h4 className="text-xs font-bold text-white mt-0.5">
                    {meal.name || 'Menu'}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-subtleText mt-0.5">
                    <span>{meal.calories} kcal</span>
                    <span>•</span>
                    <span className="text-warning font-semibold">{meal.protein_g}g protein</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="p-2 text-subtleText hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Food Library Browser */
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'id' ? 'Cari ayam, telur, whey, tempe...' : 'Search chicken, eggs, whey...'}
              className="w-full bg-surface border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                onClick={() => handleAddFoodItem(food, 1)}
                className="bg-surface border border-surfaceBorder hover:border-primary/50 rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{food.name}</h4>
                  <p className="text-[10px] text-subtleText mt-0.5">
                    {food.serving_size} {food.unit} • {food.calories} kcal •{' '}
                    <strong className="text-warning">{food.protein_g}g protein</strong>
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-primary">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-extrabold text-white">
                {t('quick_add_title', lang)}
              </h3>
              <p className="text-xs text-mutedText mt-0.5">
                {lang === 'id' ? 'Catat langsung kalori & protein dalam 5 detik' : 'Fast 5-second entry'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-mutedText block mb-1">
                  {lang === 'id' ? 'Nama Makanan (Opsional)' : 'Meal Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={quickMealName}
                  onChange={(e) => setQuickMealName(e.target.value)}
                  placeholder={lang === 'id' ? 'cth. Nasi Ayam Bakar' : 'e.g. Chicken Rice'}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-mutedText block mb-1">
                    {t('calories', lang)} (kcal)
                  </label>
                  <input
                    type="number"
                    value={quickCalories}
                    onChange={(e) => setQuickCalories(e.target.value)}
                    className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 font-mono font-bold text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-mutedText block mb-1">
                    {t('protein', lang)} (g)
                  </label>
                  <input
                    type="number"
                    value={quickProtein}
                    onChange={(e) => setQuickProtein(e.target.value)}
                    className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 font-mono font-bold text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-card text-mutedText hover:text-white text-xs font-semibold"
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={handleQuickAdd}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all"
              >
                {t('save_meal', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
