/**
 * ALVAR TRINITY LOGOS — the 13 pre-rendered high-resolution rasters (Vision 2525)
 * ===============================================================================
 * The operator-supplied Alvar art (ouroboros + Yggdrasil + ALVAR runes) pre-tinted into each of the 13 SoI-Trinity
 * colors at 1024px, as standalone transparent PNGs for modular reuse throughout the apps (use any as an <img>).
 *   • ALVAR_LOGOS[i].src → /architect/alvar-<id>.png   (colored art on transparent)
 *   • ALVAR_MASK          → /architect/alvar.png        (white silhouette — CSS-mask/tint to ANY color live)
 *   • ALVAR_SOURCE        → /architect/alvar.jpg        (the original raster)
 * Default/primary color is AI CYAN, matching the Design tab + Mission-Planning accent.
 */
import { TRINITY_13 } from "./trinity-colors";

export interface AlvarLogo { id: string; name: string; hex: string; src: string; trinity?: "AI" | "SI" | "HI"; glyph?: string; }

export const ALVAR_LOGOS: AlvarLogo[] = TRINITY_13.map((c) => ({ ...c, src: `/architect/alvar-${c.id}.png` }));
export const ALVAR_MASK = "/architect/alvar.png";
export const ALVAR_SOURCE = "/architect/alvar.jpg";

export const alvarLogo = (i: number): AlvarLogo => ALVAR_LOGOS[((i % 13) + 13) % 13];
/** Index of the primary (AI cyan) logo — the Design-tab default. */
export const ALVAR_PRIMARY = 0;
