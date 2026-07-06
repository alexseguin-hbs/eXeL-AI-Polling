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

function milGlyph(asset: AssetKind, c: string) {
  switch (asset) {
    case "xbat": // UCAV silhouette, scaled to sit inside the affiliation frame
      return (
        <g transform="translate(16 16) scale(0.45) translate(-16 -16)">
          <XbatWireframe c={c} detail={false} />
        </g>
      );
    case "sentinel": // radar arcs
      return (
        <g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M11 20a6 6 0 0 1 10 0" />
          <path d="M13.5 20a3 3 0 0 1 5 0" />
          <line x1="16" y1="20" x2="16" y2="12" />
        </g>
      );
    case "thaad": // tall vertical missiles
      return (
        <g stroke={c} strokeWidth="1.4" strokeLinecap="round">
          <line x1="13" y1="21" x2="13" y2="11" />
          <line x1="16" y1="21" x2="16" y2="10" />
          <line x1="19" y1="21" x2="19" y2="11" />
        </g>
      );
    case "patriot": // angled launcher box + missile
      return (
        <g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <rect x="11" y="15" width="10" height="6" transform="rotate(-24 16 18)" />
          <line x1="20" y1="12" x2="24" y2="9" />
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
function exelSilhouette(asset: AssetKind, c: string) {
  const s = { stroke: c, strokeWidth: 1.5, fill: "none", strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (asset) {
    case "xbat": // full 3rd-pass wireframe projection
      return <XbatWireframe c={c} detail />;
    case "avenger": // HMMWV chassis + twin launcher pods
      return (
        <g {...s}>
          <path d="M4 21h20l-2-5H8l-2 2H4z" />
          <circle cx="9" cy="23" r="2" />
          <circle cx="20" cy="23" r="2" />
          <rect x="8" y="9" width="5" height="5" />
          <rect x="17" y="9" width="5" height="5" />
        </g>
      );
    case "patriot": // trailer + tilted 4-pack launcher box
      return (
        <g {...s}>
          <path d="M4 22h22" />
          <circle cx="9" cy="24" r="1.8" />
          <circle cx="19" cy="24" r="1.8" />
          <rect x="9" y="9" width="13" height="8" rx="1" transform="rotate(-22 15 13)" />
          <line x1="7" y1="22" x2="9" y2="16" />
        </g>
      );
    case "thaad": // truck + vertical canister cluster
      return (
        <g {...s}>
          <path d="M3 22h22l-2-4H5z" />
          <circle cx="8" cy="24" r="1.8" />
          <circle cx="20" cy="24" r="1.8" />
          <path d="M11 18V7M15 18V6M19 18V7" />
          <path d="M11 7l1.5-2M15 6l1.5-2M19 7l1.5-2" />
        </g>
      );
    case "sentinel": // radar mast + rotating panel + signal
    default:
      return (
        <g {...s}>
          <line x1="14" y1="22" x2="14" y2="12" />
          <path d="M6 22h16" />
          <rect x="7" y="7" width="14" height="6" rx="1" transform="rotate(-16 14 10)" />
          <path d="M22 8a5 5 0 0 1 0 7" />
        </g>
      );
  }
}

export function AssetIcon({
  asset,
  style,
  affiliation = "friendly",
  size = 30,
}: {
  asset: AssetKind;
  style: IconStyle;
  affiliation?: Affiliation;
  size?: number;
}) {
  const c = affColor(affiliation);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img"
      aria-label={`${ASSET_LABELS[asset]} (${affiliation}, ${style})`}>
      {style === "mil" ? (
        <MilFrame aff={affiliation}>{milGlyph(asset, c)}</MilFrame>
      ) : (
        exelSilhouette(asset, c)
      )}
    </svg>
  );
}
