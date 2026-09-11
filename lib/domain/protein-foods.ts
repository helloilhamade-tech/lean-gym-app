export interface ProteinFood {
  id: string;
  name: string;
  nameEn: string;
  servingSize: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  category: 'animal' | 'plant' | 'dairy_supp';
  categoryLabel: string;
  categoryLabelEn: string;
  tier: 'gold' | 'silver' | 'balanced'; // gold: >70% cal from protein; silver: 45-70%; balanced: rich nutrient combo
  tags: string[];
  prepTipId: string;
  prepTipEn: string;
  suitableFor: ('cutting' | 'bulking' | 'recomp')[];
}

export const PROTEIN_FOODS_CATALOG: ProteinFood[] = [
  // ANIMAL SOURCES (HEWANI)
  {
    id: 'pf-dada-ayam',
    name: 'Dada Ayam Fillet (Kukus/Panggang)',
    nameEn: 'Chicken Breast Fillet',
    servingSize: 100,
    unit: 'g',
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    category: 'animal',
    categoryLabel: 'Hewani (Lean)',
    categoryLabelEn: 'Lean Poultry',
    tier: 'gold',
    tags: ['tinggi-protein', 'rendah-lemak', 'meal-prep', 'budget-friendly'],
    prepTipId: 'Marinasi dengan bawang putih, kecap asin rendah garam, dan lada hitam. Panggang di teflon antilengket atau air-fryer 180°C selama 12-15 menit agar tetap juicy.',
    prepTipEn: 'Marinate with garlic, low-sodium soy sauce, and black pepper. Air-fry at 180°C for 12-15 mins for maximum juiciness.',
    suitableFor: ['cutting', 'bulking', 'recomp'],
  },
  {
    id: 'pf-putih-telur',
    name: 'Putih Telur Rebus',
    nameEn: 'Boiled Egg Whites',
    servingSize: 100,
    unit: 'g (±3 butir)',
    calories: 52,
    proteinG: 11,
    carbsG: 0.7,
    fatG: 0.2,
    category: 'animal',
    categoryLabel: 'Hewani (Ultra Lean)',
    categoryLabelEn: 'Ultra Lean',
    tier: 'gold',
    tags: ['ultra-lean', 'tinggi-volume', 'bebas-lemak', 'cutting-staple'],
    prepTipId: 'Sangat ideal untuk cemilan malam atau tambahan sarapan saat cutting karena hampir 100% kalorinya murni dari protein.',
    prepTipEn: 'Perfect night snack or breakfast booster when cutting as almost 100% of calories come purely from protein.',
    suitableFor: ['cutting', 'recomp'],
  },
  {
    id: 'pf-telur-utuh',
    name: 'Telur Ayam Utuh Rebus',
    nameEn: 'Whole Boiled Egg',
    servingSize: 50,
    unit: 'butir',
    calories: 78,
    proteinG: 6.3,
    carbsG: 0.6,
    fatG: 5.3,
    category: 'animal',
    categoryLabel: 'Hewani (Padat Nutrisi)',
    categoryLabelEn: 'Whole Egg',
    tier: 'silver',
    tags: ['kolin-alami', 'vitamin-d', 'cepat-saji', 'budget-friendly'],
    prepTipId: 'Kuning telur kaya mikronutrisi (Kolin, Vitamin D & B12) yang mendukung produksi testosteron alami tubuh.',
    prepTipEn: 'Egg yolk is dense in choline, vitamin D and healthy fats supporting natural hormone synthesis.',
    suitableFor: ['cutting', 'bulking', 'recomp'],
  },
  {
    id: 'pf-ikan-tuna',
    name: 'Ikan Tuna Kaleng in Water',
    nameEn: 'Canned Tuna in Water',
    servingSize: 100,
    unit: 'g',
    calories: 116,
    proteinG: 26,
    carbsG: 0,
    fatG: 1,
    category: 'animal',
    categoryLabel: 'Hewani (Seafood)',
    categoryLabelEn: 'Seafood',
    tier: 'gold',
    tags: ['siap-santap', 'ultra-lean', 'omega-3', 'praktis'],
    prepTipId: 'Bisa langsung dicampur ke nasi panas, salad, atau diaduk dengan telur dadar. Sangat praktis tanpa perlu dimasak lama.',
    prepTipEn: 'Drain water and mix directly with rice, salads, or scramble with eggs for an instant high-protein meal.',
    suitableFor: ['cutting', 'recomp'],
  },
  {
    id: 'pf-ikan-salmon',
    name: 'Ikan Salmon Panggang',
    nameEn: 'Grilled Salmon',
    servingSize: 100,
    unit: 'g',
    calories: 206,
    proteinG: 22,
    carbsG: 0,
    fatG: 12.3,
    category: 'animal',
    categoryLabel: 'Hewani (Omega-3)',
    categoryLabelEn: 'Healthy Fat Seafood',
    tier: 'silver',
    tags: ['lemak-sehat', 'pemulihan-sendi', 'bulking-staple', 'omega-3'],
    prepTipId: 'Kaya asam lemak EPA & DHA untuk meredakan inflamasi sendi dan DOMS pasca angkat beban berat.',
    prepTipEn: 'Rich in EPA & DHA omega-3s reducing joint inflammation and muscle soreness post-lifting.',
    suitableFor: ['bulking', 'recomp'],
  },
  {
    id: 'pf-ikan-nila',
    name: 'Ikan Nila / Gurame Bakar',
    nameEn: 'Grilled Tilapia / Freshwater Fish',
    servingSize: 100,
    unit: 'g',
    calories: 128,
    proteinG: 26,
    carbsG: 0,
    fatG: 2.7,
    category: 'animal',
    categoryLabel: 'Hewani (Ikan Air Tawar)',
    categoryLabelEn: 'Freshwater Fish',
    tier: 'gold',
    tags: ['mudah-didapat', 'rendah-lemak', 'lezat', 'indonesia-staple'],
    prepTipId: 'Bakar dengan bumbu kunyit, ketumbar, dan perasan jeruk nipis. Alternatif protein lokal yang murah dan rendah lemak.',
    prepTipEn: 'Grill with turmeric, coriander and lime. Great affordable local low-fat protein.',
    suitableFor: ['cutting', 'bulking', 'recomp'],
  },
  {
    id: 'pf-daging-sapi-lean',
    name: 'Daging Sapi Has Dalam (Tenderloin)',
    nameEn: 'Lean Beef Tenderloin',
    servingSize: 100,
    unit: 'g',
    calories: 215,
    proteinG: 26,
    carbsG: 0,
    fatG: 12,
    category: 'animal',
    categoryLabel: 'Hewani (Daging Merah)',
    categoryLabelEn: 'Red Meat',
    tier: 'silver',
    tags: ['kreatin-alami', 'zat-besi', 'kekuatan-otot', 'bulking-favorite'],
    prepTipId: 'Sumber alami Kreatin dan Zat Besi Heme yang meningkatkan power angkatan dan hemoglobin darah.',
    prepTipEn: 'Natural source of creatine and heme iron boosting training power and muscular endurance.',
    suitableFor: ['bulking', 'recomp'],
  },
  {
    id: 'pf-udang-kupas',
    name: 'Udang Segar Rebus / Tumis',
    nameEn: 'Peeled Shrimp',
    servingSize: 100,
    unit: 'g',
    calories: 99,
    proteinG: 24,
    carbsG: 0.2,
    fatG: 0.3,
    category: 'animal',
    categoryLabel: 'Hewani (Seafood)',
    categoryLabelEn: 'Seafood',
    tier: 'gold',
    tags: ['ultra-lean', 'cepat-matang', 'lezat'],
    prepTipId: 'Tumis cepat 2-3 menit dengan sedikit minyak zaitun dan bawang putih agar tekstur tidak liat.',
    prepTipEn: 'Quick sauté for 2-3 minutes with garlic and olive oil to prevent chewiness.',
    suitableFor: ['cutting', 'recomp'],
  },

  // PLANT-BASED SOURCES (NABATI)
  {
    id: 'pf-tempe-kukus',
    name: 'Tempe Kedelai Kukus/Panggang',
    nameEn: 'Steamed/Grilled Tempeh',
    servingSize: 100,
    unit: 'g',
    calories: 190,
    proteinG: 19,
    carbsG: 9,
    fatG: 11,
    category: 'plant',
    categoryLabel: 'Nabati (Fermentasi)',
    categoryLabelEn: 'Plant Fermented',
    tier: 'balanced',
    tags: ['superfood-lokal', 'probiotik', 'tinggi-serat', 'budget-hero'],
    prepTipId: 'Kukus lalu potong dadu untuk ditumis atau dipanggang air-fryer. Probiotik alami tempe sangat baik untuk penyerapan nutrisi usus.',
    prepTipEn: 'Steam first then air-fry or bake. Natural probiotics support intestinal nutrient absorption.',
    suitableFor: ['cutting', 'bulking', 'recomp'],
  },
  {
    id: 'pf-tahu-putih',
    name: 'Tahu Putih Kukus / Sup Tahu',
    nameEn: 'White Tofu',
    servingSize: 100,
    unit: 'g',
    calories: 80,
    proteinG: 8,
    carbsG: 2,
    fatG: 4.8,
    category: 'plant',
    categoryLabel: 'Nabati (Kedelai)',
    categoryLabelEn: 'Soy-Based',
    tier: 'silver',
    tags: ['rendah-kalori', 'mudah-cerna', 'kalsium', 'budget-friendly'],
    prepTipId: 'Sangat cocok untuk sup bening sayur atau dicampur telur dadar untuk menambah volume makanan saat defisit.',
    prepTipEn: 'Great for vegetable clear soups or folded into scrambles to add food volume in a calorie deficit.',
    suitableFor: ['cutting', 'recomp'],
  },
  {
    id: 'pf-edamame',
    name: 'Kacang Edamame Rebus',
    nameEn: 'Boiled Edamame',
    servingSize: 100,
    unit: 'g (tanpa kulit)',
    calories: 122,
    proteinG: 11,
    carbsG: 9,
    fatG: 5,
    category: 'plant',
    categoryLabel: 'Nabati (Legum)',
    categoryLabelEn: 'Legumes',
    tier: 'balanced',
    tags: ['cemilan-sehat', 'protein-lengkap', 'serat-tinggi'],
    prepTipId: 'Cemilan tinggi protein siap saji saat bekerja atau santai sore hari.',
    prepTipEn: 'Delicious ready-to-eat high protein afternoon desk snack.',
    suitableFor: ['cutting', 'bulking', 'recomp'],
  },
  {
    id: 'pf-selai-kacang',
    name: 'Selai Kacang Alami (Peanut Butter)',
    nameEn: 'Natural Peanut Butter',
    servingSize: 30,
    unit: 'g (2 sdm)',
    calories: 188,
    proteinG: 8,
    carbsG: 6,
    fatG: 16,
    category: 'plant',
    categoryLabel: 'Nabati (Padat Kalori)',
    categoryLabelEn: 'Nut Butter',
    tier: 'balanced',
    tags: ['padat-kalori', 'bulking-staple', 'pre-workout', 'lemak-sehat'],
    prepTipId: 'Kombinasi sempurna saat bulking dioleskan pada roti gandum atau dicampur ke dalam smoothie/oatmeal.',
    prepTipEn: 'Top bulking staple spread on whole wheat toast or blended into pre-workout oat smoothies.',
    suitableFor: ['bulking'],
  },

  // DAIRY & SUPPLEMENTS (DAIRY & SUPLEMEN)
  {
    id: 'pf-whey-isolate',
    name: 'Whey Protein Isolate (1 Scoop)',
    nameEn: 'Whey Protein Isolate',
    servingSize: 30,
    unit: 'scoop',
    calories: 120,
    proteinG: 25,
    carbsG: 2,
    fatG: 1,
    category: 'dairy_supp',
    categoryLabel: 'Suplemen (Cepat Serap)',
    categoryLabelEn: 'Fast Digesting',
    tier: 'gold',
    tags: ['cepat-serap', 'bcaa-tinggi', 'post-workout', 'praktis'],
    prepTipId: 'Konsumsi 30-45 menit pasca latihan beban atau di pagi hari untuk segera menghentikan proses pemecahan otot (katabolisme).',
    prepTipEn: 'Consume 30-45 mins post-workout or in the morning to halt muscle protein breakdown swiftly.',
    suitableFor: ['cutting', 'bulking', 'recomp'],
  },
  {
    id: 'pf-greek-yogurt',
    name: 'Greek Yogurt Plain',
    nameEn: 'Greek Yogurt Plain',
    servingSize: 150,
    unit: 'g',
    calories: 130,
    proteinG: 15,
    carbsG: 6,
    fatG: 4,
    category: 'dairy_supp',
    categoryLabel: 'Dairy (Casein Lambat Serap)',
    categoryLabelEn: 'Slow Digesting Dairy',
    tier: 'silver',
    tags: ['kasein-alami', 'kenyang-lama', 'probiotik', 'cemilan-malam'],
    prepTipId: 'Mengandung kasein yang dicerna lambat, sangat ideal disantap sebelum tidur agar otot mendapatkan asam amino sepanjang malam.',
    prepTipEn: 'Rich in slow-release casein protein, ideal bedtime snack to feed muscle tissue through the night.',
    suitableFor: ['cutting', 'bulking', 'recomp'],
  },
  {
    id: 'pf-susu-lowfat',
    name: 'Susu Low Fat UHT',
    nameEn: 'Low Fat Milk',
    servingSize: 250,
    unit: 'ml',
    calories: 125,
    proteinG: 8.5,
    carbsG: 12,
    fatG: 3.5,
    category: 'dairy_supp',
    categoryLabel: 'Dairy (Cairan)',
    categoryLabelEn: 'Dairy Liquid',
    tier: 'silver',
    tags: ['kalsium', 'hidrasi', 'campuran-oats'],
    prepTipId: 'Gunakan sebagai cairan pembuat oatmeal atau shaker whey protein untuk menambah kenikmatan rasa dan protein.',
    prepTipEn: 'Use as base liquid for morning oats or whey protein shake for extra creaminess and protein.',
    suitableFor: ['bulking', 'recomp'],
  },
];

/**
 * Filter foods by category
 */
export function getProteinFoodsByCategory(category?: 'animal' | 'plant' | 'dairy_supp'): ProteinFood[] {
  if (!category) return PROTEIN_FOODS_CATALOG;
  return PROTEIN_FOODS_CATALOG.filter((f) => f.category === category);
}

/**
 * Filter foods by suitability for cutting vs bulking
 */
export function getProteinFoodsByProgram(program: 'cutting' | 'bulking' | 'recomp'): ProteinFood[] {
  return PROTEIN_FOODS_CATALOG.filter((f) => f.suitableFor.includes(program));
}

/**
 * Search protein foods by name, tag, or tip
 */
export function searchProteinFoods(query: string): ProteinFood[] {
  const q = query.toLowerCase().trim();
  if (!q) return PROTEIN_FOODS_CATALOG;
  return PROTEIN_FOODS_CATALOG.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.nameEn.toLowerCase().includes(q) ||
      f.tags.some((t) => t.includes(q)) ||
      f.categoryLabel.toLowerCase().includes(q)
  );
}
