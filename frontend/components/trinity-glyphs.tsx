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
      {/* sizes from a measured ink-height check (operator 2026-09-08): the three glyphs' INK is the same height, centred on one middle */}
      <span data-glyph="ai" style={{ color: TRINITY_COLORS.consciousness, fontSize: "1.36em", verticalAlign: "-0.06em" }}>&#9708;</span>{" "}
      <span data-glyph="si" style={{ color: TRINITY_COLORS.temporal, fontSize: "1.23em", WebkitTextStroke: "0.05em currentColor", verticalAlign: "-0.14em" }}>&#9825;</span>{" "}
      <span data-glyph="hi" style={{ color: TRINITY_COLORS.family, fontSize: "0.87em" }}>&#50883;</span>
    </div>
  );
}
