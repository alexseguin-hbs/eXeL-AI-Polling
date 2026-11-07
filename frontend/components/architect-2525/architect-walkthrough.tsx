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
import { STOREY_FT, TINY_GRID, OPENING_STD } from "@/lib/room-layout"; // the ONE cube/ceiling height source (10 ft) — never hardcode 8; TINY_GRID = 3×3 house; OPENING_STD = the one door/window standard
import { footprintOf, heightOf, elevOf, OBJECT_SPEC, defaultObjectsForRoom, groupOf, wallOf, type PlacedObject } from "@/lib/room-objects";
import { shade, FACE_SHADE, solidFaces, boxFaces, clipNear, type Vec3, type Quad } from "@/lib/solid-shade";
import { showGroupInPhase, phaseById } from "@/lib/architect-phases"; // REUSE the SAME phase→layer filter the 2D/3D designer uses
import { canCrossDoor, DOOR_W, ROOM_FT } from "@/lib/architect-walk-nav"; // the pure door-span rule (cannot walk through solid wall)
import { roomBlockers, walkMove, WALK_R, type Rect } from "@/lib/architect-walk-collide"; // the pure collide-and-slide (never stuck)
import { walkMep, GLYPH_PATHS, DUCT_Z, OUTLET_AFF_FT, type MepLayer } from "@/lib/architect-walk-mep"; // REUSE the 2D/3D MEP geometry as walk-world elevation (+ the measured heights)
import { clamp } from "@/lib/rcore-gestures";                  // REUSE the one R-CORE clamp (zoom / eye-height / pitch bands) — no local copy
import { ftIn } from "@/lib/dim-annot";                        // REUSE the one feet-inch formatter (the measurements overlay)
import { walkShell } from "@/lib/architect-walk-shell"; // P4 shell phases: foundation/roofing/insulation/security/internet
import { MEP_COLOR } from "@/lib/mep-runs"; // one colour source for the Plumbing legend chip
import { walkFraming, type WalkOpening } from "@/lib/architect-walk-framing"; // the stud layout for the Framing phase
import { studGaugeById, FRAME_COLOR, FRAME_HEADER_COLOR, STUD_SPACING_IN, SHELL_COLOR } from "@/lib/architect-phase-palette"; // REUSE the one stud gauge/palette
import { applySets, getSets, initSets, subscribeSets, type StickSets } from "@/lib/2525-core/stick-sets"; // REUSE stick calibration
import { WalkRaster, LookGlyph } from "./architect-walk-icons";
import { Stick } from "@/components/drone-2525/stick";           // REUSE the actual Drone-2525 thumb-stick (single source)
import { semanticHex } from "@/lib/wire-core/palette";           // Drone-2525's own stick colours (mount = body, frustum = head)
import { useLexicon } from "@/lib/lexicon-context";
import { loadAssetMeshFt, instanceTriangles, meshToFaces, type AssetMesh } from "@/lib/architect-2525/assets/index-runtime"; // Rev A' — the 139-GLB library, consumed by the SVG projector (E3 core)
import { ASSET_ID_BY_KIND } from "@/lib/architect-2525/assets/registry";                                                    // a kind → its library id (so the 29 kinds render their real mesh too)

const C = { bg: "#0a0f16", ink: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400", wall: "#2a3a4f", floor: "#121b26", ceil: "#0c131c", edge: "#1e2b3a", ground: "#0b1410" };
const CEIL_FT = STOREY_FT, EYE_FT = 5.5;             // one 10-ft storey = the cube (ONE source: room-layout STOREY_FT); eye ~5.5 ft
const START_IN = 1.5;                                // the eye starts this far INSIDE the entry door (near wall behind you)
const DOOR_H = OPENING_STD.DOOR_H_FT;                // door opening height (6'-8" standard, real door — unrelated to the storey) — ONE source: room-layout OPENING_STD
const WIN_W = OPENING_STD.WIN_W_FT, WIN_SILL = OPENING_STD.WIN_SILL_FT, WIN_HEAD = OPENING_STD.WIN_HEAD_FT; // an exterior window (perimeter wall) — the same standard the framing reads
const WIN_COL = OBJECT_SPEC.window?.color ?? "#19c8cf"; // window sash colour — drawn translucent in framing so it doesn't break the stud read (Pangu)
// EYE HEIGHT (Wave 1a §3): the operator is 5'6" with his eyes a little low → 5.1 ft default, adjustable in the map panel and
// persisted; clamped [1.8, DOOR_H − 0.2] so a door step is ALWAYS possible. EYE_FT above stays the named fallback.
const EYE_DEFAULT_FT = 5.1, EYE_MIN_FT = 1.8, EYE_MAX_FT = DOOR_H - 0.2;
// ZOOM (Wave 1a §2): 1–3× only — NO sub-1× in this revision (the face pipeline culls by refusal, so zooming out inside a room
// deletes the walls you stand beside). Zoom multiplies the focal length; the look gains divide by it.
const ZOOM_MIN = 1, ZOOM_MAX = 3;
const LS_ZOOM = "arch2525.walkZoom", LS_EYE = "arch2525.walkEyeHt", LS_DIMS = "arch2525.walkDims"; // persisted like the map toggle
// FPS feel (MoT synthesis): ~4.5 ft/s indoor walk, smooth accel; the saved stick calibration (applySets) shapes the
// deadzone/sensitivity further. HFOV/VFOV keep the picture framed with no letterbox at any container aspect (WALK-11).
const MOVE_SPEED = 4.5, MOVE_ACCEL = 11, LOOK_YAW = 2.0, LOOK_PITCH = 1.5;  // ft/s · 1/s accel · rad/s · rad/s
const HFOV = (65 * Math.PI) / 180, VFOV = (58 * Math.PI) / 180;

type V3 = Vec3;
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
  // PLENUM PHASES READ ON ENTRY (rewalk2 P0, Christo/Krishna): HVAC ducts + roof rafters live in the 10→12 plenum, above the
  // default gaze. On selecting a plenum phase, pitch the gaze up ~13° ONCE (the user can look back down); reset flat otherwise.
  useEffect(() => {
    const p = phaseById(phase);
    setPitch((p?.shows === "duct" || p?.id === "roofing") ? 0.23 : 0);
  }, [phase]);
  // C1 — the overhead minimap (reads the SAME layout as TinyFloorplan). Collapsible; the walk keeps the majority (E2).
  const [mapOpen, setMapOpen] = useState(true);
  useEffect(() => { try { const v = localStorage.getItem("arch2525.walkMap"); if (v != null) setMapOpen(v === "1"); } catch {} }, []);
  const toggleMap = () => setMapOpen((o) => { const n = !o; try { localStorage.setItem("arch2525.walkMap", n ? "1" : "0"); } catch {} return n; });
  // ZOOM 1–3× (§2) — a focal multiplier on the pinhole; the look gains divide by it so a 3× optic turns 3× slower (the loop +
  // the drag read zoomRef so they never go stale). Set by the stepper chip (1→2→3→1) or a two-finger pinch; persisted.
  const [zoom, setZoomState] = useState(1);
  const zoomRef = useRef(1); zoomRef.current = zoom;
  const setZoom = (z: number) => { const n = clamp(Math.round(z * 100) / 100, ZOOM_MIN, ZOOM_MAX); setZoomState(n); try { localStorage.setItem(LS_ZOOM, String(n)); } catch {} };
  const stepZoom = () => setZoom(zoom >= ZOOM_MAX ? ZOOM_MIN : Math.floor(zoom) + 1);
  // EYE HEIGHT (§3) — his 5.1 ft; clamped [EYE_MIN_FT, DOOR_H − 0.2] so a door step is always possible; EYE_FT is the fallback.
  const [eyeHt, setEyeHtState] = useState(EYE_DEFAULT_FT);
  const setEyeHt = (v: number) => { const n = clamp(Number.isFinite(v) ? v : EYE_FT, EYE_MIN_FT, EYE_MAX_FT); setEyeHtState(n); try { localStorage.setItem(LS_EYE, n.toFixed(2)); } catch {} };
  // MEASUREMENTS (§6) — the facing wall's real dimensions (ftIn), off by default; persisted.
  const [dims, setDimsState] = useState(false);
  const toggleDims = () => setDimsState((d) => { const n = !d; try { localStorage.setItem(LS_DIMS, n ? "1" : "0"); } catch {} return n; });
  useEffect(() => { try {
    const z = parseFloat(localStorage.getItem(LS_ZOOM) ?? ""); if (Number.isFinite(z)) setZoomState(clamp(z, ZOOM_MIN, ZOOM_MAX));
    const e = parseFloat(localStorage.getItem(LS_EYE) ?? ""); if (Number.isFinite(e)) setEyeHtState(clamp(e, EYE_MIN_FT, EYE_MAX_FT));
    if (localStorage.getItem(LS_DIMS) === "1") setDimsState(true);
  } catch {} }, []);
  // STICK CALIBRATION (reuse lib/2525-core/stick-sets) — the saved L/R SENS, DEAD apply to both sticks.
  const sets = useRef<StickSets>(getSets());
  useEffect(() => { sets.current = initSets(); const un = subscribeSets((s) => { sets.current = s; }); return un; }, []);
  // The eye POSITION (feet, world: x 0=west..10=east · y 0=south/near..10=north/far). Spawns at the ENTRY door, just inside,
  // facing INTO the room (not a blank wall): at the S-door x if entered from the south, else room centre.
  const ez = Number.isFinite(eyeHt) ? eyeHt : EYE_FT;   // the eye's z = the adjustable eye height (EYE_FT the named fallback); collision stays horizontal-only
  // Rev A' — load the GLB meshes for THIS room's placed objects (a kind resolves to its library id via ASSET_ID_BY_KIND),
  // so the walk paints the operator's real 139-library geometry instead of a plain box. Async + memoised in the module
  // cache (one fetch + one parse per id for the page); a not-yet-loaded or PENDING asset (closet rod / shoe rack) falls
  // back to boxFaces, and neighbour rooms stay boxes (LOD0). No render blocks on the network.
  const [meshes, setMeshes] = useState<Map<string, AssetMesh>>(() => new Map());
  const meshReq = useRef<Set<string>>(new Set());
  // roomObjs is a FRESH array every render (defaultObjectsForRoom), and the RAF loop re-renders each frame — so the effect
  // must key off a STABLE signature of the needed library ids, not the array reference, or an in-flight load is discarded
  // before it resolves. No per-effect `alive` guard (a setState after unmount is a harmless no-op in React 18).
  const roomAssetSig = roomObjs.map((o) => (o.assetId ?? ASSET_ID_BY_KIND[o.kind]) || "").filter(Boolean).join(",");
  useEffect(() => {
    for (const id of new Set(roomAssetSig.split(",").filter(Boolean))) {
      if (meshReq.current.has(id)) continue;
      meshReq.current.add(id);
      loadAssetMeshFt(id).then((m) => setMeshes((prev) => new Map(prev).set(id, m))).catch(() => { meshReq.current.delete(id); });
    }
  }, [roomAssetSig]);

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

  // POINTERS (§2): ONE finger = look-drag; TWO fingers = pinch-zoom, inside the walk's OWN handlers. While ≥2 pointers are
  // down the look-drag is SUSPENDED (a pinch never also spins the view); zoom = zoom-at-pinch-start × (distance / distance0),
  // clamped [1,3]; persisted when the pinch ends. Look gains divide by zoom (a 3× optic turns 3× slower under the thumb).
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d0: number; z0: number } | null>(null);
  const pinchDist = () => { const p = [...pointers.current.values()]; return p.length >= 2 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0; };
  const onDown = (e: RPE) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) { drag.current = null; pinch.current = { d0: Math.max(1, pinchDist()), z0: zoomRef.current }; return; } // ≥2 pointers → suspend look-drag, start the pinch
    drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
  };
  const onMove = useCallback((e: RPE) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) {                            // PINCH → zoom (look-drag suspended while two fingers are down)
      const pz = pinch.current; if (pz) setZoomState(clamp(Math.round(pz.z0 * (pinchDist() / pz.d0) * 100) / 100, ZOOM_MIN, ZOOM_MAX));
      return;
    }
    const d = drag.current; if (!d) return;
    const gain = 0.006 / zoomRef.current;                         // the look gain ÷ zoom
    setYaw(d.yaw - (e.clientX - d.x) * gain);                    // turn: drag RIGHT → look right/east (WALK-P1 look fix)
    setPitch(clamp(d.pitch - (e.clientY - d.y) * gain, -0.7, 0.7)); // look up/down (±40°)
  }, []);
  const onUp = (e: RPE) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2 && pinch.current) { pinch.current = null; try { localStorage.setItem(LS_ZOOM, String(zoomRef.current)); } catch {} } // pinch ended → persist
    drag.current = null;
  };

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
      const zf = zoomRef.current;                                                 // look gains ÷ zoom (a 3× optic turns 3× slower)
      if (lk.x) setYaw((y) => y - lk.x * LOOK_YAW / zf * dt);                   // LOOK right → yaw east (WALK-P1 look fix)
      if (lk.y) setPitch((p) => clamp(p - lk.y * LOOK_PITCH / zf * dt, -0.7, 0.7)); // pitch ±40°
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
        // the carried position is clamped into the room it enters so the overhead dot never lands outside the newly-lit room (Aset P2)
        const cR = (v: number) => clamp(v, WALK_R, ROOM_FT - WALK_R);
        if (!stepLock.current && desired.y > ROOM_FT && nCross) { stepLock.current = true; setEye({ x: cR(desired.x), y: cR(desired.y - ROOM_FT) }); stepRef.current(-1, 0); stepped = true; }
        else if (!stepLock.current && desired.y < 0 && sCross) { stepLock.current = true; setEye({ x: cR(desired.x), y: cR(desired.y + ROOM_FT) }); stepRef.current(1, 0); stepped = true; }
        else if (!stepLock.current && desired.x > ROOM_FT && eCross) { stepLock.current = true; setEye({ x: cR(desired.x - ROOM_FT), y: cR(desired.y) }); stepRef.current(0, 1); stepped = true; }
        else if (!stepLock.current && desired.x < 0 && wCross) { stepLock.current = true; setEye({ x: cR(desired.x + ROOM_FT), y: cR(desired.y) }); stepRef.current(0, -1); stepped = true; }
        if (!stepped) {
          // clamp against a SOLID wall (no door gap here), then collide-and-slide around the furniture
          const want = {
            x: clamp(desired.x, wCross ? -WALK_R : WALK_R, eCross ? ROOM_FT + WALK_R : ROOM_FT - WALK_R),
            y: clamp(desired.y, sCross ? -WALK_R : WALK_R, nCross ? ROOM_FT + WALK_R : ROOM_FT - WALK_R),
          };
          // RE-CLAMP the collide-and-slide RESULT into the door-aware bounds so pushOut can never eject the body THROUGH a
          // solid wall after a crossing (rewalk2 P0, Thor): a solid wall caps at ±WALK_R inside; a door wall still reaches the edge.
          const m = walkMove(from, { x: want.x - from.x, y: want.y - from.y }, furnRects.current);
          setEye({
            x: clamp(m.x, wCross ? -WALK_R : WALK_R, eCross ? ROOM_FT + WALK_R : ROOM_FT - WALK_R),
            y: clamp(m.y, sCross ? -WALK_R : WALK_R, nCross ? ROOM_FT + WALK_R : ROOM_FT - WALK_R),
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pinhole camera. Looking +y into the room; the eye position is live (MOVE stick). f from BOTH axes → no letterbox.
  const f = zoom * Math.min((W / 2) / Math.tan(HFOV / 2), (H / 2) / Math.tan(VFOV / 2)), near = 0.4;   // §2: zoom 1–3× multiplies the focal length
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
  // camera-space depth alone (the SAME transform as project()) — feeds the near-plane SEGMENT clipping of every line pass
  const camDepth = (p: V3): number => { const dx = p[0] - eye.x, dy = p[1] - eye.y, dz = p[2] - ez; return (-dx * sy0 + dy * cy0) * cp + dz * sp; };
  // a world segment → a screen segment. When exactly ONE end is behind the near plane the segment is CLIPPED to it (clipNear,
  // pure, lib/solid-shade) instead of dropped — a wire / duct / dimension line beside you no longer vanishes the moment its
  // far end passes behind your head (§6). Both ends behind → null.
  const seg = (a: V3, b: V3): { x1: number; y1: number; x2: number; y2: number } | null => {
    const c = clipNear(a, b, camDepth(a), camDepth(b), near); if (!c) return null;
    const pa = project(c[0]), pb = project(c[1]); if (!pa || !pb) return null;
    return { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y };
  };

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
  const furnBox = (o: PlacedObject, ox: number, oy: number, lod1 = false): Quad[] => {
    const fp = footprintOf(o); const swap = o.rot === 90 || o.rot === 270;
    const w = swap ? fp.d : fp.w, dp = swap ? fp.w : fp.d;
    // Rev A' — THIS room (lod1): the real GLB mesh, centred at the cell on the floor, yaw = o.rot, fed into the SAME
    // solidFaces() pass. A not-yet-loaded / PENDING asset and every neighbour room (lod0) keep the shaded boxFaces fallback.
    if (lod1) {
      const id = o.assetId ?? ASSET_ID_BY_KIND[o.kind];
      const mesh = id ? meshes.get(id) : undefined;
      if (mesh) {
        const cx = ox + o.gx + 0.5, cy = oy + (ROOM_FT - (o.gy + 0.5));
        return meshToFaces({ ...mesh, triangles: instanceTriangles(mesh, { x: cx, y: cy, z: elevOf(o), rotationDeg: o.rot }) });
      }
    }
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
  const furnQuads: Quad[] = objects.flatMap((o) => furnBox(o, 0, 0, true));   // Rev A' — this room draws the real GLB geometry (lod1)
  if (nb.N) furnQuads.push(...furnOf(nb.N, 0, ROOM_FT));
  if (nb.S) furnQuads.push(...furnOf(nb.S, 0, -ROOM_FT));
  if (nb.E) furnQuads.push(...furnOf(nb.E, ROOM_FT, 0));
  if (nb.W) furnQuads.push(...furnOf(nb.W, -ROOM_FT, 0));

  // ── FRAMING (P1) — in the Framing phase the walls become their STUDS (lib/architect-walk-framing): this room's members
  //    are boxFaces pushed into the one solidFaces() call (occlude like furniture); each neighbour is lines only. The wall
  //    panels drop to 0.15 opacity (the studs ARE the wall). Memoized — the geometry is eye-independent. ──
  const framingOn = phaseById(phase)?.id === "framing";
  // P4 — the SHELL phases (foundation/roofing/insulation/security/internet) each draw their own layer; roofing + insulation
  // keep the stud skeleton on (the roof sits on the frame; the batts fill the bays). ONE walkShell source (lib/architect-walk-shell).
  const shellId = phaseById(phase)?.id ?? null;
  const shellActive = shellId === "foundation" || shellId === "roofing" || shellId === "insulation" || shellId === "security" || shellId === "internet" || shellId === "finish";
  const structureOn = framingOn || shellId === "insulation"; // studs shown (Framing + Insulation fills the bays); Roofing DROPS the studs so it reads as a roof, not a wall (Asar/Odin fix)
  const gauge = studGaugeById(studGauge);
  const openingFor = (side: Side): WalkOpening => (nb[side]
    ? { side, center: doorCtr[side], span: DOOR_W, z0: 0, z1: DOOR_H }
    : { side, center: doorCtr[side], span: WIN_W, z0: WIN_SILL, z1: WIN_HEAD });
  const frameKey = `${structureOn}|${studGauge}|${room?.id}|${doorCtr.N},${doorCtr.S},${doorCtr.E},${doorCtr.W}|${!!nb.N}${!!nb.S}${!!nb.E}${!!nb.W}`;
  const frameGeo = useMemo(() => {
    if (!structureOn) return null;
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
  if (frameGeo) for (const ln of frameGeo.nbLines) { const s = seg(ln[0], ln[1]); if (s) frameLines.push(s); }

  // SHELL geometry for this room (eye-independent → memoized); quads join the one solidFaces call, sublines/glyphs join the MEP passes.
  const shellKey = `${shellId}|${room?.id}|${doorCtr.N},${doorCtr.S},${doorCtr.E},${doorCtr.W}|${!!nb.N}${!!nb.S}${!!nb.E}${!!nb.W}`;
  const shellGeo = useMemo(() => {
    if (!shellActive) return null;
    // every wall carries an opening the shell must respect: a DOORWAY on a neighbour wall, a WINDOW on an exterior wall
    // (so insulation skips the window bay too, and the batts never cover the glass — Odin). Exterior walls (no neighbour) also
    // get the entry/window data the door camera reads.
    const openings = (["N", "S", "W", "E"] as Side[]).map((s) => nb[s]
      ? { side: s, center: doorCtr[s], span: DOOR_W, exterior: false }
      : { side: s, center: doorCtr[s], span: WIN_W, exterior: true });
    // HOUSE-LEVEL security (P0·A, spec #119 = 4 cams per HOUSE): which of THIS room's walls face outside, from the adjacency —
    // walkShell then draws a corner cam + OUTWARD wedge only where BOTH adjoining walls are exterior (nothing at interior corners).
    return walkShell(shellId, { gauge, openings, kind: room?.k, nbS: !!nb.S, ox: 0, oy: 0, exterior: { N: !nb.N, S: !nb.S, E: !nb.E, W: !nb.W } });
  }, [shellKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (shellGeo) wallQuads.push(...shellGeo.quads);
  // the wall panels dim for a structure/shell phase so the layer reads "inside" (framing/insulation 0.15, else the phase's own)
  const wallDim: number | null = structureOn ? 0.15 : shellGeo?.wallDim ?? null;

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
    if (pShows === "wiring" || pShows === "water" || pShows === "sewer" || pShows === "duct") layers.push(pShows);
  } else {
    if (showWiring) layers.push("wiring");
    if (showWater) layers.push("water");
    if (showSewer) layers.push("sewer");
    if (showDucts) layers.push("duct");
  }
  const socketsOnly = !hasPhase && showSockets && !layers.includes("wiring");  // ⚡ Sockets toggle is an overview-only aid
  const mepOn = layers.length > 0 || socketsOnly;
  // x-ray the inner ceiling to see the plenum: ducts (HVAC), the roof plane/rafters (Roofing), and the Starlink dish (Internet) — all in the 10→12 plenum
  const ceilXray = layers.includes("duct") || shellId === "roofing" || shellId === "internet";
  const mepLines: { x1: number; y1: number; x2: number; y2: number; col: string; key: string }[] = [];
  const mepBoxes: { pts: string; col: string; kind: string }[] = [];
  const mepSublines: { x1: number; y1: number; x2: number; y2: number; col: string; dash?: string; w: number }[] = [];
  const mepGlyphs: { pts: string; col: string; kind: string; op?: number; outline?: boolean }[] = [];
  const mepGlyphLabels: { x: number; y: number; col: string; text: string }[] = [];   // ONE label per glyph (not per poly — Christo fix)
  const OUTLINE_GLYPHS = new Set(["manifold", "laundrybox", "heater", "lan", "return"]); // big flat glyphs read as an outline, never a solid panel (Christo)
  const KEEP_VISIBLE = new Set(["camera", "ahu", "heater"]);   // the AHU + water heater + roof-corner cameras stay readable across the room — polygon AND label at ANY depth (P0·J "where's the unit")
  // in-world labels carry trade codes; route them through the lexicon to a homeowner WORD so RG/SR/AHU/VTR/CO/AP/LAN/WH decode (Christo)
  const LABEL_KEY: Record<string, string> = { SR: "register", RG: "return", AHU: "ahu", VTR: "vtr", CO: "co", MAIN: "main", manifold: "manifold", WH: "wh", box: "box", CAM: "camera", out: "camera", stop: "stop", dish: "dish", LAN: "lan", AP: "ap" };
  const labelWord = (code?: string) => code ? (LABEL_KEY[code] ? t(`arch.walk.legend.${LABEL_KEY[code]}`) : code) : undefined;
  // Shared glyph pass — projects a glyph's polys + lines, emits its label ONCE (decoded, clamped into the viewport), culls far glyphs.
  // P0·J — hang a KEEP_VISIBLE label on the unit's VERTICAL face, not its top: among the glyph's own vertical polys + any solid
  // body within 3.5 ft of it, take the FACING (nearest) quad and anchor at its bottom edge midpoint lifted 0.5 ft — the word reads
  // painted ON the cabinet/tank at any distance, instead of floating at the top edge (or culled) when you stand beside it.
  const labelOnFace = (gl: { at: Vec3; polys: Vec3[][] }, bodies: Quad[]): { x: number; y: number; depth: number } | null => {
    const vertical = (pts: Vec3[]) => Math.max(...pts.map((p) => p[2])) - Math.min(...pts.map((p) => p[2])) > 0.3;
    const cands = [...gl.polys.filter(vertical), ...bodies.filter((q) => (q.kind === "front" || q.kind === "side") && Math.hypot(q.pts[0][0] - gl.at[0], q.pts[0][1] - gl.at[1]) < 3.5).map((q) => q.pts)];
    let best: { x: number; y: number; depth: number } | null = null;
    for (const pts of cands) {
      const z0 = Math.min(...pts.map((p) => p[2])), bottom = pts.filter((p) => Math.abs(p[2] - z0) < 1e-6);
      if (bottom.length < 2) continue;
      const pm = project([(bottom[0][0] + bottom[1][0]) / 2, (bottom[0][1] + bottom[1][1]) / 2, z0 + 0.5]);
      if (pm && (!best || pm.depth < best.depth)) best = pm;
    }
    return best;
  };
  const pushGlyphs = (glyphs: { kind: string; polys: Vec3[][]; lines?: Vec3[][]; at: Vec3; color: string; label?: string }[], opFor: (k: string) => number, bodies: Quad[] = []) => {
    for (const gl of glyphs) {
      const at = project(gl.at); if (!at || (at.depth >= 12 && !KEEP_VISIBLE.has(gl.kind))) continue;
      const outline = OUTLINE_GLYPHS.has(gl.kind);
      for (const pg of gl.polys) { const q = poly(pg); if (q) mepGlyphs.push({ pts: q.d, col: gl.color, kind: gl.kind, op: opFor(gl.kind), outline }); }
      if (gl.lines) for (const ln of gl.lines) for (let i = 0; i < ln.length - 1; i++) { const s = seg(ln[i], ln[i + 1]); if (s) mepSublines.push({ ...s, col: gl.color, w: 1.2 }); }
      // the label: culled beyond 6 ft for ordinary glyphs; a KEEP_VISIBLE glyph (AHU / WH / camera) keeps its label at ANY depth (P0·J)
      if (gl.label && (at.depth < 6 || KEEP_VISIBLE.has(gl.kind))) {
        const word = labelWord(gl.label), lp = (KEEP_VISIBLE.has(gl.kind) ? labelOnFace(gl, bodies) : null) ?? at;
        if (word) mepGlyphLabels.push({ x: clamp(lp.x, 24, W - 24), y: clamp(lp.y - 6, 14, H - 8), col: gl.color, text: word });
      }
    }
  };
  const mepSolids: Quad[] = [];                 // P0·E ADDITIVE MEP bodies (today: the AHU cabinet, kind S) — a SECOND solidFaces pass, never merged into the walls' call
  const roomOutlets: { pts: Vec3[]; z: number }[] = [];   // this room's outlet boxes (world) — the measurements overlay labels the one on the facing wall
  const addMep = (L: MepLayer, outlets: number, objs: PlacedObject[], ox: number, oy: number, boxesOnly = false, kind?: string) => {
    const g = walkMep(L, outlets, objs, ox, oy, kind);
    if (ox === 0 && oy === 0) for (const bx of g.boxes) if (bx.kind === "outlet") roomOutlets.push({ pts: bx.pts, z: bx.z });
    if (!boxesOnly) for (const ln of g.lines) for (let i = 0; i < ln.length - 1; i++) { const s = seg(ln[i], ln[i + 1]); if (s) mepLines.push({ ...s, col: g.color, key: L }); }
    for (const bx of g.boxes) { if (boxesOnly && bx.kind !== "outlet") continue; const q = poly(bx.pts); if (q) mepBoxes.push({ pts: q.d, col: g.color, kind: bx.kind }); }
    if (boxesOnly) return;
    // P2/P3 — valve/riser/duct sublines (own dash + width) and valve/trap/vent/duct-part GLYPHS (one shared pass).
    for (const sl of g.sublines) for (let i = 0; i < sl.pts.length - 1; i++) { const s = seg(sl.pts[i], sl.pts[i + 1]); if (s) mepSublines.push({ ...s, col: sl.color, dash: sl.dash, w: sl.w ?? 2.2 }); }
    mepSolids.push(...g.solids);
    pushGlyphs(g.glyphs, () => 0.9, g.solids);
  };
  // MEP draws for THIS ROOM ONLY (rewalk2 P0, MoT): each room's plumbing/wiring/ducts key off ITS OWN identity (room.k +
  // roomObjs), never a neighbour's — so a dry room shows NOTHING in plumbing/sewer and the house service (kind S) never
  // bleeds through a wall into the office/entry. (Neighbour MEP rendering caused the "wrong room" misread; the node gate
  // tests/architect-walk-mep-rooms proves the per-room correctness this guarantees.)
  const forAll = (L: MepLayer, boxesOnly = false) => {
    addMep(L, outletCount0, roomObjs, 0, 0, boxesOnly, room?.k);
  };
  for (const L of layers) forAll(L);
  if (socketsOnly) forAll("wiring", true);   // ⚡ Sockets alone: just the outlet boxes
  const chipLayer: MepLayer | null = layers[0] ?? (socketsOnly ? "wiring" : null);
  // P0·E — the MEP bodies shade + occlude like furniture through a SECOND solidFaces() pass painted AFTER the walls/furniture
  // (never merged into the walls' call above: the painter's centroid sort would hide a wall-hugging body behind the 0.55 wall).
  const mepFaces = solidFaces(mepSolids, project);

  // P4 — the SHELL phase's own sublines + glyphs join the MEP passes (quads already pushed into wallQuads above). Insulation
  // batts + camera wedges draw translucent so the room behind still reads; far glyphs cull like the MEP ones.
  if (shellGeo) {
    for (const sl of shellGeo.sublines) for (let i = 0; i < sl.pts.length - 1; i++) { const s = seg(sl.pts[i], sl.pts[i + 1]); if (s) mepSublines.push({ ...s, col: sl.color, dash: sl.dash, w: sl.w ?? 2.2 }); }
    pushGlyphs(shellGeo.glyphs, (k) => k === "insulation" ? 0.45 : k === "wedge" ? 0.22 : 0.9);  // wedge up from 0.12 so the coverage cone reads (Odin)
    // NEIGHBOUR shell pass (Odin) — the across-doorway strip shows the active layer continuously; glyphs only, no quads (overdraw)
    // each neighbour carries its OWN exterior map (its adjacency in the layout) so no neighbour ever draws 4 interior cams; coverage
    // CONES are THIS room only — a wedge is never emitted from the neighbour pass (filtered even if the shell returns one).
    const nbExterior = (cell: RoomCell) => ({ N: !at(cell.row - 1, cell.col), S: !at(cell.row + 1, cell.col), E: !at(cell.row, cell.col + 1), W: !at(cell.row, cell.col - 1) });
    const nbShell = (cell: RoomCell, ox: number, oy: number) => {
      const sg = walkShell(shellId, { gauge, openings: [], kind: cell.k, nbS: false, ox, oy, exterior: nbExterior(cell) });
      for (const sl of sg.sublines) for (let i = 0; i < sl.pts.length - 1; i++) { const s = seg(sl.pts[i], sl.pts[i + 1]); if (s) mepSublines.push({ ...s, col: sl.color, dash: sl.dash, w: (sl.w ?? 2.2) * 0.7 }); }
      pushGlyphs(sg.glyphs.filter((g) => g.kind !== "wedge"), (k) => k === "insulation" ? 0.3 : 0.6);   // no cones from a neighbour
    };
    if (nb.N) nbShell(nb.N, 0, ROOM_FT); if (nb.S) nbShell(nb.S, 0, -ROOM_FT); if (nb.E) nbShell(nb.E, ROOM_FT, 0); if (nb.W) nbShell(nb.W, -ROOM_FT, 0);
  }
  const shellOn = !!shellGeo && (shellGeo.sublines.length > 0 || shellGeo.glyphs.length > 0 || shellGeo.quads.length > 0);

  // floor grid lines (1-ft)
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i <= ROOM_FT; i++) {
    const s1 = seg([i, 0, 0], [i, ROOM_FT, 0]); if (s1) gridLines.push(s1);        // near-clipped: the lines under your feet stay
    const s2 = seg([0, i, 0], [ROOM_FT, i, 0]); if (s2) gridLines.push(s2);
  }
  // vertical corner edges (emphasised — "see corners")
  const corners: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const [cxp, cyp] of [[0, 0], [ROOM_FT, 0], [0, ROOM_FT], [ROOM_FT, ROOM_FT]] as [number, number][]) {
    const s = seg([cxp, cyp, 0], [cxp, cyp, CEIL_FT]); if (s) corners.push(s);
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

  // ── MEASUREMENTS (§6) — the FACING wall only (from yaw): its width (ROOM_FT), the ceiling height (CEIL_FT), the doorway on it
  //    (the PLACED door's OWN footprint + height — never DOOR_W, which would print a non-existent 3'-2"), the outlet AFF in the
  //    Electrical layer and the duct centreline in HVAC. ftIn from lib/dim-annot (one feet-inch formatter); ≤6 labels. ──
  const dimLabels: { x: number; y: number; text: string }[] = [];
  const dimLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const fwdX = -Math.sin(yaw), fwdY = Math.cos(yaw);   // the camera forward in world xy (project(): forward = −dx·sin + dy·cos)
  const facing: Side = Math.abs(fwdY) >= Math.abs(fwdX) ? (fwdY > 0 ? "N" : "S") : (fwdX > 0 ? "E" : "W");
  if (dims) {
    const horiz = facing === "N" || facing === "S", fixed = facing === "N" || facing === "E" ? ROOM_FT : 0;
    const wp = (s: number, z: number): V3 => (horiz ? [s, fixed, z] : [fixed, s, z]);   // along-wall s + height → world
    const put = (p: V3, text: string) => { const q = project(p); if (q && dimLabels.length < 6) dimLabels.push({ x: clamp(q.x, 30, W - 30), y: clamp(q.y, 14, H - 8), text }); };
    const line = (a: V3, b: V3) => { const s = seg(a, b); if (s) dimLines.push(s); };
    line(wp(0, CEIL_FT - 0.5), wp(ROOM_FT, CEIL_FT - 0.5)); put(wp(ROOM_FT / 2, CEIL_FT - 0.5), `↔ ${ftIn(ROOM_FT)}`);   // the wall's width
    line(wp(0.5, 0), wp(0.5, CEIL_FT)); put(wp(0.5, CEIL_FT / 2), `↕ ${ftIn(CEIL_FT)}`);                                  // the ceiling height
    if (nb[facing]) {   // the doorway on this wall: the placed door's own size (its long side = the opening), else the opening it was framed with
      const door = roomObjs.find((o) => o.kind === "door" && wallOf(o.gx, o.gy) === facing), fp = door ? footprintOf(door) : null;
      const dw = fp ? Math.max(fp.w, fp.d) : doorOpen.span, dh = door ? heightOf(door) : doorOpen.z1;
      put(wp(clamp(doorCtr[facing], hw, ROOM_FT - hw), dh + 0.9), `${ftIn(dw)} × ${ftIn(dh)}`);
    }
    if (layers.includes("wiring") || socketsOnly) {   // the outlet on the facing wall, at its real AFF (OUTLET_AFF_FT — the box's own z)
      const onWall = (pts: Vec3[]) => pts.every((p) => (facing === "N" ? p[1] > ROOM_FT - 0.1 : facing === "S" ? p[1] < 0.1 : facing === "W" ? p[0] < 0.1 : p[0] > ROOM_FT - 0.1));
      const ob = roomOutlets.find((b) => onWall(b.pts));
      if (ob) put([ob.pts.reduce((a, p) => a + p[0], 0) / 4, ob.pts.reduce((a, p) => a + p[1], 0) / 4, ob.z + 0.6], `${ftIn(OUTLET_AFF_FT)} AFF`);   // box z === OUTLET_AFF_FT (walk-mep)
    }
    if (layers.includes("duct")) put(wp(ROOM_FT / 2, DUCT_Z), `DUCT ${ftIn(DUCT_Z)}`);   // the trunk centreline in the plenum
  }
  const utilityLabel = layout.find((r) => r.k === "S")?.label ?? "Utility";   // the one furnace room — the AHU wayfinding cue points there
  const moveHex = semanticHex("mount"), lookHex = semanticHex("frustum"); // Drone-2525's body / head stick colours

  return (
    <div ref={rootRef} data-arch-walkthrough data-arch-asset-meshes={meshes.size} data-arch-walk-eye={`${eye.x.toFixed(2)},${eye.y.toFixed(2)}`} data-arch-walk-yaw={yaw.toFixed(3)} data-arch-walk-zoom={zoom} data-arch-walk-eye-ht={ez.toFixed(2)} data-arch-walk-dims={dims ? "1" : "0"} data-arch-walk-facing={facing} className="relative select-none overflow-hidden rounded-lg" style={{ height: Hpx, background: `radial-gradient(130% 100% at 50% 18%, #16243a, #0d1420 55%, ${C.bg})`, border: `1px solid ${C.edge}`, touchAction: "none" }}>
      <svg data-arch-walk-svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ display: "block", cursor: "grab" }}>
        {/* when a MEP layer is on, the walls go semi-transparent (Enscape x-ray convention) so the runs read "inside" them */}
        {faces.map((fc, i) => <polygon key={`f${i}`} data-arch-walk-frame-face={fc.color === FRAME_COLOR || fc.color === FRAME_HEADER_COLOR ? "1" : undefined} points={fc.d} fill={fog(shade(fc.color ?? C.wall, FACE_SHADE[fc.kind]), fc.depth)} fillOpacity={structureOn && fc.color === WIN_COL ? 0.3 : wallDim != null && fc.color === C.wall && (fc.kind === "front" || fc.kind === "side") ? wallDim : mepOn && (fc.kind === "front" || fc.kind === "side") ? 0.55 : (ceilXray && fc.kind === "ceil" && fc.color === C.wall) ? 0.4 : (shellId === "foundation" && fc.kind === "floor" && fc.color === C.floor) ? 0.25 : 1} stroke={fc.kind === "front" || fc.kind === "side" ? C.edge : "none"} strokeWidth={fc.kind === "front" || fc.kind === "side" ? 0.6 : 0} />)}
        {/* P0·E — the MEP BODIES (the AHU cabinet): the SECOND solidFaces pass, painted AFTER the walls/furniture so the unit occludes like furniture */}
        {mepFaces.map((fc, i) => <polygon key={`mf${i}`} data-arch-walk-mep-solid="1" points={fc.d} fill={fog(shade(fc.color ?? C.wall, FACE_SHADE[fc.kind]), fc.depth)} stroke="#070b12" strokeWidth={0.6} />)}
        {/* MEP LAYER (E1 / WALK-05) — wires / pipes / ducts + outlet & panel boxes, drawn x-ray between the walls and the grid */}
        {mepLines.map((s, i) => <line key={`m${i}`} data-arch-walk-mep={s.key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.col} strokeWidth={2.2} strokeDasharray="6 4" strokeLinecap="round" opacity={0.95} />)}
        {/* P2 PLUMBING — risers, hot-over-cold, traps, vents, the stack: each sub-run keeps its own dash + width (Release Process #6: the shipped lines above are untouched) */}
        {mepSublines.map((s, i) => <line key={`ms${i}`} data-arch-walk-subline x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.col} strokeWidth={s.w} strokeDasharray={s.dash ?? undefined} strokeLinecap="round" opacity={0.95} />)}
        {mepGlyphs.map((g, i) => <polygon key={`mg${i}`} data-arch-walk-glyph={g.kind} points={g.pts} fill={g.outline ? "none" : g.col} fillOpacity={g.outline ? 1 : g.op ?? 0.9} stroke={g.outline ? g.col : "#070b12"} strokeWidth={g.outline ? 1 : 0.8} />)}
        {mepGlyphLabels.map((l, i) => <text key={`ml${i}`} x={l.x} y={l.y} fill={l.col} fontSize={9} textAnchor="middle" style={{ fontFamily: "ui-monospace, Consolas, monospace", paintOrder: "stroke", stroke: "#070b12", strokeWidth: 2 }}>{l.text}</text>)}
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
        {/* MEASUREMENTS (§6) — the facing wall's real dimensions in gold: 9px mono like the glyph labels, clamped inside the viewport */}
        {dims && (
          <g data-arch-walk-dims>
            {dimLines.map((s, i) => <line key={`dl${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={C.gold} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.8} />)}
            {dimLabels.map((l, i) => <text key={`dt${i}`} data-arch-walk-dim x={l.x} y={l.y} fill={C.gold} fontSize={9} textAnchor="middle" style={{ fontFamily: "ui-monospace, Consolas, monospace", paintOrder: "stroke", stroke: "#070b12", strokeWidth: 2 }}>{l.text}</text>)}
          </g>
        )}
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
      {/* P2/P3 PLUMBING + HVAC legend — the glyph silhouettes (one GLYPH_PATHS source) so the valve/trap/duct marks are named */}
      {mepOn && (chipLayer === "water" || chipLayer === "sewer" || chipLayer === "duct") && (() => {
        const items = chipLayer === "water"
          ? [["valve", "arch.walk.legend.main"], ["stop", "arch.walk.legend.stop"], ["manifold", "arch.walk.legend.manifold"], ["mixer", "arch.walk.legend.mixer"], ["manifold", "arch.walk.legend.wh"]]
          : chipLayer === "sewer"
          ? [["trap", "arch.walk.legend.trap"], ["cleanout", "arch.walk.legend.co"], ["vent", "arch.walk.legend.vtr"]]
          : [["register", "arch.walk.legend.register"], ["vcd", "arch.walk.legend.vcd"], ["return", "arch.walk.legend.return"], ["ahu", "arch.walk.legend.ahu"]];
        const col = chipLayer === "water" ? MEP_COLOR.water : chipLayer === "sewer" ? MEP_COLOR.sewer : MEP_COLOR.duct;
        return (
          <div data-arch-walk-legend className="absolute left-2 top-[72px] flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border px-2 py-0.5 text-[9px] font-medium" style={{ borderColor: `${col}88`, color: col, background: "#0a0f16ee", maxWidth: "calc(100% - 120px)" }}>
            {items.map(([g, k]) => (
              <span key={g} className="flex items-center gap-0.5">
                <svg width={11} height={11} viewBox="0 0 10 10" style={{ flexShrink: 0 }}><path d={GLYPH_PATHS[g]} fill="none" stroke={col} strokeWidth={1} /></svg>{t(k)}
                {/* P0·J wayfinding — the air handler lives ONLY in the furnace room (kind S): elsewhere the legend says where to walk */}
                {g === "ahu" && room?.k !== "S" && <span data-arch-walk-ahu-cue style={{ color: C.gold }}>→ {utilityLabel}</span>}
              </span>
            ))}
          </div>
        );
      })()}
      {/* SECURITY legend (P4/#5) — mirrors the plumbing legend so the cameras + coverage read as what they are (Christo/Odin) */}
      {shellId === "security" && (
        <div data-arch-walk-legend className="absolute left-2 top-[72px] flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border px-2 py-0.5 text-[9px] font-medium" style={{ borderColor: `${SHELL_COLOR.camera}88`, color: SHELL_COLOR.camera, background: "#0a0f16ee", maxWidth: "calc(100% - 120px)" }}>
          <span className="flex items-center gap-0.5"><svg width={11} height={11} viewBox="0 0 10 10" style={{ flexShrink: 0 }}><rect x={1} y={3} width={5} height={4} fill="none" stroke={SHELL_COLOR.camera} strokeWidth={1} /><path d="M6,4 L9,2.5 L9,7.5 L6,6 Z" fill="none" stroke={SHELL_COLOR.camera} strokeWidth={1} /></svg>{t("arch.walk.legend.camera")}</span>
          <span className="flex items-center gap-0.5"><svg width={11} height={11} viewBox="0 0 10 10" style={{ flexShrink: 0 }}><path d="M1,9 L1,4 A5,5 0 0,1 6,9 Z" fill={`${SHELL_COLOR.camera}44`} stroke={SHELL_COLOR.camera} strokeWidth={0.8} /></svg>{t("arch.walk.legend.coverage")}</span>
        </div>
      )}
      {/* INTERNET legend (rewalk2 #8) — dish / Wi-Fi / LAN so the homeowner decodes the low-voltage marks */}
      {shellId === "internet" && (
        <div data-arch-walk-legend className="absolute left-2 top-[72px] flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border px-2 py-0.5 text-[9px] font-medium" style={{ borderColor: `${SHELL_COLOR.lan}88`, color: SHELL_COLOR.lan, background: "#0a0f16ee", maxWidth: "calc(100% - 120px)" }}>
          {[["dish", "arch.walk.legend.dish"], ["ap", "arch.walk.legend.ap"], ["lan", "arch.walk.legend.lan"]].map(([g, k]) => (
            <span key={g} className="flex items-center gap-0.5">
              <svg width={11} height={11} viewBox="0 0 10 10" style={{ flexShrink: 0 }}><path d={GLYPH_PATHS[g]} fill="none" stroke={SHELL_COLOR.lan} strokeWidth={1} /></svg>{t(k)}
            </span>
          ))}
        </div>
      )}
      {/* FRAMING gauge chip — the SAME string the 2D plan prints (gauge @ 16" o.c.) in the lumber colour */}
      {framingOn && (
        <div data-arch-walk-layer className="absolute left-2 top-10 flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: FRAME_COLOR, color: FRAME_COLOR, background: "#0a0f16ee" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: FRAME_COLOR }} /> {gauge.label} @ {STUD_SPACING_IN}″ o.c.
        </div>
      )}
      {/* SHELL phase chip (P4) — names the layer the foundation/roofing/insulation/security/internet phase is showing */}
      {shellOn && shellGeo?.label && !framingOn && (
        <div data-arch-walk-shell-chip className="absolute left-2 top-10 flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize" style={{ borderColor: phaseById(phase)?.color ?? C.gold, color: phaseById(phase)?.color ?? C.gold, background: "#0a0f16ee" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: phaseById(phase)?.color ?? C.gold }} /> {phaseById(phase)?.label} · {shellGeo.label}
        </div>
      )}
      {/* C1 — OVERHEAD MINIMAP (reads the SAME room layout as TinyFloorplan): the nine rooms, the current room lit, and a
          live eye dot + facing wedge so you always know where you are and which way you face. Collapsible to a tab (E2:
          the walk keeps the majority); top-right, under the turn cue, clear of the chips (left) and the sticks (bottom). */}
      {room && (() => {
        const cols = Math.max(...layout.map((r) => r.col + r.w), TINY_GRID);
        const rows = Math.max(...layout.map((r) => r.row + r.d), TINY_GRID);
        const u = 11;                                   // svg units per 10-ft room cell (compact)
        const w = cols * u, h = rows * u;
        const ex = (room.col + (eye.x / ROOM_FT) * room.w) * u;
        const ey = (room.row + (1 - eye.y / ROOM_FT) * room.d) * u;  // north = top (plan gy 0 = N)
        const fx = -Math.sin(yaw), fy = -Math.cos(yaw);            // camera forward in map coords (−sin,−cos): yaw 0 = north-up, LOOK-right → EAST (Aset/Athena/Thor fix)
        const wa = Math.atan2(fy, fx), spread = 0.5, r0 = u * 1.4;
        const wedge = `${ex},${ey} ${ex + Math.cos(wa - spread) * r0},${ey + Math.sin(wa - spread) * r0} ${ex + Math.cos(wa + spread) * r0},${ey + Math.sin(wa + spread) * r0}`;
        return (
          <div data-arch-walk-map className="absolute right-2 top-9 rounded-lg border p-1" style={{ borderColor: `${C.cyan}66`, background: "#0a0f16ee" }}>
            <button data-arch-walk-map-toggle onClick={toggleMap} className="mb-0.5 flex w-full items-center justify-between gap-2 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
              <span>map</span><span>{mapOpen ? "▾" : "▸"}</span>
            </button>
            {mapOpen && (
              <svg data-arch-walk-map-svg viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={84} height={84 * (h / w)} style={{ display: "block" }}>
                <rect x={0} y={0} width={w} height={h} fill="none" stroke={`${C.cyan}44`} strokeWidth={0.6} />
                {layout.map((r) => {
                  const here = r.id === room.id;
                  return <rect key={r.id} x={r.col * u} y={r.row * u} width={r.w * u} height={r.d * u} fill={here ? `${C.gold}33` : "transparent"} stroke={here ? C.gold : `${C.wall}`} strokeWidth={here ? 1 : 0.5} />;
                })}
                <polygon data-arch-walk-map-wedge points={wedge} fill={`${C.cyan}66`} stroke="none" />
                <circle data-arch-walk-map-eye cx={ex} cy={ey} r={1.8} fill={C.cyan} stroke="#070b12" strokeWidth={0.5} />
              </svg>
            )}
            {/* WAVE 1a CONTROLS — a compact settings strip INSIDE the map panel (the HUD slot budget: no new pinned overlay on the
                picture); hidden with the map. Zoom 1×/2×/3× stepper · measurements toggle · eye-height slider with a ft-in readout. */}
            {mapOpen && (
              <div data-arch-walk-map-settings className="mt-1 flex flex-col gap-0.5 text-[8px]" style={{ width: 84, color: C.dim }}>
                <div className="flex items-center justify-between gap-1">
                  <button data-arch-walk-zoom-step onClick={stepZoom} className="rounded border px-1 font-semibold tabular-nums" style={{ borderColor: `${C.cyan}66`, color: C.cyan, minWidth: 26 }} aria-label={`zoom ${zoom}×`}>{Number.isInteger(zoom) ? zoom : zoom.toFixed(1)}×</button>
                  <button data-arch-walk-dims-toggle onClick={toggleDims} aria-pressed={dims} className="rounded border px-1 font-semibold" style={{ borderColor: dims ? C.gold : `${C.cyan}66`, color: dims ? C.gold : C.cyan, minWidth: 26 }} aria-label="measurements">⟷ ″</button>
                </div>
                <label className="flex items-center gap-1">
                  <LookGlyph size={10} color={C.cyan} />
                  <input data-arch-walk-eye-height type="range" min={EYE_MIN_FT} max={EYE_MAX_FT} step={0.1} value={ez} onChange={(e) => setEyeHt(parseFloat(e.target.value))} style={{ width: 40, accentColor: C.cyan }} aria-label={`eye height ${ftIn(ez)}`} />
                  <span data-arch-walk-eye-readout className="tabular-nums" style={{ color: C.cyan, whiteSpace: "nowrap" }}>{ftIn(ez)}</span>
                </label>
              </div>
            )}
          </div>
        );
      })()}

      {/* QUAD CONTROLLER (reuses Drone-2525's actual <Stick> + its saved calibration via applySets) — L = MOVE (walk in the
          facing direction, collide-and-slide around furniture), R = LOOK (yaw + pitch). Thumb-reachable at the two bottom
          corners; the step to a neighbour runs through onStep in the loop above (the door-span rule gates it). */}
      <div data-arch-walkpad data-arch-walk-sticks className="pointer-events-none absolute inset-x-0 bottom-2 flex items-end justify-between px-3">
        <div className="pointer-events-auto"><Stick label={t("arch.walk.move")} hex={moveHex} size={84} onMove={(x, y) => { moveVec.current = applySets({ x, y }, "L", sets.current); }} /></div>
        <div className="pointer-events-auto"><Stick label={t("arch.walk.look")} hex={lookHex} size={84} onMove={(x, y) => { lookVec.current = applySets({ x, y }, "R", sets.current); }} /></div>
      </div>
      {/* one SHORT centred caption that stays in the gap between the two thumb-sticks at 375/390 (rewalk2 #7, Sofia) */}
      <div className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 overflow-hidden whitespace-nowrap text-[9px]" style={{ color: C.dim, maxWidth: "calc(100% - 210px)", textOverflow: "ellipsis" }}><LookGlyph size={11} /> {title ?? t("arch.walk.title")}</div>
    </div>
  );
}
