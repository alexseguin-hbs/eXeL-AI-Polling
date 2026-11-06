"use client";
/**
 * ARCHITECT-2525 · WALKTHROUGH — a real first-person interior view (operator 2026-11-04 "build out walk through"; 2026-11-06
 * "user gets stuck behind furniture" · "see the wires and outlets" · "the viewer is the #1 UX"). A purpose-built pinhole
 * camera: you stand INSIDE the room and walk it with twin thumb-sticks, the walls solid except at their doorways.
 *
 * MoT game-engine synthesis (Unity CharacterController / Unreal CMC — universal FPS primitives) + the 12-AsM round-2 fixes:
 *  · Y-AXIS FLIP (root cause of "stuck behind the bed"): plan gy 0 = NORTH wall but the camera enters from the SOUTH, so
 *    every object's world y is ROOM_FT − planY.
 *  · a real IN-ROOM body (eye 5.5 ft, body radius WALK_R) that COLLIDES-AND-SLIDES (lib/architect-walk-collide), with a
 *    DOOR-WIDTH clear lane carved to every doorway so you reach the door in EVERY room (not just the hand-tuned bedroom).
 *  · doors are GAPS at the ACTUAL placed-door position (not always the wall centre); crossing one STEPS to the neighbour
 *    and carries the position. Unbounded yaw; the VIEWER FILLS the box (viewBox tracks the container, no letterbox).
 *
 * REUSE (R-CORE): Drone-2525's ACTUAL <Stick> (+ applySets calibration); lib/solid-shade's face pipeline; lib/mep-runs'
 * run geometry (via lib/architect-walk-mep); the designer's showGroupInPhase phase filter. Adjacent rooms + the exterior
 * ground feed the SAME solidFaces() call so a doorway reveals the next room receding into the distance.
 */
import { useRef, useState, useEffect, useCallback, useMemo, type PointerEvent as RPE } from "react";
import type { RoomCell } from "@/lib/room-layout";
import { STOREY_FT } from "@/lib/room-layout";          // the ONE cube/ceiling height source (10 ft) — never hardcode 8
import { footprintOf, heightOf, elevOf, OBJECT_SPEC, defaultObjectsForRoom, groupOf, wallOf, type PlacedObject } from "@/lib/room-objects";
import { shade, FACE_SHADE, solidFaces, boxFaces, type Vec3, type Quad } from "@/lib/solid-shade";
import { showGroupInPhase, phaseById } from "@/lib/architect-phases"; // REUSE the SAME phase→layer filter the 2D/3D designer uses
import { canCrossDoor, DOOR_W, ROOM_FT } from "@/lib/architect-walk-nav"; // the pure door-span rule (cannot walk through solid wall)
import { roomBlockers, walkMove, WALK_R, type Rect } from "@/lib/architect-walk-collide"; // the pure collide-and-slide (never stuck)
import { walkMep, type MepLayer } from "@/lib/architect-walk-mep"; // REUSE the 2D/3D MEP geometry as walk-world elevation
import { walkFraming, type WalkOpening } from "@/lib/architect-walk-framing"; // the stud layout for the Framing phase
import { studGaugeById, FRAME_COLOR, FRAME_HEADER_COLOR, STUD_SPACING_IN } from "@/lib/architect-phase-palette"; // REUSE the one stud gauge/palette
import { applySets, getSets, initSets, subscribeSets, type StickSets } from "@/lib/2525-core/stick-sets"; // REUSE stick calibration
import { WalkRaster, LookGlyph } from "./architect-walk-icons";
import { Stick } from "@/components/drone-2525/stick";           // REUSE the actual Drone-2525 thumb-stick (single source)
import { semanticHex } from "@/lib/wire-core/palette";           // Drone-2525's own stick colours (mount = body, frustum = head)
import { useLexicon } from "@/lib/lexicon-context";

const C = { bg: "#0a0f16", ink: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400", wall: "#2a3a4f", floor: "#121b26", ceil: "#0c131c", edge: "#1e2b3a", ground: "#0b1410" };
const CEIL_FT = STOREY_FT, EYE_FT = 5.5;             // one 10-ft storey = the cube (ONE source: room-layout STOREY_FT); eye ~5.5 ft
const START_IN = 1.5;                                // the eye starts this far INSIDE the entry door (near wall behind you)
const DOOR_H = 6.67;                                 // door opening height (6'-8" standard, real door — unrelated to the storey)
const WIN_W = 3.6, WIN_SILL = 3, WIN_HEAD = 6.5;     // an exterior window (perimeter wall) — see the outside through it
// FPS feel (MoT synthesis): ~4.5 ft/s indoor walk, smooth accel; the saved stick calibration (applySets) shapes the
// deadzone/sensitivity further. HFOV/VFOV keep the picture framed with no letterbox at any container aspect (WALK-11).
const MOVE_SPEED = 4.5, MOVE_ACCEL = 11, LOOK_YAW = 2.0, LOOK_PITCH = 1.5;  // ft/s · 1/s accel · rad/s · rad/s
const HFOV = (65 * Math.PI) / 180, VFOV = (58 * Math.PI) / 180;

type V3 = Vec3;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
type Side = "N" | "S" | "W" | "E";
// the world along-wall centre of a placed door on this wall (x for N/S · flipped y for W/E), or null → use the wall centre.
const wallDoorCenter = (objs: PlacedObject[], side: Side): number | null => {
  for (const o of objs) { if (o.kind === "door" && wallOf(o.gx, o.gy) === side) return side === "N" || side === "S" ? o.gx + 0.5 : ROOM_FT - (o.gy + 0.5); }
  return null;
};

export function ArchitectWalkthrough({ room, layout, onStep, phase = null, showWiring = false, showWater = false, showSewer = false, showDucts = false, showSockets = false, studGauge = "2x6", height = 380, title }: {
  room?: RoomCell | null; layout: RoomCell[]; onStep?: (dRow: number, dCol: number) => void;
  phase?: string | null;   // the selected build phase — the walk shows ONLY that phase's layer (the SAME filter as 2D/3D)
  showWiring?: boolean; showWater?: boolean; showSewer?: boolean; showDucts?: boolean; showSockets?: boolean;  // MEP layers (E1/WALK-05)
  studGauge?: "2x4" | "2x6";   // the framing gauge (P1) — the walk shows the studs in the Framing phase
  height?: number; title?: string;
}) {
  const { t } = useLexicon();
  const Hpx = Math.max(240, height);
  const roomObjs = room ? (room.objects ?? defaultObjectsForRoom(room.k)) : [];
  // ACTUAL per-wall door centre (the user's placed door, else the wall centre) — drives the openings, the lanes + crossings.
  const doorCtr = { N: wallDoorCenter(roomObjs, "N") ?? ROOM_FT / 2, S: wallDoorCenter(roomObjs, "S") ?? ROOM_FT / 2, E: wallDoorCenter(roomObjs, "E") ?? ROOM_FT / 2, W: wallDoorCenter(roomObjs, "W") ?? ROOM_FT / 2 };

  // VIEWBOX tracks the container px so the 3D picture FILLS the box (no letterbox) and the sticks sit ON the picture.
  const rootRef = useRef<HTMLDivElement>(null);
  const [vb, setVb] = useState({ w: 760, h: Hpx });
  useEffect(() => {
    const el = rootRef.current; if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); if (r.width > 2 && r.height > 2) setVb({ w: Math.round(r.width), h: Math.round(r.height) }); });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const W = vb.w, H = vb.h;

  const [yaw, setYaw] = useState(0);      // radians; 0 = facing into the room (+y / far). UNBOUNDED (turn all the way round)
  const [pitch, setPitch] = useState(0);  // radians; + looks up (clamped ±40°)
  // STICK CALIBRATION (reuse lib/2525-core/stick-sets) — the saved L/R SENS, DEAD apply to both sticks.
  const sets = useRef<StickSets>(getSets());
  useEffect(() => { sets.current = initSets(); const un = subscribeSets((s) => { sets.current = s; }); return un; }, []);
  // The eye POSITION (feet, world: x 0=west..10=east · y 0=south/near..10=north/far). Spawns at the ENTRY door, just inside,
  // facing INTO the room (not a blank wall): at the S-door x if entered from the south, else room centre.
  const ez = EYE_FT;
  const [eye, setEye] = useState(() => ({ x: wallDoorCenter(roomObjs, "S") ?? ROOM_FT / 2, y: START_IN }));
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  // refs the walk loop reads without re-subscribing (stale-closure-free), Drone-flight-loop style
  const moveVec = useRef({ x: 0, y: 0 });   // LEFT stick: x = strafe, y = forward/back (screen-down positive), calibrated
  const lookVec = useRef({ x: 0, y: 0 });   // RIGHT stick: x = yaw, y = pitch, calibrated
  const vel = useRef({ x: 0, y: 0 });       // smoothed world velocity (ft/s) — accel toward the stick target (FPS feel)
  const yawRef = useRef(yaw); yawRef.current = yaw;
  const eyeRef = useRef(eye); eyeRef.current = eye;
  const furnRects = useRef<Rect[]>([]);     // this room's blockers, with the door lanes carved (never stuck)
  const dcRef = useRef(doorCtr); dcRef.current = doorCtr;
  const stepTo = useCallback((dRow: number, dCol: number) => { onStep?.(dRow, dCol); }, [onStep]);
  const stepRef = useRef(stepTo); stepRef.current = stepTo;
  const stepLock = useRef(false);           // one step per crossing — cleared only when the room id actually changes

  const onDown = (e: RPE) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, yaw, pitch }; };
  const onMove = useCallback((e: RPE) => {
    const d = drag.current; if (!d) return;
    setYaw(d.yaw - (e.clientX - d.x) * 0.006);                   // turn: drag RIGHT → look right/east (WALK-P1 look fix)
    setPitch(clamp(d.pitch - (e.clientY - d.y) * 0.006, -0.7, 0.7)); // look up/down (±40°)
  }, []);
  const onUp = (e: RPE) => { (e.target as Element).releasePointerCapture?.(e.pointerId); drag.current = null; };

  // adjacency → which walls carry a door, + the neighbour label (computed before the loop so the loop can read it)
  const at = useCallback((r: number, c: number) => layout.find((x) => x.row === r && x.col === c), [layout]);
  const nb = room ? { N: at(room.row - 1, room.col), S: at(room.row + 1, room.col), E: at(room.row, room.col + 1), W: at(room.row, room.col - 1) }
    : { N: undefined, S: undefined, E: undefined, W: undefined };
  const nbRef = useRef(nb); nbRef.current = nb;

  // Stepping through a doorway CARRIES the position across (no reset) → continuous walk; the only reset is clearing the
  // step lock when the room id has actually changed (MoT: doors are gaps, not teleports; keep yaw/pitch untouched).
  useEffect(() => { stepLock.current = false; }, [room?.id]);

  // ── the walk loop (universal FPS primitives): LOOK turns/tilts; MOVE walks in the facing direction with smooth accel;
  //    the body COLLIDES-AND-SLIDES around furniture and clamps to the solid walls, except at the (placed) door GAP where
  //    it STEPS to the neighbour carrying its position. Reads refs so it never goes stale; client-side only. ──
  useEffect(() => {
    let raf = 0, last = performance.now();
    const tick = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      const lk = lookVec.current, mv = moveVec.current;
      if (lk.x) setYaw((y) => y - lk.x * LOOK_YAW * dt);                        // LOOK right → yaw east (WALK-P1 look fix)
      if (lk.y) setPitch((p) => clamp(p - lk.y * LOOK_PITCH * dt, -0.7, 0.7)); // pitch ±40°
      const yw = yawRef.current, cs = Math.cos(yw), sn = Math.sin(yw);
      const fwd = -mv.y, str = mv.x;
      const tx = (str * cs - fwd * sn) * MOVE_SPEED, ty = (str * sn + fwd * cs) * MOVE_SPEED;
      const k = Math.min(1, MOVE_ACCEL * dt);
      vel.current = { x: vel.current.x + (tx - vel.current.x) * k, y: vel.current.y + (ty - vel.current.y) * k };
      const v = vel.current;
      if (Math.abs(v.x) > 1e-3 || Math.abs(v.y) > 1e-3) {
        const from = eyeRef.current;
        const desired = { x: from.x + v.x * dt, y: from.y + v.y * dt };
        const n = nbRef.current, dc = dcRef.current;
        // door crossings at the ACTUAL door centre
        const nCross = !!n.N && canCrossDoor(desired.x - dc.N), sCross = !!n.S && canCrossDoor(desired.x - dc.S);
        const eCross = !!n.E && canCrossDoor(desired.y - dc.E), wCross = !!n.W && canCrossDoor(desired.y - dc.W);
        let stepped = false;
        if (!stepLock.current && desired.y > ROOM_FT && nCross) { stepLock.current = true; setEye({ x: desired.x, y: desired.y - ROOM_FT }); stepRef.current(-1, 0); stepped = true; }
        else if (!stepLock.current && desired.y < 0 && sCross) { stepLock.current = true; setEye({ x: desired.x, y: desired.y + ROOM_FT }); stepRef.current(1, 0); stepped = true; }
        else if (!stepLock.current && desired.x > ROOM_FT && eCross) { stepLock.current = true; setEye({ x: desired.x - ROOM_FT, y: desired.y }); stepRef.current(0, 1); stepped = true; }
        else if (!stepLock.current && desired.x < 0 && wCross) { stepLock.current = true; setEye({ x: desired.x + ROOM_FT, y: desired.y }); stepRef.current(0, -1); stepped = true; }
        if (!stepped) {
          // clamp against a SOLID wall (no door gap here), then collide-and-slide around the furniture
          const want = {
            x: clamp(desired.x, wCross ? -WALK_R : WALK_R, eCross ? ROOM_FT + WALK_R : ROOM_FT - WALK_R),
            y: clamp(desired.y, sCross ? -WALK_R : WALK_R, nCross ? ROOM_FT + WALK_R : ROOM_FT - WALK_R),
          };
          setEye(walkMove(from, { x: want.x - from.x, y: want.y - from.y }, furnRects.current));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pinhole camera. Looking +y into the room; the eye position is live (MOVE stick). f from BOTH axes → no letterbox.
  const f = Math.min((W / 2) / Math.tan(HFOV / 2), (H / 2) / Math.tan(VFOV / 2)), near = 0.4;
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

  // ── one wall at offset (ox,oy): a solid panel, or framed around an opening centred at `center` (local along-wall), so
  //    the room/exterior BEYOND the opening shows through. Jamb/header/sill are separate quads. ──
  const vwall = (side: Side, ox: number, oy: number, opening: { span: number; z0: number; z1: number } | null, center = ROOM_FT / 2): Quad[] => {
    const kind: Quad["kind"] = side === "N" || side === "S" ? "front" : "side";
    const horiz = side === "N" || side === "S";
    const fixed = side === "N" ? oy + ROOM_FT : side === "S" ? oy : side === "W" ? ox : ox + ROOM_FT;
    const a0 = horiz ? ox : oy, a1 = a0 + ROOM_FT;
    const pt = (s: number, z: number): V3 => (horiz ? [s, fixed, z] : [fixed, s, z]);
    const quad = (s0: number, s1: number, zA: number, zB: number): Quad => ({ kind, color: C.wall, pts: [pt(s0, zA), pt(s1, zA), pt(s1, zB), pt(s0, zB)] });
    if (!opening) return [quad(a0, a1, 0, CEIL_FT)];
    const mid = (horiz ? ox : oy) + clamp(center, opening.span / 2, ROOM_FT - opening.span / 2), gL = mid - opening.span / 2, gR = mid + opening.span / 2;
    const out: Quad[] = [quad(a0, gL, 0, CEIL_FT), quad(gR, a1, 0, CEIL_FT)];           // left + right jamb panels
    if (opening.z0 > 0) out.push(quad(gL, gR, 0, opening.z0));                           // sill (window)
    if (opening.z1 < CEIL_FT) out.push(quad(gL, gR, opening.z1, CEIL_FT));              // header
    return out;
  };
  const doorOpen = { span: DOOR_W, z0: 0, z1: DOOR_H };
  const winOpen = { span: WIN_W, z0: WIN_SILL, z1: WIN_HEAD };
  const inPhase = (o: PlacedObject) => showGroupInPhase(groupOf(o.kind), phase);
  // FURNITURE box with the Y-FLIP (plan gy 0 = NORTH → world far): worldCY = oy + (ROOM_FT − (gy + 0.5)).
  const furnBox = (o: PlacedObject, ox: number, oy: number): Quad[] => {
    const fp = footprintOf(o); const swap = o.rot === 90 || o.rot === 270;
    const w = swap ? fp.d : fp.w, dp = swap ? fp.w : fp.d;
    return boxFaces(ox + o.gx + 0.5 - w / 2, oy + (ROOM_FT - (o.gy + 0.5)) - dp / 2, elevOf(o), w, dp, heightOf(o), OBJECT_SPEC[o.kind]?.color);
  };
  const furnOf = (cell: RoomCell | null | undefined, ox: number, oy: number): Quad[] =>
    (cell ? (cell.objects ?? defaultObjectsForRoom(cell.k)) : []).filter(inPhase).flatMap((o) => furnBox(o, ox, oy));
  // A neighbour room beyond a shared wall: floor + ceiling + its three outer walls (solid backdrop), its SHARED wall left
  // as a doorway (aligned to OUR door centre so you see straight through); furniture inside.
  const roomBox = (ox: number, oy: number, openSide: Side, openCenter: number): Quad[] => {
    const q: Quad[] = [
      { kind: "floor", color: C.floor, pts: [[ox, oy, 0], [ox + ROOM_FT, oy, 0], [ox + ROOM_FT, oy + ROOM_FT, 0], [ox, oy + ROOM_FT, 0]] },
      { kind: "ceil", color: C.wall, pts: [[ox, oy, CEIL_FT], [ox + ROOM_FT, oy, CEIL_FT], [ox + ROOM_FT, oy + ROOM_FT, CEIL_FT], [ox, oy + ROOM_FT, CEIL_FT]] },
    ];
    for (const side of ["N", "S", "W", "E"] as Side[]) q.push(...vwall(side, ox, oy, side === openSide ? doorOpen : null, openCenter));
    return q;
  };

  // ── THIS room's shell (all four walls) + the rooms/exterior visible through its openings — ALL through ONE solidFaces(). ──
  const wallQuads: Quad[] = [
    { kind: "floor", color: C.floor, pts: [[0, 0, 0], [ROOM_FT, 0, 0], [ROOM_FT, ROOM_FT, 0], [0, ROOM_FT, 0]] },
    { kind: "ceil", color: C.wall, pts: [[0, 0, CEIL_FT], [ROOM_FT, 0, CEIL_FT], [ROOM_FT, ROOM_FT, CEIL_FT], [0, ROOM_FT, CEIL_FT]] },
  ];
  // each wall: a DOORWAY at the placed door's position where there is a neighbour, else a WINDOW to the exterior.
  wallQuads.push(...vwall("N", 0, 0, nb.N ? doorOpen : winOpen, doorCtr.N));
  wallQuads.push(...vwall("S", 0, 0, nb.S ? doorOpen : winOpen, doorCtr.S));
  wallQuads.push(...vwall("W", 0, 0, nb.W ? doorOpen : winOpen, doorCtr.W));
  wallQuads.push(...vwall("E", 0, 0, nb.E ? doorOpen : winOpen, doorCtr.E));
  // the adjacent rooms, each beyond its shared wall (its shared wall opened at OUR door centre so you see straight through)
  if (nb.N) wallQuads.push(...roomBox(0, ROOM_FT, "S", doorCtr.N));
  if (nb.S) wallQuads.push(...roomBox(0, -ROOM_FT, "N", doorCtr.S));
  if (nb.E) wallQuads.push(...roomBox(ROOM_FT, 0, "W", doorCtr.E));
  if (nb.W) wallQuads.push(...roomBox(-ROOM_FT, 0, "E", doorCtr.W));
  // the EXTERIOR — a wide ground plane receding past the house, seen through any perimeter window (never a black void)
  wallQuads.push({ kind: "floor", color: C.ground, pts: [[-40, -40, -0.1], [50, -40, -0.1], [50, 50, -0.1], [-40, 50, -0.1]] });

  // FURNITURE — this room's objects (the SAME source the 2D plan + voxel use), FILTERED to the selected phase's layer and
  // Y-FLIPPED, plus the neighbours'.
  const objects = roomObjs.filter(inPhase);
  const furnQuads: Quad[] = objects.flatMap((o) => furnBox(o, 0, 0));
  if (nb.N) furnQuads.push(...furnOf(nb.N, 0, ROOM_FT));
  if (nb.S) furnQuads.push(...furnOf(nb.S, 0, -ROOM_FT));
  if (nb.E) furnQuads.push(...furnOf(nb.E, ROOM_FT, 0));
  if (nb.W) furnQuads.push(...furnOf(nb.W, -ROOM_FT, 0));

  // ── FRAMING (P1) — in the Framing phase the walls become their STUDS (lib/architect-walk-framing): this room's members
  //    are boxFaces pushed into the one solidFaces() call (occlude like furniture); each neighbour is lines only. The wall
  //    panels drop to 0.15 opacity (the studs ARE the wall). Memoized — the geometry is eye-independent. ──
  const framingOn = phaseById(phase)?.id === "framing";
  const gauge = studGaugeById(studGauge);
  const openingFor = (side: Side): WalkOpening => (nb[side]
    ? { side, center: doorCtr[side], span: DOOR_W, z0: 0, z1: DOOR_H }
    : { side, center: doorCtr[side], span: WIN_W, z0: WIN_SILL, z1: WIN_HEAD });
  const frameKey = `${framingOn}|${studGauge}|${room?.id}|${doorCtr.N},${doorCtr.S},${doorCtr.E},${doorCtr.W}|${!!nb.N}${!!nb.S}${!!nb.E}${!!nb.W}`;
  const frameGeo = useMemo(() => {
    if (!framingOn) return null;
    const openings = (["N", "S", "W", "E"] as Side[]).map(openingFor);
    const self = walkFraming(gauge, openings, 0, 0);
    const nbLines: Vec3[][] = [];
    const nbOf = (cell: RoomCell, ox: number, oy: number) => { const o = openings.map((op) => ({ ...op })); nbLines.push(...walkFraming(gauge, o, ox, oy).lines); };
    if (nb.N) nbOf(nb.N, 0, ROOM_FT); if (nb.S) nbOf(nb.S, 0, -ROOM_FT); if (nb.E) nbOf(nb.E, ROOM_FT, 0); if (nb.W) nbOf(nb.W, -ROOM_FT, 0);
    return { quads: self.quads, counts: self.counts, nbLines };
  }, [frameKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (frameGeo) wallQuads.push(...frameGeo.quads);
  // neighbour frame lines, projected (lines-only backdrop)
  const frameLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (frameGeo) for (const ln of frameGeo.nbLines) { const a = project(ln[0]), b = project(ln[1]); if (a && b) frameLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }); }

  const faces = solidFaces([...wallQuads, ...furnQuads], project);
  // COLLISION obstacles — this room's phase-visible floor furniture, with a DOOR-WIDTH clear lane carved to EACH doorway
  // (the door-aware fix: reach the door in every room, not just the bedroom).
  const doorLanes: Rect[] = [];
  if (nb.N) doorLanes.push({ x0: doorCtr.N - DOOR_W / 2, y0: 0, x1: doorCtr.N + DOOR_W / 2, y1: ROOM_FT });
  if (nb.S) doorLanes.push({ x0: doorCtr.S - DOOR_W / 2, y0: 0, x1: doorCtr.S + DOOR_W / 2, y1: ROOM_FT });
  if (nb.E) doorLanes.push({ x0: 0, y0: doorCtr.E - DOOR_W / 2, x1: ROOM_FT, y1: doorCtr.E + DOOR_W / 2 });
  if (nb.W) doorLanes.push({ x0: 0, y0: doorCtr.W - DOOR_W / 2, x1: ROOM_FT, y1: doorCtr.W + DOOR_W / 2 });
  furnRects.current = roomBlockers(roomObjs, phase, doorLanes);
  // DEPTH FOG — faces beyond this room recede toward the dark horizon (the mission-planning distance falloff, via shade()).
  const fog = (hex: string, depth: number) => { const fct = clamp((depth - 12) / 34, 0, 0.82); return fct <= 0 ? hex : shade(hex, 1 - fct); };

  // ── MEP LAYER (E1 / WALK-05) — the active layer(s) as walk-world ELEVATION (lib/architect-walk-mep, REUSING the 2D/3D
  //    geometry): wiring = panel → top plate → drops to outlets; water/sewer on the floor; duct at the ceiling. The ⚡
  //    Sockets toggle shows the outlets alone. Drawn for THIS room AND every neighbour, through the SAME project()/poly(). ──
  const outletCount0 = room?.outlets ?? 0;
  // PHASE-GATE the MEP overlays (fleet NEW-1/2/4): a layer shows ONLY in its own phase — wires/outlets in Electrical,
  // pipes in Plumbing, drains in Sewer — driven by phaseDraw(phase). A selected phase IS the view (no always-on overlay);
  // only the OVERVIEW (no phase) falls back to the Design-Settings toggles. So framing/foundation/roofing/… show no MEP.
  const pShows = phaseById(phase)?.shows;
  const hasPhase = !!phaseById(phase);
  const layers: MepLayer[] = [];
  if (hasPhase) {
    if (pShows === "wiring" || pShows === "water" || pShows === "sewer") layers.push(pShows);
  } else {
    if (showWiring) layers.push("wiring");
    if (showWater) layers.push("water");
    if (showSewer) layers.push("sewer");
    if (showDucts) layers.push("duct");
  }
  const socketsOnly = !hasPhase && showSockets && !layers.includes("wiring");  // ⚡ Sockets toggle is an overview-only aid
  const mepOn = layers.length > 0 || socketsOnly;
  const cellOut = (c: RoomCell | null | undefined) => c?.outlets ?? 0;
  const mepLines: { x1: number; y1: number; x2: number; y2: number; col: string; key: string }[] = [];
  const mepBoxes: { pts: string; col: string; kind: string }[] = [];
  const addMep = (L: MepLayer, outlets: number, objs: PlacedObject[], ox: number, oy: number, boxesOnly = false) => {
    const g = walkMep(L, outlets, objs, ox, oy);
    if (!boxesOnly) for (const ln of g.lines) for (let i = 0; i < ln.length - 1; i++) { const a = project(ln[i]), b = project(ln[i + 1]); if (a && b) mepLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, col: g.color, key: L }); }
    for (const bx of g.boxes) { if (boxesOnly && bx.kind !== "outlet") continue; const q = poly(bx.pts); if (q) mepBoxes.push({ pts: q.d, col: g.color, kind: bx.kind }); }
  };
  const forAll = (L: MepLayer, boxesOnly = false) => {
    addMep(L, outletCount0, roomObjs, 0, 0, boxesOnly);
    if (nb.N) addMep(L, cellOut(nb.N), nb.N.objects ?? defaultObjectsForRoom(nb.N.k), 0, ROOM_FT, boxesOnly);
    if (nb.S) addMep(L, cellOut(nb.S), nb.S.objects ?? defaultObjectsForRoom(nb.S.k), 0, -ROOM_FT, boxesOnly);
    if (nb.E) addMep(L, cellOut(nb.E), nb.E.objects ?? defaultObjectsForRoom(nb.E.k), ROOM_FT, 0, boxesOnly);
    if (nb.W) addMep(L, cellOut(nb.W), nb.W.objects ?? defaultObjectsForRoom(nb.W.k), -ROOM_FT, 0, boxesOnly);
  };
  for (const L of layers) forAll(L);
  if (socketsOnly) forAll("wiring", true);   // ⚡ Sockets alone: just the outlet boxes
  const chipLayer: MepLayer | null = layers[0] ?? (socketsOnly ? "wiring" : null);

  // floor grid lines (1-ft)
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

  // doorway FRAME + the neighbour's name above it, at the ACTUAL door centre (the opening is NOT filled black — see in)
  type Door = { d: string; depth: number; label: string; lx: number; ly: number };
  const doors: Door[] = [];
  const addDoor = (corners4: V3[], label: string) => { const q = poly(corners4); const top = project([(corners4[0][0] + corners4[1][0]) / 2, (corners4[0][1] + corners4[1][1]) / 2, DOOR_H + 0.4]); if (q && top) doors.push({ d: q.d, depth: q.depth - 0.01, label, lx: top.x, ly: top.y }); };
  const hw = DOOR_W / 2;
  if (nb.N) { const c = clamp(doorCtr.N, hw, ROOM_FT - hw); addDoor([[c - hw, ROOM_FT, 0], [c + hw, ROOM_FT, 0], [c + hw, ROOM_FT, DOOR_H], [c - hw, ROOM_FT, DOOR_H]], nb.N.label); }
  if (nb.S) { const c = clamp(doorCtr.S, hw, ROOM_FT - hw); addDoor([[c - hw, 0, 0], [c + hw, 0, 0], [c + hw, 0, DOOR_H], [c - hw, 0, DOOR_H]], nb.S.label); }
  if (nb.W) { const c = clamp(doorCtr.W, hw, ROOM_FT - hw); addDoor([[0, c - hw, 0], [0, c + hw, 0], [0, c + hw, DOOR_H], [0, c - hw, DOOR_H]], nb.W.label); }
  if (nb.E) { const c = clamp(doorCtr.E, hw, ROOM_FT - hw); addDoor([[ROOM_FT, c - hw, 0], [ROOM_FT, c + hw, 0], [ROOM_FT, c + hw, DOOR_H], [ROOM_FT, c - hw, DOOR_H]], nb.E.label); }

  const moveHex = semanticHex("mount"), lookHex = semanticHex("frustum"); // Drone-2525's body / head stick colours

  return (
    <div ref={rootRef} data-arch-walkthrough data-arch-walk-eye={`${eye.x.toFixed(2)},${eye.y.toFixed(2)}`} data-arch-walk-yaw={yaw.toFixed(3)} className="relative select-none overflow-hidden rounded-lg" style={{ height: Hpx, background: `radial-gradient(130% 100% at 50% 18%, #16243a, #0d1420 55%, ${C.bg})`, border: `1px solid ${C.edge}`, touchAction: "none" }}>
      <svg data-arch-walk-svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ display: "block", cursor: "grab" }}>
        {/* when a MEP layer is on, the walls go semi-transparent (Enscape x-ray convention) so the runs read "inside" them */}
        {faces.map((fc, i) => <polygon key={`f${i}`} data-arch-walk-frame-face={fc.color === FRAME_COLOR || fc.color === FRAME_HEADER_COLOR ? "1" : undefined} points={fc.d} fill={fog(shade(fc.color ?? C.wall, FACE_SHADE[fc.kind]), fc.depth)} fillOpacity={framingOn && fc.color === C.wall && (fc.kind === "front" || fc.kind === "side") ? 0.15 : mepOn && (fc.kind === "front" || fc.kind === "side") ? 0.55 : (layers.includes("duct") && fc.kind === "ceil" && fc.color === C.wall) ? 0.55 : 1} stroke={fc.kind === "front" || fc.kind === "side" ? C.edge : "none"} strokeWidth={fc.kind === "front" || fc.kind === "side" ? 0.6 : 0} />)}
        {/* MEP LAYER (E1 / WALK-05) — wires / pipes / ducts + outlet & panel boxes, drawn x-ray between the walls and the grid */}
        {mepLines.map((s, i) => <line key={`m${i}`} data-arch-walk-mep={s.key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.col} strokeWidth={2.2} strokeDasharray="6 4" strokeLinecap="round" opacity={0.95} />)}
        {mepBoxes.map((b, i) => <polygon key={`mb${i}`} data-arch-walk-outlet={b.kind === "outlet" ? "1" : undefined} data-arch-walk-panel={b.kind === "panel" ? "1" : undefined} points={b.pts} fill={b.col} stroke="#070b12" strokeWidth={0.8} />)}
        {/* FRAMING (P1) — the neighbour rooms' studs as lines only (overdraw mitigation); this room's studs are solid quads above */}
        {frameLines.map((s, i) => <line key={`fr${i}`} data-arch-walk-frame="1" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={FRAME_COLOR} strokeWidth={1} opacity={0.7} />)}
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
      {/* turn-around cue — tells a first-timer the space is 360°, so they know to turn (the panel can spawn behind them).
          Top-RIGHT so it never overlaps the room chip (top-left); the toggle is its own row above the picture. */}
      <div data-arch-walk-turncue className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px]" style={{ borderColor: C.edge, color: C.dim, background: "#0a0f16cc" }}>↻ {t("arch.walk.turnCue")}</div>
      {/* active MEP layer chip — names what the wires/pipes you're seeing are (E1 / WALK-05) */}
      {mepOn && chipLayer && (
        <div data-arch-walk-layer className="absolute left-2 top-10 flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: mepLines[0]?.col ?? C.gold, color: mepLines[0]?.col ?? C.gold, background: "#0a0f16ee" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: mepLines[0]?.col ?? C.gold }} /> {t(`arch.walk.layer.${chipLayer}`)}
        </div>
      )}
      {/* FRAMING gauge chip — the SAME string the 2D plan prints (gauge @ 16" o.c.) in the lumber colour */}
      {framingOn && (
        <div data-arch-walk-layer className="absolute left-2 top-10 flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: FRAME_COLOR, color: FRAME_COLOR, background: "#0a0f16ee" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: FRAME_COLOR }} /> {gauge.label} @ {STUD_SPACING_IN}″ o.c.
        </div>
      )}
      {/* QUAD CONTROLLER (reuses Drone-2525's actual <Stick> + its saved calibration via applySets) — L = MOVE (walk in the
          facing direction, collide-and-slide around furniture), R = LOOK (yaw + pitch). Thumb-reachable at the two bottom
          corners; the step to a neighbour runs through onStep in the loop above (the door-span rule gates it). */}
      <div data-arch-walkpad data-arch-walk-sticks className="pointer-events-none absolute inset-x-0 bottom-2 flex items-end justify-between px-3">
        <div className="pointer-events-auto"><Stick label={t("arch.walk.move")} hex={moveHex} size={84} onMove={(x, y) => { moveVec.current = applySets({ x, y }, "L", sets.current); }} /></div>
        <div className="pointer-events-auto"><Stick label={t("arch.walk.look")} hex={lookHex} size={84} onMove={(x, y) => { lookVec.current = applySets({ x, y }, "R", sets.current); }} /></div>
      </div>
      <div className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 text-[9px]" style={{ color: C.dim }}><LookGlyph size={11} /> {title ?? t("arch.walk.title")}</div>
    </div>
  );
}
