/**
 * Divinity Guide — Shared Language Configuration
 *
 * Single source of truth for all supported Divinity Guide languages.
 * Used by: page.tsx, bilingual-reader.tsx, upload script, validator.
 *
 * To add a new language:
 *   1. Create frontend/lib/divinity-pages-{code}.json (186 entries, matching IDs)
 *   2. Add entry to DIVINITY_LANGUAGES below
 *   3. Add loader in page.tsx LANG_LOADERS
 *   4. Add entry in page.tsx DIVINITY_TRANSLATIONS
 *   5. Add entry in page.tsx SECTIONS_MAP (or falls back to EN)
 *   6. Run: node frontend/scripts/validate-divinity-translations.js
 */

export const DIVINITY_LANGUAGES = [
  { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "es", label: "Espa\u00F1ol", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "uk", label: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "zh", label: "\u4E2D\u6587", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "fa", label: "\u0641\u0627\u0631\u0633\u06CC", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "he", label: "\u05E2\u05D1\u05E8\u05D9\u05EA", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "pt", label: "Portugu\u00EAs", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "km", label: "\u1781\u17D2\u1798\u17C2\u179A", flag: "\u{1F1F0}\u{1F1ED}" },
  { code: "ne", label: "\u0928\u0947\u092A\u093E\u0932\u0940", flag: "\u{1F1F3}\u{1F1F5}" },
] as const;

export type DivinityLang = typeof DIVINITY_LANGUAGES[number]["code"];

/** Language codes array for iteration */
export const DIVINITY_LANG_CODES = DIVINITY_LANGUAGES.map(l => l.code);
