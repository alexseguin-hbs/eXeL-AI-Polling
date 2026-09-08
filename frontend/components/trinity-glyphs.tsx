"use client";

/**
 * ◬ ♡ 웃 — the header row, one place. Bold; cyan · sunset · violet by glyph (operator, 2026-09-07);
 * ◬ drawn a little larger so the three sit at one visual height. Everything else on the page keeps
 * the theme's single hue — only these three carry their own colours.
 */
import { TRINITY_COLORS } from "@/lib/trinity-palette";

/** The ONE place the row is drawn (operator 2026-09-08: "find all ◬ ♡ 웃 … same colours, same ratio"): block by default,
 *  `inline` for a menu item, a card title, a footer line — same three colours, same measured size ratio, at any size. */
export function TrinityGlyphs({ size = "text-3xl", className = "", inline = false }: { size?: string; className?: string; inline?: boolean }) {
  const Tag = inline ? "span" : "div";
  return (
    <Tag className={`${size} font-mono font-bold ${inline ? "inline-flex items-baseline gap-[0.3em] align-baseline" : "tracking-[0.3em]"} ${className}`} aria-hidden="true" style={{ lineHeight: 1 }}>
      {/* sizes from a measured ink-height check (operator 2026-09-08): the three glyphs' INK is the same height, centred on one middle */}
      <span data-glyph="ai" style={{ color: TRINITY_COLORS.consciousness, fontSize: "1.36em", verticalAlign: "-0.06em" }}>&#9708;</span>{" "}
      <span data-glyph="si" style={{ color: TRINITY_COLORS.temporal, fontSize: "1.23em", WebkitTextStroke: "0.05em currentColor", verticalAlign: "-0.14em" }}>&#9825;</span>{" "}
      <span data-glyph="hi" style={{ color: TRINITY_COLORS.family, fontSize: "0.87em" }}>&#50883;</span>
    </Tag>
  );
}
