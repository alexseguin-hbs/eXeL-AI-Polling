"use client";

/**
 * SECURITY-2525 · Air-Defense Asset Icons
 * =======================================
 * Two switchable iconologies for the four reference assets (Avenger / Patriot /
 * THAAD / Sentinel), derived from the operator's reference infographics:
 *
 *   • "mil"  — MIL-STD-2525-inspired: affiliation FRAME (hostile = red diamond,
 *              friendly = blue rectangle) + an air-defense glyph per asset.
 *   • "exel" — eXeL-STD-2525: stylized platform silhouette in affiliation color.
 *
 * Affiliation drives color — HOSTILE (enemy) = red. Self-contained inline SVG
 * (no external assets — CSP-safe, works offline / slow links).
 */
export type IconStyle = "mil" | "exel";
export type Affiliation = "friendly" | "hostile";
export type AssetKind = "avenger" | "patriot" | "thaad" | "sentinel" | "xbat";

const HOSTILE = "#ef4444";       // red — enemy
const FRIENDLY = "#38bdf8";      // cyan-blue — friendly

export const ASSET_LABELS: Record<AssetKind, string> = {
  avenger: "AVENGER",
  patriot: "PATRIOT",
  thaad: "THAAD",
  sentinel: "SENTINEL",
  xbat: "X-BAT",
};

export const ASSET_ORDER: AssetKind[] = ["avenger", "patriot", "thaad", "sentinel", "xbat"];

// ── X-BAT 3rd-pass wireframe (nose-up front view) ────────────────────────────
// Projected from docs/security-2525/xbat-wireframe/xbat_3rdpass_wireframe.py
// (X span → svg-x, Z vertical → svg-y, 32×32 viewBox). Conceptual visual
// approximation only — no engineering/flight/weapon data.
const XBAT_OUTLINE =
  "M16 6.58L16.97 7.54L17.72 8.51L18.72 9.96L19.39 10.93L20.07 11.89L21.29 13.34L22.29 14.31L24.09 15.76L25.23 16.72L26.36 17.69L28.08 19.14L29.43 20.11L29.86 21.56L28.83 22.52L26.61 23.49L20.8 24.94L14.04 25.42L7.09 23.97L4.19 23.01L2.58 22.04L2.07 20.59L3.22 19.62L5.1 18.17L6.19 17.21L7.34 16.24L9.11 14.79L10.26 13.83L11.58 12.38L12.27 11.41L12.95 10.44L13.95 8.99L14.63 8.03L16 6.58Z";
const XBAT_DETAIL = [
  "M16 6.87L16 25.13",                                                              // center spine
  "M16.3 7.74L17.7 10.78L19.7 13.54L22.67 16.58L27.31 19.41L29.19 20.64",           // crease R
  "M15.7 7.74L14.3 10.78L12.3 13.54L9.33 16.58L4.69 19.41L2.81 20.64",              // crease L
  "M29.3 20.02L29.95 20.82L29.73 21.76L28.57 22.7",                                 // clipped tip R
  "M2.7 20.02L2.05 20.82L2.27 21.76L3.43 22.7",                                     // clipped tip L
  "M24.08 20.53L28.54 21.22L27.99 22.85L25.82 23.77L22.85 22.83L23.21 21.11Z",      // rear panel R
  "M7.92 20.53L3.46 21.22L4.01 22.85L6.18 23.77L9.15 22.83L8.79 21.11Z",            // rear panel L
  "M20.93 23.18L23.07 24.23L20.13 24.95L18.1 24.15",                                // notch R
  "M11.07 23.18L8.93 24.23L11.87 24.95L13.9 24.15",                                 // notch L
  "M14.44 15.53L17.56 15.53L17.56 17.78L14.44 17.78Z",                              // engine/inlet bay
  "M15.65 6.98L16 6.67L16.35 6.98L16.51 7.61L16 8.06L15.49 7.61Z",                  // nose facet
];

function XbatWireframe({ c, detail }: { c: string; detail: boolean }) {
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d={XBAT_OUTLINE} stroke={c} strokeWidth={detail ? 1.2 : 1.5} />
      {detail && XBAT_DETAIL.map((d) => (
        <path key={d} d={d} stroke={c} strokeWidth="0.7" opacity="0.85" />
      ))}
    </g>
  );
}

// 3-ship echelon — lead high, two wingmen trailing. Distinguishes a swarm/group
// (count > 1) from a single X-BAT at a glance.
function XbatSwarm({ c }: { c: string }) {
  const ships: [number, number, number, number][] = [
    [0, -6, 0.5, 1],        // lead
    [-7, 4.5, 0.42, 0.7],   // left wingman
    [7, 4.5, 0.42, 0.7],    // right wingman
  ];
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      {ships.map(([dx, dy, s, o], i) => (
        <g key={i} transform={`translate(${16 + dx} ${16 + dy}) scale(${s}) translate(-16 -16)`} opacity={o}>
          <path d={XBAT_OUTLINE} stroke={c} strokeWidth={1.5 / s} />
        </g>
      ))}
    </g>
  );
}

function affColor(aff: Affiliation) {
  return aff === "hostile" ? HOSTILE : FRIENDLY;
}

// ── MIL-STD-2525E (doctrine-exact — see docs/security-2525/MIL-STD-2525.pdf) ─
// Frames per 2525E: land EQUIPMENT friendly = circle (rectangle is for UNITS);
// hostile land = diamond; AIR friendly = arc open at bottom; hostile air =
// top-half diamond open at bottom. Never mix eXeL-STD glyphs into MIL style.
const AIR_ASSETS: ReadonlySet<AssetKind> = new Set<AssetKind>(["xbat"]);

function MilFrame({ aff, air, children }: { aff: Affiliation; air?: boolean; children: React.ReactNode }) {
  const c = affColor(aff);
  const fill = `${c}22`;
  const frame = air ? (
    aff === "hostile" ? (
      // hostile air = open-bottom half diamond ("peaked hat")
      <path d="M5 25L16 4l11 21" fill={fill} stroke={c} strokeWidth="1.6" />
    ) : (
      // friendly air = open-bottom arc (dome)
      <path d="M5 25V15a11 11 0 0 1 22 0v10" fill={fill} stroke={c} strokeWidth="1.6" />
    )
  ) : aff === "hostile" ? (
    // hostile land = diamond
    <polygon points="16,3 29,16 16,29 3,16" fill={fill} stroke={c} strokeWidth="1.6" />
  ) : (
    // friendly land EQUIPMENT = circle (2525E)
    <circle cx="16" cy="16" r="11.5" fill={fill} stroke={c} strokeWidth="1.6" />
  );
  return (
    <>
      {frame}
      {children}
    </>
  );
}

// 2525E land-equipment "Missile Launcher" icon family: round-top canister,
// weight bars below (light = 1, medium = 2, heavy = 3). Table E-X, 1111xx.
function MilCanister({ c, bars }: { c: string; bars: number }) {
  return (
    <g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round">
      <path d="M13.5 19.5v-8a2.5 2.5 0 0 1 5 0v8z" />
      {Array.from({ length: bars }, (_, i) => (
        <line key={i} x1="13.5" y1={21 + i * 1.8} x2="18.5" y2={21 + i * 1.8} />
      ))}
    </g>
  );
}

// MIL glyphs are DOCTRINE-EXACT per MIL-STD-2525E Change 1 (Table E-X / D-III).
// Platform likeness lives in the eXeL-STD silhouettes only — never here.
function milGlyph(asset: AssetKind, c: string) {
  switch (asset) {
    case "xbat": // 2525E air fixed-wing drone icon — swept flying wing
      return <path d="M8.5 19.5l7.5-5.5 7.5 5.5h-3.6l-3.9-2.8-3.9 2.8z" stroke={c} strokeWidth="1.4" fill="none" strokeLinejoin="round" />;
    case "sentinel": // 2525E Radar (220300): zig-zag EM arrow with arrowhead
      return (
        <g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21l6-6 3 3 6-6" />
          <path d="M24 16v-4h-4" />
        </g>
      );
    case "thaad": // AD Missile Launcher — heavy (3 bars)
      return <MilCanister c={c} bars={3} />;
    case "patriot": // AD Missile Launcher — medium (2 bars)
      return <MilCanister c={c} bars={2} />;
    case "avenger": // AD Missile Launcher — light (1 bar)
    default:
      return <MilCanister c={c} bars={1} />;
  }
}

// ── eXeL-STD-2525: stylized platform silhouettes ─────────────────────────────
function exelSilhouette(asset: AssetKind, c: string, count = 1) {
  const s = { stroke: c, strokeWidth: 1.5, fill: "none", strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (asset) {
    case "xbat": // full 3rd-pass wireframe projection; echelon formation when count > 1
      return count > 1 ? <XbatSwarm c={c} /> : <XbatWireframe c={c} detail />;
    case "avenger": // HMMWV (hood right, big wheels) + pod each side of gunner glass, raised
      return (
        <g {...s}>
          <circle cx="8" cy="22.5" r="2.5" />
          <circle cx="24" cy="22.5" r="2.5" />
          {/* HMMWV profile: rear bed low, cab roof, windshield slant, flat hood */}
          <path d="M3 21v-6h10v-3h5l3 4h8v5z" />
          {/* turret pedestal + gunner glass, pods raised outward on each side */}
          <line x1="11" y1="15" x2="11" y2="10.5" />
          <rect x="9.5" y="5.5" width="3" height="4.5" />
          <g transform="rotate(-20 5.75 7.75)">
            <rect x="3" y="6" width="5.5" height="3.5" rx="0.5" />
            <line x1="3" y1="7.75" x2="8.5" y2="7.75" />
          </g>
          <g transform="rotate(20 16.25 7.75)">
            <rect x="13.5" y="6" width="5.5" height="3.5" rx="0.5" />
            <line x1="13.5" y1="7.75" x2="19" y2="7.75" />
          </g>
        </g>
      );
    case "patriot": // HEMTT cab + equipment box + slant-raised launcher (2 pods of 4) + erector
      return (
        <g {...s}>
          <path d="M3 22h26" />
          <circle cx="6.5" cy="24" r="1.6" />
          <circle cx="11" cy="24" r="1.6" />
          <circle cx="17" cy="24" r="1.6" />
          <circle cx="22" cy="24" r="1.6" />
          <path d="M3 22v-5h5l2 3v2" />
          <rect x="11.5" y="17.5" width="4" height="4.5" />
          <g transform="rotate(38 21 12)">
            <rect x="18" y="5" width="6" height="14" rx="0.5" />
            <line x1="21" y1="5" x2="21" y2="19" />
            <line x1="18" y1="8.5" x2="24" y2="8.5" />
          </g>
          <line x1="16" y1="21" x2="20" y2="15" />
        </g>
      );
    case "thaad": // 4 individual round-top cylinders raised steep (top-left) + truck at right
      return (
        <g {...s}>
          <path d="M6 22h23" />
          <circle cx="17" cy="24" r="1.7" />
          <circle cx="21.5" cy="24" r="1.7" />
          <circle cx="26" cy="24" r="1.7" />
          <path d="M24 22v-4h4l1 2v2" />
          <g transform="rotate(-18 13 19)">
            <rect x="8" y="4" width="2.2" height="15" rx="1.1" />
            <rect x="10.6" y="4" width="2.2" height="15" rx="1.1" />
            <rect x="13.2" y="4" width="2.2" height="15" rx="1.1" />
            <rect x="15.8" y="4" width="2.2" height="15" rx="1.1" />
            <line x1="7.5" y1="20.5" x2="18.5" y2="20.5" />
          </g>
          <line x1="20" y1="21" x2="15.5" y2="14" />
        </g>
      );
    case "sentinel": // towed platform + curved dish opening RIGHT + radiating waves
    default:
      return (
        <g {...s}>
          <path d="M6 22h16" />
          <line x1="12" y1="22" x2="12" y2="15" />
          <g transform="rotate(-12 12 11)">
            <path d="M12.5 5.5A5.5 5.5 0 0 0 12.5 16.5" />
            <line x1="9.8" y1="11" x2="14.5" y2="11" />
            <path d="M18.1 8.9A3 3 0 0 1 18.1 13.1" />
            <path d="M19.7 7.3A5.2 5.2 0 0 1 19.7 14.7" />
          </g>
        </g>
      );
  }
}

export function AssetIcon({
  asset,
  style,
  affiliation = "friendly",
  size = 30,
  count = 1,
}: {
  asset: AssetKind;
  style: IconStyle;
  affiliation?: Affiliation;
  size?: number;
  count?: number; // > 1 renders the group/swarm variant (X-BAT: 3-ship echelon)
}) {
  const c = affColor(affiliation);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img"
      aria-label={`${ASSET_LABELS[asset]}${count > 1 ? " ×" + count : ""} (${affiliation}, ${style})`}>
      {style === "mil" ? (
        <>
          <MilFrame aff={affiliation} air={AIR_ASSETS.has(asset)}>{milGlyph(asset, c)}</MilFrame>
          {/* 2525E quantity amplifier — count above the equipment symbol */}
          {count > 1 && (
            <text x="26.5" y="8" fontSize="8" fontWeight="bold" fill={c} textAnchor="middle" fontFamily="monospace">
              {count}
            </text>
          )}
        </>
      ) : (
        exelSilhouette(asset, c, count)
      )}
    </svg>
  );
}
