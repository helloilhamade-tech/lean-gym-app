'use client';

import { useState } from "react";
import {
  X,
  Sparkles,
  Dumbbell,
  Check,
} from "lucide-react";
import {
  WorkoutFocus,
  WorkoutDuration,
  EquipmentPreference,
  EnergyLevel,
  FOCUS_OPTIONS,
  generateAndSaveFocusWorkout,
} from '@/lib/domain/workout-generator';
import { BodyAnatomyVisualizer } from '@/components/ui/BodyAnatomyVisualizer';
import { getLocalDateString } from '@/lib/domain/calendar-sync';

interface WorkoutFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDateStr?: string;
  onWorkoutGenerated?: () => void;
}

export function WorkoutFocusModal({
  isOpen,
  onClose,
  targetDateStr,
  onWorkoutGenerated,
}: WorkoutFocusModalProps) {
  const [selectedFocus, setSelectedFocus] = useState<WorkoutFocus>('upper');
  const [durationMin, setDurationMin] = useState<WorkoutDuration>(45);
  const [equipment, setEquipment] = useState<EquipmentPreference>('gym');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('moderate');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const currentOption = FOCUS_OPTIONS.find((f) => f.id === selectedFocus) || FOCUS_OPTIONS[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateAndSaveFocusWorkout({
        focus: selectedFocus,
        durationMin,
        equipment,
        energyLevel,
        dateStr: targetDateStr || getLocalDateString(),
      });

      if (onWorkoutGenerated) {
        onWorkoutGenerated();
      }
      onClose();
    } catch (err) {
      console.error('Failed to generate workout:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b border-surfaceBorder shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Konsultasi Kebutuhan Latihan</span>
            </div>
            <h3 className="text-base font-extrabold text-white">
              Apa Fokus Latihanmu {targetDateStr ? 'di Tanggal Ini?' : 'Hari Ini?'}
            </h3>
            <p className="text-[11px] text-mutedText mt-0.5 leading-relaxed">
              Pilih target otot dan energimu agar jadwal latihan tersusun tepat sasaran.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. FOCUS SELECTION CHIPS */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
              1. Pilih Fokus Bagian Tubuh:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedFocus(opt.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedFocus === opt.id
                      ? 'bg-primary/15 border-primary text-white shadow-md shadow-primary/10'
                      : 'bg-card border-surfaceBorder text-mutedText hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-extrabold text-slate-100">{opt.labelId}</span>
                    {selectedFocus === opt.id && (
                      <span className="w-4 h-4 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-mutedText line-clamp-2 leading-tight">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. DYNAMIC ANATOMY VISUALIZER PREVIEW */}
          {selectedFocus !== 'rest' && (
            <div className="bg-card/70 border border-surfaceBorder/60 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText mb-1.5">
                Target Stimulasi Otot ({currentOption.labelId})
              </span>
              <BodyAnatomyVisualizer
                activeMuscles={currentOption.muscles}
                size="sm"
                showLabels={false}
              />
              <span className="text-[10px] text-primary font-mono mt-1">
                {currentOption.muscles.map((m) => m.toUpperCase()).join(' • ')}
              </span>
            </div>
          )}

          {/* 3. DURATION OPTIONS */}
          {selectedFocus !== 'rest' && (
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1.5">
                2. Alokasi Waktu:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { dur: 30 as WorkoutDuration, label: '30 min', desc: 'Express (3 Gerakan)' },
                  { dur: 45 as WorkoutDuration, label: '45-50 min', desc: 'Optimal (4-5 Gerakan)' },
                  { dur: 60 as WorkoutDuration, label: '60+ min', desc: 'Volume Penuh' },
                ].map((item) => (
                  <button
                    key={item.dur}
                    type="button"
                    onClick={() => setDurationMin(item.dur)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      durationMin === item.dur
                        ? 'bg-primary text-black font-extrabold border-primary'
                        : 'bg-card border-surfaceBorder text-mutedText hover:text-white'
                    }`}
                  >
                    <span className="text-xs block">{item.label}</span>
                    <span className="text-[9px] opacity-80 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. EQUIPMENT OPTIONS */}
          {selectedFocus !== 'rest' && (
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1.5">
                3. Alat Gym Tersedia:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gym' as EquipmentPreference, label: 'Gym Lengkap', desc: 'Mesin & Kabel' },
                  { id: 'dumbbell' as EquipmentPreference, label: 'Dumbbell', desc: 'Home Gym' },
                  { id: 'bodyweight' as EquipmentPreference, label: 'Bodyweight', desc: 'Calisthenics' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEquipment(item.id)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      equipment === item.id
                        ? 'bg-accent text-black font-extrabold border-accent'
                        : 'bg-card border-surfaceBorder text-mutedText hover:text-white'
                    }`}
                  >
                    <span className="text-xs block">{item.label}</span>
                    <span className="text-[9px] opacity-80 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. ENERGY LEVEL */}
          {selectedFocus !== 'rest' && (
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1.5">
                4. Kondisi Kesiapan Energi Hari Ini:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'high' as EnergyLevel, label: 'Prima', desc: 'Push Progressive Overload' },
                  { id: 'moderate' as EnergyLevel, label: 'Normal', desc: 'Latihan Teratur' },
                  { id: 'low' as EnergyLevel, label: 'Lelah', desc: 'Beban Terkontrol' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEnergyLevel(item.id)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      energyLevel === item.id
                        ? 'bg-surfaceBorder text-white font-extrabold border-primary'
                        : 'bg-card border-surfaceBorder text-mutedText hover:text-white'
                    }`}
                  >
                    <span className="text-xs block">{item.label}</span>
                    <span className="text-[9px] opacity-80 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Button */}
        <div className="pt-2 border-t border-surfaceBorder shrink-0">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>
              {isGenerating
                ? 'Menyusun Latihan...'
                : selectedFocus === 'rest'
                ? 'Tandai sebagai Hari Istirahat'
                : 'Buat Menu & Jadwal Latihan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
