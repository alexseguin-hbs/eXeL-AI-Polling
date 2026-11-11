// OBJ-2 — THE NEAR-PLANE POLYGON CLIP GATE (operator LIVE 2026-11-11, Architect-2525 walk: "should not disappear").
// solidFaces() used to DROP a whole face when any corner projected behind the near plane (cull by refusal), so a wall /
// furniture box / GLB-mesh face vanished the instant you walked up to it. clipPolyNear() trims the face to the near plane
// (Sutherland–Hodgman) instead — the polygon sibling of the line pass's clipNear(). This gate locks: a straddling face is
// TRIMMED not dropped, a fully-behind face is dropped, a fully-front face is untouched, and the legacy (no-camDepth) path
// is unchanged. Run: node --experimental-strip-types tests/solid-shade-near-clip.test.mjs
import { clipPolyNear, solidFaces, clipNear } from "../lib/solid-shade.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = 0.4;
// a camera looking +y: forward depth = y; project refuses anything at/behind the near plane (depth <= near), exactly like
// the walk's project(). screen x = world x, screen y = world z.
const camDepth = (p) => p[1];
const project = (p) => (p[1] > near ? { x: p[0], y: p[2], depth: p[1] } : null);

// a vertical quad in the x–z plane at a given y (depth), 2 ft wide/tall
const quadAtY = (y) => [[0, y, 0], [2, y, 0], [2, y, 2], [0, y, 2]];
// a quad that STRADDLES the eye: its near edge is behind (y = -1), its far edge in front (y = 3)
const straddle = [[0, -1, 0], [2, -1, 0], [2, 3, 2], [0, 3, 2]];

// ── 1. clipPolyNear: fully in front → unchanged ──
const front = clipPolyNear(quadAtY(3), camDepth, near);
ok(front.length === 4, `a face fully in front keeps its 4 verts (got ${front.length})`);

// ── 2. clipPolyNear: fully behind → empty ──
ok(clipPolyNear(quadAtY(-2), camDepth, near).length === 0, "a face fully behind the eye clips to nothing");

// ── 3. clipPolyNear: straddling → trimmed, every surviving vert in front of near ──
const clipped = clipPolyNear(straddle, camDepth, near);
ok(clipped.length >= 3, `a straddling face survives as a polygon (got ${clipped.length} verts)`);
ok(clipped.every((p) => camDepth(p) >= near - 1e-9), "every clipped vert is at or in front of the near plane (so project() never refuses it)");
ok(clipped.every((p) => project(p) !== null), "every clipped vert projects (no refusal after the clip)");

// ── 4. solidFaces WITH camDepth: the straddling face is TRIMMED, not dropped ──
const withClip = solidFaces([{ kind: "front", color: "#19c8cf", pts: straddle }], project, camDepth, near);
ok(withClip.length === 1, `solidFaces(camDepth) keeps the straddling face (drew ${withClip.length}, want 1) — the disappear bug is fixed`);

// ── 5. solidFaces WITHOUT camDepth: legacy cull-by-refusal unchanged (the straddling face is dropped) ──
const legacy = solidFaces([{ kind: "front", color: "#19c8cf", pts: straddle }], project);
ok(legacy.length === 0, "legacy path (no camDepth) still culls a face with a behind-eye vertex — backward compatible");

// ── 6. solidFaces WITH camDepth: a fully-front face still draws; a fully-behind face does not ──
ok(solidFaces([{ kind: "top", color: "#fff", pts: quadAtY(5) }], project, camDepth, near).length === 1, "a fully-front face draws");
ok(solidFaces([{ kind: "top", color: "#fff", pts: quadAtY(-5) }], project, camDepth, near).length === 0, "a fully-behind face is dropped");

// ── 7. consistency with the segment sibling: a crossing segment clips to the same near plane ──
const seg = clipNear([0, -1, 0], [0, 3, 0], camDepth([0, -1, 0]), camDepth([0, 3, 0]), near);
ok(seg !== null && seg[0][1] >= near - 1e-9, "clipNear (the line sibling) clips to the same near plane — one convention");

console.log(`\nSOLID-SHADE-NEAR-CLIP ${pass}/${pass + fail} passed · walk faces are trimmed to the near plane, never dropped (objects don't disappear)`);
process.exit(fail ? 1 : 0);
