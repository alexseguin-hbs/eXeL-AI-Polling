// ARCHITECT-2525 · WALK FRAMING — "where are my 2×4" (operator 2026-11-06). The pure stud layout of a room for the
// first-person walk: studs @16" o.c., bottom plate, double top plate, king/jack/header/cripple/rough-sill at each
// opening, and a mid-height blocking row — as boxFaces so they enter the ONE solidFaces([...wallQuads, ...furnQuads,
// ...frameQuads], project) call and occlude like furniture. REUSE: studOffsetsFt + STUD_GAUGES + FRAME_COLOR
// (architect-phase-palette, the SAME layout the 2D plan uses) and the 10-ft cube ceiling (room-layout STOREY_FT).
// Pure (no React/DOM) so the walk AND tests/architect-walk-framing.test.mjs read the SAME geometry.
import { boxFaces, type Quad, type Vec3 } from "./solid-shade";
import { studOffsetsFt, FRAME_COLOR, FRAME_HEADER_COLOR, type StudGauge } from "./architect-phase-palette";
import { STOREY_FT, ROOM_FT } from "./room-layout";

const RF = ROOM_FT;                 // 10 — inner clear room edge
const CEIL = STOREY_FT;             // 10 — inner clear ceiling (one source)
const PUSH = 0.03;                  // push members into the room so they never z-fight the wall plane
const T = 0.125;                    // 1.5" stud/plate thickness (along the wall · plate height)
const PLATE = 0.125;                // plate height
const TOP_B = CEIL - 0.25;          // double-top-plate underside (9.75) — common studs stop here
const HDR_DOOR = 6.875;            // door header underside (6'-8" door + rough-opening head)
const WIN_SILL = 3.0, WIN_HEAD = 6.5, HDR_WIN_TOP = 7.27;  // window: rough sill 3 ft, head 6.5 ft, header class top 7.27

export type Side = "N" | "S" | "W" | "E";
export interface WalkOpening { side: Side; center: number; span: number; z0: number; z1: number }  // z0=0 door · z0>0 window (world along-wall centre)
export interface WalkFraming { quads: Quad[]; lines: Vec3[][]; counts: { studs: number; kings: number; jacks: number; headers: number; cripples: number; blocking: number } }

/**
 * The framing of one room. `openings` are the SAME {side,center,span,z0,z1} the walk feeds vwall() (doorOpen at the
 * door centre, winOpen on an exterior wall). Members are placed in WALK WORLD at each wall plane; neighbours (ox||oy ≠ 0)
 * get `lines` only (one per stud + plate lines) and no blocking — the overdraw mitigation.
 */
export function walkFraming(gauge: StudGauge, openings: WalkOpening[], ox = 0, oy = 0): WalkFraming {
  const d = gauge.depthIn / 12;      // stud depth into the room (2×4 0.292 · 2×6 0.458)
  const thisRoom = ox === 0 && oy === 0;
  const quads: Quad[] = []; const lines: Vec3[][] = [];
  const counts = { studs: 0, kings: 0, jacks: 0, headers: 0, cripples: 0, blocking: 0 };
  const offs = studOffsetsFt(RF);

  // a member: along the wall [s0,s1] (world x for N/S · world y for W/E), depth d into the room, z [z0,z1].
  const member = (side: Side, s0: number, s1: number, z0: number, z1: number, color: string) => {
    const w = s1 - s0, h = z1 - z0; if (w <= 1e-6 || h <= 1e-6) return;
    if (side === "N") quads.push(...boxFaces(ox + s0, oy + RF - d - PUSH, z0, w, d, h, color));
    else if (side === "S") quads.push(...boxFaces(ox + s0, oy + PUSH, z0, w, d, h, color));
    else if (side === "W") quads.push(...boxFaces(ox + PUSH, oy + s0, z0, d, w, h, color));
    else quads.push(...boxFaces(ox + RF - d - PUSH, oy + s0, z0, d, w, h, color));
  };
  // a neighbour line: a single vertical stroke at along s, z [z0,z1] on the wall plane (lines-only backdrop).
  const line = (side: Side, s: number, z0: number, z1: number) => {
    const fy = RF - d / 2, ny = d / 2;
    if (side === "N") lines.push([[ox + s, oy + fy, z0], [ox + s, oy + fy, z1]]);
    else if (side === "S") lines.push([[ox + s, oy + ny, z0], [ox + s, oy + ny, z1]]);
    else if (side === "W") lines.push([[ox + ny, oy + s, z0], [ox + ny, oy + s, z1]]);
    else lines.push([[ox + RF - ny, oy + s, z0], [ox + RF - ny, oy + s, z1]]);
  };

  for (const side of ["N", "S", "W", "E"] as Side[]) {
    const op = openings.find((o) => o.side === side);
    const gL = op ? op.center - (op.z0 === 0 ? 1.6 : 1.8) : 0, gR = op ? op.center + (op.z0 === 0 ? 1.6 : 1.8) : 0;
    const inOpening = (s: number) => !!op && s > gL - 0.25 && s < gR + 0.25;

    if (!thisRoom) {   // neighbour backdrop — lines only, no quads, no blocking (overdraw mitigation)
      for (const s of offs) if (!inOpening(s)) line(side, s, PLATE, TOP_B);
      line(side, 0, PLATE, PLATE); line(side, RF, TOP_B, TOP_B);
      continue;
    }

    // common studs
    for (const s of offs) { if (inOpening(s)) continue; member(side, s - T / 2, s + T / 2, PLATE, TOP_B, FRAME_COLOR); counts.studs++; }
    // bottom plate (split across a door that reaches the floor)
    if (op && op.z0 === 0) { member(side, 0, gL, 0, PLATE, FRAME_COLOR); member(side, gR, RF, 0, PLATE, FRAME_COLOR); }
    else member(side, 0, RF, 0, PLATE, FRAME_COLOR);
    // double top plate (full length, lower + upper)
    member(side, 0, RF, TOP_B, TOP_B + 0.125, FRAME_COLOR);
    member(side, 0, RF, TOP_B + 0.125, CEIL, FRAME_COLOR);

    if (op) {
      // kings (full height, outboard of the jacks) + jacks (to the header) at both jambs
      member(side, gL - 0.25, gL - 0.125, PLATE, TOP_B, FRAME_COLOR); member(side, gR + 0.125, gR + 0.25, PLATE, TOP_B, FRAME_COLOR); counts.kings += 2;
      const jackTop = op.z0 === 0 ? HDR_DOOR : WIN_HEAD;
      member(side, gL - 0.125, gL, PLATE, jackTop, FRAME_COLOR); member(side, gR, gR + 0.125, PLATE, jackTop, FRAME_COLOR); counts.jacks += 2;
      // header
      const hdrBot = jackTop, hdrTop = op.z0 === 0 ? TOP_B : HDR_WIN_TOP;
      member(side, gL - 0.125, gR + 0.125, hdrBot, hdrTop, FRAME_HEADER_COLOR); counts.headers++;
      // cripples above the header (window) / rough sill + cripples below (window)
      for (const s of offs) {
        if (s <= gL || s >= gR) continue;
        if (op.z0 === 0) continue;                                  // a door needs no cripples (opening to floor)
        member(side, s - T / 2, s + T / 2, HDR_WIN_TOP, TOP_B, FRAME_COLOR); counts.cripples++;   // above the header
        member(side, s - T / 2, s + T / 2, PLATE, WIN_SILL - 0.125, FRAME_COLOR); counts.cripples++; // sill cripple below
      }
      if (op.z0 > 0) member(side, gL, gR, WIN_SILL - 0.125, WIN_SILL, FRAME_COLOR);   // rough sill (window)
    }

    // blocking — one mid-height row per bay (nailing/backing, not fireblock), this room only
    for (let i = 0; i < offs.length - 1; i++) {
      const a = offs[i], b = offs[i + 1]; if (inOpening((a + b) / 2)) continue;
      const z = i % 2 ? 4.125 : 4.0;
      member(side, a + 0.0625, b - 0.0625, z, z + 0.125, FRAME_COLOR); counts.blocking++;
    }
  }
  return { quads, lines, counts };
}
