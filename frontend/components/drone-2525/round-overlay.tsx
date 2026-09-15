"use client";

// WHAT IS DRAWN ON TOP OF THE WORLD — the targets, the sight line, and the engagement.
//
// All of it in the arena's OWN camera. That is the whole reason this is an overlay and not mesh: the world
// is built once and projected by its own memo, while these move every tick, and putting movers into the
// mesh would rebuild and re-validate every edge in the model each time one of them shifted.
//
// Edges only, thirteen colours, no fill — the same law the world obeys. A target is a diamond of four
// segments rather than a filled marker for exactly that reason.
import { semanticHex } from "@/lib/wire-core/palette";
import { VECTOR_LAW, strokeProps } from "@/lib/wire-core/vector-law";
import { sceneProject } from "@/lib/wire-core/scene-project";
import { targetRole, type TargetView } from "@/lib/drone-2525/targets";
import type { LosResult } from "@/lib/drone-2525/los";
import type { Swarm, SwarmDraw } from "@/lib/drone-2525/swarm";
import type { Vec3 } from "@/lib/wire-core/wire-model";
import type { ArenaCtx } from "./arena-view";
import { SwarmLayer } from "./swarm-layer";

export function RoundOverlay({ ctx, views, eye, framed, los, swarm, swarmPlan }: {
  ctx: ArenaCtx;
  views: readonly TargetView[];
  eye: Vec3;
  framed: TargetView | null;
  los: LosResult | null;
  swarm: Swarm;
  swarmPlan: SwarmDraw | null;
}) {
  const p = (v: Vec3) => sceneProject(v, ctx.cam);
  const marks: React.ReactNode[] = [];

  for (const v of views) {
    const q = p(v.door.at);
    if (q.behind) continue;                                    // dropped, never clamped
    const r = v.phase === "up" ? 7 + 5 * (1 - v.progress) : 5;
    const d = `M${q.x} ${q.y - r}L${q.x + r} ${q.y}L${q.x} ${q.y + r}L${q.x - r} ${q.y}Z`;
    marks.push(<path key={v.door.id} d={d} {...strokeProps(semanticHex(targetRole(v.phase)), VECTOR_LAW.stroke.normal)} />);
  }

  if (framed) {
    const a = p(eye), b = p(framed.door.at);
    if (!a.behind && !b.behind) {
      const hex = semanticHex(los && !los.clear ? "blocked" : "ray");
      marks.push(<path key="sight" d={`M${a.x} ${a.y}L${b.x} ${b.y}`} {...strokeProps(hex, VECTOR_LAW.stroke.hairline)} />);
    }
  }

  return (
    <>
      {swarmPlan ? <SwarmLayer swarm={swarm} plan={swarmPlan} cam={ctx.cam} groundAt={ctx.ground} /> : null}
      <svg width={ctx.cam.pw} height={ctx.cam.ph} viewBox={`0 0 ${ctx.cam.pw} ${ctx.cam.ph}`}
           style={{ display: "block", position: "absolute", inset: 0 }} aria-hidden>
        {marks}
      </svg>
    </>
  );
}
