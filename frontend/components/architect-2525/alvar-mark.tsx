"use client";

/**
 * ALVAR MARK — Vision-Tree iconology (Vision 2525)
 * ================================================
 * The Alvar symbol (operator-supplied art, updated 2026-07-19): an OUROBOROS DRAGON (fire-maned head biting its
 * tail) encircling the YGGDRASIL Tree of Life — whose two crowns frame the TEXAS outline and the LONE STAR —
 * ringed by ALVAR runes (Ansuz·Laguz·Wunjo·Ansuz·Raidho). "Alvar" = Old Norse "elf-warrior / guardian":
 * protection · strength · persistence · rooted-in-place. Placed BEFORE the Vision Tree.
 *
 * Rendered as the REAL raster (public/architect/alvar.png — a transparent silhouette derived from the source
 * art) recolored via CSS mask, so ONE asset yields all 13 SoI-Trinity color versions (lib/trinity-colors.ts) for
 * modular use throughout the apps. The raw source is kept at public/architect/alvar.jpg.
 */
import { TRINITY_13, trinityHex } from "@/lib/trinity-colors";

const MASK = "/architect/alvar.png";

export function AlvarMark({ color = "#19c8cf", size = 40, title = "Alvar — guardian of the Vision Tree" }:
  { color?: string; size?: number; title?: string }) {
  return (
    <span data-alvar-mark role="img" aria-label={title} title={title}
      style={{
        display: "inline-block", width: size, height: size, backgroundColor: color, flexShrink: 0,
        WebkitMaskImage: `url(${MASK})`, maskImage: `url(${MASK})`,
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
        WebkitMaskSize: "contain", maskSize: "contain",
      }} />
  );
}

/** Preview strip of all 13 Trinity variants — docs / modular picker. */
export function AlvarPalette({ size = 34 }: { size?: number }) {
  return (
    <div data-alvar-palette className="flex flex-wrap gap-1">
      {TRINITY_13.map((c, i) => <AlvarMark key={c.id} color={trinityHex(i)} size={size} title={`Alvar · ${c.name}`} />)}
    </div>
  );
}
