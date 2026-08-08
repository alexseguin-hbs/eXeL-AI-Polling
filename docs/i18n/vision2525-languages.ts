/**
 * Vision 2525 — language registry for the living-document translations (v19).
 *
 * ONE source of truth the switcher, the per-language build, and the validator all
 * read — mirroring the Divinity-Guide method (frontend/lib/divinity-languages.ts).
 * The 33-language set is REUSED from the app's SUPPORTED_LANGUAGES
 * (frontend/lib/constants.ts) — no parallel list is invented.
 *
 * English is the source of truth; every other language is a deterministic build
 * from docs/i18n/vision2525.en.json + docs/i18n/vision2525.<code>.json, with
 * missing keys falling back to English (flagged by the validator, never blank).
 * Sacred totals (Brief 3,333 · NOSE 9,999 · White Paper 66,666) are asserted on
 * ENGLISH ONLY — other languages differ in length by nature.
 */
export const VISION2525_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "fr", name: "French", native: "Français" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", native: "Filipino" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
] as const;

export type Vision2525Lang = typeof VISION2525_LANGUAGES[number]["code"];
export const VISION2525_LANG_CODES = VISION2525_LANGUAGES.map((l) => l.code);
/** Right-to-left languages need dir="rtl" on the per-language build. */
export const VISION2525_RTL = new Set(["ar", "he"]);
