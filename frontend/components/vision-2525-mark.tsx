"use client";

/**
 * Vision2525Mark — the Seed of Life mini-SVG placed immediately before the "Vision • 2525" wordmark, the way the mark
 * already sits beside the Seed coin/text (operator 2026-09-13: "use Seed symbol … before … Vision-2525 … the mini SVG
 * should be placed like it is already before the word Seed"). Reuses <SeedOfLifeLogo> — never a hand-authored SVG.
 *
 * It renders ONLY the symbol: an aria-hidden, inline, ~1em seed mark. The name text stays wherever it is (in the
 * lexicon, already translated in all 33 languages), so this works in every language with no per-language string change.
 * Because it is an SVG element and never part of a string, it contributes ZERO to any word count (the 333-word
 * synthesis, the 111-word comments) — the mark is not a word.
 */
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";

export function Vision2525Mark({ size = 14, accentColor = "currentColor", className = "" }: {
  size?: number; accentColor?: string; className?: string;
}) {
  return (
    <span aria-hidden="true" data-vision2525-mark className={`mr-1 inline-block align-[-0.15em] ${className}`}>
      <SeedOfLifeLogo size={size} accentColor={accentColor} />
    </span>
  );
}
