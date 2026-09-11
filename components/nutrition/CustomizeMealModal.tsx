'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  Utensils,
  Plus,
  RefreshCw,
  Flame,
  Info,
  Sliders,
} from 'lucide-react';
import {
  PROTEIN_FOODS_CATALOG,
  ProteinFood,
  searchProteinFoods,
} from '@/lib/domain/protein-foods';
import { ScheduledMealItem, ScheduledMealSlot } from '@/lib/domain/meal-planner';
import { Language } from '@/lib/domain/i18n';

interface CustomizeMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: ScheduledMealSlot;
  slotTitle: string;
  mode: 'add' | 'swap' | 'edit_portion';
  existingItem?: ScheduledMealItem;
  onSaveItem: (item: ScheduledMealItem) => void;
  lang?: Language;
}

export function CustomizeMealModal({
  isOpen,
  onClose,
  slot,
  slotTitle,
  mode,
  existingItem,
  onSaveItem,
  lang = 'id',
}: CustomizeMealModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<ProteinFood | null>(null);

  // Portion state
  const [portion, setPortion] = useState<number>(existingItem?.portion || 100);
  const [customName, setCustomName] = useState<string>(existingItem?.name || '');
  const [customCalories, setCustomCalories] = useState<number>(existingItem?.calories || 150);
  const [customProtein, setCustomProtein] = useState<number>(existingItem?.proteinG || 25);
  const [unit, setUnit] = useState<string>(existingItem?.unit || 'g');

  if (!isOpen) return null;

  const searchResults = searchProteinFoods(searchQuery);

  const handleSelectCatalogFood = (food: ProteinFood) => {
    setSelectedFood(food);
    setCustomName(food.name);
    setUnit(food.unit);
    setPortion(food.servingSize);
    setCustomCalories(food.calories);
    setCustomProtein(food.proteinG);
  };

  const handlePortionChange = (newPortion: number) => {
    setPortion(newPortion);
    if (selectedFood) {
      const ratio = newPortion / selectedFood.servingSize;
      setCustomCalories(Math.round(selectedFood.calories * ratio));
      setCustomProtein(Math.round(selectedFood.proteinG * ratio * 10) / 10);
    } else if (existingItem && existingItem.portion > 0) {
      const ratio = newPortion / existingItem.portion;
      setCustomCalories(Math.round(existingItem.calories * ratio));
      setCustomProtein(Math.round(existingItem.proteinG * ratio * 10) / 10);
    }
  };

  const handleSave = () => {
    if (!customName.trim()) return;

    let carbsG = 0;
    let fatG = 0;

    if (selectedFood) {
      const ratio = portion / selectedFood.servingSize;
      carbsG = Math.round(selectedFood.carbsG * ratio * 10) / 10;
      fatG = Math.round(selectedFood.fatG * ratio * 10) / 10;
    } else if (existingItem) {
      const ratio = portion / (existingItem.portion || 1);
      carbsG = Math.round(existingItem.carbsG * ratio * 10) / 10;
      fatG = Math.round(existingItem.fatG * ratio * 10) / 10;
    }

    const item: ScheduledMealItem = {
      id: existingItem?.id || `item-${Date.now()}`,
      foodId: selectedFood?.id || existingItem?.foodId,
      name: customName.trim(),
      portion: portion > 0 ? portion : 100,
      unit,
      calories: customCalories,
      proteinG: customProtein,
      carbsG,
      fatG,
      category: 'protein',
    };

    onSaveItem(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-surfaceBorder rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* 1. Header */}
        <div className="flex items-start justify-between pb-2 border-b border-surfaceBorder shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              {mode === 'add' ? (
                <Plus className="w-5 h-5" />
              ) : mode === 'swap' ? (
                <RefreshCw className="w-5 h-5" />
              ) : (
                <Sliders className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {mode === 'add'
                  ? (lang === 'id' ? 'Tambah Makanan' : 'Add Food')
                  : mode === 'swap'
                  ? (lang === 'id' ? 'Ganti Makanan' : 'Swap Food')
                  : (lang === 'id' ? 'Atur Porsi' : 'Adjust Portion')}
              </h3>
              <p className="text-[11px] text-mutedText">{slotTitle}</p>
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
          {/* If mode is ADD or SWAP, show Search Catalog */}
          {(mode === 'add' || mode === 'swap') && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
                {lang === 'id' ? 'Pilih Dari Katalog Makanan Protein:' : 'Choose from Protein Foods:'}
              </span>

              <div className="relative">
                <Search className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'id' ? 'Cari ayam, salmon, tempe, telur...' : 'Search chicken, eggs, tempeh...'}
                  className="w-full bg-card border border-surfaceBorder rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Quick food chip list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {searchResults.slice(0, 8).map((food) => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <div
                      key={food.id}
                      onClick={() => handleSelectCatalogFood(food)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary/15 border-primary text-white shadow-sm'
                          : 'bg-card/70 border-surfaceBorder hover:border-surfaceBorder/80 text-mutedText hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className={isSelected ? 'text-primary' : 'text-white'}>
                            {food.name}
                          </strong>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-card border border-surfaceBorder text-mutedText">
                            {food.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-subtleText mt-0.5">
                          {food.servingSize} {food.unit} • {food.calories} kcal •{' '}
                          <span className="text-warning font-semibold">{food.proteinG}g protein</span>
                        </p>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portion Adjuster */}
          <div className="bg-card/70 p-3 rounded-2xl border border-surfaceBorder space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
              {lang === 'id' ? 'Takaran & Porsi Makanan' : 'Portion Sizing'}
            </span>

            <div>
              <label className="text-[10px] font-semibold text-mutedText block mb-1">
                {lang === 'id' ? 'Nama Makanan' : 'Food Name'}
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-surface border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-mutedText block mb-1">
                  {lang === 'id' ? 'Jumlah / Berat' : 'Portion'} ({unit})
                </label>
                <input
                  type="number"
                  step="5"
                  value={portion || ''}
                  onChange={(e) => handlePortionChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface border border-surfaceBorder rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-mutedText block mb-1">
                  {lang === 'id' ? 'Satuan' : 'Unit'}
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="g / butir / scoop"
                  className="w-full bg-surface border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Quick Portion Buttons */}
            <div className="flex gap-1.5 pt-1">
              {[50, 100, 150, 200].map((quickP) => (
                <button
                  key={quickP}
                  type="button"
                  onClick={() => handlePortionChange(quickP)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${
                    portion === quickP
                      ? 'bg-primary text-black border-primary'
                      : 'bg-surface border-surfaceBorder text-mutedText hover:text-white'
                  }`}
                >
                  {quickP}g
                </button>
              ))}
            </div>

            {/* Live Macro Calculation Preview */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surfaceBorder/60 text-center">
              <div className="bg-surface/80 rounded-xl p-2 border border-surfaceBorder/40">
                <span className="text-[9px] uppercase font-bold text-mutedText block">
                  {lang === 'id' ? 'Kalori' : 'Calories'}
                </span>
                <span className="text-sm font-mono font-black text-white">
                  {customCalories} <span className="text-[10px] text-mutedText">kcal</span>
                </span>
              </div>

              <div className="bg-surface/80 rounded-xl p-2 border border-surfaceBorder/40">
                <span className="text-[9px] uppercase font-bold text-mutedText block">
                  {lang === 'id' ? 'Protein' : 'Protein'}
                </span>
                <span className="text-sm font-mono font-black text-warning">
                  {customProtein} <span className="text-[10px] text-mutedText">g</span>
                </span>
              </div>
            </div>

            {selectedFood && (
              <div className="flex items-start gap-1.5 text-[10px] text-subtleText bg-surface/60 p-2 rounded-xl">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p>{selectedFood.prepTipId}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Footer Save Action */}
        <div className="pt-2 border-t border-surfaceBorder shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-card text-mutedText hover:text-white font-bold text-xs"
          >
            {lang === 'id' ? 'Batal' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!customName.trim()}
            className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>{lang === 'id' ? 'Simpan ke Jadwal' : 'Save to Schedule'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
