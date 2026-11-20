import React, { useMemo, useState } from 'react';
import { ChevronRight, Pill, Search, Stethoscope, X } from 'lucide-react';
import { COMMON_ILLNESSES, OTC_MEDICINES_PH } from '../data/otcMedicinesPH';
import { OTCMedicine } from '../types/medicine';

export type SearchMode = 'medicine' | 'illness';

interface MedicineBrowserProps {
  selectedMedicineId: string;
  onSelectMedicine: (medicine: OTCMedicine) => void;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
}

export const MedicineBrowser: React.FC<MedicineBrowserProps> = ({
  selectedMedicineId,
  onSelectMedicine,
  searchMode,
  onSearchModeChange,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIllness, setSelectedIllness] = useState<string>('All');

  const filteredMedicines = useMemo(() => {
    const q = query.trim().toLowerCase();

    return OTC_MEDICINES_PH.filter((med) => {
      if (searchMode === 'illness' && selectedIllness !== 'All') {
        if (!med.illnesses.includes(selectedIllness)) {
          return false;
        }
      }

      if (!q) return true;

      const haystack = [
        med.genericName,
        med.category,
        ...med.phPopularBrands,
        ...med.illnesses,
        ...med.searchKeywords,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, searchMode, selectedIllness]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredMedicines.length > 0 && !filteredMedicines.some((m) => m.id === selectedMedicineId)) {
      onSelectMedicine(filteredMedicines[0]);
    }
  };

  return (
    <section
      id="browse-otc"
      aria-labelledby="browser-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="browser-heading" className="text-base font-bold text-slate-900">
            Find OTC Medicine
          </h2>
          <p className="text-xs text-slate-500">
            Search by medicine name, PH brand, or illness
          </p>
        </div>

        {/* Mode Switch */}
        <div
          role="tablist"
          aria-label="Browse mode"
          className="flex items-center gap-1 rounded-xl bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={searchMode === 'medicine'}
            onClick={() => {
              onSearchModeChange('medicine');
              setSelectedIllness('All');
            }}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              searchMode === 'medicine'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Medicines</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={searchMode === 'illness'}
            onClick={() => onSearchModeChange('illness')}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              searchMode === 'illness'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
            <span>By Illness</span>
          </button>
        </div>
      </div>

      {/* Search Form with explicit Search button */}
      <form onSubmit={handleSearchSubmit} className="mt-4 flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchMode === 'illness'
                ? 'Type symptom (e.g. fever, cough, headache)...'
                : 'Search generic or PH brand (e.g. Biogesic, Solmux)...'
            }
            aria-label="Search OTC medicines or illnesses"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-teal-600/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-800 active:scale-[0.98] whitespace-nowrap shrink-0"
        >
          Search
        </button>
      </form>

      {/* Illness / Symptom Quick Filters */}
      {searchMode === 'illness' && (
        <div id="illness-guide" className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Select a symptom to see suggested PH OTC medicines:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedIllness('All')}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedIllness === 'All'
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Symptoms
            </button>
            {COMMON_ILLNESSES.map((illness) => (
              <button
                key={illness}
                type="button"
                onClick={() => setSelectedIllness(illness)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedIllness === illness
                    ? 'bg-teal-700 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {illness}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-2 text-xs text-slate-500">
        <span>
          Showing <strong className="font-semibold text-slate-800">{filteredMedicines.length}</strong>{' '}
          OTC {filteredMedicines.length === 1 ? 'medicine' : 'medicines'}
        </span>
        <span>Philippines OTC Formulary</span>
      </div>

      {/* Medicine List */}
      {filteredMedicines.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-slate-800">No matching OTC medicine found</p>
          <p className="mt-1 text-xs text-slate-500">
            Try searching a generic name (Paracetamol, Cetirizine), PH brand (Biogesic, Neozep), or symptom (fever, cough).
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIllness('All');
            }}
            className="mt-4 min-h-[44px] rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Show All OTC Medicines
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 max-h-[420px] lg:max-h-[540px] overflow-y-auto pr-1">
          {filteredMedicines.map((med) => {
            const isSelected = med.id === selectedMedicineId;
            return (
              <li key={med.id}>
                <button
                  type="button"
                  onClick={() => onSelectMedicine(med)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`group flex w-full min-h-[60px] items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-teal-50/90 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm font-bold ${
                          isSelected ? 'text-teal-900' : 'text-slate-900'
                        }`}
                      >
                        {med.genericName}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <span>{med.phPopularBrands.slice(0, 3).join(', ')}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{med.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {med.formulations.length}{' '}
                        {med.formulations.length === 1 ? 'option' : 'options'}
                      </span>
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isSelected
                        ? 'text-teal-700 translate-x-0.5'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
