/**
 * Centralized Nutrient Registry — single source of truth for all 138 BLS nutrients.
 *
 * Every nutrient definition lives here. Other modules import from this file
 * instead of maintaining their own copies of labels, units, mappings, etc.
 */

// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Energy',
  'Macronutrients',
  'Fiber',
  'Vitamins (fat-soluble)',
  'Vitamins (water-soluble)',
  'Minerals (macro)',
  'Minerals (trace)',
  'Sugars',
  'Sugar alcohols',
  'Starch & oligosaccharides',
  'Organic acids',
  'Fatty acids (saturated)',
  'Fatty acids (monounsaturated)',
  'Fatty acids (polyunsaturated)',
  'Fatty acids (other)',
  'Cholesterol',
  'Amino acids',
  'Other',
]

// ─── Nutrient definitions ────────────────────────────────────────────────────
// Each entry:
//   key           – canonical identifier used throughout the app
//   blsColumn     – exact BLS CSV column header
//   label         – English display name
//   unit          – display unit
//   category      – one of CATEGORIES above
//   defaultDaily  – default daily recommended value (null = none)
//   legacyTypes   – old recipe.nutrients[].type values that map here
//   conversionFromBls – optional fn(value) for unit conversion from BLS

const NUTRIENTS = [
  // ── Energy ──
  { key: 'calories',   blsColumn: 'ENERCC Energie (Kilokalorien) [kcal/100g]', label: 'Calories',      unit: 'kcal', category: 'Energy', defaultDaily: 2000, legacyTypes: ['kcal'] },
  { key: 'enercj',     blsColumn: 'ENERCJ Energie (Kilojoule) [kJ/100g]',      label: 'Energy (kJ)',   unit: 'kJ',   category: 'Energy', defaultDaily: null, legacyTypes: ['kJ'] },

  // ── Macronutrients ──
  { key: 'water',      blsColumn: 'WATER Wasser [g/100g]',                            label: 'Water',         unit: 'g', category: 'Macronutrients', defaultDaily: null,  legacyTypes: [] },
  { key: 'protein',    blsColumn: 'PROT625 Protein (Nx6,25) [g/100g]',                label: 'Protein',       unit: 'g', category: 'Macronutrients', defaultDaily: 55,    legacyTypes: ['protein'] },
  { key: 'fat',        blsColumn: 'FAT Fett [g/100g]',                                label: 'Fat',           unit: 'g', category: 'Macronutrients', defaultDaily: 70,    legacyTypes: ['fat'] },
  { key: 'carbs',      blsColumn: 'CHO Kohlenhydrate, verfügbar [g/100g]',             label: 'Carbs',         unit: 'g', category: 'Macronutrients', defaultDaily: 250,   legacyTypes: ['carb2'] },
  { key: 'alc',        blsColumn: 'ALC Alkohol (Ethanol) [g/100g]',                    label: 'Alcohol',       unit: 'g', category: 'Macronutrients', defaultDaily: null,  legacyTypes: [] },
  { key: 'oa',         blsColumn: 'OA Organische Säuren, gesamt [g/100g]',             label: 'Organic acids (total)', unit: 'g', category: 'Macronutrients', defaultDaily: null, legacyTypes: [] },
  { key: 'ash',        blsColumn: 'ASH Rohasche [g/100g]',                             label: 'Ash',           unit: 'g', category: 'Macronutrients', defaultDaily: null,  legacyTypes: [] },

  // ── Fiber ──
  { key: 'fiber',      blsColumn: 'FIBT Ballaststoffe, gesamt [g/100g]',                      label: 'Fiber',                       unit: 'g', category: 'Fiber', defaultDaily: 30,   legacyTypes: ['dietaryFibre'] },
  { key: 'fiblmw',     blsColumn: 'FIBLMW Ballaststoffe, niedermolekular [g/100g]',            label: 'Fiber (low mol. weight)',      unit: 'g', category: 'Fiber', defaultDaily: null, legacyTypes: [] },
  { key: 'fibhmw',     blsColumn: 'FIBHMW Ballaststoffe, hochmolekular [g/100g]',              label: 'Fiber (high mol. weight)',     unit: 'g', category: 'Fiber', defaultDaily: null, legacyTypes: [] },
  { key: 'fibins',     blsColumn: 'FIBINS Ballaststoffe, wasserunlöslich [g/100g]',             label: 'Fiber (insoluble)',           unit: 'g', category: 'Fiber', defaultDaily: null, legacyTypes: [] },
  { key: 'fibsol',     blsColumn: 'FIBSOL Ballaststoffe, wasserlöslich [g/100g]',               label: 'Fiber (soluble)',             unit: 'g', category: 'Fiber', defaultDaily: null, legacyTypes: [] },
  { key: 'fibhmws',    blsColumn: 'FIBHMWS Ballaststoffe, hochmolekular, wasserlöslich [g/100g]', label: 'Fiber (HMW soluble)',       unit: 'g', category: 'Fiber', defaultDaily: null, legacyTypes: [] },
  { key: 'fibhmwi',    blsColumn: 'FIBHMWI Ballaststoffe, hochmolekular, wasserunlöslich [g/100g]', label: 'Fiber (HMW insoluble)',  unit: 'g', category: 'Fiber', defaultDaily: null, legacyTypes: [] },

  // ── Vitamins (fat-soluble) ──
  { key: 'vitamin_a',  blsColumn: 'VITA Vitamin A, Retinol-Äquivalent (RE) [µg/100g]',            label: 'Vitamin A (RE)',     unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: 700,  legacyTypes: ['vitamin_a'] },
  { key: 'vitaa',      blsColumn: 'VITAA Vitamin A, Retinol-Aktivitäts-Äquivalent (RAE) [µg/100g]', label: 'Vitamin A (RAE)',  unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'retol',      blsColumn: 'RETOL Retinol [µg/100g]',                                       label: 'Retinol',          unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'cartb',      blsColumn: 'CARTB Beta‑Carotin [µg/100g]',                                  label: 'Beta-Carotene',    unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'carotpaxb',  blsColumn: 'CAROTPAXB Carotinoide, außer Beta-Carotin [µg/100g]',           label: 'Other carotenoids', unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'vitamin_d',  blsColumn: 'VITD Vitamin D [µg/100g]',                                      label: 'Vitamin D',        unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: 20,   legacyTypes: [] },
  { key: 'chocal',     blsColumn: 'CHOCAL Vitamin D3 (Cholecalciferol) [µg/100g]',                 label: 'Vitamin D3',       unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'ergcal',     blsColumn: 'ERGCAL Vitamin D2 (Ergocalciferol) [µg/100g]',                  label: 'Vitamin D2',       unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'vitamin_e',  blsColumn: 'VITE Vitamin E (Alpha-Tocopherol) [mg/100g]',                   label: 'Vitamin E',        unit: 'mg', category: 'Vitamins (fat-soluble)', defaultDaily: 12,   legacyTypes: [] },
  { key: 'tocpha',     blsColumn: 'TOCPHA Alpha‑Tocopherol [mg/100g]',                             label: 'Alpha-Tocopherol', unit: 'mg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'tocphb',     blsColumn: 'TOCPHB Beta-Tocopherol [mg/100g]',                              label: 'Beta-Tocopherol',  unit: 'mg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'tocphg',     blsColumn: 'TOCPHG Gamma-Tocopherol [mg/100g]',                             label: 'Gamma-Tocopherol', unit: 'mg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'tocphd',     blsColumn: 'TOCPHD Delta-Tocopherol [mg/100g]',                             label: 'Delta-Tocopherol', unit: 'mg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'toctra',     blsColumn: 'TOCTRA Alpha-Tocotrienol [mg/100g]',                            label: 'Alpha-Tocotrienol', unit: 'mg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'vitamin_k',  blsColumn: 'VITK Vitamin K [µg/100g]',                                     label: 'Vitamin K',        unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: 70,   legacyTypes: [] },
  { key: 'vitk1',      blsColumn: 'VITK1 Vitamin K1 (Phyllochinon) [µg/100g]',                    label: 'Vitamin K1',       unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'vitk2',      blsColumn: 'VITK2 Vitamin K2 (Menachinone) [µg/100g]',                     label: 'Vitamin K2',       unit: 'µg', category: 'Vitamins (fat-soluble)', defaultDaily: null, legacyTypes: [] },

  // ── Vitamins (water-soluble) ──
  { key: 'vitamin_b1', blsColumn: 'THIA Vitamin B1 (Thiamin) [mg/100g]',              label: 'Vitamin B1 (Thiamin)',  unit: 'mg', category: 'Vitamins (water-soluble)', defaultDaily: 1.1,  legacyTypes: [] },
  { key: 'vitamin_b2', blsColumn: 'RIBF Vitamin B2 (Riboflavin) [mg/100g]',           label: 'Vitamin B2 (Riboflavin)', unit: 'mg', category: 'Vitamins (water-soluble)', defaultDaily: 1.2, legacyTypes: [] },
  { key: 'niaeq',      blsColumn: 'NIAEQ Niacin-Äquivalent [mg/100g]',                label: 'Niacin equivalent',     unit: 'mg', category: 'Vitamins (water-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'niacin',     blsColumn: 'NIA Niacin [mg/100g]',                             label: 'Niacin',                unit: 'mg', category: 'Vitamins (water-soluble)', defaultDaily: 14,   legacyTypes: [] },
  { key: 'pantac',     blsColumn: 'PANTAC Pantothensäure [mg/100g]',                   label: 'Pantothenic acid',      unit: 'mg', category: 'Vitamins (water-soluble)', defaultDaily: 5,    legacyTypes: [] },
  { key: 'vitamin_b6', blsColumn: 'VITB6 Vitamin B6 [µg/100g]',                       label: 'Vitamin B6',            unit: 'µg', category: 'Vitamins (water-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'biotin',     blsColumn: 'BIOT Biotin [µg/100g]',                             label: 'Biotin',               unit: 'µg', category: 'Vitamins (water-soluble)', defaultDaily: 40,   legacyTypes: [] },
  { key: 'folate_eq',  blsColumn: 'FOL Folat-Äquivalent [µg/100g]',                   label: 'Folate equivalent',     unit: 'µg', category: 'Vitamins (water-soluble)', defaultDaily: 300,  legacyTypes: [] },
  { key: 'folate',     blsColumn: 'FOLFD Folat [µg/100g]',                             label: 'Folate',               unit: 'µg', category: 'Vitamins (water-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'folic_acid', blsColumn: 'FOLAC Folsäure, synthetisch [µg/100g]',             label: 'Folic acid (synthetic)', unit: 'µg', category: 'Vitamins (water-soluble)', defaultDaily: null, legacyTypes: [] },
  { key: 'vitamin_b12', blsColumn: 'VITB12 Vitamin B12 (Cobalamine) [µg/100g]',       label: 'Vitamin B12',           unit: 'µg', category: 'Vitamins (water-soluble)', defaultDaily: 2.4,  legacyTypes: ['vitamin_b12'] },
  { key: 'vitamin_c',   blsColumn: 'VITC Vitamin C [mg/100g]',                        label: 'Vitamin C',             unit: 'mg', category: 'Vitamins (water-soluble)', defaultDaily: 75,   legacyTypes: ['vitamin_c'] },

  // ── Minerals (macro) ──
  { key: 'sodium',     blsColumn: 'NA Natrium [mg/100g]',       label: 'Sodium',    unit: 'mg', category: 'Minerals (macro)', defaultDaily: 2300, legacyTypes: ['sodium'] },
  { key: 'salt',       blsColumn: 'NACL Salz (Natriumchlorid) [g/100g]', label: 'Salt', unit: 'g',  category: 'Minerals (macro)', defaultDaily: null, legacyTypes: [] },
  { key: 'chloride',   blsColumn: 'CLD Chlorid [mg/100g]',     label: 'Chloride',  unit: 'mg', category: 'Minerals (macro)', defaultDaily: null, legacyTypes: [] },
  { key: 'potassium',  blsColumn: 'K Kalium [mg/100g]',        label: 'Potassium', unit: 'mg', category: 'Minerals (macro)', defaultDaily: 2000, legacyTypes: [] },
  { key: 'calcium',    blsColumn: 'CA Calcium [mg/100g]',      label: 'Calcium',   unit: 'mg', category: 'Minerals (macro)', defaultDaily: 1000, legacyTypes: ['calcium'] },
  { key: 'magnesium',  blsColumn: 'MG Magnesium [mg/100g]',    label: 'Magnesium', unit: 'mg', category: 'Minerals (macro)', defaultDaily: 400,  legacyTypes: ['magnesium'] },
  { key: 'phosphorus', blsColumn: 'P Phosphor [mg/100g]',      label: 'Phosphorus', unit: 'mg', category: 'Minerals (macro)', defaultDaily: 700, legacyTypes: [] },
  { key: 'sulfur',     blsColumn: 'S Schwefel [mg/100g]',      label: 'Sulfur',    unit: 'mg', category: 'Minerals (macro)', defaultDaily: null, legacyTypes: [] },

  // ── Minerals (trace) ──
  { key: 'iron',       blsColumn: 'FE Eisen [mg/100g]',        label: 'Iron',       unit: 'mg', category: 'Minerals (trace)', defaultDaily: 8,    legacyTypes: ['iron'] },
  { key: 'zinc',       blsColumn: 'ZN Zink [mg/100g]',         label: 'Zinc',       unit: 'mg', category: 'Minerals (trace)', defaultDaily: 8,    legacyTypes: [] },
  { key: 'iodine',     blsColumn: 'ID Iodid [µg/100g]',        label: 'Iodine',     unit: 'µg', category: 'Minerals (trace)', defaultDaily: 150,  legacyTypes: [] },
  { key: 'copper',     blsColumn: 'CU Kupfer [µg/100g]',       label: 'Copper',     unit: 'µg', category: 'Minerals (trace)', defaultDaily: null, legacyTypes: [] },
  { key: 'manganese',  blsColumn: 'MN Mangan [µg/100g]',       label: 'Manganese',  unit: 'µg', category: 'Minerals (trace)', defaultDaily: null, legacyTypes: [] },
  { key: 'fluoride',   blsColumn: 'FD Fluorid [µg/100g]',      label: 'Fluoride',   unit: 'µg', category: 'Minerals (trace)', defaultDaily: null, legacyTypes: [] },
  { key: 'chromium',   blsColumn: 'CR Chrom [µg/100g]',        label: 'Chromium',   unit: 'µg', category: 'Minerals (trace)', defaultDaily: null, legacyTypes: [] },
  { key: 'molybdenum', blsColumn: 'MO Molybdän [µg/100g]',     label: 'Molybdenum', unit: 'µg', category: 'Minerals (trace)', defaultDaily: null, legacyTypes: [] },

  // ── Sugars ──
  { key: 'mnsac',      blsColumn: 'MNSAC Monosaccharide, gesamt [g/100g]',   label: 'Monosaccharides (total)', unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },
  { key: 'glucose',    blsColumn: 'GLUS Glucose [g/100g]',                   label: 'Glucose',                 unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },
  { key: 'fructose',   blsColumn: 'FRUS Fructose [g/100g]',                  label: 'Fructose',                unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },
  { key: 'galactose',  blsColumn: 'GALS Galactose [g/100g]',                 label: 'Galactose',               unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },
  { key: 'disac',      blsColumn: 'DISAC Disaccharide, gesamt [g/100g]',     label: 'Disaccharides (total)',   unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },
  { key: 'sucrose',    blsColumn: 'SUCS Saccharose [g/100g]',                label: 'Sucrose',                 unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },
  { key: 'maltose',    blsColumn: 'MALS Maltose [g/100g]',                   label: 'Maltose',                 unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },
  { key: 'lactose',    blsColumn: 'LACS Lactose [g/100g]',                   label: 'Lactose',                 unit: 'mg', category: 'Sugars', defaultDaily: null, legacyTypes: ['lactose'], conversionFromBls: (v) => v * 1000 },
  { key: 'sugar',      blsColumn: 'SUGAR Zucker (Mono- und Disaccharide), gesamt [g/100g]', label: 'Sugar (total)', unit: 'g', category: 'Sugars', defaultDaily: null, legacyTypes: [] },

  // ── Sugar alcohols ──
  { key: 'polyl',      blsColumn: 'POLYL Zuckeralkohole, gesamt [g/100g]',   label: 'Sugar alcohols (total)',  unit: 'g', category: 'Sugar alcohols', defaultDaily: null, legacyTypes: [] },
  { key: 'mannitol',   blsColumn: 'MANTL Mannit [g/100g]',                   label: 'Mannitol',                unit: 'g', category: 'Sugar alcohols', defaultDaily: null, legacyTypes: [] },
  { key: 'sorbitol',   blsColumn: 'SORTL Sorbit [g/100g]',                   label: 'Sorbitol',                unit: 'g', category: 'Sugar alcohols', defaultDaily: null, legacyTypes: [] },
  { key: 'xylitol',    blsColumn: 'XYLTL Xylit [g/100g]',                    label: 'Xylitol',                 unit: 'g', category: 'Sugar alcohols', defaultDaily: null, legacyTypes: [] },

  // ── Starch & oligosaccharides ──
  { key: 'olsac',      blsColumn: 'OLSAC Oligosaccharide, verfügbar [g/100g]', label: 'Oligosaccharides',  unit: 'g', category: 'Starch & oligosaccharides', defaultDaily: null, legacyTypes: [] },
  { key: 'starch',     blsColumn: 'STARCH Stärke (Stärke, Glykogen, Dextrine) [g/100g]', label: 'Starch', unit: 'g', category: 'Starch & oligosaccharides', defaultDaily: null, legacyTypes: [] },

  // ── Organic acids ──
  { key: 'aceac',      blsColumn: 'ACEAC Essigsäure [g/100g]',     label: 'Acetic acid',  unit: 'g', category: 'Organic acids', defaultDaily: null, legacyTypes: [] },
  { key: 'citac',      blsColumn: 'CITAC Zitronensäure [g/100g]',  label: 'Citric acid',  unit: 'g', category: 'Organic acids', defaultDaily: null, legacyTypes: [] },
  { key: 'lacac',      blsColumn: 'LACAC Milchsäure [g/100g]',     label: 'Lactic acid',  unit: 'g', category: 'Organic acids', defaultDaily: null, legacyTypes: [] },
  { key: 'malac',      blsColumn: 'MALAC Äpfelsäure [g/100g]',     label: 'Malic acid',   unit: 'g', category: 'Organic acids', defaultDaily: null, legacyTypes: [] },
  { key: 'tarac',      blsColumn: 'TARAC Weinsäure [g/100g]',      label: 'Tartaric acid', unit: 'g', category: 'Organic acids', defaultDaily: null, legacyTypes: [] },

  // ── Fatty acids (saturated) ──
  { key: 'saturatedFat', blsColumn: 'FASAT Fettsäuren, gesättigt, gesamt [g/100g]',         label: 'Saturated fat (total)',  unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: 20,   legacyTypes: ['saturatedFat'] },
  { key: 'f4_0',        blsColumn: 'F4:0 Fettsäure C4:0 (Buttersäure) [g/100g]',            label: 'C4:0 (Butyric acid)',    unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f6_0',        blsColumn: 'F6:0 Fettsäure C6:0 (Capronsäure) [g/100g]',            label: 'C6:0 (Caproic acid)',    unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f8_0',        blsColumn: 'F8:0 Fettsäure C8:0 (Caprylsäure) [g/100g]',            label: 'C8:0 (Caprylic acid)',   unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f10_0',       blsColumn: 'F10:0 Fettsäure C10:0 (Caprinsäure) [g/100g]',          label: 'C10:0 (Capric acid)',    unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f12_0',       blsColumn: 'F12:0 Fettsäure C12:0 (Laurinsäure) [g/100g]',          label: 'C12:0 (Lauric acid)',    unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f14_0',       blsColumn: 'F14:0 Fettsäure C14:0 (Myristinsäure) [g/100g]',        label: 'C14:0 (Myristic acid)',  unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f15_0',       blsColumn: 'F15:0 Fettsäure C15:0 (Pentadecylsäure) [g/100g]',      label: 'C15:0 (Pentadecylic)',   unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f16_0',       blsColumn: 'F16:0 Fettsäure C16:0 (Palmitinsäure) [g/100g]',        label: 'C16:0 (Palmitic acid)',  unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f17_0',       blsColumn: 'F17:0 Fettsäure C17:0 (Margarinsäure) [g/100g]',        label: 'C17:0 (Margaric acid)',  unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f18_0',       blsColumn: 'F18:0 Fettsäure C18:0 (Stearinsäure) [g/100g]',         label: 'C18:0 (Stearic acid)',   unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f20_0',       blsColumn: 'F20:0 Fettsäure C20:0 (Arachinsäure) [g/100g]',         label: 'C20:0 (Arachidic acid)', unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f22_0',       blsColumn: 'F22:0 Fettsäure C22:0 (Behensäure) [g/100g]',           label: 'C22:0 (Behenic acid)',   unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f24_0',       blsColumn: 'F24:0 Fettsäure C24:0 (Lignocerinsäure) [g/100g]',      label: 'C24:0 (Lignoceric acid)', unit: 'g', category: 'Fatty acids (saturated)', defaultDaily: null, legacyTypes: [] },

  // ── Fatty acids (monounsaturated) ──
  { key: 'mufa',       blsColumn: 'FAMS Fettsäure, einfach ungesättigt, gesamt [g/100g]',            label: 'MUFA (total)',             unit: 'g', category: 'Fatty acids (monounsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f14_1',      blsColumn: 'F14:1CN5 Fettsäure C14:1 n-5 cis (Myristoleinsäure) [g/100g]',   label: 'C14:1 (Myristoleic)',      unit: 'g', category: 'Fatty acids (monounsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f16_1',      blsColumn: 'F16:1CN7 Fettsäure C16:1 n-7 cis (Palmitoleinsäure) [g/100g]',   label: 'C16:1 (Palmitoleic)',      unit: 'g', category: 'Fatty acids (monounsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f18_1n7',    blsColumn: 'F18:1CN7 Fettsäure C18:1 n-7 cis (Vaccensäure) [g/100g]',        label: 'C18:1n7 (Vaccenic)',       unit: 'g', category: 'Fatty acids (monounsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f18_1n9',    blsColumn: 'F18:1CN9 Fettsäure C18:1 n-9 cis (Ölsäure) [g/100g]',            label: 'C18:1n9 (Oleic acid)',     unit: 'g', category: 'Fatty acids (monounsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f20_1',      blsColumn: 'F20:1CN9 Fettsäure C20:1 n-9 cis (Gondosäure) [g/100g]',         label: 'C20:1 (Gondoic acid)',     unit: 'g', category: 'Fatty acids (monounsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f22_1',      blsColumn: 'F22:1CN9 Fettsäure C22:1 n-9 cis (Erucasäura) [g/100g]',         label: 'C22:1 (Erucic acid)',      unit: 'g', category: 'Fatty acids (monounsaturated)', defaultDaily: null, legacyTypes: [] },

  // ── Fatty acids (polyunsaturated) ──
  { key: 'pufa',       blsColumn: 'FAPU Fettsäuren, mehrfach ungesättigt, gesamt [g/100g]',                          label: 'PUFA (total)',    unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'omega3',     blsColumn: 'FAPUN3 Fettsäuren, mehrfach ungesättigt n-3 (Omega-3), gesamt [g/100g]',         label: 'Omega-3 (total)', unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'ala',        blsColumn: 'F18:3CN3 Fettsäure C18:3 n-3 all-cis (Alpha-Linolensäure) [g/100g]',             label: 'ALA (Alpha-Linolenic)', unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'sda',        blsColumn: 'F18:4CN3 Fettsäure C18:4 n-3 all-cis (Stearidonsäure) [g/100g]',                 label: 'SDA (Stearidonic)',     unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'epa',        blsColumn: 'F20:5CN3 Fettsäure C20:5 n-3 all-cis (Eicosapentaensäure) [g/100g]',             label: 'EPA',                   unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'dpa',        blsColumn: 'F22:5CN3 Fettsäure C22:5 n-3 all-cis (Docosapentaensäure) [g/100g]',             label: 'DPA',                   unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'dha',        blsColumn: 'F22:6CN3 Fettsäure C22:6 n-3 all-cis (Docosahexaensäure) [g/100g]',              label: 'DHA',                   unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'omega6',     blsColumn: 'FAPUN6 Fettsäuren, mehrfach ungesättigt n-6 (Omega-6), gesamt [g/100g]',         label: 'Omega-6 (total)',       unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'linoleic',   blsColumn: 'F18:2CN6 Fettsäure C18:2 n-6 cis, cis (Linolsäure) [g/100g]',                   label: 'Linoleic acid',         unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'cla',        blsColumn: 'F18:2C9T11 Fettsäure C18:2 n-7 cis 9, trans 11 (konjugierte Linolsäure) [g/100g]', label: 'CLA',                unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'gla',        blsColumn: 'F18:3CN6 Fettsäure C18:3 n-6 all-cis (Gamma-Linolensäure) [g/100g]',             label: 'GLA (Gamma-Linolenic)', unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'f20_2n6',    blsColumn: 'F20:2CN6 Fettsäure C20:2 n-6 all-cis (Eicosadiensäure) [g/100g]',               label: 'C20:2n6 (Eicosadienoic)', unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'dgla',       blsColumn: 'F20:3CN6 Fettsäure C20:3 n-6 all-cis (Dihomogamma-Linolensäure) [g/100g]',      label: 'DGLA',                  unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },
  { key: 'ara',        blsColumn: 'F20:4CN6 Fettsäure C20:4 n-6 all-cis (Arachidonsäure) [g/100g]',                label: 'Arachidonic acid',      unit: 'g', category: 'Fatty acids (polyunsaturated)', defaultDaily: null, legacyTypes: [] },

  // ── Fatty acids (other) ──
  { key: 'fax',        blsColumn: 'FAX Fettsäuren, sonstige [g/100g]', label: 'Other fatty acids', unit: 'g', category: 'Fatty acids (other)', defaultDaily: null, legacyTypes: [] },

  // ── Cholesterol ──
  { key: 'cholesterol', blsColumn: 'CHORL Cholesterin [mg/100g]', label: 'Cholesterol', unit: 'mg', category: 'Cholesterol', defaultDaily: null, legacyTypes: [] },

  // ── Amino acids ──
  { key: 'aae9',    blsColumn: 'AAE9 Aminosäuren, unentbehrlich, gesamt [g/100g]',      label: 'Essential amino acids (total)', unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'alanine',      blsColumn: 'ALA Alanin [g/100g]',                                       label: 'Alanine',         unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'arginine',     blsColumn: 'ARG Arginin [g/100g]',                                      label: 'Arginine',        unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'aspartic',     blsColumn: 'ASP Asparaginsäure, inklusive Asparagin [g/100g]',           label: 'Aspartic acid',   unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'cysteine',     blsColumn: 'CYSTE Cystein [g/100g]',                                    label: 'Cysteine',        unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'glutamic',     blsColumn: 'GLU Glutaminsäure, inklusive Glutamin [g/100g]',             label: 'Glutamic acid',   unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'glycine',      blsColumn: 'GLY Glycin [g/100g]',                                       label: 'Glycine',         unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'histidine',    blsColumn: 'HIS Histidin [g/100g]',                                     label: 'Histidine',       unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'isoleucine',   blsColumn: 'ILE Isoleucin [g/100g]',                                    label: 'Isoleucine',      unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'leucine',      blsColumn: 'LEU Leucin [g/100g]',                                       label: 'Leucine',         unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'lysine',       blsColumn: 'LYS Lysin [g/100g]',                                        label: 'Lysine',          unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'methionine',   blsColumn: 'MET Methionin [g/100g]',                                    label: 'Methionine',      unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'phenylalanine', blsColumn: 'PHE Phenylalanin [g/100g]',                                label: 'Phenylalanine',   unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'proline',      blsColumn: 'PRO Prolin [g/100g]',                                       label: 'Proline',         unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'serine',       blsColumn: 'SER Serin [g/100g]',                                        label: 'Serine',          unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'threonine',    blsColumn: 'THR Threonin [g/100g]',                                     label: 'Threonine',       unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'tryptophan',   blsColumn: 'TRP Tryptophan [g/100g]',                                   label: 'Tryptophan',      unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'tyrosine',     blsColumn: 'TYR Tyrosin [g/100g]',                                      label: 'Tyrosine',        unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },
  { key: 'valine',       blsColumn: 'VAL Valin [g/100g]',                                        label: 'Valine',          unit: 'g', category: 'Amino acids', defaultDaily: null, legacyTypes: [] },

  // ── Other ──
  { key: 'nitrogen',  blsColumn: 'NT Stickstoff, gesamt [g/100g]', label: 'Nitrogen (total)', unit: 'g', category: 'Other', defaultDaily: null, legacyTypes: [] },
]

// ─── Derived lookup maps ─────────────────────────────────────────────────────

/** Map: key → full nutrient entry */
export const NUTRIENT_MAP = new Map(NUTRIENTS.map((n) => [n.key, n]))

/** Map: BLS column header → nutrient entry */
export const BLS_COLUMN_MAP = new Map(NUTRIENTS.map((n) => [n.blsColumn, n]))

/** Map: legacy type string → nutrient entry (for backward compat with recipe.nutrients[].type) */
export const LEGACY_TYPE_MAP = new Map()
for (const n of NUTRIENTS) {
  for (const lt of n.legacyTypes) {
    LEGACY_TYPE_MAP.set(lt, n)
  }
}

/** key → English label */
export const NUTRIENT_LABELS = Object.fromEntries(NUTRIENTS.map((n) => [n.key, n.label]))

/** key → display unit */
export const NUTRIENT_UNITS = Object.fromEntries(NUTRIENTS.map((n) => [n.key, n.unit]))

/** Default daily goals (only nutrients with a defaultDaily value) */
export const DEFAULT_DAILY_GOALS = Object.fromEntries(
  NUTRIENTS.filter((n) => n.defaultDaily != null).map((n) => [n.key, n.defaultDaily])
)

/** Default weekly goals = daily × 7 */
export const DEFAULT_WEEKLY_GOALS = Object.fromEntries(
  Object.entries(DEFAULT_DAILY_GOALS).map(([k, v]) => [k, v * 7])
)

/** All nutrient keys in registry order */
export const ALL_NUTRIENT_KEYS = NUTRIENTS.map((n) => n.key)

/** Core nutrients shown by default in the weekly goals table (the original ~14) */
export const CORE_NUTRIENT_KEYS = [
  'calories', 'protein', 'fat', 'carbs', 'fiber',
  'vitamin_a', 'vitamin_c', 'vitamin_b12',
  'iron', 'calcium', 'magnesium',
  'saturatedFat', 'sodium', 'lactose',
]

/**
 * Return nutrients grouped by category.
 * @returns {Array<{ category: string, nutrients: Array }>}
 */
export function getNutrientsByCategory() {
  const map = new Map()
  for (const cat of CATEGORIES) {
    map.set(cat, [])
  }
  for (const n of NUTRIENTS) {
    const list = map.get(n.category)
    if (list) list.push(n)
  }
  return CATEGORIES.map((category) => ({ category, nutrients: map.get(category) || [] }))
    .filter((g) => g.nutrients.length > 0)
}

/**
 * Resolve a nutrient key from any of: canonical key, legacy type, or BLS column name.
 * @param {string} input
 * @returns {object|null} nutrient entry or null
 */
export function resolveNutrient(input) {
  return NUTRIENT_MAP.get(input) || LEGACY_TYPE_MAP.get(input) || BLS_COLUMN_MAP.get(input) || null
}

/**
 * Resolve any type (canonical key or legacy type) to the canonical key.
 * Used when merging author + audit nutrients so we don't show the same nutrient twice (e.g. kcal vs calories).
 * @param {string} type - e.g. 'kcal', 'calories', 'carb2', 'carbs'
 * @returns {string} canonical key, e.g. 'calories', 'carbs'
 */
export function getCanonicalKey(type) {
  if (NUTRIENT_MAP.has(type)) return type
  const entry = LEGACY_TYPE_MAP.get(type)
  return entry ? entry.key : type
}
