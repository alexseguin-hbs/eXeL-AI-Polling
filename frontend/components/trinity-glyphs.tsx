"use client";

/**
 * ◬ ♡ 웃 — the header row, one place. Bold; cyan · sunset · violet by glyph (operator, 2026-09-07);
 * ◬ drawn a little larger so the three sit at one visual height. Everything else on the page keeps
 * the theme's single hue — only these three carry their own colours.
 */
import { TRINITY_COLORS } from "@/lib/trinity-palette";

export function TrinityGlyphs({ size = "text-3xl", className = "" }: { size?: string; className?: string }) {
  return (
    <div className={`${size} font-mono font-bold tracking-[0.3em] ${className}`} aria-hidden="true" style={{ lineHeight: 1 }}>
      <span style={{ color: TRINITY_COLORS.consciousness, fontSize: "1.22em", verticalAlign: "-0.06em" }}>&#9708;</span>{" "}
      <span style={{ color: TRINITY_COLORS.temporal }}>&#9825;</span>{" "}
      <span style={{ color: TRINITY_COLORS.family }}>&#50883;</span>
    </div>
  );
}
