// R-CORE · the 3x3x3 identity cube, shared.
//
// MOVED here from components/cube-dev-sim.tsx (unchanged behaviour) so the R-CORE revision panel can show a
// project's code the way the SIM already shows a cube's: 27 pieces, the ones this revision touched lit, tap one
// and read what changed there. Operator 2026-10-15: "how we visualize elements (as 1-27 pieces of cube) and then
// deep dive on a section of code for that revision" - and, on reusing what exists rather than rebuilding it,
// "that way we avoid rework and prevents unnecessary token use". One component, two consumers.
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useRCoreGestures } from "@/components/architect-2525/use-rcore-gestures";

const AI = "#19c8cf", SI = "#ffcf5a", HI = "#b98cff", GOOD = "#3ddc9a";

// Per-block palette (FX-I) — Trinity colors first (AI·SI·HI·GOOD), then distinct hues
// so up to 27 building blocks each read as a different color (operator: "trinity colors
// first then more if 13+ sections").
export const BLOCK_PAL = [AI, SI, HI, GOOD, "#ff6b6b", "#4dabf7", "#f783ac", "#ffa94d", "#a9e34b",
  "#63e6be", "#748ffc", "#ffd43b", "#e599f7", "#66d9e8", "#ff8787", "#b2f2bb"];
export function blockColor(k: number): string {
  if (k < BLOCK_PAL.length) return BLOCK_PAL[k];
  // Past the named palette (13+ blocks): golden-angle hue PLUS lightness/saturation that
  // alternate by index parity, so adjacent blocks stay distinct all the way to 27.
  const hue = Math.round((k * 137.508) % 360);
  const light = k % 2 === 0 ? 63 : 48;
  const sat = k % 3 === 0 ? 78 : 62;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

// 27 stackable sub-cube BLOCKS in real CSS-3D (no WebGL), rotatable via the shared
// Vision-2525 R-Core camera. Reuses the voxel-house pattern (preserve-3d + perspective +
// rotateX(pitch)/rotateZ(bearing)). Lit blocks glow (SI); the rest read as a dim lattice
// so the whole 3×3×3 identity fingerprint is visible while the worked section stands out.
export function CubeVoxel3D({ lit, blockOf, nSections, codes = [], exploded = false, px = 200, fill = false }: {
  lit: Set<number>; blockOf: number[]; nSections: number; codes?: string[]; exploded?: boolean; px?: number; fill?: boolean;
}) {
  const cam = useRCoreGestures({
    initialBearing: -0.6, initialPitch: 60, initialZoom: 1, touchOrbit: true, pan: false,
    cfg: { minPitch: 8, maxPitch: 86, minZoom: 0.5, maxZoom: 3.5 },
  });
  const { bearing, pitch, zoom } = cam;
  // Minimal 1px seam so mini-cubes read as ONE solid object (faces touch, Lego rule)
  // while a thin black line still shows the divisions (FX-N); smaller cells so the
  // exploded spread fits.
  const cell = fill ? 40 : 24, gap = 1, step = cell + gap;
  // Each building block is a DIFFERENT color (FX-I). The selected block fills solid +
  // bright; the other blocks show in their own color, dimmer (so all distinct blocks
  // read at a glance). Exploded → each block moves as a RIGID group along its centroid
  // direction (blocks stay together, clear spacing between them). Memoized (not per-frame).
  const scene = useMemo(() => {
    const at = (t: string): CSSProperties => ({ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) ${t}` });
    const face = (t: string, w: number, h: number, hex: string, alpha: string): CSSProperties =>
      ({ ...at(t), width: w, height: h, border: `1px solid ${hex}`, background: `${hex}${alpha}` });
    // Per-block centroid (cell-space, centered at 0) → the rigid explode direction.
    const sums: Record<number, [number, number, number, number]> = {};
    for (let i = 0; i < 27; i++) {
      const k = blockOf[i] ?? 0, x = i % 3, y = Math.floor(i / 3) % 3, z = Math.floor(i / 9);
      const s = (sums[k] ||= [0, 0, 0, 0]); s[0] += x; s[1] += y; s[2] += z; s[3] += 1;
    }
    // Explode direction: NORMALIZE each block's centroid-from-center to a unit vector so
    // every block clears its neighbors by a full step regardless of shape; a block centred
    // on the middle (|dir|≈0) would never separate, so fall back to a golden-angle direction
    // by index. A small per-index radius nudge separates blocks that share a direction.
    const dir: Record<number, [number, number, number]> = {};
    const keys = Object.keys(sums).map(Number).sort((a, b) => a - b);
    keys.forEach((k, idx) => {
      const s = sums[k];
      let dx = s[0] / s[3] - 1, dy = s[1] / s[3] - 1, dz = s[2] / s[3] - 1;
      const norm = Math.hypot(dx, dy, dz);
      if (norm > 0.2) { dx /= norm; dy /= norm; dz /= norm; }
      else {
        const a = idx * 2.399963;                       // golden angle (rad)
        dx = Math.cos(a); dy = Math.sin(a); dz = Math.cos(a * 1.7) * 0.7;
        const n2 = Math.hypot(dx, dy, dz) || 1; dx /= n2; dy /= n2; dz /= n2;
      }
      const r = 0.85 + 0.5 * (idx / Math.max(1, keys.length - 1));   // per-index radius spread
      dir[k] = [dx * r, dy * r, dz * r];
    });
    // Which blocks are "on" (the selected section highlights its cells).
    const onBlock: Record<number, boolean> = {};
    for (let i = 0; i < 27; i++) if (lit.has(i)) onBlock[blockOf[i] ?? 0] = true;
    // A solid 6-face voxel cube of side `s` at (x,y,z). `alphas` = [top,side,far,opacity].
    const solidCube = (key: string | number, x: number, y: number, z: number, s: number, hex: string, alphas: [string, string, string, number]) => {
      const [tA, sA, s2A, op] = alphas;
      return (
        <div key={key} style={{ ...at(`translate3d(${x}px,${y}px,${z}px)`), transformStyle: "preserve-3d", opacity: op }}>
          <div style={face(`translate3d(0px,0px,${s / 2}px)`, s, s, hex, tA)} />
          <div style={face(`translate3d(0px,0px,${-s / 2}px)`, s, s, hex, s2A)} />
          <div style={face(`translate3d(0px,${-s / 2}px,0px) rotateX(90deg)`, s, s, hex, sA)} />
          <div style={face(`translate3d(0px,${s / 2}px,0px) rotateX(90deg)`, s, s, hex, sA)} />
          <div style={face(`translate3d(${-s / 2}px,0px,0px) rotateY(90deg)`, s, s, hex, s2A)} />
          <div style={face(`translate3d(${s / 2}px,0px,0px) rotateY(90deg)`, s, s, hex, s2A)} />
        </div>
      );
    };
    const out: ReactNode[] = [];
    if (exploded) {
      // EXPLODED = a clean "case exploded view": EACH building block becomes ONE uniform
      // solid cube (operator: "appear as cubes not elongated · does not stretch"), flying
      // outward from the centre with generous spacing. Every block shows — the selected one
      // brightest, the others solid in their own colour (never flat plates).
      const exStep = fill ? step * 4.2 : step * 3.4;
      const blockCell = cell * 1.7;               // substantial, uniform cube per block
      keys.forEach((k) => {
        const s = sums[k], d = dir[k] ?? [0, 0, 0];
        const cx = s[0] / s[3] - 1, cy = s[1] / s[3] - 1, cz = s[2] / s[3] - 1;
        const x = cx * step + d[0] * exStep, y = cy * step + d[1] * exStep, z = cz * step + d[2] * exStep;
        // Exploded: every block a SOLID 3D cube. All three faces must read (top>side>far) so a
        // block never collapses to a flat diamond — the non-selected side/far alphas were too
        // faint on the dark bg, so only the top showed. Selected is brightest; others are solid
        // in their own colour, fully opaque, with clear face shading.
        const a: [string, string, string, number] = onBlock[k] ? ["ff", "e6", "c8", 1] : ["cf", "9c", "72", 1];
        out.push(solidCube(`blk-${k}`, x, y, z, blockCell, blockColor(k), a));
      });
    } else {
      // ASSEMBLED = the 27 mini-cubes as ONE solid object (thin seam). Selected block bright,
      // the rest see-through so the selection stands out (operator: others more see-through).
      for (let i = 0; i < 27; i++) {
        const layer = Math.floor(i / 9), c9 = i % 9, row = Math.floor(c9 / 3), col = c9 % 3;
        const k = blockOf[i] ?? 0;
        const a: [string, string, string, number] = lit.has(i) ? ["ff", "dd", "bb", 1] : ["2e", "1e", "14", 0.42];
        out.push(solidCube(i, (col - 1) * step, (row - 1) * step, (layer - 1) * step, cell, blockColor(k), a));
      }
    }
    // Per-block label anchors — each block's decimal code (1.1…) floats at its exploded cube.
    const exStepA = fill ? step * 4.2 : step * 3.4;
    const anchors = keys.map((k) => {
      const s = sums[k], d = dir[k] ?? [0, 0, 0];
      const cx = s[0] / s[3] - 1, cy = s[1] / s[3] - 1, cz = s[2] / s[3] - 1;
      return { code: codes[k] ?? `${k + 1}`, x: cx * step + d[0] * exStepA, y: cy * step + d[1] * exStepA, z: cz * step + d[2] * exStepA };
    });
    return { cubes: out, anchors };
  }, [lit, blockOf, nSections, codes, exploded, cell, step, fill]);
  return (
    <div className="relative touch-none select-none overflow-hidden rounded-lg"
      style={{ width: fill ? "100%" : px, height: fill ? "100%" : px, minWidth: fill ? undefined : px }}
      {...cam.handlers} onPointerLeave={cam.handlers.onPointerUp}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 55%",
        transform: `perspective(900px) rotateX(${pitch}deg) scale(${(exploded ? 0.46 : 0.9) * zoom})` }}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: `rotateZ(${bearing}rad)` }}>
          {scene.cubes}
          {/* Exploded: each block's decimal code (1.1…) billboarded at its center so you
              can identify every building block. Counter-rotate to face the viewer. */}
          {exploded && scene.anchors.map((a, i) => (
            <div key={`lbl-${i}`} style={{
              position: "absolute", left: "50%", top: "50%",
              transform: `translate(-50%,-50%) translate3d(${a.x}px,${a.y}px,${a.z}px) rotateZ(${-bearing}rad) rotateX(${-pitch}deg)`,
              font: "700 10px ui-monospace, monospace", color: "#fff",
              background: "rgba(0,0,0,0.6)", padding: "1px 4px", borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
            }}>{a.code}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
