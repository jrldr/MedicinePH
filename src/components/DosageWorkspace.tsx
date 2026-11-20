import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Clock,
  ExternalLink,
  Info,
  ShieldAlert,
  Utensils,
} from 'lucide-react';
import { fetchOpenFdaMonograph, OpenFdaReference } from '../services/openFdaService';
import { FormulationType, OTCMedicine, UserProfile } from '../types/medicine';
import { calculateDosage } from '../utils/dosageCalculator';

interface DosageWorkspaceProps {
  medicine: OTCMedicine;
  selectedFormulationId: string;
  onSelectFormulationId: (id: string) => void;
  profile: UserProfile;
  onFocusProfile: () => void;
}

export const DosageWorkspace: React.FC<DosageWorkspaceProps> = ({
  medicine,
  selectedFormulationId,
  onSelectFormulationId,
  profile,
  onFocusProfile,
}) => {
  const [fdaRef, setFdaRef] = useState<OpenFdaReference | null>(null);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [fdaAttempted, setFdaAttempted] = useState(false);

  // Reset OpenFDA state when medicine changes
  useEffect(() => {
    setFdaRef(null);
    setFdaLoading(false);
    setFdaAttempted(false);
  }, [medicine.id]);

  // Unique formulation types for this medicine (e.g. Oral Drops, Syrup / Suspension, Tablet)
  const formulationTypes = useMemo(() => {
    const seen = new Set<FormulationType>();
    const types: FormulationType[] = [];
    for (const f of medicine.formulations) {
      if (!seen.has(f.type)) {
        seen.add(f.type);
        types.push(f.type);
      }
    }
    return types;
  }, [medicine]);

  const activeFormulation = useMemo(() => {
    return (
      medicine.formulations.find((f) => f.id === selectedFormulationId) ||
      medicine.formulations[0]
    );
  }, [medicine, selectedFormulationId]);

  const activeType = activeFormulation.type;

  const strengthsForActiveType = useMemo(() => {
    return medicine.formulations.filter((f) => f.type === activeType);
  }, [medicine, activeType]);

  const dosage = useMemo(() => {
    return calculateDosage(medicine, activeFormulation, profile);
  }, [medicine, activeFormulation, profile]);

  const handleSelectType = (type: FormulationType) => {
    const firstMatch = medicine.formulations.find((f) => f.type === type);
    if (firstMatch) {
      onSelectFormulationId(firstMatch.id);
    }
  };

  const handleLoadOpenFda = async () => {
    if (!medicine.openFdaQueryName || fdaLoading) return;
    setFdaLoading(true);
    setFdaAttempted(true);
    const data = await fetchOpenFdaMonograph(medicine.openFdaQueryName);
    setFdaRef(data);
    setFdaLoading(false);
  };

  return (
    <article
      id="calculator"
      aria-labelledby="selected-med-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs"
    >
      {/* Medicine Header */}
      <header className="border-b border-slate-100 pb-5">
        <p className="text-xs font-medium text-teal-700">
          <span>{medicine.category}</span>
          <span aria-hidden="true"> · </span>
          <span>Over-the-Counter (OTC)</span>
        </p>
        <h2
          id="selected-med-title"
          className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-balance"
        >
          {medicine.genericName}
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Common PH brands:{' '}
          <span className="font-medium text-slate-800">
            {medicine.phPopularBrands.join(', ')}
          </span>
          <span aria-hidden="true"> · </span>
          <span>For {medicine.illnesses.join(', ')}</span>
        </p>
      </header>

      {/* Step 1 & 2: Formulation Type & Strength */}
      <div className="mt-5 space-y-4">
        <div>
          <span className="block text-xs font-semibold text-slate-500">
            1. Choose Medicine Form
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {formulationTypes.map((type) => {
              const isActive = type === activeType;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelectType(type)}
                  className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-500">
            2. Choose Strength / Concentration
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {strengthsForActiveType.map((formulation) => {
              const isActive = formulation.id === activeFormulation.id;
              return (
                <button
                  key={formulation.id}
                  type="button"
                  onClick={() => onSelectFormulationId(formulation.id)}
                  className={`min-h-[44px] rounded-xl px-4 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'border-2 border-teal-700 bg-teal-50/70 text-teal-950 font-semibold'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="font-mono-num">{formulation.strengthLabel}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Examples in PH pharmacies: {activeFormulation.phBrandExamples.join(', ')}
          </p>
        </div>
      </div>

      {/* Step 3: Calculated Dosage Result */}
      <div className="mt-6 border-t border-slate-100 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">
            Recommended Dosage & Daily Limit
          </h3>
          <span className="text-xs text-slate-500">{dosage.basisText}</span>
        </div>

        {dosage.status === 'incomplete_profile' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 shrink-0 text-teal-700 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Age and weight needed
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{dosage.reason}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onFocusProfile}
              className="mt-4 sm:mt-0 min-h-[44px] rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              Enter Age & Weight
            </button>
          </div>
        )}

        {dosage.status === 'contraindicated' && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-300 bg-red-50/80 p-5"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-700 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-red-950">
                  OTC Use Not Recommended for This Age / Weight
                </p>
                <p className="mt-1 text-sm text-red-900">{dosage.reason}</p>
                {dosage.warnings.length > 0 && (
                  <ul className="mt-3 list-disc pl-5 space-y-1 text-xs text-red-800">
                    {dosage.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {dosage.status === 'calculated' && (
          <div className="mt-4 space-y-4">
            {/* Min / Max Single Dose + Frequency Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="block text-xs font-medium text-slate-500">
                  Minimum Single Dose
                </span>
                <p className="mt-1 text-2xl font-bold text-slate-900 font-mono-num">
                  {dosage.minDoseText}
                </p>
                {dosage.minMgText && (
                  <p className="mt-0.5 text-xs text-slate-500 font-mono-num">
                    {dosage.minMgText}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                <span className="block text-xs font-medium text-teal-800">
                  Maximum Single Dose
                </span>
                <p className="mt-1 text-2xl font-bold text-teal-950 font-mono-num">
                  {dosage.maxDoseText}
                </p>
                {dosage.maxMgText && (
                  <p className="mt-0.5 text-xs text-teal-800 font-mono-num">
                    {dosage.maxMgText}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>Frequency</span>
                </span>
                <p className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                  {dosage.frequencyText}
                </p>
              </div>
            </div>

            {/* Overdose Prevention Box */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/75 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="h-5 w-5 shrink-0 text-amber-700 mt-0.5"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-amber-950">
                      Daily Maximum to Avoid Overdose
                    </p>
                    <p className="text-sm font-bold text-amber-950 font-mono-num">
                      {dosage.maxDosesPerDayText}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-amber-900 font-mono-num">
                    24-hour ceiling: <strong>{dosage.maxDailyTotalText}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Administration & Warnings */}
            <div className="flex items-start gap-2.5 text-sm text-slate-700">
              <Utensils className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">How to take:</strong>{' '}
                {medicine.takeWithFood}
              </span>
            </div>

            {dosage.warnings.length > 0 && (
              <ul className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
                {dosage.warnings.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-amber-700" aria-hidden="true">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section: Purpose & Possible Side Effects */}
      <div className="mt-8 border-t border-slate-200 pt-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Purpose of This Medicine
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {medicine.purpose}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-slate-800">How it works:</strong>{' '}
            {medicine.howItWorks}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Possible Common Side Effects
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600 list-disc pl-4">
              {medicine.commonSideEffects.map((effect, idx) => (
                <li key={idx}>{effect}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-red-900">
              Serious Warning Signs (Stop & Seek Care)
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700 list-disc pl-4">
              {medicine.seriousSideEffects.map((effect, idx) => (
                <li key={idx}>{effect}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h4 className="text-sm font-bold text-slate-900">
            Philippines OTC Safety Reminders
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600 list-disc pl-4">
            {medicine.phSafetyTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* Optional Free Public API Reference (OpenFDA) */}
        {medicine.openFdaQueryName && (
          <div className="border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">
                  International Drug Label Monograph (OpenFDA)
                </h4>
                <p className="text-xs text-slate-500">
                  Optional live reference when connected to the internet
                </p>
              </div>
              {!fdaRef && (
                <button
                  type="button"
                  onClick={handleLoadOpenFda}
                  disabled={fdaLoading}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                >
                  <BookOpen className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>{fdaLoading ? 'Loading label...' : 'Fetch OpenFDA Reference'}</span>
                </button>
              )}
            </div>

            {fdaAttempted && !fdaLoading && !fdaRef && (
              <p className="mt-2.5 text-xs text-slate-500">
                OpenFDA label unavailable offline or not matched — using verified Philippines OTC formulary above.
              </p>
            )}

            {fdaRef && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
                {fdaRef.activeIngredient && (
                  <p>
                    <strong className="text-slate-900">Active Ingredient (FDA):</strong>{' '}
                    {fdaRef.activeIngredient}
                  </p>
                )}
                {fdaRef.purposeSummary && (
                  <p>
                    <strong className="text-slate-900">Label Purpose:</strong>{' '}
                    {fdaRef.purposeSummary}
                  </p>
                )}
                {fdaRef.warningsSummary && (
                  <p>
                    <strong className="text-slate-900">Label Warnings:</strong>{' '}
                    {fdaRef.warningsSummary}
                  </p>
                )}
                <a
                  href={fdaRef.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
                >
                  <span>Source: OpenFDA Drug Label API</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
