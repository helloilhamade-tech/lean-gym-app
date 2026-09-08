'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingDown,
  Scale,
  Camera,
  Plus,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Measurement, Goal, Profile } from '@/lib/db/schema';
import { calculate7DayWeightAverage } from '@/lib/domain/recommendations';
import { Language, t } from '@/lib/domain/i18n';

export default function ProgressPage() {
  const [lang, setLang] = useState<Language>('id');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('78.4');
  const [newWaist, setNewWaist] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const savedLang = (localStorage.getItem('lean_lang') as Language) || 'id';
    setLang(savedLang);

    const p = await db.profiles.toCollection().first();
    setProfile(p || null);

    const g = await db.goals.where('status').equals('active').first();
    setGoal(g || null);

    const mList = await db.measurements.orderBy('measured_at').reverse().toArray();
    setMeasurements(mList);
    if (mList.length > 0) {
      setNewWeight(String(mList[0].weight_kg));
      if (mList[0].waist_cm) setNewWaist(String(mList[0].waist_cm));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveCheckIn = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 30) return;

    const profileId = profile?.id || 'usr-demo-01';
    const waist = newWaist ? parseFloat(newWaist) : undefined;

    const newEntry: Measurement = {
      id: `meas-${Date.now()}`,
      profile_id: profileId,
      measured_at: new Date().toISOString(),
      weight_kg: w,
      waist_cm: waist,
      photo_data_url: newPhotoUrl || undefined,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    await db.measurements.put(newEntry);
    if (profile) {
      await db.profiles.update(profile.id, { weight_kg: w });
    }

    setIsCheckInOpen(false);
    setNotes('');
    setNewPhotoUrl('');
    await loadData();
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  // Photo file selector (Client-side FileReader to base64 DataURL for local IndexedDB)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMeasurement = async (id: string) => {
    await db.measurements.delete(id);
    await loadData();
    window.dispatchEvent(new Event('lean_data_changed'));
  };

  // 7-day trend calculation
  const weightItems = measurements.map((m) => ({
    date: m.measured_at,
    weightKg: m.weight_kg,
  }));
  const trendSummary = calculate7DayWeightAverage(weightItems);

  // SVG Sparkline calculation
  const chartData = [...measurements].reverse().slice(-10);
  const minW = Math.min(...chartData.map((m) => m.weight_kg), 75) - 0.5;
  const maxW = Math.max(...chartData.map((m) => m.weight_kg), 80) + 0.5;
  const rangeW = maxW - minW || 1;

  const points = chartData.map((m, idx) => {
    const x = chartData.length > 1 ? (idx / (chartData.length - 1)) * 320 + 20 : 180;
    const y = 110 - ((m.weight_kg - minW) / rangeW) * 80;
    return `${x},${y}`;
  });

  const photoEntries = measurements.filter((m) => m.photo_data_url);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header & Quick Check-in Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {t('progress', lang)}
          </h1>
          <p className="text-xs text-mutedText mt-0.5">
            {lang === 'id' ? 'Tren komposisi tubuh & lingkar pinggang' : 'Body composition & waist trend'}
          </p>
        </div>

        <button
          onClick={() => setIsCheckInOpen(true)}
          className="py-2 px-3.5 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all"
        >
          <Scale className="w-4 h-4" />
          <span>{t('check_in', lang)}</span>
        </button>
      </div>

      {/* 2. Weight Trend & 7-Day Rolling Average Card */}
      <section aria-label="Weight history" className="bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
              {t('seven_day_trend', lang)}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-white">
                {trendSummary.rollingAverageKg ?? '--'}
                <span className="text-xs font-normal text-mutedText ml-1">kg</span>
              </span>
              <span className="text-xs text-subtleText">
                → target {goal?.target_weight_kg || 75} kg
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-card border border-surfaceBorder text-xs font-mono font-semibold flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary">
              {trendSummary.deltaKg ? `${trendSummary.deltaKg} kg/mgg` : '-0.4 kg'}
            </span>
          </div>
        </div>

        {/* SVG Rolling Trend Line */}
        <div className="w-full h-32 bg-card/60 rounded-2xl p-2 border border-surfaceBorder/60 flex items-center justify-center relative overflow-hidden">
          {chartData.length > 1 ? (
            <svg className="w-full h-full" viewBox="0 0 360 120">
              {/* Grid lines */}
              <line x1="20" y1="30" x2="340" y2="30" stroke="#26292d" strokeDasharray="3,3" />
              <line x1="20" y1="70" x2="340" y2="70" stroke="#26292d" strokeDasharray="3,3" />
              <line x1="20" y1="110" x2="340" y2="110" stroke="#26292d" strokeDasharray="3,3" />

              {/* Polyline */}
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points.join(' ')}
              />

              {/* Circles on points */}
              {chartData.map((m, idx) => {
                const x = (idx / (chartData.length - 1)) * 320 + 20;
                const y = 110 - ((m.weight_kg - minW) / rangeW) * 80;
                return (
                  <circle
                    key={m.id}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-background stroke-primary stroke-[2px]"
                  />
                );
              })}
            </svg>
          ) : (
            <span className="text-xs text-mutedText">
              {lang === 'id' ? 'Tren akan tampil setelah beberapa kali check-in' : 'Trend appears after several logs'}
            </span>
          )}
        </div>

        <p className="text-[11px] text-mutedText leading-relaxed flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>
            {lang === 'id'
              ? 'Rata-rata 7 hari menyaring fluktuasi air harian agar rekomendasi kalori tetap akurat.'
              : '7-day rolling average filters water spikes to keep calorie suggestions predictable.'}
          </span>
        </p>
      </section>

      {/* 3. Measurements History Log */}
      <section aria-label="Measurement records" className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mutedText px-1">
          {lang === 'id' ? 'Riwayat Timbangan & Pinggang' : 'Measurement Records'}
        </h3>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {measurements.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-surfaceBorder rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {item.weight_kg} kg
                  </span>
                  {item.waist_cm && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-surfaceBorder text-mutedText">
                      Pinggang {item.waist_cm} cm
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-subtleText mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.measured_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}</span>
                  {item.notes && <span>• {item.notes}</span>}
                </div>
              </div>

              <button
                onClick={() => handleDeleteMeasurement(item.id)}
                className="p-1.5 text-subtleText hover:text-rose-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Progress Photos Timeline (Client-side IndexedDB capture) */}
      <section aria-label="Progress photos" className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mutedText flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            <span>{t('photos', lang)}</span>
          </h3>
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="text-[10px] text-primary font-bold hover:underline"
          >
            + {t('add_photo', lang)}
          </button>
        </div>

        {photoEntries.length === 0 ? (
          <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 text-center">
            <Camera className="w-8 h-8 text-subtleText mx-auto mb-2" />
            <p className="text-xs text-mutedText">{t('no_photos', lang)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photoEntries.map((photo) => (
              <div
                key={photo.id}
                className="bg-surface border border-surfaceBorder rounded-2xl overflow-hidden shadow-sm"
              >
                <img
                  src={photo.photo_data_url}
                  alt="Progress"
                  className="w-full h-44 object-cover"
                />
                <div className="p-2 text-center">
                  <span className="text-[10px] font-mono text-mutedText">
                    {photo.weight_kg} kg • {new Date(photo.measured_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Check-in Modal */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-extrabold text-white">
                {t('check_in', lang)}
              </h3>
              <p className="text-xs text-mutedText mt-0.5">
                {lang === 'id' ? 'Catat berat badan pagi setelah bangun tidur' : 'Morning weigh-in after wake up'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-mutedText block mb-1">
                  {t('current_weight', lang)} (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 font-mono font-bold text-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-mutedText block mb-1">
                  {t('waist', lang)}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newWaist}
                  onChange={(e) => setNewWaist(e.target.value)}
                  placeholder="84.0"
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-mutedText block mb-1">
                  {t('add_photo', lang)}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="w-full text-xs text-mutedText file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-card file:text-primary hover:file:bg-surfaceBorder"
                />
                {newPhotoUrl && (
                  <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-primary">
                    <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-semibold text-mutedText block mb-1">
                  {lang === 'id' ? 'Catatan (opsional)' : 'Notes (optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'id' ? 'cth. Makan asin kemarin malam' : 'e.g. Salty dinner'}
                  className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCheckInOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-card text-mutedText hover:text-white text-xs font-semibold"
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveCheckIn}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all"
              >
                {lang === 'id' ? 'Simpan Data' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
