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
import { tboxPath } from "@/lib/drone-2525/tap-target";
import { SLOT_NS, type Slots } from "@/lib/drone-2525/slots";
import { SwarmLayer } from "./swarm-layer";

export function RoundOverlay({ ctx, views, eye, myEye, framed, los, swarm, swarmPlan, slots }: {
  ctx: ArenaCtx;
  views: readonly TargetView[];
  /** Where the SENSOR is — the laser and the sight line start here whoever is looking. */
  eye: Vec3;
  /** Where the person at THIS screen is. On an airframe that is not the same point. */
  myEye: Vec3;
  framed: TargetView | null;
  los: LosResult | null;
  swarm: Swarm;
  swarmPlan: SwarmDraw | null;
  /** T1 T2 T3 — drawn as r.050's T-box: amber until approved, red after. */
  slots?: Slots;
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

  // THE T-BOX. Bracket corners and n ticks around each designated door, amber (a mark that cannot fire)
  // or red (approved). Drawn here, in the world's camera, so the box sits on the door at every pitch and
  // bearing rather than being a HUD label somewhere else.
  if (slots) {
    for (const n of SLOT_NS) {
      const d = slots.s[n]; if (!d) continue;
      const v = views.find((x) => x.door.id === d.doorId); if (!v) continue;
      const q = p(v.door.at); if (q.behind) continue;
      const hex = semanticHex(d.phase === "red" ? "ray" : "pending");
      marks.push(<path key={`tbox-${n}`} data-drone-tbox={n} data-drone-tbox-phase={d.phase} d={tboxPath(q.x, q.y, slots.current === n ? 16 : 13, n)}
                       {...strokeProps(hex, slots.current === n ? VECTOR_LAW.stroke.normal : VECTOR_LAW.stroke.hairline)} />);
    }
  }

  if (framed) {
    const a = p(eye), b = p(framed.door.at);
    if (!a.behind && !b.behind) {
      const hex = semanticHex(los && !los.clear ? "blocked" : "ray");
      marks.push(<path key="sight" d={`M${a.x} ${a.y}L${b.x} ${b.y}`} {...strokeProps(hex, VECTOR_LAW.stroke.hairline)} />);
    }
  }

  // THE PARALLAX, DRAWN. A pilot should be able to SEE that the laser does not leave from where they are
  // sitting: a small cross at their own eye and a hairline back to the sensor. On a turret the two points
  // coincide and nothing is drawn — the separation is zero there, and drawing a mark for it would be an
  // invention. Same rule as everywhere else: behind the camera is dropped, never clamped.
  {
    const me = p(myEye), sen = p(eye);
    const apart = Math.hypot(me.x - sen.x, me.y - sen.y);
    if (!me.behind && !sen.behind && apart > 1.5) {
      marks.push(
        <path key="myeye" d={`M${me.x - 4} ${me.y}L${me.x + 4} ${me.y}M${me.x} ${me.y - 4}L${me.x} ${me.y + 4}`}
              {...strokeProps(semanticHex("frustum"), VECTOR_LAW.stroke.normal)} />,
        <path key="parallax" d={`M${me.x} ${me.y}L${sen.x} ${sen.y}`}
              {...strokeProps(semanticHex("frustum"), VECTOR_LAW.stroke.hairline)} />,
      );
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
