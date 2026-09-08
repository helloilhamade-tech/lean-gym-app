'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Calendar, Clock, Flame, Plus, ChevronRight, CheckCircle2, History } from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Workout, Program, ExerciseHistory, Exercise } from '@/lib/db/schema';
import { Language, t } from '@/lib/domain/i18n';

export default function WorkoutPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('id');
  const [program, setProgram] = useState<Program | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [historyRecords, setHistoryRecords] = useState<Array<ExerciseHistory & { exerciseName?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
    setLang(savedLang);

    async function loadData() {
      const p = await db.programs.where('active').equals(1).first();
      setProgram(p || null);

      const wList = await db.workouts.toArray();
      setWorkouts(wList);

      const hList = await db.exerciseHistory.toArray();
      const exercises = await db.exercises.toArray();
      const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]));

      const mapped = hList.map((h) => ({
        ...h,
        exerciseName: exerciseMap.get(h.exercise_id) || h.exercise_id,
      }));
      setHistoryRecords(mapped);
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header with Active Program */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {t('workout', lang)}
          </h1>
          <p className="text-xs text-mutedText mt-0.5">
            {program?.name || (lang === 'id' ? 'Program Aktif: Upper / Lower' : 'Active Split: Upper / Lower')}
          </p>
        </div>

        <button
          onClick={() => router.push('/workout/active')}
          className="py-2 px-3.5 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all"
        >
          <Dumbbell className="w-4 h-4" />
          <span>{t('start_workout', lang)}</span>
        </button>
      </div>

      {/* 2. Today's Workout CTA Banner */}
      <div
        onClick={() => router.push('/workout/active')}
        className="bg-card border border-primary/30 rounded-2xl p-4 cursor-pointer hover:border-primary active:scale-[0.99] transition-all relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">
              {lang === 'id' ? 'Sesi Hari Ini' : "Today's Session"}
            </span>
            <h2 className="text-base font-extrabold text-white mt-1.5">
              Upper Body A (Chest & Back Focus)
            </h2>
            <div className="flex items-center gap-2 text-xs text-mutedText mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 55 min
              </span>
              <span>•</span>
              <span>5 {t('exercises', lang).toLowerCase()}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
          </div>
        </div>
      </div>

      {/* 3. Program Weekly Routine */}
      <section aria-label="Program split" className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mutedText px-1">
          {lang === 'id' ? 'Jadwal Mingguan' : 'Weekly Routine'}
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Upper Body A', focus: 'Chest, Back, Arms', days: 'Senin / Day 1', active: true },
            { name: 'Lower Body A', focus: 'Quads, Hamstrings, Calves', days: 'Selasa / Day 2', active: false },
            { name: 'Rest / Active Walk', focus: 'Pemulihan & Langkah Ringan', days: 'Rabu / Day 3', isRest: true },
            { name: 'Upper Body B', focus: 'Shoulders, Back, Chest', days: 'Kamis / Day 4', active: false },
            { name: 'Lower Body B', focus: 'Squat, Hinge, Core', days: 'Jumat / Day 5', active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                item.active
                  ? 'bg-card border-surfaceBorder text-white'
                  : 'bg-surface/60 border-surfaceBorder/60 text-mutedText'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  item.active ? 'bg-primary/15 text-primary' : 'bg-surfaceBorder text-subtleText'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <p className="text-[10px] text-subtleText">{item.focus}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-mutedText">{item.days}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Personal Records & Progressive Overload Milestones */}
      <section aria-label="Personal records" className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 px-1">
          <Flame className="w-4 h-4 text-warning" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-mutedText">
            {lang === 'id' ? 'Catatan Rekor Beban (PR)' : 'Personal Bests (PR)'}
          </h3>
        </div>

        <div className="space-y-2">
          {historyRecords.slice(0, 5).map((rec) => (
            <div
              key={rec.id}
              className="bg-surface border border-surfaceBorder rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-200">{rec.exerciseName}</h4>
                <div className="flex items-center gap-2 text-[10px] text-mutedText mt-0.5">
                  <span>Est 1RM: {rec.est_1rm} kg</span>
                  <span>•</span>
                  <span>Vol: {rec.volume} kg</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-bold text-warning block">
                  {rec.best_weight_kg} kg
                </span>
                <span className="text-[10px] text-subtleText">× {rec.best_reps} reps</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
