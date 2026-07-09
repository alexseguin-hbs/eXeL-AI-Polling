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
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Grid3x3, MapPin, Trash2, ChevronRight, Settings, RotateCcw, Maximize2, Minimize2, Columns2, Eye } from "lucide-react";
import {
  AssetIcon, ASSET_LABELS, type AssetKind, type IconStyle, type Affiliation,
} from "@/components/security-2525/asset-icons";
import { latLonToMgrs, utmKmGrid, chooseGridStep, mgrsToLatLon, dmsToLatLon } from "@/components/security-2525/mgrs";
import {
  SUPPORT_CATALOG, GROUP_META, REALITY_MODES,
  type SupportObjectDef, type MarkerGlyph, type LegendGroup, type RealityMode,
} from "@/components/security-2525/mission-support";
import { PfieldVenue } from "@/components/security-2525/pfield-venue";
import { RCORE_LANES } from "@/components/security-2525/rcore";
import { MIN_SPAN_KM, MAX_SPAN_KM, ZOOM_FACTOR, shouldHandOffToWorld } from "@/lib/zoom-continuum";
import { terrainMSL, computeContours, makeDemSampler, type ContourOpts, type Dem } from "@/lib/contours";
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
  altitude?: number; // m AGL/MSL
  moving?: boolean;  // movement activated (track is live in the plan/sim)
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
const AD_HALF: Partial<Record<AssetKind, number>> = { avenger: 45, patriot: 60, thaad: 90 };

// Published engagement / detection ranges (km, approximate open-source figures) —
// a weapons-planning coverage aid, NOT a targeting authority. Sources: manufacturer
// & defense-press public data (Stinger ~8 km; PAC-3/MSE ~35 km; THAAD ~200 km;
// AN/MPQ-64 Sentinel detection ~75 km). X-BAT/AUTO-FOIL are program-nominal.
const ASSET_RANGE_KM: Partial<Record<AssetKind, number>> = {
  avenger: 8, patriot: 35, thaad: 200, sentinel: 75, xbat: 15, autofoil: 10,
};

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
function GlobeView({ data, center, activeKey, onSelect, onDrill, onEnterAo }: {
  data: BorderData | null; center: [number, number]; activeKey: string;
  onSelect: (k: string) => void; onDrill: (lat: number, lon: number) => void; onEnterAo?: (k: string) => void;
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
        <path d={graticule} fill="none" stroke={C.cyan} strokeWidth={0.35 / zoom} opacity="0.55" />
        {borders && (
          <>
            <path d={borders.countries} fill="none" stroke={C.borderCountry} strokeWidth={0.5 / zoom} opacity="0.75" />
            <path d={borders.states} fill="none" stroke={C.borderState} strokeWidth={0.4 / zoom} opacity="0.65" />
          </>
        )}
        {AOS.map((ao) => {
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
      </g>
    </svg>
  );
}

function WorldStrip({ aoKey, onSelect, onEnterAo, label }: { aoKey: string; onSelect: (k: string) => void; onEnterAo?: (k: string) => void; label?: string }) {
  const [data, setData] = useState<BorderData | null>(borderCache);
  const [mode, setMode] = useState<"globe" | "flat">("globe");
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
  useWheel(flatSvg, (e) => {
    e.preventDefault();
    const k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    if (flat.w * k >= W * 0.98 && e.deltaY > 0) { setMode("globe"); return; }
    const nw = Math.min(W, Math.max(0.02, flat.w * k));
    // zooming IN tight over an AO → hand off to the tactical AO map.
    // NB: call onEnterAo OUTSIDE setFlat — a parent setState inside a state updater crashes React.
    if (e.deltaY < 0 && onEnterAo && nw < W * 0.03) {
      const mx = flat.x + flat.w / 2, my = flat.y + flat.h / 2;
      const clat = 90 - (my / H) * 180, clon = (mx / W) * 360 - 180;
      let best = "", bd = Infinity;
      for (const a of AOS) { const d = Math.hypot(a.center[0] - clat, a.center[1] - clon); if (d < bd) { bd = d; best = a.key; } }
      if (best && bd < 1.2) { onEnterAo(best); return; }
    }
    setFlat((f) => {
      const w = Math.min(W, Math.max(0.02, f.w * k)), h = w * (f.h / f.w);
      const mx = f.x + f.w / 2, my = f.y + f.h / 2;
      return { w, h, x: mx - w / 2, y: my - h / 2 };
    });
  });
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
      {mode === "globe" ? (
        <GlobeView data={data} center={center} activeKey={aoKey} onSelect={onSelect} onDrill={drillToFlat} onEnterAo={onEnterAo} />
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
            // horizontal wraps around the globe (modulo world width); vertical clamps at the poles
            setFlat((f) => ({ ...f, x: (((f.x - dx) % W) + W) % W, y: Math.max(0, Math.min(H - f.h, f.y - dy)) }));
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
              {AOS.map((ao) => {
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
            <span className="pointer-events-none absolute left-2 top-2 z-10 font-mono text-[9px] font-bold" style={{ color: C.red }}>N ↑</span>
            <span className="pointer-events-none absolute right-2 top-2 z-10 font-mono text-[9px] font-semibold" style={{ color: C.cyan }}>
              {geoContext(clat, clon, kmW).join(" · ")}
            </span>
            <span className="pointer-events-none absolute bottom-1 left-2 z-10 font-mono text-[8px]" style={{ color: C.gold }}>
              {latLonToMgrs(clat, clon, 4)} · {kmW >= 1 ? `${kmW.toFixed(kmW >= 10 ? 0 : 1)} km` : `${Math.round(kmW * 1000)} m`} wide
            </span>
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
            <button key={m} onClick={() => (m === "flat" ? drillToFlat(center[0], center[1]) : (setCenter([90 - ((flat.y + flat.h / 2) / H) * 180, ((((((flat.x + flat.w / 2) / W) * 360 - 180) + 180) % 360) + 360) % 360 - 180]), setMode("globe")))} className="px-2 py-0.5"
              style={{ background: mode === m ? "#152238" : "transparent", color: mode === m ? C.cyan : C.dim }}>
              {m === "globe" ? "3D" : "2D"}
            </button>
          ))}
        </div>
      </div>
      <span className="absolute bottom-1 right-2 z-10 text-[8px]" style={{ color: C.dim }}>
        NATURAL EARTH 50m · SCROLL=ZOOM · 3D-GLOBE ⇄ 2D-FLAT · DRILL → AO
      </span>
    </div>
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
// Contour thickness presets (px in the 0–100 viewBox); colours come from the shared
// Trinity SpectrumPicker so Land, Bathymetry and /main all draw from one palette source.
const CONTOUR_THICKNESS = [0.1, 0.25, 0.5] as const;
const DEFAULT_CONTOURS: ContourSettings = {
  enable: false, count: 6, interval: 0, fidelity: "med", seaLevel: 0,
  showLand: true, showBathy: true, units: "metric", labelMajor: true, vExag: 1,
  landColor: TRINITY_COLORS.intelligence, bathyColor: TRINITY_COLORS.consciousness, thickness: 0.25, bathyThickness: 0.16,
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
function makeFormatters(coordFmt: "mgrs" | "dms", digits: Digits, unit: Unit): Fmt {
  const mgrsAt = (lat: number, lon: number, d: Digits = digits) => latLonToMgrs(lat, lon, d);
  const dms1 = (v: number, pos: string, neg: string) => {
    const h = v >= 0 ? pos : neg, a = Math.abs(v);
    const d = Math.floor(a), m = Math.floor((a - d) * 60);
    const s = ((a - d) * 60 - m) * 60;
    const dec = digits >= 6 ? 3 : digits === 5 ? 2 : 1;
    return `${d}°${String(m).padStart(2, "0")}'${s.toFixed(dec).padStart(dec + 3, "0")}"${h}`;
  };
  const coordAt = (lat: number, lon: number) =>
    coordFmt === "dms" ? `${dms1(lat, "N", "S")} ${dms1(lon, "E", "W")}` : mgrsAt(lat, lon);
  const metric = unit === "km" || unit === "m";
  const fmtDist = (m: number) =>
    unit === "km" ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 2)} km`
      : unit === "m" ? `${Math.round(m)} m`
      : unit === "mi" ? `${(m / 1609.34).toFixed(m >= 16093 ? 1 : 2)} mi`
      : `${Math.round(m * 3.28084)} ft`;
  const fmtElev = (m: number) => (metric ? `${Math.round(m)} m` : `${Math.round(m * 3.28084)} ft`);
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
  // shared placement state (read on the map surface)
  inventory: InvItem[];
  placed: Placed[];
  placedSupport: PlacedSupport[];
  selected: { kind: "asset" | "support"; id: number } | null;
  selectedAsset: AssetKind | null;
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
  // AO / AOR draw tool
  drawingAo: boolean;
  aoDraft: [number, number][];
  onAoVertex: (lat: number, lon: number) => void;
  drawnAo?: { poly: [number, number][]; aorKm: number };
}

function AoMapPane(p: PaneProps) {
  const {
    label, ao, iconStyle, fmt, digits, gridOn, elevOn, contourCfg, rangeOn, roadsOn, waterOn, terrainOn, showElevation, cursorMode, is3d, onToggle3d,
    spanFactor, view, setView, otherView, osm, borders, dem, inventory, placed, placedSupport, selected, hoverAsset,
    selectedAsset, selectedSupport, reality, setInventory, setPlaced, setPlacedSupport, setSelected,
    setHoverAsset, allocId, maximized, onToggleMax, onHidePane, onWorld,
    drawingAo, aoDraft, onAoVertex, drawnAo,
  } = p;

  const clipId = "land" + useId().replace(/[^a-zA-Z0-9]/g, ""); // per-pane land clip (roads must not render in water)
  const [cursorLL, setCursorLL] = useState<{ lat: number; lon: number } | null>(null);
  const [cursorPx, setCursorPx] = useState<{ x: number; y: number } | null>(null);
  const [routeDraft, setRouteDraft] = useState<{ lat: number; lon: number }[]>([]);
  const [elevReveal, setElevReveal] = useState<"high" | "low" | null>(null); // HIGH/LOW coord reveal
  const [showDecode, setShowDecode] = useState(false); // MGRS/DMS mini-lesson popover
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; moved: boolean; btn: number } | null>(null);
  const bearingMemo = useRef<number | null>(null);
  const touchRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; cx: number; cy: number; ang: number } | null>(null);

  const RENDER = 1.5;
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
    () => utmKmGrid(box.latMin, box.latMax, box.lonMin, box.lonMax, chooseGridStep(view.spanKm * 1000)),
    [box, view.spanKm]
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
  const project = (lat: number, lon: number) => {
    const f = toFrac(lat, lon);
    const px = f.fx * RENDER - OFF, py = f.fy * RENDER - OFF;
    const [s, c] = rotC(view.bearing);
    const [fx, fy] = rotAround(px, py, s, c);
    return { fx, fy };
  };
  const containerToLatLon = (cfx: number, cfy: number) => {
    const [s, c] = rotC(view.bearing, true);
    const [px, py] = rotAround(cfx, cfy, s, c);
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
    setView((v) => ({ ...v, spanKm: Math.min(MAX_SPAN_KM, Math.max(MIN_SPAN_KM, v.spanKm * (e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))) }));
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
    setPlaced((pl) => [...pl, {
      id: allocId(), asset, count: item.group, fx, fy, lat, lon, mgrs10: latLonToMgrs(lat, lon, 5), aff: "friendly", tls, fov, unit: angUnit,
    }]);
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
    if (e.pointerType === "touch") {
      touchRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
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
        pinchRef.current.dist = dist; pinchRef.current.ang = ang;
        setView((v) => ({ ...v, spanKm: Math.min(MAX_SPAN_KM, Math.max(MIN_SPAN_KM, v.spanKm * factor)), bearing: v.bearing + dAng }));
      } else if (touchRef.current.size === 1 && r) {
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
      setView((v) => ({ ...v, bearing: v.bearing - (dx / r.width) * Math.PI }));
    } else {
      panBy(dx / r.width, dy / r.height);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      touchRef.current.delete(e.pointerId);
      if (touchRef.current.size < 2) pinchRef.current = null;
      return;
    }
    const d = dragRef.current;
    dragRef.current = null;
    if (d?.moved) return;
    const f = fracFromEvent(e);
    if (!f) return;
    // In 3D the surface is perspective-tilted, so click→coordinate is not exact:
    // 3D is a visualization mode; deselect only, place in 2D.
    if (is3d) { if (selected) setSelected(null); return; }
    const { lat, lon } = containerToLatLon(f.fx, f.fy);
    if (drawingAo) { onAoVertex(lat, lon); return; } // AO draw mode → append vertex
    if (routeMode && selectedSupport) {
      if (e.button === 2) {
        setRouteDraft((pr) => [...pr, { lat, lon }]);
      } else {
        const pts = [...routeDraft, { lat, lon }];
        if (pts.length >= 2) commitRoute(selectedSupport, pts);
        setRouteDraft([]);
      }
      return;
    }
    if (selectedAsset) place(selectedAsset, f.fx, f.fy);
    else if (selectedSupport) placeSupport(selectedSupport, f.fx, f.fy);
    else if (selected) setSelected(null);
  };

  // Reset the draft when the AO changes.
  useEffect(() => { setRouteDraft([]); }, [ao.key]);
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
  // Topographic contours (memoized on box + settings + DEM; real elevation + ocean floor).
  const contourSet = useMemo(
    () => (contourCfg.enable ? computeContours(box, contourCfg, sampler) : null),
    [box, contourCfg, sampler]
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
      <div className="flex items-center justify-between gap-2 border-b px-2 py-1" style={{ borderColor: C.border }}>
        <span className="truncate text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          {label} · {ao.name.split(" · ")[0]} <span style={{ color: C.dim }}>· {fmt.fmtDist(view.spanKm * 1000)}</span>
        </span>
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: C.dim }}>
          {/* 2D (top-down) ⇄ 3D (perspective terrain) — on every map, same format */}
          <div className="flex overflow-hidden rounded border font-semibold" style={{ borderColor: C.border }}>
            {([[false, "2D"], [true, "3D"]] as const).map(([v, lb]) => (
              <button key={lb} onClick={() => { if (is3d !== v) onToggle3d(); }} className="px-1.5 py-0.5"
                style={{ background: is3d === v ? "#152238" : "transparent", color: is3d === v ? C.cyan : C.dim }}>{lb}</button>
            ))}
          </div>
          {onWorld && (
            <button onClick={onWorld} title="Zoom out to Earth / world view" className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: C.gold, color: C.gold }}>🌍 EARTH</button>
          )}
          <button onClick={resetView} className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: C.border }}>RESET</button>
          <button onClick={onToggleMax} title={maximized ? "Restore" : "Maximize"} className="rounded border p-0.5" style={{ borderColor: maximized ? C.cyan : C.border, color: maximized ? C.cyan : C.dim }}>
            {maximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
          {onHidePane && <Dots3 horizontal onClick={onHidePane} title="Hide this window" />}
        </div>
      </div>
      {/* R-CORE lane strip */}
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-0.5" style={{ borderColor: C.border }}>
        <span className="text-[7px] font-bold tracking-wider" style={{ color: C.dim }}>R-CORE</span>
        {RCORE_LANES.map((l) => (
          <span key={l.key} title={l.def} className="rounded px-1 text-[7px] font-bold" style={{ color: l.color, background: `${l.color}18` }}>{l.label}</span>
        ))}
      </div>

      {/* pane body: the map surface (+ elevation). The ASSET/SUPPORT menu now lives
          in the shared left rail, outside the map, so it serves MAP and MINI MAP alike. */}
      <div className="relative flex min-h-0 flex-1 flex-col p-2">
        <div className="flex min-h-0 flex-1 gap-1">
          <div ref={mapRef}
            className="relative h-full w-full overflow-hidden rounded-md touch-none"
            style={{ background: "radial-gradient(ellipse at 50% 55%, #0f2033 0%, #070b12 75%)", border: `1px solid ${C.border}`, cursor: cursorMode === "target" ? "none" : armed ? "crosshair" : dragRef.current ? "grabbing" : "grab" }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = fracFromEvent(e); if (f) dropAt(e.dataTransfer.getData("text/plain"), f.fx, f.fy); }}
            onMouseLeave={() => { setCursorLL(null); setCursorPx(null); }}>
            {/* 3D tilt — the whole world layer (ground + markers) tilts as one plane;
                HUD (compass/readouts/scale) stays screen-flat, placement uses 2D */}
            <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 60%", transform: is3d ? "perspective(780px) rotateX(55deg) scale(1.2)" : undefined, transition: "transform 220ms ease" }}>
            {/* rotated inner canvas (RENDER× size) */}
            <div className="pointer-events-none absolute" style={{ inset: `${-OFF * 100}%`, transform: `rotate(${view.bearing}rad)`, transformOrigin: "center" }}>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* LAND / OCEAN base — blue ocean fill; land = green (filled Natural Earth
                    country polygons, which include the enclosing landmass even at tight zoom). */}
                {terrainOn && borderPaths && (
                  <g>
                    <rect x="-60" y="-60" width="220" height="220" fill="#0a2f52" />
                    <path d={borderPaths.countries} fill="#123d1f" fillRule="evenodd" />
                  </g>
                )}
                {/* land clip — so ROADS never render over the water shown by the base */}
                {borderPaths && <defs><clipPath id={clipId}><path d={borderPaths.countries} fillRule="evenodd" /></clipPath></defs>}
                {/* national + state boundaries (= continent/country/state lines), drawn under the OSM detail */}
                {borderPaths && (
                  <g>
                    <path d={borderPaths.countries} fill="none" stroke={C.borderCountry} strokeWidth="0.4" opacity="0.55" strokeLinejoin="round" />
                    <path d={borderPaths.states} fill="none" stroke={C.borderState} strokeWidth="0.3" opacity="0.45" strokeLinejoin="round" />
                  </g>
                )}
                {/* WATER — lakes/wide rivers as solid blue polygons; rivers/streams as full-width blue lines */}
                {osmPaths && waterOn && (
                  <g>
                    <path d={osmPaths.polyD} fill="#1e6fd955" stroke="#38bdf8" strokeWidth="0.2" />
                    <path d={osmPaths.waterD} fill="none" stroke="#2f8fe0" strokeWidth={Math.min(5, Math.max(0.5, (65 / (view.spanKm * 1000)) * 100))} opacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={osmPaths.waterD} fill="none" stroke="#7dd3fc" strokeWidth={Math.min(1.4, Math.max(0.12, (14 / (view.spanKm * 1000)) * 100))} opacity="0.85" strokeLinecap="round" />
                  </g>
                )}
                {/* ROADS — grey tier hierarchy, clipped to land so none render in water */}
                {osmPaths && roadsOn && (
                  <g clipPath={terrainOn && borderPaths && borderPaths.countries ? `url(#${clipId})` : undefined}>
                    <path d={osmPaths.tiers[2]} fill="none" stroke="#cbd5e1" strokeWidth="0.55" opacity="0.16" strokeLinecap="round" />
                    <path d={osmPaths.tiers[3]} fill="none" stroke="#cbd5e1" strokeWidth="1.0" opacity="0.2" strokeLinecap="round" />
                    <path d={osmPaths.tiers[4]} fill="none" stroke="#cbd5e1" strokeWidth="1.6" opacity="0.22" strokeLinecap="round" />
                    <path d={osmPaths.tiers[2]} fill="none" stroke="#94a3b8" strokeWidth="0.22" opacity="0.5" strokeLinecap="round" />
                    <path d={osmPaths.tiers[3]} fill="none" stroke="#b6c2d1" strokeWidth="0.5" opacity="0.7" strokeLinecap="round" />
                    <path d={osmPaths.tiers[4]} fill="none" stroke="#e5e7eb" strokeWidth="0.85" opacity="0.8" strokeLinecap="round" />
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
                          <path d={l.d} fill="none" stroke={col} strokeWidth={l.major ? th * 2.2 : th} strokeDasharray={l.land ? undefined : "1 0.7"} opacity={l.major ? 0.9 : 0.5} strokeLinecap="round" />
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

                {/* weapon-range coverage rings (public-source ranges) — planning aid */}
                {rangeOn && placed.map((u) => {
                  const rk = ASSET_RANGE_KM[u.asset];
                  if (!rk) return null;
                  const c = toFrac(u.lat, u.lon);
                  const rr = (rk / (view.spanKm * RENDER)) * 100;
                  if (rr < 0.4 || rr > 400) return null;
                  const col = u.aff === "hostile" ? C.red : C.cyan;
                  return <circle key={`rng${u.id}`} cx={c.fx * 100} cy={c.fy * 100} r={rr} fill={`${col}0a`} stroke={col} strokeWidth="0.18" strokeDasharray="1.2 0.8" opacity="0.5" />;
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
                  return (
                    <g key={`trk${u.id}`}>
                      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={col} strokeWidth="0.4" opacity="0.9" />
                      <line x1={ex} y1={ey} x2={ex + 2 * Math.sin(a1)} y2={ey - 2 * Math.cos(a1)} stroke={col} strokeWidth="0.4" />
                      <line x1={ex} y1={ey} x2={ex + 2 * Math.sin(a2)} y2={ey - 2 * Math.cos(a2)} stroke={col} strokeWidth="0.4" />
                    </g>
                  );
                })}

                {placed.map((u) => {
                  if (!u.tls && !u.fov) return null;
                  const c = toFrac(u.lat, u.lon); const cx = c.fx * 100, cy = c.fy * 100;
                  const drawLine = (R: number, brg: number, col: string) =>
                    <line x1={cx} y1={cy} x2={cx + R * Math.sin((brg * Math.PI) / 180)} y2={cy - R * Math.cos((brg * Math.PI) / 180)} stroke={col} strokeWidth="0.45" />;
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
              if (f.fx < -0.05 || f.fx > 1.05 || f.fy < -0.05 || f.fy > 1.05) return null;
              const sel = selected?.kind === "asset" && selected.id === u.id;
              const hot = hoverAsset === u.asset;
              return (
                <button key={u.id}
                  onPointerUp={(e) => { if (!dragRef.current?.moved) { e.stopPropagation(); setSelected({ kind: "asset", id: u.id }); } }}
                  onMouseEnter={() => setHoverAsset(u.asset)}
                  onMouseLeave={() => setHoverAsset((h) => (h === u.asset ? null : h))}
                  title={`${ASSET_LABELS[u.asset]} — ${fmt.coordAt(u.lat, u.lon)}`}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%`, zIndex: hot ? 15 : undefined }}>
                  {/* pulse + selection ring anchored to the ICON centre, not the icon+label stack */}
                  <span className="relative flex items-center justify-center">
                    {hot && <span className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full" style={{ boxShadow: `0 0 0 2px ${C.cyan}`, background: `${C.cyan}22` }} />}
                    {sel && <span className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.gold}` }} />}
                    <AssetIcon asset={u.asset} style={iconStyle} affiliation={u.aff} size={28} count={u.count} />
                  </span>
                  <span className="whitespace-nowrap font-mono text-[8px]" style={{ color: C.text }}>{fmt.mgrsAt(u.lat, u.lon).split(" ").slice(2).join(" ")}</span>
                  {u.moving && (
                    <span className="whitespace-nowrap font-mono text-[7px] font-bold" style={{ color: C.green }}>
                      {u.heading != null ? `${String(Math.round(u.heading)).padStart(3, "0")}°` : ""}{u.speed ? ` ${Math.round(u.speed)}km/h` : ""}{u.altitude ? ` ${Math.round(u.altitude)}m` : ""}
                    </span>
                  )}
                </button>
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
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%` }}>
                  {sel && <span className="absolute h-7 w-7 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.gold}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                  <SupportGlyph glyph={u.def.glyph} color={u.aff === "hostile" ? "#ef4444" : u.def.color} size={22} />
                  <span className="whitespace-nowrap font-mono text-[8px]" style={{ color: C.text }}>{fmt.mgrsAt(u.lat, u.lon).split(" ").slice(2).join(" ")}</span>
                </button>
              );
            })}
            </div>
            {/* end 3D tilt layer */}
            {is3d && (
              <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded px-1.5 py-0.5 text-[8px] font-bold" style={{ background: "#0a0f16cc", color: C.amber }}>
                3D · VIEW — switch to 2D to place
              </div>
            )}

            {/* the OTHER pane's viewport — a small "you are here" box. ONLY drawn when the
                other view is meaningfully TIGHTER than this one (a subset), so a wider view
                never paints a giant rectangle over the whole map (that caused the cyan fill). */}
            {otherView && otherView.spanKm < view.spanKm * 0.85 && (() => {
              const oh = otherView.spanKm / 2;
              const odLat = oh / 110.574, odLon = oh / (111.32 * Math.cos((otherView.lat * Math.PI) / 180));
              const corners: [number, number][] = [
                [otherView.lat + odLat, otherView.lon - odLon], [otherView.lat + odLat, otherView.lon + odLon],
                [otherView.lat - odLat, otherView.lon + odLon], [otherView.lat - odLat, otherView.lon - odLon],
              ];
              const pts = corners.map(([la, lo]) => project(la, lo));
              if (pts.some((p) => !Number.isFinite(p.fx) || !Number.isFinite(p.fy))) return null; // no NaN fill
              if (!pts.some((p) => p.fx > -0.2 && p.fx < 1.2 && p.fy > -0.2 && p.fy < 1.2)) return null;
              return (
                <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points={pts.map((p) => `${(p.fx * 100).toFixed(2)},${(p.fy * 100).toFixed(2)}`).join(" ")}
                    fill="none" stroke={C.cyan} strokeWidth="0.4" strokeDasharray="1.5 1" />
                </svg>
              );
            })()}

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
              {cursorLL ? fmt.coordAt(cursorLL.lat, cursorLL.lon) : fmt.coordAt(view.lat, view.lon)} <span style={{ color: C.dim }}>ⓘ</span>
            </button>
            {showDecode && (() => {
              const p = cursorLL ?? { lat: view.lat, lon: view.lon };
              const mp = latLonToMgrs(p.lat, p.lon, digits).split(" "); // [zoneBand, square, E, N]
              const dms = (v: number, pos: string, neg: string) => { const h = v >= 0 ? pos : neg, a = Math.abs(v); const d = Math.floor(a), m = Math.floor((a - d) * 60), s = (((a - d) * 60 - m) * 60).toFixed(1); return `${d}°${String(m).padStart(2, "0")}'${s}"${h}`; };
              const row = (k: string, val: string, c: string) => <div className="flex justify-between gap-2"><span style={{ color: C.dim }}>{k}</span><span className="font-mono" style={{ color: c }}>{val}</span></div>;
              return (
                <div className="absolute right-2 top-8 z-30 w-52 rounded-lg border p-2 text-[8px] shadow-2xl" style={{ background: C.panel, borderColor: C.cyan }}>
                  <div className="mb-1 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Coordinate decode</span><button onClick={() => setShowDecode(false)} style={{ color: C.dim }}>✕</button></div>
                  <div className="mb-1 font-semibold" style={{ color: C.gold }}>MGRS · {latLonToMgrs(p.lat, p.lon, digits)}</div>
                  {row("Zone · lat-band", mp[0], C.text)}
                  {row("100 km square", mp[1], C.text)}
                  {row("Easting (→E)", `${mp[2]} · ${(digits === 4 ? 10 : digits === 5 ? 1 : 0.1)} m`, C.text)}
                  {row("Northing (↑N)", `${mp[3]} · ${(digits === 4 ? 10 : digits === 5 ? 1 : 0.1)} m`, C.text)}
                  <div className="mb-1 mt-1.5 font-semibold" style={{ color: "#a78bfa" }}>LLV-DMS</div>
                  {row("Latitude", dms(p.lat, "N", "S"), C.text)}
                  {row("Longitude", dms(p.lon, "E", "W"), C.text)}
                  {row("Decimal °", `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`, C.dim)}
                  <div className="mt-1 text-[7px]" style={{ color: C.dim }}>MGRS: 6°-wide zone · 8°-lat band · 100 km square · E/N within it. DMS: degrees·minutes·seconds.</div>
                </div>
              );
            })()}

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2" style={{ borderLeft: `1px solid ${C.dim}`, borderTop: `1px solid ${C.dim}`, opacity: 0.5 }} />
            {/* 360° bearing scale */}
            {(() => {
              const topHeading = ((-view.bearing * 180 / Math.PI) % 360 + 360) % 360;
              const marks: React.ReactNode[] = [];
              for (let deg = 0; deg < 360; deg += 10) {
                const th = (deg - topHeading) * Math.PI / 180;
                const dx = Math.sin(th), dy = -Math.cos(th);
                const t = Math.min(0.5 / Math.max(Math.abs(dx), 1e-9), 0.5 / Math.max(Math.abs(dy), 1e-9));
                const bx = 0.5 + dx * t, by = 0.5 + dy * t;
                const major = deg % 30 === 0;
                if (major) {
                  const lx = 0.5 + (bx - 0.5) * 0.9, ly = 0.5 + (by - 0.5) * 0.9;
                  marks.push(
                    <span key={deg} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[7px] font-bold"
                      style={{ left: `${lx * 100}%`, top: `${ly * 100}%`, color: deg === 0 ? C.red : C.cyan, opacity: 0.8 }}>
                      {String(deg).padStart(3, "0")}
                    </span>
                  );
                } else {
                  marks.push(<span key={deg} className="pointer-events-none absolute h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${bx * 100}%`, top: `${by * 100}%`, background: C.cyan, opacity: 0.5 }} />);
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
                <div key={i.asset}
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
  fmt: Fmt; coordFmt: "mgrs" | "dms"; digits: Digits;
  nudgeM: number; setNudgeM: (m: number) => void;
  coordText: string; setCoordText: (s: string) => void;
  onSetAff: (sel: { kind: "asset" | "support"; id: number }, aff: Affiliation) => void;
  onSetPlacedReality: (id: number, r: RealityMode) => void;
  onUpdAsset: (id: number, patch: Partial<Placed>) => void;
  onSetTL: (id: number, key: "p" | "s" | "t", tl: TL | null) => void;
  onNudge: (sel: { kind: "asset" | "support"; id: number }, dLat: number, dLon: number) => void;
  onSetCoord: (sel: { kind: "asset" | "support"; id: number }, lat: number, lon: number) => void;
  onRemoveSelected: () => void;
}
function ItemInspector(p: InspectorProps) {
  const { selected, selectedObj, fmt, coordFmt, digits, nudgeM, setNudgeM, coordText, setCoordText,
    onSetAff, onSetPlacedReality, onUpdAsset, onSetTL, onNudge, onSetCoord, onRemoveSelected } = p;
  if (!selectedObj || !selected) return null;
  return (
          <div className="shrink-0 overflow-y-auto border-t p-2" style={{ borderColor: C.border, maxHeight: "50%" }}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: C.cyan }}>
                {selected.kind === "asset" ? ASSET_LABELS[(selectedObj as Placed).asset] : (selectedObj as PlacedSupport).def.term}
              </span>
              <button onClick={onRemoveSelected} className="text-[9px] font-semibold" style={{ color: C.red }}>REMOVE</button>
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
                <input type="number" value={Math.round(toUnit(val, u))} onChange={(e) => on(fromUnit(parseFloat(e.target.value || "0"), u))}
                  className="w-full rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }} />
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
            <div className="grid grid-cols-3 gap-1">
              <span />
              <button onClick={() => onNudge(selected, nudgeM / 111320, 0)} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>▲ N</button>
              <span />
              <button onClick={() => onNudge(selected, 0, -nudgeM / (111320 * Math.cos((selectedObj.lat * Math.PI) / 180)))} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>◀ W</button>
              <button onClick={() => onNudge(selected, -nudgeM / 111320, 0)} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>▼ S</button>
              <button onClick={() => onNudge(selected, 0, nudgeM / (111320 * Math.cos((selectedObj.lat * Math.PI) / 180)))} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>E ▶</button>
            </div>
            <div className="mb-1 mt-2 text-[9px]" style={{ color: C.dim }}>Set exact coordinate ({coordFmt === "mgrs" ? "MGRS" : "LLV-DMS"})</div>
            <div className="flex items-center gap-1">
              <input value={coordText} onChange={(e) => setCoordText(e.target.value)}
                placeholder={coordFmt === "mgrs" ? "14R PU 2111 4983" : "30°16'27\"N 97°44'27\"W"}
                className="w-full rounded border bg-transparent px-1 py-0.5 font-mono text-[9px]" style={{ borderColor: C.border, color: C.text }} />
              <button onClick={() => {
                  const t = coordText.trim();
                  let r = coordFmt === "mgrs" ? mgrsToLatLon(t, selectedObj.lat) : dmsToLatLon(t);
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
  inspector?: React.ReactNode;
  planStatus: "draft" | "pending" | "approved" | "changes";
  onSubmit: () => void; onApprove: () => void; onChanges: () => void; onShare: () => void; shareMsg: string;
}
function ActiveItems({ placed, placedSupport, fmt, selected, setSelected, hoverAsset, setHoverAsset, onHide, inspector, planStatus, onSubmit, onApprove, onChanges, onShare, shareMsg }: ActiveItemsProps) {
  const total = placed.length + placedSupport.length;
  const statusColor = planStatus === "approved" ? C.green : planStatus === "pending" ? C.amber : planStatus === "changes" ? C.red : C.dim;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-2 py-1" style={{ borderColor: C.border }}>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          Active items <span style={{ color: C.dim }}>— {total}</span>
        </span>
        {onHide && <Dots3 onClick={onHide} title="Hide deployed-asset list" />}
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {total === 0 && <div className="px-1 py-2 text-[9px]" style={{ color: C.dim }}>Nothing placed yet — arm an asset or support object, then tap a map.</div>}
        {placed.map((u) => (
          <button key={`a${u.id}`} onClick={() => setSelected({ kind: "asset", id: u.id })}
            onMouseEnter={() => setHoverAsset(u.asset)}
            onMouseLeave={() => setHoverAsset((h) => (h === u.asset ? null : h))}
            className="flex w-full items-center justify-between gap-1 rounded px-1 py-0.5 text-left text-[9px] hover:bg-white/5"
            style={{ background: (selected?.kind === "asset" && selected.id === u.id) || hoverAsset === u.asset ? "#152238" : "transparent", boxShadow: hoverAsset === u.asset ? `inset 0 0 0 1px ${C.cyan}` : undefined }}>
            <span style={{ color: u.aff === "hostile" ? C.red : C.text }}>{ASSET_LABELS[u.asset]}{u.count > 1 ? ` ×${u.count}` : ""}</span>
            <span className="font-mono" style={{ color: C.gold }}>{fmt.coordAt(u.lat, u.lon)}</span>
          </button>
        ))}
        {placedSupport.map((u) => (
          <button key={`s${u.id}`} onClick={() => setSelected({ kind: "support", id: u.id })}
            className="flex w-full items-center justify-between gap-1 rounded px-1 py-0.5 text-left text-[9px] hover:bg-white/5"
            style={{ background: selected?.kind === "support" && selected.id === u.id ? "#152238" : "transparent" }}>
            <span className="truncate" style={{ color: u.aff === "hostile" ? C.red : u.def.color }}>{u.def.term}{u.path ? ` (${u.path.length}pt)` : ""}</span>
            <span className="font-mono" style={{ color: C.gold }}>{fmt.coordAt(u.lat, u.lon)}</span>
          </button>
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
interface TracksProps {
  placed: Placed[];
  onUpdAsset: (id: number, patch: Partial<Placed>) => void;
  selected: { kind: "asset" | "support"; id: number } | null;
  setSelected: (s: { kind: "asset" | "support"; id: number } | null) => void;
  onHide?: () => void;
}
function TracksPanel({ placed, onUpdAsset, selected, setSelected, onHide }: TracksProps) {
  const num = (val: number | undefined, on: (v: number | undefined) => void, ph: string) => (
    <input type="number" value={val ?? ""} placeholder={ph}
      onChange={(e) => on(e.target.value === "" ? undefined : parseFloat(e.target.value))}
      className="w-full rounded border bg-transparent px-1 py-0.5 text-[8px] font-mono" style={{ borderColor: C.border, color: C.text }} />
  );
  const moving = placed.filter((u) => u.moving).length;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-2 py-1" style={{ borderColor: C.border }}>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          Tracks · movement <span style={{ color: C.dim }}>— {moving}/{placed.length} moving</span>
        </span>
        {onHide && <Dots3 onClick={onHide} title="Hide tracks" />}
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5">
        {placed.length === 0 && <div className="px-1 py-2 text-[9px]" style={{ color: C.dim }}>Place an asset (drone, Avenger, foil), then set its heading, speed & altitude and activate movement.</div>}
        {placed.map((u) => {
          const sel = selected?.kind === "asset" && selected.id === u.id;
          return (
            <div key={u.id} className="rounded border p-1" style={{ borderColor: sel ? C.cyan : C.border, background: sel ? "#152238" : "transparent" }}>
              <button onClick={() => setSelected({ kind: "asset", id: u.id })} className="mb-1 flex w-full items-center justify-between">
                <span className="text-[9px] font-semibold" style={{ color: u.aff === "hostile" ? C.red : C.text }}>{ASSET_LABELS[u.asset]}{u.count > 1 ? ` ×${u.count}` : ""}</span>
                <span className="rounded px-1 text-[7px] font-bold" style={{ color: u.moving ? C.green : C.dim, background: u.moving ? `${C.green}18` : "transparent" }}>{u.moving ? "MOVING" : "HOLD"}</span>
              </button>
              <div className="grid grid-cols-3 gap-1">
                <div><div className="text-[6px]" style={{ color: C.dim }}>HDG°</div>{num(u.heading, (v) => onUpdAsset(u.id, { heading: v === undefined ? undefined : ((v % 360) + 360) % 360 }), "000")}</div>
                <div><div className="text-[6px]" style={{ color: C.dim }}>SPD km/h</div>{num(u.speed, (v) => onUpdAsset(u.id, { speed: v }), "0")}</div>
                <div><div className="text-[6px]" style={{ color: C.dim }}>ALT m</div>{num(u.altitude, (v) => onUpdAsset(u.id, { altitude: v }), "0")}</div>
              </div>
              <button onClick={() => onUpdAsset(u.id, { moving: !u.moving })}
                className="mt-1 w-full rounded border py-0.5 text-[8px] font-semibold"
                style={{ borderColor: u.moving ? C.green : C.border, color: u.moving ? C.green : C.dim }}>
                {u.moving ? "◼ HOLD MOVEMENT" : "▶ ACTIVATE MOVEMENT"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mission Planning main view ────────────────────────────────────────────────
export function MissionPlanning({ iconStyle }: { iconStyle: IconStyle }) {
  const [aoKey, setAoKey] = useState("capitol");
  const [gridOn, setGridOn] = useState(true);
  const [digits, setDigits] = useState<Digits>(4);
  const [coordFmt, setCoordFmt] = useState<"mgrs" | "dms">("mgrs");
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
  const [aoMenuOpen, setAoMenuOpen] = useState(false);   // AO/mission dropdown (declutters the scroll row)
  const [showHiddenAos, setShowHiddenAos] = useState(false);
  const [aoHidden, setAoHidden] = useState<Set<string>>(() => { try { return new Set<string>(JSON.parse(localStorage.getItem("sec2525.aoHidden") || "[]")); } catch { return new Set<string>(); } });
  useEffect(() => { try { localStorage.setItem("sec2525.aoHidden", JSON.stringify(Array.from(aoHidden))); } catch { /* quota */ } }, [aoHidden]);
  const toggleAoHidden = (k: string) => setAoHidden((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
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
  const allAos = [...AOS, ...customAos];
  const aoStateOf = (k: string) => (k.startsWith("custom-") ? "CUSTOM" : k === "dc" ? "DC" : k === "jblm" ? "WA"
    : ["capitol", "mabry", "pfield", "houston", "sanantonio", "dallas", "fortworth", "austin"].includes(k) ? "TX" : "FL");
  const [hoverAsset, setHoverAsset] = useState<AssetKind | null>(null);
  const [osm, setOsm] = useState<OsmData | null>(null);
  const [borders, setBorders] = useState<BorderData | null>(borderCache);
  const [dem, setDem] = useState<Dem | null>(null);   // real GEBCO grid for the big MAP (viewA)
  const demKeyRef = useRef<string | null>(null);
  const [demB, setDemB] = useState<Dem | null>(null); // independent tile for the MINI map (viewB) — correct contours in SPLIT
  const demKeyRefB = useRef<string | null>(null);
  // Champion/challenger map engine: "current" (shipped) vs "beta" (6-face pull-as-you-need:
  // prefetch zoom-in/out tiles so the next zoom is instant). Default current; A/B switch in Settings.
  const [mapEngine, setMapEngine] = useState<"current" | "beta">(() => ((typeof localStorage !== "undefined" && localStorage.getItem("sec2525.mapEngine")) === "beta" ? "beta" : "current"));
  useEffect(() => { try { localStorage.setItem("sec2525.mapEngine", mapEngine); } catch { /* quota */ } }, [mapEngine]);
  const [isFs, setIsFs] = useState(false);
  const [railOpen, setRailOpen] = useState(true);          // left ASSET/SUPPORT rail (collapsible)
  const [rightOpen, setRightOpen] = useState(true);        // right deployed-items rail (collapsible)
  const [miniOpen, setMiniOpen] = useState(true);          // bottom-right mini-map inset (hideable)
  const [mapMax, setMapMax] = useState(false);             // maximize the big MAP (collapse both rails)
  const [mirror, setMirror] = useState(false);             // MIRROR couples MAP⇄MINI; SPLIT decouples
  const [is3dA, setIs3dA] = useState(false);               // MAP 2D/3D (perspective terrain)
  const [is3dB, setIs3dB] = useState(false);               // MINI MAP 2D/3D
  const [modeA, setModeA] = useState<"world" | "ao">("ao");   // MAP: Capitol/AO detail by default
  const [modeB, setModeB] = useState<"world" | "ao">("world"); // MINI: Earth/world context by default
  const [nudgeM, setNudgeM] = useState(1);                 // inspector nudge step (m)
  const [coordText, setCoordText] = useState("");          // exact-coordinate entry (Settings format)

  const idRef = useRef(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const aoKeyRef = useRef(aoKey);

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
  // save on every placement edit (keyed to the CURRENT AO via ref)
  useEffect(() => {
    try { localStorage.setItem(planKey(aoKeyRef.current), JSON.stringify({ placed, placedSupport })); } catch { /* quota */ }
  }, [placed, placedSupport]);

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
  useEffect(() => { if (mirror) { setViewB(viewA); setIs3dB(is3dA); } }, [mirror]); // eslint-disable-line react-hooks/exhaustive-deps
  const setViewA_ = (u: (v: ViewState) => ViewState) => { setViewA(u); if (mirror) setViewB(u); };
  const setViewB_ = (u: (v: ViewState) => ViewState) => { setViewB(u); if (mirror) setViewA(u); };
  // Smooth geometric ease of the MAP span (easeOutCubic) — the cinematic "fly-in".
  const animateSpanTo = (fromKm: number, toKm: number, ms = 800) => {
    if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const span = fromKm * Math.pow(toKm / fromKm, e);
      setViewA((v) => ({ ...v, spanKm: span }));
      if (mirror) setViewB((v) => ({ ...v, spanKm: span }));
      if (k < 1) zoomAnimRef.current = requestAnimationFrame(tick);
    };
    zoomAnimRef.current = requestAnimationFrame(tick);
  };
  // Drill from the Earth/globe into an AO: land wide (region) then glide to detail.
  const enterAo = (k: string, setMode: (m: "world" | "ao") => void) => {
    const t = allAos.find((a) => a.key === k) ?? ao;
    if (t.precision) setDigits(t.precision);
    enteringRef.current = true;
    setAoKey(k); // plan-load effect restores this AO's saved placements
    const wide = 900, region = Math.max(30, t.halfKm * 6); // region ≈ 6× the site half-extent
    setViewA({ lat: t.center[0], lon: t.center[1], spanKm: wide, bearing: 0 });
    if (mirror) setViewB({ lat: t.center[0], lon: t.center[1], spanKm: wide, bearing: 0 });
    setMode("ao");
    animateSpanTo(wide, region, 850);
  };
  const toggle3dA = () => { setIs3dA((v) => { const n = !v; if (mirror) setIs3dB(n); return n; }); };
  const toggle3dB = () => { setIs3dB((v) => { const n = !v; if (mirror) setIs3dA(n); return n; }); };
  const setModeA_ = (m: "world" | "ao") => { setModeA(m); if (mirror) setModeB(m); };
  const setModeB_ = (m: "world" | "ao") => { setModeB(m); if (mirror) setModeA(m); };
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
    if (document.fullscreenElement) document.exitFullscreen?.();
    else rootRef.current?.requestFullscreen?.().catch(() => {});
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
    const key = ao.osm;
    if (!key) { setOsm(null); return; }
    const apply = (d: OsmData | null) => {
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
    else getTile<OsmData>(`osm-${key}`, `/security-2525/osm-${key}.json`, "vector").then((d) => { if (ao.osm === key) apply(d); });
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
  const selectedObj = selected
    ? (selected.kind === "asset" ? placed.find((u) => u.id === selected.id) : placedSupport.find((u) => u.id === selected.id))
    : undefined;
  const clearAo = () => { setPlaced([]); setPlacedSupport([]); setInventory(INITIAL_INVENTORY); };
  const routeMode = !!selectedSupport && (selectedSupport.geometry === "line" || selectedSupport.geometry === "corridor");

  // ── Plan approval + share (HI commander governance) ───────────────────────
  // Any placement edit invalidates a prior approval — the plan returns to DRAFT.
  useEffect(() => { setPlanStatus((s) => (s === "draft" ? s : "draft")); }, [placed.length, placedSupport.length, aoKey]);
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
    reality, hoverAsset, setInventory, setPlaced, setPlacedSupport, setSelected, setHoverAsset, allocId,
    drawingAo, aoDraft, onAoVertex: addAoVertex, drawnAo: drawnAos[aoKey],
  }; // NB: `dem` is passed per-pane (demA→MAP, demB→MINI) so each pane's contours match its own view

  return (
    <div ref={rootRef} className="space-y-2 p-3" style={isFs ? { background: C.bg, height: "100vh", overflowY: "auto" } : undefined}>
      {/* Minimal command bar */}
      <div className="relative flex items-center gap-2">
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
                              <button onClick={(e) => { e.stopPropagation(); deleteMission(a.key); }} title="Delete mission" className="shrink-0 p-0.5"><Trash2 className="h-3 w-3" style={{ color: C.red }} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setAoKey(a.key); setAoMenuOpen(false); }}
                                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-left text-[10px] font-semibold"
                                style={{ color: a.key === aoKey ? C.cyan : C.text }}>
                                <MapPin className="h-3 w-3 shrink-0" style={{ color: a.key === aoKey ? C.cyan : C.dim }} />
                                <span className="truncate">{a.name.split(" · ")[0]}</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); toggleAoHidden(a.key); }} title="Hide / remove from list" className="shrink-0 p-0.5"><Trash2 className="h-3 w-3" style={{ color: C.red }} /></button>
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
                    <div key={a.key} className="flex items-center gap-1 rounded pr-1 opacity-60 hover:bg-white/5">
                      <span className="min-w-0 flex-1 truncate px-2 py-1 text-[10px]" style={{ color: C.dim }}>{a.name.split(" · ")[0]}</span>
                      <button onClick={() => toggleAoHidden(a.key)} title="Restore (show)" className="shrink-0 p-0.5"><Eye className="h-3 w-3" style={{ color: C.green }} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative flex shrink-0 items-center gap-2">
          <span className="hidden whitespace-nowrap font-mono text-[10px] md:inline" style={{ color: C.dim }}>
            {fmt.coordAt(ao.center[0], ao.center[1])}
          </span>
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
          <button onClick={() => setMirror((m) => !m)} title={mirror ? "MIRROR — MAP ⇄ MINI locked; click to decouple" : "SPLIT — MAP and MINI roam independently; click to mirror"}
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: mirror ? C.cyan : C.border, color: mirror ? C.cyan : C.dim }}>
            <Columns2 className="h-3.5 w-3.5" /> {mirror ? "MIRROR" : "SPLIT"}
          </button>
          <button onClick={() => setMiniOpen((m) => !m)} title={miniOpen ? "Hide mini-map" : "Show mini-map"}
            className="rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: miniOpen ? C.cyan : C.border, color: miniOpen ? C.cyan : C.dim }}>MINI</button>
          <button onClick={toggleFs} title={isFs ? "Exit fullscreen" : "Fullscreen"}
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: isFs ? C.cyan : C.border, color: isFs ? C.cyan : C.dim }}>
            {isFs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setShowSettings((s) => !s)} title="Settings"
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: showSettings ? C.cyan : C.border, color: showSettings ? C.cyan : C.dim }}>
            <Settings className="h-3.5 w-3.5" /> SETTINGS
          </button>
        </div>
        {showSettings && (
          <div className="absolute right-0 top-9 z-40 w-60 rounded-lg border p-3 shadow-xl" style={{ background: C.panel, borderColor: C.cyan }}>
            <div className="mb-2 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Mission Planning Settings</div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px]" style={{ color: C.text }}>1 km UTM grid</span>
              <button onClick={() => setGridOn(!gridOn)} className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ borderColor: gridOn ? C.green : C.border, color: gridOn ? C.green : C.dim }}><Grid3x3 className="h-3 w-3" />{gridOn ? "ON" : "OFF"}</button>
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
              {([["mgrs", "MGRS"], ["dms", "LLV-DMS"]] as const).map(([f, label]) => (
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
                    <input type="range" min={0.05} max={0.6} step={0.01} value={contourCfg.thickness} onChange={(e) => setContourCfg((c) => ({ ...c, thickness: parseFloat(e.target.value) }))} className="w-14" />
                  </div>
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
                    <input type="range" min={0.05} max={0.6} step={0.01} value={contourCfg.bathyThickness} onChange={(e) => setContourCfg((c) => ({ ...c, bathyThickness: parseFloat(e.target.value) }))} className="w-14" />
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
            {/* Map engine A/B — CURRENT (shipped) vs 6-FACE β (prefetch pull-as-you-need) */}
            <div className="mt-2 border-t pt-2" style={{ borderColor: C.border }}>
              <div className="mb-1 text-[10px]" style={{ color: C.text }}>Map engine <span className="text-[8px]" style={{ color: C.dim }}>(A/B test)</span></div>
              <div className="flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
                {([["current", "CURRENT"], ["beta", "6-FACE β"]] as const).map(([m, label]) => (
                  <button key={m} onClick={() => setMapEngine(m)} className="flex-1 px-2 py-1"
                    style={{ background: mapEngine === m ? "#152238" : "transparent", color: mapEngine === m ? C.cyan : C.dim }}>{label}</button>
                ))}
              </div>
              <div className="mt-1 text-[7px]" style={{ color: C.dim }}>β prefetches zoom-in/out DEM tiles so the next zoom is instant. Safe to toggle live.</div>
            </div>
          </div>
        )}
      </div>

      {/* WORKSPACE (OVERVIEW template) — LEFT rail (ASSET/SUPPORT) · CENTER big MAP · RIGHT rail (deployed items) */}
      <div className="flex flex-col gap-2 landscape:flex-row" style={{ height: "min(82vh, 1080px)", minHeight: 480 }}>
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
          {/* BOTTOM-LEFT — Tracks & movement (heading · speed · altitude + activation) — plan (AO) mode only */}
          {modeA === "ao" && (
            <div className="shrink-0 overflow-hidden rounded-lg border shadow-xl landscape:h-52" style={{ background: C.panel, borderColor: C.border }}>
              <TracksPanel placed={placed} onUpdAsset={updAsset} selected={selected} setSelected={setSelected} />
            </div>
          )}
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
        <div className="relative flex min-h-0 min-w-0 flex-1">
          {modeA === "world" ? (
            <div className="h-full w-full overflow-hidden rounded-lg border shadow-xl" style={{ borderColor: C.border, background: C.panel }}>
              <WorldStrip label="MAP" aoKey={aoKey} onSelect={(k) => { setAoKey(k); }}
                onEnterAo={(k) => enterAo(k, setModeA_)} />
            </div>
          ) : (
            <AoMapPane {...paneCommon} dem={dem} label="MAP" showElevation spanFactor={1}
              view={viewA} setView={setViewA_} otherView={viewB} is3d={is3dA} onToggle3d={toggle3dA}
              maximized={mapMax} onToggleMax={() => setMapMax((m) => !m)} onWorld={() => setModeA_("world")} />
          )}
          {miniOpen ? (
            <div className="absolute bottom-2 right-2 z-20 flex flex-col overflow-hidden rounded-lg border-2 shadow-2xl"
              style={{ width: "48%", height: "46%", minWidth: 220, minHeight: 170, borderColor: C.cyan, background: C.panel }}>
              {modeB === "world" ? (
                <WorldStrip label="MINI" aoKey={aoKey} onSelect={(k) => { setAoKey(k); }}
                  onEnterAo={(k) => enterAo(k, setModeB_)} />
              ) : (
                <AoMapPane {...paneCommon} dem={mirror ? dem : demB} label="MINI MAP" showElevation={false} spanFactor={mirror ? 1 : OVERVIEW_FACTOR}
                  view={viewB} setView={setViewB_} otherView={viewA} is3d={is3dB} onToggle3d={toggle3dB}
                  maximized={false} onToggleMax={() => setMapMax((m) => !m)} onHidePane={() => setMiniOpen(false)} onWorld={() => setModeB_("world")} />
              )}
            </div>
          ) : (
            <button onClick={() => setMiniOpen(true)} title="Show mini-map"
              className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-semibold shadow-lg"
              style={{ borderColor: C.border, color: C.dim, background: "#0a0f16dd" }}>
              ▾ MINI MAP
            </button>
          )}
        </div>

        {/* RIGHT RAIL — deployed ASSET / SUPPORT list, collapses to a 3-bullet rail */}
        {!mapMax && (rightOpen ? (
          <div className="min-h-0 shrink-0 overflow-hidden rounded-lg border shadow-xl landscape:w-64" style={{ background: C.panel, borderColor: C.border }}>
            <ActiveItems placed={placed} placedSupport={placedSupport} fmt={fmt}
              selected={selected} setSelected={setSelected} hoverAsset={hoverAsset} setHoverAsset={setHoverAsset}
              onHide={() => setRightOpen(false)}
              inspector={<ItemInspector selected={selected} selectedObj={selectedObj} fmt={fmt} coordFmt={coordFmt} digits={digits}
                nudgeM={nudgeM} setNudgeM={setNudgeM} coordText={coordText} setCoordText={setCoordText}
                onSetAff={setAff} onSetPlacedReality={setPlacedReality} onUpdAsset={updAsset} onSetTL={setTL}
                onNudge={nudge} onSetCoord={setCoord} onRemoveSelected={removeSelected} />}
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
    </div>
  );
}
