"use client";

// Experiences language dropdown = the app's ONE globe dropdown (operator 2026-09-15: "experiences language
// dropdown needs to match master"). This file used to fork the list with its own pinned set (EN + FR) and
// no code column; it now delegates to components/language-globe.tsx — same order (EN · ES · FR pinned, then
// the approved languages alphabetized via lib/language-utils), same "EN • English (English)" rows.
import { LanguageGlobe } from "@/components/language-globe";

export function LangSelect() {
  return <LanguageGlobe testId="experiences-lang-select" />;
}
