"use client";
import { TRINITY_COLORS } from "@/lib/trinity-palette";

// The canonical SoI Trinity spectrum (Infrared → ROYGBIV → Ultraviolet → White),
// single source of truth reused by /main. 13 stops.
export const SPECTRUM_13: readonly string[] = [
  TRINITY_COLORS.human, TRINITY_COLORS.evolution, TRINITY_COLORS.intelligence, TRINITY_COLORS.temporal,
  TRINITY_COLORS.abundance, TRINITY_COLORS.ooda, TRINITY_COLORS.platonic, TRINITY_COLORS.consciousness,
  TRINITY_COLORS.framework, TRINITY_COLORS.wholeness, TRINITY_COLORS.family, TRINITY_COLORS.governance,
  TRINITY_COLORS.blank,
];

/**
 * ONE reusable colour control — a horizontally-scrollable Trinity-spectrum swatch strip
 * (never full-screen) with a custom EDIT picker pinned as the farthest-right option.
 * Reused identically for Land contours, Bathymetry contours, and Trinity edits.
 */
export function SpectrumPicker({ value, onChange, ariaLabel = "colour" }: {
  value: string; onChange: (hex: string) => void; ariaLabel?: string;
}) {
  const sel = value.toLowerCase();
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5" role="group" aria-label={ariaLabel}>
      {SPECTRUM_13.map((c) => (
        <button key={c} type="button" title={c} onClick={() => onChange(c)}
          className="h-4 w-4 shrink-0 rounded-full border"
          style={{ background: c, borderColor: sel === c.toLowerCase() ? "#c8d6e5" : "transparent" }} />
      ))}
      {/* EDIT — custom colour, always the farthest-right option */}
      <label className="flex shrink-0 cursor-pointer items-center" title="Edit — custom colour">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-4 w-6 rounded border-0 bg-transparent p-0" aria-label={`${ariaLabel} custom`} />
      </label>
    </div>
  );
}
