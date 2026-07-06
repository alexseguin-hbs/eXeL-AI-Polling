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

// ── MIL-STD-2525-inspired: affiliation frame + per-asset AD glyph ────────────
function MilFrame({ aff, children }: { aff: Affiliation; children: React.ReactNode }) {
  const c = affColor(aff);
  const fill = aff === "hostile" ? "#ef444422" : "#38bdf822";
  return (
    <>
      {aff === "hostile" ? (
        // hostile land = diamond
        <polygon points="16,3 29,16 16,29 3,16" fill={fill} stroke={c} strokeWidth="1.6" />
      ) : (
        // friendly land = rectangle
        <rect x="4" y="7" width="24" height="18" rx="1" fill={fill} stroke={c} strokeWidth="1.6" />
      )}
      {children}
    </>
  );
}

function milGlyph(asset: AssetKind, c: string, count = 1) {
  switch (asset) {
    case "xbat": // UCAV silhouette, scaled to sit inside the affiliation frame
      return (
        <g transform="translate(16 16) scale(0.45) translate(-16 -16)">
          {count > 1 ? <XbatSwarm c={c} /> : <XbatWireframe c={c} detail={false} />}
        </g>
      );
    case "sentinel": // curved dish opening RIGHT, tilted slightly upper-right, waves out
      return (
        <g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <line x1="13" y1="18.5" x2="13" y2="21" />
          <path d="M10.5 21h5" />
          <g transform="rotate(-12 13 13)">
            <path d="M13 7.5A6 6 0 0 0 13 18.5" />
            <line x1="10" y1="13" x2="15" y2="13" />
            <path d="M16.9 11.4A2.5 2.5 0 0 1 16.9 14.6" />
            <path d="M18.4 10.1A4.5 4.5 0 0 1 18.4 15.9" />
            <path d="M20 8.8A6.5 6.5 0 0 1 20 17.2" />
          </g>
        </g>
      );
    case "thaad": // 4x2 cylindrical canister cluster, slanted skyward
      return (
        <g stroke={c} strokeWidth="1.6" strokeLinecap="round">
          <g transform="rotate(15 16 16)">
            <line x1="12" y1="20.5" x2="12" y2="11" />
            <line x1="14.7" y1="20.5" x2="14.7" y2="10.5" />
            <line x1="17.3" y1="20.5" x2="17.3" y2="10.5" />
            <line x1="20" y1="20.5" x2="20" y2="11" />
          </g>
          <line x1="11" y1="22" x2="19" y2="22" />
        </g>
      );
    case "patriot": // slant-raised canister box — 2 pods of 4 (2x2 face)
      return (
        <g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <g transform="rotate(35 16 15)">
            <rect x="13.5" y="8" width="5" height="12" rx="0.5" />
            <line x1="16" y1="8" x2="16" y2="20" />
            <line x1="13.5" y1="11" x2="18.5" y2="11" />
          </g>
          <line x1="10" y1="21.5" x2="21" y2="21.5" />
        </g>
      );
    case "avenger": // dome + stinger
    default:
      return (
        <g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M11 20a5 5 0 0 1 10 0" />
          <line x1="16" y1="16" x2="16" y2="10" />
          <path d="M16 10l-2 3M16 10l2 3" />
        </g>
      );
  }
}

// ── eXeL-STD-2525: stylized platform silhouettes ─────────────────────────────
function exelSilhouette(asset: AssetKind, c: string, count = 1) {
  const s = { stroke: c, strokeWidth: 1.5, fill: "none", strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (asset) {
    case "xbat": // full 3rd-pass wireframe projection; echelon formation when count > 1
      return count > 1 ? <XbatSwarm c={c} /> : <XbatWireframe c={c} detail />;
    case "avenger": // HMMWV profile + twin elevated Stinger pods in a V + gunner glass
      return (
        <g {...s}>
          <circle cx="8" cy="23" r="2" />
          <circle cx="24" cy="23" r="2" />
          {/* rear deck + cab + hood (front right) */}
          <path d="M3 21v-3h13v-5h4l3 3h1v2h5v3z" />
          <line x1="12" y1="18" x2="12" y2="11" />
          {/* twin pods angled outward-up, glass panel between */}
          <rect x="5" y="7.5" width="6" height="3" rx="0.5" transform="rotate(-12 8 9)" />
          <rect x="13" y="7.5" width="6" height="3" rx="0.5" transform="rotate(12 16 9)" />
          <path d="M10.5 6.5h3v4h-3z" />
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
    case "thaad": // truck + 4x2 cylindrical canister cluster pointed at sky (slant-raised)
      return (
        <g {...s}>
          <path d="M3 22h22l-2-4H5z" />
          <circle cx="8" cy="24" r="1.8" />
          <circle cx="20" cy="24" r="1.8" />
          <g transform="rotate(18 14 12)">
            {/* front row — 4 round-top canisters */}
            <rect x="9.5" y="3.5" width="9.6" height="14.5" rx="1" />
            <line x1="11.9" y1="4" x2="11.9" y2="17.5" />
            <line x1="14.3" y1="4" x2="14.3" y2="17.5" />
            <line x1="16.7" y1="4" x2="16.7" y2="17.5" />
            {/* back-row canister mouths peeking above */}
            <path d="M10.7 3.5a1.2 1.2 0 0 1 2.4 0M13.1 3.5a1.2 1.2 0 0 1 2.4 0M15.5 3.5a1.2 1.2 0 0 1 2.4 0" />
          </g>
          <line x1="8" y1="18" x2="11" y2="13" />
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
        <MilFrame aff={affiliation}>{milGlyph(asset, c, count)}</MilFrame>
      ) : (
        exelSilhouette(asset, c, count)
      )}
    </svg>
  );
}
