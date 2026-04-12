import type { LexiconLanguage } from "@/lib/lexicon-data";

/**
 * Pinned languages — always appear at top of every language dropdown,
 * separated from the alphabetized list below.
 * Order here = display order.
 */
export const PINNED_LANGUAGE_CODES = ["en", "es", "fr"] as const;

/**
 * Sort approved languages: pinned first (in PINNED order), then
 * remaining alphabetized by English name. Returns the sorted array
 * and the count of pinned entries (for separator placement).
 */
export function getSortedLanguages(languages: LexiconLanguage[]): {
  sorted: LexiconLanguage[];
  pinnedCount: number;
} {
  const approved = languages.filter((l) => l.status === "approved");
  const pinned = PINNED_LANGUAGE_CODES
    .map((c) => approved.find((l) => l.code === c))
    .filter(Boolean) as LexiconLanguage[];
  const pinnedSet = new Set(PINNED_LANGUAGE_CODES as readonly string[]);
  const rest = approved
    .filter((l) => !pinnedSet.has(l.code))
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  return { sorted: [...pinned, ...rest], pinnedCount: pinned.length };
}
