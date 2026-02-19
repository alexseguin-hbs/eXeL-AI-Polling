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
 * 9 circles: pyramid with base of 4 along the bottom
 * Row 1 (top):    2 circles
 * Row 2 (middle): 3 circles
 * Row 3 (bottom): 4 circles (base)
 */
export function getTheme2_9Positions(): CirclePosition[] {
  const radius = 70;
  const colSpacing = 100; // horizontal gap between circle centers
  const rowSpacing = 95;  // vertical gap between rows
  const topY = CENTER_Y - rowSpacing;

  const positions: CirclePosition[] = [];

  // Row 1: 2 circles centered
  const row1Count = 2;
  const row1StartX = CENTER_X - ((row1Count - 1) * colSpacing) / 2;
  for (let i = 0; i < row1Count; i++) {
    positions.push({ cx: row1StartX + i * colSpacing, cy: topY, r: radius });
  }

  // Row 2: 3 circles centered
  const row2Count = 3;
  const row2StartX = CENTER_X - ((row2Count - 1) * colSpacing) / 2;
  for (let i = 0; i < row2Count; i++) {
    positions.push({ cx: row2StartX + i * colSpacing, cy: topY + rowSpacing, r: radius });
  }

  // Row 3: 4 circles centered (base)
  const row3Count = 4;
  const row3StartX = CENTER_X - ((row3Count - 1) * colSpacing) / 2;
  for (let i = 0; i < row3Count; i++) {
    positions.push({ cx: row3StartX + i * colSpacing, cy: topY + rowSpacing * 2, r: radius });
  }

  return positions;
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
