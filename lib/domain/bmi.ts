export type BmiStandard = 'asia' | 'who';
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese1' | 'obese2';

export interface BmiClassification {
  bmi: number;
  category: BmiCategory;
  categoryLabel: string;
  categoryLabelEn: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  descriptionId: string;
  descriptionEn: string;
  adviceId: string;
  adviceEn: string;
}

export interface IdealWeightRange {
  minKg: number;
  maxKg: number;
}

export interface BmiAnalysisResult {
  bmi: number;
  classification: BmiClassification;
  idealWeight: IdealWeightRange;
  weightDiffKg: number; // 0 if in range, positive if above max, negative if below min
  standard: BmiStandard;
}

/**
 * Calculates Body Mass Index: weight (kg) / (height (m))^2
 */
export function calculateBmi(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return parseFloat(bmi.toFixed(1));
}

/**
 * Calculates ideal body weight range based on normal BMI thresholds (18.5 - 22.9 for Asia, 18.5 - 24.9 for WHO)
 */
export function calculateIdealWeightRange(heightCm: number, standard: BmiStandard = 'asia'): IdealWeightRange {
  if (heightCm <= 0) return { minKg: 50, maxKg: 70 };
  const heightM = heightCm / 100;
  const heightSquared = heightM * heightM;
  const minBmi = 18.5;
  const maxBmi = standard === 'asia' ? 22.9 : 24.9;

  return {
    minKg: parseFloat((minBmi * heightSquared).toFixed(1)),
    maxKg: parseFloat((maxBmi * heightSquared).toFixed(1)),
  };
}

/**
 * Classifies BMI according to Asia-Pacific (Kemenkes RI) or WHO International standard
 */
export function classifyBmi(bmi: number, standard: BmiStandard = 'asia'): BmiClassification {
  const rounded = parseFloat(bmi.toFixed(1));

  // Asia-Pacific (Kemenkes RI) Standard:
  // < 18.5: Underweight
  // 18.5 - 22.9: Normal / Ideal
  // 23.0 - 24.9: Overweight (Kelebihan / Berisiko)
  // 25.0 - 29.9: Obesitas Tingkat I
  // >= 30.0: Obesitas Tingkat II
  if (standard === 'asia') {
    if (rounded < 18.5) {
      return {
        bmi: rounded,
        category: 'underweight',
        categoryLabel: 'Kurus (Kurang Berat Badan)',
        categoryLabelEn: 'Underweight',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/15',
        badgeBorder: 'border-cyan-500/30',
        badgeText: 'text-cyan-300',
        descriptionId: 'Berat badan di bawah rentang sehat standar Asia. Berisiko mudah lelah & kekurangan nutrisi mikro.',
        descriptionEn: 'Weight is below healthy Asian standard. Risk of fatigue and micronutrient deficiency.',
        adviceId: 'Tingkatkan kalori harian surplus (+300–500 kcal) dengan makanan padat gizi & latihan beban untuk menaikkan massa otot.',
        adviceEn: 'Aim for a 300–500 kcal surplus with nutrient-dense foods and resistance training to build muscle.',
      };
    }
    if (rounded <= 22.9) {
      return {
        bmi: rounded,
        category: 'normal',
        categoryLabel: 'Ideal (Berat Badan Normal)',
        categoryLabelEn: 'Normal / Ideal Weight',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-300',
        descriptionId: 'Kategori berat badan ideal dan optimal untuk kesehatan metabolisme standar Asia-Pasifik.',
        descriptionEn: 'Optimal healthy weight for metabolic wellness under Asia-Pacific criteria.',
        adviceId: 'Pertahankan dengan latihan angkat beban teratur (progressive overload) & pola makan seimbang tinggi protein.',
        adviceEn: 'Maintain with progressive overload lifting and balanced high-protein nutrition.',
      };
    }
    if (rounded <= 24.9) {
      return {
        bmi: rounded,
        category: 'overweight',
        categoryLabel: 'Kelebihan Berat Badan (Overweight)',
        categoryLabelEn: 'Overweight (At Risk)',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-300',
        descriptionId: 'Sedikit di atas batas ideal Asia. (Catatan: Lifter berotot bisa berada di sini tanpa kelebihan lemak).',
        descriptionEn: 'Slightly above Asian ideal range. (Note: muscular gym lifters often fall here due to muscle mass).',
        adviceId: 'Jika bukan karena massa otot tebal, terapkan defisit kalori ringan (250–350 kcal) dan aktif 8.000 langkah/hari.',
        adviceEn: 'If not due to dense muscle, implement a mild 250–350 kcal deficit with 8,000 daily steps.',
      };
    }
    if (rounded <= 29.9) {
      return {
        bmi: rounded,
        category: 'obese1',
        categoryLabel: 'Obesitas Tingkat I',
        categoryLabelEn: 'Obese Class I',
        color: 'text-orange-400',
        badgeBg: 'bg-orange-500/15',
        badgeBorder: 'border-orange-500/30',
        badgeText: 'text-orange-300',
        descriptionId: 'Indeks massa tubuh tinggi. Peningkatan risiko tekanan darah, gula darah, dan beban sendi lutut.',
        descriptionEn: 'Elevated BMI. Higher risks for cardiovascular strain and joint stress.',
        adviceId: 'Fokus fat loss terencana: defisit kalori teratur 400–500 kcal, prioritaskan latihan beban, dan kurangi gula olahan.',
        adviceEn: 'Structured fat loss focus: steady 400–500 kcal deficit, prioritising weights and cutting refined sugars.',
      };
    }
    return {
      bmi: rounded,
      category: 'obese2',
      categoryLabel: 'Obesitas Tingkat II (Tinggi)',
      categoryLabelEn: 'Obese Class II (High)',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/15',
      badgeBorder: 'border-rose-500/30',
      badgeText: 'text-rose-300',
      adviceId: 'Konsultasikan dengan dokter/spesialis gizi dan lakukan perubahan gaya hidup bertahap, defisit kalori, & jalan kaki rutin.',
      adviceEn: 'Consult healthcare professionals and adopt progressive lifestyle changes, calorie deficit, and brisk walking.',
      descriptionId: 'Kategori obesitas berat. Perlu perhatian khusus pada penurunan lemak visceral dan kesehatan jantung.',
      descriptionEn: 'Severe obesity range. Requires dedicated attention to visceral fat reduction and cardiac wellness.',
    };
  }

  // WHO Standard
  if (rounded < 18.5) {
    return {
      bmi: rounded,
      category: 'underweight',
      categoryLabel: 'Kurus (Underweight)',
      categoryLabelEn: 'Underweight',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15',
      badgeBorder: 'border-cyan-500/30',
      badgeText: 'text-cyan-300',
      descriptionId: 'Berat badan di bawah rentang normal WHO.',
      descriptionEn: 'Weight is below WHO normal parameters.',
      adviceId: 'Surplus kalori bergizi dan latihan beban teratur.',
      adviceEn: 'Nutritious caloric surplus and strength training.',
    };
  }
  if (rounded <= 24.9) {
    return {
      bmi: rounded,
      category: 'normal',
      categoryLabel: 'Normal / Sehat (WHO)',
      categoryLabelEn: 'Normal Weight (WHO)',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300',
      descriptionId: 'Rentang berat badan normal menurut standar internasional WHO.',
      descriptionEn: 'Normal body weight range according to WHO standards.',
      adviceId: 'Pertahankan gaya hidup aktif dan pola makan seimbang.',
      adviceEn: 'Maintain active lifestyle and balanced diet.',
    };
  }
  if (rounded <= 29.9) {
    return {
      bmi: rounded,
      category: 'overweight',
      categoryLabel: 'Overweight (WHO)',
      categoryLabelEn: 'Overweight (WHO)',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-300',
      descriptionId: 'Berat badan melebihi batas ideal WHO.',
      descriptionEn: 'Weight exceeds WHO ideal thresholds.',
      adviceId: 'Defisit kalori ringan dan tingkatkan aktivitas fisik.',
      adviceEn: 'Mild calorie deficit and increased daily activity.',
    };
  }
  return {
    bmi: rounded,
    category: 'obese1',
    categoryLabel: 'Obesitas (WHO)',
    categoryLabelEn: 'Obese (WHO)',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-300',
    descriptionId: 'Persentase BMI di atas 30 menunjukkan obesitas.',
    descriptionEn: 'BMI above 30 indicates clinical obesity.',
    adviceId: 'Prioritas program penurunan berat badan bertahap yang konsisten.',
    adviceEn: 'Prioritise a consistent gradual weight management program.',
  };
}

/**
 * Full BMI analysis helper
 */
export function analyzeBmi(
  heightCm: number,
  weightKg: number,
  standard: BmiStandard = 'asia'
): BmiAnalysisResult {
  const bmi = calculateBmi(heightCm, weightKg);
  const classification = classifyBmi(bmi, standard);
  const idealWeight = calculateIdealWeightRange(heightCm, standard);

  let weightDiffKg = 0;
  if (weightKg > idealWeight.maxKg) {
    weightDiffKg = parseFloat((weightKg - idealWeight.maxKg).toFixed(1));
  } else if (weightKg < idealWeight.minKg) {
    weightDiffKg = parseFloat((weightKg - idealWeight.minKg).toFixed(1));
  }

  return {
    bmi,
    classification,
    idealWeight,
    weightDiffKg,
    standard,
  };
}
