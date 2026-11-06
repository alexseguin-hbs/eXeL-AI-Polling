"use client";
/**
 * ARCHITECT-2525 · WALKTHROUGH — a real first-person interior view (operator 2026-11-04: "walk through doesn't work …
 * this is your chance to build out walk through functionality"; earlier: "walk floors … immersion view and look around
 * to see walls, corners"). The previous "walk" was the voxel dollhouse tilted into a corner — not a walkthrough.
 *
 * This is a purpose-built pinhole camera (not the map-tilt sceneProject, which clips when the eye is inside the box).
 * You STAND IN THE ROOM'S DOORWAY looking in: the eye starts just outside the near (south) wall, so every point of the
 * room is in front of the eye — no near-plane clipping at the stance. Drag (or the LOOK stick) to look around (yaw +
 * pitch); the LEFT stick MOVES you (strafe + forward/back) and walking forward through a doorway steps to the next room.
 *
 * REUSE (R-CORE, operator 2026-11-06 "modular reuse — do not write a new stick or a new projection"):
 *  · QUAD CONTROLLER — the twin thumb-sticks are Drone-2525's ACTUAL <Stick> (components/drone-2525/stick.tsx), the
 *    SAME component the Drone ControlDeck uses (L = MOVE / body, R = LOOK / head), imported verbatim — no parallel stick.
 *  · SEE PAST THE DOOR — the depth-sorted, perspective-receding solid faces come from the ONE shared face pipeline in
 *    lib/solid-shade.ts (solidFaces + shade + FACE_SHADE + boxFaces), which that file documents as the extraction of
 *    Security-2525's mission-planning radar projector (radarSolidFaces / FACE_SHADE / darkerHex). The adjacent rooms
 *    (from `layout`) and the exterior ground are built as quads and fed through the SAME solidFaces() call + this room's
 *    pinhole projector, so a doorway reveals the next room RECEDING into the distance (depth fog toward the horizon),
 *    never a black void. The projector is per-camera by that module's contract ("the walkthrough's interior pinhole, the
 *    radar's orthographic tilt") — only the face building + shading + sort are shared.
 */
import { useRef, useState, useEffect, useCallback, type PointerEvent as RPE } from "react";
import type { RoomCell } from "@/lib/room-layout";
import { footprintOf, heightOf, elevOf, OBJECT_SPEC, defaultObjectsForRoom, groupOf, type PlacedObject } from "@/lib/room-objects";
import { shade, FACE_SHADE, solidFaces, boxFaces, type Vec3, type Quad } from "@/lib/solid-shade";
import { showGroupInPhase } from "@/lib/architect-phases";       // REUSE the SAME phase→layer filter the 2D/3D designer uses
import { canCrossDoor, DOOR_W } from "@/lib/architect-walk-nav"; // the pure "cannot walk through solid wall" door-span rule
import { applySets, getSets, initSets, subscribeSets, type StickSets } from "@/lib/2525-core/stick-sets"; // REUSE stick calibration
import { WalkRaster, LookGlyph } from "./architect-walk-icons";
import { Stick } from "@/components/drone-2525/stick";           // REUSE the actual Drone-2525 thumb-stick (single source)
import { semanticHex } from "@/lib/wire-core/palette";           // Drone-2525's own stick colours (mount = body, frustum = head)
import { useLexicon } from "@/lib/lexicon-context";

const C = { bg: "#0a0f16", ink: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400", wall: "#2a3a4f", floor: "#121b26", ceil: "#0c131c", edge: "#1e2b3a", ground: "#0b1410" };
const ROOM_FT = 10, CEIL_FT = 10, EYE_FT = 5.5;      // one storey; eye at ~5.5 ft
const DOOR_H = 7;                                    // door opening height (DOOR_W is the shared walk-nav constant)
const WIN_W = 3.6, WIN_SILL = 3, WIN_HEAD = 6.5;     // an exterior window (perimeter wall) — see the outside through it
const MOVE_SPEED = 6.5, LOOK_YAW = 1.9, LOOK_PITCH = 1.4;  // ft/s · rad/s (stick deflection × these)

type V3 = Vec3;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function ArchitectWalkthrough({ room, layout, onStep, phase = null, height = 380, title }: {
  room?: RoomCell | null; layout: RoomCell[]; onStep?: (dRow: number, dCol: number) => void;
  phase?: string | null;   // the selected build phase — the walk shows ONLY that phase's layer (the SAME filter as 2D/3D)
  height?: number; title?: string;
}) {
  const { t } = useLexicon();
  const W = 760, H = Math.max(240, height);
  const [yaw, setYaw] = useState(0);      // radians; 0 = facing into the room (+y / north)
  const [pitch, setPitch] = useState(0);  // radians; + looks up
  // STICK CALIBRATION (reuse lib/2525-core/stick-sets) — the saved L/R SENS & DEAD apply to the MOVE/LOOK sticks, the
  // same model the Drone deck uses; a ref so the flight loop + stick callbacks read the live set without re-subscribing.
  const sets = useRef<StickSets>(getSets());
  useEffect(() => { sets.current = initSets(); const un = subscribeSets((s) => { sets.current = s; }); return un; }, []);
  // The eye POSITION (feet, room space). Starts at the south doorway stance just OUTSIDE the near wall (ey = -2) so the
  // whole room is in front of the eye; the MOVE stick walks it around, and crossing a doorway steps to the next room.
  const ex0 = ROOM_FT / 2, ey = -2, ez = EYE_FT;
  const [eye, setEye] = useState({ x: ex0, y: ey });
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  // refs the animation loop reads without re-subscribing (stale-closure-free), Drone-flight-loop style
  const moveVec = useRef({ x: 0, y: 0 });   // LEFT stick: x = strafe, y = forward/back (screen-down positive), calibrated
  const lookVec = useRef({ x: 0, y: 0 });   // RIGHT stick: x = yaw, y = pitch, calibrated
  const eyeRef = useRef(eye); eyeRef.current = eye;
  // step to the adjacent room through a doorway (the one place onStep is called) — kept behind a ref so the flight loop
  // calls the live handler without re-subscribing.
  const stepTo = useCallback((dRow: number, dCol: number) => { onStep?.(dRow, dCol); }, [onStep]);
  const stepRef = useRef(stepTo); stepRef.current = stepTo;
  const stepLock = useRef(false);           // one step per doorway crossing (cleared when the room actually changes)

  const onDown = (e: RPE) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, yaw, pitch }; };
  const onMove = useCallback((e: RPE) => {
    const d = drag.current; if (!d) return;
    const ny = d.yaw + (e.clientX - d.x) * 0.006;        // turn
    const np = d.pitch - (e.clientY - d.y) * 0.006;      // look up/down (screen up = look up)
    setYaw(clamp(ny, -1.4, 1.4));                        // ±80°
    setPitch(clamp(np, -0.7, 0.7));                      // ±40°
  }, []);
  const onUp = (e: RPE) => { (e.target as Element).releasePointerCapture?.(e.pointerId); drag.current = null; };

  // adjacency → which walls carry a door, + the neighbour label (computed before the loop so the loop can read it)
  const at = useCallback((r: number, c: number) => layout.find((x) => x.row === r && x.col === c), [layout]);
  const nb = room ? { N: at(room.row - 1, room.col), E: at(room.row, room.col + 1), W: at(room.row, room.col - 1) } : { N: undefined, E: undefined, W: undefined };
  const nbRef = useRef(nb); nbRef.current = nb;

  // Entering a room (or stepping to a neighbour) re-seats the eye at that room's south doorway stance and levels the look.
  useEffect(() => { setEye({ x: ex0, y: ey }); setYaw(0); setPitch(0); stepLock.current = false; }, [room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── the flight loop: the LOOK stick turns/tilts; the MOVE stick STRAFES across the doorway and LEANS in, but the eye
  //    stays on the doorway stance (y ≤ -0.5) so it never enters the room on foot and can never walk through a solid wall.
  //    A sustained FORWARD push, lined up with the north doorway (the door span, canCrossDoor), STEPS to the next room. ──
  useEffect(() => {
    let raf = 0, last = performance.now();
    const FWD = 0.55; // forward-push deflection past which a sustained push counts as "walk through the door"
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const lk = lookVec.current, mv = moveVec.current;
      if (lk.x) setYaw((y) => clamp(y + lk.x * LOOK_YAW * dt, -1.4, 1.4));
      if (lk.y) setPitch((p) => clamp(p - lk.y * LOOK_PITCH * dt, -0.7, 0.7));
      // STEP — a sustained forward push, only where the north door span allows it (you cannot push through solid wall)
      if (!stepLock.current && mv.y < -FWD && nbRef.current.N && canCrossDoor(eyeRef.current.x - ROOM_FT / 2)) {
        stepLock.current = true; stepRef.current(-1, 0);
      }
      // STRAFE across the opening + a slight lean; the eye is clamped to the doorway stance (x in the room width, y ≤ -0.5)
      if (mv.x || mv.y) {
        setEye((e) => ({ x: clamp(e.x + mv.x * MOVE_SPEED * dt, 0.3, ROOM_FT - 0.3), y: clamp(e.y - mv.y * MOVE_SPEED * dt, -2.5, -0.5) }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pinhole camera. Looking +y into the room; the eye position is live (MOVE stick).
  const fov = (72 * Math.PI) / 180, f = (W / 2) / Math.tan(fov / 2), near = 0.4;
  const cy0 = Math.cos(yaw), sy0 = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const project = (p: V3): { x: number; y: number; depth: number } | null => {
    const dx = p[0] - eye.x, dy = p[1] - eye.y, dz = p[2] - ez;
    const cx = dx * cy0 + dy * sy0;          // right
    const cyf = -dx * sy0 + dy * cy0;        // forward (pre-pitch)
    const depth = cyf * cp + dz * sp;
    const up = -cyf * sp + dz * cp;
    if (!(depth > near)) return null;
    return { x: W / 2 + (cx / depth) * f, y: H * 0.5 - (up / depth) * f, depth };
  };
  const poly = (pts: V3[]) => { const ps = pts.map(project); if (ps.some((p) => !p)) return null; return { d: ps.map((p) => `${p!.x.toFixed(1)},${p!.y.toFixed(1)}`).join(" "), depth: ps.reduce((s, p) => s + p!.depth, 0) / ps.length }; };

  // ── one wall of a room at offset (ox,oy): a solid panel, or framed around a centred opening (door = floor→head;
  //    window = sill→head), so the room/exterior BEYOND the opening shows through. Jamb/header/sill are separate quads. ──
  type Side = "N" | "S" | "W" | "E";
  const vwall = (side: Side, ox: number, oy: number, opening: { span: number; z0: number; z1: number } | null): Quad[] => {
    const kind: Quad["kind"] = side === "N" || side === "S" ? "front" : "side";
    const horiz = side === "N" || side === "S";
    const fixed = side === "N" ? oy + ROOM_FT : side === "S" ? oy : side === "W" ? ox : ox + ROOM_FT;
    const a0 = horiz ? ox : oy, a1 = a0 + ROOM_FT;
    const pt = (s: number, z: number): V3 => (horiz ? [s, fixed, z] : [fixed, s, z]);
    const quad = (s0: number, s1: number, zA: number, zB: number): Quad => ({ kind, color: C.wall, pts: [pt(s0, zA), pt(s1, zA), pt(s1, zB), pt(s0, zB)] });
    if (!opening) return [quad(a0, a1, 0, CEIL_FT)];
    const mid = (a0 + a1) / 2, gL = mid - opening.span / 2, gR = mid + opening.span / 2;
    const out: Quad[] = [quad(a0, gL, 0, CEIL_FT), quad(gR, a1, 0, CEIL_FT)];           // left + right jamb panels
    if (opening.z0 > 0) out.push(quad(gL, gR, 0, opening.z0));                           // sill (window)
    if (opening.z1 < CEIL_FT) out.push(quad(gL, gR, opening.z1, CEIL_FT));              // header
    return out;
  };
  const doorOpen = { span: DOOR_W, z0: 0, z1: DOOR_H };
  const winOpen = { span: WIN_W, z0: WIN_SILL, z1: WIN_HEAD };
  // ONE phase→layer filter (showGroupInPhase) — the SAME source the 2D/3D designer uses, so the walk honours the selected
  // phase: a structural phase walks the shell with its furniture hidden; Interior Design (or no phase) shows the furniture.
  const inPhase = (o: PlacedObject) => showGroupInPhase(groupOf(o.kind), phase);
  const furnOf = (cell: RoomCell | null | undefined, ox: number, oy: number): Quad[] =>
    (cell ? (cell.objects ?? defaultObjectsForRoom(cell.k)) : []).filter(inPhase).flatMap((o) => {
      const fp = footprintOf(o); const swap = o.rot === 90 || o.rot === 270;
      const w = swap ? fp.d : fp.w, dp = swap ? fp.w : fp.d;
      return boxFaces(ox + o.gx + 0.5 - w / 2, oy + o.gy + 0.5 - dp / 2, elevOf(o), w, dp, heightOf(o), OBJECT_SPEC[o.kind]?.color);
    });
  // A neighbour room beyond a shared wall: floor + ceiling + its three outer walls (solid backdrop), its SHARED wall left
  // as a doorway so the view is continuous; furniture inside. Fed through the SAME solidFaces() so it recedes with depth.
  const roomBox = (ox: number, oy: number, openSide: Side): Quad[] => {
    const q: Quad[] = [
      { kind: "floor", color: C.floor, pts: [[ox, oy, 0], [ox + ROOM_FT, oy, 0], [ox + ROOM_FT, oy + ROOM_FT, 0], [ox, oy + ROOM_FT, 0]] },
      { kind: "ceil", color: C.wall, pts: [[ox, oy, CEIL_FT], [ox + ROOM_FT, oy, CEIL_FT], [ox + ROOM_FT, oy + ROOM_FT, CEIL_FT], [ox, oy + ROOM_FT, CEIL_FT]] },
    ];
    for (const side of ["N", "S", "W", "E"] as Side[]) q.push(...vwall(side, ox, oy, side === openSide ? doorOpen : null));
    return q;
  };

  // ── THIS room's shell + the rooms/exterior visible through its openings — ALL as quads through ONE solidFaces() call.
  const wallQuads: Quad[] = [
    { kind: "floor", color: C.floor, pts: [[0, 0, 0], [ROOM_FT, 0, 0], [ROOM_FT, ROOM_FT, 0], [0, ROOM_FT, 0]] },
    { kind: "ceil", color: C.wall, pts: [[0, 0, CEIL_FT], [ROOM_FT, 0, CEIL_FT], [ROOM_FT, ROOM_FT, CEIL_FT], [0, ROOM_FT, CEIL_FT]] },
  ];
  // N/W/E: a DOORWAY where there is a neighbour (see the next room), else a WINDOW to the exterior. S is the stance (open).
  wallQuads.push(...vwall("N", 0, 0, nb.N ? doorOpen : winOpen));
  wallQuads.push(...vwall("W", 0, 0, nb.W ? doorOpen : winOpen));
  wallQuads.push(...vwall("E", 0, 0, nb.E ? doorOpen : winOpen));
  // the adjacent rooms, each beyond its shared wall (the neighbour's near wall is the open doorway)
  if (nb.N) wallQuads.push(...roomBox(0, ROOM_FT, "S"));
  if (nb.W) wallQuads.push(...roomBox(-ROOM_FT, 0, "E"));
  if (nb.E) wallQuads.push(...roomBox(ROOM_FT, 0, "W"));
  // the EXTERIOR — a wide ground plane receding past the house, seen through any perimeter window (never a black void)
  wallQuads.push({ kind: "floor", color: C.ground, pts: [[-40, -40, -0.1], [50, -40, -0.1], [50, 50, -0.1], [-40, 50, -0.1]] });

  // FURNITURE — this room's objects (the SAME source the 2D plan + voxel use), FILTERED to the selected phase's layer,
  // plus the neighbours', all shaded identically.
  const objects = (room ? (room.objects ?? defaultObjectsForRoom(room.k)) : []).filter(inPhase);
  const furnQuads: Quad[] = objects.flatMap((o) => {
    const fp = footprintOf(o); const swap = o.rot === 90 || o.rot === 270;
    const w = swap ? fp.d : fp.w, dp = swap ? fp.w : fp.d;
    return boxFaces(o.gx + 0.5 - w / 2, o.gy + 0.5 - dp / 2, elevOf(o), w, dp, heightOf(o), OBJECT_SPEC[o.kind]?.color);
  });
  if (nb.N) furnQuads.push(...furnOf(nb.N, 0, ROOM_FT));
  if (nb.W) furnQuads.push(...furnOf(nb.W, -ROOM_FT, 0));
  if (nb.E) furnQuads.push(...furnOf(nb.E, ROOM_FT, 0));
  const faces = solidFaces([...wallQuads, ...furnQuads], project);
  // DEPTH FOG — faces beyond this room recede toward the dark horizon (the mission-planning distance falloff, via the
  // shared shade()): no fade within ~12 ft, saturating by ~46 ft, so the next room / exterior read as far away.
  const fog = (hex: string, depth: number) => { const fct = clamp((depth - 12) / 34, 0, 0.82); return fct <= 0 ? hex : shade(hex, 1 - fct); };

  // floor grid lines (1-ft) in THIS room
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i <= ROOM_FT; i++) {
    const a = project([i, 0, 0]), b = project([i, ROOM_FT, 0]); if (a && b) gridLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    const c = project([0, i, 0]), d = project([ROOM_FT, i, 0]); if (c && d) gridLines.push({ x1: c.x, y1: c.y, x2: d.x, y2: d.y });
  }
  // vertical corner edges (emphasised — "see corners")
  const corners: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const [cxp, cyp] of [[0, 0], [ROOM_FT, 0], [0, ROOM_FT], [ROOM_FT, ROOM_FT]] as [number, number][]) {
    const a = project([cxp, cyp, 0]), b = project([cxp, cyp, CEIL_FT]); if (a && b) corners.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }

  // doorway FRAME + the neighbour's name above it (the opening is NOT filled black any more — you see into the next room)
  type Door = { d: string; depth: number; label: string; lx: number; ly: number };
  const doors: Door[] = [];
  const addDoor = (corners4: V3[], label: string) => { const q = poly(corners4); const top = project([(corners4[0][0] + corners4[1][0]) / 2, (corners4[0][1] + corners4[1][1]) / 2, DOOR_H + 0.4]); if (q && top) doors.push({ d: q.d, depth: q.depth - 0.01, label, lx: top.x, ly: top.y }); };
  const cxm = ROOM_FT / 2;
  if (nb.N) addDoor([[cxm - DOOR_W / 2, ROOM_FT, 0], [cxm + DOOR_W / 2, ROOM_FT, 0], [cxm + DOOR_W / 2, ROOM_FT, DOOR_H], [cxm - DOOR_W / 2, ROOM_FT, DOOR_H]], nb.N.label);
  if (nb.W) addDoor([[0, cxm - DOOR_W / 2, 0], [0, cxm + DOOR_W / 2, 0], [0, cxm + DOOR_W / 2, DOOR_H], [0, cxm - DOOR_W / 2, DOOR_H]], nb.W.label);
  if (nb.E) addDoor([[ROOM_FT, cxm - DOOR_W / 2, 0], [ROOM_FT, cxm + DOOR_W / 2, 0], [ROOM_FT, cxm + DOOR_W / 2, DOOR_H], [ROOM_FT, cxm - DOOR_W / 2, DOOR_H]], nb.E.label);

  const moveHex = semanticHex("mount"), lookHex = semanticHex("frustum"); // Drone-2525's body / head stick colours

  return (
    <div data-arch-walkthrough className="relative select-none overflow-hidden rounded-lg" style={{ height: H, background: `radial-gradient(130% 100% at 50% 18%, #16243a, #0d1420 55%, ${C.bg})`, border: `1px solid ${C.edge}`, touchAction: "none" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ display: "block", cursor: "grab" }}>
        {faces.map((fc, i) => <polygon key={`f${i}`} points={fc.d} fill={fog(shade(fc.color ?? C.wall, FACE_SHADE[fc.kind]), fc.depth)} stroke={fc.kind === "front" || fc.kind === "side" ? C.edge : "none"} strokeWidth={fc.kind === "front" || fc.kind === "side" ? 0.6 : 0} />)}
        {gridLines.map((g, i) => <line key={`g${i}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={`${C.cyan}22`} strokeWidth={1} />)}
        {corners.map((c, i) => <line key={`c${i}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={`${C.cyan}55`} strokeWidth={1.4} />)}
        {doors.map((d, i) => (
          <g key={`d${i}`}>
            <polygon points={d.d} fill="none" stroke={C.cyan} strokeWidth={1.2} />
            <text x={d.lx} y={d.ly} fill={C.cyan} fontSize={11} textAnchor="middle" style={{ fontFamily: "ui-monospace, Consolas, monospace" }}>{d.label}</text>
          </g>
        ))}
      </svg>

      {/* current-room HUD (operator's WALK MODE raster, no emoji) */}
      <div data-arch-walk-room className="absolute left-2 top-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold" style={{ borderColor: C.cyan, color: C.cyan, background: "#0a0f16ee" }}>
        <WalkRaster size={16} /> {room ? `${room.k} · ${room.label}` : "—"}
      </div>
      {/* look-around hint (custom LookGlyph) */}
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px]" style={{ borderColor: C.edge, color: C.dim, background: "#0a0f16cc" }}>
        <LookGlyph size={13} /> {t("arch.walk.hint")}
      </div>
      {/* QUAD CONTROLLER (reuses Drone-2525's actual <Stick> + its saved calibration via applySets) — L = MOVE (strafe
          across the opening + a sustained forward push steps through the doorway), R = LOOK (yaw + pitch). Thumb-reachable
          at the two bottom corners; the step runs through onStep in the flight loop above (the door-span rule gates it). */}
      <div data-arch-walkpad data-arch-walk-sticks className="pointer-events-none absolute inset-x-0 bottom-2 flex items-end justify-between px-3">
        <div className="pointer-events-auto"><Stick label={t("arch.walk.move")} hex={moveHex} size={84} onMove={(x, y) => { moveVec.current = applySets({ x, y }, "L", sets.current); }} /></div>
        <div className="pointer-events-auto"><Stick label={t("arch.walk.look")} hex={lookHex} size={84} onMove={(x, y) => { lookVec.current = applySets({ x, y }, "R", sets.current); }} /></div>
      </div>
      <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px]" style={{ color: C.dim }}>{title ?? t("arch.walk.title")}</div>
    </div>
  );
}
