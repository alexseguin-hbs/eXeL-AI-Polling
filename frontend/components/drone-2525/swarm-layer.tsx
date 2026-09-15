"use client";

// FORTY-TWO AIRCRAFT, DRAWN IN THE ARENA'S OWN CAMERA.
//
// Not as mesh. The wireframe core dedups vertices by position, so forty-two copies of a shape share nothing
// and cost their own geometry every one; and a moving swarm rebuilt as mesh would re-validate every edge in
// the model on every tick. Movers are an overlay here for the same reason the target diamonds and the sight
// line are: the camera is shared, the cost is not.
//
// SIX PATHS, NOT FORTY-TWO. Aircraft are batched by side and by silhouette size, so a full engagement is a
// handful of DOM nodes rather than forty-two of them.
import { useMemo } from "react";
import { semanticHex } from "@/lib/wire-core/palette";
import { VECTOR_LAW, strokeProps } from "@/lib/wire-core/vector-law";
import { sceneProject, type SceneCam } from "@/lib/wire-core/scene-project";
import { GLYPHS, AIRFRAME_EXTENT, type GlyphBand } from "@/lib/drone-2525/airframe-glyph";
import { sideOf, type Swarm, type SwarmDraw } from "@/lib/drone-2525/swarm";
import type { Vec3 } from "@/lib/wire-core/wire-model";

/** Metres of aircraft on screen. Read from the real airframe rather than chosen. */
const SCALE_M = AIRFRAME_EXTENT.lengthM;

export function SwarmLayer({ swarm, plan, cam, groundAt }: {
  swarm: Swarm;
  plan: SwarmDraw;
  cam: SceneCam;
  groundAt: (e: number, n: number) => number;
}) {
  const paths = useMemo(() => {
    // side × band → one path each. Six buckets for forty-two aircraft.
    const buckets = new Map<string, string>();
    for (let i = 0; i < swarm.n; i++) {
      if (swarm.alive[i] === 0) continue;
      const band: GlyphBand = plan.band[i];
      const side = sideOf(i);
      const hr = (swarm.headingDeg[i] * Math.PI) / 180;
      const ch = Math.cos(hr), sh = Math.sin(hr);
      const ox = swarm.e[i], oy = swarm.nCoord[i];
      const oz = groundAt(ox, oy) + swarm.aglM[i];
      // Body (forward, right, up) → arena (east, north, up), yawed by the heading.
      const place = (p: readonly [number, number, number]): Vec3 => [
        ox + (p[0] * sh + p[1] * ch) * SCALE_M,
        oy + (p[0] * ch - p[1] * sh) * SCALE_M,
        oz + p[2] * SCALE_M,
      ];
      let d = "";
      for (const seg of GLYPHS[band]) {
        const a = sceneProject(place(seg[0]), cam);
        if (a.behind) continue;                                  // dropped, never clamped
        const b = sceneProject(place(seg[1]), cam);
        if (b.behind) continue;
        d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      if (!d) continue;
      const key = `${side}:${band}`;
      buckets.set(key, (buckets.get(key) ?? "") + d);
    }
    return Array.from(buckets.entries()).map(([key, d]) => {
      const [side, band] = key.split(":");
      return {
        key, d,
        // Red is reserved for hostile in the palette law; friendly takes the mount colour.
        hex: side === "hostile" ? semanticHex("ray") : semanticHex("mount"),
        width: band === "near" ? VECTOR_LAW.stroke.normal : VECTOR_LAW.stroke.hairline,
      };
    });
  }, [swarm, plan, cam, groundAt]);

  return (
    <svg width={cam.pw} height={cam.ph} viewBox={`0 0 ${cam.pw} ${cam.ph}`} style={{ display: "block" }} aria-hidden data-drone-swarm>
      {paths.map((p) => <path key={p.key} d={p.d} {...strokeProps(p.hex, p.width)} />)}
    </svg>
  );
}
