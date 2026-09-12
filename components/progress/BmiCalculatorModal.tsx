'use client';

import { useState, useEffect } from "react";
import {
  X,
  Scale,
  Ruler,
  Check,
  Sparkles,
  Info,
  Activity,
  Target,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Profile, Measurement } from '@/lib/db/schema';
import {
  BmiStandard,
  analyzeBmi,
} from '@/lib/domain/bmi';
import { Language } from '@/lib/domain/i18n';

interface BmiCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onSaved?: () => void;
  initialHeight?: number;
  initialWeight?: number;
}

export function BmiCalculatorModal({
  isOpen,
  onClose,
  lang = 'id',
  onSaved,
  initialHeight,
  initialWeight,
}: BmiCalculatorModalProps) {
  const [standard, setStandard] = useState<BmiStandard>('asia');
  const [heightCm, setHeightCm] = useState<number>(initialHeight || 170);
  const [weightKg, setWeightKg] = useState<number>(initialWeight || 68);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const p = await db.profiles.toCollection().first();
      if (p) {
        setProfile(p);
        if (p.height_cm && !initialHeight) setHeightCm(p.height_cm);
        if (p.weight_kg && !initialWeight) setWeightKg(p.weight_kg);
      }
    }
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, initialHeight, initialWeight]);

  if (!isOpen) return null;

  // Real-time BMI Analysis
  const analysis = analyzeBmi(heightCm, weightKg, standard);
  const { bmi, classification, idealWeight, weightDiffKg } = analysis;

  // Gauge percentage calculation (scaled between BMI 15 and 35)
  const minGaugeBmi = 15;
  const maxGaugeBmi = 35;
  const clampedBmi = Math.max(minGaugeBmi, Math.min(maxGaugeBmi, bmi));
  const gaugePercent = ((clampedBmi - minGaugeBmi) / (maxGaugeBmi - minGaugeBmi)) * 100;

  const handleSaveToProfile = async () => {
    setIsSaving(true);
    try {
      const profileId = profile?.id || 'usr-demo-01';

      // Update Profile height & weight
      if (profile) {
        await db.profiles.update(profile.id, {
          height_cm: heightCm,
          weight_kg: weightKg,
        });
      }

      // Add a measurement record
      const newMeasurement: Measurement = {
        id: `meas-${Date.now()}`,
        profile_id: profileId,
        measured_at: new Date().toISOString(),
        weight_kg: weightKg,
        notes: `BMI: ${bmi} (${classification.categoryLabel}) [${standard.toUpperCase()}]`,
        created_at: new Date().toISOString(),
      };

      await db.measurements.put(newMeasurement);

      if (onSaved) {
        onSaved();
      }
      window.dispatchEvent(new Event('lean_data_changed'));
      onClose();
    } catch (err) {
      console.error('Failed to save BMI calculation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* 1. Header */}
        <div className="flex items-start justify-between pb-2 border-b border-surfaceBorder shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {lang === 'id' ? 'Kalkulator BMI & Berat Ideal' : 'BMI & Ideal Weight Calculator'}
              </h3>
              <p className="text-[11px] text-mutedText">
                {lang === 'id' ? 'Cek indeks massa tubuh & kategori kesehatan' : 'Check body mass index & health classification'}
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

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Standard Toggle (Kemenkes Asia vs WHO) */}
          <div className="bg-card p-1 rounded-2xl border border-surfaceBorder flex gap-1">
            <button
              onClick={() => setStandard('asia')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                standard === 'asia'
                  ? 'bg-primary text-black shadow-md shadow-primary/20'
                  : 'text-mutedText hover:text-white'
              }`}
            >
              <span>{lang === 'id' ? 'Standar Asia (Kemenkes)' : 'Asia-Pacific'}</span>
            </button>
            <button
              onClick={() => setStandard('who')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                standard === 'who'
                  ? 'bg-primary text-black shadow-md shadow-primary/20'
                  : 'text-mutedText hover:text-white'
              }`}
            >
              <span>{lang === 'id' ? 'Standar WHO (Global)' : 'WHO Global'}</span>
            </button>
          </div>

          {/* Form Inputs: Height & Weight */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-mutedText block mb-1 flex items-center gap-1">
                <Ruler className="w-3 h-3 text-primary" />
                <span>{lang === 'id' ? 'Tinggi Badan (cm)' : 'Height (cm)'}</span>
              </label>
              <input
                type="number"
                value={heightCm || ''}
                onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                placeholder="170"
                className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-mutedText block mb-1 flex items-center gap-1">
                <Scale className="w-3 h-3 text-primary" />
                <span>{lang === 'id' ? 'Berat Badan (kg)' : 'Weight (kg)'}</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={weightKg || ''}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                placeholder="68.0"
                className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Quick Sliders for convenience */}
          <div className="space-y-2 bg-card/40 p-2.5 rounded-2xl border border-surfaceBorder/50">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-mutedText">
                <span>{lang === 'id' ? 'Geser Tinggi:' : 'Height:'}</span>
                <span className="font-bold text-white">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min="130"
                max="210"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-card rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-mutedText">
                <span>{lang === 'id' ? 'Geser Berat:' : 'Weight:'}</span>
                <span className="font-bold text-white">{weightKg} kg</span>
              </div>
              <input
                type="range"
                min="40"
                max="140"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-card rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* 3. RESULT CARD & CATEGORY BADGE */}
          <div className="bg-gradient-to-b from-card to-card/50 border border-surfaceBorder rounded-2xl p-4 space-y-3.5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
                  {lang === 'id' ? 'Nilai BMI Kamu' : 'Your BMI Score'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black font-mono text-white tracking-tight">
                    {bmi > 0 ? bmi.toFixed(1) : '--'}
                  </span>
                  <span className="text-xs font-bold text-mutedText">kg/m²</span>
                </div>
              </div>

              {/* Category Badge */}
              <div
                className={`px-3 py-1.5 rounded-xl border flex flex-col items-end text-right ${classification.badgeBg} ${classification.badgeBorder}`}
              >
                <span className="text-[9px] uppercase font-mono font-bold text-mutedText">
                  {lang === 'id' ? 'Kategori Kamu:' : 'Classification:'}
                </span>
                <span className={`text-xs font-black tracking-tight ${classification.color}`}>
                  {lang === 'id' ? classification.categoryLabel : classification.categoryLabelEn}
                </span>
              </div>
            </div>

            {/* VISUAL SPECTRUM GAUGE */}
            <div className="space-y-1.5 pt-1">
              {standard === 'asia' ? (
                <div className="relative w-full h-3 rounded-full overflow-hidden bg-card flex">
                  <div className="h-full bg-cyan-400" style={{ width: '17.5%' }} title="Kurus (<18.5)" />
                  <div className="h-full bg-emerald-400" style={{ width: '22%' }} title="Normal (18.5-22.9)" />
                  <div className="h-full bg-amber-400" style={{ width: '10.5%' }} title="Overweight (23.0-24.9)" />
                  <div className="h-full bg-orange-400" style={{ width: '25%' }} title="Obesitas I (25.0-29.9)" />
                  <div className="h-full bg-rose-500 flex-1" title="Obesitas II (≥30.0)" />
                </div>
              ) : (
                <div className="relative w-full h-3 rounded-full overflow-hidden bg-card flex">
                  <div className="h-full bg-cyan-400" style={{ width: '17.5%' }} title="Underweight (<18.5)" />
                  <div className="h-full bg-emerald-400" style={{ width: '32%' }} title="Normal (18.5-24.9)" />
                  <div className="h-full bg-amber-400" style={{ width: '25.5%' }} title="Overweight (25.0-29.9)" />
                  <div className="h-full bg-rose-500 flex-1" title="Obese (≥30.0)" />
                </div>
              )}

              {/* Marker Needle */}
              <div className="relative w-full h-3">
                <div
                  className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                  style={{ left: `${Math.min(97, Math.max(3, gaugePercent))}%` }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white" />
                  <span className="text-[9px] font-mono font-extrabold text-white mt-0.5">▲</span>
                </div>
              </div>

              {/* Category Threshold Markers */}
              <div className="flex justify-between text-[9px] font-mono text-subtleText px-0.5">
                <span>&lt;18.5</span>
                <span>{standard === 'asia' ? '22.9' : '24.9'}</span>
                <span>{standard === 'asia' ? '24.9' : '29.9'}</span>
                <span>{standard === 'asia' ? '29.9' : '30+'}</span>
              </div>
            </div>

            {/* Ideal Weight Range Card */}
            <div className="bg-surface/90 rounded-2xl p-3 border border-surfaceBorder/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span>{lang === 'id' ? 'Rentang Berat Badan Ideal' : 'Ideal Body Weight'}</span>
                </div>
                <span className="text-xs font-mono font-black text-primary">
                  {idealWeight.minKg} – {idealWeight.maxKg} kg
                </span>
              </div>

              <div className="text-[11px] text-mutedText flex items-center gap-1.5 pt-1 border-t border-surfaceBorder/40">
                {weightDiffKg === 0 ? (
                  <span className="text-emerald-400 font-medium">
                    ✅ {lang === 'id' ? 'Selamat! Berat badan Anda sudah berada dalam rentang ideal.' : 'Great! Your weight is in the ideal healthy range.'}
                  </span>
                ) : weightDiffKg > 0 ? (
                  <span className="text-amber-400 font-medium">
                    ⚠️ {lang === 'id' ? `+${weightDiffKg} kg di atas batas atas ideal (${idealWeight.maxKg} kg)` : `+${weightDiffKg} kg above ideal maximum (${idealWeight.maxKg} kg)`}
                  </span>
                ) : (
                  <span className="text-cyan-400 font-medium">
                    ⚠️ {lang === 'id' ? `${Math.abs(weightDiffKg)} kg di bawah batas bawah ideal (${idealWeight.minKg} kg)` : `${Math.abs(weightDiffKg)} kg below ideal minimum (${idealWeight.minKg} kg)`}
                  </span>
                )}
              </div>
            </div>

            {/* Practical Advice */}
            <div className="bg-surface/60 rounded-xl p-2.5 border border-surfaceBorder/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{lang === 'id' ? 'Saran Kesehatan & Latihan:' : 'Actionable Guidance:'}</span>
              </div>
              <p className="text-[11px] text-mutedText leading-relaxed">
                {lang === 'id' ? classification.adviceId : classification.adviceEn}
              </p>
            </div>

            {/* Lifter Context Note */}
            <div className="flex items-start gap-1.5 text-[10px] text-subtleText bg-card/40 p-2 rounded-xl">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p>
                {lang === 'id'
                  ? 'Catatan Fitness: Lifter berotot tebal sering tergolong Overweight pada BMI murni karena massa otot padat. Gunakan juga fitur Kalkulator Body Fat untuk komposisi lemak sejati.'
                  : 'Gym Note: Muscular lifters often register as overweight on BMI due to lean muscle density. Check the Body Fat calculator for true fat mass ratio.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Footer Save Action */}
        <div className="pt-2 border-t border-surfaceBorder shrink-0">
          <button
            onClick={handleSaveToProfile}
            disabled={isSaving || heightCm <= 0 || weightKg <= 0}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>
              {isSaving
                ? (lang === 'id' ? 'Menyimpan...' : 'Saving...')
                : (lang === 'id' ? 'Simpan ke Profil & Pengukuran' : 'Save to Profile & Progress')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
