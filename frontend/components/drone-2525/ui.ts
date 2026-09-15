// ONE HUD FONT, ONE BUTTON, ONE COLOUR HELPER — for every Drone-2525 panel.
//
// Before this file there were five definitions of "the HUD font" and four of "the button" on one screen,
// differing by a character of padding each. That is not a style question: a surface whose panels disagree
// about their own type scale is a surface nobody can change safely, because a fix has to be applied four
// times and will be applied three.
//
// The vector law still governs what is DRAWN (lib/wire-core/vector-law.ts). This governs the chrome around
// it — the panels below the arena, which are ordinary content and were never under that law.
import { semanticHex } from "@/lib/wire-core/palette";

/** The HUD face. Scales with the viewport so a phone gets readable text without a second definition. */
export const MONO = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "clamp(9px, 2.3vw, 11px)",
  letterSpacing: "0.05em",
} as const;

export const HUD = semanticHex("hud");

export interface BtnOpts { on?: boolean; hex?: string; enabled?: boolean; wide?: boolean }

/**
 * One button. `on` is the selected state, `enabled` false greys it without hiding it, and the touch target
 * never drops below 34px because a control a thumb cannot hit is not a control.
 */
export function btn({ on = false, hex = HUD, enabled = true, wide = false }: BtnOpts = {}): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${on ? hex : "#2a2a2a"}`,
    color: enabled ? (on ? hex : "#8a8a8a") : "#4a4a4a",
    padding: wide ? "7px clamp(9px, 2.4vw, 14px)" : "6px clamp(9px, 2.4vw, 13px)",
    ...MONO,
    textTransform: "uppercase",
    cursor: enabled ? "pointer" : "not-allowed",
    borderRadius: 2,
    minHeight: 34,
  };
}

/** A panel heading: the one place a colour other than the HUD grey belongs in the chrome. */
export const heading = (hex: string): React.CSSProperties => ({ ...MONO, color: hex, marginBottom: 6 });

/** Body text in a panel — wrapped at a readable measure rather than running the full width. */
export const prose: React.CSSProperties = { ...MONO, color: HUD, opacity: 0.65, lineHeight: 1.7, maxWidth: "62ch", margin: "0 0 8px" };

/** A quiet line: present, readable, not competing with anything. */
export const quiet = (opacity = 0.55): React.CSSProperties => ({ ...MONO, color: HUD, opacity });
