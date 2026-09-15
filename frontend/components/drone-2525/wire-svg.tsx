"use client";

// THE RENDERER — a WireModel drawn under the vector law. Black ground, lines only, one saturated colour per
// group from the 13, no fill and no shading anywhere (operator's references: Star Wars arcade 1983, Battlezone).
//
// One <path> per group, not per segment: a 1,400-segment arena becomes ~33 DOM nodes, which is the difference
// between a Raspberry Pi drawing a city block and a Raspberry Pi giving up. Points behind the camera plane are
// DROPPED and counted — never clamped, because a clamped vertex draws a line to a place that does not exist.
import { useMemo } from "react";
import type { WireModel, Lod } from "@/lib/wire-core/wire-model";
import { TRINITY_COLORS } from "@/lib/wire-core/palette";
import { VECTOR_LAW, strokeProps } from "@/lib/wire-core/vector-law";
import { sceneProject, type SceneCam } from "@/lib/wire-core/scene-project";

export interface WireSvgProps {
  model: WireModel;
  cam: SceneCam;
  maxLod: Lod;
  segmentBudget: number;
  /** Stroke width scaler — the fidelity dial, so every line thickens or thins together. */
  fw?: (w: number) => number;
  bloom?: boolean;
  highlight?: Set<string>;
  onCulled?: (n: number) => void;
}

export function WireSvg({ model, cam, maxLod, segmentBudget, fw = (w) => w, bloom = false, highlight }: WireSvgProps) {
  const paths = useMemo(() => {
    const out: { id: string; d: string; hex: string; width: number; on: boolean }[] = [];
    let drawn = 0, culled = 0;
    for (const g of model.groups) {
      if (g.lod > maxLod) continue;
      const n = g.edgeN - g.edge0;
      if (drawn + n > segmentBudget) continue;
      let d = "";
      for (let i = g.edge0; i < g.edgeN; i++) {
        const [ai, bi] = model.edges[i];
        const a = sceneProject(model.vertices[ai], cam);
        if (a.behind) { culled++; continue; }
        const b = sceneProject(model.vertices[bi], cam);
        if (b.behind) { culled++; continue; }
        d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      if (!d) continue;
      drawn += n;
      const on = !highlight || highlight.has(g.id);
      out.push({ id: g.id, d, hex: TRINITY_COLORS[g.role], width: fw(on ? VECTOR_LAW.stroke.normal : VECTOR_LAW.stroke.hairline), on });
    }
    void culled;
    return out;
  }, [model, cam, maxLod, segmentBudget, fw, highlight]);

  return (
    <svg
      width={cam.pw} height={cam.ph} viewBox={`0 0 ${cam.pw} ${cam.ph}`}
      style={{ display: "block", background: VECTOR_LAW.ground, touchAction: "none" }}
      aria-hidden
    >
      {paths.map((p) => (
        <path
          key={p.id} d={p.d} {...strokeProps(p.hex, p.width)}
          opacity={p.on ? 1 : 0.35}
          style={bloom ? { filter: VECTOR_LAW.bloom.filter, color: p.hex } : undefined}
        />
      ))}
    </svg>
  );
}
