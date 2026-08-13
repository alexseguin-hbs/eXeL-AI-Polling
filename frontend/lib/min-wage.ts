/**
 * MINIMUM-WAGE SETTLEMENT TABLE (frontend mirror of backend/app/core/hi_rates.py)
 * ==============================================================================
 * Prices the Seed token by jurisdiction. Seed = local-minimum-wage hour ÷ 7 — the
 * SAME formula everywhere; only the local hour changes by region (never a ranking
 * of worth). Figures mirror the canonical `_US_STATE_RATES` / `_COUNTRY_RATES`
 * and `resolve_human_rate()` in hi_rates.py — keep the two in sync.
 *
 *   Seed price = resolveMinWage(country, state) / 7
 *   (Texas $7.25 → $1.036 · Nigeria $0.34 → $0.049)
 *
 * Region is auto-detected from the visitor's IP via the Cloudflare-native
 * `/api/geo` Pages Function (see functions/api/geo.js) — no external API, no CORS.
 */

/** US federal / Texas fallback. */
export const DEFAULT_MIN_WAGE = 7.25;
export const DEFAULT_STATE = "Texas";
export const DEFAULT_COUNTRY = "United States";

/** The Seed divisor: one-seventh of a local minimum-wage hour. */
export const SEED_DIVISOR = 7;

/** Country-level rates (no state subdivision). Mirrors _COUNTRY_RATES. */
export const COUNTRY_RATES: Record<string, number> = {
  Nigeria: 0.34,
  Nepal: 0.65,
  Cambodia: 1.04,
  Mexico: 1.43,
  Thailand: 1.49,
  Brazil: 1.58,
  Honduras: 2.11,
  Colombia: 2.45,
  Chile: 3.02,
};

/** United States — state-level rates. Mirrors _US_STATE_RATES. */
export const US_STATE_RATES: Record<string, number> = {
  Alabama: 7.25, Georgia: 7.25, Idaho: 7.25, Indiana: 7.25, Iowa: 7.25,
  Kansas: 7.25, Kentucky: 7.25, Louisiana: 7.25, Mississippi: 7.25,
  "New Hampshire": 7.25, "North Carolina": 7.25, "North Dakota": 7.25,
  Oklahoma: 7.25, Pennsylvania: 7.25, "South Carolina": 7.25, Tennessee: 7.25,
  Texas: 7.25, Utah: 7.25, Wisconsin: 7.25, Wyoming: 7.25,
  "West Virginia": 8.75, Michigan: 10.33, Ohio: 10.45, Montana: 10.55,
  Minnesota: 10.85, Arkansas: 11.0, "South Dakota": 11.2, Alaska: 11.73,
  Nebraska: 12.0, Nevada: 12.0, "New Mexico": 12.0, Virginia: 12.0,
  Missouri: 12.3, Florida: 13.0, Vermont: 13.67, Hawaii: 14.0,
  "Rhode Island": 14.0, Maine: 14.15, Colorado: 14.42, Arizona: 14.7,
  Oregon: 14.7, Delaware: 15.0, Illinois: 15.0, Maryland: 15.0,
  Massachusetts: 15.0, "New York": 15.0, "New Jersey": 15.13,
  Connecticut: 15.69, California: 16.0, Washington: 16.28,
};

/** ISO-3166 alpha-2 → country name for the rows we price. Extend as the table grows. */
const ISO2_TO_COUNTRY: Record<string, string> = {
  US: "United States", NG: "Nigeria", NP: "Nepal", KH: "Cambodia",
  MX: "Mexico", TH: "Thailand", BR: "Brazil", HN: "Honduras",
  CO: "Colombia", CL: "Chile",
};

/** Cloudflare `regionCode` (e.g. "TX") → US state name, for the states we price. */
const US_REGION_TO_STATE: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const isUS = (country?: string | null) =>
  !!country && ["us", "usa", "united states"].includes(country.toLowerCase());

/**
 * Resolve the local minimum wage per hour. Same lookup order as the backend:
 *   1. US + state → US_STATE_RATES
 *   2. Country → COUNTRY_RATES
 *   3. Fallback → DEFAULT_MIN_WAGE (7.25)
 */
export function resolveMinWage(country?: string | null, state?: string | null): number {
  if (isUS(country)) {
    if (state && US_STATE_RATES[titleCase(state)] != null) return US_STATE_RATES[titleCase(state)];
    return DEFAULT_MIN_WAGE; // US without a recognized state → federal
  }
  if (country) {
    const rate = COUNTRY_RATES[country] ?? COUNTRY_RATES[titleCase(country)];
    if (rate != null) return rate;
  }
  return DEFAULT_MIN_WAGE;
}

/** Seed token price = local-minimum-wage hour ÷ 7. */
export const seedPrice = (minWage: number): number => minWage / SEED_DIVISOR;

export interface ResolvedRegion {
  country: string;      // display country name
  state: string | null; // display state (US only)
  minWage: number;      // $/hr
  seed: number;         // Seed price = minWage / 7
  label: string;        // e.g. "United States · Texas"
  detected: boolean;    // true when derived from IP, false when the default
}

/** Turn a raw geo hit (ISO2 country + region code) into a priced, display-ready region. */
export function regionFromGeo(geo: { country?: string | null; regionCode?: string | null; region?: string | null }): ResolvedRegion {
  const country = geo.country ? ISO2_TO_COUNTRY[geo.country.toUpperCase()] ?? geo.country : DEFAULT_COUNTRY;
  let state: string | null = null;
  if (isUS(country)) {
    const code = (geo.regionCode || "").toUpperCase();
    state = US_REGION_TO_STATE[code] ?? (geo.region && US_STATE_RATES[titleCase(geo.region)] ? titleCase(geo.region) : null);
  }
  const minWage = resolveMinWage(country, state);
  return {
    country, state, minWage, seed: seedPrice(minWage),
    label: state ? `${country} · ${state}` : country,
    detected: !!(geo.country),
  };
}

/** The USA/Texas default, used before detection resolves (and if it fails). */
export const DEFAULT_REGION: ResolvedRegion = {
  country: DEFAULT_COUNTRY, state: DEFAULT_STATE,
  minWage: DEFAULT_MIN_WAGE, seed: seedPrice(DEFAULT_MIN_WAGE),
  label: `${DEFAULT_COUNTRY} · ${DEFAULT_STATE}`, detected: false,
};

/**
 * Auto-assign the visitor's region from their IP via the Cloudflare-native
 * `/api/geo` function. Returns the USA/Texas default on any failure so the
 * price is always shown. Client-side only.
 */
export async function detectRegion(signal?: AbortSignal): Promise<ResolvedRegion> {
  try {
    const res = await fetch("/api/geo", { signal });
    if (!res.ok) return DEFAULT_REGION;
    const geo = (await res.json()) as { country?: string; regionCode?: string; region?: string };
    const r = regionFromGeo(geo);
    return r.detected ? r : DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
}

/** A representative selector list (high → low wage) for a manual region override. */
export const REGION_OPTIONS: ResolvedRegion[] = [
  regionFromGeo({ country: "US", regionCode: "WA" }),
  regionFromGeo({ country: "US", regionCode: "CA" }),
  regionFromGeo({ country: "US", regionCode: "TX" }),
  regionFromGeo({ country: "BR" }),
  regionFromGeo({ country: "MX" }),
  regionFromGeo({ country: "KH" }),
  regionFromGeo({ country: "NP" }),
  regionFromGeo({ country: "NG" }),
];

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
