export type Gender = 'male' | 'female';
export type BodyFatCategory = 'essential' | 'athletes' | 'fitness' | 'average' | 'high';

export interface NavyBodyFatParams {
  gender: Gender;
  heightCm: number;
  waistCm: number;
  neckCm: number;
  hipCm?: number; // Required for females
}

export interface BmiBodyFatParams {
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
}

export interface BodyFatClassification {
  category: BodyFatCategory;
  categoryLabel: string;
  categoryLabelEn: string;
  descriptionId: string;
  descriptionEn: string;
  color: string; // Tailwind color classes e.g. text-emerald-400, bg-emerald-500/10
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  adviceId: string;
  adviceEn: string;
}

export interface BodyCompositionResult {
  bodyFatPct: number;
  fatMassKg: number;
  leanMassKg: number;
  classification: BodyFatClassification;
}

export interface CategoryThresholds {
  essentialMax: number;
  athletesMax: number;
  fitnessMax: number;
  averageMax: number;
}

/**
 * Get standard ACE thresholds based on gender
 */
export function getCategoryThresholds(gender: Gender): CategoryThresholds {
  if (gender === 'female') {
    return {
      essentialMax: 14,
      athletesMax: 21,
      fitnessMax: 25,
      averageMax: 32,
    };
  }
  return {
    essentialMax: 6,
    athletesMax: 14,
    fitnessMax: 18,
    averageMax: 25,
  };
}

/**
 * Calculate Body Fat % using the scientific US Navy formula (Hodgdon & Beckett)
 */
export function calculateNavyBodyFat(params: NavyBodyFatParams): number {
  const { gender, heightCm, waistCm, neckCm, hipCm = 95 } = params;

  if (heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return 15;

  if (gender === 'female') {
    const diff = waistCm + hipCm - neckCm;
    if (diff <= 0) return 22;
    // 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
    const logDiff = Math.log10(diff);
    const logHeight = Math.log10(heightCm);
    const denom = 1.29579 - 0.35004 * logDiff + 0.221 * logHeight;
    if (denom <= 0) return 22;
    const bf = 495 / denom - 450;
    return Math.max(5, Math.min(60, parseFloat(bf.toFixed(1))));
  }

  // Male
  const diff = waistCm - neckCm;
  if (diff <= 0) return 12;
  // 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
  const logDiff = Math.log10(diff);
  const logHeight = Math.log10(heightCm);
  const denom = 1.0324 - 0.19077 * logDiff + 0.15456 * logHeight;
  if (denom <= 0) return 15;
  const bf = 495 / denom - 450;
  return Math.max(3, Math.min(55, parseFloat(bf.toFixed(1))));
}

/**
 * Calculate Body Fat % using Deurenberg formula based on BMI and Age
 */
export function calculateBmiBodyFat(params: BmiBodyFatParams): number {
  const { gender, heightCm, weightKg, age } = params;
  if (heightCm <= 0 || weightKg <= 0) return 18;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const genderFactor = gender === 'male' ? 1 : 0;

  // Deurenberg: BF% = (1.20 * BMI) + (0.23 * Age) - (10.8 * gender) - 5.4
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * genderFactor - 5.4;
  return Math.max(3, Math.min(60, parseFloat(bf.toFixed(1))));
}

/**
 * Classify body fat percentage according to ACE & ACSM fitness standards
 */
export function classifyBodyFat(bodyFatPct: number, gender: Gender = 'male'): BodyFatClassification {
  const rounded = parseFloat(bodyFatPct.toFixed(1));

  if (gender === 'female') {
    if (rounded < 14) {
      return {
        category: 'essential',
        categoryLabel: 'Lemak Esensial (Sangat Rendah)',
        categoryLabelEn: 'Essential Fat (Very Low)',
        descriptionId: 'Kadar lemak minimal fungsi tubuh wanita. Umumnya hanya dipertahankan saat kontes binaraga.',
        descriptionEn: 'Minimal essential fat for female body. Usually only maintained during bodybuilding stage contests.',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/15',
        badgeBorder: 'border-cyan-500/30',
        badgeText: 'text-cyan-300',
        adviceId: 'Prioritaskan pemulihan dan tingkatkan asupan lemak sehat agar hormon reproduksi & metabolisme tetap terjaga.',
        adviceEn: 'Prioritize recovery and increase healthy fats intake to support hormonal balance and metabolism.',
      };
    }
    if (rounded < 21) {
      return {
        category: 'athletes',
        categoryLabel: 'Atletis (Lean & Kering)',
        categoryLabelEn: 'Athletes (Lean & Cut)',
        descriptionId: 'Definisi otot sangat terlihat jelas, kadar lemak atletis profesional, perut kencang berotot.',
        descriptionEn: 'Sharp muscle definition, professional athletic leanness, well-defined core.',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-300',
        adviceId: 'Pertahankan dengan kalori seimbang (maintenance) atau lean bulking terukur untuk menambah massa otot bersih.',
        adviceEn: 'Maintain with caloric maintenance or controlled lean bulk to add dense lean muscle mass.',
      };
    }
    if (rounded < 25) {
      return {
        category: 'fitness',
        categoryLabel: 'Fitness (Kebugaran Ideal)',
        categoryLabelEn: 'Fitness (Ideal Range)',
        descriptionId: 'Rentang paling ideal dan sehat untuk gaya hidup aktif. Postur atletis, perut rata, dan bertenaga.',
        descriptionEn: 'The most ideal and sustainable range for active lifestyle. Athletic posture, flat waist, high energy.',
        color: 'text-teal-400',
        badgeBg: 'bg-teal-500/15',
        badgeBorder: 'border-teal-500/30',
        badgeText: 'text-teal-300',
        adviceId: 'Kondisi prima untuk body recomposition: angkat beban konsisten dengan progressive overload dan protein tinggi.',
        adviceEn: 'Prime condition for body recomposition: consistent progressive overload lifting with high protein.',
      };
    }
    if (rounded < 32) {
      return {
        category: 'average',
        categoryLabel: 'Rata-rata (Standar Sehat)',
        categoryLabelEn: 'Average (Normal Health)',
        descriptionId: 'Kondisi umum sehat masyarakat aktif. Terdapat lapisan lemak wajar di atas otot.',
        descriptionEn: 'Common healthy range for active individuals. Natural moderate fat layer over muscles.',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-300',
        adviceId: 'Bagus untuk memulai defisit kalori moderat (250–400 kcal) disertai latihan angkat beban agar bentuk otot makin tegas.',
        adviceEn: 'Great baseline to start a moderate deficit (250–400 kcal) paired with resistance training to reveal muscular lines.',
      };
    }
    return {
      category: 'high',
      categoryLabel: 'Tinggi / Obesitas',
      categoryLabelEn: 'High / Obese',
      descriptionId: 'Persentase lemak tubuh berlebih di atas rekomendasi kesehatan. Berpotensi membebani sendi & metabolik.',
      descriptionEn: 'Body fat is elevated above optimal health thresholds. May place strain on joints and metabolic health.',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/15',
      badgeBorder: 'border-rose-500/30',
      badgeText: 'text-rose-300',
      adviceId: 'Fokus pada fat loss terencana: defisit kalori harian 400–500 kcal, target 8.000 langkah/hari, dan latihan angkat beban rutin.',
      adviceEn: 'Focus on structured fat loss: 400–500 kcal deficit, 8,000 daily steps, and consistent resistance workouts.',
    };
  }

  // Male
  if (rounded < 6) {
    return {
      category: 'essential',
      categoryLabel: 'Lemak Esensial (Sangat Rendah)',
      categoryLabelEn: 'Essential Fat (Very Low)',
      descriptionId: 'Kadar lemak minimal esensial tubuh pria. Level panggung binaraga (kondisi sangat kering namun rentan lemas).',
      descriptionEn: 'Minimum survival fat for men. Bodybuilding contest shape (extreme vascularity but prone to fatigue).',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15',
      badgeBorder: 'border-cyan-500/30',
      badgeText: 'text-cyan-300',
      adviceId: 'Tingkatkan asupan kalori & lemak sehat untuk mengembalikan keseimbangan testosteron dan stamina.',
      adviceEn: 'Increase calories and dietary fats to restore testosterone balance, joint health, and energy.',
    };
  }
  if (rounded < 14) {
    return {
      category: 'athletes',
      categoryLabel: 'Atletis (Six-Pack & Lean)',
      categoryLabelEn: 'Athletes (Six-Pack & Lean)',
      descriptionId: 'Definisi otot sangat tajam, six-pack terlihat jelas tanpa flexing, vaskularitas lengan dan bahu tinggi.',
      descriptionEn: 'Razor sharp muscle definition, visible six-pack without flexing, high vascularity.',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300',
      adviceId: 'Kondisi fisik puncak. Pertahankan kalori maintenance atau lean bulk surplus kecil (+200 kcal) untuk menambah massa otot.',
      adviceEn: 'Peak conditioning. Maintain current intake or lean bulk with a slight surplus (+200 kcal) to build muscle mass.',
    };
  }
  if (rounded < 18) {
    return {
      category: 'fitness',
      categoryLabel: 'Fitness (Kebugaran Ideal)',
      categoryLabelEn: 'Fitness (Ideal Shape)',
      descriptionId: 'Bentuk tubuh atletis, perut rata, garis otot dada dan bahu terdefinisi rapi. Sangat sehat dan berkelanjutan.',
      descriptionEn: 'Athletic build, flat stomach, well-defined shoulders and chest. Highly sustainable and energetic.',
      color: 'text-teal-400',
      badgeBg: 'bg-teal-500/15',
      badgeBorder: 'border-teal-500/30',
      badgeText: 'text-teal-300',
      adviceId: 'Zona emas kebugaran. Cocok untuk body recomposition atau progressive overload beban gym secara konsisten.',
      adviceEn: 'Golden fitness zone. Ideal for recomp or driving heavy progressive overload in the gym.',
    };
  }
  if (rounded < 25) {
    return {
      category: 'average',
      categoryLabel: 'Rata-rata (Standar Sehat)',
      categoryLabelEn: 'Average (Normal Health)',
      descriptionId: 'Rentang normal pria masyarakat umum. Garis otot belum terlalu tajam tertutup lapisan lemak wajar.',
      descriptionEn: 'Standard healthy range for men. Muscle separation is smoothed by a natural fat layer.',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-300',
      adviceId: 'Fokus defisit kalori moderat (300–400 kcal) dan perbanyak konsumsi protein (1.6–2.0 g/kg) agar lingkar pinggang mengecil.',
      adviceEn: 'Target a moderate calorie deficit (300–400 kcal) and high protein (1.6–2.0 g/kg) to trim waistline.',
    };
  }
  return {
    category: 'high',
    categoryLabel: 'Tinggi / Obesitas',
    categoryLabelEn: 'High / Obese',
    descriptionId: 'Persentase lemak berlebih di atas standar sehat. Risiko penumpukan lemak visceral di sekitar perut.',
    descriptionEn: 'Body fat exceeds healthy recommendations with increased risk of visceral abdominal fat.',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-300',
    adviceId: 'Prioritas utama: defisit kalori konsisten 400–500 kcal, latihan beban 3–4x seminggu, dan cukupi 8.000 langkah harian.',
    adviceEn: 'Top priority: steady 400–500 kcal deficit, resistance training 3–4x weekly, and 8,000 daily steps.',
  };
}

/**
 * Calculates complete body composition breakdown (fat mass vs lean mass in kg)
 */
export function calculateBodyComposition(
  weightKg: number,
  bodyFatPct: number,
  gender: Gender = 'male'
): BodyCompositionResult {
  const clampedBf = Math.max(2, Math.min(65, bodyFatPct));
  const fatMassKg = parseFloat(((weightKg * clampedBf) / 100).toFixed(1));
  const leanMassKg = parseFloat((weightKg - fatMassKg).toFixed(1));
  const classification = classifyBodyFat(clampedBf, gender);

  return {
    bodyFatPct: clampedBf,
    fatMassKg,
    leanMassKg,
    classification,
  };
}
