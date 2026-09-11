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
  Calendar,
  RotateCcw,
  Sliders,
  Sparkles,
  Clock,
  RefreshCw,
  Zap,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Food, Meal, Goal, DailyLog, MealType, Profile } from '@/lib/db/schema';
import { calculateMacroSummary } from '@/lib/domain/nutrition';
import { Language, t } from '@/lib/domain/i18n';
import {
  PROTEIN_FOODS_CATALOG,
  ProteinFood,
  searchProteinFoods,
} from '@/lib/domain/protein-foods';
import {
  DailyMealPlan,
  MealProgramType,
  ScheduledMealSlot,
  ScheduledMealItem,
  ScheduledMeal,
  generateDailyMealPlan,
  addMealItem,
  removeMealItem,
  swapMealItem,
  updateMealItemPortion,
  setMealLoggedStatus,
} from '@/lib/domain/meal-planner';
import { CustomizeMealModal } from '@/components/nutrition/CustomizeMealModal';

export default function NutritionPage() {
  const [lang, setLang] = useState<Language>('id');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [activeTab, setActiveTab] = useState<'log' | 'schedule' | 'protein_guide'>('schedule');

  // Meal Plan State
  const [mealProgram, setMealProgram] = useState<MealProgramType>('cutting');
  const [mealPlan, setMealPlan] = useState<DailyMealPlan | null>(null);

  // Customize Modal State
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeSlot, setCustomizeSlot] = useState<ScheduledMealSlot>('breakfast');
  const [customizeSlotTitle, setCustomizeSlotTitle] = useState('');
  const [customizeMode, setCustomizeMode] = useState<'add' | 'swap' | 'edit_portion'>('add');
  const [customizeItem, setCustomizeItem] = useState<ScheduledMealItem | undefined>(undefined);

  // Protein Catalog Search & Filter
  const [proteinCategory, setProteinCategory] = useState<'all' | 'animal' | 'plant' | 'dairy_supp'>('all');
  const [proteinSearch, setProteinSearch] = useState('');

  // Quick 5-second Direct Add State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickCalories, setQuickCalories] = useState('450');
  const [quickProtein, setQuickProtein] = useState('35');
  const [quickMealType, setQuickMealType] = useState<MealType>('lunch');
  const [quickMealName, setQuickMealName] = useState('');

  const loadData = useCallback(async () => {
    const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
    setLang(savedLang);

    const p = await db.profiles.toCollection().first();
    setProfile(p || null);

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

    // Load or generate daily meal plan
    const initialProgram: MealProgramType =
      g?.goal_type === 'build_muscle' ? 'bulking' : 'cutting';
    setMealProgram(initialProgram);

    try {
      const savedPlanJson = localStorage.getItem('lean_daily_meal_plan');
      if (savedPlanJson) {
        const parsed = JSON.parse(savedPlanJson) as DailyMealPlan;
        setMealPlan(parsed);
        setMealProgram(parsed.program);
      } else {
        const generated = generateDailyMealPlan({
          weightKg: p?.weight_kg || 75,
          heightCm: p?.height_cm || 175,
          program: initialProgram,
        });
        setMealPlan(generated);
        localStorage.setItem('lean_daily_meal_plan', JSON.stringify(generated));
      }
    } catch {
      const fallback = generateDailyMealPlan({
        weightKg: p?.weight_kg || 75,
        heightCm: p?.height_cm || 175,
        program: initialProgram,
      });
      setMealPlan(fallback);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Program Switcher (Cutting vs Bulking vs Recomp)
  const handleProgramChange = (prog: MealProgramType) => {
    setMealProgram(prog);
    const weight = profile?.weight_kg || 75;
    const height = profile?.height_cm || 175;
    const newPlan = generateDailyMealPlan({ weightKg: weight, heightCm: height, program: prog });
    setMealPlan(newPlan);
    localStorage.setItem('lean_daily_meal_plan', JSON.stringify(newPlan));
  };

  // Reset Plan to Default recommendations
  const handleResetPlan = () => {
    const weight = profile?.weight_kg || 75;
    const height = profile?.height_cm || 175;
    const newPlan = generateDailyMealPlan({ weightKg: weight, heightCm: height, program: mealProgram });
    setMealPlan(newPlan);
    localStorage.setItem('lean_daily_meal_plan', JSON.stringify(newPlan));
  };

  // Log Scheduled Meal to Today's Consumed Log
  const handleLogScheduledMeal = async (scheduledMeal: ScheduledMeal) => {
    const profileId = profile?.id || 'usr-demo-01';
    const slotMap: Record<ScheduledMealSlot, MealType> = {
      breakfast: 'breakfast',
      lunch: 'lunch',
      snack_pre: 'snack',
      dinner: 'dinner',
      snack_post: 'snack',
    };

    const mealCalories = scheduledMeal.items.reduce((s, it) => s + (it.calories || 0), 0);
    const mealProtein = scheduledMeal.items.reduce((s, it) => s + (it.proteinG || 0), 0);
    const mealCarbs = scheduledMeal.items.reduce((s, it) => s + (it.carbsG || 0), 0);
    const mealFat = scheduledMeal.items.reduce((s, it) => s + (it.fatG || 0), 0);

    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      profile_id: profileId,
      eaten_at: new Date().toISOString(),
      meal_type: slotMap[scheduledMeal.slot] || 'snack',
      name: `${scheduledMeal.title} (${scheduledMeal.items.map((i) => i.name).join(', ')})`,
      calories: mealCalories,
      protein_g: mealProtein,
      carbs_g: mealCarbs,
      fat_g: mealFat,
      source: 'template',
      created_at: new Date().toISOString(),
    };

    await db.meals.put(newMeal);

    if (mealPlan) {
      const updated = setMealLoggedStatus(mealPlan, scheduledMeal.slot, true);
      setMealPlan(updated);
      localStorage.setItem('lean_daily_meal_plan', JSON.stringify(updated));
    }

    await loadData();
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  // Modal Triggers for Customization
  const handleOpenAdd = (slot: ScheduledMealSlot, title: string) => {
    setCustomizeSlot(slot);
    setCustomizeSlotTitle(title);
    setCustomizeMode('add');
    setCustomizeItem(undefined);
    setIsCustomizeOpen(true);
  };

  const handleOpenSwap = (slot: ScheduledMealSlot, title: string, item: ScheduledMealItem) => {
    setCustomizeSlot(slot);
    setCustomizeSlotTitle(title);
    setCustomizeMode('swap');
    setCustomizeItem(item);
    setIsCustomizeOpen(true);
  };

  const handleOpenEditPortion = (slot: ScheduledMealSlot, title: string, item: ScheduledMealItem) => {
    setCustomizeSlot(slot);
    setCustomizeSlotTitle(title);
    setCustomizeMode('edit_portion');
    setCustomizeItem(item);
    setIsCustomizeOpen(true);
  };

  const handleRemoveItem = (slot: ScheduledMealSlot, itemId: string) => {
    if (!mealPlan) return;
    const updated = removeMealItem(mealPlan, slot, itemId);
    setMealPlan(updated);
    localStorage.setItem('lean_daily_meal_plan', JSON.stringify(updated));
  };

  const handleSaveCustomItem = (item: ScheduledMealItem) => {
    if (!mealPlan) return;
    let updated = mealPlan;
    if (customizeMode === 'add') {
      updated = addMealItem(mealPlan, customizeSlot, item);
    } else if (customizeMode === 'swap' && customizeItem) {
      updated = swapMealItem(mealPlan, customizeSlot, customizeItem.id, item);
    } else if (customizeMode === 'edit_portion' && customizeItem) {
      updated = updateMealItemPortion(mealPlan, customizeSlot, customizeItem.id, item.portion);
    }
    setMealPlan(updated);
    localStorage.setItem('lean_daily_meal_plan', JSON.stringify(updated));
  };

  // Direct Quick 5-Second Add
  const handleQuickAdd = async () => {
    const cal = parseInt(quickCalories, 10) || 0;
    const prot = parseFloat(quickProtein) || 0;
    if (cal <= 0 && prot <= 0) return;

    const profileId = profile?.id || 'usr-demo-01';
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      profile_id: profileId,
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

  // Quick Water Increment
  const handleAddWater = async (amountMl: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = await db.dailyLogs.where('date').equals(todayStr).first();
    if (existing) {
      await db.dailyLogs.update(existing.id, {
        water_ml: (existing.water_ml || 0) + amountMl,
      });
    } else {
      const profileId = profile?.id || 'usr-demo-01';
      await db.dailyLogs.add({
        id: `log-${Date.now()}`,
        profile_id: profileId,
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

  // Filter protein catalog
  const filteredCatalog = searchProteinFoods(proteinSearch).filter((f) => {
    if (proteinCategory === 'all') return true;
    return f.category === proteinCategory;
  });

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

        {/* Dual Bars */}
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

          {/* Protein */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">{t('protein', lang)}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-warning/20 text-warning font-bold">
                  Kunci Otot & Lean
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

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 border border-surfaceBorder gap-1">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'bg-primary text-black shadow-md shadow-primary/20'
              : 'text-mutedText hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Jadwal Makan' : 'Meal Schedule'}</span>
        </button>

        <button
          onClick={() => setActiveTab('protein_guide')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'protein_guide'
              ? 'bg-primary text-black shadow-md shadow-primary/20'
              : 'text-mutedText hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Katalog Protein' : 'Protein Guide'}</span>
        </button>

        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'log'
              ? 'bg-primary text-black shadow-md shadow-primary/20'
              : 'text-mutedText hover:text-white'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Hari Ini' : "Today's Log"}</span>
        </button>
      </div>

      {/* 4. TAB 1: JADWAL MAKAN & REKOMENDASI TERJADWAL */}
      {activeTab === 'schedule' && mealPlan && (
        <div className="space-y-4">
          {/* Program Switcher Card (Cutting vs Bulking vs Recomp) */}
          <div className="bg-surface border border-surfaceBorder rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
                  {lang === 'id' ? 'Fokus Program Makanan' : 'Program Objective'}
                </span>
                <h3 className="text-sm font-black text-white">{mealPlan.programName}</h3>
              </div>

              <button
                onClick={handleResetPlan}
                className="p-1.5 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-mutedText hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                title="Reset ke rekomendasi default program"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">{lang === 'id' ? 'Reset Rekomendasi' : 'Reset Plan'}</span>
              </button>
            </div>

            {/* Segmented Program Buttons */}
            <div className="grid grid-cols-3 gap-1.5 bg-card p-1 rounded-2xl border border-surfaceBorder">
              <button
                onClick={() => handleProgramChange('cutting')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  mealProgram === 'cutting'
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-sm'
                    : 'text-mutedText hover:text-white'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span>Cutting (Turun BB)</span>
              </button>

              <button
                onClick={() => handleProgramChange('bulking')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  mealProgram === 'bulking'
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm'
                    : 'text-mutedText hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Bulking (Naik Otot)</span>
              </button>

              <button
                onClick={() => handleProgramChange('recomp')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  mealProgram === 'recomp'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-sm'
                    : 'text-mutedText hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recomp (Seimbang)</span>
              </button>
            </div>

            {/* Target vs Total Plan Macros */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-surfaceBorder/60 text-center text-xs">
              <div className="bg-card/60 p-2 rounded-xl border border-surfaceBorder/40">
                <span className="text-[9px] uppercase font-bold text-mutedText block">Target Kalori</span>
                <span className="font-mono font-black text-white text-sm">
                  {mealPlan.totalPlanCalories}{' '}
                  <span className="text-[10px] font-normal text-mutedText">/ {mealPlan.targetCalories} kcal</span>
                </span>
              </div>

              <div className="bg-card/60 p-2 rounded-xl border border-surfaceBorder/40">
                <span className="text-[9px] uppercase font-bold text-mutedText block">Target Protein</span>
                <span className="font-mono font-black text-warning text-sm">
                  {mealPlan.totalPlanProteinG}g{' '}
                  <span className="text-[10px] font-normal text-mutedText">/ {mealPlan.targetProteinG}g</span>
                </span>
              </div>

              <div className="bg-card/60 p-2 rounded-xl border border-surfaceBorder/40">
                <span className="text-[9px] uppercase font-bold text-mutedText block">Karbo & Lemak</span>
                <span className="font-mono font-bold text-slate-300 text-xs mt-0.5 block">
                  {mealPlan.totalPlanCarbsG}g C • {mealPlan.totalPlanFatG}g F
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Timeline Cards */}
          <div className="space-y-3">
            {mealPlan.meals.map((meal) => {
              const mealCalories = meal.items.reduce((s, it) => s + (it.calories || 0), 0);
              const mealProtein = meal.items.reduce((s, it) => s + (it.proteinG || 0), 0);

              return (
                <div
                  key={meal.slot}
                  className="bg-surface border border-surfaceBorder rounded-3xl p-4 shadow-sm space-y-3 hover:border-surfaceBorder/80 transition-all"
                >
                  {/* Slot Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-mono font-bold text-primary">
                          {meal.timeRange}
                        </span>
                        {meal.logged && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {lang === 'id' ? 'Tercatat' : 'Logged'}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-white mt-0.5">{meal.title}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-white block">
                        {mealCalories} kcal
                      </span>
                      <span className="text-[11px] font-mono font-bold text-warning">
                        {mealProtein.toFixed(1)}g protein
                      </span>
                    </div>
                  </div>

                  {/* Item List */}
                  <div className="space-y-2 pt-1 border-t border-surfaceBorder/60">
                    {meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-card/70 border border-surfaceBorder/60 rounded-2xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-bold text-white truncate block">
                              {item.name}
                            </strong>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface text-mutedText shrink-0">
                              {item.portion} {item.unit}
                            </span>
                          </div>
                          <p className="text-[10px] text-subtleText font-mono mt-0.5">
                            {item.calories} kcal •{' '}
                            <span className="text-warning font-semibold">{item.proteinG}g protein</span>
                            {item.carbsG > 0 && ` • ${item.carbsG}g C`}
                          </p>
                        </div>

                        {/* Action buttons for item */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditPortion(meal.slot, meal.title, item)}
                            className="px-2 py-1 rounded-lg bg-surface border border-surfaceBorder hover:border-primary/40 text-[10px] font-bold text-mutedText hover:text-white transition-all"
                            title="Atur Porsi"
                          >
                            Porsi
                          </button>
                          <button
                            onClick={() => handleOpenSwap(meal.slot, meal.title, item)}
                            className="p-1 rounded-lg bg-surface border border-surfaceBorder hover:border-primary/40 text-mutedText hover:text-primary transition-all"
                            title="Ganti Makanan"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(meal.slot, item.id)}
                            className="p-1 rounded-lg bg-surface border border-surfaceBorder hover:border-rose-500/40 text-mutedText hover:text-rose-400 transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Slot Footer Action */}
                  <div className="flex items-center gap-2 pt-1 border-t border-surfaceBorder/60">
                    <button
                      onClick={() => handleOpenAdd(meal.slot, meal.title)}
                      className="flex-1 py-2 px-3 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      <span>{lang === 'id' ? 'Tambah Makanan' : 'Add Item'}</span>
                    </button>

                    <button
                      onClick={() => handleLogScheduledMeal(meal)}
                      className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        meal.logged
                          ? 'bg-card border border-surfaceBorder text-mutedText hover:text-white'
                          : 'bg-primary hover:bg-primary-hover text-black shadow-md shadow-primary/20 active:scale-95'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                      <span>
                        {meal.logged
                          ? (lang === 'id' ? 'Catat Ulang' : 'Log Again')
                          : (lang === 'id' ? 'Sudah Dimakan' : 'Mark Eaten')}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 2: KATALOG MAKANAN SUMBER PROTEIN */}
      {activeTab === 'protein_guide' && (
        <div className="space-y-3">
          {/* Filter category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setProteinCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                proteinCategory === 'all'
                  ? 'bg-primary text-black font-extrabold shadow-sm'
                  : 'bg-surface border border-surfaceBorder text-mutedText hover:text-white'
              }`}
            >
              Semua Sumber ({PROTEIN_FOODS_CATALOG.length})
            </button>
            <button
              onClick={() => setProteinCategory('animal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                proteinCategory === 'animal'
                  ? 'bg-primary text-black font-extrabold shadow-sm'
                  : 'bg-surface border border-surfaceBorder text-mutedText hover:text-white'
              }`}
            >
              🥩 Hewani (Ayam, Sapi, Ikan)
            </button>
            <button
              onClick={() => setProteinCategory('plant')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                proteinCategory === 'plant'
                  ? 'bg-primary text-black font-extrabold shadow-sm'
                  : 'bg-surface border border-surfaceBorder text-mutedText hover:text-white'
              }`}
            >
              🌱 Nabati (Tempe, Tahu, Edamame)
            </button>
            <button
              onClick={() => setProteinCategory('dairy_supp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                proteinCategory === 'dairy_supp'
                  ? 'bg-primary text-black font-extrabold shadow-sm'
                  : 'bg-surface border border-surfaceBorder text-mutedText hover:text-white'
              }`}
            >
              🥛 Whey & Dairy
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
            <input
              type="text"
              value={proteinSearch}
              onChange={(e) => setProteinSearch(e.target.value)}
              placeholder={lang === 'id' ? 'Cari dada ayam, salmon, tempe, whey...' : 'Search protein food...'}
              className="w-full bg-surface border border-surfaceBorder rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Catalog Cards */}
          <div className="space-y-2.5">
            {filteredCatalog.map((food) => (
              <div
                key={food.id}
                className="bg-surface border border-surfaceBorder rounded-2xl p-3.5 space-y-2.5 hover:border-surfaceBorder/80 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-extrabold text-white">{food.name}</h4>
                      <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-card border border-surfaceBorder text-mutedText">
                        {food.categoryLabel}
                      </span>
                      {food.tier === 'gold' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          ⭐ Gold Protein
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 text-xs font-mono mt-1">
                      <span className="text-sm font-black text-warning">
                        {food.proteinG}g <span className="text-[10px] font-bold text-mutedText">protein</span>
                      </span>
                      <span className="text-mutedText">•</span>
                      <span className="text-slate-200">
                        {food.calories} kcal
                      </span>
                      <span className="text-mutedText">/ {food.servingSize} {food.unit}</span>
                    </div>
                  </div>

                  {/* Quick Add buttons to slot */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        if (mealPlan) {
                          const item: ScheduledMealItem = {
                            id: `item-${Date.now()}`,
                            foodId: food.id,
                            name: food.name,
                            portion: food.servingSize,
                            unit: food.unit,
                            calories: food.calories,
                            proteinG: food.proteinG,
                            carbsG: food.carbsG,
                            fatG: food.fatG,
                            category: 'protein',
                          };
                          const updated = addMealItem(mealPlan, 'lunch', item);
                          setMealPlan(updated);
                          localStorage.setItem('lean_daily_meal_plan', JSON.stringify(updated));
                          setActiveTab('schedule');
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-[10px] font-bold text-primary hover:text-white transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Jadwal Siang</span>
                    </button>
                  </div>
                </div>

                {/* Practical Preparation Tip */}
                <div className="bg-card/60 p-2.5 rounded-xl border border-surfaceBorder/40 text-[11px] text-mutedText leading-relaxed flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p>{food.prepTipId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 3: CATATAN HARI INI (LOGGED MEALS) */}
      {activeTab === 'log' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-mutedText">
              {lang === 'id' ? 'Daftar Makanan yang Sudah Dikonsumsi' : 'Logged Today'}
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {todayMeals.length} {lang === 'id' ? 'entri' : 'entries'}
            </span>
          </div>

          {todayMeals.length === 0 ? (
            <div className="text-center py-10 bg-surface border border-surfaceBorder rounded-2xl p-6">
              <Utensils className="w-8 h-8 text-subtleText mx-auto mb-2" />
              <p className="text-xs text-mutedText">
                {lang === 'id'
                  ? 'Belum ada makanan yang dicatat hari ini. Cek tab Jadwal Makan dan klik "Sudah Dimakan"!'
                  : 'No meals logged yet today. Check the Meal Schedule tab and click "Mark Eaten"!'}
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-bold text-xs"
                >
                  Buka Jadwal Makan
                </button>
                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="px-4 py-2 rounded-xl bg-card border border-surfaceBorder text-white font-bold text-xs"
                >
                  {t('quick_add_title', lang)}
                </button>
              </div>
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

      {/* Customize Meal Modal */}
      <CustomizeMealModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        slot={customizeSlot}
        slotTitle={customizeSlotTitle}
        mode={customizeMode}
        existingItem={customizeItem}
        onSaveItem={handleSaveCustomItem}
        lang={lang}
      />
    </div>
  );
}
