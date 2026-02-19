/**
 * Flower of Life — Circle position math for Theme1 triangle + Theme2 3/6/9 layouts.
 * All coordinates are in SVG viewBox(0 0 600 500) space.
 */

export interface CirclePosition {
  cx: number;
  cy: number;
  r: number;
}

const CENTER_X = 300;
const CENTER_Y = 250;

// ── Theme1 Triangle Layout (3 circles) ───────────────────────────

const THEME1_RADIUS = 120;
const THEME1_OFFSET = 100;

/** Risk top (270deg), Neutral bottom-left (150deg), Supporting bottom-right (30deg) */
export function getTheme1Positions(): CirclePosition[] {
  const angles = [270, 150, 30]; // degrees: top, bottom-left, bottom-right
  return angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      cx: CENTER_X + THEME1_OFFSET * Math.cos(rad),
      cy: CENTER_Y + THEME1_OFFSET * Math.sin(rad),
      r: THEME1_RADIUS,
    };
  });
}

/** Index into Theme1 positions: 0=Risk, 1=Neutral, 2=Supporting */
export const THEME1_INDEX = {
  "Risk & Concerns": 0,
  "Neutral Comments": 1,
  "Supporting Comments": 2,
} as const;

// ── Theme2 Bloom Layouts (from center hub) ───────────────────────

const HUB_RADIUS = 50;

export function getHubPosition(): CirclePosition {
  return { cx: CENTER_X, cy: CENTER_Y, r: HUB_RADIUS };
}

/** 3 circles: 120deg apart, trefoil pattern starting from top */
export function getTheme2_3Positions(): CirclePosition[] {
  const distance = 130;
  const radius = 100;
  const startAngle = -90; // top
  return Array.from({ length: 3 }, (_, i) => {
    const deg = startAngle + i * 120;
    const rad = (deg * Math.PI) / 180;
    return {
      cx: CENTER_X + distance * Math.cos(rad),
      cy: CENTER_Y + distance * Math.sin(rad),
      r: radius,
    };
  });
}

/**
 * 6 circles: flat-top hexagon
 * Positions: Top-Left, Top-Right, Left, Right, Bottom-Left, Bottom-Right
 */
export function getTheme2_6Positions(): CirclePosition[] {
  const radius = 85;
  const dx = 110; // horizontal offset from center
  const dy = 95;  // vertical offset from center

  // TL, TR, L, R, BL, BR
  return [
    { cx: CENTER_X - dx / 2, cy: CENTER_Y - dy, r: radius },     // Top-Left
    { cx: CENTER_X + dx / 2, cy: CENTER_Y - dy, r: radius },     // Top-Right
    { cx: CENTER_X - dx,     cy: CENTER_Y,      r: radius },     // Left
    { cx: CENTER_X + dx,     cy: CENTER_Y,      r: radius },     // Right
    { cx: CENTER_X - dx / 2, cy: CENTER_Y + dy, r: radius },     // Bottom-Left
    { cx: CENTER_X + dx / 2, cy: CENTER_Y + dy, r: radius },     // Bottom-Right
  ];
}

/**
 * 9 circles: triangle outline with 4 per side, hub at center.
 * Corners shared between edges → 9 unique positions.
 *
 *            O                 (apex)
 *           / \
 *          O   O               (left 1/3, right 1/3)
 *         /     \
 *        O  hub  O             (left 2/3, right 2/3)
 *       /         \
 *      O   O   O   O          (base — 4 circles)
 */
export function getTheme2_9Positions(): CirclePosition[] {
  const r = 55;

  // Triangle vertices (equilateral, centered around hub)
  const T  = { x: CENTER_X, y: 75 };           // apex
  const BL = { x: 105, y: 405 };               // bottom-left
  const BR = { x: 495, y: 405 };               // bottom-right

  // Linear interpolation helper
  const lerp = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    t: number
  ) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

  // 9 positions clockwise from apex (corners shared between edges)
  const pts = [
    lerp(T, T, 0),       // 0: apex
    lerp(T, BR, 1 / 3),  // 1: right side 1/3
    lerp(T, BR, 2 / 3),  // 2: right side 2/3
    lerp(BR, BR, 0),     // 3: bottom-right corner
    lerp(BL, BR, 2 / 3), // 4: bottom 2/3
    lerp(BL, BR, 1 / 3), // 5: bottom 1/3
    lerp(BL, BL, 0),     // 6: bottom-left corner
    lerp(T, BL, 2 / 3),  // 7: left side 2/3
    lerp(T, BL, 1 / 3),  // 8: left side 1/3
  ];

  return pts.map((p) => ({ cx: p.x, cy: p.y, r }));
}

/** Get positions for a given theme2 level */
export function getTheme2Positions(level: 3 | 6 | 9): CirclePosition[] {
  switch (level) {
    case 3:
      return getTheme2_3Positions();
    case 6:
      return getTheme2_6Positions();
    case 9:
      return getTheme2_9Positions();
  }
}
