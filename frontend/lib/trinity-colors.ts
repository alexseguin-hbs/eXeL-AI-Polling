/**
 * SoI TRINITY — 13-COLOR ICONOLOGY PALETTE (Vision 2525)
 * =====================================================
 * A cohesive 13-hue palette anchored by the three intelligences of the SoI Trinity:
 *   ◬ A.I. → cyan · ♡ S.I. → sunset-yellow · 웃 H.I. → violet
 * The remaining ten hues bridge those anchors into a full ring so a single line-art mark (the Alvar) can be
 * recolored into 13 modular versions used throughout the apps. Ordered as a smooth spectral loop (cyan → green →
 * yellow → orange → red → rose → violet → blue → back toward cyan) so adjacent indices harmonize.
 */
export interface TrinityColor { id: string; name: string; hex: string; trinity?: "AI" | "SI" | "HI"; glyph?: string; }

export const TRINITY_13: TrinityColor[] = [
  { id: "ai-cyan", name: "AI Cyan", hex: "#19c8cf", trinity: "AI", glyph: "◬" },
  { id: "teal", name: "Teal", hex: "#14b8a6" },
  { id: "green", name: "Green", hex: "#22c55e" },
  { id: "lime", name: "Lime", hex: "#84cc16" },
  { id: "si-sun", name: "SI Sunset", hex: "#ffb020", trinity: "SI", glyph: "♡" },
  { id: "gold", name: "Gold", hex: "#ffd400" },
  { id: "orange", name: "Orange", hex: "#fb923c" },
  { id: "coral", name: "Coral", hex: "#ef4444" },
  { id: "rose", name: "Rose", hex: "#f43f5e" },
  { id: "hi-violet", name: "HI Violet", hex: "#c084fc", trinity: "HI", glyph: "웃" },
  { id: "purple", name: "Purple", hex: "#a855f7" },
  { id: "indigo", name: "Indigo", hex: "#6366f1" },
  { id: "blue", name: "Blue", hex: "#3b82f6" },
];

export const trinityColor = (i: number): TrinityColor => TRINITY_13[((i % 13) + 13) % 13];
export const trinityHex = (i: number): string => trinityColor(i).hex;
