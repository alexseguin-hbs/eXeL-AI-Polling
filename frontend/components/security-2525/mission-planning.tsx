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
import { Grid3x3, MapPin, Trash2, ChevronRight, Settings } from "lucide-react";
import {
  AssetIcon, ASSET_LABELS, type AssetKind, type IconStyle,
} from "@/components/security-2525/asset-icons";
import { latLonToMgrs, utmKmGrid, chooseGridStep } from "@/components/security-2525/mgrs";
import {
  SUPPORT_CATALOG, GROUP_META, REALITY_MODES,
  type SupportObjectDef, type MarkerGlyph, type LegendGroup, type RealityMode,
} from "@/components/security-2525/mission-support";

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
}

const AOS: Ao[] = [
  {
    key: "mabry",
    name: "CAMP MABRY · AUSTIN TX",
    center: [30.316, -97.7639],
    halfKm: 6,
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
    landmarks: [{ name: "GOVERNOR'S MANSION", lat: 30.2724, lon: -97.7443 }],
    buildings: [TX_CAPITOL],
  },
  {
    // Drone-play test venue: THE PFIELD (Pflugerville ISD stadium, opened 2017).
    // Real turf corners (operator-surveyed via Google Maps). Long-axis ≈ N-S.
    // Small AO for 12-digit precision + A→B→C object-movement testing.
    key: "pfield",
    name: "THE PFIELD · PFLUGERVILLE TX",
    center: [30.4485425, -97.6344145], // mean of the 4 corners
    halfKm: 0.09,
    precision: 6, // 12-digit (0.1 m)
    landmarks: [{ name: "The Pfield", lat: 30.4485425, lon: -97.6344145 }],
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

interface Placed {
  id: number;
  asset: AssetKind;
  count: number;
  fx: number; // 0..1 across AO box
  fy: number;
  mgrs10: string; // stored at max precision; displayed per current setting
  lat: number;
  lon: number;
}

// ── World border context strip (Natural Earth 50m, self-hosted) ──────────────
interface BorderData { countries: [number, number][][]; usStates: [number, number][][] }
let borderCache: BorderData | null = null;

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
function GlobeView({ data, aoKey, onSelect }: { data: BorderData | null; aoKey: string; onSelect: (k: string) => void }) {
  const CX = 170, CY = 170, RING = 148;
  const D = Math.PI / 180;
  // Drag-rotate (lat0/lon0) + wheel-zoom (R) — video-game orbit navigation.
  const [rot, setRot] = useState({ lat0: 38, lon0: -97, R: 128 });
  const dref = useRef<{ x: number; y: number } | null>(null);
  // Recenter the globe on the selected AO when a tab is clicked.
  useEffect(() => {
    const sel = AOS.find((a) => a.key === aoKey);
    if (sel) setRot((r) => ({ ...r, lat0: sel.center[0], lon0: sel.center[1] }));
  }, [aoKey]);
  const { lat0: LAT0, lon0: LON0, R } = rot;
  const proj = (lat: number, lon: number): [number, number, boolean] => {
    const p = lat * D, l = (lon - LON0) * D, p0 = LAT0 * D;
    const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    return [
      CX + R * Math.cos(p) * Math.sin(l),
      CY - R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
      cosc > 0,
    ];
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
  }, [rot]);
  const borders = useMemo(() => (data ? {
    countries: data.countries.map(pathOf).join(""),
    states: data.usStates.map(pathOf).join(""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  } : null), [data, rot]);
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
    <svg viewBox="0 0 340 340" className="mx-auto block h-[300px] w-[300px] touch-none select-none sm:h-[340px] sm:w-[340px]" role="img"
      aria-label="Wireframe globe — North America centered, bearing ring, lat/lon graticule"
      style={{ cursor: dref.current ? "grabbing" : "grab" }}
      onWheel={(e) => setRot((r) => ({ ...r, R: Math.min(320, Math.max(90, r.R * (e.deltaY > 0 ? 1 / 1.12 : 1.12))) }))}
      onPointerDown={(e) => { dref.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => {
        const d = dref.current;
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        d.x = e.clientX; d.y = e.clientY;
        setRot((r) => ({ ...r, lon0: r.lon0 - dx * 0.5, lat0: Math.min(85, Math.max(-85, r.lat0 + dy * 0.5)) }));
      }}
      onPointerUp={() => { dref.current = null; }}>
      {/* bearing ring 000–350 */}
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke={C.cyan} strokeWidth="0.6" opacity="0.7" />
      {ticks}
      {/* globe */}
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
        const active = ao.key === aoKey;
        return (
          <g key={ao.key} onClick={() => onSelect(ao.key)} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={active ? 6 : 4} fill="none" stroke={C.gold} strokeWidth="1" opacity={active ? 1 : 0.7} />
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
  useEffect(() => {
    if (borderCache) return;
    fetch("/security-2525/borders-ne50m.json")
      .then((r) => r.json())
      .then((d: BorderData) => { borderCache = d; setData(d); })
      .catch(() => {}); // context view — AO map works without it
  }, []);
  const W = 720, H = 360;
  const paths = useMemo(() => {
    if (!data) return null;
    return {
      countries: data.countries.map((r) => ringPath(r, W, H)).join(""),
      states: data.usStates.map((r) => ringPath(r, W, H)).join(""),
    };
  }, [data]);
  // Flat map: pan (drag) + zoom (wheel) via a live viewBox, same as the AO map.
  const [flat, setFlat] = useState({ x: 0, y: H * 0.08, w: W, h: H * 0.62 });
  const flatDrag = useRef<{ x: number; y: number } | null>(null);
  const flatSvg = useRef<SVGSVGElement>(null);
  const vbAt = (clientX: number, clientY: number) => {
    const r = flatSvg.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: flat.x + ((clientX - r.left) / r.width) * flat.w, y: flat.y + ((clientY - r.top) / r.height) * flat.h };
  };
  return (
    <div className="relative overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
      {mode === "globe" ? (
        <GlobeView data={data} aoKey={aoKey} onSelect={onSelect} />
      ) : (
        <svg ref={flatSvg} viewBox={`${flat.x} ${flat.y} ${flat.w} ${flat.h}`} className="block w-full touch-none" role="img"
          style={{ cursor: flatDrag.current ? "grabbing" : "grab" }}
          aria-label="World context — country borders + US state borders (Natural Earth 50m)"
          onWheel={(e) => {
            e.preventDefault();
            const p = vbAt(e.clientX, e.clientY);
            if (!p) return;
            const k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
            setFlat((f) => {
              const w = Math.min(W, Math.max(20, f.w * k)), h = w * (f.h / f.w);
              return { w, h, x: p.x - ((p.x - f.x) / f.w) * w, y: p.y - ((p.y - f.y) / f.h) * h };
            });
          }}
          onPointerDown={(e) => { flatDrag.current = { x: e.clientX, y: e.clientY }; }}
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
              <path d={paths.countries} fill="none" stroke={C.borderCountry} strokeWidth="0.45" opacity="0.55" />
              <path d={paths.states} fill="none" stroke={C.borderState} strokeWidth="0.35" opacity="0.5" />
            </>
          )}
          {AOS.map((ao) => {
            const x = ((ao.center[1] + 180) / 360) * W;
            const y = ((90 - ao.center[0]) / 180) * H;
            const active = ao.key === aoKey;
            return (
              <g key={ao.key} onClick={() => onSelect(ao.key)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={active ? 5 : 3.5} fill="none" stroke={C.cyan} strokeWidth="1" opacity={active ? 1 : 0.6} />
                <circle cx={x} cy={y} r="1.4" fill={C.cyan} />
              </g>
            );
          })}
        </svg>
      )}
      <div className="absolute right-2 top-2 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
        {(["globe", "flat"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className="px-2 py-0.5"
            style={{ background: mode === m ? "#152238" : "transparent", color: mode === m ? C.cyan : C.dim }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      <span className="absolute bottom-1 right-2 text-[8px]" style={{ color: C.dim }}>
        NATURAL EARTH 50m · COUNTRIES + US STATES · ELEVATION/SUBSURFACE LAYERS PENDING
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
      case "infra": default: return <><rect x="6" y="8" width="12" height="11" {...s} /><path d="M9 8V5h6v3M9 12h2M13 12h2M9 15h2M13 15h2" {...s} /></>;
    }
  })();
  return <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={glyph}>{body}</svg>;
}

interface PlacedSupport {
  id: number; def: SupportObjectDef; fx: number; fy: number; lat: number; lon: number; reality: RealityMode;
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
  useEffect(() => {
    try { const v = localStorage.getItem("sec2525.cursorMode"); if (v === "target" || v === "pointer") setCursorMode(v); } catch { /* no storage */ }
  }, []);
  const setCursor = (m: "pointer" | "target") => { setCursorMode(m); try { localStorage.setItem("sec2525.cursorMode", m); } catch { /* no storage */ } };
  const idRef = useRef(1);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const bottomDrag = useRef<number | null>(null);

  const ao = AOS.find((a) => a.key === aoKey) ?? AOS[0];
  // Live view — wheel zooms spanKm, right-drag pans lat/lon. AO buttons reset it.
  const [view, setView] = useState(() => ({ lat: ao.center[0], lon: ao.center[1], spanKm: ao.halfKm * 2 }));
  useEffect(() => {
    setView({ lat: ao.center[0], lon: ao.center[1], spanKm: ao.halfKm * 2 });
    if (ao.precision) setDigits(ao.precision); // e.g. Pfield → 12-digit
  }, [aoKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const panRef = useRef<{ x: number; y: number } | null>(null);

  const box = useMemo(() => {
    const halfKm = view.spanKm / 2;
    const dLat = halfKm / 110.574;
    const dLon = halfKm / (111.32 * Math.cos((view.lat * Math.PI) / 180));
    return { latMin: view.lat - dLat, latMax: view.lat + dLat, lonMin: view.lon - dLon, lonMax: view.lon + dLon };
  }, [view]);
  const grid = useMemo(
    () => utmKmGrid(box.latMin, box.latMax, box.lonMin, box.lonMax, chooseGridStep(view.spanKm * 1000)),
    [box, view.spanKm]
  );
  const gridLabel = grid.stepM >= 1000 ? `${grid.stepM / 1000} KM` : `${grid.stepM} M`;
  // AO box width in meters — scales building-overlay radii (dome) to screen %
  const boxW = (box.lonMax - box.lonMin) * 111320 * Math.cos((ao.center[0] * Math.PI) / 180);

  const toLatLon = (fx: number, fy: number) => ({
    lat: box.latMax - fy * (box.latMax - box.latMin),
    lon: box.lonMin + fx * (box.lonMax - box.lonMin),
  });
  const toFrac = (lat: number, lon: number) => ({
    fx: (lon - box.lonMin) / (box.lonMax - box.lonMin),
    fy: (box.latMax - lat) / (box.latMax - box.latMin),
  });
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

  const fracFromEvent = (e: { clientX: number; clientY: number }) => {
    const r = mapRef.current?.getBoundingClientRect();
    if (!r) return null;
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
    return { fx, fy };
  };

  // Wheel zoom toward the cursor (video-game / AMDWS style). spanKm clamps to a
  // ~300 m minimum (city-block detail) and 200 km maximum (regional).
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const f = fracFromEvent(e);
    if (!f) return;
    const cur = toLatLon(f.fx, f.fy);
    setView((v) => {
      // min 0.08 km (80 m box → 10 m grid, 8-digit MGRS resolution); max 200 km
      const span = Math.min(200, Math.max(0.08, v.spanKm * (e.deltaY > 0 ? 1.15 : 1 / 1.15)));
      const ratio = span / v.spanKm;
      return { spanKm: span, lat: cur.lat + (v.lat - cur.lat) * ratio, lon: cur.lon + (v.lon - cur.lon) * ratio };
    });
  };

  // Grab-drag pan (left OR right button — right also suppresses the context menu).
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const r = mapRef.current?.getBoundingClientRect();
    if (r) setCursorPx({ x: e.clientX - r.left, y: e.clientY - r.top });
    const f = fracFromEvent(e);
    if (f) setCursorLL(toLatLon(f.fx, f.fy));
    const d = dragRef.current;
    if (!d || !r) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    d.x = e.clientX; d.y = e.clientY;
    setView((v) => {
      const halfKm = v.spanKm / 2;
      const dLat = halfKm / 110.574, dLon = halfKm / (111.32 * Math.cos((v.lat * Math.PI) / 180));
      return { ...v, lat: v.lat + (dy / r.height) * (2 * dLat), lon: v.lon - (dx / r.width) * (2 * dLon) };
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d?.moved) return; // a pan, not a click — don't place/deselect
    const f = fracFromEvent(e);
    if (!f) return;
    if (selectedAsset) place(selectedAsset, f.fx, f.fy);
    else if (selectedSupport) placeSupport(selectedSupport, f.fx, f.fy);
    else setSelected(null); // empty click clears selection
  };

  const place = (asset: AssetKind, fx: number, fy: number) => {
    const item = inventory.find((i) => i.asset === asset);
    if (!item || item.stock < item.group) return;
    const { lat, lon } = toLatLon(fx, fy);
    setInventory((inv) => inv.map((i) => (i.asset === asset ? { ...i, stock: i.stock - i.group } : i)));
    setPlaced((p) => [...p, {
      id: idRef.current++, asset, count: item.group, fx, fy, lat, lon, mgrs10: latLonToMgrs(lat, lon, 5),
    }]);
  };

  const remove = (unit: Placed) => {
    setPlaced((p) => p.filter((u) => u.id !== unit.id));
    setInventory((inv) => inv.map((i) => (i.asset === unit.asset ? { ...i, stock: i.stock + unit.count } : i)));
  };

  const placeSupport = (def: SupportObjectDef, fx: number, fy: number) => {
    const { lat, lon } = toLatLon(fx, fy);
    setPlacedSupport((p) => [...p, { id: idRef.current++, def, fx, fy, lat, lon, reality }]);
  };

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
    <div className="space-y-3 p-3">
      <WorldStrip aoKey={aoKey} onSelect={(k) => { setAoKey(k); clearAo(); }} />

      {/* Zoom ladder breadcrumb — NORTH AMERICA › TEXAS/WASHINGTON › AO */}
      <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wide" style={{ color: C.dim }}>
        {["NORTH AMERICA", ao.key === "jblm" ? "WASHINGTON" : "TEXAS", ao.name.split(" · ")[0]].map((crumb, i, a) => (
          <span key={crumb} className="flex items-center gap-1">
            <span style={{ color: i === a.length - 1 ? C.cyan : C.dim }}>{crumb}</span>
            {i < a.length - 1 && <ChevronRight className="h-3 w-3" style={{ color: C.border }} />}
          </span>
        ))}
      </div>

      {/* AO location toggle — scrolls left↔right */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {AOS.map((a) => (
          <button key={a.key} onClick={() => { setAoKey(a.key); clearAo(); }}
            className="shrink-0 whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold tracking-wide"
            style={{ borderColor: a.key === aoKey ? C.cyan : C.border, color: a.key === aoKey ? C.cyan : C.dim, background: a.key === aoKey ? "#152238" : "transparent" }}>
            {a.name}
          </button>
        ))}
      </div>

      {/* Controls: grid · MGRS/LLV-DMS format · precision · live readout */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setGridOn(!gridOn)}
          className="flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold"
          style={{ borderColor: gridOn ? C.green : C.border, color: gridOn ? C.green : C.dim }}>
          <Grid3x3 className="h-3 w-3" /> GRID {gridOn ? "ON" : "OFF"}
        </button>
        <div className="flex overflow-hidden rounded border text-[10px] font-semibold" style={{ borderColor: C.border }}>
          {([["mgrs", "MGRS"], ["dms", "LLV-DMS"]] as const).map(([f, label]) => (
            <button key={f} onClick={() => setCoordFmt(f)} className="px-2 py-1"
              style={{ background: coordFmt === f ? "#152238" : "transparent", color: coordFmt === f ? C.cyan : C.dim }}>{label}</button>
          ))}
        </div>
        {PRECISIONS.map((p) => (
          <button key={p.d} onClick={() => setDigits(p.d)} title={p.hint}
            className="rounded border px-2 py-1 text-[10px] font-semibold"
            style={{ borderColor: digits === p.d ? C.amber : C.border, color: digits === p.d ? C.amber : C.dim, background: digits === p.d ? "#2a230f" : "transparent" }}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto whitespace-nowrap font-mono text-[11px]" style={{ color: cursorLL ? C.gold : C.dim }}>
          {cursorLL ? coordAt(cursorLL.lat, cursorLL.lon) : `${coordAt(ao.center[0], ao.center[1])} · CENTER`}
        </span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "260px minmax(0,1fr)" }}>
        {/* LEFT PALETTE — ASSETS (equipment) · SUPPORT (GROK mission-support ontology) */}
        <div className="rounded-lg border p-3" style={{ background: C.panel, borderColor: C.border }}>
          <div className="mb-2 flex overflow-hidden rounded border text-[10px] font-semibold" style={{ borderColor: C.border }}>
            {([["assets", "ASSETS"], ["support", "SUPPORT"]] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 px-2 py-1"
                style={{ background: tab === t ? "#152238" : "transparent", color: tab === t ? C.cyan : C.dim }}>
                {label}
              </button>
            ))}
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
                    className="flex cursor-grab items-center gap-2 rounded border px-2 py-1.5 select-none"
                    style={{ borderColor: isArmed ? C.cyan : C.border, background: isArmed ? "#152238" : "transparent", opacity: empty ? 0.35 : 1 }}>
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

          <button onClick={clearAo}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border px-2 py-1.5 text-[10px] font-semibold hover:bg-white/5"
            style={{ borderColor: `${C.red}44`, color: C.red }}>
            <Trash2 className="h-3 w-3" /> CLEAR PLACEMENTS
          </button>

          {/* Placed manifest with live-precision MGRS */}
          {(placed.length > 0 || placedSupport.length > 0) && (
            <div className="mt-3 space-y-1">
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Placed — {placed.length + placedSupport.length}</div>
              {placed.map((u) => (
                <div key={`a${u.id}`} className="flex items-center justify-between gap-1 text-[9px]">
                  <span style={{ color: C.text }}>{ASSET_LABELS[u.asset]}{u.count > 1 ? ` ×${u.count}` : ""}</span>
                  <span className="font-mono" style={{ color: C.gold }}>{coordAt(u.lat, u.lon)}</span>
                </div>
              ))}
              {placedSupport.map((u) => (
                <div key={`s${u.id}`} className="flex items-center justify-between gap-1 text-[9px]">
                  <span className="truncate" style={{ color: u.def.color }}>{u.def.term}</span>
                  <span className="font-mono" style={{ color: C.gold }}>{coordAt(u.lat, u.lon)}</span>
                </div>
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

        {/* AO MAP — adaptive MGRS grid · wheel-zoom · drag-pan · elevation profiles */}
        <div className="rounded-lg border p-3" style={{ background: C.panel, borderColor: C.border }}>
          <div className="relative mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
              {ao.name} — {view.spanKm < 1 ? `${Math.round(view.spanKm * 1000)} m` : `${view.spanKm.toFixed(1)} km`} AO
              <span style={{ color: C.dim }}> · GRID {gridLabel}</span>
            </span>
            <div className="flex items-center gap-2 text-[9px]" style={{ color: C.dim }}>
              <button onClick={() => setView({ lat: ao.center[0], lon: ao.center[1], spanKm: ao.halfKm * 2 })}
                className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: C.border }}>
                RESET VIEW
              </button>
              <span className="hidden lg:inline">WHEEL=ZOOM · DRAG=PAN · CLICK=SELECT/PLACE</span>
              <button onClick={() => setShowSettings((s) => !s)} className="flex items-center gap-1 rounded border px-1.5 py-0.5 font-semibold"
                style={{ borderColor: showSettings ? C.cyan : C.border, color: showSettings ? C.cyan : C.dim }}>
                <Settings className="h-3 w-3" /> SETTINGS
              </button>
            </div>
            {showSettings && (
              <div className="absolute right-0 top-6 z-30 w-56 rounded-lg border p-3 shadow-xl" style={{ background: C.panel, borderColor: C.cyan }}>
                <div className="mb-2 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Mission Planning Settings</div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: C.text }}>Elevation profiles</span>
                  <button onClick={() => setElevOn(!elevOn)} className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                    style={{ borderColor: elevOn ? C.gold : C.border, color: elevOn ? C.gold : C.dim }}>{elevOn ? "ON" : "OFF"}</button>
                </div>
                <div className="mb-1 text-[10px]" style={{ color: C.text }}>Pointer</div>
                <div className="mb-2 flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
                  {([["pointer", "DEFAULT"], ["target", "MINI-TARGET"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => setCursor(m)} className="flex-1 px-2 py-1"
                      style={{ background: cursorMode === m ? "#152238" : "transparent", color: cursorMode === m ? C.cyan : C.dim }}>{label}</button>
                  ))}
                </div>
                <p className="text-[8px] leading-snug" style={{ color: C.dim }}>
                  Pointer choice is saved and <span style={{ color: C.text }}>carries across sections</span> (localStorage
                  <span className="font-mono"> sec2525.cursorMode</span>). Grid &amp; MGRS precision live on the toolbar above the map.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-1">
          <div ref={mapRef}
            className="relative aspect-square w-full flex-1 overflow-hidden rounded-md touch-none"
            style={{ background: "radial-gradient(ellipse at 50% 55%, #0f2033 0%, #070b12 75%)", border: `1px solid ${C.border}`, cursor: cursorMode === "target" ? "none" : armed ? "crosshair" : dragRef.current ? "grabbing" : "grab" }}
            onWheel={onWheel}
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
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
              {/* Football field wireframe — overlaid on the REAL turf via 4 corners.
                  Bilinear: u=0→N end line, u=1→S; v=0→W sideline, v=1→E. */}
              {ao.field && (() => {
                const { nw, ne, sw, se } = ao.field;
                const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
                // point at (u along N→S, v along W→E) → screen fraction
                const pt = (u: number, v: number) => {
                  const lat = lerp(lerp(nw[0], ne[0], v), lerp(sw[0], se[0], v), u);
                  const lon = lerp(lerp(nw[1], ne[1], v), lerp(sw[1], se[1], v), u);
                  return toFrac(lat, lon);
                };
                const XY = (u: number, v: number) => { const f = pt(u, v); return `${(f.fx * 100).toFixed(2)},${(f.fy * 100).toFixed(2)}`; };
                const line = (u: number, color: string, w: number, op: number) => {
                  const a = pt(u, 0), b = pt(u, 1);
                  return <line key={`u${u.toFixed(3)}`} x1={a.fx * 100} y1={a.fy * 100} x2={b.fx * 100} y2={b.fy * 100} stroke={color} strokeWidth={w} opacity={op} />;
                };
                // 120 yd end-to-end; yard lines every 5 yd (24 intervals); goals at 10/110 yd.
                const yardUs = Array.from({ length: 23 }, (_, i) => (i + 1) / 24);
                const goalN = 10 / 120, goalS = 110 / 120;
                return (
                  <g>
                    {/* outer turf boundary */}
                    <polygon points={[XY(0, 0), XY(0, 1), XY(1, 1), XY(1, 0)].join(" ")} fill={`${C.land}12`} stroke={C.land} strokeWidth="0.4" strokeLinejoin="round" />
                    {/* end zones (N + S) */}
                    <polygon points={[XY(0, 0), XY(0, 1), XY(goalN, 1), XY(goalN, 0)].join(" ")} fill={`${C.cyan}16`} stroke={C.cyan} strokeWidth="0.3" />
                    <polygon points={[XY(goalS, 0), XY(goalS, 1), XY(1, 1), XY(1, 0)].join(" ")} fill={`${C.cyan}16`} stroke={C.cyan} strokeWidth="0.3" />
                    {/* yard lines */}
                    {yardUs.map((u) => line(u, C.land, 0.22, 0.65))}
                    {/* goal lines + 50 */}
                    {line(goalN, C.cyan, 0.35, 0.9)}
                    {line(goalS, C.cyan, 0.35, 0.9)}
                    {line(0.5, C.gold, 0.4, 0.9)}
                  </g>
                );
              })()}
            </svg>
            {/* grid km edge labels */}
            {gridOn && grid.vertical.map((l) => (
              <span key={`vl${l.km}${l.frac}`} className="absolute font-mono text-[8px]"
                style={{ left: `${l.frac * 100}%`, bottom: 2, transform: "translateX(2px)", color: C.dim }}>
                {String(l.km).padStart(2, "0")}
              </span>
            ))}
            {gridOn && grid.horizontal.map((l) => (
              <span key={`hl${l.km}${l.frac}`} className="absolute font-mono text-[8px]"
                style={{ top: `${l.frac * 100}%`, left: 2, color: C.dim }}>
                {String(l.km).padStart(2, "0")}
              </span>
            ))}
            {/* landmarks */}
            {ao.landmarks.map((lm) => {
              const f = toFrac(lm.lat, lm.lon);
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
              const f = toFrac(u.lat, u.lon);
              if (f.fx < -0.05 || f.fx > 1.05 || f.fy < -0.05 || f.fy > 1.05) return null;
              const sel = selected?.kind === "asset" && selected.id === u.id;
              return (
                <button key={u.id}
                  onPointerUp={(e) => { if (!dragRef.current?.moved) { e.stopPropagation(); setSelected({ kind: "asset", id: u.id }); } }}
                  title={`${ASSET_LABELS[u.asset]} — ${coordAt(u.lat, u.lon)}`}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%` }}>
                  {sel && <span className="absolute h-8 w-8 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.gold}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                  <AssetIcon asset={u.asset} style={iconStyle} affiliation="friendly" size={28} count={u.count} />
                  <span className="whitespace-nowrap font-mono text-[8px]" style={{ color: C.text }}>
                    {mgrsAt(u.lat, u.lon).split(" ").slice(2).join(" ")}
                  </span>
                </button>
              );
            })}
            {/* placed mission-support objects — left-click SELECTS */}
            {placedSupport.map((u) => {
              const f = toFrac(u.lat, u.lon);
              if (f.fx < -0.05 || f.fx > 1.05 || f.fy < -0.05 || f.fy > 1.05) return null;
              const sel = selected?.kind === "support" && selected.id === u.id;
              return (
                <button key={u.id}
                  onPointerUp={(e) => { if (!dragRef.current?.moved) { e.stopPropagation(); setSelected({ kind: "support", id: u.id }); } }}
                  title={`${u.def.term} · ${u.reality} — ${coordAt(u.lat, u.lon)}`}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${f.fx * 100}%`, top: `${f.fy * 100}%` }}>
                  {sel && <span className="absolute h-7 w-7 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.gold}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                  <SupportGlyph glyph={u.def.glyph} color={u.def.color} size={22} />
                  <span className="whitespace-nowrap font-mono text-[8px]" style={{ color: C.text }}>
                    {mgrsAt(u.lat, u.lon).split(" ").slice(2).join(" ")}
                  </span>
                </button>
              );
            })}
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
          </div>

          {/* RIGHT ELEVATION SCALE — vertical profile across the AO center column */}
          {elevOn && (
            <div className="relative w-12 shrink-0 self-stretch overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12" }}>
              <svg viewBox="0 0 40 100" preserveAspectRatio="none" className="h-full w-full">
                <path d={elevProfile.rightPath} fill={`${C.gold}22`} stroke={C.gold} strokeWidth="0.6" />
              </svg>
              <span className="absolute right-0.5 top-0.5 font-mono text-[7px]" style={{ color: C.gold }}>{Math.round(elevProfile.max)}m</span>
              <span className="absolute bottom-0.5 right-0.5 font-mono text-[7px]" style={{ color: C.dim }}>{Math.round(elevProfile.min)}m</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[7px] font-semibold tracking-wider" style={{ color: C.dim }}>ELEV N→S</span>
            </div>
          )}
          </div>

          {/* BOTTOM ELEVATION PROFILE — user-resizable (drag the handle: ~1/3 → 2/3) */}
          {elevOn && (
            <>
              <div
                onPointerDown={(e) => { bottomDrag.current = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); }}
                onPointerMove={(e) => {
                  if (bottomDrag.current == null) return;
                  const dy = e.clientY - bottomDrag.current;
                  bottomDrag.current = e.clientY;
                  setBottomH((h) => Math.max(40, Math.min(430, h - dy)));
                }}
                onPointerUp={() => { bottomDrag.current = null; }}
                className="mt-1 flex h-3 cursor-row-resize items-center justify-center rounded"
                style={{ background: "transparent" }} title="Drag to resize the elevation panel">
                <span className="h-0.5 w-10 rounded-full" style={{ background: C.border }} />
              </div>
              <div className="relative overflow-hidden rounded-md border" style={{ borderColor: C.border, background: "#070b12", height: bottomH }}>
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
                  ELEVATION · W→E · GREEN=LAND · CONTOUR {elevProfile.step}m · SYNTHETIC (DEM PENDING)
                </span>
                {/* HIGH / LOW callouts within current view */}
                <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${elevProfile.high.x}%`, top: 10 }}>
                  <span className="whitespace-nowrap rounded px-1 text-[7px] font-bold" style={{ background: "#0a0f16cc", color: C.gold }}>
                    ▲ HIGH {Math.round(elevProfile.high.e)}m · {coordAt(elevProfile.high.lat, elevProfile.high.lon)}
                  </span>
                </span>
                <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${elevProfile.low.x}%`, bottom: 10 }}>
                  <span className="whitespace-nowrap rounded px-1 text-[7px] font-bold" style={{ background: "#0a0f16cc", color: "#38bdf8" }}>
                    ▼ LOW {Math.round(elevProfile.low.e)}m · {coordAt(elevProfile.low.lat, elevProfile.low.lon)}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
