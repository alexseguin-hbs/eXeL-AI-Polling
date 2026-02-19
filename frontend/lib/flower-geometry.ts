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

/** 6 circles: 60deg apart, hexagon pattern starting from top */
export function getTheme2_6Positions(): CirclePosition[] {
  const distance = 130;
  const radius = 85;
  const startAngle = -90;
  return Array.from({ length: 6 }, (_, i) => {
    const deg = startAngle + i * 60;
    const rad = (deg * Math.PI) / 180;
    return {
      cx: CENTER_X + distance * Math.cos(rad),
      cy: CENTER_Y + distance * Math.sin(rad),
      r: radius,
    };
  });
}

/** 9 circles: inner 6 at 60deg (130px) + outer 3 at 120deg (225px) */
export function getTheme2_9Positions(): CirclePosition[] {
  const innerDistance = 130;
  const innerRadius = 80;
  const outerDistance = 225;
  const outerRadius = 75;
  const startAngle = -90;

  const inner = Array.from({ length: 6 }, (_, i) => {
    const deg = startAngle + i * 60;
    const rad = (deg * Math.PI) / 180;
    return {
      cx: CENTER_X + innerDistance * Math.cos(rad),
      cy: CENTER_Y + innerDistance * Math.sin(rad),
      r: innerRadius,
    };
  });

  const outer = Array.from({ length: 3 }, (_, i) => {
    const deg = startAngle + 30 + i * 120; // offset by 30deg between inner pairs
    const rad = (deg * Math.PI) / 180;
    return {
      cx: CENTER_X + outerDistance * Math.cos(rad),
      cy: CENTER_Y + outerDistance * Math.sin(rad),
      r: outerRadius,
    };
  });

  return [...inner, ...outer];
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
