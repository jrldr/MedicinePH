import React, { useMemo, useRef, useState } from 'react';
import { Calculator, Pill, ShieldCheck } from 'lucide-react';
import { DosageWorkspace } from './components/DosageWorkspace';
import { MedicineBrowser, SearchMode } from './components/MedicineBrowser';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProfileCard } from './components/ProfileCard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SafetySection } from './components/SafetySection';
import { OTC_MEDICINES_PH } from './data/otcMedicinesPH';
import { useLocalStorage } from './hooks/useLocalStorage';
import { OTCMedicine, UserProfile } from './types/medicine';

type MobileTab = 'search' | 'dosage' | 'safety';

interface SavedSelection {
  medicineId: string;
  formulationId: string;
  searchMode: SearchMode;
}

const DEFAULT_PROFILE: UserProfile = {
  age: '',
  ageUnit: 'years',
  weight: '',
  weightUnit: 'kg',
};

const DEFAULT_SELECTION: SavedSelection = {
  medicineId: OTC_MEDICINES_PH[0].id,
  formulationId: OTC_MEDICINES_PH[0].formulations[3].id, // Paracetamol 500mg Tablet default
  searchMode: 'medicine',
};

export default function App() {
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    'medassist_profile_v1',
    DEFAULT_PROFILE
  );
  const [selection, setSelection] = useLocalStorage<SavedSelection>(
    'medassist_selection_v1',
    DEFAULT_SELECTION
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>('search');

  const ageInputRef = useRef<HTMLInputElement | null>(null);

  const selectedMedicine = useMemo(() => {
    return (
      OTC_MEDICINES_PH.find((m) => m.id === selection.medicineId) ||
      OTC_MEDICINES_PH[0]
    );
  }, [selection.medicineId]);

  const handleSelectMedicine = (med: OTCMedicine) => {
    const ageMonths =
      profile.age !== ''
        ? profile.ageUnit === 'years'
          ? Number(profile.age) * 12
          : Number(profile.age)
        : null;

    // Pick a smart initial formulation based on age if available (e.g. liquid/drops for young children)
    let preferredFormulation = med.formulations[0];
    if (ageMonths !== null && ageMonths >= 144) {
      const adultSolid = med.formulations.find(
        (f) => f.type === 'Tablet' || f.type === 'Capsule' || f.type === 'Chewable Tablet' || f.type === 'Liquid Sachet'
      );
      if (adultSolid) preferredFormulation = adultSolid;
    } else if (ageMonths !== null && ageMonths < 24) {
      const drops = med.formulations.find((f) => f.type === 'Oral Drops');
      if (drops) preferredFormulation = drops;
    } else if (ageMonths !== null && ageMonths < 144) {
      const syrup = med.formulations.find((f) => f.type === 'Syrup / Suspension');
      if (syrup) preferredFormulation = syrup;
    }

    setSelection({
      ...selection,
      medicineId: med.id,
      formulationId: preferredFormulation.id,
    });

    // On mobile screens, switch smoothly to the Dosage view when user picks a medicine
    if (window.innerWidth < 1024) {
      setMobileTab('dosage');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectFormulationId = (formulationId: string) => {
    setSelection({
      ...selection,
      formulationId,
    });
  };

  const handleSearchModeChange = (searchMode: SearchMode) => {
    setSelection({
      ...selection,
      searchMode,
    });
  };

  const handleFocusProfile = () => {
    if (window.innerWidth < 1024) {
      setMobileTab('search');
    }
    setTimeout(() => {
      ageInputRef.current?.focus();
      ageInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const profileSummaryLabel =
    profile.age !== '' && profile.weight !== ''
      ? `${profile.age} ${profile.ageUnit} · ${profile.weight} ${profile.weightUnit}`
      : 'Age & weight not set';

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-slate-900 flex flex-col">
      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 h-16">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setMobileTab('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Medicine Assistant
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#calculator"
              onClick={() => setMobileTab('dosage')}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Calculator
            </a>
            <a
              href="#browse-otc"
              onClick={() => {
                handleSearchModeChange('medicine');
                setMobileTab('search');
              }}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Browse OTC
            </a>
            <a
              href="#browse-otc"
              onClick={() => {
                handleSearchModeChange('illness');
                setMobileTab('search');
              }}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Illness Guide
            </a>
            <a
              href="#safety"
              onClick={() => setMobileTab('safety')}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Safety
            </a>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Responsive Content */}
      <main id="top" className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-5 sm:py-8 pb-24 lg:pb-12">
        {/* Intro Context Strip */}
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 text-balance">
              Philippines OTC Dosage & Safety Calculator
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Over-the-counter medicines only · Calculated by age and weight · Saved on your device
            </p>
          </div>
          <div className="hidden lg:block text-xs text-slate-500">
            Active profile:{' '}
            <strong className="font-semibold text-slate-800 font-mono-num">
              {profileSummaryLabel}
            </strong>
          </div>
        </div>

        {/* Desktop 2-Column Clinical Workbench / Mobile Tabbed Views */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Profile + Medicine/Illness Search */}
          <div
            className={`lg:col-span-5 space-y-6 ${
              mobileTab === 'search' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ProfileCard
              profile={profile}
              onChange={setProfile}
              ageInputRef={ageInputRef}
            />
            <MedicineBrowser
              selectedMedicineId={selectedMedicine.id}
              onSelectMedicine={handleSelectMedicine}
              searchMode={selection.searchMode}
              onSearchModeChange={handleSearchModeChange}
            />
          </div>

          {/* Right Column: Formulation, Strength, Min/Max Dosage, Purpose & Side Effects */}
          <div className="lg:col-span-7 space-y-6">
            <div className={mobileTab === 'dosage' ? 'block' : 'hidden lg:block'}>
              {/* Mobile Compact Profile Bar inside Dosage Tab */}
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 lg:hidden">
                <div className="min-w-0">
                  <span className="block text-[11px] font-medium text-slate-500">
                    Patient Profile
                  </span>
                  <span className="block truncate text-sm font-bold text-slate-900 font-mono-num">
                    {profileSummaryLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFocusProfile}
                  className="min-h-[40px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-teal-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Edit Profile
                </button>
              </div>

              <DosageWorkspace
                medicine={selectedMedicine}
                selectedFormulationId={selection.formulationId}
                onSelectFormulationId={handleSelectFormulationId}
                profile={profile}
                onFocusProfile={handleFocusProfile}
              />
            </div>

            <div className={mobileTab === 'safety' ? 'block' : 'hidden lg:block'}>
              <SafetySection />
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 pb-20 lg:pb-6">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 text-xs text-slate-500">
          <p>
            Medicine Assistant · Philippine OTC Reference Only (No Rx / Prescription Drugs)
          </p>
          <p>
            Informational aid only — always read the product leaflet and consult a doctor or pharmacist when unsure.
          </p>
        </div>
      </footer>

      {/* Mobile Thumb-Zone Bottom Tab Bar (56px height, < 10% viewport height) */}
      <nav
        aria-label="Mobile view switcher"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden pb-safe"
      >
        <div className="grid grid-cols-3 h-14">
          <button
            type="button"
            onClick={() => {
              setMobileTab('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileTab === 'search' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="h-5 w-5" aria-hidden="true" />
            <span>Profile & Search</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileTab('dosage');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileTab === 'dosage' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="h-5 w-5" aria-hidden="true" />
            <span>Dosage</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileTab('safety');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileTab === 'safety' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <span>Safety Guide</span>
          </button>
        </div>
      </nav>

      <OfflineIndicator />
    </div>
  );
}
