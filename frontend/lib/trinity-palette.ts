// Single source of truth for the SoI Trinity spectrum palette.
// Infrared → ROYGBIV → Ultraviolet → White, even hue steps, Settings-anchored.
// Referenced by BOTH the home page (/main) and the Divinity Guide so the two
// can never drift apart (R-CORE: stable shared contract, reuse not restate).
export const TRINITY_COLORS = {
  human: "#8B0000",         // Infrared (deep red, below visible red)
  evolution: "#FF0000",     // Red
  intelligence: "#F97316",  // Orange
  temporal: "#FFFF00",      // Sunset / Yellow
  abundance: "#80FF00",     // Chartreuse
  ooda: "#00FF00",          // Green
  platonic: "#10B981",      // Emerald
  consciousness: "#00FFFF", // Cyan (default start)
  framework: "#3B82F6",     // Ocean Blue (Intelligence Framework)
  wholeness: "#0000FF",     // Blue
  family: "#8B00FF",        // Violet
  governance: "#6A00D4",    // Ultraviolet (edge of visible violet)
  blank: "#FFFFFF",         // White (Trinity Framework, no text)
} as const;
