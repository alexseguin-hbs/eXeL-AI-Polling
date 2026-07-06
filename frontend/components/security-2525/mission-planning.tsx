"use client";

/**
 * SECURITY-2525 · Mission Planning (PLANNING tab)
 * ===============================================
 * Equipment inventory → drag-and-drop (or tap-select + tap-place) onto the AO
 * map. Every placement snaps to an MGRS coordinate (WGS84 → UTM → MGRS, see
 * ./mgrs.ts). Demo AOs: Camp Mabry + Texas State Capitol (Austin TX, zone 14R)
 * and JBLM Lewis-McChord (Seattle/Tacoma WA, zone 10T).
 *
 * Grid law (operator-locked):
 *   • 1 km UTM grid, toggleable ON/OFF
 *   • readout precision DEFAULT 8-digit (10 m — FAAD convention), toggle to
 *     10-digit (1 m) / 12-digit (0.1 m) for higher precision
 *
 * World context strip: Natural Earth 50m borders (public domain) — country
 * borders globally + state borders for USA only, preprocessed to
 * public/security-2525/borders-ne50m.json (self-hosted, CSP-safe).
 * Elevation (USGS 3DEP / Copernicus GLO-30) and subsurface (GEBCO / NOAA NCEI)
 * layers come later — see docs/security-2525/DATA_SOURCES.md.
 * Buildings: exterior corners + domes only for now (edge wireframe later).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Grid3x3, MapPin, Trash2, ChevronRight, Settings, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import {
  AssetIcon, ASSET_LABELS, type AssetKind, type IconStyle, type Affiliation,
} from "@/components/security-2525/asset-icons";
import { latLonToMgrs, utmKmGrid, chooseGridStep } from "@/components/security-2525/mgrs";
import {
  SUPPORT_CATALOG, GROUP_META, REALITY_MODES,
  type SupportObjectDef, type MarkerGlyph, type LegendGroup, type RealityMode,
} from "@/components/security-2525/mission-support";
import { PfieldVenue } from "@/components/security-2525/pfield-venue";
import { RCORE_LANES } from "@/components/security-2525/rcore";

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

// ── Buildings — exterior corners + dome only (edge wireframe comes later) ────
interface Building {
  label: string;
  ref: [number, number];             // lat, lon anchor
  footprint: [number, number][];     // meter offsets [east, north] — EXTERIOR corners
  dome?: [number, number, number];   // [east, north, radius m]
  door?: [number, number];           // main entrance (south face, faces Congress Ave)
}

// Texas State Capitol — cross-shaped exterior from the overhead reference.
// Corners only; window ticks are generated along the south/north faces.
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

// ── AO presets ────────────────────────────────────────────────────────────────
interface Ao {
  key: string;
  name: string;
  center: [number, number];
  halfKm: number;
  landmarks: { name: string; lat: number; lon: number }[];
  buildings: Building[];
  /** A gridiron test venue — drone-play sandbox. Defined by its 4 real corners
   *  (lat,lon) so the wireframe overlays the actual turf. Yard lines are
   *  bilinearly interpolated N→S between the end lines. */
  field?: { nw: [number, number]; ne: [number, number]; sw: [number, number]; se: [number, number] };
  /** Default MGRS precision for this AO (4/5/6 = 8/10/12-digit). */
  precision?: Digits;
  /** Self-hosted OSM roads/water layer key → /security-2525/osm-<key>.json */
  osm?: string;
}

const AOS: Ao[] = [
  {
    key: "mabry",
    name: "CAMP MABRY · AUSTIN TX",
    center: [30.316, -97.7639],
    halfKm: 6,
    osm: "mabry", // roads + waterways, 10 km radius, OSM
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
    osm: "capitol", // roads (grey) + waterways (blue), 10 km radius, OSM
    landmarks: [{ name: "GOVERNOR'S MANSION", lat: 30.2724, lon: -97.7443 }],
    buildings: [TX_CAPITOL],
  },
  {
    // Drone-play test venue: THE PFIELD (Pflugerville ISD stadium, opened 2017).
    // Real turf corners (operator-surveyed via Google Maps). Long-axis ≈ N-S.
    // Small AO for 12-digit precision + A→B→C object-movement testing.
    key: "pfield",
    name: "THE PfIELD · PFLUGERVILLE TX",
    center: [30.4485425, -97.6344145], // mean of the 4 corners
    halfKm: 0.09,
    precision: 6, // 12-digit (0.1 m)
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
    osm: "jblm", // roads + waterways, 10 km radius, OSM
    landmarks: [
      { name: "JBLM LEWIS MAIN", lat: 47.0855, lon: -122.5821 },
      { name: "GRAY AAF", lat: 47.079, lon: -122.5806 },
    ],
    buildings: [],
  },
];

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

/** A target line — brg = Primary Target Line (direction the asset points); left/right
 *  = degrees of coverage to each side of the PTL (asymmetric sector). All DEGREES. */
interface TL { brg: number; left: number; right: number }

interface Placed {
  id: number;
  asset: AssetKind;
  count: number;
  fx: number; // 0..1 across AO box
  fy: number;
  mgrs10: string; // stored at max precision; displayed per current setting
  lat: number;
  lon: number;
  aff: Affiliation;
  tls?: { p?: TL; s?: TL; t?: TL }; // PTL / 2TL / 3TL (Avenger/Patriot/THAAD)
  fov?: TL;                          // sensor/radar field-of-view sector (Sentinel)
  unit?: AngleUnit;                  // per-asset angle unit (inspector-selectable)
}

// Angle unit systems. deg = 360° · ucrs = UCRS-2525 base-3600 · mil = 6400 (Sentinel).
type AngleUnit = "deg" | "ucrs" | "mil";
const ANGLE_FULL: Record<AngleUnit, number> = { deg: 360, ucrs: 3600, mil: 6400 };
const ANGLE_LABEL: Record<AngleUnit, string> = { deg: "DEG", ucrs: "UCRS-2525", mil: "6400 MIL" };
const toUnit = (deg: number, u: AngleUnit) => (deg * ANGLE_FULL[u]) / 360;
const fromUnit = (v: number, u: AngleUnit) => (v * 360) / ANGLE_FULL[u];
const fmtAngle = (deg: number, u: AngleUnit) => {
  const v = Math.round(toUnit(((deg % 360) + 360) % 360, u));
  return u === "deg" ? `${v}°` : u === "mil" ? `${v}mil` : `${v}`;
};
// SVG sector path (canvas units): from (brg-left) to (brg+right), 0=N=up.
function sectorPath(cx: number, cy: number, R: number, tl: TL) {
  const span = tl.left + tl.right;
  if (span >= 359.5) return `M${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy} Z`;
  const a0 = ((tl.brg - tl.left) * Math.PI) / 180, a1 = ((tl.brg + tl.right) * Math.PI) / 180;
  const p0x = cx + R * Math.sin(a0), p0y = cy - R * Math.cos(a0);
  const p1x = cx + R * Math.sin(a1), p1y = cy - R * Math.cos(a1);
  return `M${cx} ${cy} L${p0x.toFixed(2)} ${p0y.toFixed(2)} A ${R} ${R} 0 ${span > 180 ? 1 : 0} 1 ${p1x.toFixed(2)} ${p1y.toFixed(2)} Z`;
}
// Default PTL half-coverage per AD asset (degrees each side).
const AD_HALF: Partial<Record<AssetKind, number>> = { avenger: 45, patriot: 60, thaad: 90 };

// ── World border context strip (Natural Earth 50m, self-hosted) ──────────────
interface BorderData { countries: [number, number][][]; usStates: [number, number][][] }
let borderCache: BorderData | null = null;

// ── OSM roads + waterways layer (OpenStreetMap, Python-preprocessed) ─────────
interface OsmWay { t: number; p: [number, number][]; bb?: [number, number, number, number] }
interface OsmData { roads: OsmWay[]; water: [number, number][][]; waterPolys: [number, number][][] }
const osmCache: Record<string, OsmData> = {};

/** Attach a NON-passive wheel listener so preventDefault() stops the page from
 *  scrolling — zoom stays on the map/globe under the cursor. */
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

/**
 * Orthographic wireframe GLOBE — the planning start screen (operator reference:
 * cyan wireframe globe + bearing ring). Centered on North America (38N 97W).
 * Coordinate ladder: lat/lon graticule at globe level → click an AO marker →
 * MGRS 1 km grid at AO level. Drag-rotate comes later.
 */
function GlobeView({ data, center, activeKey, onSelect, onDrill }: {
  data: BorderData | null; center: [number, number]; activeKey: string;
  onSelect: (k: string) => void; onDrill: (lat: number, lon: number) => void;
}) {
  const CX = 170, CY = 170, RING = 150;
  const D = Math.PI / 180;
  const DRILL_R = 520; // zoom past this radius → hand off to the full-screen flat map
  // 3-D orbit camera: lat0/lon0 = sub-viewer point (pan/tilt drag), tilt/roll = view
  // angle (right-drag / 2-finger), R = zoom (scroll / pinch). Silhouette stays circular.
  const [cam, setCam] = useState({ lat0: center[0], lon0: center[1], tilt: 0.32, roll: 0, R: 150 });
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null);
  const touch = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const gsvg = useRef<SVGSVGElement>(null);
  // Recenter on the selected AO (or a returning flat handoff) when `center` changes.
  useEffect(() => { setCam((c) => ({ ...c, lat0: center[0], lon0: center[1] })); }, [center[0], center[1]]);
  const { lat0: LAT0, lon0: LON0, tilt, roll, R } = cam;
  const cr = Math.cos(roll), sr = Math.sin(roll), ct = Math.cos(tilt), st = Math.sin(tilt);
  // Scroll / pinch zoom — anchored on the CENTRE reticle (scale only, no recenter).
  // Past DRILL_R we hand the current centre off to the full-screen flat map.
  useWheel(gsvg, (e) => {
    e.preventDefault();
    const zin = e.deltaY < 0, factor = zin ? 1.12 : 1 / 1.12;
    if (cam.R * factor > DRILL_R && zin) { onDrill(cam.lat0, cam.lon0); return; }
    setCam((c) => ({ ...c, R: Math.min(DRILL_R, Math.max(70, c.R * factor)) }));
  });
  const proj = (lat: number, lon: number): [number, number, boolean] => {
    const p = lat * D, l = (lon - LON0) * D, p0 = LAT0 * D;
    const X = Math.cos(p) * Math.sin(l);
    const Yc = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
    const Z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    // roll about screen-Z, then tilt about screen-X → true 3-D view angle
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
          if (touch.current.size === 2) { const [a, b] = Array.from(touch.current.values()); pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; }
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
            // 2-finger = pinch-zoom (centre-anchored). Past DRILL_R → drill to the flat map.
            const [a, b] = Array.from(touch.current.values());
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const factor = dist / Math.max(1, pinch.current.dist);
            pinch.current = { dist, cx: pinch.current.cx, cy: pinch.current.cy };
            if (cam.R * factor > DRILL_R) { onDrill(cam.lat0, cam.lon0); return; }
            setCam((c) => ({ ...c, R: Math.min(DRILL_R, Math.max(70, c.R * factor)) }));
          } else if (touch.current.size === 1) {
            // 1-finger = rotate/pan the globe
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
          // RIGHT-drag = reposition the angle of view over the globe (3-dimensionality)
          setCam((c) => ({ ...c, roll: c.roll - dx * 0.005, tilt: Math.max(-1.4, Math.min(1.4, c.tilt + dy * 0.005)) }));
        } else {
          // LEFT-drag = pan/tilt across the surface
          setCam((c) => ({ ...c, lon0: c.lon0 - dx * 0.5, lat0: Math.min(85, Math.max(-85, c.lat0 + dy * 0.5)) }));
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") { touch.current.delete(e.pointerId); if (touch.current.size < 2) pinch.current = null; return; }
        drag.current = null;
      }}>
      {/* bearing ring 000–350 */}
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke={C.cyan} strokeWidth="0.6" opacity="0.7" />
      {ticks}
      {/* globe (orthographic silhouette stays a circle at any view angle) */}
      <circle cx={CX} cy={CY} r={R} fill="#0c141f" stroke={C.cyan} strokeWidth="1.2" />
      <path d={graticule} fill="none" stroke={C.cyan} strokeWidth="0.35" opacity="0.55" />
      {borders && (
        <>
          <path d={borders.countries} fill="none" stroke={C.borderCountry} strokeWidth="0.5" opacity="0.75" />
          <path d={borders.states} fill="none" stroke={C.borderState} strokeWidth="0.4" opacity="0.65" />
        </>
      )}
      {AOS.map((ao) => {
        const [x, y, v] = proj(ao.center[0], ao.center[1]);
        if (!v) return null;
        const active = ao.key === activeKey;
        return (
          <g key={ao.key} onClick={() => onSelect(ao.key)} onDoubleClick={() => onDrill(ao.center[0], ao.center[1])} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={active ? 7 : 5} fill="none" stroke={C.gold} strokeWidth="1" opacity={active ? 1 : 0.7} />
            {active && <circle cx={x} cy={y} r="10" fill="none" stroke={C.gold} strokeWidth="0.5" opacity="0.5" />}
            <circle cx={x} cy={y} r="1.5" fill={C.gold} />
          </g>
        );
      })}
    </svg>
  );
}

function WorldStrip({ aoKey, onSelect }: { aoKey: string; onSelect: (k: string) => void }) {
  const [data, setData] = useState<BorderData | null>(borderCache);
  const [mode, setMode] = useState<"globe" | "flat">("globe");
  const [center, setCenter] = useState<[number, number]>(() => (AOS.find((a) => a.key === aoKey)?.center ?? [38, -97]));
  useEffect(() => {
    if (borderCache) return;
    fetch("/security-2525/borders-ne50m.json")
      .then((r) => r.json())
      .then((d: BorderData) => { borderCache = d; setData(d); })
      .catch(() => {}); // context view — AO map works without it
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
  // Flat map: pan (drag) + zoom (wheel) via a live viewBox. Continuous with the globe —
  // drilling in on the globe hands off here; zooming fully out returns to the globe.
  const [flat, setFlat] = useState({ x: 0, y: H * 0.08, w: W, h: H * 0.62 });
  const flatDrag = useRef<{ x: number; y: number } | null>(null);
  const flatSvg = useRef<SVGSVGElement>(null);
  const drillToFlat = (lat: number, lon: number) => {
    const cx = ((lon + 180) / 360) * W, cy = ((90 - lat) / 180) * H;
    const w = 0.12 * (W / 360), h = w; // ~13 km across → city scale
    setFlat({ x: cx - w / 2, y: cy - h / 2, w, h });
    setCenter([lat, lon]); setMode("flat");
  };
  useWheel(flatSvg, (e) => {
    e.preventDefault();
    const k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    if (flat.w * k >= W * 0.98 && e.deltaY > 0) { setMode("globe"); return; } // zoomed fully out → globe
    setFlat((f) => {
      const w = Math.min(W, Math.max(0.02, f.w * k)), h = w * (f.h / f.w); // ~2 km floor (street data pending)
      const mx = f.x + f.w / 2, my = f.y + f.h / 2; // keep the centre reticle fixed
      return { w, h, x: mx - w / 2, y: my - h / 2 };
    });
  });
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
      {mode === "globe" ? (
        <GlobeView data={data} center={center} activeKey={aoKey} onSelect={onSelect} onDrill={drillToFlat} />
      ) : (
        <svg ref={flatSvg} viewBox={`${flat.x} ${flat.y} ${flat.w} ${flat.h}`} preserveAspectRatio="xMidYMid meet"
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
            setFlat((f) => ({ ...f, x: f.x - dx, y: f.y - dy }));
          }}
          onPointerUp={() => { flatDrag.current = null; }}>
          {paths && (
            <>
              <path d={paths.countries} fill="none" stroke={C.borderCountry} strokeWidth="0.45" opacity="0.55" vectorEffect="non-scaling-stroke" />
              <path d={paths.states} fill="none" stroke={C.borderState} strokeWidth="0.35" opacity="0.5" vectorEffect="non-scaling-stroke" />
            </>
          )}
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
        </svg>
      )}
      <div className="absolute right-2 top-2 z-10 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
        {(["globe", "flat"] as const).map((m) => (
          <button key={m} onClick={() => (m === "flat" ? drillToFlat(center[0], center[1]) : (setCenter([90 - ((flat.y + flat.h / 2) / H) * 180, ((flat.x + flat.w / 2) / W) * 360 - 180]), setMode("globe")))} className="px-2 py-0.5"
            style={{ background: mode === m ? "#152238" : "transparent", color: mode === m ? C.cyan : C.dim }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      <span className="absolute bottom-1 right-2 z-10 text-[8px]" style={{ color: C.dim }}>
        NATURAL EARTH 50m · SCROLL=ZOOM · R-DRAG=ANGLE · L-DRAG=PAN · DRILL IN → MAP
      </span>
    </div>
  );
}

// ── Mission-support marker glyph — self-contained SVG per canonical group ────
// Visual color law drives the color; the glyph gives an at-a-glance category.
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
  /** multi-point route (line/corridor): right-click vertices, left-click finishes */
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

/**
 * SYNTHETIC elevation (meters) — deterministic pseudo-terrain until real DEM is
 * wired (USGS 3DEP bare-earth / Copernicus GLO-30; subsurface via GEBCO/NOAA —
 * see docs/security-2525/DATA_SOURCES.md). Smooth multi-octave sin field so the
 * edge profile and the box/circle elevation reads plausibly at any zoom.
 */
function synthElevation(lat: number, lon: number): number {
  // Multi-octave so the profile reads at BOTH regional and city-block zoom.
  const e =
    120 * Math.sin(lon * 3.0 + 0.3) * Math.cos(lat * 2.7) +   // regional swell
    55 * Math.sin(lon * 42 + lat * 37) +                      // ~10 km hills
    28 * Math.cos(lon * 190 - lat * 160) +                    // ~1–2 km ridges
    13 * Math.sin(lon * 640 + lat * 560);                     // sub-km relief
  return Math.max(0, 190 + e); // Austin ≈ 150–260 m
}

// ── Mission Planning main view ────────────────────────────────────────────────
export function MissionPlanning({ iconStyle }: { iconStyle: IconStyle }) {
  const [aoKey, setAoKey] = useState("capitol");
  const [gridOn, setGridOn] = useState(true);
  const [digits, setDigits] = useState<Digits>(4);
  const [coordFmt, setCoordFmt] = useState<"mgrs" | "dms">("mgrs");
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetKind | null>(null);
  const [cursorLL, setCursorLL] = useState<{ lat: number; lon: number } | null>(null);
  // mission-support palette state
  const [tab, setTab] = useState<"assets" | "support">("assets");
  const [selectedSupport, setSelectedSupport] = useState<SupportObjectDef | null>(null);
  const [placedSupport, setPlacedSupport] = useState<PlacedSupport[]>([]);
  const [reality, setReality] = useState<RealityMode>("training_demo");
  const [openGroups, setOpenGroups] = useState<Set<LegendGroup>>(new Set<LegendGroup>(["sustainment"]));
  const [selected, setSelected] = useState<{ kind: "asset" | "support"; id: number } | null>(null);
  const [elevOn, setElevOn] = useState(true);
  const [bottomH, setBottomH] = useState(150); // resizable elevation band (~1/3 default)
  // Session-wide UX prefs (persist to localStorage → carry across sections).
  const [cursorMode, setCursorMode] = useState<"pointer" | "target">("pointer");
  const [showSettings, setShowSettings] = useState(false);
  const [cursorPx, setCursorPx] = useState<{ x: number; y: number } | null>(null);
  const [venue3d, setVenue3d] = useState(false); // PfIELD 2D ⇄ 3D oblique
  const [routeDraft, setRouteDraft] = useState<{ lat: number; lon: number }[]>([]);
  const [topOpen, setTopOpen] = useState(true);   // 3-dot collapse: top world map
  const [leftOpen, setLeftOpen] = useState(true); // 3-dot collapse: left palette
  const [insetMode, setInsetMode] = useState<"corner" | "max" | "min">("corner"); // AO map PiP state
  const [hoverAsset, setHoverAsset] = useState<AssetKind | null>(null); // list ⇄ map cross-highlight
  const [osm, setOsm] = useState<OsmData | null>(null); // roads/water for the active AO
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { const v = localStorage.getItem("sec2525.cursorMode"); if (v === "target" || v === "pointer") setCursorMode(v); } catch { /* no storage */ }
  }, []);
  const setCursor = (m: "pointer" | "target") => { setCursorMode(m); try { localStorage.setItem("sec2525.cursorMode", m); } catch { /* no storage */ } };
  const idRef = useRef(1);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; moved: boolean; btn: number } | null>(null);
  const bottomDrag = useRef<number | null>(null);
  const bearingMemo = useRef<number | null>(null); // compass toggle: remembers pre-north bearing
  const touchRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null);

  const ao = AOS.find((a) => a.key === aoKey) ?? AOS[0];
  // Live view — spanKm = VISIBLE edge; bearing rotates the map (right-drag).
  const [view, setView] = useState(() => ({ lat: ao.center[0], lon: ao.center[1], spanKm: ao.halfKm * 2, bearing: 0 }));
  useEffect(() => {
    setView({ lat: ao.center[0], lon: ao.center[1], spanKm: ao.halfKm * 2, bearing: 0 });
    if (ao.precision) setDigits(ao.precision); // e.g. Pfield → 12-digit
  }, [aoKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The inner canvas covers RENDER× the visible span so rotation never reveals
  // empty corners (RENDER > √2). `box` is that circumscribed extent.
  const RENDER = 1.5;
  const OFF = (RENDER - 1) / 2; // 0.25 — inner-canvas overhang each side
  const box = useMemo(() => {
    const halfKm = (view.spanKm * RENDER) / 2;
    const dLat = halfKm / 110.574;
    const dLon = halfKm / (111.32 * Math.cos((view.lat * Math.PI) / 180));
    return { latMin: view.lat - dLat, latMax: view.lat + dLat, lonMin: view.lon - dLon, lonMax: view.lon + dLon };
  }, [view.lat, view.lon, view.spanKm]);
  const grid = useMemo(
    () => utmKmGrid(box.latMin, box.latMax, box.lonMin, box.lonMax, chooseGridStep(view.spanKm * 1000)),
    [box, view.spanKm]
  );
  // AO box width in meters — scales building-overlay radii (dome) to screen %
  const boxW = (box.lonMax - box.lonMin) * 111320 * Math.cos((ao.center[0] * Math.PI) / 180);

  // Inner-canvas frac ↔ lat/lon (north-up; the CSS rotation is applied to the canvas).
  const toLatLon = (fx: number, fy: number) => ({
    lat: box.latMax - fy * (box.latMax - box.latMin),
    lon: box.lonMin + fx * (box.lonMax - box.lonMin),
  });
  const toFrac = (lat: number, lon: number) => ({
    fx: (lon - box.lonMin) / (box.lonMax - box.lonMin),
    fy: (box.latMax - lat) / (box.latMax - box.latMin),
  });
  // Rotate (x,y) around (0.5,0.5) by bearing (s=sin,c=cos).
  const rotC = (b: number, inv = false) => { const a = inv ? -b : b; return [Math.sin(a), Math.cos(a)] as const; };
  const rotAround = (x: number, y: number, s: number, c: number) => [0.5 + (x - 0.5) * c - (y - 0.5) * s, 0.5 + (x - 0.5) * s + (y - 0.5) * c] as const;
  // lat/lon → VISIBLE container frac (for upright HTML overlays: icons, labels).
  const project = (lat: number, lon: number) => {
    const f = toFrac(lat, lon);
    const px = f.fx * RENDER - OFF, py = f.fy * RENDER - OFF; // inner → container (pre-rotation)
    const [s, c] = rotC(view.bearing);
    const [fx, fy] = rotAround(px, py, s, c);
    return { fx, fy };
  };
  // VISIBLE container frac → lat/lon (inverse of project).
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
  const mgrsAt = (lat: number, lon: number, d: Digits = digits) => latLonToMgrs(lat, lon, d);
  // LLV-DMS (lat/lon in degrees-minutes-seconds). Precision scales seconds decimals.
  const dms1 = (v: number, pos: string, neg: string) => {
    const h = v >= 0 ? pos : neg, a = Math.abs(v);
    const d = Math.floor(a), m = Math.floor((a - d) * 60);
    const s = ((a - d) * 60 - m) * 60;
    const dec = digits >= 6 ? 3 : digits === 5 ? 2 : 1;
    return `${d}°${String(m).padStart(2, "0")}'${s.toFixed(dec).padStart(dec + 3, "0")}"${h}`;
  };
  const coordAt = (lat: number, lon: number) =>
    coordFmt === "dms" ? `${dms1(lat, "N", "S")} ${dms1(lon, "E", "W")}` : mgrsAt(lat, lon);
  // Units — metric default (km/m); imperial option (mi/ft). Grid systems unaffected.
  const fmtDist = (m: number) =>
    units === "imperial"
      ? (m >= 1609.34 ? `${(m / 1609.34).toFixed(m >= 16093 ? 1 : 2)} mi` : `${Math.round(m * 3.28084)} ft`)
      : (m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${Math.round(m)} m`);
  const fmtElev = (m: number) => (units === "imperial" ? `${Math.round(m * 3.28084)} ft` : `${Math.round(m)} m`);

  const fracFromEvent = (e: { clientX: number; clientY: number }) => {
    const r = mapRef.current?.getBoundingClientRect();
    if (!r) return null;
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
    return { fx, fy };
  };

  // Wheel/trackpad zoom toward the cursor — plain scroll now that the viewer is a
  // standalone full-screen surface (no page scroll to preserve). ~20 m min, 200 km max.
  const onWheel = (e: WheelEvent | React.WheelEvent) => {
    e.preventDefault();
    // centre-anchored (reticle) zoom — keep the view centre fixed, scale the span
    setView((v) => ({ ...v, spanKm: Math.min(200, Math.max(0.02, v.spanKm * (e.deltaY > 0 ? 1.15 : 1 / 1.15))) }));
  };
  useWheel(mapRef, onWheel);

  // Is a multi-point route tool armed? (line/corridor support object)
  const routeMode = !!selectedSupport && (selectedSupport.geometry === "line" || selectedSupport.geometry === "corridor");

  // Pan the map by a screen-space delta, rotating it into world axes by -bearing.
  const panBy = (sdx: number, sdy: number) => setView((v) => {
    const [s, c] = [Math.sin(-v.bearing), Math.cos(-v.bearing)];
    const wdx = sdx * c - sdy * s, wdy = sdx * s + sdy * c;
    const halfKm = v.spanKm / 2;
    const dLat = halfKm / 110.574, dLon = halfKm / (111.32 * Math.cos((v.lat * Math.PI) / 180));
    return { ...v, lat: v.lat + wdy * (2 * dLat), lon: v.lon - wdx * (2 * dLon) };
  });

  // Grab-drag: LEFT = pan, RIGHT = rotate (bearing). Route mode reserves right-click.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") { touchDown(e); return; }
    if (e.button !== 0 && e.button !== 2) return;
    if (routeMode && e.button === 2) return; // reserve right-click for route vertices
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false, btn: e.button };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") { touchMove(e); return; }
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
      setView((v) => ({ ...v, bearing: v.bearing - (dx / r.width) * Math.PI })); // right-drag rotates
    } else {
      panBy(dx / r.width, dy / r.height);
    }
  };
  // ── Touch: 1 finger = pan, 2 fingers = pinch-zoom (mobile UI/UX) ────────────
  const touchDown = (e: React.PointerEvent) => {
    touchRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    if (touchRef.current.size === 2) {
      const [a, b] = Array.from(touchRef.current.values());
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
  };
  const touchMove = (e: React.PointerEvent) => {
    const prev = touchRef.current.get(e.pointerId);
    if (!prev) return;
    const r = mapRef.current?.getBoundingClientRect();
    touchRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchRef.current.size >= 2 && pinchRef.current && r) {
      // 2-finger = centre-anchored pinch-zoom (works in the corner mini-map too)
      const [a, b] = Array.from(touchRef.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = pinchRef.current.dist / Math.max(1, dist);
      pinchRef.current.dist = dist;
      setView((v) => ({ ...v, spanKm: Math.min(200, Math.max(0.02, v.spanKm * factor)) }));
    } else if (touchRef.current.size === 1 && r) {
      panBy((e.clientX - prev.x) / r.width, (e.clientY - prev.y) / r.height);
    }
  };
  const touchEnd = (e: React.PointerEvent) => {
    touchRef.current.delete(e.pointerId);
    if (touchRef.current.size < 2) pinchRef.current = null;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") { touchEnd(e); return; }
    const d = dragRef.current;
    dragRef.current = null;
    if (d?.moved) return; // a pan/rotate, not a click — don't place/deselect
    const f = fracFromEvent(e);
    if (!f) return;
    const { lat, lon } = containerToLatLon(f.fx, f.fy);
    if (routeMode && selectedSupport) {
      if (e.button === 2) {
        setRouteDraft((p) => [...p, { lat, lon }]); // right-click = add a via-point
      } else {
        const pts = [...routeDraft, { lat, lon }]; // left-click = final point → commit
        if (pts.length >= 2) commitRoute(selectedSupport, pts);
        setRouteDraft([]);
      }
      return;
    }
    if (selectedAsset) place(selectedAsset, f.fx, f.fy);
    else if (selectedSupport) placeSupport(selectedSupport, f.fx, f.fy);
    else if (selected) setSelected(null); // empty click clears a selection
  };

  const place = (asset: AssetKind, fx: number, fy: number) => {
    const item = inventory.find((i) => i.asset === asset);
    if (!item || item.stock < item.group) return;
    const { lat, lon } = containerToLatLon(fx, fy);
    setInventory((inv) => inv.map((i) => (i.asset === asset ? { ...i, stock: i.stock - i.group } : i)));
    const half = AD_HALF[asset];
    const tls = half ? { p: { brg: 0, left: half, right: half } } : undefined; // default PTL north
    const fov = asset === "sentinel" ? { brg: 0, left: 45, right: 45 } : undefined; // radar FOV sector
    const unit: AngleUnit = asset === "sentinel" ? "mil" : "deg";
    setPlaced((p) => [...p, {
      id: idRef.current++, asset, count: item.group, fx, fy, lat, lon, mgrs10: latLonToMgrs(lat, lon, 5), aff: "friendly", tls, fov, unit,
    }]);
  };

  const remove = (unit: Placed) => {
    setPlaced((p) => p.filter((u) => u.id !== unit.id));
    setInventory((inv) => inv.map((i) => (i.asset === unit.asset ? { ...i, stock: i.stock + unit.count } : i)));
  };

  const placeSupport = (def: SupportObjectDef, fx: number, fy: number) => {
    const { lat, lon } = containerToLatLon(fx, fy);
    setPlacedSupport((p) => [...p, { id: idRef.current++, def, fx, fy, lat, lon, reality, aff: "friendly" }]);
  };

  const commitRoute = (def: SupportObjectDef, path: { lat: number; lon: number }[]) => {
    const f = toFrac(path[0].lat, path[0].lon);
    setPlacedSupport((p) => [...p, { id: idRef.current++, def, fx: f.fx, fy: f.fy, lat: path[0].lat, lon: path[0].lon, reality, aff: "friendly", path }]);
  };

  // Inspector edits — flip affiliation, retag reality, nudge coordinates, remove.
  const setAff = (sel: { kind: "asset" | "support"; id: number }, aff: Affiliation) => {
    if (sel.kind === "asset") setPlaced((p) => p.map((u) => (u.id === sel.id ? { ...u, aff } : u)));
    else setPlacedSupport((p) => p.map((u) => (u.id === sel.id ? { ...u, aff } : u)));
  };
  const setPlacedReality = (id: number, r: RealityMode) =>
    setPlacedSupport((p) => p.map((u) => (u.id === id ? { ...u, reality: r } : u)));
  const updAsset = (id: number, patch: Partial<Placed>) =>
    setPlaced((p) => p.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  const setTL = (id: number, key: "p" | "s" | "t", tl: TL | null) =>
    setPlaced((p) => p.map((u) => (u.id === id ? { ...u, tls: { ...u.tls, [key]: tl ?? undefined } } : u)));
  const nudge = (sel: { kind: "asset" | "support"; id: number }, dLat: number, dLon: number) => {
    const upd = <T extends { id: number; lat: number; lon: number }>(u: T): T =>
      u.id === sel.id ? { ...u, lat: u.lat + dLat, lon: u.lon + dLon } : u;
    if (sel.kind === "asset") setPlaced((p) => p.map(upd));
    else setPlacedSupport((p) => p.map(upd));
  };
  const removeSelected = () => {
    if (!selected) return;
    if (selected.kind === "asset") { const u = placed.find((x) => x.id === selected.id); if (u) remove(u); }
    else setPlacedSupport((p) => p.filter((x) => x.id !== selected.id));
    setSelected(null);
  };
  const selectedObj = selected
    ? (selected.kind === "asset" ? placed.find((u) => u.id === selected.id) : placedSupport.find((u) => u.id === selected.id))
    : undefined;

  // Undo — remove last route vertex if drawing, else the most recent placement.
  const undo = () => {
    if (routeDraft.length) { setRouteDraft((d) => d.slice(0, -1)); return; }
    const la = placed[placed.length - 1], ls = placedSupport[placedSupport.length - 1];
    if (ls && (!la || ls.id > la.id)) setPlacedSupport((p) => p.slice(0, -1));
    else if (la) remove(la);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      if (e.key === "Escape") setRouteDraft([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // no deps → always sees latest state

  const clearAo = () => {
    setPlaced([]);
    setPlacedSupport([]);
    setInventory(INITIAL_INVENTORY);
  };

  // Drag OR tap-to-arm resolves to one of the two placement paths.
  const dropAt = (payload: string, fx: number, fy: number) => {
    if (payload.startsWith("support:")) {
      const def = SUPPORT_CATALOG.find((d) => d.key === payload.slice(8));
      if (def) placeSupport(def, fx, fy);
    } else if (payload) {
      place(payload as AssetKind, fx, fy);
    }
  };
  const armed = selectedAsset || selectedSupport;

  const windows = useMemo(capitolWindows, []);

  // Load the OSM roads/water layer for the active AO (Python-preprocessed JSON).
  useEffect(() => {
    const key = ao.osm;
    if (!key) { setOsm(null); return; }
    if (osmCache[key]) { setOsm(osmCache[key]); return; }
    fetch(`/security-2525/osm-${key}.json`)
      .then((r) => r.json())
      .then((d: OsmData) => {
        d.roads.forEach((w) => {
          let x0 = w.p[0][0], x1 = x0, y0 = w.p[0][1], y1 = y0;
          for (const [x, y] of w.p) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          w.bb = [x0, y0, x1, y1];
        });
        osmCache[key] = d; setOsm(d);
      })
      .catch(() => setOsm(null));
  }, [ao.osm]);

  // Build per-tier road paths + water paths, culled to the current view.
  const osmPaths = useMemo(() => {
    if (!osm) return null;
    const inView = (bb: [number, number, number, number]) =>
      !(bb[2] < box.lonMin || bb[0] > box.lonMax || bb[3] < box.latMin || bb[1] > box.latMax);
    const wayD = (pts: [number, number][]) =>
      pts.map(([lon, lat], i) => { const f = toFrac(lat, lon); return `${i ? "L" : "M"}${(f.fx * 100).toFixed(2)} ${(f.fy * 100).toFixed(2)}`; }).join(" ");
    const tiers: Record<number, string> = { 2: "", 3: "", 4: "" };
    for (const w of osm.roads) { if (w.bb && !inView(w.bb)) continue; tiers[w.t] += " " + wayD(w.p); }
    let waterD = ""; for (const l of osm.water) waterD += " " + wayD(l);
    let polyD = ""; for (const p of osm.waterPolys) polyD += " " + wayD(p) + "Z";
    return { tiers, waterD, polyD };
  }, [osm, box]);

  // Elevation profiles for the edge bars — sampled from synthElevation across the
  // current view box. Bottom = W→E ridge (multi-row pseudo-3D). Right = N→S column.
  const elevProfile = useMemo(() => {
    const N = 64;
    const lonAt = (i: number) => box.lonMin + (i / (N - 1)) * (box.lonMax - box.lonMin);
    const latAt = (i: number) => box.latMax - (i / (N - 1)) * (box.latMax - box.latMin);
    const sampleRow = (lat: number) => Array.from({ length: N }, (_, i) => synthElevation(lat, lonAt(i)));
    const sampleCol = (lon: number) => Array.from({ length: N }, (_, i) => synthElevation(latAt(i), lon));
    const front = sampleRow((box.latMin + box.latMax) / 2);
    const col = sampleCol((box.lonMin + box.lonMax) / 2);
    const all = [...front, ...col];
    const min = Math.min(...all), max = Math.max(...all), rng = Math.max(1, max - min);
    const y = (e: number) => 38 - ((e - min) / rng) * 34; // bottom band viewBox 0..40
    const line = (arr: number[], yShift = 0) =>
      arr.map((e, i) => `${i ? "L" : "M"}${((i / (N - 1)) * 100).toFixed(2)} ${(y(e) + yShift).toFixed(2)}`).join("");
    const ROWS = 4;
    const rows = Array.from({ length: ROWS }, (_, r) =>
      line(sampleRow(box.latMin + ((r + 1) / (ROWS + 1)) * (box.latMax - box.latMin)), -r * 1.4)
    );
    const frontFill = `${line(front)} L100 40 L0 40 Z`;
    const rx = (e: number) => 4 + ((e - min) / rng) * 32;
    const rightPath =
      col.map((e, i) => `${i ? "L" : "M"}${rx(e).toFixed(2)} ${((i / (N - 1)) * 100).toFixed(2)}`).join("") +
      " L4 100 L4 0 Z";
    // HIGH / LOW within the FRONT profile (drawn W→E center row)
    let hi = 0, lo = 0;
    front.forEach((e, i) => { if (e > front[hi]) hi = i; if (e < front[lo]) lo = i; });
    const mark = (i: number) => ({ x: (i / (N - 1)) * 100, yy: y(front[i]), e: front[i], lat: (box.latMin + box.latMax) / 2, lon: lonAt(i) });
    // Contour reference levels (nice step) → contour-like banding
    const step = [5, 10, 25, 50, 100, 250].find((s) => rng / s <= 6) ?? 500;
    const contours: number[] = [];
    for (let lv = Math.ceil(min / step) * step; lv < max; lv += step) contours.push(lv);
    return { min, max, rng, rows, frontFill, rightPath, y, high: mark(hi), low: mark(lo), contours, step };
  }, [box]);

  return (
    <div className="space-y-2 p-3">
      {/* Minimal command bar — LEFT current location · MIDDLE selector · RIGHT readout + settings */}
      <div className="relative flex items-center gap-2">
        {/* LEFT — current location */}
        <div className="flex shrink-0 items-center gap-1 text-[10px] font-semibold tracking-wide">
          <span style={{ color: C.dim }}>{ao.key === "jblm" ? "WA" : "TX"}</span>
          <ChevronRight className="h-3 w-3" style={{ color: C.border }} />
          <span style={{ color: C.cyan }}>{ao.name.split(" · ")[0]}</span>
        </div>
        {/* MIDDLE — location selector */}
        <div className="flex flex-1 items-center justify-center gap-1.5 overflow-x-auto">
          {AOS.map((a) => (
            <button key={a.key} onClick={() => { setAoKey(a.key); clearAo(); }}
              className="shrink-0 whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold tracking-wide"
              style={{ borderColor: a.key === aoKey ? C.cyan : C.border, color: a.key === aoKey ? C.cyan : C.dim, background: a.key === aoKey ? "#152238" : "transparent" }}>
              {a.name.split(" · ")[0]}
            </button>
          ))}
        </div>
        {/* RIGHT — live readout + settings + world-map collapse */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden whitespace-nowrap font-mono text-[10px] md:inline" style={{ color: cursorLL ? C.gold : C.dim }}>
            {cursorLL ? coordAt(cursorLL.lat, cursorLL.lon) : coordAt(ao.center[0], ao.center[1])}
          </span>
          <button onClick={() => setShowSettings((s) => !s)} title="Settings"
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-semibold"
            style={{ borderColor: showSettings ? C.cyan : C.border, color: showSettings ? C.cyan : C.dim }}>
            <Settings className="h-3.5 w-3.5" /> SETTINGS
          </button>
          <Dots3 horizontal onClick={() => setTopOpen((v) => !v)} title={topOpen ? "Collapse world map" : "Expand world map"} />
        </div>
        {/* SETTINGS popover — grid · format · precision · units · elevation · pointer */}
        {showSettings && (
          <div className="absolute right-0 top-9 z-40 w-60 rounded-lg border p-3 shadow-xl" style={{ background: C.panel, borderColor: C.cyan }}>
            <div className="mb-2 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Mission Planning Settings</div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px]" style={{ color: C.text }}>1 km UTM grid</span>
              <button onClick={() => setGridOn(!gridOn)} className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ borderColor: gridOn ? C.green : C.border, color: gridOn ? C.green : C.dim }}><Grid3x3 className="h-3 w-3" />{gridOn ? "ON" : "OFF"}</button>
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
            <div className="mb-2 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
              {([["metric", "KM / M"], ["imperial", "MI / FT"]] as const).map(([u, label]) => (
                <button key={u} onClick={() => setUnits(u)} className="flex-1 px-2 py-1"
                  style={{ background: units === u ? "#152238" : "transparent", color: units === u ? C.cyan : C.dim }}>{label}</button>
              ))}
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px]" style={{ color: C.text }}>Elevation profiles</span>
              <button onClick={() => setElevOn(!elevOn)} className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ borderColor: elevOn ? C.gold : C.border, color: elevOn ? C.gold : C.dim }}>{elevOn ? "ON" : "OFF"}</button>
            </div>
            <div className="mb-1 text-[10px]" style={{ color: C.text }}>Pointer</div>
            <div className="flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
              {([["pointer", "DEFAULT"], ["target", "MINI-TARGET"]] as const).map(([m, label]) => (
                <button key={m} onClick={() => setCursor(m)} className="flex-1 px-2 py-1"
                  style={{ background: cursorMode === m ? "#152238" : "transparent", color: cursorMode === m ? C.cyan : C.dim }}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      {topOpen && (
        <div className="relative w-full" style={{ height: "min(80vh, 960px)", minHeight: 400 }}>
          <WorldStrip aoKey={aoKey} onSelect={(k) => { setAoKey(k); clearAo(); }} />
        </div>
      )}

      {/* AO TACTICAL MAP — picture-in-picture inset, bottom-right ⅓ of screen (min/corner/max) */}
      <div className="flex flex-col rounded-lg border shadow-2xl"
        style={insetMode === "max"
          ? { position: "fixed", top: "5rem", left: "0.75rem", right: "0.75rem", bottom: "0.75rem", zIndex: 40, background: C.panel, borderColor: C.cyan }
          : insetMode === "min"
          ? { position: "fixed", right: "0.75rem", bottom: "0.75rem", zIndex: 45, background: C.panel, borderColor: C.border }
          : { position: "fixed", right: "0.75rem", bottom: "0.75rem", width: "34vw", height: "34vh", minWidth: 320, minHeight: 240, zIndex: 45, background: C.panel, borderColor: C.border }}>
        {/* inset header — collapse (3-bullet) + maximize/restore */}
        <div className="flex items-center justify-between gap-2 border-b px-2 py-1" style={{ borderColor: C.border }}>
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
            AO · {ao.name.split(" · ")[0]}{insetMode === "min" ? " (collapsed)" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setInsetMode((m) => (m === "max" ? "corner" : "max"))} title={insetMode === "max" ? "Restore" : "Maximize"}
              className="rounded p-1 hover:bg-white/10" style={{ color: C.dim }}>
              {insetMode === "max" ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <Dots3 horizontal onClick={() => setInsetMode((m) => (m === "min" ? "corner" : "min"))} title={insetMode === "min" ? "Expand" : "Collapse"} />
          </div>
        </div>
        {insetMode !== "min" && (
          <div className="flex flex-wrap items-center gap-1 border-b px-2 py-0.5" style={{ borderColor: C.border }}>
            <span className="text-[7px] font-bold tracking-wider" style={{ color: C.dim }}>R-CORE</span>
            {RCORE_LANES.map((l) => (
              <span key={l.key} title={l.def} className="rounded px-1 text-[7px] font-bold" style={{ color: l.color, background: `${l.color}18` }}>{l.label}</span>
            ))}
          </div>
        )}
        {insetMode !== "min" && (
        <div className="grid min-h-0 flex-1 gap-3 overflow-auto p-2"
          style={{ gridTemplateColumns: insetMode === "max" ? `${leftOpen ? "260px" : "40px"} minmax(0,1fr)` : "minmax(0,1fr)" }}>
        {insetMode === "max" && (!leftOpen ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border p-2" style={{ background: C.panel, borderColor: C.border }}>
            <Dots3 onClick={() => setLeftOpen(true)} title="Expand palette" />
            <span className="text-[8px] font-semibold" style={{ color: C.dim, writingMode: "vertical-rl" }}>PALETTE</span>
          </div>
        ) : (
        /* LEFT PALETTE — ASSETS (equipment) · SUPPORT (GROK mission-support ontology) */
        <div className="rounded-lg border p-3" style={{ background: C.panel, borderColor: C.border }}>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex flex-1 overflow-hidden rounded border text-[10px] font-semibold" style={{ borderColor: C.border }}>
              {([["assets", "ASSETS"], ["support", "SUPPORT"]] as const).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} className="flex-1 px-2 py-1"
                  style={{ background: tab === t ? "#152238" : "transparent", color: tab === t ? C.cyan : C.dim }}>
                  {label}
                </button>
              ))}
            </div>
            <Dots3 onClick={() => setLeftOpen(false)} title="Collapse palette" />
          </div>
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
            <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
              {/* GROK Consolidated Canonical Object Ontology — mission-support evidence objects */}
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

          {/* Reality mode (Vision 2525 wrapper — reality/scenario separation) */}
          <div className="mt-3">
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Reality Mode · placed objects</div>
            <select value={reality} onChange={(e) => setReality(e.target.value as RealityMode)}
              className="w-full rounded border bg-transparent px-2 py-1 text-[10px]"
              style={{ borderColor: C.border, color: C.text }}>
              {REALITY_MODES.map((m) => <option key={m} value={m} style={{ background: C.panel }}>{m}</option>)}
            </select>
          </div>

          {routeMode && (
            <div className="mt-2 rounded border px-2 py-1 text-[9px]" style={{ borderColor: `${C.cyan}55`, color: C.cyan }}>
              ROUTE: right-click each via-point · left-click to finish{routeDraft.length ? ` · ${routeDraft.length} pt` : ""}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <button onClick={undo} title="Undo (Ctrl+Z)"
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

          {/* INSPECTOR — click a placed object (map or list) to edit it */}
          {selectedObj && selected && (
            <div className="mt-3 rounded border p-2" style={{ borderColor: C.cyan, background: "#0d1826" }}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold" style={{ color: C.cyan }}>
                  {selected.kind === "asset" ? ASSET_LABELS[(selectedObj as Placed).asset] : (selectedObj as PlacedSupport).def.term}
                </span>
                <button onClick={removeSelected} className="text-[9px] font-semibold" style={{ color: C.red }}>REMOVE</button>
              </div>
              <div className="mb-1 font-mono text-[9px]" style={{ color: C.gold }}>{coordAt(selectedObj.lat, selectedObj.lon)}</div>
              <div className="mb-1 text-[9px]" style={{ color: C.dim }}>Affiliation</div>
              <div className="mb-2 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
                {(["friendly", "hostile"] as Affiliation[]).map((a) => (
                  <button key={a} onClick={() => setAff(selected, a)} className="flex-1 px-2 py-1"
                    style={{ background: selectedObj.aff === a ? "#152238" : "transparent", color: selectedObj.aff === a ? (a === "hostile" ? C.red : C.cyan) : C.dim }}>
                    {a.toUpperCase()}
                  </button>
                ))}
              </div>
              {selected.kind === "support" && (
                <>
                  <div className="mb-1 text-[9px]" style={{ color: C.dim }}>Reality mode</div>
                  <select value={(selectedObj as PlacedSupport).reality} onChange={(e) => setPlacedReality(selected.id, e.target.value as RealityMode)}
                    className="mb-2 w-full rounded border bg-transparent px-2 py-1 text-[9px]" style={{ borderColor: C.border, color: C.text }}>
                    {REALITY_MODES.map((m) => <option key={m} value={m} style={{ background: C.panel }}>{m}</option>)}
                  </select>
                </>
              )}
              {/* PTL/2TL/3TL + sensor/radar FOV — unlocks for AD assets & radar */}
              {selected.kind === "asset" && ((selectedObj as Placed).tls || (selectedObj as Placed).fov) && (() => {
                const a = selectedObj as Placed;
                const u = a.unit ?? "deg";
                const unitOpts: AngleUnit[] = a.asset === "sentinel" ? ["deg", "ucrs", "mil"] : ["deg", "ucrs"];
                const upd = (key: "fov" | "p" | "s" | "t", tl: TL | null) => (key === "fov" ? updAsset(a.id, { fov: tl ?? undefined }) : setTL(a.id, key, tl));
                const numIn = (val: number, on: (deg: number) => void) => (
                  <input type="number" value={Math.round(toUnit(val, u))} onChange={(e) => on(fromUnit(parseFloat(e.target.value || "0"), u))}
                    className="w-full rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }} />
                );
                const tlRow = (key: "fov" | "p" | "s" | "t", label: string, tl: TL | null | undefined, col: string) => (
                  <div className="mb-1.5 rounded border p-1" style={{ borderColor: `${col}55` }}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[9px] font-bold" style={{ color: col }}>{label}</span>
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
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: C.dim }}>Angle unit</span>
                      <div className="flex overflow-hidden rounded border text-[8px] font-semibold" style={{ borderColor: C.border }}>
                        {unitOpts.map((un) => (
                          <button key={un} onClick={() => updAsset(a.id, { unit: un })} className="px-1.5 py-0.5"
                            style={{ background: u === un ? "#152238" : "transparent", color: u === un ? C.cyan : C.dim }}>{ANGLE_LABEL[un]}</button>
                        ))}
                      </div>
                    </div>
                    {a.fov && tlRow("fov", "SENSOR / RADAR FOV", a.fov, "#a78bfa")}
                    {a.tls && tlRow("p", "PTL / 1TL — points", a.tls.p, C.gold)}
                    {a.tls && tlRow("s", "2TL — secondary", a.tls.s, C.amber)}
                    {a.tls && tlRow("t", "3TL — tertiary", a.tls.t, C.cyan)}
                  </>
                );
              })()}
              <div className="mb-1 text-[9px]" style={{ color: C.dim }}>Nudge position (1 m)</div>
              <div className="grid grid-cols-3 gap-1">
                <span />
                <button onClick={() => nudge(selected, 1 / 111320, 0)} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>▲ N</button>
                <span />
                <button onClick={() => nudge(selected, 0, -1 / (111320 * Math.cos((selectedObj.lat * Math.PI) / 180)))} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>◀ W</button>
                <button onClick={() => nudge(selected, -1 / 111320, 0)} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>▼ S</button>
                <button onClick={() => nudge(selected, 0, 1 / (111320 * Math.cos((selectedObj.lat * Math.PI) / 180)))} className="rounded border py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>E ▶</button>
              </div>
            </div>
          )}

          {/* Placed manifest — click a row to inspect/edit */}
          {(placed.length > 0 || placedSupport.length > 0) && (
            <div className="mt-3 space-y-0.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Placed — {placed.length + placedSupport.length}</div>
              {placed.map((u) => (
                <button key={`a${u.id}`} onClick={() => setSelected({ kind: "asset", id: u.id })}
                  onMouseEnter={() => setHoverAsset(u.asset)}
                  onMouseLeave={() => setHoverAsset((h) => (h === u.asset ? null : h))}
                  className="flex w-full items-center justify-between gap-1 rounded px-1 py-0.5 text-left text-[9px] hover:bg-white/5"
                  style={{ background: (selected?.kind === "asset" && selected.id === u.id) || hoverAsset === u.asset ? "#152238" : "transparent", boxShadow: hoverAsset === u.asset ? `inset 0 0 0 1px ${C.cyan}` : undefined }}>
                  <span style={{ color: u.aff === "hostile" ? C.red : C.text }}>{ASSET_LABELS[u.asset]}{u.count > 1 ? ` ×${u.count}` : ""}</span>
                  <span className="font-mono" style={{ color: C.gold }}>{coordAt(u.lat, u.lon)}</span>
                </button>
              ))}
              {placedSupport.map((u) => (
                <button key={`s${u.id}`} onClick={() => setSelected({ kind: "support", id: u.id })}
                  className="flex w-full items-center justify-between gap-1 rounded px-1 py-0.5 text-left text-[9px] hover:bg-white/5"
                  style={{ background: selected?.kind === "support" && selected.id === u.id ? "#152238" : "transparent" }}>
                  <span className="truncate" style={{ color: u.aff === "hostile" ? C.red : u.def.color }}>{u.def.term}{u.path ? ` (${u.path.length}pt)` : ""}</span>
                  <span className="font-mono" style={{ color: C.gold }}>{coordAt(u.lat, u.lon)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Vision 2525 / R-CORE governance wrapper — REVIEW PLACEHOLDER */}
          <div className="mt-3 rounded border p-2" style={{ borderColor: `${C.gold}44`, background: `${C.gold}0a` }}>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.gold }}>
              Vision 2525 · R-CORE Wrapper
            </div>
            <p className="mt-1 text-[9px] leading-snug" style={{ color: C.dim }}>
              Governance stub active: every placed object carries <span style={{ color: C.text }}>reality_mode</span> +{" "}
              <span style={{ color: C.text }}>rcore_state=proposed</span>. Full packet (human authority, replay
              integrity, UCRS-2525, principle tags, alignment score) specified in{" "}
              <span style={{ color: C.text }}>docs/security-2525/ONTOLOGY_GOVERNANCE_VISION2525.md</span> · Consolidation 4.
            </p>
          </div>
        </div>
        ))}

        {/* AO MAP — adaptive MGRS grid · wheel-zoom · drag-pan · elevation profiles */}
        <div className="flex min-h-0 flex-col rounded-lg border p-3" style={{ background: C.panel, borderColor: C.border }}>
          <div className="relative mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
              {ao.name} — {fmtDist(view.spanKm * 1000)} AO
              <span style={{ color: C.dim }}> · GRID {fmtDist(grid.stepM)}</span>
            </span>
            <div className="flex items-center gap-2 text-[9px]" style={{ color: C.dim }}>
              {ao.field && (
                <div className="flex overflow-hidden rounded border font-semibold" style={{ borderColor: C.border }}>
                  {([[false, "2D"], [true, "3D"]] as const).map(([v, label]) => (
                    <button key={label} onClick={() => setVenue3d(v)} className="px-1.5 py-0.5"
                      style={{ background: venue3d === v ? "#152238" : "transparent", color: venue3d === v ? C.cyan : C.dim }}>{label}</button>
                  ))}
                </div>
              )}
              <button onClick={() => setView({ lat: ao.center[0], lon: ao.center[1], spanKm: ao.halfKm * 2, bearing: 0 })}
                className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: C.border }}>
                RESET VIEW
              </button>
              <span className="hidden lg:inline">WHEEL=ZOOM · DRAG=PAN · CLICK=SELECT/PLACE</span>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 gap-1">
          <div ref={mapRef}
            className={insetMode === "max" ? "relative aspect-square w-full flex-1 overflow-hidden rounded-md touch-none" : "relative h-full w-full overflow-hidden rounded-md touch-none"}
            style={{ background: "radial-gradient(ellipse at 50% 55%, #0f2033 0%, #070b12 75%)", border: `1px solid ${C.border}`, cursor: cursorMode === "target" ? "none" : armed ? "crosshair" : dragRef.current ? "grabbing" : "grab" }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = fracFromEvent(e);
              if (f) dropAt(e.dataTransfer.getData("text/plain"), f.fx, f.fy);
            }}
            onMouseLeave={() => { setCursorLL(null); setCursorPx(null); }}>
            {/* rotated inner canvas (RENDER× size) — CSS bearing rotation; content via toFrac */}
            <div className="pointer-events-none absolute" style={{ inset: `${-OFF * 100}%`, transform: `rotate(${view.bearing}rad)`, transformOrigin: "center" }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* OSM roads (grey + lighter-grey casing) + waterways (blue) — bottom layer */}
              {osmPaths && (
                <g>
                  <path d={osmPaths.polyD} fill="#38bdf822" stroke="#38bdf8" strokeWidth="0.15" />
                  <path d={osmPaths.waterD} fill="none" stroke="#38bdf8" strokeWidth="0.35" opacity="0.85" strokeLinecap="round" />
                  {/* casing (lighter grey filler) */}
                  <path d={osmPaths.tiers[2]} fill="none" stroke="#cbd5e1" strokeWidth="0.55" opacity="0.16" strokeLinecap="round" />
                  <path d={osmPaths.tiers[3]} fill="none" stroke="#cbd5e1" strokeWidth="1.0" opacity="0.2" strokeLinecap="round" />
                  <path d={osmPaths.tiers[4]} fill="none" stroke="#cbd5e1" strokeWidth="1.6" opacity="0.22" strokeLinecap="round" />
                  {/* road fill (grey; arterials brighter) */}
                  <path d={osmPaths.tiers[2]} fill="none" stroke="#94a3b8" strokeWidth="0.22" opacity="0.5" strokeLinecap="round" />
                  <path d={osmPaths.tiers[3]} fill="none" stroke="#b6c2d1" strokeWidth="0.5" opacity="0.7" strokeLinecap="round" />
                  <path d={osmPaths.tiers[4]} fill="none" stroke="#e5e7eb" strokeWidth="0.85" opacity="0.8" strokeLinecap="round" />
                </g>
              )}
              {/* 1 km UTM grid — toggleable */}
              {gridOn && grid.vertical.map((l) => (
                <line key={`v${l.km}${l.frac}`} x1={l.frac * 100} y1="0" x2={l.frac * 100} y2="100"
                  stroke={C.border} strokeWidth="0.25" />
              ))}
              {gridOn && grid.horizontal.map((l) => (
                <line key={`h${l.km}${l.frac}`} x1="0" y1={l.frac * 100} x2="100" y2={l.frac * 100}
                  stroke={C.border} strokeWidth="0.25" />
              ))}
              {/* buildings — EXTERIOR corners + dome only (edge wireframe later) */}
              {ao.buildings.map((b) => {
                const pts = b.footprint
                  .map(([e, n]) => bldFrac(b, e, n))
                  .map((f) => `${(f.fx * 100).toFixed(2)},${(f.fy * 100).toFixed(2)}`)
                  .join(" ");
                const dome = b.dome ? bldFrac(b, b.dome[0], b.dome[1]) : null;
                const domeR = b.dome ? (b.dome[2] / boxW) * 100 : 0;
                const door = b.door ? bldFrac(b, b.door[0], b.door[1]) : null;
                return (
                  <g key={b.label}>
                    <polygon points={pts} fill={`${C.land}11`} stroke={C.land} strokeWidth="0.35" strokeLinejoin="round" />
                    {/* corner emphasis */}
                    {b.footprint.map(([e, n], i) => {
                      const f = bldFrac(b, e, n);
                      return <circle key={i} cx={f.fx * 100} cy={f.fy * 100} r="0.45" fill={C.land} />;
                    })}
                    {dome && <circle cx={dome.fx * 100} cy={dome.fy * 100} r={domeR} fill="none" stroke={C.gold} strokeWidth="0.35" />}
                    {door && <circle cx={door.fx * 100} cy={door.fy * 100} r="0.55" fill="none" stroke={C.cyan} strokeWidth="0.3" />}
                    {/* window ticks (ambitious extra) */}
                    {b.label === "TEXAS CAPITOL" && windows.map(([e, n], i) => {
                      const f = bldFrac(b, e, n);
                      return <circle key={`w${i}`} cx={f.fx * 100} cy={f.fy * 100} r="0.18" fill={C.land} opacity="0.7" />;
                    })}
                  </g>
                );
              })}
              {/* THE PfIELD — detailed stadium wireframe (field markings, numbers,
                  field goals, seats, concourse) overlaid on the real turf. */}
              {ao.field && <PfieldVenue corners={ao.field} toFrac={toFrac} mode={venue3d ? "3d" : "2d"} />}

              {/* Sensor/radar FOV + PTL/2TL/3TL target-line sectors (geographic bearing) */}
              {placed.map((u) => {
                if (!u.tls && !u.fov) return null;
                const c = toFrac(u.lat, u.lon); const cx = c.fx * 100, cy = c.fy * 100;
                const line = (R: number, brg: number, col: string) =>
                  <line x1={cx} y1={cy} x2={cx + R * Math.sin((brg * Math.PI) / 180)} y2={cy - R * Math.cos((brg * Math.PI) / 180)} stroke={col} strokeWidth="0.45" />;
                const TLS: [TL | undefined, string, number, string][] = [
                  [u.fov, "#a78bfa", 30, "FOV"],
                  [u.tls?.p, C.gold, 22, "PTL"],
                  [u.tls?.s, C.amber, 20, "2TL"],
                  [u.tls?.t, C.cyan, 18, "3TL"],
                ];
                return (
                  <g key={`tl${u.id}`}>
                    {TLS.map(([tl, col, R], i) => tl && (
                      <g key={i}>
                        <path d={sectorPath(cx, cy, R, tl)} fill={`${col}1f`} stroke={`${col}66`} strokeWidth="0.25" />
                        {line(R, tl.brg, col)}
                      </g>
                    ))}
                  </g>
                );
              })}

              {/* committed routes (line/corridor) — polylines through their vertices */}
              {placedSupport.filter((u) => u.path).map((u) => {
                const pts = u.path!.map((p) => toFrac(p.lat, p.lon));
                const d = pts.map((f, i) => `${i ? "L" : "M"}${(f.fx * 100).toFixed(2)} ${(f.fy * 100).toFixed(2)}`).join(" ");
                const dash = u.def.key === "restricted_route" || u.def.color === "#ef4444";
                return (
                  <g key={`rt${u.id}`}>
                    <path d={d} fill="none" stroke={u.def.color} strokeWidth="0.45" strokeDasharray={dash ? "1.5 1" : undefined} strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
                    {pts.map((f, i) => <circle key={i} cx={f.fx * 100} cy={f.fy * 100} r="0.55" fill={u.def.color} />)}
                  </g>
                );
              })}
              {/* in-progress route draft (right-click vertices, left-click to finish) */}
              {routeMode && routeDraft.length > 0 && (() => {
                const pts = routeDraft.map((p) => toFrac(p.lat, p.lon));
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
              {/* grid km labels — rotate with the canvas */}
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
                <div key={lm.name} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%` }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: C.gold }} />
                  <span className="whitespace-nowrap text-[8px] font-semibold" style={{ color: C.gold }}>{lm.name}</span>
                </div>
              );
            })}
            {/* placed assets — left-click SELECTS (video-game / AMDWS designate) */}
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
                  title={`${ASSET_LABELS[u.asset]} — ${coordAt(u.lat, u.lon)}`}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%`, zIndex: hot ? 15 : undefined }}>
                  {hot && <span className="absolute h-10 w-10 animate-ping rounded-full" style={{ boxShadow: `0 0 0 2px ${C.cyan}`, background: `${C.cyan}22`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                  {sel && <span className="absolute h-8 w-8 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.gold}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                  <AssetIcon asset={u.asset} style={iconStyle} affiliation={u.aff} size={28} count={u.count} />
                  <span className="whitespace-nowrap font-mono text-[8px]" style={{ color: C.text }}>
                    {mgrsAt(u.lat, u.lon).split(" ").slice(2).join(" ")}
                  </span>
                </button>
              );
            })}
            {/* placed mission-support objects — left-click SELECTS */}
            {placedSupport.map((u) => {
              const f = project(u.lat, u.lon);
              if (f.fx < -0.05 || f.fx > 1.05 || f.fy < -0.05 || f.fy > 1.05) return null;
              const sel = selected?.kind === "support" && selected.id === u.id;
              return (
                <button key={u.id}
                  onPointerUp={(e) => { if (!dragRef.current?.moved) { e.stopPropagation(); setSelected({ kind: "support", id: u.id }); } }}
                  title={`${u.def.term} · ${u.reality} — ${coordAt(u.lat, u.lon)}`}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%` }}>
                  {sel && <span className="absolute h-7 w-7 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.gold}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                  <SupportGlyph glyph={u.def.glyph} color={u.aff === "hostile" ? "#ef4444" : u.def.color} size={22} />
                  <span className="whitespace-nowrap font-mono text-[8px]" style={{ color: C.text }}>
                    {mgrsAt(u.lat, u.lon).split(" ").slice(2).join(" ")}
                  </span>
                </button>
              );
            })}
            {/* Rotating COMPASS rose — right-drag rotates the map; click resets north.
                N tracks true north; heading-up bearing shown below. */}
            <button
              onClick={() => {
                if (Math.abs(view.bearing) < 1e-4 && bearingMemo.current != null) {
                  const b = bearingMemo.current; bearingMemo.current = null; setView((v) => ({ ...v, bearing: b })); // restore
                } else {
                  bearingMemo.current = view.bearing; setView((v) => ({ ...v, bearing: 0 })); // snap north-up
                }
              }}
              title={Math.abs(view.bearing) < 1e-4 && bearingMemo.current != null ? "Restore previous heading" : "Snap north-up"}
              className="absolute left-2 top-2 z-20 rounded-full" style={{ background: "#0a0f16cc" }}>
              <svg width="46" height="46" viewBox="-23 -23 46 46" aria-label="Compass">
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
            {/* faint fixed center crosshair (view center) */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2" style={{ borderLeft: `1px solid ${C.dim}`, borderTop: `1px solid ${C.dim}`, opacity: 0.5 }} />
            {/* 360° bearing scale around the map edges — rotates with the map */}
            {(() => {
              const topHeading = ((-view.bearing * 180 / Math.PI) % 360 + 360) % 360;
              const marks: React.ReactNode[] = [];
              for (let deg = 0; deg < 360; deg += 10) {
                const th = (deg - topHeading) * Math.PI / 180;
                const dx = Math.sin(th), dy = -Math.cos(th);
                const t = Math.min(0.5 / Math.max(Math.abs(dx), 1e-9), 0.5 / Math.max(Math.abs(dy), 1e-9));
                const bx = 0.5 + dx * t, by = 0.5 + dy * t; // border point (0..1)
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
            {/* armed tool ghost — the icon rides the CENTER of the cursor for
                precise placement (click drops it exactly there) */}
            {armed && cursorPx && !routeMode && (
              <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-75"
                style={{ left: cursorPx.x, top: cursorPx.y }}>
                {selectedAsset
                  ? <AssetIcon asset={selectedAsset} style={iconStyle} affiliation="friendly" size={30} count={inventory.find((i) => i.asset === selectedAsset)?.group ?? 1} />
                  : selectedSupport ? <SupportGlyph glyph={selectedSupport.glyph} color={selectedSupport.color} size={26} /> : null}
              </div>
            )}
            {/* 3-layer mini-target cursor (center dot + circle 1 + circle 2) */}
            {cursorMode === "target" && cursorPx && (
              <svg className="pointer-events-none absolute" width="44" height="44"
                style={{ left: cursorPx.x - 22, top: cursorPx.y - 22 }}>
                <circle cx="22" cy="22" r="20" fill="none" stroke={C.cyan} strokeWidth="1" opacity="0.5" />
                <circle cx="22" cy="22" r="11" fill="none" stroke={C.cyan} strokeWidth="1" opacity="0.8" />
                <circle cx="22" cy="22" r="1.6" fill={C.gold} />
                <line x1="22" y1="2" x2="22" y2="9" stroke={C.cyan} strokeWidth="1" />
                <line x1="22" y1="35" x2="22" y2="42" stroke={C.cyan} strokeWidth="1" />
                <line x1="2" y1="22" x2="9" y2="22" stroke={C.cyan} strokeWidth="1" />
                <line x1="35" y1="22" x2="42" y2="22" stroke={C.cyan} strokeWidth="1" />
              </svg>
            )}
            {/* SCALE BAR (bottom-right) — one grid-step wide, map-proportional */}
            <div className="pointer-events-none absolute bottom-1.5 left-2 right-2 flex flex-col items-end gap-0.5">
              <span className="font-mono text-[8px]" style={{ color: C.text }}>{fmtDist(grid.stepM)}</span>
              <div style={{ width: `${(grid.stepM / (view.spanKm * 1000)) * 100}%`, height: 4, borderLeft: `1px solid ${C.text}`, borderRight: `1px solid ${C.text}`, borderBottom: `2px solid ${C.text}` }} />
            </div>
          </div>

          {/* RIGHT ELEVATION SCALE — vertical profile across the AO center column */}
          {elevOn && insetMode === "max" && (
            <div className="relative w-12 shrink-0 self-stretch overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
              <svg viewBox="0 0 40 100" preserveAspectRatio="none" className="h-full w-full">
                <path d={elevProfile.rightPath} fill={`${C.gold}22`} stroke={C.gold} strokeWidth="0.6" />
              </svg>
              <span className="absolute right-0.5 top-0.5 font-mono text-[7px]" style={{ color: C.gold }}>{fmtElev(elevProfile.max)}</span>
              <span className="absolute bottom-0.5 right-0.5 font-mono text-[7px]" style={{ color: C.dim }}>{fmtElev(elevProfile.min)}</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[7px] font-semibold tracking-wider" style={{ color: C.dim }}>ELEV N→S</span>
            </div>
          )}
          </div>

          {/* BOTTOM ELEVATION PROFILE — user-resizable (drag the handle: ~1/3 → 2/3) */}
          {elevOn && insetMode === "max" && (
            <>
              <div
                onPointerDown={(e) => { bottomDrag.current = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); }}
                onPointerMove={(e) => {
                  if (bottomDrag.current == null) return;
                  const dy = e.clientY - bottomDrag.current;
                  bottomDrag.current = e.clientY;
                  const max = typeof window !== "undefined" ? Math.round(window.innerHeight * 0.55) : 500;
                  setBottomH((h) => Math.max(36, Math.min(max, h - dy)));
                }}
                onPointerUp={() => { bottomDrag.current = null; }}
                className="mt-1 flex h-3 cursor-row-resize items-center justify-center rounded"
                style={{ background: "transparent" }} title="Drag to resize the elevation panel">
                <span className="h-0.5 w-10 rounded-full" style={{ background: C.border }} />
              </div>
              <div ref={bottomRef} className="relative overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12", height: bottomH }}>
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
                  {/* contour reference lines (nice elevation step) */}
                  {elevProfile.contours.map((lv) => {
                    const yy = elevProfile.y(lv);
                    return <line key={lv} x1="0" y1={yy} x2="100" y2={yy} stroke={C.land} strokeWidth="0.15" opacity="0.25" />;
                  })}
                  {/* pseudo-3D back rows */}
                  {elevProfile.rows.map((d, i) => (
                    <path key={i} d={d} fill="none" stroke={C.land} strokeWidth="0.35" opacity={0.2 + 0.5 * (i / (elevProfile.rows.length - 1))} />
                  ))}
                  {/* green LAND fill (blue baseline = water datum reference) */}
                  <path d={elevProfile.frontFill} fill={`${C.land}18`} stroke={C.land} strokeWidth="0.6" />
                  <line x1="0" y1="39.5" x2="100" y2="39.5" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
                  {/* HIGH ▲ / LOW ▼ within view */}
                  <g>
                    <circle cx={elevProfile.high.x} cy={elevProfile.high.yy} r="0.9" fill={C.gold} />
                    <circle cx={elevProfile.low.x} cy={elevProfile.low.yy} r="0.9" fill="#38bdf8" />
                  </g>
                </svg>
                <span className="absolute left-1 top-0.5 text-[7px] font-semibold tracking-wider" style={{ color: C.dim }}>
                  ELEVATION · W→E · GREEN=LAND · CONTOUR {fmtElev(elevProfile.step)} · SYNTHETIC (DEM PENDING)
                </span>
                {/* HIGH / LOW callouts within current view */}
                <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${elevProfile.high.x}%`, top: 10 }}>
                  <span className="whitespace-nowrap rounded px-1 text-[7px] font-bold" style={{ background: "#0a0f16cc", color: C.gold }}>
                    ▲ HIGH {fmtElev(elevProfile.high.e)} · {coordAt(elevProfile.high.lat, elevProfile.high.lon)}
                  </span>
                </span>
                <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${elevProfile.low.x}%`, bottom: 10 }}>
                  <span className="whitespace-nowrap rounded px-1 text-[7px] font-bold" style={{ background: "#0a0f16cc", color: "#38bdf8" }}>
                    ▼ LOW {fmtElev(elevProfile.low.e)} · {coordAt(elevProfile.low.lat, elevProfile.low.lon)}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
        </div>
        )}
      </div>
    </div>
  );
}
