'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Percent,
  Check,
  Sparkles,
  Info,
  Scale,
  Ruler,
  Calculator,
  ShieldCheck,
  Flame,
  ArrowRight,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Profile, Measurement } from '@/lib/db/schema';
import {
  Gender,
  calculateNavyBodyFat,
  calculateBmiBodyFat,
  classifyBodyFat,
  calculateBodyComposition,
  getCategoryThresholds,
  BodyCompositionResult,
} from '@/lib/domain/body-fat';
import { Language } from '@/lib/domain/i18n';

interface BodyFatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onSaved?: () => void;
  initialWeight?: number;
  initialWaist?: number;
}

export function BodyFatModal({
  isOpen,
  onClose,
  lang = 'id',
  onSaved,
  initialWeight,
  initialWaist,
}: BodyFatModalProps) {
  const [method, setMethod] = useState<'navy' | 'bmi' | 'direct'>('navy');
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(initialWeight || 75);
  const [age, setAge] = useState<number>(25);

  // Tape measurements
  const [waistCm, setWaistCm] = useState<number>(initialWaist || 82);
  const [neckCm, setNeckCm] = useState<number>(38);
  const [hipCm, setHipCm] = useState<number>(95);

  // Direct input
  const [directBf, setDirectBf] = useState<string>('15.0');

  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const p = await db.profiles.toCollection().first();
      if (p) {
        setProfile(p);
        if (p.height_cm) setHeightCm(p.height_cm);
        if (p.weight_kg && !initialWeight) setWeightKg(p.weight_kg);
        if (p.gender) setGender(p.gender);
        if (p.age) setAge(p.age);
      }
    }
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, initialWeight]);

  if (!isOpen) return null;

  // Compute current BF % based on method
  let currentBfPct = 15.0;
  if (method === 'navy') {
    currentBfPct = calculateNavyBodyFat({
      gender,
      heightCm,
      waistCm,
      neckCm,
      hipCm: gender === 'female' ? hipCm : undefined,
    });
  } else if (method === 'bmi') {
    currentBfPct = calculateBmiBodyFat({
      gender,
      heightCm,
      weightKg,
      age,
    });
  } else {
    currentBfPct = parseFloat(directBf) || 15.0;
  }

  const composition: BodyCompositionResult = calculateBodyComposition(weightKg, currentBfPct, gender);
  const { classification, fatMassKg, leanMassKg } = composition;
  const thresholds = getCategoryThresholds(gender);

  // Position on gauge: scale from 3% to 40% (or 10% to 45% for women)
  const minGauge = gender === 'female' ? 10 : 4;
  const maxGauge = gender === 'female' ? 42 : 35;
  const clampedVal = Math.max(minGauge, Math.min(maxGauge, currentBfPct));
  const gaugePercent = ((clampedVal - minGauge) / (maxGauge - minGauge)) * 100;

  const handleSaveToProgress = async () => {
    setIsSaving(true);
    try {
      const profileId = profile?.id || 'usr-demo-01';

      // Update profile with gender, height, weight, age if updated
      if (profile) {
        await db.profiles.update(profile.id, {
          height_cm: heightCm,
          weight_kg: weightKg,
          gender,
          age,
        });
      }

      // Save new measurement record
      const newMeasurement: Measurement = {
        id: `meas-${Date.now()}`,
        profile_id: profileId,
        measured_at: new Date().toISOString(),
        weight_kg: weightKg,
        waist_cm: waistCm > 0 ? waistCm : undefined,
        body_fat_pct: parseFloat(currentBfPct.toFixed(1)),
        notes: `Body Fat: ${currentBfPct.toFixed(1)}% (${classification.categoryLabel}) via ${
          method === 'navy' ? 'US Navy Tape' : method === 'bmi' ? 'Estimasi BMI' : 'Input Langsung'
        }`,
        created_at: new Date().toISOString(),
      };

      await db.measurements.put(newMeasurement);

      if (onSaved) {
        onSaved();
      }
      window.dispatchEvent(new Event('lean_data_changed'));
      onClose();
    } catch (err) {
      console.error('Failed to save body fat measurement:', err);
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
              <Percent className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {lang === 'id' ? 'Kalkulator Body Fat' : 'Body Fat Calculator'}
              </h3>
              <p className="text-[11px] text-mutedText">
                {lang === 'id' ? 'Ketahui persentase lemak & kategorimu' : 'Estimate body fat & fitness category'}
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
          {/* Method Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-card p-1 rounded-2xl border border-surfaceBorder">
            <button
              onClick={() => setMethod('navy')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                method === 'navy'
                  ? 'bg-primary text-black shadow-md shadow-primary/20'
                  : 'text-mutedText hover:text-white'
              }`}
            >
              <span>{lang === 'id' ? 'Pita Ukur' : 'Tape (Navy)'}</span>
            </button>
            <button
              onClick={() => setMethod('bmi')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                method === 'bmi'
                  ? 'bg-primary text-black shadow-md shadow-primary/20'
                  : 'text-mutedText hover:text-white'
              }`}
            >
              <span>{lang === 'id' ? 'Cepat (BMI)' : 'BMI Estim.'}</span>
            </button>
            <button
              onClick={() => setMethod('direct')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                method === 'direct'
                  ? 'bg-primary text-black shadow-md shadow-primary/20'
                  : 'text-mutedText hover:text-white'
              }`}
            >
              <span>{lang === 'id' ? 'Input Angka' : 'Direct %'}</span>
            </button>
          </div>

          {/* Gender Selector */}
          <div className="flex items-center justify-between bg-card/60 p-2 rounded-2xl border border-surfaceBorder/60">
            <span className="text-xs font-bold text-mutedText pl-1">
              {lang === 'id' ? 'Jenis Kelamin:' : 'Biological Sex:'}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  gender === 'male'
                    ? 'bg-primary text-black'
                    : 'bg-surface border border-surfaceBorder text-mutedText hover:text-white'
                }`}
              >
                Pria
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  gender === 'female'
                    ? 'bg-primary text-black'
                    : 'bg-surface border border-surfaceBorder text-mutedText hover:text-white'
                }`}
              >
                Wanita
              </button>
            </div>
          </div>

          {/* FORM INPUTS */}
          <div className="space-y-2.5">
            {/* Height & Weight row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-mutedText block mb-1">
                  {lang === 'id' ? 'Tinggi Badan (cm)' : 'Height (cm)'}
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-mutedText block mb-1">
                  {lang === 'id' ? 'Berat Badan (kg)' : 'Weight (kg)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Method 1: US Navy Tape Inputs */}
            {method === 'navy' && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-mutedText block mb-1">
                      {lang === 'id' ? 'Lingkar Pinggang (cm)' : 'Waist (cm)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={waistCm}
                      onChange={(e) => setWaistCm(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 82"
                      className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-primary"
                    />
                    <span className="text-[9px] text-subtleText mt-0.5 block">
                      {lang === 'id' ? 'Setinggi pusar (rileks)' : 'At navel level'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-mutedText block mb-1">
                      {lang === 'id' ? 'Lingkar Leher (cm)' : 'Neck (cm)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={neckCm}
                      onChange={(e) => setNeckCm(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 38"
                      className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-primary"
                    />
                    <span className="text-[9px] text-subtleText mt-0.5 block">
                      {lang === 'id' ? 'Di bawah jakun' : 'Below Adam’s apple'}
                    </span>
                  </div>
                </div>

                {gender === 'female' && (
                  <div>
                    <label className="text-[10px] font-bold text-mutedText block mb-1">
                      {lang === 'id' ? 'Lingkar Pinggul (cm)' : 'Hip (cm)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={hipCm}
                      onChange={(e) => setHipCm(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 96"
                      className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-primary"
                    />
                    <span className="text-[9px] text-subtleText mt-0.5 block">
                      {lang === 'id' ? 'Bagian terlebar bokong' : 'Widest point of glutes'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Method 2: BMI & Age Inputs */}
            {method === 'bmi' && (
              <div>
                <label className="text-[10px] font-bold text-mutedText block mb-1">
                  {lang === 'id' ? 'Usia (Tahun)' : 'Age (Years)'}
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Method 3: Direct Body Fat Input */}
            {method === 'direct' && (
              <div>
                <label className="text-[10px] font-bold text-mutedText block mb-1">
                  {lang === 'id' ? 'Persentase Lemak Tubuh (%)' : 'Body Fat Percentage (%)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={directBf}
                  onChange={(e) => setDirectBf(e.target.value)}
                  placeholder="e.g. 15.2"
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-base font-mono font-bold text-primary focus:outline-none focus:border-primary"
                />
                <span className="text-[9px] text-subtleText mt-1 block">
                  {lang === 'id' ? 'Dari timbangan InBody, Tanita, atau Kaliper gym' : 'From InBody, DEXA, or skinfold caliper'}
                </span>
              </div>
            )}
          </div>

          {/* 3. RESULT CARD & CATEGORY BADGE */}
          <div className="bg-gradient-to-b from-card to-card/50 border border-surfaceBorder rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
                  {lang === 'id' ? 'Hasil Analisis Lemak' : 'Body Fat Analysis'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black font-mono text-white tracking-tight">
                    {currentBfPct.toFixed(1)}
                  </span>
                  <span className="text-base font-extrabold text-primary">%</span>
                </div>
              </div>

              {/* Category Badge */}
              <div
                className={`px-3 py-1.5 rounded-xl border flex flex-col items-end text-right ${classification.badgeBg} ${classification.badgeBorder}`}
              >
                <span className="text-[9px] uppercase font-mono font-bold text-mutedText">
                  {lang === 'id' ? 'Kategori Kamu:' : 'Your Category:'}
                </span>
                <span className={`text-xs font-black tracking-tight ${classification.color}`}>
                  {lang === 'id' ? classification.categoryLabel : classification.categoryLabelEn}
                </span>
              </div>
            </div>

            {/* VISUAL SPECTRUM GAUGE */}
            <div className="space-y-1.5 pt-1">
              <div className="relative w-full h-3 rounded-full overflow-hidden bg-card flex">
                <div className="h-full bg-cyan-400" style={{ width: `${(thresholds.essentialMax / maxGauge) * 100}%` }} title="Essential" />
                <div className="h-full bg-emerald-400" style={{ width: `${((thresholds.athletesMax - thresholds.essentialMax) / maxGauge) * 100}%` }} title="Athletes" />
                <div className="h-full bg-teal-400" style={{ width: `${((thresholds.fitnessMax - thresholds.athletesMax) / maxGauge) * 100}%` }} title="Fitness" />
                <div className="h-full bg-amber-400" style={{ width: `${((thresholds.averageMax - thresholds.fitnessMax) / maxGauge) * 100}%` }} title="Average" />
                <div className="h-full bg-rose-500 flex-1" title="High" />
              </div>

              {/* Marker Arrow pointing to current value */}
              <div className="relative w-full h-3">
                <div
                  className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                  style={{ left: `${Math.min(97, Math.max(3, gaugePercent))}%` }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white" />
                  <span className="text-[9px] font-mono font-extrabold text-white mt-0.5">▲</span>
                </div>
              </div>

              {/* Category Threshold Labels */}
              <div className="flex justify-between text-[9px] font-mono text-subtleText px-0.5">
                <span>{gender === 'female' ? '<14%' : '<6%'}</span>
                <span>{thresholds.athletesMax}%</span>
                <span>{thresholds.fitnessMax}%</span>
                <span>{thresholds.averageMax}%+</span>
              </div>
            </div>

            {/* Composition Breakdown: Fat Mass vs Lean Mass */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surfaceBorder/60 text-center">
              <div className="bg-surface/80 rounded-xl p-2 border border-surfaceBorder/40">
                <span className="text-[9px] uppercase font-bold text-mutedText block">
                  {lang === 'id' ? 'Massa Lemak' : 'Fat Mass'}
                </span>
                <span className="text-sm font-mono font-extrabold text-amber-400">
                  {fatMassKg} <span className="text-[10px] text-mutedText">kg</span>
                </span>
              </div>

              <div className="bg-surface/80 rounded-xl p-2 border border-surfaceBorder/40">
                <span className="text-[9px] uppercase font-bold text-mutedText block">
                  {lang === 'id' ? 'Massa Bebas Lemak (Otot)' : 'Lean Body Mass'}
                </span>
                <span className="text-sm font-mono font-extrabold text-primary">
                  {leanMassKg} <span className="text-[10px] text-mutedText">kg</span>
                </span>
              </div>
            </div>

            {/* Actionable Advice */}
            <div className="bg-surface/60 rounded-xl p-2.5 border border-surfaceBorder/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{lang === 'id' ? 'Saran & Langkah Latihan:' : 'Recommended Action:'}</span>
              </div>
              <p className="text-[11px] text-mutedText leading-relaxed">
                {lang === 'id' ? classification.adviceId : classification.adviceEn}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Footer Save Action */}
        <div className="pt-2 border-t border-surfaceBorder shrink-0">
          <button
            onClick={handleSaveToProgress}
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>
              {isSaving
                ? (lang === 'id' ? 'Menyimpan Data...' : 'Saving...')
                : (lang === 'id' ? 'Simpan ke Catatan Progres' : 'Save to Progress Records')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
