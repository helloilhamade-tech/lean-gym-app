'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { X, Dumbbell, Utensils, Scale, Droplet } from 'lucide-react';
import { Language, t } from '@/lib/domain/i18n';
import { db } from '@/lib/db/dexie-db';
import { getLocalDateString } from '@/lib/domain/calendar-sync';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onDataLogged?: () => void;
}

export function QuickActionModal({ isOpen, onClose, lang, onDataLogged }: QuickActionModalProps) {
  const router = useRouter();
  const [activeSubModal, setActiveSubModal] = useState<'none' | 'weight' | 'water'>('none');
  const [weightInput, setWeightInput] = useState('78.4');
  const [waistInput, setWaistInput] = useState('');
  const [waterAmount, setWaterAmount] = useState(250);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartWorkout = async () => {
    onClose();
    const localToday = getLocalDateString();
    const isoToday = new Date().toISOString().split('T')[0];
    const todayW = await db.workouts
      .filter((w) => w.scheduled_at === localToday || w.scheduled_at === isoToday || w.status === 'in_progress')
      .last();
    if (todayW) {
      router.push(`/workout/active?id=${todayW.id}`);
    } else {
      router.push('/workout/active');
    }
  };

  const handleAddMeal = () => {
    onClose();
    router.push('/nutrition');
  };

  const handleSaveWeight = async () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 20 || w >= 300) return;
    setIsSubmitting(true);
    try {
      const profile = await db.profiles.toCollection().first();
      const profileId = profile?.id || 'usr-demo-01';
      const waist = waistInput ? parseFloat(waistInput) : undefined;
      await db.measurements.add({
        id: `meas-${Date.now()}`,
        profile_id: profileId,
        measured_at: new Date().toISOString(),
        weight_kg: w,
        waist_cm: waist,
        created_at: new Date().toISOString(),
      });
      // Also update current profile weight
      if (profile) {
        await db.profiles.update(profile.id, { weight_kg: w });
      }
      setActiveSubModal('none');
      onClose();
      if (onDataLogged) onDataLogged();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWater = async () => {
    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const existing = await db.dailyLogs.where('date').equals(todayStr).first();
      if (existing) {
        await db.dailyLogs.update(existing.id, {
          water_ml: (existing.water_ml || 0) + waterAmount,
        });
      } else {
        const profile = await db.profiles.toCollection().first();
        await db.dailyLogs.add({
          id: `log-${Date.now()}`,
          profile_id: profile?.id || 'usr-demo-01',
          date: todayStr,
          steps: 0,
          water_ml: waterAmount,
          sleep_hours: 7.0,
          readiness: 'good',
        });
      }
      setActiveSubModal('none');
      onClose();
      if (onDataLogged) onDataLogged();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl relative animate-in fade-in slide-in-from-bottom duration-200">
        <button
          onClick={() => {
            setActiveSubModal('none');
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {activeSubModal === 'none' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {t('quick_log', lang)}
            </h3>
            <p className="text-xs text-mutedText mb-5">
              {lang === 'id' ? 'Pilih aksi cepat untuk dicatat' : 'Select quick action to log'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Start Workout */}
              <button
                onClick={handleStartWorkout}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-card hover:bg-surfaceBorder border border-surfaceBorder active:scale-95 transition-all text-white"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-2">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold">{t('start_workout', lang)}</span>
              </button>

              {/* Add Meal */}
              <button
                onClick={handleAddMeal}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-card hover:bg-surfaceBorder border border-surfaceBorder active:scale-95 transition-all text-white"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-2">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold">{t('log_meal', lang)}</span>
              </button>

              {/* Add Weight */}
              <button
                onClick={() => setActiveSubModal('weight')}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-card hover:bg-surfaceBorder border border-surfaceBorder active:scale-95 transition-all text-white"
              >
                <div className="w-11 h-11 rounded-xl bg-warning/15 text-warning flex items-center justify-center mb-2">
                  <Scale className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold">{t('log_weight', lang)}</span>
              </button>

              {/* Add Water */}
              <button
                onClick={() => setActiveSubModal('water')}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-card hover:bg-surfaceBorder border border-surfaceBorder active:scale-95 transition-all text-white"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2">
                  <Droplet className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold">{t('log_water', lang)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Submodal Weight */}
        {activeSubModal === 'weight' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{t('log_weight', lang)}</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-mutedText block mb-1">
                  {lang === 'id' ? 'Berat Badan (kg)' : 'Weight (kg)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-4 py-2.5 text-xl font-bold font-mono text-white focus:outline-none focus:border-primary"
                  placeholder="78.0"
                />
              </div>
              <div>
                <label className="text-xs text-mutedText block mb-1">
                  {lang === 'id' ? 'Lingkar Pinggang (opsional, cm)' : 'Waist (optional, cm)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={waistInput}
                  onChange={(e) => setWaistInput(e.target.value)}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  placeholder="84.0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSubModal('none')}
                className="flex-1 py-2.5 rounded-xl bg-card text-mutedText hover:text-white text-xs font-semibold"
              >
                {lang === 'id' ? 'Kembali' : 'Back'}
              </button>
              <button
                onClick={handleSaveWeight}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-hover transition-colors"
              >
                {lang === 'id' ? 'Simpan' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Submodal Water */}
        {activeSubModal === 'water' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{t('log_water', lang)}</h3>
            <div className="flex gap-2 mb-5">
              {[250, 500, 750].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setWaterAmount(amt)}
                  className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                    waterAmount === amt
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-card border-surfaceBorder text-mutedText hover:text-white'
                  }`}
                >
                  +{amt} ml
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSubModal('none')}
                className="flex-1 py-2.5 rounded-xl bg-card text-mutedText hover:text-white text-xs font-semibold"
              >
                {lang === 'id' ? 'Kembali' : 'Back'}
              </button>
              <button
                onClick={handleSaveWater}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
              >
                {lang === 'id' ? 'Tambah Air' : 'Add Water'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
