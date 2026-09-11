/**
 * pod-rates.ts — the region, the minimum-wage table, and what a 웃 settles as.
 *
 * OPERATOR ASK, 2026-09-10 (docs/asks/2026-09-10_minimum_wage_rate_table.md):
 *   "let me know when pod has region, mini wage table, and rates built in
 *    Consolidated Table — Published Numeric Rates First, NULL Records Last"
 *
 * GENERATED FROM docs/asks/2026-09-10_minimum_wage_rate_table.psv — the operator's own file, transcribed once and
 * committed before this code existed. If a rate is wrong, the source is wrong; do not edit a figure here.
 *
 * THE MINT NEVER READS THIS FILE. 웃 = M × T, and no wage, currency or jurisdiction may enter the mint — that
 * placement error is the defect the paper spent thirty-four releases removing. A region decides ONLY what an already
 * minted 웃 settles as, and the rate is STAMPED at mint (D9, the vintage rule) rather than looked up later.
 *
 * NO CURRENCY IS EVER CONVERTED INTO ANOTHER. The table publishes one hourly rate per region in that region's own
 * currency and nothing else. There are no exchange rates here because the paper publishes none, and a settlement
 * figure in a currency the operator did not give me would be invented.
 *
 * A NULL RATE IS NOT ZERO. unit.settle: "No contributor settles at zero merely because their government has not yet
 * legislated." Such a region settles under the Global Agreed Standard, and until that number is published the pod
 * shows no figure at all and says which of the three reasons applies.
 */

/** One row of the operator's table. `rate` is the hourly minimum wage in `currency`; null where none is published. */
export interface RegionRate {
  lang: string;          // Language
  cc: string;            // Country Code (ISO 3166-1 alpha-2)
  name: string;          // Country / Jurisdiction, as printed
  currency: string;      // Currency Code (ISO 4217)
  rate: number | null;   // Hourly Wage Rate — NULL where not published
  published: boolean;    // Official Published
  noSingleRate: boolean; // No Single National Rate
  note: string;          // Notes, verbatim
}

/** The operator's 114 rows, in his order: published numeric rates first, NULL records last. */
export const REGION_RATES: RegionRate[] = [
  { lang: "English", cc: "US", name: "United States — Austin, Texas", currency: "USD", rate: 7.250, published: true, noSingleRate: false, note: "Federal rate applicable in Texas" },
  { lang: "English", cc: "GB", name: "United Kingdom", currency: "GBP", rate: 12.710, published: true, noSingleRate: false, note: "Age 21+" },
  { lang: "English", cc: "CA", name: "Canada — Federal", currency: "CAD", rate: 18.150, published: true, noSingleRate: true, note: "Federal sector; provinces set most rates" },
  { lang: "English", cc: "AU", name: "Australia", currency: "AUD", rate: 26.440, published: true, noSingleRate: false, note: "National minimum" },
  { lang: "English", cc: "NZ", name: "New Zealand", currency: "NZD", rate: 23.950, published: true, noSingleRate: false, note: "Adult minimum" },
  { lang: "English", cc: "NG", name: "Nigeria", currency: "NGN", rate: 402.739, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "French", cc: "CM", name: "Cameroon — Yaoundé", currency: "XAF", rate: 240.925, published: true, noSingleRate: false, note: "Government-sector reference" },
  { lang: "Spanish", cc: "ES", name: "Spain", currency: "EUR", rate: 8.196, published: true, noSingleRate: false, note: "National annual minimum converted to hourly" },
  { lang: "Spanish", cc: "MX", name: "Mexico", currency: "MXN", rate: 39.380, published: true, noSingleRate: false, note: "General rate; northern border differs" },
  { lang: "Spanish", cc: "CO", name: "Colombia", currency: "COP", rate: 10073.700, published: true, noSingleRate: false, note: "National base minimum" },
  { lang: "Spanish", cc: "CL", name: "Chile", currency: "CLP", rate: 3101.087, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "German", cc: "DE", name: "Germany", currency: "EUR", rate: 13.900, published: true, noSingleRate: false, note: "National rate" },
  { lang: "German", cc: "LU", name: "Luxembourg", currency: "EUR", rate: 15.557, published: true, noSingleRate: false, note: "National unskilled reference" },
  { lang: "Portuguese", cc: "BR", name: "Brazil", currency: "BRL", rate: 9.326, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "Russian", cc: "RU", name: "Russia", currency: "RUB", rate: 155.878, published: true, noSingleRate: false, note: "Federal rate converted from monthly" },
  { lang: "Chinese", cc: "CN", name: "China — Beijing", currency: "CNY", rate: 27.700, published: true, noSingleRate: true, note: "Municipal rate; no single national rate" },
  { lang: "Japanese", cc: "JP", name: "Japan — Tokyo", currency: "JPY", rate: 1226.000, published: true, noSingleRate: true, note: "Prefectural rate" },
  { lang: "Korean", cc: "KR", name: "South Korea", currency: "KRW", rate: 10320.000, published: true, noSingleRate: false, note: "National rate" },
  { lang: "Arabic", cc: "EG", name: "Egypt", currency: "EGP", rate: 40.274, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "Arabic", cc: "MA", name: "Morocco", currency: "MAD", rate: 19.694, published: true, noSingleRate: true, note: "Nonagricultural reference" },
  { lang: "Punjabi", cc: "PK", name: "Pakistan — Punjab", currency: "PKR", rate: 230.137, published: true, noSingleRate: true, note: "Provincial rate" },
  { lang: "Thai", cc: "TH", name: "Thailand — Bangkok", currency: "THB", rate: 50.000, published: true, noSingleRate: true, note: "Bangkok daily rate converted to hourly" },
  { lang: "Vietnamese", cc: "VN", name: "Vietnam — Region I", currency: "VND", rate: 30550.685, published: true, noSingleRate: true, note: "Highest official regional rate" },
  { lang: "Indonesian", cc: "ID", name: "Indonesia — Jakarta", currency: "IDR", rate: 32967.608, published: true, noSingleRate: true, note: "Provincial rate converted from monthly" },
  { lang: "Malay", cc: "MY", name: "Malaysia", currency: "MYR", rate: 9.781, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "Filipino", cc: "PH", name: "Philippines — Metro Manila", currency: "PHP", rate: 86.875, published: true, noSingleRate: true, note: "Regional daily rate converted to hourly" },
  { lang: "Turkish", cc: "TR", name: "Türkiye", currency: "TRY", rate: 190.036, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "Polish", cc: "PL", name: "Poland", currency: "PLN", rate: 27.651, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "Hebrew", cc: "IL", name: "Israel", currency: "ILS", rate: 33.830, published: true, noSingleRate: false, note: "National rate converted from monthly" },
  { lang: "English", cc: "IE", name: "Ireland", currency: "EUR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "English", cc: "IN", name: "India", currency: "INR", rate: null, published: true, noSingleRate: true, note: "Not Published — varies by state, skill and occupation" },
  { lang: "French", cc: "FR", name: "France", currency: "EUR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "French", cc: "BE", name: "Belgium", currency: "EUR", rate: null, published: true, noSingleRate: true, note: "Not Published — interprofessional and sectoral floors" },
  { lang: "French", cc: "CH", name: "Switzerland", currency: "CHF", rate: null, published: true, noSingleRate: true, note: "Not Published — selected cantons publish rates" },
  { lang: "French", cc: "CA", name: "Canada — Québec", currency: "CAD", rate: null, published: true, noSingleRate: true, note: "Not Published — provincial rate" },
  { lang: "French", cc: "CD", name: "Democratic Republic of the Congo", currency: "CDF", rate: null, published: true, noSingleRate: true, note: "Not Published — occupational categories" },
  { lang: "French", cc: "CI", name: "Côte d’Ivoire", currency: "XOF", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "French", cc: "SN", name: "Senegal", currency: "XOF", rate: null, published: true, noSingleRate: true, note: "Not Published — agricultural and nonagricultural rates" },
  { lang: "French", cc: "ML", name: "Mali", currency: "XOF", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "French", cc: "HT", name: "Haiti", currency: "HTG", rate: null, published: true, noSingleRate: true, note: "Not Published — industry-specific daily rates" },
  { lang: "Spanish", cc: "GT", name: "Guatemala", currency: "GTQ", rate: null, published: true, noSingleRate: true, note: "Not Published — varies by activity and region" },
  { lang: "Spanish", cc: "HN", name: "Honduras", currency: "HNL", rate: null, published: true, noSingleRate: true, note: "Not Published — employer size and industry" },
  { lang: "Spanish", cc: "SV", name: "El Salvador", currency: "USD", rate: null, published: true, noSingleRate: true, note: "Not Published — sector-specific" },
  { lang: "Spanish", cc: "NI", name: "Nicaragua", currency: "NIO", rate: null, published: true, noSingleRate: true, note: "Not Published — industry-specific" },
  { lang: "Spanish", cc: "CR", name: "Costa Rica", currency: "CRC", rate: null, published: true, noSingleRate: true, note: "Not Published — occupation and skill-specific" },
  { lang: "Spanish", cc: "PA", name: "Panama", currency: "PAB", rate: null, published: true, noSingleRate: true, note: "Not Published — region, occupation and business size" },
  { lang: "Spanish", cc: "CU", name: "Cuba", currency: "CUP", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Spanish", cc: "DO", name: "Dominican Republic", currency: "DOP", rate: null, published: true, noSingleRate: true, note: "Not Published — employer size and sector" },
  { lang: "Spanish", cc: "VE", name: "Venezuela", currency: "VES", rate: null, published: true, noSingleRate: false, note: "Not Published — currency value highly unstable" },
  { lang: "Spanish", cc: "EC", name: "Ecuador", currency: "USD", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Spanish", cc: "PE", name: "Peru", currency: "PEN", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Spanish", cc: "BO", name: "Bolivia", currency: "BOB", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Spanish", cc: "PY", name: "Paraguay", currency: "PYG", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Spanish", cc: "AR", name: "Argentina", currency: "ARS", rate: null, published: true, noSingleRate: false, note: "Not Published — frequently adjusted" },
  { lang: "Spanish", cc: "UY", name: "Uruguay", currency: "UYU", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Spanish", cc: "GQ", name: "Equatorial Guinea", currency: "XAF", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "German", cc: "AT", name: "Austria", currency: "EUR", rate: null, published: false, noSingleRate: true, note: "Not Published — collective agreements" },
  { lang: "German", cc: "CH", name: "Switzerland", currency: "CHF", rate: null, published: true, noSingleRate: true, note: "Not Published — cantonal rates only" },
  { lang: "German", cc: "LI", name: "Liechtenstein", currency: "CHF", rate: null, published: false, noSingleRate: true, note: "Not Published — collective and sectoral" },
  { lang: "Italian", cc: "IT", name: "Italy", currency: "EUR", rate: null, published: false, noSingleRate: true, note: "Not Published — collective agreements" },
  { lang: "Italian", cc: "CH", name: "Switzerland", currency: "CHF", rate: null, published: true, noSingleRate: true, note: "Not Published — cantonal rates only" },
  { lang: "Italian", cc: "SM", name: "San Marino", currency: "EUR", rate: null, published: true, noSingleRate: true, note: "Not Published — sectoral and collective" },
  { lang: "Italian", cc: "VA", name: "Vatican City", currency: "EUR", rate: null, published: false, noSingleRate: true, note: "Not Published" },
  { lang: "Portuguese", cc: "PT", name: "Portugal", currency: "EUR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Portuguese", cc: "AO", name: "Angola", currency: "AOA", rate: null, published: true, noSingleRate: true, note: "Not Published — category-specific" },
  { lang: "Portuguese", cc: "MZ", name: "Mozambique", currency: "MZN", rate: null, published: true, noSingleRate: true, note: "Not Published — sector-specific" },
  { lang: "Portuguese", cc: "CV", name: "Cape Verde", currency: "CVE", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Portuguese", cc: "TL", name: "Timor-Leste", currency: "USD", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Dutch", cc: "NL", name: "Netherlands", currency: "EUR", rate: null, published: true, noSingleRate: false, note: "Not Published — age-based hourly rate" },
  { lang: "Dutch", cc: "BE", name: "Belgium", currency: "EUR", rate: null, published: true, noSingleRate: true, note: "Not Published — interprofessional and sectoral" },
  { lang: "Dutch", cc: "SR", name: "Suriname", currency: "SRD", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Russian", cc: "BY", name: "Belarus", currency: "BYN", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Russian", cc: "KZ", name: "Kazakhstan", currency: "KZT", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Russian", cc: "KG", name: "Kyrgyzstan", currency: "KGS", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Chinese", cc: "TW", name: "Taiwan", currency: "TWD", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Chinese", cc: "SG", name: "Singapore", currency: "SGD", rate: null, published: true, noSingleRate: true, note: "Not Published — occupational wage models" },
  { lang: "Korean", cc: "KP", name: "North Korea", currency: "KPW", rate: null, published: false, noSingleRate: true, note: "Not Published — no transparent comparable rate" },
  { lang: "Arabic", cc: "SA", name: "Saudi Arabia", currency: "SAR", rate: null, published: true, noSingleRate: true, note: "Not Published — category and citizenship-specific" },
  { lang: "Arabic", cc: "IQ", name: "Iraq", currency: "IQD", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Arabic", cc: "DZ", name: "Algeria", currency: "DZD", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Arabic", cc: "SD", name: "Sudan", currency: "SDG", rate: null, published: true, noSingleRate: false, note: "Not Published — currency-date control required" },
  { lang: "Arabic", cc: "AE", name: "United Arab Emirates", currency: "AED", rate: null, published: false, noSingleRate: true, note: "Not Published — no universal national rate" },
  { lang: "Arabic", cc: "JO", name: "Jordan", currency: "JOD", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Arabic", cc: "LB", name: "Lebanon", currency: "LBP", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Arabic", cc: "SY", name: "Syria", currency: "SYP", rate: null, published: true, noSingleRate: false, note: "Not Published — currency-date control required" },
  { lang: "Arabic", cc: "YE", name: "Yemen", currency: "YER", rate: null, published: false, noSingleRate: true, note: "Not Published — no reliable comparable rate" },
  { lang: "Arabic", cc: "OM", name: "Oman", currency: "OMR", rate: null, published: true, noSingleRate: true, note: "Not Published — citizen-specific" },
  { lang: "Arabic", cc: "QA", name: "Qatar", currency: "QAR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Arabic", cc: "BH", name: "Bahrain", currency: "BHD", rate: null, published: true, noSingleRate: true, note: "Not Published — category and citizenship-specific" },
  { lang: "Arabic", cc: "KW", name: "Kuwait", currency: "KWD", rate: null, published: true, noSingleRate: true, note: "Not Published — worker-category-specific" },
  { lang: "Hindi", cc: "IN", name: "India", currency: "INR", rate: null, published: true, noSingleRate: true, note: "Not Published — state, occupation and skill" },
  { lang: "Bengali", cc: "BD", name: "Bangladesh", currency: "BDT", rate: null, published: true, noSingleRate: true, note: "Not Published — sector wage-board rates" },
  { lang: "Bengali", cc: "IN", name: "India — West Bengal", currency: "INR", rate: null, published: true, noSingleRate: true, note: "Not Published — state and occupation-specific" },
  { lang: "Punjabi", cc: "IN", name: "India — Punjab", currency: "INR", rate: null, published: true, noSingleRate: true, note: "Not Published — state and occupation-specific" },
  { lang: "Malay", cc: "BN", name: "Brunei", currency: "BND", rate: null, published: true, noSingleRate: true, note: "Not Published — selected industries" },
  { lang: "Malay", cc: "SG", name: "Singapore", currency: "SGD", rate: null, published: true, noSingleRate: true, note: "Not Published — occupational wage floors" },
  { lang: "Turkish", cc: "CY", name: "Cyprus", currency: "EUR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Ukrainian", cc: "UA", name: "Ukraine", currency: "UAH", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Romanian", cc: "RO", name: "Romania", currency: "RON", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Romanian", cc: "MD", name: "Moldova", currency: "MDL", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Greek", cc: "GR", name: "Greece", currency: "EUR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Greek", cc: "CY", name: "Cyprus", currency: "EUR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Czech", cc: "CZ", name: "Czechia", currency: "CZK", rate: null, published: true, noSingleRate: false, note: "Not Published" },
  { lang: "Swedish", cc: "SE", name: "Sweden", currency: "SEK", rate: null, published: false, noSingleRate: true, note: "Not Published — collective agreements" },
  { lang: "Swedish", cc: "FI", name: "Finland", currency: "EUR", rate: null, published: false, noSingleRate: true, note: "Not Published — collective agreements" },
  { lang: "Danish", cc: "DK", name: "Denmark", currency: "DKK", rate: null, published: false, noSingleRate: true, note: "Not Published — collective agreements" },
  { lang: "Finnish", cc: "FI", name: "Finland", currency: "EUR", rate: null, published: false, noSingleRate: true, note: "Not Published — collective agreements" },
  { lang: "Norwegian", cc: "NO", name: "Norway", currency: "NOK", rate: null, published: true, noSingleRate: true, note: "Not Published — designated industries only" },
  { lang: "Swahili", cc: "TZ", name: "Tanzania", currency: "TZS", rate: null, published: true, noSingleRate: true, note: "Not Published — sector-specific" },
  { lang: "Swahili", cc: "KE", name: "Kenya", currency: "KES", rate: null, published: true, noSingleRate: true, note: "Not Published — occupation and locality-specific" },
  { lang: "Swahili", cc: "UG", name: "Uganda", currency: "UGX", rate: null, published: false, noSingleRate: true, note: "Not Published — no current broadly applicable rate" },
  { lang: "Swahili", cc: "CD", name: "Democratic Republic of the Congo", currency: "CDF", rate: null, published: true, noSingleRate: true, note: "Not Published — occupational categories" },
  { lang: "Swahili", cc: "RW", name: "Rwanda", currency: "RWF", rate: null, published: false, noSingleRate: true, note: "Not Published — no reliable current general benchmark" },
  { lang: "Nepali", cc: "NP", name: "Nepal", currency: "NPR", rate: null, published: true, noSingleRate: false, note: "Not Published" },
]

/** (language, country) is the key — the same country appears under several languages as distinct jurisdictions. */
export const regionId = (r: Pick<RegionRate, "lang" | "cc">): string => `${r.lang}:${r.cc}`;
export const findRegion = (id: string): RegionRate | undefined => REGION_RATES.find((r) => regionId(r) === id);

/**
 * unit.settle's settlement ladder, derived from each row's own two flags. Counting the table this way reproduces the
 * paper's published partition exactly — 29 / 37 / 35 / 13 — which is how the transcription was verified.
 */
export type SettleTier = "published" | "pending" | "no_single_rate" | "no_official_rate";
export function tierOf(r: RegionRate): SettleTier {
  if (r.rate !== null) return "published";
  if (!r.published) return "no_official_rate";
  return r.noSingleRate ? "no_single_rate" : "pending";
}

/** What to tell a person whose region cannot settle yet — never a figure, never zero, always what is missing. */
export const TIER_REASON: Record<SettleTier, string> = {
  published: "",
  pending: "A national rate exists but is not yet loaded here. Recoverable by data entry, not by policy.",
  no_single_rate: "Rates here are sectoral, regional or collectively bargained. A published selection rule is required.",
  no_official_rate: "No statutory minimum exists at any level. Settles under the Global Agreed Standard.",
};

/**
 * Settlement — `$ = 웃 × the region's hourly minimum wage`, in that region's own currency.
 * Returns null when the region publishes no rate: no contributor settles at zero, and no figure is guessed.
 */
export function settleInRegion(yug: number, r: RegionRate | undefined): number | null {
  if (!r || r.rate === null || !(yug > 0)) return null;
  return yug * r.rate;
}

/**
 * Format an amount in its own currency. Falls back to "<code> <amount>" where a runtime has no data for the code —
 * printing the code is honest; substituting a symbol from another currency would not be.
 */
export function formatLocal(amount: number, currency: string, locale = "en"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
  }
}

/** The pod's default region — the paper's own worked example throughout is the Texas vintage (unit.ceiling). */
export const DEFAULT_REGION_ID = "English:US";
