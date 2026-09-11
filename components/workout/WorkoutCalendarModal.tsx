'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Plus,
  Sparkles,
  Share2,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Workout, WorkoutExercise, Exercise } from '@/lib/db/schema';
import {
  generateGoogleCalendarUrl,
  downloadICSFile,
  ExerciseSummary,
  getLocalDateString,
} from '@/lib/domain/calendar-sync';

interface WorkoutCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFocusModalForDate?: (dateStr: string) => void;
}

export function WorkoutCalendarModal({
  isOpen,
  onClose,
  onOpenFocusModalForDate,
}: WorkoutCalendarModalProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    getLocalDateString()
  );
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<ExerciseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load workouts
  const loadWorkouts = async () => {
    setIsLoading(true);
    try {
      const list = await db.workouts.toArray();
      setWorkouts(list);

      // Find workout for selectedDateStr
      const matched = list.find((w) => w.scheduled_at === selectedDateStr);
      setSelectedWorkout(matched || null);

      if (matched) {
        const weList = await db.workoutExercises
          .where('workout_id')
          .equals(matched.id)
          .sortBy('sort_order');

        const allExercises = await db.exercises.toArray();
        const exMap = new Map(allExercises.map((e) => [e.id, e.name_id || e.name]));

        setSelectedExercises(
          weList.map((we) => ({
            name: exMap.get(we.exercise_id) || 'Latihan',
            targetReps: we.target_reps,
            targetSets: we.target_sets,
          }))
        );
      } else {
        setSelectedExercises([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWorkouts();
    }
  }, [isOpen, selectedDateStr]);

  if (!isOpen) return null;

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build calendar matrix
  const workoutDateMap = new Map<string, Workout>();
  workouts.forEach((w) => {
    if (w.scheduled_at) {
      workoutDateMap.set(w.scheduled_at, w);
    }
  });

  const handleDayClick = (dayNumber: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    setSelectedDateStr(formatted);
  };

  const todayStr = getLocalDateString();

  const handleOpenGoogleCalendar = () => {
    if (!selectedWorkout) return;
    const url = generateGoogleCalendarUrl(selectedWorkout, selectedExercises, selectedDateStr);
    window.open(url, '_blank');
  };

  const handleDownloadICS = () => {
    if (!selectedWorkout) return;
    downloadICSFile(selectedWorkout, selectedExercises, selectedDateStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b border-surfaceBorder shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Kalender Latihan</h3>
              <p className="text-[11px] text-mutedText">
                Sinkronkan jadwal gym dengan kalender HP & Google
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-card p-2 rounded-2xl border border-surfaceBorder">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-surface text-mutedText hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-white">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-surface text-mutedText hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-card/60 p-3 rounded-2xl border border-surfaceBorder space-y-2">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-mutedText uppercase">
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
              <span>Min</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const workoutOnDay = workoutDateMap.get(dateKey);
                const isSelected = dateKey === selectedDateStr;
                const isToday = dateKey === todayStr;

                const isCompleted = workoutOnDay?.status === 'completed';
                const isRest = workoutOnDay?.duration_min === 0 || workoutOnDay?.name.includes('Istirahat');

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                      isSelected
                        ? 'bg-primary text-black font-extrabold shadow-md scale-105 z-10'
                        : isToday
                        ? 'border border-primary text-white bg-primary/10'
                        : 'text-slate-300 hover:bg-surface'
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>
                    {workoutOnDay && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected
                            ? 'bg-black'
                            : isCompleted
                            ? 'bg-emerald-400'
                            : isRest
                            ? 'bg-slate-400'
                            : 'bg-primary'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-mutedText border-t border-surfaceBorder/60">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Selesai
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Terjadwal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Rest
              </span>
            </div>
          </div>

          {/* Selected Date Detail Card */}
          <div className="bg-surface border border-surfaceBorder rounded-2xl p-3.5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-mutedText block">
                  {selectedDateStr === todayStr ? 'Hari Ini' : 'Tanggal Terpilih'}
                </span>
                <h4 className="text-sm font-extrabold text-white">{selectedDateStr}</h4>
              </div>

              {selectedWorkout && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedWorkout.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-primary/15 text-primary border border-primary/30'
                  }`}
                >
                  {selectedWorkout.status === 'completed' ? 'Selesai ✓' : 'Terjadwal'}
                </span>
              )}
            </div>

            {/* If workout exists */}
            {selectedWorkout ? (
              <div className="space-y-2 pt-1 border-t border-surfaceBorder/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-white line-clamp-1">
                      {selectedWorkout.name}
                    </span>
                  </div>
                  {selectedWorkout.duration_min ? (
                    <span className="text-[10px] text-mutedText flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {selectedWorkout.duration_min}m
                    </span>
                  ) : null}
                </div>

                {/* Exercises preview */}
                {selectedExercises.length > 0 && (
                  <div className="bg-card/70 rounded-xl p-2 space-y-1 text-[11px] text-mutedText">
                    {selectedExercises.map((ex, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-200 line-clamp-1">
                          {idx + 1}. {ex.name}
                        </span>
                        <span className="font-mono text-primary font-semibold shrink-0 ml-2">
                          {ex.targetSets}×{ex.targetReps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Start Workout Button */}
                {(selectedWorkout.duration_min ?? 0) > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/workout/active?id=${selectedWorkout.id}`);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all"
                  >
                    <Dumbbell className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>Mulai Latihan Sesi Ini</span>
                  </button>
                )}

                {/* Calendar Sync Buttons */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-mutedText block">
                    Sinkronisasi Kalender:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleOpenGoogleCalendar}
                      className="py-2 px-2.5 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px]">Google Calendar</span>
                    </button>

                    <button
                      onClick={handleDownloadICS}
                      className="py-2 px-2.5 rounded-xl bg-card hover:bg-surfaceBorder border border-surfaceBorder text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px]">Unduh .ICS (HP)</span>
                    </button>
                  </div>
                </div>

                {/* Change Focus Option */}
                {onOpenFocusModalForDate && (
                  <button
                    onClick={() => {
                      onOpenFocusModalForDate(selectedDateStr);
                      onClose();
                    }}
                    className="w-full py-2 text-center text-xs text-primary font-bold hover:underline"
                  >
                    Ganti Fokus Latihan untuk Tanggal Ini
                  </button>
                )}
              </div>
            ) : (
              /* If NO workout exists */
              <div className="py-2 text-center space-y-2">
                <p className="text-xs text-mutedText">
                  Belum ada jadwal latihan pada tanggal ini.
                </p>
                {onOpenFocusModalForDate && (
                  <button
                    onClick={() => {
                      onOpenFocusModalForDate(selectedDateStr);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-xl bg-primary text-black text-xs font-extrabold flex items-center justify-center gap-1.5 mx-auto active:scale-95 transition-all shadow-md shadow-primary/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Atur Latihan Tanggal Ini</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
