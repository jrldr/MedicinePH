import React from 'react';
import { RotateCcw, UserRound } from 'lucide-react';
import { AgeUnit, UserProfile, WeightUnit } from '../types/medicine';
import { getAgeInMonths, getWeightInKg } from '../utils/dosageCalculator';

interface ProfileCardProps {
  profile: UserProfile;
  onChange: (next: UserProfile) => void;
  ageInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onChange,
  ageInputRef,
}) => {
  const ageMonths = getAgeInMonths(profile);
  const weightKg = getWeightInKg(profile);

  const handleAgeValue = (val: string) => {
    if (val === '') {
      onChange({ ...profile, age: '', updatedAt: new Date().toISOString() });
      return;
    }
    const num = Math.max(0, Math.min(profile.ageUnit === 'years' ? 120 : 240, Number(val)));
    onChange({
      ...profile,
      age: Number.isNaN(num) ? '' : num,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAgeUnit = (unit: AgeUnit) => {
    if (unit === profile.ageUnit) return;
    let converted: number | '' = profile.age;
    if (profile.age !== '') {
      const current = Number(profile.age);
      converted =
        unit === 'months'
          ? Math.round(current * 12)
          : Number((current / 12).toFixed(1));
    }
    onChange({
      ...profile,
      ageUnit: unit,
      age: converted,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleWeightValue = (val: string) => {
    if (val === '') {
      onChange({ ...profile, weight: '', updatedAt: new Date().toISOString() });
      return;
    }
    const num = Math.max(0, Math.min(profile.weightUnit === 'kg' ? 300 : 660, Number(val)));
    onChange({
      ...profile,
      weight: Number.isNaN(num) ? '' : num,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleWeightUnit = (unit: WeightUnit) => {
    if (unit === profile.weightUnit) return;
    let converted: number | '' = profile.weight;
    if (profile.weight !== '') {
      const current = Number(profile.weight);
      converted =
        unit === 'lbs'
          ? Number((current * 2.20462).toFixed(1))
          : Number((current / 2.20462).toFixed(1));
    }
    onChange({
      ...profile,
      weightUnit: unit,
      weight: converted,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    onChange({
      age: '',
      ageUnit: 'years',
      weight: '',
      weightUnit: 'kg',
      updatedAt: undefined,
    });
  };

  const hasValues = profile.age !== '' || profile.weight !== '';

  return (
    <section
      aria-labelledby="profile-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="profile-heading" className="text-base font-bold text-slate-900">
              Patient Profile
            </h2>
            <p className="text-xs text-slate-500">
              Saved locally for automatic OTC dosing
            </p>
          </div>
        </div>

        {hasValues && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Age Input */}
        <div>
          <label
            htmlFor="patient-age"
            className="block text-sm font-semibold text-slate-800"
          >
            Age
          </label>
          <div className="mt-1.5 flex items-stretch gap-2">
            <input
              ref={ageInputRef}
              id="patient-age"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={profile.ageUnit === 'years' ? 'e.g. 25' : 'e.g. 8'}
              value={profile.age}
              onChange={(e) => handleAgeValue(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 text-base font-medium text-slate-900 font-mono-num placeholder:font-sans placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-teal-600/20"
            />
            <div
              role="group"
              aria-label="Age unit"
              className="flex shrink-0 rounded-xl bg-slate-100 p-1"
            >
              <button
                type="button"
                onClick={() => handleAgeUnit('years')}
                className={`min-h-[36px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  profile.ageUnit === 'years'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yrs
              </button>
              <button
                type="button"
                onClick={() => handleAgeUnit('months')}
                className={`min-h-[36px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  profile.ageUnit === 'months'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mos
              </button>
            </div>
          </div>
          {ageMonths !== null && (
            <p className="mt-1.5 text-xs text-slate-500">
              {ageMonths < 24
                ? `Infant / toddler (${ageMonths} months)`
                : ageMonths < 144
                  ? `Pediatric (${Math.floor(ageMonths / 12)} yrs)`
                  : `Adolescent / Adult (${Math.floor(ageMonths / 12)} yrs)`}
            </p>
          )}
        </div>

        {/* Weight Input */}
        <div>
          <label
            htmlFor="patient-weight"
            className="block text-sm font-semibold text-slate-800"
          >
            Weight
          </label>
          <div className="mt-1.5 flex items-stretch gap-2">
            <input
              id="patient-weight"
              type="number"
              inputMode="decimal"
              min={0.5}
              step="any"
              placeholder={profile.weightUnit === 'kg' ? 'e.g. 60' : 'e.g. 132'}
              value={profile.weight}
              onChange={(e) => handleWeightValue(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 text-base font-medium text-slate-900 font-mono-num placeholder:font-sans placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-teal-600/20"
            />
            <div
              role="group"
              aria-label="Weight unit"
              className="flex shrink-0 rounded-xl bg-slate-100 p-1"
            >
              <button
                type="button"
                onClick={() => handleWeightUnit('kg')}
                className={`min-h-[36px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  profile.weightUnit === 'kg'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                kg
              </button>
              <button
                type="button"
                onClick={() => handleWeightUnit('lbs')}
                className={`min-h-[36px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  profile.weightUnit === 'lbs'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                lbs
              </button>
            </div>
          </div>
          {weightKg !== null && (
            <p className="mt-1.5 text-xs text-slate-500 font-mono-num">
              {profile.weightUnit === 'lbs'
                ? `≈ ${weightKg.toFixed(1)} kg used for calculation`
                : `≈ ${(weightKg * 2.20462).toFixed(1)} lbs`}
            </p>
          )}
        </div>
      </div>

      {/* Quick Age/Weight Presets for fast testing or family care */}
      <div className="mt-4 border-t border-slate-100 pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Quick presets:</span>
          <button
            type="button"
            onClick={() =>
              onChange({ age: 8, ageUnit: 'months', weight: 8.5, weightUnit: 'kg', updatedAt: new Date().toISOString() })
            }
            className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            Infant (8 mos · 8.5 kg)
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({ age: 5, ageUnit: 'years', weight: 18, weightUnit: 'kg', updatedAt: new Date().toISOString() })
            }
            className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            Child (5 yrs · 18 kg)
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({ age: 28, ageUnit: 'years', weight: 62, weightUnit: 'kg', updatedAt: new Date().toISOString() })
            }
            className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            Adult (28 yrs · 62 kg)
          </button>
        </div>
      </div>
    </section>
  );
};
