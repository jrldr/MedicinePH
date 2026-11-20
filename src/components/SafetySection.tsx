import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SafetySection: React.FC = () => {
  return (
    <section
      id="safety"
      aria-labelledby="safety-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <div>
            <h2 id="safety-heading" className="text-base font-bold text-slate-900">
              Philippine OTC Safety & Measurement Guide
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              All calculations cover Over-the-Counter (OTC) medicines only — prescription-only (Rx) drugs such as antibiotics are intentionally excluded.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <h3 className="font-semibold text-slate-900">Measure Liquids Accurately</h3>
              <p className="mt-1 text-xs leading-relaxed">
                Always use the calibrated oral syringe, dropper, or dosing cup included with the bottle (1 teaspoon = 5 mL). Kitchen spoons vary widely and cause dosing errors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Avoid Hidden Duplicates</h3>
              <p className="mt-1 text-xs leading-relaxed">
                Many PH cold and pain brands (Bioflu, Neozep, Decolgen, Alaxan FR) contain Paracetamol or Ibuprofen. Check active ingredients before combining medicines.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">When to See a Doctor</h3>
              <p className="mt-1 text-xs leading-relaxed">
                Consult a licensed physician or pharmacist if fever lasts over 3 days, symptoms worsen, an infant under 3 months has fever, or dengue is suspected (avoid NSAIDs like Ibuprofen).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
