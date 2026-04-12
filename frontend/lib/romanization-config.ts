/**
 * Modular romanization configuration — config-driven, extensible.
 *
 * To add a new language's romanization:
 * 1. Add an entry here with code, system name, button label
 * 2. Create a data file (e.g., romanization-ja-data.ts) with key→romanization map
 * 3. Import and register in ROMANIZATION_DATA below
 *
 * The navbar and context automatically pick up new languages — zero code changes needed.
 *
 * Future Supabase table: romanization_systems (code, system, button_label, native_label, enabled)
 */

export interface RomanizationLanguage {
  /** ISO 639-1 code */
  code: string;
  /** Romanization system name (for reference) */
  system: string;
  /** Short label shown on toggle button (in native script) */
  buttonLabel: string;
  /** Full native description */
  nativeLabel: string;
}

/**
 * Languages that support romanization toggle.
 * Checked via: `activeLocale in ROMANIZATION_LANGUAGES`
 */
export const ROMANIZATION_LANGUAGES: Record<string, RomanizationLanguage> = {
  zh: {
    code: "zh",
    system: "Pinyin",
    buttonLabel: "拼音",
    nativeLabel: "拼音注音",
  },
  km: {
    code: "km",
    system: "UNGEGN",
    buttonLabel: "រូមុខ",
    nativeLabel: "អក្សរឡាតាំង",
  },
  // ─── Future languages (add row + data file) ───────────────
  // ja: { code: "ja", system: "Rōmaji",               buttonLabel: "ローマ字",  nativeLabel: "ローマ字表記" },
  // ko: { code: "ko", system: "Revised Romanization",  buttonLabel: "로마자",    nativeLabel: "로마자 표기법" },
  // th: { code: "th", system: "RTGS",                   buttonLabel: "อักษรโรมัน", nativeLabel: "การถอดอักษรเป็นโรมัน" },
  // hi: { code: "hi", system: "IAST",                   buttonLabel: "रोमन",     nativeLabel: "रोमन लिप्यन्तरण" },
  // ar: { code: "ar", system: "ALA-LC",                 buttonLabel: "لاتيني",   nativeLabel: "الكتابة بالحروف اللاتينية" },
  // bn: { code: "bn", system: "IAST",                   buttonLabel: "রোমান",    nativeLabel: "রোমান প্রতিলিপি" },
};

/** Check if a locale supports romanization */
export function hasRomanization(locale: string): boolean {
  return locale in ROMANIZATION_LANGUAGES;
}

/** Get romanization config for a locale (or null) */
export function getRomanizationConfig(locale: string): RomanizationLanguage | null {
  return ROMANIZATION_LANGUAGES[locale] ?? null;
}
