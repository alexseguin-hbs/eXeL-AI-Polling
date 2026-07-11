"use client";

/**
 * SECURITY-2525 · Mission Planning (PLANNING tab)
 * ===============================================
 * Equipment inventory → drag-and-drop (or tap-select + tap-place) onto the AO
 * map. Every placement snaps to an MGRS coordinate (WGS84 → UTM → MGRS, see
 * ./mgrs.ts). Demo AOs: Camp Mabry + Texas State Capitol (Austin TX, zone 14R),
 * Washington DC (national capital), and JBLM Lewis-McChord (WA, zone 10T).
 *
 * DUAL-PANE LAYOUT (R-CORE Consolidation 2):
 *   • MAP + MINI MAP live in TWO separate windows (not a floating PiP).
 *   • Responsive: portrait → stacked top/bottom; landscape → side-by-side.
 *     (matches the Divinity Guide reader + Atlantis Accords HTML split law).
 *   • Placement state (assets + support) is SHARED — place on one, appears on
 *     both. Each pane owns its own view (pan/zoom/bearing) and cursor readout.
 *   • MIRROR toggle (settings): panes lock to the exact same view, or roam free.
 *   • Each pane carries its own ASSET/SUPPORT placement menu (3-bullet toggle).
 *   • Adaptive geo breadcrumb (Continent → Country → State/City) scales w/ zoom.
 *
 * Grid law (operator-locked):
 *   • 1 km UTM grid, toggleable ON/OFF
 *   • readout precision DEFAULT 8-digit (10 m — FAAD convention), toggle to
 *     10-digit (1 m) / 12-digit (0.1 m) for higher precision
 *
 * World context strip: Natural Earth 50m borders (public domain). Elevation and
 * subsurface layers come later — see docs/security-2525/DATA_SOURCES.md.
 */
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Grid3x3, MapPin, Trash2, ChevronRight, Settings, RotateCcw, Maximize2, Minimize2, Columns2, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import {
  AssetIcon, ASSET_LABELS, type AssetKind, type IconStyle, type Affiliation,
} from "@/components/security-2525/asset-icons";
import { latLonToMgrs, latLonToUtm, utmKmGrid, chooseGridStep, mgrsToLatLon, dmsToLatLon, gzdBoundaries, gzdOf, BANDS } from "@/components/security-2525/mgrs";
import {
  SUPPORT_CATALOG, GROUP_META, REALITY_MODES,
  type SupportObjectDef, type MarkerGlyph, type LegendGroup, type RealityMode,
} from "@/components/security-2525/mission-support";
import { PfieldVenue } from "@/components/security-2525/pfield-venue";
import { COUNTRIES } from "@/components/security-2525/countries";
import { RCORE_LANES } from "@/components/security-2525/rcore";
import { MIN_SPAN_KM, MAX_SPAN_KM, shouldHandOffToWorld } from "@/lib/zoom-continuum";
import { terrainMSL, computeContours, makeDemSampler, type ContourOpts, type Dem } from "@/lib/contours";
import { getSunPosition, getMoonPosition, skyArc } from "@/lib/celestial";
import { computeTransect, transectLine, type AltObject } from "@/lib/transect";
import { RANGE_EDGES, BAND_LABELS, mFromFt, bandOccupancy } from "@/lib/voxel";
import { buildVoxelColumns, buildLatticeColumns, fmtLLV, fmtUcrsDms, ucrsCellId, ucrsCell2 } from "@/lib/voxel-grid";
import { bufferPolygon } from "@/lib/aor";
import { getTile, peekTile } from "@/lib/tile-cache";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import { SpectrumPicker } from "@/components/security-2525/spectrum-picker";
import { ULT_ROSTER, type UltNode } from "@/components/security-2525/ult-data";

const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444",
  // locked wireframe color law (R-CORE Consolidation 1 §7)
  borderCountry: "#ff4444", borderState: "#ff8c00", land: "#00ff9f", gold: "#ffd400",
};
// GRID band colour — a BRIGHT violet (TRINITY family #8B00FF reads too dark on the map);
// used for every horizontal latitude-band element (lines, 10% fill, letters) on 2D + 3D.
const BAND_VIOLET = "#b57bff";
// VOXEL size tier → BASE footprint scale ONLY. 3X full · 2X ⅔ · 1X ⅓. Single source of truth
// for both render blocks. NB: this scales the base footprint (cellPx) — NOT the vertical band
// unit (bandPx = unscaled cellW), so column height + altitude stay fixed across tiers.
const VOXEL_BASE_SCALE: Record<3 | 2 | 1, number> = { 3: 1, 2: 2 / 3, 1: 1 / 3 };

type Digits = 4 | 5 | 6;
const PRECISIONS: { d: Digits; label: string; hint: string }[] = [
  { d: 4, label: "8-DIGIT", hint: "10 m · FAAD default" },
  { d: 5, label: "10-DIGIT", hint: "1 m" },
  { d: 6, label: "12-DIGIT", hint: "0.1 m" },
];

// Distance units — each individually selectable (metric km/m · imperial mi/ft).
type Unit = "km" | "m" | "mi" | "ft";

// ── Buildings — exterior corners + dome only (edge wireframe comes later) ────
interface Building {
  label: string;
  ref: [number, number];             // lat, lon anchor
  footprint: [number, number][];     // meter offsets [east, north] — EXTERIOR corners
  dome?: [number, number, number];   // [east, north, radius m]
  door?: [number, number];           // main entrance (south face, faces Congress Ave)
}

// Texas State Capitol — cross-shaped exterior from the overhead reference.
const TX_CAPITOL: Building = {
  label: "TEXAS CAPITOL",
  ref: [30.27467, -97.74035],
  footprint: [
    [-30, 55], [30, 55], [30, 20], [88, 20], [88, -20], [30, -20],
    [30, -55], [-30, -55], [-30, -20], [-88, -20], [-88, 20], [-30, 20],
  ],
  dome: [0, 8, 15],
  door: [0, -55],
};

/** Window ticks along the exterior faces ("if you feel ambitious"). */
function capitolWindows(): [number, number][] {
  const w: [number, number][] = [];
  for (let x = -80; x <= -40; x += 13) { w.push([x, -20], [x, 20]); }   // west wing S+N faces
  for (let x = 40; x <= 80; x += 13) { w.push([x, -20], [x, 20]); }     // east wing S+N faces
  for (let x = -22; x <= 22; x += 11) { if (Math.abs(x) > 5) w.push([x, -55]); w.push([x, 55]); } // central faces (door gap S)
  return w;
}
const CAPITOL_WINDOWS = capitolWindows();

// ── AO presets ────────────────────────────────────────────────────────────────
interface Ao {
  key: string;
  name: string;
  center: [number, number];
  halfKm: number;
  landmarks: { name: string; lat: number; lon: number }[];
  buildings: Building[];
  field?: { nw: [number, number]; ne: [number, number]; sw: [number, number]; se: [number, number] };
  precision?: Digits;
  osm?: string;
}

const AOS: Ao[] = [
  {
    key: "mabry",
    name: "CAMP MABRY · AUSTIN TX",
    center: [30.316, -97.7639],
    halfKm: 6,
    osm: "mabry",
    landmarks: [
      { name: "CAMP MABRY", lat: 30.316, lon: -97.7639 },
      { name: "TX CAPITOL", lat: 30.27467, lon: -97.74035 },
    ],
    buildings: [],
  },
  {
    key: "capitol",
    name: "TEXAS CAPITOL · AUSTIN TX",
    center: [30.27467, -97.74035],
    halfKm: 1.2,
    osm: "capitol",
    landmarks: [{ name: "GOVERNOR'S MANSION", lat: 30.2724, lon: -97.7443 }],
    buildings: [TX_CAPITOL],
  },
  {
    key: "dc",
    name: "WASHINGTON DC · NATIONAL CAPITAL",
    center: [38.8899, -77.0091],
    halfKm: 4,
    osm: "dc", // roads + waterways (Potomac / Anacostia) — /security-2525/osm-dc.json (data pipeline)
    landmarks: [
      { name: "US CAPITOL", lat: 38.8899, lon: -77.0091 },
      { name: "WHITE HOUSE", lat: 38.8977, lon: -77.0365 },
      { name: "PENTAGON", lat: 38.8719, lon: -77.0563 },
    ],
    buildings: [],
  },
  {
    // Drone-play test venue: THE PFIELD (Pflugerville ISD stadium, opened 2017).
    key: "pfield",
    name: "THE PfIELD · PFLUGERVILLE TX",
    center: [30.4485425, -97.6344145],
    halfKm: 0.09,
    precision: 6,
    landmarks: [{ name: "The PfIELD", lat: 30.4485425, lon: -97.6344145 }],
    buildings: [],
    field: {
      nw: [30.449105, -97.634743],
      ne: [30.449104, -97.634061],
      sw: [30.447996, -97.634772],
      se: [30.447980, -97.634081],
    },
  },
  {
    key: "jblm",
    name: "JBLM LEWIS-McCHORD · SEATTLE/TACOMA WA",
    center: [47.0855, -122.5821],
    halfKm: 6,
    osm: "jblm",
    landmarks: [
      { name: "JBLM LEWIS MAIN", lat: 47.0855, lon: -122.5821 },
      { name: "GRAY AAF", lat: 47.079, lon: -122.5806 },
    ],
    buildings: [],
  },
  {
    key: "florida",
    name: "FLORIDA PENINSULA · LITTORAL (GULF + ATLANTIC)",
    center: [27.9, -81.6],
    halfKm: 160, // wide littoral AO: both coasts in view → land + bathymetry contours
    landmarks: [
      { name: "TAMPA BAY", lat: 27.77, lon: -82.55 },
      { name: "CAPE CANAVERAL", lat: 28.39, lon: -80.6 },
    ],
    buildings: [],
  },
  // Florida bases — 14G / air-defense demo. halfKm ≈ base + 10 km buffer. `osm` tiles
  // generated by scripts/security-2525/build_osm_overpass.py (same schema as Capitol/JBLM).
  { key: "campblanding", name: "CAMP BLANDING · FL NG (STARKE FL)", center: [29.9558, -81.9803], halfKm: 13, osm: "campblanding",
    landmarks: [{ name: "CAMP BLANDING JTC", lat: 29.9558, lon: -81.9803 }, { name: "KINGSLEY LAKE", lat: 29.98, lon: -81.98 }], buildings: [] },
  { key: "nasjax", name: "NAS JACKSONVILLE · FL (ST JOHNS RIVER)", center: [30.2358, -81.6806], halfKm: 13, osm: "nasjax",
    landmarks: [{ name: "NAS JACKSONVILLE", lat: 30.2358, lon: -81.6806 }], buildings: [] },
  { key: "mayport", name: "NS MAYPORT · FL (ATLANTIC)", center: [30.3936, -81.4243], halfKm: 13, osm: "mayport",
    landmarks: [{ name: "NS MAYPORT", lat: 30.3936, lon: -81.4243 }], buildings: [] },
  { key: "naspensacola", name: "NAS PENSACOLA · FL (GULF)", center: [30.3536, -87.3190], halfKm: 13, osm: "naspensacola",
    landmarks: [{ name: "NAS PENSACOLA", lat: 30.3536, lon: -87.319 }], buildings: [] },
  { key: "naswhiting", name: "NAS WHITING FIELD · FL (MILTON)", center: [30.7241, -87.0219], halfKm: 13, osm: "naswhiting",
    landmarks: [{ name: "NAS WHITING FIELD", lat: 30.7241, lon: -87.0219 }], buildings: [] },
  { key: "naskeywest", name: "NAS KEY WEST · BOCA CHICA (LITTORAL)", center: [24.5758, -81.6889], halfKm: 13, osm: "naskeywest",
    landmarks: [{ name: "NAS KEY WEST", lat: 24.5758, lon: -81.6889 }], buildings: [] },
  { key: "jacksonville", name: "JACKSONVILLE · FL (METRO)", center: [30.3322, -81.6557], halfKm: 20, osm: "jacksonville",
    landmarks: [{ name: "DOWNTOWN JACKSONVILLE", lat: 30.3322, lon: -81.6557 }], buildings: [] },
  // Texas >1M metros — 100 km buffer AOs (major roads + real DEM contours)
  { key: "houston", name: "HOUSTON · TX METRO (100km)", center: [29.7604, -95.3698], halfKm: 100, osm: "houston",
    landmarks: [{ name: "DOWNTOWN HOUSTON", lat: 29.7604, lon: -95.3698 }], buildings: [] },
  { key: "sanantonio", name: "SAN ANTONIO · TX METRO (100km)", center: [29.4241, -98.4936], halfKm: 100, osm: "sanantonio",
    landmarks: [{ name: "SAN ANTONIO", lat: 29.4241, lon: -98.4936 }], buildings: [] },
  { key: "dallas", name: "DALLAS · TX METRO (100km)", center: [32.7767, -96.7970], halfKm: 100, osm: "dallas",
    landmarks: [{ name: "DALLAS", lat: 32.7767, lon: -96.797 }], buildings: [] },
  { key: "fortworth", name: "FORT WORTH · TX METRO (100km)", center: [32.7555, -97.3308], halfKm: 100, osm: "fortworth",
    landmarks: [{ name: "FORT WORTH", lat: 32.7555, lon: -97.3308 }], buildings: [] },
  { key: "austin", name: "AUSTIN · TX METRO (100km)", center: [30.2672, -97.7431], halfKm: 100, osm: "austin",
    landmarks: [{ name: "DOWNTOWN AUSTIN", lat: 30.2672, lon: -97.7431 }], buildings: [] },
];

// ── Major metro areas (≥1M metropolitan population) — geo context labels ──────
interface City { name: string; lat: number; lon: number; state: string }
const CITIES: City[] = [
  // Texas 1M+ metros
  { name: "HOUSTON", lat: 29.760, lon: -95.369, state: "TX" },
  { name: "DALLAS–FT WORTH", lat: 32.777, lon: -96.797, state: "TX" },
  { name: "SAN ANTONIO", lat: 29.424, lon: -98.494, state: "TX" },
  { name: "AUSTIN", lat: 30.267, lon: -97.743, state: "TX" },
  // Washington state 1M+ metro
  { name: "SEATTLE", lat: 47.606, lon: -122.332, state: "WA" },
  // National capital metro
  { name: "WASHINGTON DC", lat: 38.9072, lon: -77.0369, state: "DC" },
];

/**
 * Adaptive geographic breadcrumb — which admin level "takes up the map" scales
 * with zoom: a wide span reads Continent → Country; a tight span reads
 * State → City. Returned coarse→fine; the pane shows the 1-2 most relevant.
 */
function geoContext(lat: number, lon: number, spanKm: number): string[] {
  const continent = "NORTH AMERICA";
  const country = lat > 24 && lat < 50 && lon > -125 && lon < -66 ? "USA" : "—";
  const state =
    lat > 25.8 && lat < 36.6 && lon > -106.7 && lon < -93.5 ? "TEXAS" :
    lat > 45.5 && lat < 49.1 && lon > -124.9 && lon < -116.9 ? "WASHINGTON" :
    lat > 38.7 && lat < 39.1 && lon > -77.3 && lon < -76.8 ? "WASHINGTON DC" : "—";
  let city = "", best = Infinity;
  for (const c of CITIES) {
    const d = Math.hypot((c.lat - lat) * 111, (c.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180));
    if (d < best) { best = d; city = c.name; }
  }
  const nearCity = best < 60 ? city : ""; // within 60 km of a major metro
  if (spanKm > 2500) return [continent];
  if (spanKm > 900) return [continent, country].filter((s) => s !== "—");
  if (spanKm > 250) return [country, state].filter((s) => s !== "—");
  if (spanKm > 40 || !nearCity) return [state, country].filter((s) => s !== "—");
  return [nearCity, state].filter((s) => s !== "—");
}

// ── Equipment inventory (machinery on hand for the mission) ──────────────────
interface InvItem { asset: AssetKind; stock: number; note: string; group: number }
const INITIAL_INVENTORY: InvItem[] = [
  { asset: "avenger", stock: 4, note: "SHORAD · Stinger ×8", group: 1 },
  { asset: "patriot", stock: 2, note: "PAC-3 · 2 pods of 4", group: 1 },
  { asset: "thaad", stock: 1, note: "4-canister battery", group: 1 },
  { asset: "sentinel", stock: 3, note: "AN/MPQ-64 radar", group: 1 },
  { asset: "xbat", stock: 9, note: "UAS · deploys as swarm ×3", group: 3 },
  { asset: "autofoil", stock: 4, note: "autonomous foil · single-ship", group: 1 },
];

/** A target line — brg = Primary Target Line; left/right = coverage each side. */
interface TL { brg: number; left: number; right: number }

interface Placed {
  id: number;
  asset: AssetKind;
  count: number;
  fx: number;
  fy: number;
  mgrs10: string;
  lat: number;
  lon: number;
  aff: Affiliation;
  tls?: { p?: TL; s?: TL; t?: TL };
  fov?: TL;
  unit?: AngleUnit;
  mobile?: boolean; // on-the-move (Avenger fires SLEW-TO-CUE only; PTL disabled while moving)
  // ── Track / movement (drone-war + R-CORE sim/replay; UCRS-2525 3D-ready) ──
  heading?: number;  // deg true
  speed?: number;    // km/h ground speed
  altitude?: number; // m — magnitude only; frame given by altRef (altitude visual law)
  altRef?: "AGL" | "MSL"; // altitude reference — labels MUST always carry it
  moving?: boolean;  // movement activated (track is live in the plan/sim)
  lineW?: number;    // PTL/TL/range line thickness (0.2–2, default 0.5)
}

type AngleUnit = "deg" | "ucrs" | "mil";
const ANGLE_FULL: Record<AngleUnit, number> = { deg: 360, ucrs: 3600, mil: 6400 };
const ANGLE_LABEL: Record<AngleUnit, string> = { deg: "DEG", ucrs: "UCRS-2525", mil: "6400 MIL" };
const toUnit = (deg: number, u: AngleUnit) => (deg * ANGLE_FULL[u]) / 360;
const fromUnit = (v: number, u: AngleUnit) => (v * 360) / ANGLE_FULL[u];
// SVG sector path (canvas units): from (brg-left) to (brg+right), 0=N=up.
function sectorPath(cx: number, cy: number, R: number, tl: TL) {
  const span = tl.left + tl.right;
  if (span >= 359.5) return `M${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy} Z`;
  const a0 = ((tl.brg - tl.left) * Math.PI) / 180, a1 = ((tl.brg + tl.right) * Math.PI) / 180;
  const p0x = cx + R * Math.sin(a0), p0y = cy - R * Math.cos(a0);
  const p1x = cx + R * Math.sin(a1), p1y = cy - R * Math.cos(a1);
  return `M${cx} ${cy} L${p0x.toFixed(2)} ${p0y.toFixed(2)} A ${R} ${R} 0 ${span > 180 ? 1 : 0} 1 ${p1x.toFixed(2)} ${p1y.toFixed(2)} Z`;
}
// HI: AVENGER is point-defense (Stinger, ~360°) — NO Primary Target Line. Only the
// directional PATRIOT / THAAD launchers carry a PTL wedge.
const AD_HALF: Partial<Record<AssetKind, number>> = { patriot: 60, thaad: 90 };

// Published engagement / detection ranges (km, approximate open-source figures) —
// a weapons-planning coverage aid, NOT a targeting authority. Sources: manufacturer
// & defense-press public data (Stinger 4–8 km; PAC-3 MSE up to ~160 km; THAAD ~200 km;
// AN/MPQ-64 Sentinel detection 40 km basic / 75–120 km upgraded). X-BAT/AUTO-FOIL program-nominal.
// HI (2026-07-09): use published upper figures — Avenger 8, PATRIOT PAC-3 160, THAAD 200, Sentinel 75.
// HI: only AIR-DEFENCE systems carry a coverage RING. X-BAT (UAS swarm) + AUTO-FOIL
// (autonomous effector) are aerial EFFECTORS, not defended volumes → NO range ellipsoid.
const ASSET_RANGE_KM: Partial<Record<AssetKind, number>> = {
  avenger: 8, patriot: 160, thaad: 200, sentinel: 75,
};
const ASSET_RANGE_EXT_KM: Partial<Record<AssetKind, number>> = {
  sentinel: 120,
};
// HI: AUTO altitude ceiling scales with the view span so the rail/voxel/dome are dimensionally
// sensible at every zoom — a 10k-ft ceiling over the whole USA reads as a flat sliver. Stepped
// through realistic airspace bands up to near-space for continental spans. maxAltFt overrides it.
function autoCeilingFt(spanKm: number): number {
  if (spanKm < 5) return 10000;
  if (spanKm < 15) return 25000;
  if (spanKm < 40) return 50000;
  if (spanKm < 120) return 100000;
  if (spanKm < 500) return 300000;
  return 1000000;
}

// ── World border context strip (Natural Earth 50m, self-hosted) ──────────────
interface BorderData { countries: [number, number][][]; usStates: [number, number][][] }
let borderCache: BorderData | null = null;

// ── OSM roads + waterways layer (OpenStreetMap, Python-preprocessed) ─────────
interface OsmWay { t: number; p: [number, number][]; bb?: [number, number, number, number] }
interface OsmData { roads: OsmWay[]; water: [number, number][][]; waterPolys: [number, number][][] }

// ── Real DEM (GEBCO) resolution pyramid ──────────────────────────────────────
// bbox [W,S,E,N]. The client picks the FINEST tile (smallest area) that fully
// contains the view → base tiles up close, state tiles zoomed out. Mirror of
// scripts/security-2525/build_dem.py REGIONS. Tiny (~8 KB) so load is instant.
const DEM_INDEX: { key: string; bbox: [number, number, number, number] }[] = [
  { key: "capitol", bbox: [-98.34, 29.67, -97.14, 30.88] },
  { key: "mabry", bbox: [-98.36, 29.72, -97.16, 30.92] },
  { key: "dc", bbox: [-77.64, 38.31, -76.44, 39.51] },
  { key: "jblm", bbox: [-123.18, 46.49, -121.98, 47.69] },
  { key: "campblanding", bbox: [-82.58, 29.36, -81.38, 30.56] },
  { key: "nasjax", bbox: [-82.28, 29.64, -81.08, 30.84] },
  { key: "mayport", bbox: [-82.02, 29.79, -80.82, 30.99] },
  { key: "naspensacola", bbox: [-87.92, 29.75, -86.72, 30.95] },
  { key: "naswhiting", bbox: [-87.62, 30.12, -86.42, 31.32] },
  { key: "naskeywest", bbox: [-82.29, 23.98, -81.09, 25.18] },
  { key: "jacksonville", bbox: [-82.26, 29.73, -81.06, 30.93] },
  { key: "houston", bbox: [-96.41, 28.86, -94.33, 30.66] },
  { key: "sanantonio", bbox: [-99.53, 28.52, -97.45, 30.33] },
  { key: "dallas", bbox: [-97.83, 31.87, -95.76, 33.68] },
  { key: "fortworth", bbox: [-98.37, 31.85, -96.29, 33.66] },
  { key: "austin", bbox: [-98.78, 29.36, -96.70, 31.17] },
  { key: "florida", bbox: [-83.8, 24.4, -79.4, 31.0] },
  { key: "dc100", bbox: [-78.5, 37.9, -75.6, 39.9] },
  { key: "floridastate", bbox: [-87.7, 24.3, -79.9, 31.1] },
  { key: "washington", bbox: [-124.9, 45.5, -116.9, 49.1] },
  { key: "texas", bbox: [-106.7, 25.8, -93.4, 36.6] },
];
const demArea = (b: [number, number, number, number]) => (b[2] - b[0]) * (b[3] - b[1]);
/** Finest DEM tile fully covering the view; else the coarsest tile over its centre. */
function pickDemKey(lat: number, lon: number, spanKm: number): string | null {
  const halfKm = spanKm * 0.75;
  const dLat = halfKm / 110.574, dLon = halfKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const W = lon - dLon, E = lon + dLon, S = lat - dLat, N = lat + dLat;
  const covers = DEM_INDEX.filter((d) => d.bbox[0] <= W && d.bbox[2] >= E && d.bbox[1] <= S && d.bbox[3] >= N)
    .sort((a, z) => demArea(a.bbox) - demArea(z.bbox));
  if (covers.length) return covers[0].key;
  const overCentre = DEM_INDEX.filter((d) => d.bbox[0] <= lon && d.bbox[2] >= lon && d.bbox[1] <= lat && d.bbox[3] >= lat)
    .sort((a, z) => demArea(z.bbox) - demArea(a.bbox));
  return overCentre.length ? overCentre[0].key : null;
}

// 12-sided AOR polygons (≈100 km radius) for the TX >1M metros — operator-provided.
// Rendered as the Area-of-Responsibility boundary out to which layers extend. [lat,lon].
const CITY_POLYGONS: Record<string, [number, number][]> = {
  houston: [[29.7604, -94.3350], [30.2096, -94.4736], [30.5384, -94.8524], [30.6587, -95.3698], [30.5384, -95.8872], [30.2096, -96.2660], [29.7604, -96.4046], [29.3112, -96.2660], [28.9824, -95.8872], [28.8621, -95.3698], [28.9824, -94.8524], [29.3112, -94.4736]],
  sanantonio: [[29.4241, -97.4590], [29.8733, -97.5976], [30.2021, -97.9764], [30.3224, -98.4936], [30.2021, -99.0110], [29.8733, -99.3897], [29.4241, -99.5283], [28.9749, -99.3897], [28.6461, -99.0110], [28.5258, -98.4936], [28.6461, -97.9764], [28.9749, -97.5976]],
  dallas: [[32.7767, -95.7624], [33.2259, -95.9009], [33.5547, -96.2797], [33.6750, -96.7970], [33.5547, -97.3144], [33.2259, -97.6932], [32.7767, -97.8317], [32.3275, -97.6932], [31.9987, -97.3144], [31.8784, -96.7970], [31.9987, -96.2797], [32.3275, -95.9009]],
  fortworth: [[32.7555, -96.2962], [33.2047, -96.4347], [33.5335, -96.8135], [33.6538, -97.3308], [33.5335, -97.8481], [33.2047, -98.2269], [32.7555, -98.3654], [32.3063, -98.2269], [31.9775, -97.8481], [31.8572, -97.3308], [31.9775, -96.8135], [32.3063, -96.4347]],
  austin: [[30.2672, -96.7085], [30.7164, -96.8470], [31.0452, -97.2258], [31.1655, -97.7431], [31.0452, -98.2605], [30.7164, -98.6392], [30.2672, -98.7777], [29.8180, -98.6392], [29.4892, -98.2605], [29.3689, -97.7431], [29.4892, -97.2258], [29.8180, -96.8470]],
  // FL bases — operator-provided 12-point ~100 km AOR polygons
  campblanding: [[29.95, -80.9454], [30.3992, -81.0840], [30.7280, -81.4628], [30.8483, -81.98], [30.7280, -82.4973], [30.3992, -82.8761], [29.95, -83.0146], [29.5008, -82.8761], [28.9824, -82.4973], [28.8621, -81.98], [28.9824, -81.4628], [29.5008, -81.0840]],
  nasjax: [[30.2358, -80.6460], [30.6850, -80.7845], [31.0138, -81.1633], [31.1341, -81.6806], [31.0138, -82.1979], [30.6850, -82.5767], [30.2358, -82.7152], [29.7866, -82.5767], [29.4578, -82.1979], [29.3375, -81.6806], [29.4578, -81.1633], [29.7866, -80.7845]],
  mayport: [[30.3925, -80.3893], [30.8417, -80.5278], [31.1705, -80.9066], [31.2908, -81.4239], [31.1705, -81.9412], [30.8417, -82.3200], [30.3925, -82.4585], [29.9433, -82.3200], [29.6145, -81.9412], [29.4942, -81.4239], [29.6145, -80.9066], [29.9433, -80.5278]],
  naspensacola: [[30.35, -86.2554], [30.7992, -86.3939], [31.1280, -86.7727], [31.2483, -87.29], [31.1280, -87.8073], [30.7992, -88.1861], [30.35, -88.3246], [29.9008, -88.1861], [29.5720, -87.8073], [29.4517, -87.29], [29.5720, -86.7727], [29.9008, -86.3939]],
  naswhiting: [[30.72, -85.9854], [31.1692, -86.1239], [31.4980, -86.5027], [31.6183, -87.02], [31.4980, -87.5373], [31.1692, -87.9161], [30.72, -88.0546], [30.2708, -87.9161], [29.9420, -87.5373], [29.8217, -87.02], [29.9420, -86.5027], [30.2708, -86.1239]],
  naskeywest: [[24.58, -80.7254], [25.0292, -80.8639], [25.3580, -81.2427], [25.4783, -81.76], [25.3580, -82.2773], [25.0292, -82.6561], [24.58, -82.7946], [24.1308, -82.6561], [23.8020, -82.2773], [23.6817, -81.76], [23.8020, -81.2427], [24.1308, -80.8639]],
  jacksonville: [[30.33, -80.6254], [30.7792, -80.7639], [31.1080, -81.1427], [31.2283, -81.66], [31.1080, -82.1773], [30.7792, -82.5561], [30.33, -82.6946], [29.8808, -82.5561], [29.5520, -82.1773], [29.4317, -81.66], [29.5520, -81.1427], [29.8808, -80.7639]],
};


/** NON-passive wheel listener so preventDefault() keeps zoom on the map. */
function useWheel<T extends Element>(ref: React.RefObject<T | null>, handler: (e: WheelEvent) => void) {
  const h = useRef(handler);
  h.current = handler;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = (e: Event) => h.current(e as WheelEvent);
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [ref]);
}

function ringPath(ring: [number, number][], w: number, h: number): string {
  return ring
    .map(([lon, lat], i) => `${i ? "L" : "M"}${(((lon + 180) / 360) * w).toFixed(1)} ${(((90 - lat) / 180) * h).toFixed(1)}`)
    .join("");
}

/** Orthographic wireframe GLOBE — planning start screen (drag-rotate, zoom → drill). */
type GzCell = { zone: number; band: string; lonW: number; lonE: number; latS: number; latN: number };
function GlobeView({ data, center, activeKey, onSelect, onDrill, onEnterAo, coordFmt, showZones, hiddenKeys }: {
  data: BorderData | null; center: [number, number]; activeKey: string;
  onSelect: (k: string) => void; onDrill: (lat: number, lon: number) => void; onEnterAo?: (k: string) => void;
  coordFmt: "mgrs" | "dms" | "ucrs"; showZones: boolean; hiddenKeys?: Set<string>;
}) {
  // Nearest AO to a lat/lon within ~10° → zoom-in enters it directly (no flat 'blue screen').
  const nearestAo = (lat: number, lon: number) => {
    let best = "", bd = Infinity;
    for (const a of AOS) { const d = Math.hypot(a.center[0] - lat, a.center[1] - lon); if (d < bd) { bd = d; best = a.key; } }
    return bd < 10 ? best : "";
  };
  const drillOrEnter = (lat: number, lon: number) => { const k = onEnterAo && nearestAo(lat, lon); if (k) onEnterAo!(k); else onDrill(lat, lon); };
  const CX = 170, CY = 170, RING = 150, R = 150;
  const D = Math.PI / 180;
  const ZMAX = 4; // magnify up to 4× before drilling into the flat/AO map
  const [cam, setCam] = useState({ lat0: center[0], lon0: center[1], tilt: 0.32, roll: 0, zoom: 1 });
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null);
  const touch = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; cx: number; cy: number; ang: number } | null>(null);
  const gsvg = useRef<SVGSVGElement>(null);
  useEffect(() => { setCam((c) => ({ ...c, lat0: center[0], lon0: center[1] })); }, [center[0], center[1]]);
  const { lat0: LAT0, lon0: LON0, tilt, roll, zoom } = cam;
  const cr = Math.cos(roll), sr = Math.sin(roll), ct = Math.cos(tilt), st = Math.sin(tilt);
  // Selected grid cell = whatever the globe is currently centered on — orbiting re-selects it.
  const sel = gzdOf(LAT0, LON0);
  useWheel(gsvg, (e) => {
    e.preventDefault();
    const zin = e.deltaY < 0, factor = zin ? 1.15 : 1 / 1.15;
    if (cam.zoom * factor > ZMAX && zin) { drillOrEnter(cam.lat0, cam.lon0); return; }
    setCam((c) => ({ ...c, zoom: Math.min(ZMAX, Math.max(1, c.zoom * factor)) }));
  });
  const proj = (lat: number, lon: number): [number, number, boolean] => {
    const p = lat * D, l = (lon - LON0) * D, p0 = LAT0 * D;
    const X = Math.cos(p) * Math.sin(l);
    const Yc = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
    const Z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    const x = X * cr - Yc * sr, y0 = X * sr + Yc * cr;
    const y = y0 * ct - Z * st, z = y0 * st + Z * ct;
    return [CX + R * x, CY - R * y, z > 0];
  };
  const pathOf = (pts: [number, number][]) => {
    let s = "", pen = false;
    for (const [lon, lat] of pts) {
      const [x, y, v] = proj(lat, lon);
      if (!v) { pen = false; continue; }
      s += `${pen ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      pen = true;
    }
    return s;
  };
  const graticule = useMemo(() => {
    const rings: [number, number][][] = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      const r: [number, number][] = [];
      for (let lon = -180; lon <= 180; lon += 5) r.push([lon, lat]);
      rings.push(r);
    }
    for (let lon = -180; lon < 180; lon += 15) {
      const r: [number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 5) r.push([lon, lat]);
      rings.push(r);
    }
    return rings.map(pathOf).join("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam]);
  const borders = useMemo(() => (data ? {
    countries: data.countries.map(pathOf).join(""),
    states: data.usStates.map(pathOf).join(""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  } : null), [data, cam]);
  // MGRS grid-zone training overlay on the sphere: faint 6°×8° graticule + active cell edges.
  const zoneOverlay = useMemo(() => {
    if (!showZones) return null;
    // Grid spacing matches the selected protocol: MGRS → 6°×8° UTM zones; LLV-DMS / UCRS → 15° graticule.
    const mgrs = coordFmt === "mgrs";
    const meridians = mgrs ? gzdBoundaries().meridians : Array.from({ length: 25 }, (_, i) => -180 + i * 15);
    const parallels = mgrs ? gzdBoundaries().parallels : Array.from({ length: 11 }, (_, i) => -75 + i * 15);
    const grid: [number, number][][] = [];
    for (const lon of meridians) { const r: [number, number][] = []; for (let lat = -80; lat <= 84; lat += 5) r.push([lon, lat]); grid.push(r); }
    for (const lat of parallels) { const r: [number, number][] = []; for (let lon = -180; lon <= 180; lon += 5) r.push([lon, lat]); grid.push(r); }
    // Centered cell (updates as the globe orbits) → zone wedge (yellow) + band ring (violet) edges.
    const s = gzdOf(cam.lat0, cam.lon0);
    const segZone: [number, number][][] = [];
    for (const lon of [s.lonW, s.lonE]) { const r: [number, number][] = []; for (let lat = -80; lat <= 84; lat += 3) r.push([lon, lat]); segZone.push(r); }
    const segBand: [number, number][][] = [];
    for (const lat of [s.latS, s.latN]) { const r: [number, number][] = []; for (let lon = -180; lon <= 180; lon += 3) r.push([lon, lat]); segBand.push(r); }
    // 10% mask-fill ALONG the selected bands: the zone as a vertical wedge (all lats), the band
    // as a horizontal ring (all lons) — sampled into small quads; a quad drops out at the horizon
    // if any corner is back-facing, so the shade respects the limb (no torn wrap-around fills).
    const quadFill = (lons: number[], lats: number[]) => {
      let out = "";
      for (let i = 0; i < lons.length - 1; i++) for (let j = 0; j < lats.length - 1; j++) {
        const cs: [number, number][] = [[lons[i], lats[j]], [lons[i + 1], lats[j]], [lons[i + 1], lats[j + 1]], [lons[i], lats[j + 1]]];
        const ps = cs.map(([lo, la]) => proj(la, lo));
        if (ps.some((pp) => !pp[2])) continue;
        out += "M" + ps.map((pp) => `${pp[0].toFixed(1)} ${pp[1].toFixed(1)}`).join("L") + "Z";
      }
      return out;
    };
    const zoneLats: number[] = []; for (let la = -80; la <= 84; la += 4) zoneLats.push(la);
    const bandLons: number[] = []; for (let lo = -180; lo <= 180; lo += 6) bandLons.push(lo);
    const zoneFill = mgrs ? quadFill([s.lonW, s.lonE], zoneLats) : "";
    const bandFill = mgrs ? quadFill(bandLons, [s.latS, s.latN]) : "";
    return { grid: grid.map(pathOf).join(""), zone: segZone.map(pathOf).join(""), band: segBand.map(pathOf).join(""), zoneFill, bandFill };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam, showZones, coordFmt]);
  const ticks = useMemo(() => {
    const t: React.ReactNode[] = [];
    for (let deg = 0; deg < 360; deg += 5) {
      const a = (deg - 90) * D;
      const major = deg % 30 === 0;
      const r1 = RING, r2 = RING + (major ? 9 : 5);
      t.push(
        <line key={deg} x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
          x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
          stroke={C.cyan} strokeWidth={major ? 0.9 : 0.5} opacity="0.8" />
      );
      if (major) {
        t.push(
          <text key={`t${deg}`} x={CX + (RING + 15) * Math.cos(a)} y={CY + (RING + 15) * Math.sin(a)}
            fontSize="7" fontFamily="monospace" fill={C.cyan} textAnchor="middle" dominantBaseline="middle">
            {String(deg).padStart(3, "0")}
          </text>
        );
      }
    }
    return t;
  }, [D]);
  return (
    <svg ref={gsvg} viewBox="0 0 340 340" preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full touch-none select-none" role="img"
      aria-label="Wireframe globe — orbit camera; scroll/pinch to zoom, right-drag to angle the view, drag to pan"
      style={{ cursor: drag.current ? "grabbing" : "crosshair" }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") {
          touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          (e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId);
          if (touch.current.size === 2) { const [a, b] = Array.from(touch.current.values()); pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) }; }
          return;
        }
        drag.current = { x: e.clientX, y: e.clientY, btn: e.button };
        (e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") {
          const prev = touch.current.get(e.pointerId); if (!prev) return;
          touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (touch.current.size >= 2 && pinch.current) {
            // Google-Earth 2-finger: pinch = zoom, twist = spin (roll), drag = tilt (vertical) + orbit (horizontal).
            const [a, b] = Array.from(touch.current.values());
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const factor = dist / Math.max(1, pinch.current.dist);
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            let dAng = ang - pinch.current.ang;
            if (dAng > Math.PI) dAng -= 2 * Math.PI; else if (dAng < -Math.PI) dAng += 2 * Math.PI;
            const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
            const dcx = cx - pinch.current.cx, dcy = cy - pinch.current.cy;
            pinch.current = { dist, cx, cy, ang };
            if (cam.zoom * factor > ZMAX) { drillOrEnter(cam.lat0, cam.lon0); return; }
            setCam((c) => ({
              ...c,
              zoom: Math.min(ZMAX, Math.max(1, c.zoom * factor)),
              roll: c.roll - dAng,
              tilt: Math.max(-1.4, Math.min(1.4, c.tilt + dcy * 0.006)),
              lon0: c.lon0 - dcx * 0.3,
            }));
          } else if (touch.current.size === 1) {
            const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
            setCam((c) => ({ ...c, lon0: c.lon0 - dx * 0.5, lat0: Math.min(85, Math.max(-85, c.lat0 + dy * 0.5)) }));
          }
          return;
        }
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        d.x = e.clientX; d.y = e.clientY;
        if (d.btn === 2) {
          setCam((c) => ({ ...c, roll: c.roll - dx * 0.005, tilt: Math.max(-1.4, Math.min(1.4, c.tilt + dy * 0.005)) }));
        } else {
          setCam((c) => ({ ...c, lon0: c.lon0 - dx * 0.5, lat0: Math.min(85, Math.max(-85, c.lat0 + dy * 0.5)) }));
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") { touch.current.delete(e.pointerId); if (touch.current.size < 2) pinch.current = null; return; }
        drag.current = null;
      }}>
      <defs><clipPath id="globe-clip"><circle cx={CX} cy={CY} r={RING} /></clipPath></defs>
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke={C.cyan} strokeWidth="0.6" opacity="0.7" />
      {ticks}
      {/* zoom magnifies the globe within the fixed compass ring (clipped) — no SVG-edge clipping */}
      <g clipPath="url(#globe-clip)" transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
        <circle cx={CX} cy={CY} r={R} fill="#0a2f52" stroke={C.cyan} strokeWidth={1.2 / zoom} />
        {borders && <path d={borders.countries} fill="#123d1f" fillRule="evenodd" stroke="none" opacity="0.9" />}
        {/* default 15° graticule — hidden when the GRID overlay is on (no duplicate grid) */}
        <path d={graticule} fill="none" stroke={C.cyan} strokeWidth={0.35 / zoom} opacity={showZones ? 0 : 0.55} />
        {borders && (
          <>
            <path d={borders.countries} fill="none" stroke={C.borderCountry} strokeWidth={0.5 / zoom} opacity="0.75" />
            <path d={borders.states} fill="none" stroke={C.borderState} strokeWidth={0.4 / zoom} opacity="0.65" />
          </>
        )}
        {/* country names — front-facing only; declutter by the visible span (≈180°/zoom) */}
        {COUNTRIES.filter((c) => !c.min || 180 / zoom <= c.min).map((c) => {
          const [x, y, v] = proj(c.lat, c.lon);
          if (!v) return null;
          return <text key={c.name} x={x} y={y} fontSize={5 / zoom} fill={C.text} opacity="0.55" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace", letterSpacing: "0.02em" }}>{c.name}</text>;
        })}
        {AOS.filter((ao) => !hiddenKeys?.has(ao.key)).map((ao) => {
          const [x, y, v] = proj(ao.center[0], ao.center[1]);
          if (!v) return null;
          const active = ao.key === activeKey;
          return (
            <g key={ao.key} onClick={() => onSelect(ao.key)} onDoubleClick={() => drillOrEnter(ao.center[0], ao.center[1])} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={(active ? 7 : 5) / zoom} fill="none" stroke={C.gold} strokeWidth={1 / zoom} opacity={active ? 1 : 0.7} />
              {active && <circle cx={x} cy={y} r={10 / zoom} fill="none" stroke={C.gold} strokeWidth={0.5 / zoom} opacity="0.5" />}
              <circle cx={x} cy={y} r={1.5 / zoom} fill={C.gold} />
            </g>
          );
        })}
        {zoneOverlay && (
          <>
            {/* 10% mask-fill along the selected zone (yellow, vertical) + band (violet, horizontal);
                their overlap self-highlights the active cell */}
            {zoneOverlay.zoneFill && <path d={zoneOverlay.zoneFill} fill={TRINITY_COLORS.temporal} opacity="0.1" stroke="none" />}
            {zoneOverlay.bandFill && <path d={zoneOverlay.bandFill} fill={BAND_VIOLET} opacity="0.1" stroke="none" />}
            <path d={zoneOverlay.grid} fill="none" stroke={C.cyan} strokeWidth={0.3 / zoom} opacity="0.3" />
            {/* zone = yellow (vertical), band = violet (horizontal) */}
            <path d={zoneOverlay.zone} fill="none" stroke={TRINITY_COLORS.temporal} strokeWidth={0.9 / zoom} opacity="0.95" />
            <path d={zoneOverlay.band} fill="none" stroke={BAND_VIOLET} strokeWidth={0.9 / zoom} opacity="0.95" />
            {coordFmt !== "ucrs" && (() => {
              const degL = (v: number, pos: string, neg: string) => `${Math.abs(Math.round(v))}°${v < 0 ? neg : pos}`;
              const mgrs = coordFmt === "mgrs";
              const zones = mgrs ? Array.from({ length: 60 }, (_, k) => k) : [];
              const bandsArr = mgrs ? BANDS.split("") : [];
              const merid = mgrs ? [] : Array.from({ length: 25 }, (_, i) => -180 + i * 15);
              const paral = mgrs ? [] : Array.from({ length: 11 }, (_, i) => -75 + i * 15);
              return (
                <>
                  {/* zone numbers 1–60 along the equator — UNIFORM cyan (the active zone is NOT
                      enlarged/highlighted here; the only highlight is the yellow intersection label) */}
                  {zones.map((k) => { const lonC = -180 + k * 6 + 3, zn = k + 1; const [x, y, v] = proj(0, lonC); return v ? <text key={`gz${k}`} x={x} y={y} fontSize={6 / zoom} fill={C.cyan} opacity="0.85" textAnchor="middle" style={{ fontFamily: "monospace" }}>{zn}</text> : null; })}
                  {/* band letters C–X down the CENTRE meridian (LON0) — a vertical latitude scale
                      through the middle. The ACTIVE band is skipped here (its letter is in the
                      yellow address at the crosshair); dark halo keeps cyan legible over the strip. */}
                  {bandsArr.map((L, j) => { if (sel.band === L) return null; const latS = -80 + j * 8, latN = j === 19 ? 84 : latS + 8; const [x, y, v] = proj((latS + latN) / 2, LON0); return v ? <text key={`gb${j}`} x={x} y={y} fontSize={7.5 / zoom} fontWeight="bold" fill={BAND_VIOLET} opacity="0.95" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace", paintOrder: "stroke" }} stroke="#0a1018" strokeWidth={1.6 / zoom}>{L}</text> : null; })}
                  {/* INTERSECTION marker — at the true GEOGRAPHIC cell centre (where the yellow zone
                      meets the violet band), NOT screen-centre: tilt shifts the sub-camera point down,
                      so a screen-fixed label sat a band or two too high. Mini circle + all-yellow
                      "14R" (outline), exactly like the 2D chip that read perfectly. */}
                  {mgrs && (() => { const [x, y, v] = proj((sel.latS + sel.latN) / 2, (sel.lonW + sel.lonE) / 2); if (!v) return null; return (
                    <g key="gzint">
                      <circle cx={x} cy={y} r={2.2 / zoom} fill="none" stroke={C.gold} strokeWidth={0.7 / zoom} opacity="0.9" />
                      <text x={x} y={y + 9 / zoom} fontSize={11 / zoom} fontWeight="bold" fill={TRINITY_COLORS.temporal} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace", paintOrder: "stroke" }} stroke="#0a0e14" strokeWidth={2.6 / zoom}>{sel.zone}{sel.band}</text>
                    </g>
                  ); })()}
                  {merid.map((lon) => { const [x, y, v] = proj(0, lon); return v ? <text key={`dgz${lon}`} x={x} y={y} fontSize={4 / zoom} fill={C.cyan} opacity="0.7" textAnchor="middle" style={{ fontFamily: "monospace" }}>{degL(lon, "E", "W")}</text> : null; })}
                  {paral.map((lat) => { const [x, y, v] = proj(lat, LON0); return v ? <text key={`dgb${lat}`} x={x} y={y} fontSize={4 / zoom} fill={C.cyan} opacity="0.7" textAnchor="middle" style={{ fontFamily: "monospace" }}>{degL(lat, "N", "S")}</text> : null; })}
                </>
              );
            })()}
          </>
        )}
      </g>
      {/* Stationary bearing compass — a screen-fixed reticle cross drawn OUTSIDE the zoom /
          orbit transform, so it never rotates with the globe. Horizontal 270(W)◄►090(E),
          vertical 000(N)▲▼180(S); the centre dot is the fixed sight the moving grid bands
          are read against. Shown with the GRID overlay. */}
      {showZones && (
        <g style={{ pointerEvents: "none" }}>
          {/* stationary bearing reticle — dashed cross only (the mini circle + yellow GZD label now
              live at the GEOGRAPHIC intersection inside the globe, so they track the selected cell). */}
          <line x1={CX - RING} y1={CY} x2={CX + RING} y2={CY} stroke={C.cyan} strokeWidth="0.5" strokeDasharray="2 3" opacity="0.4" />
          <line x1={CX} y1={CY - RING} x2={CX} y2={CY + RING} stroke={C.cyan} strokeWidth="0.5" strokeDasharray="2 3" opacity="0.4" />
        </g>
      )}
    </svg>
  );
}

function WorldStrip({ aoKey, onSelect, onEnterAo, label, onMinimize, coordFmt, hiddenKeys }: { aoKey: string; onSelect: (k: string) => void; onEnterAo?: (k: string) => void; label?: string; onMinimize?: () => void; coordFmt: "mgrs" | "dms" | "ucrs"; hiddenKeys?: Set<string> }) {
  const [data, setData] = useState<BorderData | null>(borderCache);
  const [mode, setMode] = useState<"globe" | "flat">("globe");
  const [showZones, setShowZones] = useState(false); // MGRS/LLV-DMS grid-zone training overlay (globe + flat)
  const [center, setCenter] = useState<[number, number]>(() => (AOS.find((a) => a.key === aoKey)?.center ?? [38, -97]));
  useEffect(() => {
    if (borderCache) return;
    fetch("/security-2525/borders-ne50m.json")
      .then((r) => r.json())
      .then((d: BorderData) => { borderCache = d; setData(d); })
      .catch(() => {});
  }, []);
  useEffect(() => { const a = AOS.find((x) => x.key === aoKey); if (a) setCenter(a.center); }, [aoKey]);
  const W = 720, H = 360;
  const paths = useMemo(() => {
    if (!data) return null;
    return {
      countries: data.countries.map((r) => ringPath(r, W, H)).join(""),
      states: data.usStates.map((r) => ringPath(r, W, H)).join(""),
    };
  }, [data]);
  const [flat, setFlat] = useState({ x: 0, y: H * 0.08, w: W, h: H * 0.62 });
  const flatDrag = useRef<{ x: number; y: number } | null>(null);
  const flatSvg = useRef<SVGSVGElement>(null);
  const drillToFlat = (lat: number, lon: number) => {
    const cx = ((lon + 180) / 360) * W, cy = ((90 - lat) / 180) * H;
    const w = 0.12 * (W / 360), h = w;
    setFlat({ x: cx - w / 2, y: cy - h / 2, w, h });
    setCenter([lat, lon]); setMode("flat");
  };
  // F34 (P1.3): Natural Earth 50m runs out of detail below ~2° — zooming past it gave a
  // featureless blue screen ("crash at 26 km"). FLOOR the flat zoom there; the tactical
  // AO map is the detail engine (hand off when an AO is within reach, else clamp + hint).
  const FLAT_MIN_W = 4; // svg units ≈ 2° ≈ 220 km wide
  useWheel(flatSvg, (e) => {
    e.preventDefault();
    const k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    if (flat.w * k >= W * 0.98 && e.deltaY > 0) { setMode("globe"); return; }
    const nw = Math.min(W, Math.max(FLAT_MIN_W, flat.w * k));
    // zooming IN tight → hand off to the tactical AO map when one is within reach.
    // NB: call onEnterAo OUTSIDE setFlat — a parent setState inside a state updater crashes React.
    if (e.deltaY < 0 && onEnterAo && nw < W * 0.03) {
      const mx = flat.x + flat.w / 2, my = flat.y + flat.h / 2;
      const clat = 90 - (my / H) * 180, clon = (mx / W) * 360 - 180;
      let best = "", bd = Infinity;
      for (const a of AOS) { const d = Math.hypot(a.center[0] - clat, a.center[1] - clon); if (d < bd) { bd = d; best = a.key; } }
      if (best && bd < 3) { onEnterAo(best); return; }
      if (flat.w <= FLAT_MIN_W) return; // at the floor, nothing closer to show — never a blue screen
    }
    setFlat((f) => {
      const w = Math.min(W, Math.max(FLAT_MIN_W, f.w * k)), h = w * (f.h / f.w);
      const mx = f.x + f.w / 2, my = f.y + f.h / 2;
      return { w, h, x: mx - w / 2, y: my - h / 2 };
    });
  });
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
      {mode === "globe" ? (
        <GlobeView data={data} center={center} activeKey={aoKey} onSelect={onSelect} onDrill={drillToFlat} onEnterAo={onEnterAo} coordFmt={coordFmt} showZones={showZones} hiddenKeys={hiddenKeys} />
      ) : (
        <svg ref={flatSvg} viewBox={`${flat.x} ${flat.y} ${flat.w} ${flat.h}`} preserveAspectRatio="xMidYMid slice"
          className="block h-full w-full touch-none" role="img"
          style={{ cursor: flatDrag.current ? "grabbing" : "grab" }}
          aria-label="World context map — country + US state borders (Natural Earth 50m); scroll to zoom, drag to pan"
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => { flatDrag.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId); }}
          onPointerMove={(e) => {
            const d = flatDrag.current; if (!d) return;
            const r = flatSvg.current?.getBoundingClientRect(); if (!r) return;
            const dx = (e.clientX - d.x) / r.width * flat.w, dy = (e.clientY - d.y) / r.height * flat.h;
            d.x = e.clientX; d.y = e.clientY;
            // horizontal wraps around the globe (modulo world width); vertical lets the view CENTRE
            // reach ±84° lat (centre-y ∈ [12,348]) so the GZD crosshair can select the polar bands
            // C and X — not just H↔S. flat.y may go negative (ocean rect fills beyond the poles).
            setFlat((f) => ({ ...f, x: (((f.x - dx) % W) + W) % W, y: Math.max(12 - f.h / 2, Math.min((H - 12) - f.h / 2, f.y - dy)) }));
          }}
          onPointerUp={() => { flatDrag.current = null; }}>
          {/* blue ocean base for the whole (wrapped) world */}
          <rect x={-W} y={0} width={3 * W} height={H} fill="#0a2f52" />
          {/* three world copies (−360° · 0 · +360°) so panning wraps seamlessly around the dateline */}
          {[-W, 0, W].map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              {paths && (
                <>
                  <path d={paths.countries} fill="#123d1f" fillRule="evenodd" stroke="none" />
                  <path d={paths.countries} fill="none" stroke={C.borderCountry} strokeWidth="0.45" opacity="0.55" vectorEffect="non-scaling-stroke" />
                  <path d={paths.states} fill="none" stroke={C.borderState} strokeWidth="0.35" opacity="0.5" vectorEffect="non-scaling-stroke" />
                </>
              )}
              {/* country names — declutter by the visible span (flat.w/W · 360°) */}
              {COUNTRIES.filter((c) => !c.min || (flat.w / W) * 360 <= c.min).map((c) => {
                const x = ((c.lon + 180) / 360) * W, y = ((90 - c.lat) / 180) * H;
                return (
                  <text key={c.name} x={x} y={y} fontSize="3.6" fill={C.text} opacity="0.5" textAnchor="middle" dominantBaseline="middle" vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace", letterSpacing: "0.03em" }}>{c.name}</text>
                );
              })}
              {/* Major metros (≥1M) — surface once zoomed past continent scale */}
              {flat.w < W * 0.4 && CITIES.map((c) => {
                const x = ((c.lon + 180) / 360) * W, y = ((90 - c.lat) / 180) * H;
                return (
                  <g key={c.name} style={{ pointerEvents: "none" }}>
                    <circle cx={x} cy={y} r="1.1" fill={C.text} vectorEffect="non-scaling-stroke" />
                    <circle cx={x} cy={y} r="2.4" fill="none" stroke={C.text} strokeWidth="0.4" opacity="0.5" vectorEffect="non-scaling-stroke" />
                    <text x={x + 2.5} y={y + 1} fontSize="3.4" fill={C.text} vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace" }}>{c.name}</text>
                  </g>
                );
              })}
              {AOS.filter((ao) => !hiddenKeys?.has(ao.key)).map((ao) => {
                const x = ((ao.center[1] + 180) / 360) * W;
                const y = ((90 - ao.center[0]) / 180) * H;
                const active = ao.key === aoKey;
                return (
                  <g key={ao.key} onClick={() => onSelect(ao.key)} style={{ cursor: "pointer" }}>
                    <circle cx={x} cy={y} r={active ? 5 : 3.5} fill="none" stroke={C.cyan} strokeWidth="1" opacity={active ? 1 : 0.6} vectorEffect="non-scaling-stroke" />
                    <circle cx={x} cy={y} r="1.4" fill={C.cyan} vectorEffect="non-scaling-stroke" />
                    <text x={x + 2} y={y - 2} fontSize="4" fill={C.gold} vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace" }}>{ao.name.split(" · ")[0]}</text>
                  </g>
                );
              })}
              {/* MGRS/LLV-DMS grid-zone training overlay — faint 6°×8° grid, active cell highlighted.
                  Only when zoomed out (flat.w ≥ half world). Tiles with the wrap loop. */}
              {showZones && flat.w >= W * 0.5 && (() => {
                const mgrs = coordFmt === "mgrs";
                const meridians = mgrs ? gzdBoundaries().meridians : Array.from({ length: 25 }, (_, i) => -180 + i * 15);
                const parallels = mgrs ? gzdBoundaries().parallels : Array.from({ length: 11 }, (_, i) => -75 + i * 15);
                const xOf = (lon: number) => ((lon + 180) / 360) * W;
                const yOf = (lat: number) => ((90 - lat) / 180) * H;
                const degL = (v: number, pos: string, neg: string) => `${Math.abs(Math.round(v))}°${v < 0 ? neg : pos}`;
                // selected cell = the cell at the current view centre; panning re-selects it
                const cLat = 90 - ((flat.y + flat.h / 2) / H) * 180;
                const cLon = ((((((flat.x + flat.w / 2) / W) * 360 - 180) + 180) % 360) + 360) % 360 - 180;
                const fsel = gzdOf(cLat, cLon);
                return (
                  <g style={{ pointerEvents: "none" }}>
                    {meridians.map((lon) => (
                      <line key={`zm${lon}`} x1={xOf(lon)} y1={0} x2={xOf(lon)} y2={H} stroke={C.cyan} strokeWidth="0.3" opacity="0.22" vectorEffect="non-scaling-stroke" />
                    ))}
                    {parallels.map((lat) => (
                      <line key={`bp${lat}`} x1={0} y1={yOf(lat)} x2={W} y2={yOf(lat)} stroke={C.cyan} strokeWidth="0.3" opacity="0.22" vectorEffect="non-scaling-stroke" />
                    ))}
                    {/* zone = yellow (vertical strip), band = violet (horizontal strip), cell = bright intersection */}
                    <rect x={xOf(fsel.lonW)} y={0} width={xOf(fsel.lonE) - xOf(fsel.lonW)} height={H} fill={TRINITY_COLORS.temporal} opacity="0.09" />
                    <rect x={0} y={yOf(fsel.latN)} width={W} height={yOf(fsel.latS) - yOf(fsel.latN)} fill={BAND_VIOLET} opacity="0.1" />
                    <rect x={xOf(fsel.lonW)} y={yOf(fsel.latN)} width={xOf(fsel.lonE) - xOf(fsel.lonW)} height={yOf(fsel.latS) - yOf(fsel.latN)} fill={C.gold} opacity="0.22" />
                    {[fsel.lonW, fsel.lonE].map((lon) => (
                      <line key={`az${lon}`} x1={xOf(lon)} y1={0} x2={xOf(lon)} y2={H} stroke={TRINITY_COLORS.temporal} strokeWidth="0.6" opacity="0.9" vectorEffect="non-scaling-stroke" />
                    ))}
                    {[fsel.latN, fsel.latS].map((lat) => (
                      <line key={`ab${lat}`} x1={0} y1={yOf(lat)} x2={W} y2={yOf(lat)} stroke={BAND_VIOLET} strokeWidth="0.6" opacity="0.9" vectorEffect="non-scaling-stroke" />
                    ))}
                    {/* FULL label set — every zone number 1–60 across the top, every band C–X down the left
                        (MGRS); or degrees at each line (LLV-DMS). Active cell bold gold. */}
                    {coordFmt === "mgrs" && (<>
                      {/* zone numbers 1–60 — dropped BELOW the header button row (flat.y+14%) so they
                          clear the TEXAS CAPITOL/3D/2D/GRID chips. UNIFORM cyan — the active zone is
                          NOT enlarged (that made 58 jump); the only highlight is the yellow intersection. */}
                      {Array.from({ length: 60 }, (_, k) => k).map((k) => {
                        const lonC = -180 + k * 6 + 3, zn = k + 1;
                        return <text key={`zn${k}`} x={xOf(lonC)} y={flat.y + flat.h * 0.14} fontSize="4" fill={C.cyan} opacity="0.6" textAnchor="middle" vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace" }}>{zn}</text>;
                      })}
                      {/* band letters C–X — inset from the left edge (flat.x+3%) clear of the N↑/label HUD;
                          active band gets a violet-bordered pill so the purple label is unmistakable */}
                      {BANDS.split("").map((L, j) => {
                        const latS = -80 + j * 8, latN = j === 19 ? 84 : latS + 8, act = fsel.band === L;
                        const bx = flat.x + flat.w * 0.03, by = yOf((latS + latN) / 2);
                        return (
                          <g key={`bl${j}`}>
                            {act && <rect x={bx - 2} y={by - 6.5} width={11} height={9} rx={1.5} fill="#0a0e14" opacity="0.9" stroke={BAND_VIOLET} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />}
                            <text x={bx} y={by} fontSize={act ? 8 : 5.5} fontWeight="bold" fill={BAND_VIOLET} opacity={act ? 1 : 0.85} textAnchor="start" vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace" }}>{L}</text>
                          </g>
                        );
                      })}
                      {/* CROSS-SECTION address "14R" at the cell centre — SAME format as the 3D
                          globe: all-yellow, dark outline (paintOrder stroke), no box. */}
                      {(() => { const cx = xOf((fsel.lonW + fsel.lonE) / 2), cy = yOf((fsel.latS + fsel.latN) / 2); return (
                        <text key="fzcell" x={cx} y={cy + 2} fontSize="6" fontWeight="bold" fill={TRINITY_COLORS.temporal} textAnchor="middle" dominantBaseline="middle" vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace", paintOrder: "stroke" }} stroke="#0a0e14" strokeWidth="1.4">{fsel.zone}{fsel.band}</text>
                      ); })()}
                    </>)}
                    {coordFmt === "dms" && (<>
                      {meridians.map((lon) => (
                        <text key={`dl${lon}`} x={xOf(lon)} y={flat.y + flat.h * 0.14} fontSize="3.5" fill={C.cyan} opacity="0.6" textAnchor="middle" vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace" }}>{degL(lon, "E", "W")}</text>
                      ))}
                      {parallels.map((lat) => (
                        <text key={`dt${lat}`} x={flat.x + flat.w * 0.03} y={yOf(lat)} fontSize="3.5" fill={C.cyan} opacity="0.6" textAnchor="start" vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace" }}>{degL(lat, "N", "S")}</text>
                      ))}
                    </>)}
                  </g>
                );
              })()}
            </g>
          ))}
          {/* antimeridian (±180°) seam indicator — the wrap line, dashed amber */}
          {[-W, 0, W, 2 * W].map((sx) => (
            <g key={`seam${sx}`} style={{ pointerEvents: "none" }}>
              <line x1={sx} y1="0" x2={sx} y2={H} stroke={C.amber} strokeWidth="0.5" strokeDasharray="3 2" opacity="0.6" vectorEffect="non-scaling-stroke" />
              <text x={sx + 1} y={flat.y + 5} fontSize="3.2" fill={C.amber} opacity="0.8" vectorEffect="non-scaling-stroke" style={{ fontFamily: "monospace" }}>180°</text>
            </g>
          ))}
        </svg>
      )}
      {mode === "flat" && (() => {
        const clat = 90 - ((flat.y + flat.h / 2) / H) * 180;
        const clon = ((((((flat.x + flat.w / 2) / W) * 360 - 180) + 180) % 360) + 360) % 360 - 180;
        const kmW = flat.w * 111.32 * Math.cos((clat * Math.PI) / 180);
        return (
          <>
            {/* centre target reticle — hidden in GRID mode (the GZD crosshair/labels own the centre) */}
            {!showZones && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <svg width="34" height="34" viewBox="-17 -17 34 34" aria-hidden>
                  <circle r="10" fill="none" stroke={C.cyan} strokeWidth="0.8" opacity="0.7" />
                  <line x1="0" y1="-15" x2="0" y2="-4" stroke={C.cyan} strokeWidth="0.8" />
                  <line x1="0" y1="4" x2="0" y2="15" stroke={C.cyan} strokeWidth="0.8" />
                  <line x1="-15" y1="0" x2="-4" y2="0" stroke={C.cyan} strokeWidth="0.8" />
                  <line x1="4" y1="0" x2="15" y2="0" stroke={C.cyan} strokeWidth="0.8" />
                  <circle r="1" fill={C.gold} />
                </svg>
              </div>
            )}
            <span className="pointer-events-none absolute left-2 top-2 z-10 font-mono text-[9px] font-bold" style={{ color: C.red }}>N ↑</span>
            <span className="pointer-events-none absolute right-2 top-2 z-10 font-mono text-[9px] font-semibold" style={{ color: C.cyan }}>
              {geoContext(clat, clon, kmW).join(" · ")}
            </span>
            <span className="pointer-events-none absolute bottom-1 left-2 z-10 font-mono text-[8px]" style={{ color: C.gold }}>
              {latLonToMgrs(clat, clon, 4)} · {kmW >= 1 ? `${kmW.toFixed(kmW >= 10 ? 0 : 1)} km` : `${Math.round(kmW * 1000)} m`} wide
            </span>
            {/* FX-17 (P1.3): graphic SCALE bar bottom-left — both maps carry one */}
            {(() => {
              const nice = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
              const target = kmW / 5;
              const barKm = nice.reduce((p, n) => (Math.abs(n - target) < Math.abs(p - target) ? n : p), nice[0]);
              return (
                <span className="pointer-events-none absolute bottom-8 left-2 z-10 flex flex-col gap-0.5">
                  <span className="font-mono text-[7px]" style={{ color: C.text }}>{barKm >= 1 ? `${barKm} km` : `${barKm * 1000} m`}</span>
                  <span style={{ width: `${Math.min(45, (barKm / kmW) * 100)}vw`, maxWidth: 160, height: 2, background: C.text, opacity: 0.85 }} />
                </span>
              );
            })()}
            {/* F34: at the Natural-Earth data floor — degrade LOUDLY, never a blue screen */}
            {flat.w <= FLAT_MIN_W * 1.05 && (
              <span className="pointer-events-none absolute bottom-5 left-2 z-10 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold" style={{ background: "#0a0f16cc", color: C.amber }}>
                ZOOM FLOOR · NATURAL EARTH 50m — DRILL → AO (▶) for tactical detail
              </span>
            )}
          </>
        );
      })()}
      {label && (
        <span className="pointer-events-none absolute left-2 top-2 z-10 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          {label} · EARTH
        </span>
      )}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        {onEnterAo && (
          <button onClick={() => onEnterAo(aoKey)} title="Enter the tactical Area of Operations (zoom to detail)"
            className="rounded border px-2 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.gold, color: C.gold, background: "#0a0f16cc" }}>
            {AOS.find((a) => a.key === aoKey)?.name.split(" · ")[0] ?? "AO"} ▶
          </button>
        )}
        <div className="flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
          {(["globe", "flat"] as const).map((m) => (
            <button key={m} onClick={() => (m === "flat" ? (() => { const cx = ((center[1] + 180) / 360) * W; setFlat({ x: cx - W / 2, y: H * 0.08, w: W, h: H * 0.62 }); setMode("flat"); })() : (setCenter([90 - ((flat.y + flat.h / 2) / H) * 180, ((((((flat.x + flat.w / 2) / W) * 360 - 180) + 180) % 360) + 360) % 360 - 180]), setMode("globe")))} className="px-2 py-0.5"
              style={{ background: mode === m ? "#152238" : "transparent", color: mode === m ? C.cyan : C.dim }}>
              {m === "globe" ? "3D" : "2D"}
            </button>
          ))}
        </div>
        {/* MGRS/LLV-DMS grid-zone training overlay toggle — world view only (globe + flat) */}
        <button onClick={() => setShowZones((v) => !v)} title={showZones ? "Grid-zone overlay ON — click to hide" : "Show the MGRS / LLV-DMS grid-zone training overlay (14R at Austin)"}
          className="rounded border px-2 py-0.5 text-[9px] font-semibold" style={{ borderColor: showZones ? C.gold : C.border, color: showZones ? C.gold : C.dim, background: "#0a0f16cc" }}>▦ GRID</button>
        {/* order law: LOCATION · 3D/2D · MINIMIZE (last, upper-right) */}
        {onMinimize && (
          <button onClick={onMinimize} title="Minimize — back to standard screen"
            className="flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: C.cyan, color: C.cyan, background: "#0a0f16cc" }}>
            <Minimize2 className="h-3 w-3" /> MINIMIZE
          </button>
        )}
      </div>
      <span className="absolute bottom-1 right-2 z-10 text-[8px]" style={{ color: C.dim }}>
        NATURAL EARTH 50m · SCROLL=ZOOM · 3D-GLOBE ⇄ 2D-FLAT · DRILL → AO
      </span>
    </div>
  );
}

// FX-09 (P1.3, FLUKE/FLIR entry law): numeric field that lets the user CLEAR while
// typing — no forced 0. Commits only finite values; blur restores the canonical value.
// FX-09 (HI 1.3.2): direct numeric entry — NO spinner arrows (type=text + inputMode
// decimal, filtered to digits/dot). Optional LOCK GATE (reusing the padlock iconology of
// the Easter-egg locked cube screens): the field is read-only until the operator taps the
// padlock to unlock, so an alarm threshold can't be nudged by accident.
function NumInField({ value, onCommit, className, style, lockable, lockColor }: { value: number; onCommit: (v: number) => void; className?: string; style?: React.CSSProperties; lockable?: boolean; lockColor?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!lockable);
  const lc = lockColor ?? C.gold;
  const field = (
    <input type="text" inputMode="decimal" value={draft ?? String(value)} readOnly={!unlocked}
      onPointerDown={(e) => e.stopPropagation()}
      onChange={(e) => { const t = e.target.value.replace(/[^0-9.]/g, ""); setDraft(t); const v = parseFloat(t); if (Number.isFinite(v)) onCommit(v); }}
      onBlur={() => setDraft(null)}
      className={className ?? "w-full rounded bg-transparent px-1 py-0.5 text-[9px]"}
      style={{ ...(style ?? { color: C.text }), border: !lockable || unlocked ? `1px solid ${(style?.borderColor as string) ?? C.border}` : "none", pointerEvents: "auto", opacity: !lockable || unlocked ? 1 : 0.75, cursor: !lockable || unlocked ? "text" : "default" }} />
  );
  if (!lockable) return field;
  return (
    <span className="flex items-center gap-0.5">
      <button type="button" onPointerDown={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); setUnlocked((u) => !u); }}
        title={unlocked ? "tap to lock" : "tap to unlock & edit"}
        className="flex shrink-0 items-center rounded-full px-0.5 py-0.5" style={{ background: unlocked ? `${lc}22` : "transparent", border: unlocked ? `1px solid ${lc}` : "none", pointerEvents: "auto" }}>
        {unlocked ? <Unlock className="h-3 w-3" style={{ color: lc }} /> : <Lock className="h-3 w-3" style={{ color: lc, opacity: 0.5 }} />}
      </button>
      {field}
    </span>
  );
}

// ── Mission-support marker glyph — self-contained SVG per canonical group ────
function SupportGlyph({ glyph, color, size = 20 }: { glyph: MarkerGlyph; color: string; size?: number }) {
  const s = { stroke: color, strokeWidth: 1.4, fill: "none", strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const body = (() => {
    switch (glyph) {
      case "supply": return <><rect x="5" y="7" width="14" height="11" rx="1" {...s} /><path d="M5 11h14" {...s} /></>;
      case "fuel": return <><rect x="6" y="5" width="8" height="14" rx="1" {...s} /><path d="M14 9h3v6a2 2 0 0 1-2 2" {...s} /></>;
      case "ammo": return <><rect x="7" y="8" width="10" height="10" {...s} /><path d="M9 8V6h6v2M12 11v4" {...s} /></>;
      case "water": return <path d="M12 4c4 5 5 7 5 10a5 5 0 0 1-10 0c0-3 1-5 5-10z" {...s} />;
      case "medical": return <><rect x="4" y="4" width="16" height="16" rx="2" {...s} /><path d="M12 8v8M8 12h8" {...s} /></>;
      case "medevac": return <><path d="M12 8v8M8 12h8" {...s} /><circle cx="12" cy="12" r="8" {...s} /></>;
      case "aviation": case "lz": return <><circle cx="12" cy="12" r="8" {...s} /><path d="M8 8l8 8M16 8l-8 8" {...s} /></>;
      case "drop": return <><circle cx="12" cy="12" r="7" {...s} strokeDasharray="2 2" /><path d="M12 8v4l3 2" {...s} /></>;
      case "route": return <path d="M5 18c4 0 3-6 7-6s3 6 7 6" {...s} />;
      case "waypoint": return <path d="M12 4l6 8-6 8-6-8z" {...s} />;
      case "checkpoint": return <><path d="M6 5v14" {...s} /><path d="M6 6h9l-2 3 2 3H6" {...s} /></>;
      case "enemy": return <><path d="M12 4l8 8-8 8-8-8z" {...s} /></>;
      case "neutral": return <rect x="5" y="5" width="14" height="14" {...s} />;
      case "unknown": return <path d="M8 6a4 4 0 1 1 4 6v2M12 17v.5" {...s} />;
      case "sof": return <><path d="M12 3l3 6 6 .5-4.5 4 1.5 6-6-3.2-6 3.2 1.5-6L3 9.5 9 9z" {...s} /></>;
      case "sensor": return <><circle cx="12" cy="12" r="2.5" {...s} /><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10" {...s} /></>;
      case "observation": return <><circle cx="12" cy="12" r="3" {...s} /><path d="M3 12c3-4 15-4 18 0-3 4-15 4-18 0z" {...s} /></>;
      case "restricted": return <><circle cx="12" cy="12" r="8" {...s} /><path d="M6.5 6.5l11 11" {...s} /></>;
      case "caution": return <><path d="M12 4l9 15H3z" {...s} /><path d="M12 10v4M12 16.5v.5" {...s} /></>;
      case "shore": return <><path d="M4 15h16" {...s} /><path d="M4 18q4-2 8 0t8 0" {...s} /></>;
      case "port": return <><path d="M12 5v11M8 9l4-4 4 4" {...s} /><path d="M6 13a6 6 0 0 0 12 0" {...s} /></>;
      case "terrain": return <path d="M3 18l5-8 4 5 3-4 6 7z" {...s} />;
      case "guard": return <><circle cx="12" cy="7" r="2.5" {...s} /><path d="M7 19v-3a5 5 0 0 1 10 0v3" {...s} /></>;
      case "squad": return <><circle cx="8" cy="8" r="2" {...s} /><circle cx="16" cy="8" r="2" {...s} /><path d="M4 18v-2a4 4 0 0 1 8 0M12 18v-2a4 4 0 0 1 8 0" {...s} /></>;
      case "k9": return <><path d="M4 16v-4l3-2 2 2h5l3 3v3M4 16h13" {...s} /><path d="M4 12l-1-3 2 1" {...s} /></>;
      case "sniper": return <><circle cx="12" cy="12" r="6" {...s} /><path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 12v.5" {...s} /></>;
      case "personnel": return <><circle cx="12" cy="7" r="2.5" {...s} /><path d="M6 19v-2a6 6 0 0 1 12 0v2" {...s} /></>;
      case "infra": default: return <><rect x="6" y="8" width="12" height="11" {...s} /><path d="M9 8V5h6v3M9 12h2M13 12h2M9 15h2M13 15h2" {...s} /></>;
    }
  })();
  return <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={glyph}>{body}</svg>;
}

interface PlacedSupport {
  id: number; def: SupportObjectDef; fx: number; fy: number; lat: number; lon: number; reality: RealityMode; aff: Affiliation;
  path?: { lat: number; lon: number }[];
}

// 3-dot expand/collapse toggle (matches the command-UX rail toggles).
function Dots3({ onClick, title, horizontal }: { onClick: () => void; title: string; horizontal?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`flex ${horizontal ? "flex-row" : "flex-col"} items-center gap-[3px] rounded p-1 hover:bg-white/10`}>
      {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "#19c8cf" }} />)}
    </button>
  );
}


interface ContourSettings extends ContourOpts {
  enable: boolean; showLand: boolean; showBathy: boolean;
  units: "metric" | "imperial" | "both"; labelMajor: boolean; vExag: number;
  landColor: string; bathyColor: string; thickness: number; bathyThickness: number;
}
// Contour thickness in SCREEN PIXELS (vector-effect: non-scaling-stroke — same px at any
// zoom / pane size). LAW (user 2026-07-09): contour lines must NEVER render thicker than
// state/country border lines → hard cap at BORDER_PX.state, incl. the major-line multiplier.
// Colours come from the shared Trinity SpectrumPicker (one palette source).
const CONTOUR_THICKNESS = [0.5, 0.75, 1] as const;
const BORDER_PX = { country: 1.6, state: 1.2 } as const;   // border lines, screen px
const CONTOUR_MAX_PX = BORDER_PX.state;                    // contours cap below borders
const capContourPx = (px: number) => Math.min(Math.max(0.25, px), CONTOUR_MAX_PX);
const DEFAULT_CONTOURS: ContourSettings = {
  enable: false, count: 6, interval: 0, fidelity: "med", seaLevel: 0,
  showLand: true, showBathy: true, units: "metric", labelMajor: true, vExag: 1,
  landColor: TRINITY_COLORS.intelligence, bathyColor: TRINITY_COLORS.consciousness, thickness: 0.75, bathyThickness: 0.5,
};
const contourLabel = (m: number, units: ContourSettings["units"]) =>
  units === "imperial" ? `${Math.round(m * 3.28084)} ft`
    : units === "both" ? `${Math.round(m)}m·${Math.round(m * 3.28084)}ft`
      : `${Math.round(m)} m`;

// ── Coordinate + distance formatters (settings-driven) ───────────────────────
interface Fmt {
  mgrsAt: (lat: number, lon: number, d?: Digits) => string;
  coordAt: (lat: number, lon: number) => string;
  fmtDist: (m: number) => string;
  fmtElev: (m: number) => string;
}
function makeFormatters(coordFmt: "mgrs" | "dms" | "ucrs", digits: Digits, unit: Unit): Fmt {
  const mgrsAt = (lat: number, lon: number, d: Digits = digits) => latLonToMgrs(lat, lon, d);
  const dms1 = (v: number, pos: string, neg: string) => {
    const h = v >= 0 ? pos : neg, a = Math.abs(v);
    const d = Math.floor(a), m = Math.floor((a - d) * 60);
    const s = ((a - d) * 60 - m) * 60;
    const dec = digits >= 6 ? 3 : digits === 5 ? 2 : 1;
    return `${d}°${String(m).padStart(2, "0")}'${s.toFixed(dec).padStart(dec + 3, "0")}"${h}`;
  };
  const coordAt = (lat: number, lon: number) =>
    coordFmt === "dms" ? `${dms1(lat, "N", "S")} ${dms1(lon, "E", "W")}`
      : coordFmt === "ucrs" ? fmtUcrsDms(lat, lon) // P1.2 (Odin): UCRS-2525 as a settings-level format
      : mgrsAt(lat, lon);
  const metric = unit === "km" || unit === "m";
  const fmtDist = (m: number) =>
    unit === "km" ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 2)} km`
      : unit === "m" ? `${Math.round(m).toLocaleString()} m`
      : unit === "mi" ? `${(m / 1609.34).toFixed(m >= 16093 ? 1 : 2)} mi`
      : `${Math.round(m * 3.28084).toLocaleString()} ft`;
  const fmtElev = (m: number) => (metric ? `${Math.round(m).toLocaleString()} m` : `${Math.round(m * 3.28084).toLocaleString()} ft`);
  return { mgrsAt, coordAt, fmtDist, fmtElev };
}

// ── View state (per pane; or shared when MIRROR is on) ───────────────────────
interface ViewState { lat: number; lon: number; spanKm: number; bearing: number }
const initView = (ao: Ao, factor = 1): ViewState => ({ lat: ao.center[0], lon: ao.center[1], spanKm: ao.halfKm * 2 * factor, bearing: 0 });

// ── One AO map window (MAP or MINI MAP) ──────────────────────────────────────
interface PaneProps {
  label: string;
  ao: Ao;
  iconStyle: IconStyle;
  fmt: Fmt;
  digits: Digits;
  gridOn: boolean;
  elevOn: boolean;
  contourCfg: ContourSettings;
  rangeOn: boolean;
  roadsOn: boolean;
  waterOn: boolean;
  terrainOn: boolean;
  showElevation: boolean;
  cursorMode: "pointer" | "target";
  is3d: boolean;
  onToggle3d: () => void;
  spanFactor: number;
  view: ViewState;
  setView: (u: (v: ViewState) => ViewState) => void;
  otherView?: ViewState;  // the other pane's view → draw its viewport rectangle here
  osm: OsmData | null;
  borders: BorderData | null;
  dem: Dem | null;
  mapEngine: "current" | "beta";   // α (current, square map) vs β (World Disc + prefetch)
  // shared placement state (read on the map surface)
  inventory: InvItem[];
  placed: Placed[];
  placedSupport: PlacedSupport[];
  selected: { kind: "asset" | "support"; id: number } | null;
  selectedAsset: AssetKind | null;
  onDisarm?: () => void; // FX-03: clear the armed placement tool after a placement
  coordFmt?: "mgrs" | "dms" | "ucrs";          // FX-13: current Settings format
  onSetCoordFmt?: (f: "mgrs" | "dms" | "ucrs") => void; // FX-13: packet toggle → Settings
  unit?: Unit;                                 // current distance/altitude unit (km/m/mi/ft)
  onSetUnit?: (u: Unit) => void;               // unit selector callback → Settings
  gridStepM?: number;                          // 0 = AUTO, else fixed grid step in metres
  maxAltFt?: number | null;                    // FX-09b: user max altitude (null = AUTO)
  altRedPct?: number;                           // FX-05: RED threshold as % of ceiling
  altYellowPct?: number;                       // FX-05: YELLOW threshold as % of ceiling
  setAltRedPct?: (v: number) => void;
  setAltYellowPct?: (v: number) => void;
  voxelCellM?: number;                         // FX-10: 0/undefined = AUTO (grid step)
  voxelLimitPct?: number;                      // FX-04: grey voxel-limit extent — % of the altitude rail
  voxelHiColor?: string;                       // FX-07: colour for the primary highlighted voxel
  selectedSupport: SupportObjectDef | null;
  reality: RealityMode;
  hoverAsset: AssetKind | null;
  // shared mutators used when placing on the surface
  setInventory: React.Dispatch<React.SetStateAction<InvItem[]>>;
  setPlaced: React.Dispatch<React.SetStateAction<Placed[]>>;
  setPlacedSupport: React.Dispatch<React.SetStateAction<PlacedSupport[]>>;
  setSelected: (s: { kind: "asset" | "support"; id: number } | null) => void;
  setHoverAsset: React.Dispatch<React.SetStateAction<AssetKind | null>>;
  allocId: () => number;
  // window chrome
  maximized: boolean;
  onToggleMax: () => void;
  onHidePane?: () => void;
  onWorld?: () => void; // zoom out past AO scale → Earth/world view
  mirrorOn?: boolean;          // this pane is the mirror SOURCE (its view drives the other pane)
  onToggleMirror?: () => void; // MIRROR lives on the map header (upper right)
  onOpenSettings?: () => void; // HI 1.3.2: map-local settings gear (icon, right of RESET) — all map + VOXEL settings live here, decoupled from the busy top nav
  settingsOpen?: boolean;      // reflect open state on the gear
  onPitch?: (deg: number) => void; // 3D tilt via right-drag (overhead 15° ⇄ horizon 85°)
  iconScale?: number; // icon size setting S/M/L → 1 / 1.75 / 3 (P2, visibility)
  pitch?: number; // 3D view angle (deg) — FAAD/AMDWS "right-click angles the view to altitude"
  // AO / AOR draw tool
  drawingAo: boolean;
  aoDraft: [number, number][];
  onAoVertex: (lat: number, lon: number) => void;
  drawnAo?: { poly: [number, number][]; aorKm: number };
  // TRACK SIM playback — aircraft dead-reckon along heading+speed; icon rotates in 2D.
  playing?: boolean;
  onTogglePlay?: () => void;
  onResetTracks?: () => void;
}

function AoMapPane(p: PaneProps) {
  const {
    label, ao, iconStyle, fmt, digits, gridOn, elevOn, contourCfg, rangeOn, roadsOn, waterOn, terrainOn, showElevation, cursorMode, is3d, onToggle3d,
    spanFactor, view, setView, otherView, osm, borders, dem, mapEngine, inventory, placed, placedSupport, selected, hoverAsset,
    selectedAsset, selectedSupport, reality, setInventory, setPlaced, setPlacedSupport, setSelected, onDisarm, coordFmt, onSetCoordFmt,
    unit: paneUnit = "km", onSetUnit, gridStepM: gridStepOverride = 0,
    maxAltFt, altRedPct = 90, altYellowPct = 70, setAltRedPct, setAltYellowPct, voxelCellM, voxelLimitPct = 100, voxelHiColor = "#eab308",
    setHoverAsset, allocId, maximized, onToggleMax, onHidePane, onWorld, mirrorOn, onToggleMirror, onOpenSettings, settingsOpen, pitch, onPitch, iconScale = 1,
    drawingAo, aoDraft, onAoVertex, drawnAo, playing = false, onTogglePlay, onResetTracks,
  } = p;

  const clipId = "land" + useId().replace(/[^a-zA-Z0-9]/g, ""); // per-pane land clip (roads must not render in water)
  const [cursorLL, setCursorLL] = useState<{ lat: number; lon: number } | null>(null);
  const [cursorPx, setCursorPx] = useState<{ x: number; y: number } | null>(null);
  const [routeDraft, setRouteDraft] = useState<{ lat: number; lon: number }[]>([]);
  const [elevReveal, setElevReveal] = useState<"high" | "low" | null>(null); // HIGH/LOW coord reveal
  const [showDecode, setShowDecode] = useState(false); // MGRS/DMS mini-lesson popover
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; moved: boolean; btn: number } | null>(null);
  // P1 (SSSES perf): rAF-throttle the tilt/bearing drag — coalesce many pointermove events into
  // ONE state update per animation frame so the geometry doesn't re-render ~120×/s.
  const dragRafRef = useRef<number | null>(null);
  const pendDragRef = useRef({ pitch: 0, bear: 0 });
  const pitchRef = useRef(pitch); pitchRef.current = pitch;
  const bearingMemo = useRef<number | null>(null);
  const touchRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; cx: number; cy: number; ang: number } | null>(null);
  const tapRef = useRef<{ x: number; y: number; moved: boolean } | null>(null); // phone single-finger tap
  // R1: tap empty ground → coordinate CALL-UP packet (MGRS + LLV-DMS + UCRS + elevation)
  const [coordCall, setCoordCall] = useState<{ lat: number; lon: number } | null>(null);

  // Overscan: the inner canvas is RENDER× the pane per axis, so rotation (bearing)
  // and 2D↔3D tilt NEVER expose black around the map (P1, user law 2026-07-09).
  // A 2.6× buffer keeps a w:h up to ~2.4 (fullscreen-wide) fully covered at any
  // bearing: inscribed radius 1.3·min(w,h) ≥ half-diagonal. Isotropic → all
  // toFrac/containerToLatLon math is unchanged.
  const RENDER = 2.6;
  const OFF = (RENDER - 1) / 2;
  // Container pixel aspect (W/H). The SVG stretches a 100×100 viewBox to fill the
  // container (preserveAspectRatio=none), so the geographic box's km-aspect MUST
  // match the pixel-aspect or the map distorts (Texas stretches, circular lakes → ovals).
  const [aspect, setAspect] = useState(1.6);
  useEffect(() => {
    const el = mapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); if (r.height > 0) setAspect(r.width / r.height); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const box = useMemo(() => {
    // view.spanKm = E-W (horizontal) span in km; N-S derived from the container aspect.
    const lonHalfKm = (view.spanKm * RENDER) / 2;
    const latHalfKm = lonHalfKm / Math.max(0.2, aspect);
    const dLat = latHalfKm / 110.574;
    const dLon = lonHalfKm / (111.32 * Math.cos((view.lat * Math.PI) / 180));
    return { latMin: view.lat - dLat, latMax: view.lat + dLat, lonMin: view.lon - dLon, lonMax: view.lon + dLon };
  }, [view.lat, view.lon, view.spanKm, aspect]);
  const grid = useMemo(
    () => utmKmGrid(box.latMin, box.latMax, box.lonMin, box.lonMax, gridStepOverride > 0 ? gridStepOverride : chooseGridStep(view.spanKm * 1000)),
    [box, view.spanKm, gridStepOverride]
  );
  const boxW = (box.lonMax - box.lonMin) * 111320 * Math.cos((ao.center[0] * Math.PI) / 180);

  const toLatLon = (fx: number, fy: number) => ({
    lat: box.latMax - fy * (box.latMax - box.latMin),
    lon: box.lonMin + fx * (box.lonMax - box.lonMin),
  });
  const toFrac = (lat: number, lon: number) => ({
    fx: (lon - box.lonMin) / (box.lonMax - box.lonMin),
    fy: (box.latMax - lat) / (box.latMax - box.latMin),
  });
  const rotC = (b: number, inv = false) => { const a = inv ? -b : b; return [Math.sin(a), Math.cos(a)] as const; };
  const rotAround = (x: number, y: number, s: number, c: number) => [0.5 + (x - 0.5) * c - (y - 0.5) * s, 0.5 + (x - 0.5) * s + (y - 0.5) * c] as const;
  // FX-01 (P1.3): rotate overlays in PIXEL space (aspect-corrected). The plane layer
  // CSS-rotates in pixels; fraction-space rotation drifted cities/assets on wide panes.
  const project = (lat: number, lon: number) => {
    const f = toFrac(lat, lon);
    const px = f.fx * RENDER - OFF, py = f.fy * RENDER - OFF;
    const [s, c] = rotC(view.bearing);
    const a = Math.max(0.2, aspect);
    const X = (px - 0.5) * a, Y = py - 0.5;
    return { fx: 0.5 + (X * c - Y * s) / a, fy: 0.5 + (X * s + Y * c) };
  };
  const containerToLatLon = (cfx: number, cfy: number) => {
    const [s, c] = rotC(view.bearing, true);
    const a = Math.max(0.2, aspect);
    const X = (cfx - 0.5) * a, Y = cfy - 0.5;
    const px = 0.5 + (X * c - Y * s) / a, py = 0.5 + (X * s + Y * c);
    return toLatLon((px + OFF) / RENDER, (py + OFF) / RENDER);
  };
  const mFrac = (refLat: number, refLon: number, east: number, north: number) => {
    const lat = refLat + north / 110574;
    const lon = refLon + east / (111320 * Math.cos((refLat * Math.PI) / 180));
    return toFrac(lat, lon);
  };
  const bldFrac = (b: Building, east: number, north: number) => mFrac(b.ref[0], b.ref[1], east, north);

  const fracFromEvent = (e: { clientX: number; clientY: number }) => {
    const r = mapRef.current?.getBoundingClientRect();
    if (!r) return null;
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
    return { fx, fy };
  };
  useWheel(mapRef, (e) => {
    e.preventDefault();
    // zoom out past continental scale → hand off to the Earth/world view (continuum)
    if (e.deltaY > 0 && shouldHandOffToWorld(view.spanKm) && onWorld) { onWorld(); return; }
    // CONTINUOUS zoom — factor proportional to wheel delta (trackpads glide, a mouse
    // notch ≈ the old ZOOM_FACTOR step) and ANCHORED AT THE CURSOR: the geographic
    // point under the pointer stays put (c_new = lerp(p_cursor, c_old, factor)).
    const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 300 : 1);
    const f = Math.exp(Math.max(-0.5, Math.min(0.5, dy * 0.0014)));
    const frac = fracFromEvent(e);
    const p = frac ? containerToLatLon(frac.fx, frac.fy) : null;
    setView((v) => {
      const spanKm = Math.min(MAX_SPAN_KM, Math.max(MIN_SPAN_KM, v.spanKm * f));
      const ff = spanKm / v.spanKm; // factor actually applied after clamping
      if (!p || ff === 1) return { ...v, spanKm };
      return { ...v, spanKm, lat: p.lat + (v.lat - p.lat) * ff, lon: p.lon + (v.lon - p.lon) * ff };
    });
  });

  const routeMode = !!selectedSupport && (selectedSupport.geometry === "line" || selectedSupport.geometry === "corridor");
  const armed = selectedAsset || selectedSupport;

  const panBy = (sdx: number, sdy: number) => setView((v) => {
    const [s, c] = [Math.sin(-v.bearing), Math.cos(-v.bearing)];
    const wdx = sdx * c - sdy * s, wdy = sdx * s + sdy * c;
    const lonHalfKm = v.spanKm / 2, latHalfKm = lonHalfKm / Math.max(0.2, aspect); // match box aspect
    const dLat = latHalfKm / 110.574, dLon = lonHalfKm / (111.32 * Math.cos((v.lat * Math.PI) / 180));
    return { ...v, lat: v.lat + wdy * (2 * dLat), lon: v.lon - wdx * (2 * dLon) };
  });

  const place = (asset: AssetKind, fx: number, fy: number) => {
    const item = inventory.find((i) => i.asset === asset);
    if (!item || item.stock < item.group) return;
    const { lat, lon } = containerToLatLon(fx, fy);
    setInventory((inv) => inv.map((i) => (i.asset === asset ? { ...i, stock: i.stock - i.group } : i)));
    const half = AD_HALF[asset];
    const tls = half ? { p: { brg: 0, left: half, right: half } } : undefined;
    const fov = asset === "sentinel" ? { brg: 0, left: 45, right: 45 } : undefined;
    const angUnit: AngleUnit = asset === "sentinel" ? "mil" : "deg";
    const id = allocId();
    setPlaced((pl) => [...pl, {
      id, asset, count: item.group, fx, fy, lat, lon, mgrs10: latLonToMgrs(lat, lon, 5), aff: "friendly", tls, fov, unit: angUnit,
    }]);
    // FX-03 (P1.3 round 3, HI): placing a unit DISARMS the tool — one placement
    // per palette pick, straight back to SELECT mode with the new unit selected
    // (in 3D its VOXEL·CUBE auto-shows via the voxel-on-select effect).
    setSelected({ kind: "asset", id });
    onDisarm?.();
  };
  const placeSupport = (def: SupportObjectDef, fx: number, fy: number) => {
    const { lat, lon } = containerToLatLon(fx, fy);
    setPlacedSupport((pl) => [...pl, { id: allocId(), def, fx, fy, lat, lon, reality, aff: "friendly" }]);
  };
  const commitRoute = (def: SupportObjectDef, path: { lat: number; lon: number }[]) => {
    const f = toFrac(path[0].lat, path[0].lon);
    setPlacedSupport((pl) => [...pl, { id: allocId(), def, fx: f.fx, fy: f.fy, lat: path[0].lat, lon: path[0].lon, reality, aff: "friendly", path }]);
  };
  const dropAt = (payload: string, fx: number, fy: number) => {
    if (payload.startsWith("support:")) {
      const def = SUPPORT_CATALOG.find((d) => d.key === payload.slice(8));
      if (def) placeSupport(def, fx, fy);
    } else if (payload) {
      place(payload as AssetKind, fx, fy);
    }
  };
  // Pointer handlers — LEFT pan / RIGHT rotate; touch pan + pinch.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 0) setHooks([]); // left-click anywhere releases ALL cursor hooks
    if (e.pointerType === "touch") {
      touchRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      // single-finger TAP tracking (phone: tap empty ground → coordinate call-up)
      tapRef.current = touchRef.current.size === 1 ? { x: e.clientX, y: e.clientY, moved: false } : null;
      if (touchRef.current.size === 2) {
        const [a, b] = Array.from(touchRef.current.values());
        pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) };
      }
      return;
    }
    if (e.button !== 0 && e.button !== 2) return;
    if (routeMode && e.button === 2) return;
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false, btn: e.button };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      const prev = touchRef.current.get(e.pointerId);
      if (!prev) return;
      const r = mapRef.current?.getBoundingClientRect();
      touchRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchRef.current.size >= 2 && pinchRef.current && r) {
        // Google-Maps-style: pinch = zoom, twist = rotate bearing (2D + 3D), together.
        const [a, b] = Array.from(touchRef.current.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const factor = pinchRef.current.dist / Math.max(1, dist);
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        let dAng = ang - pinchRef.current.ang;
        if (dAng > Math.PI) dAng -= 2 * Math.PI; else if (dAng < -Math.PI) dAng += 2 * Math.PI;
        // FX-19 (P1.3): phone 3D TILT — two-finger vertical drag moves the pinch midpoint,
        // driving pitch exactly like the mouse right-drag (2°–88°), alongside zoom + twist.
        const ncy = (a.y + b.y) / 2;
        const dcy = ncy - pinchRef.current.cy;
        pinchRef.current.cy = ncy; pinchRef.current.cx = (a.x + b.x) / 2;
        if (is3d && onPitch && Math.abs(dcy) > 0.5) onPitch(Math.min(88, Math.max(11, (pitch ?? 55) + dcy * 0.25)));
        pinchRef.current.dist = dist; pinchRef.current.ang = ang;
        setView((v) => ({ ...v, spanKm: Math.min(MAX_SPAN_KM, Math.max(MIN_SPAN_KM, v.spanKm * factor)), bearing: v.bearing + dAng }));
      } else if (touchRef.current.size === 1 && r) {
        if (tapRef.current && Math.hypot(e.clientX - tapRef.current.x, e.clientY - tapRef.current.y) > 10) tapRef.current.moved = true;
        panBy((e.clientX - prev.x) / r.width, (e.clientY - prev.y) / r.height);
      }
      return;
    }
    const r = mapRef.current?.getBoundingClientRect();
    if (r) setCursorPx({ x: e.clientX - r.left, y: e.clientY - r.top });
    const f = fracFromEvent(e);
    if (f) setCursorLL(containerToLatLon(f.fx, f.fy));
    const d = dragRef.current;
    if (!d || !r) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    d.x = e.clientX; d.y = e.clientY;
    if (d.btn === 2) {
      // right-drag: horizontal = bearing; vertical in 3D = TILT (R1: swing the voxel
      // view from near-OVERHEAD 11° down to almost flat across the HORIZON 88°).
      // P1.3 round 3 (HI): 85→88 — the sky-line artifact is gone because the relief
      // lift now fades to flat above 85°, and the compass WALL owns the horizon.
      // P1: accumulate deltas + apply ONCE per animation frame (was per pointermove ~120×/s).
      pendDragRef.current.pitch += dy * 0.35;
      pendDragRef.current.bear += -(dx / r.width) * Math.PI;
      if (dragRafRef.current == null) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          const dp = pendDragRef.current.pitch, db = pendDragRef.current.bear;
          pendDragRef.current.pitch = 0; pendDragRef.current.bear = 0;
          if (is3d && onPitch && dp) onPitch(Math.min(88, Math.max(11, (pitchRef.current ?? 55) + dp)));
          if (db) setView((v) => ({ ...v, bearing: v.bearing + db }));
        });
      }
    } else {
      panBy(dx / r.width, dy / r.height);
    }
  };
  const resolveTap = (clientX: number, clientY: number, button = 0) => {
    const f = fracFromEvent({ clientX, clientY });
    if (!f) return;
    // In 3D the surface is perspective-tilted, so click→coordinate is not exact:
    // 3D is a visualization mode; deselect only, place in 2D.
    if (is3d) { if (selected) setSelected(null); return; }
    const { lat, lon } = containerToLatLon(f.fx, f.fy);
    if (drawingAo) { onAoVertex(lat, lon); return; } // AO draw mode → append vertex
    if (routeMode && selectedSupport) {
      if (button === 2) {
        setRouteDraft((pr) => [...pr, { lat, lon }]);
      } else {
        const pts = [...routeDraft, { lat, lon }];
        if (pts.length >= 2) commitRoute(selectedSupport, pts);
        setRouteDraft([]);
      }
      return;
    }
    // FX-02 (P1.3): only the LEFT button places or calls up — right stays rotate/tilt
    if (selectedAsset) { if (button === 0) place(selectedAsset, f.fx, f.fy); }
    else if (selectedSupport) { if (button === 0) placeSupport(selectedSupport, f.fx, f.fy); }
    else if (selected) setSelected(null);
    // R1: tap EMPTY ground (nothing armed/selected) → CALL UP the coordinate packet
    // (phones have no hover cursor — this is their coordinate read)
    else if (button === 0) setCoordCall({ lat, lon });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      const tap = tapRef.current;
      touchRef.current.delete(e.pointerId);
      if (touchRef.current.size < 2) pinchRef.current = null;
      // single-finger tap (no pinch, no pan) → same resolution as a mouse click
      if (tap && !tap.moved && touchRef.current.size === 0) resolveTap(e.clientX, e.clientY);
      tapRef.current = null;
      return;
    }
    const d = dragRef.current;
    dragRef.current = null;
    if (d?.moved) return;
    resolveTap(e.clientX, e.clientY, e.button);
  };

  // Reset the draft + coordinate call-up when the AO changes.
  useEffect(() => { setRouteDraft([]); setCoordCall(null); }, [ao.key]);
  // CURSOR HOOK (P1.3 round 3, HI / FAAD C2 procedure): right-click over a track
  // "hooks" it — IFF + speed/altitude/heading data + engagement tools at the plot.
  // FX-51 v2 (HI): MULTIPLE hooks — right-click each track adds its own label.
  const [hooks, setHooks] = useState<number[]>([]); // ids of every hooked track
  const [hookOffs, setHookOffs] = useState<Record<number, { x: number; y: number }>>({}); // PER-ID draggable hook-label offset (px from the asset); connector always follows
  // HI 1.3.3 (voxel column owns the asset UI): PER-ASSET draggable offset for the AGL
  // chip that lives in the column's LEVEL-1 bottom cell. Same drag pattern as hookOffs,
  // but a SEPARATE map so dragging the AGL chip never moves the FAAD hook panel. No connector.
  const [aglOffs, setAglOffs] = useState<Record<number, { x: number; y: number }>>({});
  const hookDrag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  // P1.3 (Thought Master): ESC leaves placement mode → traditional SELECT mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { onDisarm?.(); setRouteDraft([]); setHooks([]); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Escape clears the in-progress route on this pane.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setRouteDraft([]); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // OSM roads/water culled to view.
  const osmPaths = useMemo(() => {
    if (!osm) return null;
    const inView = (bb: [number, number, number, number]) =>
      !(bb[2] < box.lonMin || bb[0] > box.lonMax || bb[3] < box.latMin || bb[1] > box.latMax);
    const wayD = (pts: [number, number][]) =>
      pts.map(([lon, lat], i) => { const f = toFrac(lat, lon); return `${i ? "L" : "M"}${(f.fx * 100).toFixed(2)} ${(f.fy * 100).toFixed(2)}`; }).join(" ");
    const tiers: Record<number, string> = { 2: "", 3: "", 4: "" };
    for (const w of osm.roads) { if (w.bb && !inView(w.bb)) continue; tiers[w.t] += " " + wayD(w.p); }
    let waterD = ""; for (const l of osm.water) waterD += " " + wayD(l);
    let polyD = ""; for (const poly of osm.waterPolys) polyD += " " + wayD(poly) + "Z";
    return { tiers, waterD, polyD };
  }, [osm, box]);

  // Per-ring bounding boxes for the borders — computed once when the data loads so
  // pan/zoom can cull off-view rings cheaply (never rebuild an off-screen path string).
  const borderBB = useMemo(() => {
    if (!borders) return null;
    const bbOf = (rings: [number, number][][]) => rings.map((r) => {
      let x0 = r[0][0], x1 = x0, y0 = r[0][1], y1 = y0;
      for (const [lon, lat] of r) { if (lon < x0) x0 = lon; if (lon > x1) x1 = lon; if (lat < y0) y0 = lat; if (lat > y1) y1 = lat; }
      return [x0, y0, x1, y1] as [number, number, number, number];
    });
    return { countries: bbOf(borders.countries), states: bbOf(borders.usStates) };
  }, [borders]);

  // Country + US-state borders (= continent/country/state lines), projected into the view
  // and bbox-culled. Shown on BOTH MAP and MINI MAP so zooming out reveals states,
  // coastlines and national boundaries layered under the OSM road/water detail.
  const borderPaths = useMemo(() => {
    if (!borders || !borderBB) return null;
    const inView = (bb: [number, number, number, number]) =>
      !(bb[2] < box.lonMin || bb[0] > box.lonMax || bb[3] < box.latMin || bb[1] > box.latMax);
    const ringD = (ring: [number, number][]) =>
      ring.map(([lon, lat], i) => { const f = toFrac(lat, lon); return `${i ? "L" : "M"}${(f.fx * 100).toFixed(2)} ${(f.fy * 100).toFixed(2)}`; }).join(" ");
    const build = (rings: [number, number][][], bbs: [number, number, number, number][]) => {
      let d = "";
      for (let i = 0; i < rings.length; i++) if (inView(bbs[i])) d += " " + ringD(rings[i]);
      return d;
    };
    return { countries: build(borders.countries, borderBB.countries), states: build(borders.usStates, borderBB.states) };
  }, [borders, borderBB, box]);

  // Real DEM sampler when a GEBCO tile covers the view, else synthetic fallback.
  const sampler = useMemo(() => (dem ? makeDemSampler(dem) : terrainMSL), [dem]);
  // 3D VOXEL MODE — coordinate-addressed cube stacks (Vision-2525 law). Columns snap to
  // the visible UTM grid step; every cube BASE = MGRS + LLV-DMS + UCRS-2525; Z = band.
  // Reads the SAME 1-fetch DEM sampler as the contours — zero extra network.
  const [voxelSel, setVoxelSel] = useState<string | null>(null);
  const [thrEdit, setThrEdit] = useState<"r" | "y" | "g" | null>(null);
  const [thrMode, setThrMode] = useState<"%" | "abs">("%");
  const [elevRef, setElevRef] = useState<"MSL" | "AGL">("MSL");
  const fmtAlt = (altM: number, srcRef: "AGL" | "MSL", lat: number, lon: number) => {
    const terrM = sampler(lat, lon);
    const msl = srcRef === "MSL" ? altM : terrM + altM;
    const agl = srcRef === "AGL" ? altM : altM - terrM;
    const val = elevRef === "MSL" ? msl : agl;
    return `${Math.round(val).toLocaleString()}m ${elevRef}`;
  };
  const [voxelLayer, setVoxelLayer] = useState(true); // FX-30 (HI): standalone 3×3 voxel LATTICE, independent of assets, ON by default
  const [voxelSize, setVoxelSize] = useState<3 | 2 | 1>(3); // FX (HI 1.3.3): box size tier — 3X (full) · 2X (⅔) · 1X (⅓); altitude projectors always reach the grey-line altitude
  const [domeMode, setDomeMode] = useState<"grid" | "hex">("grid"); // UCRS-2525 sky dome style — globe GRID lines vs HEX panels (3rd style TBD)
  const [domeThick, setDomeThick] = useState(1.6);                   // dome line thickness (dome settings ▲ cone icon)
  // UCRS-2525 celestial clock — sun/moon on the dome. Set post-mount (avoids SSR hydration
  // mismatch on new Date()), ticks each minute so the arcs stay current.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const [domeSettingsOpen, setDomeSettingsOpen] = useState(false);   // dome settings popover open
  const [domeOn, setDomeOn] = useState(false);                       // HI: sky dome only renders when its ▲ setting is highlighted (default OFF = lightest render)
  const [voxelTop, setVoxelTop] = useState<string | null>(null); // FX-30: hovered column TOP face (pick a stack by its top)
  // P1.2 (Odin): corner HOVER chip — corner coordinate + terrain elevation at the cursor
  const [cornerHover, setCornerHover] = useState<{ key: string; ci: number } | null>(null);
  const [tiltSlider, setTiltSlider] = useState(false); // FX-21: 📱 tilt slider (phone access)
  // FX-10 (HI 1.3.2): AUTO voxel cell = SCREEN-PROPORTIONAL reticle, not the UTM grid
  // step. The 3×3 lattice spans 1/3 of the pane (each cell = 1/9 screen width) and is
  // centred on the map — the nested eXeL cube metaphor (screen 3×3 → middle cube → its
  // own 3×3 voxel) reading like a digital-weapon / thermal target. Fixed sizes (10 m /
  // 100 m / 1 km, default 1 km) snap to real-world metres instead.
  // FX-10 (HI 1.3.2): AUTO voxel 3×3 must fit INSIDE the middle cell of the screen's own
  // 3×3 (the yellow reference cube) = 1/3 of screen width. The 3D layer magnifies by
  // scale(1.2) × perspective (~1.3 near-overhead ≈ 1.55 total), so a naive span/9 rendered
  // ~1.55× too big. Divide by 14 (= 9 × 1.55) so each cell ≈ paneW/9 ON SCREEN and the 3×3
  // group ≈ paneW/3 — the thermal-target reticle the operator asked for.
  const autoCellM = Math.max(10, Math.round((view.spanKm * 1000) / 14));
  const effCellM = voxelCellM && voxelCellM > 0 ? voxelCellM : autoCellM;
  const voxelColumns = useMemo(() => {
    if (!is3d) return [];
    // P1.3 round 3 (HI: "have you fixed 3D VOXEL CUBE to show?"): EVERY placed unit
    // gets a cube — no altitude set = SURFACE band cube at terrain level (0 m AGL),
    // so select-after-place always has a voxel to activate.
    const objs = placed.map((u) => ({
      id: u.id, lat: u.lat, lon: u.lon, altM: u.altitude ?? 0, altRef: (u.altRef ?? "AGL") as "AGL" | "MSL",
      label: ASSET_LABELS[u.asset], color: u.aff === "hostile" ? C.red : C.cyan,
    }));
    return objs.length ? buildVoxelColumns(objs, sampler, effCellM) : [];
    // (voxel-on-select effect lives right below — needs this memo declared first)
  }, [is3d, placed, sampler, effCellM]);
  // FX-30 (HI): standalone VOXEL LATTICE — a 3×3 block of full-height stacked columns
  // centred on the view, existing WITHOUT any placed asset so you can read + click a
  // whole altitude column. Same DEM sampler + cell grid → zero extra fetch, cubes align.
  const latticeColumns = useMemo(() => {
    if (!is3d || !voxelLayer) return [];
    // HI 1.3.3: centre the 3×3 on the VIEW centre (the middle of the map) so it always sits
    // in the centre square facing north — not the AO box centre (which drifts when panned).
    return buildLatticeColumns(view.lat, view.lon, sampler, effCellM, 3);
  }, [is3d, voxelLayer, view.lat, view.lon, sampler, effCellM]);
  // asset columns win over a lattice cell at the same physical square (occupied cubes)
  const shownColumns = useMemo(() => {
    const seen = new Set(voxelColumns.map((c) => `${c.cellM}:${c.mgrs}`));
    return [...voxelColumns, ...latticeColumns.filter((c) => !seen.has(`${c.cellM}:${c.mgrs}`))];
  }, [voxelColumns, latticeColumns]);
  // P1.3 round 4 (HI): VOXEL is now DOUBLE-CLICK driven, not select-driven — a single
  // left-click just SELECTS (inspector + hookable), a DOUBLE left-click reveals the
  // unit's VOXEL·CUBE in 3D (see onDoubleClick on the asset button). Helper below.
  const showVoxelFor = useCallback((id: number) => {
    const col = voxelColumns.find((c) => c.objects.some((o) => o.id === id));
    if (col) setVoxelSel(col.key);
  }, [voxelColumns]);
  // P1.3 (Thought Master): the rail's NEGATIVE band exists only when the view holds
  // water — scaled to the DEEPEST source in view (coarse 9×9 sample of the same DEM).
  const minElevM = useMemo(() => {
    if (!is3d) return 0;
    let m = 0;
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
      m = Math.min(m, sampler(box.latMin + ((box.latMax - box.latMin) * i) / 8, box.lonMin + ((box.lonMax - box.lonMin) * j) / 8));
    }
    return m;
  }, [is3d, box, sampler]);
  // Topographic contours (memoized on box + settings + DEM; real elevation + ocean floor).
  const contourSet = useMemo(
    () => (contourCfg.enable ? computeContours(box, contourCfg, sampler) : null),
    [box, contourCfg, sampler]
  );
  // 3D RELIEF (R1 feedback: "lift the elevation profile — connect it to data"). Each
  // contour line rises to its true level via translateZ → wireframe DEPTH from the SAME
  // 1-fetch DEM. STRICTLY gated on the user's ELEVATION CONTOURS toggle — NO default
  // fallback set. Bug fix (HI P1.3, 2026-07-09): the old `?? computeContours(…count:7)`
  // fallback drew phantom green contour lines across the terrain even when contours AND
  // elevation profiles were both OFF. Contours off ⇒ contourSet null ⇒ reliefSet null ⇒
  // clean 3D terrain. Turn ELEVATION CONTOURS on to get the lifted wireframe relief.
  const reliefSet = useMemo(
    () => (is3d ? contourSet : null),
    [is3d, contourSet]
  );

  // Elevation profiles (primary pane only — skipped entirely on panes without the scale).
  const elevProfile = useMemo(() => {
    if (!showElevation) return null;
    const N = 64;
    const lonAt = (i: number) => box.lonMin + (i / (N - 1)) * (box.lonMax - box.lonMin);
    const latAt = (i: number) => box.latMax - (i / (N - 1)) * (box.latMax - box.latMin);
    // Elevation profiles are LAND elevation only — floor at MSL so ocean/Gulf reads flat (0), not negative.
    const landElev = (lat: number, lon: number) => Math.max(0, sampler(lat, lon));
    const sampleRow = (lat: number) => Array.from({ length: N }, (_, i) => landElev(lat, lonAt(i)));
    const sampleCol = (lon: number) => Array.from({ length: N }, (_, i) => landElev(latAt(i), lon));
    const front = sampleRow((box.latMin + box.latMax) / 2);
    const col = sampleCol((box.lonMin + box.lonMax) / 2);
    const all = [...front, ...col];
    const min = Math.min(...all), max = Math.max(...all), rng = Math.max(1, max - min);
    const y = (e: number) => 38 - ((e - min) / rng) * 34;
    const line = (arr: number[]) =>
      arr.map((e, i) => `${i ? "L" : "M"}${((i / (N - 1)) * 100).toFixed(2)} ${y(e).toFixed(2)}`).join("");
    // Single W→E profile (one colour, mirrors the vertical N→S scale) — no stacked rows.
    const frontFill = `${line(front)} L100 40 L0 40 Z`;
    const rx = (e: number) => 4 + ((e - min) / rng) * 32;
    const rightPath =
      col.map((e, i) => `${i ? "L" : "M"}${rx(e).toFixed(2)} ${((i / (N - 1)) * 100).toFixed(2)}`).join("") +
      " L4 100 L4 0 Z";
    let hi = 0, lo = 0;
    front.forEach((e, i) => { if (e > front[hi]) hi = i; if (e < front[lo]) lo = i; });
    const mark = (i: number) => ({ x: (i / (N - 1)) * 100, yy: y(front[i]), e: front[i], lat: (box.latMin + box.latMax) / 2, lon: lonAt(i) });
    // Column (N→S) high/low for the right vertical scale.
    let chi = 0, clo = 0;
    col.forEach((e, i) => { if (e > col[chi]) chi = i; if (e < col[clo]) clo = i; });
    const cmark = (i: number) => ({ yv: (i / (N - 1)) * 100, xv: rx(col[i]), e: col[i], lat: latAt(i), lon: (box.lonMin + box.lonMax) / 2 });
    return { min, max, rng, frontFill, rightPath, y, high: mark(hi), low: mark(lo), colHigh: cmark(chi), colLow: cmark(clo) };
  }, [box, showElevation, sampler]);

  const resetView = () => setView(() => initView(ao, spanFactor));
  const breadcrumb = geoContext(view.lat, view.lon, view.spanKm);


  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border shadow-xl" style={{ background: C.panel, borderColor: C.border }}>
      {/* pane header */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b px-2 py-1 [&>*]:shrink-0" style={{ borderColor: C.border }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          {label} · {ao.name.split(" · ")[0]} <span style={{ color: C.dim }}>· {fmt.fmtDist(view.spanKm * 1000)}</span>
        </span>
        <div className="flex items-center gap-1.5 text-[9px] [&>*]:shrink-0" style={{ color: C.dim }}>
          {/* order law: LOCATION (EARTH) · 2D/3D · RESET · MINIMIZE last (upper-right) */}
          {onWorld && (
            <button onClick={onWorld} title="Zoom out to Earth / world view" className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: C.gold, color: C.gold }}>🌍 EARTH</button>
          )}
          {/* 2D (top-down) ⇄ 3D (perspective terrain) — on every map, same format */}
          <div className="flex overflow-hidden rounded border font-semibold" style={{ borderColor: C.border }}>
            {([[false, "2D"], [true, "3D"]] as const).map(([v, lb]) => (
              <button key={lb} onClick={() => { if (is3d !== v) onToggle3d(); }} className="px-1.5 py-0.5"
                style={{ background: is3d === v ? "#152238" : "transparent", color: is3d === v ? C.cyan : C.dim }}>{lb}</button>
            ))}
          </div>
          {/* TRACK SIM — PLAY/PAUSE + RESET. 2D only (aircraft icons rotate to heading on playback);
              shown only when at least one asset has an active heading+speed track. */}
          {!is3d && onTogglePlay && placed.some((u) => u.moving && u.heading != null && u.speed) && (
            <>
              <button onClick={onTogglePlay} title={playing ? "Pause track simulation" : "Play track simulation — aircraft dead-reckon along heading + speed, icons rotate to track"}
                className="flex items-center gap-1 rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: playing ? C.green : C.gold, color: playing ? C.green : C.gold }}>
                {playing ? "❚❚ TRACKS" : "▶ TRACKS"}
              </button>
              {onResetTracks && (
                <button onClick={onResetTracks} title="Reset tracks to their start positions"
                  className="flex items-center rounded border px-1 py-0.5" style={{ borderColor: C.border, color: C.dim }}><RotateCcw className="h-3 w-3" /></button>
              )}
            </>
          )}
          {/* FX-30 (HI): VOXEL lattice ON/OFF — a 3×3 stacked-cube column grid, shown only in 3D */}
          {is3d && (
            <button onClick={() => setVoxelLayer((v) => !v)} title={voxelLayer ? "VOXEL lattice ON — 3×3 stacked columns (tap a top to highlight). Click to hide." : "Show the 3×3 VOXEL lattice"}
              className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: voxelLayer ? C.gold : C.border, color: voxelLayer ? C.gold : C.dim }}>▦ VOXEL</button>
          )}
          {/* FX (HI 1.3.3): VOXEL box SIZE tier — 3X full · 2X ⅔ · 1X ⅓ (projectors still reach the grey altitude) */}
          {is3d && voxelLayer && (
            <div className="flex overflow-hidden rounded border font-semibold" style={{ borderColor: C.border }}>
              {([3, 2, 1] as const).map((s) => (
                <button key={s} onClick={() => setVoxelSize(s)} className="px-1 py-0.5"
                  style={{ background: voxelSize === s ? "#152238" : "transparent", color: voxelSize === s ? C.cyan : C.dim }}>{s}X</button>
              ))}
            </div>
          )}
          {/* UCRS-2525 sky-dome settings — ▲ cone icon (style + line thickness), before the gear */}
          {is3d && (
            <div className="relative">
              {/* ▲ dome toggle — highlighted = sky dome ON (default OFF, lightest render). Click toggles
                  the dome; when ON its GRID/HEX + thickness popover opens. */}
              <button onClick={() => setDomeOn((o) => { const n = !o; setDomeSettingsOpen(n); return n; })}
                title={domeOn ? "Sky dome ON — click to hide (and its GRID/HEX + thickness settings)" : "Turn ON the UCRS-2525 sky dome + settings (GRID/HEX, line thickness)"}
                className="flex items-center rounded border px-1.5 py-0.5" style={{ borderColor: domeOn ? C.cyan : C.border, color: domeOn ? C.cyan : C.dim }}>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-label="Dome toggle">
                  <path d="M1 9.5 A 5 4.6 0 0 1 11 9.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="1" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M3.4 9.5 A 2.6 3.4 0 0 1 8.6 9.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                </svg>
              </button>
              {domeOn && domeSettingsOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded border p-2 text-left" style={{ background: "#0a0f16", borderColor: C.border, boxShadow: "0 4px 18px rgba(0,0,0,.6)" }}>
                  <div className="mb-1 text-[9px] font-bold tracking-wider" style={{ color: C.cyan }}>SKY DOME (UCRS-2525)</div>
                  <div className="mb-1.5 flex gap-1">
                    {(["grid", "hex"] as const).map((d) => (
                      <button key={d} onClick={() => setDomeMode(d)} className="flex-1 rounded border px-1 py-0.5 text-[9px] font-semibold uppercase"
                        style={{ borderColor: domeMode === d ? C.cyan : C.border, color: domeMode === d ? C.cyan : C.dim }}>{d}</button>
                    ))}
                  </div>
                  <div className="mb-0.5 flex items-center justify-between text-[8px]" style={{ color: C.dim }}><span>Line thickness</span><span style={{ color: C.cyan }}>{domeThick.toFixed(1)}px</span></div>
                  <input type="range" min={0.6} max={4} step={0.2} value={domeThick} onChange={(e) => setDomeThick(parseFloat(e.target.value))} className="w-full" style={{ accentColor: C.cyan }} />
                </div>
              )}
            </div>
          )}
          {onToggleMirror && (
            <button onClick={onToggleMirror} title={mirrorOn ? "Unmirror — the other map returns to its prior view" : "Mirror THIS view onto the other map (each map keeps its own 2D/3D)"}
              className="flex items-center gap-0.5 rounded border px-1 py-0.5 font-semibold" style={{ borderColor: mirrorOn ? C.cyan : C.border, color: mirrorOn ? C.cyan : C.dim }}>
              <Columns2 className="h-3 w-3" /> MIRROR
            </button>
          )}
          <button onClick={resetView} className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: C.border }}>RESET</button>
          {/* HI 1.3.2: map-local settings gear (icon only, right of RESET) — opens all map
              + VOXEL settings, decoupled from the crowded top navigation. */}
          {onOpenSettings && (
            <button onClick={onOpenSettings} title="Map & VOXEL settings"
              className="flex items-center rounded border px-1 py-0.5 font-semibold"
              style={{ borderColor: settingsOpen ? C.cyan : C.border, color: settingsOpen ? C.cyan : C.dim }}>
              <Settings className="h-3 w-3" />
            </button>
          )}
          <button onClick={onToggleMax} title={maximized ? "Minimize — back to standard screen" : "Maximize"}
            className="flex items-center gap-1 rounded border px-1 py-0.5 font-semibold" style={{ borderColor: maximized ? C.cyan : C.border, color: maximized ? C.cyan : C.dim }}>
            {maximized ? <><Minimize2 className="h-3 w-3" /> MINIMIZE</> : <Maximize2 className="h-3 w-3" />}
          </button>
          {onHidePane && <Dots3 horizontal onClick={onHidePane} title="Hide this window" />}
        </div>
      </div>
      {/* R-CORE lane strip + COORDINATE toggle. Opening the coordinate packet lights ONLY the
          UCRS lane (gold) and greys the other four — binding Coordinates ⇄ R-CORE UCRS-2525. */}
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-0.5" style={{ borderColor: C.border }}>
        <span className="text-[7px] font-bold tracking-wider" style={{ color: C.dim }}>R-CORE</span>
        {RCORE_LANES.map((l) => {
          const dim = showDecode && l.key !== "UCRS";          // packet open → only UCRS stays lit
          const ucrsHot = showDecode && l.key === "UCRS";
          return (
            <span key={l.key} title={l.def} className="rounded px-1 text-[7px] font-bold transition-colors"
              style={{ color: dim ? C.dim : l.color, background: dim ? `${C.dim}14` : `${l.color}${ucrsHot ? "33" : "18"}`,
                boxShadow: ucrsHot ? `0 0 0 1px ${l.color}` : undefined, opacity: dim ? 0.5 : 1 }}>{l.label}</span>
          );
        })}
        {/* COORDINATE — lock (collapsed) / unlock (expanded); opens the MGRS·LLV-DMS·UCRS packet */}
        <button onClick={() => setShowDecode((v) => !v)}
          title={showDecode ? "Coordinate packet OPEN — click to close" : "COORDINATE — open the MGRS · LLV-DMS · UCRS-2525 packet"}
          className="ml-auto flex items-center gap-0.5 rounded px-1 text-[7px] font-bold transition-colors"
          style={{ color: showDecode ? C.gold : C.dim, background: showDecode ? `${C.gold}22` : "transparent", border: `1px solid ${showDecode ? C.gold : C.border}` }}>
          {showDecode ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />} COORDINATE
        </button>
      </div>

      {/* pane body: the map surface (+ elevation). The ASSET/SUPPORT menu now lives
          in the shared left rail, outside the map, so it serves MAP and MINI MAP alike. */}
      <div className="relative flex min-h-0 flex-1 flex-col p-2">
        <div className="flex min-h-0 flex-1 gap-1">
          <div ref={mapRef}
            className="relative h-full w-full overflow-hidden rounded-md touch-none"
            /* P1.3 (Thought Master): DEFAULT cursor is the traditional select arrow —
               crosshair only while a placement tool is armed, grabbing only mid-drag */
            style={{ background: "radial-gradient(ellipse at 50% 55%, #0f2033 0%, #070b12 75%)", border: `1px solid ${C.border}`, cursor: cursorMode === "target" ? "none" : armed ? "crosshair" : dragRef.current ? "grabbing" : "default" }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = fracFromEvent(e); if (f) dropAt(e.dataTransfer.getData("text/plain"), f.fx, f.fy); }}
            onMouseLeave={() => { setCursorLL(null); setCursorPx(null); }}>
            {/* 3D tilt — the whole world layer (ground + markers) tilts as one plane;
                HUD (compass/readouts/scale) stays screen-flat, placement uses 2D */}
            <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 60%", transform: is3d ? `perspective(780px) rotateX(${pitch ?? 55}deg) scale(1.2)` : undefined, transition: "transform 220ms ease",
              willChange: is3d ? "transform" : undefined, backfaceVisibility: "hidden" as const }}>
            {/* rotated inner canvas (RENDER× size) */}
            <div className="pointer-events-none absolute" style={{ inset: `${-OFF * 100}%`, transform: `rotate(${view.bearing}rad)`, transformOrigin: "center" }}>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* LAND / OCEAN base — blue ocean fill; land = green (filled Natural Earth
                    country polygons, which include the enclosing landmass even at tight zoom). */}
                {terrainOn && borderPaths && (
                  <g>
                    <rect x="-1000" y="-1000" width="2100" height="2100" fill="#0a2f52" />
                    <path d={borderPaths.countries} fill="#123d1f" fillRule="evenodd" />
                  </g>
                )}
                {/* land clip — so ROADS never render over the water shown by the base */}
                {borderPaths && <defs><clipPath id={clipId}><path d={borderPaths.countries} fillRule="evenodd" /></clipPath></defs>}
                {/* national + state boundaries (= continent/country/state lines), drawn under the OSM detail */}
                {borderPaths && (
                  <g>
                    <path d={borderPaths.countries} fill="none" stroke={C.borderCountry} strokeWidth={BORDER_PX.country} vectorEffect="non-scaling-stroke" opacity="0.55" strokeLinejoin="round" />
                    <path d={borderPaths.states} fill="none" stroke={C.borderState} strokeWidth={BORDER_PX.state} vectorEffect="non-scaling-stroke" opacity="0.45" strokeLinejoin="round" />
                  </g>
                )}
                {/* WATER — lakes/wide rivers as solid blue polygons; rivers/streams as full-width blue lines */}
                {osmPaths && waterOn && (() => {
                  // FX-78 (HI): light-blue water FILL + faint highlight look "silly" at high tilt
                  // looking down and zoomed out — fade them as pitch rises and/or span grows.
                  const waterLightK = Math.max(0, Math.min(1, (85 - (pitch ?? 55)) / 45)) * Math.min(1, 12 / view.spanKm);
                  return (
                  <g>
                    <path d={osmPaths.polyD} fill="#1e6fd955" stroke="#38bdf8" strokeWidth="0.2" opacity={waterLightK} />
                    {/* FX-11 (P1.3.r5 HI): PROPORTIONAL river — width mimics the ACTUAL ~40 m
                        ground width, scaled by view span (40 m / spanM * 100 = SVG units on the
                        100-unit viewBox). NO hard max cap, so a wide river reads proportionally
                        wide up-close and thin zoomed-out; floor 0.08 only so it never vanishes.
                        The faint highlight path (#7dd3fc) below stays thin. R-CORE EDGE. */}
                    <path d={osmPaths.waterD} fill="none" stroke="#2f8fe0" strokeWidth={Math.max(0.05, (22 / (view.spanKm * 1000)) * 100)} opacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={osmPaths.waterD} fill="none" stroke="#7dd3fc" strokeWidth={Math.min(1.4, Math.max(0.05, (14 / (view.spanKm * 1000)) * 100))} opacity={0.85 * waterLightK} strokeLinecap="round" />
                  </g>
                  );
                })()}
                {/* ROADS — grey tier hierarchy, clipped to land so none render in water */}
                {osmPaths && roadsOn && (
                  <g clipPath={terrainOn && borderPaths && borderPaths.countries ? `url(#${clipId})` : undefined}>
                    {/* P2: road width tracks ZOOM — real-metre widths (12/24/40m core), current
                        look preserved at tight zoom via caps; floor keeps hairline visibility */}
                    {(() => {
                      const rw = (m: number, cap: number) => Math.min(cap, Math.max(0.07, (m / (view.spanKm * 1000)) * 100));
                      return (
                        <>
                          <path d={osmPaths.tiers[2]} fill="none" stroke="#cbd5e1" strokeWidth={rw(26, 0.55)} opacity="0.16" strokeLinecap="round" />
                          <path d={osmPaths.tiers[3]} fill="none" stroke="#cbd5e1" strokeWidth={rw(52, 1.0)} opacity="0.2" strokeLinecap="round" />
                          <path d={osmPaths.tiers[4]} fill="none" stroke="#cbd5e1" strokeWidth={rw(88, 1.6)} opacity="0.22" strokeLinecap="round" />
                          <path d={osmPaths.tiers[2]} fill="none" stroke="#94a3b8" strokeWidth={rw(12, 0.22)} opacity="0.5" strokeLinecap="round" />
                          <path d={osmPaths.tiers[3]} fill="none" stroke="#b6c2d1" strokeWidth={rw(24, 0.5)} opacity="0.7" strokeLinecap="round" />
                          <path d={osmPaths.tiers[4]} fill="none" stroke="#e5e7eb" strokeWidth={rw(40, 0.85)} opacity="0.8" strokeLinecap="round" />
                        </>
                      );
                    })()}
                  </g>
                )}
                {/* topographic contours — land = configurable topo tint (distinct from grey streets);
                    bathymetry-from-MSL = cyan dashed. Major key lines thicker + labelled (≥3). */}
                {contourSet && (
                  <g>
                    {contourSet.lines.filter((l) => (l.land ? contourCfg.showLand : contourCfg.showBathy)).map((l, i) => {
                      const col = l.land ? contourCfg.landColor : contourCfg.bathyColor;
                      const th = l.land ? contourCfg.thickness : contourCfg.bathyThickness;
                      return (
                        <g key={i}>
                          <path d={l.d} fill="none" stroke={col} strokeWidth={capContourPx(l.major ? th * 1.5 : th)} vectorEffect="non-scaling-stroke" strokeDasharray={l.land ? undefined : "1 0.7"} opacity={l.major ? 0.9 : 0.5} strokeLinecap="round" />
                          {contourCfg.labelMajor && l.major && l.label && (
                            <text x={l.label.x} y={l.label.y} fontSize="1.6" fontFamily="monospace" fill={col} opacity="0.95">{contourLabel(l.level, contourCfg.units)}</text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}
                {gridOn && grid.vertical.map((l) => (
                  <line key={`v${l.km}${l.frac}`} x1={l.frac * 100} y1="0" x2={l.frac * 100} y2="100" stroke={C.border} strokeWidth="0.25" />
                ))}
                {gridOn && grid.horizontal.map((l) => (
                  <line key={`h${l.km}${l.frac}`} x1="0" y1={l.frac * 100} x2="100" y2={l.frac * 100} stroke={C.border} strokeWidth="0.25" />
                ))}
                {ao.buildings.map((b) => {
                  const pts = b.footprint.map(([e, n]) => bldFrac(b, e, n)).map((f) => `${(f.fx * 100).toFixed(2)},${(f.fy * 100).toFixed(2)}`).join(" ");
                  const dome = b.dome ? bldFrac(b, b.dome[0], b.dome[1]) : null;
                  const domeR = b.dome ? (b.dome[2] / boxW) * 100 : 0;
                  const door = b.door ? bldFrac(b, b.door[0], b.door[1]) : null;
                  return (
                    <g key={b.label}>
                      <polygon points={pts} fill={`${C.land}11`} stroke={C.land} strokeWidth="0.35" strokeLinejoin="round" />
                      {b.footprint.map(([e, n], i) => { const f = bldFrac(b, e, n); return <circle key={i} cx={f.fx * 100} cy={f.fy * 100} r="0.45" fill={C.land} />; })}
                      {dome && <circle cx={dome.fx * 100} cy={dome.fy * 100} r={domeR} fill="none" stroke={C.gold} strokeWidth="0.35" />}
                      {door && <circle cx={door.fx * 100} cy={door.fy * 100} r="0.55" fill="none" stroke={C.cyan} strokeWidth="0.3" />}
                      {b.label === "TEXAS CAPITOL" && CAPITOL_WINDOWS.map(([e, n], i) => { const f = bldFrac(b, e, n); return <circle key={`w${i}`} cx={f.fx * 100} cy={f.fy * 100} r="0.18" fill={C.land} opacity="0.7" />; })}
                    </g>
                  );
                })}
                {ao.field && <PfieldVenue corners={ao.field} toFrac={toFrac} mode={is3d ? "3d" : "2d"} />}

                {/* AOR boundary — 12-sided ~100km polygon for TX metro AOs */}
                {CITY_POLYGONS[ao.key] && (
                  <polygon points={CITY_POLYGONS[ao.key].map(([la, lo]) => { const f = toFrac(la, lo); return `${(f.fx * 100).toFixed(2)},${(f.fy * 100).toFixed(2)}`; }).join(" ")}
                    fill={`${C.gold}08`} stroke={C.gold} strokeWidth="0.35" strokeDasharray="2 1.2" opacity="0.75" />
                )}
                {/* user-drawn AO (solid cyan) + its AOR buffer (dashed) */}
                {drawnAo && (() => {
                  const pf = (pts: [number, number][]) => pts.map(([la, lo]) => { const f = toFrac(la, lo); return `${(f.fx * 100).toFixed(2)},${(f.fy * 100).toFixed(2)}`; }).join(" ");
                  return (<>
                    <polygon points={pf(bufferPolygon(drawnAo.poly, drawnAo.aorKm))} fill="none" stroke={C.amber} strokeWidth="0.35" strokeDasharray="2.5 1.5" opacity="0.85" />
                    <polygon points={pf(drawnAo.poly)} fill={`${C.cyan}0f`} stroke={C.cyan} strokeWidth="0.45" opacity="0.95" />
                  </>);
                })()}
                {/* AO draft in progress — vertices + open edge */}
                {drawingAo && aoDraft.length > 0 && (() => {
                  const fs = aoDraft.map(([la, lo]) => toFrac(la, lo));
                  return (<>
                    <polyline points={fs.map((f) => `${(f.fx * 100).toFixed(2)},${(f.fy * 100).toFixed(2)}`).join(" ")} fill="none" stroke={C.cyan} strokeWidth="0.4" strokeDasharray="1 1" />
                    {fs.map((f, i) => <circle key={i} cx={f.fx * 100} cy={f.fy * 100} r="0.7" fill={C.cyan} />)}
                  </>);
                })()}
                {/* HI 1.3.2: OTHER pane's viewport rectangle — drawn HERE on the ground
                    overlay (toFrac, inside the tilt+bearing layer) so in 3D it lies FLAT on
                    the terrain instead of floating diagonally into the sky ("different
                    dimensions"). Was previously a screen-space project() SVG outside the tilt. */}
                {otherView && otherView.spanKm < view.spanKm * 0.85 && (() => {
                  const oh = otherView.spanKm / 2;
                  const odLat = oh / 110.574, odLon = oh / (111.32 * Math.cos((otherView.lat * Math.PI) / 180));
                  const corners: [number, number][] = [
                    [otherView.lat + odLat, otherView.lon - odLon], [otherView.lat + odLat, otherView.lon + odLon],
                    [otherView.lat - odLat, otherView.lon + odLon], [otherView.lat - odLat, otherView.lon - odLon],
                  ];
                  const fs = corners.map(([la, lo]) => toFrac(la, lo));
                  if (fs.some((f) => !Number.isFinite(f.fx) || !Number.isFinite(f.fy))) return null;
                  return <polygon points={fs.map((f) => `${(f.fx * 100).toFixed(2)},${(f.fy * 100).toFixed(2)}`).join(" ")} fill="none" stroke={C.cyan} strokeWidth="0.4" strokeDasharray="1.5 1" opacity="0.85" />;
                })()}

                {/* weapon-range coverage rings (public-source ranges) — planning aid */}
                {rangeOn && placed.map((u) => {
                  const rk = ASSET_RANGE_KM[u.asset];
                  if (!rk) return null;
                  const c = toFrac(u.lat, u.lon);
                  const col = u.aff === "hostile" ? C.red : C.cyan;
                  const rlw = u.lineW ?? 0.5;
                  const ring = (km: number, fill: string, strokeOp: number, dash: string) => {
                    const dLat = km / 110.574;
                    const dLon = km / (111.320 * Math.cos((u.lat * Math.PI) / 180));
                    const cE = toFrac(u.lat, u.lon + dLon);
                    const cN = toFrac(u.lat + dLat, u.lon);
                    const rx = Math.abs(cE.fx - c.fx) * 100;
                    const ry = Math.abs(cN.fy - c.fy) * 100;
                    if ((rx < 0.3 && ry < 0.3) || rx > 400 || ry > 400) return null;
                    return <ellipse cx={c.fx * 100} cy={c.fy * 100} rx={rx} ry={ry} fill={fill} stroke={col} strokeWidth={rlw * 0.4} strokeDasharray={dash} opacity={strokeOp} />;
                  };
                  const ext = ASSET_RANGE_EXT_KM[u.asset];
                  return (
                    <Fragment key={`rng${u.id}`}>
                      {ext && ring(ext, `${col}06`, 0.3, "2 1.5")}
                      {ring(rk, `${col}12`, 0.6, "1.2 0.8")}
                    </Fragment>
                  );
                })}

                {/* track movement vectors — heading arrow scaled by speed (active tracks) */}
                {placed.map((u) => {
                  if (!u.moving || u.heading == null) return null;
                  const c = toFrac(u.lat, u.lon); const cx = c.fx * 100, cy = c.fy * 100;
                  const len = Math.min(14, 3 + (u.speed ?? 0) / 25);
                  const th = (u.heading * Math.PI) / 180;
                  const ex = cx + len * Math.sin(th), ey = cy - len * Math.cos(th);
                  const col = u.aff === "hostile" ? C.red : C.green;
                  // arrowhead
                  const a1 = th + Math.PI * 0.85, a2 = th - Math.PI * 0.85;
                  const vw = u.lineW ?? 0.5;
                  return (
                    <g key={`trk${u.id}`}>
                      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={col} strokeWidth={vw} vectorEffect="non-scaling-stroke" opacity="0.75" />
                      <line x1={ex} y1={ey} x2={ex + 1.1 * Math.sin(a1)} y2={ey - 1.1 * Math.cos(a1)} stroke={col} strokeWidth={vw} vectorEffect="non-scaling-stroke" opacity="0.75" />
                      <line x1={ex} y1={ey} x2={ex + 1.1 * Math.sin(a2)} y2={ey - 1.1 * Math.cos(a2)} stroke={col} strokeWidth={vw} vectorEffect="non-scaling-stroke" opacity="0.75" />
                    </g>
                  );
                })}

                {placed.map((u) => {
                  if (!u.tls && !u.fov) return null;
                  const c = toFrac(u.lat, u.lon); const cx = c.fx * 100, cy = c.fy * 100;
                  const lw = u.lineW ?? 0.5;
                  const drawLine = (R: number, brg: number, col: string) =>
                    <line x1={cx} y1={cy} x2={cx + R * Math.sin((brg * Math.PI) / 180)} y2={cy - R * Math.cos((brg * Math.PI) / 180)} stroke={col} strokeWidth={lw} vectorEffect="non-scaling-stroke" opacity="0.85" />;
                  const TLS: [TL | undefined, string, number, string][] = [
                    [u.fov, "#a78bfa", 30, "FOV"],
                    [u.mobile ? undefined : u.tls?.p, C.gold, 22, "PTL"], // PTL suppressed on-the-move
                    [u.tls?.s, C.amber, 20, "2TL"],
                    [u.tls?.t, C.cyan, 18, "3TL"],
                  ];
                  return (
                    <g key={`tl${u.id}`}>
                      {TLS.map(([tl, col, R], i) => tl && (
                        <g key={i}>
                          <path d={sectorPath(cx, cy, R, tl)} fill={`${col}1f`} stroke={`${col}66`} strokeWidth="0.25" />
                          {drawLine(R, tl.brg, col)}
                        </g>
                      ))}
                    </g>
                  );
                })}

                {placedSupport.filter((u) => u.path).map((u) => {
                  const pts = u.path!.map((pt) => toFrac(pt.lat, pt.lon));
                  const d = pts.map((f, i) => `${i ? "L" : "M"}${(f.fx * 100).toFixed(2)} ${(f.fy * 100).toFixed(2)}`).join(" ");
                  const dash = u.def.key === "restricted_route" || u.def.color === "#ef4444";
                  return (
                    <g key={`rt${u.id}`}>
                      <path d={d} fill="none" stroke={u.def.color} strokeWidth="0.45" strokeDasharray={dash ? "1.5 1" : undefined} strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
                      {pts.map((f, i) => <circle key={i} cx={f.fx * 100} cy={f.fy * 100} r="0.55" fill={u.def.color} />)}
                    </g>
                  );
                })}
                {routeMode && routeDraft.length > 0 && (() => {
                  const pts = routeDraft.map((pt) => toFrac(pt.lat, pt.lon));
                  const cur = cursorLL ? toFrac(cursorLL.lat, cursorLL.lon) : null;
                  const chain = cur ? [...pts, cur] : pts;
                  const d = chain.map((f, i) => `${i ? "L" : "M"}${(f.fx * 100).toFixed(2)} ${(f.fy * 100).toFixed(2)}`).join(" ");
                  return (
                    <g>
                      <path d={d} fill="none" stroke={selectedSupport!.color} strokeWidth="0.4" strokeDasharray="1 1" opacity="0.8" />
                      {pts.map((f, i) => <circle key={i} cx={f.fx * 100} cy={f.fy * 100} r="0.6" fill={selectedSupport!.color} />)}
                    </g>
                  );
                })()}
                {gridOn && grid.vertical.map((l) => (
                  <text key={`vl${l.km}${l.frac}`} x={l.frac * 100 + 0.3} y="99.3" fontSize="1.5" fontFamily="monospace" fill={C.dim} textAnchor="start">{String(l.km).padStart(2, "0")}</text>
                ))}
                {gridOn && grid.horizontal.map((l) => (
                  <text key={`hl${l.km}${l.frac}`} x="0.4" y={l.frac * 100 - 0.4} fontSize="1.5" fontFamily="monospace" fill={C.dim}>{String(l.km).padStart(2, "0")}</text>
                ))}
              </svg>
            </div>

            {/* landmarks */}
            {ao.landmarks.map((lm) => {
              const f = project(lm.lat, lm.lon);
              if (f.fx < 0 || f.fx > 1 || f.fy < 0 || f.fy > 1) return null;
              return (
                <div key={lm.name} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%` }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: C.gold }} />
                  <span className="whitespace-nowrap text-[8px] font-semibold" style={{ color: C.gold }}>{lm.name}</span>
                </div>
              );
            })}
            {/* major metros (≥1M) — surface once the view widens past ~120 km */}
            {borderPaths && view.spanKm > 120 && CITIES.map((c) => {
              const f = project(c.lat, c.lon);
              if (f.fx < 0 || f.fx > 1 || f.fy < 0 || f.fy > 1) return null;
              return (
                <div key={c.name} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5" style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%` }}>
                  <span className="h-1 w-1 rounded-full" style={{ background: C.text, boxShadow: `0 0 0 1px ${C.text}66` }} />
                  <span className="whitespace-nowrap font-mono text-[7px]" style={{ color: C.text, opacity: 0.75 }}>{c.name}</span>
                </div>
              );
            })}
            {/* placed assets */}
            {placed.map((u) => {
              const f = project(u.lat, u.lon);
              const off = f.fx < -0.05 || f.fx > 1.05 || f.fy < -0.05 || f.fy > 1.05;
              const aerial = u.altitude != null && u.altitude > 0;
              // TRACK SIM: rotate the aircraft icon to its heading — 2D playback only (per operator).
              const trackRot = playing && !is3d && aerial && u.moving && u.heading != null ? u.heading : 0;
              const sel = selected?.kind === "asset" && selected.id === u.id;
              const hot = hoverAsset === u.asset;
              // HI 1.3.3 (contract): when 3D + VOXEL and this asset has a voxel COLUMN, that
              // column OWNS the on-cube UI (shield, AGL chip, dot, top-face reticle + corners).
              // The flat marker then shows NOTHING on-map — only the 2D / voxel-off flat icon and
              // the OFF-MAP aerial box survive below.
              const hasColumn = is3d && voxelLayer && voxelColumns.some((c) => c.objects.some((o) => o.id === u.id));
              // HI: pin the GROUND coord chip to the box BOTTOM LINE so it never covers the top
              // target symbol — drop it ~½ cell (billboarded → toward the front floor edge).
              const groundDrop = Math.max(6, Math.round((effCellM / (view.spanKm * 1000)) * (mapRef.current?.clientWidth ?? 800) * 0.5));
              // HI: GROUND units off-map are culled. AERIAL units off-map render as a distant
              // top-face BOX (red hostile / blue friendly) clamped to the map edge toward their
              // bearing — visible near the horizon at 66–88° tilt without zooming the 2D map out.
              if (off && !aerial) return null;
              if (off && aerial) {
                const cx = Math.max(0.015, Math.min(0.985, f.fx));
                const cy = Math.max(0.015, Math.min(0.985, f.fy));
                const col = u.aff === "hostile" ? C.red : C.cyan;
                // HI (contract item 5): lift the distant aerial box toward the HORIZON as the
                // camera pitches back (66–88°) so an off-map flyer reads like an aircraft seen
                // far off in the SKY, not pinned to the map edge. Grows with (pitch − 55°).
                const horizonLift = is3d ? Math.max(0, ((pitch ?? 55) - 55)) * 1.6 : 0;
                return (
                  <div key={u.id} className="pointer-events-none absolute" style={{ left: `${cx * 100}%`, top: `${cy * 100}%`, zIndex: 14,
                    transform: is3d ? `translate(-50%,-100%) translateY(${-horizonLift}px) rotateX(${-(pitch ?? 55)}deg)` : "translate(-50%,-100%)", transformOrigin: "50% 100%" }}>
                    <span className="block" style={{ width: 15, height: 15, border: `2px solid ${col}`, background: `${col}33`, boxShadow: `0 0 9px ${col}` }} />
                    <span className="mt-0.5 block whitespace-nowrap text-center font-mono text-[7px] font-bold" style={{ color: col }}>{ASSET_LABELS[u.asset]} ▲</span>
                  </div>
                );
              }
              // HI: altitude SPIKE/stem REMOVED — the voxel box carries altitude, so the icon sits
              // on the ground with only its coordinate chip (N above for AERIAL / S below for GROUND).
              return (
                <Fragment key={u.id}>
                <button
                  onPointerUp={(e) => { if (!dragRef.current?.moved) { e.stopPropagation(); setSelected({ kind: "asset", id: u.id }); } }}
                  onDoubleClick={(e) => { e.stopPropagation(); setSelected({ kind: "asset", id: u.id }); showVoxelFor(u.id); }} /* FX-30 (HI): double-click an asset → reveal + highlight its VOXEL·CUBE */
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (!dragRef.current?.moved) { setSelected({ kind: "asset", id: u.id }); setHooks((hs) => (hs.includes(u.id) ? hs : [...hs, u.id])); setHookOffs((os) => (os[u.id] ? os : { ...os, [u.id]: { x: 23 + 20 * (Object.keys(os).length % 4), y: -23 - 16 * (Object.keys(os).length % 4) } })); } }}
                  onMouseEnter={() => setHoverAsset(u.asset)}
                  onMouseLeave={() => setHoverAsset((h) => (h === u.asset ? null : h))}
                  title={`${ASSET_LABELS[u.asset]} — ${fmt.coordAt(u.lat, u.lon)}`}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%`, zIndex: hot ? 15 : undefined,
                    // P2: eXeL-STD-2525 icons are 3D — in 3D mode they BILLBOARD upright off
                    // the tilted plane (counter-rotateX about their base), standing on terrain.
                    // FLYING assets additionally lift by translateZ(altitudePx) to their height.
                    // HI 1.3.3: the LOCATION DOT stays ON THE GROUND (no altitude lift) — a high
                    // aerial asset floating way above the box read badly; the stem + voxel box + AGL
                    // label carry the altitude instead, the dot marks the exact spot on the ground.
                    transform: is3d ? `translate(-50%,-50%) rotateX(${-(pitch ?? 55)}deg)` : "translate(-50%,-50%)",
                    transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}>
                  {/* pulse + selection ring anchored to the ICON centre, not the icon+label stack */}
                  <span className="relative flex items-center justify-center">
                    {hot && <span className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full" style={{ boxShadow: `0 0 0 2px ${C.cyan}`, background: `${C.cyan}22` }} />}
                    {sel && !(is3d && hooks.includes(u.id)) && <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: 32 * iconScale, height: 32 * iconScale, boxShadow: `0 0 0 2px ${C.gold}` }} />}
                    {/* HI 1.3.3: in 3D+VOXEL the flat icon is replaced by a marker at the EXACT
                        MGRS position — a circular DOT for GROUND assets (see the true spot inside
                        the grid-snapped box), a sky-face BOX for AERIAL (at altitude). Flat MIL
                        icon stays in 2D / voxel-off. */}
                    {is3d && voxelLayer && hasColumn
                      ? null /* HI contract: the voxel COLUMN owns the shield / dot / labels */
                      : is3d && voxelLayer
                      ? (
                        // HI: MIL-STD-2525 icon on a SHIELD badge, standing on a DOT that marks the
                        // EXACT MGRS floor spot (billboarded upright off the tilted ground surface).
                        <span className="flex flex-col items-center">
                          <span className="flex items-center justify-center rounded-md" style={{ padding: 2,
                            background: `${u.aff === "hostile" ? C.red : C.cyan}1e`, border: `1px solid ${u.aff === "hostile" ? C.red : C.cyan}`,
                            boxShadow: `0 0 6px ${u.aff === "hostile" ? C.red : C.cyan}55` }}>
                            <AssetIcon asset={u.asset} style={iconStyle} affiliation={u.aff} size={22 * iconScale} count={u.count} />
                          </span>
                          <span className="mt-[1px] block rounded-full" style={{ width: 5, height: 5,
                            background: u.aff === "hostile" ? C.red : C.cyan, boxShadow: `0 0 5px ${u.aff === "hostile" ? C.red : C.cyan}` }} />
                        </span>
                      )
                      : <span className="inline-block" style={{ transform: trackRot ? `rotate(${trackRot}deg)` : undefined, transition: "transform 120ms linear" }}><AssetIcon asset={u.asset} style={iconStyle} affiliation={u.aff} size={28 * iconScale} count={u.count} /></span>}
                  </span>
                  {/* HI 1.3.3: coordinate label = ONE black-background chip (no white version),
                      same format as the selected-voxel label.
                      HI: N/S placement — AERIAL asset (altitude>0) → chip ABOVE the icon (North);
                      GROUND asset → chip BELOW the icon (South). flex-col `order` re-stacks it. */}
                  {!hasColumn && (sel || hot) && <span className="whitespace-nowrap rounded px-1 font-mono text-[8px]" style={{ background: "#0a0f16cc", color: u.aff === "hostile" ? C.red : C.cyan, order: aerial ? -1 : 1, marginTop: aerial ? 0 : groundDrop, marginBottom: aerial ? 2 : 0 }}>{fmt.coordAt(u.lat, u.lon)}</span>}
                  {u.moving && !hasColumn && (
                    <span className="whitespace-nowrap font-mono text-[7px] font-bold" style={{ color: C.green }}>
                      {u.heading != null ? `${String(Math.round(u.heading)).padStart(3, "0")}°` : ""}{u.speed ? ` ${Math.round(u.speed)}km/h` : ""}{u.altitude ? ` ${fmtAlt(u.altitude, u.altRef ?? "AGL", u.lat, u.lon)}` : ""}
                    </span>
                  )}
                </button>
                </Fragment>
              );
            })}
            {/* placed support */}
            {placedSupport.map((u) => {
              const f = project(u.lat, u.lon);
              if (f.fx < -0.05 || f.fx > 1.05 || f.fy < -0.05 || f.fy > 1.05) return null;
              const sel = selected?.kind === "support" && selected.id === u.id;
              return (
                <button key={u.id}
                  onPointerUp={(e) => { if (!dragRef.current?.moved) { e.stopPropagation(); setSelected({ kind: "support", id: u.id }); } }}
                  title={`${u.def.term} · ${u.reality} — ${fmt.coordAt(u.lat, u.lon)}`}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%`,
                    transform: is3d ? `translate(-50%,-50%) rotateX(${-(pitch ?? 55)}deg)` : "translate(-50%,-50%)",
                    transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}>
                  {sel && <span className="absolute rounded-full" style={{ width: 26 * iconScale, height: 26 * iconScale, boxShadow: `0 0 0 2px ${C.gold}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                  <SupportGlyph glyph={u.def.glyph} color={u.aff === "hostile" ? "#ef4444" : u.def.color} size={22 * iconScale} />
                  {/* HI: coordinate chip shows ONLY when this support item is selected/clicked
                      (declutter — same rule as the voxel: coords on click, not always-on). */}
                  {sel && <span className="whitespace-nowrap rounded px-1 font-mono text-[8px]" style={{ background: "#0a0f16cc", color: u.aff === "hostile" ? C.red : C.cyan }}>{fmt.coordAt(u.lat, u.lon)}</span>}
                </button>
              );
            })}
            {/* CURSOR HOOK bubble (P1.3 round 3, HI / FAAD C2): right-click hooks a track —
                IFF, SPD/ALT/HDG data, engagement tools. Billboards upright like the icons;
                left-click anywhere or ESC releases. INSPECT = full engagement tools (rail). */}
            {hooks.map((hid) => {
              const u = placed.find((p) => p.id === hid);
              if (!u) return null;
              const f = project(u.lat, u.lon);
              if (f.fx < -0.05 || f.fx > 1.05 || f.fy < -0.05 || f.fy > 1.05) return null;
              const off = hookOffs[hid] ?? { x: 23, y: -23 }; // FX-51 v2: THIS label's own offset
              const closeThis = () => setHooks((hs) => hs.filter((h) => h !== hid)); // ✕ closes only ITS label
              const row = (k: string, v: string) => (
                <div className="flex justify-between gap-2 px-1.5"><span style={{ color: C.dim }}>{k}</span><span style={{ color: C.text }}>{v}</span></div>
              );
              const setIff = (aff: Affiliation) => setPlaced((pl) => pl.map((p) => (p.id === u.id ? { ...p, aff } : p)));
              // FX-51 (HI 1.3.3): OFFSET the panel clear to the upper-right so it never covers
              // the CUBE + TARGET (legibility), and run a thin gold connector from the panel's
              // BOTTOM-LEFT corner back down to the cube's NE-top. Only ONE sphere shows (the
              // 3D voxel sphere) — the flat plane ring is suppressed for the hooked asset above.
              return (
                <Fragment key={hid}>
                <div className="absolute rounded border font-mono text-[8px]" onPointerDown={(e) => e.stopPropagation()}
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%`, zIndex: 40, minWidth: 128, pointerEvents: "auto",
                    background: "#0a0f16", borderColor: C.gold, boxShadow: "0 4px 18px rgba(0,0,0,.6)",
                    // FX-51: panel bottom-left sits at the DRAGGABLE offset from the asset.
                    transform: is3d ? `translate(${off.x}px, ${off.y}px) translateY(-100%) rotateX(${-(pitch ?? 55)}deg)` : `translate(${off.x}px, ${off.y}px) translateY(-100%)`,
                    transformOrigin: "0% 100%" }}>
                  <div className="flex items-center justify-between gap-1 px-1.5 py-0.5 font-bold" style={{ color: C.gold, borderBottom: `1px solid ${C.gold}44` }}>
                    {/* ⠿ 2×3 drag handle (same as the mini-map) — move THIS label further away */}
                    <span className="cursor-move select-none" style={{ color: C.dim }} title="Drag label"
                      onPointerDown={(e) => {
                        // HI 1.3.3 drag FIX: document-scoped listeners added on press, removed on
                        // release — drags ONLY while held (setPointerCapture was lost on React
                        // re-render → the label followed the mouse without pressing).
                        e.stopPropagation(); e.preventDefault();
                        const sx = e.clientX, sy = e.clientY, ox = off.x, oy = off.y;
                        const move = (ev: PointerEvent) => setHookOffs((os) => ({ ...os, [hid]: { x: ox + (ev.clientX - sx), y: oy + (ev.clientY - sy) } }));
                        const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); };
                        document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
                      }}>⠿</span>
                    <span>⌖ {ASSET_LABELS[u.asset]}{u.count > 1 ? ` ×${u.count}` : ""}</span>
                    <button onClick={closeThis} title="Close hook" className="leading-none" style={{ color: C.dim }}>✕</button>
                  </div>
                  {row(coordFmt === "dms" ? "DMS" : coordFmt === "ucrs" ? "UCRS" : "MGRS", fmt.coordAt(u.lat, u.lon))}
                  {/* HI 1.3.2: bearing/speed only for MOVING assets — stationary assets +
                      support have no meaningful heading. */}
                  {u.moving && row("SPD", u.speed != null ? `${Math.round(u.speed)} km/h` : "—")}
                  {row("ALT", u.altitude != null ? fmtAlt(u.altitude, u.altRef ?? "AGL", u.lat, u.lon) : "SURFACE")}
                  {u.moving && row("HDG", u.heading != null ? `${String(Math.round(u.heading)).padStart(3, "0")}°` : "—")}
                  <div className="flex items-center gap-1 px-1.5 py-0.5" style={{ borderTop: `1px solid ${C.gold}22` }}>
                    <span style={{ color: C.dim }}>IFF</span>
                    <button className="rounded border px-1" onClick={() => setIff("friendly")}
                      style={{ borderColor: C.cyan, color: C.cyan, background: u.aff === "friendly" ? `${C.cyan}33` : "transparent" }}>FRD</button>
                    <button className="rounded border px-1" onClick={() => setIff("hostile")}
                      style={{ borderColor: C.red, color: C.red, background: u.aff === "hostile" ? `${C.red}33` : "transparent" }}>HOS</button>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 pb-1">
                    <button className="rounded border px-1" onClick={() => { setSelected({ kind: "asset", id: u.id }); closeThis(); }}
                      style={{ borderColor: C.cyan, color: C.cyan }}>INSPECT ▸</button>
                    <button className="rounded border px-1" onClick={() => {
                      setInventory((inv) => inv.map((i) => (i.asset === u.asset ? { ...i, stock: i.stock + u.count } : i)));
                      setPlaced((pl) => pl.filter((p) => p.id !== u.id));
                      setSelected(null); closeThis();
                    }} style={{ borderColor: C.red, color: C.red }}>DROP ✕</button>
                  </div>
                </div>
                </Fragment>
              );
            })}
            {/* 3D RELIEF — lifted contour wireframe: each level translateZ's to its true
                elevation (auto vertical exaggeration, full relief ≈ 34px). Land solid green,
                bathymetry dashed cyan below — the reference-mesh look, phone/Pi compute. */}
            {is3d && reliefSet && reliefSet.lines.length > 0 && (() => {
              const levels = Array.from(new Set(reliefSet.lines.map((l) => l.level))).sort((a, b) => a - b);
              const lo = levels[0], span = Math.max(1, levels[levels.length - 1] - lo);
              // P1.3 round 3: lift fades to FLAT above 85° tilt — at horizon angles the
              // lifted wireframe used to float as "green lines in the sky" (85-cap cause).
              const liftK = (pitch ?? 55) > 85 ? Math.max(0, (88 - (pitch ?? 55)) / 3) : 1;
              return levels.map((lvl) => (
                <svg key={`relief${lvl}`} viewBox="0 0 100 100" preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0"
                  style={{ transform: `translateZ(${(((lvl - lo) / span) * 34 * liftK).toFixed(1)}px)` }}>
                  {reliefSet.lines.filter((l) => l.level === lvl).map((l, i) => (
                    <path key={i} d={l.d} fill="none" stroke={l.land ? C.land : "#22d3ee"} strokeWidth={l.major ? 1.2 : 0.8}
                      vectorEffect="non-scaling-stroke" strokeDasharray={l.land ? undefined : "3 3"} opacity={l.major ? 0.8 : 0.55} />
                  ))}
                </svg>
              ));
            })()}
            {/* ── 3D VOXEL MODE — stacked wireframe cubes per grid cell (Vision-2525 law).
                Base square sits ON the plane and is the addressable CUBE BASE
                (tap → MGRS + LLV-DMS + UCRS-2525 packet). Bands rise via translateZ
                (preserve-3d). Wireframe-only = phone / Raspberry-Pi class compute. */}
            {is3d && voxelLayer && voxelColumns.map((col) => {
              const f = project(col.lat, col.lon);
              if (f.fx < -0.02 || f.fx > 1.02 || f.fy < -0.02 || f.fy > 1.02) return null;
              const paneW = mapRef.current?.clientWidth ?? 800;
              // HI 1.3.3: the VOXEL SIZE tier (3X/2X/1X) scales ONLY the cube BASE footprint.
              // The tier scales the whole CUBE uniformly: bandPx == cellPx keeps it CUBIC (equal
              // W/H/D), base + height shrink together (never a tower). The altitude RAIL is held
              // fixed separately via the unscaled cellW term in limitZ below.
              const cellW = Math.max(16, (col.cellM / (view.spanKm * 1000)) * paneW);
              const cellPx = cellW * VOXEL_BASE_SCALE[voxelSize]; // BASE footprint — shrinks with the tier
              const bandPx = cellPx;                              // VERTICAL unit == base ⇒ cube stays cubic
              // TRUE-scale altitude: 1:1 with the ground metres-per-pixel, so an aircraft sits at its
              // real height and rises OFF the top of the frame as you zoom in (the band cubes below
              // remain the readable scaffold). Not band-clamped, and it tracks view.spanKm.
              const altPxPerM = paneW / (view.spanKm * 1000);
              // Airspace threshold CAPS — same altitudes as the LEFT altitude gauge, in TRUE scale so
              // they share the aircraft's z: grey = voxelLimitPct%, red = altRedPct%, orange =
              // altYellowPct% of the ceiling. An aircraft above the grey cap flies off-map (red cube).
              const ceilM = (maxAltFt ?? autoCeilingFt(view.spanKm)) * 0.3048;
              const capZ = ceilM * (voxelLimitPct / 100) * altPxPerM; // grey ceiling cap
              const redZ = ceilM * (altRedPct / 100) * altPxPerM;     // red threshold
              const orgZ = ceilM * (altYellowPct / 100) * altPxPerM;  // orange threshold
              const sel = voxelSel === col.key;
              const isLattice = col.key.startsWith("LAT:"); // empty scaffold column (no asset)
              const hiCol = voxelHiColor;                    // FX-07: user-set primary highlight colour
              const selAsset = selected?.kind === "asset" && col.objects.some((o) => o.id === selected.id); // FX-59: the actively-selected asset's own column counts as selected
              const dimmed = voxelSel != null && !sel && !selAsset; // FX-07 dim cue, FX-59: never dims the selected asset
              const fullStack = col.cubes.filter((cb) => cb.bandIdx > 0);
              // FX-04 (HI 1.3.2): a lattice voxel defaults to a 3-high (3×3×3) CUBE on the
              // ground (the eXeL cube-coding / swarm form, artificial 3-D feel); an asset
              // shows its own occupied stack. A thin GREY "voxel-limit" line then rises from
              // the cube top to voxelLimitPct% of the full altitude rail.
              const stack = isLattice ? fullStack.slice(0, 3) : fullStack;
              const topObj = col.objects[col.objects.length - 1];
              // AERIAL asset → a SEPARATE column that STACKS cubes (each sized to the centre voxel
              // cube, cellPx) all the way up to the asset's TRUE altitude; the TOP cube is the
              // aircraft (red). More cubes appear as you zoom in (trueZ grows, cube size ~constant).
              const objAltM = topObj ? (topObj.altRef === "AGL" ? topObj.altM : Math.max(0, topObj.mslM - col.terrainM)) : 0;
              const trueZ = Math.max(0, objAltM * altPxPerM);
              const aerialStack = !isLattice && objAltM > 0;
              const nCubes = aerialStack ? Math.max(1, Math.min(64, Math.round(trueZ / cellPx))) : 0;
              const topZ = aerialStack ? nCubes * cellPx : stack.length * bandPx;
              const markerZ = aerialStack ? topZ : trueZ; // icon/chip sit on the column top
              const face = (t: string, w: number, h: number, color: string, occupied: boolean, lw?: number): React.CSSProperties => ({
                position: "absolute", left: "50%", top: "50%", width: w, height: h,
                transform: `translate(-50%,-50%) ${t}`,
                border: `${lw ?? (occupied ? 1.5 : 1)}px ${occupied ? "solid" : "dashed"} ${color}`,
                background: occupied ? `${color}10` : "transparent",
              });
              // finer grey wireframe edges at the bigger 2X/3X tiers (thin lines read cleaner)
              const edgeFineW = voxelSize >= 2 ? 0.4 : undefined;
              return (
                <div key={col.key} className="absolute" style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%`, transformStyle: "preserve-3d", zIndex: (sel || selAsset) ? 14 : 12, opacity: 1, transition: "opacity 140ms ease",
                  // FX-07 (HI 1.3.2) NORTH-LOCK: project() already rotates the cube POSITION
                  // by +bearing, but the faces were screen-axis-aligned, so on rotate each
                  // cube looked like it spun on its own ("confusing as shit"). Rotate the
                  // face-frame by +bearing about the tilted-plane normal (rotateZ) so all
                  // cubes stay a rigid geographic grid whose faces always point N/E/S/W —
                  // the camera orbits, the cubes never turn. Single voxel ≡ the 3×3 (both
                  // north-locked squares). transform-origin = cube centre (0×0 anchor div).
                  transform: is3d ? `rotateZ(${view.bearing}rad)` : undefined }}>
                  {/* addressable cube BASE (on-plane) */}
                  <button onPointerUp={(e) => { e.stopPropagation(); setVoxelSel(sel ? null : col.key); }}
                    title={fmt.coordAt(col.lat, col.lon)}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ width: cellPx, height: cellPx, border: `1.5px solid ${sel ? hiCol : C.cyan}`, background: sel ? `${hiCol}22` : `${C.cyan}08`, pointerEvents: "auto" }} />
                  {/* Airspace threshold CAPS — TRUE scale, at the SAME altitudes as the LEFT gauge
                      lines. Orange (yellow%) · Red (red%) · Grey ceiling (limit%). Horizontal squares
                      spanning the cell; an aircraft above the grey cap flies past it (off-map). */}
                  {!isLattice && col.objects.some((o) => o.altM > 0) && ([
                    { id: "org", z: orgZ, c: C.amber, cap: false },
                    { id: "red", z: redZ, c: C.red, cap: false },
                    { id: "cap", z: capZ, c: "#9ca3af", cap: true },
                  ]).map((t) => (
                    <div key={t.id} className="pointer-events-none absolute left-1/2 top-1/2" style={{ width: cellPx, height: cellPx,
                      border: `${t.cap ? 1.5 : 0.75}px ${t.cap ? "dashed" : "solid"} ${t.c}${t.cap ? "cc" : "aa"}`,
                      background: `${t.c}0e`, boxShadow: `0 0 3px ${t.c}55`, opacity: dimmed ? 0.3 : 0.75,
                      transform: `translate(-50%,-50%) translateZ(${t.z}px)` }} />
                  ))}
                  {/* FX-49 REMOVED (HI 1.3.3): the cell-centre SPHERE was a duplicate asset marker. The
                      ground asset DOT / aerial BOX rendered in placed.map is now the single asset symbol;
                      placed.map's onContextMenu already hooks the asset to open its track label. */}
                  {/* the cube stack. AERIAL asset → a true-altitude column of cubic cells (each cellPx)
                      from the ground up to the aircraft; the TOP cube is RED = the aircraft. More
                      cubes appear as you zoom in. GROUND/lattice → the band scaffold. */}
                  {aerialStack
                    ? Array.from({ length: nCubes }).map((_, i) => {
                        const z = i * cellPx, isTop = i === nCubes - 1;
                        const color = isTop ? C.red : sel ? hiCol : "#3b556e";
                        const lw = isTop ? undefined : edgeFineW; // grey cubes get finer edges at 2X/3X
                        return (
                          <div key={`ac${i}`} className="pointer-events-none absolute left-0 top-0" style={{ transformStyle: "preserve-3d" }}>
                            <div style={face(`translate3d(0px,0px,${z + cellPx}px)`, cellPx, cellPx, color, isTop, lw)} />
                            <div style={face(`translate3d(0px,${-cellPx / 2}px,${z + cellPx / 2}px) rotateX(90deg)`, cellPx, cellPx, color, isTop, lw)} />
                            <div style={face(`translate3d(0px,${cellPx / 2}px,${z + cellPx / 2}px) rotateX(90deg)`, cellPx, cellPx, color, isTop, lw)} />
                            <div style={face(`translate3d(${-cellPx / 2}px,0px,${z + cellPx / 2}px) rotateY(90deg)`, cellPx, cellPx, color, isTop, lw)} />
                            <div style={face(`translate3d(${cellPx / 2}px,0px,${z + cellPx / 2}px) rotateY(90deg)`, cellPx, cellPx, color, isTop, lw)} />
                          </div>
                        );
                      })
                    : stack.map((cb) => {
                    const occupied = cb.occupants.length > 0;
                    // FX-53 (HI 1.3.3): a SELECTED column highlights ALL the way to the ground
                    // in the user's highlight colour (rest of the lattice dims via `dimmed`).
                    const color = sel ? hiCol : occupied ? (col.objects.find((o) => o.bandIdx === cb.bandIdx)?.color ?? C.cyan) : "#3b556e";
                    const z = (cb.bandIdx - 1) * bandPx;
                    return (
                      <div key={cb.bandIdx} className="pointer-events-none absolute left-0 top-0" style={{ transformStyle: "preserve-3d" }}>
                        <div style={face(`translate3d(0px,0px,${z + bandPx}px)`, cellPx, cellPx, color, occupied)} />
                        <div style={face(`translate3d(0px,${-cellPx / 2}px,${z + bandPx / 2}px) rotateX(90deg)`, cellPx, bandPx, color, occupied)} />
                        <div style={face(`translate3d(0px,${cellPx / 2}px,${z + bandPx / 2}px) rotateX(90deg)`, cellPx, bandPx, color, occupied)} />
                        <div style={face(`translate3d(${-cellPx / 2}px,0px,${z + bandPx / 2}px) rotateY(90deg)`, bandPx, cellPx, color, occupied)} />
                        <div style={face(`translate3d(${cellPx / 2}px,0px,${z + bandPx / 2}px) rotateY(90deg)`, bandPx, cellPx, color, occupied)} />
                      </div>
                    );
                  })}
                  {/* (RED/ORANGE warning faces now unified into the true-scale CAPS above.) */}
                  {/* HI 1.3.3 — the VOXEL COLUMN owns the asset's on-cube UI (placed.map
                      suppresses the flat marker for a column-backed asset): a SHIELD badge
                      pinned to the LEVEL-1 bottom cell (always at the surface, decoupled from
                      altitude), a DOT at the object's TRUE altitude band, a draggable AGL chip
                      (no connector), and billboarded top-face coordinates. bandPx == cellPx so the
                      cube stays cubic across tiers; the altitude rail is pinned via cellW in limitZ. */}
                  {topObj && (() => {
                    const pObj = placed.find((u) => u.id === topObj.id);
                    const ac = pObj?.aff === "hostile" ? C.red : C.cyan;
                    const aglM = Math.round(topObj.altRef === "AGL" ? topObj.altM : topObj.mslM - col.terrainM);
                    const nkey = typeof topObj.id === "number" ? topObj.id : null;
                    const off = (nkey != null ? aglOffs[nkey] : undefined) ?? { x: 0, y: cellPx / 2 + 8 };
                    const bb = is3d ? ` rotateX(${-(pitch ?? 55)}deg)` : ""; // billboard upright off the tilted plane
                    // NB: for an aerial asset the true-altitude cube COLUMN (above) is the projector —
                    // the icon/chip/dot ride its top (markerZ). No separate stem needed.
                    return (
                      <>
                        {/* (1) SHIELD — billboarded affiliation badge, at the aircraft's TRUE altitude */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ opacity: dimmed ? 0.4 : 1,
                          transform: `translate(-50%,-50%) translateZ(${markerZ}px)${bb}` }}>
                          <span className="flex items-center justify-center rounded-md" style={{ padding: 2,
                            background: `${ac}1e`, border: `1px solid ${ac}`, boxShadow: `0 0 6px ${ac}55` }}>
                            {pObj
                              ? <AssetIcon asset={pObj.asset} style={iconStyle} affiliation={pObj.aff} size={20 * iconScale} count={pObj.count} />
                              : <span className="block rounded-full" style={{ width: 8, height: 8, background: ac }} />}
                          </span>
                        </div>
                        {/* (2) AGL chip — draggable (FAAD-hook drag pattern, NO connector line), Level-1 cell.
                            Tap (no drag) pops the cube-centre coordinate call-up packet. */}
                        <div className="absolute left-1/2 top-1/2" onPointerDown={(e) => e.stopPropagation()} style={{ pointerEvents: "auto",
                          transform: `translate(-50%,-50%) translate3d(${off.x}px,${off.y}px,${markerZ}px)${bb}` }}>
                          <button title="Drag · tap = cube-centre coordinate + AGL"
                            onPointerDown={(e) => {
                              e.stopPropagation(); e.preventDefault();
                              const sx = e.clientX, sy = e.clientY, ox = off.x, oy = off.y; let moved = false;
                              const move = (ev: PointerEvent) => {
                                if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) moved = true;
                                if (nkey != null) setAglOffs((os) => ({ ...os, [nkey]: { x: ox + (ev.clientX - sx), y: oy + (ev.clientY - sy) } }));
                              };
                              const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); if (!moved) setCoordCall({ lat: col.lat, lon: col.lon }); };
                              document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
                            }}
                            className="cursor-move whitespace-nowrap rounded px-1 font-mono text-[7px] font-bold leading-tight"
                            style={{ background: "#0a0f16dd", color: ac, border: `1px solid ${ac}66` }}>
                            AGL {aglM}m
                          </button>
                        </div>
                        {/* (3) DOT — the object's TRUE altitude, at the cell centre (its real 3D spot) */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ transform: `translate(-50%,-50%) translateZ(${markerZ}px)${bb}` }}>
                          <span className="block rounded-full" style={{ width: 6, height: 6, background: topObj.color ?? ac, boxShadow: `0 0 6px ${topObj.color ?? ac}` }} />
                        </div>
                        {/* (4) TOP-FACE coords (CENTRE + 4 CORNERS) — HIDDEN by default to keep the
                            voxel clean; shown ONLY when the asset is SELECTED (clicked). In 3D the
                            AGL chip is the single always-on voxel label (HI: too busy otherwise). */}
                        {(sel || selAsset) && (
                        <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
                          <span className="absolute left-0 top-0 whitespace-nowrap rounded px-0.5 font-mono text-[6px] font-bold" style={{ background: "#0a0f16cc", color: sel ? C.gold : ac,
                            transform: `translate(-50%,-150%) translateZ(${topZ + bandPx * 0.35}px)${bb}` }}>
                            {fmt.coordAt(col.lat, col.lon)}
                          </span>
                          {col.corners.map((cn, ci) => {
                            const cx = (ci === 0 || ci === 3 ? -1 : 1) * (cellPx / 2);
                            const cy = (ci === 0 || ci === 1 ? -1 : 1) * (cellPx / 2);
                            return (
                              <span key={`tfc${ci}`} className="absolute left-0 top-0 whitespace-nowrap rounded px-0.5 font-mono text-[5px]" style={{ background: "#0a0f16aa", color: C.dim,
                                transform: `translate(-50%,-50%) translate3d(${cx}px,${cy}px,${topZ}px)${bb}` }}>
                                {fmt.coordAt(cn.lat, cn.lon)}
                              </span>
                            );
                          })}
                        </div>
                        )}
                      </>
                    );
                  })()}
                  {/* CUBE TOP (P1 slice B) — TARGET circle pops the CENTRE coordinate;
                      4 corner hotspots pop CORNER coordinates (call-up packet) */}
                  <div className="absolute left-1/2 top-1/2" style={{ width: cellPx, height: cellPx, transform: `translate(-50%,-50%) translateZ(${topZ}px)`, pointerEvents: "auto" }}
                    onMouseEnter={() => setVoxelTop(col.key)}
                    onMouseLeave={() => setVoxelTop((h) => (h === col.key ? null : h))}
                    onPointerUp={(e) => { e.stopPropagation(); setVoxelSel(sel ? null : col.key); }} /* FX-30 (HI): tap the TOP face to HIGHLIGHT this whole column (tap again to release) */>
                    {/* FX-30: top-face pick plate — lights on hover, gold when selected, so a
                        stacked column can be chosen by its TOP (independent of any asset) */}
                    <div className="pointer-events-none absolute inset-0" style={{
                      border: `1.5px solid ${sel || voxelTop === col.key ? C.gold : "transparent"}`,
                      background: sel ? `${C.gold}22` : voxelTop === col.key ? `${C.gold}12` : "transparent" }} />
                    {/* TARGET — same proportions as the 3D crosshair cursor: outer ring,
                        INNER ring, NSEW crosshair ticks, gold centre dot. FX-15 (HI 1.3.2):
                        targets belong ONLY to asset/support cubes — an empty lattice cell
                        gets NO reticle; hover+select its TOP to highlight the whole column
                        instead (3-D column-reading, not a firing target). */}
                    {!isLattice && (
                    <button onPointerUp={(e) => { e.stopPropagation(); setCoordCall({ lat: col.lat, lon: col.lon }); }}
                      title="TARGET — cube centre coordinate"
                      onMouseEnter={() => setCornerHover({ key: col.key, ci: -1 })} /* FX-02 (HI): hover the asset cube CENTRE-top → show its coordinate */
                      onMouseLeave={() => setCornerHover((h) => (h && h.key === col.key && h.ci === -1 ? null : h))}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ width: Math.max(22, cellPx * 0.5), height: Math.max(22, cellPx * 0.5), background: "transparent" }}>
                      {(() => { const tc = sel ? C.gold : C.cyan; return (
                        <svg viewBox="-17 -17 34 34" width="100%" height="100%" aria-hidden>
                          <circle r="15.5" fill="none" stroke={tc} strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0.9" />
                          <circle r="10" fill="none" stroke={tc} strokeWidth="0.9" vectorEffect="non-scaling-stroke" opacity="0.65" />
                          <line x1="0" y1="-15" x2="0" y2="-4" stroke={tc} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                          <line x1="0" y1="4" x2="0" y2="15" stroke={tc} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                          <line x1="-15" y1="0" x2="-4" y2="0" stroke={tc} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                          <line x1="4" y1="0" x2="15" y2="0" stroke={tc} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                          <text x="0" y="-11.5" textAnchor="middle" fontSize="4.5" fill={tc} fontFamily="monospace">N</text>
                          <text x="0" y="15" textAnchor="middle" fontSize="4.5" fill={tc} fontFamily="monospace">S</text>
                          <text x="12.5" y="1.6" textAnchor="middle" fontSize="4.5" fill={tc} fontFamily="monospace">E</text>
                          <text x="-12.5" y="1.6" textAnchor="middle" fontSize="4.5" fill={tc} fontFamily="monospace">W</text>
                          <circle r="1" fill={C.gold} />
                        </svg>
                      ); })()}
                    </button>
                    )}
                    {col.corners.map((cn, ci) => (
                      <button key={ci} onPointerUp={(e) => { e.stopPropagation(); setCoordCall({ lat: cn.lat, lon: cn.lon }); }}
                        onMouseEnter={() => setCornerHover({ key: col.key, ci })}
                        onMouseLeave={() => setCornerHover((h) => (h && h.key === col.key && h.ci === ci ? null : h))}
                        title={`${["NW", "NE", "SE", "SW"][ci]} · ${fmt.coordAt(cn.lat, cn.lon)} · ${Math.round(sampler(cn.lat, cn.lon)).toLocaleString()}m MSL`}
                        className="absolute h-2.5 w-2.5 rounded-sm"
                        style={{ ...(ci === 0 ? { left: -5, top: -5 } : ci === 1 ? { right: -5, top: -5 } : ci === 2 ? { right: -5, bottom: -5 } : { left: -5, bottom: -5 }),
                          border: `1px solid ${cornerHover?.key === col.key && cornerHover.ci === ci ? C.gold : C.cyan}`, background: "#0a0f16cc" }} />
                    ))}
                    {/* P1.2 (Odin): hover chip — corner coordinate (settings format) + elevation.
                        FX-15 (P1.3): chip sits fully OUTSIDE the cube top so it never covers
                        the TARGET or the corner being read. */}
                    {cornerHover?.key === col.key && (() => {
                      const isCtr = cornerHover.ci === -1; // FX-02: centre-top hover
                      const cn = isCtr ? { lat: col.lat, lon: col.lon } : col.corners[cornerHover.ci];
                      const label = isCtr ? "CTR" : ["NW", "NE", "SE", "SW"][cornerHover.ci];
                      return (
                        <div className="pointer-events-none absolute z-30 whitespace-nowrap rounded px-1 py-0.5 font-mono text-[7px] font-bold"
                          style={{ ...(isCtr ? { left: "50%", bottom: "100%", transform: "translateX(-50%)", marginBottom: 8 }
                            : cornerHover.ci === 0 ? { right: "100%", bottom: "100%", marginRight: 6, marginBottom: 6 }
                            : cornerHover.ci === 1 ? { left: "100%", bottom: "100%", marginLeft: 6, marginBottom: 6 }
                            : cornerHover.ci === 2 ? { left: "100%", top: "100%", marginLeft: 6, marginTop: 6 }
                            : { right: "100%", top: "100%", marginRight: 6, marginTop: 6 }),
                            background: "#0a0f16ee", color: C.gold, border: `1px solid ${C.gold}55` }}>
                          {label} {fmt.coordAt(cn.lat, cn.lon)} · {Math.round(sampler(cn.lat, cn.lon))}m MSL
                        </div>
                      );
                    })()}
                  </div>
                  {/* hooked/selected asset → GOLD STEM terrain→object + shadow footprint (P2,
                      spec altitude visual law) + AGL flanks LEFT, MSL flanks RIGHT (P1) */}
                  {topObj && (sel || (selected?.kind === "asset" && col.objects.some((o) => o.id === selected.id))) && (
                    <>
                      {/* HI 1.3.2: replace the solid gold stem with a DOTTED CYLINDER cage
                          at the TARGET inner-ring radius (asset columns only) — 8 dashed
                          vertical struts terrain→object read as a translucent column, not a
                          hard line. */}
                      {Array.from({ length: 8 }).map((_, k) => {
                        const ang = (k / 8) * Math.PI * 2;
                        const rCyl = Math.max(6, cellPx * 0.15); // ≈ TARGET inner-circle radius
                        const cx = rCyl * Math.cos(ang), cy = rCyl * Math.sin(ang);
                        return (
                          <div key={`cyl${k}`} className="pointer-events-none absolute left-1/2 top-1/2" style={{ width: 1, height: topZ,
                            background: `repeating-linear-gradient(to bottom, ${C.gold} 0 1.5px, transparent 1.5px 4px)`, opacity: 0.8,
                            transform: `translate(-50%,-50%) translate3d(${cx}px,${cy}px,${topZ / 2}px) rotateX(90deg)` }} />
                        );
                      })}
                      {/* AGL/MSL flanks REMOVED (HI 1.3.3): the coordinate + AGL now live in the
                          LEVEL-1 SHIELD chip that the voxel column owns for this asset. The gold
                          dotted cylinder cage above stays as the select/hook terrain→object cue. */}
                    </>
                  )}
                  {/* P1.2 (Enki): 3D track vector — heading arrow drawn AT the mover's altitude
                      band top (its cube), same thin non-scaling style as the ground vector */}
                  {col.objects.map((o) => {
                    const p = placed.find((u) => u.id === o.id);
                    if (!p || !p.moving || p.heading == null) return null;
                    const oAltM = o.altRef === "AGL" ? o.altM : Math.max(0, o.mslM - col.terrainM);
                    const zb = Math.max(1, oAltM * altPxPerM); // TRUE altitude, tracks zoom
                    const th = (p.heading * Math.PI) / 180;
                    const len = cellPx * (0.55 + Math.min(0.65, (p.speed ?? 0) / 600));
                    const vc = p.aff === "hostile" ? C.red : C.green;
                    const hx = len * Math.sin(th), hy = -len * Math.cos(th);
                    const a1 = th + Math.PI * 0.85, a2 = th - Math.PI * 0.85, hd = Math.max(4, cellPx * 0.1);
                    const vw3 = p.lineW ?? 0.5;
                    return (
                      <svg key={`vec3${o.id}`} className="pointer-events-none absolute left-1/2 top-1/2" width={cellPx * 3} height={cellPx * 3}
                        viewBox={`${-cellPx * 1.5} ${-cellPx * 1.5} ${cellPx * 3} ${cellPx * 3}`} style={{ transform: `translate(-50%,-50%) translateZ(${zb}px)`, overflow: "visible" }}>
                        <line x1={0} y1={0} x2={hx} y2={hy} stroke={vc} strokeWidth={vw3} vectorEffect="non-scaling-stroke" opacity="0.85" />
                        <line x1={hx} y1={hy} x2={hx + hd * Math.sin(a1)} y2={hy - hd * Math.cos(a1)} stroke={vc} strokeWidth={vw3} vectorEffect="non-scaling-stroke" opacity="0.85" />
                        <line x1={hx} y1={hy} x2={hx + hd * Math.sin(a2)} y2={hy - hd * Math.cos(a2)} stroke={vc} strokeWidth={vw3} vectorEffect="non-scaling-stroke" opacity="0.85" />
                      </svg>
                    );
                  })}
                  {/* stack-top label — ALWAYS carries the altitude reference (visual law) */}
                  {topObj && (
                    <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ transform: `translate(-50%,-100%) translateZ(${topZ + 6}px)` }}>
                      <span className="whitespace-nowrap rounded px-1 font-mono text-[7px] font-bold" style={{ background: "#0a0f16cc", color: topObj.color ?? C.cyan }}>
                        {fmtAlt(topObj.altM, topObj.altRef, col.lat, col.lon)} · Z{topObj.bandIdx}{col.objects.length > 1 ? ` +${col.objects.length - 1}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {/* ── 3D VOXEL LATTICE — ONE north-locked 3×3×3 wireframe box (replaces the 9 lattice
                   columns; council-designed, 12-master SSSES synthesis). ONE projection at view
                   centre → every cell/corner is a pure cellPx offset, so top plates ALIGN and the
                   4×4 corners collapse to 16 shared posts. ~33 idle nodes (was ~135). Read-only. */}
            {is3d && voxelLayer && latticeColumns.length === 9 && [view.lat, view.lon].every(Number.isFinite) && (() => {
              const bc = project(view.lat, view.lon);
              const paneW = mapRef.current?.clientWidth ?? 800;
              const cellW = Math.max(16, (effCellM / (view.spanKm * 1000)) * paneW); // full cell px (altitude reference — never shrinks)
              // FX (HI 1.3.3): SIZE TIER — 3X full · 2X ⅔ · 1X ⅓ scales the whole CUBE uniformly.
              // bandPx == cellPx keeps the box CUBIC (base + height shrink together, never a tower);
              // the grey altitude rail stays fixed via the UNSCALED cellW term in limitZ below.
              const cellPx = cellW * VOXEL_BASE_SCALE[voxelSize]; // BASE footprint — shrinks with the tier
              const boxW = 3 * cellPx;
              const bandPx = cellPx;                              // VERTICAL unit == base ⇒ cube stays cubic
              const topZ = 3 * bandPx;
              const railBands = Math.max(latticeColumns[0].cubes.filter((cb) => cb.bandIdx > 0).length, 3);
              const limitZ = Math.max(topZ, (voxelLimitPct / 100) * railBands * cellW);
              const line = `${C.cyan}55`;
              const selIdx = latticeColumns.findIndex((c) => c.key === voxelSel);
              const dim = selIdx >= 0 ? 0.35 : 1;                        // rest dims when one column is picked
              const p = pitch ?? 55;
              const skyK = p > 85 ? Math.max(0, (88 - p) / 3) : 1;       // fade tall lines near-overhead
              const at = (t: string): React.CSSProperties => ({ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) ${t}` });
              return (
                <div className="absolute" style={{ left: `${bc.fx * 100}%`, top: `${bc.fy * 100}%`, transformStyle: "preserve-3d", zIndex: 11, transform: `rotateZ(${view.bearing}rad)` }}>
                  {/* (a) 4 horizontal 3×3 grid faces — outer faces (floor/top) get a SOLID 2px
                       cube edge; the two middle levels are thin interior lines. */}
                  {[0, 1, 2, 3].map((k) => {
                    const outer = k === 0 || k === 3;
                    return (
                      <div key={`vf${k}`} className="pointer-events-none" style={{ ...at(`translateZ(${k * bandPx}px)`),
                        width: boxW, height: boxW, border: `${outer ? 2 : 1}px solid ${C.cyan}${outer ? "cc" : "40"}`, opacity: dim,
                        backgroundImage:
                          `repeating-linear-gradient(to right, ${line} 0 1px, transparent 1px ${cellPx}px),` +
                          `repeating-linear-gradient(to bottom, ${line} 0 1px, transparent 1px ${cellPx}px)` }} />
                    );
                  })}
                  {/* (b) 16 vertical edges — the 4 OUTER cube corners are SOLID 2px; the 12
                       interior posts are thin subdivision lines. */}
                  {Array.from({ length: 16 }, (_, n) => {
                    const i = n % 4, j = (n / 4) | 0, x = (i - 1.5) * cellPx, y = (j - 1.5) * cellPx;
                    const corner = (i === 0 || i === 3) && (j === 0 || j === 3);
                    return <div key={`ve${n}`} className="pointer-events-none" style={{
                      ...at(`translate3d(${x}px,${y}px,${topZ / 2}px) rotateX(90deg)`),
                      width: corner ? 2 : 1, height: topZ, background: corner ? `${C.cyan}cc` : line,
                      opacity: (corner ? 0.9 : 0.4 * skyK + 0.12) * dim }} />;
                  })}
                  {/* (c) SELECTED column → highlighted DOWN to ground in voxelHiColor (4 side walls) */}
                  {selIdx >= 0 && (() => {
                    const cx = ((selIdx % 3) - 1) * cellPx, cy = (((selIdx / 3) | 0) - 1) * cellPx;
                    const wall = (t: string, w: number, h: number) => (
                      <div className="pointer-events-none" style={{ ...at(`translate3d(${cx}px,${cy}px,${topZ / 2}px) ${t}`),
                        width: w, height: h, border: `1.5px solid ${voxelHiColor}`, background: `${voxelHiColor}1e` }} />
                    );
                    return <>
                      {wall(`translate3d(0,${-cellPx / 2}px,0) rotateX(90deg)`, cellPx, topZ)}
                      {wall(`translate3d(0,${cellPx / 2}px,0) rotateX(90deg)`, cellPx, topZ)}
                      {wall(`translate3d(${-cellPx / 2}px,0,0) rotateY(90deg)`, topZ, cellPx)}
                      {wall(`translate3d(${cellPx / 2}px,0,0) rotateY(90deg)`, topZ, cellPx)}
                    </>;
                  })()}
                  {/* (d) TOP FACE — 3×3 hover/select cells. Hover lights 1/9; click selects column */}
                  {latticeColumns.map((lc, idx) => {
                    const x = ((idx % 3) - 1) * cellPx, y = (((idx / 3) | 0) - 1) * cellPx;
                    const sel = voxelSel === lc.key, hov = voxelTop === lc.key;
                    return (
                      <div key={lc.key} title={`${lc.mgrs} · ${lc.ucrs}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseEnter={() => setVoxelTop(lc.key)}
                        onMouseLeave={() => setVoxelTop((h) => (h === lc.key ? null : h))}
                        onPointerUp={(e) => { e.stopPropagation(); setVoxelSel(sel ? null : lc.key); }}
                        style={{ ...at(`translate3d(${x}px,${y}px,${topZ}px)`), width: cellPx, height: cellPx,
                          pointerEvents: "auto", cursor: "pointer", transition: "background 120ms ease",
                          border: `1px solid ${sel ? voxelHiColor : hov ? C.gold : line}`,
                          background: sel ? `${voxelHiColor}33` : hov ? `${C.gold}22` : "transparent" }} />
                    );
                  })}
                  {/* (e) voxel-limit REACH — dotted verticals from box top up to limitZ, 4 outer corners */}
                  {limitZ > topZ + 1 && ([[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]] as const).map(([sx, sy], n) => (
                    <div key={`vl${n}`} className="pointer-events-none" style={{
                      ...at(`translate3d(${sx * cellPx}px,${sy * cellPx}px,${(topZ + limitZ) / 2}px) rotateX(90deg)`),
                      width: 1, height: limitZ - topZ, opacity: 0.6 * skyK,
                      background: "repeating-linear-gradient(to bottom, #6b7280 0 2px, transparent 2px 5px)" }} />
                  ))}
                  {/* (f) SKYWARD TOP FACE — the SECOND face: a 3×3 grey ceiling grid drawn where
                       the grey voxel-limit lands (solid 2px grey edge), only when the limit rises
                       above the cube top. */}
                  {limitZ > topZ + 1 && (
                    <div className="pointer-events-none" style={{ ...at(`translateZ(${limitZ}px)`), width: boxW, height: boxW,
                      border: "2px solid #9ca3afcc", opacity: 0.6 * skyK,
                      backgroundImage:
                        `repeating-linear-gradient(to right, #6b728077 0 1px, transparent 1px ${cellPx}px),` +
                        `repeating-linear-gradient(to bottom, #6b728077 0 1px, transparent 1px ${cellPx}px)` }} />
                  )}
                </div>
              );
            })()}
            {/* ── β WORLD DISC — the ground reads as a full CIRCLE of land(green)/ocean(blue)
                 filling the dome footprint, instead of a square. The existing Natural-Earth
                 land/ocean base fill already covers the whole canvas, so we just MASK everything
                 OUTSIDE the dome-footprint circle to dark (a spotlight box-shadow), sharing the
                 dome's own centre (bc) + radius (R) so the disc rim = dome floor ring by
                 construction. β map engine only; α keeps the shipped square map. */}
            {is3d && mapEngine === "beta" && [view.lat, view.lon].every(Number.isFinite) && (() => {
              const bc = project(view.lat, view.lon);
              const paneW = mapRef.current?.clientWidth ?? 800;
              const paneH = mapRef.current?.clientHeight ?? 600;
              // HI RULE — the disc R (= dome 20·x) reaches to WHICHEVER is furthest:
              //   r = furthest distance visible on screen (½-diagonal, STRETCHED toward the horizon
              //       as the camera pitches back), or  A = the altitude ceiling in px.
              //   R = max(r, A):  r > A → circle reaches the furthest view · A > r → altitude drives it.
              const topFt = maxAltFt ?? autoCeilingFt(view.spanKm);
              const pxPerM = paneW / Math.max(1, view.spanKm * 1000);
              const altPx = topFt * 0.3048 * pxPerM;                              // A
              const horizonStretch = 1 + Math.max(0, ((pitch ?? 55) - 45)) / 22;
              const screenPx = Math.hypot(paneW / 2, paneH / 2) * horizonStretch; // r
              const R = Math.max(screenPx, altPx);                                // 20·x = max(r, A)
              const NRr = 4, NSp = 12;                        // polar floor: range rings · bearing spokes
              return (
                <>
                  {/* PERF FIX (HI 'map slowing down'): mask is a cheap RADIAL-GRADIENT — transparent
                      inside the disc, dark outside — NOT a 0 0 0 9999px box-shadow (that huge shadow
                      recomposited the whole pane every frame during drag/tilt). */}
                  <div className="pointer-events-none absolute inset-0" style={{ zIndex: 3,
                    background: `radial-gradient(circle ${R.toFixed(0)}px at ${(bc.fx * 100).toFixed(2)}% ${(bc.fy * 100).toFixed(2)}%, transparent 0, transparent 99%, #070b11 100%)` }} />
                  {/* polar FLOOR grid — concentric range rings + radial bearing spokes, bearing-locked */}
                  <div className="pointer-events-none absolute" style={{ left: `${bc.fx * 100}%`, top: `${bc.fy * 100}%`,
                    zIndex: 4, transform: `translate(-50%,-50%) rotateZ(${view.bearing}rad)`, transformStyle: "preserve-3d" }}>
                    {Array.from({ length: NRr }, (_, k) => {
                      const rr = R * ((k + 1) / NRr);
                      return <div key={`prr${k}`} className="pointer-events-none absolute rounded-full" style={{ left: "50%", top: "50%",
                        width: 2 * rr, height: 2 * rr, transform: "translate(-50%,-50%)", border: `1px solid ${C.cyan}22` }} />;
                    })}
                    {Array.from({ length: NSp }, (_, k) => {
                      const ang = (k / NSp) * 360;
                      return <div key={`psp${k}`} className="pointer-events-none absolute" style={{ left: "50%", top: "50%",
                        width: R, height: 1, transformOrigin: "0 50%", transform: `rotate(${ang}deg)`, background: `${C.cyan}1e` }} />;
                    })}
                  </div>
                </>
              );
            })()}
            {/* ── UCRS-2525 SKY DOME — a hemispherical grid over the AO (a celestial dome that
                 can host sun / moon / planets and horizon-projected distant contacts). Latitude
                 rings (flat circles at height) + meridian arches (SVG half-ellipses standing
                 vertically). Its apex height = the altitude scale of the area, so when the ground
                 AGL surface ends you see the dome behind it. Gated on 3D + ▦ VOXEL. */}
            {is3d && domeOn && [view.lat, view.lon].every(Number.isFinite) && (() => {
              const bc = project(view.lat, view.lon);
              const paneW = mapRef.current?.clientWidth ?? 800;
              // HI: dome REACH = whichever is highest — the distance from centre to the map EDGE,
              // or the ALTITUDE ceiling (dimensionally accurate) — so a 10k-ft ceiling over a 100k
              // span reads sensibly instead of a confusing flat sliver. Hemisphere (H = R).
              const topFt = maxAltFt ?? autoCeilingFt(view.spanKm);
              const pxPerM = paneW / Math.max(1, view.spanKm * 1000);
              const altPx = topFt * 0.3048 * pxPerM;        // A — altitude ceiling in px
              const paneH = mapRef.current?.clientHeight ?? 600;
              // HI RULE (locked to the β disc): dome floor radius R (= 20·x) = max(r, A) where
              //   r = furthest ground distance visible on screen (½-diagonal stretched toward the
              //       horizon by pitch), A = altitude ceiling. A > r → altitude drives the dome;
              //   r > A → the floor circle reaches the furthest view (far in the distance).
              const horizonStretch = 1 + Math.max(0, ((pitch ?? 55) - 45)) / 22;
              const screenPx = Math.hypot(paneW / 2, paneH / 2) * horizonStretch; // r
              const R = Math.max(screenPx, altPx);                                // 20·x = max(r, A)
              // Apex HEIGHT = the true altitude ceiling (A). When altitude dominates (R = A) this is a
              // full hemisphere; when the view radius dominates (R = r) it's a wide shallow dome whose
              // apex still marks the real airspace ceiling. Min keeps it readable as a dome.
              const H = Math.max(altPx, R * 0.12);
              const p = pitch ?? 55;
              // HI: the dome IS the sky backdrop — it must NOT fade at high tilt (removed the old
              // anti-phantom skyK fade); the operator looks across the horizon to see it.
              const col = C.cyan;
              const NR = 6, NM = 6;                         // latitude rings · meridian arches
              const at = (t: string): React.CSSProperties => ({ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) ${t}` });
              return (
                <div className="pointer-events-none absolute" style={{ left: `${bc.fx * 100}%`, top: `${bc.fy * 100}%`,
                  transformStyle: "preserve-3d", zIndex: 12, transform: `rotateZ(${view.bearing}rad)`, opacity: 0.9 }}>
                  {/* FLOOR — ALWAYS a circular base ring at ground level, in BOTH dome styles.
                      Only the SKY DOME above it changes between GRID lines and HEX panels. */}
                  <div className="rounded-full" style={{ ...at(`translateZ(0px)`), width: 2 * R, height: 2 * R, border: `${domeThick}px solid ${col}aa` }} />
                  {/* GRID style — latitude rings (flat circles at height) + meridian arches (SVG). */}
                  {domeMode === "grid" && <>
                    {Array.from({ length: NR + 1 }, (_, k) => {
                      const th = (k / NR) * (Math.PI / 2);
                      const r = R * Math.cos(th), z = H * Math.sin(th);
                      if (r < 1 || k === 0) return null; // k=0 floor is drawn always (above)
                      return <div key={`dlr${k}`} className="rounded-full" style={{ ...at(`translateZ(${z}px)`),
                        width: 2 * r, height: 2 * r, border: `${domeThick}px solid ${col}99` }} />;
                    })}
                    {Array.from({ length: NM }, (_, m) => {
                      const phi = (m / NM) * 180;
                      return (
                        <svg key={`dm${m}`} width={2 * R} height={H} viewBox={`0 0 ${2 * R} ${H}`} style={{ position: "absolute", left: "50%", top: "50%",
                          marginLeft: -R, marginTop: -H, transformOrigin: "50% 100%", transform: `rotateZ(${phi}deg) rotateX(-90deg)`, overflow: "visible" }}>
                          <path d={`M 0 ${H} A ${R} ${H} 0 0 1 ${2 * R} ${H}`} fill="none" stroke={col} strokeWidth={domeThick * 1.6} opacity="0.9" />
                        </svg>
                      );
                    })}
                  </>}
                  {/* HEX style — hexagonal panels tiled over the dome (flower-of-life / geodesic).
                      First pass: billboarded hex outlines at ring×azimuth grid points; alternate
                      rings offset by half a step so they interlace. Apex closed by the last ring. */}
                  {domeMode === "hex" && (() => {
                    // HI SPEC (fixed geodesic — looks identical at every zoom because R is viewport-fitted,
                    // so x scales with zoom): dome R = 20·x; panel flat-to-flat = 2·x (ring/column pitch);
                    // hex side = 1.155·x; vertex-to-vertex = 2.309·x; 10.09° angular pitch per panel
                    // (17.84 panels N-horizon→apex→S-horizon = 180°). All in PIXELS.
                    const x = R / 20;
                    const pitch = 2 * x;                       // flat-to-flat spacing (row/column pitch)
                    const hexCirc = 1.155 * x;                 // centre→vertex (= side); v2v = 2·1.155·x = 2.309·x
                    // Ring angular step = hex ROW HEIGHT (1.5·side) ÷ R — the pitch that TILES the
                    // hemisphere: Σ ≈ (2πR²)/(3.464x²) = 726 panels for the full demi-dome (HI spec).
                    const step = (1.5 * hexCirc) / R;
                    const domePt = (alt: number, az: number) => ({ x: R * Math.cos(alt) * Math.sin(az), y: -R * Math.cos(alt) * Math.cos(az), z: H * Math.sin(alt) });
                    const cells: { x: number; y: number; z: number; az: number; alt: number; key: string }[] = [];
                    const nRings = Math.round((Math.PI / 2) / step);   // apex → horizon (~18 rings)
                    for (let k = 0; k <= nRings; k++) {
                      const alt = Math.min(Math.PI / 2 - 0.012, k * step);
                      const r = R * Math.cos(alt);
                      const M = Math.max(1, Math.round((2 * Math.PI * r) / pitch));
                      for (let j = 0; j < M; j++) {
                        const az = (j / M) * 2 * Math.PI + (k % 2) * (Math.PI / M); // interlace alternate rings
                        cells.push({ ...domePt(alt, az), az, alt, key: `hx${k}_${j}` });
                      }
                    }
                    const pts = Array.from({ length: 6 }, (_, i) => {
                      const a = (i / 6) * 2 * Math.PI + Math.PI / 6; // flat-top hexagon
                      return `${(hexCirc + hexCirc * Math.cos(a)).toFixed(1)},${(hexCirc + hexCirc * Math.sin(a)).toFixed(1)}`;
                    }).join(" ");
                    return cells.map((c) => (
                      // TANGENT to the dome (rotateZ=azimuth, rotateX tilts to the elevation) so the
                      // hexagons INTERLOCK at their seams on the curved surface — NOT billboarded.
                      <svg key={c.key} width={2 * hexCirc} height={2 * hexCirc} viewBox={`0 0 ${2 * hexCirc} ${2 * hexCirc}`}
                        style={{ position: "absolute", left: "50%", top: "50%", overflow: "visible",
                          transform: `translate(-50%,-50%) translate3d(${c.x}px,${c.y}px,${c.z}px) rotateZ(${((c.az * 180) / Math.PI).toFixed(1)}deg) rotateX(${(((c.alt * 180) / Math.PI) - 90).toFixed(1)}deg)` }}>
                        <polygon points={pts} fill={`${col}12`} stroke={col} strokeWidth={domeThick} opacity="0.85" />
                      </svg>
                    ));
                  })()}
                  {/* ── CELESTIAL — sun + moon on the dome at their (azimuth, altitude) for the AO
                       lat/lon + time, with their diurnal ARC path (rise→transit→set). Deterministic
                       astronomy (no live data), so the dome doubles as a real celestial sphere. */}
                  {now && (() => {
                    // (az from N cw, alt above horizon) → dome surface: r = R·cos(alt), z = H·sin(alt)
                    const domePt = (az: number, alt: number) => ({ x: R * Math.cos(alt) * Math.sin(az), y: -R * Math.cos(alt) * Math.cos(az), z: H * Math.sin(alt) });
                    const sunNow = getSunPosition(now, view.lat, view.lon);
                    const moon = { pos: getMoonPosition(now, view.lat, view.lon), arc: skyArc(getMoonPosition, now, view.lat, view.lon) };
                    return (
                      <>
                        {/* SUN arc drawn as HOUR HASHES (local/CST placeholder) — read the time of
                            day off the sun's path; every 3rd hour labelled, 00/06/12/18 major. */}
                        {Array.from({ length: 24 }, (_, h) => {
                          const d = new Date(now); d.setHours(h, 0, 0, 0);
                          const sp = getSunPosition(d, view.lat, view.lon);
                          if (sp.altitude <= 0.02) return null;
                          const q = domePt(sp.azimuth, sp.altitude);
                          const major = h % 6 === 0;
                          return (
                            <Fragment key={`sh${h}`}>
                              <div className="pointer-events-none rounded-full" style={{ ...at(`translate3d(${q.x}px,${q.y}px,${q.z}px)`),
                                width: major ? 4 : 2.5, height: major ? 4 : 2.5, background: "#fbbf24", opacity: major ? 0.95 : 0.55 }} />
                              {h % 3 === 0 && <div className="pointer-events-none font-mono font-bold" style={{ ...at(`translate3d(${q.x + 4}px,${q.y - 4}px,${q.z}px)`),
                                fontSize: 6, color: "#fbbf24", opacity: 0.9 }}>{h}</div>}
                            </Fragment>
                          );
                        })}
                        {/* current SUN */}
                        {sunNow.altitude > 0 && (() => { const q = domePt(sunNow.azimuth, sunNow.altitude);
                          return <div className="pointer-events-none rounded-full" style={{ ...at(`translate3d(${q.x}px,${q.y}px,${q.z}px)`),
                            width: 9, height: 9, background: "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b)", boxShadow: "0 0 11px #fbbf24", border: "1px solid #fde68a" }} />; })()}
                        {/* MOON arc dots + current moon */}
                        {moon.arc.filter((pt) => pt.altitude > -0.03).map((pt, i) => { const q = domePt(pt.azimuth, Math.max(0, pt.altitude));
                          return <div key={`ma${i}`} className="pointer-events-none rounded-full" style={{ ...at(`translate3d(${q.x}px,${q.y}px,${q.z}px)`), width: 2, height: 2, background: "#e5e7eb", opacity: 0.4 }} />; })}
                        {moon.pos.altitude > 0 && (() => { const q = domePt(moon.pos.azimuth, moon.pos.altitude);
                          return <div className="pointer-events-none rounded-full" style={{ ...at(`translate3d(${q.x}px,${q.y}px,${q.z}px)`),
                            width: 6, height: 6, background: "radial-gradient(circle at 35% 30%, #f8fafc, #94a3b8)", boxShadow: "0 0 7px #cbd5e1", border: "1px solid #e5e7eb" }} />; })()}
                      </>
                    );
                  })()}
                </div>
              );
            })()}
            {/* FX-47 (HI 1.3.3): compass = ONE VISUAL FENCE with numbers on it. The distracting
                ground ellipse ring + radial ticks are REMOVED — just a ring of billboarded
                vertical slats (chain-link fence wall) with degree numbers riding the fence.
                N slat + 000 label are red; numbers billboard upright at every tilt. Bearing-
                rotated so the fence tracks map-north. Low node count (~48). Gated on the ▦ VOXEL
                toggle so 3D-without-voxel is clean (no phantom ground ellipse). */}
            {is3d && voxelLayer && (() => {
              const R = 44;
              const num = (deg: number) => deg === 0 ? "N" : deg === 90 ? "E" : deg === 180 ? "S" : deg === 270 ? "W" : String(deg).padStart(3, "0");
              return (
                <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ width: "92%", height: "92%", transform: "translate(-50%,-50%)", transformStyle: "preserve-3d", zIndex: 9 }}>
                  {/* ground ELLIPSE ring + small INWARD notches at each 30° (flat on the plane,
                      bearing-rotated). No tall fence, no spheres — numbers ride short spikes. */}
                  <svg viewBox="-50 -50 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0, transform: `rotateZ(${view.bearing}rad)`, overflow: "visible" }} aria-hidden>
                    <circle r={R} fill="none" stroke={`${C.cyan}88`} strokeWidth="0.22" />
                    {Array.from({ length: 12 }).map((_, i) => {
                      const deg = i * 30, a = (deg * Math.PI) / 180;
                      return <line key={i} x1={R * Math.sin(a)} y1={-R * Math.cos(a)} x2={(R - 2.5) * Math.sin(a)} y2={-(R - 2.5) * Math.cos(a)} stroke={deg === 0 ? C.red : `${C.cyan}aa`} strokeWidth="0.5" />;
                    })}
                  </svg>
                  {/* short spike + degree number ON TOP of it, billboarded, at each 30° */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const deg = i * 30, a = (deg * Math.PI) / 180 + view.bearing;
                    const left = 50 + R * Math.sin(a), top = 50 - R * Math.cos(a);
                    const col = deg === 0 ? C.red : C.cyan;
                    return (
                      <div key={`m${i}`}>
                        <div className="absolute" style={{ left: `${left}%`, top: `${top}%`, width: 1, height: 9, background: `linear-gradient(to top, ${col}cc, ${col}22)`, transform: `translate(-50%,-100%) rotateX(${-(pitch ?? 55)}deg)`, transformOrigin: "50% 100%" }} />
                        <div className="absolute font-mono font-bold" style={{ left: `${left}%`, top: `${top}%`, fontSize: 8.5, lineHeight: 1, color: col, whiteSpace: "nowrap", transform: `translate(-50%,-135%) rotateX(${-(pitch ?? 55)}deg)`, transformOrigin: "50% 100%" }}>{num(deg)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            </div>
            {/* end 3D tilt layer */}
            {/* HI 1.3.2: ONE compact 3D HUD line (was three busy stacked lines). Just the
                key info — TILT angle + how to change it + the 2D-to-place reminder. The
                verbose voxel onboarding is dropped (element tooltips carry the how-to). */}
            {is3d && (
              <div className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 items-center rounded px-1.5 py-0.5 font-mono text-[8px] font-bold" style={{ background: "#0a0f16cc", pointerEvents: "auto" }}>
                <span style={{ color: C.gold }}>TILT {Math.round(pitch ?? 55)}°</span>
                {/* FX-45 (HI 1.3.3): phone slider button 2× larger, to the RIGHT of "2D to place" */}
                <span style={{ color: C.dim }}> · right-drag ↕ · 2D to place · </span>
                <button onClick={() => setTiltSlider((s) => !s)} title="Tilt slider" style={{ fontSize: 16, lineHeight: 1 }}>📱</button>
              </div>
            )}
            {/* FX-45 (HI 1.3.3): tilt slider — 11° left, 88° right, ✕ to close */}
            {is3d && tiltSlider && (
              <div className="absolute right-2 top-9 z-30 rounded border px-2 py-1" style={{ background: "#0a0f16ee", borderColor: C.cyan, width: 190 }}>
                <div className="mb-0.5 flex items-center justify-between font-mono text-[7px] font-bold" style={{ color: C.cyan }}>
                  <span>TILT {Math.round(pitch ?? 55)}°</span>
                  <button onClick={() => setTiltSlider(false)} title="Close" style={{ color: C.dim, fontSize: 11, lineHeight: 1 }}>✕</button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[7px]" style={{ color: C.dim }}>11°</span>
                  <input type="range" min={11} max={88} value={Math.round(pitch ?? 55)} onChange={(e) => onPitch?.(parseInt(e.target.value))} className="flex-1" />
                  <span className="font-mono text-[7px]" style={{ color: C.dim }}>88°</span>
                </div>
              </div>
            )}
            {/* LEFT ALTITUDE rail (R1 feedback) — voxel band scale, reference style.
                FX-05: RED/YELLOW threshold entry at the rail TOP + marker lines;
                FX-09b: top band = maxAltFt when user-set (AUTO = 10k ft);
                labels honor the Units setting via fmt.fmtElev. */}
            {is3d && (() => {
              const topFt = maxAltFt ?? autoCeilingFt(view.spanKm);
              const rFt = topFt * (altRedPct / 100);
              const yFt = topFt * (altYellowPct / 100);
              const levels = [1, 0.75, 0.5, 0.25, 0.1, 0.05].map((k) => Math.round(topFt * k));
              const lbl = (ft: number) => fmt.fmtElev(ft / 3.28084);
              const thrTop = (ft: number) => `${(14 + (1 - Math.min(1, Math.max(0, ft / topFt))) * 68).toFixed(1)}%`;
              return (
                <div className="pointer-events-none absolute bottom-10 left-1 top-9 z-20 flex w-14 flex-col justify-between rounded-2xl px-1.5 py-2" style={{ background: "#0a0f16cc" }}>
                  <span className="text-[6px] font-bold tracking-wider" style={{ color: C.dim }}>ALTITUDE<br />(MSL)</span>
                  {levels.map((ft) => (
                    <span key={ft} className="flex items-center gap-0.5 font-mono text-[7px]" style={{ color: C.text }}>
                      <span className="inline-block h-0.5 w-2 rounded-full" style={{ background: C.cyan }} />{lbl(ft)}
                    </span>
                  ))}
                  <span className="flex items-center gap-0.5 font-mono text-[7px]" style={{ color: C.gold }}>
                    <span className="inline-block h-0.5 w-2 rounded-full" style={{ background: C.gold }} />SURFACE
                  </span>
                  {minElevM < -1 && (
                    <span className="flex items-center gap-0.5 font-mono text-[7px]" style={{ color: "#22d3ee" }}>
                      <span className="inline-block h-0.5 w-2 rounded-full" style={{ background: "#22d3ee" }} />{lbl(minElevM * 3.28084)}
                    </span>
                  )}
                  {/* FX-05: threshold lines — always at % of ceiling, values auto-compute */}
                  <span className="absolute left-0 right-0" style={{ top: thrTop(rFt), height: 2, borderRadius: 1, background: C.red, boxShadow: `0 0 4px ${C.red}` }} />
                  {voxelLimitPct > 0 && (
                    <span className="absolute left-0 right-0" style={{ top: thrTop((voxelLimitPct / 100) * topFt), height: 2, borderRadius: 1, background: "#9ca3af", boxShadow: "0 0 4px #6b7280" }} />
                  )}
                  <span className="absolute left-0 right-0" style={{ top: thrTop(yFt), height: 2, borderRadius: 1, background: C.amber, boxShadow: `0 0 4px ${C.amber}` }} />
                  {/* Lock (far left, above line) → ft number. Tap lock → % / ABS toggle + input. */}
                  {([["r", rFt, C.red, altRedPct, (v: number) => setAltRedPct?.(v)] as const,
                    ["y", yFt, C.amber, altYellowPct, (v: number) => setAltYellowPct?.(v)] as const,
                  ]).map(([id, ft, color, pct, setPct]) => (
                    <span key={id} className="pointer-events-auto absolute flex items-center gap-0.5 rounded px-0.5" style={{ left: -6, top: thrTop(ft), transform: "translateY(-110%)", background: "#0a0e14ee" }}>
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setThrEdit(thrEdit === id ? null : id); setThrMode("%"); }}
                        className="shrink-0 p-0.5" style={{ pointerEvents: "auto" }}>
                        {thrEdit === id ? <Unlock className="h-2.5 w-2.5" style={{ color }} /> : <Lock className="h-2.5 w-2.5" style={{ color, opacity: 0.7 }} />}
                      </button>
                      {thrEdit === id ? (
                        <span className="flex items-center gap-0.5">
                          <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setThrMode(thrMode === "%" ? "abs" : "%"); }}
                            className="rounded border px-1 font-mono text-[6px] font-bold" style={{ borderColor: color, color, pointerEvents: "auto" }}>
                            {thrMode === "%" ? "%" : "ABS"}
                          </button>
                          <input type="text" inputMode="decimal" key={`${id}-${thrMode}`}
                            defaultValue={thrMode === "%" ? pct : Math.round(ft)}
                            onPointerDown={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value);
                              if (Number.isFinite(v) && v > 0) {
                                if (thrMode === "%") { if (v <= 100) setPct(Math.round(v)); }
                                else { setPct(Math.max(1, Math.min(100, Math.round((v / topFt) * 100)))); }
                              }
                              setThrEdit(null);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            className="w-10 rounded border bg-transparent px-0.5 font-mono text-[7px] font-bold" style={{ borderColor: color, color, pointerEvents: "auto" }} autoFocus />
                        </span>
                      ) : (
                        <span className="font-mono text-[7px] font-bold" style={{ color }}>{lbl(ft)}</span>
                      )}
                    </span>
                  ))}
                  {voxelLimitPct > 0 && (
                    <span className="pointer-events-none absolute flex items-center gap-0.5 rounded px-0.5" style={{ left: -6, top: thrTop((voxelLimitPct / 100) * topFt), transform: "translateY(-110%)", background: "#0a0e14ee" }}>
                      <Lock className="h-2.5 w-2.5 shrink-0" style={{ color: "#9ca3af", opacity: 0.7 }} />
                      <span className="font-mono text-[7px] font-bold" style={{ color: "#9ca3af" }}>{lbl((voxelLimitPct / 100) * topFt)}</span>
                    </span>
                  )}
                </div>
              );
            })()}
            {/* COORDINATE CALL-UP (R1) — tap empty ground: the location addressed 3 ways.
                On phones this replaces the mouse-hover readout. */}
            {coordCall && (() => {
              const f = project(coordCall.lat, coordCall.lon);
              const elevM = sampler(coordCall.lat, coordCall.lon);
              return (
                <div className="absolute z-30 max-w-[calc(100%-16px)] w-56 rounded-lg border p-2 text-[8px] shadow-2xl"
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ right: 8, top: 28, background: "#0a0f16ee", borderColor: C.cyan }}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold tracking-wider" style={{ color: C.cyan }}>COORDINATE · CALL-UP</span>
                    <button onPointerUp={(e) => { e.stopPropagation(); setCoordCall(null); }} className="px-1 text-[10px] leading-none" style={{ color: C.dim }}>✕</button>
                  </div>
                  {(() => {
                    const primary: [string, string, string] = coordFmt === "mgrs"
                      ? ["MGRS", fmt.mgrsAt(coordCall.lat, coordCall.lon), C.text]
                      : coordFmt === "dms"
                      ? ["LLV-DMS", fmtLLV(coordCall.lat, coordCall.lon), C.text]
                      : ["UCRS-2525", fmtUcrsDms(coordCall.lat, coordCall.lon), C.cyan];
                    return (
                      <div className="grid grid-cols-[46px_1fr] gap-x-1 gap-y-0.5 font-mono">
                        <span style={{ color: C.dim }}>{primary[0]}</span><span style={{ color: primary[2] }}>{primary[1]}</span>
                        <span style={{ color: C.dim }}>ELEV</span><span style={{ color: C.gold }}>{Math.round(elevM).toLocaleString()} m · {Math.round(elevM * 3.28084).toLocaleString()} ft {elevRef}</span>
                      </div>
                    );
                  })()}
                  <div className="mt-1 flex flex-wrap items-center gap-1 border-t pt-1" style={{ borderColor: C.border }}>
                    {([["mgrs", "MGRS"], ["dms", "LLV-DMS"], ["ucrs", "UCRS-2525"]] as const).map(([fk, lb]) => (
                      <button key={fk} onClick={() => onSetCoordFmt?.(fk)} className="rounded border px-1 py-0"
                        style={{ borderColor: coordFmt === fk ? C.cyan : C.border, color: coordFmt === fk ? C.cyan : C.dim }}>{lb}</button>
                    ))}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1">
                    {(["AGL", "MSL"] as const).map((r) => (
                      <button key={r} onClick={() => setElevRef(r)} className="rounded border px-1 py-0"
                        style={{ borderColor: elevRef === r ? C.gold : C.border, color: elevRef === r ? C.gold : C.dim }}>{r}</button>
                    ))}
                    <span style={{ color: C.border }}>·</span>
                    {(["km", "m", "mi", "ft"] as Unit[]).map((u) => (
                      <button key={u} onClick={() => onSetUnit?.(u)} className="rounded border px-1 py-0 uppercase"
                        style={{ borderColor: paneUnit === u ? C.cyan : C.border, color: paneUnit === u ? C.cyan : C.dim }}>{u}</button>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* VOXEL coordinate packet — the tapped cube base, addressed 3 ways + Z bands */}
            {is3d && voxelSel && (() => {
              const col = voxelColumns.find((c) => c.key === voxelSel) ?? latticeColumns.find((c) => c.key === voxelSel);
              if (!col) return null;
              const f = project(col.lat, col.lon);
              return (
                <div className="absolute z-30 w-56 rounded-lg border p-2 text-[8px] shadow-2xl"
                  onPointerDown={(e) => e.stopPropagation()} /* keep the map from capturing the pointer so the ✕ fires */
                  /* anchor to the corner OPPOSITE the selected cube's quadrant so the packet never covers it */
                  style={{ ...(f.fx < 0.5 ? { right: 8 } : { left: 8 }), ...(f.fy < 0.5 ? { bottom: 8 } : { top: 36 }), background: "#0a0f16ee", borderColor: C.gold, pointerEvents: "auto" }}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold tracking-wider" style={{ color: C.gold }}>3D VOXEL·CUBE · BASE</span>
                    <button onPointerUp={(e) => { e.stopPropagation(); setVoxelSel(null); }} title="Close" className="px-1 text-[11px] leading-none" style={{ color: C.dim }}>✕</button>
                  </div>
                  {/* HI 1.3.3: show ONLY the Settings-selected coordinate frame (not all three);
                      the CELL address matches the same frame. */}
                  {(() => {
                    const primary: [string, string, string] = coordFmt === "mgrs" ? ["MGRS", col.mgrs, C.text]
                      : coordFmt === "dms" ? ["LLV-DMS", col.llv, C.text]
                      : ["UCRS-2525", col.ucrsDms, C.cyan];
                    // HI 1.3.3: drop the UCRS·CELL row — instead report the CUBE's dimensions:
                    // whole COLUMN height (3 levels), one ZONE height, and the BASE L×W in metres.
                    const fmtM = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
                    return (
                      <div className="grid grid-cols-[52px_1fr] gap-x-1 gap-y-0.5 font-mono">
                        <span style={{ color: C.dim }}>{primary[0]}</span><span style={{ color: primary[2] }}>{primary[1]}</span>
                        <span style={{ color: C.dim }}>COLUMN</span><span style={{ color: C.text }}>{fmtM(3 * col.cellM)} high</span>
                        <span style={{ color: C.dim }}>ZONE</span><span style={{ color: C.text }}>{fmtM(col.cellM)} / level</span>
                        <span style={{ color: C.dim }}>BASE</span><span style={{ color: C.text }}>{fmtM(col.cellM)} × {fmtM(col.cellM)}</span>
                        <span style={{ color: C.dim }}>TERRAIN</span><span style={{ color: C.gold }}>{Math.round(col.terrainM).toLocaleString()} m MSL</span>
                      </div>
                    );
                  })()}
                  {col.objects.length > 0 && (
                    <div className="mt-1 border-t pt-1" style={{ borderColor: C.border }}>
                      {col.objects.map((o) => (
                        <div key={String(o.id)} className="flex items-center justify-between gap-1 font-mono">
                          <span className="truncate" style={{ color: o.color ?? C.cyan }}>{o.label}</span>
                          <span className="whitespace-nowrap" style={{ color: C.text }}>{fmtAlt(o.altM, o.altRef, col.lat, col.lon)} · Z{o.bandIdx}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-1 border-t pt-1" style={{ borderColor: C.border }}>
                    {([["mgrs", "MGRS"], ["dms", "LLV-DMS"], ["ucrs", "UCRS-2525"]] as const).map(([fk, lb]) => (
                      <button key={fk} onClick={() => onSetCoordFmt?.(fk)} className="rounded border px-1 py-0"
                        style={{ borderColor: coordFmt === fk ? C.gold : C.border, color: coordFmt === fk ? C.gold : C.dim }}>{lb}</button>
                    ))}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1">
                    {(["AGL", "MSL"] as const).map((r) => (
                      <button key={r} onClick={() => setElevRef(r)} className="rounded border px-1 py-0"
                        style={{ borderColor: elevRef === r ? C.gold : C.border, color: elevRef === r ? C.gold : C.dim }}>{r}</button>
                    ))}
                    <span style={{ color: C.border }}>·</span>
                    {(["km", "m", "mi", "ft"] as Unit[]).map((u) => (
                      <button key={u} onClick={() => onSetUnit?.(u)} className="rounded border px-1 py-0 uppercase"
                        style={{ borderColor: paneUnit === u ? C.cyan : C.border, color: paneUnit === u ? C.cyan : C.dim }}>{u}</button>
                    ))}
                  </div>
                  <div className="mt-1 text-[7px]" style={{ color: C.dim }}>Zone = one vertical level · Z0 = surface, Z1–Z7 = altitude bands</div>
                </div>
              );
            })()}

            {/* HI 1.3.2: the OTHER pane's viewport rectangle is now drawn ON the ground
                overlay (see the toFrac polygon up in the tilt layer) so it lies flat on the
                terrain in 3D. The old screen-space project() SVG that floated in the air
                ("phantom mini-map overlay") is removed. */}

            {/* compass */}
            <button
              onClick={() => {
                if (Math.abs(view.bearing) < 1e-4 && bearingMemo.current != null) {
                  const b = bearingMemo.current; bearingMemo.current = null; setView((v) => ({ ...v, bearing: b }));
                } else {
                  bearingMemo.current = view.bearing; setView((v) => ({ ...v, bearing: 0 }));
                }
              }}
              title={Math.abs(view.bearing) < 1e-4 && bearingMemo.current != null ? "Restore previous heading" : "Snap north-up"}
              className="absolute left-2 top-2 z-20 rounded-full" style={{ background: "#0a0f16cc" }}>
              <svg width="42" height="42" viewBox="-23 -23 46 46" aria-label="Compass">
                <circle r="21" fill="none" stroke={C.border} strokeWidth="1" />
                <g transform={`rotate(${(view.bearing * 180 / Math.PI).toFixed(1)})`}>
                  <path d="M0 -18 L4.5 -4 L0 -7 L-4.5 -4 Z" fill={C.red} />
                  <path d="M0 18 L3 6 L0 8 L-3 6 Z" fill={C.dim} />
                  <text x="0" y="-9" fontSize="6" fill={C.red} textAnchor="middle" fontWeight="bold">N</text>
                  <text x="14.5" y="2" fontSize="5" fill={C.dim} textAnchor="middle">E</text>
                  <text x="0" y="15" fontSize="5" fill={C.dim} textAnchor="middle">S</text>
                  <text x="-14.5" y="2" fontSize="5" fill={C.dim} textAnchor="middle">W</text>
                </g>
              </svg>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 font-mono text-[8px]" style={{ color: C.cyan }}>
                {String(Math.round(((-view.bearing * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, "0")}°
              </span>
            </button>

            {/* adaptive geo breadcrumb (upper-left, right of compass) */}
            <div className="pointer-events-none absolute left-14 top-2 z-20 rounded px-1 font-mono text-[9px] font-semibold" style={{ background: "#0a0f16cc", color: C.cyan }}>
              {breadcrumb.join(" · ")}
            </div>
            {/* live cursor readout — MGRS or LLV-DMS (upper-right); tap to decode (mini-lesson) */}
            <button onClick={() => setShowDecode((v) => !v)} title="Decode this coordinate (MGRS / LLV-DMS lesson)"
              className="absolute right-2 top-2 z-20 rounded px-1 font-mono text-[9px] font-semibold" style={{ background: "#0a0f16cc", color: cursorLL ? C.gold : C.dim }}>
              {cursorLL ? fmt.coordAt(cursorLL.lat, cursorLL.lon) : (() => { const lc = latticeColumns.length === 9 ? latticeColumns[4] : null; return lc ? fmt.coordAt(lc.lat, lc.lon) : fmt.coordAt(view.lat, view.lon); })()} <span style={{ color: C.dim }}>ⓘ</span>
            </button>
            {showDecode && (() => {
              const lc = latticeColumns.length === 9 ? latticeColumns[4] : null;
              const p = cursorLL ?? (lc ? { lat: lc.lat, lon: lc.lon } : { lat: view.lat, lon: view.lon });
              const mp = latLonToMgrs(p.lat, p.lon, digits).split(" "); // [zoneBand, square, E, N]
              const utm = latLonToUtm(p.lat, p.lon);
              const elevM = sampler(p.lat, p.lon);
              const dms = (v: number, pos: string, neg: string) => { const h = v >= 0 ? pos : neg, a = Math.abs(v); const d = Math.floor(a), m = Math.floor((a - d) * 60), s = (((a - d) * 60 - m) * 60).toFixed(1); return `${d}°${String(m).padStart(2, "0")}'${s}"${h}`; };
              const row = (k: string, val: string, c: string) => <div className="flex justify-between gap-2"><span style={{ color: C.dim }}>{k}</span><span className="font-mono" style={{ color: c }}>{val}</span></div>;
              return (
                <div className="absolute right-2 top-8 z-30 w-56 rounded-lg border p-2 text-[8px] shadow-2xl" style={{ background: C.panel, borderColor: C.cyan }}>
                  <div className="mb-1 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Coordinate packet</span><button onClick={() => setShowDecode(false)} style={{ color: C.dim }}>✕</button></div>
                  <div className="mb-1 font-semibold" style={{ color: C.gold }}>MGRS · {latLonToMgrs(p.lat, p.lon, digits)}</div>
                  {row("Zone · lat-band", mp[0], C.text)}
                  {row("100 km square", mp[1], C.text)}
                  {row("Easting (→E)", `${mp[2]} · ${(digits === 4 ? 10 : digits === 5 ? 1 : 0.1)} m`, C.text)}
                  {row("Northing (↑N)", `${mp[3]} · ${(digits === 4 ? 10 : digits === 5 ? 1 : 0.1)} m`, C.text)}
                  {row("UTM", `${utm.zone} ${Math.round(utm.easting)}E ${Math.round(utm.northing)}N`, C.text)}
                  <div className="mb-1 mt-1.5 font-semibold" style={{ color: "#a78bfa" }}>LLV-DMS</div>
                  {row("Latitude", dms(p.lat, "N", "S"), C.text)}
                  {row("Longitude", dms(p.lon, "E", "W"), C.text)}
                  {row("Decimal °", `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`, C.dim)}
                  <div className="mb-1 mt-1.5 font-semibold" style={{ color: C.green }}>Elevation</div>
                  {row(elevM >= 0 ? "Terrain (MSL)" : "Depth (below MSL)", `${Math.round(Math.abs(elevM)).toLocaleString()} m`, elevM >= 0 ? C.green : "#22d3ee")}
                  {row("Source", dem ? "GEBCO 2020" : "synthetic", dem ? C.text : C.dim)}
                  {row("Vert datum", dem ? "MSL (GEBCO)" : "approx", C.dim)}
                  <div className="mt-1 text-[7px]" style={{ color: C.dim }}>Same DEM tile that draws contours (1 fetch). MGRS: 6°-zone · 8°-band · 100 km square · E/N.</div>
                </div>
              );
            })()}

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2" style={{ borderLeft: `1px solid ${C.dim}`, borderTop: `1px solid ${C.dim}`, opacity: 0.5 }} />
            {/* 360° bearing scale — 2D screen edges; also drawn in 3D (screen-edge ticks + red-N edge glyph) ALONGSIDE the FX-29 ground compass fence */}
            {(() => {
              const topHeading = ((-view.bearing * 180 / Math.PI) % 360 + 360) % 360;
              const marks: React.ReactNode[] = [];
              for (let deg = 0; deg < 360; deg += 10) {
                const th = (deg - topHeading) * Math.PI / 180;
                const dx = Math.sin(th), dy = -Math.cos(th);
                const t = Math.min(0.5 / Math.max(Math.abs(dx), 1e-9), 0.5 / Math.max(Math.abs(dy), 1e-9));
                const bx = 0.5 + dx * t, by = 0.5 + dy * t;
                const major = deg % 30 === 0;
                // Edge-hugging: px-fixed insets via calc() — %-based insets pull labels
                // toward center on wide PC panes. Notch = radial tick line at the edge.
                const notchLen = major ? 9 : 6;
                marks.push(
                  <span key={`n${deg}`} className="pointer-events-none absolute"
                    style={{ left: `calc(${bx * 100}% - ${(dx * (notchLen / 2)).toFixed(2)}px)`, top: `calc(${by * 100}% - ${(dy * (notchLen / 2)).toFixed(2)}px)`,
                      width: major ? 1.5 : 1, height: notchLen, background: deg === 0 ? C.red : C.cyan, opacity: major ? 0.9 : 0.6,
                      transform: `translate(-50%,-50%) rotate(${deg - topHeading}deg)` }} />
                );
                if (major) {
                  marks.push(
                    <span key={deg} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[7px] font-bold"
                      style={{ left: `calc(${bx * 100}% - ${(dx * 16).toFixed(2)}px)`, top: `calc(${by * 100}% - ${(dy * 16).toFixed(2)}px)`, color: deg === 0 ? C.red : C.cyan, opacity: 0.85 }}>
                      {String(deg).padStart(3, "0")}
                    </span>
                  );
                }
                // FX-12 (P1.3): red NORTH glyph rides the edge with the bearing — 2D AND 3D
                if (deg === 0) {
                  marks.push(
                    <span key="north" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] font-black"
                      style={{ left: `calc(${bx * 100}% - ${(dx * 30).toFixed(2)}px)`, top: `calc(${by * 100}% - ${(dy * 30).toFixed(2)}px)`, color: C.red }}>
                      N
                    </span>
                  );
                }
              }
              return marks;
            })()}
            {/* armed tool ghost */}
            {armed && cursorPx && !routeMode && (
              <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-75" style={{ left: cursorPx.x, top: cursorPx.y }}>
                {selectedAsset
                  ? <AssetIcon asset={selectedAsset} style={iconStyle} affiliation="friendly" size={30} count={inventory.find((i) => i.asset === selectedAsset)?.group ?? 1} />
                  : selectedSupport ? <SupportGlyph glyph={selectedSupport.glyph} color={selectedSupport.color} size={26} /> : null}
              </div>
            )}
            {/* mini-target cursor */}
            {cursorMode === "target" && cursorPx && (
              <svg className="pointer-events-none absolute" width="44" height="44" style={{ left: cursorPx.x - 22, top: cursorPx.y - 22 }}>
                <circle cx="22" cy="22" r="20" fill="none" stroke={C.cyan} strokeWidth="1" opacity="0.5" />
                <circle cx="22" cy="22" r="11" fill="none" stroke={C.cyan} strokeWidth="1" opacity="0.8" />
                <circle cx="22" cy="22" r="1.6" fill={C.gold} />
                <line x1="22" y1="2" x2="22" y2="9" stroke={C.cyan} strokeWidth="1" />
                <line x1="22" y1="35" x2="22" y2="42" stroke={C.cyan} strokeWidth="1" />
                <line x1="2" y1="22" x2="9" y2="22" stroke={C.cyan} strokeWidth="1" />
                <line x1="35" y1="22" x2="42" y2="22" stroke={C.cyan} strokeWidth="1" />
              </svg>
            )}
            {/* scale bar — bottom-LEFT so the bottom-right mini-map inset never covers it */}
            <div className="pointer-events-none absolute bottom-1.5 left-2 right-2 z-30 flex flex-col items-start gap-0.5">
              {/* CONTOUR KEY — every line's height in the chosen units (m / ft / both) */}
              {contourSet && contourSet.lines.length > 0 && (
                <div className="mb-0.5 flex max-w-[60%] flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded px-1 py-0.5" style={{ background: "#0a0f16cc" }}>
                  <span className="text-[6px] font-bold tracking-wider" style={{ color: C.dim }}>CONTOURS</span>
                  {Array.from(new Set(contourSet.lines.filter((l) => (l.land ? contourCfg.showLand : contourCfg.showBathy)).map((l) => l.level)))
                    .sort((a, b) => b - a)
                    .map((lvl) => {
                      const land = lvl >= contourCfg.seaLevel;
                      return (
                        <span key={lvl} className="font-mono text-[7px]" style={{ color: land ? contourCfg.landColor : contourCfg.bathyColor }}>
                          {contourLabel(lvl, contourCfg.units)}
                        </span>
                      );
                    })}
                </div>
              )}
              <span className="font-mono text-[8px]" style={{ color: C.text }}>{fmt.fmtDist(grid.stepM)}</span>
              <div style={{ width: `${(grid.stepM / (view.spanKm * 1000)) * 100}%`, height: 4, borderLeft: `1px solid ${C.text}`, borderRight: `1px solid ${C.text}`, borderBottom: `2px solid ${C.text}` }} />
            </div>
          </div>

          {/* right elevation scale (primary pane) */}
          {showElevation && elevOn && elevProfile && (
            <div className="relative w-10 shrink-0 self-stretch overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
              <svg viewBox="0 0 40 100" preserveAspectRatio="none" className="h-full w-full">
                <path d={elevProfile.rightPath} fill={`${C.gold}22`} stroke={C.gold} strokeWidth="0.6" />
                {/* HIGH / LOW along the N→S column, marked at their exact latitude */}
                <circle cx={elevProfile.colHigh.xv} cy={elevProfile.colHigh.yv} r="1.4" fill={C.gold} />
                <circle cx={elevProfile.colLow.xv} cy={elevProfile.colLow.yv} r="1.4" fill="#38bdf8" />
              </svg>
              {/* HIGH / LOW elevation numbers ride NEXT TO their arrows at the exact latitude
                  (mirrors the bottom profile) so the value follows the marker */}
              <span className="absolute left-0.5 whitespace-nowrap rounded px-0.5 font-mono text-[7px] font-bold" style={{ top: `${elevProfile.colHigh.yv}%`, transform: "translateY(-50%)", background: "#0a0f16cc", color: C.gold }}>▲{fmt.fmtElev(elevProfile.colHigh.e)}</span>
              <span className="absolute left-0.5 whitespace-nowrap rounded px-0.5 font-mono text-[7px] font-bold" style={{ top: `${elevProfile.colLow.yv}%`, transform: "translateY(-50%)", background: "#0a0f16cc", color: "#38bdf8" }}>▼{fmt.fmtElev(elevProfile.colLow.e)}</span>
            </div>
          )}
        </div>

        {/* bottom elevation profile — thin strip; height matches the right scale's 40px thickness */}
        {showElevation && elevOn && elevProfile && (
          <div className="relative mt-1 h-10 shrink-0 overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
              {/* single W→E profile — one colour, matches the vertical N→S scale */}
              <path d={elevProfile.frontFill} fill={`${C.land}22`} stroke={C.land} strokeWidth="0.6" />
              <line x1="0" y1="39.5" x2="100" y2="39.5" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
              <circle cx={elevProfile.high.x} cy={elevProfile.high.yy} r="0.9" fill={C.gold} />
              <circle cx={elevProfile.low.x} cy={elevProfile.low.yy} r="0.9" fill="#38bdf8" />
            </svg>
            <span className="absolute left-1 top-0.5 text-[6px] font-semibold tracking-wider" style={{ color: C.dim }}>ELEV W→E</span>
            {/* MAX (▲) / MIN (▼) height — arrow left-justified to the EXACT W→E position it occurs;
                hover (desktop) or tap (phone) reveals the coordinate. */}
            {(["high", "low"] as const).map((k) => {
              const pt = k === "high" ? elevProfile.high : elevProfile.low;
              const rev = elevReveal === k;
              return (
                <button key={k}
                  onMouseEnter={() => setElevReveal(k)}
                  onMouseLeave={() => setElevReveal((r) => (r === k ? null : r))}
                  onClick={() => setElevReveal((r) => (r === k ? null : k))}
                  className="absolute flex whitespace-nowrap"
                  style={{ left: `${pt.x}%`, top: k === "high" ? 2 : undefined, bottom: k === "low" ? 2 : undefined }}>
                  <span className="rounded px-1 text-[7px] font-bold" style={{ background: "#0a0f16cc", color: k === "high" ? C.gold : "#38bdf8" }}>
                    {k === "high" ? "▲" : "▼"} {fmt.fmtElev(pt.e)}{rev ? ` · ${fmt.coordAt(pt.lat, pt.lon)}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared placement rail (ASSET / SUPPORT menu + inspector) ──────────────────
// Lives OUTSIDE the maps (left column), so one menu drives both MAP and MINI MAP.
interface RailProps {
  iconStyle: IconStyle;
  inventory: InvItem[]; tab: "assets" | "support"; setTab: (t: "assets" | "support") => void;
  selectedAsset: AssetKind | null; setSelectedAsset: (a: AssetKind | null) => void;
  selectedSupport: SupportObjectDef | null; setSelectedSupport: (d: SupportObjectDef | null) => void;
  hoverAsset: AssetKind | null; setHoverAsset: React.Dispatch<React.SetStateAction<AssetKind | null>>;
  openGroups: Set<LegendGroup>; setOpenGroups: React.Dispatch<React.SetStateAction<Set<LegendGroup>>>;
  reality: RealityMode; setReality: (r: RealityMode) => void;
  onUndoLastPlacement: () => void; clearAo: () => void;
  routeMode: boolean; onHide: () => void;
}
function PlacementRail(r: RailProps) {
  const {
    iconStyle, inventory, tab, setTab, selectedAsset, setSelectedAsset, selectedSupport, setSelectedSupport,
    hoverAsset, setHoverAsset, openGroups, setOpenGroups, reality, setReality,
    onUndoLastPlacement, clearAo, routeMode, onHide,
  } = r;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-1 border-b p-1.5" style={{ borderColor: C.border }}>
        <div className="flex flex-1 overflow-hidden rounded border text-[10px] font-semibold" style={{ borderColor: C.border }}>
          {([["assets", "ASSETS"], ["support", "SUPPORT"]] as const).map(([t, lb]) => (
            <button key={t} onClick={() => setTab(t)} className="flex-1 px-2 py-1"
              style={{ background: tab === t ? "#152238" : "transparent", color: tab === t ? C.cyan : C.dim }}>{lb}</button>
          ))}
        </div>
        <Dots3 onClick={onHide} title="Hide placement menu" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="mb-2 text-[9px]" style={{ color: C.dim }}>DRAG ONTO MAP · OR TAP THEN TAP MAP</div>
        {tab === "assets" ? (
          <div className="space-y-1.5">
            {inventory.map((i) => {
              const empty = i.stock < i.group;
              const isArmed = selectedAsset === i.asset;
              return (
                <Fragment key={i.asset}>
                <div
                  draggable={!empty}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", i.asset)}
                  onClick={() => !empty && (setSelectedSupport(null), setSelectedAsset(isArmed ? null : i.asset))}
                  onMouseEnter={() => setHoverAsset(i.asset)}
                  onMouseLeave={() => setHoverAsset((h) => (h === i.asset ? null : h))}
                  className="flex cursor-grab items-center gap-2 rounded border px-2 py-1.5 select-none transition-shadow"
                  style={{ borderColor: isArmed || hoverAsset === i.asset ? C.cyan : C.border, background: isArmed || hoverAsset === i.asset ? "#152238" : "transparent", boxShadow: hoverAsset === i.asset ? `0 0 0 1px ${C.cyan}, 0 0 12px ${C.cyan}66` : undefined, opacity: empty ? 0.35 : 1 }}>
                  <AssetIcon asset={i.asset} style={iconStyle} affiliation="friendly" size={26} count={i.group > 1 ? i.group : 1} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold" style={{ color: C.text }}>{ASSET_LABELS[i.asset]}</div>
                    <div className="truncate text-[9px]" style={{ color: C.dim }}>{i.note}</div>
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: empty ? C.red : C.green }}>×{i.stock}</span>
                </div>
                {/* FX-04 (revised by Thought Master): LEFT rail is ONLY the draw palette —
                    the selected unit's info lives on the RIGHT rail (ACTIVE ITEMS inspector) */}
                </Fragment>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {(Object.keys(GROUP_META) as LegendGroup[]).map((g) => {
              const items = SUPPORT_CATALOG.filter((d) => d.group === g);
              if (!items.length) return null;
              const open = openGroups.has(g);
              return (
                <div key={g}>
                  <button onClick={() => setOpenGroups((s) => { const n = new Set<LegendGroup>(s); n.has(g) ? n.delete(g) : n.add(g); return n; })}
                    className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-[10px] font-semibold uppercase tracking-wide hover:bg-white/5"
                    style={{ color: GROUP_META[g].color }}>
                    <ChevronRight className="h-3 w-3 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }} />
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ background: GROUP_META[g].color }} />
                    {GROUP_META[g].label} <span style={{ color: C.dim }}>·{items.length}</span>
                  </button>
                  {open && items.map((d) => {
                    const isArmed = selectedSupport?.key === d.key;
                    return (
                      <div key={d.key}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", `support:${d.key}`)}
                        onClick={() => (setSelectedAsset(null), setSelectedSupport(isArmed ? null : d))}
                        className="ml-4 flex cursor-grab items-center gap-2 rounded border px-2 py-1 select-none"
                        style={{ borderColor: isArmed ? d.color : "transparent", background: isArmed ? "#152238" : "transparent" }}>
                        <SupportGlyph glyph={d.glyph} color={d.color} size={18} />
                        <span className="min-w-0 flex-1 truncate text-[10px]" style={{ color: C.text }}>{d.term}</span>
                        <span className="text-[8px] uppercase" style={{ color: C.dim }}>{d.geometry[0]}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Reality Mode · placed objects</div>
          <select value={reality} onChange={(e) => setReality(e.target.value as RealityMode)}
            className="w-full rounded border bg-transparent px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}>
            {REALITY_MODES.map((m) => <option key={m} value={m} style={{ background: C.panel }}>{m}</option>)}
          </select>
        </div>

        {routeMode && (
          <div className="mt-2 rounded border px-2 py-1 text-[9px]" style={{ borderColor: `${C.cyan}55`, color: C.cyan }}>
            ROUTE: right-click each via-point on a map · left-click to finish
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <button onClick={onUndoLastPlacement} title="Undo"
            className="flex flex-1 items-center justify-center gap-1.5 rounded border px-2 py-1.5 text-[10px] font-semibold hover:bg-white/5"
            style={{ borderColor: C.border, color: C.text }}>
            <RotateCcw className="h-3 w-3" /> UNDO
          </button>
          <button onClick={clearAo}
            className="flex flex-1 items-center justify-center gap-1.5 rounded border px-2 py-1.5 text-[10px] font-semibold hover:bg-white/5"
            style={{ borderColor: `${C.red}44`, color: C.red }}>
            <Trash2 className="h-3 w-3" /> CLEAR
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Selected-item inspector (lives in the RIGHT rail with Active Items) ───────
interface InspectorProps {
  selected: { kind: "asset" | "support"; id: number } | null;
  selectedObj: Placed | PlacedSupport | undefined;
  fmt: Fmt; coordFmt: "mgrs" | "dms" | "ucrs"; digits: Digits;
  nudgeM: number; setNudgeM: (m: number) => void;
  coordText: string; setCoordText: (s: string) => void;
  onSetAff: (sel: { kind: "asset" | "support"; id: number }, aff: Affiliation) => void;
  onSetPlacedReality: (id: number, r: RealityMode) => void;
  onUpdAsset: (id: number, patch: Partial<Placed>) => void;
  onSetTL: (id: number, key: "p" | "s" | "t", tl: TL | null) => void;
  onNudge: (sel: { kind: "asset" | "support"; id: number }, dLat: number, dLon: number) => void;
  onSetCoord: (sel: { kind: "asset" | "support"; id: number }, lat: number, lon: number) => void;
  onRemoveSelected: () => void;
  terrainAtSel?: number;           // P2: DEM elevation (m MSL) beneath the selected object
  reality?: RealityMode;           // P2 governance footer
  planStatus?: string;             // P2 governance footer (draft/pending/approved/changes)
}
function ItemInspector(p: InspectorProps) {
  const { selected, selectedObj, fmt, coordFmt, digits, nudgeM, setNudgeM, coordText, setCoordText,
    onSetAff, onSetPlacedReality, onUpdAsset, onSetTL, onNudge, onSetCoord, onRemoveSelected,
    terrainAtSel, reality, planStatus } = p;
  if (!selectedObj || !selected) return null;
  return (
          <div className="shrink-0 overflow-y-auto border-t p-2" style={{ borderColor: C.border, maxHeight: "50%" }}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: C.cyan }}>
                {selected.kind === "asset" ? ASSET_LABELS[(selectedObj as Placed).asset] : (selectedObj as PlacedSupport).def.term}
              </span>
              <button onClick={onRemoveSelected} className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: C.red }}>REMOVE <Trash2 className="h-3 w-3" /></button>
            </div>
            <div className="mb-1 font-mono text-[9px]" style={{ color: C.gold }}>{fmt.coordAt(selectedObj.lat, selectedObj.lon)}</div>
            <div className="mb-1 text-[9px]" style={{ color: C.dim }}>Affiliation</div>
            <div className="mb-2 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
              {(["friendly", "hostile"] as Affiliation[]).map((a) => (
                <button key={a} onClick={() => onSetAff(selected, a)} className="flex-1 px-2 py-1"
                  style={{ background: selectedObj.aff === a ? "#152238" : "transparent", color: selectedObj.aff === a ? (a === "hostile" ? C.red : C.cyan) : C.dim }}>
                  {a.toUpperCase()}
                </button>
              ))}
            </div>
            {/* TRACK · MOVEMENT — subset of the selected asset (user law: lives with the
                item in the RIGHT rail under ACTIVE ITEMS, not a separate panel) */}
            {selected.kind === "asset" && (() => {
              const a = selectedObj as Placed;
              const num = (val: number | undefined, on: (v: number | undefined) => void, ph: string) => (
                <input type="number" value={val ?? ""} placeholder={ph}
                  onChange={(e) => on(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                  className="w-full rounded border bg-transparent px-1 py-0.5 text-[8px] font-mono" style={{ borderColor: C.border, color: C.text }} />
              );
              return (
                <div className="mb-2 rounded border p-1" style={{ borderColor: a.moving ? `${C.green}88` : C.border }}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Track · movement</span>
                    <span className="rounded px-1 text-[7px] font-bold" style={{ color: a.moving ? C.green : C.dim, background: a.moving ? `${C.green}18` : "transparent" }}>{a.moving ? "MOVING" : "HOLD"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div><div className="text-[6px]" style={{ color: C.dim }}>HDG°</div>{num(a.heading, (v) => onUpdAsset(a.id, { heading: v === undefined ? undefined : ((v % 360) + 360) % 360 }), "000")}</div>
                    <div><div className="text-[6px]" style={{ color: C.dim }}>SPD km/h</div>{num(a.speed, (v) => onUpdAsset(a.id, { speed: v }), "0")}</div>
                    <div><div className="text-[6px]" style={{ color: C.dim }}>ALT m</div>{num(a.altitude, (v) => onUpdAsset(a.id, { altitude: v }), "0")}
                      <div className="mt-0.5 flex overflow-hidden rounded border text-[6px] font-semibold" style={{ borderColor: C.border }}>
                        {(["AGL", "MSL"] as const).map((r) => (
                          <button key={r} onClick={() => onUpdAsset(a.id, { altRef: r })} className="flex-1 px-0.5 py-0.5"
                            style={{ background: (a.altRef ?? "AGL") === r ? "#152238" : "transparent", color: (a.altRef ?? "AGL") === r ? C.cyan : C.dim }}>{r}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onUpdAsset(a.id, { moving: !a.moving })}
                    className="mt-1 w-full rounded border py-0.5 text-[8px] font-semibold"
                    style={{ borderColor: a.moving ? C.green : C.border, color: a.moving ? C.green : C.dim }}>
                    {a.moving ? "◼ HOLD MOVEMENT" : "▶ ACTIVATE MOVEMENT"}
                  </button>
                </div>
              );
            })()}
            {selected.kind === "support" && (
              <>
                <div className="mb-1 text-[9px]" style={{ color: C.dim }}>Reality mode</div>
                <select value={(selectedObj as PlacedSupport).reality} onChange={(e) => onSetPlacedReality(selected.id, e.target.value as RealityMode)}
                  className="mb-2 w-full rounded border bg-transparent px-2 py-1 text-[9px]" style={{ borderColor: C.border, color: C.text }}>
                  {REALITY_MODES.map((m) => <option key={m} value={m} style={{ background: C.panel }}>{m}</option>)}
                </select>
              </>
            )}
            {selected.kind === "asset" && ((selectedObj as Placed).tls || (selectedObj as Placed).fov) && (() => {
              const a = selectedObj as Placed;
              const u = a.unit ?? "deg";
              const unitOpts: AngleUnit[] = ["deg", "mil", "ucrs"];
              const upd = (key: "fov" | "p" | "s" | "t", tl: TL | null) => (key === "fov" ? onUpdAsset(a.id, { fov: tl ?? undefined }) : onSetTL(a.id, key, tl));
              const numIn = (val: number, on: (deg: number) => void) => (
                <NumInField value={Math.round(toUnit(val, u))} onCommit={(v) => on(fromUnit(v, u))} />
              );
              const tlRow = (key: "fov" | "p" | "s" | "t", lb: string, tl: TL | null | undefined, col: string) => (
                <div className="mb-1.5 rounded border p-1" style={{ borderColor: `${col}55` }}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-bold" style={{ color: col }}>{lb}</span>
                    {(key === "s" || key === "t") && (
                      <button onClick={() => upd(key, tl ? null : { brg: 0, left: 45, right: 45 })} className="text-[8px] font-semibold" style={{ color: tl ? C.red : C.green }}>{tl ? "REMOVE" : "ADD"}</button>
                    )}
                  </div>
                  {tl && (
                    <div className="grid grid-cols-3 gap-1">
                      <div><div className="text-[7px]" style={{ color: C.dim }}>BRG</div>{numIn(tl.brg, (v) => upd(key, { ...tl, brg: ((v % 360) + 360) % 360 }))}</div>
                      <div><div className="text-[7px]" style={{ color: C.dim }}>◀ LEFT</div>{numIn(tl.left, (v) => upd(key, { ...tl, left: Math.max(0, Math.min(180, v)) }))}</div>
                      <div><div className="text-[7px]" style={{ color: C.dim }}>RIGHT ▶</div>{numIn(tl.right, (v) => upd(key, { ...tl, right: Math.max(0, Math.min(180, v)) }))}</div>
                    </div>
                  )}
                </div>
              );
              return (
                <>
                  {a.asset === "avenger" && (
                    <div className="mb-1.5 flex items-center justify-between rounded border p-1" style={{ borderColor: `${C.amber}55` }}>
                      <span className="text-[9px]" style={{ color: C.dim }}>Posture</span>
                      <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                        {([[false, "STATIONARY · PTL"], [true, "ON-THE-MOVE"]] as const).map(([mv, lb]) => (
                          <button key={lb} onClick={() => onUpdAsset(a.id, { mobile: mv })} className="px-1.5 py-0.5"
                            style={{ background: !!a.mobile === mv ? "#152238" : "transparent", color: !!a.mobile === mv ? (mv ? C.amber : C.gold) : C.dim }}>{lb}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px]" style={{ color: C.dim }}>Angle unit</span>
                    <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                      {unitOpts.map((un) => (
                        <button key={un} onClick={() => onUpdAsset(a.id, { unit: un })} className="px-1.5 py-0.5"
                          style={{ background: u === un ? "#152238" : "transparent", color: u === un ? C.cyan : C.dim }}>{ANGLE_LABEL[un]}</button>
                      ))}
                    </div>
                  </div>
                  {a.fov && tlRow("fov", "SENSOR / RADAR FOV", a.fov, "#a78bfa")}
                  {a.asset === "avenger" && a.mobile
                    ? <div className="mb-1.5 rounded border p-1 text-[8px]" style={{ borderColor: `${C.amber}55`, color: C.amber }}>PTL disabled on-the-move (slew-to-cue only)</div>
                    : a.tls && tlRow("p", "PTL / 1TL — points", a.tls.p, C.gold)}
                  {a.tls && tlRow("s", "2TL — secondary", a.tls.s, C.amber)}
                  {a.tls && tlRow("t", "3TL — tertiary", a.tls.t, C.cyan)}
                  <div className="mt-1.5 flex items-center justify-between gap-2 border-t pt-1" style={{ borderColor: C.border }}>
                    <span className="text-[7px]" style={{ color: C.dim }}>LINE</span>
                    <input type="range" min={0.2} max={2} step={0.1} value={a.lineW ?? 0.5}
                      onChange={(e) => onUpdAsset(a.id, { lineW: parseFloat(e.target.value) })}
                      className="flex-1" style={{ accentColor: C.cyan, height: 4 }} />
                    <span className="font-mono text-[7px]" style={{ color: C.cyan }}>{(a.lineW ?? 0.5).toFixed(1)}px</span>
                  </div>
                </>
              );
            })()}
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px]" style={{ color: C.dim }}>Nudge step</span>
              <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                {([[1, "1 m"], [10, "10 m"], [100, "100 m"], [1000, "1 km"]] as const).map(([mv, lb]) => (
                  <button key={mv} onClick={() => setNudgeM(mv)} className="px-1.5 py-0.5"
                    style={{ background: nudgeM === mv ? "#152238" : "transparent", color: nudgeM === mv ? C.cyan : C.dim }}>{lb}</button>
                ))}
              </div>
            </div>
            {/* nudge D-PAD — N above / S below / W left / E right of a non-clickable
                center that shows the active step (fills the whole rectangle) */}
            <div className="grid w-full grid-cols-3 gap-1">
              <span />
              <button onClick={() => onNudge(selected, nudgeM / 111320, 0)} className="w-full rounded border py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}>▲ N</button>
              <span />
              <button onClick={() => onNudge(selected, 0, -nudgeM / (111320 * Math.cos((selectedObj.lat * Math.PI) / 180)))} className="w-full rounded border py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}>◀ W</button>
              <div className="flex w-full items-center justify-center rounded border py-1 font-mono text-[9px] font-bold select-none" aria-hidden
                style={{ borderColor: `${C.cyan}44`, color: C.cyan, background: "#0c1420" }}>{nudgeM >= 1000 ? `${nudgeM / 1000} km` : `${nudgeM} m`}</div>
              <button onClick={() => onNudge(selected, 0, nudgeM / (111320 * Math.cos((selectedObj.lat * Math.PI) / 180)))} className="w-full rounded border py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}>E ▶</button>
              <span />
              <button onClick={() => onNudge(selected, -nudgeM / 111320, 0)} className="w-full rounded border py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}>▼ S</button>
              <span />
            </div>
            <div className="mb-1 mt-2 text-[9px]" style={{ color: C.dim }}>Set exact coordinate ({coordFmt === "ucrs" ? "UCRS-2525" : coordFmt === "dms" ? "LLV-DMS" : "MGRS"})</div>
            <div className="flex items-center gap-1">
              <input value={coordText} onChange={(e) => setCoordText(e.target.value)}
                placeholder={coordFmt === "ucrs" ? "0304·1200N 0977·1800W" : coordFmt === "dms" ? "30°16'27\"N 97°44'27\"W" : "14R PU 2111 4983"}
                className="w-full rounded border bg-transparent px-1 py-0.5 font-mono text-[9px]" style={{ borderColor: C.border, color: C.text }} />
              <button onClick={() => {
                  const t = coordText.trim();
                  let r = coordFmt === "dms" ? dmsToLatLon(t) : mgrsToLatLon(t, selectedObj.lat);
                  if (!r) { const m = t.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/); if (m) r = { lat: parseFloat(m[1]), lon: parseFloat(m[2]) }; }
                  if (r && isFinite(r.lat) && isFinite(r.lon)) onSetCoord(selected, r.lat, r.lon);
                }}
                className="shrink-0 rounded border px-2 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.cyan, color: C.cyan }}>SET</button>
            </div>
            <div className="mt-0.5 font-mono text-[8px]" style={{ color: C.dim }}>
              {coordFmt === "mgrs" ? `${selectedObj.lat.toFixed(6)}, ${selectedObj.lon.toFixed(6)}` : `MGRS ${latLonToMgrs(selectedObj.lat, selectedObj.lon, digits)}`}
            </div>
          </div>
  );
}

// ── Active items (critical Mission-Planning manifest — placed assets + support) ─
interface ActiveItemsProps {
  placed: Placed[]; placedSupport: PlacedSupport[]; fmt: Fmt;
  selected: { kind: "asset" | "support"; id: number } | null;
  setSelected: (s: { kind: "asset" | "support"; id: number } | null) => void;
  hoverAsset: AssetKind | null; setHoverAsset: React.Dispatch<React.SetStateAction<AssetKind | null>>;
  onHide?: () => void;
  onDelete: (kind: "asset" | "support", id: number) => void;
  inspector?: React.ReactNode;
  planStatus: "draft" | "pending" | "approved" | "changes";
  onSubmit: () => void; onApprove: () => void; onChanges: () => void; onShare: () => void; shareMsg: string;
}
function ActiveItems({ placed, placedSupport, fmt, selected, setSelected, hoverAsset, setHoverAsset, onHide, onDelete, inspector, planStatus, onSubmit, onApprove, onChanges, onShare, shareMsg }: ActiveItemsProps) {
  const total = placed.length + placedSupport.length;
  const statusColor = planStatus === "approved" ? C.green : planStatus === "pending" ? C.amber : planStatus === "changes" ? C.red : C.dim;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-2 py-1" style={{ borderColor: C.border }}>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          Active items <span style={{ color: C.dim }}>— {total}</span>
          {placed.some((u) => u.moving) && <span style={{ color: C.green }}> · {placed.filter((u) => u.moving).length} moving</span>}
        </span>
        {onHide && <Dots3 onClick={onHide} title="Hide deployed-asset list" />}
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {total === 0 && <div className="px-1 py-2 text-[9px]" style={{ color: C.dim }}>Nothing placed yet — arm an asset or support object, then tap a map.</div>}
        {placed.map((u) => (
          <div key={`a${u.id}`}
            onMouseEnter={() => setHoverAsset(u.asset)}
            onMouseLeave={() => setHoverAsset((h) => (h === u.asset ? null : h))}
            className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-[9px] hover:bg-white/5"
            style={{ background: (selected?.kind === "asset" && selected.id === u.id) || hoverAsset === u.asset ? "#152238" : "transparent", boxShadow: hoverAsset === u.asset ? `inset 0 0 0 1px ${C.cyan}` : undefined }}>
            <button onClick={() => setSelected({ kind: "asset", id: u.id })} className="flex min-w-0 flex-1 items-center justify-between gap-1 text-left">
              <span style={{ color: u.aff === "hostile" ? C.red : C.text }}>{ASSET_LABELS[u.asset]}{u.count > 1 ? ` ×${u.count}` : ""}</span>
              <span className="font-mono" style={{ color: C.gold }}>{fmt.coordAt(u.lat, u.lon)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete("asset", u.id); }} title="Remove" className="shrink-0 p-0.5 hover:opacity-100 opacity-60"><Trash2 className="h-3 w-3" style={{ color: C.red }} /></button>
          </div>
        ))}
        {placedSupport.map((u) => (
          <div key={`s${u.id}`}
            className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-[9px] hover:bg-white/5"
            style={{ background: selected?.kind === "support" && selected.id === u.id ? "#152238" : "transparent" }}>
            <button onClick={() => setSelected({ kind: "support", id: u.id })} className="flex min-w-0 flex-1 items-center justify-between gap-1 text-left">
              <span className="truncate" style={{ color: u.aff === "hostile" ? C.red : u.def.color }}>{u.def.term}{u.path ? ` (${u.path.length}pt)` : ""}</span>
              <span className="font-mono" style={{ color: C.gold }}>{fmt.coordAt(u.lat, u.lon)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete("support", u.id); }} title="Remove" className="shrink-0 p-0.5 hover:opacity-100 opacity-60"><Trash2 className="h-3 w-3" style={{ color: C.red }} /></button>
          </div>
        ))}
      </div>
      {/* selected-item inspector (settings) — lives here in the RIGHT rail */}
      {inspector}
      {/* Plan governance — share + send-for-approval + commander decision (HITL) */}
      <div className="shrink-0 space-y-1 border-t p-1.5" style={{ borderColor: C.border }}>
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Plan</span>
          <span className="rounded px-1 text-[8px] font-bold uppercase" style={{ color: statusColor, background: `${statusColor}18` }}>{planStatus}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onShare} disabled={total === 0} title="Copy plan summary to clipboard (share)"
            className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.border, color: total ? C.cyan : C.dim, opacity: total ? 1 : 0.5 }}>SHARE</button>
          <button onClick={onSubmit} disabled={total === 0 || planStatus === "pending"} title="Send the plan to a commander for approval"
            className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.amber, color: total && planStatus !== "pending" ? C.amber : C.dim, opacity: total && planStatus !== "pending" ? 1 : 0.5 }}>SUBMIT ▶</button>
        </div>
        {planStatus === "pending" && (
          <div className="flex gap-1">
            <button onClick={onApprove} className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.green, color: C.green }}>✓ APPROVE</button>
            <button onClick={onChanges} className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.red, color: C.red }}>✎ CHANGES</button>
          </div>
        )}
        <div className="text-[7px]" style={{ color: statusColor }}>
          {shareMsg || (planStatus === "approved" ? "Approved by commander — proposal, not a live order"
            : planStatus === "pending" ? "Awaiting commander decision (HITL)"
            : planStatus === "changes" ? "Changes requested — revise and resubmit"
            : "Nothing fires on its own — human authority retained")}
        </div>
      </div>
    </div>
  );
}

// ── Tracks / movement (bottom-left) — heading · speed · altitude + activation ──
// Every placed entity can become a live track (drone-war + R-CORE sim/replay).

// ── Transect / elevation profile (full-width bottom) — the 1-fetch DEM cut ─────
// Terrain + bathymetry + airborne-object altitude stems on ONE shared vertical scale, with the
// voxel altitude-band gridlines. Same DEM sampler as the map → zero extra fetch. Plan mode only.
interface TransectPanelProps { view: ViewState; dem: Dem | null; placed: Placed[]; onHide?: () => void }
function TransectPanel({ view, dem, placed, onHide }: TransectPanelProps) {
  const [bearing, setBearing] = useState(90); // 90 = E–W cut (default), 0 = N–S
  const sampler = useMemo(() => (dem ? makeDemSampler(dem) : terrainMSL), [dem]);
  const objects: AltObject[] = useMemo(
    () => placed.filter((u) => u.altitude != null).map((u) => ({
      lat: u.lat, lon: u.lon, altM: u.altitude!, altRef: u.altRef ?? "AGL",
      label: ASSET_LABELS[u.asset], color: u.aff === "hostile" ? C.red : C.cyan,
    })),
    [placed]
  );
  const plot = useMemo(() => {
    const [a, b] = transectLine([view.lat, view.lon], view.spanKm, bearing);
    return computeTransect(a, b, sampler, objects, 160, Math.max(2, view.spanKm * 0.25));
  }, [view.lat, view.lon, view.spanKm, bearing, sampler, objects]);

  const W = 1000, H = 150, PADT = 10, PADB = 14;
  const lo = Math.min(0, plot.minEl), hi = Math.max(plot.maxEl, lo + 1), span = hi - lo || 1;
  const y = (e: number) => PADT + (H - PADT - PADB) * (1 - (e - lo) / span);
  const x = (t: number) => t * W;
  const terr = plot.samples.map((s) => `${x(s.t).toFixed(1)},${y(s.elevM).toFixed(1)}`).join(" ");
  const area = `0,${y(lo).toFixed(1)} ${terr} ${W},${y(lo).toFixed(1)}`;
  const seaY = y(0);
  const occ = bandOccupancy(plot.objects.map((o) => o.mslM)); // cube-stack count per band
  const bandLines = RANGE_EDGES
    .map((ft) => ({ ft, yM: mFromFt(ft) }))
    .filter((b) => b.ft > 0 && Number.isFinite(b.yM) && b.yM > lo && b.yM < hi)
    .map((b) => ({ ft: b.ft, py: y(b.yM), label: b.ft >= 1000 ? `${b.ft / 1000}k ft` : `${b.ft} ft` }));

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-2 py-1" style={{ borderColor: C.border }}>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          Elevation profile · transect
          <span style={{ color: C.dim }}> — {plot.lengthKm.toFixed(1)} km cut · {plot.objects.length} on axis · {lo < 0 ? `${Math.round(lo)}→` : ""}{Math.round(hi)} m MSL</span>
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
            {([[90, "E–W"], [0, "N–S"]] as const).map(([b, lb]) => (
              <button key={lb} onClick={() => setBearing(b)} className="px-1.5 py-0.5"
                style={{ background: bearing === b ? "#152238" : "transparent", color: bearing === b ? C.cyan : C.dim }}>{lb}</button>
            ))}
          </div>
          {onHide && <Dots3 onClick={onHide} title="Hide transect" />}
        </div>
      </div>
      <div className="flex gap-1.5 p-1.5">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 min-w-0 flex-1" style={{ background: "#070b12", borderRadius: 4 }}>
          {/* altitude-band gridlines (voxel RANGE_EDGES) */}
          {bandLines.map((b) => (
            <g key={b.ft}>
              <line x1={0} x2={W} y1={b.py} y2={b.py} stroke={C.border} strokeWidth={0.6} strokeDasharray="4 4" />
              <text x={W - 3} y={b.py - 2} textAnchor="end" fontSize={8} fill={C.dim}>{b.label}</text>
            </g>
          ))}
          {/* sea level (MSL 0) — bathymetry reference */}
          {lo < 0 && <line x1={0} x2={W} y1={seaY} y2={seaY} stroke="#2f6fb0" strokeWidth={0.8} strokeDasharray="2 3" />}
          {/* terrain area + ridge line */}
          <polygon points={area} fill="#0e2a1c" opacity={0.9} />
          <polyline points={terr} fill="none" stroke={C.land} strokeWidth={1.2} />
          {/* object altitude stems — terrain→MSL, label carries the reference (visual law) */}
          {plot.objects.map((o, i) => (
            <g key={i}>
              <line x1={x(o.t)} x2={x(o.t)} y1={y(o.terrainM)} y2={y(o.mslM)} stroke={o.color ?? C.cyan} strokeWidth={1} strokeDasharray="1 2" />
              <circle cx={x(o.t)} cy={y(o.mslM)} r={2.6} fill={o.color ?? C.cyan} />
              <text x={x(o.t) + 4} y={y(o.mslM) - 3} fontSize={8} fill={o.color ?? C.cyan}>{Math.round(o.altM).toLocaleString()}m {o.altRef}</text>
            </g>
          ))}
        </svg>
        {/* altitude-band occupancy rail — the voxel cube-stack per band (1..7 airspace) */}
        <div className="flex w-24 shrink-0 flex-col-reverse justify-end gap-px text-[7px]">
          {BAND_LABELS.slice(1).map((lb, i) => {
            const n = occ[i + 1];
            return (
              <div key={lb} className="flex items-center gap-1" title={`${lb} ft — ${n} in band`}>
                <span className="w-10 shrink-0 text-right" style={{ color: n ? C.cyan : C.dim }}>{lb}</span>
                <div className="h-2 flex-1 rounded-sm" style={{ background: C.border }}>
                  <div className="h-full rounded-sm" style={{ width: `${Math.min(100, n * 34)}%`, background: n ? C.cyan : "transparent" }} />
                </div>
                <span className="w-2 shrink-0" style={{ color: n ? C.cyan : C.dim }}>{n || ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mission Planning main view ────────────────────────────────────────────────
export function MissionPlanning({ iconStyle }: { iconStyle: IconStyle }) {
  const [aoKey, setAoKey] = useState("capitol");
  const [gridOn, setGridOn] = useState(true);
  const [gridStepM, setGridStepM] = useState<number>(0);
  const [digits, setDigits] = useState<Digits>(4);
  const [coordFmt, setCoordFmt] = useState<"mgrs" | "dms" | "ucrs">("mgrs");
  const [unit, setUnit] = useState<Unit>("km");
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetKind | null>(null);
  const [tab, setTab] = useState<"assets" | "support">("assets");
  const [selectedSupport, setSelectedSupport] = useState<SupportObjectDef | null>(null);
  const [placedSupport, setPlacedSupport] = useState<PlacedSupport[]>([]);
  const [reality, setReality] = useState<RealityMode>("training_demo");
  const [openGroups, setOpenGroups] = useState<Set<LegendGroup>>(new Set<LegendGroup>()); // all groups collapsed by default
  const [selected, setSelected] = useState<{ kind: "asset" | "support"; id: number } | null>(null);
  const [elevOn, setElevOn] = useState(true);
  const [contourCfg, setContourCfg] = useState<ContourSettings>(DEFAULT_CONTOURS);
  const [rangeOn, setRangeOn] = useState(true);            // weapon-range coverage rings
  const [roadsOn, setRoadsOn] = useState(true);            // OSM road layer
  const [waterOn, setWaterOn] = useState(true);            // OSM waterway layer
  const [terrainOn, setTerrainOn] = useState(true);        // green-land / blue-ocean base fill
  const [planStatus, setPlanStatus] = useState<"draft" | "pending" | "approved" | "changes">("draft");
  const [shareMsg, setShareMsg] = useState("");            // transient "copied" confirmation
  const [cursorMode, setCursorMode] = useState<"pointer" | "target">("pointer");
  const [showSettings, setShowSettings] = useState(false);
  const [showLayers, setShowLayers] = useState(false);   // LAYER CONTROLS checklist (mockup right rail)
  const [showTransect, setShowTransect] = useState(true); // ELEVATION PROFILE / TRANSECT bottom panel
  const [aoMenuOpen, setAoMenuOpen] = useState(false);   // AO/mission dropdown (declutters the scroll row)
  const [showHiddenAos, setShowHiddenAos] = useState(false);
  const [aoHidden, setAoHidden] = useState<Set<string>>(() => { try { return new Set<string>(JSON.parse(localStorage.getItem("sec2525.aoHidden") || "[]")); } catch { return new Set<string>(); } });
  useEffect(() => { try { localStorage.setItem("sec2525.aoHidden", JSON.stringify(Array.from(aoHidden))); } catch { /* quota */ } }, [aoHidden]);
  const toggleAoHidden = (k: string) => setAoHidden((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  // Permanently-removed built-in AOs (custom missions delete from their own list). Two-tier:
  // HIDE (list → bottom, reversible) then DELETE (from the bottom, gone from map + list).
  const [aoDeleted, setAoDeleted] = useState<Set<string>>(() => { try { return new Set<string>(JSON.parse(localStorage.getItem("sec2525.aoDeleted") || "[]")); } catch { return new Set<string>(); } });
  useEffect(() => { try { localStorage.setItem("sec2525.aoDeleted", JSON.stringify(Array.from(aoDeleted))); } catch { /* quota */ } }, [aoDeleted]);
  // ── AO / AOR draw tool ── draw an AO polygon (tap vertices), set AOR buffer 10–100km ──
  const [drawingAo, setDrawingAo] = useState(false);
  const [aoDraft, setAoDraft] = useState<[number, number][]>([]);
  const [drawnAos, setDrawnAos] = useState<Record<string, { poly: [number, number][]; aorKm: number }>>(() => {
    try { return JSON.parse(localStorage.getItem("sec2525.drawnAos") || "{}"); } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem("sec2525.drawnAos", JSON.stringify(drawnAos)); } catch { /* quota */ } }, [drawnAos]);
  const addAoVertex = (lat: number, lon: number) => setAoDraft((d) => [...d, [lat, lon]]);
  const saveDrawnAo = () => { if (aoDraft.length >= 3) { setDrawnAos((m) => ({ ...m, [aoKey]: { poly: aoDraft, aorKm: m[aoKey]?.aorKm ?? 25 } })); setAoDraft([]); setDrawingAo(false); } };
  const setAorKm = (km: number) => setDrawnAos((m) => (m[aoKey] ? { ...m, [aoKey]: { ...m[aoKey], aorKm: Math.min(100, Math.max(10, km)) } } : m));
  const deleteDrawnAo = () => setDrawnAos((m) => { const n = { ...m }; delete n[aoKey]; return n; });
  useEffect(() => { setAoDraft([]); setDrawingAo(false); }, [aoKey]); // switching AO clears any in-progress draw
  // ── Custom missions ── operator-created AOs (persisted); each isolates its own placements ──
  const [customAos, setCustomAos] = useState<Ao[]>(() => { try { return JSON.parse(localStorage.getItem("sec2525.customAos") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("sec2525.customAos", JSON.stringify(customAos)); } catch { /* quota */ } }, [customAos]);
  const createMission = () => {
    const key = `custom-${customAos.reduce((mx, a) => Math.max(mx, parseInt(a.key.replace("custom-", "")) || 0), 0) + 1}`;
    const m: Ao = { key, name: `MISSION ${customAos.length + 1} · CUSTOM`, center: [viewA.lat, viewA.lon], halfKm: Math.max(2, viewA.spanKm / 2), landmarks: [], buildings: [] };
    setCustomAos((a) => [...a, m]); setAoKey(key); setAoMenuOpen(false);
  };
  const renameMission = (key: string, name: string) => setCustomAos((a) => a.map((m) => (m.key === key ? { ...m, name } : m)));
  const deleteMission = (key: string) => { setCustomAos((a) => a.filter((m) => m.key !== key)); if (aoKey === key) setAoKey("capitol"); };
  // Permanent delete (from the HIDDEN section): custom missions drop from their list; built-in
  // AOs go to aoDeleted (filtered out of the map + menu). Also un-hides so it never lingers.
  const removeAo = (key: string) => {
    if (key.startsWith("custom-")) deleteMission(key);
    else { setAoDeleted((s) => new Set(s).add(key)); if (aoKey === key) setAoKey(AOS.find((a) => a.key !== key && !aoDeleted.has(a.key))?.key ?? "capitol"); }
    setAoHidden((s) => { const n = new Set(s); n.delete(key); return n; });
  };
  const [showUlt, setShowUlt] = useState(false);         // ULT · Unit Line-up Table (setup layer)
  // ULT starts at the 001–008 setup nodes; operators ADD unit rows one at a time (persisted).
  const [ultRows, setUltRows] = useState<UltNode[]>(() => {
    try { const r = localStorage.getItem("sec2525.ult"); if (r) return JSON.parse(r); } catch { /* ignore */ }
    return ULT_ROSTER.slice(0, 8);
  });
  useEffect(() => { try { localStorage.setItem("sec2525.ult", JSON.stringify(ultRows)); } catch { /* quota */ } }, [ultRows]);
  const updUlt = (i: number, patch: Partial<UltNode>) => setUltRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addUltRow = () => setUltRows((rs) => [...rs, { id: String(rs.length + 1).padStart(3, "0"), node: "", desc: "", supervisor: "", comm: "", personnel: 0, rifles: 0, vehicles: 0, equipment: "", notes: "" }]);
  const delUltRow = (i: number) => setUltRows((rs) => rs.filter((_, j) => j !== i));
  const allAos = [...AOS.filter((a) => !aoDeleted.has(a.key)), ...customAos];
  // Keys hidden from the WORLD map markers (2D flat + 3D globe): hidden OR deleted built-ins.
  const worldHidden = useMemo(() => new Set<string>([...Array.from(aoHidden), ...Array.from(aoDeleted)]), [aoHidden, aoDeleted]);
  const aoStateOf = (k: string) => (k.startsWith("custom-") ? "CUSTOM" : k === "dc" ? "DC" : k === "jblm" ? "WA"
    : ["capitol", "mabry", "pfield", "houston", "sanantonio", "dallas", "fortworth", "austin"].includes(k) ? "TX" : "FL");
  const [hoverAsset, setHoverAsset] = useState<AssetKind | null>(null);
  const [osm, setOsm] = useState<OsmData | null>(null);
  const [borders, setBorders] = useState<BorderData | null>(borderCache);
  const [dem, setDem] = useState<Dem | null>(null);   // real GEBCO grid for the big MAP (viewA)
  // P2: terrain elevation for the inspector's ALTITUDE INFO — same 1-fetch DEM tile
  const inspSampler = useMemo(() => (dem ? makeDemSampler(dem) : terrainMSL), [dem]);
  const demKeyRef = useRef<string | null>(null);
  const [demB, setDemB] = useState<Dem | null>(null); // independent tile for the MINI map (viewB) — correct contours in SPLIT
  const demKeyRefB = useRef<string | null>(null);
  // Champion/challenger map engine: "current" (shipped) vs "beta" (6-face pull-as-you-need:
  // prefetch zoom-in/out tiles so the next zoom is instant). Default current; A/B switch in Settings.
  // HI: β World Disc PROMOTED to DEFAULT (2026-07-09). α (square map) stays as the Settings fallback.
  // Init matches SSR to avoid a hydration mismatch (mapEngine now affects render), then adopt a stored
  // user preference (if they explicitly picked α) after mount.
  const [mapEngine, setMapEngine] = useState<"current" | "beta">("beta");
  useEffect(() => { try { const s = localStorage.getItem("sec2525.mapEngine"); if (s === "current" || s === "beta") setMapEngine(s); } catch { /* ignore */ } }, []);
  useEffect(() => { try { localStorage.setItem("sec2525.mapEngine", mapEngine); } catch { /* quota */ } }, [mapEngine]);
  const [isFs, setIsFs] = useState(false);
  const [railOpen, setRailOpen] = useState(true);          // left ASSET/SUPPORT rail (collapsible)
  const [rightOpen, setRightOpen] = useState(true);        // right deployed-items rail (collapsible)
  const [miniOpen, setMiniOpen] = useState(true);          // bottom-right mini-map inset (hideable)
  // In-app fullscreen: MAP or MINI takes over everything BELOW the top tab bar (command bar,
  // rails and transect hide). Distinct from isFs (browser fullscreen, menu-level Expand).
  const [fsPane, setFsPane] = useState<null | "map" | "mini">(null);
  const mapMax = fsPane !== null;                          // rails + command bar + transect hidden
  // Mini-map FLOATS (position:fixed) once dragged — anywhere in the viewport BELOW the two
  // sticky top menus (over rails, under ACTIVE ITEMS…), not just inside the big map.
  const [miniPos, setMiniPos] = useState<{ x: number; y: number } | null>(null); // viewport px (null = bottom-right of map, default)
  const miniDrag = useRef<{ dx: number; dy: number } | null>(null);
  const centerRef = useRef<HTMLDivElement>(null);          // center map area — hosts the default mini position
  const wsRef = useRef<HTMLDivElement>(null);              // workspace row — measured for fullscreen height
  const [wsTop, setWsTop] = useState(90);
  useEffect(() => { if (fsPane && wsRef.current) setWsTop(Math.round(wsRef.current.getBoundingClientRect().top)); }, [fsPane]);
  const stickyBottom = () =>
    Math.round(document.querySelector("[data-sec2525-sticky]")?.getBoundingClientRect().bottom ?? 84);
  const clampMini = (x: number, y: number, w: number, h: number) => ({
    x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - w)),
    y: Math.min(Math.max(stickyBottom(), y), Math.max(stickyBottom(), window.innerHeight - Math.min(h, 40))),
  });
  const onMiniGripDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const mini = e.currentTarget.parentElement;
    if (!mini) return;
    const mb = mini.getBoundingClientRect();
    miniDrag.current = { dx: e.clientX - mb.left, dy: e.clientY - mb.top };
    setMiniPos(clampMini(mb.left, mb.top, mb.width, mb.height));
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMiniGripMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const mini = e.currentTarget.parentElement;
    if (!miniDrag.current || !mini) return;
    const mb = mini.getBoundingClientRect();
    setMiniPos(clampMini(e.clientX - miniDrag.current.dx, e.clientY - miniDrag.current.dy, mb.width, mb.height));
  };
  const onMiniGripUp = (e: React.PointerEvent<HTMLDivElement>) => {
    miniDrag.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
  };
  // R1 feedback: mini-map RESIZABLE like a traditional window — all four edges
  // + bottom-right corner. Left/top drags keep the opposite edge fixed.
  const [miniSize, setMiniSize] = useState<{ w: number; h: number } | null>(null);
  // FX-07 (P1.3): all FOUR corners resize, like a traditional window
  const miniEdge = useRef<null | "l" | "r" | "t" | "b" | "br" | "bl" | "tr" | "tl">(null);
  const MINI_MIN = { w: 220, h: 170 };
  const onMiniEdgeDown = (edge: "l" | "r" | "t" | "b" | "br" | "bl" | "tr" | "tl") => (e: React.PointerEvent<HTMLDivElement>) => {
    miniEdge.current = edge;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const onMiniEdgeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const edge = miniEdge.current;
    const mini = e.currentTarget.parentElement;
    if (!edge || !mini) return;
    const mb = mini.getBoundingClientRect();
    let w = mb.width, h = mb.height;
    if (edge === "r" || edge === "br" || edge === "tr") w = e.clientX - mb.left;
    if (edge === "b" || edge === "br" || edge === "bl") h = e.clientY - mb.top;
    if (edge === "l" || edge === "bl" || edge === "tl") {
      w = mb.right - e.clientX;
      if (miniPos) setMiniPos({ x: Math.min(e.clientX, mb.right - MINI_MIN.w), y: miniPos.y });
    }
    if (edge === "t" || edge === "tr" || edge === "tl") {
      h = mb.bottom - e.clientY;
      if (miniPos) setMiniPos({ x: miniPos?.x ?? 0, y: Math.max(stickyBottom(), Math.min(e.clientY, mb.bottom - MINI_MIN.h)) });
    }
    setMiniSize({
      w: Math.min(Math.max(MINI_MIN.w, w), window.innerWidth - 8),
      h: Math.min(Math.max(MINI_MIN.h, h), window.innerHeight - 8),
    });
  };
  const onMiniEdgeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    miniEdge.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
  };
  // MIRROR — directional, lives on each map's header: engaging on a pane pushes ITS view
  // onto the other pane (each pane KEEPS its own 2D/3D); disengaging RESTORES the other
  // pane's pre-mirror view. `mirror` stays as the derived coupled-state flag.
  const [mirrorFrom, setMirrorFrom] = useState<null | "map" | "mini">(null);
  const mirror = mirrorFrom !== null;
  const preMirrorRef = useRef<{ target: "map" | "mini"; view: ViewState; mode: "world" | "ao" } | null>(null);
  const [is3dA, setIs3dA] = useState(false);               // MAP 2D/3D (perspective terrain)
  const [is3dB, setIs3dB] = useState(false);               // MINI MAP 2D/3D
  const [pitch, setPitch] = useState(55);                  // 3D view angle (deg) — the FAAD/AMDWS altitude-angle
  const [symbologyMode, setSymbologyMode] = useState<"mil" | "exel" | "hybrid">("mil"); // MIL-STD-2525 | eXeL-STD-2525 | Hybrid
  const [iconSize, setIconSize] = useState<"s" | "m" | "l">("s"); // P2: icon visibility — S(1×)/M(1.75×)/L(3×)
  const ICON_SCALE = { s: 1, m: 2, l: 3 } as const; // P1.2 (Enki): M = 2× current, L = 3×
  const [maxAltFt, setMaxAltFt] = useState<number | null>(null);      // FX-09b: null = AUTO (10k ft rail)
  const [altRedPct, setAltRedPct] = useState(90);       // FX-05: RED threshold as % of ceiling (default 90%)
  const [altYellowPct, setAltYellowPct] = useState(70); // FX-05: YELLOW threshold as % of ceiling (default 70%)
  const [voxelCellM, setVoxelCellM] = useState<number>(0); // FX-10 (1.3.2): 0 = AUTO screen reticle (default); 10/100/1000 presets OR any user-entered metre value
  const [voxelLimitPct, setVoxelLimitPct] = useState(100); // FX-04 (1.3.2): grey "voxel limit" extent — % of the altitude rail the voxel column reaches (like the red/yellow alarm limits)
  const [voxelHiColor, setVoxelHiColor] = useState<string>(TRINITY_COLORS.temporal); // FX-07 (1.3.2): user-set colour for the primary highlighted voxel (rest dim)
  const [modeA, setModeA] = useState<"world" | "ao">("ao");   // MAP: Capitol/AO detail by default
  const [modeB, setModeB] = useState<"world" | "ao">("world"); // MINI: Earth/world context by default
  const [nudgeM, setNudgeM] = useState(1);                 // inspector nudge step (m)
  const [coordText, setCoordText] = useState("");          // exact-coordinate entry (Settings format)
  const [playing, setPlaying] = useState(false);           // TRACK SIM playback (dead-reckoning movers)

  const idRef = useRef(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const aoKeyRef = useRef(aoKey);
  // ── TRACK SIMULATION (dead-reckoning) ── advance every moving asset along its heading at
  // its ground speed; the aircraft icon rotates to heading in 2D playback. The plan already
  // persists heading/speed/altitude/moving per AO, so a saved track replays deterministically.
  const playRafRef = useRef<number | null>(null);
  const playLastRef = useRef(0);
  const playStartRef = useRef<Placed[] | null>(null); // snapshot at PLAY-start → RESET rewinds here
  const playingRef = useRef(false);

  // ── Plan persistence (recall next session) ────────────────────────────────
  // Local device now (localStorage); same save contract swaps to Supabase for
  // cross-device/team (planned): mission_plan(project_id, ao_key, owner_id,
  // placed jsonb, placed_support jsonb, updated_at). Hot-swappable storage cube.
  const planKey = (k: string) => `sec2525.plan.${k}`;
  useEffect(() => { aoKeyRef.current = aoKey; }, [aoKey]);
  // load the saved plan for the AO (or empty) + reconcile inventory/ids
  useEffect(() => {
    let p: Placed[] = [], s: PlacedSupport[] = [];
    try { const raw = localStorage.getItem(planKey(aoKey)); if (raw) { const o = JSON.parse(raw); p = o.placed ?? []; s = o.placedSupport ?? []; } } catch { /* ignore */ }
    setPlaced(p); setPlacedSupport(s);
    setInventory(INITIAL_INVENTORY.map((i) => ({ ...i, stock: i.stock - p.filter((u) => u.asset === i.asset).reduce((a, u) => a + u.count, 0) })));
    idRef.current = Math.max(0, ...p.map((u) => u.id), ...s.map((u) => u.id)) + 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aoKey]);
  // save on every placement edit (keyed to the CURRENT AO via ref). NOT during playback — the
  // dead-reckoning loop mutates positions every frame; persisting those would spam storage and
  // overwrite the authored start. RESET/STOP restores the snapshot, which then saves normally.
  useEffect(() => {
    if (playingRef.current || playStartRef.current) return; // sim in progress (playing OR paused) — keep the authored start
    try { localStorage.setItem(planKey(aoKeyRef.current), JSON.stringify({ placed, placedSupport })); } catch { /* quota */ }
  }, [placed, placedSupport]);
  // Playback engine — rAF loop advances each moving asset by heading+speed·dt (great-circle-flat
  // dead reckoning; fine at AO scale). Icon rotation happens in the pane (2D only).
  useEffect(() => {
    playingRef.current = playing;
    if (!playing) { if (playRafRef.current != null) cancelAnimationFrame(playRafRef.current); playRafRef.current = null; return; }
    if (!playStartRef.current) playStartRef.current = placed.map((u) => ({ ...u })); // rewind point (first PLAY)
    playLastRef.current = 0;
    const tick = (ts: number) => {
      if (playLastRef.current === 0) playLastRef.current = ts;
      const dtH = Math.min(0.25, (ts - playLastRef.current) / 1000) / 3600; // clamp long frames; → hours
      playLastRef.current = ts;
      setPlaced((pl) => pl.map((u) => {
        if (!u.moving || u.heading == null || !u.speed) return u;
        const km = u.speed * dtH, th = (u.heading * Math.PI) / 180; // 0°=N, clockwise
        const dLat = (km * Math.cos(th)) / 110.574;
        const dLon = (km * Math.sin(th)) / (111.320 * Math.cos((u.lat * Math.PI) / 180) || 1e-6);
        return { ...u, lat: u.lat + dLat, lon: u.lon + dLon };
      }));
      playRafRef.current = requestAnimationFrame(tick);
    };
    playRafRef.current = requestAnimationFrame(tick);
    return () => { if (playRafRef.current != null) cancelAnimationFrame(playRafRef.current); playRafRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  const resetTracks = () => { setPlaying(false); if (playStartRef.current) { setPlaced(playStartRef.current); playStartRef.current = null; } };
  // switching AO ends any playback and drops the stale rewind snapshot
  useEffect(() => { setPlaying(false); playStartRef.current = null; }, [aoKey]);

  useEffect(() => {
    try { const v = localStorage.getItem("sec2525.cursorMode"); if (v === "target" || v === "pointer") setCursorMode(v); } catch { /* no storage */ }
  }, []);
  const setCursor = (m: "pointer" | "target") => { setCursorMode(m); try { localStorage.setItem("sec2525.cursorMode", m); } catch { /* no storage */ } };

  const ao = allAos.find((a) => a.key === aoKey) ?? AOS[0];

  // MAP (A) + MINI MAP (B) are the SAME format; MIRROR keeps them in lock-step.
  const OVERVIEW_FACTOR = 3; // mini map opens further out for situational context
  const [viewA, setViewA] = useState<ViewState>(() => initView(ao, 1));
  const [viewB, setViewB] = useState<ViewState>(() => initView(ao, OVERVIEW_FACTOR));
  const enteringRef = useRef(false);       // globe→AO drill sets the view itself (skip the reset)
  const zoomAnimRef = useRef<number | null>(null);
  useEffect(() => {
    if (enteringRef.current) { enteringRef.current = false; return; } // drill-to-region handles the view
    setViewA(initView(ao, 1));
    setViewB(initView(ao, mirror ? 1 : OVERVIEW_FACTOR));
    if (ao.precision) setDigits(ao.precision);
  }, [aoKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // MIRROR = NORTH-LOCK ONLY (HI 1.3.2). Panes keep independent 2D/3D + zoom + centre;
  // only their bearing (north) stays locked. The clicked icon's pane pushes its north to
  // the other on engage, then the two bearings track together (rotate either → both turn).
  const toggleMirror = (src: "map" | "mini") => {
    setMirrorFrom((cur) => {
      if (cur === src) { preMirrorRef.current = null; return null; } // disengage — nothing to restore (view/mode were never overwritten)
      if (src === "mini") setViewA((v) => ({ ...v, bearing: viewB.bearing })); // mini clicked → push mini north to MAP
      else setViewB((v) => ({ ...v, bearing: viewA.bearing }));                // map clicked → push map north to MINI
      return src;
    });
  };
  // MIRROR = NORTH-LOCK only, synced IMMEDIATELY in the same update (HI 1.3.3 regression fix:
  // the prior effect-based sync lagged one frame → the other pane's bearing jittered/glitched
  // during a continuous rotate. Now the twin bearing is set in the same commit — smooth).
  const setViewA_ = (u: (v: ViewState) => ViewState) => setViewA((v) => { const nv = u(v); if (mirror) setViewB((w) => (w.bearing === nv.bearing ? w : { ...w, bearing: nv.bearing })); return nv; });
  const setViewB_ = (u: (v: ViewState) => ViewState) => setViewB((v) => { const nv = u(v); if (mirror) setViewA((w) => (w.bearing === nv.bearing ? w : { ...w, bearing: nv.bearing })); return nv; });
  // Smooth geometric ease of the MAP span (easeOutCubic) — the cinematic "fly-in".
  const zoomChainRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animateSpanTo = (fromKm: number, toKm: number, ms = 800) => {
    if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const span = fromKm * Math.pow(toKm / fromKm, e);
      setViewA((v) => ({ ...v, spanKm: span })); // zoom is per-pane now (mirror locks NORTH only)
      if (k < 1) zoomAnimRef.current = requestAnimationFrame(tick);
    };
    zoomAnimRef.current = requestAnimationFrame(tick);
  };
  // Drill from the Earth/globe into an AO: land wide (region) then glide to detail.
  const enterAo = (k: string, setMode: (m: "world" | "ao") => void) => {
    const t = allAos.find((a) => a.key === k) ?? ao;
    if (t.precision) setDigits(t.precision);
    if (k !== aoKey) enteringRef.current = true; // only arm on a real key change, else the [aoKey] effect never clears it
    setAoKey(k); // plan-load effect restores this AO's saved placements
    const wide = 900, region = Math.max(30, t.halfKm * 6); // region ≈ 6× the site half-extent
    const site = Math.max(MIN_SPAN_KM, t.halfKm * 2);      // the site cut itself (e.g. Capitol 2.4 km)
    setViewA({ lat: t.center[0], lon: t.center[1], spanKm: wide, bearing: 0 }); // mirror locks NORTH only — the mini keeps its own zoom/centre
    setMode("ao");
    // P1 (Aset + Thought Master): ONE continuous zoom from the globe to the SITE —
    // land wide, glide to region, dwell so the eye orients, then continue to the site.
    // Same Natural-Earth source at every stage; no flat 'blue screen' hop.
    animateSpanTo(wide, region, 850);
    if (zoomChainRef.current) clearTimeout(zoomChainRef.current);
    zoomChainRef.current = setTimeout(() => animateSpanTo(region, site, 950), 850 + 450);
  };
  // 2D/3D is PER-PANE even while mirrored (user law) — only the VIEW mirrors.
  const toggle3dA = () => setIs3dA((v) => !v);
  const toggle3dB = () => setIs3dB((v) => !v);
  const setModeA_ = (m: "world" | "ao") => { setModeA(m); if (mirrorFrom === "map") setModeB(m); };
  const setModeB_ = (m: "world" | "ao") => { setModeB(m); if (mirrorFrom === "mini") setModeA(m); };
  // Pick + load the finest real DEM tile covering the current view (resolution pyramid).
  useEffect(() => {
    const key = pickDemKey(viewA.lat, viewA.lon, viewA.spanKm);
    if (key === demKeyRef.current) return;
    demKeyRef.current = key;
    if (!key) { setDem(null); return; }
    const warm = peekTile<Dem>(`dem-${key}`);
    if (warm) setDem(warm); // in-memory → instant, no flash frame
    else getTile<Dem>(`dem-${key}`, `/security-2525/dem-${key}.json`).then((d) => {
      if (demKeyRef.current !== key) return;        // view moved on
      if (d) setDem(d); else demKeyRef.current = null; // transient miss → retry on next move
    });
    // 6-face BETA: prefetch the zoom-in (finer) + zoom-out (coarser) tiles through the
    // cache ladder so the next zoom is instant — the "pull-as-you-need" cube seed.
    if (mapEngine === "beta") {
      for (const s of [viewA.spanKm / 3, viewA.spanKm * 3]) {
        const pk = pickDemKey(viewA.lat, viewA.lon, s);
        if (pk && pk !== key && !peekTile(`dem-${pk}`)) getTile<Dem>(`dem-${pk}`, `/security-2525/dem-${pk}.json`);
      }
    }
  }, [viewA.lat, viewA.lon, viewA.spanKm, mapEngine]);
  // MINI map its own tile (viewB) — so SPLIT-mode contours match the mini's region, not the big map's.
  useEffect(() => {
    const key = pickDemKey(viewB.lat, viewB.lon, viewB.spanKm);
    if (key === demKeyRefB.current) return;
    demKeyRefB.current = key;
    if (!key) { setDemB(null); return; }
    const warm = peekTile<Dem>(`dem-${key}`);
    if (warm) setDemB(warm);
    else getTile<Dem>(`dem-${key}`, `/security-2525/dem-${key}.json`).then((d) => {
      if (demKeyRefB.current !== key) return;
      if (d) setDemB(d); else demKeyRefB.current = null;
    });
  }, [viewB.lat, viewB.lon, viewB.spanKm]);

  const fmt = useMemo(() => makeFormatters(coordFmt, digits, unit), [coordFmt, digits, unit]);

  // Fullscreen (Fullscreen API) — reclaim the screen from the browser chrome.
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFs = () => {
    // Fullscreen the WHOLE app (header, tabs, maps, rails — everything as-is);
    // the only difference is the browser chrome disappears.
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Load Natural Earth borders once (shared by both map panes for context layers).
  useEffect(() => {
    if (borderCache) { setBorders(borderCache); return; }
    fetch("/security-2525/borders-ne50m.json")
      .then((r) => r.json())
      .then((d: BorderData) => { borderCache = d; setBorders(d); })
      .catch(() => {});
  }, []);

  // Load OSM roads/water for the active AO — through the tile ladder (memory→localStorage→
  // Supabase→origin). Big 100km road tiles (too large for git) serve from Supabase once seeded.
  useEffect(() => {
    let cancelled = false; // AO changed before the async tile resolved → drop the stale result
    const key = ao.osm;
    if (!key) { setOsm(null); return; }
    const apply = (d: OsmData | null) => {
      if (cancelled) return;
      if (!d) { setOsm(null); return; }
      d.roads.forEach((w) => {
        if (w.bb) return; // already computed (cached payload)
        let x0 = w.p[0][0], x1 = x0, y0 = w.p[0][1], y1 = y0;
        for (const [x, y] of w.p) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        w.bb = [x0, y0, x1, y1];
      });
      setOsm(d);
    };
    const warm = peekTile<OsmData>(`osm-${key}`);
    if (warm) apply(warm);
    else getTile<OsmData>(`osm-${key}`, `/security-2525/osm-${key}.json`, "vector").then(apply);
    return () => { cancelled = true; };
  }, [ao.osm]);

  // ── Shared placement mutators ────────────────────────────────────────────
  const allocId = () => idRef.current++;
  const remove = (u: Placed) => {
    setPlaced((pl) => pl.filter((x) => x.id !== u.id));
    setInventory((inv) => inv.map((i) => (i.asset === u.asset ? { ...i, stock: i.stock + u.count } : i)));
  };
  const undoLastPlacement = () => {
    const la = placed[placed.length - 1], ls = placedSupport[placedSupport.length - 1];
    if (ls && (!la || ls.id > la.id)) setPlacedSupport((pl) => pl.slice(0, -1));
    else if (la) remove(la);
  };
  const setAff = (sel: { kind: "asset" | "support"; id: number }, aff: Affiliation) => {
    if (sel.kind === "asset") setPlaced((pl) => pl.map((u) => (u.id === sel.id ? { ...u, aff } : u)));
    else setPlacedSupport((pl) => pl.map((u) => (u.id === sel.id ? { ...u, aff } : u)));
  };
  const setPlacedReality = (id: number, r: RealityMode) =>
    setPlacedSupport((pl) => pl.map((u) => (u.id === id ? { ...u, reality: r } : u)));
  const updAsset = (id: number, patch: Partial<Placed>) =>
    setPlaced((pl) => pl.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  const setTL = (id: number, key: "p" | "s" | "t", tl: TL | null) =>
    setPlaced((pl) => pl.map((u) => (u.id === id ? { ...u, tls: { ...u.tls, [key]: tl ?? undefined } } : u)));
  const nudge = (sel: { kind: "asset" | "support"; id: number }, dLat: number, dLon: number) => {
    const upd = <T extends { id: number; lat: number; lon: number }>(u: T): T =>
      u.id === sel.id ? { ...u, lat: u.lat + dLat, lon: u.lon + dLon } : u;
    if (sel.kind === "asset") setPlaced((pl) => pl.map(upd));
    else setPlacedSupport((pl) => pl.map(upd));
  };
  const setCoord = (sel: { kind: "asset" | "support"; id: number }, lat: number, lon: number) => {
    if (sel.kind === "asset") setPlaced((pl) => pl.map((u) => (u.id === sel.id ? { ...u, lat, lon } : u)));
    else setPlacedSupport((pl) => pl.map((u) => (u.id === sel.id ? { ...u, lat, lon } : u)));
  };
  const removeSelected = () => {
    if (!selected) return;
    if (selected.kind === "asset") { const u = placed.find((x) => x.id === selected.id); if (u) remove(u); }
    else setPlacedSupport((pl) => pl.filter((x) => x.id !== selected.id));
    setSelected(null);
  };
  // HI: per-row trash — delete any active item directly from the ACTIVE ITEMS list.
  const deleteItem = (kind: "asset" | "support", id: number) => {
    if (kind === "asset") { const u = placed.find((x) => x.id === id); if (u) remove(u); }
    else setPlacedSupport((pl) => pl.filter((x) => x.id !== id));
    setSelected((s) => (s && s.kind === kind && s.id === id ? null : s));
  };
  const selectedObj = selected
    ? (selected.kind === "asset" ? placed.find((u) => u.id === selected.id) : placedSupport.find((u) => u.id === selected.id))
    : undefined;
  const clearAo = () => { setPlaced([]); setPlacedSupport([]); setInventory(INITIAL_INVENTORY); };
  const routeMode = !!selectedSupport && (selectedSupport.geometry === "line" || selectedSupport.geometry === "corridor");

  // ── Plan approval + share (HI commander governance) ───────────────────────
  // Any placement edit (add/remove/nudge/retarget/affiliation/altitude/TL) invalidates a prior
  // approval — the plan returns to DRAFT. Keyed on a content signature, not just array length.
  const planSig = useMemo(() => JSON.stringify(placed) + "|" + JSON.stringify(placedSupport), [placed, placedSupport]);
  useEffect(() => { setPlanStatus((s) => (s === "draft" ? s : "draft")); }, [planSig, aoKey]);
  const planSummary = () => [
    "SECURITY-2525 · MISSION PLAN (proposal — pending human commander approval)",
    `AO: ${ao.name}`,
    `Reality mode: ${reality}`,
    `Assets ${placed.length} · Support ${placedSupport.length}`,
    ...placed.map((u) => `  • ${ASSET_LABELS[u.asset]}${u.count > 1 ? ` ×${u.count}` : ""} @ ${fmt.coordAt(u.lat, u.lon)}${u.mobile ? " (on-the-move)" : ""}`),
    ...placedSupport.map((u) => `  • ${u.def.term} @ ${fmt.coordAt(u.lat, u.lon)}`),
    "Governance: nothing fires on its own — human authority retained · Vision 2525 aligned",
  ].join("\n");
  const sharePlan = () => {
    const text = planSummary();
    try { navigator.clipboard?.writeText(text); setShareMsg("Plan copied to clipboard"); }
    catch { setShareMsg("Copy failed — select & copy manually"); }
    setTimeout(() => setShareMsg(""), 2500);
  };

  // Sync the exact-coordinate input (in the Settings-primary format) on selection change.
  useEffect(() => {
    if (selectedObj) setCoordText(coordFmt === "mgrs" ? latLonToMgrs(selectedObj.lat, selectedObj.lon, digits) : fmt.coordAt(selectedObj.lat, selectedObj.lon));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.kind, selected?.id, coordFmt, digits]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undoLastPlacement(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // no deps → always latest state

  const paneCommon = {
    ao, iconStyle, fmt, digits, gridOn, elevOn, contourCfg, rangeOn, roadsOn, waterOn, terrainOn, cursorMode,
    osm, borders, inventory, placed, placedSupport, selected, selectedAsset, selectedSupport,
    onDisarm: () => { setSelectedAsset(null); setSelectedSupport(null); },
    coordFmt, onSetCoordFmt: setCoordFmt, unit, onSetUnit: setUnit, gridStepM,
    maxAltFt, altRedPct, altYellowPct, setAltRedPct, setAltYellowPct, voxelCellM, voxelLimitPct, voxelHiColor,
    reality, hoverAsset, setInventory, setPlaced, setPlacedSupport, setSelected, setHoverAsset, allocId,
    drawingAo, aoDraft, onAoVertex: addAoVertex, drawnAo: drawnAos[aoKey], pitch, onPitch: setPitch, iconScale: ICON_SCALE[iconSize],
    mapEngine, playing, onTogglePlay: () => setPlaying((p) => !p), onResetTracks: resetTracks,
  }; // NB: `dem` is passed per-pane (demA→MAP, demB→MINI) so each pane's contours match its own view.
     // 2D↔3D reuses this SAME tile — is3d is a render flag only; no DEM/OSM effect depends on it → ZERO extra fetch.

  return (
    <div ref={rootRef} className="space-y-2 p-3">
      {/* Minimal command bar — hidden while a pane is in-app fullscreen (MINIMIZE restores) */}
      <div className={fsPane ? "hidden" : "relative flex items-center gap-2"}>
        <div className="flex shrink-0 items-center gap-1 text-[10px] font-semibold tracking-wide">
          <span style={{ color: C.dim }}>{aoStateOf(ao.key)}</span>
          <ChevronRight className="h-3 w-3" style={{ color: C.border }} />
          <span style={{ color: C.cyan }}>{ao.name.split(" · ")[0]}</span>
        </div>
        {/* AO / MISSION dropdown — grouped by state; declutters the old scroll row */}
        <div className="relative flex-1">
          <button onClick={() => setAoMenuOpen((v) => !v)} title="Select area of operations / mission"
            className="mx-auto flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold tracking-wide"
            style={{ borderColor: aoMenuOpen ? C.cyan : C.border, color: C.cyan }}>
            <MapPin className="h-3 w-3" /> {ao.name.split(" · ")[0]} <ChevronRight className={`h-3 w-3 transition-transform ${aoMenuOpen ? "rotate-90" : ""}`} style={{ color: C.dim }} />
          </button>
          {aoMenuOpen && (
            <div className="absolute left-1/2 top-8 z-50 max-h-[70vh] w-60 -translate-x-1/2 overflow-y-auto rounded-lg border p-1 shadow-2xl"
              style={{ background: C.panel, borderColor: C.cyan }}>
              {(["CUSTOM", "TX", "WA", "DC", "FL"] as const).map((st) => {
                const group = allAos.filter((a) => aoStateOf(a.key) === st && !aoHidden.has(a.key));
                if (!group.length) return null;
                return (
                  <div key={st} className="mb-1">
                    <div className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider" style={{ color: st === "CUSTOM" ? C.amber : C.dim }}>{st === "CUSTOM" ? "MISSIONS" : st}</div>
                    {group.map((a) => {
                      const custom = a.key.startsWith("custom-");
                      return (
                        <div key={a.key} className="flex items-center gap-1 rounded pr-1 hover:bg-white/5" style={{ background: a.key === aoKey ? "#152238" : "transparent" }}>
                          {custom ? (
                            <>
                              <button onClick={() => { setAoKey(a.key); setAoMenuOpen(false); }} title="Select mission" className="shrink-0 pl-2"><MapPin className="h-3 w-3" style={{ color: a.key === aoKey ? C.cyan : C.dim }} /></button>
                              <input value={a.name.split(" · ")[0]} onChange={(e) => renameMission(a.key, e.target.value)} onClick={(e) => e.stopPropagation()}
                                className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[10px] font-semibold outline-none" style={{ color: a.key === aoKey ? C.cyan : C.text }} />
                              <button onClick={(e) => { e.stopPropagation(); toggleAoHidden(a.key); }} title="Hide (moves to HIDDEN at bottom — delete from there)" className="shrink-0 p-0.5"><EyeOff className="h-3 w-3" style={{ color: C.dim }} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setAoKey(a.key); setAoMenuOpen(false); }}
                                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-left text-[10px] font-semibold"
                                style={{ color: a.key === aoKey ? C.cyan : C.text }}>
                                <MapPin className="h-3 w-3 shrink-0" style={{ color: a.key === aoKey ? C.cyan : C.dim }} />
                                <span className="truncate">{a.name.split(" · ")[0]}</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); toggleAoHidden(a.key); }} title="Hide (moves to HIDDEN at bottom — delete from there)" className="shrink-0 p-0.5"><EyeOff className="h-3 w-3" style={{ color: C.dim }} /></button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <button onClick={createMission} className="mt-1 w-full rounded border px-2 py-1 text-left text-[10px] font-bold" style={{ borderColor: C.green, color: C.green }}>＋ NEW MISSION (at current view)</button>
              {aoHidden.size > 0 && (
                <div className="mt-1 border-t pt-1" style={{ borderColor: C.border }}>
                  <button onClick={() => setShowHiddenAos((v) => !v)} className="w-full px-2 py-0.5 text-left text-[8px] font-bold uppercase tracking-wider" style={{ color: C.dim }}>
                    {showHiddenAos ? "▾" : "▸"} Hidden ({aoHidden.size}) — restore
                  </button>
                  {showHiddenAos && allAos.filter((a) => aoHidden.has(a.key)).map((a) => (
                    <div key={a.key} className="flex items-center gap-1 rounded pr-1 opacity-70 hover:bg-white/5">
                      <span className="min-w-0 flex-1 truncate px-2 py-1 text-[10px]" style={{ color: C.dim }}>{a.name.split(" · ")[0]}</span>
                      <button onClick={() => toggleAoHidden(a.key)} title="Restore (show on map + list)" className="shrink-0 p-0.5"><Eye className="h-3 w-3" style={{ color: C.green }} /></button>
                      <button onClick={() => removeAo(a.key)} title="Delete permanently (remove from map + list)" className="shrink-0 p-0.5"><Trash2 className="h-3 w-3" style={{ color: C.red }} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative flex shrink-0 items-center gap-2">
          {/* HI 1.3.2: removed the top-bar coordinate readout (repetitive — the in-map
              readout already shows it) and the LAYERS panel (repetitive with Settings). */}
          {/* ULT · Unit Line-up Table — the COMM/LINK setup layer (who's in the fight) */}
          <button onClick={() => setShowUlt((v) => !v)} title="ULT — Unit Line-up Table (setup: units · COMM · LINK)"
            className="rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: showUlt ? C.cyan : C.border, color: showUlt ? C.cyan : C.dim }}>ULT</button>
          {showUlt && (
            <div className="absolute right-0 top-9 z-50 max-h-[70vh] w-[min(96vw,760px)] overflow-auto rounded-lg border shadow-2xl" style={{ background: C.panel, borderColor: C.cyan }}>
              <div className="sticky top-0 flex items-center justify-between border-b px-2 py-1" style={{ background: C.panel, borderColor: C.border }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>ULT · Unit Line-up (SETUP) <span style={{ color: C.dim }}>— {ultRows.length} nodes</span></span>
                <button onClick={() => setShowUlt(false)} className="text-[10px] font-semibold" style={{ color: C.dim }}>✕</button>
              </div>
              <table className="w-full border-collapse text-[8px]">
                <thead><tr style={{ color: C.dim }}>
                  {["ID", "NODE", "DESC", "SUP", "COMM", "PAX", "WPN", "VEH", "EQUIP", "NOTES", ""].map((h, i) => <th key={i} className="border-b px-1 py-0.5 text-left font-semibold" style={{ borderColor: C.border }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {ultRows.map((u, i) => {
                    const cell = (val: string, on: (v: string) => void, color: string, mono = false) => (
                      <input value={val} onChange={(e) => on(e.target.value)}
                        className={`w-full bg-transparent px-1 py-0.5 outline-none ${mono ? "font-mono" : ""}`} style={{ color }} />
                    );
                    return (
                      <tr key={u.id} className="hover:bg-white/5">
                        <td className="border-b font-mono" style={{ borderColor: C.border, color: C.gold }}>{cell(u.id, (v) => updUlt(i, { id: v }), C.gold, true)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(u.node, (v) => updUlt(i, { node: v }), C.cyan, true)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(u.desc, (v) => updUlt(i, { desc: v }), C.text)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(u.supervisor, (v) => updUlt(i, { supervisor: v }), C.dim, true)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(u.comm, (v) => updUlt(i, { comm: v }), "#a78bfa")}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(String(u.personnel), (v) => updUlt(i, { personnel: parseInt(v) || 0 }), C.text, true)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(String(u.rifles), (v) => updUlt(i, { rifles: parseInt(v) || 0 }), C.amber, true)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(String(u.vehicles), (v) => updUlt(i, { vehicles: parseInt(v) || 0 }), C.text, true)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(u.equipment, (v) => updUlt(i, { equipment: v }), C.dim)}</td>
                        <td className="border-b" style={{ borderColor: C.border }}>{cell(u.notes, (v) => updUlt(i, { notes: v }), C.dim)}</td>
                        <td className="border-b text-center" style={{ borderColor: C.border }}><button onClick={() => delUltRow(i)} title="Delete row" className="px-1 font-bold" style={{ color: C.red }}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-2 py-1">
                <button onClick={addUltRow} className="rounded border px-2 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.green, color: C.green }}>＋ ADD ROW</button>
                <span className="text-[8px]" style={{ color: C.dim }}>Starts at 001–008; add units as you build. Evidence / replay only.</span>
              </div>
            </div>
          )}
          {/* AO / AOR draw — tap map to add vertices; save; then set AOR buffer 10–100 km */}
          <div className="flex items-center gap-1">
            <button onClick={() => { setDrawingAo((v) => !v); setAoDraft([]); }} title="Draw AO polygon — tap the map to add vertices"
              className="rounded border px-1.5 py-1 text-[10px] font-semibold" style={{ borderColor: drawingAo ? C.cyan : C.border, color: drawingAo ? C.cyan : C.dim }}>✎ AO</button>
            {drawingAo && (<>
              <span className="font-mono text-[9px]" style={{ color: C.dim }}>{aoDraft.length}</span>
              <button onClick={() => setAoDraft((d) => d.slice(0, -1))} title="Undo last vertex" className="rounded border px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>↶</button>
              <button onClick={saveDrawnAo} disabled={aoDraft.length < 3} title="Save AO (≥3 vertices)" className="rounded border px-1 py-0.5 text-[9px] font-bold" style={{ borderColor: aoDraft.length >= 3 ? C.green : C.border, color: aoDraft.length >= 3 ? C.green : C.border }}>✓</button>
              <button onClick={() => { setDrawingAo(false); setAoDraft([]); }} title="Cancel" className="rounded border px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.red }}>✕</button>
            </>)}
            {!drawingAo && drawnAos[aoKey] && (<>
              <span className="text-[9px] font-semibold" style={{ color: C.amber }}>AOR</span>
              <input type="number" min={10} max={100} step={5} value={drawnAos[aoKey].aorKm} onChange={(e) => setAorKm(parseInt(e.target.value) || 10)}
                className="w-11 rounded border bg-transparent px-1 py-0.5 text-[9px] font-mono" style={{ borderColor: C.border, color: C.text }} />
              <span className="text-[9px]" style={{ color: C.dim }}>km</span>
              <button onClick={deleteDrawnAo} title="Delete drawn AO" className="p-0.5"><Trash2 className="h-3 w-3" style={{ color: C.red }} /></button>
            </>)}
          </div>
          <button onClick={() => setMiniOpen((m) => !m)} title={miniOpen ? "Hide mini-map" : "Show mini-map"}
            className="rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: miniOpen ? C.cyan : C.border, color: miniOpen ? C.cyan : C.dim }}>MINI</button>
          <button onClick={toggleFs} title={isFs ? "Exit fullscreen" : "Fullscreen"}
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: isFs ? C.cyan : C.border, color: isFs ? C.cyan : C.dim }}>
            {isFs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          {/* HI 1.3.2: top-nav SETTINGS button REMOVED — map + VOXEL settings now open
              from the gear on the map toolbar (right of RESET) to declutter this bar. */}
        </div>
        {showSettings && (
          <div className="absolute right-0 top-9 z-40 w-60 rounded-lg border p-3 shadow-xl" style={{ background: C.panel, borderColor: C.cyan }}>
            {/* HI 1.3.3: explicit ✕ close — on phone the gear icon can scroll off-screen, so
                the panel must be closable from within. */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Mission Planning Settings</span>
              <button onClick={() => setShowSettings(false)} title="Close settings" className="text-[13px] leading-none" style={{ color: C.dim }}>✕</button>
            </div>
            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px]" style={{ color: C.text }}>UTM grid</span>
                <button onClick={() => setGridOn(!gridOn)} className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ borderColor: gridOn ? C.green : C.border, color: gridOn ? C.green : C.dim }}><Grid3x3 className="h-3 w-3" />{gridOn ? "ON" : "OFF"}</button>
              </div>
              {gridOn && (
                <div className="flex flex-wrap items-center gap-1">
                  <button onClick={() => setGridStepM(0)} className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                    style={{ borderColor: gridStepM === 0 ? C.cyan : C.border, color: gridStepM === 0 ? C.cyan : C.dim }}>AUTO</button>
                  {([
                    [10, "10 m"], [100, "100 m"], [1000, "1 km"], [100000, "100 km"], [1000000, "1,000 km"],
                  ] as const).map(([m, lb]) => (
                    <button key={m} onClick={() => setGridStepM(m)} className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                      style={{ borderColor: gridStepM === m ? C.cyan : C.border, color: gridStepM === m ? C.cyan : C.dim }}>{lb}</button>
                  ))}
                  {([
                    [1609, "1 mi"], [160934, "100 mi"], [1609344, "1,000 mi"],
                  ] as const).map(([m, lb]) => (
                    <button key={m} onClick={() => setGridStepM(m)} className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                      style={{ borderColor: gridStepM === m ? C.gold : C.border, color: gridStepM === m ? C.gold : C.dim }}>{lb}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px]" style={{ color: C.text }}>Map layers</span>
              <div className="flex gap-1">
                <button onClick={() => setTerrainOn(!terrainOn)} title="Green land / blue ocean base" className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ borderColor: terrainOn ? "#22c55e" : C.border, color: terrainOn ? "#22c55e" : C.dim }}>LAND/SEA</button>
                <button onClick={() => setRoadsOn(!roadsOn)} className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ borderColor: roadsOn ? "#cbd5e1" : C.border, color: roadsOn ? "#e5e7eb" : C.dim }}>ROADS</button>
                <button onClick={() => setWaterOn(!waterOn)} className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ borderColor: waterOn ? "#38bdf8" : C.border, color: waterOn ? "#38bdf8" : C.dim }}>WATER</button>
              </div>
            </div>
            <div className="mb-1 text-[10px]" style={{ color: C.text }}>Coordinate format</div>
            <div className="mb-2 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
              {([["mgrs", "MGRS"], ["dms", "LLV-DMS"], ["ucrs", "UCRS-2525"]] as const).map(([f, label]) => (
                <button key={f} onClick={() => setCoordFmt(f)} className="flex-1 px-2 py-1"
                  style={{ background: coordFmt === f ? "#152238" : "transparent", color: coordFmt === f ? C.cyan : C.dim }}>{label}</button>
              ))}
            </div>
            <div className="mb-1 text-[10px]" style={{ color: C.text }}>Precision</div>
            <div className="mb-2 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
              {PRECISIONS.map((p) => (
                <button key={p.d} onClick={() => setDigits(p.d)} title={p.hint} className="flex-1 px-1.5 py-1"
                  style={{ background: digits === p.d ? "#2a230f" : "transparent", color: digits === p.d ? C.amber : C.dim }}>{p.label}</button>
              ))}
            </div>
            <div className="mb-1 text-[10px]" style={{ color: C.text }}>Units</div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex flex-1 overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
                {([["km", "KM"], ["m", "M"]] as const).map(([u, label]) => (
                  <button key={u} onClick={() => setUnit(u)} className="flex-1 px-2 py-1"
                    style={{ background: unit === u ? "#152238" : "transparent", color: unit === u ? C.cyan : C.dim }}>{label}</button>
                ))}
              </div>
              <div className="flex flex-1 overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
                {([["mi", "MI"], ["ft", "FT"]] as const).map(([u, label]) => (
                  <button key={u} onClick={() => setUnit(u)} className="flex-1 px-2 py-1"
                    style={{ background: unit === u ? "#152238" : "transparent", color: unit === u ? C.cyan : C.dim }}>{label}</button>
                ))}
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px]" style={{ color: C.text }}>Elevation profiles</span>
              <button onClick={() => setElevOn(!elevOn)} className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ borderColor: elevOn ? C.gold : C.border, color: elevOn ? C.gold : C.dim }}>{elevOn ? "ON" : "OFF"}</button>
            </div>

            {/* Layers → Terrain & Visualization — Elevation Contours */}
            <div className="mb-1 mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: C.border }}>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Elevation contours</span>
              <button onClick={() => setContourCfg((c) => ({ ...c, enable: !c.enable }))} className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ borderColor: contourCfg.enable ? C.green : C.border, color: contourCfg.enable ? C.green : C.dim }}>{contourCfg.enable ? "ON" : "OFF"}</button>
            </div>
            {contourCfg.enable && (
              <div className="mb-2 space-y-1.5 rounded border p-1.5" style={{ borderColor: C.border }}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: C.dim }}>Count (auto 3–9)</span>
                  <div className="flex items-center gap-1">
                    <input type="range" min={3} max={9} value={contourCfg.count} onChange={(e) => setContourCfg((c) => ({ ...c, count: parseInt(e.target.value) }))} className="w-16" />
                    <span className="w-3 text-right font-mono text-[9px]" style={{ color: C.text }}>{contourCfg.count}</span>
                  </div>
                </div>
                {/* ELEVATION (land) — its own enable + colour + thickness */}
                <div className="rounded border p-1" style={{ borderColor: C.border }}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: "#cbd5e1" }}>Elevation (land)</span>
                    <button onClick={() => setContourCfg((c) => ({ ...c, showLand: !c.showLand }))} className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                      style={{ borderColor: contourCfg.showLand ? "#94a3b8" : C.border, color: contourCfg.showLand ? "#cbd5e1" : C.dim }}>{contourCfg.showLand ? "ON" : "OFF"}</button>
                  </div>
                  <SpectrumPicker value={contourCfg.landColor} onChange={(hex) => setContourCfg((c) => ({ ...c, landColor: hex }))} ariaLabel="land contour colour" />
                  <div className="mt-1 flex items-center gap-1">
                    <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                      {CONTOUR_THICKNESS.map((t) => (
                        <button key={t} onClick={() => setContourCfg((c) => ({ ...c, thickness: t }))} className="px-1.5 py-0.5"
                          style={{ background: Math.abs(contourCfg.thickness - t) < 1e-6 ? "#152238" : "transparent", color: Math.abs(contourCfg.thickness - t) < 1e-6 ? C.cyan : C.dim }}>{t}</button>
                      ))}
                    </div>
                    <input type="range" min={0.25} max={CONTOUR_MAX_PX} step={0.05} value={contourCfg.thickness} onChange={(e) => setContourCfg((c) => ({ ...c, thickness: capContourPx(parseFloat(e.target.value)) }))} className="w-10" />
                    <input type="number" min={0.25} max={CONTOUR_MAX_PX} step={0.05} value={contourCfg.thickness}
                      onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) setContourCfg((c) => ({ ...c, thickness: capContourPx(v) })); }}
                      className="w-11 rounded border bg-transparent px-1 py-0.5 text-[9px] font-mono" style={{ borderColor: C.border, color: C.text }} />
                    <span className="text-[8px]" style={{ color: C.dim }}>px</span>
                  </div>
                  <div className="mt-0.5 text-[7px]" style={{ color: C.dim }}>screen px · capped at {CONTOUR_MAX_PX}px — never thicker than state/country lines</div>
                </div>
                {/* BATHYMETRY (sea · MSL) — its own enable + colour + thickness */}
                <div className="rounded border p-1" style={{ borderColor: C.border }}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: "#22d3ee" }}>Bathymetry (sea · MSL)</span>
                    <button onClick={() => setContourCfg((c) => ({ ...c, showBathy: !c.showBathy }))} className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                      style={{ borderColor: contourCfg.showBathy ? "#22d3ee" : C.border, color: contourCfg.showBathy ? "#22d3ee" : C.dim }}>{contourCfg.showBathy ? "ON" : "OFF"}</button>
                  </div>
                  <SpectrumPicker value={contourCfg.bathyColor} onChange={(hex) => setContourCfg((c) => ({ ...c, bathyColor: hex }))} ariaLabel="bathymetry contour colour" />
                  <div className="mt-1 flex items-center gap-1">
                    <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                      {CONTOUR_THICKNESS.map((t) => (
                        <button key={t} onClick={() => setContourCfg((c) => ({ ...c, bathyThickness: t }))} className="px-1.5 py-0.5"
                          style={{ background: Math.abs(contourCfg.bathyThickness - t) < 1e-6 ? "#152238" : "transparent", color: Math.abs(contourCfg.bathyThickness - t) < 1e-6 ? C.cyan : C.dim }}>{t}</button>
                      ))}
                    </div>
                    <input type="range" min={0.25} max={CONTOUR_MAX_PX} step={0.05} value={contourCfg.bathyThickness} onChange={(e) => setContourCfg((c) => ({ ...c, bathyThickness: capContourPx(parseFloat(e.target.value)) }))} className="w-10" />
                    <input type="number" min={0.25} max={CONTOUR_MAX_PX} step={0.05} value={contourCfg.bathyThickness}
                      onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) setContourCfg((c) => ({ ...c, bathyThickness: capContourPx(v) })); }}
                      className="w-11 rounded border bg-transparent px-1 py-0.5 text-[9px] font-mono" style={{ borderColor: C.border, color: C.text }} />
                    <span className="text-[8px]" style={{ color: C.dim }}>px</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px]" style={{ color: C.dim }}>Units</span>
                  <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                    {(["metric", "imperial", "both"] as const).map((u) => (
                      <button key={u} onClick={() => setContourCfg((c) => ({ ...c, units: u }))} className="px-1.5 py-0.5"
                        style={{ background: contourCfg.units === u ? "#152238" : "transparent", color: contourCfg.units === u ? C.cyan : C.dim }}>{u === "metric" ? "m" : u === "imperial" ? "ft" : "both"}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px]" style={{ color: C.dim }}>Fidelity</span>
                  <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                    {(["low", "med", "high"] as const).map((f) => (
                      <button key={f} onClick={() => setContourCfg((c) => ({ ...c, fidelity: f }))} className="px-1.5 py-0.5"
                        style={{ background: contourCfg.fidelity === f ? "#152238" : "transparent", color: contourCfg.fidelity === f ? C.cyan : C.dim }}>{f.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: C.dim }}>Label major</span>
                  <button onClick={() => setContourCfg((c) => ({ ...c, labelMajor: !c.labelMajor }))} className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                    style={{ borderColor: contourCfg.labelMajor ? C.gold : C.border, color: contourCfg.labelMajor ? C.gold : C.dim }}>{contourCfg.labelMajor ? "ON" : "OFF"}</button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: C.dim }}>Sea level (MSL) {contourCfg.seaLevel}m</span>
                  <input type="range" min={0} max={400} step={10} value={contourCfg.seaLevel} onChange={(e) => setContourCfg((c) => ({ ...c, seaLevel: parseInt(e.target.value) }))} className="w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: C.dim }}>Vert. exag. {contourCfg.vExag}×</span>
                  <input type="range" min={1} max={5} value={contourCfg.vExag} onChange={(e) => setContourCfg((c) => ({ ...c, vExag: parseInt(e.target.value) }))} className="w-20" />
                </div>
                <div className="text-[7px]" style={{ color: C.dim }}>REAL GEBCO 2020 DEM (land + ocean floor) where a tile covers the view; synthetic fallback elsewhere · raise MSL to reveal sub-sea (bathymetry) contours</div>
              </div>
            )}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px]" style={{ color: C.text }}>Weapon range rings</span>
              <button onClick={() => setRangeOn(!rangeOn)} className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ borderColor: rangeOn ? C.cyan : C.border, color: rangeOn ? C.cyan : C.dim }}>{rangeOn ? "ON" : "OFF"}</button>
            </div>
            <div className="mb-1 text-[10px]" style={{ color: C.text }}>Pointer</div>
            <div className="flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
              {([["pointer", "DEFAULT"], ["target", "MINI-TARGET"]] as const).map(([m, label]) => (
                <button key={m} onClick={() => setCursor(m)} className="flex-1 px-2 py-1"
                  style={{ background: cursorMode === m ? "#152238" : "transparent", color: cursorMode === m ? C.cyan : C.dim }}>{label}</button>
              ))}
            </div>
            {/* Map engine A/B — CURRENT (shipped) vs β + Seed-of-Life 6 (prefetch pull-as-you-need).
                FX-20 (P1.3): "6-FACE" wording removed — the 6-circle Seed of Life IS the icon. */}
            <div className="mt-2 border-t pt-2" style={{ borderColor: C.border }}>
              <div className="mb-1 text-[10px]" style={{ color: C.text }}>Map engine <span className="text-[8px]" style={{ color: C.dim }}>(A/B test)</span></div>
              <div className="flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
                {(["current", "beta"] as const).map((m) => (
                  <button key={m} onClick={() => setMapEngine(m)} className="flex-1 px-2 py-1"
                    style={{ background: mapEngine === m ? "#152238" : "transparent", color: mapEngine === m ? C.cyan : C.dim }}>
                    {m === "current" ? (
                      <span className="inline-flex items-center justify-center gap-1" title="Alpha — shipped square map">α</span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1" title="Beta — World Disc + prefetch">
                        β
                        <svg width="12" height="12" viewBox="-10 -10 20 20" aria-hidden>
                          {[0, 60, 120, 180, 240, 300].map((a) => (
                            <circle key={a} cx={(4.5 * Math.sin((a * Math.PI) / 180)).toFixed(2)} cy={(-4.5 * Math.cos((a * Math.PI) / 180)).toFixed(2)} r="4.5"
                              fill="none" stroke="currentColor" strokeWidth="0.9" />
                          ))}
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[7px]" style={{ color: C.dim }}>β prefetches zoom-in/out DEM tiles so the next zoom is instant. Safe to toggle live.</div>
            </div>
            {/* 3D Elevation Mode — view angle (FAAD/AMDWS altitude-angle) + symbology standard */}
            <div className="mt-2 border-t pt-2" style={{ borderColor: C.border }}>
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>3D Elevation Mode</div>
              <div className="mb-1 flex items-center justify-between">
                {/* FX-22: 3-decimal in MGRS/DMS; base-3600 A.B (UCRS-deg.min) in UCRS-2525 */}
                <span className="text-[9px]" style={{ color: C.dim }}>View angle {coordFmt === "ucrs"
                  ? (() => { const tot = Math.round(pitch * 10 * 3600); return `${String(Math.floor(tot / 3600)).padStart(4, "0")}.${String(tot % 3600).padStart(4, "0")}`; })()
                  : `${pitch.toFixed(3)}°`}</span>
                <input type="range" min={11} max={88} value={Math.round(pitch)} onChange={(e) => setPitch(parseInt(e.target.value))} className="w-24" />
              </div>
              <div className="mb-1 text-[9px]" style={{ color: C.text }}>Symbology standard</div>
              <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                {([["mil", "MIL-STD-2525"], ["exel", "eXeL-STD-2525"], ["hybrid", "HYBRID"]] as const).map(([m, label]) => (
                  <button key={m} onClick={() => setSymbologyMode(m)} className="flex-1 px-1 py-1"
                    style={{ background: symbologyMode === m ? "#152238" : "transparent", color: symbologyMode === m ? C.cyan : C.dim }}>{label}</button>
                ))}
              </div>
              {/* P2: icon visibility — S = current, L = 3× (billboarded upright in 3D) */}
              <div className="mt-1.5 mb-1 flex items-center justify-between">
                <span className="text-[9px]" style={{ color: C.text }}>Icon size</span>
                <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                  {([["s", "SMALL"], ["m", "MEDIUM"], ["l", "LARGE"]] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setIconSize(k)} className="px-1.5 py-0.5"
                      style={{ background: iconSize === k ? "#152238" : "transparent", color: iconSize === k ? C.cyan : C.dim }}>{label}</button>
                  ))}
                </div>
              </div>
              {/* FX-09b: max altitude — AUTO (10k ft) or user-fixed via data entry */}
              <div className="mt-1.5 mb-1 flex items-center justify-between">
                <span className="text-[9px]" style={{ color: C.text }}>Max altitude (ft)</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMaxAltFt(null)} className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                    style={{ borderColor: maxAltFt == null ? C.green : C.border, color: maxAltFt == null ? C.green : C.dim }}>AUTO</button>
                  <NumInField value={maxAltFt ?? 10000} onCommit={(v) => setMaxAltFt(v > 0 ? v : null)} lockable
                    className="w-14 rounded border bg-transparent px-1 py-0.5 text-[8px]" style={{ borderColor: C.border, color: C.text }} />
                </div>
              </div>
              {/* FX-10 (HI 1.3.2): voxel cell size — AUTO = screen-proportional reticle
                  (3×3 group = 1/9 of screen area, centred), default. Fixed sizes snap to
                  real metres. Edge width of the 3×3 group is shown live below. */}
              <div className="mt-1 mb-1 flex items-center justify-between gap-1">
                <span className="text-[9px]" style={{ color: C.text }}>3D Voxel·Cube cell</span>
                <div className="flex items-center gap-1">
                  <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                    {([[0, "AUTO"], [10, "10 m"], [100, "100 m"], [1000, "1 km"]] as const).map(([v, label]) => (
                      <button key={v} onClick={() => setVoxelCellM(v)} className="px-1.5 py-0.5"
                        style={{ background: voxelCellM === v ? "#152238" : "transparent", color: voxelCellM === v ? C.cyan : C.dim }}>{label}</button>
                    ))}
                  </div>
                  {/* FX-10 (HI 1.3.2): user-entered custom cell size (metres) */}
                  <NumInField value={voxelCellM} onCommit={(v) => setVoxelCellM(v >= 0 ? Math.round(v) : 0)}
                    className="w-12 rounded border bg-transparent px-1 py-0.5 text-[8px]" style={{ borderColor: C.border, color: C.text }} />
                  <span className="text-[8px]" style={{ color: C.dim }}>m</span>
                </div>
              </div>
              {(() => {
                // single edge of the 3×3 group + one voxel cell, real-world (primary pane).
                const cellM = voxelCellM && voxelCellM > 0 ? voxelCellM : Math.max(10, Math.round((viewA.spanKm * 1000) / 9));
                const edgeM = cellM * 3; // 3×3 group edge
                const km = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 2)} km` : `${Math.round(m)} m`);
                return (
                  <div className="mb-1 flex items-center justify-between text-[8px] font-mono" style={{ color: C.cyan }}>
                    <span style={{ color: C.dim }}>3×3 edge</span>
                    <span>{km(edgeM)} <span style={{ color: C.dim }}>· voxel {km(cellM)}{voxelCellM ? "" : " · 1/9 screen"}</span></span>
                  </div>
                );
              })()}
              {/* FX-52 (HI 1.3.3): grey VOXEL LIMIT control REMOVED from Settings — it lives on
                  the ALTITUDE BAR only (grey line there), adjustable in place. */}
              {/* FX-07 (HI 1.3.2): colour of the primary highlighted voxel (rest dim). */}
              <div className="mt-1 mb-1 flex items-center justify-between">
                <span className="text-[9px]" style={{ color: C.text }}>Highlight colour</span>
                <div className="flex items-center gap-1">
                  {([TRINITY_COLORS.evolution, TRINITY_COLORS.intelligence, TRINITY_COLORS.temporal, TRINITY_COLORS.ooda, TRINITY_COLORS.family] as const).map((cc) => (
                    <button key={cc} onClick={() => setVoxelHiColor(cc)} title={cc}
                      className="h-3.5 w-3.5 rounded-sm" style={{ background: cc, outline: voxelHiColor === cc ? `2px solid ${C.text}` : "none", outlineOffset: 1 }} />
                  ))}
                </div>
              </div>
              <div className="mt-1 text-[7px]" style={{ color: C.dim }}>Tilt to 3D on any pane (2D/3D toggle) — reuses the same fetched tile, zero extra network. Lattice cubes default to 3×3×3; grey line traces to the voxel limit.</div>
            </div>
          </div>
        )}
      </div>

      {/* WORKSPACE (OVERVIEW template) — LEFT rail (ASSET/SUPPORT) · CENTER big MAP · RIGHT rail (deployed items) */}
      <div ref={wsRef} className="flex flex-col gap-2 landscape:flex-row"
        style={fsPane ? { height: `calc(100dvh - ${wsTop + 10}px)`, minHeight: 480 } : { height: "min(82vh, 1080px)", minHeight: 480 }}>
        {/* LEFT RAIL — ASSET / SUPPORT, top→bottom, collapses to a 3-bullet rail */}
        {!mapMax && (railOpen ? (
          <div className="flex min-h-0 shrink-0 flex-col gap-2 landscape:w-64">
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border shadow-xl" style={{ background: C.panel, borderColor: C.border }}>
            <PlacementRail
              iconStyle={iconStyle}
              inventory={inventory} tab={tab} setTab={setTab}
              selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset}
              selectedSupport={selectedSupport} setSelectedSupport={setSelectedSupport}
              hoverAsset={hoverAsset} setHoverAsset={setHoverAsset}
              openGroups={openGroups} setOpenGroups={setOpenGroups}
              reality={reality} setReality={setReality}
              onUndoLastPlacement={undoLastPlacement} clearAo={clearAo}
              routeMode={routeMode} onHide={() => setRailOpen(false)} />
          </div>
          {/* TRACK controls live with the selected asset in the RIGHT rail (ItemInspector) */}
          </div>
        ) : (
          <button onClick={() => setRailOpen(true)} title="Show ASSET / SUPPORT menu"
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg border px-1.5 py-1 landscape:flex-col landscape:self-start landscape:py-2 portrait:w-full portrait:flex-row"
            style={{ background: C.panel, borderColor: C.border }}>
            <span className="flex flex-col items-center gap-[3px]">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: C.cyan }} />)}</span>
            <span className="text-[8px] font-semibold portrait:[writing-mode:horizontal-tb] landscape:[writing-mode:vertical-rl]" style={{ color: C.dim }}>ASSET · SUPPORT</span>
          </button>
        ))}

        {/* CENTER — big MAP + mini-map inset. Each pane is the SAME continuum: EARTH world
            view (WorldStrip · 3D globe / 2D flat) ⇄ tactical AO detail (AoMapPane). Zoom the
            AO all the way out → Earth; drill an AO on Earth → tactical detail. */}
        <div ref={centerRef} className="relative flex min-h-0 min-w-0 flex-1">
          {fsPane === "mini" ? (
            /* MINI in fullscreen — takes the whole area below the tab bar; MINIMIZE restores */
            modeB === "world" ? (
              <div className="h-full w-full overflow-hidden rounded-lg border shadow-xl" style={{ borderColor: C.border, background: C.panel }}>
                <WorldStrip label="MINI" aoKey={aoKey} onSelect={(k) => { setAoKey(k); }}
                  onEnterAo={(k) => enterAo(k, setModeB_)} onMinimize={() => setFsPane(null)} coordFmt={coordFmt} hiddenKeys={worldHidden} />
              </div>
            ) : (
              <AoMapPane {...paneCommon} dem={mirror ? dem : demB} label="MINI MAP" showElevation spanFactor={mirror ? 1 : OVERVIEW_FACTOR}
                view={viewB} setView={setViewB_} otherView={viewA} is3d={is3dB} onToggle3d={toggle3dB}
                mirrorOn={mirrorFrom === "mini"} onToggleMirror={() => toggleMirror("mini")}
                maximized onToggleMax={() => setFsPane(null)} onWorld={() => setModeB_("world")} />
            )
          ) : modeA === "world" ? (
            <div className="h-full w-full overflow-hidden rounded-lg border shadow-xl" style={{ borderColor: C.border, background: C.panel }}>
              <WorldStrip label="MAP" aoKey={aoKey} onSelect={(k) => { setAoKey(k); }}
                onEnterAo={(k) => enterAo(k, setModeA_)} onMinimize={fsPane === "map" ? () => setFsPane(null) : undefined} coordFmt={coordFmt} hiddenKeys={worldHidden} />
            </div>
          ) : (
            <AoMapPane {...paneCommon} dem={dem} label="MAP" showElevation spanFactor={1}
              view={viewA} setView={setViewA_} otherView={viewB} is3d={is3dA} onToggle3d={toggle3dA}
              mirrorOn={mirrorFrom === "map"} onToggleMirror={() => toggleMirror("map")}
              onOpenSettings={() => setShowSettings((s) => !s)} settingsOpen={showSettings}
              maximized={fsPane === "map"} onToggleMax={() => setFsPane((f) => (f === "map" ? null : "map"))} onWorld={() => setModeA_("world")} />
          )}
          {!fsPane && (miniOpen ? (
            <div className={miniPos ? "fixed z-30 flex flex-col overflow-hidden rounded-lg border-2 shadow-2xl" : "absolute z-20 flex flex-col overflow-hidden rounded-lg border-2 shadow-2xl"}
              style={{ ...(miniPos ? { left: miniPos.x, top: miniPos.y } : { bottom: 8, right: 8 }),
                width: miniSize ? miniSize.w : miniPos ? "min(44vw, 560px)" : "48%",
                height: miniSize ? miniSize.h : miniPos ? "min(38vh, 420px)" : "46%",
                minWidth: 220, minHeight: 170, borderColor: C.cyan, background: C.panel }}>
              {/* drag grip — move the mini anywhere over the big map; ⛶ = mini fullscreen, ▾ = minimize */}
              <div onPointerDown={onMiniGripDown} onPointerMove={onMiniGripMove} onPointerUp={onMiniGripUp} onPointerCancel={onMiniGripUp}
                className="flex shrink-0 cursor-move touch-none select-none items-center justify-between border-b px-2 py-0.5"
                style={{ background: "#0c1420", borderColor: C.cyan }}>
                {/* FX-07: drag dots CENTERED in the banner */}
                <span className="flex-1 text-center text-[8px] font-bold tracking-wider" style={{ color: C.dim }}>⠿ Drag Mini-Map</span>
                <div className="flex items-center gap-1">
                  {miniPos && (
                    <button onClick={() => setMiniPos(null)} onPointerDown={(e) => e.stopPropagation()} title="Dock back to bottom-right of the map"
                      className="rounded border px-1 text-[8px] font-bold" style={{ borderColor: C.border, color: C.dim }}>⌂</button>
                  )}
                  <button onClick={() => setFsPane("mini")} onPointerDown={(e) => e.stopPropagation()} title="Mini map fullscreen (below menu)"
                    className="rounded border p-0.5" style={{ borderColor: C.border, color: C.dim }}><Maximize2 className="h-2.5 w-2.5" /></button>
                  <button onClick={() => setMiniOpen(false)} onPointerDown={(e) => e.stopPropagation()} title="Minimize mini map"
                    className="rounded border px-1 text-[8px] font-bold" style={{ borderColor: C.border, color: C.dim }}>▾</button>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                {modeB === "world" ? (
                  <WorldStrip label="MINI" aoKey={aoKey} onSelect={(k) => { setAoKey(k); }}
                    onEnterAo={(k) => enterAo(k, setModeB_)} coordFmt={coordFmt} hiddenKeys={worldHidden} />
                ) : (
                  <AoMapPane {...paneCommon} dem={mirror ? dem : demB} label="MINI MAP" showElevation={false} spanFactor={mirror ? 1 : OVERVIEW_FACTOR}
                    view={viewB} setView={setViewB_} otherView={viewA} is3d={is3dB} onToggle3d={toggle3dB}
                    mirrorOn={mirrorFrom === "mini"} onToggleMirror={() => toggleMirror("mini")}
                    maximized={false} onToggleMax={() => setFsPane("mini")} onHidePane={() => setMiniOpen(false)} onWorld={() => setModeB_("world")} />
                )}
              </div>
              {/* RESIZE handles (R1) — traditional window: 4 edges + bottom-right corner */}
              <div onPointerDown={onMiniEdgeDown("l")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-ew-resize touch-none" />
              <div onPointerDown={onMiniEdgeDown("r")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                className="absolute inset-y-0 right-0 z-10 w-1.5 cursor-ew-resize touch-none" />
              <div onPointerDown={onMiniEdgeDown("t")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                className="absolute inset-x-0 top-0 z-10 h-1.5 cursor-ns-resize touch-none" />
              <div onPointerDown={onMiniEdgeDown("b")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                className="absolute inset-x-0 bottom-0 z-10 h-1.5 cursor-ns-resize touch-none" />
              <div onPointerDown={onMiniEdgeDown("br")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                title="Drag to resize" className="absolute bottom-0 right-0 z-20 flex h-4 w-4 cursor-nwse-resize touch-none items-end justify-end pb-0.5 pr-0.5"
                style={{ color: C.cyan }}>◢</div>
              {/* FX-07: the other three corners resize too */}
              <div onPointerDown={onMiniEdgeDown("bl")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                className="absolute bottom-0 left-0 z-20 h-4 w-4 cursor-nesw-resize touch-none" />
              <div onPointerDown={onMiniEdgeDown("tr")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                className="absolute right-0 top-0 z-20 h-4 w-4 cursor-nesw-resize touch-none" />
              <div onPointerDown={onMiniEdgeDown("tl")} onPointerMove={onMiniEdgeMove} onPointerUp={onMiniEdgeUp} onPointerCancel={onMiniEdgeUp}
                className="absolute left-0 top-0 z-20 h-4 w-4 cursor-nwse-resize touch-none" />
            </div>
          ) : (
            <button onClick={() => setMiniOpen(true)} title="Show mini-map"
              className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-semibold shadow-lg"
              style={{ borderColor: C.border, color: C.dim, background: "#0a0f16dd" }}>
              ▾ MINI MAP
            </button>
          ))}
        </div>

        {/* RIGHT RAIL — deployed ASSET / SUPPORT list, collapses to a 3-bullet rail */}
        {!mapMax && (rightOpen ? (
          <div className="min-h-0 shrink-0 overflow-hidden rounded-lg border shadow-xl landscape:w-64" style={{ background: C.panel, borderColor: C.border }}>
            <ActiveItems placed={placed} placedSupport={placedSupport} fmt={fmt}
              selected={selected} setSelected={setSelected} hoverAsset={hoverAsset} setHoverAsset={setHoverAsset}
              onHide={() => setRightOpen(false)} onDelete={deleteItem}
              inspector={<ItemInspector selected={selected} selectedObj={selectedObj} fmt={fmt} coordFmt={coordFmt} digits={digits}
                nudgeM={nudgeM} setNudgeM={setNudgeM} coordText={coordText} setCoordText={setCoordText}
                onSetAff={setAff} onSetPlacedReality={setPlacedReality} onUpdAsset={updAsset} onSetTL={setTL}
                onNudge={nudge} onSetCoord={setCoord} onRemoveSelected={removeSelected}
                terrainAtSel={selectedObj ? inspSampler(selectedObj.lat, selectedObj.lon) : undefined}
                reality={reality} planStatus={planStatus} />}
              planStatus={planStatus} onSubmit={() => setPlanStatus("pending")} onApprove={() => setPlanStatus("approved")}
              onChanges={() => setPlanStatus("changes")} onShare={sharePlan} shareMsg={shareMsg} />
          </div>
        ) : (
          <button onClick={() => setRightOpen(true)} title="Show deployed-asset list"
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg border px-1.5 py-1 landscape:flex-col landscape:self-start landscape:py-2 portrait:w-full portrait:flex-row"
            style={{ background: C.panel, borderColor: C.border }}>
            <span className="flex flex-col items-center gap-[3px]">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: C.cyan }} />)}</span>
            <span className="text-[8px] font-semibold portrait:[writing-mode:horizontal-tb] landscape:[writing-mode:vertical-rl]" style={{ color: C.dim }}>ACTIVE ITEMS</span>
          </button>
        ))}
      </div>

      {/* BOTTOM — full-width ELEVATION PROFILE / TRANSECT (plan mode; reuses the 1-fetch DEM tile) */}
      {modeA === "ao" && !mapMax && (showTransect ? (
        <div className="mt-2 overflow-hidden rounded-lg border shadow-xl" style={{ background: C.panel, borderColor: C.border }}>
          <TransectPanel view={viewA} dem={dem} placed={placed} onHide={() => setShowTransect(false)} />
        </div>
      ) : (
        <button onClick={() => setShowTransect(true)} title="Show elevation profile / transect"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-2 py-1 text-[8px] font-semibold"
          style={{ background: C.panel, borderColor: C.border, color: C.dim }}>
          ▴ ELEVATION PROFILE · TRANSECT
        </button>
      ))}
    </div>
  );
}
