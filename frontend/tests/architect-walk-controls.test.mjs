// ARCHITECT-2525 · WALK CONTROLS gate (Revision A · Wave 1a — MoT ruling 2026-11-07: P0·J "where's the unit", P0·E additive
// solids + the second-pass law, §2 zoom 1–3×, §3 eye height, §6 measurements + near-plane segment clipping). Source-scan
// (like architect-immersion) + runtime on the pure libs (walkMep solids · clipNear · ftIn). INVARIANTS:
//  · zoom is clamped [1,3] (NO sub-1×: refusal culling deletes the walls you stand beside), multiplies the focal length, and
//    DIVIDES the look gains (drag + stick); ≥2 pointers SUSPEND the look-drag (pinch never spins the view); persisted.
//  · eye height defaults to 5.1 ft, is clamped [1.8, DOOR_H − 0.2] (a door step is always possible), persisted, slider +
//    ft-in readout live INSIDE the map panel; EYE_FT stays the named fallback; collision stays horizontal-only.
//  · measurements are a persisted toggle; labels read ftIn from the one formatter; the door reads the PLACED door's own
//    size, never DOOR_W (which would print a non-existent 3'-2").
//  · a KEEP_VISIBLE glyph (ahu · camera · heater) keeps its LABEL at any depth, hung on a vertical face.
//  · MEP `solids` are ADDITIVE and render through a SECOND solidFaces() pass after the walls (never merged into the first);
//    walkMep returns solids ONLY for S/duct (the AHU cabinet) and [] everywhere else; lines/boxes/sublines/glyphs untouched.
//  · the new controls live inside data-arch-walk-map (no new pinned overlay on the picture); forAll/addMep untouched.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-controls.test.mjs
import fs from "node:fs";
import path from "node:path";
import { walkMep, AHU_W, AHU_D, AHU_H, DUCT_Z, OUTLET_AFF_FT } from "../lib/architect-walk-mep.ts";
import { MEP_COLOR } from "../lib/mep-runs.ts";
import { clipNear } from "../lib/solid-shade.ts";
import { ftIn } from "../lib/dim-annot.ts";
import { OPENING_STD } from "../lib/room-layout.ts";
import { defaultObjectsForRoom } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const walk = read("../components/architect-2525/architect-walkthrough.tsx");
const mep = read("../lib/architect-walk-mep.ts");
const solid = read("../lib/solid-shade.ts");
const pkg = JSON.parse(read("../package.json"));

// ══ §2 ZOOM 1–3× ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
ok(/const ZOOM_MIN = 1, ZOOM_MAX = 3;/.test(walk), "zoom band is [1, 3] — NO sub-1× in this revision (refusal culling deletes the walls beside you)");
ok(/const \[zoom, setZoomState\] = useState\(1\)/.test(walk), "zoom is state, default 1×");
ok(/clamp\(Math\.round\(z \* 100\) \/ 100, ZOOM_MIN, ZOOM_MAX\)/.test(walk), "the setter clamps to [ZOOM_MIN, ZOOM_MAX]");
ok(/setZoomState\(clamp\(z, ZOOM_MIN, ZOOM_MAX\)\)/.test(walk), "a persisted value is re-clamped on load (a stale 0.5× can never come back)");
ok(/const f = zoom \* Math\.min\(\(W \/ 2\) \/ Math\.tan\(HFOV \/ 2\), \(H \/ 2\) \/ Math\.tan\(VFOV \/ 2\)\)/.test(walk), "f = zoom × the no-letterbox focal (zoom multiplies the focal length)");
ok(/const gain = 0\.006 \/ zoomRef\.current;/.test(walk) && /setYaw\(d\.yaw - \(e\.clientX - d\.x\) \* gain\)/.test(walk) && /\(e\.clientY - d\.y\) \* gain/.test(walk), "the drag look gain (0.006) is DIVIDED by zoom for yaw and pitch");
ok(/const zf = zoomRef\.current;/.test(walk) && /lk\.x \* LOOK_YAW \/ zf \* dt/.test(walk) && /lk\.y \* LOOK_PITCH \/ zf \* dt/.test(walk), "the stick look gains (LOOK_YAW / LOOK_PITCH) are DIVIDED by zoom in the loop (via zoomRef — never stale)");
ok(/const pointers = useRef\(new Map<number, \{ x: number; y: number \}>\(\)\)/.test(walk), "the walk tracks its active pointers");
ok(/if \(pointers\.current\.size >= 2\) \{ drag\.current = null; pinch\.current = \{ d0: Math\.max\(1, pinchDist\(\)\), z0: zoomRef\.current \}; return; \}/.test(walk), "≥2 pointers down SUSPENDS the look-drag (drag = null) and starts the pinch from the current zoom");
ok(/if \(pointers\.current\.size >= 2\) \{\s*\/\/ PINCH[\s\S]{0,260}?return;\s*\}\s*const d = drag\.current; if \(!d\) return;/.test(walk), "onMove: with ≥2 pointers the pinch updates zoom and RETURNS before any look math");
ok(/pz\.z0 \* \(pinchDist\(\) \/ pz\.d0\)/.test(walk) && /ZOOM_MIN, ZOOM_MAX\)\);\s*return;/.test(walk), "pinch zoom = zoom-at-start × distance ratio, clamped [1,3]");
ok(/pointers\.current\.delete\(e\.pointerId\)/.test(walk), "pointer-up releases the pointer from the set");
ok(/import \{ clamp \} from "@\/lib\/rcore-gestures"/.test(walk) && !/const clamp = \(v: number, lo: number, hi: number\)/.test(walk), "clamp is REUSED from lib/rcore-gestures (the local copy is gone)");
ok(/const LS_ZOOM = "arch2525\.walkZoom"/.test(walk) && /localStorage\.setItem\(LS_ZOOM/.test(walk) && /localStorage\.getItem\(LS_ZOOM/.test(walk), 'zoom persists under "arch2525.walkZoom" (the map-toggle pattern)');
ok(/data-arch-walk-zoom=\{zoom\}/.test(walk), "the root carries data-arch-walk-zoom={zoom}");
ok(/<button data-arch-walk-zoom-step onClick=\{stepZoom\}/.test(walk) && /\{Number\.isInteger\(zoom\) \? zoom : zoom\.toFixed\(1\)\}×/.test(walk), 'the 1×/2×/3× stepper chip (data-arch-walk-zoom-step) reads "1×"/"2×"/"3×" (a pinched 1.7 reads "1.7×")');
ok(/const stepZoom = \(\) => setZoom\(zoom >= ZOOM_MAX \? ZOOM_MIN : Math\.floor\(zoom\) \+ 1\)/.test(walk), "the stepper cycles 1→2→3→1");

// ══ §3 EYE HEIGHT ══════════════════════════════════════════════════════════════════════════════════════════════════════════
ok(/const EYE_DEFAULT_FT = 5\.1, EYE_MIN_FT = 1\.8, EYE_MAX_FT = DOOR_H - 0\.2;/.test(walk), "eye height: default 5.1 ft (his 5'6\", eyes a little low), clamp band [1.8, DOOR_H − 0.2]");
ok(/EYE_FT = 5\.5/.test(walk) && /const ez = Number\.isFinite\(eyeHt\) \? eyeHt : EYE_FT;/.test(walk), "ez reads the eyeHt state with EYE_FT (5.5) as the named fallback");
ok(/const \[eyeHt, setEyeHtState\] = useState\(EYE_DEFAULT_FT\)/.test(walk), "eyeHt is state, default EYE_DEFAULT_FT");
ok(/clamp\(Number\.isFinite\(v\) \? v : EYE_FT, EYE_MIN_FT, EYE_MAX_FT\)/.test(walk) && /setEyeHtState\(clamp\(e, EYE_MIN_FT, EYE_MAX_FT\)\)/.test(walk), "the setter AND the persisted load clamp into [EYE_MIN_FT, EYE_MAX_FT]");
const DOOR_H = OPENING_STD.DOOR_H_FT;
ok(/const DOOR_H = OPENING_STD\.DOOR_H_FT;/.test(walk), "the walkthrough's DOOR_H is bound to OPENING_STD (one opening source) — the clamp band follows the standard");
ok(DOOR_H - 0.2 > 5.1 && 5.1 > 1.8, `the default 5.1 ft sits inside the band [1.8, ${(DOOR_H - 0.2).toFixed(2)}] — a door step is always possible`);
ok(/LS_EYE = "arch2525\.walkEyeHt"/.test(walk) && /localStorage\.setItem\(LS_EYE/.test(walk), 'eye height persists under "arch2525.walkEyeHt"');
ok(/<input data-arch-walk-eye-height type="range" min=\{EYE_MIN_FT\} max=\{EYE_MAX_FT\} step=\{0\.1\} value=\{ez\}/.test(walk), "the eye-height slider (data-arch-walk-eye-height) spans exactly the clamp band");
ok(/data-arch-walk-eye-readout[^>]*>\{ftIn\(ez\)\}/.test(walk), "the slider readout is ft-in via ftIn (5'-1\")");
ok(/data-arch-walk-eye-ht=\{ez\.toFixed\(2\)\}/.test(walk), "the root carries data-arch-walk-eye-ht (feet)");
ok(/const m = walkMove\(from, \{ x: want\.x - from\.x, y: want\.y - from\.y \}, furnRects\.current\)/.test(walk), "collision is untouched (walkMove on x/y only — horizontal-only, the eye height never enters it)");
ok(ftIn(5.1) === "5'-1\"" && ftIn(DOOR_H - 0.2) === "6'-6\"", `ftIn renders the band ends (5'-1\" · ${ftIn(DOOR_H - 0.2)})`);

// ══ §6 MEASUREMENTS + near-plane segment clipping ══════════════════════════════════════════════════════════════════════════
ok(/const \[dims, setDimsState\] = useState\(false\)/.test(walk) && /LS_DIMS = "arch2525\.walkDims"/.test(walk), 'measurements are a persisted toggle ("arch2525.walkDims"), off by default');
ok(/<button data-arch-walk-dims-toggle onClick=\{toggleDims\} aria-pressed=\{dims\}/.test(walk), "the dims chip (data-arch-walk-dims-toggle) lives in the map panel");
ok(/data-arch-walk-dims=\{dims \? "1" : "0"\}/.test(walk) && /<g data-arch-walk-dims>/.test(walk), "root hook data-arch-walk-dims=1|0 + the overlay layer <g data-arch-walk-dims>");
ok(/import \{ ftIn \} from "@\/lib\/dim-annot"/.test(walk), "ftIn is imported from lib/dim-annot (the ONE feet-inch formatter)");
ok(/const facing: Side = Math\.abs\(fwdY\) >= Math\.abs\(fwdX\) \? \(fwdY > 0 \? "N" : "S"\) : \(fwdX > 0 \? "E" : "W"\)/.test(walk), "the FACING wall is derived from yaw (camera forward −sin/cos)");
ok(/`↔ \$\{ftIn\(ROOM_FT\)\}`/.test(walk) && /`↕ \$\{ftIn\(CEIL_FT\)\}`/.test(walk), "wall width (ROOM_FT) + ceiling height (CEIL_FT) labels read the real constants through ftIn");
ok(/const dw = fp \? Math\.max\(fp\.w, fp\.d\) : doorOpen\.span, dh = door \? heightOf\(door\) : doorOpen\.z1/.test(walk) && !/ftIn\(DOOR_W\)/.test(walk), "the door label reads the PLACED door's own footprint + height (never ftIn(DOOR_W) = a non-existent 3'-2\")");
ok(/`\$\{ftIn\(OUTLET_AFF_FT\)\} AFF`/.test(walk) && /`DUCT \$\{ftIn\(DUCT_Z\)\}`/.test(walk), "Electrical labels the outlet AFF (OUTLET_AFF_FT) and HVAC the duct centreline (DUCT_Z)");
ok(/import \{ walkMep, GLYPH_PATHS, DUCT_Z, OUTLET_AFF_FT, type MepLayer \} from "@\/lib\/architect-walk-mep"/.test(walk) && /export \{ OUTLET_AFF_FT \};/.test(mep), "DUCT_Z + OUTLET_AFF_FT come through the walk-mep exports");
ok(/dimLabels\.length < 6/.test(walk), "at most 6 measurement labels");
ok(/data-arch-walk-dim x=\{l\.x\} y=\{l\.y\} fill=\{C\.gold\} fontSize=\{9\}/.test(walk), "dimension text is 9px mono gold, like the glyph labels");
ok(/clamp\(q\.x, 30, W - 30\), y: clamp\(q\.y, 14, H - 8\)/.test(walk), "labels are clamped inside the viewport");
// near-plane SEGMENT clipping: one pure helper, used by EVERY line pass (no `if (a && b)` project-pair drop remains)
ok(/export function clipNear\(a: Vec3, b: Vec3, da: number, db: number, near: number, eps = 0\.02\): \[Vec3, Vec3\] \| null/.test(solid), "lib/solid-shade exports the pure clipNear(a, b, da, db, near)");
ok(/import \{ shade, FACE_SHADE, solidFaces, boxFaces, clipNear, type Vec3, type Quad \} from "@\/lib\/solid-shade"/.test(walk), "the walk imports clipNear");
ok(/const seg = \(a: V3, b: V3\)[\s\S]{0,200}?clipNear\(a, b, camDepth\(a\), camDepth\(b\), near\)/.test(walk), "seg() clips a world segment to the near plane before projecting");
ok(!/const a = project\(ln\[i\]\), b = project\(ln\[i \+ 1\]\)/.test(walk) && !/const a = project\(sl\.pts\[i\]\), b = project\(sl\.pts\[i \+ 1\]\)/.test(walk) && !/const a = project\(\[i, 0, 0\]\)/.test(walk), "no line pass drops a segment on a single behind-the-eye end any more (the project-pair pattern is gone)");
ok((walk.match(/\bseg\(/g) || []).length >= 10, `every line pass (wires · sublines · shell · neighbour shell · glyph lines · frame · grid · corners · dims) goes through seg() (${(walk.match(/\bseg\(/g) || []).length} uses)`);
// runtime: clipNear math (depth affine → the clipped end lands exactly on near + eps; the in-front end is kept)
{
  const near = 0.4, eps = 0.02;
  const a = [1, 2, 3], b = [5, 6, 7];
  ok(clipNear(a, b, 1, 2, near) === null ? false : JSON.stringify(clipNear(a, b, 1, 2, near)) === JSON.stringify([a, b]), "both ends in front → the segment is returned unchanged");
  ok(clipNear(a, b, -1, 0.1, near) === null, "both ends behind the near plane → null (nothing to draw)");
  const c1 = clipNear(a, b, 2, -2, near);                 // a in front (depth 2), b behind (depth −2): depth(t) = 2 − 4t
  const t1 = (near + eps - 2) / (-2 - 2);
  ok(c1 && c1[0] === a && Math.abs(c1[1][0] - (a[0] + (b[0] - a[0]) * t1)) < 1e-12 && Math.abs(c1[1][2] - (a[2] + (b[2] - a[2]) * t1)) < 1e-12, "a in · b behind → a kept, b moved onto the near plane (depth = near + eps) by exact linear interpolation");
  const c2 = clipNear(a, b, -2, 2, near);
  ok(c2 && c2[1] === b && Math.abs(c2[0][1] - (a[1] + (b[1] - a[1]) * (near + eps + 2) / 4)) < 1e-12, "a behind · b in → b kept, a moved onto the near plane (symmetric)");
  const dOf = (p, da, db) => da + (db - da) * ((p[0] - a[0]) / (b[0] - a[0]));   // the affine depth along the segment
  ok(c1 && Math.abs(dOf(c1[1], 2, -2) - (near + eps)) < 1e-12, "the clipped end's depth is near + eps, so it passes the projector's depth > near test");
}

// ══ P0·J "where's the unit" — KEEP_VISIBLE labels at any depth, hung on a vertical face; the AHU has a body ═══════════════
ok(/const KEEP_VISIBLE = new Set\(\["camera", "ahu", "heater"\]\)/.test(walk), "KEEP_VISIBLE = camera · ahu · heater");
ok(/if \(gl\.label && \(at\.depth < 6 \|\| KEEP_VISIBLE\.has\(gl\.kind\)\)\)/.test(walk) && !/if \(at\.depth < 6 && gl\.label\)/.test(walk), "the label cull exempts KEEP_VISIBLE glyphs (AHU/WH/camera words read at ANY depth — the old `at.depth < 6 && gl.label` is gone)");
ok(/const labelOnFace = \(gl: \{ at: Vec3; polys: Vec3\[\]\[\] \}, bodies: Quad\[\]\)/.test(walk) && /z0 \+ 0\.5\]\)/.test(walk) && /lp = \(KEEP_VISIBLE\.has\(gl\.kind\) \? labelOnFace\(gl, bodies\) : null\) \?\? at/.test(walk), "a KEEP_VISIBLE label hangs on the facing VERTICAL face (bottom edge midpoint, lifted 0.5 ft), not the top");
ok(/pushGlyphs\(g\.glyphs, \(\) => 0\.9, g\.solids\)/.test(walk), "the MEP glyph pass receives the layer's solid bodies so the AHU word hangs on its cabinet");
ok(/data-arch-walk-ahu-cue/.test(walk) && /g === "ahu" && room\?\.k !== "S"/.test(walk) && /layout\.find\(\(r\) => r\.k === "S"\)\?\.label \?\? "Utility"/.test(walk), 'in a non-S room the HVAC legend\'s air-handler entry carries a wayfinding cue (→ the furnace room\'s name, "Utility" fallback)');
ok(/export const AHU_W = 2, AHU_D = 2, AHU_H = 5;/.test(mep) && /solids\.push\(\.\.\.boxFaces\(ox \+ RF - AHU_W, oy \+ RF - AHU_D, 0, AHU_W, AHU_D, AHU_H, MEP_COLOR\.duct\)\)/.test(mep), "walk-mep emits the AHU CABINET as boxFaces 2×2×5 ft in MEP_COLOR.duct, flush in the NE corner (its top meets the shipped wireframe/glyph top at z 5)");

// ══ P0·E — ADDITIVE solids, a SECOND solidFaces pass after the walls (never merged into the first) ═════════════════════════
ok(/export interface WalkMep \{ lines: Vec3\[\]\[\]; boxes: MepBox\[\]; sublines: MepSubline\[\]; glyphs: MepGlyph\[\]; solids: Quad\[\]; color: string \}/.test(mep), "WalkMep gains `solids: Quad[]` (ADDITIVE — the shipped fields keep their names and order)");
const first = walk.indexOf("solidFaces([...wallQuads, ...furnQuads], project)"), second = walk.indexOf("solidFaces(mepSolids, project)");
ok((walk.match(/solidFaces\((?!\))/g) || []).length === 2 && first > 0 && second > first, "exactly TWO solidFaces(…) calls (comments' `solidFaces()` mentions excluded): the walls+furniture call first, the MEP-solids call after it");
ok(!/solidFaces\(\[\.\.\.wallQuads, \.\.\.furnQuads, \.\.\.mepSolids/.test(walk) && !/wallQuads\.push\(\.\.\.g\.solids\)/.test(walk), "MEP solids are NEVER merged into the walls' call (the painter's centroid sort would hide a wall-hugging body)");
const facesAt = walk.indexOf("{faces.map((fc, i) =>"), mepFacesAt = walk.indexOf("{mepFaces.map((fc, i) =>");
ok(facesAt > 0 && mepFacesAt > facesAt && /data-arch-walk-mep-solid="1"/.test(walk) && /mepFaces\.map\(\(fc, i\) => <polygon[^>]*fill=\{fog\(shade\(fc\.color \?\? C\.wall, FACE_SHADE\[fc\.kind\]\), fc\.depth\)\}/.test(walk), "the MEP faces paint AFTER the wall/furniture faces with the same fog + FACE_SHADE (data-arch-walk-mep-solid)");
ok(/mepSolids\.push\(\.\.\.g\.solids\)/.test(walk), "addMep collects the layer's solids into the second pass");
// the one addMep call site at (0,0) inside forAll is untouched
ok(/const forAll = \(L: MepLayer, boxesOnly = false\) => \{\s*addMep\(L, outletCount0, roomObjs, 0, 0, boxesOnly, room\?\.k\);\s*\};/.test(walk) && (walk.match(/\baddMep\(/g) || []).length === 1, "forAll still makes the ONE addMep( call at origin 0,0 (the definition is `const addMep = (`; exactly one call site)");
// runtime: solids for S/duct only; everything else []; the pinned fields never gained/lost entries
const dS = walkMep("duct", 0, [], 0, 0, "S");
ok(dS.solids.length === 6 && dS.solids.every((q) => q.color === MEP_COLOR.duct), `S/duct returns the 6 cabinet faces in MEP_COLOR.duct (got ${dS.solids.length})`);
const xs = dS.solids.flatMap((q) => q.pts.map((p) => p[0])), ys = dS.solids.flatMap((q) => q.pts.map((p) => p[1])), zs = dS.solids.flatMap((q) => q.pts.map((p) => p[2]));
ok(Math.min(...xs) === 10 - AHU_W && Math.max(...xs) === 10 && Math.min(...ys) === 10 - AHU_D && Math.max(...ys) === 10 && Math.min(...zs) === 0 && Math.max(...zs) === AHU_H, "the cabinet is 2×2×5 ft, inside the room, flush with the NE corner (x 8–10 · y 8–10 · z 0–5)");
ok(dS.solids.every((q) => ["top", "floor", "front", "side"].includes(q.kind)), "the cabinet faces are boxFaces-tagged quads (top/floor/front/side)");
const ahu = dS.glyphs.find((g) => g.kind === "ahu");
ok(ahu && ahu.at[0] > 10 - AHU_W && ahu.at[0] < 10 && ahu.at[1] > 10 - AHU_D && ahu.at[1] < 10 && ahu.at[2] === AHU_H, "the AHU glyph sits ON its cabinet top (at.z === AHU_H — no floating square); the label hangs on the cabinet's facing side");
const dSN = walkMep("duct", 0, [], 0, 10, "S");
ok(Math.min(...dSN.solids.flatMap((q) => q.pts.map((p) => p[1]))) === 18, "a room-origin offset moves the cabinet with the room (oy = 10 → y 18–20)");
let leak = [];
for (const L of ["wiring", "water", "sewer", "duct"]) for (const k of ["M", "B", "C", "L", "K", "O", "D", "S", "E"]) {
  if (L === "duct" && k === "S") continue;
  for (const objs of [[], defaultObjectsForRoom(k)]) { const g = walkMep(L, 4, objs, 0, 0, k); if (!Array.isArray(g.solids) || g.solids.length !== 0) leak.push(`${L}/${k}`); }
}
ok(leak.length === 0, `every other layer/room returns solids: [] (leaks: ${leak.join(",") || "none"})`);
ok(DUCT_Z === 11 && OUTLET_AFF_FT === 1.5, "the measured heights the overlay prints: DUCT_Z 11 ft · OUTLET_AFF_FT 1.5 ft");

// ══ P0·A house-level corner cams: THIS room passes its exterior map; each neighbour passes its OWN; no cone from the neighbour pass ══
ok(/walkShell\(shellId, \{ gauge, openings, kind: room\?\.k, nbS: !!nb\.S, ox: 0, oy: 0, exterior: \{ N: !nb\.N, S: !nb\.S, E: !nb\.E, W: !nb\.W \} \}\)/.test(walk), "THIS room's walkShell call passes exterior = {N,S,E,W: no neighbour} from the adjacency");
ok(/const nbExterior = \(cell: RoomCell\) => \(\{ N: !at\(cell\.row - 1, cell\.col\), S: !at\(cell\.row \+ 1, cell\.col\), E: !at\(cell\.row, cell\.col \+ 1\), W: !at\(cell\.row, cell\.col - 1\) \}\)/.test(walk) && /exterior: nbExterior\(cell\) \}\)/.test(walk), "the neighbour pass passes each neighbour's OWN adjacency map (never 4 interior cams)");
ok(/pushGlyphs\(sg\.glyphs\.filter\(\(g\) => g\.kind !== "wedge"\)/.test(walk), "no coverage wedge is ever emitted from the neighbour pass (cones are THIS room only)");
ok(/import \{ STOREY_FT, TINY_GRID, OPENING_STD \} from "@\/lib\/room-layout"/.test(walk) && /const WIN_W = OPENING_STD\.WIN_W_FT, WIN_SILL = OPENING_STD\.WIN_SILL_FT, WIN_HEAD = OPENING_STD\.WIN_HEAD_FT;/.test(walk) && !/\b(DOOR_H|WIN_W|WIN_SILL|WIN_HEAD)\s*=\s*[\d.]+/.test(walk), "DOOR_H / WIN_W / WIN_SILL / WIN_HEAD are bound to OPENING_STD (no local literal)");

// ══ the controls live INSIDE the map panel — no new pinned overlay on the picture (HUD slot budget) ════════════════════════
const mapAt = walk.indexOf("<div data-arch-walk-map "), stripAt = walk.indexOf("{mapOpen && (\n              <div data-arch-walk-map-settings"), mapEnd = walk.indexOf("<div data-arch-walkpad");
ok(mapAt > 0 && stripAt > mapAt && stripAt < mapEnd, "the settings strip (data-arch-walk-map-settings) sits INSIDE data-arch-walk-map and only while the map is open");
for (const h of ["data-arch-walk-zoom-step", "data-arch-walk-dims-toggle", "data-arch-walk-eye-height"]) { const at = walk.indexOf(h); ok(at > stripAt && at < mapEnd, `${h} is inside the map panel's settings strip`); }
ok((walk.match(/className="[^"]*\babsolute\b/g) || []).length === 11, `no new absolutely-positioned overlay on the walk root (11 before, ${(walk.match(/className="[^"]*\babsolute\b/g) || []).length} now)`);
for (const h of ["data-arch-walk-room", "data-arch-walk-turncue", "data-arch-walk-layer", "data-arch-walk-legend", "data-arch-walk-map-toggle", "data-arch-walk-map-svg", "data-arch-walk-sticks", "data-arch-walk-eye=", "data-arch-walk-yaw="]) ok(walk.includes(h), `existing hook ${h} kept`);
ok(/data-arch-walk-room className="absolute left-2 top-2/.test(walk) && /data-arch-walk-turncue className="pointer-events-none absolute right-2 top-2/.test(walk) && /data-arch-walk-map className="absolute right-2 top-9/.test(walk), "the existing chip positions are untouched (room top-left · turn cue top-right · map right-2 top-9)");

// ══ wired into CI beside the walk gates ═══════════════════════════════════════════════════════════════════════════════════
ok(/tests\/architect-walk-controls\.test\.mjs/.test(pkg.scripts["test:architect-walk-controls"] ?? ""), "package.json registers test:architect-walk-controls");
ok(/npm run test:architect-walk-mep-callsite && npm run test:architect-walk-controls/.test(pkg.scripts["test:ci"]), "test:ci runs the walk-controls gate beside the walk gates");

console.log(`\nARCHITECT-WALK-CONTROLS ${pass}/${pass + fail} passed · zoom 1–3× (f×zoom · look÷zoom · pinch suspends drag) · eye 5.1 ft [1.8, DOOR_H−0.2] · dims via ftIn · near-plane clipNear · AHU label at any depth on a face · additive solids in a SECOND solidFaces pass`);
if (fail > 0) process.exit(1);
