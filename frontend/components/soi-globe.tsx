"use client";

/**
 * The globe language switch on every Session page — the same dropdown as the navbar on the home page and Vision
 * 2525 (operator 2026-09-08: "use globe drop down, must be in same format as settings and vision 2525").
 * R-CORE: LanguageGlobe is the one component; this only names it for the Session pages and the live runs.
 */
import { LanguageGlobe } from "@/components/language-globe";

export function SoiGlobe({ className = "" }: { className?: string }) {
  return <LanguageGlobe className={className} testId="soi-globe" />;
}
