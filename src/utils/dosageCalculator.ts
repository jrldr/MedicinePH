import {
  DoseUnitLabel,
  DosageResult,
  MedicineFormulation,
  OTCMedicine,
  UserProfile,
} from '../types/medicine';

export function getAgeInMonths(profile: UserProfile): number | null {
  if (profile.age === '' || Number.isNaN(Number(profile.age)) || Number(profile.age) < 0) {
    return null;
  }
  const numericAge = Number(profile.age);
  return profile.ageUnit === 'years' ? Math.round(numericAge * 12) : Math.round(numericAge);
}

export function getWeightInKg(profile: UserProfile): number | null {
  if (profile.weight === '' || Number.isNaN(Number(profile.weight)) || Number(profile.weight) <= 0) {
    return null;
  }
  const numericWeight = Number(profile.weight);
  return profile.weightUnit === 'lbs' ? numericWeight * 0.45359237 : numericWeight;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function formatNumber(value: number, step: number): string {
  if (step < 1) {
    const decimals = step === 0.1 ? 1 : 2;
    const rounded = Number(value.toFixed(decimals));
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1).replace(/\.0$/, '');
  }
  return `${Math.round(value)}`;
}

function pluralizeUnit(amount: number, unit: DoseUnitLabel): string {
  if (unit === 'mL') return 'mL';
  return amount === 1 || amount === 0.5 ? unit : `${unit}s`;
}

function formatDoseAmount(amount: number, unit: DoseUnitLabel, step = 0.5): string {
  if (unit === 'mL') {
    const decimals = step === 0.1 ? 1 : 1;
    const fixed = Number(amount.toFixed(decimals));
    return `${fixed % 1 === 0 ? fixed.toFixed(1) : fixed} mL`;
  }
  if (amount === 0.5) return `½ ${unit}`;
  if (amount === 1.5) return `1½ ${unit}s`;
  if (amount === 2.5) return `2½ ${unit}s`;
  return `${formatNumber(amount, 0.5)} ${pluralizeUnit(amount, unit)}`;
}

function formatAgeLabel(ageMonths: number): string {
  if (ageMonths < 12) {
    return `${ageMonths} month${ageMonths === 1 ? '' : 's'}`;
  }
  const years = Math.floor(ageMonths / 12);
  const remMonths = ageMonths % 12;
  if (remMonths === 0) return `${years} yr${years === 1 ? '' : 's'}`;
  return `${years} yr ${remMonths} mo`;
}

export function calculateDosage(
  medicine: OTCMedicine,
  formulation: MedicineFormulation,
  profile: UserProfile
): DosageResult {
  const ageMonths = getAgeInMonths(profile);
  const weightKg = getWeightInKg(profile);

  if (ageMonths === null || weightKg === null) {
    return {
      status: 'incomplete_profile',
      reason: 'Enter both Age and Weight in your Profile to calculate your safe OTC dosage.',
      minDoseText: '—',
      maxDoseText: '—',
      frequencyText: '—',
      maxDosesPerDayText: '—',
      maxDailyTotalText: '—',
      basisText: 'Waiting for age & weight',
      warnings: [],
      isSingleFixedDose: false,
    };
  }

  const spec = formulation.dosing;
  const warnings: string[] = [];

  if (ageMonths < spec.minAgeMonths) {
    return {
      status: 'contraindicated',
      reason: `Not recommended for OTC use below ${formatAgeLabel(spec.minAgeMonths)} for ${medicine.genericName} (${formulation.type} ${formulation.strengthLabel}). Consult a pediatrician or physician.`,
      minDoseText: 'Do Not Give OTC',
      maxDoseText: 'Consult Doctor',
      frequencyText: 'Pediatric evaluation required',
      maxDosesPerDayText: '0 (OTC restricted)',
      maxDailyTotalText: 'Consult pediatrician',
      basisText: `Age entered: ${formatAgeLabel(ageMonths)} (minimum OTC age: ${formatAgeLabel(spec.minAgeMonths)})`,
      warnings: [
        'Self-medication is unsafe below the Philippine OTC age threshold for this formulation.',
        ...medicine.phSafetyTips.slice(0, 1),
      ],
      isSingleFixedDose: true,
    };
  }

  if (spec.mode !== 'ors_weight' && spec.minWeightKg && weightKg < spec.minWeightKg) {
    return {
      status: 'contraindicated',
      reason: `Patient weight (${weightKg.toFixed(1)} kg) is below the minimum safe OTC weight (${spec.minWeightKg} kg) for ${formulation.type} ${formulation.strengthLabel}.`,
      minDoseText: 'Below Min Weight',
      maxDoseText: 'Consult Doctor',
      frequencyText: 'Check lower strength or consult doctor',
      maxDosesPerDayText: '0 (Weight too low)',
      maxDailyTotalText: 'Consult pediatrician',
      basisText: `Weight entered: ${weightKg.toFixed(1)} kg (minimum: ${spec.minWeightKg} kg)`,
      warnings: [
        'Switch to an infant Oral Drops formulation if available, or consult a pediatrician for exact weight dosing.',
      ],
      isSingleFixedDose: true,
    };
  }

  if (spec.mode === 'ors_weight') {
    let minMl = 200;
    let maxMl = 400;
    let weightBandLabel = 'Over 20 kg / Adults';
    if (weightKg < 10) {
      minMl = 50;
      maxMl = 100;
      weightBandLabel = 'Under 10 kg (WHO/DOH pediatric ORS guide)';
    } else if (weightKg <= 20) {
      minMl = 100;
      maxMl = 200;
      weightBandLabel = '10 kg to 20 kg (WHO/DOH pediatric ORS guide)';
    }

    return {
      status: 'calculated',
      minDoseText: `${minMl} mL`,
      maxDoseText: `${maxMl} mL`,
      minMgText: 'After each loose stool',
      maxMgText: 'Sip slowly',
      frequencyText: spec.intervalText,
      maxDosesPerDayText: spec.maxDosesPerDayLabel,
      maxDailyTotalText: 'Replace ongoing stool losses; seek care if vomiting persists',
      basisText: `Weight-based ORS guide: ${weightKg.toFixed(1)} kg (${weightBandLabel})`,
      warnings: [
        'Prepare 1 sachet in exactly 200 mL of clean drinking water.',
        'If the child vomits, wait 10 minutes then resume giving 1 teaspoon every 2–3 minutes.',
      ],
      isSingleFixedDose: false,
    };
  }

  if (spec.solidWarningBelowMonths && ageMonths < spec.solidWarningBelowMonths) {
    warnings.push(
      `Solid ${formulation.type.toLowerCase()}s can be hard to swallow for children under ${formatAgeLabel(spec.solidWarningBelowMonths)}. Consider selecting Syrup or Oral Drops instead.`
    );
  }

  if (spec.mode === 'weight_based') {
    const isAdultWeight = weightKg >= spec.adultWeightThresholdKg || ageMonths >= 144;
    let rawMinMg = weightKg * spec.minMgPerKg;
    let rawMaxMg = weightKg * spec.maxMgPerKg;

    // Never exceed single adult maximum mg
    rawMinMg = Math.min(rawMinMg, spec.adultMinMg);
    rawMaxMg = Math.min(rawMaxMg, spec.adultMaxMg);

    if (isAdultWeight && ageMonths >= 144) {
      rawMinMg = spec.adultMinMg;
      rawMaxMg = spec.adultMaxMg;
    }

    let minUnits = roundToStep(rawMinMg / formulation.mgPerUnit, spec.roundStep);
    let maxUnits = roundToStep(rawMaxMg / formulation.mgPerUnit, spec.roundStep);

    // Ensure at least one minimal step for valid patients
    minUnits = Math.max(spec.roundStep, minUnits);
    maxUnits = Math.max(minUnits, maxUnits);

    const minMgActual = Math.round(minUnits * formulation.mgPerUnit);
    const maxMgActual = Math.round(maxUnits * formulation.mgPerUnit);

    const dailyMgCap = Math.min(weightKg * spec.maxDailyMgPerKg, spec.maxDailyMgAdult);
    const maxDailyUnitsByMg = roundToStep(dailyMgCap / formulation.mgPerUnit, spec.roundStep);
    const maxDailyUnitsByFreq = maxUnits * spec.maxDosesPerDay;
    const effectiveMaxDailyUnits = Math.min(maxDailyUnitsByMg, maxDailyUnitsByFreq);
    const effectiveMaxDailyMg = Math.round(effectiveMaxDailyUnits * formulation.mgPerUnit);

    if (weightKg * spec.maxMgPerKg > spec.adultMaxMg && !isAdultWeight) {
      warnings.push(
        `Single dose is capped at the standard adult maximum (${spec.adultMaxMg} mg) to prevent overdose.`
      );
    }

    if (formulation.unitLabel === 'tablet' && minUnits < 1) {
      warnings.push(
        'Half-tablet dosing requires a scored tablet. Using Syrup / Suspension is more accurate for children.'
      );
    }

    return {
      status: 'calculated',
      minDoseText: formatDoseAmount(minUnits, formulation.unitLabel, spec.roundStep),
      maxDoseText: formatDoseAmount(maxUnits, formulation.unitLabel, spec.roundStep),
      minMgText: `${minMgActual} mg`,
      maxMgText: `${maxMgActual} mg`,
      frequencyText: spec.intervalText,
      maxDosesPerDayText: `Max ${spec.maxDosesPerDay} doses per 24 hours`,
      maxDailyTotalText: `${formatDoseAmount(effectiveMaxDailyUnits, formulation.unitLabel, spec.roundStep)} (${effectiveMaxDailyMg.toLocaleString()} mg/day max)`,
      basisText:
        isAdultWeight && ageMonths >= 144
          ? `Adult & ≥12 yrs standard (${weightKg.toFixed(1)} kg, capped at adult safe limit)`
          : `Weight-based (${weightKg.toFixed(1)} kg × ${spec.minMgPerKg}–${spec.maxMgPerKg} mg/kg/dose)`,
      warnings,
      isSingleFixedDose: Math.abs(minUnits - maxUnits) < 0.001,
    };
  }

  // Age-band dosing
  const matchingBand = spec.bands.find(
    (b) => ageMonths >= b.minAgeMonths && (b.maxAgeMonths === null || ageMonths <= b.maxAgeMonths)
  );

  if (!matchingBand) {
    return {
      status: 'contraindicated',
      reason: `This strength (${formulation.strengthLabel}) does not have an OTC dosing range for ${formatAgeLabel(ageMonths)}. Select another formulation or consult a doctor.`,
      minDoseText: 'Not Applicable',
      maxDoseText: 'Switch Strength',
      frequencyText: 'Check another formulation',
      maxDosesPerDayText: '—',
      maxDailyTotalText: '—',
      basisText: `Age entered: ${formatAgeLabel(ageMonths)}`,
      warnings: ['Try choosing an age-appropriate Syrup, Drops, or Tablet strength above.'],
      isSingleFixedDose: true,
    };
  }

  const step = formulation.unitLabel === 'mL' ? 0.5 : 0.5;
  const maxDailyUnits = matchingBand.maxDailyUnits ?? matchingBand.maxUnits * matchingBand.maxDosesPerDay;
  const minMgActual = Math.round(matchingBand.minUnits * formulation.mgPerUnit);
  const maxMgActual = Math.round(matchingBand.maxUnits * formulation.mgPerUnit);

  if (matchingBand.note) {
    warnings.push(matchingBand.note);
  }

  // Pediatric low-weight safety cross-check for age-banded syrups/tablets
  if (ageMonths < 144 && weightKg < 10 && formulation.type === 'Tablet') {
    warnings.push('Weight is under 10 kg — confirm dosing with a pediatrician before giving tablets.');
  }

  const showMg =
    formulation.mgPerUnit > 1 &&
    !formulation.strengthLabel.includes('+') &&
    !formulation.strengthLabel.includes('/');

  return {
    status: 'calculated',
    minDoseText: formatDoseAmount(matchingBand.minUnits, formulation.unitLabel, step),
    maxDoseText: formatDoseAmount(matchingBand.maxUnits, formulation.unitLabel, step),
    minMgText: showMg ? `${minMgActual} mg` : undefined,
    maxMgText: showMg ? `${maxMgActual} mg` : undefined,
    frequencyText: matchingBand.intervalText,
    maxDosesPerDayText: `Max ${matchingBand.maxDosesPerDay} ${matchingBand.maxDosesPerDay === 1 ? 'dose' : 'doses'} per 24 hours`,
    maxDailyTotalText: `${formatDoseAmount(maxDailyUnits, formulation.unitLabel, step)} max in 24 hours`,
    basisText: `Age-bracket protocol (${formatAgeLabel(ageMonths)}, ${weightKg.toFixed(1)} kg)`,
    warnings,
    isSingleFixedDose: Math.abs(matchingBand.minUnits - matchingBand.maxUnits) < 0.001,
  };
}
