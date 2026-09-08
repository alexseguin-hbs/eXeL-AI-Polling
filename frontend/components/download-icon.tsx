"use client";

/**
 * The download control is an ICON, never the word (operator 2026-09-08, after Vision 2525 r145/r189: "the icon is
 * sufficient"): the same drawn arrow-to-line glyph the Vision 2525 living document uses (inline SVG, stroke 2), in a
 * 44-px round button in the theme hue, with the translatable name in aria-label and title.
 */
import { useThemeHue } from "@/lib/theme-hue";

export function DownloadGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
  );
}

export function IconDownload({ label, onClick, testId, className = "" }: { label: string; onClick: () => void; testId?: string; className?: string }) {
  const hue = useThemeHue();
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} data-testid={testId}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-accent ${className}`} style={{ borderColor: hue.dim, color: hue.bright }}>
      <DownloadGlyph />
    </button>
  );
}
