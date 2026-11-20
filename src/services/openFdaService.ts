export interface OpenFdaReference {
  brandNames: string[];
  activeIngredient: string;
  purposeSummary: string;
  warningsSummary: string;
  sourceUrl: string;
}

const CACHE_KEY_PREFIX = 'medassist_openfda_v1_';

function cleanFdaText(arr?: string[]): string {
  if (!arr || arr.length === 0) return '';
  const text = arr[0].replace(/\s+/g, ' ').trim();
  return text.length > 420 ? `${text.slice(0, 417)}...` : text;
}

export async function fetchOpenFdaMonograph(genericQuery: string): Promise<OpenFdaReference | null> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return null;
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${genericQuery.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as OpenFdaReference;
    }
  } catch {
    // Ignore storage read errors
  }

  try {
    const encoded = encodeURIComponent(`openfda.generic_name:"${genericQuery}" AND openfda.product_type:"HUMAN OTC DRUG"`);
    const url = `https://api.fda.gov/drug/label.json?search=${encoded}&limit=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.results?.[0];
    if (!result) return null;

    const parsed: OpenFdaReference = {
      brandNames: (result.openfda?.brand_name || []).slice(0, 4),
      activeIngredient: cleanFdaText(result.active_ingredient),
      purposeSummary: cleanFdaText(result.purpose || result.indications_and_usage),
      warningsSummary: cleanFdaText(result.warnings || result.do_not_use),
      sourceUrl: 'https://open.fda.gov/apis/drug/label/',
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
    } catch {
      // Ignore quota errors
    }
    return parsed;
  } catch {
    return null;
  }
}
