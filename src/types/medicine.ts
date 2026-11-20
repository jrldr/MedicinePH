export type AgeUnit = 'years' | 'months';
export type WeightUnit = 'kg' | 'lbs';

export interface UserProfile {
  age: number | '';
  ageUnit: AgeUnit;
  weight: number | '';
  weightUnit: WeightUnit;
  updatedAt?: string;
}

export type FormulationType =
  | 'Oral Drops'
  | 'Syrup / Suspension'
  | 'Tablet'
  | 'Capsule'
  | 'Chewable Tablet'
  | 'Liquid Sachet';

export type DoseUnitLabel = 'mL' | 'tablet' | 'capsule' | 'sachet';

export interface AgeBandRule {
  minAgeMonths: number;
  maxAgeMonths: number | null; // null = no upper limit
  minUnits: number;
  maxUnits: number;
  maxDosesPerDay: number;
  intervalText: string;
  maxDailyUnits?: number;
  note?: string;
}

export interface WeightBasedSpec {
  mode: 'weight_based';
  minAgeMonths: number;
  minWeightKg?: number;
  minMgPerKg: number;
  maxMgPerKg: number;
  adultWeightThresholdKg: number; // Weight at which adult fixed dose applies
  adultMinMg: number;
  adultMaxMg: number;
  maxDailyMgPerKg: number;
  maxDailyMgAdult: number;
  maxDosesPerDay: number;
  intervalText: string;
  roundStep: number; // e.g. 0.5 for mL, 0.1 for drops, 0.5 for scored tablets
  solidWarningBelowMonths?: number;
}

export interface AgeBandSpec {
  mode: 'age_bands';
  minAgeMonths: number;
  minWeightKg?: number;
  bands: AgeBandRule[];
  solidWarningBelowMonths?: number;
}

export interface OrsWeightSpec {
  mode: 'ors_weight';
  minAgeMonths: number;
  intervalText: string;
  maxDosesPerDayLabel: string;
}

export type DosingSpec = WeightBasedSpec | AgeBandSpec | OrsWeightSpec;

export interface MedicineFormulation {
  id: string;
  type: FormulationType;
  strengthLabel: string; // e.g., "250 mg / 5 mL" or "500 mg"
  mgPerUnit: number; // mg of primary active ingredient per 1 mL or 1 tablet/capsule
  unitLabel: DoseUnitLabel;
  phBrandExamples: string[];
  dosing: DosingSpec;
}

export interface OTCMedicine {
  id: string;
  genericName: string;
  openFdaQueryName?: string; // Optional generic term for OpenFDA API lookup
  phPopularBrands: string[];
  category: string;
  illnesses: string[];
  searchKeywords: string[];
  purpose: string;
  howItWorks: string;
  commonSideEffects: string[];
  seriousSideEffects: string[];
  phSafetyTips: string[];
  takeWithFood: string;
  formulations: MedicineFormulation[];
}

export interface DosageResult {
  status: 'calculated' | 'contraindicated' | 'incomplete_profile';
  reason?: string;
  minDoseText: string;
  maxDoseText: string;
  minMgText?: string;
  maxMgText?: string;
  frequencyText: string;
  maxDosesPerDayText: string;
  maxDailyTotalText: string;
  basisText: string;
  warnings: string[];
  isSingleFixedDose: boolean;
}
