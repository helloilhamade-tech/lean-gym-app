'use client';

import React, { useState } from 'react';
import { X, Plus, Dumbbell } from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import { Exercise, MuscleGroup, Equipment, MovementPattern } from '@/lib/db/schema';

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (exercise: Exercise) => void;
}

export function CustomExerciseModal({ isOpen, onClose, onCreated }: CustomExerciseModalProps) {
  const [name, setName] = useState('');
  const [nameId, setNameId] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const [equipment, setEquipment] = useState<Equipment>('dumbbell');
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('push');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const newExercise: Exercise = {
        id: `ex-custom-${Date.now()}`,
        name: name.trim(),
        name_id: nameId.trim() || name.trim(),
        muscle_group: muscleGroup,
        equipment,
        movement_pattern: movementPattern,
        difficulty,
        is_system: false,
      };

      await db.exercises.put(newExercise);
      if (onCreated) onCreated(newExercise);
      onClose();
      setName('');
      setNameId('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Buat Gerakan Kustom</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-card text-mutedText hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              Nama Gerakan (English / Standar)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Smith Machine Incline Press"
              className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-mutedText block mb-1">
              Nama / Alias Bahasa Indonesia
            </label>
            <input
              type="text"
              value={nameId}
              onChange={(e) => setNameId(e.target.value)}
              placeholder="cth. Incline Press Mesin Smith"
              className="w-full bg-card border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-mutedText block mb-1">
                Grup Otot Utama
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                className="w-full bg-card border border-surfaceBorder rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="chest">Dada (Chest)</option>
                <option value="back">Punggung (Back)</option>
                <option value="shoulders">Bahu (Shoulders)</option>
                <option value="biceps">Biceps</option>
                <option value="triceps">Triceps</option>
                <option value="quads">Paha Depan (Quads)</option>
                <option value="hamstrings">Paha Belakang</option>
                <option value="glutes">Bokong (Glutes)</option>
                <option value="calves">Betis (Calves)</option>
                <option value="core">Perut / Core</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-mutedText block mb-1">
                Alat Gym
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as Equipment)}
                className="w-full bg-card border border-surfaceBorder rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="dumbbell">Dumbbell</option>
                <option value="barbell">Barbel</option>
                <option value="cable">Kabel (Cable)</option>
                <option value="machine">Mesin Gym</option>
                <option value="bodyweight">Bodyweight</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-mutedText block mb-1">
                Pola Gerakan
              </label>
              <select
                value={movementPattern}
                onChange={(e) => setMovementPattern(e.target.value as MovementPattern)}
                className="w-full bg-card border border-surfaceBorder rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="push">Push (Dorong)</option>
                <option value="pull">Pull (Tarik)</option>
                <option value="squat">Squat (Jongkok)</option>
                <option value="hinge">Hinge (Panggul)</option>
                <option value="isolation">Isolasi</option>
                <option value="carry">Carry / Tahan</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-mutedText block mb-1">
                Tingkat Kesulitan
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-card border border-surfaceBorder rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="beginner">Pemula</option>
                <option value="intermediate">Menengah</option>
                <option value="advanced">Lanjutan</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-card text-mutedText hover:text-white text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
          >
            Simpan Gerakan
          </button>
        </div>
      </div>
    </div>
  );
}
