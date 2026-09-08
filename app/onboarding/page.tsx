'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  Flame,
  Dumbbell,
  Scale,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import {
  Profile,
  Goal,
  Program,
  GoalType,
  ActivityLevel,
  SplitType,
  Workout,
  WorkoutExercise,
  SetEntry,
} from '@/lib/db/schema';
import { calculateNutritionTargets } from '@/lib/domain/nutrition';
import { SEED_EXERCISES } from '@/lib/db/seed-data';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form states
  const [name, setName] = useState('Alex');
  const [goalType, setGoalType] = useState<GoalType>('recomposition');
  const [heightCm, setHeightCm] = useState(176);
  const [weightKg, setWeightKg] = useState(79);
  const [targetWeightKg, setTargetWeightKg] = useState(75);
  const [age, setAge] = useState(26);
  const [isMale, setIsMale] = useState(true);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [sleepHours, setSleepHours] = useState(7.5);
  const [customCalories, setCustomCalories] = useState<number | null>(null);
  const [customProtein, setCustomProtein] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto calculate targets
  const calculatedTargets = calculateNutritionTargets(
    weightKg,
    heightCm,
    age,
    isMale,
    activityLevel,
    goalType
  );

  const finalCalories = customCalories || calculatedTargets.calorieTarget;
  const finalProtein = customProtein || calculatedTargets.proteinTargetG;

  // Split recommendation based on days per week
  const splitType: SplitType =
    daysPerWeek === 3
      ? 'full_body'
      : daysPerWeek === 4
      ? 'upper_lower'
      : 'ppl';

  const splitNames: Record<SplitType, string> = {
    full_body: 'Full Body 3x Seminggu',
    upper_lower: 'Upper / Lower 4x Seminggu (Optimal Lean Recomp)',
    ppl: 'Push / Pull / Legs 5-6x Seminggu',
    custom: 'Custom Split',
  };

  const handleFinishOnboarding = async () => {
    setIsSaving(true);
    try {
      const profileId = `usr-${Date.now()}`;
      const newProfile: Profile = {
        id: profileId,
        name: name.trim() || 'Atlet',
        height_cm: heightCm,
        weight_kg: weightKg,
        activity_level: activityLevel,
        units: 'metric',
        timezone: 'Asia/Jakarta',
        language: 'id',
        created_at: new Date().toISOString(),
      };

      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        profile_id: profileId,
        goal_type: goalType,
        target_weight_kg: targetWeightKg,
        weekly_rate_kg: -0.4,
        status: 'active',
        daily_calorie_target: finalCalories,
        daily_protein_target_g: finalProtein,
        created_at: new Date().toISOString(),
      };

      const newProgram: Program = {
        id: `prog-${Date.now()}`,
        profile_id: profileId,
        name: splitNames[splitType],
        split_type: splitType,
        days_per_week: daysPerWeek,
        start_date: new Date().toISOString().split('T')[0],
        active: true,
        created_at: new Date().toISOString(),
      };

      // Initial measurement baseline
      const initialMeasurement = {
        id: `meas-${Date.now()}`,
        profile_id: profileId,
        measured_at: new Date().toISOString(),
        weight_kg: weightKg,
        waist_cm: 84.0,
        notes: 'Berat awal onboarding',
        created_at: new Date().toISOString(),
      };

      // Initial Day 1 Workout
      const todayStr = new Date().toISOString().split('T')[0];
      const workoutId = `wkt-${Date.now()}`;
      const day1Workout: Workout = {
        id: workoutId,
        profile_id: profileId,
        program_id: newProgram.id,
        name: splitType === 'upper_lower' ? 'Upper Body A' : 'Day 1 Training',
        scheduled_at: todayStr,
        status: 'scheduled',
        duration_min: 55,
        created_at: new Date().toISOString(),
      };

      // Setup workout exercises
      const ex1 = SEED_EXERCISES[0]; // Incline DB Press
      const ex2 = SEED_EXERCISES[3]; // Lat Pulldown
      const ex3 = SEED_EXERCISES[6]; // Seated DB Shoulder Press
      const ex4 = SEED_EXERCISES[9]; // Tricep Pushdown
      const ex5 = SEED_EXERCISES[12]; // Hammer Curl

      const weList: WorkoutExercise[] = [
        { id: `we-${workoutId}-1`, workout_id: workoutId, exercise_id: ex1.id, sort_order: 1, target_sets: 3, target_reps: '6-8', rest_sec: 90 },
        { id: `we-${workoutId}-2`, workout_id: workoutId, exercise_id: ex2.id, sort_order: 2, target_sets: 3, target_reps: '8-10', rest_sec: 90 },
        { id: `we-${workoutId}-3`, workout_id: workoutId, exercise_id: ex3.id, sort_order: 3, target_sets: 3, target_reps: '8-10', rest_sec: 90 },
        { id: `we-${workoutId}-4`, workout_id: workoutId, exercise_id: ex4.id, sort_order: 4, target_sets: 3, target_reps: '10-12', rest_sec: 60 },
        { id: `we-${workoutId}-5`, workout_id: workoutId, exercise_id: ex5.id, sort_order: 5, target_sets: 3, target_reps: '10-12', rest_sec: 60 },
      ];

      // Save to database
      await db.profiles.put(newProfile);
      await db.goals.put(newGoal);
      await db.programs.put(newProgram);
      await db.measurements.put(initialMeasurement);
      await db.workouts.put(day1Workout);

      for (const we of weList) {
        await db.workoutExercises.put(we);
        for (let i = 1; i <= we.target_sets; i++) {
          await db.sets.put({
            id: `set-${we.id}-${i}`,
            workout_exercise_id: we.id,
            set_no: i,
            set_type: 'normal',
            weight_kg: 15,
            reps: 8,
            completed: false,
            sync_status: 'synced',
          });
        }
      }

      // Initial daily log
      await db.dailyLogs.put({
        id: `log-${Date.now()}`,
        profile_id: profileId,
        date: todayStr,
        steps: 0,
        water_ml: 0,
        sleep_hours: sleepHours,
        readiness: 'good',
      });

      router.replace('/today');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-2 animate-in fade-in duration-200">
      {/* Top progress indicator */}
      <div>
        <div className="flex items-center justify-between mb-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-primary'
                    : s < step
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-surfaceBorder'
                }`}
              />
            ))}
          </div>

          <span className="text-xs font-mono text-mutedText font-semibold w-8 text-right">
            0{step}/07
          </span>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-6 pt-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/20 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Filosofi LEAN</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-snug">
              Jangan buat otak lelah berpikir.<br />
              <span className="text-primary">Ketahui tindakan terbaikmu hari ini.</span>
            </h1>
            <p className="text-sm text-mutedText leading-relaxed">
              LEAN menggabungkan progres beban di gym, target protein, dan pemulihan tubuh
              menjadi satu arahan harian yang sederhana, tenang, dan terarah.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-surfaceBorder">
                <div className="w-9 h-9 rounded-xl bg-card text-primary flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Catat Minimal</h4>
                  <p className="text-[11px] text-mutedText">Prefill data beban & makanan cepat dalam hitungan detik.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-surfaceBorder">
                <div className="w-9 h-9 rounded-xl bg-card text-accent flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Rekomendasi Akurat</h4>
                  <p className="text-[11px] text-mutedText">Aturan progresif otomatis menentukan kapan harus naik beban.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: GOAL */}
        {step === 2 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-black text-white">Pilih Target Utama Tubuh</h2>
            <p className="text-xs text-mutedText">
              Program dan anggaran nutrisi akan disesuaikan secara otomatis.
            </p>

            <div className="space-y-2.5 pt-2">
              {[
                { id: 'recomposition', label: 'Lean Recomposition', desc: 'Turunkan lemak sambil membangun otot atletis.', tag: 'Rekomendasi' },
                { id: 'fat_loss', label: 'Fat Loss / Cutting', desc: 'Fokus penurunan kadar lemak dengan defisit kalori terarah.' },
                { id: 'build_muscle', label: 'Build Muscle / Bulking', desc: 'Maksimalkan pertumbuhan massa otot dan kekuatan.' },
                { id: 'lean', label: 'Maintain Athletic Shape', desc: 'Pertahankan berat dan komposisi tubuh ideal.' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setGoalType(opt.id as GoalType)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    goalType === opt.id
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'bg-surface border-surfaceBorder hover:border-surfaceBorder/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{opt.label}</h4>
                    {opt.tag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-black">
                        {opt.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mutedText mt-1">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: BODY METRICS */}
        {step === 3 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-black text-white">Profil & Ukuran Tubuh</h2>
            <p className="text-xs text-mutedText">
              Digunakan untuk menghitung baseline energi harian (TDEE).
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-mutedText block mb-1">Nama Panggilan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-surfaceBorder rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-mutedText block mb-1">Tinggi (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 170)}
                    className="w-full bg-surface border border-surfaceBorder rounded-xl px-4 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-mutedText block mb-1">Berat Saat Ini (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 70)}
                    className="w-full bg-surface border border-surfaceBorder rounded-xl px-4 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-mutedText block mb-1">Target Berat (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 68)}
                    className="w-full bg-surface border border-surfaceBorder rounded-xl px-4 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-mutedText block mb-1">Usia</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value, 10) || 25)}
                    className="w-full bg-surface border border-surfaceBorder rounded-xl px-4 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: TRAINING FREQUENCY */}
        {step === 4 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-black text-white">Frekuensi Latihan Mingguan</h2>
            <p className="text-xs text-mutedText">
              Sistem akan menentukan split program yang paling efisien untuk jadwalmu.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[3, 4, 5].map((d) => (
                <div
                  key={d}
                  onClick={() => setDaysPerWeek(d)}
                  className={`p-4 rounded-2xl border text-center cursor-pointer transition-all ${
                    daysPerWeek === d
                      ? 'bg-primary/10 border-primary text-white'
                      : 'bg-surface border-surfaceBorder text-mutedText'
                  }`}
                >
                  <span className="text-2xl font-black font-mono block text-white">{d}x</span>
                  <span className="text-[11px] font-semibold">Hari / Minggu</span>
                </div>
              ))}
            </div>

            {/* Split recommendation preview */}
            <div className="p-4 rounded-2xl bg-card border border-primary/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                Split yang Direkomendasikan
              </span>
              <h4 className="text-sm font-bold text-white">{splitNames[splitType]}</h4>
              <p className="text-xs text-mutedText">
                {daysPerWeek === 4
                  ? 'Format Upper/Lower memberikan pemulihan 48-72 jam terbaik per grup otot untuk tujuan lean.'
                  : 'Split seimbang untuk konsistensi dan stimulasi hipertrofi teratur.'}
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: NUTRITION TARGET PREVIEW */}
        {step === 5 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-black text-white">Target Nutrisi Harian</h2>
            <p className="text-xs text-mutedText">
              Dihitung otomatis dengan rumus Mifflin-St Jeor & rasio protein optimal lean.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-surface border border-surfaceBorder flex items-center justify-between">
                <div>
                  <span className="text-xs text-mutedText block">Target Kalori Harian</span>
                  <span className="text-2xl font-black font-mono text-white">
                    {finalCalories} <span className="text-xs font-normal text-mutedText">kcal</span>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-card text-primary font-bold">
                  Defisit Terukur
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-surfaceBorder flex items-center justify-between">
                <div>
                  <span className="text-xs text-mutedText block">Target Protein Harian</span>
                  <span className="text-2xl font-black font-mono text-warning">
                    {finalProtein} <span className="text-xs font-normal text-mutedText">g/hari</span>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-card text-warning font-bold">
                  ~2.0g per kg
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: RECOVERY & SLEEP */}
        {step === 6 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-black text-white">Pola Tidur & Aktivitas</h2>
            <p className="text-xs text-mutedText">
              Memengaruhi skor kesiapan fisik (Readiness) agar rekomendasi tidak memaksa saat lelah.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-mutedText block mb-1">
                  Rata-rata Durasi Tidur: <strong className="text-white font-mono">{sleepHours} Jam</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-mutedText block mb-2">Tingkat Aktivitas Harian</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sedentary', label: 'Banyak Duduk' },
                    { id: 'light', label: 'Aktivitas Ringan' },
                    { id: 'moderate', label: 'Cukup Aktif (6-8k langkah)' },
                    { id: 'very_active', label: 'Sangat Aktif' },
                  ].map((act) => (
                    <div
                      key={act.id}
                      onClick={() => setActivityLevel(act.id as ActivityLevel)}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                        activityLevel === act.id
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-surface border-surfaceBorder text-mutedText'
                      }`}
                    >
                      {act.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & ACTIVATE */}
        {step === 7 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-black text-white">Program Siap Dimulai!</h2>
            <p className="text-xs text-mutedText">
              Berikut ringkasan profil kebugaran pribadimu:
            </p>

            <div className="p-4 rounded-2xl bg-surface border border-surfaceBorder space-y-3">
              <div className="flex justify-between text-xs py-1 border-b border-surfaceBorder">
                <span className="text-mutedText">Target</span>
                <span className="font-bold text-white capitalize">{goalType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-surfaceBorder">
                <span className="text-mutedText">Berat & Target</span>
                <span className="font-mono font-bold text-white">{weightKg} kg → {targetWeightKg} kg</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-surfaceBorder">
                <span className="text-mutedText">Program Latihan</span>
                <span className="font-bold text-primary">{splitNames[splitType]}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-mutedText">Nutrisi</span>
                <span className="font-mono text-white font-bold">{finalCalories} kcal • {finalProtein}g protein</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-primary/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-[11px] text-mutedText">
                Semua data tersimpan aman secara offline di perangkatmu.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-4">
        {step < 7 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all"
          >
            <span>Lanjutkan</span>
            <ChevronRight className="w-4 h-4 stroke-[3px]" />
          </button>
        ) : (
          <button
            onClick={handleFinishOnboarding}
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all"
          >
            <span>Mulai Petualangan LEAN</span>
            <Check className="w-4 h-4 stroke-[3px]" />
          </button>
        )}
      </div>
    </div>
  );
}
