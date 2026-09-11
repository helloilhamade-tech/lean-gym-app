'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Calendar,
  Clock,
  Flame,
  Plus,
  ChevronRight,
  Sparkles,
  BookOpen,
  Edit3,
  Calendar as CalendarIcon,
  Sliders,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Workout, Program, ExerciseHistory, Exercise } from '@/lib/db/schema';
import { Language, t } from '@/lib/domain/i18n';
import { CustomExerciseModal } from '@/components/workout/CustomExerciseModal';
import { RoutineEditorModal } from '@/components/workout/RoutineEditorModal';
import { WorkoutFocusModal } from '@/components/workout/WorkoutFocusModal';
import { WorkoutCalendarModal } from '@/components/workout/WorkoutCalendarModal';
import { getLocalDateString } from '@/lib/domain/calendar-sync';

export default function WorkoutPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('id');
  const [program, setProgram] = useState<Program | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [historyRecords, setHistoryRecords] = useState<Array<ExerciseHistory & { exerciseName?: string }>>([]);
  const [isCustomExerciseOpen, setIsCustomExerciseOpen] = useState(false);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [focusModalDate, setFocusModalDate] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
    setLang(savedLang);

    const p = await db.programs.filter((prog) => Boolean(prog.active)).first();
    setProgram(p || null);

    const wList = await db.workouts.toArray();
    setWorkouts(wList);

    const hList = await db.exerciseHistory.toArray();
    const exercises = await db.exercises.toArray();
    const exerciseMap = new Map(exercises.map((e) => [e.id, e.name_id || e.name]));

    const mapped = hList.map((h) => ({
      ...h,
      exerciseName: exerciseMap.get(h.exercise_id) || h.exercise_id,
    }));
    setHistoryRecords(mapped);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const localToday = getLocalDateString();
  const isoToday = new Date().toISOString().split('T')[0];
  const todayWorkout =
    workouts.find((w) => w.scheduled_at === localToday || w.scheduled_at === isoToday) ||
    workouts.find((w) => w.status === 'in_progress');

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header with Active Program & Quick Start */}
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
          onClick={() => {
            if (todayWorkout) {
              router.push(`/workout/active?id=${todayWorkout.id}`);
            } else {
              router.push('/workout/active');
            }
          }}
          className="py-2 px-3.5 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all"
        >
          <Dumbbell className="w-4 h-4" />
          <span>{t('start_workout', lang)}</span>
        </button>
      </div>

      {/* 2. FEATURE HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div
          onClick={() => router.push('/workout/muscle-guide')}
          className="bg-gradient-to-r from-accent/15 via-card to-surface border border-accent/30 rounded-2xl p-3.5 cursor-pointer hover:border-accent active:scale-[0.99] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent px-2 py-0.5 rounded-full bg-accent/15">
                Fitur Visual
              </span>
              <h2 className="text-sm font-extrabold text-white">
                Direktori Otot & Mesin Gym
              </h2>
              <p className="text-[11px] text-mutedText">
                Anatomi otot tubuh & tips alat gym.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent text-black flex items-center justify-center font-bold shrink-0 ml-2">
              <BookOpen className="w-4 h-4 stroke-[2.2px]" />
            </div>
          </div>
        </div>

        {/* FEATURE: Kalender Latihan & Sinkronisasi */}
        <div
          onClick={() => setIsCalendarModalOpen(true)}
          className="bg-gradient-to-r from-emerald-500/15 via-card to-surface border border-emerald-500/30 rounded-2xl p-3.5 cursor-pointer hover:border-emerald-500 active:scale-[0.99] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15">
                Kalender & Sync
              </span>
              <h2 className="text-sm font-extrabold text-white">
                Kalender Latihan
              </h2>
              <p className="text-[11px] text-mutedText">
                Sync ke Google Calendar & HP (.ics).
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-400 text-black flex items-center justify-center font-bold shrink-0 ml-2">
              <CalendarIcon className="w-4 h-4 stroke-[2.2px]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Today's Workout CTA Banner */}
      <div className="bg-card border border-primary/30 rounded-2xl p-4 transition-all relative overflow-hidden space-y-3">
        <div
          onClick={() => {
            if (todayWorkout) {
              router.push(`/workout/active?id=${todayWorkout.id}`);
            } else {
              router.push('/workout/active');
            }
          }}
          className="flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">
              {lang === 'id' ? 'Sesi Hari Ini' : "Today's Session"}
            </span>
            <h2 className="text-base font-extrabold text-white mt-1.5">
              {todayWorkout?.name || (lang === 'id' ? 'Latihan Harian' : 'Daily Workout')}
            </h2>
            <div className="flex items-center gap-2 text-xs text-mutedText mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {todayWorkout?.duration_min || 45} min
              </span>
              <span>•</span>
              <span>Menu Latihan Harian</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
          </div>
        </div>

        {/* Quick Consultation & Calendar row */}
        <div className="flex gap-2 pt-1 border-t border-surfaceBorder/60">
          <button
            onClick={() => {
              setFocusModalDate(undefined);
              setIsFocusModalOpen(true);
            }}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-surface hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Pilih / Ganti Fokus</span>
          </button>

          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-surface hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-accent" />
            <span>Sync Kalender</span>
          </button>
        </div>
      </div>

      {/* 4. Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setFocusModalDate(undefined);
            setIsFocusModalOpen(true);
          }}
          className="py-2.5 px-3 rounded-xl bg-surface border border-surfaceBorder hover:border-primary text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Konsultasi Fokus</span>
        </button>

        <button
          onClick={() => router.push('/workout/program-editor')}
          className="py-2.5 px-3 rounded-xl bg-surface border border-surfaceBorder hover:border-primary text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5 text-primary" />
          <span>Atur Program Mingguan</span>
        </button>
      </div>

      {/* 5. Program Weekly Routine */}
      <section aria-label="Program split" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mutedText">
            {lang === 'id' ? 'Jadwal Mingguan' : 'Weekly Routine'}
          </h3>
          <button
            onClick={() => router.push('/workout/program-editor')}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Kustomisasi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
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

      {/* 6. Personal Records & Progressive Overload Milestones */}
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

      {/* Modals */}
      <CustomExerciseModal
        isOpen={isCustomExerciseOpen}
        onClose={() => setIsCustomExerciseOpen(false)}
        onCreated={() => loadData()}
      />

      <RoutineEditorModal
        isOpen={isRoutineEditorOpen}
        onClose={() => setIsRoutineEditorOpen(false)}
        onSaved={() => loadData()}
      />

      <WorkoutFocusModal
        isOpen={isFocusModalOpen}
        onClose={() => {
          setIsFocusModalOpen(false);
          setFocusModalDate(undefined);
        }}
        targetDateStr={focusModalDate}
        onWorkoutGenerated={() => loadData()}
      />

      <WorkoutCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        onOpenFocusModalForDate={(d) => {
          setFocusModalDate(d);
          setIsCalendarModalOpen(false);
          setIsFocusModalOpen(true);
        }}
      />
    </div>
  );
}
