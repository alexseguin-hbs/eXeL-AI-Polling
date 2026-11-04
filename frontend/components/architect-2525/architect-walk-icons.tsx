"use client";
/**
 * ARCHITECT-2525 · WALKTHROUGH ICONOLOGY (operator 2026-11-04: "don't use emojies; create your own walkthrough raster
 * iconology"). Purpose-built, drawn-by-hand SVG glyphs for the walkthrough controls — NOT emoji. One stroke weight, one
 * 24-unit box, `currentColor` so each glyph takes the control's theme colour. Kept in one place so the walkthrough,
 * the Edit⇄Walk toggle and the room HUD share the same drawn set.
 */
import type { CSSProperties } from "react";

type IconProps = { size?: number; color?: string; title?: string; style?: CSSProperties };
const box = (size: number, title?: string) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  role: title ? "img" : "presentation", "aria-label": title, "aria-hidden": title ? undefined : true,
});

/** WALK — a walking figure mid-stride (head, torso, two legs, one arm). The walkthrough mode mark. */
export function WalkGlyph({ size = 16, color = "currentColor", title, style }: IconProps) {
  return (
    <svg {...box(size, title)} style={{ color, ...style }}>
      <circle cx="13" cy="4" r="2" />
      <path d="M13 6.5 L12 13" />
      <path d="M12 13 L9 20 M12 13 L16 19" />
      <path d="M12.5 9 L16 8 M12.5 9 L9 11.5" />
    </svg>
  );
}

/** LOOK — an eye; drag-to-look-around affordance. */
export function LookGlyph({ size = 16, color = "currentColor", title, style }: IconProps) {
  return (
    <svg {...box(size, title)} style={{ color, ...style }}>
      <path d="M2 12 C5 6 19 6 22 12 C19 18 5 18 2 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** MOVE/TURN chevron — one glyph, rotated by `dir`. up = forward, down = back, left/right = turn. */
export function MoveChevron({ size = 16, color = "currentColor", dir = "up", title, style }: IconProps & { dir?: "up" | "down" | "left" | "right" }) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg {...box(size, title)} style={{ color, transform: `rotate(${rot}deg)`, ...style }}>
      <path d="M6 15 L12 9 L18 15" />
      <path d="M12 9 L12 20" opacity="0.55" />
    </svg>
  );
}

/** EDIT — a pencil; the plan-edit mode mark. */
export function EditGlyph({ size = 16, color = "currentColor", title, style }: IconProps) {
  return (
    <svg {...box(size, title)} style={{ color, ...style }}>
      <path d="M4 20 L4 16 L16 4 L20 8 L8 20 Z" />
      <path d="M14 6 L18 10" />
    </svg>
  );
}

/** DOOR — an opening to an adjacent room; marks a doorway in the walkthrough. */
export function DoorGlyph({ size = 16, color = "currentColor", title, style }: IconProps) {
  return (
    <svg {...box(size, title)} style={{ color, ...style }}>
      <path d="M6 3 L6 21 L15 21 L15 3 Z" />
      <path d="M15 3 L18 5 L18 21 L15 21" opacity="0.6" />
      <circle cx="12.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
